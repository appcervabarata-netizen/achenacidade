import type { Business, Product, Service } from '../types';
import { formatServicePrice } from './serviceFormatters';

export interface ServiceWorkerPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: {
    url: string;
    itemType: 'product' | 'service' | 'business';
    itemId: string;
    businessId: string;
  };
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window
  );
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getActiveSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) return existing;

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 2000);
    });

    const readyReg = await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
    if (readyReg) return readyReg;

    return await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
  } catch {
    return null;
  }
}

export async function subscribePushManager(
  registration: ServiceWorkerRegistration,
  vapidPublicKey?: string
): Promise<{ subscribed: boolean; endpoint?: string }> {
  if (!('pushManager' in registration)) {
    return { subscribed: false };
  }

  try {
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      return { subscribed: true, endpoint: existingSub.endpoint };
    }

    if (vapidPublicKey && vapidPublicKey.trim().length > 20) {
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey.trim());
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey.buffer as ArrayBuffer,
      });
      return { subscribed: true, endpoint: sub.endpoint };
    }

    return { subscribed: false };
  } catch {
    return { subscribed: false };
  }
}

export async function unsubscribePushManager(registration: ServiceWorkerRegistration | null): Promise<void> {
  if (!registration || !('pushManager' in registration)) return;
  try {
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
    }
  } catch {
    // Ignore errors when unsubscribing in restricted contexts
  }
}

export async function sendNotificationViaServiceWorker(
  payload: ServiceWorkerPushPayload
): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await getActiveSWRegistration();
    if (!registration) return false;

    if (registration.active) {
      registration.active.postMessage({
        type: 'SHOW_PUSH_NOTIFICATION',
        payload,
      });
      return true;
    }

    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-maskable-512x512.png',
      tag: payload.tag || `achenacidade-${Date.now()}`,
      data: payload.data,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Dispara uma notificação push via Service Worker quando uma nova oferta (produto)
 * ou novo serviço é adicionado em uma empresa favoritada pelo usuário.
 */
export async function notifyFavoriteBusinessOffer(params: {
  business: Business;
  favoriteBusinessIds: string[];
  item: { type: 'product'; data: Product } | { type: 'service'; data: Service };
  cityName?: string;
  requireFavorite?: boolean;
}): Promise<{ sentViaSW: boolean; title: string; body: string }> {
  const { business, favoriteBusinessIds, item, cityName = 'Alagoinhas - BA', requireFavorite = true } = params;

  const isFavorite = favoriteBusinessIds.includes(business.id);
  if (requireFavorite && !isFavorite) {
    return { sentViaSW: false, title: '', body: '' };
  }

  let title = '';
  let body = '';

  if (item.type === 'product') {
    const prod = item.data;
    const priceStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price);
    const hasDiscount = Boolean(prod.originalPrice && prod.originalPrice > prod.price);
    const discountPct = hasDiscount && prod.originalPrice
      ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
      : 0;

    title = hasDiscount
      ? `Nova oferta (-${discountPct}%) em ${business.name}`
      : `Novo produto em ${business.name}`;
    body = `${prod.name} por ${priceStr} · ${cityName}`;
  } else {
    const serv = item.data;
    title = `Novo serviço em ${business.name}`;
    body = `${serv.name} (${formatServicePrice(serv)}) · ${cityName}`;
  }

  const sentViaSW = await sendNotificationViaServiceWorker({
    title,
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-maskable-512x512.png',
    image: item.data.imageUrl,
    tag: `achenacidade-${item.type}-${item.data.id}`,
    data: {
      url: `/?open=${item.type}&id=${item.data.id}`,
      itemType: item.type,
      itemId: item.data.id,
      businessId: business.id,
    },
  });

  return { sentViaSW, title, body };
}
