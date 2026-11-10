import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { Search, Building2, ShoppingBag, MapPin, X, ArrowRight, Grid, Zap } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const {
    cities,
    selectedCityId,
    selectedCity,
    setSelectedCityId,
    searchCompanyQuery,
    setSearchCompanyQuery,
    searchProductQuery,
    setSearchProductQuery,
    filteredBusinesses,
    filteredProducts,
    setCurrentView,
  } = useDirectory();

  const activeCities = cities.filter((c) => c.isActive);
  const showCitySelector = activeCities.length > 2;

  const cityName = selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : 'sua Cidade';

  const handleSearchCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentView('stores');
  };

  const handleSearchProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentView('products');
  };

  return (
    <section className="relative overflow-hidden bg-slate-900 py-6 sm:py-10 md:py-14 text-white">
      {/* Background Hero Image with measured scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_city_directory_1794250006879.jpg"
          alt="achenacidade panorama urbano"
          className="w-full h-full object-cover object-center opacity-30 brightness-75 scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* City Indicator Badge & Quick Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3 md:mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/30 backdrop-blur-md border border-blue-400/30 text-xs font-semibold text-blue-200">
            <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>Guia Comercial de {cityName}</span>
          </div>

          {showCitySelector && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-300">
              <span className="hidden sm:inline">Mudar cidade:</span>
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="hidden sm:inline-block bg-slate-800/80 text-white rounded-md px-2 py-0.5 border border-slate-700 text-xs font-medium cursor-pointer outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Todas ({activeCities.length})</option>
                {activeCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} - {city.state}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Hero Title (Hidden on mobile for clean screen as requested) */}
        <div className="hidden md:block text-center max-w-3xl mx-auto mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display text-balance">
            Encontre Empresas e Produtos em <span className="text-orange-500">{cityName}</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            O diretório comercial da sua cidade. Pesquise empresas e produtos abaixo com contato direto via WhatsApp.
          </p>
        </div>

        {/* Dual Independent Search Inputs (Only session shown on home page) */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Search Field 1: Empresas */}
          <form
            onSubmit={handleSearchCompanySubmit}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-white transition-all focus-within:ring-2 focus-within:ring-blue-500"
          >
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="company-search" className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Pesquisar Empresas</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'loja' : 'lojas'}
              </span>
            </div>

            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="company-search"
                type="text"
                value={searchCompanyQuery}
                onChange={(e) => setSearchCompanyQuery(e.target.value)}
                placeholder="Ex: Cafeteria, TechFix, Mecânica..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 transition"
              />
              {searchCompanyQuery && (
                <button
                  type="button"
                  onClick={() => setSearchCompanyQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
                  title="Limpar busca de empresas"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Busca por nome ou bairro</span>
              <button
                type="button"
                onClick={() => setCurrentView('stores')}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Abrir Guia de Lojas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* Search Field 2: Produtos (Independent!) */}
          <form
            onSubmit={handleSearchProductSubmit}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-white transition-all focus-within:ring-2 focus-within:ring-orange-500"
          >
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="product-search" className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                <span>Pesquisar Produtos</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="product-search"
                type="text"
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
                placeholder="Ex: Café em grãos, Camisa, Celular..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 transition"
              />
              {searchProductQuery && (
                <button
                  type="button"
                  onClick={() => setSearchProductQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
                  title="Limpar busca de produtos"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Busca por item ou marca</span>
              <button
                type="button"
                onClick={() => setCurrentView('products')}
                className="text-orange-600 dark:text-orange-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Abrir Vitrine de Produtos <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>

        </div>

        {/* Quick Portal Navigation Pills */}
        <div className="max-w-4xl mx-auto mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => setCurrentView('stores')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Todas as Lojas</span>
          </button>
          <button
            onClick={() => setCurrentView('products')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold border border-slate-700 transition cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
            <span>Ver Produtos</span>
          </button>
          <button
            onClick={() => setCurrentView('categories')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Categorias</span>
          </button>
          <button
            onClick={() => setCurrentView('plans')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Planos Lojista</span>
          </button>
        </div>

      </div>
    </section>
  );
};
