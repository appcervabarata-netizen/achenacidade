import type {
  AdBanner,
  AdminTheme,
  AppGeneralConfig,
  AuthSession,
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
  PlanInvite,
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
    appGeneralConfig?: AppGeneralConfig;
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
  droppedLegacyTables?: string[];
  remainingLegacyTables?: string[];
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
  droppedLegacyTables: string[];
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
      droppedLegacyTables?: string[];
      error?: string;
    };
    return {
      success: Boolean(res.ok && data.success),
      addedColumns: Array.isArray(data.addedColumns) ? data.addedColumns : [],
      droppedLegacyTables: Array.isArray(data.droppedLegacyTables) ? data.droppedLegacyTables : [],
      error: data.error,
    };
  } catch (err) {
    return {
      success: false,
      addedColumns: [],
      droppedLegacyTables: [],
      error: err instanceof Error ? err.message : 'Erro ao executar migração SQL.',
    };
  }
}

export async function cleanupLegacyTablesInDb(): Promise<{
  success: boolean;
  droppedTables: string[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/db/cleanup-legacy', {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json()) as {
      success?: boolean;
      droppedTables?: string[];
      error?: string;
    };
    return {
      success: Boolean(res.ok && data.success),
      droppedTables: Array.isArray(data.droppedTables) ? data.droppedTables : [],
      error: data.error,
    };
  } catch (err) {
    return {
      success: false,
      droppedTables: [],
      error: err instanceof Error ? err.message : 'Erro ao excluir tabelas antigas em português.',
    };
  }
}

export async function loginViaApi(params: {
  loginType: 'admin' | 'business';
  email: string;
  password: string;
}): Promise<{ success: boolean; session?: AuthSession; databaseEnabled?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      session?: AuthSession;
      databaseEnabled?: boolean;
      error?: string;
    };
    if (!res.ok || !data.success || !data.session) {
      return {
        success: false,
        databaseEnabled: data.databaseEnabled,
        error: data.error || 'E-mail ou senha inválidos.',
      };
    }
    return { success: true, session: data.session, databaseEnabled: data.databaseEnabled };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão com o servidor de autenticação.',
    };
  }
}

export async function loginDemoBusinessViaApi(): Promise<{
  success: boolean;
  session?: AuthSession;
  databaseEnabled?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/demo-business', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    const data = (await res.json()) as {
      success?: boolean;
      session?: AuthSession;
      databaseEnabled?: boolean;
      error?: string;
    };
    if (!res.ok || !data.success || !data.session) {
      return {
        success: false,
        databaseEnabled: data.databaseEnabled,
        error: data.error || 'Não foi possível iniciar o acesso automático à área do lojista.',
      };
    }
    return { success: true, session: data.session, databaseEnabled: data.databaseEnabled };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão com o servidor.',
    };
  }
}

export async function verifySessionViaApi(
  token: string
): Promise<{ valid: boolean; session?: AuthSession; networkError?: boolean }> {
  if (!token) return { valid: false };
  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (res.status === 401 || res.status === 403) {
      return { valid: false };
    }
    if (!res.ok) {
      return { valid: false, networkError: true };
    }
    const data = (await res.json()) as { authenticated?: boolean; session?: AuthSession };
    if (!data.authenticated || !data.session) {
      return { valid: false };
    }
    return { valid: true, session: data.session };
  } catch {
    return { valid: false, networkError: true };
  }
}

export async function renewSessionViaApi(
  token: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  if (!token) return { success: false, error: 'Sessão sem token.' };
  try {
    const res = await fetch('/api/auth/renew', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    const data = (await res.json()) as { success?: boolean; session?: AuthSession; error?: string };
    if (!res.ok || !data.success || !data.session) {
      return { success: false, error: data.error || 'Sessão expirada.' };
    }
    return { success: true, session: data.session };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao renovar sessão.',
    };
  }
}

export async function logoutViaApi(token?: string): Promise<void> {
  if (!token) return;
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      keepalive: true,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Ignore logout network errors
  }
}

export async function switchBusinessViaApi(
  token: string,
  businessId: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  if (!token) return { success: false, error: 'Sessão inválida.' };
  try {
    const res = await fetch('/api/auth/switch-business', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ businessId }),
    });
    const data = (await res.json()) as { success?: boolean; session?: AuthSession; error?: string };
    if (!res.ok || !data.success || !data.session) {
      return { success: false, error: data.error || 'Não foi possível alternar a loja.' };
    }
    return { success: true, session: data.session };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao alternar loja.',
    };
  }
}

export async function changeAdminPasswordViaApi(params: {
  token: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!params.token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${params.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        currentPassword: params.currentPassword,
        newPassword: params.newPassword,
      }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Não foi possível alterar a senha.' };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar senha.',
    };
  }
}

export async function issueVerificationCodeViaApi(params: {
  email: string;
  businessId?: string;
  businessName?: string;
  cityName?: string;
  smtp?: SmtpConfig;
  template?: Pick<EmailTemplate, 'subject' | 'heading' | 'body' | 'footerNote'>;
}): Promise<{
  success: boolean;
  deliveryMode?: 'smtp' | 'local_fallback';
  subject?: string;
  debugCode?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/verification-code/issue', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      deliveryMode?: 'smtp' | 'local_fallback';
      subject?: string;
      debugCode?: string;
      error?: string;
    };
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Não foi possível enviar o código de validação.',
      };
    }
    return {
      success: true,
      deliveryMode: data.deliveryMode || 'local_fallback',
      subject: data.subject,
      debugCode: data.debugCode,
      error: data.error,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao emitir código de validação.',
    };
  }
}

export async function verifyEmailCodeViaApi(params: {
  email: string;
  code: string;
  businessId?: string;
}): Promise<{ valid: boolean; businessId?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/verification-code/verify', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      businessId?: string;
      error?: string;
    };
    if (!res.ok || !data.success) {
      return {
        valid: false,
        error: data.error || 'Código de validação inválido.',
      };
    }
    return { valid: true, businessId: data.businessId };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao validar código.',
    };
  }
}

export async function requestPasswordResetViaApi(params: {
  loginType: 'admin' | 'business';
  email: string;
  smtp?: SmtpConfig;
}): Promise<{
  success: boolean;
  deliveryMode?: 'smtp' | 'local_fallback';
  message?: string;
  debugCode?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      deliveryMode?: 'smtp' | 'local_fallback';
      message?: string;
      debugCode?: string;
      error?: string;
    };
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Não foi possível solicitar a redefinição de senha.',
      };
    }
    return {
      success: true,
      deliveryMode: data.deliveryMode,
      message: data.message,
      debugCode: data.debugCode,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao solicitar recuperação de senha.',
    };
  }
}

export async function confirmPasswordResetViaApi(params: {
  loginType: 'admin' | 'business';
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      error?: string;
    };
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Não foi possível redefinir a senha.',
      };
    }
    return {
      success: true,
      message: data.message || 'Senha redefinida com sucesso!',
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao redefinir senha.',
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

export function syncCollectionToDb(collection: string, items: unknown[]): Promise<ApiMutationResult> {
  return sendJsonMutation(`/api/sync/${encodeURIComponent(collection)}`, 'PUT', { items });
}

export function saveSettingToDb(key: string, value: unknown): Promise<ApiMutationResult> {
  return sendJsonMutation(`/api/settings/${encodeURIComponent(key)}`, 'PUT', { value });
}

export function recordBannerClickInDb(id: string): Promise<ApiMutationResult> {
  return sendJsonMutation(`/api/banners/${encodeURIComponent(id)}/click`, 'POST');
}

export async function trackBusinessMetricViaApi(
  businessId: string,
  eventType: 'view' | 'whatsapp_click' | 'showcase_click'
): Promise<void> {
  if (!businessId) return;
  try {
    await fetch('/api/metrics/track', {
      method: 'POST',
      keepalive: true,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, eventType }),
    });
  } catch {
    // Ignore transient network errors during metric tracking
  }
}

export async function fetchBusinessMetricsViaApi(businessId: string): Promise<{
  ok: boolean;
  databaseEnabled: boolean;
  metrics?: {
    viewsTotal: number;
    whatsappClicks: number;
    showcaseClicks: number;
    conversionRate: string;
    daily: Array<{
      date: string;
      label: string;
      views: number;
      whatsappClicks: number;
      showcaseClicks: number;
    }>;
  };
}> {
  if (!businessId) return { ok: false, databaseEnabled: false };
  try {
    const res = await fetch(`/api/metrics/${encodeURIComponent(businessId)}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { ok: false, databaseEnabled: false };
    const data = (await res.json()) as {
      success?: boolean;
      databaseEnabled?: boolean;
      metrics?: {
        viewsTotal: number;
        whatsappClicks: number;
        showcaseClicks: number;
        conversionRate: string;
        daily: Array<{
          date: string;
          label: string;
          views: number;
          whatsappClicks: number;
          showcaseClicks: number;
        }>;
      };
    };
    return {
      ok: Boolean(data.success && data.metrics),
      databaseEnabled: Boolean(data.databaseEnabled),
      metrics: data.metrics,
    };
  } catch {
    return { ok: false, databaseEnabled: false };
  }
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

export async function fetchPlanInvitesViaApi(
  token: string
): Promise<{ success: boolean; databaseEnabled?: boolean; invites?: PlanInvite[]; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch('/api/plan-invites', {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as {
      success?: boolean;
      databaseEnabled?: boolean;
      invites?: PlanInvite[];
      error?: string;
    };
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Não foi possível carregar os convites.' };
    }
    return { success: true, databaseEnabled: data.databaseEnabled, invites: data.invites || [] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao consultar convites.',
    };
  }
}

export async function createPlanInviteViaApi(
  token: string,
  params: {
    code?: string;
    planId?: string;
    maxUses?: number;
    recipientHint?: string;
    expiresAt?: string;
  }
): Promise<{ success: boolean; databaseEnabled?: boolean; invite?: PlanInvite; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch('/api/plan-invites', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      databaseEnabled?: boolean;
      invite?: PlanInvite;
      error?: string;
    };
    if (!res.ok || !data.success || !data.invite) {
      return { success: false, error: data.error || 'Erro ao gerar código de convite.' };
    }
    return { success: true, databaseEnabled: data.databaseEnabled, invite: data.invite };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao gerar convite.',
    };
  }
}

export async function revokePlanInviteViaApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch(`/api/plan-invites/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Não foi possível revogar o convite.' };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao revogar convite.',
    };
  }
}

export async function deletePlanInviteViaApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch(`/api/plan-invites/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Não foi possível excluir o convite.' };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir convite.',
    };
  }
}

export async function validatePlanInviteViaApi(
  code: string
): Promise<{ valid: boolean; invite?: PlanInvite; error?: string }> {
  try {
    const res = await fetch('/api/plan-invites/validate', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json()) as {
      valid?: boolean;
      invite?: PlanInvite;
      error?: string;
    };
    if (!res.ok || !data.valid) {
      return {
        valid: false,
        invite: data.invite,
        error: data.error || 'Código de convite inválido ou expirado.',
      };
    }
    return { valid: true, invite: data.invite };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao validar convite.',
    };
  }
}

export async function redeemPlanInviteViaApi(
  token: string,
  params: { code: string; businessId: string; businessName?: string }
): Promise<{
  success: boolean;
  databaseEnabled?: boolean;
  planId?: string;
  planExpiresAt?: string;
  invite?: PlanInvite;
  error?: string;
}> {
  if (!token) {
    return { success: false, error: 'Sessão não autenticada para ativar convite.' };
  }
  try {
    const res = await fetch('/api/plan-invites/redeem', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      databaseEnabled?: boolean;
      planId?: string;
      planExpiresAt?: string;
      invite?: PlanInvite;
      error?: string;
    };
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Não foi possível ativar o convite.' };
    }
    return {
      success: true,
      databaseEnabled: data.databaseEnabled,
      planId: data.planId,
      planExpiresAt: data.planExpiresAt,
      invite: data.invite,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao resgatar convite.',
    };
  }
}

