import QRCode from 'qrcode';

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      createCardToken: (params: {
        cardNumber: string;
        cardholderName: string;
        cardExpirationMonth: string;
        cardExpirationYear: string;
        securityCode: string;
        identificationType?: string;
        identificationNumber?: string;
      }) => Promise<{
        id?: string;
        first_six_digits?: string;
        last_four_digits?: string;
        payment_method_id?: string;
      }>;
    };
  }
}

let mpSdkPromise: Promise<boolean> | null = null;

export function loadMercadoPagoSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.MercadoPago) return Promise.resolve(true);
  if (mpSdkPromise) return mpSdkPromise;

  mpSdkPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-mp-sdk="v2"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.MercadoPago)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.dataset.mpSdk = 'v2';
    script.onload = () => resolve(Boolean(window.MercadoPago));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return mpSdkPromise;
}

export async function tokenizeCardWithMercadoPago(params: {
  publicKey: string;
  cardNumber: string;
  holderName: string;
  expiry: string;
  cvv: string;
  cpfCnpj?: string;
}): Promise<{
  success: boolean;
  token?: string;
  lastFourDigits?: string;
  paymentMethodId?: string;
  error?: string;
}> {
  if (!params.publicKey.trim()) {
    return {
      success: false,
      error: 'Public Key do Mercado Pago não configurada para tokenização do cartão.',
    };
  }

  const loaded = await loadMercadoPagoSdk();
  if (!loaded || !window.MercadoPago) {
    return {
      success: false,
      error: 'Não foi possível carregar o SDK seguro de cartão do Mercado Pago.',
    };
  }

  const parts = params.expiry.split('/');
  const month = (parts[0] || '').trim().padStart(2, '0');
  const rawYear = (parts[1] || '').trim();
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const docDigits = (params.cpfCnpj || '').replace(/\D/g, '');

  try {
    const mp = new window.MercadoPago(params.publicKey.trim(), { locale: 'pt-BR' });
    const tokenRes = await mp.createCardToken({
      cardNumber: params.cardNumber.replace(/\s+/g, ''),
      cardholderName: params.holderName.trim(),
      cardExpirationMonth: month,
      cardExpirationYear: year,
      securityCode: params.cvv.trim(),
      ...(docDigits.length === 11 || docDigits.length === 14
        ? {
            identificationType: docDigits.length === 14 ? 'CNPJ' : 'CPF',
            identificationNumber: docDigits,
          }
        : {}),
    });

    if (!tokenRes?.id) {
      return {
        success: false,
        error: 'O Mercado Pago não conseguiu validar os dados do cartão. Confira número, validade, CVV e CPF/CNPJ.',
      };
    }

    return {
      success: true,
      token: tokenRes.id,
      lastFourDigits: tokenRes.last_four_digits,
      paymentMethodId: tokenRes.payment_method_id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Dados do cartão inválidos para tokenização.';
    return { success: false, error: msg };
  }
}

export async function generatePixQrDataUrl(pixPayload: string): Promise<string> {
  if (!pixPayload) return '';
  return QRCode.toDataURL(pixPayload, { width: 320, margin: 2 });
}
