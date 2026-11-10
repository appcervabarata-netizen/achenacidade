import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  Building2,
  MapPin,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Package,
  X,
  Heart,
} from 'lucide-react';

export const FeaturedBusinesses: React.FC = () => {
  const {
    filteredBusinesses,
    cities,
    categories,
    plans,
    selectedCity,
    searchCompanyQuery,
    setSearchCompanyQuery,
    openModal,
    getBusinessProductCount,
    toggleFavoriteBusiness,
    isBusinessFavorite,
  } = useDirectory();

  const getCityName = (cityId: string) => {
    const c = cities.find((ci) => ci.id === cityId);
    return c ? `${c.name} - ${c.state}` : '';
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((ca) => ca.id === catId);
    return cat ? cat.name : 'Comércio';
  };

  const getPlan = (planId: string) => {
    return plans.find((p) => p.id === planId);
  };

  return (
    <section id="empresas" className="py-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Diretório Comercial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              Empresas em {selectedCity ? selectedCity.name : 'todas as cidades'}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Conheça as lojas, comércios locais e prestadores de serviços cadastrados
            </p>
          </div>

          {searchCompanyQuery && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              <span>Filtrando por: <strong>"{searchCompanyQuery}"</strong></span>
              <button
                onClick={() => setSearchCompanyQuery('')}
                className="hover:text-blue-900 dark:hover:text-white p-0.5"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Businesses Grid: 2 columns on mobile, 3 on desktop */}
        {filteredBusinesses.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {filteredBusinesses.map((biz) => {
              const plan = getPlan(biz.planId);
              const productCount = getBusinessProductCount(biz.id);

              return (
                <div
                  key={biz.id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-3 sm:p-5">
                    {/* Top Row: Logo, Title & Verified */}
                    <div className="flex items-start gap-2.5 sm:gap-3.5">
                      <img
                        src={biz.logoUrl}
                        alt={biz.name}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-xs shrink-0 bg-slate-100"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=100&h=100&fit=crop&q=80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
                            {biz.name}
                          </h3>
                          {biz.isVerified && (
                            <span title="Empresa Verificada" className="shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            </span>
                          )}
                        </div>

                        {/* Unboxed Metadata */}
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          <span className="truncate">{getCategoryName(biz.categoryId)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{biz.neighborhood}</span>
                        </div>

                        {/* Plan Tag if highlighted */}
                        {plan && plan.highlighted && (
                          <div className="mt-0.5 text-[9px] sm:text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate">
                            ★ {plan.badge}
                          </div>
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteBusiness(biz.id);
                        }}
                        className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ${
                          isBusinessFavorite(biz.id)
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'
                            : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isBusinessFavorite(biz.id) ? 'Remover dos favoritos' : 'Salvar empresa nos favoritos'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            isBusinessFavorite(biz.id) ? 'fill-rose-600' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Description: Hidden on small mobile to keep 2-column cards clean */}
                    <p className="hidden sm:block mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {biz.description}
                    </p>

                    {/* Location and Products count */}
                    <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 truncate max-w-[60%]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{biz.neighborhood}</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 shrink-0">
                        <Package className="w-3 h-3 text-orange-600" />
                        <span>{productCount} prods</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-3 py-2 sm:px-5 sm:py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2">
                    <button
                      onClick={() => openModal('business_detail', biz.id)}
                      className="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 cursor-pointer py-1"
                    >
                      <span>Ver Loja</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <a
                      href={`https://wa.me/${biz.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá! Encontrei a ${biz.name} no achenacidade e gostaria de tirar uma dúvida.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Nenhuma empresa encontrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Não encontramos empresas para os filtros atuais. Experimente buscar por outro termo ou selecionar "Todas as Cidades".
            </p>
            {searchCompanyQuery && (
              <button
                onClick={() => setSearchCompanyQuery('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Limpar pesquisa de empresas
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
