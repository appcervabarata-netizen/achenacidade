import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  ArrowLeft,
  Store,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    setCurrentView,
    authenticateAdmin,
    authenticateStoreOwner,
    sessionConfig,
  } = useDirectory();

  const [loginType, setLoginType] = useState<'business' | 'admin'>('business');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabSwitch = (nextType: 'business' | 'admin') => {
    setLoginType(nextType);
    setErrorMsg(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Informe o e-mail de acesso e a senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result =
        loginType === 'admin'
          ? await authenticateAdmin(trimmedEmail, password)
          : await authenticateStoreOwner(trimmedEmail, password);

      if (!result.success) {
        setErrorMsg(result.error || 'E-mail ou senha inválidos.');
      }
    } catch {
      setErrorMsg('Falha de comunicação ao validar credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sessionHours =
    loginType === 'admin'
      ? sessionConfig.adminSessionDurationMinutes
      : sessionConfig.businessSessionDurationMinutes;

  const formatSessionLabel = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.round((minutes / 60) * 10) / 10;
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    return `${minutes} minutos`;
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
            Autenticação segura validada diretamente no banco de dados.
          </p>
        </div>

        {/* Tab switcher: Lojista vs Admin */}
        <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 mb-5">
          <button
            type="button"
            onClick={() => handleTabSwitch('business')}
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
            onClick={() => handleTabSwitch('admin')}
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
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail de Acesso
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Duração da sessão: {formatSessionLabel(sessionHours)}</span>
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Conexão criptografada
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60 ${
                loginType === 'admin'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'Autenticando...'
                  : loginType === 'admin'
                  ? 'Entrar como Administrador'
                  : 'Entrar no Painel da Loja'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Option: Cadastrar Nova Empresa */}
            {loginType === 'business' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentView('register_store')}
                  className="w-full py-2.5 px-4 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Store className="w-3.5 h-3.5 text-orange-600" />
                  <span>Ainda não tem conta? Cadastrar Nova Empresa</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};
