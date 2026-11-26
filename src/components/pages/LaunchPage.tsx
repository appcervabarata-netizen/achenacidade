import React, { useMemo, useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { CountdownTimer } from '../common/CountdownTimer';
import { formatBRL, isFounderPlan, isLifetimePlan } from '../../utils/planPricing';
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
  Users,
  Crown,
  Search,
  ShoppingBag,
  Wrench,
  Play,
  Compass,
  Building2,
} from 'lucide-react';

interface LaunchPageProps {
  isPreview?: boolean;
  onExitPreview?: () => void;
}

export const LaunchPage: React.FC<LaunchPageProps> = ({ isPreview = false, onExitPreview }) => {
  const {
    siteModeConfig,
    plans,
    businesses,
    products,
    services,
    selectedCity,
    setCurrentView,
    setPreselectedPlanId,
    setAdminPreviewMode,
    enterVisitorDemo,
    setSearchCompanyQuery,
    setSearchProductQuery,
    setSearchServiceQuery,
    appGeneralConfig,
  } = useDirectory();

  const [imgError, setImgError] = useState(false);
  const [demoSearchType, setDemoSearchType] = useState<'products' | 'stores' | 'services'>('products');
  const [demoQuery, setDemoQuery] = useState('');

  const { launch } = siteModeConfig;
  const cityLabel = selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : 'Alagoinhas - BA';

  const founderPlan = useMemo(
    () =>
      plans.find((p) => p.id === 'plan-founder') ||
      plans.find((p) => isFounderPlan(p)) || {
        id: 'plan-founder',
        name: 'Sócio Fundador',
        priceMonthly: 0,
        priceOnce: 500,
        billingType: 'lifetime' as const,
        vipTier: 'founder' as const,
        productLimit: 150,
        businessLimit: 1,
        badge: 'Sócio Fundador VIP',
        features: [
          'Pagamento único de R$ 500,00 (acesso vitalício sem mensalidade)',
          'Cadastro de 1 loja com até 150 produtos/serviços somados',
          'Selo exclusivo de Sócio Fundador VIP',
          'Mesmos destaques VIP do Plano Premium Ouro + Banners Rotativos',
        ],
        color: '#B45309',
      },
    [plans]
  );

  const premiumPlan = useMemo(
    () => plans.find((p) => p.id === 'plan-premium'),
    [plans]
  );

  const founderPrice = Number(founderPlan.priceOnce ?? 500);
  const founderLimit = Number(founderPlan.productLimit ?? 150);
  const founderStores = Number(founderPlan.businessLimit ?? 1);
  const founderInstallment12x = Math.round(((founderPrice / 12) + Number.EPSILON) * 100) / 100;
  const premiumMonthly = Number(premiumPlan?.priceMonthly ?? 99.9);
  const breakEvenMonths = premiumMonthly > 0 ? Math.max(1, Math.ceil(founderPrice / premiumMonthly)) : 5;
  const savings24m = Math.max(0, premiumMonthly * 24 - founderPrice);

  const activeBusinesses = useMemo(
    () => businesses.filter((b) => b.subscriptionStatus !== 'cancelled'),
    [businesses]
  );
  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive),
    [products]
  );
  const activeServices = useMemo(
    () => services.filter((s) => s.isActive),
    [services]
  );

  const sampleProducts = useMemo(() => activeProducts.slice(0, 3), [activeProducts]);

  const cleanWhatsapp = (launch.whatsappNumber || appGeneralConfig.whatsappNumber || '').replace(/\D/g, '');
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/55${cleanWhatsapp}?text=${encodeURIComponent(
        launch.whatsappMessage || appGeneralConfig.whatsappDefaultMessage || ''
      )}`
    : '';
  const hasWhatsappGroup = /^https?:\/\//i.test((appGeneralConfig.whatsappGroupUrl || '').trim());

  const handleGoToPlans = () => {
    if (isPreview) {
      setAdminPreviewMode('none');
    }
    setCurrentView('plans');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToFounderPage = () => {
    if (isPreview) {
      setAdminPreviewMode('none');
    }
    setCurrentView('founder_sales');
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

  const handleStartFullDemo = (
    targetView: 'home' | 'stores' | 'products' | 'services' = 'home',
    prefillQuery?: string
  ) => {
    if (typeof prefillQuery === 'string') {
      const trimmed = prefillQuery.trim();
      if (targetView === 'products') {
        setSearchProductQuery(trimmed);
      } else if (targetView === 'stores') {
        setSearchCompanyQuery(trimmed);
      } else if (targetView === 'services') {
        setSearchServiceQuery(trimmed);
      }
    } else {
      setSearchCompanyQuery('');
      setSearchProductQuery('');
      setSearchServiceQuery('');
    }
    enterVisitorDemo(targetView);
  };

  const handleDemoSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleStartFullDemo(demoSearchType, demoQuery);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const quickSearchSuggestions =
    demoSearchType === 'products'
      ? ['Café', 'Camisa', 'Celular', 'Combo']
      : demoSearchType === 'stores'
      ? ['Grão', 'Tech', 'Centro', 'Moda']
      : ['Manutenção', 'Consultoria', 'Corte', 'Limpeza'];

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
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('programa-vitalicio')}
              className="text-amber-700 dark:text-amber-400 font-bold hover:text-amber-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Vitalício {formatBRL(founderPrice)}</span>
            </button>
            <button
              onClick={() => scrollToSection('demonstracao-app')}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Demonstração
            </button>
            <button
              onClick={() => scrollToSection('vantagens-lojistas')}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Vantagens
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

          {/* Zone 3: Demo Test + Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleStartFullDemo('home')}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Testar App (Demo)</span>
            </button>

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

      {/* HERO SECTION: Vibrant Cobalt Blue + Warm Orange CTA + Vitalício & Demo Entry */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column: Proposition, Countdown & Prominent CTAs */}
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
                  Contagem regressiva para abertura oficial ao público de {cityLabel}:
                </p>
                <CountdownTimer
                  targetDateIso={launch.targetDateIso}
                  variant="hero"
                  expiredLabel="Abertura oficial liberada · Garanta o cadastro da sua empresa"
                />
              </div>

              {/* Primary Conversion CTAs + Interactive Demo Button */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleGoToPlans}
                    className="px-6 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm sm:text-base font-extrabold shadow-xl shadow-orange-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>{launch.ctaText}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('demonstracao-app')}
                    className="px-5 py-4 rounded-xl bg-blue-600/40 hover:bg-blue-600/60 border border-blue-400/50 text-white text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Compass className="w-4 h-4 text-amber-300" />
                    <span>Ver Demonstração & Testar App</span>
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

                {/* Highlight Strip for R$ 500 Lifetime Founder Program */}
                <button
                  type="button"
                  onClick={() => scrollToSection('programa-vitalicio')}
                  className="w-full sm:w-auto text-left px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 transition flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-100">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-amber-300">Programa Vitalício {formatBRL(founderPrice)}:</strong> Pague 1 única vez por 1 loja + {founderLimit} produtos/serviços sem mensalidade
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-300 shrink-0" />
                </button>

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
                    alt={`Lojista em ${cityLabel} apresentando catálogo digital aos clientes`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-800 via-blue-900 to-slate-950 flex flex-col items-center justify-center p-8 text-center">
                    <Store className="w-12 h-12 text-orange-400 mb-3" />
                    <p className="font-display font-bold text-lg text-white">
                      Vitrine Local · {cityLabel}
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6">
                  <p className="text-xs font-semibold text-orange-300">
                    Comércio Local · {cityLabel}
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-white font-display leading-snug">
                    Sua loja encontrada por quem busca perto de você, com contato direto no WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Proof Strip */}
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
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-amber-400">
                {formatBRL(founderPrice)}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-blue-100">
                Programa Vitalício único (sem mensalidade)
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

      {/* SECTION 1.5: PROGRAMA VITALÍCIO SÓCIO FUNDADOR (DESTAQUE ESPECIAL R$ 500) */}
      <section
        id="programa-vitalicio"
        className="pt-12 sm:pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950/90 to-slate-900 border-2 border-amber-500/50 text-white p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Proposition & Economic Proof */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Edição Limitada de Lançamento · Programa Vitalício</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight text-balance">
                Torne-se <span className="text-amber-400">Sócio Fundador</span> por {formatBRL(founderPrice)} e nunca mais pague mensalidade
              </h2>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                Em vez de pagar {formatBRL(premiumMonthly)} todo mês no Plano Premium Ouro, você faz{' '}
                <strong className="text-white">um único pagamento de {formatBRL(founderPrice)}</strong> e garante presença VIP perpétua para sua loja. Em apenas{' '}
                <strong className="text-amber-300">{breakEvenMonths} meses</strong> o investimento já se paga — gerando uma economia superior a{' '}
                <strong className="text-emerald-300">{formatBRL(savings24m)}</strong> nos primeiros 2 anos.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Até {founderLimit} produtos/serviços</strong> somados em {founderStores} loja completa
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Destaques VIP do Premium</strong> + topo das buscas na cidade
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Banners Rotativos</strong> cadastrados direto pelo painel do lojista
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Selo Exclusivo Sócio Fundador</strong> visível para os clientes
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Focused Investment Card */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/95 border border-amber-400/40 space-y-5 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 uppercase tracking-wider">
                    {founderPlan.badge}
                  </span>
                  <span className="font-mono font-bold text-slate-300">
                    {founderLimit} itens · Vitalício
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Pagamento único (sem renovação mensal)</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-amber-400">
                      {formatBRL(founderPrice)}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">único</span>
                  </div>
                  <p className="mt-1.5 text-xs text-emerald-300 font-semibold">
                    ou em até 12x de {formatBRL(founderInstallment12x)} no cartão · PIX instantâneo
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleChoosePlanDirect(founderPlan.id)}
                    className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Garantir Vaga Vitalícia ({formatBRL(founderPrice)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleGoToFounderPage}
                    className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ver Página Completa de Benefícios Sócio Fundador</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: DEMONSTRAÇÃO GUIADA & ACESSO AO APLICATIVO COMPLETO */}
      <section
        id="demonstracao-app"
        className="pt-14 sm:pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>Demonstração Interativa · Teste o Aplicativo por Dentro</span>
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
                Veja como funciona na prática e teste todo o guia antes de cadastrar sua loja
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Já deixamos{' '}
                <strong className="text-slate-900 dark:text-white">
                  {activeBusinesses.length} lojas, {activeProducts.length} produtos e {activeServices.length} serviços
                </strong>{' '}
                ativos no ambiente de demonstração para você explorar exatamente como o morador pesquisa e compra pela cidade.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleStartFullDemo('home')}
              className="px-6 py-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-extrabold shadow-lg shadow-blue-700/20 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Acessar Aplicativo Completo (Modo Teste)</span>
            </button>
          </div>

          {/* 3-Step Visual Guide: Como fazer pesquisa & ver produtos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold font-mono text-blue-700 dark:text-blue-400">
                  PASSO 01 · PESQUISA TRIPLA
                </span>
                <Search className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Como fazer a pesquisa na Home
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Na página inicial existem <strong>3 campos independentes</strong>: pesquise pelo nome ou bairro em{' '}
                <strong>Empresas</strong>, pelo item desejado em <strong>Produtos</strong> ou pelo atendimento em <strong>Serviços</strong>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold font-mono text-orange-600 dark:text-orange-400">
                  PASSO 02 · VITRINE E PREÇOS
                </span>
                <ShoppingBag className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Como ver os produtos e lojas
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ao pesquisar ou abrir a aba <strong>Produtos</strong>, você vê foto, preço, desconto e descrição. Clicando em qualquer loja, abre o catálogo completo daquela empresa.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  PASSO 03 · WHATSAPP & PAINEL
                </span>
                <MessageCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Testar pedido e área do lojista
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Dentro de qualquer produto existe o botão direto <strong>Chamar no WhatsApp</strong>. Você também pode navegar por <strong>Lojas</strong>, <strong>Categorias</strong> e testar a <strong>Área do Lojista</strong>.
              </p>
            </div>
          </div>

          {/* Interactive Try-Right-Now Search Box + Live Sample Products */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2 border-t border-slate-200 dark:border-slate-800">
            {/* Left: Interactive Sandbox Search Tester */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Experimente uma busca agora mesmo</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Escolha o que deseja buscar, digite uma palavra (ou clique em um exemplo) e veja o resultado dentro do aplicativo real.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDemoSearchType('products')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    demoSearchType === 'products'
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Produtos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoSearchType('stores')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    demoSearchType === 'stores'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Empresas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoSearchType('services')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    demoSearchType === 'services'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Serviços</span>
                </button>
              </div>

              <form onSubmit={handleDemoSearchSubmit} className="space-y-2.5">
                <input
                  type="text"
                  value={demoQuery}
                  onChange={(e) => setDemoQuery(e.target.value)}
                  placeholder={
                    demoSearchType === 'products'
                      ? 'Ex: Café, Camisa, Celular...'
                      : demoSearchType === 'stores'
                      ? 'Ex: Grão Nobre, Centro...'
                      : 'Ex: Manutenção, Corte...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">Sugestões:</span>
                  {quickSearchSuggestions.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleStartFullDemo(demoSearchType, term)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Testar Busca Agora no App</span>
                </button>
              </form>
            </div>

            {/* Right: Live Product Samples Preview */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Amostra real de produtos já visíveis na demonstração
                </h3>
                <button
                  type="button"
                  onClick={() => handleStartFullDemo('products')}
                  className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir todos os {activeProducts.length} produtos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sampleProducts.map((prod) => {
                  const store = businesses.find((b) => b.id === prod.businessId);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleStartFullDemo('products', prod.name)}
                      className="text-left rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-orange-500 overflow-hidden transition group cursor-pointer flex flex-col justify-between"
                    >
                      <div className="aspect-[4/3] w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-[11px] font-semibold text-slate-500 truncate">
                          {store?.name || prod.category}
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {prod.name}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-extrabold font-mono text-orange-600 dark:text-orange-400">
                            {formatBRL(prod.price)}
                          </span>
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            Ver →
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleStartFullDemo('home')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Ir para Tela Inicial (3 Buscas)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartFullDemo('stores')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ver Guia de Lojas ({activeBusinesses.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartFullDemo('services')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ver Serviços ({activeServices.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Persuasive Benefits (Admin-Editable) */}
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

      {/* SECTION 4: Comparison Table */}
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

            <div className="p-6 sm:p-8 rounded-2xl bg-blue-950 text-white border border-blue-800">
              <p className="text-xs font-semibold text-orange-300 mb-1">
                Guia Oficial de {cityLabel}
              </p>
              <h3 className="text-lg font-bold text-white font-display mb-5">
                Sua marca com o achenacidade
              </h3>
              <ul className="space-y-3.5 text-sm text-blue-100">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>Zero comissão sobre pedidos — escolha mensal ou o plano vitalício de {formatBRL(founderPrice)}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>Loja ativa 24h na busca local para quem quer comprar agora</span>
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

      {/* SECTION 5: Plans Preview */}
      <section id="planos-lancamento" className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">
            Escolha Como Começar
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
            Planos disponíveis para cadastrar sua empresa hoje
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Selecione o plano ideal para o seu momento — comece no gratuito ou garanta o vitalício Sócio Fundador por {formatBRL(founderPrice)}.
          </p>
        </div>

        {(() => {
          const publicLaunchPlans = plans.filter((p) => !p.isInviteOnly);
          return (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 ${
                publicLaunchPlans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              } gap-6 max-w-7xl mx-auto`}
            >
              {publicLaunchPlans.map((plan) => {
                const isLifetime = isLifetimePlan(plan);
                const isFounder = isFounderPlan(plan);
                const amount = isLifetime ? Number(plan.priceOnce || 0) : plan.priceMonthly;
                const isFree = amount === 0;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-6 flex flex-col justify-between bg-white dark:bg-slate-900 ${
                      isFounder
                        ? 'border-2 border-amber-500 shadow-lg shadow-amber-500/10'
                        : plan.highlighted
                        ? 'border-2 border-orange-500 shadow-lg shadow-orange-500/10'
                        : 'border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <span
                          className={`font-bold ${
                            isFounder
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          {plan.badge}
                        </span>
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Package className="w-3.5 h-3.5 text-orange-500" />
                          Até {plan.productLimit} anúncios
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                        {plan.name}
                      </h3>

                      <div className="mt-3 mb-5">
                        {isFree ? (
                          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                            Grátis
                          </span>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-semibold text-slate-500">R$</span>
                              <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                                {amount.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-xs text-slate-500">
                                {isLifetime ? 'único' : '/mês'}
                              </span>
                            </div>
                            {isLifetime && (
                              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                                Pagamento único · Vitalício · {plan.businessLimit || 1} loja
                              </p>
                            )}
                          </div>
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

                    <div className="space-y-2.5">
                      <button
                        onClick={() => handleChoosePlanDirect(plan.id)}
                        className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                          isFounder
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md shadow-amber-500/20'
                            : plan.highlighted
                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'
                        }`}
                      >
                        <span>Escolher {plan.name}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>
                      {isFounder && (
                        <button
                          type="button"
                          onClick={handleGoToFounderPage}
                          className="w-full text-center text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          Ver página de benefícios Sócio Fundador
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

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

      {/* SECTION 6: FAQ + Final Conversion Banner */}
      <section id="duvidas-lancamento" className="pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display text-center mb-6">
            Perguntas Frequentes de Lojistas
          </h2>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Como funciona o Programa Vitalício de {formatBRL(founderPrice)}?</span>
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6">
              Você realiza um único pagamento de {formatBRL(founderPrice)} (à vista no PIX ou parcelado no cartão) e garante para sempre 1 loja com até {founderLimit} produtos/serviços, selo exclusivo de Sócio Fundador, destaques VIP e banners rotativos sem nenhuma mensalidade futura.
            </p>
          </div>

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
              <span>Posso testar o aplicativo completo antes de cadastrar minha empresa?</span>
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6">
              Sim! Clique em <strong>Testar App (Demo)</strong> para navegar por todo o aplicativo, fazer pesquisas nos 3 campos (Empresas, Produtos e Serviços) e visualizar produtos reais com botão de WhatsApp.
            </p>
          </div>
        </div>

        {/* Final CTA Box */}
        <div className="p-7 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-balance">
            Garanta a presença da sua empresa antes da abertura em {cityLabel}
          </h2>
          <p className="text-sm text-blue-100 max-w-xl mx-auto">
            Teste o aplicativo completo agora mesmo ou escolha o plano ideal (incluindo o Vitalício de {formatBRL(founderPrice)}).
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleGoToPlans}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm sm:text-base font-extrabold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>{launch.ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleStartFullDemo('home')}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              <span>Testar Aplicativo Completo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} achenacidade · Guia Comercial Oficial de {cityLabel}
          </p>

          <div className="flex items-center gap-4">
            {hasWhatsappGroup && (
              <a
                href={appGeneralConfig.whatsappGroupUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{appGeneralConfig.whatsappGroupLabel || 'Grupo no WhatsApp'}</span>
              </a>
            )}
            <button
              onClick={handleGoToLogin}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Área do Lojista</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
