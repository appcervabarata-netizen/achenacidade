import React, { useState, useEffect } from 'react';
import { Business, City, Category, Plan, DaySchedule } from '../../types';
import { ImageUploadField } from '../common/ImageUploadField';
import { cloneWeeklySchedule, compileWeeklyScheduleSummary } from '../../utils/scheduleHelpers';
import { formatBRL, isInviteTrialPlan, isLifetimePlan } from '../../utils/planPricing';
import {
  X,
  Building2,
  MapPin,
  Tag,
  CreditCard,
  Phone,
  Mail,
  Lock,
  Globe,
  Instagram,
  Facebook,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface AdminBusinessEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business | null;
  onSave: (businessId: string, updates: Partial<Business>) => void;
  cities: City[];
  categories: Category[];
  plans: Plan[];
}

export const AdminBusinessEditModal: React.FC<AdminBusinessEditModalProps> = ({
  isOpen,
  onClose,
  business,
  onSave,
  cities,
  categories,
  plans,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'contato' | 'midia' | 'apresentacao' | 'acesso'>('geral');
  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    cityId: '',
    categoryId: '',
    planId: '',
    isVerified: false,
    phone: '',
    whatsapp: '',
    email: '',
    ownerEmail: '',
    neighborhood: '',
    address: '',
    description: '',
    openingHours: '',
    instagram: '',
    facebook: '',
    website: '',
    logoUrl: '',
    coverUrl: '',
    password: '',
  });
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => cloneWeeklySchedule());

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        slug: business.slug || '',
        cityId: business.cityId || (cities[0]?.id ?? ''),
        categoryId: business.categoryId || (categories[0]?.id ?? ''),
        planId: business.planId || (plans[0]?.id ?? ''),
        isVerified: !!business.isVerified,
        phone: business.phone || '',
        whatsapp: business.whatsapp || '',
        email: business.email || '',
        ownerEmail: business.ownerEmail || '',
        neighborhood: business.neighborhood || '',
        address: business.address || '',
        description: business.description || '',
        openingHours: business.openingHours || '',
        instagram: business.instagram || '',
        facebook: business.facebook || '',
        website: business.website || '',
        logoUrl: business.logoUrl || '',
        coverUrl: business.coverUrl || '',
        password: '',
      });
      setSchedule(cloneWeeklySchedule(business.weeklySchedule));
      setSaveSuccess(false);
    }
  }, [business, cities, categories, plans]);

  if (!isOpen || !business) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const compiledHours = compileWeeklyScheduleSummary(schedule);

    onSave(business.id, {
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      cityId: formData.cityId,
      categoryId: formData.categoryId,
      planId: formData.planId,
      isVerified: formData.isVerified,
      phone: formData.phone.trim(),
      whatsapp: formData.whatsapp.trim(),
      email: formData.email.trim(),
      ownerEmail: formData.ownerEmail.trim(),
      neighborhood: formData.neighborhood.trim(),
      address: formData.address.trim(),
      description: formData.description.trim(),
      openingHours: compiledHours,
      weeklySchedule: schedule,
      instagram: formData.instagram.trim(),
      facebook: formData.facebook.trim(),
      website: formData.website.trim(),
      logoUrl: formData.logoUrl.trim() || business.logoUrl,
      coverUrl: formData.coverUrl.trim(),
      ...(formData.password.trim() ? { password: formData.password.trim() } : {}),
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleDayToggle = (idx: number) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, isOpen: !item.isOpen } : item))
    );
  };

  const handleScheduleTimeChange = (idx: number, field: 'openTime' | 'closeTime', value: string) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyMondayToAll = () => {
    const monday = schedule[0];
    if (!monday) return;
    setSchedule((prev) =>
      prev.map((item, idx) =>
        idx === 6
          ? item
          : { ...item, isOpen: true, openTime: monday.openTime, closeTime: monday.closeTime }
      )
    );
  };

  const handleGeneratePassword = () => {
    const randomPass = Math.random().toString(36).slice(-8) + 'A1!';
    setFormData((prev) => ({ ...prev, password: randomPass }));
    setShowPassword(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-3xl my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={formData.logoUrl || business.logoUrl}
              alt={business.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0 shadow-xs"
            />
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate font-display">
                  Editar Loja: <span className="text-blue-600 dark:text-blue-400">{business.name}</span>
                </h3>
                {formData.isVerified && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-blue-600" /> Verificada
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Painel Administrativo Master · ID: {business.id}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 scrollbar-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'geral'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            1. Dados Gerais & Plano
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contato')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'contato'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            2. Contatos & Endereço
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('midia')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'midia'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            3. Logo & Capa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apresentacao')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'apresentacao'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            4. Descrição & Redes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('acesso')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'acesso'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            5. Login & Senha
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dados da loja atualizados com sucesso pelo Administrador!</span>
            </div>
          )}

          {/* TAB 1: GERAL & PLANO */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Empresa / Loja *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Pizzaria Bella Vista"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade da Loja *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                    <select
                      value={formData.cityId}
                      onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.state} {!c.isActive ? '(Inativa)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria Comercial *
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Plano de Assinatura *
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                    <select
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} -{' '}
                          {isLifetimePlan(p)
                            ? `${formatBRL(p.priceOnce ?? 500)} único (Vitalício)`
                            : isInviteTrialPlan(p)
                            ? `${p.trialMonths || 6} meses grátis (Convite)`
                            : p.priceMonthly === 0
                            ? 'Grátis'
                            : `${formatBRL(p.priceMonthly)}/mês`}{' '}
                          (Até {p.productLimit} itens)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selo de Empresa Verificada
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isVerified: !formData.isVerified })}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition cursor-pointer text-xs font-bold ${
                      formData.isVerified
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className={`w-4 h-4 ${formData.isVerified ? 'text-blue-600' : 'text-slate-400'}`} />
                      {formData.isVerified ? 'Empresa Verificada (Ativo)' : 'Não Verificada'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${formData.isVerified ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      {formData.isVerified ? 'SIM' : 'NÃO'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Identificador URL (Slug)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ex: pizzaria-bella-vista"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Usado no link direto: achenacidade.com.br/loja/{formData.slug || 'nome-da-loja'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: CONTATOS & ENDEREÇO */}
          {activeTab === 'contato' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Comercial (com DDD) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                    <input
                      type="text"
                      required
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Usado no botão de pedido direto no WhatsApp do catálogo.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone Fixo / Adicional
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 3333-3333"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Comercial (Público)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com.br"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bairro / Região
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Ex: Centro, Jardins"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Completo (Rua, Número, Complemento)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Av. Brasil, 1250 - Sala 4"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGO & CAPA */}
          {activeTab === 'midia' && (
            <div className="space-y-5">
              <div>
                <ImageUploadField
                  value={formData.logoUrl}
                  onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                  label="Logomarca Oficial da Loja"
                  helpText="Selecione do computador, cole uma URL ou utilize uma imagem quadrada (1:1)."
                  aspectRatio="icon"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <ImageUploadField
                  value={formData.coverUrl}
                  onChange={(url) => setFormData({ ...formData, coverUrl: url })}
                  label="Foto de Capa / Fachada da Loja"
                  helpText="Imagem panorâmica de alta resolução exibida no topo da página e cartão da empresa."
                  aspectRatio="banner"
                />
              </div>
            </div>
          )}

          {/* TAB 4: DESCRIÇÃO & REDES */}
          {activeTab === 'apresentacao' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição / Apresentação da Empresa
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Fale um pouco sobre a história, diferenciais, produtos e serviços da empresa..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Horário de Funcionamento por Dia
                  </label>
                  <button
                    type="button"
                    onClick={handleApplyMondayToAll}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                  >
                    Aplicar Seg em Ter–Sáb
                  </button>
                </div>

                {!business.weeklySchedule?.length && business.openingHours && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl px-3 py-1.5">
                    Horário atual cadastrado: <strong>{business.openingHours}</strong>. Ajuste os dias abaixo para atualizar.
                  </p>
                )}

                <div className="space-y-2">
                  {schedule.map((dayItem, idx) => (
                    <div
                      key={dayItem.day}
                      className={`p-2.5 sm:p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        dayItem.isOpen
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 opacity-65'
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dayItem.isOpen}
                          onChange={() => handleDayToggle(idx)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white min-w-28">
                          {dayItem.day}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dayItem.isOpen
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
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
                            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                          />
                          <span className="text-slate-500">às</span>
                          <input
                            type="time"
                            value={dayItem.closeTime}
                            onChange={(e) => handleScheduleTimeChange(idx, 'closeTime', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Fechado neste dia</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Resumo exibido no cartão: <strong className="text-slate-800 dark:text-slate-200">{compileWeeklyScheduleSummary(schedule)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Instagram
                  </label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 absolute left-3 top-3 text-rose-500" />
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@empresa"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Facebook
                  </label>
                  <div className="relative">
                    <Facebook className="w-4 h-4 absolute left-3 top-3 text-blue-600" />
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="facebook.com/empresa"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Website Oficial
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://empresa.com.br"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOGIN & SENHA */}
          {activeTab === 'acesso' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">Área de Credenciais do Lojista</p>
                  <p>
                    {business.hasPassword
                      ? 'Esta loja já possui senha criptografada salva no banco de dados. Preencha abaixo apenas se desejar redefinir.'
                      : 'Esta loja ainda não possui senha cadastrada. Defina uma senha para liberar o login do lojista.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail do Proprietário / Login do Lojista
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    placeholder="dono@exemplo.com.br"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Utilizado pelo lojista para acessar o Painel da Loja.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nova Senha de Acesso da Loja
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Gerar Senha Automática
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe em branco para manter a senha atual"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  A senha digitada será criptografada com scrypt antes de ser salva no MySQL.
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Alterações da Loja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
