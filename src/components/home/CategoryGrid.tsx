import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  Utensils,
  Shirt,
  HeartPulse,
  Smartphone,
  Hammer,
  Dog,
  Car,
  Scissors,
  Store,
  Layers,
  GraduationCap,
  Home,
  ShoppingBasket,
  PartyPopper,
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
  GraduationCap,
  Home,
  ShoppingBasket,
  PartyPopper,
  Store,
};

export const CategoryGrid: React.FC = () => {
  const {
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    businesses,
    selectedCityId,
  } = useDirectory();

  // Helper count of companies per category in the current selected city
  const getCategoryCount = (catId: string) => {
    return businesses.filter((b) => {
      const cityMatches = selectedCityId === 'all' || b.cityId === selectedCityId;
      return cityMatches && b.categoryId === catId;
    }).length;
  };

  // Top 12 categories for mobile 3 cols x 4 rows
  const top12Categories = categories.slice(0, 12);

  return (
    <section className="py-6 sm:py-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
              Categorias Principais
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Navegue pelos segmentos comerciais mais procurados
            </p>
          </div>
          {selectedCategoryId !== 'all' && (
            <button
              onClick={() => setSelectedCategoryId('all')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          )}
        </div>

        {/* MOBILE VIEW: Exactly 12 main categories in a 3-column x 4-row grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:hidden">
          {top12Categories.map((cat) => {
            const IconComponent = iconMap[cat.iconName] || Store;
            const count = getCategoryCount(cat.id);
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(isSelected ? 'all' : cat.id)}
                className={`flex flex-col items-center justify-center text-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-102'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold leading-tight line-clamp-1 w-full px-0.5">
                  {cat.name.split('&')[0].trim()}
                </span>
                <span
                  className={`text-[9px] mt-0.5 font-medium ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {count} {count === 1 ? 'loja' : 'lojas'}
                </span>
              </button>
            );
          })}
        </div>

        {/* DESKTOP VIEW: Horizontal scrollable filter pills */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Todas as Categorias</span>
          </button>

          {categories.map((cat) => {
            const IconComponent = iconMap[cat.iconName] || Store;
            const count = getCategoryCount(cat.id);
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(isSelected ? 'all' : cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}
                />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
