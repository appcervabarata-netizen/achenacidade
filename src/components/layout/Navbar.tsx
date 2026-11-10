import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  MapPin,
  Building2,
  ShoppingBag,
  ShieldCheck,
  PlusCircle,
  Heart,
  User,
  LogOut,
  Store,
  Grid,
  Zap,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    cities,
    selectedCityId,
    setSelectedCityId,
    openModal,
    currentView,
    setCurrentView,
    authSession,
    logout,
    currentBusinessAuth,
    totalFavoritesCount,
  } = useDirectory();

  const activeCities = cities.filter((c) => c.isActive);
  const showCitySelector = activeCities.length > 2;

  const navigateToView = (view: typeof currentView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors safe-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 min-h-16 sm:h-16 flex items-center justify-center sm:justify-between gap-3 md:gap-8 relative">
        
        {/* Zone 1: Brand Wordmark & City Selector (Centered on mobile with city selector below text) */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4 w-full sm:w-auto shrink-0">
          <button
            onClick={() => navigateToView('home')}
            className="group flex items-center justify-center gap-2 sm:gap-2.5 whitespace-nowrap cursor-pointer text-center sm:text-left"
          >
            <img
              src="/logo.png"
              alt="achenacidade"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full shadow-sm group-hover:scale-105 transition-transform bg-white"
            />
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                achena<span className="text-orange-600">cidade</span>
              </span>
            </div>
          </button>

          {/* City Selector: Centered below title text on mobile, inline on desktop */}
          {showCitySelector && (
            <div className="relative flex items-center justify-center w-full sm:w-auto mt-0.5 sm:mt-0">
              <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer pr-1 text-[11px] sm:text-xs font-medium text-slate-900 dark:text-white"
                  title="Escolha a cidade para filtrar empresas e produtos"
                >
                  <option value="all" className="dark:bg-slate-800">Todas as Cidades</option>
                  {activeCities.map((city) => (
                    <option key={city.id} value={city.id} className="dark:bg-slate-800">
                      {city.name} - {city.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links (Navigates to dedicated pages) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => navigateToView('home')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'home' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
            }`}
          >
            Início
          </button>
          <button
            onClick={() => navigateToView('stores')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'stores' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
            }`}
          >
            <Building2 className="w-4 h-4 text-slate-400" />
            Lojas
          </button>
          <button
            onClick={() => navigateToView('products')}
            className={`hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'products' ? 'text-orange-600 dark:text-orange-400 font-bold' : ''
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-slate-400" />
            Produtos
          </button>
          <button
            onClick={() => navigateToView('categories')}
            className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'categories' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            <Grid className="w-4 h-4 text-slate-400" />
            Categorias
          </button>
          <button
            onClick={() => navigateToView('plans')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'plans' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Planos
          </button>
        </nav>

        {/* Zone 3: Actions (Favorites, Cadastrar Loja, Login/Account) */}
        <div className="absolute right-3 top-3.5 sm:static flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Favorites Button (Hidden on mobile to preserve layout, accessible in bottom nav/bubble) */}
          <button
            onClick={() => openModal('favorites')}
            className="hidden sm:flex relative items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            title="Ver empresas e produtos favoritados"
          >
            <Heart className={`w-3.5 h-3.5 ${totalFavoritesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Favoritos</span>
            {totalFavoritesCount > 0 && (
              <span className="flex items-center justify-center min-w-4.5 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {totalFavoritesCount}
              </span>
            )}
          </button>

          {/* Authenticated State vs Guest State */}
          {authSession.isAuthenticated ? (
            <div className="flex items-center gap-2">
              {authSession.role === 'admin' ? (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
                    currentView === 'admin'
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900'
                  }`}
                  title="Abrir Painel Administrativo"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Painel Admin</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('business_portal')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
                    currentView === 'business_portal'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title="Abrir Painel da Loja"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span className="max-w-20 sm:max-w-28 truncate">{currentBusinessAuth?.name || 'Minha Loja'}</span>
                </button>
              )}

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Cadastrar Loja Button: Hidden on mobile (< sm) so header doesn't break; mobile uses bottom nav */}
              <button
                onClick={() => setCurrentView('register_store')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                title="Cadastrar Nova Loja no Achenacidade"
              >
                <PlusCircle className="w-3.5 h-3.5 text-orange-600" />
                <span>Cadastrar Loja</span>
              </button>

              {/* Login Button */}
              <button
                onClick={() => setCurrentView('login')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                title="Entrar na conta de lojista ou administrador"
              >
                <User className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};
