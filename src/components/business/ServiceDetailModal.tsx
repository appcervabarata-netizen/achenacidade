import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  formatServicePrice,
  getServiceModeLabel,
  getServicePriceTypeLabel,
  getServiceWhatsAppMessage,
} from '../../utils/serviceFormatters';
import {
  X,
  MessageCircle,
  MapPin,
  Wrench,
  Clock,
  ChevronRight,
  Heart,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { normalizeWhatsappUrl } from '../../utils/seoHelper';
import { getBusinessLogoUrl } from '../../utils/businessMedia';

export const ServiceDetailModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    services,
    businesses,
    cities,
    openModal,
    toggleFavoriteService,
    isServiceFavorite,
    trackBusinessMetric,
  } = useDirectory();

  if (activeModal.type !== 'service_detail' || !activeModal.id) {
    return null;
  }

  const service = services.find((s) => s.id === activeModal.id);
  if (!service) return null;

  const business = businesses.find((b) => b.id === service.businessId);
  const city = cities.find((c) => c.id === service.cityId);

  const whatsappLink = business
    ? normalizeWhatsappUrl(
        business.whatsapp,
        getServiceWhatsAppMessage(service, business.name)
      )
    : '';

  const isFav = isServiceFavorite(service.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Floating Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => toggleFavoriteService(service.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-md ${
              isFav ? 'bg-white text-rose-600' : 'bg-black/50 hover:bg-black/80 text-white'
            }`}
            title={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
          </button>

          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer shadow-md"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1">
          {/* Main Service Image */}
          <div className="relative aspect-16/10 bg-slate-100 dark:bg-slate-800 overflow-hidden">
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950 dark:to-slate-900 text-indigo-500">
                <Wrench className="w-12 h-12 mb-2 opacity-70" />
                <span className="text-sm font-bold">{service.name}</span>
              </div>
            )}

            {service.featured && (
              <span className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-md">
                Serviço em Destaque
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Title, Unboxed Metadata & Price */}
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">
                <Wrench className="w-3.5 h-3.5" />
                <span>{service.category || 'Serviço Geral'}</span>
                <span aria-hidden="true">·</span>
                <span>{city?.name}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                {service.name}
              </h2>

              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatServicePrice(service)}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ({getServicePriceTypeLabel(service.priceType)})
                </span>
              </div>
            </div>

            {/* Structured Service Specs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Modalidade</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  {getServiceModeLabel(service.serviceMode)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Duração Estimada</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {service.duration || 'Sob consulta'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Cobrança</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {getServicePriceTypeLabel(service.priceType)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                O que está incluso no Serviço
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>

            {/* Provider Card */}
            {business && (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 flex items-center justify-center">
                    {getBusinessLogoUrl(business) ? (
                      <img
                        src={getBusinessLogoUrl(business)}
                        alt={business.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-300 tracking-wider">
                      Serviço Prestado por
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {business.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {business.neighborhood}, {city?.name}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openModal('business_detail', business.id)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver empresa</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Direct WhatsApp CTA */}
            {business && whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackBusinessMetric(business.id, 'whatsapp_click')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>
                  {service.priceType === 'quote'
                    ? 'Solicitar Orçamento no WhatsApp'
                    : 'Agendar ou Contratar no WhatsApp'}
                </span>
              </a>
            )}

            <div className="text-center text-[11px] text-slate-400">
              Atendimento e combinação de horário direto com o profissional sem taxas extras.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
