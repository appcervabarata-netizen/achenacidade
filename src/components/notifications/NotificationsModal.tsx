import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  X,
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Tag,
  Heart,
  MapPin,
  Trash2,
  CheckCheck,
  Sparkles,
  Key,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    openModal,
    pushPreferences,
    updatePushPreferences,
    pushAlerts,
    unreadAlertsCount,
    markAlertAsRead,
    markAllAlertsAsRead,
    clearPushAlerts,
    swStatus,
    notificationPermission,
    enablePushNotifications,
    disablePushNotifications,
    triggerTestFavoritePush,
    favoriteBusinesses,
    businesses,
    toggleFavoriteBusiness,
  } = useDirectory();

  const [statusFeedback, setStatusFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [showAdvancedVapid, setShowAdvancedVapid] = useState(false);
  const [vapidInput, setVapidInput] = useState(pushPreferences.vapidPublicKey || '');

  if (activeModal.type !== 'notifications') {
    return null;
  }

  const alagoinhasBusinesses = businesses.filter((b) => b.cityId === 'city-1');
  const favoredInAlagoinhas = favoriteBusinesses.filter((b) => b.cityId === 'city-1');

  const handleToggleMasterPush = async () => {
    setStatusFeedback(null);
    if (pushPreferences.enabled) {
      await disablePushNotifications();
      setStatusFeedback({
        text: 'Alertas push pausados neste dispositivo.',
        ok: true,
      });
      return;
    }

    setIsActivating(true);
    const result = await enablePushNotifications();
    setIsActivating(false);
    setStatusFeedback({
      text: result.message,
      ok: result.granted || result.swActive,
    });
  };

  const handleTestPush = async (type: 'service' | 'product') => {
    setStatusFeedback(null);
    if (!pushPreferences.enabled) {
      await enablePushNotifications();
    }
    const res = await triggerTestFavoritePush(type);
    setStatusFeedback({
      text: res.sentViaSW
        ? `Notificação de ${type === 'service' ? 'novo serviço' : 'nova oferta'} disparada via Service Worker!`
        : 'Alerta registrado na Central (permissão nativa do navegador indisponível neste ambiente).',
      ok: true,
    });
  };

  const handleOpenAlertTarget = (alertId: string, itemType: 'product' | 'service', itemId: string, businessId: string) => {
    markAlertAsRead(alertId);
    if (itemType === 'product' && itemId) {
      openModal('product_detail', itemId);
    } else if (itemType === 'service' && itemId) {
      openModal('service_detail', itemId);
    } else if (businessId) {
      openModal('business_detail', businessId);
    }
  };

  const getPermissionLabel = () => {
    if (notificationPermission === 'granted') return 'Permissão concedida';
    if (notificationPermission === 'denied') return 'Bloqueada no navegador';
    if (notificationPermission === 'unsupported') return 'Modo interno ativo';
    return 'Aguardando autorização';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${pushPreferences.enabled ? 'bg-blue-600' : 'bg-slate-700'}`}>
              {pushPreferences.enabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display">
                  Alertas Push — Alagoinhas
                </h2>
                {unreadAlertsCount > 0 && (
                  <span className="text-[11px] font-extrabold bg-orange-600 text-white px-2 py-0.5 rounded-full font-mono tabular-nums">
                    {unreadAlertsCount} {unreadAlertsCount === 1 ? 'novo' : 'novos'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Notificações via Service Worker para serviços e ofertas das suas lojas favoritas
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Status & Activation Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 font-bold ${
                      pushPreferences.enabled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pushPreferences.enabled ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {pushPreferences.enabled ? 'Alertas Push Ativos' : 'Alertas Push Desativados'}
                  </span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    SW: {swStatus === 'active' ? 'Registrado' : swStatus === 'checking' ? 'Verificando...' : 'Fallback local'}
                  </span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-slate-500 dark:text-slate-400">{getPermissionLabel()}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Receba avisos no navegador ou celular assim que suas empresas favoritas em Alagoinhas lançarem uma nova oferta ou serviço.
                </p>
              </div>

              <button
                onClick={handleToggleMasterPush}
                disabled={isActivating}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer ${
                  pushPreferences.enabled
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {pushPreferences.enabled ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>Pausar Push</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    <span>{isActivating ? 'Ativando...' : 'Ativar Notificações Push'}</span>
                  </>
                )}
              </button>
            </div>

            {statusFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  statusFeedback.ok
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
                }`}
              >
                {statusFeedback.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                )}
                <span>{statusFeedback.text}</span>
              </div>
            )}

            {/* Preferences Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Novos Serviços
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pushPreferences.notifyNewServices}
                  onChange={(e) => updatePushPreferences({ notifyNewServices: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Novas Ofertas & Produtos
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pushPreferences.notifyNewOffers}
                  onChange={(e) => updatePushPreferences({ notifyNewOffers: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Apenas Empresas Favoritas
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pushPreferences.favoritesOnly}
                  onChange={(e) => updatePushPreferences({ favoritesOnly: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Somente Alagoinhas - BA
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pushPreferences.cityScope === 'alagoinhas_only'}
                  onChange={(e) =>
                    updatePushPreferences({
                      cityScope: e.target.checked ? 'alagoinhas_only' : 'all_cities',
                    })
                  }
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Monitored Favorite Businesses in Alagoinhas */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Lojas Favoritas Monitoradas em Alagoinhas ({favoredInAlagoinhas.length})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {favoredInAlagoinhas.length > 0
                    ? 'Você receberá push automático quando essas empresas publicarem novidades.'
                    : 'Marque suas empresas preferidas de Alagoinhas abaixo para acompanhar novos serviços e ofertas.'}
                </p>
              </div>
            </div>

            {alagoinhasBusinesses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {alagoinhasBusinesses.slice(0, 6).map((biz) => {
                  const isFav = favoredInAlagoinhas.some((f) => f.id === biz.id);
                  return (
                    <button
                      key={biz.id}
                      onClick={() => toggleFavoriteBusiness(biz.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        isFav
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}`} />
                      <span>{biz.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Instant Service Worker Test Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Testar disparo real via Service Worker:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestPush('service')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition cursor-pointer"
                >
                  Simular Novo Serviço
                </button>
                <button
                  onClick={() => handleTestPush('product')}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold transition cursor-pointer"
                >
                  Simular Nova Oferta
                </button>
              </div>
            </div>
          </div>

          {/* Alerts History List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Histórico de Alertas Recebidos ({pushAlerts.length})
              </h3>
              {pushAlerts.length > 0 && (
                <div className="flex items-center gap-2">
                  {unreadAlertsCount > 0 && (
                    <button
                      onClick={markAllAlertsAsRead}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar lidas</span>
                    </button>
                  )}
                  <button
                    onClick={clearPushAlerts}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                </div>
              )}
            </div>

            {pushAlerts.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <Bell className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum alerta recebido ainda
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Ative os alertas acima ou clique em um dos botões de simulação para visualizar a notificação push em ação.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pushAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() =>
                      handleOpenAlertTarget(alert.id, alert.itemType, alert.itemId, alert.businessId)
                    }
                    className={`p-3.5 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                      alert.read
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        alert.itemType === 'service'
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300'
                      }`}
                    >
                      {alert.itemType === 'service' ? (
                        <Wrench className="w-4 h-4" />
                      ) : (
                        <Tag className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {alert.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums">
                          {alert.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                        {alert.body}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        <span>Abrir detalhes</span>
                        <ExternalLink className="w-3 h-3" />
                        {alert.deliveredViaSW && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            · Enviado via Service Worker
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Advanced VAPID Key Config for External Push Server */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvancedVapid((prev) => !prev)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Chave Pública VAPID (Opcional para servidor Web Push externo)</span>
              </span>
              {showAdvancedVapid ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedVapid && (
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={vapidInput}
                  onChange={(e) => setVapidInput(e.target.value)}
                  placeholder="Cole sua Application Server Key (VAPID Public Key)..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    updatePushPreferences({ vapidPublicKey: vapidInput.trim() });
                    setStatusFeedback({ text: 'Chave VAPID salva nas preferências locais.', ok: true });
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold hover:opacity-90 transition cursor-pointer shrink-0"
                >
                  Salvar Chave
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Foco regional ativo: Alagoinhas - BA
          </span>
          <button
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
