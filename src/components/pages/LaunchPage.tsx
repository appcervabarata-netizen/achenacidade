import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { CountdownTimer } from '../common/CountdownTimer';
import heroLaunchImg from '../../assets/images/hero_launch_merchants_1794903735502.jpg';
import {
  ArrowRight,
  Check,
  MessageCircle,
  ShieldCheck,
  Store,
  Lock,
  HelpCircle,
  X,
  Package,
} from 'lucide-react';

interface LaunchPageProps {
  isPreview?: boolean;
  onExitPreview?: () => void;
}

export const LaunchPage: React.FC<LaunchPageProps> = ({ isPreview = false, onExitPreview }) => {
  const {
    siteModeConfig,
    plans,
    setCurrentView,
    setPreselectedPlanId,
    setAdminPreviewMode,
  } = useDirectory();

  const [imgError, setImgError] = useState(false);
  const { launch } = siteModeConfig;

  const cleanWhatsapp = launch.whatsappNumber.replace(/\D/g, '');
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/55${cleanWhatsapp}?text=${encodeURIComponent(launch.whatsappMessage)}`
    : '';

  const handleGoToPlans = () => {
    if (isPreview) {
      setAdminPreviewMode('none');
    }
    setCurrentView('plans');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChoosePlanDirect = (planId: string) => {
    if (isPreview) {
      setAdminPreviewMode('none');
    }
    setPreselectedPlanId(planId);
    setCurrentView('register_store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToLogin = () => {
    if (isPreview) {
      setAdminPreviewMode('none');
    }
    setCurrentView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Admin Preview Bar (shown only when previewing from Admin) */}
      {isPreview && (
        <div className="bg-orange-600 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-xs font-semibold">
          <span>
            Pré-visualização Administrativa · Página de Lançamento
          </span>
          <button
            onClick={onExitPreview}
            className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-white font-bold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            Voltar ao Painel Admin
          </button>
        </div>
      )}

      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
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

          {/* Zone 2: Concise Anchor Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('vantagens-lojistas')}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Vantagens
            </button>
            <button
              onClick={() => scrollToSection('comparativo-comissoes')}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Comparativo
            </button>
            <button
              onClick={() => scrollToSection('planos-lancamento')}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Planos
            </button>
            <button
              onClick={() => scrollToSection('duvidas-lancamento')}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dúvidas
            </button>
          </nav>

          {/* Zone 3: High-Visibility Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleGoToPlans}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-orange-600/20 transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Cadastrar Empresa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION: Vibrant Cobalt Blue + Warm Orange CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column: Proposition, Countdown & Prominent CTA */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-orange-300 tracking-wide mb-3">
                  <span>{launch.eyebrow}</span>
                  <span aria-hidden="true" className="mx-2 text-blue-300/60">·</span>
                  <span className="text-blue-100 font-mono tabular-nums">
                    {launch.availableSpots} vagas inaugurais disponíveis
                  </span>
                </p>

                <h1
                  className="font-extrabold font-display tracking-tight text-white text-balance leading-[1.12]"
                  style={{ fontSize: 'clamp(2rem, 3.8vw, 3.35rem)' }}
                >
                  {launch.headline}
                </h1>

                <p className="mt-4 text-sm sm:text-base lg:text-lg text-blue-100/90 leading-relaxed max-w-2xl">
                  {launch.subheadline}
                </p>
              </div>

              {/* Countdown Timer Block */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-blue-200">
                  Contagem regressiva para abertura oficial ao público de Alagoinhas:
                </p>
                <CountdownTimer
                  targetDateIso={launch.targetDateIso}
                  variant="hero"
                  expiredLabel="Abertura oficial liberada · Garanta o cadastro da sua empresa"
                />
              </div>

              {/* Primary Conversion CTAs */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleGoToPlans}
                    className="px-6 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm sm:text-base font-extrabold shadow-xl shadow-orange-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>{launch.ctaText}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-white text-sm font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4 text-orange-300" />
                      <span>{launch.secondaryCtaText}</span>
                    </a>
                  )}
                </div>

                <p className="text-xs text-blue-200/90 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>{launch.guaranteeNote}</span>
                </p>
              </div>
            </div>

            {/* Right Column: Local Merchant Editorial Visual */}
            <div className="lg:col-span-5 flex">
              <div className="relative w-full min-h-[280px] sm:min-h-[360px] lg:h-full rounded-2xl overflow-hidden border border-white/15 bg-blue-950 shadow-2xl">
                {!imgError ? (
                  <img
                    src={heroLaunchImg}
                    alt="Lojista em Alagoinhas apresentando catálogo digital aos clientes"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-800 via-blue-900 to-slate-950 flex flex-col items-center justify-center p-8 text-center">
                    <Store className="w-12 h-12 text-orange-400 mb-3" />
                    <p className="font-display font-bold text-lg text-white">
                      Vitrine Local de Alagoinhas
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6">
                  <p className="text-xs font-semibold text-orange-300">
                    Comércio Local · Alagoinhas - BA
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-white font-display leading-snug">
                    Sua loja encontrada por quem busca perto de você, com contato direto no WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Proof Strip (Full width below split) */}
          <div className="mt-10 pt-8 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-orange-400">
                0%
              </p>
              <p className="mt-1 text-xs sm:text-sm text-blue-100">
                Comissão por venda ou pedido recebido
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                3 em 1
              </p>
              <p className="mt-1 text-xs sm:text-sm text-blue-100">
                Busca por Empresas, Produtos e Serviços
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-orange-400">
                100%
              </p>
              <p className="mt-1 text-xs sm:text-sm text-blue-100">
                Foco inicial na audiência de Alagoinhas
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                Push
              </p>
              <p className="mt-1 text-xs sm:text-sm text-blue-100">
                Alertas no celular de quem favoritar sua loja
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Persuasive Benefits (Admin-Editable) */}
      <section id="vantagens-lojistas" className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">
            Vantagens Exclusivas para Lojistas
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
            {launch.benefitsTitle}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {launch.benefitsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {launch.benefits.map((benefit, index) => (
            <div
              key={benefit.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                  <span className="font-mono tabular-nums text-blue-700 dark:text-blue-400">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  {benefit.highlightMetric && (
                    <span className="text-orange-600 dark:text-orange-400 font-bold">
                      {benefit.highlightMetric}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  {benefit.title}
                </h3>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Comparison Table (Sales Persuasion) */}
      <section
        id="comparativo-comissoes"
        className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
              Comparativo Financeiro Direto
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
              Pare de perder margem em taxas por venda
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without Achenacidade */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Outros canais e aplicativos
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-5">
                Dependência de comissão e algoritmo
              </h3>
              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Taxas de 15% a 27% descontadas de cada venda realizada</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Postagens nas redes sociais somem em horas e exigem impulsionamento pago</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>O cliente não enxerga seus serviços e produtos organizados por preço</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Sem alerta automático quando você lança promoção relâmpago</span>
                </li>
              </ul>
            </div>

            {/* With Achenacidade */}
            <div className="p-6 sm:p-8 rounded-2xl bg-blue-950 text-white border border-blue-800">
              <p className="text-xs font-semibold text-orange-300 mb-1">
                Guia Oficial de Alagoinhas
              </p>
              <h3 className="text-lg font-bold text-white font-display mb-5">
                Sua marca com o achenacidade
              </h3>
              <ul className="space-y-3.5 text-sm text-blue-100">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>Zero comissão sobre pedidos — valor mensal fixo e previsível</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>Loja ativa 24h na busca local de Alagoinhas para quem quer comprar agora</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>Catálogo organizado com Produtos e Serviços na mesma cota do plano</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>Notificações Push enviadas direto ao celular de quem favoritar sua empresa</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Plans Preview (Direct Funnel to Choose Plan -> Register) */}
      <section id="planos-lancamento" className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">
            Escolha Como Começar
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
            Planos disponíveis para cadastrar sua empresa hoje
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Selecione o plano ideal para o seu momento — você poderá alterar ou fazer upgrade quando quiser no seu painel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isFree = plan.priceMonthly === 0;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between bg-white dark:bg-slate-900 ${
                  plan.highlighted
                    ? 'border-2 border-orange-500 shadow-lg shadow-orange-500/10'
                    : 'border border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span className="font-bold text-blue-700 dark:text-blue-400">{plan.badge}</span>
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                      Até {plan.productLimit} anúncios
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                    {plan.name}
                  </h3>

                  <div className="mt-3 mb-5 flex items-baseline gap-1">
                    {isFree ? (
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Grátis
                      </span>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-500">R$</span>
                        <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                          {plan.priceMonthly.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs text-slate-500">/mês</span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-7 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleChoosePlanDirect(plan.id)}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                    plan.highlighted
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20'
                      : 'bg-blue-700 hover:bg-blue-800 text-white'
                  }`}
                >
                  <span>Escolher {plan.name} e Cadastrar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleGoToPlans}
            className="text-sm font-bold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Comparar detalhes completos dos planos antes de cadastrar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* SECTION 5: Objection-Busting FAQ + Final Conversion Banner */}
      <section id="duvidas-lancamento" className="pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display text-center mb-6">
            Perguntas Frequentes de Lojistas
          </h2>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Preciso pagar comissão sobre o que eu vender?</span>
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6">
              Não. O cliente vê seu produto ou serviço, clica e negocia diretamente com você pelo WhatsApp. 100% do faturamento fica com sua empresa.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Se eu cadastrar minha empresa hoje, já apareço na abertura oficial?</span>
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6">
              Sim! Ao finalizar seu cadastro agora, você já recebe acesso ao Portal do Lojista para montar seu catálogo de produtos e serviços antes mesmo do término da contagem regressiva.
            </p>
          </div>
        </div>

        {/* Final CTA Box */}
        <div className="p-7 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-balance">
            Garanta a presença da sua empresa antes da abertura em Alagoinhas
          </h2>
          <p className="text-sm text-blue-100 max-w-xl mx-auto">
            Escolha seu plano, cadastre sua loja em poucos minutos e deixe sua vitrine pronta para receber clientes locais.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleGoToPlans}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm sm:text-base font-extrabold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>{launch.ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer with discrete Admin Access */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} achenacidade · Guia Comercial Oficial de Alagoinhas - BA
          </p>

          <button
            onClick={handleGoToLogin}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Área do Lojista</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
