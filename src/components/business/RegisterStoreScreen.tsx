import React, { useState, useEffect } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { DaySchedule, BillingCycle } from '../../types';
import { ImageUploadField } from '../common/ImageUploadField';
import { BillingCycleSelector } from '../common/BillingCycleSelector';
import {
  calculatePlanPricing,
  formatBRL,
  isFounderPlan,
  isInviteTrialPlan,
  isLifetimePlan,
} from '../../utils/planPricing';
import {
  ArrowLeft,
  Building2,
  Store,
  MapPin,
  Tag,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Instagram,
  Facebook,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
  Crown,
} from 'lucide-react';

const initialWeeklySchedule: DaySchedule[] = [
  { day: 'Segunda-feira', shortDay: 'Seg', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Terça-feira', shortDay: 'Ter', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Quarta-feira', shortDay: 'Qua', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Quinta-feira', shortDay: 'Qui', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Sexta-feira', shortDay: 'Sex', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Sábado', shortDay: 'Sáb', isOpen: true, openTime: '08:00', closeTime: '13:00' },
  { day: 'Domingo', shortDay: 'Dom', isOpen: false, openTime: '09:00', closeTime: '13:00' },
];

export const RegisterStoreScreen: React.FC = () => {
  const {
    cities,
    categories,
    plans,
    registerBusinessAndLogin,
    setCurrentView,
    sessionConfig,
    preselectedPlanId,
    preselectedBillingCycle,
    setPreselectedBillingCycle,
    planDiscountConfig,
    siteModeConfig,
    sendVerificationCodeEmail,
    sendTemplatedEmail,
    openCheckoutPage,
    activeInviteCode,
    validatedInvite,
    inviteValidationError,
    validateInviteCode,
    clearActiveInvite,
  } = useDirectory();

  const activeCities = cities.filter((c) => c.isActive);
  const selectablePlans = plans.filter(
    (p) => !p.isInviteOnly || (validatedInvite && p.id === validatedInvite.planId)
  );

  const [form, setForm] = useState({
    name: '',
    cityId: activeCities[0]?.id || cities[0]?.id || '',
    categoryId: categories[0]?.id || '',
    planId:
      preselectedPlanId &&
      plans.some((p) => p.id === preselectedPlanId && (!p.isInviteOnly || validatedInvite?.planId === p.id))
        ? preselectedPlanId
        : plans.find((p) => !p.isInviteOnly)?.id || plans[0]?.id || '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    neighborhood: '',
    logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=300&h=300&fit=crop&q=80',
    instagram: '',
    facebook: '',
    website: '',
  });

  const [schedule, setSchedule] = useState<DaySchedule[]>(initialWeeklySchedule);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState(activeInviteCode || '');
  const [isValidatingInvite, setIsValidatingInvite] = useState(false);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(preselectedBillingCycle || 'monthly');

  useEffect(() => {
    if (activeInviteCode && !inviteCodeInput) {
      setInviteCodeInput(activeInviteCode);
    }
  }, [activeInviteCode]);

  useEffect(() => {
    if (validatedInvite?.planId && plans.some((p) => p.id === validatedInvite.planId)) {
      setForm((prev) => ({ ...prev, planId: validatedInvite.planId }));
    } else if (
      preselectedPlanId &&
      plans.some(
        (p) => p.id === preselectedPlanId && (!p.isInviteOnly || validatedInvite?.planId === p.id)
      )
    ) {
      setForm((prev) => ({ ...prev, planId: preselectedPlanId }));
    }
  }, [preselectedPlanId, validatedInvite, plans]);

  useEffect(() => {
    setBillingCycle(preselectedBillingCycle);
  }, [preselectedBillingCycle]);

  const logoPresetSamples = [
    { label: 'Gastronomia', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=300&fit=crop&q=80' },
    { label: 'Boutique & Moda', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&q=80' },
    { label: 'Tecnologia', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop&q=80' },
    { label: 'Farmácia & Saúde', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&q=80' },
  ];

  const handleDayToggle = (index: number) => {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isOpen: !item.isOpen } : item))
    );
  };

  const handleScheduleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const normalizedFormEmail = form.email.trim().toLowerCase();
  const isEmailValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedFormEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim()) {
      setErrorMsg('Por favor, informe o nome fantasia da sua empresa.');
      return;
    }
    if (!form.whatsapp.trim()) {
      setErrorMsg('Por favor, informe o WhatsApp comercial para contato dos clientes.');
      return;
    }
    if (!isEmailValidFormat) {
      setErrorMsg('Por favor, informe um e-mail válido para login e contato.');
      return;
    }
    if (!form.password) {
      setErrorMsg('Por favor, defina uma senha de acesso para sua conta.');
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setIsSubmitting(true);

    try {
      const openingHoursSummary = schedule
        .filter((s) => s.isOpen)
        .map((s) => `${s.shortDay}: ${s.openTime}-${s.closeTime}`)
        .slice(0, 3)
        .join(' | ');

      const chosenPlan =
        selectablePlans.find((p) => p.id === form.planId) ||
        selectablePlans[0] ||
        plans[0];
      const freeFallbackPlan = plans.find((p) => p.priceMonthly === 0 && !p.isInviteOnly) || plans[0];
      const chosenPricing = calculatePlanPricing(chosenPlan, billingCycle, planDiscountConfig);
      const isPaidPlan = chosenPricing.isPaid;
      const isInviteSelected =
        isInviteTrialPlan(chosenPlan) && Boolean(validatedInvite && (activeInviteCode || validatedInvite.code));
      const appliedInviteCode = isInviteSelected
        ? (activeInviteCode || validatedInvite?.code || '').trim().toUpperCase()
        : undefined;

      if (chosenPlan.isInviteOnly && !appliedInviteCode) {
        setErrorMsg('O plano de convite exige um código de convite válido emitido pelo administrador.');
        setIsSubmitting(false);
        return;
      }

      const paymentToken = isPaidPlan
        ? `pay-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
        : undefined;

      const newBizData = {
        name: form.name.trim(),
        cityId: form.cityId,
        categoryId: form.categoryId,
        planId: isPaidPlan ? (freeFallbackPlan?.id || chosenPlan.id) : chosenPlan.id,
        description: form.description.trim() || 'Empresa cadastrada no achenacidade.',
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        ownerEmail: form.email.trim(),
        address: form.address.trim() || 'Endereço Comercial',
        neighborhood: form.neighborhood.trim() || 'Centro',
        openingHours: openingHoursSummary || 'Seg a Sex: 08:00 às 18:00',
        weeklySchedule: schedule,
        logoUrl: form.logoUrl,
        coverUrl: form.logoUrl,
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        website: form.website.trim(),
        password: form.password,
        isVerified: false,
        emailVerified: false,
        paymentStatus: isPaidPlan ? ('pending_payment' as const) : ('active' as const),
        pendingPlanId: isPaidPlan ? chosenPlan.id : undefined,
        pendingBillingCycle: isPaidPlan ? billingCycle : undefined,
        billingCycle: isPaidPlan || chosenPricing.isLifetime || isInviteSelected ? 'monthly' : billingCycle,
        inviteCode: appliedInviteCode,
        subscriptionStatus: 'active' as const,
        paymentToken,
      };

      const regRes = await registerBusinessAndLogin(newBizData, false);
      if (!regRes.success || !regRes.businessId) {
        setErrorMsg(regRes.error || 'Não foi possível concluir o cadastro da empresa no banco.');
        setIsSubmitting(false);
        return;
      }

      const newId = regRes.businessId;
      const cityName = cities.find((c) => c.id === form.cityId)?.name || 'Alagoinhas';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      try {
        await sendVerificationCodeEmail({
          to: form.email.trim(),
          businessId: newId,
          businessName: newBizData.name,
          cityName,
        });
      } catch {
        // Non-blocking: user can also resend inside the Business Portal
      }

      if (isPaidPlan && chosenPlan) {
        const paymentLink = `${origin}/?checkout=1&businessId=${encodeURIComponent(
          newId
        )}&planId=${encodeURIComponent(chosenPlan.id)}&cycle=${encodeURIComponent(
          billingCycle
        )}&token=${encodeURIComponent(paymentToken || '')}`;

        const planLabel = chosenPricing.isLifetime
          ? `${chosenPlan.name} (Vitalício · Pagamento Único)`
          : chosenPricing.months > 1
          ? `${chosenPlan.name} (${chosenPricing.shortLabel}${
              chosenPricing.discountPercent > 0 ? ` · ${chosenPricing.discountPercent}% OFF` : ''
            })`
          : chosenPlan.name;

        await sendTemplatedEmail({
          key: 'payment_link',
          to: form.email.trim(),
          variables: {
            nome_empresa: newBizData.name,
            nome_plano: planLabel,
            valor_plano: formatBRL(chosenPricing.totalAmount),
            link_pagamento: paymentLink,
            cidade: cityName,
          },
          actionUrl: paymentLink,
        });

        openCheckoutPage(newId, chosenPlan.id, paymentToken, billingCycle);
      } else {
        const portalLink = `${origin}/?painel=1&businessId=${encodeURIComponent(newId)}`;
        await sendTemplatedEmail({
          key: 'welcome',
          to: form.email.trim(),
          variables: {
            nome_empresa: newBizData.name,
            nome_plano: isInviteSelected
              ? `${chosenPlan?.name || 'Convite Premium 6 Meses'} (6 meses grátis)`
              : chosenPlan?.name || 'Plano Gratuito',
            email_login: form.email.trim(),
            link_painel: portalLink,
            cidade: cityName,
          },
          actionUrl: portalLink,
        });

        setCurrentView('business_portal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocorreu um erro ao cadastrar a empresa. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const selectedPlan =
    selectablePlans.find((p) => p.id === form.planId) ||
    selectablePlans[0] ||
    plans[0];
  const selectedPricing = calculatePlanPricing(selectedPlan, billingCycle, planDiscountConfig);
  const isPaidSelectedPlan = selectedPricing.isPaid;
  const isLifetimeSelectedPlan = isLifetimePlan(selectedPlan);
  const isInviteSelectedPlan = isInviteTrialPlan(selectedPlan);

  const handleApplyInviteInForm = async () => {
    if (!inviteCodeInput.trim()) return;
    setIsValidatingInvite(true);
    const res = await validateInviteCode(inviteCodeInput);
    setIsValidatingInvite(false);
    if (res.valid && res.invite) {
      setForm((prev) => ({ ...prev, planId: res.invite!.planId || 'plan-invite-premium-6m' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors pb-24 md:pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => setCurrentView(siteModeConfig.mode !== 'normal' ? 'plans' : 'home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{siteModeConfig.mode !== 'normal' ? 'Voltar aos Planos' : 'Voltar ao Início'}</span>
        </button>

        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="achenacidade" className="w-8 h-8 object-contain rounded-full bg-white shadow-xs" />
          <span className="font-extrabold text-slate-900 dark:text-white font-display text-sm sm:text-base">
            achena<span className="text-orange-600">cidade</span>
          </span>
        </div>

        <button
          onClick={() => setCurrentView('login')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
        >
          Já tem conta? Entrar
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 w-full py-8 sm:py-10">
        {/* Title & Introduction */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-bold mb-3 border border-orange-200 dark:border-orange-900">
            <Store className="w-3.5 h-3.5 text-orange-600" />
            <span>Cadastre sua Empresa & Produtos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            Crie sua Vitrine Digital no achenacidade
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Cadastre sua empresa, divulgue seus produtos para os moradores da sua cidade e receba contatos diretamente no seu WhatsApp.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atenção no formulário:</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Escolha do Plano e Ciclo */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  1. Escolha seu Plano & Ciclo de Pagamento
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">Vitalício ou recorrente</span>
            </div>

            {/* Invite Code Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                <Ticket className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {validatedInvite ? (
                    <>
                      Convite <strong className="font-mono text-emerald-700 dark:text-emerald-400">{validatedInvite.code}</strong> ativo — <strong>6 meses grátis</strong> do Plano Premium liberado!
                    </>
                  ) : (
                    'Tem um código de convite do administrador?'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="Código de convite"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono uppercase text-slate-900 dark:text-white w-40"
                />
                <button
                  type="button"
                  onClick={handleApplyInviteInForm}
                  disabled={isValidatingInvite}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isValidatingInvite ? 'Validando...' : 'Aplicar'}
                </button>
                {validatedInvite && (
                  <button
                    type="button"
                    onClick={() => {
                      clearActiveInvite();
                      setInviteCodeInput('');
                      setForm((prev) => ({
                        ...prev,
                        planId: plans.find((p) => !p.isInviteOnly)?.id || 'plan-free',
                      }));
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            {inviteValidationError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{inviteValidationError}</span>
              </p>
            )}

            {!isLifetimeSelectedPlan && !isInviteSelectedPlan && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Periodicidade do Plano Recorrente:
                </p>
                <BillingCycleSelector
                  value={billingCycle}
                  onChange={(cycle) => {
                    setBillingCycle(cycle);
                    setPreselectedBillingCycle(cycle);
                  }}
                  globalDiscounts={planDiscountConfig}
                  compact
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {selectablePlans.map((p) => {
                const isSelected = form.planId === p.id;
                const pricing = calculatePlanPricing(p, billingCycle, planDiscountConfig);
                const isLifetime = isLifetimePlan(p);
                const isFounder = isFounderPlan(p);
                const isInvitePlan = isInviteTrialPlan(p);
                return (
                  <div
                    key={p.id}
                    onClick={() => setForm({ ...form, planId: p.id })}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isFounder
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-400/30 shadow-sm'
                          : 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1">
                          {isFounder && <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          {p.name}
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>

                      {isInvitePlan ? (
                        <div className="mt-2">
                          <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                            6 Meses Grátis
                          </div>
                          <p className="text-[11px] text-slate-500">Convite VIP Exclusivo</p>
                        </div>
                      ) : pricing.isFree ? (
                        <div className="mt-2 text-lg font-black text-slate-900 dark:text-white font-mono">
                          Grátis
                        </div>
                      ) : isLifetime ? (
                        <div className="mt-2 space-y-0.5">
                          <div className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
                            {formatBRL(pricing.totalAmount)}
                            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 ml-1">
                              único
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                            Vitalício · Sem mensalidade
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-0.5">
                          {pricing.discountPercent > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="line-through text-slate-400 font-mono tabular-nums">
                                {formatBRL(pricing.baseMonthly)}
                              </span>
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                                -{pricing.discountPercent}% OFF
                              </span>
                            </div>
                          )}
                          <div className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
                            {formatBRL(pricing.effectiveMonthly)}
                            <span className="text-xs font-medium text-slate-500">/mês</span>
                          </div>
                          {pricing.months > 1 && (
                            <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                              Total {pricing.shortLabel}: {formatBRL(pricing.totalAmount)}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                        Até {p.productLimit} produtos/serviços
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        Até {p.businessLimit || 1} {(p.businessLimit || 1) === 1 ? 'loja' : 'lojas'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Dados Principais da Empresa */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                2. Dados da Sua Empresa
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Fantasia da Empresa / Loja *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Padaria Central de Vinhedo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cidade de Atuação *
                </label>
                <select
                  value={form.cityId}
                  onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer"
                >
                  {activeCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria Comercial *
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Comercial (com DDD) *
                </label>
                <input
                  type="text"
                  required
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="Ex: 19998765432"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone Fixo / Adicional
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Ex: 1938761234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço Comercial (Rua e Número)
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Ex: Rua Nove de Julho, 350"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  placeholder="Ex: Centro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição Resumida da Empresa
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Panificadora tradicional com pães artesanais, bolos, café colonial e encomendas para festas."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Upload de Logomarca */}
              <div className="sm:col-span-2">
                <ImageUploadField
                  value={form.logoUrl}
                  onChange={(url) => setForm({ ...form, logoUrl: url })}
                  label="Logomarca da Empresa"
                  helpText="Envie a foto ou logo da sua empresa para destacar sua vitrine."
                  presetSamples={logoPresetSamples}
                  aspectRatio="icon"
                />
              </div>
            </div>
          </div>

          {/* 3. Acesso & Senha */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  3. Dados de Acesso & Senha
                </h2>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sessão segura de {Math.round(sessionConfig.businessSessionDurationMinutes / 60)}h</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail de Login *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contato@minhaloja.com.br"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cadastrar Senha *
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 dígitos"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repita sua senha"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Após finalizar o cadastro, enviaremos automaticamente um código de validação de 6 dígitos para este e-mail. Você poderá confirmá-lo diretamente no Painel do Lojista.
              </p>
            </div>
          </div>

          {/* 4. Redes Sociais (Incluindo Facebook) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                4. Redes Sociais & Canais Digitais
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                  <span>Facebook</span>
                </label>
                <input
                  type="text"
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                  placeholder="facebook.com/minhaloja"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Instagram</span>
                </label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@minhaloja"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Website Oficial</span>
                </label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://minhaloja.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 5. Horários de Funcionamento por Dia e Horário */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  5. Horário de Funcionamento por Dia e Horário
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">Defina os horários de abertura</span>
            </div>

            <div className="space-y-2.5">
              {schedule.map((dayItem, idx) => (
                <div
                  key={dayItem.day}
                  className={`p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    dayItem.isOpen
                      ? 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayItem.isOpen}
                      onChange={() => handleDayToggle(idx)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white min-w-32">
                      {dayItem.day}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dayItem.isOpen
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {dayItem.isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  </label>

                  {dayItem.isOpen ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Das</span>
                      <input
                        type="time"
                        value={dayItem.openTime}
                        onChange={(e) => handleScheduleTimeChange(idx, 'openTime', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                      <span className="text-slate-500">às</span>
                      <input
                        type="time"
                        value={dayItem.closeTime}
                        onChange={(e) => handleScheduleTimeChange(idx, 'closeTime', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Estabelecimento fechado neste dia</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Submit Banner (Free Immediate vs Paid Pending + Payment Link) */}
          <div
            className={`p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isPaidSelectedPlan
                ? 'bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 border border-blue-700'
                : 'bg-gradient-to-r from-orange-600 to-amber-600'
            }`}
          >
            <div>
              <div
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${
                  isPaidSelectedPlan ? 'text-orange-300' : 'text-orange-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isPaidSelectedPlan
                    ? isLifetimeSelectedPlan
                      ? `${selectedPlan?.name} · Vitalício · Pagamento Único de ${formatBRL(
                          selectedPricing.totalAmount
                        )}`
                      : `${selectedPlan?.name} · ${selectedPricing.label} · ${formatBRL(
                          selectedPricing.totalAmount
                        )}${
                          selectedPricing.discountPercent > 0
                            ? ` (${selectedPricing.discountPercent}% OFF)`
                            : ''
                        }`
                    : isInviteSelectedPlan
                    ? `Ativação Imediata · Convite VIP Premium (6 Meses Grátis)`
                    : 'Ativação Imediata · Plano Gratuito'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                {isPaidSelectedPlan
                  ? 'Pronto para concluir e seguir para o pagamento?'
                  : 'Tudo pronto para publicar sua vitrine?'}
              </h3>
              <p className="text-xs text-white/90 max-w-xl mt-0.5 leading-relaxed">
                {isPaidSelectedPlan
                  ? `Ao finalizar, sua empresa será cadastrada como Pendente de Pagamento, enviaremos o código de validação para o seu e-mail e você seguirá para pagar ${formatBRL(
                      selectedPricing.totalAmount
                    )} (PIX ou Cartão${
                      isLifetimeSelectedPlan || selectedPricing.months > 1 ? ' em até 12x' : ''
                    }).`
                  : isInviteSelectedPlan
                  ? 'Ao finalizar, seu código de convite será ativado automaticamente, liberando 6 meses grátis com todos os benefícios do Plano Premium Ouro!'
                  : 'Ao clicar abaixo, sua empresa será cadastrada, enviaremos o código de validação e as boas-vindas por e-mail e você acessará o painel da sua loja imediatamente.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 ${
                isPaidSelectedPlan
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : 'bg-white text-orange-700 hover:bg-orange-50'
              }`}
            >
              {isPaidSelectedPlan ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4 text-orange-600" />
              )}
              <span>
                {isSubmitting
                  ? 'Processando Cadastro...'
                  : isPaidSelectedPlan
                  ? 'Finalizar Cadastro e Ir para Pagamento'
                  : 'Finalizar Cadastro e Acessar Minha Loja'}
              </span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
