import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { Check, Sparkles, Package } from 'lucide-react';

export const PlansSection: React.FC = () => {
  const { plans, openModal } = useDirectory();

  const formatPrice = (value: number) => {
    if (value === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <section id="planos" className="py-16 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isPopular = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  isPopular
                    ? 'bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl ring-4 ring-blue-500/10'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
                    {plan.badge || 'Mais Escolhido'}
                  </div>
                )}

                <div>
                  {/* Plan Name & Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                      {plan.name}
                    </h3>
                    {!isPopular && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tabular-nums">
                      {formatPrice(plan.priceMonthly)}
                    </span>
                    {plan.priceMonthly > 0 && (
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        /mês
                      </span>
                    )}
                  </div>

                  {/* Product Limit Highlight */}
                  <div className="mt-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-900 dark:text-blue-300 font-bold uppercase tracking-wider">
                        Cota de Produtos
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Até {plan.productLimit} produtos anunciados
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openModal('business_portal')}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                    }`}
                  >
                    <span>Quero Anunciar com este Plano</span>
                  </button>
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
