import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { RotatingBanner } from '../common/RotatingBanner';
import {
  Building2,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  Heart,
  PlusCircle,
  ExternalLink,
  X,
  Store,
  Award,
} from 'lucide-react';
import { isFounderPlan, isVipPlan } from '../../utils/planPricing';
import { getBusinessCoverUrl, getBusinessLogoUrl } from '../../utils/businessMedia';

export const StoresPage: React.FC = () => {
  const {
    cities,
    selectedCityId,
    setSelectedCityId,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    searchCompanyQuery,
    setSearchCompanyQuery,
    filteredBusinesses,
    plans,
    openModal,
    toggleFavoriteBusiness,
    isBusinessFavorite,
    setCurrentView,
    trackBusinessMetric,
  } = useDirectory();

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || 'Geral';
  };

  const getPlan = (planId: string) => {
    return plans.find((p) => p.id === planId);
  };

  const handleWhatsAppClick = (e: React.MouseEvent, businessId: string, whatsapp: string, name: string) => {
    e.stopPropagation();
    trackBusinessMetric(businessId, 'whatsapp_click');
    const cleanNumber = whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Encontrei a ${name} no portal Achenacidade e gostaria de informações.`
    );
    window.open(`https://wa.me/55${cleanNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-12">
      {/* Upper Rotating Ad Banner (Admin-managed & separately billed) */}
      <RotatingBanner position="rotating_header" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* Header with Title and "Anunciar" CTA (Hidden on mobile for clean native app appearance) */}
        <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Guia Comercial de Lojas</span>
            </div>
            <h1 className="hidden sm:block text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              Lojas e Empresas Cadastradas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'estabelecimento encontrado' : 'estabelecimentos encontrados'}
            </p>
          </div>

          {/* Anunciar button -> leads to register_store on desktop, hidden on mobile */}
          <button
            onClick={() => setCurrentView('register_store')}
            className="hidden sm:flex self-start sm:self-auto items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Anunciar Minha Loja</span>
          </button>
        </div>

        {/* Filters Bar: City Select + Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
          {/* City filter (Hidden on mobile to prioritize instant search, city is selected in top header) */}
          <div className="hidden sm:flex sm:col-span-4 items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xs">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Todas as Cidades</option>
              {cities.filter((c) => c.isActive).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.state}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-8 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchCompanyQuery}
              onChange={(e) => setSearchCompanyQuery(e.target.value)}
              placeholder="Pesquisar por nome da empresa, categoria ou bairro..."
              className="w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            {searchCompanyQuery && (
              <button
                onClick={() => setSearchCompanyQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            Todas as Categorias
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap cursor-pointer shrink-0 ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Businesses Grid (2 cols on mobile, 3 cols on desktop) */}
        {filteredBusinesses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nenhuma empresa encontrada
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Tente mudar a cidade, categoria ou limpar o termo de pesquisa.
            </p>
            <button
              onClick={() => {
                setSelectedCityId('all');
                setSelectedCategoryId('all');
                setSearchCompanyQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {filteredBusinesses.map((biz) => {
              const isFav = isBusinessFavorite(biz.id);
              const plan = getPlan(biz.planId);
              const founder = isFounderPlan(plan);
              const vip = isVipPlan(plan);
              const coverSrc = getBusinessCoverUrl(biz);
              const logoSrc = getBusinessLogoUrl(biz);

              return (
                <div
                  key={biz.id}
                  onClick={() => openModal('business_detail', biz.id)}
                  className={`group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between ${
                    founder
                      ? 'border-amber-400 dark:border-amber-700 hover:border-amber-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                  }`}
                >
                  <div>
                    {/* Cover image with favorite button and VIP badge */}
                    <div className="relative h-24 sm:h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt={biz.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 flex items-center justify-center">
                          <Store className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400/80" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteBusiness(biz.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-xs transition"
                        title={isFav ? 'Remover dos favoritos' : 'Salvar empresa'}
                      >
                        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                      </button>

                      {/* VIP / Founder Seal Badge */}
                      <div className="absolute bottom-2 left-2">
                        {founder ? (
                          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs">
                            <Award className="w-3 h-3" />
                            Sócio Fundador VIP
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-white backdrop-blur-xs ${
                              vip ? 'bg-blue-600/95' : 'bg-slate-800/85'
                            }`}
                          >
                            {plan?.badge || 'Padrão'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="p-2.5 sm:p-4">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600">
                              {biz.name}
                            </h3>
                            {biz.isVerified && (
                              <span title="Empresa Verificada">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block truncate">
                            {getCategoryName(biz.categoryId)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {biz.description}
                      </p>

                      <div className="mt-2 text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                        <span className="truncate">{biz.neighborhood}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-2.5 sm:p-4 pt-0">
                    {biz.whatsapp ? (
                      <button
                        onClick={(e) => handleWhatsAppClick(e, biz.id, biz.whatsapp, biz.name)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    ) : biz.phone ? (
                      <a
                        href={`tel:${biz.phone.replace(/\D/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ligar</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver Detalhes</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
