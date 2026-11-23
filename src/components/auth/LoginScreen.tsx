import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  requestPasswordResetViaApi,
  confirmPasswordResetViaApi,
} from '../../utils/apiSync';
import {
  ArrowLeft,
  Store,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Clock,
  KeyRound,
  CheckCircle,
  Send,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    setCurrentView,
    authenticateStoreOwner,
    sessionConfig,
    smtpConfig,
  } = useDirectory();

  const [authMode, setAuthMode] = useState<'login' | 'forgot_request' | 'forgot_reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryInfoMsg, setRecoveryInfoMsg] = useState<string | null>(null);
  const [recoveryDebugCode, setRecoveryDebugCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Informe o e-mail de acesso e a senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authenticateStoreOwner(trimmedEmail, password);
      if (!result.success) {
        setErrorMsg(result.error || 'E-mail ou senha inválidos.');
      }
    } catch {
      setErrorMsg('Falha de comunicação ao validar credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResetCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setRecoveryInfoMsg(null);
    setRecoveryDebugCode(null);

    const trimmedEmail = forgotEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPasswordResetViaApi({
        loginType: 'business',
        email: trimmedEmail,
        smtp: smtpConfig,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Não foi possível solicitar a recuperação de senha.');
        return;
      }
      setRecoveryInfoMsg(
        res.message ||
          `Enviamos um código de 6 dígitos para ${trimmedEmail}. Confira sua caixa de entrada.`
      );
      setRecoveryDebugCode(res.debugCode || null);
      setResetCode('');
      setAuthMode('forgot_reset');
    } catch {
      setErrorMsg('Falha de comunicação ao enviar o código de recuperação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!/^\d{6}$/.test(resetCode.trim())) {
      setErrorMsg('Informe o código de 6 dígitos enviado ao seu e-mail.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('A confirmação da nova senha não confere.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await confirmPasswordResetViaApi({
        loginType: 'business',
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Não foi possível redefinir a senha.');
        return;
      }
      setEmail(forgotEmail.trim());
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetCode('');
      setRecoveryInfoMsg(null);
      setRecoveryDebugCode(null);
      setSuccessMsg(res.message || 'Senha redefinida com sucesso! Entre com sua nova senha.');
      setAuthMode('login');
    } catch {
      setErrorMsg('Falha de comunicação ao redefinir a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sessionMinutes = sessionConfig.businessSessionDurationMinutes;

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
            {authMode === 'login' ? (
              <Store className="w-6 h-6 text-blue-600" />
            ) : (
              <KeyRound className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
            {authMode === 'login' ? 'Área do Lojista' : 'Recuperar Senha da Loja'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {authMode === 'login'
              ? 'Acesse o painel da sua empresa para gerenciar produtos, serviços e plano.'
              : authMode === 'forgot_request'
              ? 'Informe o e-mail da sua loja para receber um código de 6 dígitos.'
              : 'Digite o código recebido por e-mail e defina uma nova senha de acesso.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail da Loja
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setRecoveryInfoMsg(null);
                      setRecoveryDebugCode(null);
                      setForgotEmail(email.trim());
                      setAuthMode('forgot_request');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
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
                  <span>Duração da sessão: {formatSessionLabel(sessionMinutes)}</span>
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Conexão criptografada
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Autenticando...' : 'Entrar no Painel da Loja'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Option: Cadastrar Nova Empresa */}
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
            </form>
          )}

          {authMode === 'forgot_request' && (
            <form onSubmit={handleRequestResetCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail cadastrado na Loja
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="contato@minhaloja.com.br"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando código...' : 'Enviar Código de Recuperação'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setAuthMode('login');
                }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              >
                Voltar para o login
              </button>
            </form>
          )}

          {authMode === 'forgot_reset' && (
            <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
              {recoveryInfoMsg && (
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <p>{recoveryInfoMsg}</p>
                  {recoveryDebugCode && (
                    <p className="font-semibold">
                      Código de teste local:{' '}
                      <span className="font-mono font-extrabold text-orange-600">{recoveryDebugCode}</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail da conta
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  disabled
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Código de 6 Dígitos
                  </label>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleRequestResetCode()}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Reenviar código
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tracking-widest text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nova Senha (mínimo 6 caracteres)
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Salvando nova senha...' : 'Redefinir Senha'}</span>
                <CheckCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setAuthMode('login');
                }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              >
                Cancelar e voltar ao login
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

