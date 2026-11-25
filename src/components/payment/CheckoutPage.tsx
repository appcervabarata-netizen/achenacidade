import React, { useCallback, useEffect, useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { BillingCycle, PaymentTransaction } from '../../types';
import { BillingCycleSelector } from '../common/BillingCycleSelector';
import {
  BILLING_CYCLE_META,
  calculatePlanPricing,
  formatBRL,
  formatCpfCnpj,
  isLifetimePlan,
  isPaidPlan,
} from '../../utils/planPricing';
import {
  checkMercadoPagoPaymentViaApi,
  createMercadoPagoCardPaymentViaApi,
  createMercadoPagoPixViaApi,
  type MercadoPagoPixCreationResult,
} from '../../utils/apiSync';
import { tokenizeCardWithMercadoPago } from '../../utils/mercadoPagoClient';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Store,
  AlertCircle,
  Send,
  Zap,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    plans,
    businesses,
    currentBusinessAuth,
    checkoutTarget,
    mercadoPagoConfig,
    planDiscountConfig,
    processPlanPayment,
    sendTemplatedEmail,
    authSession,
    setCurrentView,
  } = useDirectory();

  const targetBusiness =
    businesses.find((b) => b.id === checkoutTarget?.businessId) ||
    currentBusinessAuth ||
    businesses.find((b) => b.paymentStatus === 'pending_payment');

  const targetPlanId =
    checkoutTarget?.planId || targetBusiness?.pendingPlanId || targetBusiness?.planId;
  const selectedPlan =
    plans.find((p) => p.id === targetPlanId) ||
    plans.find((p) => isPaidPlan(p)) ||
    plans[0];
  const isLifetime = isLifetimePlan(selectedPlan);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    checkoutTarget?.billingCycle || targetBusiness?.pendingBillingCycle || 'monthly'
  );
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTx, setCompletedTx] = useState<PaymentTransaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailResentMsg, setEmailResentMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const [pixSession, setPixSession] = useState<MercadoPagoPixCreationResult | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixStatusNotice, setPixStatusNotice] = useState<string | null>(null);

  const [cardForm, setCardForm] = useState({
    number: '',
    holderName: '',
    expiry: '',
    cvv: '',
    installments: 1,
    cpfCnpj: '',
    payerEmail: '',
  });

  useEffect(() => {
    const incomingCycle = checkoutTarget?.billingCycle || targetBusiness?.pendingBillingCycle;
    if (incomingCycle) {
      setBillingCycle(incomingCycle);
    }
  }, [checkoutTarget?.billingCycle, targetBusiness?.id, targetBusiness?.pendingBillingCycle]);

  useEffect(() => {
    if (targetBusiness) {
      setCardForm((prev) => ({
        ...prev,
        holderName: prev.holderName || targetBusiness.name,
        payerEmail:
          prev.payerEmail ||
          targetBusiness.ownerEmail ||
          targetBusiness.email ||
          'lojista@achenacidade.com.br',
      }));
    }
  }, [targetBusiness?.id]);

  useEffect(() => {
    if (completedTx || timeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [completedTx, timeLeft]);

  if (!targetBusiness || !selectedPlan) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Store className="w-12 h-12 text-blue-600 mb-3" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">
          Nenhuma cobrança pendente encontrada
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
          Selecione um plano ou realize o cadastro da sua empresa para gerar um pagamento.
        </p>
        <button
          onClick={() => setCurrentView('plans')}
          className="mt-5 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold cursor-pointer"
        >
          Ver Planos Disponíveis
        </button>
      </div>
    );
  }

  const pricing = calculatePlanPricing(selectedPlan, billingCycle, planDiscountConfig);
  const validInstallments = pricing.installmentOptions.some(
    (opt) => opt.count === cardForm.installments
  )
    ? cardForm.installments
    : 1;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const pixCode = pixSession?.qrCode || '';
  const effectivePayerEmail =
    cardForm.payerEmail.trim() ||
    targetBusiness.ownerEmail ||
    targetBusiness.email ||
    'lojista@achenacidade.com.br';

  const generatePixCharge = useCallback(async () => {
    if (!targetBusiness || !selectedPlan || completedTx) return;
    setIsGeneratingPix(true);
    setPixError(null);
    setPixStatusNotice(null);
    const res = await createMercadoPagoPixViaApi({
      amount: pricing.totalAmount,
      description: `Plano ${selectedPlan.name} (${pricing.label}) - ${targetBusiness.name}`,
      payerEmail: effectivePayerEmail,
      payerName: targetBusiness.name,
      payerCpfCnpj: cardForm.cpfCnpj,
      externalReference: `BIZ-${targetBusiness.id}-${selectedPlan.id}`,
    });
    setIsGeneratingPix(false);
    if (!res.success) {
      setPixSession(null);
      setPixError(res.error || 'Não foi possível gerar o QR Code PIX no Mercado Pago.');
      return;
    }
    setPixSession(res);
    setTimeLeft(15 * 60);
  }, [
    targetBusiness?.id,
    targetBusiness?.name,
    selectedPlan?.id,
    selectedPlan?.name,
    pricing.totalAmount,
    pricing.label,
    effectivePayerEmail,
    cardForm.cpfCnpj,
    completedTx,
  ]);

  useEffect(() => {
    if (paymentMethod !== 'pix' || completedTx) return;
    void generatePixCharge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, targetBusiness?.id, selectedPlan?.id, billingCycle, completedTx]);

  const finalizeApprovedPix = useCallback(
    async (paymentId: string, paidAt?: string | null) => {
      if (completedTx) return;
      setIsProcessing(true);
      try {
        const res = await processPlanPayment({
          businessId: targetBusiness.id,
          planId: selectedPlan.id,
          billingCycle,
          paymentMethod: 'pix',
          payerEmail: effectivePayerEmail,
          mercadoPagoPayment: {
            paymentId,
            status: 'approved',
            qrCode: pixSession?.qrCodeBase64,
            qrCodeText: pixSession?.qrCode,
            paidAt,
          },
        });
        if (res.success) {
          setCompletedTx(res.transaction);
        } else {
          setErrorMessage(res.error || 'Não foi possível ativar o plano após aprovação.');
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [
      completedTx,
      processPlanPayment,
      targetBusiness.id,
      selectedPlan.id,
      billingCycle,
      effectivePayerEmail,
      pixSession?.qrCodeBase64,
      pixSession?.qrCode,
    ]
  );

  // Auto-poll Mercado Pago payment status every 5 seconds in live mode
  useEffect(() => {
    if (
      paymentMethod !== 'pix' ||
      completedTx ||
      !pixSession?.paymentId ||
      pixSession.mode !== 'mercadopago_api'
    ) {
      return;
    }
    const interval = window.setInterval(async () => {
      const check = await checkMercadoPagoPaymentViaApi(pixSession.paymentId!);
      if (check.success && check.status === 'approved') {
        window.clearInterval(interval);
        await finalizeApprovedPix(pixSession.paymentId!, check.paidAt);
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [paymentMethod, completedTx, pixSession?.paymentId, pixSession?.mode, finalizeApprovedPix]);

  const handleCopyPix = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    window.setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardForm({ ...cardForm, number: formatted });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardForm({ ...cardForm, expiry: val });
  };

  const handleResendPaymentEmail = async () => {
    const recipient = targetBusiness.email || targetBusiness.ownerEmail || cardForm.payerEmail;
    if (!recipient) return;

    const appOrigin = window.location.origin;
    const paymentLink = `${appOrigin}/?checkout=1&businessId=${encodeURIComponent(
      targetBusiness.id
    )}&planId=${encodeURIComponent(selectedPlan.id)}&cycle=${encodeURIComponent(billingCycle)}${
      targetBusiness.paymentToken ? `&token=${encodeURIComponent(targetBusiness.paymentToken)}` : ''
    }`;

    const planLabel = `${selectedPlan.name} (${pricing.label}${
      pricing.discountPercent > 0 ? ` · ${pricing.discountPercent}% OFF` : ''
    })`;

    const res = await sendTemplatedEmail({
      key: 'payment_link',
      to: recipient,
      variables: {
        nome_empresa: targetBusiness.name,
        nome_plano: planLabel,
        valor_plano: formatBRL(pricing.totalAmount),
        link_pagamento: paymentLink,
      },
      actionUrl: paymentLink,
    });

    setEmailResentMsg(
      res.deliveredViaSmtp
        ? `Link de pagamento reenviado via SMTP para ${recipient}.`
        : `Link salvo na Caixa de Saída de testes para ${recipient}.`
    );
    window.setTimeout(() => setEmailResentMsg(null), 5000);
  };

  const handleExecutePayment = async () => {
    setErrorMessage(null);
    setPixStatusNotice(null);

    if (paymentMethod === 'pix') {
      if (!pixSession?.paymentId) {
        setErrorMessage('Gere o QR Code PIX antes de verificar o pagamento.');
        return;
      }
      setIsProcessing(true);
      try {
        const isSandboxSim = pixSession.mode === 'sandbox_simulation';
        const statusRes = await checkMercadoPagoPaymentViaApi(pixSession.paymentId, {
          simulateApprove: isSandboxSim,
        });
        if (!statusRes.success) {
          setErrorMessage(statusRes.error || 'Erro ao verificar pagamento no Mercado Pago.');
          return;
        }
        if (statusRes.status === 'approved') {
          await finalizeApprovedPix(pixSession.paymentId, statusRes.paidAt);
        } else if (statusRes.status === 'rejected' || statusRes.status === 'cancelled') {
          setErrorMessage('Este PIX foi cancelado ou recusado. Gere um novo QR Code PIX.');
        } else {
          setPixStatusNotice(
            'Pagamento ainda consta como pendente no Mercado Pago. Assim que você concluir o PIX no app do seu banco, a confirmação ocorre automaticamente em segundos!'
          );
        }
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const cleanNum = cardForm.number.replace(/\s+/g, '');
    if (cleanNum.length < 15) {
      setErrorMessage('Número do cartão incompleto.');
      return;
    }
    if (!cardForm.holderName.trim()) {
      setErrorMessage('Informe o nome impresso no cartão.');
      return;
    }
    if (cardForm.expiry.length < 5) {
      setErrorMessage('Informe a validade (MM/AA).');
      return;
    }
    if (cardForm.cvv.length < 3) {
      setErrorMessage('Informe o código de segurança (CVV).');
      return;
    }

    setIsProcessing(true);
    try {
      let cardToken: string | undefined;
      let tokenLastFour: string | undefined;
      let tokenMethodId: string | undefined;

      if (mercadoPagoConfig.environment === 'production') {
        const tok = await tokenizeCardWithMercadoPago({
          publicKey: mercadoPagoConfig.publicKey,
          cardNumber: cardForm.number,
          holderName: cardForm.holderName,
          expiry: cardForm.expiry,
          cvv: cardForm.cvv,
          cpfCnpj: cardForm.cpfCnpj,
        });
        if (!tok.success || !tok.token) {
          setErrorMessage(tok.error || 'Falha ao validar cartão no Mercado Pago.');
          setIsProcessing(false);
          return;
        }
        cardToken = tok.token;
        tokenLastFour = tok.lastFourDigits;
        tokenMethodId = tok.paymentMethodId;
      }

      const cardRes = await createMercadoPagoCardPaymentViaApi({
        amount: pricing.totalAmount,
        description: `Plano ${selectedPlan.name} (${pricing.label}) - ${targetBusiness.name}`,
        token: cardToken,
        installments: Number(validInstallments),
        paymentMethodId: tokenMethodId,
        payerEmail: effectivePayerEmail,
        payerName: cardForm.holderName || targetBusiness.name,
        payerCpfCnpj: cardForm.cpfCnpj,
        externalReference: `BIZ-${targetBusiness.id}-${selectedPlan.id}`,
      });

      if (!cardRes.success || !cardRes.paymentId) {
        setErrorMessage(cardRes.error || 'Não foi possível processar o cartão no Mercado Pago.');
        return;
      }

      if (cardRes.status !== 'approved') {
        setErrorMessage(
          `Pagamento em análise ou pendente no Mercado Pago (status: ${cardRes.status || 'in_process'}).`
        );
        return;
      }

      const res = await processPlanPayment({
        businessId: targetBusiness.id,
        planId: selectedPlan.id,
        billingCycle,
        paymentMethod: 'credit_card',
        cardData: {
          number: cardForm.number,
          holderName: cardForm.holderName,
          expiry: cardForm.expiry,
          cvv: cardForm.cvv,
          installments: Number(validInstallments),
        },
        payerEmail: effectivePayerEmail,
        mercadoPagoPayment: {
          paymentId: cardRes.paymentId,
          status: 'approved',
          cardLastFour: tokenLastFour || cleanNum.slice(-4),
          installments: Number(validInstallments),
          paidAt: cardRes.paidAt,
        },
      });

      if (res.success) {
        setCompletedTx(res.transaction);
      } else {
        setErrorMessage(res.error || 'Não foi possível processar o pagamento.');
      }
    } catch {
      setErrorMessage('Falha ao confirmar pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToPortal = () => {
    if (
      authSession.isAuthenticated &&
      authSession.role === 'business' &&
      authSession.businessId === targetBusiness.id
    ) {
      setCurrentView('business_portal');
    } else {
      setCurrentView('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="achenacidade"
            className="w-8 h-8 object-contain rounded-full bg-white"
          />
          <span className="font-extrabold text-slate-900 dark:text-white font-display text-sm sm:text-base">
            achena<span className="text-orange-600">cidade</span>
          </span>
        </div>

        <button
          onClick={handleGoToPortal}
          className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
        >
          Painel da Loja
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {completedTx ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                Assinatura Ativada com Sucesso
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                Pagamento Confirmado e Plano Liberado!
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                O plano <strong>{completedTx.planName}</strong> já está ativo para{' '}
                <strong>{completedTx.businessName}</strong>. Enviamos o comprovante e os dados de
                boas-vindas para <strong>{completedTx.payerEmail}</strong>.
              </p>
            </div>

            <div className="max-w-md mx-auto rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transação</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {completedTx.mercadoPagoPaymentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidade / Ciclo</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {isLifetimePlan(plans.find((p) => p.id === completedTx.planId) || selectedPlan)
                    ? 'Vitalício (Pagamento Único)'
                    : BILLING_CYCLE_META[completedTx.billingCycle || 'monthly'].label}
                </span>
              </div>
              {completedTx.discountPercent && completedTx.discountPercent > 0 ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Desconto Aplicado</span>
                  <span className="font-mono font-bold text-emerald-600 tabular-nums">
                    -{completedTx.discountPercent}% ({formatBRL(completedTx.discountAmount || 0)})
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Pago</span>
                <span className="font-mono font-bold text-emerald-600 tabular-nums">
                  {formatBRL(completedTx.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Forma de Pagamento</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {completedTx.paymentMethod === 'pix'
                    ? 'PIX Instantâneo'
                    : `Cartão (${completedTx.installments || 1}x)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {completedTx.paidAt}
                </span>
              </div>
            </div>

            <button
              onClick={handleGoToPortal}
              className="px-7 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-extrabold shadow-md transition cursor-pointer inline-flex items-center gap-2"
            >
              <span>Acessar Painel da Minha Loja Agora</span>
            </button>
          </div>
        ) : (
          <>
            {/* Email Sent & Pending Status Notice */}
            <div className="p-5 rounded-2xl bg-blue-950 text-white border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-300">
                    Empresa pré-cadastrada · Aguardando Pagamento
                  </p>
                  <h1 className="text-base sm:text-lg font-extrabold font-display">
                    Conclua o pagamento do plano {selectedPlan.name} para {targetBusiness.name}
                  </h1>
                  <p className="text-xs text-blue-100/90 mt-1">
                    Também enviamos o link desta página para{' '}
                    <strong>{targetBusiness.email || cardForm.payerEmail}</strong>. Assim que o
                    pagamento for confirmado, o plano é liberado automaticamente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResendPaymentEmail}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                <Send className="w-3.5 h-3.5 text-orange-300" />
                <span>Reenviar Link por E-mail</span>
              </button>
            </div>

            {emailResentMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{emailResentMsg}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Payment Methods */}
              <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                      Escolha como pagar
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {mercadoPagoConfig.environment === 'production'
                      ? 'Mercado Pago Oficial'
                      : 'Ambiente Seguro'}
                  </span>
                </div>

                {/* Billing Cycle Switcher (hidden for one-time lifetime plans) */}
                {isLifetime ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 block">
                        Plano Vitalício · Pagamento Único
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300">
                        Acesso permanente para 1 loja e até {selectedPlan.productLimit} itens, sem mensalidades futuras.
                      </span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-amber-800 dark:text-amber-200 shrink-0 tabular-nums">
                      {formatBRL(pricing.totalAmount)}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Ciclo de contratação e desconto automático
                      </span>
                      {pricing.discountPercent > 0 && (
                        <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          Economia de {formatBRL(pricing.discountAmount)}
                        </span>
                      )}
                    </div>
                    <BillingCycleSelector
                      value={billingCycle}
                      onChange={(nextCycle) => {
                        setBillingCycle(nextCycle);
                        setCardForm((prev) => ({ ...prev, installments: 1 }));
                      }}
                      globalDiscounts={planDiscountConfig}
                      plan={selectedPlan}
                      compact
                    />
                  </div>
                )}

                {/* Method Switcher */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-2.5 ${
                      paymentMethod === 'pix'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold">PIX Instantâneo</p>
                      <p className="text-[11px] text-slate-500">Total com desconto na hora</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-2.5 ${
                      paymentMethod === 'credit_card'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-orange-600 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold">Cartão de Crédito</p>
                      <p className="text-[11px] text-slate-500">
                        {isLifetime || billingCycle !== 'monthly' ? 'Parcele em até 12x' : 'À vista no cartão'}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Dados do Pagador (para emissão oficial no Mercado Pago) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      E-mail do Pagador (Comprovante MP)
                    </label>
                    <input
                      type="email"
                      value={cardForm.payerEmail}
                      onChange={(e) => setCardForm({ ...cardForm, payerEmail: e.target.value })}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      CPF ou CNPJ do Pagador (Recomendado PIX)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardForm.cpfCnpj}
                      onChange={(e) =>
                        setCardForm({ ...cardForm, cpfCnpj: formatCpfCnpj(e.target.value) })
                      }
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {paymentMethod === 'pix' ? (
                  <div className="space-y-4">
                    {pixError && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-2">
                        <div className="flex items-start gap-2 font-bold">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>{pixError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void generatePixCharge()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Tentar Gerar PIX Novamente</span>
                        </button>
                      </div>
                    )}

                    {pixStatusNotice && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2 font-semibold">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{pixStatusNotice}</span>
                      </div>
                    )}

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-36 h-36 rounded-2xl bg-white p-2 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {isGeneratingPix ? (
                          <div className="flex flex-col items-center gap-1.5 text-slate-500">
                            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                            <span className="text-[10px] font-bold">Gerando PIX...</span>
                          </div>
                        ) : pixSession?.qrCodeBase64 ? (
                          <img
                            src={pixSession.qrCodeBase64}
                            alt="QR Code PIX Mercado Pago"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QrCode className="w-16 h-16 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-2 text-xs flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-orange-600 font-mono tabular-nums">
                            <Clock className="w-4 h-4" />
                            <span>Válido por {formatTimer(timeLeft)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void generatePixCharge()}
                            disabled={isGeneratingPix}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isGeneratingPix ? 'animate-spin' : ''}`} />
                            <span>Gerar Novo PIX</span>
                          </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          Abra o app do seu banco, aponte a câmera para o QR Code ou use{' '}
                          <strong>PIX Copia e Cola</strong> para pagar{' '}
                          <strong className="font-mono tabular-nums">
                            {formatBRL(pricing.totalAmount)}
                          </strong>{' '}
                          ({pricing.label}).
                        </p>
                        {pixSession?.mode === 'mercadopago_api' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            PIX Oficial Mercado Pago (#{pixSession.paymentId}) · Confirmação automática
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={isGeneratingPix ? 'Gerando código PIX Copia e Cola...' : pixCode}
                        placeholder="Código PIX Copia e Cola aparecerá aqui"
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-700 dark:text-slate-300"
                      />
                      <button
                        type="button"
                        disabled={!pixCode || isGeneratingPix}
                        onClick={handleCopyPix}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPix ? 'Copiado' : 'Copiar PIX'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing || isGeneratingPix || !pixSession?.paymentId}
                      onClick={handleExecutePayment}
                      className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-extrabold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isProcessing
                          ? 'Verificando no Mercado Pago...'
                          : pixSession?.mode === 'sandbox_simulation'
                          ? 'Confirmar Pagamento PIX (Modo Teste Sandbox)'
                          : 'Já paguei via PIX · Verificar Pagamento'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        value={cardForm.number}
                        onChange={handleCardNumberChange}
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome Impresso no Cartão
                      </label>
                      <input
                        type="text"
                        value={cardForm.holderName}
                        onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={cardForm.expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/AA"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={cardForm.cvv}
                          onChange={(e) =>
                            setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })
                          }
                          placeholder="123"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Parcelas
                        </label>
                        <select
                          value={validInstallments}
                          onChange={(e) =>
                            setCardForm({ ...cardForm, installments: Number(e.target.value) })
                          }
                          className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold font-mono tabular-nums"
                        >
                          {pricing.installmentOptions.map((opt) => (
                            <option key={opt.count} value={opt.count}>
                              {opt.count}x de {formatBRL(opt.amount)}
                              {opt.count === 1 ? ' (à vista)' : ' sem juros'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleExecutePayment}
                      className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-extrabold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>
                        {isProcessing
                          ? 'Processando Cartão...'
                          : `Pagar ${formatBRL(pricing.totalAmount)} e Ativar Plano`}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Resumo do Cadastro & Plano
                </h2>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Empresa</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">
                      {targetBusiness.name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">E-mail Verificado</span>
                    <span className="font-medium text-emerald-600 text-right">
                      {targetBusiness.email || cardForm.payerEmail}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Plano Escolhido</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {selectedPlan.name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Ciclo de Cobrança</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {pricing.label}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Cota de Anúncios</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      Até {selectedPlan.productLimit} produtos/serviços
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {pricing.discountPercent > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Valor sem desconto ({pricing.months} meses)</span>
                        <span className="font-mono tabular-nums line-through">
                          {formatBRL(pricing.baseTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Desconto do ciclo (-{pricing.discountPercent}%)</span>
                        <span className="font-mono tabular-nums">
                          -{formatBRL(pricing.discountAmount)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                        {isLifetime
                          ? 'Total Único (Vitalício)'
                          : billingCycle === 'monthly'
                          ? 'Total Mensal'
                          : 'Total do Ciclo com Desconto'}
                      </span>
                      {!isLifetime && billingCycle !== 'monthly' && (
                        <span className="text-[11px] font-mono tabular-nums text-slate-500">
                          Equivale a {formatBRL(pricing.effectiveMonthly)}/mês
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                      {formatBRL(pricing.totalAmount)}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                  {selectedPlan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Você pode pagar agora ou posteriormente acessando o link enviado para o seu
                    e-mail.
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
