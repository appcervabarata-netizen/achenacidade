import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  hashPassword,
  verifyPassword,
  isDatabaseConfigured,
  isTransientConnectionError,
  getPool,
  closePool,
  ensureDatabaseSchema,
  isSeedCompleted,
  readAllDirectoryData,
  seedInitialDirectoryIfEmpty,
  syncCollection,
  upsertSetting,
  incrementBannerClicksDb,
  upsertEntity,
  updateEntityById,
  deleteEntityById,
  getDatabaseDiagnostics,
  migrateDatabaseSchema,
  cleanupLegacyTables,
  authenticateWithDb,
  authenticateDemoBusinessInDb,
  verifySessionTokenInDb,
  renewSessionTokenInDb,
  revokeSessionTokenInDb,
  switchBusinessSessionInDb,
  changeAdminPasswordInDb,
  getSettingFromDb,
  createAuthCodeInDb,
  verifyAuthCodeInDb,
  markBusinessEmailVerifiedInDb,
  findAccountForPasswordResetInDb,
  resetPasswordInDb,
  recordBusinessMetricInDb,
  getBusinessMetricsFromDb,
  getSaoPauloDateKey,
  buildLast7DaysKeys,
  listPlanInvitesFromDb,
  createPlanInviteInDb,
  revokePlanInviteInDb,
  deletePlanInviteInDb,
  validatePlanInviteInDb,
  redeemPlanInviteInDb,
  listBusinessDraftsFromDb,
  getExistingDraftPlaceIdsAndBusinessNamesFromDb,
  insertBusinessDraftsInDb,
  updateBusinessDraftInDb,
  approveBusinessDraftInDb,
  deleteBusinessDraftInDb,
  type DbAuthSessionPayload,
  type DbBusinessMetricEventType,
  type DbBusinessMetricsSummary,
  type DbPlanInvite,
  type DbGoogleMapsBusinessDraft,
} from './server/db.ts';
import {
  runGoogleMapsImportBatch,
  fetchGooglePlacePhotoByPlaceId,
  normalizeBusinessSignature,
  resolveGoogleMapsApiKey,
  type DirectoryCategoryTarget,
  type DirectoryCityTarget,
} from './server/googleMapsImporter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'));

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (err) {
  console.warn('Could not pre-create uploads directory:', err);
}

app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

// Brute-force login attempt limiter (per IP + email)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterMinutes?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    return { allowed: true };
  }
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterMinutes = Math.max(1, Math.ceil((entry.resetAt - now) / 60000));
    return { allowed: false, retryAfterMinutes };
  }
  return { allowed: true };
}

function recordFailedLoginAttempt(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

// Local preview fallback store (used ONLY when MySQL DB_* env vars are not configured)
let localAdminPasswordHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
let localSessionConfig = {
  adminSessionDurationMinutes: 120,
  businessSessionDurationMinutes: 1440,
};
const localSessions = new Map<string, DbAuthSessionPayload>();
const localBusinessUsers = new Map<
  string,
  { id: string; name: string; email: string; ownerEmail: string; passwordHash: string; emailVerified?: boolean }
>();

interface LocalAuthCodeRecord {
  purpose: 'email_verification' | 'password_reset';
  role: 'admin' | 'business';
  email: string;
  businessId?: string | null;
  codeHash: string;
  expiresAt: number;
  usedAt: number | null;
  attempts: number;
}
const localAuthCodes = new Map<string, LocalAuthCodeRecord>();
const localBusinessMetrics = new Map<
  string,
  Map<string, { views: number; whatsappClicks: number; showcaseClicks: number }>
>();
const localPlanInvites = new Map<string, DbPlanInvite>();
const localSettingsMirror = new Map<string, any>();
const localBusinessDrafts = new Map<string, DbGoogleMapsBusinessDraft>();
const localBusinessesMirror = new Map<string, { id: string; name: string; slug: string; phone: string }>();

const DEFAULT_REGIONAL_CITIES: DirectoryCityTarget[] = [
  { id: 'city-1', name: 'Alagoinhas', state: 'BA', isActive: true },
];

const DEFAULT_DIRECTORY_CATEGORIES: DirectoryCategoryTarget[] = [
  { id: 'cat-1', name: 'Gastronomia & Bares', slug: 'gastronomia' },
  { id: 'cat-2', name: 'Moda & Acessórios', slug: 'moda' },
  { id: 'cat-3', name: 'Saúde & Bem-Estar', slug: 'saude' },
  { id: 'cat-4', name: 'Tecnologia & Celulares', slug: 'tecnologia' },
  { id: 'cat-5', name: 'Construção & Reforma', slug: 'construcao' },
  { id: 'cat-6', name: 'Pet Shop & Veterinária', slug: 'petshop' },
  { id: 'cat-7', name: 'Serviços Automotivos', slug: 'automotivo' },
  { id: 'cat-8', name: 'Beleza & Barbearia', slug: 'beleza' },
  { id: 'cat-9', name: 'Educação & Cursos', slug: 'educacao' },
  { id: 'cat-10', name: 'Imóveis & Imobiliárias', slug: 'imoveis' },
  { id: 'cat-11', name: 'Supermercados & Empórios', slug: 'supermercados' },
  { id: 'cat-12', name: 'Festas & Eventos', slug: 'eventos' },
  { id: 'cat-13', name: 'Farmácias & Drogarias', slug: 'farmacias' },
  { id: 'cat-14', name: 'Padarias, Doces & Açaí', slug: 'padarias-cafeterias' },
  { id: 'cat-15', name: 'Móveis, Eletro & Decoração', slug: 'moveis-decoracao' },
  { id: 'cat-16', name: 'Papelarias, Gráficas & Presentes', slug: 'papelarias-graficas' },
  { id: 'cat-17', name: 'Contabilidade, Advocacia & Consultoria', slug: 'consultoria-escritorios' },
  { id: 'cat-18', name: 'Agropecuária, Rações & Jardinagem', slug: 'agropecuaria-jardinagem' },
  { id: 'cat-19', name: 'Academias, Esportes & Lazer', slug: 'academias-esportes' },
  { id: 'cat-20', name: 'Hotéis, Pousadas & Turismo', slug: 'hoteis-pousadas' },
  { id: 'cat-21', name: 'Óticas, Joias & Relojoarias', slug: 'oticas-joalherias' },
  { id: 'cat-22', name: 'Gás, Água & Bebidas', slug: 'gas-agua-bebidas' },
];

let localCatalogSnapshot: {
  categories: DirectoryCategoryTarget[];
  cities: DirectoryCityTarget[];
} = {
  categories: DEFAULT_DIRECTORY_CATEGORIES,
  cities: DEFAULT_REGIONAL_CITIES,
};

interface ServerGoogleMapsImporterConfig {
  enabled: boolean;
  intervalMinutes: number;
  batchSize: number;
  initialBatchSize: number;
  nextQueryCursor: number;
  totalImportedCount: number;
  lastRunAt?: string;
  nextRunAt?: string;
  lastRunSummary?: string;
  lastError?: string;
}

const DEFAULT_GMP_IMPORTER_CONFIG: ServerGoogleMapsImporterConfig = {
  enabled: true,
  intervalMinutes: 30,
  batchSize: 10,
  initialBatchSize: 50,
  nextQueryCursor: 0,
  totalImportedCount: 0,
};

let isGmpBatchRunning = false;
let gmpSchedulerTimer: NodeJS.Timeout | null = null;

interface ServerMercadoPagoConfig {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  publicKey: string;
  accessToken: string;
  pixKey?: string;
  statementDescriptor: string;
  autoApproveInSandbox?: boolean;
}

interface LocalMercadoPagoPaymentRecord {
  paymentId: string;
  mode: 'mercadopago_api' | 'sandbox_simulation';
  environment: 'sandbox' | 'production';
  status: 'pending' | 'approved' | 'rejected';
  statusDetail: string;
  amount: number;
  description: string;
  externalReference: string;
  payerEmail: string;
  qrCode?: string;
  qrCodeBase64?: string;
  createdAt: number;
  paidAt?: string | null;
}

const localMercadoPagoPayments = new Map<string, LocalMercadoPagoPaymentRecord>();

function maskSecretToken(token?: string): string {
  const clean = (token || '').trim();
  if (!clean) return '';
  if (clean.length <= 12) return '••••••••';
  const prefixMatch = clean.match(/^(APP_USR-|TEST-)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const tail = clean.slice(-4);
  return `${prefix}••••••••••••${tail}`;
}

function sanitizeMercadoPagoConfigForPublic(raw: any) {
  if (!raw || typeof raw !== 'object') return raw;
  const envToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || '';
  const storedToken = typeof raw.accessToken === 'string' ? raw.accessToken.trim() : '';
  const effectiveToken = storedToken || envToken;
  return {
    enabled: Boolean(raw.enabled ?? true),
    environment: raw.environment === 'production' ? 'production' : 'sandbox',
    publicKey: typeof raw.publicKey === 'string' ? raw.publicKey : '',
    accessToken: '',
    hasAccessToken: Boolean(effectiveToken),
    accessTokenMasked: effectiveToken ? maskSecretToken(effectiveToken) : '',
    pixKey: typeof raw.pixKey === 'string' ? raw.pixKey : '',
    statementDescriptor:
      typeof raw.statementDescriptor === 'string' && raw.statementDescriptor.trim()
        ? raw.statementDescriptor.trim()
        : 'ACHENACIDADE',
    autoApproveInSandbox: raw.autoApproveInSandbox ?? true,
  };
}

function sanitizeBootstrapDataForPublic(data: any) {
  if (!data || typeof data !== 'object') return data;
  if (data.settings && data.settings.mercadoPagoConfig) {
    return {
      ...data,
      settings: {
        ...data.settings,
        mercadoPagoConfig: sanitizeMercadoPagoConfigForPublic(data.settings.mercadoPagoConfig),
      },
    };
  }
  return data;
}

async function getServerMercadoPagoConfig(): Promise<ServerMercadoPagoConfig> {
  let dbCfg: Partial<ServerMercadoPagoConfig> | null = null;
  if (isDatabaseConfigured()) {
    try {
      dbCfg = await getSettingFromDb<Partial<ServerMercadoPagoConfig>>('mercadoPagoConfig');
    } catch (err) {
      if (isTransientConnectionError(err)) {
        await closePool().catch(() => {});
      }
    }
  }
  const mirrorCfg = localSettingsMirror.get('mercadoPagoConfig') as Partial<ServerMercadoPagoConfig> | undefined;
  const merged = { ...(mirrorCfg || {}), ...(dbCfg || {}) };

  const storedToken = typeof merged.accessToken === 'string' ? merged.accessToken.trim() : '';
  const envToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
  const accessToken = storedToken || envToken;

  const environment: 'sandbox' | 'production' =
    merged.environment === 'production'
      ? 'production'
      : merged.environment === 'sandbox'
      ? 'sandbox'
      : accessToken.startsWith('APP_USR-')
      ? 'production'
      : 'sandbox';

  const descriptorRaw = typeof merged.statementDescriptor === 'string' ? merged.statementDescriptor : 'ACHENACIDADE';
  const statementDescriptor =
    descriptorRaw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, '')
      .trim()
      .toUpperCase()
      .slice(0, 16) || 'ACHENACIDADE';

  return {
    enabled: merged.enabled !== false,
    environment,
    publicKey: typeof merged.publicKey === 'string' ? merged.publicKey.trim() : '',
    accessToken,
    pixKey: typeof merged.pixKey === 'string' ? merged.pixKey.trim() : '',
    statementDescriptor,
    autoApproveInSandbox: merged.autoApproveInSandbox ?? true,
  };
}

function serverEmvTlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function computeServerPixCrc16(payloadWithTag6304: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payloadWithTag6304.length; i++) {
    crc ^= payloadWithTag6304.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildServerPixPayload(params: {
  pixKey?: string;
  descriptor?: string;
  amount: number;
  reference?: string;
}): string {
  const key = (params.pixKey || 'financeiro@achenacidade.com.br').trim().slice(0, 77);
  const merchantName =
    (params.descriptor || 'ACHENACIDADE')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
      .slice(0, 25) || 'ACHENACIDADE';
  const formattedAmount = Math.max(0.01, Number(params.amount.toFixed(2))).toFixed(2);
  const ref = (params.reference || 'PLANO').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || 'PLANO';

  const merchantAccountInfo = serverEmvTlv('00', 'br.gov.bcb.pix') + serverEmvTlv('01', key);
  const additionalData = serverEmvTlv('05', ref);
  const body =
    serverEmvTlv('00', '01') +
    serverEmvTlv('26', merchantAccountInfo) +
    serverEmvTlv('52', '0000') +
    serverEmvTlv('53', '986') +
    serverEmvTlv('54', formattedAmount) +
    serverEmvTlv('58', 'BR') +
    serverEmvTlv('59', merchantName) +
    serverEmvTlv('60', 'ALAGOINHAS') +
    serverEmvTlv('62', additionalData) +
    '6304';
  return body + computeServerPixCrc16(body);
}

function buildPublicNotificationUrl(req: express.Request): string | undefined {
  const candidates = [
    process.env.APP_URL,
    req.headers['x-forwarded-host']
      ? `https://${String(req.headers['x-forwarded-host']).split(',')[0].trim()}`
      : undefined,
    req.headers.origin,
  ];
  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    try {
      const parsed = new URL(raw.trim());
      if (parsed.protocol !== 'https:') continue;
      const host = parsed.hostname.toLowerCase();
      if (
        !host ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.endsWith('.local') ||
        /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
      ) {
        continue;
      }
      return `${parsed.origin}/api/webhooks/mercadopago`;
    } catch {
      continue;
    }
  }
  return undefined;
}

function translateMercadoPagoError(statusCode: number, data: any, environment: 'sandbox' | 'production'): string {
  const rawMessage = typeof data?.message === 'string' ? data.message : '';
  const causes: Array<{ code?: number | string; description?: string }> = Array.isArray(data?.cause)
    ? data.cause
    : [];
  const causeText = causes
    .map((c) => `${c.code ?? ''} ${c.description ?? ''}`.trim())
    .filter(Boolean)
    .join(' | ');
  const combined = `${rawMessage} ${causeText}`.toLowerCase();

  if (statusCode === 401 || /invalid_token|unauthorized|malformed access_token|bad_request.*token/.test(combined)) {
    return 'Access Token inválido ou expirado no Mercado Pago. Acesse o Mercado Pago Developers, copie o Access Token oficial de Produção (APP_USR-...) e salve novamente no Painel Admin.';
  }
  if (/13253|financial identity|not enabled.*pix|pix.*not enabled|key.*pix|without key/.test(combined)) {
    return 'Sua conta do Mercado Pago não possui uma Chave PIX cadastrada/ativa para gerar cobranças PIX em produção. Abra o app do Mercado Pago > Área Pix > Cadastrar Chave Pix.';
  }
  if (/collector.*involved|self.?payment|same user|payer cannot be the same/.test(combined)) {
    return 'O Mercado Pago bloqueia o pagamento quando o e-mail do pagador é o mesmo e-mail da conta dona do Mercado Pago. Informe um e-mail diferente no campo "E-mail do Pagador".';
  }
  if (/identification|cpf|cnpj|document/.test(combined)) {
    return 'O Mercado Pago exigiu um CPF ou CNPJ válido do pagador para emitir este QR Code PIX. Preencha o campo CPF/CNPJ do pagador e tente novamente.';
  }
  if (/payer\.email|invalid.*email/.test(combined)) {
    return 'E-mail do pagador inválido para o Mercado Pago. Verifique o endereço de e-mail informado.';
  }
  if (/test_user|sandbox|live_credentials|cannot use test/.test(combined)) {
    return environment === 'production'
      ? 'Conflito de credenciais: o ambiente está em Produção, mas foi informado um token ou usuário de teste (Sandbox).'
      : 'Conflito de credenciais de Sandbox no Mercado Pago.';
  }
  if (/notification_url/.test(combined)) {
    return 'URL de notificação rejeitada pelo Mercado Pago. Verifique a URL pública da aplicação.';
  }

  const detail = causeText || rawMessage || `Erro HTTP ${statusCode}`;
  return `Mercado Pago recusou a requisição (${statusCode}): ${detail}`;
}

function computeLocalInviteStatus(invite: DbPlanInvite): DbPlanInvite['status'] {
  if (invite.status === 'revoked') return 'revoked';
  if (invite.expiresAt) {
    const today = getSaoPauloDateKey();
    if (invite.expiresAt < today) return 'expired';
  }
  if (invite.usedCount >= invite.maxUses) return 'used';
  return 'active';
}

function generateRandomInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += alphabet[crypto.randomInt(0, alphabet.length)];
    part2 += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return `VIP6M-${part1}-${part2}`;
}

async function resolveSessionFromRequest(req: express.Request): Promise<DbAuthSessionPayload | null> {
  const token = extractSessionToken(req);
  if (!token) return null;
  if (!isDatabaseConfigured()) {
    const localSess = localSessions.get(token);
    if (!localSess || Date.now() >= localSess.expiresAt) return null;
    return localSess;
  }
  try {
    const dbSess = await verifySessionTokenInDb(token);
    if (dbSess) return dbSess;
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      const localSess = localSessions.get(token);
      if (localSess && Date.now() < localSess.expiresAt) return localSess;
    }
  }
  return null;
}

async function requireAdminSession(
  req: express.Request,
  res: express.Response
): Promise<DbAuthSessionPayload | null> {
  const session = await resolveSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Acesso restrito ao administrador autenticado.',
    });
    return null;
  }
  return session;
}

function recordLocalBusinessMetric(businessId: string, eventType: DbBusinessMetricEventType) {
  if (!businessId) return;
  const dateKey = getSaoPauloDateKey();
  let bizMap = localBusinessMetrics.get(businessId);
  if (!bizMap) {
    bizMap = new Map();
    localBusinessMetrics.set(businessId, bizMap);
  }
  const current = bizMap.get(dateKey) || { views: 0, whatsappClicks: 0, showcaseClicks: 0 };
  if (eventType === 'view') current.views += 1;
  else if (eventType === 'whatsapp_click') current.whatsappClicks += 1;
  else if (eventType === 'showcase_click') current.showcaseClicks += 1;
  bizMap.set(dateKey, current);
}

function getLocalBusinessMetrics(businessId: string): DbBusinessMetricsSummary {
  const days = buildLast7DaysKeys();
  const bizMap = localBusinessMetrics.get(businessId);
  let viewsTotal = 0;
  let whatsappClicks = 0;
  let showcaseClicks = 0;

  if (bizMap) {
    for (const dayStats of bizMap.values()) {
      viewsTotal += dayStats.views;
      whatsappClicks += dayStats.whatsappClicks;
      showcaseClicks += dayStats.showcaseClicks;
    }
  }

  return {
    viewsTotal,
    whatsappClicks,
    showcaseClicks,
    conversionRate: viewsTotal > 0 ? `${((whatsappClicks / viewsTotal) * 100).toFixed(1)}%` : '0%',
    daily: days.map((d) => {
      const hit = bizMap?.get(d.date);
      return {
        date: d.date,
        label: d.label,
        views: hit?.views || 0,
        whatsappClicks: hit?.whatsappClicks || 0,
        showcaseClicks: hit?.showcaseClicks || 0,
      };
    }),
  };
}

function hashLocalAuthCode(
  purpose: 'email_verification' | 'password_reset',
  role: 'admin' | 'business',
  email: string,
  code: string
): string {
  return crypto
    .createHash('sha256')
    .update(`${purpose}:${role}:${email.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function interpolateServerVars(templateText: string, variables: Record<string, string>): string {
  return templateText.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
  });
}

function buildServerStyledEmailHtml(params: {
  heading: string;
  body: string;
  codeLabel?: string;
  highlightCode?: string;
  footerNote?: string;
}): string {
  const paragraphs = params.body
    .split('\n')
    .map((line) => line.trim())
    .map((line) =>
      line
        ? `<p style="margin:0 0 12px 0;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(line)}</p>`
        : '<div style="height:8px;"></div>'
    )
    .join('');

  const codeBlock = params.highlightCode
    ? `<div style="margin:24px 0;padding:18px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center;">
         <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#1d4ed8;margin-bottom:6px;">${escapeHtml(params.codeLabel || 'Código de Verificação')}</div>
         <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;">${escapeHtml(params.highlightCode)}</div>
       </div>`
    : '';

  const footerBlock = params.footerNote
    ? `<div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
         ${escapeHtml(params.footerNote)}
       </div>`
    : '';

  return `
  <div style="font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;padding:32px 16px;">
    <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);padding:24px 28px;color:#ffffff;">
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.4px;">
          achena<span style="color:#fb923c;">cidade</span>
        </div>
        <div style="font-size:12px;color:#bfdbfe;margin-top:4px;">Guia Comercial · Alagoinhas - BA</div>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
          ${escapeHtml(params.heading)}
        </h1>
        ${paragraphs}
        ${codeBlock}
        ${footerBlock}
      </div>
    </div>
  </div>`;
}

async function issueAuthCode(params: {
  purpose: 'email_verification' | 'password_reset';
  role: 'admin' | 'business';
  email: string;
  businessId?: string;
  ttlMinutes?: number;
}): Promise<{ code: string; expiresAt: number }> {
  if (isDatabaseConfigured()) {
    return createAuthCodeInDb(params);
  }
  const normalizedEmail = params.email.trim().toLowerCase();
  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = Date.now() + (params.ttlMinutes || 30) * 60 * 1000;
  localAuthCodes.set(`${params.purpose}:${params.role}:${normalizedEmail}`, {
    purpose: params.purpose,
    role: params.role,
    email: normalizedEmail,
    businessId: params.businessId || null,
    codeHash: hashLocalAuthCode(params.purpose, params.role, normalizedEmail, code),
    expiresAt,
    usedAt: null,
    attempts: 0,
  });
  return { code, expiresAt };
}

async function validateAuthCode(params: {
  purpose: 'email_verification' | 'password_reset';
  role: 'admin' | 'business';
  email: string;
  code: string;
  markUsed?: boolean;
}): Promise<{ valid: boolean; businessId?: string | null; error?: string }> {
  if (isDatabaseConfigured()) {
    return verifyAuthCodeInDb(params);
  }
  const normalizedEmail = params.email.trim().toLowerCase();
  const key = `${params.purpose}:${params.role}:${normalizedEmail}`;
  const rec = localAuthCodes.get(key);
  if (!rec || rec.usedAt) {
    return { valid: false, error: 'Nenhum código ativo encontrado para este e-mail. Solicite um novo código.' };
  }
  if (Date.now() > rec.expiresAt) {
    return { valid: false, error: 'Este código expirou. Clique em reenviar para gerar um novo código.' };
  }
  if (rec.attempts >= 6) {
    return { valid: false, error: 'Limite de tentativas excedido. Solicite um novo código.' };
  }
  const actualHash = hashLocalAuthCode(params.purpose, params.role, normalizedEmail, params.code.trim());
  const aBuf = Buffer.from(actualHash, 'utf8');
  const eBuf = Buffer.from(rec.codeHash, 'utf8');
  if (aBuf.length !== eBuf.length || !crypto.timingSafeEqual(aBuf, eBuf)) {
    rec.attempts += 1;
    return { valid: false, error: 'Código incorreto. Confira os 6 dígitos enviados ao seu e-mail.' };
  }
  if (params.markUsed !== false) {
    rec.usedAt = Date.now();
  }
  return { valid: true, businessId: rec.businessId || null };
}

function extractSessionToken(req: express.Request): string {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const headerToken = req.headers['x-session-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  if (req.body && typeof (req.body as { token?: unknown }).token === 'string') {
    return String((req.body as { token: string }).token).trim();
  }
  return '';
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

interface IncomingSmtpConfig {
  enabled?: boolean;
  senderName?: string;
  senderEmail?: string;
  replyToEmail?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  allowSelfSignedCert?: boolean;
  user?: string;
  pass?: string;
}

function normalizeSmtpHost(rawHost?: string): string {
  if (!rawHost) return '';
  return rawHost
    .trim()
    .replace(/^(https?|smtps?):\/\//i, '')
    .split('/')[0]
    .split('?')[0]
    .replace(/:\d+$/, '')
    .trim();
}

function getSmtpTlsOptions(allowSelfSigned?: boolean) {
  if (allowSelfSigned || process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false') {
    return { tls: { rejectUnauthorized: false } };
  }
  return {};
}

function resolveSmtpTransportConfig(clientSmtp?: IncomingSmtpConfig) {
  const clientHost = normalizeSmtpHost(clientSmtp?.host);
  const clientHasCreds = Boolean(
    clientSmtp?.enabled && clientHost && clientSmtp?.user?.trim() && clientSmtp?.pass?.trim()
  );

  if (clientHasCreds && clientSmtp) {
    return {
      source: 'admin_panel' as const,
      host: clientHost,
      port: Number(clientSmtp.port || 587),
      secure: Boolean(clientSmtp.secure),
      allowSelfSignedCert: Boolean(clientSmtp.allowSelfSignedCert),
      auth: {
        user: clientSmtp.user!.trim(),
        pass: clientSmtp.pass!.trim(),
      },
      from: `"${clientSmtp.senderName || 'achenacidade'}" <${clientSmtp.senderEmail || clientSmtp.user!.trim()}>`,
      replyTo: clientSmtp.replyToEmail || clientSmtp.senderEmail || clientSmtp.user!.trim(),
    };
  }

  const envHost = normalizeSmtpHost(process.env.SMTP_HOST);
  const envHasCreds = Boolean(
    envHost && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  );

  if (envHasCreds) {
    return {
      source: 'env' as const,
      host: envHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      allowSelfSignedCert: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false',
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.trim(),
      },
      from: process.env.SMTP_FROM || `"achenacidade" <${process.env.SMTP_USER!.trim()}>`,
      replyTo: clientSmtp?.replyToEmail || process.env.SMTP_USER!.trim(),
    };
  }

  return null;
}

async function resolveEffectiveSmtpTransportConfig(clientSmtp?: IncomingSmtpConfig) {
  const direct = resolveSmtpTransportConfig(clientSmtp);
  if (direct) return direct;

  if (isDatabaseConfigured()) {
    const dbSmtp = await getSettingFromDb<IncomingSmtpConfig>('smtpConfig');
    if (dbSmtp) {
      return resolveSmtpTransportConfig(dbSmtp);
    }
  }
  return null;
}

app.get('/api/email/status', (_req, res) => {
  const hasEnvSmtp = Boolean(
    normalizeSmtpHost(process.env.SMTP_HOST) && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  );
  res.json({
    hasEnvSmtp,
    envSenderEmail: hasEnvSmtp ? process.env.SMTP_USER : undefined,
  });
});

app.post('/api/email/send', async (req, res) => {
  const { to, subject, html, text, smtp } = req.body as {
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
    smtp?: IncomingSmtpConfig;
  };

  if (!to || !subject) {
    res.status(400).json({ success: false, error: 'Destinatário e assunto são obrigatórios.' });
    return;
  }

  const resolved = await resolveEffectiveSmtpTransportConfig(smtp);
  if (!resolved) {
    res.json({
      success: true,
      deliveryMode: 'local_fallback',
      message: 'SMTP não configurado no momento; cópia registrada na Caixa de Saída de testes.',
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: resolved.host,
      port: resolved.port,
      secure: resolved.secure,
      auth: resolved.auth,
      ...getSmtpTlsOptions(resolved.allowSelfSignedCert),
    });

    const info = await transporter.sendMail({
      from: resolved.from,
      replyTo: resolved.replyTo,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    });

    res.json({
      success: true,
      deliveryMode: 'smtp',
      messageId: info.messageId,
      source: resolved.source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao enviar via SMTP.';
    res.json({
      success: false,
      deliveryMode: 'local_fallback',
      error: message,
    });
  }
});

app.post('/api/email/test-smtp', async (req, res) => {
  const { to, smtp } = req.body as {
    to?: string;
    smtp?: IncomingSmtpConfig;
  };

  const resolved = resolveSmtpTransportConfig(smtp);
  if (!resolved) {
    res.status(400).json({
      success: false,
      error: 'Preencha Host, Usuário e Senha SMTP (ou configure as variáveis SMTP_* no servidor) antes de testar.',
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: resolved.host,
      port: resolved.port,
      secure: resolved.secure,
      auth: resolved.auth,
      ...getSmtpTlsOptions(resolved.allowSelfSignedCert),
    });

    await transporter.verify();

    if (to && to.trim()) {
      await transporter.sendMail({
        from: resolved.from,
        replyTo: resolved.replyTo,
        to: to.trim(),
        subject: 'Teste de Conexão SMTP — achenacidade',
        text: 'Sua configuração SMTP do achenacidade está funcionando corretamente!',
        html: '<div style="font-family:sans-serif;padding:24px;background:#f8fafc;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;"><h2 style="color:#1d4ed8;margin-top:0;">Conexão SMTP Validada!</h2><p style="color:#334155;font-size:14px;line-height:1.6;">O envio de e-mails transacionais do <strong>achenacidade</strong> foi autenticado com sucesso neste servidor SMTP.</p></div></div>',
      });
    }

    res.json({
      success: true,
      message: to?.trim()
        ? `Conexão SMTP verificada e e-mail de teste enviado para ${to.trim()}!`
        : 'Conexão SMTP autenticada com sucesso!',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao autenticar no servidor SMTP.';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

app.post('/api/uploads', async (req, res) => {
  try {
    const { dataUrl, filename } = req.body as { dataUrl?: string; filename?: string };
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ success: false, error: 'Imagem inválida.' });
      return;
    }

    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/i);
    if (!match) {
      res.status(400).json({ success: false, error: 'Formato de imagem não suportado.' });
      return;
    }

    const rawType = match[1].toLowerCase();
    const ext = rawType === 'jpeg' ? 'jpg' : rawType === 'svg+xml' ? 'svg' : rawType;
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 8 * 1024 * 1024) {
      res.status(413).json({ success: false, error: 'A imagem excede o limite de 8MB.' });
      return;
    }

    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    const safeSlug = (filename || 'img')
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'img';
    const fileName = `${Date.now()}-${safeSlug}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, fileName);

    await fs.promises.writeFile(targetPath, buffer);
    res.json({ success: true, url: `/uploads/${fileName}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao salvar imagem no servidor.';
    res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/bootstrap', async (_req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ databaseEnabled: false, seeded: false });
    return;
  }

  try {
    await ensureDatabaseSchema();
    const seeded = await isSeedCompleted();
    if (!seeded) {
      res.json({ databaseEnabled: true, seeded: false });
      return;
    }
    const data = await readAllDirectoryData();
    if (data?.settings?.mercadoPagoConfig) {
      localSettingsMirror.set('mercadoPagoConfig', data.settings.mercadoPagoConfig);
    }
    res.json({ databaseEnabled: true, seeded: true, data: sanitizeBootstrapDataForPublic(data) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database bootstrap error.';
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      console.warn('Database temporarily unreachable in /api/bootstrap, using local preview fallback:', message);
      res.status(200).json({ databaseEnabled: false, seeded: false, transientFallback: true, warning: message });
      return;
    }
    console.error('Error in /api/bootstrap:', message);
    res.status(500).json({ databaseEnabled: true, seeded: false, error: message });
  }
});

app.post('/api/bootstrap/seed', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ databaseEnabled: false, seeded: false });
    return;
  }

  try {
    const result = await seedInitialDirectoryIfEmpty(req.body, false);
    res.json({
      databaseEnabled: true,
      seeded: true,
      seededNow: result.seededNow,
      data: sanitizeBootstrapDataForPublic(result.data),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database seed error.';
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.status(200).json({ databaseEnabled: false, seeded: false, transientFallback: true, warning: message });
      return;
    }
    console.error('Error in /api/bootstrap/seed:', message);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/bootstrap/reset', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ databaseEnabled: false, reset: false });
    return;
  }

  try {
    const result = await seedInitialDirectoryIfEmpty(req.body, true);
    res.json({ databaseEnabled: true, reset: true, data: sanitizeBootstrapDataForPublic(result.data) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database reset error.';
    console.error('Error in /api/bootstrap/reset:', message);
    res.status(500).json({ success: false, error: message });
  }
});

app.put('/api/sync/:collection', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    const { collection } = req.params;
    const { items } = req.body as { items?: any[] };
    const safeItems = Array.isArray(items) ? items : [];
    if (collection === 'categories' && safeItems.length > 0) {
      localCatalogSnapshot.categories = safeItems.map((c) => ({
        id: String(c.id || ''),
        name: String(c.name || ''),
        slug: String(c.slug || ''),
      }));
    } else if (collection === 'cities' && safeItems.length > 0) {
      localCatalogSnapshot.cities = safeItems.map((c) => ({
        id: String(c.id || ''),
        name: String(c.name || ''),
        state: String(c.state || 'BA'),
        isActive: Boolean(c.isActive),
      }));
    } else if (collection === 'businesses') {
      for (const b of safeItems) {
        if (b?.id) {
          localBusinessesMirror.set(String(b.id), {
            id: String(b.id),
            name: String(b.name || ''),
            slug: String(b.slug || ''),
            phone: String(b.phone || ''),
          });
        }
      }
    }
    await syncCollection(collection, safeItems);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database sync error.';
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.status(200).json({ success: true, databaseEnabled: false, transientFallback: true });
      return;
    }
    console.error(`Error syncing collection ${req.params.collection}:`, message);
    res.status(500).json({ success: false, error: message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  let { value } = req.body as { value?: any };

  if (key === 'mercadoPagoConfig') {
    const adminSess = await requireAdminSession(req, res);
    if (!adminSess) return;
  }

  if (key === 'mercadoPagoConfig' && value && typeof value === 'object') {
    const existingCfg = await getServerMercadoPagoConfig();
    const incomingToken = typeof value.accessToken === 'string' ? value.accessToken.trim() : '';
    const isMaskedPlaceholder = !incomingToken || incomingToken.includes('••••');
    const resolvedAccessToken = isMaskedPlaceholder ? existingCfg.accessToken : incomingToken;
    value = {
      enabled: value.enabled !== false,
      environment: value.environment === 'production' ? 'production' : 'sandbox',
      publicKey: typeof value.publicKey === 'string' ? value.publicKey.trim() : existingCfg.publicKey,
      accessToken: resolvedAccessToken,
      pixKey: typeof value.pixKey === 'string' ? value.pixKey.trim() : existingCfg.pixKey || '',
      statementDescriptor:
        typeof value.statementDescriptor === 'string' && value.statementDescriptor.trim()
          ? value.statementDescriptor.trim().toUpperCase().slice(0, 16)
          : existingCfg.statementDescriptor,
      autoApproveInSandbox: value.autoApproveInSandbox ?? true,
    };
  }

  localSettingsMirror.set(key, value);

  if (key === 'sessionConfig' && value && typeof value === 'object') {
    const adminMins = Number(value.adminSessionDurationMinutes);
    const bizMins = Number(value.businessSessionDurationMinutes);
    localSessionConfig = {
      adminSessionDurationMinutes: Number.isFinite(adminMins)
        ? Math.max(5, Math.min(43200, Math.round(adminMins)))
        : localSessionConfig.adminSessionDurationMinutes,
      businessSessionDurationMinutes: Number.isFinite(bizMins)
        ? Math.max(5, Math.min(43200, Math.round(bizMins)))
        : localSessionConfig.businessSessionDurationMinutes,
    };
  }

  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    await upsertSetting(key, value);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Settings sync error.';
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.status(200).json({ success: true, databaseEnabled: false, transientFallback: true });
      return;
    }
    console.error(`Error saving setting ${req.params.key}:`, message);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/bootstrap/sync-all', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({
      success: false,
      databaseEnabled: false,
      error: 'Variáveis DB_HOST / DB_NAME / DB_USER (ou DATABASE_URL) não estão configuradas no servidor.',
    });
    return;
  }

  try {
    const result = await seedInitialDirectoryIfEmpty(req.body, true);
    res.json({
      success: true,
      databaseEnabled: true,
      seeded: true,
      data: sanitizeBootstrapDataForPublic(result.data),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database full sync error.';
    console.error('Error in /api/bootstrap/sync-all:', message);
    res.status(500).json({ success: false, databaseEnabled: true, error: message });
  }
});

app.post('/api/entities/:resource', async (req, res) => {
  const { resource } = req.params;
  const payloadBody = req.body ? { ...req.body } : {};

  if (resource === 'businesses' && payloadBody.id) {
    localBusinessesMirror.set(String(payloadBody.id), {
      id: String(payloadBody.id),
      name: String(payloadBody.name || ''),
      slug: String(payloadBody.slug || ''),
      phone: String(payloadBody.phone || ''),
    });
    if (payloadBody.planId === 'plan-invite-premium-6m') {
      const adminSess = await resolveSessionFromRequest(req);
      if (!adminSess || adminSess.role !== 'admin') {
        payloadBody.planId = 'plan-free';
        delete payloadBody.inviteCode;
      }
    }
    const b = payloadBody;
    const rawPwd = typeof b.password === 'string' ? b.password.trim() : '';
    if (rawPwd) {
      localBusinessUsers.set(String(b.id), {
        id: String(b.id),
        name: String(b.name || ''),
        email: String(b.email || ''),
        ownerEmail: String(b.ownerEmail || ''),
        passwordHash: hashPassword(rawPwd),
      });
    }
  }

  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    await upsertEntity(resource, payloadBody);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Entity create/upsert error.';
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.status(200).json({ success: true, databaseEnabled: false, transientFallback: true });
      return;
    }
    console.error(`Error creating/upserting ${req.params.resource}:`, message);
    res.status(500).json({ success: false, databaseEnabled: true, error: message });
  }
});

app.put('/api/entities/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  const updateBody = req.body ? { ...req.body } : {};

  if (resource === 'businesses' && updateBody) {
    if (updateBody.planId === 'plan-invite-premium-6m') {
      const adminSess = await resolveSessionFromRequest(req);
      if (!adminSess || adminSess.role !== 'admin') {
        delete updateBody.planId;
        delete updateBody.inviteCode;
      }
    }
    const existing = localBusinessUsers.get(id);
    const rawPwd = typeof updateBody.password === 'string' ? updateBody.password.trim() : '';
    if (existing || rawPwd) {
      localBusinessUsers.set(id, {
        id,
        name: String(updateBody.name ?? existing?.name ?? ''),
        email: String(updateBody.email ?? existing?.email ?? ''),
        ownerEmail: String(updateBody.ownerEmail ?? existing?.ownerEmail ?? ''),
        passwordHash: rawPwd ? hashPassword(rawPwd) : (existing?.passwordHash || ''),
      });
    }
  }

  if (!isDatabaseConfigured()) {
    res.json({ success: true, updated: false, databaseEnabled: false });
    return;
  }

  try {
    const result = await updateEntityById(resource, id, updateBody);
    res.json({ success: true, updated: result.updated, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Entity update error.';
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.status(200).json({ success: true, updated: false, databaseEnabled: false, transientFallback: true });
      return;
    }
    console.error(`Error updating ${req.params.resource}/${req.params.id}:`, message);
    res.status(500).json({ success: false, databaseEnabled: true, error: message });
  }
});

app.delete('/api/entities/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  if (resource === 'businesses') {
    localBusinessUsers.delete(id);
    localBusinessMetrics.delete(id);
  }

  if (!isDatabaseConfigured()) {
    res.json({ success: true, deleted: false, databaseEnabled: false });
    return;
  }

  try {
    const result = await deleteEntityById(resource, id);
    res.json({ success: true, deleted: result.deleted, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Entity delete error.';
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.status(200).json({ success: true, deleted: false, databaseEnabled: false, transientFallback: true });
      return;
    }
    console.error(`Error deleting ${req.params.resource}/${req.params.id}:`, message);
    res.status(500).json({ success: false, databaseEnabled: true, error: message });
  }
});

// ========================================================
// Authentication & Session Management Endpoints (DB + Local)
// ========================================================

app.post('/api/auth/login', async (req, res) => {
  const { loginType, email, password } = req.body as {
    loginType?: 'admin' | 'business';
    email?: string;
    password?: string;
  };

  const role: 'admin' | 'business' = loginType === 'admin' ? 'admin' : 'business';
  const normalizedEmail = (email || '').trim().toLowerCase();
  const rawPassword = typeof password === 'string' ? password : '';

  if (!normalizedEmail || !rawPassword) {
    res.status(400).json({ success: false, error: 'Informe o e-mail e a senha de acesso.' });
    return;
  }

  const ip = getClientIp(req);
  const rateKey = `${ip}:${role}:${normalizedEmail}`;
  const rateCheck = checkLoginRateLimit(rateKey);
  if (!rateCheck.allowed) {
    res.status(429).json({
      success: false,
      error: `Muitas tentativas inválidas. Aguarde ${rateCheck.retryAfterMinutes} minuto(s) antes de tentar novamente.`,
    });
    return;
  }

  if (!isDatabaseConfigured()) {
    const now = Date.now();
    if (role === 'admin') {
      if (
        normalizedEmail !== DEFAULT_ADMIN_EMAIL.toLowerCase() ||
        !verifyPassword(rawPassword, localAdminPasswordHash)
      ) {
        recordFailedLoginAttempt(rateKey);
        res.status(401).json({ success: false, error: 'Usuário administrador ou senha inválidos.' });
        return;
      }

      clearLoginAttempts(rateKey);
      const token = crypto.randomBytes(32).toString('hex');
      const durationMinutes = localSessionConfig.adminSessionDurationMinutes;
      const session: DbAuthSessionPayload = {
        isAuthenticated: true,
        role: 'admin',
        userId: 'admin-master',
        name: 'Administrador Master',
        email: DEFAULT_ADMIN_EMAIL,
        token,
        loginTimestamp: now,
        expiresAt: now + durationMinutes * 60 * 1000,
        durationMinutes,
      };
      localSessions.set(token, session);
      res.json({ success: true, databaseEnabled: false, session });
      return;
    }

    const matchingLocalBiz = Array.from(localBusinessUsers.values()).find(
      (b) =>
        (b.ownerEmail.toLowerCase() === normalizedEmail || b.email.toLowerCase() === normalizedEmail) &&
        verifyPassword(rawPassword, b.passwordHash)
    );

    if (!matchingLocalBiz) {
      recordFailedLoginAttempt(rateKey);
      res.status(401).json({
        success: false,
        error: 'E-mail ou senha da loja inválidos.',
      });
      return;
    }

    clearLoginAttempts(rateKey);
    const token = crypto.randomBytes(32).toString('hex');
    const durationMinutes = localSessionConfig.businessSessionDurationMinutes;
    const session: DbAuthSessionPayload = {
      isAuthenticated: true,
      role: 'business',
      userId: matchingLocalBiz.id,
      name: matchingLocalBiz.name,
      email: matchingLocalBiz.ownerEmail || matchingLocalBiz.email || normalizedEmail,
      businessId: matchingLocalBiz.id,
      token,
      loginTimestamp: now,
      expiresAt: now + durationMinutes * 60 * 1000,
      durationMinutes,
    };
    localSessions.set(token, session);
    res.json({ success: true, databaseEnabled: false, session });
    return;
  }

  try {
    const result = await authenticateWithDb({
      loginType: role,
      email: normalizedEmail,
      password: rawPassword,
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || '',
    });

    if (!result.success || !result.session) {
      recordFailedLoginAttempt(rateKey);
      res.status(401).json({
        success: false,
        databaseEnabled: true,
        error: result.error || 'Credenciais inválidas.',
      });
      return;
    }

    clearLoginAttempts(rateKey);
    res.json({ success: true, databaseEnabled: true, session: result.session });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Erro ao autenticar no banco de dados.';
    console.error('Error in /api/auth/login:', rawMessage);
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.status(503).json({
        success: false,
        databaseEnabled: true,
        error: `Falha de conexão com o MySQL (${rawMessage}). Verifique no CapRover se o app do MySQL está rodando (não parado por falta de memória) e se DB_HOST aponta para o serviço MySQL correto (não phpMyAdmin).`,
      });
      return;
    }
    res.status(500).json({ success: false, databaseEnabled: true, error: rawMessage });
  }
});

app.get('/api/auth/session', async (req, res) => {
  const token = extractSessionToken(req);
  if (!token) {
    res.status(401).json({ authenticated: false, error: 'Token de sessão ausente.' });
    return;
  }

  if (!isDatabaseConfigured()) {
    const existing = localSessions.get(token);
    if (!existing || Date.now() >= existing.expiresAt) {
      localSessions.delete(token);
      res.status(401).json({ authenticated: false, error: 'Sessão expirada ou inválida.' });
      return;
    }
    res.json({ authenticated: true, databaseEnabled: false, session: existing });
    return;
  }

  try {
    const session = await verifySessionTokenInDb(token);
    if (!session) {
      res.status(401).json({ authenticated: false, databaseEnabled: true, error: 'Sessão expirada ou inválida.' });
      return;
    }
    res.json({ authenticated: true, databaseEnabled: true, session });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao validar sessão.';
    res.status(500).json({ authenticated: false, error: message });
  }
});

app.post('/api/auth/demo-business', async (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const buildLocalDemoSession = () => {
    const demoLocal =
      localBusinessUsers.get('biz-1') ||
      Array.from(localBusinessUsers.values()).find(
        (b) => b.ownerEmail.toLowerCase() === 'lojista@achenacidade.com.br'
      );
    const token = crypto.randomBytes(32).toString('hex');
    const durationMinutes = localSessionConfig.businessSessionDurationMinutes;
    const session: DbAuthSessionPayload = {
      isAuthenticated: true,
      role: 'business',
      userId: demoLocal?.id || 'biz-1',
      name: demoLocal?.name || 'Café & Bistrô Grão Nobre',
      email: demoLocal?.ownerEmail || demoLocal?.email || 'lojista@achenacidade.com.br',
      businessId: demoLocal?.id || 'biz-1',
      token,
      loginTimestamp: now,
      expiresAt: now + durationMinutes * 60 * 1000,
      durationMinutes,
    };
    localSessions.set(token, session);
    return session;
  };

  if (!isDatabaseConfigured()) {
    const session = buildLocalDemoSession();
    res.json({ success: true, databaseEnabled: false, session });
    return;
  }

  try {
    const result = await authenticateDemoBusinessInDb({
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || '',
    });

    if (!result.success || !result.session) {
      res.status(404).json({
        success: false,
        databaseEnabled: true,
        error: result.error || 'Loja demonstrativa não encontrada.',
      });
      return;
    }

    res.json({ success: true, databaseEnabled: true, session: result.session });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Erro ao acessar área demo do lojista.';
    console.error('Error in /api/auth/demo-business:', rawMessage);
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      const session = buildLocalDemoSession();
      res.json({ success: true, databaseEnabled: false, session });
      return;
    }
    res.status(500).json({ success: false, databaseEnabled: true, error: rawMessage });
  }
});

app.post('/api/auth/renew', async (req, res) => {
  const token = extractSessionToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Token de sessão ausente.' });
    return;
  }

  if (!isDatabaseConfigured()) {
    const existing = localSessions.get(token);
    if (!existing || Date.now() >= existing.expiresAt) {
      localSessions.delete(token);
      res.status(401).json({ success: false, error: 'Sessão expirada ou inválida.' });
      return;
    }
    const now = Date.now();
    const durationMinutes =
      existing.role === 'admin'
        ? localSessionConfig.adminSessionDurationMinutes
        : localSessionConfig.businessSessionDurationMinutes;
    const updated: DbAuthSessionPayload = {
      ...existing,
      loginTimestamp: now,
      expiresAt: now + durationMinutes * 60 * 1000,
      durationMinutes,
    };
    localSessions.set(token, updated);
    res.json({ success: true, databaseEnabled: false, session: updated });
    return;
  }

  try {
    const session = await renewSessionTokenInDb(token);
    if (!session) {
      res.status(401).json({ success: false, error: 'Sessão expirada ou inválida.' });
      return;
    }
    res.json({ success: true, databaseEnabled: true, session });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao renovar sessão.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = extractSessionToken(req);
  if (token) {
    localSessions.delete(token);
    if (isDatabaseConfigured()) {
      await revokeSessionTokenInDb(token);
    }
  }
  res.json({ success: true });
});

app.post('/api/auth/switch-business', async (req, res) => {
  const token = extractSessionToken(req);
  const { businessId } = req.body as { businessId?: string };
  if (!token || !businessId) {
    res.status(400).json({ success: false, error: 'Token e ID da loja são obrigatórios.' });
    return;
  }

  if (!isDatabaseConfigured()) {
    const existing = localSessions.get(token);
    if (!existing || existing.role !== 'business' || Date.now() >= existing.expiresAt) {
      res.status(401).json({ success: false, error: 'Sessão inválida ou expirada.' });
      return;
    }
    const target = localBusinessUsers.get(businessId);
    const updated: DbAuthSessionPayload = {
      ...existing,
      businessId,
      name: target?.name || existing.name,
    };
    localSessions.set(token, updated);
    res.json({ success: true, databaseEnabled: false, session: updated });
    return;
  }

  try {
    const result = await switchBusinessSessionInDb(token, businessId);
    if (!result.success || !result.session) {
      res.status(403).json({ success: false, error: result.error || 'Não autorizado.' });
      return;
    }
    res.json({ success: true, databaseEnabled: true, session: result.session });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao alternar loja.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  const token = extractSessionToken(req);
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!token) {
    res.status(401).json({ success: false, error: 'Sessão administrativa ausente.' });
    return;
  }
  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, error: 'Informe a senha atual e a nova senha.' });
    return;
  }

  if (!isDatabaseConfigured()) {
    const existing = localSessions.get(token);
    if (!existing || existing.role !== 'admin' || Date.now() >= existing.expiresAt) {
      res.status(401).json({ success: false, error: 'Sessão administrativa inválida ou expirada.' });
      return;
    }
    if (!verifyPassword(currentPassword, localAdminPasswordHash)) {
      res.status(400).json({ success: false, error: 'Senha atual incorreta.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    localAdminPasswordHash = hashPassword(newPassword);
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    const result = await changeAdminPasswordInDb(token, currentPassword, newPassword);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error || 'Falha ao atualizar senha.' });
      return;
    }
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao alterar senha.';
    res.status(500).json({ success: false, error: message });
  }
});

// Post-registration Email Verification Code (Issue & Verify)
app.post('/api/auth/verification-code/issue', async (req, res) => {
  const { email, businessId, businessName, cityName, smtp, template } = req.body as {
    email?: string;
    businessId?: string;
    businessName?: string;
    cityName?: string;
    smtp?: IncomingSmtpConfig;
    template?: {
      subject?: string;
      heading?: string;
      body?: string;
      footerNote?: string;
    };
  };

  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ success: false, error: 'Informe um e-mail válido.' });
    return;
  }

  const ip = getClientIp(req);
  const rateKey = `verify-issue:${ip}:${normalizedEmail}`;
  const rateCheck = checkLoginRateLimit(rateKey);
  if (!rateCheck.allowed) {
    res.status(429).json({
      success: false,
      error: `Muitas solicitações de código. Aguarde ${rateCheck.retryAfterMinutes} minuto(s).`,
    });
    return;
  }
  recordFailedLoginAttempt(rateKey);

  try {
    const { code } = await issueAuthCode({
      purpose: 'email_verification',
      role: 'business',
      email: normalizedEmail,
      businessId,
      ttlMinutes: 30,
    });

    const dbTemplates = isDatabaseConfigured()
      ? await getSettingFromDb<Record<string, { subject?: string; heading?: string; body?: string; footerNote?: string }>>('emailTemplates')
      : null;
    const tpl = template || dbTemplates?.email_verification || {};

    const vars = {
      codigo: code,
      nome_empresa: (businessName || '').trim() || 'sua empresa',
      cidade: (cityName || '').trim() || 'Alagoinhas - BA',
    };

    const subject = interpolateServerVars(
      tpl.subject || '{{codigo}} é o seu código de verificação no achenacidade',
      vars
    );
    const heading = interpolateServerVars(
      tpl.heading || 'Confirme o e-mail da sua empresa cadastrada',
      vars
    );
    const body = interpolateServerVars(
      tpl.body ||
        'Olá, {{nome_empresa}}!\n\nSeu cadastro no achenacidade ({{cidade}}) foi registrado! Para confirmar a titularidade do seu e-mail, acesse o Painel do Lojista e informe o código de 6 dígitos abaixo.\n\nO código expira em 30 minutos por segurança.',
      vars
    );
    const footerNote = interpolateServerVars(
      tpl.footerNote || 'Se você não realizou este cadastro no achenacidade, basta ignorar esta mensagem.',
      vars
    );

    const htmlBody = buildServerStyledEmailHtml({
      heading,
      body,
      codeLabel: 'Código de Validação de E-mail',
      highlightCode: code,
      footerNote,
    });
    const textBody = `${heading}\n\n${body}\n\nCódigo: ${code}\n\n${footerNote}`;

    const resolved = await resolveEffectiveSmtpTransportConfig(smtp);
    let deliveryMode: 'smtp' | 'local_fallback' = 'local_fallback';
    let smtpError: string | undefined;

    if (resolved) {
      try {
        const transporter = nodemailer.createTransport({
          host: resolved.host,
          port: resolved.port,
          secure: resolved.secure,
          auth: resolved.auth,
          ...getSmtpTlsOptions(resolved.allowSelfSignedCert),
        });
        await transporter.sendMail({
          from: resolved.from,
          replyTo: resolved.replyTo,
          to: normalizedEmail,
          subject,
          text: textBody,
          html: htmlBody,
        });
        deliveryMode = 'smtp';
      } catch (err) {
        smtpError = err instanceof Error ? err.message : 'Falha ao enviar e-mail via SMTP.';
      }
    }

    res.json({
      success: true,
      deliveryMode,
      subject,
      error: smtpError,
      ...(deliveryMode === 'local_fallback' && !resolved ? { debugCode: code } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao emitir código de validação.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/auth/verification-code/verify', async (req, res) => {
  const { email, code, businessId } = req.body as {
    email?: string;
    code?: string;
    businessId?: string;
  };

  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedCode = (code || '').trim();

  if (!normalizedEmail || !/^\d{6}$/.test(trimmedCode)) {
    res.status(400).json({ success: false, error: 'Informe um e-mail válido e o código de 6 dígitos.' });
    return;
  }

  try {
    const verification = await validateAuthCode({
      purpose: 'email_verification',
      role: 'business',
      email: normalizedEmail,
      code: trimmedCode,
      markUsed: true,
    });

    if (!verification.valid) {
      res.status(400).json({ success: false, error: verification.error || 'Código inválido.' });
      return;
    }

    const targetBizId = businessId || verification.businessId || undefined;
    if (isDatabaseConfigured()) {
      await markBusinessEmailVerifiedInDb(normalizedEmail, targetBizId);
    } else if (targetBizId && localBusinessUsers.has(targetBizId)) {
      const existing = localBusinessUsers.get(targetBizId)!;
      localBusinessUsers.set(targetBizId, { ...existing, emailVerified: true });
    }

    res.json({ success: true, businessId: targetBizId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao validar código.';
    res.status(500).json({ success: false, error: message });
  }
});

// Forgot Password & Reset Password (Business and Admin)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { loginType, email, smtp } = req.body as {
    loginType?: 'admin' | 'business';
    email?: string;
    smtp?: IncomingSmtpConfig;
  };

  const role: 'admin' | 'business' = loginType === 'admin' ? 'admin' : 'business';
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ success: false, error: 'Informe um endereço de e-mail válido.' });
    return;
  }

  const ip = getClientIp(req);
  const rateKey = `forgot:${ip}:${role}:${normalizedEmail}`;
  const rateCheck = checkLoginRateLimit(rateKey);
  if (!rateCheck.allowed) {
    res.status(429).json({
      success: false,
      error: `Muitas solicitações de recuperação. Aguarde ${rateCheck.retryAfterMinutes} minuto(s) e tente novamente.`,
    });
    return;
  }
  recordFailedLoginAttempt(rateKey);

  try {
    let account: { found: boolean; name?: string; businessId?: string } = { found: false };
    if (isDatabaseConfigured()) {
      account = await findAccountForPasswordResetInDb(role, normalizedEmail);
    } else if (role === 'admin') {
      if (normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
        account = { found: true, name: 'Administrador Master' };
      }
    } else {
      const localBiz = Array.from(localBusinessUsers.values()).find(
        (b) => b.ownerEmail.toLowerCase() === normalizedEmail || b.email.toLowerCase() === normalizedEmail
      );
      if (localBiz) {
        account = { found: true, name: localBiz.name, businessId: localBiz.id };
      }
    }

    const resolved = await resolveEffectiveSmtpTransportConfig(smtp);

    if (!account.found) {
      res.json({
        success: true,
        deliveryMode: resolved ? 'smtp' : 'local_fallback',
        message: 'Se este e-mail estiver cadastrado em nossa base, enviaremos um código de 6 dígitos para redefinir sua senha.',
      });
      return;
    }

    const { code } = await issueAuthCode({
      purpose: 'password_reset',
      role,
      email: normalizedEmail,
      businessId: account.businessId,
      ttlMinutes: 15,
    });

    const accountLabel = role === 'admin' ? 'Acesso Administrativo' : 'Painel do Lojista';
    const subject = `${code} é o seu código de recuperação de senha — achenacidade`;
    const heading = 'Recuperação de Senha';
    const body = `Olá, ${account.name || 'usuário'}!\n\nRecebemos uma solicitação para redefinir a senha do seu ${accountLabel} no achenacidade.\n\nInforme o código de 6 dígitos abaixo na tela de recuperação de senha. Este código expira em 15 minutos.`;
    const footerNote = 'Se você não solicitou a alteração de senha, ignore este e-mail — sua senha atual permanecerá segura.';

    const htmlBody = buildServerStyledEmailHtml({
      heading,
      body,
      codeLabel: 'Código de Recuperação de Senha',
      highlightCode: code,
      footerNote,
    });
    const textBody = `${heading}\n\n${body}\n\nCódigo: ${code}\n\n${footerNote}`;

    if (resolved) {
      try {
        const transporter = nodemailer.createTransport({
          host: resolved.host,
          port: resolved.port,
          secure: resolved.secure,
          auth: resolved.auth,
          ...getSmtpTlsOptions(resolved.allowSelfSignedCert),
        });
        await transporter.sendMail({
          from: resolved.from,
          replyTo: resolved.replyTo,
          to: normalizedEmail,
          subject,
          text: textBody,
          html: htmlBody,
        });

        res.json({
          success: true,
          deliveryMode: 'smtp',
          message: `Enviamos um código de recuperação de 6 dígitos para ${normalizedEmail}. Verifique sua caixa de entrada e spam.`,
        });
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar e-mail via SMTP.';
        res.status(502).json({
          success: false,
          error: `Não foi possível enviar o código de recuperação via SMTP: ${message}`,
        });
        return;
      }
    }

    res.json({
      success: true,
      deliveryMode: 'local_fallback',
      debugCode: code,
      message: 'Servidor SMTP não configurado neste ambiente. Utilize o código de teste exibido abaixo para redefinir sua senha.',
    });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Erro ao processar recuperação de senha.';
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.status(503).json({ success: false, error: `Falha temporária de conexão com o banco: ${rawMessage}` });
      return;
    }
    res.status(500).json({ success: false, error: rawMessage });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { loginType, email, code, newPassword } = req.body as {
    loginType?: 'admin' | 'business';
    email?: string;
    code?: string;
    newPassword?: string;
  };

  const role: 'admin' | 'business' = loginType === 'admin' ? 'admin' : 'business';
  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedCode = (code || '').trim();
  const rawNewPassword = typeof newPassword === 'string' ? newPassword : '';

  if (!normalizedEmail || !/^\d{6}$/.test(trimmedCode)) {
    res.status(400).json({ success: false, error: 'Informe o e-mail e o código de 6 dígitos recebido.' });
    return;
  }

  if (rawNewPassword.length < 6) {
    res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    return;
  }

  const ip = getClientIp(req);
  const resetRateKey = `reset:${ip}:${role}:${normalizedEmail}`;
  const rateCheck = checkLoginRateLimit(resetRateKey);
  if (!rateCheck.allowed) {
    res.status(429).json({
      success: false,
      error: `Muitas tentativas inválidas. Aguarde ${rateCheck.retryAfterMinutes} minuto(s).`,
    });
    return;
  }

  try {
    const verification = await validateAuthCode({
      purpose: 'password_reset',
      role,
      email: normalizedEmail,
      code: trimmedCode,
      markUsed: true,
    });

    if (!verification.valid) {
      recordFailedLoginAttempt(resetRateKey);
      res.status(400).json({ success: false, error: verification.error || 'Código de recuperação inválido.' });
      return;
    }

    if (isDatabaseConfigured()) {
      const resetRes = await resetPasswordInDb({
        role,
        email: normalizedEmail,
        newPassword: rawNewPassword,
      });
      if (!resetRes.success) {
        res.status(404).json({ success: false, error: resetRes.error || 'Conta não encontrada.' });
        return;
      }
    } else if (role === 'admin') {
      if (normalizedEmail !== DEFAULT_ADMIN_EMAIL.toLowerCase()) {
        res.status(404).json({ success: false, error: 'Conta administrativa não encontrada.' });
        return;
      }
      localAdminPasswordHash = hashPassword(rawNewPassword);
      for (const [token, sess] of localSessions.entries()) {
        if (sess.role === 'admin' && sess.email.toLowerCase() === normalizedEmail) {
          localSessions.delete(token);
        }
      }
    } else {
      let updated = false;
      const newHash = hashPassword(rawNewPassword);
      for (const [id, biz] of localBusinessUsers.entries()) {
        if (biz.ownerEmail.toLowerCase() === normalizedEmail || biz.email.toLowerCase() === normalizedEmail) {
          localBusinessUsers.set(id, { ...biz, passwordHash: newHash });
          updated = true;
        }
      }
      if (!updated) {
        res.status(404).json({ success: false, error: 'Nenhuma loja encontrada para este e-mail.' });
        return;
      }
      for (const [token, sess] of localSessions.entries()) {
        if (sess.role === 'business' && sess.email.toLowerCase() === normalizedEmail) {
          localSessions.delete(token);
        }
      }
    }

    clearLoginAttempts(resetRateKey);
    clearLoginAttempts(`${ip}:${role}:${normalizedEmail}`);
    clearLoginAttempts(`forgot:${ip}:${role}:${normalizedEmail}`);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso! Faça login usando sua nova senha.',
    });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Erro ao redefinir senha.';
    res.status(500).json({ success: false, error: rawMessage });
  }
});

app.get('/api/db/diagnostics', async (_req, res) => {
  try {
    const diagnostics = await getDatabaseDiagnostics();
    res.status(200).json(diagnostics);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Diagnostics error.';
    res.status(500).json({
      configured: isDatabaseConfigured(),
      connected: false,
      seeded: false,
      error: message,
    });
  }
});

app.post('/api/db/migrate', async (_req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({
      success: false,
      databaseEnabled: false,
      addedColumns: [],
      droppedLegacyTables: [],
      error: 'Banco não configurado.',
    });
    return;
  }

  try {
    const result = await migrateDatabaseSchema();
    res.json({
      success: true,
      databaseEnabled: true,
      addedColumns: result.addedColumns,
      droppedLegacyTables: result.droppedLegacyTables,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Schema migration error.';
    res.status(500).json({
      success: false,
      databaseEnabled: true,
      addedColumns: [],
      droppedLegacyTables: [],
      error: message,
    });
  }
});

app.post('/api/db/cleanup-legacy', async (_req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ success: false, databaseEnabled: false, droppedTables: [], error: 'Banco não configurado.' });
    return;
  }

  try {
    const result = await cleanupLegacyTables();
    res.json({ success: true, databaseEnabled: true, droppedTables: result.droppedTables });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao remover tabelas antigas.';
    res.status(500).json({ success: false, databaseEnabled: true, droppedTables: [], error: message });
  }
});

app.get('/api/db/schema.sql', async (_req, res) => {
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sqlContent = await fs.promises.readFile(schemaPath, 'utf-8');
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="schema.sql"');
    res.send(sqlContent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'schema.sql não encontrado.';
    res.status(404).json({ success: false, error: message });
  }
});

app.post('/api/banners/:id/click', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    await incrementBannerClicksDb(req.params.id);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Banner click error.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/metrics/track', async (req, res) => {
  const { businessId, eventType } = req.body as {
    businessId?: string;
    eventType?: DbBusinessMetricEventType;
  };

  if (
    !businessId ||
    typeof businessId !== 'string' ||
    (eventType !== 'view' && eventType !== 'whatsapp_click' && eventType !== 'showcase_click')
  ) {
    res.status(400).json({ success: false, error: 'Parâmetros de métrica inválidos.' });
    return;
  }

  if (!isDatabaseConfigured()) {
    recordLocalBusinessMetric(businessId, eventType);
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    await recordBusinessMetricInDb(businessId, eventType);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      recordLocalBusinessMetric(businessId, eventType);
      res.json({ success: true, databaseEnabled: false });
      return;
    }
    const message = err instanceof Error ? err.message : 'Business metric track error.';
    res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/metrics/:businessId', async (req, res) => {
  const { businessId } = req.params;
  if (!businessId) {
    res.status(400).json({ success: false, error: 'ID da loja é obrigatório.' });
    return;
  }

  if (!isDatabaseConfigured()) {
    res.json({
      success: true,
      databaseEnabled: false,
      metrics: getLocalBusinessMetrics(businessId),
    });
    return;
  }

  try {
    const metrics = await getBusinessMetricsFromDb(businessId);
    res.json({ success: true, databaseEnabled: true, metrics });
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.json({
        success: true,
        databaseEnabled: false,
        metrics: getLocalBusinessMetrics(businessId),
      });
      return;
    }
    const message = err instanceof Error ? err.message : 'Business metrics fetch error.';
    res.status(500).json({ success: false, error: message });
  }
});

// ========================================================
// Plan Invites (Convite Premium 6 Meses Grátis) Endpoints
// ========================================================

app.get('/api/plan-invites', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  if (!isDatabaseConfigured()) {
    const invites = Array.from(localPlanInvites.values())
      .map((inv) => ({ ...inv, status: computeLocalInviteStatus(inv) }))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json({ success: true, databaseEnabled: false, invites });
    return;
  }

  try {
    const invites = await listPlanInvitesFromDb();
    res.json({ success: true, databaseEnabled: true, invites });
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      const invites = Array.from(localPlanInvites.values()).map((inv) => ({
        ...inv,
        status: computeLocalInviteStatus(inv),
      }));
      res.json({ success: true, databaseEnabled: false, invites });
      return;
    }
    const message = err instanceof Error ? err.message : 'Erro ao listar convites.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/plan-invites', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { code, planId, maxUses, recipientHint, expiresAt } = req.body as {
    code?: string;
    planId?: string;
    maxUses?: number;
    recipientHint?: string;
    expiresAt?: string;
  };

  const normalizedCode = (code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') || generateRandomInviteCode();
  const parsedMaxUses = Math.max(1, Math.min(500, Math.round(Number(maxUses || 1))));
  const cleanRecipient = recipientHint ? String(recipientHint).trim().slice(0, 200) : undefined;
  const cleanExpiresAt = expiresAt && /^\d{4}-\d{2}-\d{2}$/.test(expiresAt.trim()) ? expiresAt.trim() : undefined;

  const newInvite: DbPlanInvite = {
    id: `inv-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    code: normalizedCode,
    planId: planId && typeof planId === 'string' ? planId : 'plan-invite-premium-6m',
    maxUses: parsedMaxUses,
    usedCount: 0,
    recipientHint: cleanRecipient,
    expiresAt: cleanExpiresAt,
    status: 'active',
    createdAt: getSaoPauloDateKey(),
  };

  if (!isDatabaseConfigured()) {
    const duplicate = Array.from(localPlanInvites.values()).some(
      (i) => i.code.toUpperCase() === newInvite.code
    );
    if (duplicate) {
      res.status(409).json({
        success: false,
        error: `Já existe um convite cadastrado com o código "${newInvite.code}".`,
      });
      return;
    }
    localPlanInvites.set(newInvite.id, newInvite);
    res.json({ success: true, databaseEnabled: false, invite: newInvite });
    return;
  }

  try {
    const created = await createPlanInviteInDb(newInvite);
    res.json({ success: true, databaseEnabled: true, invite: created });
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      localPlanInvites.set(newInvite.id, newInvite);
      res.json({ success: true, databaseEnabled: false, invite: newInvite });
      return;
    }
    const message = err instanceof Error ? err.message : 'Erro ao criar convite.';
    res.status(400).json({ success: false, error: message });
  }
});

app.post('/api/plan-invites/:id/revoke', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { id } = req.params;
  const existingLocal = localPlanInvites.get(id);
  if (existingLocal) {
    localPlanInvites.set(id, { ...existingLocal, status: 'revoked' });
  }

  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    await revokePlanInviteInDb(id);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.json({ success: true, databaseEnabled: false });
      return;
    }
    const message = err instanceof Error ? err.message : 'Erro ao revogar convite.';
    res.status(500).json({ success: false, error: message });
  }
});

app.delete('/api/plan-invites/:id', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { id } = req.params;
  localPlanInvites.delete(id);

  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    await deletePlanInviteInDb(id);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      res.json({ success: true, databaseEnabled: false });
      return;
    }
    const message = err instanceof Error ? err.message : 'Erro ao excluir convite.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/plan-invites/validate', async (req, res) => {
  const { code } = req.body as { code?: string };
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) {
    res.status(400).json({ valid: false, error: 'Informe um código de convite.' });
    return;
  }

  const validateLocal = () => {
    const match = Array.from(localPlanInvites.values()).find(
      (i) => i.code.toUpperCase() === normalized
    );
    if (!match) {
      return { valid: false, error: 'Código de convite não encontrado. Verifique com o administrador.' };
    }
    const status = computeLocalInviteStatus(match);
    const hydrated = { ...match, status };
    if (status === 'revoked') {
      return { valid: false, invite: hydrated, error: 'Este convite foi revogado pelo administrador.' };
    }
    if (status === 'expired') {
      return { valid: false, invite: hydrated, error: 'Este convite está expirado.' };
    }
    if (status === 'used') {
      return { valid: false, invite: hydrated, error: 'Este código de convite já foi utilizado.' };
    }
    return { valid: true, invite: hydrated };
  };

  if (!isDatabaseConfigured()) {
    const localRes = validateLocal();
    res.status(localRes.valid ? 200 : 400).json({ ...localRes, databaseEnabled: false });
    return;
  }

  try {
    const result = await validatePlanInviteInDb(normalized);
    res.status(result.valid ? 200 : 400).json({ ...result, databaseEnabled: true });
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      const localRes = validateLocal();
      res.status(localRes.valid ? 200 : 400).json({ ...localRes, databaseEnabled: false });
      return;
    }
    const message = err instanceof Error ? err.message : 'Erro ao validar convite.';
    res.status(500).json({ valid: false, error: message });
  }
});

app.post('/api/plan-invites/redeem', async (req, res) => {
  const session = await resolveSessionFromRequest(req);
  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Faça login ou finalize o cadastro da sua loja antes de resgatar o convite.',
    });
    return;
  }

  const { code, businessId, businessName } = req.body as {
    code?: string;
    businessId?: string;
    businessName?: string;
  };
  const normalized = (code || '').trim().toUpperCase();
  const targetBusinessId = (businessId || session.businessId || '').trim();

  if (!normalized || !targetBusinessId) {
    res.status(400).json({
      success: false,
      error: 'Código de convite e loja vinculada são obrigatórios.',
    });
    return;
  }

  const redeemLocal = () => {
    const match = Array.from(localPlanInvites.values()).find(
      (i) => i.code.toUpperCase() === normalized
    );
    if (!match) {
      return { ok: false as const, error: 'Código de convite não encontrado.' };
    }
    const status = computeLocalInviteStatus(match);
    if (status === 'revoked') return { ok: false as const, error: 'Este convite foi revogado pelo administrador.' };
    if (status === 'expired') return { ok: false as const, error: 'Este convite está expirado.' };
    if (status === 'used') return { ok: false as const, error: 'Este código de convite já atingiu o limite de uso.' };

    const expiryTarget = new Date();
    expiryTarget.setMonth(expiryTarget.getMonth() + 6);
    const planExpiresAt = expiryTarget.toISOString().split('T')[0];
    const nextUsed = match.usedCount + 1;
    const nextStatus: DbPlanInvite['status'] = nextUsed >= match.maxUses ? 'used' : 'active';
    const updated: DbPlanInvite = {
      ...match,
      usedCount: nextUsed,
      status: nextStatus,
      redeemedByBusinessId: targetBusinessId,
      redeemedByBusinessName: businessName,
      redeemedAt: getSaoPauloDateKey(),
    };
    localPlanInvites.set(match.id, updated);
    return {
      ok: true as const,
      planId: match.planId,
      planExpiresAt,
      invite: updated,
    };
  };

  if (!isDatabaseConfigured()) {
    const localRes = redeemLocal();
    if (!localRes.ok) {
      res.status(400).json({ success: false, databaseEnabled: false, error: localRes.error });
      return;
    }
    res.json({
      success: true,
      databaseEnabled: false,
      planId: localRes.planId,
      planExpiresAt: localRes.planExpiresAt,
      invite: localRes.invite,
    });
    return;
  }

  try {
    const result = await redeemPlanInviteInDb({
      code: normalized,
      businessId: targetBusinessId,
      businessName,
    });
    if (!result.success) {
      res.status(400).json({ success: false, databaseEnabled: true, error: result.error });
      return;
    }
    res.json({ ...result, databaseEnabled: true });
  } catch (err) {
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      const localRes = redeemLocal();
      if (!localRes.ok) {
        res.status(400).json({ success: false, databaseEnabled: false, error: localRes.error });
        return;
      }
      res.json({
        success: true,
        databaseEnabled: false,
        planId: localRes.planId,
        planExpiresAt: localRes.planExpiresAt,
        invite: localRes.invite,
      });
      return;
    }
    const message = err instanceof Error ? err.message : 'Erro ao resgatar convite.';
    res.status(500).json({ success: false, error: message });
  }
});

// ========================================================
// Mercado Pago REST API v1 (PIX Dinâmico, Cartão, Webhook)
// ========================================================

app.get('/api/mercadopago/admin-config', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;
  const cfg = await getServerMercadoPagoConfig();
  res.json({
    success: true,
    config: {
      ...sanitizeMercadoPagoConfigForPublic(cfg),
      hasEnvToken: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()),
    },
  });
});

app.post('/api/mercadopago/test-connection', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { accessToken: bodyToken, publicKey: bodyPublicKey, environment: bodyEnv } = (req.body || {}) as {
    accessToken?: string;
    publicKey?: string;
    environment?: 'sandbox' | 'production';
  };

  const savedCfg = await getServerMercadoPagoConfig();
  const rawIncomingToken = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  const effectiveToken =
    rawIncomingToken && !rawIncomingToken.includes('••••') ? rawIncomingToken : savedCfg.accessToken;
  const effectivePublicKey = typeof bodyPublicKey === 'string' && bodyPublicKey.trim()
    ? bodyPublicKey.trim()
    : savedCfg.publicKey;
  const effectiveEnv: 'sandbox' | 'production' =
    bodyEnv === 'production' || bodyEnv === 'sandbox' ? bodyEnv : savedCfg.environment;

  if (!effectiveToken) {
    res.status(400).json({
      success: false,
      error: 'Access Token não informado. Cole seu Access Token do Mercado Pago e tente novamente.',
    });
    return;
  }

  const isSandboxToken = effectiveToken.startsWith('TEST-');
  const isSandboxPk = effectivePublicKey.startsWith('TEST-');
  if (effectiveEnv === 'production' && (isSandboxToken || isSandboxPk)) {
    res.status(400).json({
      success: false,
      error:
        'Ambiente configurado como Produção, mas uma das chaves inicia com TEST- (Sandbox). Utilize as Credenciais de Produção (APP_USR-...).',
    });
    return;
  }
  if (effectiveEnv === 'sandbox' && effectiveToken.startsWith('APP_USR-')) {
    res.status(400).json({
      success: false,
      error:
        'Ambiente está marcado como Sandbox, mas o Access Token inicia com APP_USR- (Produção). Mude o ambiente para Produção ou use um token TEST-.',
    });
    return;
  }

  try {
    const userRes = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
        Accept: 'application/json',
      },
    });
    const userData = (await userRes.json().catch(() => ({}))) as any;

    if (!userRes.ok) {
      res.status(400).json({
        success: false,
        error: translateMercadoPagoError(userRes.status, userData, effectiveEnv),
      });
      return;
    }

    let pixAvailable = true;
    try {
      const pmRes = await fetch('https://api.mercadopago.com/v1/payment_methods', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
          Accept: 'application/json',
        },
      });
      if (pmRes.ok) {
        const methods = (await pmRes.json()) as Array<{ id?: string; status?: string }>;
        if (Array.isArray(methods) && methods.length > 0) {
          const pixMethod = methods.find((m) => m.id === 'pix');
          pixAvailable = Boolean(pixMethod && pixMethod.status !== 'deactive');
        }
      }
    } catch {
      // Non-fatal check
    }

    res.json({
      success: true,
      environment: effectiveEnv,
      pixAvailable,
      account: {
        id: userData.id,
        nickname: userData.nickname,
        email: userData.email,
        siteId: userData.site_id,
        firstName: userData.first_name,
        lastName: userData.last_name,
      },
      message: `Conexão autenticada na conta ${userData.nickname || userData.email || userData.id} (${
        effectiveEnv === 'production' ? 'Produção Ao Vivo' : 'Sandbox'
      }).`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de rede ao consultar api.mercadopago.com';
    res.status(502).json({
      success: false,
      error: `Não foi possível conectar ao servidor do Mercado Pago: ${msg}`,
    });
  }
});

app.post('/api/mercadopago/pix', async (req, res) => {
  const {
    amount,
    description,
    payerEmail,
    payerName,
    payerCpfCnpj,
    externalReference,
  } = (req.body || {}) as {
    amount?: number;
    description?: string;
    payerEmail?: string;
    payerName?: string;
    payerCpfCnpj?: string;
    externalReference?: string;
  };

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 500000) {
    res.status(400).json({ success: false, error: 'Valor inválido para cobrança PIX.' });
    return;
  }

  const cleanEmail = (payerEmail || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({
      success: false,
      error: 'Informe um e-mail válido do pagador para gerar o PIX no Mercado Pago.',
    });
    return;
  }

  const cfg = await getServerMercadoPagoConfig();
  if (!cfg.enabled) {
    res.status(400).json({
      success: false,
      error: 'Pagamentos via Mercado Pago estão desativados no painel administrativo.',
    });
    return;
  }

  const cleanDesc =
    (description || 'Assinatura Achenacidade').replace(/\s+/g, ' ').trim().slice(0, 120) ||
    'Assinatura Achenacidade';
  const cleanRef =
    (externalReference || `ACH-${Date.now()}`).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) ||
    `ACH-${Date.now()}`;

  const nameParts = (payerName || 'Cliente Achenacidade').trim().split(/\s+/).filter(Boolean);
  const firstName = (nameParts[0] || 'Cliente').slice(0, 40);
  const lastName = (nameParts.slice(1).join(' ') || 'Achenacidade').slice(0, 40);
  const docDigits = (payerCpfCnpj || '').replace(/\D/g, '');
  const hasValidDoc = docDigits.length === 11 || docDigits.length === 14;

  // In Sandbox without an explicit TEST- token, generate valid CRC16 BRCode + real QR PNG
  if (cfg.environment === 'sandbox' && !cfg.accessToken) {
    const simId = `SANDBOX-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
    const qrCode = buildServerPixPayload({
      pixKey: cfg.pixKey,
      descriptor: cfg.statementDescriptor,
      amount: numericAmount,
      reference: cleanRef,
    });
    const qrCodeBase64 = await QRCode.toDataURL(qrCode, { width: 320, margin: 2 });
    const record: LocalMercadoPagoPaymentRecord = {
      paymentId: simId,
      mode: 'sandbox_simulation',
      environment: 'sandbox',
      status: 'pending',
      statusDetail: 'pending_waiting_transfer',
      amount: Number(numericAmount.toFixed(2)),
      description: cleanDesc,
      externalReference: cleanRef,
      payerEmail: cleanEmail,
      qrCode,
      qrCodeBase64,
      createdAt: Date.now(),
    };
    localMercadoPagoPayments.set(simId, record);
    res.json({
      success: true,
      mode: record.mode,
      environment: record.environment,
      paymentId: record.paymentId,
      status: record.status,
      statusDetail: record.statusDetail,
      qrCode: record.qrCode,
      qrCodeBase64: record.qrCodeBase64,
      autoApproveInSandbox: cfg.autoApproveInSandbox,
    });
    return;
  }

  if (!cfg.accessToken) {
    res.status(400).json({
      success: false,
      error:
        'Access Token de Produção do Mercado Pago não configurado. Acesse Painel Admin -> Pagamentos Mercado Pago e salve seu Access Token (APP_USR-...).',
    });
    return;
  }

  if (cfg.environment === 'production' && cfg.accessToken.startsWith('TEST-')) {
    res.status(400).json({
      success: false,
      error:
        'O sistema está em modo Produção, mas o Access Token salvo é de Teste (TEST-...). Troque pelo Access Token de Produção (APP_USR-...) no Painel Admin.',
    });
    return;
  }

  try {
    const notificationUrl = buildPublicNotificationUrl(req);
    const mpPayload: Record<string, any> = {
      transaction_amount: Number(numericAmount.toFixed(2)),
      description: cleanDesc,
      payment_method_id: 'pix',
      statement_descriptor: cfg.statementDescriptor,
      external_reference: cleanRef,
      payer: {
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName,
        ...(hasValidDoc
          ? {
              identification: {
                type: docDigits.length === 14 ? 'CNPJ' : 'CPF',
                number: docDigits,
              },
            }
          : {}),
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    };

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = (await mpRes.json().catch(() => ({}))) as any;

    if (!mpRes.ok) {
      res.status(400).json({
        success: false,
        error: translateMercadoPagoError(mpRes.status, mpData, cfg.environment),
        mpStatus: mpRes.status,
      });
      return;
    }

    const txData = mpData?.point_of_interaction?.transaction_data || {};
    const qrCode = typeof txData.qr_code === 'string' ? txData.qr_code.trim() : '';
    const rawBase64 = typeof txData.qr_code_base64 === 'string' ? txData.qr_code_base64.trim() : '';

    if (!qrCode) {
      res.status(400).json({
        success: false,
        error:
          'O Mercado Pago criou a cobrança mas não retornou o código PIX Copia e Cola. Verifique se sua conta Mercado Pago possui chave PIX ativa para recebimento.',
      });
      return;
    }

    const qrCodeBase64 = rawBase64
      ? rawBase64.startsWith('data:image')
        ? rawBase64
        : `data:image/png;base64,${rawBase64}`
      : await QRCode.toDataURL(qrCode, { width: 320, margin: 2 });

    const paymentId = String(mpData.id);
    localMercadoPagoPayments.set(paymentId, {
      paymentId,
      mode: 'mercadopago_api',
      environment: cfg.environment,
      status: mpData.status === 'approved' ? 'approved' : mpData.status === 'rejected' ? 'rejected' : 'pending',
      statusDetail: String(mpData.status_detail || 'pending_waiting_transfer'),
      amount: Number(mpData.transaction_amount || numericAmount),
      description: cleanDesc,
      externalReference: cleanRef,
      payerEmail: cleanEmail,
      qrCode,
      qrCodeBase64,
      createdAt: Date.now(),
      paidAt: mpData.date_approved || null,
    });

    res.json({
      success: true,
      mode: 'mercadopago_api',
      environment: cfg.environment,
      paymentId,
      status: mpData.status || 'pending',
      statusDetail: mpData.status_detail || 'pending_waiting_transfer',
      qrCode,
      qrCodeBase64,
      ticketUrl: txData.ticket_url || null,
      expiresAt: mpData.date_of_expiration || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de comunicação com o Mercado Pago.';
    res.status(502).json({
      success: false,
      error: `Falha ao conectar com a API PIX do Mercado Pago: ${msg}`,
    });
  }
});

app.get('/api/mercadopago/payment/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  if (!paymentId || !/^[A-Za-z0-9_-]{4,80}$/.test(paymentId)) {
    res.status(400).json({ success: false, error: 'ID de pagamento inválido.' });
    return;
  }

  if (paymentId.startsWith('SANDBOX-')) {
    const localRec = localMercadoPagoPayments.get(paymentId);
    const approveRequested = req.query.simulateApprove === '1';
    if (localRec && approveRequested) {
      localRec.status = 'approved';
      localRec.statusDetail = 'accredited';
      localRec.paidAt = new Date().toISOString();
    }
    res.json({
      success: true,
      mode: 'sandbox_simulation',
      paymentId,
      status: localRec?.status || (approveRequested ? 'approved' : 'pending'),
      statusDetail: localRec?.statusDetail || 'pending_waiting_transfer',
      paidAt: localRec?.paidAt || null,
    });
    return;
  }

  const cfg = await getServerMercadoPagoConfig();
  if (!cfg.accessToken) {
    res.status(400).json({ success: false, error: 'Access Token do Mercado Pago não configurado no servidor.' });
    return;
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        Accept: 'application/json',
      },
    });
    const mpData = (await mpRes.json().catch(() => ({}))) as any;
    if (!mpRes.ok) {
      res.status(400).json({
        success: false,
        error: translateMercadoPagoError(mpRes.status, mpData, cfg.environment),
      });
      return;
    }

    res.json({
      success: true,
      mode: 'mercadopago_api',
      paymentId: String(mpData.id || paymentId),
      status: mpData.status || 'pending',
      statusDetail: mpData.status_detail || '',
      paidAt: mpData.date_approved || null,
      amount: mpData.transaction_amount,
      externalReference: mpData.external_reference || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de comunicação';
    res.status(502).json({ success: false, error: `Falha ao consultar pagamento no Mercado Pago: ${msg}` });
  }
});

app.post('/api/mercadopago/card', async (req, res) => {
  const {
    amount,
    description,
    token,
    installments,
    paymentMethodId,
    issuerId,
    payerEmail,
    payerName,
    payerCpfCnpj,
    externalReference,
  } = (req.body || {}) as {
    amount?: number;
    description?: string;
    token?: string;
    installments?: number;
    paymentMethodId?: string;
    issuerId?: string | number;
    payerEmail?: string;
    payerName?: string;
    payerCpfCnpj?: string;
    externalReference?: string;
  };

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 500000) {
    res.status(400).json({ success: false, error: 'Valor inválido para pagamento no cartão.' });
    return;
  }

  const cleanEmail = (payerEmail || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ success: false, error: 'E-mail do pagador inválido.' });
    return;
  }

  const cfg = await getServerMercadoPagoConfig();
  if (!cfg.enabled) {
    res.status(400).json({ success: false, error: 'Pagamentos via Mercado Pago estão desativados.' });
    return;
  }

  if (cfg.environment === 'sandbox' && !token) {
    const simId = `MP-SANDBOX-${crypto.randomInt(100000000, 999999999)}`;
    res.json({
      success: true,
      mode: 'sandbox_simulation',
      paymentId: simId,
      status: 'approved',
      statusDetail: 'accredited',
      paidAt: new Date().toISOString(),
    });
    return;
  }

  if (!cfg.accessToken) {
    res.status(400).json({ success: false, error: 'Access Token do Mercado Pago não configurado no servidor.' });
    return;
  }
  if (!token) {
    res.status(400).json({
      success: false,
      error:
        'Tokenização do cartão não concluída. Verifique se a Public Key do Mercado Pago está configurada corretamente em Produção.',
    });
    return;
  }

  const docDigits = (payerCpfCnpj || '').replace(/\D/g, '');
  const hasValidDoc = docDigits.length === 11 || docDigits.length === 14;
  const nameParts = (payerName || 'Cliente Achenacidade').trim().split(/\s+/).filter(Boolean);
  const notificationUrl = buildPublicNotificationUrl(req);

  try {
    const mpPayload: Record<string, any> = {
      transaction_amount: Number(numericAmount.toFixed(2)),
      token: String(token).trim(),
      description: (description || 'Assinatura Achenacidade').trim().slice(0, 120),
      installments: Math.max(1, Math.min(12, Number(installments) || 1)),
      ...(paymentMethodId ? { payment_method_id: String(paymentMethodId) } : {}),
      ...(issuerId ? { issuer_id: issuerId } : {}),
      statement_descriptor: cfg.statementDescriptor,
      external_reference: (externalReference || `ACH-${Date.now()}`).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64),
      payer: {
        email: cleanEmail,
        first_name: (nameParts[0] || 'Cliente').slice(0, 40),
        last_name: (nameParts.slice(1).join(' ') || 'Achenacidade').slice(0, 40),
        ...(hasValidDoc
          ? {
              identification: {
                type: docDigits.length === 14 ? 'CNPJ' : 'CPF',
                number: docDigits,
              },
            }
          : {}),
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    };

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(mpPayload),
    });
    const mpData = (await mpRes.json().catch(() => ({}))) as any;

    if (!mpRes.ok) {
      res.status(400).json({
        success: false,
        error: translateMercadoPagoError(mpRes.status, mpData, cfg.environment),
      });
      return;
    }

    if (mpData.status === 'rejected') {
      res.status(400).json({
        success: false,
        error: `Pagamento no cartão recusado pelo Mercado Pago (${mpData.status_detail || 'cc_rejected'}).`,
      });
      return;
    }

    res.json({
      success: true,
      mode: 'mercadopago_api',
      paymentId: String(mpData.id),
      status: mpData.status || 'pending',
      statusDetail: mpData.status_detail || '',
      paidAt: mpData.date_approved || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de comunicação';
    res.status(502).json({ success: false, error: `Falha ao processar cartão no Mercado Pago: ${msg}` });
  }
});

app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const paymentIdRaw = req.body?.data?.id || req.query?.['data.id'] || req.query?.id;
    const topic = req.body?.type || req.body?.topic || req.query?.topic;

    if (!paymentIdRaw || (topic && !String(topic).includes('payment'))) {
      res.status(200).json({ received: true });
      return;
    }

    const paymentId = String(paymentIdRaw).trim();
    if (!/^[A-Za-z0-9_-]{4,80}$/.test(paymentId)) {
      res.status(200).json({ received: true });
      return;
    }

    const cfg = await getServerMercadoPagoConfig();
    if (!cfg.accessToken) {
      res.status(200).json({ received: true });
      return;
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        Accept: 'application/json',
      },
    });
    if (!mpRes.ok) {
      res.status(200).json({ received: true });
      return;
    }

    const mpData = (await mpRes.json()) as any;
    const localRec = localMercadoPagoPayments.get(paymentId);
    if (localRec) {
      localRec.status = mpData.status === 'approved' ? 'approved' : mpData.status === 'rejected' ? 'rejected' : 'pending';
      localRec.statusDetail = String(mpData.status_detail || '');
      localRec.paidAt = mpData.date_approved || null;
    }

    res.status(200).json({ received: true, status: mpData.status || 'unknown' });
  } catch {
    res.status(200).json({ received: true });
  }
});

// ========================================================
// Google Maps Platform Places Importer (Rascunhos + Agendador)
// ========================================================

async function getGoogleMapsImporterConfig(): Promise<ServerGoogleMapsImporterConfig> {
  let dbCfg: Partial<ServerGoogleMapsImporterConfig> | null = null;
  if (isDatabaseConfigured()) {
    try {
      dbCfg = await getSettingFromDb<Partial<ServerGoogleMapsImporterConfig>>('googleMapsImporterConfig');
    } catch (err) {
      if (isTransientConnectionError(err)) {
        await closePool().catch(() => {});
      }
    }
  }
  const mirrorCfg = localSettingsMirror.get('googleMapsImporterConfig') as
    | Partial<ServerGoogleMapsImporterConfig>
    | undefined;
  return {
    ...DEFAULT_GMP_IMPORTER_CONFIG,
    ...(mirrorCfg || {}),
    ...(dbCfg || {}),
  };
}

async function saveGoogleMapsImporterConfig(cfg: ServerGoogleMapsImporterConfig): Promise<void> {
  localSettingsMirror.set('googleMapsImporterConfig', cfg);
  if (isDatabaseConfigured()) {
    try {
      await upsertSetting('googleMapsImporterConfig', cfg);
    } catch (err) {
      if (isTransientConnectionError(err)) {
        await closePool().catch(() => {});
      } else {
        console.warn('Erro ao salvar googleMapsImporterConfig no banco:', err);
      }
    }
  }
}

function scheduleGoogleMapsTimer(cfg: ServerGoogleMapsImporterConfig) {
  if (gmpSchedulerTimer) {
    clearInterval(gmpSchedulerTimer);
    gmpSchedulerTimer = null;
  }
  if (!cfg.enabled) {
    return;
  }
  const intervalMinutes = Math.max(5, Number(cfg.intervalMinutes) || 30);
  const intervalMs = intervalMinutes * 60 * 1000;

  gmpSchedulerTimer = setInterval(() => {
    void (async () => {
      const latestCfg = await getGoogleMapsImporterConfig();
      if (!latestCfg.enabled || !resolveGoogleMapsApiKey() || isGmpBatchRunning) {
        return;
      }
      await executeGoogleMapsBatch(latestCfg.batchSize || 10);
    })();
  }, intervalMs);

  gmpSchedulerTimer.unref?.();
}

function toBusinessSlug(name: string, existingSlugs: Set<string>): string {
  const base =
    (name || 'empresa')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'empresa';
  if (!existingSlugs.has(base)) {
    existingSlugs.add(base);
    return base;
  }
  let counter = 2;
  while (existingSlugs.has(`${base}-${counter}`)) {
    counter += 1;
  }
  const unique = `${base}-${counter}`;
  existingSlugs.add(unique);
  return unique;
}

function buildApprovedBusinessFromDraft(
  draft: DbGoogleMapsBusinessDraft,
  existingSlugs: Set<string>
) {
  const bizId = `biz-gmp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  const slug = toBusinessSlug(draft.name, existingSlugs);
  const resolvedPhotoUrl = (draft.photoUrl || '').trim();
  return {
    id: bizId,
    name: draft.name,
    slug,
    cityId: draft.cityId || 'city-1',
    categoryId: draft.categoryId || 'cat-1',
    planId: draft.planId || 'plan-free',
    description: draft.description || '',
    phone: draft.phone || '',
    whatsapp: draft.whatsapp || '',
    address: draft.address || '',
    neighborhood: draft.neighborhood || 'Centro',
    ...(draft.openingHours ? { openingHours: draft.openingHours } : {}),
    logoUrl: resolvedPhotoUrl,
    ...(resolvedPhotoUrl ? { coverUrl: resolvedPhotoUrl } : {}),
    ...(draft.website ? { website: draft.website } : {}),
    isVerified: false,
    emailVerified: false,
    paymentStatus: 'active' as const,
    subscriptionStatus: 'active' as const,
    createdAt: getSaoPauloDateKey(),
  };
}

async function listAllDraftsMerged(): Promise<{
  drafts: DbGoogleMapsBusinessDraft[];
  databaseEnabled: boolean;
}> {
  if (isDatabaseConfigured()) {
    try {
      const dbDrafts = await listBusinessDraftsFromDb();
      for (const d of dbDrafts) {
        localBusinessDrafts.set(d.id, d);
      }
      return { drafts: dbDrafts, databaseEnabled: true };
    } catch (err) {
      if (!isTransientConnectionError(err)) {
        throw err;
      }
      await closePool().catch(() => {});
    }
  }

  const orderWeight = (status: DbGoogleMapsBusinessDraft['status']) =>
    status === 'pending' ? 0 : status === 'approved' ? 1 : 2;
  const localList = Array.from(localBusinessDrafts.values()).sort((a, b) => {
    const wDiff = orderWeight(a.status) - orderWeight(b.status);
    if (wDiff !== 0) return wDiff;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
  return { drafts: localList, databaseEnabled: false };
}

async function executeGoogleMapsBatch(targetCount: number) {
  if (isGmpBatchRunning) {
    return {
      success: false,
      busy: true,
      addedCount: 0,
      skippedDuplicates: 0,
      queriesExecuted: 0,
      quotaExceeded: false,
      summary: 'Já existe uma busca do Google Maps em execução. Aguarde a conclusão.',
      error: 'Já existe uma busca do Google Maps em execução. Aguarde a conclusão.',
    };
  }

  isGmpBatchRunning = true;
  try {
    const cfg = await getGoogleMapsImporterConfig();
    const existingPlaceIds = new Set<string>();
    const existingSignatures = new Set<string>();
    let categories = localCatalogSnapshot.categories;
    let cities = localCatalogSnapshot.cities;

    for (const d of localBusinessDrafts.values()) {
      if (d.googlePlaceId) existingPlaceIds.add(d.googlePlaceId);
      existingSignatures.add(normalizeBusinessSignature(d.name, d.phone));
    }
    for (const b of localBusinessesMirror.values()) {
      existingSignatures.add(normalizeBusinessSignature(b.name, b.phone));
    }

    if (isDatabaseConfigured()) {
      try {
        const dbData = await getExistingDraftPlaceIdsAndBusinessNamesFromDb();
        for (const pid of dbData.placeIds) existingPlaceIds.add(pid);
        for (const biz of dbData.businesses) {
          existingSignatures.add(normalizeBusinessSignature(biz.name, biz.phone));
        }
        if (dbData.categories.length > 0) {
          categories = dbData.categories;
          localCatalogSnapshot.categories = dbData.categories;
        }
        if (dbData.cities.length > 0) {
          cities = dbData.cities;
          localCatalogSnapshot.cities = dbData.cities;
        }
      } catch (err) {
        if (isTransientConnectionError(err)) {
          await closePool().catch(() => {});
        }
      }
    }

    const result = await runGoogleMapsImportBatch({
      targetCount,
      startCursor: cfg.nextQueryCursor || 0,
      existingPlaceIds,
      existingSignatures,
      categories,
      cities,
    });

    let persistedCount = 0;
    if (result.addedDrafts.length > 0) {
      for (const draft of result.addedDrafts) {
        localBusinessDrafts.set(draft.id, draft);
      }
      if (isDatabaseConfigured()) {
        try {
          persistedCount = await insertBusinessDraftsInDb(result.addedDrafts);
        } catch (err) {
          if (isTransientConnectionError(err)) {
            await closePool().catch(() => {});
            persistedCount = result.addedDrafts.length;
          } else {
            throw err;
          }
        }
      } else {
        persistedCount = result.addedDrafts.length;
      }
    }

    const intervalMinutes = Math.max(5, Number(cfg.intervalMinutes) || 30);
    const updatedCfg: ServerGoogleMapsImporterConfig = {
      ...cfg,
      nextQueryCursor: result.nextCursor,
      totalImportedCount: (cfg.totalImportedCount || 0) + persistedCount,
      lastRunAt: new Date().toISOString(),
      nextRunAt: cfg.enabled
        ? new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString()
        : undefined,
      lastRunSummary: result.summary,
      lastError: result.error || undefined,
    };

    await saveGoogleMapsImporterConfig(updatedCfg);

    return {
      success: result.success,
      busy: false,
      addedCount: result.addedDrafts.length,
      skippedDuplicates: result.skippedDuplicates,
      queriesExecuted: result.queriesExecuted,
      quotaExceeded: result.quotaExceeded,
      summary: result.summary,
      error: result.error,
      config: updatedCfg,
    };
  } finally {
    isGmpBatchRunning = false;
  }
}

app.get('/api/google-maps/drafts', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  try {
    const [{ drafts, databaseEnabled }, cfg] = await Promise.all([
      listAllDraftsMerged(),
      getGoogleMapsImporterConfig(),
    ]);

    const counts = {
      total: drafts.length,
      pending: drafts.filter((d) => d.status === 'pending').length,
      approved: drafts.filter((d) => d.status === 'approved').length,
      rejected: drafts.filter((d) => d.status === 'rejected').length,
    };

    const statusParam = typeof req.query.status === 'string' ? req.query.status.trim() : 'all';
    const categoryIdParam = typeof req.query.categoryId === 'string' ? req.query.categoryId.trim() : 'all';
    const cityParam = typeof req.query.city === 'string' ? req.query.city.trim() : 'all';
    const searchParam = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const hasPageParam = typeof req.query.page === 'string' || typeof req.query.pageSize === 'string';

    const statusScoped =
      statusParam && statusParam !== 'all'
        ? drafts.filter((d) => d.status === statusParam)
        : drafts;

    const availableCities = Array.from(
      new Set(statusScoped.map((d) => (d.cityName || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const filtered = statusScoped.filter((d) => {
      if (categoryIdParam && categoryIdParam !== 'all' && d.categoryId !== categoryIdParam) {
        return false;
      }
      if (
        cityParam &&
        cityParam !== 'all' &&
        (d.cityName || '').trim().toLowerCase() !== cityParam.toLowerCase()
      ) {
        return false;
      }
      if (searchParam) {
        const haystack = [
          d.name,
          d.neighborhood,
          d.cityName,
          d.categoryName,
          d.address,
          d.phone,
          d.whatsapp,
          d.sourceQuery,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchParam)) return false;
      }
      return true;
    });

    const configPayload = {
      ...cfg,
      isRunning: isGmpBatchRunning,
      hasApiKey: Boolean(resolveGoogleMapsApiKey()),
    };

    if (hasPageParam) {
      const pageSize = Math.max(
        5,
        Math.min(100, Math.round(Number(req.query.pageSize) || 10))
      );
      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const requestedPage = Math.round(Number(req.query.page) || 1);
      const page = Math.max(1, Math.min(totalPages, requestedPage));
      const startIndex = (page - 1) * pageSize;
      const pagedDrafts = filtered.slice(startIndex, startIndex + pageSize);

      res.json({
        success: true,
        databaseEnabled,
        drafts: pagedDrafts,
        counts,
        availableCities,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasPreviousPage: page > 1,
          hasNextPage: page < totalPages,
        },
        config: configPayload,
      });
      return;
    }

    res.json({
      success: true,
      databaseEnabled,
      drafts: filtered,
      counts,
      availableCities,
      config: configPayload,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar rascunhos do Google Maps.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/google-maps/import-batch', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const requestedCount = Number((req.body as { count?: number } | undefined)?.count || 10);
  const targetCount = Math.max(1, Math.min(50, Math.round(Number.isFinite(requestedCount) ? requestedCount : 10)));

  try {
    const batchResult = await executeGoogleMapsBatch(targetCount);
    if (batchResult.busy) {
      res.status(409).json(batchResult);
      return;
    }

    const { drafts, databaseEnabled } = await listAllDraftsMerged();
    const statusCode = batchResult.quotaExceeded
      ? 429
      : !batchResult.success && !resolveGoogleMapsApiKey()
      ? 400
      : 200;

    res.status(statusCode).json({
      ...batchResult,
      databaseEnabled,
      drafts,
      config: {
        ...(batchResult.config || (await getGoogleMapsImporterConfig())),
        isRunning: isGmpBatchRunning,
        hasApiKey: Boolean(resolveGoogleMapsApiKey()),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao executar busca no Google Maps.';
    res.status(500).json({ success: false, error: message });
  }
});

app.put('/api/google-maps/scheduler', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { enabled, intervalMinutes, batchSize } = (req.body || {}) as {
    enabled?: boolean;
    intervalMinutes?: number;
    batchSize?: number;
  };

  try {
    const current = await getGoogleMapsImporterConfig();
    const nextInterval = Math.max(
      5,
      Math.min(1440, Math.round(Number(intervalMinutes ?? current.intervalMinutes) || 30))
    );
    const nextBatch = Math.max(1, Math.min(50, Math.round(Number(batchSize ?? current.batchSize) || 10)));
    const nextEnabled = typeof enabled === 'boolean' ? enabled : current.enabled;

    const updated: ServerGoogleMapsImporterConfig = {
      ...current,
      enabled: nextEnabled,
      intervalMinutes: nextInterval,
      batchSize: nextBatch,
      nextRunAt: nextEnabled
        ? new Date(Date.now() + nextInterval * 60 * 1000).toISOString()
        : undefined,
    };

    await saveGoogleMapsImporterConfig(updated);
    scheduleGoogleMapsTimer(updated);

    res.json({
      success: true,
      config: {
        ...updated,
        isRunning: isGmpBatchRunning,
        hasApiKey: Boolean(resolveGoogleMapsApiKey()),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar agendador do Google Maps.';
    res.status(500).json({ success: false, error: message });
  }
});

app.put('/api/google-maps/drafts/:id', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { id } = req.params;
  const updates = (req.body || {}) as Partial<DbGoogleMapsBusinessDraft>;
  const existingLocal = localBusinessDrafts.get(id);
  if (existingLocal) {
    localBusinessDrafts.set(id, { ...existingLocal, ...updates, updatedAt: new Date().toISOString() });
  }

  if (isDatabaseConfigured()) {
    try {
      const updatedDb = await updateBusinessDraftInDb(id, updates);
      if (updatedDb) {
        localBusinessDrafts.set(id, updatedDb);
        res.json({ success: true, databaseEnabled: true, draft: updatedDb });
        return;
      }
    } catch (err) {
      if (!isTransientConnectionError(err)) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar rascunho.';
        res.status(500).json({ success: false, error: message });
        return;
      }
      await closePool().catch(() => {});
    }
  }

  const localDraft = localBusinessDrafts.get(id);
  if (!localDraft) {
    res.status(404).json({ success: false, error: 'Rascunho não encontrado.' });
    return;
  }
  res.json({ success: true, databaseEnabled: false, draft: localDraft });
});

app.post('/api/google-maps/drafts/approve-bulk', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { ids } = (req.body || {}) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, error: 'Selecione ao menos um rascunho para aprovar.' });
    return;
  }

  try {
    const { drafts, databaseEnabled } = await listAllDraftsMerged();
    const existingSlugs = new Set(
      Array.from(localBusinessesMirror.values()).map((b) => b.slug).filter(Boolean)
    );
    const createdBusinesses: any[] = [];

    for (const id of ids) {
      const draft = drafts.find((d) => d.id === id);
      if (!draft || draft.status === 'approved') continue;

      const newBusiness = buildApprovedBusinessFromDraft(draft, existingSlugs);
      localBusinessesMirror.set(newBusiness.id, {
        id: newBusiness.id,
        name: newBusiness.name,
        slug: newBusiness.slug,
        phone: newBusiness.phone,
      });

      if (databaseEnabled) {
        const dbRes = await approveBusinessDraftInDb(draft.id, newBusiness);
        if (dbRes.draft) {
          localBusinessDrafts.set(draft.id, dbRes.draft);
        }
      } else {
        localBusinessDrafts.set(draft.id, {
          ...draft,
          status: 'approved',
          approvedBusinessId: newBusiness.id,
          updatedAt: new Date().toISOString(),
        });
      }
      createdBusinesses.push(newBusiness);
    }

    const latest = await listAllDraftsMerged();
    res.json({
      success: true,
      databaseEnabled: latest.databaseEnabled,
      approvedCount: createdBusinesses.length,
      drafts: latest.drafts,
      createdBusinesses,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao aprovar rascunhos em lote.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/google-maps/drafts/:id/approve', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { id } = req.params;
  try {
    const { drafts, databaseEnabled } = await listAllDraftsMerged();
    const draft = drafts.find((d) => d.id === id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Rascunho não encontrado.' });
      return;
    }

    const existingSlugs = new Set(
      Array.from(localBusinessesMirror.values()).map((b) => b.slug).filter(Boolean)
    );
    const newBusiness = buildApprovedBusinessFromDraft(draft, existingSlugs);
    localBusinessesMirror.set(newBusiness.id, {
      id: newBusiness.id,
      name: newBusiness.name,
      slug: newBusiness.slug,
      phone: newBusiness.phone,
    });

    let updatedDraft: DbGoogleMapsBusinessDraft = {
      ...draft,
      status: 'approved',
      approvedBusinessId: newBusiness.id,
      updatedAt: new Date().toISOString(),
    };

    if (databaseEnabled) {
      const dbRes = await approveBusinessDraftInDb(draft.id, newBusiness);
      if (dbRes.draft) {
        updatedDraft = dbRes.draft;
      }
    }
    localBusinessDrafts.set(draft.id, updatedDraft);

    res.json({
      success: true,
      databaseEnabled,
      draft: updatedDraft,
      business: newBusiness,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao aprovar rascunho.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/google-maps/drafts/:id/fetch-photo', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { id } = req.params;
  try {
    const { drafts, databaseEnabled } = await listAllDraftsMerged();
    const draft = drafts.find((d) => d.id === id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Rascunho não encontrado.' });
      return;
    }

    const photoResult = await fetchGooglePlacePhotoByPlaceId(draft.googlePlaceId);
    if (!photoResult.success || !photoResult.photo?.photoUrl) {
      res.status(400).json({
        success: false,
        error: photoResult.error || 'Nenhuma foto localizada no Google Maps para este local.',
      });
      return;
    }

    const updates: Partial<DbGoogleMapsBusinessDraft> = {
      photoUrl: photoResult.photo.photoUrl,
      ...(photoResult.photo.photoAttributionName
        ? { photoAttributionName: photoResult.photo.photoAttributionName }
        : {}),
      ...(photoResult.photo.photoAttributionUri
        ? { photoAttributionUri: photoResult.photo.photoAttributionUri }
        : {}),
    };

    let updatedDraft: DbGoogleMapsBusinessDraft = {
      ...draft,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (databaseEnabled) {
      const updatedDb = await updateBusinessDraftInDb(id, updates);
      if (updatedDb) {
        updatedDraft = updatedDb;
      }
    }
    localBusinessDrafts.set(id, updatedDraft);

    res.json({
      success: true,
      databaseEnabled,
      draft: updatedDraft,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar foto no Google Maps.';
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/google-maps/drafts/:id/reject', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { id } = req.params;
  const existingLocal = localBusinessDrafts.get(id);
  if (existingLocal) {
    localBusinessDrafts.set(id, {
      ...existingLocal,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    });
  }

  if (isDatabaseConfigured()) {
    try {
      const updated = await updateBusinessDraftInDb(id, { status: 'rejected' });
      if (updated) {
        localBusinessDrafts.set(id, updated);
        res.json({ success: true, databaseEnabled: true, draft: updated });
        return;
      }
    } catch (err) {
      if (!isTransientConnectionError(err)) {
        const message = err instanceof Error ? err.message : 'Erro ao rejeitar rascunho.';
        res.status(500).json({ success: false, error: message });
        return;
      }
      await closePool().catch(() => {});
    }
  }

  const localDraft = localBusinessDrafts.get(id);
  if (!localDraft) {
    res.status(404).json({ success: false, error: 'Rascunho não encontrado.' });
    return;
  }
  res.json({ success: true, databaseEnabled: false, draft: localDraft });
});

app.delete('/api/google-maps/drafts/:id', async (req, res) => {
  const adminSess = await requireAdminSession(req, res);
  if (!adminSess) return;

  const { id } = req.params;
  localBusinessDrafts.delete(id);

  if (isDatabaseConfigured()) {
    try {
      await deleteBusinessDraftInDb(id);
      res.json({ success: true, databaseEnabled: true });
      return;
    } catch (err) {
      if (!isTransientConnectionError(err)) {
        const message = err instanceof Error ? err.message : 'Erro ao excluir rascunho.';
        res.status(500).json({ success: false, error: message });
        return;
      }
      await closePool().catch(() => {});
    }
  }

  res.json({ success: true, databaseEnabled: false });
});

app.get('/api/health', async (_req, res) => {
  let database: 'connected' | 'not_configured' | 'error' = 'not_configured';
  let databaseError: string | undefined;
  if (isDatabaseConfigured()) {
    try {
      const dbPool = getPool();
      if (dbPool) {
        await dbPool.query('SELECT 1');
        database = 'connected';
      }
    } catch (err) {
      database = 'error';
      databaseError = err instanceof Error ? err.message : 'Connection failed';
      if (isTransientConnectionError(err)) {
        await closePool().catch(() => {});
      }
    }
  }
  res.status(200).json({ status: 'ok', database, ...(databaseError ? { databaseError } : {}) });
});

async function startServer() {
  if (isDatabaseConfigured()) {
    ensureDatabaseSchema()
      .then(() => console.log('MySQL/MariaDB schema verified successfully.'))
      .catch((err) => console.error('Initial DB connection check failed (will retry on request):', err?.message || err));
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });

    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(`import "/node_modules/vite/dist/client/env.mjs";

const sheetsMap = new Map();
const linkSheetsMap = new Map();

if (typeof document !== "undefined") {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}

let lastInsertedStyle;

export function updateStyle(id, content) {
  if (typeof document === "undefined" || linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => {
        lastInsertedStyle = undefined;
      }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id) {
  if (typeof document === "undefined") return;
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`).forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}

export function createHotContext() {
  const noop = () => {};
  return {
    data: {},
    accept: noop,
    acceptExports: noop,
    dispose: noop,
    prune: noop,
    decline: noop,
    invalidate: noop,
    on: noop,
    off: noop,
    send: noop,
  };
}

export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}

export class ErrorOverlay extends (typeof HTMLElement !== "undefined" ? HTMLElement : Object) {}
`);
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`achenacidade server running on http://0.0.0.0:${PORT}`);
    void (async () => {
      try {
        const gmpCfg = await getGoogleMapsImporterConfig();
        if (gmpCfg.enabled) {
          const intervalMs = Math.max(5, Number(gmpCfg.intervalMinutes) || 30) * 60 * 1000;
          const nextCfg = {
            ...gmpCfg,
            nextRunAt: new Date(Date.now() + intervalMs).toISOString(),
          };
          await saveGoogleMapsImporterConfig(nextCfg);
          scheduleGoogleMapsTimer(nextCfg);
        }
      } catch (err) {
        console.warn('Could not initialize Google Maps scheduler on startup:', err);
      }
    })();
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down achenacidade server gracefully...`);
    if (gmpSchedulerTimer) {
      clearInterval(gmpSchedulerTimer);
      gmpSchedulerTimer = null;
    }
    server.close(async () => {
      try {
        await closePool();
      } catch {
        // Ignore pool close errors on exit
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer();
