import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  ShoppingBag,
  MessageCircle,
  Building2,
  Tag,
  X,
  MapPin,
  ExternalLink,
  Heart,
} from 'lucide-react';

export const FeaturedProducts: React.FC = () => {
  const {
    filteredProducts,
    businesses,
    cities,
    selectedCity,
    searchProductQuery,
    setSearchProductQuery,
    openModal,
    toggleFavoriteProduct,
    isProductFavorite,
    trackBusinessMetric,
  } = useDirectory();

  const getBusiness = (businessId: string) => {
    return businesses.find((b) => b.id === businessId);
  };

  const getCityName = (cityId: string) => {
    const c = cities.find((ci) => ci.id === cityId);
    return c ? `${c.name} - ${c.state}` : '';
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <section id="produtos" className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Vitrine Comercial de Produtos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              Produtos & Ofertas em {selectedCity ? selectedCity.name : 'Destaque'}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Produtos anunciados pelas empresas locais de acordo com os planos contratados
            </p>
          </div>

          {searchProductQuery && (
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-lg text-xs text-orange-800 dark:text-orange-300">
              <span>Buscando produtos por: <strong>"{searchProductQuery}"</strong></span>
              <button
                onClick={() => setSearchProductQuery('')}
                className="hover:text-orange-900 dark:text-white p-0.5"
                title="Limpar busca de produtos"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Products Grid: 2 columns on mobile, 3/4 on desktop */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {filteredProducts.map((prod) => {
              const business = getBusiness(prod.businessId);

              return (
                <div
                  key={prod.id}
                  className="group bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Product Image Frame */}
                    <div
                      className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-700 cursor-pointer"
                      onClick={() => openModal('product_detail', prod.id)}
                    >
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=400&fit=crop&q=80';
                        }}
                      />
                      {prod.featured && (
                        <span className="absolute top-2 left-2 bg-orange-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                          Destaque
                        </span>
                      )}
                      {prod.originalPrice && (
                        <span className="absolute top-2 right-9 sm:right-11 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md">
                          Oferta
                        </span>
                      )}

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteProduct(prod.id);
                        }}
                        className={`absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition shadow-xs cursor-pointer ${
                          isProductFavorite(prod.id)
                            ? 'bg-white text-rose-600 shadow-md'
                            : 'bg-black/40 hover:bg-black/60 text-white'
                        }`}
                        title={isProductFavorite(prod.id) ? 'Remover dos favoritos' : 'Salvar produto nos favoritos'}
                      >
                        <Heart
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                            isProductFavorite(prod.id) ? 'fill-rose-600' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 sm:p-4">
                      {/* Store unboxed reference */}
                      {business && (
                        <div
                          onClick={() => openModal('business_detail', business.id)}
                          className="flex items-center gap-1 text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline truncate mb-0.5"
                        >
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{business.name}</span>
                        </div>
                      )}

                      {/* Product Name */}
                      <h3
                        onClick={() => openModal('product_detail', prod.id)}
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-orange-600 cursor-pointer transition-colors"
                      >
                        {prod.name}
                      </h3>

                      {/* Short Description: hidden on small mobile */}
                      <p className="hidden sm:block mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>

                      {/* Price Section */}
                      <div className="mt-1.5 sm:mt-3 flex items-baseline gap-1.5">
                        <span className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                          {formatPrice(prod.price)}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through font-mono tabular-nums">
                            {formatPrice(prod.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2.5 sm:p-4 pt-0">
                    {business ? (
                      <a
                        href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Olá ${business.name}! Vi o anúncio do produto "${prod.name}" (${formatPrice(
                            prod.price
                          )}) no achenacidade e tenho interesse!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackBusinessMetric(business.id, 'whatsapp_click')}
                        className="w-full flex items-center justify-center gap-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pedir no WhatsApp</span>
                        <span className="sm:hidden">Pedir</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => openModal('product_detail', prod.id)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold"
                      >
                        <span>Ver detalhes</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Não encontramos produtos para esta busca. Tente buscar por outros termos ou selecionar todas as cidades.
            </p>
            {searchProductQuery && (
              <button
                onClick={() => setSearchProductQuery('')}
                className="mt-4 px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition cursor-pointer"
              >
                Limpar pesquisa de produtos
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
