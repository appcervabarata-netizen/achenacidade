import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { RotatingBanner } from '../common/RotatingBanner';
import {
  Check,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Megaphone,
  CreditCard,
  Building2,
  Package,
} from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { plans, setCurrentView } = useDirectory();

  const handleChoosePlan = () => {
    // Lead visitor directly to register their store
    setCurrentView('register_store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-12">
      {/* Upper Rotating Ad Banner (Admin-managed & separately billed) */}
      <RotatingBanner position="rotating_header" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Planos para Empresas & Lojistas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
            Divulgue sua Empresa e Produtos na Internet
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Escolha o plano ideal para a quantidade de produtos que você deseja expor para milhares de clientes na sua cidade.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-14">
          {plans.map((plan) => {
            const isFree = plan.priceMonthly === 0;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 transition-all ${
                  plan.highlighted
                    ? 'border-2 border-orange-500 shadow-xl shadow-orange-500/10 scale-102 lg:-translate-y-2'
                    : 'border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Mais Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {plan.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      Até {plan.productLimit} produtos
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                    {plan.name}
                  </h3>

                  <div className="mt-4 mb-6 flex items-baseline gap-1">
                    {isFree ? (
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                        Grátis
                      </span>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-500">R$</span>
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                          {plan.priceMonthly.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs font-medium text-slate-500">/mês</span>
                      </>
                    )}
                  </div>

                  {/* Quota Indicator */}
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 mb-6 text-xs text-blue-800 dark:text-blue-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Até {plan.businessLimit || 1} {plan.businessLimit === 1 ? 'loja' : 'lojas'} por conta</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Até {plan.productLimit} produtos por loja</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button -> Leads to Login / Registration */}
                <button
                  onClick={handleChoosePlan}
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                    plan.highlighted
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900'
                  }`}
                >
                  <span>Anunciar Minha Loja</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
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
                Como funciona o limite de produtos?
              </h4>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 pl-6">
                Cada plano permite cadastrar um número máximo de produtos (ex: 3 no Grátis, 15 no Pro e 50 no Premium). Você pode gerenciar, pausar ou atualizar seus itens a qualquer momento pelo Painel da Loja.
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
