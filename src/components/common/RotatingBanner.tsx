import React, { useState, useEffect } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { BannerPosition } from '../../types';
import { ChevronLeft, ChevronRight, ExternalLink, Sparkles, Megaphone } from 'lucide-react';

interface RotatingBannerProps {
  position: BannerPosition;
  className?: string;
}

export const RotatingBanner: React.FC<RotatingBannerProps> = ({ position, className = '' }) => {
  const { banners, selectedCityId, recordBannerClick, setCurrentView } = useDirectory();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter banners matching this position, active, and matching city (or all)
  const matchingBanners = banners.filter(
    (b) =>
      b.isActive &&
      (b.position === position || (position === 'rotating_header' && (b.position === 'rotating_header' || b.position === 'top'))) &&
      (b.cityId === 'all' || selectedCityId === 'all' || b.cityId === selectedCityId)
  );

  // Auto-rotation every 5.5 seconds
  useEffect(() => {
    if (matchingBanners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % matchingBanners.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [matchingBanners.length, isPaused]);

  // Reset index if list shrinks
  useEffect(() => {
    if (currentIndex >= matchingBanners.length) {
      setCurrentIndex(0);
    }
  }, [matchingBanners.length, currentIndex]);

  // If no banners are active for this spot, show an invitation spot
  if (matchingBanners.length === 0) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4 ${className}`}>
        <div
          onClick={() => setCurrentView('login')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/30 p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md hover:border-orange-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30 group-hover:scale-105 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-600 text-white">
                  Espaço Publicitário
                </span>
                <span className="text-xs text-slate-300">Destaque sua marca para toda a cidade</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                Anuncie seu negócio neste espaço exclusivo no Achenacidade
              </h4>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shrink-0 shadow-sm transition">
            Anunciar Aqui
          </button>
        </div>
      </div>
    );
  }

  const currentBanner = matchingBanners[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % matchingBanners.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + matchingBanners.length) % matchingBanners.length);
  };

  const handleBannerClick = () => {
    recordBannerClick(currentBanner.id);
    if (currentBanner.linkUrl) {
      if (currentBanner.linkUrl.startsWith('#')) {
        const target = currentBanner.linkUrl.replace('#', '');
        if (target === 'empresas' || target === 'lojas') {
          setCurrentView('stores');
        } else if (target === 'produtos') {
          setCurrentView('products');
        } else if (target === 'planos') {
          setCurrentView('plans');
        }
      } else if (currentBanner.linkUrl.startsWith('http')) {
        window.open(currentBanner.linkUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      setCurrentView('login');
    }
  };

  return (
    <div
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-3 sm:my-4 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        onClick={handleBannerClick}
        className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/60 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:border-orange-500/50"
      >
        {/* Banner Background Image */}
        <div className="relative h-28 sm:h-36 md:h-44 w-full overflow-hidden">
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent sm:hidden" />

          {/* Banner Content Overlay */}
          <div className="absolute inset-0 p-3.5 sm:p-6 flex flex-col justify-between">
            {/* Top row: Sponsor badge and advertiser */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-600/90 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider backdrop-blur-sm shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  {currentBanner.badgeText || 'Publicidade'}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-200 backdrop-blur-xs px-2 py-0.5 rounded-md bg-slate-900/60">
                  {currentBanner.advertiserName}
                </span>
              </div>

              {/* Price / Billed Separately note for Admin transparency */}
              <div className="hidden lg:flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 border border-amber-600/30 px-2 py-0.5 rounded-full">
                <span>Espaço Comercial Patrocinado</span>
              </div>
            </div>

            {/* Bottom row: Title, tagline and CTA */}
            <div className="flex items-end justify-between gap-3">
              <div className="max-w-xl">
                <h3 className="text-sm sm:text-lg md:text-xl font-extrabold text-white leading-tight drop-shadow-md group-hover:text-orange-300 transition-colors">
                  {currentBanner.title}
                </h3>
                {currentBanner.tagline && (
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-200 line-clamp-1 drop-shadow-xs">
                    {currentBanner.tagline}
                  </p>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 group-hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-colors">
                <span>Conferir</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Rotation Controls (when multiple banners exist) */}
        {matchingBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs border border-white/10"
              title="Banner anterior"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs border border-white/10"
              title="Próximo banner"
              aria-label="Próximo banner"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {matchingBanners.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-5 bg-orange-500' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Ir para banner ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
