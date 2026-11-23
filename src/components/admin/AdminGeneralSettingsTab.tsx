import React, { useEffect, useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { AppGeneralConfig } from '../../types';
import { ImageUploadField } from '../common/ImageUploadField';
import { buildAutoSeoSuggestions, normalizeWhatsappUrl } from '../../utils/seoHelper';
import {
  Globe,
  Save,
  Sparkles,
  MessageCircle,
  Users,
  Share2,
  Search,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Link2,
  Database,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface AdminGeneralSettingsTabProps {
  onNotify?: (message: string) => void;
}

export const AdminGeneralSettingsTab: React.FC<AdminGeneralSettingsTabProps> = ({ onNotify }) => {
  const {
    appGeneralConfig,
    updateAppGeneralConfig,
    resetAppGeneralConfig,
    cities,
    categories,
    dbSyncStatus,
  } = useDirectory();

  const [form, setForm] = useState<AppGeneralConfig>(appGeneralConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setForm(appGeneralConfig);
    setHasUnsavedChanges(false);
  }, [appGeneralConfig]);

  const showFeedback = (msg: string) => {
    setSavedNotice(msg);
    onNotify?.(msg);
    window.setTimeout(() => setSavedNotice(null), 4000);
  };

  const updateField = <K extends keyof AppGeneralConfig>(field: K, value: AppGeneralConfig[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAutoFillSeo = () => {
    const suggested = buildAutoSeoSuggestions({
      appName: form.appName,
      tagline: form.tagline,
      cityLabel: form.cityLabel,
      cities,
      categories,
      ogImageUrl: form.ogImageUrl,
      canonicalUrl: form.canonicalUrl,
    });
    const next: AppGeneralConfig = {
      ...form,
      ...suggested,
    };
    setForm(next);
    updateAppGeneralConfig(next);
    setHasUnsavedChanges(false);
    showFeedback('SEO preenchido automaticamente e salvo no banco de dados!');
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppGeneralConfig(form);
    setHasUnsavedChanges(false);
    showFeedback('Configurações gerais, redes sociais, WhatsApp e SEO salvas no banco MySQL!');
  };

  const handleResetDefaults = () => {
    resetAppGeneralConfig();
    setHasUnsavedChanges(false);
    showFeedback('Configurações gerais e SEO restauradas para o padrão do sistema.');
  };

  const whatsappDirectUrl = normalizeWhatsappUrl(form.whatsappNumber, form.whatsappDefaultMessage);
  const titleLen = form.seoTitle.trim().length;
  const descLen = form.seoDescription.trim().length;
  const titleIdeal = titleLen >= 30 && titleLen <= 60;
  const descIdeal = descLen >= 120 && descLen <= 160;
  const previewUrl =
    form.canonicalUrl.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://achenacidade.com.br');

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Top Banner + Save Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-blue-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300 mb-1">
            <Globe className="w-4 h-4" />
            <span>Configurações Gerais, WhatsApp, Redes Sociais & SEO</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black font-display">
            Central de Identidade, Canais Oficiais & Otimização Google (SEO)
          </h3>
          <p className="text-xs text-blue-100 max-w-2xl mt-1">
            Cadastre os canais de atendimento do portal, link do grupo oficial de WhatsApp, redes sociais e metadados de SEO. Todas as alterações são sincronizadas automaticamente no banco MySQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{hasUnsavedChanges ? 'Salvar Alterações *' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Database Sync Status Strip */}
      <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Database className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Persistência MySQL (<code className="font-mono">app_settings.appGeneralConfig</code>):
          </span>
          <span
            className={`font-bold ${
              dbSyncStatus === 'connected'
                ? 'text-emerald-600 dark:text-emerald-400'
                : dbSyncStatus === 'error'
                ? 'text-rose-600'
                : 'text-amber-600'
            }`}
          >
            {dbSyncStatus === 'connected'
              ? 'Conectado e Sincronizado'
              : dbSyncStatus === 'error'
              ? 'Erro ao sincronizar'
              : 'Modo Local / Verificando'}
          </span>
        </div>
        {hasUnsavedChanges && (
          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Alterações pendentes — clique em Salvar Configurações
          </span>
        )}
      </div>

      {/* SECTION 1: Identidade, WhatsApp Oficial & Grupo do WhatsApp */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Identidade do App, WhatsApp & Grupo Oficial
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exibido no rodapé, páginas de lançamento/manutenção e links oficiais de contato.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome Oficial do App
            </label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => updateField('appName', e.target.value)}
              placeholder="achenacidade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Slogan / Subtítulo do Portal
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => updateField('tagline', e.target.value)}
              placeholder="Guia Comercial & Vitrine de Lojas Locais"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>Cidade / Região Principal</span>
            </label>
            <input
              type="text"
              value={form.cityLabel}
              onChange={(e) => updateField('cityLabel', e.target.value)}
              placeholder="Alagoinhas - BA"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>E-mail Oficial de Contato</span>
            </label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              placeholder="contato@achenacidade.com.br"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp Oficial do App (DDD + Número)
            </label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => updateField('whatsappNumber', e.target.value)}
              placeholder="75999990000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
            />
            {whatsappDirectUrl && (
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Testar link wa.me do atendimento</span>
              </a>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mensagem Padrão ao Abrir WhatsApp do App
            </label>
            <input
              type="text"
              value={form.whatsappDefaultMessage}
              onChange={(e) => updateField('whatsappDefaultMessage', e.target.value)}
              placeholder="Olá! Vim pelo portal achenacidade e gostaria de atendimento."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Link do Grupo de WhatsApp do App</span>
            </label>
            <input
              type="url"
              value={form.whatsappGroupUrl}
              onChange={(e) => updateField('whatsappGroupUrl', e.target.value)}
              placeholder="https://chat.whatsapp.com/AbCdEfGhIjKlMnOp"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Cole o link de convite oficial do grupo ou comunidade de ofertas no WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Texto do Botão do Grupo no WhatsApp
            </label>
            <input
              type="text"
              value={form.whatsappGroupLabel}
              onChange={(e) => updateField('whatsappGroupLabel', e.target.value)}
              placeholder="Entrar no Grupo de Ofertas no WhatsApp"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Redes Sociais Oficiais */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              2. Redes Sociais Oficiais do App
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Links exibidos no rodapé e incorporados nos dados estruturados (Schema.org) do Google.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              <span>Instagram</span>
            </label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => updateField('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/achenacidade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Facebook className="w-3.5 h-3.5 text-blue-600" />
              <span>Facebook</span>
            </label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) => updateField('facebookUrl', e.target.value)}
              placeholder="https://facebook.com/achenacidade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-600" />
              <span>YouTube</span>
            </label>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => updateField('youtubeUrl', e.target.value)}
              placeholder="https://youtube.com/@achenacidade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>TikTok</span>
            </label>
            <input
              type="url"
              value={form.tiktokUrl}
              onChange={(e) => updateField('tiktokUrl', e.target.value)}
              placeholder="https://tiktok.com/@achenacidade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-sky-700" />
              <span>LinkedIn</span>
            </label>
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => updateField('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/company/achenacidade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Site Institucional / Domínio</span>
            </label>
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(e) => updateField('websiteUrl', e.target.value)}
              placeholder="https://achenacidade.com.br"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: SEO, OpenGraph & Preenchimento Automático */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                3. SEO Automático, OpenGraph & Google Search
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualiza dinamicamente <code className="font-mono">&lt;title&gt;</code>, <code className="font-mono">og:*</code>, <code className="font-mono">twitter:*</code>, <code className="font-mono">canonical</code> e <code className="font-mono">JSON-LD</code>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoFillSeo}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Preencher SEO Automaticamente</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SEO Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Título SEO (<code className="font-mono">&lt;title&gt;</code> &amp; <code className="font-mono">og:title</code>)
                </label>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    titleIdeal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {titleLen} / 60 caracteres {titleIdeal ? '· Ideal (30-60)' : '· Recomendado 30-60'}
                </span>
              </div>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => updateField('seoTitle', e.target.value)}
                placeholder="achenacidade — Guia Comercial, Lojas e Ofertas Locais"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Descrição SEO (<code className="font-mono">meta description</code> &amp; <code className="font-mono">og:description</code>)
                </label>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    descIdeal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {descLen} / 160 caracteres {descIdeal ? '· Ideal (120-160)' : '· Recomendado 120-160'}
                </span>
              </div>
              <textarea
                rows={3}
                value={form.seoDescription}
                onChange={(e) => updateField('seoDescription', e.target.value)}
                placeholder="Encontre empresas, produtos e serviços na sua cidade. Fale direto pelo WhatsApp com lojas locais e aproveite ofertas exclusivas."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Palavras-chave (separadas por vírgula)
              </label>
              <input
                type="text"
                value={form.seoKeywords}
                onChange={(e) => updateField('seoKeywords', e.target.value)}
                placeholder="achenacidade, guia comercial, empresas, lojas locais, whatsapp"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Canônica (Opcional)
                </label>
                <input
                  type="url"
                  value={form.canonicalUrl}
                  onChange={(e) => updateField('canonicalUrl', e.target.value)}
                  placeholder="https://achenacidade.com.br/"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Twitter / X Handle
                </label>
                <input
                  type="text"
                  value={form.twitterHandle}
                  onChange={(e) => updateField('twitterHandle', e.target.value)}
                  placeholder="@achenacidade"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Código Google Search Console
                </label>
                <input
                  type="text"
                  value={form.googleSiteVerification}
                  onChange={(e) => updateField('googleSiteVerification', e.target.value)}
                  placeholder="google-site-verification token"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                    Indexar no Google (<code className="font-mono">robots</code>)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {form.robotsIndex ? 'index, follow' : 'noindex, nofollow'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.robotsIndex}
                  onChange={(e) => updateField('robotsIndex', e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Right Column: OG Image + Live Google & WhatsApp Share Preview */}
          <div className="lg:col-span-5 space-y-5">
            <ImageUploadField
              label="Imagem de Compartilhamento (og:image)"
              helpText="Exibida ao compartilhar o link no WhatsApp, Facebook e Instagram (recomendado 1200×630)."
              value={form.ogImageUrl}
              onChange={(url) => updateField('ogImageUrl', url)}
              aspectRatio="banner"
            />

            {/* Google Search Snippet Preview */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Pré-visualização no Google
              </p>
              <p className="text-xs text-slate-500 truncate">{previewUrl}</p>
              <h5 className="text-base font-semibold text-blue-700 dark:text-blue-400 leading-snug line-clamp-2">
                {form.seoTitle || 'achenacidade — Guia Comercial, Lojas e Ofertas Locais'}
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                {form.seoDescription ||
                  'Encontre empresas, produtos e serviços na sua cidade. Fale direto pelo WhatsApp com lojas locais.'}
              </p>
            </div>

            {/* WhatsApp / OpenGraph Card Preview */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span>Card OpenGraph (WhatsApp / Facebook)</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  JSON-LD Ativo
                </span>
              </div>
              {form.ogImageUrl && (
                <div className="h-32 bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={form.ogImageUrl}
                    alt="Prévia OpenGraph"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-3.5 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  {form.appName || 'achenacidade'}
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {form.seoTitle}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {form.seoDescription}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Save Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ao salvar, os dados são gravados na tabela <code className="font-mono">app_settings</code> do MySQL e aplicados imediatamente em todo o portal.
          </p>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-extrabold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações no Banco</span>
          </button>
        </div>
      </div>
    </form>
  );
};
