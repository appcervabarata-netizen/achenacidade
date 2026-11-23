import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { RotatingBanner } from '../common/RotatingBanner';
import {
  ShoppingBag,
  Search,
  MapPin,
  MessageCircle,
  Heart,
  PlusCircle,
  X,
  Store,
  Tag,
  ArrowUpDown,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const {
    cities,
    selectedCityId,
    setSelectedCityId,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    searchProductQuery,
    setSearchProductQuery,
    filteredProducts,
    businesses,
    openModal,
    toggleFavoriteProduct,
    isProductFavorite,
    setCurrentView,
    trackBusinessMetric,
  } = useDirectory();

  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  const getBusiness = (businessId: string) => {
    return businesses.find((b) => b.id === businessId);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleWhatsAppOrder = (e: React.MouseEvent, product: (typeof filteredProducts)[0]) => {
    e.stopPropagation();
    const biz = getBusiness(product.businessId);
    if (!biz) return;
    trackBusinessMetric(biz.id, 'whatsapp_click');
    const cleanNumber = biz.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Vi o produto "${product.name}" (${formatCurrency(product.price)}) no Achenacidade e tenho interesse!`
    );
    window.open(`https://wa.me/55${cleanNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-12">
      {/* Upper Rotating Ad Banner (Admin-managed & separately billed) */}
      <RotatingBanner position="rotating_header" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* Header with Title and "Cadastrar Produtos" CTA (Hidden on mobile for clean native app appearance) */}
        <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-bold mb-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Vitrine Comercial de Produtos</span>
            </div>
            <h1 className="hidden sm:block text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              Catálogo de Produtos Locais
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
            </p>
          </div>

          {/* Anunciar button -> leads to register_store on desktop, hidden on mobile */}
          <button
            onClick={() => setCurrentView('register_store')}
            className="hidden sm:flex self-start sm:self-auto items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Meus Produtos</span>
          </button>
        </div>

        {/* Filters Bar: City Select + Search + Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
          {/* City filter (Hidden on mobile to prioritize search bar) */}
          <div className="hidden sm:flex sm:col-span-4 items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xs">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Todas as Cidades</option>
              {cities.filter((c) => c.isActive).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.state}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-5 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchProductQuery}
              onChange={(e) => setSearchProductQuery(e.target.value)}
              placeholder="Pesquisar produto por nome, marca ou descrição..."
              className="w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
            />
            {searchProductQuery && (
              <button
                onClick={() => setSearchProductQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xs">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="default">Relevância</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
            </select>
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            Todos os Produtos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap cursor-pointer shrink-0 ${
                selectedCategoryId === cat.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid (2 cols on mobile, 4 cols on desktop) */}
        {sortedProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nenhum produto encontrado
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Tente mudar a cidade, categoria ou limpar o termo de pesquisa de produtos.
            </p>
            <button
              onClick={() => {
                setSelectedCityId('all');
                setSelectedCategoryId('all');
                setSearchProductQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {sortedProducts.map((prod) => {
              const biz = getBusiness(prod.businessId);
              const isFav = isProductFavorite(prod.id);
              const hasDiscount = prod.originalPrice && prod.originalPrice > prod.price;

              return (
                <div
                  key={prod.id}
                  onClick={() => openModal('product_detail', prod.id)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Image with discount badge and favorite button */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteProduct(prod.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-xs transition"
                        title={isFav ? 'Remover dos favoritos' : 'Salvar produto'}
                      >
                        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                      </button>

                      {/* Discount Badge */}
                      {hasDiscount && (
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                            Oferta
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2.5 sm:p-4">
                      {biz && (
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">
                          <Store className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate">{biz.name}</span>
                        </div>
                      )}

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-orange-600">
                        {prod.name}
                      </h3>

                      <div className="mt-2">
                        {hasDiscount && (
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through mr-1.5">
                            {formatCurrency(prod.originalPrice!)}
                          </span>
                        )}
                        <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(prod.price)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-2.5 sm:p-4 pt-0">
                    <button
                      onClick={(e) => handleWhatsAppOrder(e, prod)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Pedir no Zap</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
