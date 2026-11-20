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

export interface ApiMutationResult {
  ok: boolean;
  databaseEnabled: boolean;
  error?: string;
}

export interface DatabaseDiagnostics {
  configured: boolean;
  connected: boolean;
  seeded: boolean;
  version?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  counts?: Record<string, number>;
  migratedColumns?: string[];
  error?: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    return body?.error || body?.message || `${fallback} (HTTP ${res.status})`;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  try {
    const res = await fetch('/api/bootstrap', {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const error = await parseErrorMessage(res, 'Falha ao carregar dados do banco MySQL');
      return { databaseEnabled: false, seeded: false, error };
    }
    return (await res.json()) as BootstrapResponse;
  } catch (err) {
    return {
      databaseEnabled: false,
      seeded: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao consultar /api/bootstrap',
    };
  }
}

export async function seedDatabase(payload: DirectoryBootstrapPayload): Promise<BootstrapResponse> {
  try {
    const res = await fetch('/api/bootstrap/seed', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await parseErrorMessage(res, 'Falha ao inicializar tabelas no MySQL');
      return { databaseEnabled: true, seeded: false, error };
    }
    return (await res.json()) as BootstrapResponse;
  } catch (err) {
    return {
      databaseEnabled: false,
      seeded: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao inicializar banco',
    };
  }
}

export async function syncAllDataToDb(payload: DirectoryBootstrapPayload): Promise<BootstrapResponse> {
  try {
    const res = await fetch('/api/bootstrap/sync-all', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await parseErrorMessage(res, 'Falha ao enviar dados para o MySQL');
      return { databaseEnabled: true, seeded: false, error };
    }
    return (await res.json()) as BootstrapResponse;
  } catch (err) {
    return {
      databaseEnabled: false,
      seeded: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao sincronizar dados',
    };
  }
}

export async function resetDatabaseDemo(payload: DirectoryBootstrapPayload): Promise<ApiMutationResult> {
  try {
    const res = await fetch('/api/bootstrap/reset', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await parseErrorMessage(res, 'Falha ao resetar banco de dados');
      return { ok: false, databaseEnabled: true, error };
    }
    const data = (await res.json()) as { databaseEnabled?: boolean };
    return { ok: true, databaseEnabled: Boolean(data.databaseEnabled) };
  } catch (err) {
    return {
      ok: false,
      databaseEnabled: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao resetar banco',
    };
  }
}

export async function fetchDbDiagnostics(): Promise<DatabaseDiagnostics> {
  try {
    const res = await fetch('/api/db/diagnostics', {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json()) as DatabaseDiagnostics;
    if (!res.ok && !data.error) {
      return { ...data, connected: false, error: `Erro HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    return {
      configured: false,
      connected: false,
      seeded: false,
      error: err instanceof Error ? err.message : 'Não foi possível alcançar a API do servidor.',
    };
  }
}

export async function migrateDatabaseInDb(): Promise<{
  success: boolean;
  addedColumns: string[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/db/migrate', {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json()) as {
      success?: boolean;
      addedColumns?: string[];
      error?: string;
    };
    return {
      success: Boolean(res.ok && data.success),
      addedColumns: Array.isArray(data.addedColumns) ? data.addedColumns : [],
      error: data.error,
    };
  } catch (err) {
    return {
      success: false,
      addedColumns: [],
      error: err instanceof Error ? err.message : 'Erro ao executar migração SQL.',
    };
  }
}

async function sendJsonMutation(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<ApiMutationResult> {
  try {
    const res = await fetch(url, {
      method,
      keepalive: true,
      cache: 'no-store',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error = await parseErrorMessage(res, `Erro ao salvar no MySQL (${method} ${url})`);
      return { ok: false, databaseEnabled: true, error };
    }
    const data = (await res.json()) as { success?: boolean; databaseEnabled?: boolean; error?: string };
    if (data.success === false) {
      return {
        ok: false,
        databaseEnabled: Boolean(data.databaseEnabled),
        error: data.error || 'Erro ao gravar no MySQL.',
      };
    }
    return { ok: true, databaseEnabled: Boolean(data.databaseEnabled) };
  } catch (err) {
    return {
      ok: false,
      databaseEnabled: true,
      error: err instanceof Error ? err.message : 'Erro de conexão com o servidor.',
    };
  }
}

export function createEntityInDb(resource: string, item: unknown): Promise<ApiMutationResult> {
  return sendJsonMutation(`/api/entities/${encodeURIComponent(resource)}`, 'POST', item);
}

export function updateEntityInDb(
  resource: string,
  id: string,
  updates: Record<string, unknown>
): Promise<ApiMutationResult> {
  return sendJsonMutation(
    `/api/entities/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`,
    'PUT',
    updates
  );
}

export function deleteEntityInDb(resource: string, id: string): Promise<ApiMutationResult> {
  return sendJsonMutation(
    `/api/entities/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`,
    'DELETE'
  );
}

export function saveSettingToDb(key: string, value: unknown): Promise<ApiMutationResult> {
  return sendJsonMutation(`/api/settings/${encodeURIComponent(key)}`, 'PUT', { value });
}

export function recordBannerClickInDb(id: string): Promise<ApiMutationResult> {
  return sendJsonMutation(`/api/banners/${encodeURIComponent(id)}/click`, 'POST');
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
