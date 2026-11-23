import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { Check, Sparkles, Package, Crown } from 'lucide-react';
import { isFounderPlan, isLifetimePlan } from '../../utils/planPricing';

export const PlansSection: React.FC = () => {
  const { plans, openModal, setPreselectedPlanId, setCurrentView, currentBusinessAuth } = useDirectory();

  const visiblePlans = plans.filter((p) => !p.isInviteOnly && p.showOnHome !== false);

  if (visiblePlans.length === 0) {
    return null;
  }

  const formatPrice = (value: number) => {
    if (value === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSelectPlan = (planId: string) => {
    if (currentBusinessAuth) {
      openModal('business_portal');
      return;
    }
    setPreselectedPlanId(planId);
    setCurrentView('register_store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="planos" className="hidden md:block py-16 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Planos de Divulgação</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
            Divulgue sua Empresa e Produtos na Internet
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Escolha o plano ideal para a sua quantidade de produtos e alcance mais clientes na sua cidade com contato direto no WhatsApp.
          </p>
        </div>

        {/* Dynamic Plans Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            visiblePlans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          } gap-6 items-stretch`}
        >
          {visiblePlans.map((plan) => {
            const isPopular = plan.highlighted;
            const isLifetime = isLifetimePlan(plan);
            const isFounder = isFounderPlan(plan);
            const displayAmount = isLifetime ? Number(plan.priceOnce || 0) : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all ${
                  isFounder
                    ? 'bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-xl ring-4 ring-amber-500/10'
                    : isPopular
                    ? 'bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl ring-4 ring-blue-500/10'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                }`}
              >
                {(isPopular || isFounder) && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md whitespace-nowrap flex items-center gap-1 ${
                      isFounder
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                    }`}
                  >
                    {isFounder && <Crown className="w-3 h-3" />}
                    <span>{plan.badge || 'Mais Escolhido'}</span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                      {plan.name}
                    </h3>
                    {!isPopular && !isFounder && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display tabular-nums">
                        {formatPrice(displayAmount)}
                      </span>
                      {displayAmount > 0 && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {isLifetime ? 'único' : '/mês'}
                        </span>
                      )}
                    </div>
                    {isLifetime && (
                      <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Vitalício · Sem mensalidade
                      </p>
                    )}
                  </div>

                  {/* Combined Quota Highlight */}
                  <div
                    className={`mt-5 p-3.5 rounded-2xl border flex items-center gap-3 ${
                      isFounder
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
                        isFounder ? 'bg-amber-600' : 'bg-blue-600'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isFounder ? 'text-amber-900 dark:text-amber-300' : 'text-blue-900 dark:text-blue-300'
                        }`}
                      >
                        {plan.businessLimit || 1} {(plan.businessLimit || 1) === 1 ? 'loja' : 'lojas'} · Produtos + Serviços
                      </div>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        Até {plan.productLimit} itens na vitrine
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action */}
                <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                      isFounder
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                        : isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                    }`}
                  >
                    <span>{isFounder ? 'Garantir Sócio Fundador' : 'Quero Anunciar com este Plano'}</span>
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
                      Ver detalhes completos do Sócio Fundador
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Notice */}
        <div className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
          Sem taxas ocultas ou comissões sobre suas vendas. O contato e o fechamento do negócio é 100% direto entre você e o cliente via WhatsApp.
        </div>

      </div>
    </section>
  );
};
