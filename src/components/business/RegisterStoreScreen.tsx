import React, { useState, useEffect } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { DaySchedule, BillingCycle } from '../../types';
import { ImageUploadField } from '../common/ImageUploadField';
import { BillingCycleSelector } from '../common/BillingCycleSelector';
import { calculatePlanPricing, formatBRL } from '../../utils/planPricing';
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
  Check,
  Sparkles,
  Send,
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
    verifyEmailCode,
    sendTemplatedEmail,
    openCheckoutPage,
  } = useDirectory();

  const activeCities = cities.filter((c) => c.isActive);

  const [form, setForm] = useState({
    name: '',
    cityId: activeCities[0]?.id || cities[0]?.id || '',
    categoryId: categories[0]?.id || '',
    planId: preselectedPlanId || plans[0]?.id || '',
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

  // 6-digit Email Verification State
  const [verificationCodeSentTo, setVerificationCodeSentTo] = useState<string | null>(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{
    type: 'info' | 'success' | 'error';
    text: string;
    testCodeHint?: string;
  } | null>(null);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(preselectedBillingCycle || 'monthly');

  useEffect(() => {
    if (preselectedPlanId && plans.some((p) => p.id === preselectedPlanId)) {
      setForm((prev) => ({ ...prev, planId: preselectedPlanId }));
    }
  }, [preselectedPlanId, plans]);

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
  const isCurrentEmailVerified = Boolean(verifiedEmail && verifiedEmail === normalizedFormEmail);

  const handleSendVerificationCode = async () => {
    setErrorMsg(null);
    if (!isEmailValidFormat) {
      setEmailStatusMsg({
        type: 'error',
        text: 'Informe um endereço de e-mail válido antes de solicitar o código de validação.',
      });
      return;
    }

    setIsSendingCode(true);
    try {
      const cityName = cities.find((c) => c.id === form.cityId)?.name || 'Alagoinhas';
      const result = await sendVerificationCodeEmail({
        to: form.email.trim(),
        businessName: form.name.trim(),
        cityName,
      });

      setVerificationCodeSentTo(normalizedFormEmail);
      setVerificationInput('');
      setEmailStatusMsg({
        type: 'info',
        text: result.deliveredViaSmtp
          ? `Enviamos um código de 6 dígitos para ${form.email.trim()}. Confira sua caixa de entrada.`
          : `Código de 6 dígitos registrado na Caixa de Saída local para ${form.email.trim()} (SMTP não configurado para envio externo).`,
        testCodeHint: result.deliveredViaSmtp ? undefined : result.code,
      });
    } catch {
      setEmailStatusMsg({
        type: 'error',
        text: 'Não foi possível gerar o código de validação. Tente novamente.',
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirmVerificationCode = () => {
    setErrorMsg(null);
    const check = verifyEmailCode(form.email, verificationInput);
    if (!check.valid) {
      setEmailStatusMsg({
        type: 'error',
        text: check.error || 'Código inválido.',
      });
      return;
    }

    setVerifiedEmail(normalizedFormEmail);
    setEmailStatusMsg({
      type: 'success',
      text: 'E-mail validado com sucesso! Você já pode concluir o cadastro da sua empresa.',
    });
  };

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
    if (!isCurrentEmailVerified) {
      setErrorMsg('Valide seu e-mail com o código de 6 dígitos antes de finalizar o cadastro.');
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

      const chosenPlan = plans.find((p) => p.id === form.planId) || plans[0];
      const freeFallbackPlan = plans.find((p) => p.priceMonthly === 0) || plans[0];
      const isPaidPlan = (chosenPlan?.priceMonthly || 0) > 0;
      const chosenPricing = calculatePlanPricing(chosenPlan, billingCycle, planDiscountConfig);
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
        emailVerified: true,
        paymentStatus: isPaidPlan ? ('pending_payment' as const) : ('active' as const),
        pendingPlanId: isPaidPlan ? chosenPlan.id : undefined,
        pendingBillingCycle: isPaidPlan ? billingCycle : undefined,
        billingCycle: isPaidPlan ? 'monthly' : billingCycle,
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

      if (isPaidPlan && chosenPlan) {
        const paymentLink = `${origin}/?checkout=1&businessId=${encodeURIComponent(
          newId
        )}&planId=${encodeURIComponent(chosenPlan.id)}&cycle=${encodeURIComponent(
          billingCycle
        )}&token=${encodeURIComponent(paymentToken || '')}`;

        const planLabel =
          chosenPricing.months > 1
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
            nome_plano: chosenPlan?.name || 'Plano Gratuito',
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

  const selectedPlan = plans.find((p) => p.id === form.planId) || plans[0];
  const selectedPricing = calculatePlanPricing(selectedPlan, billingCycle, planDiscountConfig);
  const isPaidSelectedPlan = !selectedPricing.isFree;

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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  1. Escolha seu Plano & Ciclo de Pagamento
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">Descontos automáticos multi-anuais</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Periodicidade do Plano:
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((p) => {
                const isSelected = form.planId === p.id;
                const pricing = calculatePlanPricing(p, billingCycle, planDiscountConfig);
                return (
                  <div
                    key={p.id}
                    onClick={() => setForm({ ...form, planId: p.id })}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{p.name}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                      </div>

                      {pricing.isFree ? (
                        <div className="mt-2 text-lg font-black text-slate-900 dark:text-white font-mono">
                          Grátis
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
                        Até {p.businessLimit || 1} {p.businessLimit === 1 ? 'loja' : 'lojas'}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, email: val });
                      if (verifiedEmail && verifiedEmail !== val.trim().toLowerCase()) {
                        setVerifiedEmail(null);
                      }
                    }}
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

            {/* Verificação Obrigatória de E-mail com Código de 6 Dígitos */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Validação do E-mail (Código de 6 Dígitos)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isCurrentEmailVerified
                      ? `E-mail ${form.email} validado com sucesso.`
                      : 'Confirme que o e-mail é seu antes de concluir o cadastro.'}
                  </p>
                </div>

                {isCurrentEmailVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold self-start sm:self-auto">
                    <Check className="w-4 h-4" />
                    <span>E-mail Validado</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isSendingCode}
                    onClick={handleSendVerificationCode}
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSendingCode
                        ? 'Enviando...'
                        : verificationCodeSentTo === form.email.trim().toLowerCase()
                        ? 'Reenviar Código'
                        : 'Enviar Código de Validação'}
                    </span>
                  </button>
                )}
              </div>

              {!isCurrentEmailVerified && verificationCodeSentTo && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Digite o código de 6 dígitos"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono tracking-widest text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmVerificationCode}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold cursor-pointer shrink-0"
                  >
                    Validar Código
                  </button>
                </div>
              )}

              {emailStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    emailStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : emailStatusMsg.type === 'error'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                  }`}
                >
                  <p>{emailStatusMsg.text}</p>
                  {emailStatusMsg.testCodeHint && (
                    <p className="mt-1 text-[11px] font-semibold">
                      Código gerado em modo de teste local:{' '}
                      <span className="font-mono font-extrabold text-orange-600">
                        {emailStatusMsg.testCodeHint}
                      </span>
                    </p>
                  )}
                </div>
              )}
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
                    ? `${selectedPlan?.name} · ${selectedPricing.label} · ${formatBRL(
                        selectedPricing.totalAmount
                      )}${
                        selectedPricing.discountPercent > 0
                          ? ` (${selectedPricing.discountPercent}% OFF)`
                          : ''
                      }`
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
                  ? `Após validar seu e-mail, sua empresa será cadastrada como Pendente de Pagamento. Você será direcionado para pagar ${formatBRL(
                      selectedPricing.totalAmount
                    )} (PIX ou Cartão${
                      selectedPricing.months > 1 ? ' em até 12x' : ''
                    }) e receberá o link por e-mail.`
                  : 'Ao clicar abaixo após validar seu e-mail, sua empresa será cadastrada, enviaremos o e-mail de boas-vindas e você será direcionado imediatamente para o painel da sua loja para cadastrar seus produtos e serviços.'}
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
