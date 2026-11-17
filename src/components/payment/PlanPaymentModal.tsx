import React, { useState, useEffect } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  X,
  CreditCard,
  QrCode,
  Check,
  Copy,
  Clock,
  ShieldCheck,
  Zap,
  Building2,
  Printer,
  Sparkles,
  Lock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { BillingCycle, PaymentTransaction } from '../../types';
import { BillingCycleSelector } from '../common/BillingCycleSelector';
import {
  BILLING_CYCLE_META,
  buildMercadoPagoPixPayload,
  calculatePlanPricing,
  formatBRL,
} from '../../utils/planPricing';

interface PlanPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  businessId?: string;
  billingCycle?: BillingCycle;
}

export const PlanPaymentModal: React.FC<PlanPaymentModalProps> = ({
  isOpen,
  onClose,
  planId,
  businessId,
  billingCycle: billingCycleProp,
}) => {
  const {
    plans,
    businesses,
    currentBusinessAuth,
    mercadoPagoConfig,
    planDiscountConfig,
    paymentModalData,
    processPlanPayment,
    setCurrentView,
  } = useDirectory();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    billingCycleProp || paymentModalData.billingCycle || 'monthly'
  );
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTx, setCompletedTx] = useState<PaymentTransaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer for PIX (15 minutes)
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Credit card form state
  const [cardForm, setCardForm] = useState({
    number: '',
    holderName: '',
    expiry: '',
    cvv: '',
    installments: 1,
    cpf: '',
    payerEmail: '',
  });

  // Target plan and business
  const selectedPlan = plans.find((p) => p.id === planId) || plans[1] || plans[0];
  const targetBusiness =
    businesses.find((b) => b.id === businessId) ||
    currentBusinessAuth ||
    businesses[0];

  useEffect(() => {
    if (isOpen) {
      setCompletedTx(null);
      setIsProcessing(false);
      setErrorMessage(null);
      setTimeLeft(15 * 60);
      setCopiedPix(false);
      setBillingCycle(billingCycleProp || paymentModalData.billingCycle || 'monthly');
      if (targetBusiness) {
        setCardForm((prev) => ({
          ...prev,
          installments: 1,
          holderName: targetBusiness.name,
          payerEmail: targetBusiness.ownerEmail || targetBusiness.email || 'lojista@achenacidade.com.br',
        }));
      }
    }
  }, [isOpen, targetBusiness, billingCycleProp, paymentModalData.billingCycle]);

  // Timer countdown tick
  useEffect(() => {
    if (!isOpen || completedTx || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, completedTx, timeLeft]);

  if (!isOpen || !selectedPlan) return null;

  const pricing = calculatePlanPricing(selectedPlan, billingCycle, planDiscountConfig);
  const validInstallments = pricing.installmentOptions.some(
    (opt) => opt.count === cardForm.installments
  )
    ? cardForm.installments
    : 1;

  // Format time MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate dynamic Pix Copia e Cola code
  const pixCode = buildMercadoPagoPixPayload({
    pixKey: mercadoPagoConfig.pixKey,
    descriptor: mercadoPagoConfig.statementDescriptor,
    amount: pricing.totalAmount,
    reference: targetBusiness?.id,
  });

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  // Card formatting helpers
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

  const detectCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return { name: 'Visa', color: 'from-blue-600 to-indigo-800' };
    if (clean.startsWith('5')) return { name: 'Mastercard', color: 'from-red-600 to-amber-700' };
    if (clean.startsWith('6')) return { name: 'Elo', color: 'from-yellow-600 to-red-700' };
    if (clean.startsWith('3')) return { name: 'American Express', color: 'from-emerald-700 to-teal-900' };
    return { name: 'Mercado Pago Card', color: 'from-slate-800 to-slate-950' };
  };

  // Execute payment
  const handleExecutePayment = async () => {
    if (!targetBusiness) {
      setErrorMessage('Por favor, selecione ou cadastre uma empresa para vincular este plano.');
      return;
    }

    if (paymentMethod === 'credit_card') {
      const cleanNum = cardForm.number.replace(/\s+/g, '');
      if (cleanNum.length < 15) {
        setErrorMessage('Número de cartão incompleto.');
        return;
      }
      if (!cardForm.holderName.trim()) {
        setErrorMessage('Informe o nome impresso no cartão.');
        return;
      }
      if (cardForm.expiry.length < 5) {
        setErrorMessage('Informe a data de validade (MM/AA).');
        return;
      }
      if (cardForm.cvv.length < 3) {
        setErrorMessage('Informe o código de segurança (CVV).');
        return;
      }
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Simulate real Mercado Pago secure tokenization & verification latency
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const res = await processPlanPayment({
        businessId: targetBusiness.id,
        planId: selectedPlan.id,
        billingCycle,
        paymentMethod,
        cardData:
          paymentMethod === 'credit_card'
            ? {
                number: cardForm.number,
                holderName: cardForm.holderName,
                expiry: cardForm.expiry,
                cvv: cardForm.cvv,
                installments: Number(validInstallments),
              }
            : undefined,
        payerEmail: cardForm.payerEmail,
      });

      if (res.success) {
        setCompletedTx(res.transaction);
      } else {
        setErrorMessage(res.error || 'Erro ao processar transação no Mercado Pago.');
      }
    } catch {
      setErrorMessage('Falha ao comunicar com o gateway de pagamentos.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const currentBrand = detectCardBrand(cardForm.number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-2xl my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                  {completedTx ? 'Comprovante de Pagamento' : 'Checkout Mercado Pago'}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                  {mercadoPagoConfig.environment === 'production' ? 'Oficial MP' : 'Ambiente Teste'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completedTx
                  ? `Transação confirmada para a loja ${targetBusiness?.name}`
                  : `Plano ${selectedPlan.name} · ${pricing.label} · ${formatBRL(pricing.totalAmount)}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TELA DE SUCESSO & COMPROVANTE */}
          {completedTx ? (
            <div className="space-y-6 animate-fade-in print:p-0">
              <div className="text-center py-4 space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                  Pagamento Confirmado!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  O plano <strong className="text-blue-600 dark:text-blue-400">{completedTx.planName}</strong> foi ativado com sucesso para a empresa <strong>{completedTx.businessName}</strong>.
                </p>
              </div>

              {/* Recibo Oficial Digital */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <span className="text-xs font-semibold text-slate-500">ID da Transação Mercado Pago:</span>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {completedTx.mercadoPagoPaymentId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Empresa Beneficiada:</span>
                    <strong className="text-slate-900 dark:text-white">{completedTx.businessName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Plano & Ciclo:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {completedTx.planName} · {BILLING_CYCLE_META[completedTx.billingCycle || 'monthly'].shortLabel}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Forma de Pagamento:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {completedTx.paymentMethod === 'pix'
                        ? 'PIX Instantâneo'
                        : `Cartão (${completedTx.cardBrand || 'Crédito'} · ${completedTx.installments || 1}x)`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Data & Hora da Aprovação:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{completedTx.paidAt}</span>
                  </div>
                </div>

                {completedTx.discountPercent && completedTx.discountPercent > 0 ? (
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Desconto do ciclo (-{completedTx.discountPercent}%):</span>
                    <span className="font-mono tabular-nums">
                      -{formatBRL(completedTx.discountAmount || 0)}
                    </span>
                  </div>
                ) : null}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Valor Total Pago:</span>
                  <span className="text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatBRL(completedTx.amount)}
                  </span>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-900 dark:text-blue-300 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    A cota da sua loja foi atualizada para até <strong>{selectedPlan.productLimit} produtos</strong> na vitrine comercial!
                  </span>
                </div>
              </div>

              {/* Botões do Comprovante */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Imprimir Comprovante</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setCurrentView('business_portal');
                  }}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Ir para o Painel da Loja</span>
                </button>
              </div>
            </div>
          ) : (
            /* TELA DE CHECKOUT ATIVO */
            <>
              {/* Card Resumo do Plano */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-200 dark:border-blue-900/60 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white">
                        {selectedPlan.badge}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                        Plano {selectedPlan.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Empresa: <strong className="text-slate-800 dark:text-slate-200">{targetBusiness?.name || 'Sua Empresa'}</strong> · Cota de {selectedPlan.productLimit} produtos
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                      {pricing.label}
                    </span>
                    {pricing.discountPercent > 0 && (
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 line-through mr-1.5">
                        {formatBRL(pricing.baseTotal)}
                      </span>
                    )}
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-blue-700 dark:text-blue-300">
                      {formatBRL(pricing.totalAmount)}
                    </div>
                    {pricing.discountPercent > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                        {formatBRL(pricing.effectiveMonthly)}/mês (-{pricing.discountPercent}%)
                      </span>
                    )}
                  </div>
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

              {/* Erro se houver */}
              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Seletor de Método de Pagamento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Escolha como deseja pagar:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('pix');
                      setErrorMessage(null);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer text-left flex items-start gap-3 ${
                      paymentMethod === 'pix'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">PIX</span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                          Instantâneo
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        QR Code & Copia e Cola imediato
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('credit_card');
                      setErrorMessage(null);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer text-left flex items-start gap-3 ${
                      paymentMethod === 'credit_card'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">Cartão de Crédito</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {billingCycle === 'monthly' ? 'À vista no Mercado Pago' : 'Até 12x sem juros no ciclo'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* ABA 1: CONTEÚDO PIX */}
              {paymentMethod === 'pix' && (
                <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>Expira em: <strong className="font-mono">{formatTimer(timeLeft)}</strong></span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Aprovação em segundos
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
                    {/* SVG QR CODE REPRESENTATION */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 text-center">
                      <svg
                        className="w-36 h-36 mx-auto"
                        viewBox="0 0 100 100"
                        shapeRendering="crispEdges"
                      >
                        {/* Realistic PIX QR Code Pattern in Clean SVG */}
                        <rect width="100" height="100" fill="#ffffff" />
                        {/* Corner 1 */}
                        <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
                        <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                        <rect x="13" y="13" width="9" height="9" fill="#00b4d8" />
                        {/* Corner 2 */}
                        <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
                        <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                        <rect x="78" y="13" width="9" height="9" fill="#00b4d8" />
                        {/* Corner 3 */}
                        <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
                        <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                        <rect x="13" y="78" width="9" height="9" fill="#00b4d8" />
                        {/* Data Matrix Dots */}
                        <rect x="35" y="10" width="8" height="5" fill="#0f172a" />
                        <rect x="47" y="10" width="5" height="12" fill="#0f172a" />
                        <rect x="56" y="8" width="8" height="6" fill="#0f172a" />
                        <rect x="35" y="22" width="6" height="15" fill="#0f172a" />
                        <rect x="45" y="27" width="18" height="6" fill="#0f172a" />
                        <rect x="10" y="36" width="15" height="6" fill="#0f172a" />
                        <rect x="10" y="48" width="8" height="12" fill="#0f172a" />
                        <rect x="25" y="44" width="12" height="6" fill="#0f172a" />
                        <rect x="35" y="48" width="10" height="10" fill="#0096c7" />
                        <rect x="50" y="44" width="12" height="12" fill="#0f172a" />
                        <rect x="68" y="36" width="24" height="6" fill="#0f172a" />
                        <rect x="75" y="48" width="18" height="8" fill="#0f172a" />
                        <rect x="68" y="62" width="8" height="15" fill="#0f172a" />
                        <rect x="82" y="64" width="10" height="10" fill="#0f172a" />
                        <rect x="36" y="68" width="18" height="6" fill="#0f172a" />
                        <rect x="42" y="78" width="12" height="14" fill="#0f172a" />
                        <rect x="60" y="82" width="15" height="10" fill="#0f172a" />
                        <rect x="80" y="80" width="12" height="12" fill="#00b4d8" />
                      </svg>
                      <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                        Aponte a câmera do seu banco
                      </span>
                    </div>

                    {/* Copia e Cola */}
                    <div className="flex-1 space-y-2 w-full">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Código PIX Copia e Cola:
                      </label>
                      <div className="relative">
                        <textarea
                          readOnly
                          rows={3}
                          value={pixCode}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-300 outline-none resize-none select-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                          copiedPix
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedPix ? 'Chave PIX Copiada com Sucesso!' : 'Copiar Chave PIX'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Como pagar:
                    </p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[10px]">
                      <li>Abra o aplicativo do seu banco de preferência</li>
                      <li>Escolha a opção <strong>PIX</strong> e depois <strong>Copia e Cola</strong> ou <strong>Ler QR Code</strong></li>
                      <li>Cole o código ou aponte a câmera para confirmar o valor</li>
                      <li>Após a confirmação, seu plano é liberado imediatamente no sistema!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* ABA 2: CARTÃO DE CRÉDITO */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Cartão Virtual Interativo */}
                  <div className={`p-5 rounded-2xl bg-gradient-to-r ${currentBrand.color} text-white shadow-lg space-y-4 transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                        {currentBrand.name}
                      </span>
                      <CreditCard className="w-6 h-6 text-white/80" />
                    </div>

                    <div className="py-1">
                      <span className="font-mono text-lg sm:text-xl tracking-widest block font-bold text-white drop-shadow-xs">
                        {cardForm.number || '•••• •••• •••• ••••'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/90">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-white/60 block">Nome do Titular</span>
                        <span className="font-bold uppercase truncate max-w-44 block">
                          {cardForm.holderName || 'NOME NO CARTÃO'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-white/60 block">Validade</span>
                        <span className="font-mono font-bold">
                          {cardForm.expiry || 'MM/AA'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Campos do Formulário do Cartão */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Número do Cartão de Crédito *
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={cardForm.number}
                          onChange={handleCardNumberChange}
                          placeholder="0000 0000 0000 0000"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome Impresso no Cartão *
                      </label>
                      <input
                        type="text"
                        required
                        value={cardForm.holderName}
                        onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
                        placeholder="Ex: CARLOS E SILVA"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white uppercase outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Validade *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardForm.expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/AA"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white outline-none text-center focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          CVV *
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardForm.cvv}
                          onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                          placeholder="123"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white outline-none text-center focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Parcelamento
                      </label>
                      <select
                        value={validInstallments}
                        onChange={(e) => setCardForm({ ...cardForm, installments: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none cursor-pointer font-mono tabular-nums"
                      >
                        {pricing.installmentOptions.map((opt) => (
                          <option key={opt.count} value={opt.count}>
                            {opt.count}x de {formatBRL(opt.amount)}
                            {opt.count === 1 ? ' (à vista)' : ' sem juros'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        E-mail para Recibo
                      </label>
                      <input
                        type="email"
                        value={cardForm.payerEmail}
                        onChange={(e) => setCardForm({ ...cardForm, payerEmail: e.target.value })}
                        placeholder="contato@empresa.com.br"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions (Quando não estiver concluído) */}
        {!completedTx && (
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Ambiente Criptografado & Certificado Mercado Pago</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isProcessing}
                className={`w-1/2 sm:w-auto px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } ${isProcessing ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : paymentMethod === 'pix' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar PIX ({formatBRL(pricing.totalAmount)})</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Pagar {formatBRL(pricing.totalAmount)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
