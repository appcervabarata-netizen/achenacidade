import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  ArrowLeft,
  Store,
  ShieldCheck,
  Lock,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Building2,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    setCurrentView,
    loginAsAdmin,
    loginAsStoreOwner,
    businesses,
  } = useDirectory();

  const [loginType, setLoginType] = useState<'business' | 'admin'>('business');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBizId, setSelectedBizId] = useState(businesses[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === 'admin') {
      loginAsAdmin(email || 'admin@achenacidade.com.br');
    } else {
      const matchedBiz = email
        ? businesses.find((b) => b.email?.toLowerCase() === email.trim().toLowerCase())
        : null;
      if (matchedBiz) {
        loginAsStoreOwner(matchedBiz.id, email);
      } else if (selectedBizId) {
        loginAsStoreOwner(selectedBizId, email);
      } else if (businesses.length > 0) {
        loginAsStoreOwner(businesses[0].id, email);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors pb-24 md:pb-12">
      {/* Top Bar with Back Button */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="achenacidade" className="w-8 h-8 object-contain rounded-full bg-white" />
          <span className="font-extrabold text-slate-900 dark:text-white font-display text-sm">
            achena<span className="text-orange-600">cidade</span>
          </span>
        </div>

        <div className="w-16" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        
        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center mx-auto mb-3 shadow-xs">
            {loginType === 'admin' ? (
              <ShieldCheck className="w-6 h-6 text-orange-500" />
            ) : (
              <Store className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
            Acesso ao Sistema
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Entre na sua área de lojista para gerenciar produtos ou na administração geral.
          </p>
        </div>

        {/* Tab switcher: Lojista vs Admin */}
        <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 mb-5">
          <button
            type="button"
            onClick={() => setLoginType('business')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'business'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Área do Lojista</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'admin'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrador</span>
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {loginType === 'business' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Selecione sua Loja / Anunciante
                </label>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.neighborhood})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail de Acesso
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    loginType === 'admin'
                      ? 'admin@achenacidade.com.br'
                      : 'contato@minhaloja.com.br'
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <span>{loginType === 'admin' ? 'Acessar Área Administrativa' : 'Entrar no Painel da Loja'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Option: Cadastrar Nova Empresa */}
            {loginType === 'business' && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentView('business_portal')}
                  className="w-full py-2.5 px-4 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Store className="w-3.5 h-3.5 text-orange-600" />
                  <span>Ainda não tem conta? Cadastrar Nova Empresa</span>
                </button>
              </div>
            )}
          </form>

          {/* Test Shortcuts Box (Instant 1-Click for Demonstration) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acesso Rápido para Teste (1 Clique):</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => loginAsAdmin('admin@achenacidade.com.br')}
                className="w-full p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Entrar como Administrador Master</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {businesses.slice(0, 2).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => loginAsStoreOwner(b.id, b.email)}
                  className="w-full p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">Entrar como: {b.name}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
