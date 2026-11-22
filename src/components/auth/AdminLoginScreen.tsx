import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const AdminLoginScreen: React.FC = () => {
  const {
    setCurrentView,
    authenticateAdmin,
    sessionConfig,
  } = useDirectory();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Informe o e-mail de administrador e a senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authenticateAdmin(trimmedEmail, password);
      if (!result.success) {
        setErrorMsg(result.error || 'Usuário administrador ou senha inválidos.');
      }
    } catch {
      setErrorMsg('Falha de comunicação ao validar credenciais administrativas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSessionLabel = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.round((minutes / 60) * 10) / 10;
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    return `${minutes} minutos`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Site</span>
        </button>

        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="achenacidade" className="w-8 h-8 object-contain rounded-full bg-white" />
          <span className="font-extrabold text-white font-display text-sm">
            achena<span className="text-orange-500">cidade</span>
          </span>
        </div>

        <div className="w-20" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ShieldCheck className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-display">
            Acesso Administrativo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Área restrita à administração do portal · Autenticação via banco de dados.
          </p>
        </div>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 flex items-start gap-2.5 text-xs text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail do Administrador
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@seudominio.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha Administrativa
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
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Sessão admin: {formatSessionLabel(sessionConfig.adminSessionDurationMinutes)}</span>
              </span>
              <span className="font-semibold text-emerald-400">
                Conexão criptografada
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Autenticando...' : 'Entrar no Painel Administrativo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
