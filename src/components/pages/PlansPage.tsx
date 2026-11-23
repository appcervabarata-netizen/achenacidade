import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { RotatingBanner } from '../common/RotatingBanner';
import { BillingCycleSelector } from '../common/BillingCycleSelector';
import {
  calculatePlanPricing,
  formatBRL,
  isFounderPlan,
  isLifetimePlan,
} from '../../utils/planPricing';
import {
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Megaphone,
  Building2,
  Package,
  Crown,
  Ticket,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const PlansPage: React.FC = () => {
  const {
    plans,
    setCurrentView,
    setBusinessPortalTab,
    currentBusinessAuth,
    openPaymentModal,
    siteModeConfig,
    setPreselectedPlanId,
    planDiscountConfig,
    preselectedBillingCycle,
    setPreselectedBillingCycle,
    activeInviteCode,
    validatedInvite,
    inviteValidationError,
    validateInviteCode,
    applyInviteCodeToBusiness,
  } = useDirectory();

  const [inviteInput, setInviteInput] = useState(activeInviteCode || '');
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteRedeemMsg, setInviteRedeemMsg] = useState<string | null>(null);

  const isRestrictedMode = siteModeConfig.mode !== 'normal';
  const publicPlans = plans.filter((p) => !p.isInviteOnly);

  const handleChoosePlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    const pricing = plan ? calculatePlanPricing(plan, preselectedBillingCycle, planDiscountConfig) : null;
    if (currentBusinessAuth) {
      if (plan && pricing?.isPaid) {
        openPaymentModal(planId, currentBusinessAuth.id, preselectedBillingCycle);
        return;
      }
    }
    setPreselectedPlanId(planId);
    setCurrentView('register_store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleValidateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteRedeemMsg(null);
    if (!inviteInput.trim()) return;
    setInviteChecking(true);
    await validateInviteCode(inviteInput);
    setInviteChecking(false);
  };

  const handleUseValidatedInvite = async () => {
    if (!validatedInvite) return;
    if (currentBusinessAuth) {
      setInviteChecking(true);
      const res = await applyInviteCodeToBusiness(validatedInvite.code, currentBusinessAuth.id);
      setInviteChecking(false);
      if (res.success) {
        setInviteRedeemMsg('Convite ativado! Sua loja agora possui 6 meses grátis do Plano Premium.');
        setBusinessPortalTab('plans');
        setCurrentView('business_portal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    setPreselectedPlanId(validatedInvite.planId || 'plan-invite-premium-6m');
    setCurrentView('register_store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-12">
      {isRestrictedMode && (
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {siteModeConfig.mode === 'launch'
                ? 'Voltar ao Lançamento'
                : 'Voltar à Página de Manutenção'}
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="achenacidade" className="w-8 h-8 object-contain rounded-full bg-white" />
            <span className="font-extrabold text-slate-900 dark:text-white font-display text-sm whitespace-nowrap">
              achena<span className="text-orange-600">cidade</span>
            </span>
          </div>

          <button
            onClick={() => setCurrentView('register_store')}
            className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            Ir para Cadastro
          </button>
        </div>
      )}

      {/* Upper Rotating Ad Banner (Admin-managed & separately billed) */}
      {!isRestrictedMode && <RotatingBanner position="rotating_header" />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Header & Cycle Selector */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Planos para Empresas & Lojistas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display text-balance">
            Divulgue sua Empresa, Produtos e Serviços na Cidade
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Escolha o ciclo de pagamento para desbloquear descontos automáticos de longo prazo ou garanta o plano vitalício Sócio Fundador.
          </p>

          <div className="mt-6 flex flex-col items-center gap-2">
            <BillingCycleSelector
              value={preselectedBillingCycle}
              onChange={setPreselectedBillingCycle}
              globalDiscounts={planDiscountConfig}
            />
            {preselectedBillingCycle !== 'monthly' && (
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                Economize garantindo seu plano recorrente com pagamento em até 12x no cartão ou PIX com desconto aplicado.
              </p>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            publicPlans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          } gap-6 max-w-7xl mx-auto mb-10`}
        >
          {publicPlans.map((plan) => {
            const pricing = calculatePlanPricing(plan, preselectedBillingCycle, planDiscountConfig);
            const isFree = pricing.isFree;
            const isLifetime = isLifetimePlan(plan);
            const isFounder = isFounderPlan(plan);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 bg-white dark:bg-slate-900 transition-all ${
                  isFounder
                    ? 'border-2 border-amber-500 shadow-xl shadow-amber-500/15 ring-2 ring-amber-400/20'
                    : plan.highlighted
                    ? 'border-2 border-orange-500 shadow-xl shadow-orange-500/10 lg:-translate-y-1.5'
                    : 'border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                }`}
              >
                {(plan.highlighted || isFounder) && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-sm whitespace-nowrap ${
                        isFounder
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                          : 'bg-orange-600'
                      }`}
                    >
                      {isFounder ? <Crown className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                      {isFounder ? 'Sócio Fundador · Vitalício' : 'Mais Popular'}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4 pt-1">
                    <span
                      className={`text-xs font-bold ${
                        isFounder
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 font-mono tabular-nums">
                      <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      Até {plan.productLimit} itens
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                    {plan.name}
                  </h3>

                  <div className="mt-4 mb-5">
                    {isFree ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                          Grátis
                        </span>
                        <span className="text-xs font-medium text-slate-500">sempre gratuito</span>
                      </div>
                    ) : isLifetime ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-semibold text-slate-500">R$</span>
                          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                            {pricing.totalAmount.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          Pagamento único · Sem mensalidade · Vitalício
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {pricing.discountPercent > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="line-through text-slate-400 font-mono tabular-nums">
                              {formatBRL(pricing.baseMonthly)}/mês
                            </span>
                            <span className="font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                              {pricing.discountPercent}% OFF ({pricing.shortLabel})
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-semibold text-slate-500">R$</span>
                          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                            {pricing.effectiveMonthly.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs font-medium text-slate-500">/mês equiv.</span>
                        </div>

                        {pricing.months > 1 ? (
                          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 pt-1">
                            <p className="font-bold tabular-nums">
                              Total {pricing.label}:{' '}
                              <span className="font-mono text-blue-700 dark:text-blue-400">
                                {formatBRL(pricing.totalAmount)}
                              </span>
                            </p>
                            {pricing.discountAmount > 0 && (
                              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                Economia de {formatBRL(pricing.discountAmount)} no ciclo
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Cobrança mensal · Descontos disponíveis acima
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quota Indicator */}
                  <div
                    className={`p-3 rounded-xl border mb-6 text-xs space-y-1.5 ${
                      isFounder
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <Building2 className={`w-3.5 h-3.5 shrink-0 ${isFounder ? 'text-amber-600' : 'text-blue-600'}`} />
                      <span>
                        Até {plan.businessLimit || 1}{' '}
                        {(plan.businessLimit || 1) === 1 ? 'loja exclusiva' : 'lojas por conta'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Package className={`w-3.5 h-3.5 shrink-0 ${isFounder ? 'text-amber-600' : 'text-blue-600'}`} />
                      <span>
                        Até <strong>{plan.productLimit} anúncios somados</strong> (produtos e/ou serviços)
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleChoosePlan(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs whitespace-nowrap ${
                      isFounder
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                        : plan.highlighted
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900'
                    }`}
                  >
                    <span>
                      {currentBusinessAuth
                        ? isFree
                          ? 'Plano Gratuito em Uso'
                          : isLifetime
                          ? `Virar Sócio Fundador (${formatBRL(pricing.totalAmount)})`
                          : `Contratar ${pricing.shortLabel} (${formatBRL(pricing.totalAmount)})`
                        : isFounder
                        ? 'Garantir Sócio Fundador'
                        : 'Anunciar Minha Loja'}
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  {isFounder && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('founder_sales');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full text-center text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Conhecer página de vantagens Sócio Fundador
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Invite Code Activation Box (Convite Premium 6 Meses) */}
        <div className="max-w-3xl mx-auto mb-12 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Possui um Código de Convite VIP (6 Meses Grátis)?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  O plano Convite Premium de 6 meses grátis é exclusivo para códigos ou links gerados pelo administrador.
                </p>
              </div>
            </div>

            <form onSubmit={handleValidateInvite} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                placeholder="Ex: VIP6M-XXXX-XXXX"
                className="flex-1 sm:w-48 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={inviteChecking}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {inviteChecking ? 'Validando...' : 'Validar Convite'}
              </button>
            </form>
          </div>

          {validatedInvite && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Código <strong>{validatedInvite.code}</strong> válido! Libera <strong>6 meses grátis do Plano Premium Ouro</strong> e após o período você decide o próximo plano ou cancela.
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseValidatedInvite}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                {currentBusinessAuth ? 'Ativar na Minha Loja' : 'Cadastrar com Convite'}
              </button>
            </div>
          )}

          {inviteValidationError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{inviteValidationError}</span>
            </div>
          )}

          {inviteRedeemMsg && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{inviteRedeemMsg}</span>
            </div>
          )}
        </div>

        {/* Notice on Sponsored Rotating Banners (Cobrados separadamente) */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white border border-blue-500/30 shadow-xl mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-600 text-white">
                    Publicidade Exclusiva
                  </span>
                  <span className="text-xs text-amber-300">Cobrado Separadamente</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Quer Banners Rotativos no Topo e Rodapé?
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
                  Os banners publicitários são cadastrados exclusivamente pelo administrador e possuem contratação avulsa para máximo alcance da sua marca para visitantes de toda a cidade.
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('login')}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold shrink-0 transition shadow-md cursor-pointer"
            >
              Falar com Admin
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">
            Perguntas Frequentes
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Como funciona a cota somada de Produtos e Serviços?
              </h4>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 pl-6">
                Os cadastros de produtos e serviços compartilham o mesmo limite do seu plano (ex: 3 no Grátis, 15 no Pro e 50 no Premium Ouro). Você escolhe livremente como usar: apenas produtos, apenas serviços ou os dois combinados.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Como os clientes entram em contato?
              </h4>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 pl-6">
                Todas as suas ofertas contam com botão direto para o seu WhatsApp oficial, com mensagem pré-preenchida contendo o nome e valor do produto desejado.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
