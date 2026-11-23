import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  X,
  MessageCircle,
  Building2,
  MapPin,
  Tag,
  ShieldCheck,
  ChevronRight,
  Heart,
} from 'lucide-react';

import { normalizeWhatsappUrl } from '../../utils/seoHelper';

export const ProductDetailModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    products,
    businesses,
    cities,
    openModal,
    toggleFavoriteProduct,
    isProductFavorite,
    trackBusinessMetric,
  } = useDirectory();

  if (activeModal.type !== 'product_detail' || !activeModal.id) {
    return null;
  }

  const product = products.find((p) => p.id === activeModal.id);
  if (!product) return null;

  const business = businesses.find((b) => b.id === product.businessId);
  const city = cities.find((c) => c.id === product.cityId);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const whatsappLink = business
    ? normalizeWhatsappUrl(
        business.whatsapp,
        `Olá ${business.name}! Vi o anúncio do produto "${product.name}" (${formatPrice(
          product.price
        )}) no portal achenacidade e gostaria de mais informações.`
      )
    : '';

  const isFav = isProductFavorite(product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Floating Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => toggleFavoriteProduct(product.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-md ${
              isFav ? 'bg-white text-rose-600' : 'bg-black/50 hover:bg-black/80 text-white'
            }`}
            title={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
          </button>

          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer shadow-md"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Main Product Image */}
          <div className="relative aspect-16/10 bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop&q=80';
              }}
            />
            {product.featured && (
              <span className="absolute top-4 left-4 bg-orange-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-md">
                Destaque Especial
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            
            {/* Title, Category & Price */}
            <div>
              <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider mb-1">
                <Tag className="w-3.5 h-3.5" />
                <span>{product.category || 'Geral'}</span>
                <span>·</span>
                <span>{city?.name}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                {product.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through font-mono tabular-nums">
                    De: {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Descrição do Produto
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Store Information Card */}
            {business && (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-blue-200 dark:border-blue-800"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-300 tracking-wider">
                      Vendido & Anunciado por
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {business.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{business.neighborhood}, {city?.name}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openModal('business_detail', business.id)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver loja</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Direct WhatsApp Call to Action */}
            {business && whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackBusinessMetric(business.id, 'whatsapp_click')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Pedir ou Negociar no WhatsApp com a Loja</span>
              </a>
            )}

            <div className="text-center text-[11px] text-slate-400">
              Negociação direta e segura sem intermediários ou taxas adicionais.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
