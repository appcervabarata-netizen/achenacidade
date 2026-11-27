import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  Edit2,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useDirectory } from '../../context/DirectoryContext';
import type {
  GoogleMapsBusinessDraft,
  GoogleMapsDraftsCounts,
  GoogleMapsDraftsPagination,
} from '../../types';
import {
  approveGoogleMapsDraftViaApi,
  deleteGoogleMapsDraftViaApi,
  fetchGoogleMapsDraftPhotoViaApi,
  fetchGoogleMapsDraftsViaApi,
  updateGoogleMapsDraftViaApi,
} from '../../utils/apiSync';
import { ConfirmModal } from '../common/ConfirmModal';

interface AdminGoogleMapsDraftsTabProps {
  onNotify: (message: string) => void;
  onPendingCountChange?: (pendingCount: number) => void;
  onNavigateToImporter?: () => void;
}

const DEFAULT_COUNTS: GoogleMapsDraftsCounts = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

const DEFAULT_PAGINATION: GoogleMapsDraftsPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
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

function buildPageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }
  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export const AdminGoogleMapsDraftsTab: React.FC<AdminGoogleMapsDraftsTabProps> = ({
  onNotify,
  onPendingCountChange,
  onNavigateToImporter,
}) => {
  const { authSession, categories, cities, registerApprovedBusinessesFromDrafts } = useDirectory();
  const token = authSession.token || '';

  const [drafts, setDrafts] = useState<GoogleMapsBusinessDraft[]>([]);
  const [counts, setCounts] = useState<GoogleMapsDraftsCounts>(DEFAULT_COUNTS);
  const [pagination, setPagination] = useState<GoogleMapsDraftsPagination>(DEFAULT_PAGINATION);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyDraftId, setBusyDraftId] = useState<string | null>(null);

  // Edit Modal State
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
    photoUrl: '',
    description: '',
  });
  const [savingAction, setSavingAction] = useState<'save' | 'save_and_approve' | null>(null);
  const [isFetchingPhoto, setIsFetchingPhoto] = useState(false);

  // Delete Confirmation Modal State
  const [draftToDelete, setDraftToDelete] = useState<GoogleMapsBusinessDraft | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadPendingDrafts = useCallback(
    async (targetPage = page, silent = false) => {
      if (!token) {
        setIsLoading(false);
        setLoadError('Sessão administrativa ausente. Faça login novamente.');
        return;
      }
      if (!silent) setIsLoading(true);
      setLoadError(null);

      const res = await fetchGoogleMapsDraftsViaApi(token, {
        status: 'pending',
        page: targetPage,
        pageSize,
        search: debouncedSearch,
        categoryId: categoryFilter,
        city: cityFilter,
      });

      if (!res.success) {
        setLoadError(res.error || 'Não foi possível carregar os rascunhos pendentes.');
        setIsLoading(false);
        return;
      }

      const nextDrafts = res.drafts || [];
      const nextPagination = res.pagination || {
        page: targetPage,
        pageSize,
        totalItems: nextDrafts.length,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };
      const nextCounts = res.counts || DEFAULT_COUNTS;

      setDrafts(nextDrafts);
      setPagination(nextPagination);
      if (nextPagination.page !== page) {
        setPage(nextPagination.page);
      }
      setCounts(nextCounts);
      setAvailableCities(res.availableCities || []);
      onPendingCountChange?.(nextCounts.pending);
      setIsLoading(false);
    },
    [token, page, pageSize, debouncedSearch, categoryFilter, cityFilter, onPendingCountChange]
  );

  useEffect(() => {
    void loadPendingDrafts(page);
  }, [loadPendingDrafts, page]);

  const getCategoryLabel = (draft: GoogleMapsBusinessDraft) =>
    categories.find((c) => c.id === draft.categoryId)?.name ||
    draft.categoryName ||
    'Comércio Local';

  const handleApproveDraft = async (draft: GoogleMapsBusinessDraft) => {
    if (!token || busyDraftId) return;
    setBusyDraftId(draft.id);
    const res = await approveGoogleMapsDraftViaApi(token, draft.id);
    setBusyDraftId(null);

    if (!res.success) {
      onNotify(res.error || 'Falha ao aprovar rascunho.');
      return;
    }

    if (res.business) {
      registerApprovedBusinessesFromDrafts([res.business]);
    }
    onNotify(`"${draft.name}" aprovada e publicada no diretório (Plano Grátis).`);

    const nextPage = drafts.length === 1 && page > 1 ? page - 1 : page;
    await loadPendingDrafts(nextPage, true);
  };

  const handleDeleteConfirmed = async () => {
    if (!token || !draftToDelete || busyDraftId) return;
    const target = draftToDelete;
    setDraftToDelete(null);
    setBusyDraftId(target.id);

    const res = await deleteGoogleMapsDraftViaApi(token, target.id);
    setBusyDraftId(null);

    if (!res.success) {
      onNotify(res.error || 'Não foi possível deletar o rascunho.');
      return;
    }

    onNotify(`Rascunho "${target.name}" deletado permanentemente.`);
    const nextPage = drafts.length === 1 && page > 1 ? page - 1 : page;
    await loadPendingDrafts(nextPage, true);
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
      photoUrl: draft.photoUrl || '',
      description: draft.description || '',
    });
  };

  const handleFetchPhotoForEditingDraft = async () => {
    if (!token || !editingDraft || isFetchingPhoto) return;
    setIsFetchingPhoto(true);
    const res = await fetchGoogleMapsDraftPhotoViaApi(token, editingDraft.id);
    setIsFetchingPhoto(false);
    if (!res.success || !res.draft?.photoUrl) {
      onNotify(res.error || 'Nenhuma foto encontrada no Google Maps para esta empresa.');
      return;
    }
    setEditingDraft(res.draft);
    setEditForm((prev) => ({ ...prev, photoUrl: res.draft?.photoUrl || '' }));
    setDrafts((prev) => prev.map((d) => (d.id === res.draft!.id ? res.draft! : d)));
    onNotify('URL da foto importada do Google Maps e salva no rascunho!');
  };

  const submitEditModal = async (approveAfterSave: boolean) => {
    if (!token || !editingDraft || savingAction) return;
    setSavingAction(approveAfterSave ? 'save_and_approve' : 'save');

    const selectedCat = categories.find((c) => c.id === editForm.categoryId);
    const saveRes = await updateGoogleMapsDraftViaApi(token, editingDraft.id, {
      ...editForm,
      photoUrl: editForm.photoUrl.trim(),
      categoryName: selectedCat?.name || editingDraft.categoryName,
    });

    if (!saveRes.success || !saveRes.draft) {
      setSavingAction(null);
      onNotify(saveRes.error || 'Erro ao salvar alterações do rascunho.');
      return;
    }

    if (approveAfterSave) {
      const approveRes = await approveGoogleMapsDraftViaApi(token, editingDraft.id);
      setSavingAction(null);
      if (!approveRes.success) {
        onNotify(approveRes.error || 'Alterações salvas, mas houve erro ao aprovar.');
        await loadPendingDrafts(page, true);
        return;
      }
      if (approveRes.business) {
        registerApprovedBusinessesFromDrafts([approveRes.business]);
      }
      setEditingDraft(null);
      onNotify(`"${saveRes.draft.name}" atualizada, aprovada e publicada no Plano Grátis!`);
      const nextPage = drafts.length === 1 && page > 1 ? page - 1 : page;
      await loadPendingDrafts(nextPage, true);
      return;
    }

    setSavingAction(null);
    setEditingDraft(null);
    onNotify(`Rascunho "${saveRes.draft.name}" atualizado!`);
    await loadPendingDrafts(page, true);
  };

  const hasActiveFilters = Boolean(
    debouncedSearch || categoryFilter !== 'all' || cityFilter !== 'all'
  );

  const rangeStart =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.totalItems, pagination.page * pagination.pageSize);
  const pageButtons = useMemo(
    () => buildPageWindow(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

  return (
    <div className="space-y-6">
      {/* Header & Summary Strip */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                <Compass className="w-4 h-4 shrink-0" />
                Curadoria de Rascunhos
              </span>
              <span aria-hidden="true">·</span>
              <span>Google Maps Platform</span>
              <span aria-hidden="true">·</span>
              <span>Somente entradas pendentes</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display">
              Rascunhos Pendentes do Google Maps
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Lista paginada de todas as empresas importadas automaticamente que ainda estão em rascunho. Aprove para publicar no Plano Grátis, edite os dados ou delete cada entrada individualmente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onNavigateToImporter && (
              <button
                type="button"
                onClick={onNavigateToImporter}
                className="px-4 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Abrir Importador Maps</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void loadPendingDrafts(page)}
              className="px-4 min-h-[40px] rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar Lista</span>
            </button>
          </div>
        </div>

        {/* Tabular KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="pt-3 pr-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Rascunhos Pendentes
            </span>
            <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {counts.pending}
            </div>
            <span className="text-[11px] text-slate-500">Na fila de revisão</span>
          </div>

          <div className="pt-3 pr-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Já Publicadas
            </span>
            <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {counts.approved}
            </div>
            <span className="text-[11px] text-slate-500">Ativas no Plano Grátis</span>
          </div>

          <div className="pt-3 pr-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Exibindo Nesta Página
            </span>
            <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {pagination.totalItems === 0 ? '0' : `${rangeStart}–${rangeEnd}`}
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums">
              de {pagination.totalItems} filtrada(s)
            </span>
          </div>

          <div className="pt-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Página Atual
            </span>
            <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-blue-600 dark:text-blue-400">
              {pagination.page} / {pagination.totalPages}
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {pagination.pageSize} entradas por página
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Page Size Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex items-center flex-1 lg:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar empresa, endereço, bairro ou telefone..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">Todas categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">Todas cidades / localidades</option>
            {availableCities.map((cityLabel) => (
              <option key={cityLabel} value={cityLabel}>
                {cityLabel}
              </option>
            ))}
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) || 10);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200 cursor-pointer"
            aria-label="Itens por página"
          >
            <option value={10}>10 / página</option>
            <option value={20}>20 / página</option>
            <option value={30}>30 / página</option>
            <option value={50}>50 / página</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
                setCategoryFilter('all');
                setCityFilter('all');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {isLoading ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
          {Array.from({ length: Math.min(pageSize, 6) }).map((_, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-60 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-80 bg-slate-100 dark:bg-slate-800/70 rounded" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadPendingDrafts(page)}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      ) : drafts.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {hasActiveFilters
              ? 'Nenhum rascunho pendente corresponde aos filtros'
              : 'Nenhum rascunho pendente do Google Maps'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Ajuste o texto buscado, categoria ou cidade para visualizar outros rascunhos.'
              : 'Todas as empresas importadas já foram revisadas ou nenhuma busca foi executada ainda.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
                  setCategoryFilter('all');
                  setCityFilter('all');
                  setPage(1);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Limpar Filtros
              </button>
            ) : (
              onNavigateToImporter && (
                <button
                  type="button"
                  onClick={onNavigateToImporter}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Ir para Importador Google Maps
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="hidden lg:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Empresa & Endereço</th>
                    <th className="py-3 px-4">Categoria & Região</th>
                    <th className="py-3 px-4">Contato & Google</th>
                    <th className="py-3 px-4 text-right">Ações Individuais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {drafts.map((draft) => {
                    const isBusy = busyDraftId === draft.id;
                    return (
                      <tr
                        key={draft.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 align-top max-w-md">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {draft.photoUrl ? (
                                <img
                                  src={draft.photoUrl}
                                  alt={draft.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                {draft.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                  {draft.address || `${draft.neighborhood}, ${draft.cityName}`}
                                </span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="text-amber-700 dark:text-amber-400 font-semibold">
                                  Rascunho
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className={draft.photoUrl ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                                  {draft.photoUrl ? 'Com foto URL' : 'Sem foto'}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {formatDateTimePt(draft.createdAt)}
                                </span>
                                {draft.googleMapsUri && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <a
                                      href={draft.googleMapsUri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                    >
                                      <span>Ver no Maps</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </>
                                )}
                                {draft.photoUrl && draft.photoAttributionName && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    {draft.photoAttributionUri ? (
                                      <a
                                        href={draft.photoAttributionUri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                      >
                                        Foto: {draft.photoAttributionName}
                                      </a>
                                    ) : (
                                      <span>Foto: {draft.photoAttributionName}</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {getCategoryLabel(draft)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {draft.neighborhood || 'Centro'} · {draft.cityName}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {draft.phone || 'Sem telefone'}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {draft.whatsapp && (
                              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                                WhatsApp ativo
                              </span>
                            )}
                            {draft.whatsapp && typeof draft.rating === 'number' && (
                              <span aria-hidden="true">·</span>
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
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-middle text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleApproveDraft(draft)}
                              className="px-3 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Aprovar</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => openEditModal(draft)}
                              className="px-3 min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setDraftToDelete(draft)}
                              className="px-3 min-h-[38px] rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Deletar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Flat Card List */}
          <div className="lg:hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {drafts.map((draft) => {
              const isBusy = busyDraftId === draft.id;
              return (
                <div key={draft.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {draft.photoUrl ? (
                        <img
                          src={draft.photoUrl}
                          alt={draft.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {draft.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          Rascunho
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{getCategoryLabel(draft)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatDateTimePt(draft.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span>
                        {draft.neighborhood} · {draft.cityName}
                        {draft.address ? ` — ${draft.address}` : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {draft.phone && (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Phone className="w-3 h-3 text-blue-600" />
                          {draft.phone}
                        </span>
                      )}
                      {typeof draft.rating === 'number' && (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-amber-600 font-semibold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {draft.rating.toFixed(1)}
                        </span>
                      )}
                      {draft.googleMapsUri && (
                        <a
                          href={draft.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          <span>Ver no Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleApproveDraft(draft)}
                      className="min-h-[44px] px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Aprovar</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => openEditModal(draft)}
                      className="min-h-[44px] px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setDraftToDelete(draft)}
                      className="min-h-[44px] px-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Deletar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              Mostrando <strong className="text-slate-900 dark:text-white">{rangeStart}–{rangeEnd}</strong>{' '}
              de <strong className="text-slate-900 dark:text-white">{pagination.totalItems}</strong>{' '}
              rascunho(s)
            </div>

            <nav
              aria-label="Paginação de rascunhos"
              className="flex flex-wrap items-center justify-center gap-1.5"
            >
              <button
                type="button"
                disabled={!pagination.hasPreviousPage || isLoading}
                onClick={() => setPage(1)}
                className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                aria-label="Primeira página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={!pagination.hasPreviousPage || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {pageButtons.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-xs font-mono text-slate-400 select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setPage(item)}
                    aria-current={item === pagination.page ? 'page' : undefined}
                    className={`min-h-[40px] min-w-[40px] px-3 rounded-xl text-xs font-mono tabular-nums font-bold transition cursor-pointer shrink-0 ${
                      item === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={!pagination.hasNextPage || isLoading}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={!pagination.hasNextPage || isLoading}
                onClick={() => setPage(pagination.totalPages)}
                className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                aria-label="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Edit Draft Modal */}
      {editingDraft && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !savingAction && setEditingDraft(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitEditModal(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Editar Rascunho do Google Maps
                </h4>
                <p className="text-xs text-slate-500">
                  Atualize os dados da empresa ou salve e aprove diretamente para o Plano Grátis.
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={() => setEditingDraft(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Fechar modal de edição"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    URL da Foto / Logo (Link da Imagem)
                  </label>
                  <button
                    type="button"
                    disabled={isFetchingPhoto || Boolean(savingAction)}
                    onClick={() => void handleFetchPhotoForEditingDraft()}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isFetchingPhoto ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    <span>{isFetchingPhoto ? 'Buscando foto...' : 'Buscar Foto do Google Maps'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {editForm.photoUrl.trim() ? (
                      <img
                        src={editForm.photoUrl.trim()}
                        alt={editForm.name || 'Preview'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={editForm.photoUrl}
                    onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                    placeholder="https://lh3.googleusercontent.com/... ou link direto da foto"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Horário de Funcionamento
                </label>
                <input
                  type="text"
                  value={editForm.openingHours}
                  onChange={(e) => setEditForm({ ...editForm, openingHours: e.target.value })}
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
                  Descrição Comercial (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Descrição editorial extraída do Google Maps (se houver) ou preenchida manualmente"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={() => setEditingDraft(null)}
                className="px-4 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={Boolean(savingAction)}
                className="px-4 min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {savingAction === 'save' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Salvar Alterações</span>
              </button>
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={() => void submitEditModal(true)}
                className="px-4 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {savingAction === 'save_and_approve' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Salvar e Aprovar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Individual Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(draftToDelete)}
        title="Deletar Rascunho?"
        message={
          draftToDelete
            ? `Tem certeza que deseja excluir permanentemente o rascunho "${draftToDelete.name}" (${draftToDelete.cityName})? Esta ação remove a entrada da fila de rascunhos.`
            : ''
        }
        confirmLabel="Deletar Rascunho"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => void handleDeleteConfirmed()}
        onCancel={() => setDraftToDelete(null)}
      />
    </div>
  );
};
