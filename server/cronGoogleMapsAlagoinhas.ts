import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { schedule, validate, type ScheduledTask } from 'node-cron';
import {
  closePool,
  ensureDatabaseSchema,
  getExistingDraftPlaceIdsAndBusinessNamesFromDb,
  getSettingFromDb,
  insertBusinessDraftsInDb,
  isDatabaseConfigured,
  isTransientConnectionError,
  upsertSetting,
  type DbGoogleMapsBusinessDraft,
} from './db.ts';
import {
  normalizeBusinessSignature,
  resolveGoogleMapsApiKey,
  runGoogleMapsImportBatch,
  type DirectoryCategoryTarget,
  type DirectoryCityTarget,
} from './googleMapsImporter.ts';

const CRON_EXPRESSION = '*/30 * * * *';
const CRON_TIMEZONE = 'America/Bahia';
const TARGET_BATCH_COUNT = 10;
const DEFAULT_PLAN_ID = 'plan-free';
const CONFIG_KEY = 'googleMapsImporterConfig';
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE_PATH = path.join(LOG_DIR, 'google-maps-cron.log');

interface ImporterConfigRecord {
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

interface CronExecutionReport {
  timestamp: string;
  timestampBahia: string;
  trigger: 'cron' | 'manual_once' | 'startup';
  cityScope: string;
  planId: string;
  draftStatus: 'pending';
  targetCount: number;
  status: 'success' | 'no_new_places' | 'skipped_busy' | 'error';
  durationMs: number;
  queriesExecuted: number;
  foundCount: number;
  insertedCount: number;
  skippedDuplicates: number;
  quotaExceeded: boolean;
  nextCursor: number;
  nextScheduledRunAt: string;
  summary: string;
  error?: string;
  insertedBusinesses: Array<{
    id: string;
    name: string;
    category: string;
    neighborhood: string;
    city: string;
    planId: string;
    status: string;
    photoUrl?: string;
  }>;
}

const DEFAULT_IMPORTER_CONFIG: ImporterConfigRecord = {
  enabled: true,
  intervalMinutes: 30,
  batchSize: TARGET_BATCH_COUNT,
  initialBatchSize: 50,
  nextQueryCursor: 0,
  totalImportedCount: 0,
};

let isJobRunning = false;
let scheduledTask: ScheduledTask | null = null;
let isShuttingDown = false;

function formatBahiaTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: CRON_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function getNextHalfHourIso(fromDate = new Date()): string {
  const next = new Date(fromDate.getTime());
  next.setSeconds(0, 0);
  const mins = next.getMinutes();
  const nextSlotMinute = mins < 30 ? 30 : 60;
  next.setMinutes(nextSlotMinute);
  return next.toISOString();
}

function appendCronLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, payload?: unknown) {
  const now = new Date();
  const bahiaTs = formatBahiaTimestamp(now);
  const linePrefix = `[${bahiaTs} | ${CRON_TIMEZONE}] [GMP-CRON] [${level}]`;
  const textLine = payload
    ? `${linePrefix} ${message} ${JSON.stringify(payload)}`
    : `${linePrefix} ${message}`;

  if (level === 'ERROR') {
    console.error(textLine);
  } else if (level === 'WARN') {
    console.warn(textLine);
  } else {
    console.log(textLine);
  }

  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    const logRecord = {
      timestamp: now.toISOString(),
      timestampBahia: bahiaTs,
      level,
      message,
      ...(payload !== undefined ? { data: payload } : {}),
    };
    fs.appendFileSync(LOG_FILE_PATH, `${JSON.stringify(logRecord)}\n`, 'utf8');
  } catch (err) {
    console.warn(
      `${linePrefix} Falha ao gravar arquivo de log (${LOG_FILE_PATH}):`,
      err instanceof Error ? err.message : String(err)
    );
  }
}

async function runAlagoinhasDraftImportJob(
  trigger: CronExecutionReport['trigger']
): Promise<CronExecutionReport> {
  const startedAt = Date.now();
  const nowIso = new Date().toISOString();
  const nowBahia = formatBahiaTimestamp();
  const nextScheduledRunAt = getNextHalfHourIso();

  if (isJobRunning) {
    const busyReport: CronExecutionReport = {
      timestamp: nowIso,
      timestampBahia: nowBahia,
      trigger,
      cityScope: 'Alagoinhas - BA',
      planId: DEFAULT_PLAN_ID,
      draftStatus: 'pending',
      targetCount: TARGET_BATCH_COUNT,
      status: 'skipped_busy',
      durationMs: Date.now() - startedAt,
      queriesExecuted: 0,
      foundCount: 0,
      insertedCount: 0,
      skippedDuplicates: 0,
      quotaExceeded: false,
      nextCursor: 0,
      nextScheduledRunAt,
      summary: 'Execução anterior ainda em andamento; ciclo ignorado para evitar sobreposição.',
      insertedBusinesses: [],
    };
    appendCronLog('WARN', busyReport.summary, busyReport);
    return busyReport;
  }

  isJobRunning = true;
  let currentCfg: ImporterConfigRecord = { ...DEFAULT_IMPORTER_CONFIG };

  try {
    appendCronLog('INFO', `Iniciando busca automática de ${TARGET_BATCH_COUNT} empresas em Alagoinhas - BA...`, {
      trigger,
      cronExpression: CRON_EXPRESSION,
      planId: DEFAULT_PLAN_ID,
      draftStatus: 'pending',
    });

    if (!isDatabaseConfigured()) {
      const msg =
        'Banco de dados MySQL não configurado (DB_HOST / MYSQL_HOST ausente no ambiente). Não foi possível salvar rascunhos.';
      const report: CronExecutionReport = {
        timestamp: nowIso,
        timestampBahia: nowBahia,
        trigger,
        cityScope: 'Alagoinhas - BA',
        planId: DEFAULT_PLAN_ID,
        draftStatus: 'pending',
        targetCount: TARGET_BATCH_COUNT,
        status: 'error',
        durationMs: Date.now() - startedAt,
        queriesExecuted: 0,
        foundCount: 0,
        insertedCount: 0,
        skippedDuplicates: 0,
        quotaExceeded: false,
        nextCursor: currentCfg.nextQueryCursor,
        nextScheduledRunAt,
        summary: msg,
        error: msg,
        insertedBusinesses: [],
      };
      appendCronLog('ERROR', msg, report);
      return report;
    }

    const apiKey = resolveGoogleMapsApiKey();
    if (!apiKey) {
      const msg =
        'Chave GOOGLE_MAPS_API_KEY não configurada no ambiente. Defina GOOGLE_MAPS_API_KEY antes de executar a importação.';
      const report: CronExecutionReport = {
        timestamp: nowIso,
        timestampBahia: nowBahia,
        trigger,
        cityScope: 'Alagoinhas - BA',
        planId: DEFAULT_PLAN_ID,
        draftStatus: 'pending',
        targetCount: TARGET_BATCH_COUNT,
        status: 'error',
        durationMs: Date.now() - startedAt,
        queriesExecuted: 0,
        foundCount: 0,
        insertedCount: 0,
        skippedDuplicates: 0,
        quotaExceeded: false,
        nextCursor: currentCfg.nextQueryCursor,
        nextScheduledRunAt,
        summary: msg,
        error: msg,
        insertedBusinesses: [],
      };
      try {
        const schemaOk = await ensureDatabaseSchema();
        if (schemaOk) {
          const dbCfg = await getSettingFromDb<Partial<ImporterConfigRecord>>(CONFIG_KEY);
          currentCfg = { ...DEFAULT_IMPORTER_CONFIG, ...(dbCfg || {}) };
          await upsertSetting(CONFIG_KEY, {
            ...currentCfg,
            lastRunAt: nowIso,
            nextRunAt: nextScheduledRunAt,
            lastRunSummary: msg,
            lastError: msg,
          });
        }
      } catch (cfgErr) {
        if (isTransientConnectionError(cfgErr)) {
          await closePool().catch(() => {});
        }
      }
      appendCronLog('ERROR', msg, report);
      return report;
    }

    const schemaOk = await ensureDatabaseSchema();
    if (!schemaOk) {
      throw new Error(
        'Não foi possível conectar ou inicializar o schema do banco de dados MySQL.'
      );
    }

    const dbCfg = await getSettingFromDb<Partial<ImporterConfigRecord>>(CONFIG_KEY);
    currentCfg = { ...DEFAULT_IMPORTER_CONFIG, ...(dbCfg || {}) };

    const existingData = await getExistingDraftPlaceIdsAndBusinessNamesFromDb();
    const existingPlaceIds = new Set<string>(existingData.placeIds);
    const existingSignatures = new Set<string>(
      existingData.businesses.map((b) => normalizeBusinessSignature(b.name, b.phone))
    );

    const categories: DirectoryCategoryTarget[] = existingData.categories;
    const cities: DirectoryCityTarget[] = existingData.cities;

    const batchResult = await runGoogleMapsImportBatch({
      targetCount: TARGET_BATCH_COUNT,
      startCursor: currentCfg.nextQueryCursor || 0,
      existingPlaceIds,
      existingSignatures,
      categories,
      cities,
      onlyAlagoinhas: true,
    });

    const normalizedDrafts: DbGoogleMapsBusinessDraft[] = batchResult.addedDrafts.map((draft) => ({
      ...draft,
      planId: DEFAULT_PLAN_ID,
      status: 'pending',
    }));

    let insertedCount = 0;
    if (normalizedDrafts.length > 0) {
      insertedCount = await insertBusinessDraftsInDb(normalizedDrafts);
    }

    const updatedCfg: ImporterConfigRecord = {
      ...currentCfg,
      enabled: true,
      intervalMinutes: 30,
      batchSize: TARGET_BATCH_COUNT,
      nextQueryCursor: batchResult.nextCursor,
      totalImportedCount: (currentCfg.totalImportedCount || 0) + insertedCount,
      lastRunAt: new Date().toISOString(),
      nextRunAt: nextScheduledRunAt,
      lastRunSummary: batchResult.summary,
      ...(batchResult.error ? { lastError: batchResult.error } : { lastError: undefined }),
    };

    await upsertSetting(CONFIG_KEY, updatedCfg);

    const status: CronExecutionReport['status'] = batchResult.error && insertedCount === 0
      ? 'error'
      : insertedCount > 0
      ? 'success'
      : 'no_new_places';

    const report: CronExecutionReport = {
      timestamp: updatedCfg.lastRunAt || nowIso,
      timestampBahia: formatBahiaTimestamp(),
      trigger,
      cityScope: 'Alagoinhas - BA',
      planId: DEFAULT_PLAN_ID,
      draftStatus: 'pending',
      targetCount: TARGET_BATCH_COUNT,
      status,
      durationMs: Date.now() - startedAt,
      queriesExecuted: batchResult.queriesExecuted,
      foundCount: normalizedDrafts.length,
      insertedCount,
      skippedDuplicates: batchResult.skippedDuplicates,
      quotaExceeded: batchResult.quotaExceeded,
      nextCursor: batchResult.nextCursor,
      nextScheduledRunAt,
      summary: batchResult.summary,
      ...(batchResult.error ? { error: batchResult.error } : {}),
      insertedBusinesses: normalizedDrafts.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.categoryName || d.categoryId,
        neighborhood: d.neighborhood,
        city: d.cityName,
        planId: d.planId || DEFAULT_PLAN_ID,
        status: d.status,
        ...(d.photoUrl ? { photoUrl: d.photoUrl } : {}),
      })),
    };

    appendCronLog(
      status === 'error' ? 'ERROR' : status === 'no_new_places' ? 'WARN' : 'INFO',
      `Operação concluída (${insertedCount} rascunho(s) salvo(s) no plano gratuito '${DEFAULT_PLAN_ID}'): ${batchResult.summary}`,
      report
    );

    return report;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (isTransientConnectionError(err)) {
      await closePool().catch(() => {});
    }

    const report: CronExecutionReport = {
      timestamp: new Date().toISOString(),
      timestampBahia: formatBahiaTimestamp(),
      trigger,
      cityScope: 'Alagoinhas - BA',
      planId: DEFAULT_PLAN_ID,
      draftStatus: 'pending',
      targetCount: TARGET_BATCH_COUNT,
      status: 'error',
      durationMs: Date.now() - startedAt,
      queriesExecuted: 0,
      foundCount: 0,
      insertedCount: 0,
      skippedDuplicates: 0,
      quotaExceeded: false,
      nextCursor: currentCfg.nextQueryCursor,
      nextScheduledRunAt,
      summary: `Falha na execução do cron: ${errorMsg}`,
      error: errorMsg,
      insertedBusinesses: [],
    };
    appendCronLog('ERROR', report.summary, report);
    return report;
  } finally {
    isJobRunning = false;
  }
}

async function shutdownGracefully(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  appendCronLog('INFO', `Sinal ${signal} recebido. Encerrando cron de importação com segurança...`);
  try {
    if (scheduledTask) {
      await Promise.resolve(scheduledTask.stop());
      scheduledTask = null;
    }
  } catch {
    // Ignore stop errors
  }
  try {
    await closePool();
  } catch {
    // Ignore pool close errors
  }
  process.exit(0);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const runOnce = args.has('--run-once') || args.has('--once');
  const runImmediate = args.has('--now') || args.has('--run-immediate');

  if (!validate(CRON_EXPRESSION)) {
    appendCronLog('ERROR', `Expressão cron inválida: ${CRON_EXPRESSION}`);
    process.exit(1);
  }

  if (runOnce) {
    appendCronLog('INFO', 'Modo --run-once ativado. Executando lote único de 10 empresas em Alagoinhas - BA.');
    const report = await runAlagoinhasDraftImportJob('manual_once');
    await closePool().catch(() => {});
    process.exit(report.status === 'error' && args.has('--strict') ? 1 : 0);
    return;
  }

  appendCronLog('INFO', 'Agendador cron iniciado para Alagoinhas - BA.', {
    cronExpression: CRON_EXPRESSION,
    timezone: CRON_TIMEZONE,
    batchSize: TARGET_BATCH_COUNT,
    planId: DEFAULT_PLAN_ID,
    draftStatus: 'pending',
    logFile: LOG_FILE_PATH,
    nextScheduledRunAt: getNextHalfHourIso(),
  });

  scheduledTask = schedule(
    CRON_EXPRESSION,
    () => {
      void runAlagoinhasDraftImportJob('cron');
    },
    {
      timezone: CRON_TIMEZONE,
      name: 'google-maps-alagoinhas-drafts',
    }
  );

  if (runImmediate) {
    await runAlagoinhasDraftImportJob('startup');
  }

  process.on('SIGINT', () => {
    void shutdownGracefully('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdownGracefully('SIGTERM');
  });
}

void main();
