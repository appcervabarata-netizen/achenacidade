import React, { useEffect, useState } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  UploadCloud,
  Server,
  Table2,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { useDirectory } from '../../context/DirectoryContext';
import { fetchDbDiagnostics, type DatabaseDiagnostics } from '../../utils/apiSync';

interface AdminDatabaseTabProps {
  onNotify?: (message: string, variant?: 'success' | 'error' | 'info') => void;
}

const TABLE_LABELS: Record<string, string> = {
  cities: 'Cidades',
  categories: 'Categorias',
  plans: 'Planos',
  businesses: 'Empresas / Lojas',
  products: 'Produtos',
  services: 'Serviços',
  store_product_categories: 'Categorias das Lojas',
  banners: 'Banners',
  payment_transactions: 'Pagamentos',
  email_logs: 'Logs de E-mail',
  app_settings: 'Configurações Gerais',
};

export const AdminDatabaseTab: React.FC<AdminDatabaseTabProps> = ({ onNotify }) => {
  const {
    dbSyncStatus,
    dbLastError,
    dbLastSyncedAt,
    refreshFromDatabase,
    syncAllToDatabaseNow,
  } = useDirectory();

  const [diagnostics, setDiagnostics] = useState<DatabaseDiagnostics | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    checked: boolean;
    ok: boolean;
    detail: string;
  }>({ checked: false, ok: false, detail: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [confirmPush, setConfirmPush] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const runDiagnostics = async (showToast = false) => {
    setIsTesting(true);
    try {
      const [diagRes, healthRes] = await Promise.all([
        fetchDbDiagnostics(),
        fetch('/api/health', { cache: 'no-store', headers: { Accept: 'application/json' } })
          .then(async (r) => {
            const contentType = r.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
              return {
                ok: false,
                detail: `Resposta não-JSON (${contentType || 'desconhecida'}). Limpe o cache / Service Worker do navegador.`,
              };
            }
            const json = (await r.json()) as { status?: string; database?: string; databaseError?: string };
            return {
              ok: r.ok && json.status === 'ok',
              detail:
                json.database === 'connected'
                  ? 'API /api/health respondendo JSON e MySQL conectado.'
                  : json.database === 'error'
                  ? `API /api/health ativa, mas MySQL retornou erro: ${json.databaseError || 'falha de conexão'}`
                  : 'API /api/health respondendo JSON (banco não configurado nas variáveis).',
            };
          })
          .catch((err) => ({
            ok: false,
            detail: err instanceof Error ? err.message : 'Erro ao consultar /api/health',
          })),
      ]);

      setDiagnostics(diagRes);
      setHealthStatus({ checked: true, ok: healthRes.ok, detail: healthRes.detail });

      if (showToast) {
        if (diagRes.connected) {
          const msg = `Conexão MySQL validada (${diagRes.database || 'banco'} · v${diagRes.version || '?'})!`;
          setActionMessage({ type: 'success', text: msg });
          onNotify?.(msg, 'success');
        } else if (!diagRes.configured) {
          const msg = 'Variáveis do MySQL ainda não estão configuradas no container.';
          setActionMessage({ type: 'info', text: msg });
          onNotify?.(msg, 'info');
        } else {
          const msg = `Falha na conexão MySQL: ${diagRes.error || 'verifique host, usuário e senha.'}`;
          setActionMessage({ type: 'error', text: msg });
          onNotify?.(msg, 'error');
        }
      }
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    void runDiagnostics(false);
  }, []);

  const handleReloadFromDb = async () => {
    setIsReloading(true);
    setActionMessage(null);
    const res = await refreshFromDatabase();
    await runDiagnostics(false);
    setIsReloading(false);

    if (res.success) {
      const msg = 'Dados recarregados diretamente do banco MySQL!';
      setActionMessage({ type: 'success', text: msg });
      onNotify?.(msg, 'success');
    } else {
      const msg = res.error || 'Não foi possível recarregar do MySQL.';
      setActionMessage({ type: 'error', text: msg });
      onNotify?.(msg, 'error');
    }
  };

  const handlePushLocalToDb = async () => {
    setConfirmPush(false);
    setIsPushing(true);
    setActionMessage(null);
    const res = await syncAllToDatabaseNow();
    await runDiagnostics(false);
    setIsPushing(false);

    if (res.success) {
      const msg = 'Todos os dados atuais do navegador foram gravados nas tabelas do MySQL!';
      setActionMessage({ type: 'success', text: msg });
      onNotify?.(msg, 'success');
    } else {
      const msg = res.error || 'Falha ao enviar dados atuais para o MySQL.';
      setActionMessage({ type: 'error', text: msg });
      onNotify?.(msg, 'error');
    }
  };

  const isConnected = Boolean(diagnostics?.connected);
  const isConfigured = Boolean(diagnostics?.configured);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300 mb-1">
            <Database className="w-4 h-4" />
            <span>Diagnóstico & Persistência MySQL / MariaDB</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black font-display">
            Conexão em Tempo Real com o Banco de Dados
          </h3>
          <p className="text-xs text-blue-100/90 max-w-2xl mt-1">
            Cada cadastro, edição e exclusão no painel ou nas lojas envia requisições individuais (POST, PUT e DELETE) direto para o MySQL do servidor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void runDiagnostics(true)}
            disabled={isTesting}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-md hover:bg-blue-50 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testando...' : 'Testar Conexão Agora'}</span>
          </button>
        </div>
      </div>

      {/* Inline feedback */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-start gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : actionMessage.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Connection Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status do MySQL
            </span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Conectado
              </span>
            ) : !isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
                <HardDrive className="w-3.5 h-3.5" />
                Modo Local
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Erro de Conexão
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-900 dark:text-white">Host:</strong>{' '}
              <span className="font-mono">{diagnostics?.host || 'Não definido'}</span>
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Porta / Banco:</strong>{' '}
              <span className="font-mono">
                {diagnostics?.port || '3306'} / {diagnostics?.database || 'Não definido'}
              </span>
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Usuário:</strong>{' '}
              <span className="font-mono">{diagnostics?.user || 'Não definido'}</span>
            </p>
            {diagnostics?.version && (
              <p>
                <strong className="text-slate-900 dark:text-white">Versão:</strong>{' '}
                <span className="font-mono">{diagnostics.version}</span>
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Sync State */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sincronização do App
            </span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-900 dark:text-white">Estado atual:</strong>{' '}
              {dbSyncStatus === 'connected' && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Gravando em tempo real no MySQL
                </span>
              )}
              {dbSyncStatus === 'checking' && (
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  Verificando servidor...
                </span>
              )}
              {dbSyncStatus === 'local_only' && (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  Somente localStorage (sem BD no servidor)
                </span>
              )}
              {dbSyncStatus === 'error' && (
                <span className="text-red-600 dark:text-red-400 font-bold">
                  Erro na última gravação
                </span>
              )}
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Carga inicial (Seed):</strong>{' '}
              {diagnostics?.seeded ? 'Concluída' : 'Aguardando criação/carga'}
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Última gravação confirmada:</strong>{' '}
              {dbLastSyncedAt || 'Ainda nesta sessão'}
            </p>
          </div>
        </div>

        {/* Card 3: API Health */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rota /api/health
            </span>
            <Server className={`w-4 h-4 ${healthStatus.ok ? 'text-emerald-600' : 'text-amber-500'}`} />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {healthStatus.checked
              ? healthStatus.detail
              : 'Verificando resposta JSON de /api/health...'}
          </p>

          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>Abrir /api/health em nova aba</span>
          </a>
        </div>
      </div>

      {/* Diagnostic Errors if any */}
      {(diagnostics?.error || dbLastError) && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-2">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Detalhe do Erro Retornado pelo MySQL / API</span>
          </div>
          <p className="text-xs font-mono text-red-800 dark:text-red-200 bg-white/80 dark:bg-slate-950/60 p-3 rounded-xl border border-red-200/70 dark:border-red-900 break-all">
            {dbLastError || diagnostics?.error}
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">
            Dica: Se você criou o banco pelo phpMyAdmin no CapRover, confirme se o{' '}
            <code className="font-mono font-bold">DB_HOST</code> é o mesmo nome de serviço usado no{' '}
            <code className="font-mono font-bold">PMA_HOST</code> (ex: <code className="font-mono">srv-captain--mysql-db</code>), e se o usuário do banco tem permissão de acesso para host <code className="font-mono font-bold">%</code>.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Ações Manuais de Sincronização
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Use para puxar os dados do MySQL ou enviar o estado atual do navegador caso tenha acabado de conectar o banco.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void handleReloadFromDb()}
            disabled={isReloading || isPushing}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isReloading ? 'animate-spin' : ''}`} />
            <span>{isReloading ? 'Carregando...' : 'Recarregar do MySQL'}</span>
          </button>

          {!confirmPush ? (
            <button
              type="button"
              onClick={() => setConfirmPush(true)}
              disabled={isPushing || isReloading}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Enviar Dados Atuais para o MySQL</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-orange-800 dark:text-orange-200">
                Substituir banco pelos dados atuais?
              </span>
              <button
                type="button"
                onClick={() => void handlePushLocalToDb()}
                className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirmPush(false)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Row Counts */}
      {diagnostics?.counts && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Registros Salvos nas Tabelas do MySQL
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(diagnostics.counts).map(([tableName, total]) => (
              <div
                key={tableName}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
              >
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {TABLE_LABELS[tableName] || tableName}
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                    {total}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate ml-2">
                    {tableName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick CapRover Checklist */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Checklist Rápido CapRover + phpMyAdmin
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-5">
          <li>
            <strong>Variáveis obrigatórias no app CapRover:</strong>{' '}
            <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              DB_HOST
            </code>
            ,{' '}
            <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              DB_PORT=3306
            </code>
            ,{' '}
            <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              DB_NAME
            </code>
            ,{' '}
            <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              DB_USER
            </code>
            ,{' '}
            <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              DB_PASSWORD
            </code>{' '}
            e{' '}
            <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              PORT=3000
            </code>.
          </li>
          <li>
            <strong>Nome do Host (<code className="font-mono">DB_HOST</code>):</strong> use o nome interno do serviço MySQL no CapRover (ex: <code className="font-mono">srv-captain--meu-mysql</code> — o mesmo valor de <code className="font-mono">PMA_HOST</code> do phpMyAdmin, nunca <code className="font-mono">phpmyadmin</code>).
          </li>
          <li>
            <strong>Permissão do usuário no phpMyAdmin:</strong> ao criar o usuário para o aplicativo no phpMyAdmin, selecione Host = <code className="font-mono">%</code> (qualquer host na rede Docker) e conceda todos os privilégios no banco escolhido.
          </li>
          <li>
            <strong>Volume de imagens:</strong> mapeie{' '}
            <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              /app/uploads
            </code>{' '}
            em Persistent Directories no CapRover para preservar logotipos, capas e fotos ao atualizar o app.
          </li>
        </ul>
      </div>
    </div>
  );
};
