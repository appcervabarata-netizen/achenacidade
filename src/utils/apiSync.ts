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
  GoogleMapsBusinessDraft,
  GoogleMapsExtractionFields,
  GoogleMapsImporterConfig,
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
  body?: unknown,
  token?: string
): Promise<ApiMutationResult> {
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      keepalive: true,
      cache: 'no-store',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
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

export function saveSettingToDb(key: string, value: unknown, token?: string): Promise<ApiMutationResult> {
  return sendJsonMutation(`/api/settings/${encodeURIComponent(key)}`, 'PUT', { value }, token);
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

export async function fetchAdminMercadoPagoConfigViaApi(token: string): Promise<{
  success: boolean;
  config?: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    publicKey: string;
    hasAccessToken: boolean;
    accessTokenMasked: string;
    pixKey?: string;
    statementDescriptor: string;
    autoApproveInSandbox?: boolean;
    hasEnvToken?: boolean;
  };
  error?: string;
}> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch('/api/mercadopago/admin-config', {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const data = (await res.json()) as { success?: boolean; config?: any; error?: string };
    if (!res.ok || !data.success || !data.config) {
      return { success: false, error: data.error || 'Erro ao consultar configuração do Mercado Pago.' };
    }
    return { success: true, config: data.config };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao consultar Mercado Pago.',
    };
  }
}

export async function testMercadoPagoViaApi(
  token: string,
  params: { accessToken?: string; publicKey?: string; environment: 'sandbox' | 'production' }
): Promise<{
  success: boolean;
  message?: string;
  pixAvailable?: boolean;
  account?: { id?: string | number; nickname?: string; email?: string; siteId?: string };
  error?: string;
}> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch('/api/mercadopago/test-connection', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Falha ao validar credenciais no Mercado Pago.' };
    }
    return {
      success: true,
      message: data.message,
      pixAvailable: data.pixAvailable,
      account: data.account,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao testar conexão com o Mercado Pago.',
    };
  }
}

export interface MercadoPagoPixCreationResult {
  success: boolean;
  mode?: 'mercadopago_api' | 'sandbox_simulation';
  environment?: 'sandbox' | 'production';
  paymentId?: string;
  status?: string;
  statusDetail?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string | null;
  expiresAt?: string | null;
  autoApproveInSandbox?: boolean;
  error?: string;
}

export async function createMercadoPagoPixViaApi(params: {
  amount: number;
  description: string;
  payerEmail: string;
  payerName?: string;
  payerCpfCnpj?: string;
  externalReference?: string;
}): Promise<MercadoPagoPixCreationResult> {
  try {
    const res = await fetch('/api/mercadopago/pix', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as MercadoPagoPixCreationResult;
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Não foi possível gerar o QR Code PIX no Mercado Pago.',
      };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao gerar PIX no servidor.',
    };
  }
}

export async function checkMercadoPagoPaymentViaApi(
  paymentId: string,
  options?: { simulateApprove?: boolean }
): Promise<{
  success: boolean;
  mode?: 'mercadopago_api' | 'sandbox_simulation';
  paymentId?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | string;
  statusDetail?: string;
  paidAt?: string | null;
  error?: string;
}> {
  if (!paymentId) return { success: false, error: 'ID de pagamento ausente.' };
  try {
    const qs = options?.simulateApprove ? '?simulateApprove=1' : '';
    const res = await fetch(`/api/mercadopago/payment/${encodeURIComponent(paymentId)}${qs}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Não foi possível verificar o status do pagamento.' };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de conexão ao verificar pagamento.',
    };
  }
}

export async function createMercadoPagoCardPaymentViaApi(params: {
  amount: number;
  description: string;
  token?: string;
  installments: number;
  paymentMethodId?: string;
  issuerId?: string | number;
  payerEmail: string;
  payerName?: string;
  payerCpfCnpj?: string;
  externalReference?: string;
}): Promise<{
  success: boolean;
  mode?: 'mercadopago_api' | 'sandbox_simulation';
  paymentId?: string;
  status?: string;
  statusDetail?: string;
  paidAt?: string | null;
  error?: string;
}> {
  try {
    const res = await fetch('/api/mercadopago/card', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao processar cartão no Mercado Pago.' };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao processar cartão.',
    };
  }
}

function dispatchQuotaExceededIfNeeded(status: number, payload: any) {
  if (typeof window === 'undefined') return;
  const errStr = String(payload?.error || payload?.message || '');
  if (
    status === 429 ||
    payload?.quotaExceeded === true ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.toLowerCase().includes('cota')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

export async function fetchGoogleMapsDraftsViaApi(
  token: string,
  options?: {
    status?: 'pending' | 'approved' | 'rejected' | 'all';
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    city?: string;
  }
): Promise<{
  success: boolean;
  databaseEnabled?: boolean;
  drafts?: GoogleMapsBusinessDraft[];
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  counts?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  availableCities?: string[];
  config?: GoogleMapsImporterConfig;
  error?: string;
}> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (typeof options?.page === 'number') params.set('page', String(options.page));
    if (typeof options?.pageSize === 'number') params.set('pageSize', String(options.pageSize));
    if (options?.search && options.search.trim()) params.set('search', options.search.trim());
    if (options?.categoryId && options.categoryId !== 'all') params.set('categoryId', options.categoryId);
    if (options?.city && options.city !== 'all') params.set('city', options.city);
    const qs = params.toString();
    const url = qs ? `/api/google-maps/drafts?${qs}` : '/api/google-maps/drafts';

    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as any;
    dispatchQuotaExceededIfNeeded(res.status, data);
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao carregar rascunhos do Google Maps.' };
    }
    return {
      success: true,
      databaseEnabled: Boolean(data.databaseEnabled),
      drafts: Array.isArray(data.drafts) ? data.drafts : [],
      pagination: data.pagination,
      counts: data.counts,
      availableCities: Array.isArray(data.availableCities) ? data.availableCities : [],
      config: data.config,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao consultar rascunhos.',
    };
  }
}

export async function runGoogleMapsImportBatchViaApi(
  token: string,
  count: number,
  extractionFields?: Partial<GoogleMapsExtractionFields>
): Promise<{
  success: boolean;
  addedCount?: number;
  skippedDuplicates?: number;
  queriesExecuted?: number;
  quotaExceeded?: boolean;
  summary?: string;
  drafts?: GoogleMapsBusinessDraft[];
  config?: GoogleMapsImporterConfig;
  error?: string;
}> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch('/api/google-maps/import-batch', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        count,
        ...(extractionFields ? { extractionFields } : {}),
      }),
    });
    const data = (await res.json()) as any;
    dispatchQuotaExceededIfNeeded(res.status, data);
    return {
      success: Boolean(res.ok && data.success),
      addedCount: data.addedCount || 0,
      skippedDuplicates: data.skippedDuplicates || 0,
      queriesExecuted: data.queriesExecuted || 0,
      quotaExceeded: Boolean(res.status === 429 || data.quotaExceeded),
      summary: data.summary,
      drafts: Array.isArray(data.drafts) ? data.drafts : undefined,
      config: data.config,
      error: data.error,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao buscar empresas no Google Maps.',
    };
  }
}

export async function updateGoogleMapsSchedulerViaApi(
  token: string,
  updates: {
    enabled?: boolean;
    intervalMinutes?: number;
    batchSize?: number;
    extractionFields?: Partial<GoogleMapsExtractionFields>;
  }
): Promise<{ success: boolean; config?: GoogleMapsImporterConfig; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch('/api/google-maps/scheduler', {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao atualizar agendador.' };
    }
    return { success: true, config: data.config };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao salvar agendamento.',
    };
  }
}

export async function updateGoogleMapsDraftViaApi(
  token: string,
  id: string,
  updates: Partial<GoogleMapsBusinessDraft>
): Promise<{ success: boolean; draft?: GoogleMapsBusinessDraft; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch(`/api/google-maps/drafts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao salvar rascunho.' };
    }
    return { success: true, draft: data.draft };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao salvar rascunho.',
    };
  }
}

export async function approveGoogleMapsDraftViaApi(
  token: string,
  id: string
): Promise<{
  success: boolean;
  draft?: GoogleMapsBusinessDraft;
  business?: Business;
  error?: string;
}> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch(`/api/google-maps/drafts/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao aprovar rascunho.' };
    }
    return { success: true, draft: data.draft, business: data.business };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao aprovar empresa.',
    };
  }
}

export async function bulkApproveGoogleMapsDraftsViaApi(
  token: string,
  ids: string[]
): Promise<{
  success: boolean;
  approvedCount?: number;
  drafts?: GoogleMapsBusinessDraft[];
  createdBusinesses?: Business[];
  error?: string;
}> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch('/api/google-maps/drafts/approve-bulk', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao aprovar rascunhos em lote.' };
    }
    return {
      success: true,
      approvedCount: data.approvedCount || 0,
      drafts: data.drafts,
      createdBusinesses: Array.isArray(data.createdBusinesses) ? data.createdBusinesses : [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao aprovar lote.',
    };
  }
}

export async function rejectGoogleMapsDraftViaApi(
  token: string,
  id: string
): Promise<{ success: boolean; draft?: GoogleMapsBusinessDraft; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch(`/api/google-maps/drafts/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao rejeitar rascunho.' };
    }
    return { success: true, draft: data.draft };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao rejeitar rascunho.',
    };
  }
}

export async function deleteGoogleMapsDraftViaApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch(`/api/google-maps/drafts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao excluir rascunho.' };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao excluir rascunho.',
    };
  }
}

export async function fetchGoogleMapsDraftPhotoViaApi(
  token: string,
  id: string
): Promise<{ success: boolean; draft?: GoogleMapsBusinessDraft; error?: string }> {
  if (!token) return { success: false, error: 'Sessão administrativa ausente.' };
  try {
    const res = await fetch(`/api/google-maps/drafts/${encodeURIComponent(id)}/fetch-photo`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao buscar foto no Google Maps.' };
    }
    return { success: true, draft: data.draft };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro de rede ao buscar foto.',
    };
  }
}

