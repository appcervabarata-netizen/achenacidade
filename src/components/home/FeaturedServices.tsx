import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  formatServicePrice,
  getServiceModeLabel,
  getServiceWhatsAppMessage,
} from '../../utils/serviceFormatters';
import {
  Wrench,
  MessageCircle,
  Building2,
  Clock,
  MapPin,
  Heart,
  ArrowRight,
  X,
} from 'lucide-react';

export const FeaturedServices: React.FC = () => {
  const {
    filteredServices,
    businesses,
    selectedCity,
    searchServiceQuery,
    setSearchServiceQuery,
    openModal,
    toggleFavoriteService,
    isServiceFavorite,
    setCurrentView,
    trackBusinessMetric,
  } = useDirectory();

  const getBusiness = (businessId: string) => {
    return businesses.find((b) => b.id === businessId);
  };

  const showcaseServices = filteredServices.slice(0, 8);

  return (
    <section
      id="servicos"
      className="py-10 sm:py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <Wrench className="w-4 h-4" />
              <span>Vitrine Local de Serviços</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
              Serviços e Profissionais em {selectedCity ? selectedCity.name : 'Destaque'}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Solicite orçamentos, agendamentos e atendimento direto com prestadores da sua cidade
            </p>
          </div>

          <div className="flex items-center gap-3">
            {searchServiceQuery && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg text-xs text-indigo-800 dark:text-indigo-300">
                <span>
                  Buscando: <strong>"{searchServiceQuery}"</strong>
                </span>
                <button
                  onClick={() => setSearchServiceQuery('')}
                  className="hover:text-indigo-950 dark:hover:text-white p-0.5 cursor-pointer"
                  title="Limpar busca de serviços"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setCurrentView('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Ver Todos os Serviços ({filteredServices.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Services Grid */}
        {showcaseServices.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {showcaseServices.map((serv) => {
              const business = getBusiness(serv.businessId);
              const isFav = isServiceFavorite(serv.id);

              return (
                <div
                  key={serv.id}
                  onClick={() => openModal('service_detail', serv.id)}
                  className="group bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div>
                    {/* 4:3 Image Frame */}
                    <div className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {serv.imageUrl ? (
                        <img
                          src={serv.imageUrl}
                          alt={serv.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950 dark:to-slate-900 text-indigo-500 p-4 text-center">
                          <Wrench className="w-8 h-8 mb-1 opacity-70" />
                          <span className="text-[11px] font-semibold line-clamp-1">{serv.name}</span>
                        </div>
                      )}

                      {serv.featured && (
                        <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                          Destaque
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteService(serv.id);
                        }}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition shadow-xs cursor-pointer ${
                          isFav
                            ? 'bg-white text-rose-600 shadow-md'
                            : 'bg-black/45 hover:bg-black/65 text-white'
                        }`}
                        title={isFav ? 'Remover dos favoritos' : 'Salvar serviço nos favoritos'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-600' : ''}`} />
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 sm:p-4">
                      {business && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('business_detail', business.id);
                          }}
                          className="flex items-center gap-1 text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline truncate mb-1"
                        >
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{business.name}</span>
                        </div>
                      )}

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {serv.name}
                      </h3>

                      {/* Unboxed clean metadata with typographic separator */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                          {getServiceModeLabel(serv.serviceMode)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          {serv.duration}
                        </span>
                      </div>

                      {/* Price / Quote indicator */}
                      <div className="mt-2 sm:mt-3">
                        <span
                          className={`text-xs sm:text-base font-extrabold font-mono tabular-nums ${
                            serv.priceType === 'quote'
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {formatServicePrice(serv)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp CTA */}
                  <div className="p-3 sm:p-4 pt-0">
                    {business ? (
                      <a
                        href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          getServiceWhatsAppMessage(serv, business.name)
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          trackBusinessMetric(business.id, 'whatsapp_click');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">
                          {serv.priceType === 'quote' ? 'Pedir Orçamento' : 'Contratar no Zap'}
                        </span>
                        <span className="sm:hidden">Orçamento</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => openModal('service_detail', serv.id)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                      >
                        Ver detalhes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhum serviço encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Tente limpar o termo de pesquisa ou conferir os serviços disponíveis em todas as cidades.
            </p>
            {searchServiceQuery && (
              <button
                onClick={() => setSearchServiceQuery('')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
              >
                Limpar pesquisa de serviços
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
