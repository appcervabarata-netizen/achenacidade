import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { DaySchedule } from '../../types';
import { ImageUploadField } from '../common/ImageUploadField';
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
    addBusiness,
    loginAsBusiness,
    setCurrentView,
    sessionConfig,
  } = useDirectory();

  const activeCities = cities.filter((c) => c.isActive);

  const [form, setForm] = useState({
    name: '',
    cityId: activeCities[0]?.id || cities[0]?.id || '',
    categoryId: categories[0]?.id || '',
    planId: plans[0]?.id || '',
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

  const handleSubmit = (e: React.FormEvent) => {
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
    if (!form.email.trim()) {
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

      const newBizData = {
        name: form.name.trim(),
        cityId: form.cityId,
        categoryId: form.categoryId,
        planId: form.planId,
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
      };

      const newId = addBusiness(newBizData);
      const createdBizObj = {
        ...newBizData,
        id: newId,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Log immediately into the newly created store
      loginAsBusiness(newId, createdBizObj);
      setCurrentView('business_portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocorreu um erro ao cadastrar a empresa. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === form.planId) || plans[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors pb-24 md:pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
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
          {/* 1. Escolha do Plano */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  1. Escolha seu Plano de Divulgação
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">Altere quando quiser</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((p) => {
                const isSelected = form.planId === p.id;
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
                      <div className="mt-2 text-lg font-black text-slate-900 dark:text-white font-mono">
                        {p.priceMonthly === 0 ? 'Grátis' : `R$ ${p.priceMonthly.toFixed(2)}/mês`}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                        Até {p.productLimit} produtos
                      </div>
                      <div className="text-[11px] text-slate-500">
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

          {/* Submit Button */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-200 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Ativação Imediata</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                Tudo pronto para publicar sua vitrine?
              </h3>
              <p className="text-xs text-orange-100 max-w-lg mt-0.5">
                Ao clicar abaixo, sua empresa será cadastrada e você será direcionado imediatamente para o painel da sua loja para cadastrar seus produtos.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-orange-700 font-extrabold text-xs sm:text-sm hover:bg-orange-50 transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <span>{isSubmitting ? 'Cadastrando Loja...' : 'Finalizar Cadastro e Acessar Minha Loja'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
