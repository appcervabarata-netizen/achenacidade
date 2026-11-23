import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { formatBRL, isFounderPlan } from '../../utils/planPricing';
import { normalizeWhatsappUrl } from '../../utils/seoHelper';
import founderHeroImg from '../../assets/images/founder_hero_commerce_1795445550851.jpg';
import founderShowcaseImg from '../../assets/images/founder_flagship_showcase_1795445552522.jpg';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  Crown,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  Store,
} from 'lucide-react';

export const FounderSalesPage: React.FC = () => {
  const {
    plans,
    authSession,
    currentBusinessAuth,
    setPreselectedPlanId,
    setCurrentView,
    openCheckoutPage,
    appGeneralConfig,
  } = useDirectory();

  const [heroImgError, setHeroImgError] = useState(false);
  const [showcaseImgError, setShowcaseImgError] = useState(false);

  const founderPlan =
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
        'Mesmos destaques VIP do Plano Premium Ouro',
        'Produtos e serviços em vitrine prioritária na Home',
        'Suporte prioritário via WhatsApp',
      ],
      color: '#B45309',
    };

  const premiumPlan = plans.find((p) => p.id === 'plan-premium');
  const premiumMonthly = Number(premiumPlan?.priceMonthly ?? 99.9);
  const founderPrice = Number(founderPlan.priceOnce ?? 500);
  const itemLimit = Number(founderPlan.productLimit || 150);
  const storeLimit = Number(founderPlan.businessLimit || 1);

  const installment12x = Math.round(((founderPrice / 12) + Number.EPSILON) * 100) / 100;
  const breakEvenMonths = premiumMonthly > 0 ? Math.max(1, Math.ceil(founderPrice / premiumMonthly)) : 5;
  const premium12mTotal = premiumMonthly * 12;
  const premium24mTotal = premiumMonthly * 24;
  const savings24m = Math.max(0, premium24mTotal - founderPrice);

  const isAlreadyFounder =
    authSession.isAuthenticated &&
    authSession.role === 'business' &&
    currentBusinessAuth?.planId === founderPlan.id &&
    currentBusinessAuth?.subscriptionStatus !== 'cancelled';

  const whatsappDirectUrl = normalizeWhatsappUrl(
    appGeneralConfig.whatsappNumber,
    `Olá! Gostaria de saber mais sobre o plano vitalício ${founderPlan.name} no ${appGeneralConfig.appName || 'achenacidade'}.`
  );

  const handleAcquireFounderPlan = () => {
    if (authSession.isAuthenticated && authSession.role === 'business' && currentBusinessAuth) {
      if (isAlreadyFounder) {
        setCurrentView('business_portal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      openCheckoutPage(currentBusinessAuth.id, founderPlan.id, undefined, 'monthly');
      return;
    }
    setPreselectedPlanId(founderPlan.id);
    setCurrentView('register_store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const ctaLabel = isAlreadyFounder
    ? 'Acessar Minha Loja VIP'
    : authSession.isAuthenticated && authSession.role === 'business'
    ? `Ativar Sócio Fundador (${formatBRL(founderPrice)})`
    : 'Garantir Minha Vaga Vitalícia';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 3-Zone Editorial Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand / Back Navigation */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>
                achena<span className="text-orange-600">cidade</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Concise Anchor Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('qualidades-fundador')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Benefícios
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('comparativo-fundador')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Comparativo
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('perfil-ideal')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Para Quem É
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('duvidas-fundador')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dúvidas
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleAcquireFounderPlan}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Garantir Sócio Fundador
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION: Proposition + Editorial Visual + 4-Column KPI Strip */}
      <section className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Proposition */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-8">
              <div>
                <p className="text-xs sm:text-sm font-medium text-amber-400 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{founderPlan.name}</span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span>Pagamento único vitalício</span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="text-slate-300">{appGeneralConfig.cityLabel || 'Diretório Local'}</span>
                </p>

                <h1
                  className="font-extrabold font-display tracking-tight text-white text-balance leading-[1.1]"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)' }}
                >
                  Sua loja com destaque VIP vitalício por um único pagamento de{' '}
                  <span className="text-amber-400 font-mono tabular-nums">
                    {formatBRL(founderPrice)}
                  </span>
                </h1>

                <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  Pague uma única vez (à vista no PIX ou em até 12x de {formatBRL(installment12x)} no cartão) e garanta{' '}
                  <strong className="text-white">{storeLimit} {storeLimit === 1 ? 'loja dedicada' : 'lojas'}</strong> com até{' '}
                  <strong className="text-white">{itemLimit} produtos ou serviços</strong>, zero mensalidade para sempre, prioridade máxima do Premium Ouro e selo exclusivo de Sócio Fundador VIP.
                </p>
              </div>

              {/* Action Block */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAcquireFounderPlan}
                    className="px-6 py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm sm:text-base font-bold transition-colors flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowRight className="w-5 h-5 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('plans');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 text-center"
                  >
                    Comparar com outros planos
                  </button>
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Acesso imediato ao painel do lojista após confirmação via PIX ou Cartão · Sem fidelidade ou mensalidades futuras
                  </span>
                </p>
              </div>
            </div>

            {/* Right Visual Showcase */}
            <div className="lg:col-span-5 flex">
              <div className="relative w-full min-h-[280px] sm:min-h-[360px] lg:h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                {!heroImgError ? (
                  <img
                    src={founderHeroImg}
                    alt="Lojista acompanhando catálogo digital e pedidos no plano Sócio Fundador"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex flex-col items-center justify-center p-8 text-center">
                    <Crown className="w-12 h-12 text-amber-400 mb-3" />
                    <p className="font-display font-bold text-lg text-white">
                      {founderPlan.name} · Vitalício
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                <div className="absolute bottom-0 inset-x-0 p-6">
                  <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 shrink-0" />
                    <span>Selo Exclusivo Sócio Fundador VIP</span>
                  </p>
                  <p className="mt-1.5 text-base font-bold text-white font-display leading-snug">
                    Sua marca destacada para clientes da cidade inteira, sem depender de aluguel mensal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Proof KPI Strip */}
          <div className="mt-12 pt-8 border-t border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-amber-400">
                {formatBRL(founderPrice)}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Valor único vitalício (ou até 12x no cartão)
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                0 reais
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                De mensalidade recorrente após a ativação
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-amber-400">
                {itemLimit} itens
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Produtos e serviços combinados na vitrine
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                {breakEvenMonths} meses
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Tempo para o plano se pagar frente ao Premium mensal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Asymmetric Bento Grid of Qualities & Characteristics */}
      <section
        id="qualidades-fundador"
        className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
            Qualidades e Características do Plano
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
            Tudo o que sua empresa recebe ao entrar como Sócio Fundador
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Criado para lojistas e prestadores de serviços que querem estabilidade de longo prazo, máximo destaque no diretório e vitrine ampla sem custos mensais acumulando todo mês.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature 01 (Wide Bento Span 2) */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">01.</span>
              <span>Blindagem Financeira Vitalícia</span>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                Investimento único de {formatBRL(founderPrice)} — sem mensalidade e sem reajustes
              </h3>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Enquanto assinaturas mensais cobram mês após mês pelo resto da operação da sua loja, o plano Sócio Fundador quita sua presença VIP de forma definitiva. Pague à vista via PIX ou parcele no cartão em até 12 vezes e nunca mais receba boleto mensal de assinatura para essa loja.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              <span>1 loja completa incluída</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span>Sem taxa de renovação anual</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span>0% de comissão por venda</span>
            </div>
          </div>

          {/* Showcase Image Card (Span 1) */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
            <div className="relative h-48 sm:h-56 lg:h-full min-h-[210px] bg-slate-200 dark:bg-slate-800">
              {!showcaseImgError ? (
                <img
                  src={founderShowcaseImg}
                  alt="Vitrine comercial estruturada com produtos em destaque"
                  referrerPolicy="no-referrer"
                  onError={() => setShowcaseImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-amber-50 dark:bg-amber-950/30">
                  <Award className="w-10 h-10 text-amber-600 mb-2" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Vitrine VIP Sócio Fundador
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Feature 02 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">02.</span>
              <span>Identidade Exclusiva</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Selo exclusivo Sócio Fundador VIP
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sua empresa exibe a insígnia dourada exclusiva nos resultados da cidade, na capa do pop-up detalhado da loja e no painel administrativo, reforçando credibilidade imediata diante dos clientes locais.
              </p>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">03.</span>
              <span>Alcance Máximo</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Mesmos destaques VIP do Plano Premium Ouro
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ordenação prioritária no topo das buscas por empresas, vitrine em destaque na página inicial e suporte prioritário via WhatsApp sempre que você precisar ajustar sua loja.
              </p>
            </div>
          </div>

          {/* Feature 04 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">04.</span>
              <span>Catálogo Amplo</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Até {itemLimit} produtos e serviços combinados
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Triplo da capacidade do plano Premium padrão para catalogar mercadorias com foto e preço promocional, além de serviços com modalidade de atendimento e tempo estimado.
              </p>
            </div>
          </div>

          {/* Feature 05 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">05.</span>
              <span>Conversão Direta</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                WhatsApp direto e alertas Push para favoritos
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Cada produto ou serviço leva o comprador diretamente ao seu WhatsApp com o item preenchido, sem intermediários. Quem favoritar sua loja também recebe notificações de novas ofertas.
              </p>
            </div>
          </div>

          {/* Feature 06 (Wide Span 2) */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">06.</span>
              <span>Presença Completa e Mensurável</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">
                Ficha comercial completa com links clicáveis, horários em tempo real e métricas reais
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Telefone clicável, endereço integrado ao mapa, Instagram, Facebook, website oficial, grade semanal indicando se a loja está aberta agora e painel com histórico real de visualizações, cliques no WhatsApp e cliques na vitrine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Financial Comparison Table (Proof Adjacent to Claim) */}
      <section
        id="comparativo-fundador"
        className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
              Análise Financeira Objetiva
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
              Por que o plano vitalício se paga em apenas {breakEvenMonths} meses
            </h2>
            <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400">
              Compare o custo acumulado de uma assinatura mensal com o pagamento único de Sócio Fundador.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
                  <th className="py-4 px-5 font-bold">Recurso / Comparativo</th>
                  <th className="py-4 px-5 font-bold">Plano Premium Ouro</th>
                  <th className="py-4 px-5 font-bold text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30">
                    Sócio Fundador (Vitalício)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                <tr>
                  <td className="py-3.5 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Modelo de cobrança
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    {formatBRL(premiumMonthly)}/mês recorrente
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white bg-amber-50/40 dark:bg-amber-950/20 font-mono tabular-nums">
                    {formatBRL(founderPrice)} pagamento único
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Total gasto em 12 meses
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    {formatBRL(premium12mTotal)}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/40 dark:bg-amber-950/20 font-mono tabular-nums">
                    {formatBRL(founderPrice)} (vitalício)
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Total gasto em 24 meses
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    {formatBRL(premium24mTotal)}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/40 dark:bg-amber-950/20 font-mono tabular-nums">
                    {formatBRL(founderPrice)} · Economia de {formatBRL(savings24m)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Produtos e serviços por loja
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    Até {premiumPlan?.productLimit || 50} itens
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white bg-amber-50/40 dark:bg-amber-950/20 font-mono tabular-nums">
                    Até {itemLimit} itens combinados
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Selo de autoridade e prioridade VIP
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                    Selo VIP Premium
                  </td>
                  <td className="py-3.5 px-5 font-bold text-amber-700 dark:text-amber-300 bg-amber-50/40 dark:bg-amber-950/20">
                    Prioridade VIP + Selo Exclusivo Sócio Fundador
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Quantidade de lojas incluídas
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    Até {premiumPlan?.businessLimit || 5} lojas
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white bg-amber-50/40 dark:bg-amber-950/20 font-mono tabular-nums">
                    {storeLimit} {storeLimit === 1 ? 'loja exclusiva' : 'lojas'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 4: Target Audience & Complete Checklist */}
      <section id="perfil-ideal" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Para Quem Este Plano Foi Projetado
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
              Ideal para negócios consolidados que operam uma loja forte na cidade
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Se você gerencia uma loja física ou operação digital principal com catálogo variado (varejo, farmácia, mercado, material de construção, clínica, oficina ou prestadora de serviços) e não precisa cadastrar várias filiais diferentes, o Sócio Fundador entrega mais capacidade de itens por muito menos no médio e longo prazo.
            </p>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-5">
              Resumo do que está garantido no {founderPlan.name}
            </h3>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              {(founderPlan.features || []).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Investimento único</p>
                <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatBRL(founderPrice)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAcquireFounderPlan}
                className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ & Final Conversion Block */}
      <section
        id="duvidas-fundador"
        className="pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12"
      >
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display text-center mb-6">
            Perguntas Frequentes sobre o Sócio Fundador
          </h2>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Realmente não existe nenhuma cobrança mensal depois?</span>
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6">
              Exatamente. O valor de {formatBRL(founderPrice)} é pago uma única vez. Você mantém sua loja ativa com selo Sócio Fundador VIP, destaques prioritários e até {itemLimit} produtos ou serviços sem renovações ou mensalidades futuras.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Posso parcelar os {formatBRL(founderPrice)} no cartão de crédito?</span>
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6">
              Sim. No checkout oficial do portal você pode pagar à vista via PIX com liberação imediata ou parcelar no cartão de crédito em até 12x de {formatBRL(installment12x)}.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Já tenho cadastro no plano Grátis ou mensal. Posso migrar para Sócio Fundador?</span>
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6">
              Sim. Basta estar logado com a sua loja e clicar em Garantir Minha Vaga Vitalícia acima para ir direto ao pagamento do upgrade sem perder seus produtos ou serviços já cadastrados.
            </p>
          </div>
        </div>

        {/* Final Conversion Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-950 text-white border border-slate-800 text-center space-y-5">
          <p className="text-xs font-semibold text-amber-400">
            {founderPlan.name} · Vaga Vitalícia
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-balance max-w-2xl mx-auto">
            Garanta sua loja em destaque vitalício por {formatBRL(founderPrice)} em pagamento único
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Cadastre sua empresa agora ou conclua o pagamento pela sua conta de lojista para liberar na hora os {itemLimit} espaços de catálogo e o selo Sócio Fundador VIP.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleAcquireFounderPlan}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm sm:text-base font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>

            {whatsappDirectUrl && (
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tirar Dúvida no WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} {appGeneralConfig.appName || 'achenacidade'} · {appGeneralConfig.cityLabel || 'Diretório Comercial'}
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setCurrentView('plans');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Todos os Planos
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentView('login');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Portal do Lojista</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
