import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { formatServicePrice, getServiceModeLabel } from '../../utils/serviceFormatters';
import { normalizeWhatsappUrl } from '../../utils/seoHelper';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  X,
  Heart,
  Building2,
  ShoppingBag,
  Wrench,
  Trash2,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  Clock,
  BellRing,
  Bell,
} from 'lucide-react';

export const FavoritesModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    favoriteBusinesses,
    favoriteProducts,
    favoriteServices,
    toggleFavoriteBusiness,
    toggleFavoriteProduct,
    toggleFavoriteService,
    clearAllFavorites,
    openModal,
    cities,
    setCurrentView,
    pushPreferences,
    enablePushNotifications,
    trackBusinessMetric,
  } = useDirectory();

  const [activeTab, setActiveTab] = useState<'businesses' | 'products' | 'services'>('businesses');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  if (activeModal.type !== 'favorites') {
    return null;
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCityName = (cityId: string) => {
    const c = cities.find((ci) => ci.id === cityId);
    return c ? `${c.name} - ${c.state}` : '';
  };

  const totalCount = favoriteBusinesses.length + favoriteProducts.length + favoriteServices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display">
                  Meus Favoritos Salvos
                </h2>
                <span className="text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  {totalCount} {totalCount === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Salvos localmente no seu dispositivo para acesso rápido
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Limpar todos os favoritos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar Tudo</span>
              </button>
            )}

            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtabs */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('businesses')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'businesses'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Empresas ({favoriteBusinesses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'products'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Produtos ({favoriteProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'services'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Serviços ({favoriteServices.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Push Notifications Quick Status Bar */}
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {pushPreferences.enabled ? (
                <BellRing className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              ) : (
                <Bell className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {pushPreferences.enabled
                    ? 'Alertas Push ativos para suas empresas favoritas'
                    : 'Receba avisos de novas ofertas e serviços em Alagoinhas'}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  {pushPreferences.enabled
                    ? 'Notificações enviadas via Service Worker quando houver novidades.'
                    : 'Ative as notificações push para não perder promoções das lojas salvas.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!pushPreferences.enabled ? (
                <button
                  onClick={() => void enablePushNotifications()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Ativar Push
                </button>
              ) : null}
              <button
                onClick={() => openModal('notifications')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 text-xs font-semibold transition cursor-pointer"
              >
                Configurar Alertas
              </button>
            </div>
          </div>

          {/* TAB: BUSINESSES */}
          {activeTab === 'businesses' && (
            <div>
              {favoriteBusinesses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteBusinesses.map((biz) => (
                    <div
                      key={biz.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={biz.logoUrl}
                          alt={biz.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => openModal('business_detail', biz.id)}
                            className="text-sm font-bold text-slate-900 dark:text-white truncate hover:text-blue-600 cursor-pointer"
                          >
                            {biz.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {biz.neighborhood} · {getCityName(biz.cityId)}
                          </p>
                        </div>

                        {/* Unfavorite button */}
                        <button
                          onClick={() => toggleFavoriteBusiness(biz.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Remover dos favoritos"
                        >
                          <Heart className="w-4 h-4 fill-rose-600" />
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {biz.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openModal('business_detail', biz.id)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ver Loja</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={normalizeWhatsappUrl(
                            biz.whatsapp,
                            'Olá! Vi sua empresa nos meus favoritos do achenacidade e gostaria de tirar uma dúvida.'
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackBusinessMetric(biz.id, 'whatsapp_click')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                  <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhuma empresa favoritada ainda
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    Ao navegar pelo diretório, clique no ícone de coração nos cards de empresas para salvá-las aqui.
                  </p>
                  <button
                    onClick={() => {
                      closeModal();
                      const el = document.getElementById('empresas');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer"
                  >
                    <span>Explorar Empresas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              {favoriteProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => openModal('product_detail', prod.id)}
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-orange-600 cursor-pointer"
                          >
                            {prod.name}
                          </h4>
                          <div className="mt-1 font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                            {formatPrice(prod.price)}
                          </div>
                        </div>

                        {/* Unfavorite button */}
                        <button
                          onClick={() => toggleFavoriteProduct(prod.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Remover dos favoritos"
                        >
                          <Heart className="w-4 h-4 fill-rose-600" />
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {prod.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openModal('product_detail', prod.id)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Ver Detalhes
                        </button>

                        <button
                          onClick={() => openModal('product_detail', prod.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Comprar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                  <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhum produto salvo nos favoritos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    Encontrou um produto interessante na vitrine? Clique no coração para guardá-lo nesta lista.
                  </p>
                  <button
                    onClick={() => {
                      closeModal();
                      const el = document.getElementById('produtos');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 transition cursor-pointer"
                  >
                    <span>Explorar Vitrine de Produtos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: SERVICES */}
          {activeTab === 'services' && (
            <div>
              {favoriteServices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteServices.map((serv) => (
                    <div
                      key={serv.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={serv.imageUrl}
                          alt={serv.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => openModal('service_detail', serv.id)}
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 cursor-pointer"
                          >
                            {serv.name}
                          </h4>
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span>{getServiceModeLabel(serv.serviceMode)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                              <Clock className="w-3 h-3" />
                              {serv.duration}
                            </span>
                          </div>
                          <div className="mt-1 font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                            {formatServicePrice(serv)}
                          </div>
                        </div>

                        <button
                          onClick={() => toggleFavoriteService(serv.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Remover dos favoritos"
                        >
                          <Heart className="w-4 h-4 fill-rose-600" />
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {serv.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openModal('service_detail', serv.id)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Ver Detalhes
                        </button>

                        <button
                          onClick={() => openModal('service_detail', serv.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Solicitar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                  <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhum serviço salvo nos favoritos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    Encontrou um serviço ou profissional interessante? Clique no coração para guardá-lo aqui.
                  </p>
                  <button
                    onClick={() => {
                      closeModal();
                      setCurrentView('services');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <span>Explorar Catálogo de Serviços</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Armazenamento 100% privado no seu navegador via localStorage.
          </span>
          <button
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>

      <ConfirmModal
        isOpen={confirmClearOpen}
        title="Limpar Favoritos"
        message="Tem certeza que deseja limpar todos os favoritos salvos (empresas, produtos e serviços)?"
        confirmLabel="Limpar Favoritos"
        variant="danger"
        onConfirm={() => clearAllFavorites()}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
