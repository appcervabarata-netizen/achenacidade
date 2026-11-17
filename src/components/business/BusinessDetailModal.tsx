import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  X,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Globe,
  Instagram,
  Facebook,
  CheckCircle2,
  Package,
  ShoppingBag,
  Wrench,
  Heart,
  Bell,
  BellRing,
} from 'lucide-react';
import { formatServicePrice, getServiceModeLabel, getServiceWhatsAppMessage } from '../../utils/serviceFormatters';

export const BusinessDetailModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    businesses,
    cities,
    categories,
    plans,
    products,
    services,
    openModal,
    toggleFavoriteBusiness,
    isBusinessFavorite,
    toggleFavoriteProduct,
    isProductFavorite,
    toggleFavoriteService,
    isServiceFavorite,
    pushPreferences,
    enablePushNotifications,
  } = useDirectory();

  if (activeModal.type !== 'business_detail' || !activeModal.id) {
    return null;
  }

  const business = businesses.find((b) => b.id === activeModal.id);
  if (!business) return null;

  const city = cities.find((c) => c.id === business.cityId);
  const category = categories.find((c) => c.id === business.categoryId);
  const plan = plans.find((p) => p.id === business.planId);
  const storeProducts = products.filter(
    (p) => p.businessId === business.id && p.isActive
  );
  const storeServices = services.filter(
    (s) => s.businessId === business.id && s.isActive
  );

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header / Cover */}
        <div className="relative h-44 sm:h-56 bg-slate-900 shrink-0">
          <img
            src={
              business.coverUrl ||
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop&q=80'
            }
            alt={business.name}
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top action buttons */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={async () => {
                if (!isBusinessFavorite(business.id)) {
                  toggleFavoriteBusiness(business.id);
                }
                if (!pushPreferences.enabled) {
                  await enablePushNotifications();
                } else {
                  openModal('notifications');
                }
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-md ${
                pushPreferences.enabled && isBusinessFavorite(business.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-black/50 hover:bg-black/80 text-white'
              }`}
              title={
                pushPreferences.enabled && isBusinessFavorite(business.id)
                  ? 'Alertas push ativos para esta empresa'
                  : 'Receber alertas push de ofertas e serviços desta loja'
              }
            >
              {pushPreferences.enabled && isBusinessFavorite(business.id) ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => toggleFavoriteBusiness(business.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-md ${
                isBusinessFavorite(business.id)
                  ? 'bg-white text-rose-600'
                  : 'bg-black/50 hover:bg-black/80 text-white'
              }`}
              title={isBusinessFavorite(business.id) ? 'Remover dos favoritos' : 'Salvar empresa nos favoritos'}
            >
              <Heart className={`w-4 h-4 ${isBusinessFavorite(business.id) ? 'fill-rose-600' : ''}`} />
            </button>

            <button
              onClick={closeModal}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer shadow-md"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Info inside Cover */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 border-white dark:border-slate-900 shadow-lg bg-white shrink-0"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=200&h=200&fit=crop&q=80';
              }}
            />
            <div className="text-white min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold truncate font-display">
                  {business.name}
                </h2>
                {business.isVerified && (
                  <span title="Empresa Verificada">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{category?.name}</span>
                <span>·</span>
                <span>{city?.name} - {city?.state}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          {/* Quick Contact & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              {business.phone && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.instagram && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <span>{business.instagram}</span>
                </div>
              )}
              {business.facebook && (
                <a
                  href={business.facebook.startsWith('http') ? business.facebook : `https://${business.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-medium text-blue-600 hover:underline"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Facebook</span>
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-medium text-blue-600 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  <span>Site Oficial</span>
                </a>
              )}
            </div>

            <a
              href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Olá! Encontrei o perfil da ${business.name} no achenacidade e gostaria de atendimento.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar no WhatsApp</span>
            </a>
          </div>

          {/* Details & Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Sobre a Empresa
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {business.description}
              </p>
            </div>

            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  Endereço
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {business.address} - {business.neighborhood}
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {city?.name} - {city?.state}
                </p>
              </div>

              {business.weeklySchedule && business.weeklySchedule.length > 0 ? (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Horário por Dia da Semana
                  </span>
                  <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px]">
                    {business.weeklySchedule.map((s) => (
                      <div key={s.day} className="flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{s.day}:</span>
                        <span className={s.isOpen ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-400 italic'}>
                          {s.isOpen ? `${s.openTime} às ${s.closeTime}` : 'Fechado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : business.openingHours ? (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Horário de Funcionamento
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {business.openingHours}
                  </p>
                </div>
              ) : null}

              {plan && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Plano Anunciante:</span>
                  <span className="ml-1.5 font-bold text-blue-600 dark:text-blue-400">
                    {plan.name} ({plan.productLimit} produtos/serviços)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Store Products Showcase */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Produtos da Loja ({storeProducts.length})
                </h3>
              </div>
            </div>

            {storeProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {storeProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="group bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition"
                  >
                    <div
                      className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-700 cursor-pointer"
                      onClick={() => openModal('product_detail', prod.id)}
                    >
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteProduct(prod.id);
                        }}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition shadow-xs cursor-pointer ${
                          isProductFavorite(prod.id)
                            ? 'bg-white text-rose-600 shadow-sm'
                            : 'bg-black/40 hover:bg-black/60 text-white'
                        }`}
                        title={isProductFavorite(prod.id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isProductFavorite(prod.id) ? 'fill-rose-600' : ''}`} />
                      </button>
                    </div>
                    <div className="p-3.5">
                      <h4
                        onClick={() => openModal('product_detail', prod.id)}
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-orange-600 cursor-pointer"
                      >
                        {prod.name}
                      </h4>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                          {formatPrice(prod.price)}
                        </span>
                        <a
                          href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá! Vi o produto "${prod.name}" no achenacidade e gostaria de comprar.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Pedir</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta empresa ainda não cadastrou produtos em sua vitrine.
                </p>
              </div>
            )}
          </div>

          {/* Store Services Showcase */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Serviços Oferecidos ({storeServices.length})
                </h3>
              </div>
            </div>

            {storeServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {storeServices.map((serv) => (
                  <div
                    key={serv.id}
                    className="group bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition"
                  >
                    <div
                      className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-700 cursor-pointer"
                      onClick={() => openModal('service_detail', serv.id)}
                    >
                      <img
                        src={serv.imageUrl}
                        alt={serv.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteService(serv.id);
                        }}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition shadow-xs cursor-pointer ${
                          isServiceFavorite(serv.id)
                            ? 'bg-white text-rose-600 shadow-sm'
                            : 'bg-black/40 hover:bg-black/60 text-white'
                        }`}
                        title={isServiceFavorite(serv.id) ? 'Remover dos favoritos' : 'Salvar serviço nos favoritos'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isServiceFavorite(serv.id) ? 'fill-rose-600' : ''}`} />
                      </button>
                    </div>
                    <div className="p-3.5">
                      <h4
                        onClick={() => openModal('service_detail', serv.id)}
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 cursor-pointer"
                      >
                        {serv.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{getServiceModeLabel(serv.serviceMode)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3 h-3" />
                          {serv.duration}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                          {formatServicePrice(serv)}
                        </span>
                        <a
                          href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                            getServiceWhatsAppMessage(serv, business.name)
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Orçar</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <Wrench className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta empresa ainda não cadastrou serviços em sua vitrine.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
