import React from 'react';
import { BillingCycle, Plan, PlanDiscountConfig } from '../../types';
import {
  BILLING_CYCLE_LIST,
  BILLING_CYCLE_META,
  clampDiscountPercent,
  isInviteTrialPlan,
  isLifetimePlan,
} from '../../utils/planPricing';

interface BillingCycleSelectorProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  globalDiscounts: PlanDiscountConfig;
  plan?: Plan;
  compact?: boolean;
}

export const BillingCycleSelector: React.FC<BillingCycleSelectorProps> = ({
  value,
  onChange,
  globalDiscounts,
  plan,
  compact = false,
}) => {
  if (plan && isLifetimePlan(plan)) {
    return (
      <div className="px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
        <span>Pagamento Único · Vitalício</span>
        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
          Sem renovação mensal
        </span>
      </div>
    );
  }

  if (plan && isInviteTrialPlan(plan)) {
    return (
      <div className="px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2">
        <span>Convite VIP · {plan.trialMonths || 6} meses grátis</span>
        <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
          Sem cobrança no período inicial
        </span>
      </div>
    );
  }

  const getCycleDiscountBadge = (cycle: BillingCycle): number => {
    if (cycle === 'monthly') return 0;
    if (plan?.useCustomDiscounts && plan.cycleDiscounts) {
      return clampDiscountPercent(plan.cycleDiscounts[cycle]);
    }
    return clampDiscountPercent(globalDiscounts[cycle]);
  };

  return (
    <div
      role="group"
      aria-label="Selecionar ciclo de pagamento"
      className={`inline-grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-1.5 ${
        compact ? 'w-full' : 'w-full max-w-2xl'
      }`}
    >
      {BILLING_CYCLE_LIST.map((cycle) => {
        const meta = BILLING_CYCLE_META[cycle];
        const discount = getCycleDiscountBadge(cycle);
        const isActive = value === cycle;

        return (
          <button
            key={cycle}
            type="button"
            onClick={() => onChange(cycle)}
            className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900'
            }`}
          >
            <span>{meta.shortLabel}</span>
            {discount > 0 && (
              <span
                className={`text-[11px] font-mono tabular-nums font-extrabold ${
                  isActive
                    ? 'text-orange-300'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                -{discount}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
