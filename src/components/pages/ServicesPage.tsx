import React, { useState, useMemo } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { RotatingBanner } from '../common/RotatingBanner';
import { ServiceMode } from '../../types';
import {
  formatServicePrice,
  getServiceModeLabel,
  getServiceWhatsAppMessage,
} from '../../utils/serviceFormatters';
import {
  Wrench,
  Search,
  MapPin,
  MessageCircle,
  Heart,
  PlusCircle,
  X,
  Store,
  Clock,
  ArrowUpDown,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const {
    cities,
    selectedCityId,
    setSelectedCityId,
    searchServiceQuery,
    setSearchServiceQuery,
    filteredServices,
    businesses,
    openModal,
    toggleFavoriteService,
    isServiceFavorite,
    setCurrentView,
    trackBusinessMetric,
  } = useDirectory();

  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<'all' | ServiceMode>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'quote_first'>('default');

  const getBusiness = (businessId: string) => {
    return businesses.find((b) => b.id === businessId);
  };

  const serviceCategories = useMemo(() => {
    const unique = Array.from(
      new Set(
        filteredServices
          .map((s) => s.category?.trim())
          .filter((c): c is string => Boolean(c))
      )
    );
    return unique;
  }, [filteredServices]);

  const displayedServices = useMemo(() => {
    const list = filteredServices.filter((serv) => {
      if (selectedServiceCategory !== 'all' && serv.category !== selectedServiceCategory) {
        return false;
      }
      if (selectedMode !== 'all' && serv.serviceMode !== selectedMode) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') {
        const pa = a.priceType === 'quote' || !a.price ? Number.MAX_SAFE_INTEGER : a.price;
        const pb = b.priceType === 'quote' || !b.price ? Number.MAX_SAFE_INTEGER : b.price;
        return pa - pb;
      }
      if (sortBy === 'price_desc') {
        const pa = a.priceType === 'quote' || !a.price ? -1 : a.price;
        const pb = b.priceType === 'quote' || !b.price ? -1 : b.price;
        return pb - pa;
      }
      if (sortBy === 'quote_first') {
        if (a.priceType === 'quote' && b.priceType !== 'quote') return -1;
        if (a.priceType !== 'quote' && b.priceType === 'quote') return 1;
      }
      return 0;
    });
  }, [filteredServices, selectedServiceCategory, selectedMode, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-12">
      <RotatingBanner position="rotating_header" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* Header with Title and CTA (Hidden on mobile for clean app feel) */}
        <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>Catálogo de Serviços Locais</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              Serviços e Profissionais
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {displayedServices.length}{' '}
              {displayedServices.length === 1 ? 'serviço disponível' : 'serviços disponíveis'}
            </p>
          </div>

          <button
            onClick={() => setCurrentView('register_store')}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Meus Serviços</span>
          </button>
        </div>

        {/* Filters Bar: City + Search + Mode + Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
          {/* City Filter */}
          <div className="hidden sm:flex sm:col-span-3 items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xs">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Todas as Cidades</option>
              {cities
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.state}
                  </option>
                ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-4 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchServiceQuery}
              onChange={(e) => setSearchServiceQuery(e.target.value)}
              placeholder="Pesquisar serviço (ex: troca de tela, banho, buffet...)"
              className="w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
            {searchServiceQuery && (
              <button
                onClick={() => setSearchServiceQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Service Mode Filter */}
          <div className="sm:col-span-3 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xs">
            <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as 'all' | ServiceMode)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Todas Modalidades</option>
              <option value="on_site">Presencial no Local</option>
              <option value="home_visit">Em Domicílio</option>
              <option value="online">Online / Remoto</option>
              <option value="both">Local e Domicílio</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xs">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="default">Relevância</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="quote_first">Sob Orçamento</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            onClick={() => setSelectedServiceCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
              selectedServiceCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todos os Serviços
          </button>
          {serviceCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedServiceCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer shrink-0 ${
                selectedServiceCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {displayedServices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nenhum serviço encontrado
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tente mudar a modalidade, categoria ou limpar o termo de pesquisa de serviços.
            </p>
            <button
              onClick={() => {
                setSelectedServiceCategory('all');
                setSelectedMode('all');
                setSearchServiceQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 transition"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {displayedServices.map((serv) => {
              const biz = getBusiness(serv.businessId);
              const isFav = isServiceFavorite(serv.id);

              return (
                <div
                  key={serv.id}
                  onClick={() => openModal('service_detail', serv.id)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* 4:3 Image */}
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {serv.imageUrl ? (
                        <img
                          src={serv.imageUrl}
                          alt={serv.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950 dark:to-slate-900 text-indigo-500 p-4 text-center">
                          <Wrench className="w-8 h-8 mb-1 opacity-70" />
                          <span className="text-[11px] font-semibold line-clamp-1">{serv.name}</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteService(serv.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-xs transition cursor-pointer"
                        title={isFav ? 'Remover dos favoritos' : 'Salvar serviço'}
                      >
                        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                      </button>

                      {serv.featured && (
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-xs">
                            Destaque
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="p-2.5 sm:p-4">
                      {biz && (
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">
                          <Store className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate">{biz.name}</span>
                        </div>
                      )}

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {serv.name}
                      </h3>

                      {/* Unboxed clean metadata */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        <span>{getServiceModeLabel(serv.serviceMode)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3 h-3 shrink-0" />
                          {serv.duration}
                        </span>
                      </div>

                      <div className="mt-2 text-sm sm:text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatServicePrice(serv)}
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Action */}
                  <div className="p-2.5 sm:p-4 pt-0">
                    {biz && (
                      <a
                        href={`https://wa.me/${biz.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          getServiceWhatsAppMessage(serv, biz.name)
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          trackBusinessMetric(biz.id, 'whatsapp_click');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{serv.priceType === 'quote' ? 'Pedir Orçamento' : 'Solicitar no Zap'}</span>
                      </a>
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
