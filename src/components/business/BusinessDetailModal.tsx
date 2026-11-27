import React, { useState, useEffect } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  X,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Globe,
  Instagram,
  Facebook,
  Mail,
  ExternalLink,
  CheckCircle2,
  Package,
  Wrench,
  Heart,
  Bell,
  BellRing,
  Award,
  Building2,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { isFounderPlan } from '../../utils/planPricing';
import { formatServicePrice, getServiceModeLabel, getServiceWhatsAppMessage } from '../../utils/serviceFormatters';
import { getBusinessCoverUrl, getBusinessLogoUrl } from '../../utils/businessMedia';
import {
  normalizeWhatsappUrl,
  formatInstagramUrl,
  formatInstagramLabel,
  formatFacebookUrl,
  formatWebsiteUrl,
  formatTelHref,
  formatMailtoHref,
  formatMapsSearchUrl,
} from '../../utils/seoHelper';

export const BusinessDetailModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    businesses,
    cities,
    categories,
    plans,
    products,
    services,
    openModal,
    toggleFavoriteBusiness,
    isBusinessFavorite,
    toggleFavoriteProduct,
    isProductFavorite,
    toggleFavoriteService,
    isServiceFavorite,
    pushPreferences,
    enablePushNotifications,
    trackBusinessMetric,
    appGeneralConfig,
    siteModeConfig,
  } = useDirectory();

  const [coverError, setCoverError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const selectedBusinessId = activeModal.type === 'business_detail' ? activeModal.id : undefined;
  useEffect(() => {
    setCoverError(false);
    setLogoError(false);
  }, [selectedBusinessId]);

  if (activeModal.type !== 'business_detail' || !activeModal.id) {
    return null;
  }

  const business = businesses.find((b) => b.id === activeModal.id);
  if (!business) return null;

  const city = cities.find((c) => c.id === business.cityId);
  const category = categories.find((c) => c.id === business.categoryId);
  const storePlan = plans.find((p) => p.id === business.planId);
  const isFounderStore = isFounderPlan(storePlan);
  const storeProducts = products.filter(
    (p) => p.businessId === business.id && p.isActive
  );
  const storeServices = services.filter(
    (s) => s.businessId === business.id && s.isActive
  );

  const coverSrc = getBusinessCoverUrl(business);
  const logoSrc = getBusinessLogoUrl(business);

  const phoneHref = formatTelHref(business.phone);
  const mailtoHref = formatMailtoHref(business.email);
  const instagramHref = formatInstagramUrl(business.instagram);
  const instagramLabel = formatInstagramLabel(business.instagram);
  const facebookHref = formatFacebookUrl(business.facebook);
  const websiteHref = formatWebsiteUrl(business.website);
  const mapsHref = formatMapsSearchUrl([
    business.address,
    business.neighborhood,
    city?.name,
    city?.state,
  ]);
  const mainWhatsappHref = normalizeWhatsappUrl(
    business.whatsapp,
    `Olá! Encontrei o perfil da ${business.name} no achenacidade e gostaria de atendimento.`
  );

  const adminWhatsappRaw =
    (appGeneralConfig.whatsappNumber || siteModeConfig.launch.whatsappNumber || '').trim();
  const claimWhatsappHref = normalizeWhatsappUrl(
    adminWhatsappRaw,
    `Olá! Sou responsável pela empresa "${business.name}" (${
      city ? `${city.name} - ${city.state}` : appGeneralConfig.cityLabel || 'Alagoinhas - BA'
    }) e gostaria de verificar meu perfil e solicitar e-mail e senha para administrá-la no ${
      appGeneralConfig.appName || 'achenacidade'
    }.`
  );
  const showClaimSection = !business.isVerified;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header / Cover */}
        <div className="relative h-44 sm:h-56 bg-slate-900 shrink-0">
          {coverSrc && !coverError ? (
            <img
              src={coverSrc}
              alt={business.name}
              className="w-full h-full object-cover opacity-75"
              referrerPolicy="no-referrer"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 flex items-center justify-center">
              <Building2 className="w-14 h-14 text-slate-600/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top action buttons */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={async () => {
                if (!isBusinessFavorite(business.id)) {
                  toggleFavoriteBusiness(business.id);
                }
                if (!pushPreferences.enabled) {
                  await enablePushNotifications();
                } else {
                  openModal('notifications');
                }
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-md ${
                pushPreferences.enabled && isBusinessFavorite(business.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-black/50 hover:bg-black/80 text-white'
              }`}
              title={
                pushPreferences.enabled && isBusinessFavorite(business.id)
                  ? 'Alertas push ativos para esta empresa'
                  : 'Receber alertas push de ofertas e serviços desta loja'
              }
            >
              {pushPreferences.enabled && isBusinessFavorite(business.id) ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => toggleFavoriteBusiness(business.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-md ${
                isBusinessFavorite(business.id)
                  ? 'bg-white text-rose-600'
                  : 'bg-black/50 hover:bg-black/80 text-white'
              }`}
              title={isBusinessFavorite(business.id) ? 'Remover dos favoritos' : 'Salvar empresa nos favoritos'}
            >
              <Heart className={`w-4 h-4 ${isBusinessFavorite(business.id) ? 'fill-rose-600' : ''}`} />
            </button>

            <button
              onClick={closeModal}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer shadow-md"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Info inside Cover */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
            {logoSrc && !logoError ? (
              <img
                src={logoSrc}
                alt={business.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 border-white dark:border-slate-900 shadow-lg bg-white shrink-0"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-3 border-white dark:border-slate-900 shadow-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Building2 className="w-9 h-9 text-slate-300" />
              </div>
            )}
            <div className="text-white min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold truncate font-display">
                  {business.name}
                </h2>
                {business.isVerified && (
                  <span title="Empresa Verificada">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                  </span>
                )}
                {isFounderStore && (
                  <span
                    title="Selo Exclusivo Sócio Fundador"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shrink-0"
                  >
                    <Award className="w-3 h-3" />
                    Sócio Fundador VIP
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{category?.name}</span>
                <span>·</span>
                <span>{city?.name} - {city?.state}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          {/* Quick Contact & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
              {business.phone && phoneHref && (
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition"
                  title="Ligar para este telefone"
                >
                  <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{business.phone}</span>
                </a>
              )}
              {business.email && mailtoHref && (
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition"
                  title="Enviar e-mail"
                >
                  <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>{business.email}</span>
                </a>
              )}
              {business.instagram && instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-pink-600 dark:text-pink-400 hover:underline transition"
                  title="Abrir Instagram da loja"
                >
                  <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
                  <span>{instagramLabel}</span>
                </a>
              )}
              {business.facebook && facebookHref && (
                <a
                  href={facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
                  title="Abrir Facebook da loja"
                >
                  <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Facebook</span>
                </a>
              )}
              {business.website && websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
                  title="Visitar site oficial"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>Site Oficial</span>
                </a>
              )}
            </div>

            {mainWhatsappHref && (
              <a
                href={mainWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackBusinessMetric(business.id, 'whatsapp_click')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chamar no WhatsApp</span>
              </a>
            )}
          </div>

          {/* Details & Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Sobre a Empresa
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {business.description}
              </p>
            </div>

            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  Endereço
                </span>
                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-block text-left hover:text-blue-600 dark:hover:text-blue-400 transition"
                    title="Abrir localização no Google Maps"
                  >
                    <p className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline">
                      {business.address ? `${business.address}${business.neighborhood ? ` - ${business.neighborhood}` : ''}` : business.neighborhood}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {city?.name} - {city?.state}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      <span>Ver no mapa</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                ) : (
                  <>
                    <p className="text-slate-600 dark:text-slate-400">
                      {business.address} - {business.neighborhood}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      {city?.name} - {city?.state}
                    </p>
                  </>
                )}
              </div>

              {business.weeklySchedule && business.weeklySchedule.length > 0 ? (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Horário por Dia da Semana
                  </span>
                  <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px]">
                    {business.weeklySchedule.map((s) => (
                      <div key={s.day} className="flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{s.day}:</span>
                        <span className={s.isOpen ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-400 italic'}>
                          {s.isOpen ? `${s.openTime} às ${s.closeTime}` : 'Fechado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : business.openingHours ? (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Horário de Funcionamento
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {business.openingHours}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Store Products Showcase (Only shown when registered products exist) */}
          {storeProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                    Produtos da Loja ({storeProducts.length})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {storeProducts.map((prod) => {
                  const prodWhatsappHref = normalizeWhatsappUrl(
                    business.whatsapp,
                    `Olá! Vi o produto "${prod.name}" no achenacidade e gostaria de comprar.`
                  );

                  return (
                    <div
                      key={prod.id}
                      className="group bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition"
                    >
                      <div
                        className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-700 cursor-pointer"
                        onClick={() => openModal('product_detail', prod.id)}
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteProduct(prod.id);
                          }}
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition shadow-xs cursor-pointer ${
                            isProductFavorite(prod.id)
                              ? 'bg-white text-rose-600 shadow-sm'
                              : 'bg-black/40 hover:bg-black/60 text-white'
                          }`}
                          title={isProductFavorite(prod.id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isProductFavorite(prod.id) ? 'fill-rose-600' : ''}`} />
                        </button>
                      </div>
                      <div className="p-3.5">
                        <h4
                          onClick={() => openModal('product_detail', prod.id)}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-orange-600 cursor-pointer"
                        >
                          {prod.name}
                        </h4>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                            {formatPrice(prod.price)}
                          </span>
                          {prodWhatsappHref && (
                            <a
                              href={prodWhatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackBusinessMetric(business.id, 'whatsapp_click')}
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Pedir</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Store Services Showcase (Only shown when registered services exist) */}
          {storeServices.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                    Serviços Oferecidos ({storeServices.length})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {storeServices.map((serv) => {
                  const servWhatsappHref = normalizeWhatsappUrl(
                    business.whatsapp,
                    getServiceWhatsAppMessage(serv, business.name)
                  );

                  return (
                    <div
                      key={serv.id}
                      className="group bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition"
                    >
                      <div
                        className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-700 cursor-pointer"
                        onClick={() => openModal('service_detail', serv.id)}
                      >
                        <img
                          src={serv.imageUrl}
                          alt={serv.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteService(serv.id);
                          }}
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition shadow-xs cursor-pointer ${
                            isServiceFavorite(serv.id)
                              ? 'bg-white text-rose-600 shadow-sm'
                              : 'bg-black/40 hover:bg-black/60 text-white'
                          }`}
                          title={isServiceFavorite(serv.id) ? 'Remover dos favoritos' : 'Salvar serviço nos favoritos'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isServiceFavorite(serv.id) ? 'fill-rose-600' : ''}`} />
                        </button>
                      </div>
                      <div className="p-3.5">
                        <h4
                          onClick={() => openModal('service_detail', serv.id)}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 cursor-pointer"
                        >
                          {serv.name}
                        </h4>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{getServiceModeLabel(serv.serviceMode)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                            <Clock className="w-3 h-3" />
                            {serv.duration}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                            {formatServicePrice(serv)}
                          </span>
                          {servWhatsappHref && (
                            <a
                              href={servWhatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackBusinessMetric(business.id, 'whatsapp_click')}
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Orçar</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Owner Claim / Verifique sua empresa */}
          {showClaimSection && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-gradient-to-br from-amber-50 via-white to-orange-50/70 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                      Verifique sua empresa
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-display">
                      Esta empresa é sua? Venha administrá-la!
                    </h4>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Fale com a nossa equipe pelo WhatsApp para comprovar que você representa a{' '}
                    <strong className="text-slate-800 dark:text-white">{business.name}</strong>. Nós criamos seu e-mail e
                    senha de acesso para você ou sua equipe gerenciar o perfil, atualizar fotos e cadastrar produtos e serviços.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                {claimWhatsappHref && (
                  <a
                    href={claimWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Assumir Empresa no WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => openModal('business_portal')}
                  className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Já tenho e-mail e senha · Acessar Painel</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
