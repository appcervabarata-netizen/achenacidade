import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { RotatingBanner } from '../common/RotatingBanner';
import {
  Utensils,
  Shirt,
  HeartPulse,
  Smartphone,
  Hammer,
  Dog,
  Car,
  Scissors,
  Home,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Briefcase,
  Search,
  ArrowRight,
  Store,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Shirt,
  HeartPulse,
  Smartphone,
  Hammer,
  Dog,
  Car,
  Scissors,
  Home,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Briefcase,
};

export const CategoriesPage: React.FC = () => {
  const {
    categories,
    selectedCity,
    businesses,
    products,
    selectedCityId,
    setSelectedCategoryId,
    setCurrentView,
  } = useDirectory();

  const [searchTerm, setSearchTerm] = useState('');

  const cityName = selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : 'sua Cidade';

  const filteredCategories = categories.filter((cat) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      cat.name.toLowerCase().includes(term) ||
      (cat.description && cat.description.toLowerCase().includes(term))
    );
  });

  const getStats = (categoryId: string) => {
    const bizCount = businesses.filter(
      (b) => b.categoryId === categoryId && (selectedCityId === 'all' || b.cityId === selectedCityId)
    ).length;

    const prodCount = products.filter(
      (p) => {
        const biz = businesses.find((b) => b.id === p.businessId);
        return (
          biz &&
          biz.categoryId === categoryId &&
          (selectedCityId === 'all' || p.cityId === selectedCityId)
        );
      }
    ).length;

    return { bizCount, prodCount };
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setCurrentView('stores');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-12">
      {/* Upper Rotating Ad Banner (Admin-managed & separately billed) */}
      <RotatingBanner position="rotating_header" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header (Title, badge and description hidden on mobile as requested) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 sm:mb-6 sm:pb-4 sm:border-b border-slate-200 dark:border-slate-800">
          <div className="hidden sm:block">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Explorar por Segmento</span>
            </div>
            <h1 className="hidden sm:block text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              Categorias Comerciais em <span className="text-orange-600">{cityName}</span>
            </h1>
            <p className="hidden sm:block mt-1 text-sm text-slate-600 dark:text-slate-400">
              Navegue pelos segmentos comerciais e descubra lojas e serviços perto de você.
            </p>
          </div>

          {/* Search Category */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>
        </div>

        {/* Categories Grid (3 cols on mobile, 4 on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredCategories.map((cat) => {
            const IconComponent = iconMap[cat.iconName] || Briefcase;
            const stats = getStats(cat.id);

            return (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-xs"
                    style={{ backgroundColor: `${cat.color || '#2563EB'}15`, color: cat.color || '#2563EB' }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </h3>

                  {cat.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>{stats.bizCount} {stats.bizCount === 1 ? 'loja' : 'lojas'}</span>
                  <span className="flex items-center gap-1 text-blue-600 group-hover:translate-x-1 transition-transform">
                    Ver lojas <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
