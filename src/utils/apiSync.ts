import type {
  AdBanner,
  AdminTheme,
  Business,
  Category,
  City,
  EmailLogEntry,
  EmailTemplate,
  EmailTemplateKey,
  MercadoPagoConfig,
  PaymentTransaction,
  Plan,
  PlanDiscountConfig,
  Product,
  Service,
  SessionConfig,
  SiteModeConfig,
  SmtpConfig,
  StoreProductCategory,
} from '../types';

export interface DirectoryBootstrapPayload {
  cities: City[];
  categories: Category[];
  plans: Plan[];
  businesses: Business[];
  products: Product[];
  services: Service[];
  storeProductCategories: StoreProductCategory[];
  banners: AdBanner[];
  paymentTransactions: PaymentTransaction[];
  emailLogs?: EmailLogEntry[];
  settings: {
    adminTheme?: AdminTheme;
    planDiscountConfig?: PlanDiscountConfig;
    mercadoPagoConfig?: MercadoPagoConfig;
    siteModeConfig?: SiteModeConfig;
    smtpConfig?: SmtpConfig;
    emailTemplates?: Record<EmailTemplateKey, EmailTemplate>;
    sessionConfig?: SessionConfig;
  };
}

export interface BootstrapResponse {
  databaseEnabled: boolean;
  seeded: boolean;
  data?: DirectoryBootstrapPayload;
  error?: string;
}

const syncTimers: Record<string, number> = {};
const latestPayloads: Record<string, unknown> = {};

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  try {
    const res = await fetch('/api/bootstrap', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { databaseEnabled: false, seeded: false };
    }
    return (await res.json()) as BootstrapResponse;
  } catch {
    return { databaseEnabled: false, seeded: false };
  }
}

export async function seedDatabase(payload: DirectoryBootstrapPayload): Promise<BootstrapResponse> {
  try {
    const res = await fetch('/api/bootstrap/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { databaseEnabled: false, seeded: false };
    }
    return (await res.json()) as BootstrapResponse;
  } catch {
    return { databaseEnabled: false, seeded: false };
  }
}

export async function resetDatabaseDemo(payload: DirectoryBootstrapPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/bootstrap/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function scheduleCollectionSync(collection: string, items: any[]): void {
  latestPayloads[`col:${collection}`] = items;
  if (syncTimers[`col:${collection}`]) {
    window.clearTimeout(syncTimers[`col:${collection}`]);
  }
  syncTimers[`col:${collection}`] = window.setTimeout(async () => {
    const payload = latestPayloads[`col:${collection}`];
    try {
      await fetch(`/api/sync/${encodeURIComponent(collection)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });
    } catch {
      // Ignore transient network errors
    }
  }, 200);
}

export function scheduleSettingSync(key: string, value: any): void {
  latestPayloads[`set:${key}`] = value;
  if (syncTimers[`set:${key}`]) {
    window.clearTimeout(syncTimers[`set:${key}`]);
  }
  syncTimers[`set:${key}`] = window.setTimeout(async () => {
    const payload = latestPayloads[`set:${key}`];
    try {
      await fetch(`/api/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: payload }),
      });
    } catch {
      // Ignore transient network errors
    }
  }, 200);
}

export async function uploadImageToServer(
  dataUrl: string,
  filename?: string
): Promise<string | null> {
  try {
    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; url?: string };
    return data.success && data.url ? data.url : null;
  } catch {
    return null;
  }
}
