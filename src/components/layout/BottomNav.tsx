import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
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
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    authSession,
    openModal,
    totalFavoritesCount,
  } = useDirectory();

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
