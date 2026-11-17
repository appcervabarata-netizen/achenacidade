import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { CountdownTimer } from '../common/CountdownTimer';
import {
  ArrowRight,
  Wrench,
  MessageCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface MaintenancePageProps {
  isPreview?: boolean;
  onExitPreview?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  isPreview = false,
  onExitPreview,
}) => {
  const { siteModeConfig, setCurrentView, setAdminPreviewMode } = useDirectory();
  const { maintenance } = siteModeConfig;

  const cleanWhatsapp = maintenance.whatsappNumber.replace(/\D/g, '');
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/55${cleanWhatsapp}?text=${encodeURIComponent(
        'Olá! Vi a página de manutenção do achenacidade e gostaria de tirar uma dúvida sobre o cadastro da minha empresa.'
      )}`
    : '';

  const handleGoToPlans = () => {
    if (isPreview) {
      setAdminPreviewMode('none');
    }
    setCurrentView('plans');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToLogin = () => {
    if (isPreview) {
      setAdminPreviewMode('none');
    }
    setCurrentView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Admin Preview Strip */}
      {isPreview && (
        <div className="bg-orange-600 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-xs font-semibold">
          <span>Pré-visualização Administrativa · Página de Manutenção</span>
          <button
            onClick={onExitPreview}
            className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-white font-bold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            Voltar ao Painel Admin
          </button>
        </div>
      )}

      {/* Minimal 3-Zone Top Bar */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src="/logo.png"
              alt="achenacidade"
              className="w-10 h-10 object-contain rounded-full bg-white shadow-xs shrink-0"
            />
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap">
              achena<span className="text-orange-600">cidade</span>
            </span>
          </div>

          <span className="hidden sm:inline text-xs font-medium text-slate-500 dark:text-slate-400">
            {maintenance.badgeLabel}
          </span>

          <button
            onClick={handleGoToPlans}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
          >
            <span>Cadastrar Empresa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Centered Full-Screen Maintenance Focal Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-3xl rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          {/* Top Blue Brand Banner Strip */}
          <div className="bg-gradient-to-r from-slate-950 via-blue-900 to-blue-700 px-6 sm:px-10 py-8 sm:py-10 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-orange-600 flex items-center justify-center shadow-md shrink-0">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-orange-300">
                {maintenance.badgeLabel}
              </p>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white text-balance leading-tight">
              {maintenance.headline}
            </h1>

            <p className="mt-4 text-sm sm:text-base text-blue-100/95 leading-relaxed">
              {maintenance.description}
            </p>
          </div>

          {/* Lower Countdown + High-Visibility Registration CTA */}
          <div className="p-6 sm:p-10 space-y-7">
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Previsão de retorno completo do portal:
              </p>
              <CountdownTimer
                targetDateIso={maintenance.targetDateIso}
                variant="light"
                expiredLabel="Manutenção em fase final · Retorno em instantes"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleGoToPlans}
                className="flex-1 py-4 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm sm:text-base font-extrabold shadow-lg shadow-orange-600/25 transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>{maintenance.ctaText}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {maintenance.showWhatsappButton && whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 px-5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Suporte WhatsApp</span>
                </a>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                O cadastro de empresas e a escolha de planos continuam ativos normalmente durante a atualização.
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* Quiet Footer with discrete Admin Access */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} achenacidade · Alagoinhas - BA</p>
          <button
            onClick={handleGoToLogin}
            className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Acesso Administrativo / Lojista</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
