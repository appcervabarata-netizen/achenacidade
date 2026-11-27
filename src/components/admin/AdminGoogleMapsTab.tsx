import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Edit2,
  ExternalLink,
  Filter,
  Loader2,
  MapPin,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useDirectory } from '../../context/DirectoryContext';
import type { GoogleMapsBusinessDraft, GoogleMapsDraftStatus, GoogleMapsImporterConfig } from '../../types';
import {
  approveGoogleMapsDraftViaApi,
  bulkApproveGoogleMapsDraftsViaApi,
  deleteGoogleMapsDraftViaApi,
  fetchGoogleMapsDraftsViaApi,
  rejectGoogleMapsDraftViaApi,
  runGoogleMapsImportBatchViaApi,
  updateGoogleMapsDraftViaApi,
  updateGoogleMapsSchedulerViaApi,
} from '../../utils/apiSync';

interface AdminGoogleMapsTabProps {
  onNotify: (message: string) => void;
}

const DEFAULT_IMPORTER_CONFIG: GoogleMapsImporterConfig = {
  enabled: true,
  intervalMinutes: 30,
  batchSize: 10,
  initialBatchSize: 50,
  nextQueryCursor: 0,
  totalImportedCount: 0,
};

function formatDateTimePt(iso?: string): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AdminGoogleMapsTab: React.FC<AdminGoogleMapsTabProps> = ({ onNotify }) => {
  const { authSession, categories, cities, registerApprovedBusinessesFromDrafts } = useDirectory();
  const token = authSession.token || '';

  const [drafts, setDrafts] = useState<GoogleMapsBusinessDraft[]>([]);
  const [config, setConfig] = useState<GoogleMapsImporterConfig>(DEFAULT_IMPORTER_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runningBatchCount, setRunningBatchCount] = useState<number | null>(null);
  const [isTogglingScheduler, setIsTogglingScheduler] = useState(false);
  const [busyDraftId, setBusyDraftId] = useState<string | null>(null);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // Filters & selection
  const [statusFilter, setStatusFilter] = useState<'all' | GoogleMapsDraftStatus>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Edit modal state
  const [editingDraft, setEditingDraft] = useState<GoogleMapsBusinessDraft | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    cityId: 'city-1',
    cityName: 'Alagoinhas - BA',
    categoryId: 'cat-1',
    neighborhood: '',
    address: '',
    phone: '',
    whatsapp: '',
    openingHours: '',
    website: '',
    description: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadDraftsAndConfig = async (silent = false) => {
    if (!token) {
      setIsLoading(false);
      setLoadError('Sessão administrativa ausente. Faça login novamente.');
      return;
    }
    if (!silent) setIsLoading(true);
    setLoadError(null);
    const res = await fetchGoogleMapsDraftsViaApi(token);
    if (!res.success) {
      setLoadError(res.error || 'Não foi possível carregar os rascunhos.');
      setIsLoading(false);
      return;
    }
    setDrafts(res.drafts || []);
    if (res.config) setConfig(res.config);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadDraftsAndConfig();
  }, [token]);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const d of drafts) {
      if (d.status === 'pending') pending += 1;
      else if (d.status === 'approved') approved += 1;
      else if (d.status === 'rejected') rejected += 1;
    }
    return { total: drafts.length, pending, approved, rejected };
  }, [drafts]);

  const filteredDrafts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return drafts.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && d.categoryId !== categoryFilter) return false;
      if (q) {
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesNeigh = d.neighborhood.toLowerCase().includes(q);
        const matchesCity = d.cityName.toLowerCase().includes(q);
        const matchesCat = (d.categoryName || '').toLowerCase().includes(q);
        const matchesAddr = d.address.toLowerCase().includes(q);
        if (!matchesName && !matchesNeigh && !matchesCity && !matchesCat && !matchesAddr) {
          return false;
        }
      }
      return true;
    });
  }, [drafts, statusFilter, categoryFilter, searchQuery]);

  const visiblePendingIds = useMemo(
    () => filteredDrafts.filter((d) => d.status === 'pending').map((d) => d.id),
    [filteredDrafts]
  );

  const selectedPendingIds = useMemo(
    () => selectedIds.filter((id) => visiblePendingIds.includes(id)),
    [selectedIds, visiblePendingIds]
  );

  const handleRunBatch = async (count: number) => {
    if (!token || runningBatchCount !== null) return;
    setRunningBatchCount(count);
    const res = await runGoogleMapsImportBatchViaApi(token, count);
    setRunningBatchCount(null);

    if (res.drafts) setDrafts(res.drafts);
    if (res.config) setConfig(res.config);

    if (!res.success && res.error) {
      onNotify(res.error);
      return;
    }
    onNotify(res.summary || `Busca finalizada (${res.addedCount || 0} novos rascunhos).`);
    setStatusFilter('pending');
  };

  const handleToggleScheduler = async () => {
    if (!token || isTogglingScheduler) return;
    setIsTogglingScheduler(true);
    const nextEnabled = !config.enabled;
    const res = await updateGoogleMapsSchedulerViaApi(token, {
      enabled: nextEnabled,
      intervalMinutes: 30,
      batchSize: 10,
    });
    setIsTogglingScheduler(false);
    if (!res.success) {
      onNotify(res.error || 'Erro ao atualizar agendamento automático.');
      return;
    }
    if (res.config) setConfig(res.config);
    onNotify(
      nextEnabled
        ? 'Agendador automático ativado: 10 empresas a cada 30 minutos em Alagoinhas - BA e região.'
        : 'Agendador automático pausado.'
    );
  };

  const handleApproveDraft = async (draft: GoogleMapsBusinessDraft) => {
    if (!token || busyDraftId) return;
    setBusyDraftId(draft.id);
    const res = await approveGoogleMapsDraftViaApi(token, draft.id);
    setBusyDraftId(null);
    if (!res.success) {
      onNotify(res.error || 'Falha ao aprovar empresa.');
      return;
    }
    if (res.draft) {
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? res.draft! : d)));
    }
    if (res.business) {
      registerApprovedBusinessesFromDrafts([res.business]);
    }
    setSelectedIds((prev) => prev.filter((id) => id !== draft.id));
    onNotify(`"${draft.name}" aprovada e publicada no Guia Comercial (Plano Grátis).`);
  };

  const handleBulkApprove = async (targetIds: string[]) => {
    if (!token || targetIds.length === 0 || isBulkApproving) return;
    setIsBulkApproving(true);
    const res = await bulkApproveGoogleMapsDraftsViaApi(token, targetIds);
    setIsBulkApproving(false);
    if (!res.success) {
      onNotify(res.error || 'Falha ao aprovar rascunhos em lote.');
      return;
    }
    if (res.drafts) setDrafts(res.drafts);
    if (res.createdBusinesses && res.createdBusinesses.length > 0) {
      registerApprovedBusinessesFromDrafts(res.createdBusinesses);
    }
    setSelectedIds([]);
    onNotify(`${res.approvedCount || 0} empresa(s) aprovada(s) e publicada(s) no Plano Grátis!`);
  };

  const handleRejectDraft = async (draft: GoogleMapsBusinessDraft) => {
    if (!token || busyDraftId) return;
    setBusyDraftId(draft.id);
    const res = await rejectGoogleMapsDraftViaApi(token, draft.id);
    setBusyDraftId(null);
    if (!res.success) {
      onNotify(res.error || 'Erro ao rejeitar rascunho.');
      return;
    }
    if (res.draft) {
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? res.draft! : d)));
    }
    setSelectedIds((prev) => prev.filter((id) => id !== draft.id));
    onNotify(`"${draft.name}" marcada como rejeitada (não será reimportada).`);
  };

  const handleDeleteDraft = async (draft: GoogleMapsBusinessDraft) => {
    if (!token || busyDraftId) return;
    setBusyDraftId(draft.id);
    const res = await deleteGoogleMapsDraftViaApi(token, draft.id);
    setBusyDraftId(null);
    if (!res.success) {
      onNotify(res.error || 'Erro ao excluir rascunho.');
      return;
    }
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    setSelectedIds((prev) => prev.filter((id) => id !== draft.id));
    onNotify(`Rascunho "${draft.name}" removido.`);
  };

  const openEditModal = (draft: GoogleMapsBusinessDraft) => {
    setEditingDraft(draft);
    setEditForm({
      name: draft.name,
      cityId: draft.cityId || 'city-1',
      cityName: draft.cityName || 'Alagoinhas - BA',
      categoryId: draft.categoryId || 'cat-1',
      neighborhood: draft.neighborhood || '',
      address: draft.address || '',
      phone: draft.phone || '',
      whatsapp: draft.whatsapp || '',
      openingHours: draft.openingHours || '',
      website: draft.website || '',
      description: draft.description || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingDraft) return;
    setIsSavingEdit(true);
    const selectedCat = categories.find((c) => c.id === editForm.categoryId);
    const res = await updateGoogleMapsDraftViaApi(token, editingDraft.id, {
      ...editForm,
      categoryName: selectedCat?.name || editingDraft.categoryName,
    });
    setIsSavingEdit(false);
    if (!res.success || !res.draft) {
      onNotify(res.error || 'Não foi possível salvar as alterações.');
      return;
    }
    setDrafts((prev) => prev.map((d) => (d.id === editingDraft.id ? res.draft! : d)));
    setEditingDraft(null);
    onNotify(`Rascunho "${res.draft.name}" atualizado!`);
  };

  const toggleSelectAllVisible = () => {
    if (visiblePendingIds.length === 0) return;
    const allSelected = visiblePendingIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visiblePendingIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visiblePendingIds])));
    }
  };

  const getCategoryLabel = (draft: GoogleMapsBusinessDraft) => {
    return (
      categories.find((c) => c.id === draft.categoryId)?.name ||
      draft.categoryName ||
      'Comércio Local'
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                <Compass className="w-4 h-4 shrink-0" />
                Google Maps Places API (New)
              </span>
              <span aria-hidden="true">·</span>
              <span>Alagoinhas - BA e região próxima</span>
              <span aria-hidden="true">·</span>
              <span>Publicação inicial: Plano Grátis</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display">
              Captação Automática e Fila de Aprovação
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              As empresas localizadas entram primeiro como rascunho. Nada é publicado sem sua aprovação e estabelecimentos duplicados ou rejeitados são ignorados nas buscas seguintes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={runningBatchCount !== null}
              onClick={() => void handleRunBatch(50)}
              className="px-4 min-h-[42px] rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              {runningBatchCount === 50 ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0" />
              )}
              <span>
                {runningBatchCount === 50 ? 'Buscando 50 empresas...' : 'Carga Inicial (50 Empresas)'}
              </span>
            </button>

            <button
              type="button"
              disabled={runningBatchCount !== null}
              onClick={() => void handleRunBatch(10)}
              className="px-4 min-h-[42px] rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              {runningBatchCount === 10 ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{runningBatchCount === 10 ? 'Buscando +10...' : 'Buscar +10 Agora'}</span>
            </button>

            <button
              type="button"
              disabled={isTogglingScheduler}
              onClick={() => void handleToggleScheduler()}
              className={`px-3.5 min-h-[42px] rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                config.enabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {config.enabled ? (
                <Pause className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{config.enabled ? 'Auto 30min: Ativo' : 'Auto 30min: Pausado'}</span>
            </button>

            <button
              type="button"
              onClick={() => void loadDraftsAndConfig()}
              className="p-2.5 min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Atualizar fila de rascunhos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Single-Elevation KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Pendentes de Revisão
            </span>
            <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {counts.pending}
            </div>
            <span className="text-[11px] text-slate-500">Aguardando aprovação</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Aprovadas (Plano Grátis)
            </span>
            <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {counts.approved}
            </div>
            <span className="text-[11px] text-slate-500">Publicadas no diretório</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Total Importado
            </span>
            <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {config.totalImportedCount || counts.total}
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {counts.rejected} descartada(s)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Agendamento (10 / 30 min)
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              {config.enabled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ativo · a cada {config.intervalMinutes} min</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Pausado</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums block mt-0.5">
              {config.enabled && config.nextRunAt
                ? `Próxima: ${formatDateTimePt(config.nextRunAt)}`
                : `Última: ${formatDateTimePt(config.lastRunAt)}`}
            </span>
          </div>
        </div>

        {/* Status / Diagnostic Callout */}
        {config.hasApiKey === false && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Chave da API do Google Maps não detectada nas variáveis de ambiente.</strong>{' '}
              Configure <code className="font-mono">GOOGLE_MAPS_API_KEY</code> no ambiente ou reinicie o servidor para iniciar as buscas reais em Alagoinhas - BA.
            </div>
          </div>
        )}

        {(config.lastRunSummary || config.lastError) && (
          <div
            className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
              config.lastError
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
            }`}
          >
            <span>
              <strong>Última varredura ({formatDateTimePt(config.lastRunAt)}):</strong>{' '}
              {config.lastError || config.lastRunSummary}
            </span>
          </div>
        )}
      </div>

      {/* Filters & Bulk Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'pending', label: 'Pendentes', count: counts.pending },
              { id: 'approved', label: 'Aprovadas', count: counts.approved },
              { id: 'rejected', label: 'Rejeitadas', count: counts.rejected },
              { id: 'all', label: 'Todas', count: counts.total },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 lg:justify-end">
          <div className="relative flex items-center min-w-[200px] flex-1 lg:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa, bairro ou cidade..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">Todas categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Approval Bar */}
      {visiblePendingIds.length > 0 && (
        <div className="px-4 py-3 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={
                visiblePendingIds.length > 0 &&
                visiblePendingIds.every((id) => selectedIds.includes(id))
              }
              onChange={toggleSelectAllVisible}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span>
              Selecionar todas visíveis ({visiblePendingIds.length})
              {selectedPendingIds.length > 0 ? ` · ${selectedPendingIds.length} selecionada(s)` : ''}
            </span>
          </label>

          <div className="flex items-center gap-2">
            {selectedPendingIds.length > 0 && (
              <button
                type="button"
                disabled={isBulkApproving}
                onClick={() => void handleBulkApprove(selectedPendingIds)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                {isBulkApproving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Aprovar Selecionadas ({selectedPendingIds.length})</span>
              </button>
            )}

            <button
              type="button"
              disabled={isBulkApproving}
              onClick={() => void handleBulkApprove(visiblePendingIds)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprovar Todas ({visiblePendingIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* States: Loading / Error / Empty / Populated */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-2.5"
            >
              <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-80 bg-slate-100 dark:bg-slate-800/70 rounded" />
              <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800/70 rounded" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadDraftsAndConfig()}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {drafts.length === 0
              ? 'Nenhuma empresa importada ainda'
              : 'Nenhum rascunho corresponde aos filtros selecionados'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {drafts.length === 0
              ? 'Clique em "Carga Inicial (50 Empresas)" acima para buscar estabelecimentos reais em Alagoinhas - BA e região próxima.'
              : 'Altere a aba de status, limpe a busca ou execute uma nova varredura.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {drafts.length === 0 ? (
              <button
                type="button"
                disabled={runningBatchCount !== null}
                onClick={() => void handleRunBatch(50)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Iniciar Carga de 50 Empresas
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDrafts.map((draft) => {
            const isSelected = selectedIds.includes(draft.id);
            const isBusy = busyDraftId === draft.id;

            return (
              <div
                key={draft.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {draft.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(draft.id)
                            ? prev.filter((id) => id !== draft.id)
                            : [...prev, draft.id]
                        )
                      }
                      className="mt-1 w-4 h-4 rounded accent-blue-600 shrink-0 cursor-pointer"
                    />
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {draft.name}
                      </h4>

                      {draft.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" /> Rascunho Pendente
                        </span>
                      ) : draft.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Publicada (Plano Grátis)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3" /> Rejeitada
                        </span>
                      )}

                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {getCategoryLabel(draft)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        {draft.neighborhood} · {draft.cityName}
                      </span>
                      {draft.address && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-md">{draft.address}</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {draft.phone && (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Phone className="w-3 h-3 text-blue-600" />
                          {draft.phone}
                          {draft.whatsapp ? ' (WhatsApp)' : ''}
                        </span>
                      )}
                      {typeof draft.rating === 'number' && (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {draft.rating.toFixed(1)}
                          {typeof draft.userRatingCount === 'number'
                            ? ` (${draft.userRatingCount})`
                            : ''}
                        </span>
                      )}
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Fonte: Google Maps
                      </span>
                      {draft.googleMapsUri && (
                        <a
                          href={draft.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          <span>Ver no Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {draft.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => openEditModal(draft)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  )}

                  {draft.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleApproveDraft(draft)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Aprovar (Plano Grátis)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleRejectDraft(draft)}
                        className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>
                    </>
                  )}

                  {draft.status === 'rejected' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleApproveDraft(draft)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Reativar e Aprovar</span>
                    </button>
                  )}

                  {draft.status !== 'pending' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleDeleteDraft(draft)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer shrink-0"
                      title="Remover registro do histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Draft Modal */}
      {editingDraft && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Revisar Rascunho Antes de Aprovar
                </h4>
                <p className="text-xs text-slate-500">
                  Ajuste categoria, bairro ou telefone antes de publicar no Plano Grátis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cidade no Diretório
                </label>
                <select
                  value={editForm.cityId}
                  onChange={(e) => {
                    const c = cities.find((item) => item.id === e.target.value);
                    setEditForm({
                      ...editForm,
                      cityId: e.target.value,
                      cityName: c ? `${c.name} - ${c.state}` : editForm.cityName,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={editForm.neighborhood}
                  onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp (55 + DDD + número)
                </label>
                <input
                  type="text"
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                  placeholder="5575999990000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição Comercial
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
