import { BillingCycle, Plan, PlanDiscountConfig } from '../types';

export const BILLING_CYCLE_LIST: BillingCycle[] = [
  'monthly',
  'annual',
  'biennial',
  'triennial',
];

export const BILLING_CYCLE_META: Record<
  BillingCycle,
  {
    label: string;
    shortLabel: string;
    months: number;
    periodSuffix: string;
  }
> = {
  monthly: {
    label: 'Mensal',
    shortLabel: 'Mensal',
    months: 1,
    periodSuffix: 'mês',
  },
  annual: {
    label: 'Anual (12 meses)',
    shortLabel: 'Anual',
    months: 12,
    periodSuffix: '12 meses',
  },
  biennial: {
    label: 'Bienal (24 meses)',
    shortLabel: 'Bienal',
    months: 24,
    periodSuffix: '24 meses',
  },
  triennial: {
    label: 'Trienal (36 meses)',
    shortLabel: 'Trienal',
    months: 36,
    periodSuffix: '36 meses',
  },
};

export interface CalculatedPlanPricing {
  cycle: BillingCycle;
  label: string;
  shortLabel: string;
  months: number;
  periodSuffix: string;
  isFree: boolean;
  baseMonthly: number;
  baseTotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  effectiveMonthly: number;
  installmentOptions: { count: number; amount: number }[];
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clampDiscountPercent(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(90, Math.round(value * 100) / 100));
}

export function formatBRL(value: number): string {
  return `R$ ${roundCurrency(value).toFixed(2).replace('.', ',')}`;
}

export function parseBillingCycleParam(value: string | null | undefined): BillingCycle {
  if (value === 'annual' || value === 'biennial' || value === 'triennial' || value === 'monthly') {
    return value;
  }
  return 'monthly';
}

export function getEffectiveDiscountPercent(
  plan: Plan | undefined,
  cycle: BillingCycle,
  globalConfig: PlanDiscountConfig
): number {
  if (cycle === 'monthly' || !plan || plan.priceMonthly <= 0) {
    return 0;
  }

  if (plan.useCustomDiscounts && plan.cycleDiscounts) {
    return clampDiscountPercent(plan.cycleDiscounts[cycle]);
  }

  return clampDiscountPercent(globalConfig[cycle]);
}

export function calculatePlanPricing(
  plan: Plan | undefined,
  cycle: BillingCycle,
  globalConfig: PlanDiscountConfig
): CalculatedPlanPricing {
  const meta = BILLING_CYCLE_META[cycle];
  const baseMonthly = plan ? Math.max(0, plan.priceMonthly) : 0;
  const isFree = baseMonthly <= 0;

  if (isFree) {
    return {
      cycle,
      label: meta.label,
      shortLabel: meta.shortLabel,
      months: meta.months,
      periodSuffix: meta.periodSuffix,
      isFree: true,
      baseMonthly: 0,
      baseTotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalAmount: 0,
      effectiveMonthly: 0,
      installmentOptions: [{ count: 1, amount: 0 }],
    };
  }

  const baseTotal = roundCurrency(baseMonthly * meta.months);
  const discountPercent = getEffectiveDiscountPercent(plan, cycle, globalConfig);
  const totalAmount = roundCurrency(baseTotal * (1 - discountPercent / 100));
  const discountAmount = roundCurrency(baseTotal - totalAmount);
  const effectiveMonthly = roundCurrency(totalAmount / meta.months);

  const candidateCounts = cycle === 'monthly' ? [1] : [1, 2, 3, 6, 10, 12];
  const installmentOptions = candidateCounts
    .filter((n) => n === 1 || totalAmount / n >= 10)
    .map((count) => ({
      count,
      amount: roundCurrency(totalAmount / count),
    }));

  return {
    cycle,
    label: meta.label,
    shortLabel: meta.shortLabel,
    months: meta.months,
    periodSuffix: meta.periodSuffix,
    isFree: false,
    baseMonthly,
    baseTotal,
    discountPercent,
    discountAmount,
    totalAmount,
    effectiveMonthly,
    installmentOptions,
  };
}

export function buildMercadoPagoPixPayload(params: {
  pixKey?: string;
  descriptor?: string;
  amount: number;
  reference?: string;
}): string {
  const key = (params.pixKey || 'financeiro@achenacidade.com.br').slice(0, 40);
  const desc = (params.descriptor || 'ACHENACIDADE').replace(/[^A-Za-z0-9]/g, '').slice(0, 20) || 'ACHENACIDADE';
  const formattedAmount = roundCurrency(params.amount).toFixed(2);
  const ref = (params.reference || 'PLANO').replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'PLANO';
  return `00020126580014br.gov.bcb.pix01${String(key.length).padStart(2, '0')}${key}52040000530398654${String(formattedAmount.length).padStart(2, '0')}${formattedAmount}5802BR59${String(desc.length).padStart(2, '0')}${desc}6010ALAGOINHAS62${String(ref.length + 4).padStart(2, '0')}05${String(ref.length).padStart(2, '0')}${ref}6304`;
}

export function calculatePlanExpirationDate(months: number): string {
  const target = new Date();
  target.setMonth(target.getMonth() + months);
  return target.toISOString().split('T')[0];
}
