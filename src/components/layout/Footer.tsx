import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  Store,
  MapPin,
  Building2,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  Users,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  Share2,
  Mail,
} from 'lucide-react';
import { normalizeWhatsappUrl } from '../../utils/seoHelper';

export const Footer: React.FC = () => {
  const {
    cities,
    setSelectedCityId,
    openModal,
    setCurrentView,
    appGeneralConfig,
    loginDemoStoreOwner,
  } = useDirectory();

  const handleAutoStoreOwnerAccess = async () => {
    const res = await loginDemoStoreOwner();
    if (!res.success) {
      setCurrentView('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCities = cities.filter((c) => c.isActive);
  const whatsappDirectUrl = normalizeWhatsappUrl(
    appGeneralConfig.whatsappNumber,
    appGeneralConfig.whatsappDefaultMessage
  );
  const hasWhatsappGroup = /^https?:\/\//i.test((appGeneralConfig.whatsappGroupUrl || '').trim());

  const socialLinks = [
    { label: 'Instagram', url: appGeneralConfig.instagramUrl, icon: Instagram },
    { label: 'Facebook', url: appGeneralConfig.facebookUrl, icon: Facebook },
    { label: 'YouTube', url: appGeneralConfig.youtubeUrl, icon: Youtube },
    { label: 'TikTok', url: appGeneralConfig.tiktokUrl, icon: Share2 },
    { label: 'LinkedIn', url: appGeneralConfig.linkedinUrl, icon: Linkedin },
    { label: 'Site Oficial', url: appGeneralConfig.websiteUrl, icon: Globe },
  ].filter((item) => /^https?:\/\//i.test((item.url || '').trim()));

  return (
    <footer className="hidden md:block bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand info + Social Icons */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                {(appGeneralConfig.appName || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="text-lg font-bold text-white font-display">
                {appGeneralConfig.appName === 'achenacidade' || !appGeneralConfig.appName ? (
                  <>
                    achena<span className="text-orange-500">cidade</span>
                  </>
                ) : (
                  appGeneralConfig.appName
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {appGeneralConfig.tagline ||
                'Plataforma e PWA de diretório comercial municipal. Conectando consumidores às melhores empresas e vitrines de produtos por cidades.'}
            </p>
            {appGeneralConfig.contactEmail?.trim() && (
              <a
                href={`mailto:${appGeneralConfig.contactEmail.trim()}`}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white transition"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{appGeneralConfig.contactEmail.trim()}</span>
              </a>
            )}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cidades em destaque */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Cidades Atendidas
            </h4>
            <ul className="space-y-1.5">
              {activeCities.slice(0, 6).map((city) => (
                <li key={city.id}>
                  <button
                    onClick={() => {
                      setSelectedCityId(city.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                    <span>{city.name} - {city.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Navegação
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a href="#empresas" className="hover:text-white transition flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>Diretório de Empresas</span>
                </a>
              </li>
              <li>
                <a href="#produtos" className="hover:text-white transition flex items-center gap-1.5">
                  <ShoppingBag className="w-3 h-3 text-orange-500 shrink-0" />
                  <span>Vitrine de Produtos</span>
                </a>
              </li>
              <li>
                <a href="#planos" className="hover:text-white transition flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Planos para Anunciantes</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => openModal('favorites')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-rose-500">♥</span>
                  <span>Meus Favoritos Salvos</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('register_store');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition text-left cursor-pointer"
                >
                  Cadastrar Minha Loja
                </button>
              </li>
            </ul>
          </div>

          {/* Portal do Lojista + WhatsApp & Grupo */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Para Empresas & Comunidade
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Gerencie os produtos, serviços, horários e promoções da sua loja no portal.
            </p>
            <div className="flex flex-col items-start gap-2">
              <button
                onClick={() => void handleAutoStoreOwnerAccess()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition border border-slate-700 cursor-pointer text-xs"
                title="Acessar a área do lojista automaticamente"
              >
                <Store className="w-3.5 h-3.5 text-orange-400" />
                <span>Área do Lojista (Acesso Automático)</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('login');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2 transition cursor-pointer"
              >
                Entrar com e-mail e senha
              </button>

              {whatsappDirectUrl && (
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold transition border border-emerald-700/50 text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Atendimento WhatsApp</span>
                </a>
              )}

              {hasWhatsappGroup && (
                <a
                  href={appGeneralConfig.whatsappGroupUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 font-semibold transition border border-blue-600/40 text-xs"
                >
                  <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{appGeneralConfig.whatsappGroupLabel || 'Grupo de WhatsApp'}</span>
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} {appGeneralConfig.appName || 'achenacidade'} — Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
            <span>{appGeneralConfig.cityLabel || 'Alagoinhas - BA'}</span>
            <span>·</span>
            <span>PWA Instalável</span>
            <span>·</span>
            <span>Diretório Comercial</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

