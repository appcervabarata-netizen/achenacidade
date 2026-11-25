import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { BusinessPortalTab } from '../../types';
import { canManageRotatingBanners } from '../../utils/planPricing';
import {
  Home,
  Building2,
  ShoppingBag,
  Wrench,
  Grid,
  PlusCircle,
  Store,
  ShieldCheck,
  Heart,
  BarChart3,
  Package,
  Edit2,
  LayoutGrid,
  FolderPlus,
  Sparkles,
  Zap,
  Plus,
  LogOut,
  ExternalLink,
  X,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    businessPortalTab,
    setBusinessPortalTab,
    authSession,
    logout,
    plans,
    businesses,
    currentBusinessAuth,
    switchActiveBusiness,
    openModal,
    totalFavoritesCount,
  } = useDirectory();

  const [isMerchantMenuOpen, setIsMerchantMenuOpen] = useState(false);

  const isStoreOwnerLoggedIn =
    authSession.isAuthenticated && authSession.role === 'business';

  const navigateMerchantTab = (tab: BusinessPortalTab) => {
    setBusinessPortalTab(tab);
    setCurrentView('business_portal');
    setIsMerchantMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isStoreOwnerLoggedIn) {
    const activeBusiness =
      currentBusinessAuth || businesses.find((b) => b.id === authSession.businessId);
    const userOwnerEmail = activeBusiness?.ownerEmail || authSession.email || '';
    const myBusinesses = businesses.filter(
      (b) =>
        (userOwnerEmail &&
          ((b.ownerEmail && b.ownerEmail.toLowerCase() === userOwnerEmail.toLowerCase()) ||
            (b.email && b.email.toLowerCase() === userOwnerEmail.toLowerCase()))) ||
        b.id === activeBusiness?.id
    );

    const activePlan = plans.find((p) => p.id === activeBusiness?.planId);
    const canBanners = canManageRotatingBanners(activePlan);

    const isSecondaryMerchantTab =
      currentView === 'business_portal' &&
      (businessPortalTab === 'prod_categories' ||
        businessPortalTab === 'banners' ||
        businessPortalTab === 'plans' ||
        businessPortalTab === 'register_new');

    return (
      <>
        {/* Drawer Sheet with Full Merchant Menu Options */}
        {isMerchantMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden animate-fade-in"
            onClick={() => setIsMerchantMenuOpen(false)}
          >
            <div
              className="fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl p-4 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  {activeBusiness?.logoUrl ? (
                    <img
                      src={activeBusiness.logoUrl}
                      alt={activeBusiness.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {activeBusiness?.name || 'Minha Loja'}
                    </p>
                    <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                      Menu do Lojista
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMerchantMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Fechar menu do lojista"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {myBusinesses.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Loja Ativa
                  </label>
                  <select
                    value={activeBusiness?.id || ''}
                    onChange={(e) => {
                      void switchActiveBusiness(e.target.value);
                      setIsMerchantMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {myBusinesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigateMerchantTab('prod_categories')}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                    currentView === 'business_portal' && businessPortalTab === 'prod_categories'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <FolderPlus className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Categorias</span>
                </button>

                {canBanners && (
                  <button
                    type="button"
                    onClick={() => navigateMerchantTab('banners')}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                      currentView === 'business_portal' && businessPortalTab === 'banners'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">Banners</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigateMerchantTab('plans')}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                    currentView === 'business_portal' && businessPortalTab === 'plans'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">Meu Plano</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateMerchantTab('register_new')}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                    currentView === 'business_portal' && businessPortalTab === 'register_new'
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-400 text-orange-700 dark:text-orange-300'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="truncate">Nova Loja</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMerchantMenuOpen(false);
                    setCurrentView('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 p-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-left text-xs font-bold transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">Ver Vitrine</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMerchantMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta do Lojista</span>
              </button>
            </div>
          </div>
        )}

        {/* Store Owner Dedicated Mobile Bottom Navigation (Main public menu hidden) */}
        <nav
          aria-label="Menu do Lojista"
          className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 text-slate-300 backdrop-blur-lg border-t border-slate-800 md:hidden transition-colors"
        >
          <div className="grid grid-cols-5 h-16 items-center px-1 safe-bottom">
            <button
              type="button"
              onClick={() => navigateMerchantTab('dashboard')}
              className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
                currentView === 'business_portal' && businessPortalTab === 'dashboard'
                  ? 'text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight whitespace-nowrap">Resumo</span>
            </button>

            <button
              type="button"
              onClick={() => navigateMerchantTab('products')}
              className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
                currentView === 'business_portal' && businessPortalTab === 'products'
                  ? 'text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight whitespace-nowrap">Produtos</span>
            </button>

            <button
              type="button"
              onClick={() => navigateMerchantTab('services')}
              className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
                currentView === 'business_portal' && businessPortalTab === 'services'
                  ? 'text-orange-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight whitespace-nowrap">Serviços</span>
            </button>

            <button
              type="button"
              onClick={() => navigateMerchantTab('edit_profile')}
              className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
                currentView === 'business_portal' && businessPortalTab === 'edit_profile'
                  ? 'text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit2 className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight whitespace-nowrap">Perfil</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMerchantMenuOpen((prev) => !prev)}
              className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
                isMerchantMenuOpen || isSecondaryMerchantTab
                  ? 'text-orange-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4.5 h-4.5" />
              <span className="text-[10px] tracking-tight whitespace-nowrap">Menu</span>
            </button>
          </div>
        </nav>
      </>
    );
  }

  const handleAnunciarClick = () => {
    // As explicitly requested: "O Botão anunciar deve levar o visitante para o login, para entrar em sua loja ou realizar novo cadastro"
    if (authSession.isAuthenticated) {
      if (authSession.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('business_portal');
      }
    } else {
      setCurrentView('register_store');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Floating Favorites Badge on Mobile when user has saved items */}
      {totalFavoritesCount > 0 && (
        <button
          onClick={() => openModal('favorites')}
          className="fixed bottom-18 right-3.5 z-40 md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 border border-white/20 active:scale-95 transition cursor-pointer"
        >
          <Heart className="w-3.5 h-3.5 fill-white" />
          <span>{totalFavoritesCount} {totalFavoritesCount === 1 ? 'Salvo' : 'Salvos'}</span>
        </button>
      )}

      {/* Fixed Native-like Mobile Bottom Navigation Menu */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 md:hidden transition-colors">
        <div className="grid grid-cols-6 h-16 items-center px-0.5 safe-bottom">
          
          {/* 1. Início */}
          <button
            onClick={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
              currentView === 'home'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Início</span>
          </button>

          {/* 2. Lojas (Empresas) */}
          <button
            onClick={() => {
              setCurrentView('stores');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
              currentView === 'stores'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-4.5 h-4.5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Lojas</span>
          </button>

          {/* 3. Produtos */}
          <button
            onClick={() => {
              setCurrentView('products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
              currentView === 'products'
                ? 'text-orange-600 dark:text-orange-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Produtos</span>
          </button>

          {/* 4. Serviços */}
          <button
            onClick={() => {
              setCurrentView('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
              currentView === 'services'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Wrench className="w-4.5 h-4.5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Serviços</span>
          </button>

          {/* 4. Categorias */}
          <button
            onClick={() => {
              setCurrentView('categories');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
              currentView === 'categories'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Categorias</span>
          </button>

          {/* 5. Anunciar (Leads to Login for login or new registration) */}
          <button
            onClick={handleAnunciarClick}
            className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-colors ${
              currentView === 'login' || currentView === 'business_portal' || currentView === 'admin' || currentView === 'register_store'
                ? 'text-orange-600 dark:text-orange-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {authSession.isAuthenticated ? (
              authSession.role === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-orange-500" />
              ) : (
                <Store className="w-5 h-5 text-blue-600" />
              )
            ) : (
              <PlusCircle className="w-5 h-5 text-orange-600" />
            )}
            <span className="text-[10px] tracking-tight font-bold truncate max-w-16">
              {authSession.isAuthenticated
                ? authSession.role === 'admin'
                  ? 'Admin'
                  : 'Minha Loja'
                : 'Cadastrar Loja'}
            </span>
          </button>

        </div>
      </nav>
    </>
  );
};
