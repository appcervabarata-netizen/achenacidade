/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DirectoryProvider, useDirectory } from './context/DirectoryContext';
import { Navbar } from './components/layout/Navbar';
import { HeroBanner } from './components/home/HeroBanner';
import { PlansSection } from './components/home/PlansSection';
import { RotatingBanner } from './components/common/RotatingBanner';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { CategoriesPage } from './components/pages/CategoriesPage';
import { StoresPage } from './components/pages/StoresPage';
import { ProductsPage } from './components/pages/ProductsPage';
import { ServicesPage } from './components/pages/ServicesPage';
import { PlansPage } from './components/pages/PlansPage';
import { FounderSalesPage } from './components/pages/FounderSalesPage';
import { BannerAdPage } from './components/pages/BannerAdPage';
import { LaunchPage } from './components/pages/LaunchPage';
import { MaintenancePage } from './components/pages/MaintenancePage';
import { LoginScreen } from './components/auth/LoginScreen';
import { AdminLoginScreen } from './components/auth/AdminLoginScreen';
import { AdminScreen } from './components/admin/AdminScreen';
import { BusinessPortalScreen } from './components/business/BusinessPortalScreen';
import { RegisterStoreScreen } from './components/business/RegisterStoreScreen';
import { BusinessDetailModal } from './components/business/BusinessDetailModal';
import { ProductDetailModal } from './components/business/ProductDetailModal';
import { ServiceDetailModal } from './components/business/ServiceDetailModal';
import { FavoritesModal } from './components/favorites/FavoritesModal';
import { NotificationsModal } from './components/notifications/NotificationsModal';
import { PushLiveBanner } from './components/notifications/PushLiveBanner';
import { PlanPaymentModal } from './components/payment/PlanPaymentModal';
import { CheckoutPage } from './components/payment/CheckoutPage';
import { OfflineIndicator } from './components/common/OfflineIndicator';

function AppContent() {
  const {
    currentView,
    authSession,
    paymentModalData,
    closePaymentModal,
    siteModeConfig,
    adminPreviewMode,
    setAdminPreviewMode,
  } = useDirectory();

  if (adminPreviewMode === 'launch') {
    return (
      <>
        <LaunchPage isPreview onExitPreview={() => setAdminPreviewMode('none')} />
        <OfflineIndicator />
      </>
    );
  }

  if (adminPreviewMode === 'maintenance') {
    return (
      <>
        <MaintenancePage isPreview onExitPreview={() => setAdminPreviewMode('none')} />
        <OfflineIndicator />
      </>
    );
  }

  const isRestrictedMode = siteModeConfig.mode !== 'normal';
  const allowedRestrictedViews = ['login', 'admin_login', 'admin', 'business_portal', 'plans', 'founder_sales', 'banner_ad_page', 'register_store', 'checkout'];
  const showRestrictedLanding = isRestrictedMode && !allowedRestrictedViews.includes(currentView);
  const hideChrome = isRestrictedMode || currentView === 'checkout' || currentView === 'admin_login' || currentView === 'founder_sales' || currentView === 'banner_ad_page';
  const showStoreOwnerBottomMenu =
    authSession.isAuthenticated &&
    authSession.role === 'business' &&
    currentView !== 'checkout' &&
    currentView !== 'admin_login';

  if (showRestrictedLanding) {
    return (
      <>
        {siteModeConfig.mode === 'launch' ? <LaunchPage /> : <MaintenancePage />}
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${
        hideChrome && !showStoreOwnerBottomMenu ? '' : 'pb-16 md:pb-0'
      }`}
    >
      {/* Top Navigation Bar (hidden when Launch/Maintenance funnel or dedicated Checkout is active) */}
      {!hideChrome && <Navbar />}

      {/* Primary Dynamic Screen View */}
      {currentView === 'login' && <LoginScreen />}
      {currentView === 'admin_login' &&
        (authSession.isAuthenticated && authSession.role === 'admin' ? (
          <AdminScreen />
        ) : (
          <AdminLoginScreen />
        ))}
      {currentView === 'admin' &&
        (authSession.isAuthenticated && authSession.role === 'admin' ? (
          <AdminScreen />
        ) : (
          <LoginScreen />
        ))}
      {currentView === 'business_portal' &&
        (authSession.isAuthenticated && authSession.role === 'business' ? (
          <BusinessPortalScreen />
        ) : (
          <LoginScreen />
        ))}
      {currentView === 'register_store' && <RegisterStoreScreen />}
      {currentView === 'checkout' && <CheckoutPage />}
      {currentView === 'categories' && <CategoriesPage />}
      {currentView === 'stores' && <StoresPage />}
      {currentView === 'products' && <ProductsPage />}
      {currentView === 'services' && <ServicesPage />}
      {currentView === 'plans' && <PlansPage />}
      {currentView === 'founder_sales' && <FounderSalesPage />}
      {currentView === 'banner_ad_page' && <BannerAdPage />}
      {currentView === 'home' && (
        <main className="flex-1">
          {/* Banner Rotativo Superior (acima dos campos de pesquisa) */}
          <RotatingBanner position="top" />

          {/* Campos de Pesquisa Tripla: Empresas, Produtos e Serviços */}
          <HeroBanner />

          {/* Planos Selecionados pelo Admin para Exibição na Página Inicial */}
          <PlansSection />

          {/* Banner Rotativo Inferior (abaixo dos planos) */}
          <RotatingBanner position="bottom" />
        </main>
      )}

      {/* Footer: Hidden on mobile and during Launch/Maintenance/Checkout funnel */}
      {!hideChrome && <Footer />}

      {/* Mobile-Only Bottom App Navigation Dock (Public menu OR Store Owner menu when logged in) */}
      {(!hideChrome || showStoreOwnerBottomMenu) && <BottomNav />}

      {/* Detail, Favorites & Push Notifications Modals */}
      <BusinessDetailModal />
      <ProductDetailModal />
      <ServiceDetailModal />
      <FavoritesModal />
      <NotificationsModal />
      <PushLiveBanner />

      {/* Mercado Pago Plan Checkout Modal */}
      <PlanPaymentModal
        isOpen={paymentModalData.isOpen}
        onClose={closePaymentModal}
        planId={paymentModalData.planId}
        businessId={paymentModalData.businessId}
        billingCycle={paymentModalData.billingCycle}
      />

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
