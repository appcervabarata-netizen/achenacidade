/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DirectoryProvider, useDirectory } from './context/DirectoryContext';
import { Navbar } from './components/layout/Navbar';
import { HeroBanner } from './components/home/HeroBanner';
import { RotatingBanner } from './components/common/RotatingBanner';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { CategoriesPage } from './components/pages/CategoriesPage';
import { StoresPage } from './components/pages/StoresPage';
import { ProductsPage } from './components/pages/ProductsPage';
import { PlansPage } from './components/pages/PlansPage';
import { LoginScreen } from './components/auth/LoginScreen';
import { AdminScreen } from './components/admin/AdminScreen';
import { BusinessPortalScreen } from './components/business/BusinessPortalScreen';
import { BusinessDetailModal } from './components/business/BusinessDetailModal';
import { ProductDetailModal } from './components/business/ProductDetailModal';
import { FavoritesModal } from './components/favorites/FavoritesModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

function AppContent() {
  const { currentView } = useDirectory();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16 md:pb-0">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Primary Dynamic Screen View */}
      {currentView === 'login' && <LoginScreen />}
      {currentView === 'admin' && <AdminScreen />}
      {currentView === 'business_portal' && <BusinessPortalScreen />}
      {currentView === 'categories' && <CategoriesPage />}
      {currentView === 'stores' && <StoresPage />}
      {currentView === 'products' && <ProductsPage />}
      {currentView === 'plans' && <PlansPage />}
      {currentView === 'home' && (
        <main className="flex-1">
          {/* Banner Rotativo Superior (acima dos campos de pesquisa) */}
          <RotatingBanner position="top" />

          {/* Única Sessão da Home: Campos de Pesquisa de Empresas e Produtos */}
          <HeroBanner />

          {/* Banner Rotativo Inferior (abaixo dos campos de pesquisa) */}
          <RotatingBanner position="bottom" />
        </main>
      )}

      {/* Footer: Hidden on mobile, full display on desktop */}
      <Footer />

      {/* Mobile-Only Bottom App Navigation Dock - Fixed like a native phone menu */}
      <BottomNav />

      {/* Detail & Favorites Modals */}
      <BusinessDetailModal />
      <ProductDetailModal />
      <FavoritesModal />

      {/* PWA Offline Connection Banner */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <DirectoryProvider>
      <AppContent />
    </DirectoryProvider>
  );
}
