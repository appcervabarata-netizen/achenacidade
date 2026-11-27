import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { City, Category, Plan, PlanInvite, Business, Product, Service, AdminTheme, AdBanner, BannerPlan, AppView, BusinessPortalTab, StoreProductCategory, SessionConfig, AuthSession, MercadoPagoConfig, PaymentTransaction, PushPreferences, PushAlertLog, SiteMode, SiteModeConfig, LaunchPageConfig, MaintenancePageConfig, SmtpConfig, EmailTemplate, EmailTemplateKey, EmailLogEntry, CheckoutTarget, BillingCycle, PlanDiscountConfig, AppGeneralConfig, BusinessMetricEventType, BusinessMetricsSummary, DailyMetricPoint } from '../types';
import {
  initialCities,
  initialCategories,
  initialPlans,
  initialBusinesses,
  initialProducts,
  initialServices,
  initialBanners,
  initialBannerPlans,
  initialStoreProductCategories,
  defaultTheme,
  defaultMercadoPagoConfig,
  initialPaymentTransactions,
  defaultSiteModeConfig,
  defaultSmtpConfig,
  defaultEmailTemplates,
  defaultPlanDiscountConfig,
  defaultAppGeneralConfig,
} from '../data/initialData';
import { applySeoToDocumentHead } from '../utils/seoHelper';
import {
  isPushSupported,
  getNotificationPermissionState,
  getActiveSWRegistration,
  subscribePushManager,
  unsubscribePushManager,
  sendNotificationViaServiceWorker,
  notifyFavoriteBusinessOffer,
} from '../utils/pushService';
import { formatServicePrice } from '../utils/serviceFormatters';
import { dispatchTransactionalEmail } from '../utils/emailService';
import {
  calculatePlanPricing,
  calculatePlanExpirationDate,
  clampDiscountPercent,
  isLifetimePlan,
  isVipPlan,
  parseBillingCycleParam,
} from '../utils/planPricing';
import {
  fetchBootstrap,
  seedDatabase,
  syncAllDataToDb,
  resetDatabaseDemo,
  createEntityInDb,
  updateEntityInDb,
  deleteEntityInDb,
  syncCollectionToDb,
  saveSettingToDb,
  recordBannerClickInDb,
  trackBusinessMetricViaApi,
  fetchBusinessMetricsViaApi,
  loginViaApi,
  loginDemoBusinessViaApi,
  verifySessionViaApi,
  renewSessionViaApi,
  logoutViaApi,
  switchBusinessViaApi,
  issueVerificationCodeViaApi,
  verifyEmailCodeViaApi,
  fetchPlanInvitesViaApi,
  createPlanInviteViaApi,
  revokePlanInviteViaApi,
  deletePlanInviteViaApi,
  validatePlanInviteViaApi,
  redeemPlanInviteViaApi,
  type ApiMutationResult,
  type DirectoryBootstrapPayload,
} from '../utils/apiSync';

export interface BusinessQuotaInfo {
  productsCount: number;
  servicesCount: number;
  totalUsed: number;
  limit: number;
  remaining: number;
  isFull: boolean;
}

interface DirectoryContextType {
  // Cities
  cities: City[];
  selectedCityId: string;
  selectedCity: City | undefined;
  setSelectedCityId: (id: string) => void;
  addCity: (city: Omit<City, 'id' | 'slug'>) => void;
  updateCity: (id: string, updates: Partial<City>) => void;
  deleteCity: (id: string) => void;

  // Categories
  categories: Category[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id' | 'slug'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Plans, Multi-Year Discounts & Invite Codes (6-Month Free Premium)
  plans: Plan[];
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  movePlanOrder: (id: string, direction: 'up' | 'down') => void;
  reorderPlans: (orderedIds: string[]) => void;
  planDiscountConfig: PlanDiscountConfig;
  updatePlanDiscountConfig: (updates: Partial<PlanDiscountConfig>) => void;
  resetPlanDiscountConfig: () => void;
  planInvites: PlanInvite[];
  loadPlanInvites: () => Promise<void>;
  createPlanInvite: (params: {
    code?: string;
    planId?: string;
    maxUses?: number;
    recipientHint?: string;
    expiresAt?: string;
  }) => Promise<{ success: boolean; invite?: PlanInvite; error?: string }>;
  revokePlanInvite: (id: string) => Promise<{ success: boolean; error?: string }>;
  deletePlanInvite: (id: string) => Promise<{ success: boolean; error?: string }>;
  activeInviteCode: string | null;
  validatedInvite: PlanInvite | null;
  inviteValidationError: string | null;
  validateInviteCode: (code: string) => Promise<{ valid: boolean; invite?: PlanInvite; error?: string }>;
  clearActiveInvite: () => void;
  applyInviteCodeToBusiness: (
    code: string,
    businessId: string,
    tokenOverride?: string
  ) => Promise<{ success: boolean; planExpiresAt?: string; error?: string }>;
  cancelBusinessSubscription: (businessId: string, mode: 'free' | 'pause') => void;

  // Businesses
  businesses: Business[];
  filteredBusinesses: Business[];
  addBusiness: (biz: Omit<Business, 'id' | 'slug' | 'createdAt'>) => string;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;
  registerApprovedBusinessesFromDrafts: (newBusinesses: Business[]) => void;

  // Google Maps Quota Banner Flag
  gmpQuotaExceeded: boolean;

  // Products
  products: Product[];
  filteredProducts: Product[];
  addProduct: (prod: Omit<Product, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getBusinessProductCount: (businessId: string) => number;

  // Services
  services: Service[];
  filteredServices: Service[];
  addService: (serv: Omit<Service, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  getBusinessServiceCount: (businessId: string) => number;

  // Combined Quota (Products + Services)
  getBusinessQuotaUsage: (businessId: string) => BusinessQuotaInfo;

  // Store Specific Product Categories
  storeProductCategories: StoreProductCategory[];
  addStoreProductCategory: (cat: Omit<StoreProductCategory, 'id'>) => void;
  updateStoreProductCategory: (id: string, updates: Partial<StoreProductCategory>) => void;
  deleteStoreProductCategory: (id: string) => void;

  // Independent Searches
  searchCompanyQuery: string;
  setSearchCompanyQuery: (q: string) => void;
  searchProductQuery: string;
  setSearchProductQuery: (q: string) => void;
  searchServiceQuery: string;
  setSearchServiceQuery: (q: string) => void;

  // Navigation View (Full screen screens)
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  businessPortalTab: BusinessPortalTab;
  setBusinessPortalTab: (tab: BusinessPortalTab) => void;

  // Banners System (Admin exclusive & separate billing)
  banners: AdBanner[];
  addBanner: (banner: Omit<AdBanner, 'id' | 'clicksCount'>) => void;
  updateBanner: (id: string, updates: Partial<AdBanner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerStatus: (id: string) => void;
  recordBannerClick: (id: string) => void;
  bannerPlans: BannerPlan[];
  addBannerPlan: (plan: Omit<BannerPlan, 'id'>) => void;
  updateBannerPlan: (id: string, updates: Partial<BannerPlan>) => void;
  deleteBannerPlan: (id: string) => void;
  addMerchantBanner: (banner: Omit<AdBanner, 'id' | 'clicksCount' | 'isActive'>) => { success: boolean; error?: string };

  // Auth Session System (Database-backed with expiration)
  authSession: AuthSession;
  sessionConfig: SessionConfig;
  updateSessionConfig: (updates: Partial<SessionConfig>) => void;
  renewSession: () => Promise<{ success: boolean; error?: string }>;
  authenticateAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  authenticateStoreOwner: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginDemoStoreOwner: () => Promise<{ success: boolean; error?: string }>;
  registerBusinessAndLogin: (
    biz: Omit<Business, 'id' | 'slug' | 'createdAt'>,
    navigateToPortal?: boolean
  ) => Promise<{ success: boolean; businessId?: string; business?: Business; error?: string }>;
  switchActiveBusiness: (businessId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Business portal session
  currentBusinessAuth: Business | null;
  logoutBusiness: () => void;

  // Admin Theme Customization
  adminTheme: AdminTheme;
  setAdminTheme: (theme: AdminTheme) => void;

  // Modals
  activeModal: {
    type: 'business_detail' | 'product_detail' | 'service_detail' | 'business_portal' | 'admin' | 'favorites' | 'notifications' | null;
    id?: string;
  };
  openModal: (type: 'business_detail' | 'product_detail' | 'service_detail' | 'business_portal' | 'admin' | 'favorites' | 'notifications', id?: string) => void;
  closeModal: () => void;

  // Favorites System (localStorage)
  favoriteBusinessIds: string[];
  favoriteProductIds: string[];
  favoriteServiceIds: string[];
  toggleFavoriteBusiness: (id: string) => void;
  isBusinessFavorite: (id: string) => boolean;
  toggleFavoriteProduct: (id: string) => void;
  isProductFavorite: (id: string) => boolean;
  toggleFavoriteService: (id: string) => void;
  isServiceFavorite: (id: string) => boolean;
  clearAllFavorites: () => void;
  favoriteBusinesses: Business[];
  favoriteProducts: Product[];
  favoriteServices: Service[];
  totalFavoritesCount: number;

  // Service Worker Push Notifications System
  pushPreferences: PushPreferences;
  updatePushPreferences: (updates: Partial<PushPreferences>) => void;
  pushAlerts: PushAlertLog[];
  unreadAlertsCount: number;
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: () => void;
  clearPushAlerts: () => void;
  swStatus: 'checking' | 'active' | 'unsupported' | 'error';
  notificationPermission: NotificationPermission | 'unsupported';
  pushSubscriptionActive: boolean;
  enablePushNotifications: () => Promise<{ granted: boolean; swActive: boolean; message: string }>;
  disablePushNotifications: () => Promise<void>;
  notifyFavoriteOffer: (params: {
    businessId: string;
    item: { type: 'product'; data: Product } | { type: 'service'; data: Service };
    force?: boolean;
  }) => Promise<{ sentViaSW: boolean; alert?: PushAlertLog }>;
  triggerTestFavoritePush: (itemType?: 'product' | 'service') => Promise<{ sentViaSW: boolean; alert: PushAlertLog }>;
  inAppBannerAlert: PushAlertLog | null;
  dismissInAppBannerAlert: () => void;

  // Mercado Pago Payment Gateway System
  mercadoPagoConfig: MercadoPagoConfig;
  updateMercadoPagoConfig: (updates: Partial<MercadoPagoConfig>) => void;
  paymentTransactions: PaymentTransaction[];
  paymentModalData: {
    isOpen: boolean;
    planId: string;
    businessId?: string;
    billingCycle?: BillingCycle;
  };
  openPaymentModal: (planId: string, businessId?: string, billingCycle?: BillingCycle) => void;
  closePaymentModal: () => void;
  processPlanPayment: (params: {
    businessId: string;
    planId: string;
    billingCycle?: BillingCycle;
    paymentMethod: 'pix' | 'credit_card';
    cardData?: {
      number: string;
      holderName: string;
      expiry: string;
      cvv: string;
      installments: number;
    };
    payerEmail?: string;
    mercadoPagoPayment?: {
      paymentId: string;
      status?: 'approved' | 'pending' | 'rejected';
      qrCode?: string;
      qrCodeText?: string;
      cardLastFour?: string;
      cardBrand?: string;
      installments?: number;
      paidAt?: string | null;
    };
  }) => Promise<{ success: boolean; transaction: PaymentTransaction; error?: string }>;

  // Site Mode (Normal | Launch | Maintenance) & Funnel State
  siteModeConfig: SiteModeConfig;
  setSiteMode: (mode: SiteMode) => void;
  updateSiteModeConfig: (updates: Partial<SiteModeConfig>) => void;
  updateLaunchConfig: (updates: Partial<LaunchPageConfig>) => void;
  updateMaintenanceConfig: (updates: Partial<MaintenancePageConfig>) => void;
  resetSiteModeConfig: () => void;
  adminPreviewMode: 'none' | 'launch' | 'maintenance';
  setAdminPreviewMode: (mode: 'none' | 'launch' | 'maintenance') => void;
  visitorDemoActive: boolean;
  enterVisitorDemo: (targetView?: AppView) => void;
  exitVisitorDemo: () => void;
  preselectedPlanId: string | null;
  setPreselectedPlanId: (planId: string | null) => void;
  preselectedBillingCycle: BillingCycle;
  setPreselectedBillingCycle: (cycle: BillingCycle) => void;

  // Email System (SMTP + Templates + Outbox) & Paid Checkout Page
  smtpConfig: SmtpConfig;
  updateSmtpConfig: (updates: Partial<SmtpConfig>) => void;
  emailTemplates: Record<EmailTemplateKey, EmailTemplate>;
  updateEmailTemplate: (key: EmailTemplateKey, updates: Partial<EmailTemplate>) => void;
  resetEmailTemplates: () => void;
  emailLogs: EmailLogEntry[];
  clearEmailLogs: () => void;
  sendTemplatedEmail: (params: {
    key: EmailTemplateKey;
    to: string;
    variables: Record<string, string>;
    actionUrl?: string;
    highlightCode?: string;
  }) => Promise<{ logEntry?: EmailLogEntry; deliveredViaSmtp: boolean; skipped?: boolean; error?: string }>;
  sendVerificationCodeEmail: (params: {
    to: string;
    businessId?: string;
    businessName?: string;
    cityName?: string;
  }) => Promise<{ success: boolean; code?: string; deliveredViaSmtp: boolean; error?: string; logEntry?: EmailLogEntry }>;
  verifyEmailCode: (
    email: string,
    code: string,
    businessId?: string
  ) => Promise<{ valid: boolean; error?: string }>;
  checkoutTarget: CheckoutTarget | null;
  openCheckoutPage: (
    businessId: string,
    planId: string,
    token?: string,
    billingCycle?: BillingCycle
  ) => void;

  // General App Config & SEO (Persisted in app_settings)
  appGeneralConfig: AppGeneralConfig;
  updateAppGeneralConfig: (updates: Partial<AppGeneralConfig>) => void;
  resetAppGeneralConfig: () => void;

  // Real Business Metrics (Persisted in MySQL & localStorage, starts at 0)
  trackBusinessMetric: (businessId: string, eventType: BusinessMetricEventType) => void;
  getBusinessMetrics: (businessId: string) => BusinessMetricsSummary;
  loadBusinessMetricsFromDb: (businessId: string) => Promise<void>;

  // MySQL / MariaDB Persistence Status & Controls
  dbSyncStatus: 'checking' | 'connected' | 'local_only' | 'error';
  dbLastError: string | null;
  dbLastSyncedAt: string | null;
  refreshFromDatabase: () => Promise<{ success: boolean; error?: string }>;
  syncAllToDatabaseNow: () => Promise<{ success: boolean; error?: string }>;

  // Reset to default
  resetToDemoData: () => void;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

const METRICS_STORAGE_KEY = 'achenacidade_business_metrics_v1';
const METRIC_WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type LocalBusinessMetricsStore = Record<
  string,
  Record<string, { views: number; whatsappClicks: number; showcaseClicks: number }>
>;

function getClientSaoPauloDateKey(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function buildClientLast7Days(referenceDate = new Date()): Array<{ date: string; label: string }> {
  const todayKey = getClientSaoPauloDateKey(referenceDate);
  const [y, m, d] = todayKey.split('-').map(Number);
  const baseUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const result: Array<{ date: string; label: string }> = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dt = new Date(baseUtc.getTime() - offset * 86400000);
    const key = dt.toISOString().slice(0, 10);
    const label = METRIC_WEEKDAYS[dt.getUTCDay()];
    result.push({ date: key, label });
  }
  return result;
}

function isLoginAdminPath(
  pathname = typeof window !== 'undefined' ? window.location.pathname : ''
): boolean {
  return pathname.replace(/\/+$/, '').toLowerCase() === '/loginadmin';
}

function isFounderSalesPath(
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/'
): boolean {
  return pathname.replace(/\/+$/, '').toLowerCase() === '/socio-fundador';
}

function isBannerAdPagePath(
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/'
): boolean {
  return pathname.replace(/\/+$/, '').toLowerCase() === '/anunciar-banner';
}

function sortPlansList(list: Plan[]): Plan[] {
  return list
    .map((plan, index) => ({ plan, index }))
    .sort((a, b) => {
      const ao = typeof a.plan.sortOrder === 'number' && a.plan.sortOrder > 0 ? a.plan.sortOrder : a.index + 1000;
      const bo = typeof b.plan.sortOrder === 'number' && b.plan.sortOrder > 0 ? b.plan.sortOrder : b.index + 1000;
      if (ao !== bo) return ao - bo;
      return a.index - b.index;
    })
    .map((entry) => entry.plan);
}

function mergePlansWithSystemDefaults(existingPlans: Plan[]): {
  merged: Plan[];
  addedMissing: Plan[];
} {
  const byId = new Map<string, Plan>();
  for (let i = 0; i < existingPlans.length; i++) {
    const p = existingPlans[i];
    const sys = initialPlans.find((ip) => ip.id === p.id);
    if (sys) {
      const resolvedInviteOnly = p.isInviteOnly !== undefined ? p.isInviteOnly : sys.isInviteOnly;
      byId.set(p.id, {
        ...sys,
        ...p,
        billingType: p.billingType || sys.billingType,
        priceOnce: p.priceOnce !== undefined ? p.priceOnce : sys.priceOnce,
        trialMonths: p.trialMonths !== undefined ? p.trialMonths : sys.trialMonths,
        isInviteOnly: resolvedInviteOnly,
        vipTier: p.vipTier || sys.vipTier,
        sortOrder: typeof p.sortOrder === 'number' && p.sortOrder > 0 ? p.sortOrder : i + 1,
        showOnHome: resolvedInviteOnly
          ? false
          : p.showOnHome !== undefined
          ? p.showOnHome
          : sys.showOnHome ?? true,
      });
    } else {
      const resolvedInviteOnly = Boolean(p.isInviteOnly);
      byId.set(p.id, {
        ...p,
        billingType: p.billingType || 'recurring',
        vipTier: p.vipTier || (p.highlighted ? 'premium' : 'none'),
        sortOrder: typeof p.sortOrder === 'number' && p.sortOrder > 0 ? p.sortOrder : i + 1,
        showOnHome: resolvedInviteOnly ? false : p.showOnHome !== undefined ? p.showOnHome : true,
      });
    }
  }

  const addedMissing: Plan[] = [];
  for (const sysPlan of initialPlans) {
    if (!byId.has(sysPlan.id)) {
      byId.set(sysPlan.id, {
        ...sysPlan,
        sortOrder: existingPlans.length + addedMissing.length + 1,
      });
      addedMissing.push(sysPlan);
    }
  }

  // Keep existing order, append any newly introduced system plans, then respect explicit sortOrder
  const orderedIds = existingPlans.map((p) => p.id);
  for (const sysPlan of initialPlans) {
    if (!orderedIds.includes(sysPlan.id)) {
      orderedIds.push(sysPlan.id);
    }
  }

  const combined = orderedIds.map((id) => byId.get(id)!).filter(Boolean);
  return {
    merged: sortPlansList(combined),
    addedMissing,
  };
}

export const DirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbSyncStatus, setDbSyncStatus] = useState<'checking' | 'connected' | 'local_only' | 'error'>('checking');
  const [dbLastError, setDbLastError] = useState<string | null>(null);
  const [dbLastSyncedAt, setDbLastSyncedAt] = useState<string | null>(null);
  const isLocalOnlyRef = useRef(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  const trackDbMutation = (mutationPromise: Promise<ApiMutationResult>) => {
    if (isLocalOnlyRef.current) return;
    void mutationPromise.then((res) => {
      if (!res.ok) {
        setDbLastError(res.error || 'Falha ao gravar alteração no banco MySQL.');
        setDbSyncStatus('error');
        return;
      }
      if (res.databaseEnabled) {
        setDbLastError(null);
        setDbSyncStatus('connected');
        setDbLastSyncedAt(new Date().toLocaleTimeString('pt-BR'));
      } else {
        isLocalOnlyRef.current = true;
        setDbLastError(null);
        setDbSyncStatus('local_only');
      }
    });
  };

  // Load initial from localStorage or fall back to defaults (with one-time Alagoinhas - BA launch migration)
  const [cities, setCities] = useState<City[]>(() => {
    try {
      const migrated = localStorage.getItem('achenacidade_launch_alagoinhas_v1');
      const saved = localStorage.getItem('achenacidade_cities');
      if (!saved) return initialCities;
      const parsed: City[] = JSON.parse(saved);
      if (!migrated) {
        const customCities = parsed.filter(
          (c) => !['city-1', 'city-2', 'city-3', 'city-4'].includes(c.id)
        );
        const merged = [...initialCities, ...customCities.map((c) => ({ ...c, isDefault: false }))];
        localStorage.setItem('achenacidade_cities', JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return initialCities;
    }
  });

  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    const defaultCity = cities.find((c) => c.isActive && c.isDefault) || cities.find((c) => c.isActive) || cities[0];
    return defaultCity ? defaultCity.id : 'all';
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const migratedV2 = localStorage.getItem('achenacidade_categories_seed_v2');
      const saved = localStorage.getItem('achenacidade_categories');
      if (!saved) {
        localStorage.setItem('achenacidade_categories_seed_v2', 'true');
        return initialCategories;
      }
      const parsed: Category[] = JSON.parse(saved);
      if (!migratedV2) {
        const existingIds = new Set(parsed.map((c) => c.id));
        const newDefaults = initialCategories.filter((ic) => !existingIds.has(ic.id));
        const merged = [...parsed, ...newDefaults];
        localStorage.setItem('achenacidade_categories', JSON.stringify(merged));
        localStorage.setItem('achenacidade_categories_seed_v2', 'true');
        return merged;
      }
      return parsed;
    } catch {
      return initialCategories;
    }
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const [plans, setPlans] = useState<Plan[]>(() => {
    try {
      const migrated = localStorage.getItem('achenacidade_plans_v3_founder_invite');
      const saved = localStorage.getItem('achenacidade_plans');
      if (!saved) {
        localStorage.setItem('achenacidade_plans_v3_founder_invite', 'true');
        return initialPlans;
      }
      const parsed: Plan[] = JSON.parse(saved);
      const { merged } = mergePlansWithSystemDefaults(parsed);
      if (!migrated) {
        localStorage.setItem('achenacidade_plans', JSON.stringify(merged));
        localStorage.setItem('achenacidade_plans_v3_founder_invite', 'true');
      }
      return merged;
    } catch {
      return initialPlans;
    }
  });

  // Plan Invites (Admin-generated codes/links for Convite Premium 6 Meses)
  const [planInvites, setPlanInvites] = useState<PlanInvite[]>([]);
  const [activeInviteCode, setActiveInviteCode] = useState<string | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      const params = new URLSearchParams(window.location.search);
      const code = params.get('convite');
      return code ? code.trim().toUpperCase() : null;
    } catch {
      return null;
    }
  });
  const [validatedInvite, setValidatedInvite] = useState<PlanInvite | null>(null);
  const [inviteValidationError, setInviteValidationError] = useState<string | null>(null);

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const migrated = localStorage.getItem('achenacidade_launch_alagoinhas_v1');
      const saved = localStorage.getItem('achenacidade_businesses');
      if (!saved) {
        localStorage.setItem('achenacidade_launch_alagoinhas_v1', 'true');
        return initialBusinesses;
      }
      const parsed: Business[] = JSON.parse(saved);
      if (!migrated) {
        const updated = parsed.map((b) => {
          if (b.id === 'biz-1' && b.neighborhood === 'Cambuí') {
            return initialBusinesses.find((ib) => ib.id === 'biz-1') || b;
          }
          if (b.id === 'biz-2' && b.neighborhood === 'Nova Campinas') {
            return initialBusinesses.find((ib) => ib.id === 'biz-2') || b;
          }
          if (b.id === 'biz-3' && b.slug === 'techfix-campinas') {
            return initialBusinesses.find((ib) => ib.id === 'biz-3') || b;
          }
          if (b.id === 'biz-4' && b.neighborhood === 'Bonfim') {
            return initialBusinesses.find((ib) => ib.id === 'biz-4') || b;
          }
          return b;
        });
        localStorage.setItem('achenacidade_businesses', JSON.stringify(updated));
        localStorage.setItem('achenacidade_launch_alagoinhas_v1', 'true');
        return updated;
      }
      return parsed;
    } catch {
      return initialBusinesses;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_products');
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_services');
      return saved ? JSON.parse(saved) : initialServices;
    } catch {
      return initialServices;
    }
  });

  const [storeProductCategories, setStoreProductCategories] = useState<StoreProductCategory[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_store_prod_cats');
      return saved ? JSON.parse(saved) : initialStoreProductCategories;
    } catch {
      return initialStoreProductCategories;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_store_prod_cats', JSON.stringify(storeProductCategories));
  }, [storeProductCategories]);

  const [adminTheme, setAdminThemeState] = useState<AdminTheme>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_theme');
      return saved ? JSON.parse(saved) : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  // Searches (Independent)
  const [searchCompanyQuery, setSearchCompanyQuery] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [searchServiceQuery, setSearchServiceQuery] = useState('');

  // Business Authentication for portal
  const [currentBusinessAuth, setCurrentBusinessAuth] = useState<Business | null>(null);

  // Favorites System (Persisted in localStorage)
  const [favoriteBusinessIds, setFavoriteBusinessIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_fav_businesses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_fav_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteServiceIds, setFavoriteServiceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_fav_services');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Push Notification Preferences & History (Service Worker)
  const defaultPushPreferences: PushPreferences = {
    enabled: false,
    cityScope: 'alagoinhas_only',
    notifyNewOffers: true,
    notifyNewServices: true,
    favoritesOnly: true,
    vapidPublicKey: '',
  };

  const [pushPreferences, setPushPreferences] = useState<PushPreferences>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_push_prefs');
      return saved ? { ...defaultPushPreferences, ...JSON.parse(saved) } : defaultPushPreferences;
    } catch {
      return defaultPushPreferences;
    }
  });

  const [pushAlerts, setPushAlerts] = useState<PushAlertLog[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_push_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [swStatus, setSwStatus] = useState<'checking' | 'active' | 'unsupported' | 'error'>('checking');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermissionState()
  );
  const [pushSubscriptionActive, setPushSubscriptionActive] = useState(false);
  const [inAppBannerAlert, setInAppBannerAlert] = useState<PushAlertLog | null>(null);

  useEffect(() => {
    localStorage.setItem('achenacidade_push_prefs', JSON.stringify(pushPreferences));
  }, [pushPreferences]);

  useEffect(() => {
    localStorage.setItem('achenacidade_push_alerts', JSON.stringify(pushAlerts));
  }, [pushAlerts]);

  // Full Screen Navigation State with History Support for Mobile Back Button
  const [currentView, setCurrentViewState] = useState<AppView>(() =>
    isLoginAdminPath() ? 'admin_login' : isFounderSalesPath() ? 'founder_sales' : isBannerAdPagePath() ? 'banner_ad_page' : 'home'
  );
  const [businessPortalTab, setBusinessPortalTab] = useState<BusinessPortalTab>('dashboard');

  const setCurrentView = (view: AppView, replace: boolean = false) => {
    setCurrentViewState((prev) => {
      const targetUrl =
        view === 'admin_login'
          ? '/loginadmin'
          : view === 'founder_sales'
          ? '/socio-fundador'
          : view === 'banner_ad_page'
          ? '/anunciar-banner'
          : (isLoginAdminPath() && view !== 'admin') || isFounderSalesPath() || isBannerAdPagePath()
          ? '/'
          : null;

      if (prev !== view || targetUrl) {
        if (targetUrl) {
          if (replace) {
            window.history.replaceState({ view, modal: null }, '', targetUrl);
          } else {
            window.history.pushState({ view, modal: null }, '', targetUrl);
          }
        } else {
          if (replace) {
            window.history.replaceState({ view, modal: null }, '');
          } else {
            window.history.pushState({ view, modal: null }, '');
          }
        }
      }
      return view;
    });
  };

  // Ad Banners State
  const [banners, setBanners] = useState<AdBanner[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_banners');
      if (!saved) return initialBanners;
      const parsed = JSON.parse(saved) as AdBanner[];
      return Array.isArray(parsed)
        ? parsed.map((b) => ({ ...b, priceMonthly: 0 }))
        : initialBanners;
    } catch {
      return initialBanners;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_banners', JSON.stringify(banners));
  }, [banners]);

  // Banner Pricing Plans State
  const [bannerPlans, setBannerPlans] = useState<BannerPlan[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_banner_plans');
      return saved ? JSON.parse(saved) : initialBannerPlans;
    } catch {
      return initialBannerPlans;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_banner_plans', JSON.stringify(bannerPlans));
  }, [bannerPlans]);

  const addBannerPlan = (planData: Omit<BannerPlan, 'id'>) => {
    const newPlan: BannerPlan = {
      ...planData,
      id: `bplan-${Date.now()}`,
    };
    setBannerPlans((prev) => {
      const next = [...prev, newPlan];
      trackDbMutation(saveSettingToDb('bannerPlans', next));
      return next;
    });
  };

  const updateBannerPlan = (id: string, updates: Partial<BannerPlan>) => {
    setBannerPlans((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      trackDbMutation(saveSettingToDb('bannerPlans', next));
      return next;
    });
  };

  const deleteBannerPlan = (id: string) => {
    setBannerPlans((prev) => {
      const next = prev.filter((p) => p.id !== id);
      trackDbMutation(saveSettingToDb('bannerPlans', next));
      return next;
    });
  };

  const addMerchantBanner = (bannerData: Omit<AdBanner, 'id' | 'clicksCount' | 'isActive'>): { success: boolean; error?: string } => {
    const newBanner: AdBanner = {
      ...bannerData,
      id: `banner-${Date.now()}`,
      clicksCount: 0,
      isActive: true,
    };
    setBanners((prev) => [newBanner, ...prev]);
    trackDbMutation(createEntityInDb('banners', newBanner));
    return { success: true };
  };

  // Session Configuration (Configurable in Admin)
  const defaultSessionConfig: SessionConfig = {
    adminSessionDurationMinutes: 120, // 2 hours
    businessSessionDurationMinutes: 1440, // 24 hours
  };

  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_session_config');
      return saved ? JSON.parse(saved) : defaultSessionConfig;
    } catch {
      return defaultSessionConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_session_config', JSON.stringify(sessionConfig));
  }, [sessionConfig]);

  const updateSessionConfig = (updates: Partial<SessionConfig>) => {
    const next = { ...sessionConfig, ...updates };
    setSessionConfig(next);
    trackDbMutation(saveSettingToDb('sessionConfig', next));
  };

  // Site Mode Config (Normal | Launch | Maintenance)
  const [siteModeConfig, setSiteModeConfig] = useState<SiteModeConfig>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_site_mode_config');
      if (!saved) return defaultSiteModeConfig;
      const parsed = JSON.parse(saved);
      return {
        ...defaultSiteModeConfig,
        ...parsed,
        launch: {
          ...defaultSiteModeConfig.launch,
          ...(parsed.launch || {}),
        },
        maintenance: {
          ...defaultSiteModeConfig.maintenance,
          ...(parsed.maintenance || {}),
        },
      };
    } catch {
      return defaultSiteModeConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_site_mode_config', JSON.stringify(siteModeConfig));
  }, [siteModeConfig]);

  const setSiteMode = (mode: SiteMode) => {
    const next = { ...siteModeConfig, mode };
    setSiteModeConfig(next);
    trackDbMutation(saveSettingToDb('siteModeConfig', next));
  };

  const updateSiteModeConfig = (updates: Partial<SiteModeConfig>) => {
    const next = { ...siteModeConfig, ...updates };
    setSiteModeConfig(next);
    trackDbMutation(saveSettingToDb('siteModeConfig', next));
  };

  const updateLaunchConfig = (updates: Partial<LaunchPageConfig>) => {
    const next: SiteModeConfig = {
      ...siteModeConfig,
      launch: { ...siteModeConfig.launch, ...updates },
    };
    setSiteModeConfig(next);
    trackDbMutation(saveSettingToDb('siteModeConfig', next));
  };

  const updateMaintenanceConfig = (updates: Partial<MaintenancePageConfig>) => {
    const next: SiteModeConfig = {
      ...siteModeConfig,
      maintenance: { ...siteModeConfig.maintenance, ...updates },
    };
    setSiteModeConfig(next);
    trackDbMutation(saveSettingToDb('siteModeConfig', next));
  };

  const resetSiteModeConfig = () => {
    setSiteModeConfig(defaultSiteModeConfig);
    trackDbMutation(saveSettingToDb('siteModeConfig', defaultSiteModeConfig));
  };

  const [adminPreviewMode, setAdminPreviewMode] = useState<'none' | 'launch' | 'maintenance'>('none');
  const [visitorDemoActive, setVisitorDemoActive] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('achenacidade_visitor_demo') === '1';
    } catch {
      return false;
    }
  });
  const [preselectedPlanId, setPreselectedPlanId] = useState<string | null>(null);
  const [preselectedBillingCycle, setPreselectedBillingCycle] = useState<BillingCycle>('monthly');

  const enterVisitorDemo = (targetView: AppView = 'home') => {
    setVisitorDemoActive(true);
    try {
      sessionStorage.setItem('achenacidade_visitor_demo', '1');
    } catch {
      // Ignore sessionStorage errors
    }
    setAdminPreviewMode('none');
    setCurrentView(targetView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitVisitorDemo = () => {
    setVisitorDemoActive(false);
    try {
      sessionStorage.removeItem('achenacidade_visitor_demo');
    } catch {
      // Ignore sessionStorage errors
    }
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Multi-Year Plan Discounts Configuration (Annual, Biennial, Triennial)
  const [planDiscountConfig, setPlanDiscountConfig] = useState<PlanDiscountConfig>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_plan_discount_config');
      if (!saved) return defaultPlanDiscountConfig;
      const parsed = JSON.parse(saved);
      return {
        annual: clampDiscountPercent(parsed.annual ?? defaultPlanDiscountConfig.annual),
        biennial: clampDiscountPercent(parsed.biennial ?? defaultPlanDiscountConfig.biennial),
        triennial: clampDiscountPercent(parsed.triennial ?? defaultPlanDiscountConfig.triennial),
      };
    } catch {
      return defaultPlanDiscountConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_plan_discount_config', JSON.stringify(planDiscountConfig));
  }, [planDiscountConfig]);

  const updatePlanDiscountConfig = (updates: Partial<PlanDiscountConfig>) => {
    const next: PlanDiscountConfig = {
      annual: updates.annual !== undefined ? clampDiscountPercent(updates.annual) : planDiscountConfig.annual,
      biennial: updates.biennial !== undefined ? clampDiscountPercent(updates.biennial) : planDiscountConfig.biennial,
      triennial: updates.triennial !== undefined ? clampDiscountPercent(updates.triennial) : planDiscountConfig.triennial,
    };
    setPlanDiscountConfig(next);
    trackDbMutation(saveSettingToDb('planDiscountConfig', next));
  };

  const resetPlanDiscountConfig = () => {
    setPlanDiscountConfig(defaultPlanDiscountConfig);
    trackDbMutation(saveSettingToDb('planDiscountConfig', defaultPlanDiscountConfig));
  };

  // General App Config & SEO (Identity, WhatsApp, WhatsApp Group, Social Links & SEO)
  const [appGeneralConfig, setAppGeneralConfig] = useState<AppGeneralConfig>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_app_general_config');
      return saved ? { ...defaultAppGeneralConfig, ...JSON.parse(saved) } : defaultAppGeneralConfig;
    } catch {
      return defaultAppGeneralConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_app_general_config', JSON.stringify(appGeneralConfig));
    applySeoToDocumentHead(appGeneralConfig);
  }, [appGeneralConfig]);

  const updateAppGeneralConfig = (updates: Partial<AppGeneralConfig>) => {
    const next: AppGeneralConfig = { ...appGeneralConfig, ...updates };
    setAppGeneralConfig(next);
    trackDbMutation(saveSettingToDb('appGeneralConfig', next));
  };

  const resetAppGeneralConfig = () => {
    setAppGeneralConfig(defaultAppGeneralConfig);
    trackDbMutation(saveSettingToDb('appGeneralConfig', defaultAppGeneralConfig));
  };

  // Mercado Pago Configuration
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState<MercadoPagoConfig>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_mercadopago_config');
      return saved ? JSON.parse(saved) : defaultMercadoPagoConfig;
    } catch {
      return defaultMercadoPagoConfig;
    }
  });

  useEffect(() => {
    const safeForStorage: MercadoPagoConfig = {
      ...mercadoPagoConfig,
      accessToken: '',
      hasAccessToken: Boolean(mercadoPagoConfig.hasAccessToken || mercadoPagoConfig.accessToken),
    };
    localStorage.setItem('achenacidade_mercadopago_config', JSON.stringify(safeForStorage));
  }, [mercadoPagoConfig]);


  const updateMercadoPagoConfig = (updates: Partial<MercadoPagoConfig>) => {
    const incomingToken = typeof updates.accessToken === 'string' ? updates.accessToken.trim() : '';
    const hasNewToken = Boolean(incomingToken && !incomingToken.includes('••••'));
    const serverPayload: MercadoPagoConfig = {
      ...mercadoPagoConfig,
      ...updates,
      accessToken: hasNewToken ? incomingToken : mercadoPagoConfig.accessToken || '',
    };
    const safeClientState: MercadoPagoConfig = {
      ...serverPayload,
      accessToken: '',
      hasAccessToken: hasNewToken || Boolean(mercadoPagoConfig.hasAccessToken || serverPayload.accessToken),
    };
    setMercadoPagoConfig(safeClientState);
    trackDbMutation(saveSettingToDb('mercadoPagoConfig', serverPayload, authSession.token || undefined));
  };

  // Payment Transactions History
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_payment_transactions');
      if (!saved) return initialPaymentTransactions;
      const parsed = JSON.parse(saved) as PaymentTransaction[];
      return Array.isArray(parsed)
        ? parsed.filter((tx) => tx.id !== 'tx-mp-01' && tx.id !== 'tx-mp-02')
        : initialPaymentTransactions;
    } catch {
      return initialPaymentTransactions;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_payment_transactions', JSON.stringify(paymentTransactions));
  }, [paymentTransactions]);

  // Payment Modal State
  const [paymentModalData, setPaymentModalData] = useState<{
    isOpen: boolean;
    planId: string;
    businessId?: string;
    billingCycle?: BillingCycle;
  }>({
    isOpen: false,
    planId: '',
    billingCycle: 'monthly',
  });

  const openPaymentModal = (
    planId: string,
    businessId?: string,
    billingCycle: BillingCycle = preselectedBillingCycle
  ) => {
    setPaymentModalData({ isOpen: true, planId, businessId, billingCycle });
  };

  const closePaymentModal = () => {
    setPaymentModalData({ isOpen: false, planId: '', billingCycle: 'monthly' });
  };

  // Email System (SMTP + 4 Editable Templates + Outbox Logs) & Paid Checkout
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_smtp_config');
      return saved ? { ...defaultSmtpConfig, ...JSON.parse(saved) } : defaultSmtpConfig;
    } catch {
      return defaultSmtpConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_smtp_config', JSON.stringify(smtpConfig));
  }, [smtpConfig]);

  const updateSmtpConfig = (updates: Partial<SmtpConfig>) => {
    const next = { ...smtpConfig, ...updates };
    setSmtpConfig(next);
    trackDbMutation(saveSettingToDb('smtpConfig', next));
  };

  const [emailTemplates, setEmailTemplates] = useState<Record<EmailTemplateKey, EmailTemplate>>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_email_templates');
      if (!saved) return defaultEmailTemplates;
      const parsed = JSON.parse(saved);
      return {
        email_verification: { ...defaultEmailTemplates.email_verification, ...(parsed.email_verification || {}) },
        payment_link: { ...defaultEmailTemplates.payment_link, ...(parsed.payment_link || {}) },
        welcome: { ...defaultEmailTemplates.welcome, ...(parsed.welcome || {}) },
        payment_approved: { ...defaultEmailTemplates.payment_approved, ...(parsed.payment_approved || {}) },
      };
    } catch {
      return defaultEmailTemplates;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_email_templates', JSON.stringify(emailTemplates));
  }, [emailTemplates]);

  const updateEmailTemplate = (key: EmailTemplateKey, updates: Partial<EmailTemplate>) => {
    const next = {
      ...emailTemplates,
      [key]: { ...emailTemplates[key], ...updates },
    };
    setEmailTemplates(next);
    trackDbMutation(saveSettingToDb('emailTemplates', next));
  };

  const resetEmailTemplates = () => {
    setEmailTemplates(defaultEmailTemplates);
    trackDbMutation(saveSettingToDb('emailTemplates', defaultEmailTemplates));
  };

  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_email_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_email_logs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  const clearEmailLogs = () => {
    setEmailLogs([]);
    trackDbMutation(deleteEntityInDb('emailLogs', 'all'));
  };

  const sendTemplatedEmail = async (params: {
    key: EmailTemplateKey;
    to: string;
    variables: Record<string, string>;
    actionUrl?: string;
    highlightCode?: string;
  }): Promise<{ logEntry?: EmailLogEntry; deliveredViaSmtp: boolean; skipped?: boolean; error?: string }> => {
    const template = emailTemplates[params.key];
    if (!template || !template.enabled) {
      return { deliveredViaSmtp: false, skipped: true };
    }

    const result = await dispatchTransactionalEmail({
      template,
      templateKey: params.key,
      to: params.to,
      variables: params.variables,
      smtpConfig,
      actionUrl: params.actionUrl,
      highlightCode: params.highlightCode,
    });

    setEmailLogs((prev) => [result.logEntry, ...prev].slice(0, 60));
    trackDbMutation(createEntityInDb('emailLogs', result.logEntry));
    return result;
  };

  const sendVerificationCodeEmail = async (params: {
    to: string;
    businessId?: string;
    businessName?: string;
    cityName?: string;
  }): Promise<{ success: boolean; code?: string; deliveredViaSmtp: boolean; error?: string; logEntry?: EmailLogEntry }> => {
    const res = await issueVerificationCodeViaApi({
      email: params.to.trim(),
      businessId: params.businessId,
      businessName: params.businessName,
      cityName: params.cityName,
      smtp: smtpConfig,
      template: emailTemplates.email_verification,
    });

    const now = new Date();
    const deliveryMode: 'smtp' | 'local_fallback' =
      res.deliveryMode === 'smtp' ? 'smtp' : 'local_fallback';
    const logEntry: EmailLogEntry = {
      id: `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to: params.to.trim(),
      templateKey: 'email_verification',
      templateName: emailTemplates.email_verification.name,
      subject: res.subject || 'Código de verificação no achenacidade',
      htmlBody:
        deliveryMode === 'smtp'
          ? `<p>Código de validação enviado via SMTP para ${params.to.trim()}.</p>`
          : `<p>Código de validação gerado em modo local para ${params.to.trim()}.</p>`,
      textBody:
        deliveryMode === 'smtp'
          ? `Código de validação enviado via SMTP para ${params.to.trim()}.`
          : `Código de validação gerado em modo local: ${res.debugCode || ''}`,
      verificationCode: res.debugCode,
      deliveryMode,
      status: res.success ? 'sent' : 'failed',
      errorMessage: res.error,
      createdAt: `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`,
    };

    setEmailLogs((prev) => [logEntry, ...prev].slice(0, 60));
    trackDbMutation(createEntityInDb('emailLogs', logEntry));

    return {
      success: res.success,
      code: res.debugCode,
      deliveredViaSmtp: deliveryMode === 'smtp' && res.success,
      error: res.error,
      logEntry,
    };
  };

  const verifyEmailCode = async (
    email: string,
    code: string,
    businessId?: string
  ): Promise<{ valid: boolean; error?: string }> => {
    const res = await verifyEmailCodeViaApi({ email, code, businessId });
    if (!res.valid) {
      return { valid: false, error: res.error || 'Código inválido.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const targetId = businessId || res.businessId;
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === targetId ||
        b.email?.trim().toLowerCase() === normalizedEmail ||
        b.ownerEmail?.trim().toLowerCase() === normalizedEmail
          ? { ...b, emailVerified: true }
          : b
      )
    );
    setCurrentBusinessAuth((prev) =>
      prev &&
      (prev.id === targetId ||
        prev.email?.trim().toLowerCase() === normalizedEmail ||
        prev.ownerEmail?.trim().toLowerCase() === normalizedEmail)
        ? { ...prev, emailVerified: true }
        : prev
    );

    return { valid: true };
  };

  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);

  const openCheckoutPage = (
    businessId: string,
    planId: string,
    token?: string,
    billingCycle?: BillingCycle
  ) => {
    setCheckoutTarget({ businessId, planId, token, billingCycle });
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Support deep-links sent in Payment Link, Welcome emails, or Invite links (?convite=CODIGO)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const isCheckout = searchParams.get('checkout') === '1';
      const bizId = searchParams.get('businessId');
      const pId = searchParams.get('planId');
      const token = searchParams.get('token') || undefined;
      const cycleParam = searchParams.get('cycle');
      const inviteParam = searchParams.get('convite');

      if (isCheckout && bizId && pId) {
        setCheckoutTarget({
          businessId: bizId,
          planId: pId,
          token,
          billingCycle: cycleParam ? parseBillingCycleParam(cycleParam) : undefined,
        });
        setCurrentViewState('checkout');
      } else if (inviteParam && inviteParam.trim() && !isLoginAdminPath()) {
        const normalizedCode = inviteParam.trim().toUpperCase();
        setActiveInviteCode(normalizedCode);
        setPreselectedPlanId('plan-invite-premium-6m');
        void validatePlanInviteViaApi(normalizedCode).then((res) => {
          if (res.valid && res.invite) {
            setValidatedInvite(res.invite);
            setInviteValidationError(null);
            setPreselectedPlanId(res.invite.planId || 'plan-invite-premium-6m');
          } else {
            setValidatedInvite(null);
            setInviteValidationError(res.error || 'Código de convite inválido ou expirado.');
          }
        });
        // Route logged-in merchant directly to Plan tab, otherwise to Store Registration with invite preloaded
        let isBizLoggedIn = false;
        try {
          const rawAuth = localStorage.getItem('achenacidade_auth');
          if (rawAuth) {
            const parsedAuth = JSON.parse(rawAuth);
            isBizLoggedIn = Boolean(
              parsedAuth?.isAuthenticated &&
                parsedAuth?.role === 'business' &&
                (!parsedAuth?.expiresAt || Date.now() < parsedAuth.expiresAt)
            );
          }
        } catch {
          isBizLoggedIn = false;
        }
        if (isBizLoggedIn) {
          setCurrentViewState('business_portal');
          setBusinessPortalTab('plans');
        } else {
          setCurrentViewState('register_store');
        }
      } else if (
        (searchParams.get('socio-fundador') === '1' ||
          searchParams.get('plano') === 'socio-fundador') &&
        !isLoginAdminPath()
      ) {
        setCurrentViewState('founder_sales');
      } else if (searchParams.get('cadastro') === 'gratis' && !isLoginAdminPath()) {
        setPreselectedPlanId('plan-free');
        setCurrentViewState('register_store');
      } else if (searchParams.get('painel') === '1' && !isLoginAdminPath()) {
        setCurrentViewState('login');
      }
    } catch {
      // Ignore malformed URL query
    }
  }, []);

  // Process Plan Payment with automatic instant activation, cycle discount & transaction receipt
  const processPlanPayment = async (params: {
    businessId: string;
    planId: string;
    billingCycle?: BillingCycle;
    paymentMethod: 'pix' | 'credit_card';
    cardData?: {
      number: string;
      holderName: string;
      expiry: string;
      cvv: string;
      installments: number;
    };
    payerEmail?: string;
    mercadoPagoPayment?: {
      paymentId: string;
      status?: 'approved' | 'pending' | 'rejected';
      qrCode?: string;
      qrCodeText?: string;
      cardLastFour?: string;
      cardBrand?: string;
      installments?: number;
      paidAt?: string | null;
    };
  }): Promise<{ success: boolean; transaction: PaymentTransaction; error?: string }> => {
    const targetBusiness = businesses.find((b) => b.id === params.businessId);
    const targetPlan = plans.find((p) => p.id === params.planId);

    if (!targetBusiness || !targetPlan) {
      return {
        success: false,
        transaction: null as any,
        error: 'Empresa ou plano selecionado não encontrado.',
      };
    }

    const effectiveCycle: BillingCycle =
      params.billingCycle || targetBusiness.pendingBillingCycle || 'monthly';
    const pricing = calculatePlanPricing(targetPlan, effectiveCycle, planDiscountConfig);
    const lifetime = isLifetimePlan(targetPlan);
    const planLabelWithCycle = lifetime
      ? `${targetPlan.name} (Vitalício · Pagamento Único)`
      : pricing.months > 1
      ? `${targetPlan.name} (${pricing.shortLabel}${
          pricing.discountPercent > 0 ? ` · ${pricing.discountPercent}% OFF` : ''
        })`
      : targetPlan.name;

    const mpPaymentId =
      params.mercadoPagoPayment?.paymentId ||
      'MP-' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const txId = `tx-${Date.now()}`;
    const now = new Date();
    const nowStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');

    const cardLastFour =
      params.mercadoPagoPayment?.cardLastFour ||
      (params.cardData?.number ? params.cardData.number.replace(/\s+/g, '').slice(-4) : undefined);
    let cardBrand = params.mercadoPagoPayment?.cardBrand || 'Mastercard';
    if (!params.mercadoPagoPayment?.cardBrand) {
      if (params.cardData?.number.startsWith('4')) cardBrand = 'Visa';
      else if (params.cardData?.number.startsWith('5')) cardBrand = 'Mastercard';
      else if (params.cardData?.number.startsWith('6')) cardBrand = 'Elo';
      else if (params.cardData?.number.startsWith('3')) cardBrand = 'Amex';
    }

    const newTransaction: PaymentTransaction = {
      id: txId,
      businessId: targetBusiness.id,
      businessName: targetBusiness.name,
      planId: targetPlan.id,
      planName: planLabelWithCycle,
      billingCycle: effectiveCycle,
      cycleMonths: pricing.months,
      baseAmount: pricing.baseTotal,
      discountPercent: pricing.discountPercent,
      discountAmount: pricing.discountAmount,
      amount: pricing.totalAmount,
      paymentMethod: params.paymentMethod,
      status: params.mercadoPagoPayment?.status || 'approved',
      mercadoPagoPaymentId: mpPaymentId,
      qrCode: params.mercadoPagoPayment?.qrCode,
      qrCodeText: params.mercadoPagoPayment?.qrCodeText,
      installments:
        params.paymentMethod === 'credit_card'
          ? params.mercadoPagoPayment?.installments || params.cardData?.installments || 1
          : 1,
      cardLastFour,
      cardBrand: params.paymentMethod === 'credit_card' ? cardBrand : undefined,
      payerEmail: params.payerEmail || targetBusiness.ownerEmail || targetBusiness.email || 'lojista@achenacidade.com.br',
      createdAt: nowStr,
      paidAt: params.mercadoPagoPayment?.paidAt || nowStr,
    };

    const wasPendingPaid = targetBusiness.paymentStatus === 'pending_payment';

    // 1. Instantly activate store, unlock chosen paid plan, and save active billing cycle + expiration
    const businessUpdates: Partial<Business> = {
      planId: targetPlan.id,
      billingCycle: effectiveCycle,
      planExpiresAt: lifetime ? undefined : calculatePlanExpirationDate(pricing.months),
      paymentStatus: 'active',
      subscriptionStatus: 'active',
      pendingPlanId: undefined,
      pendingBillingCycle: undefined,
    };

    setBusinesses((prev) => prev.map((b) => (b.id === targetBusiness.id ? { ...b, ...businessUpdates } : b)));
    if (currentBusinessAuth?.id === targetBusiness.id) {
      setCurrentBusinessAuth((prev) => (prev ? { ...prev, ...businessUpdates } : null));
    }
    trackDbMutation(
      updateEntityInDb('businesses', targetBusiness.id, {
        ...businessUpdates,
        planExpiresAt: lifetime ? null : businessUpdates.planExpiresAt,
        pendingPlanId: null,
        pendingBillingCycle: null,
      })
    );

    // 2. Add to transaction history & persist immediately
    setPaymentTransactions((prev) => [newTransaction, ...prev]);
    trackDbMutation(createEntityInDb('paymentTransactions', newTransaction));

    // 3. Fire Payment Approved email & Welcome email (if newly activated from pending paid registration)
    const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const portalLink = `${appOrigin}/?painel=1&businessId=${encodeURIComponent(targetBusiness.id)}`;
    const recipientEmail = newTransaction.payerEmail;
    const formattedPaid = `R$ ${pricing.totalAmount.toFixed(2).replace('.', ',')}`;
    const methodLabel =
      params.paymentMethod === 'pix'
        ? 'PIX'
        : `Cartão de Crédito (${newTransaction.installments || 1}x)`;

    void sendTemplatedEmail({
      key: 'payment_approved',
      to: recipientEmail,
      variables: {
        nome_empresa: targetBusiness.name,
        nome_plano: planLabelWithCycle,
        valor_pago: formattedPaid,
        metodo_pagamento: methodLabel,
        id_transacao: mpPaymentId,
        link_painel: portalLink,
      },
      actionUrl: portalLink,
    });

    if (wasPendingPaid) {
      void sendTemplatedEmail({
        key: 'welcome',
        to: recipientEmail,
        variables: {
          nome_empresa: targetBusiness.name,
          nome_plano: planLabelWithCycle,
          email_login: targetBusiness.email || recipientEmail,
          link_painel: portalLink,
        },
        actionUrl: portalLink,
      });
    }

    return {
      success: true,
      transaction: newTransaction,
    };
  };

  // Auth session (persisted in localStorage with mandatory server token + expiration checking)
  const [authSession, setAuthSession] = useState<AuthSession>(() => {
    try {
      const savedRaw = localStorage.getItem('achenacidade_auth');
      if (!savedRaw) {
        return { isAuthenticated: false, role: null, name: '', email: '' };
      }
      const saved: AuthSession = JSON.parse(savedRaw);
      // Reject legacy sessions without a server token or expired sessions
      if (
        !saved.isAuthenticated ||
        !saved.token ||
        (saved.expiresAt && Date.now() >= saved.expiresAt)
      ) {
        localStorage.removeItem('achenacidade_auth');
        return { isAuthenticated: false, role: null, name: '', email: '' };
      }
      return saved;
    } catch {
      return { isAuthenticated: false, role: null, name: '', email: '' };
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_auth', JSON.stringify(authSession));
  }, [authSession]);

  // One-time migration if legacy localStorage held a raw accessToken before server-side storage
  useEffect(() => {
    const legacyToken = (mercadoPagoConfig.accessToken || '').trim();
    if (
      authSession.isAuthenticated &&
      authSession.role === 'admin' &&
      authSession.token &&
      legacyToken &&
      !legacyToken.includes('••••')
    ) {
      void saveSettingToDb('mercadoPagoConfig', mercadoPagoConfig, authSession.token).then((res) => {
        if (res.ok) {
          setMercadoPagoConfig((prev) => ({
            ...prev,
            accessToken: '',
            hasAccessToken: true,
          }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession.isAuthenticated, authSession.role, authSession.token]);

  // Verify persisted session token with backend MySQL/server on mount
  useEffect(() => {
    let active = true;
    const token = authSession.token;
    if (!authSession.isAuthenticated || !token) return;

    if (isLoginAdminPath() && authSession.role === 'admin') {
      setCurrentViewState('admin');
    }

    void verifySessionViaApi(token).then((res) => {
      if (!active) return;
      if (res.valid && res.session) {
        setAuthSession(res.session);
        if (isLoginAdminPath() && res.session.role === 'admin') {
          setCurrentViewState('admin');
        }
      } else if (!res.networkError) {
        setAuthSession({ isAuthenticated: false, role: null, name: '', email: '' });
        setCurrentBusinessAuth(null);
        if (isLoginAdminPath()) {
          setCurrentViewState('admin_login');
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Restore currentBusinessAuth when user is authenticated as business
  useEffect(() => {
    if (authSession.isAuthenticated && authSession.role === 'business' && authSession.businessId) {
      const found = businesses.find((b) => b.id === authSession.businessId);
      if (found) {
        setCurrentBusinessAuth(found);
      }
    } else if (!authSession.isAuthenticated) {
      setCurrentBusinessAuth(null);
    }
  }, [authSession.isAuthenticated, authSession.role, authSession.businessId, businesses]);

  // Periodic session expiration watchdog (checks every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (authSession.isAuthenticated && authSession.expiresAt) {
        if (Date.now() >= authSession.expiresAt) {
          const expiredRole = authSession.role;
          void logoutViaApi(authSession.token);
          setAuthSession({ isAuthenticated: false, role: null, name: '', email: '' });
          setCurrentBusinessAuth(null);
          setBusinessPortalTab('dashboard');
          if (expiredRole === 'admin') {
            setCurrentView(isLoginAdminPath() ? 'admin_login' : 'home', true);
          } else {
            setCurrentView('login', true);
          }
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [authSession.isAuthenticated, authSession.expiresAt, authSession.token, authSession.role]);

  // Active Modals
  const [activeModal, setActiveModal] = useState<{
    type: 'business_detail' | 'product_detail' | 'service_detail' | 'business_portal' | 'admin' | 'favorites' | 'notifications' | null;
    id?: string;
  }>({ type: null });

  // Inspect Service Worker readiness, existing PushManager subscription & SW notification click messages
  useEffect(() => {
    let active = true;

    const checkSW = async () => {
      if (!isPushSupported()) {
        if (active) {
          setSwStatus('unsupported');
          setNotificationPermission('unsupported');
        }
        return;
      }

      if (active) {
        setNotificationPermission(getNotificationPermissionState());
      }

      const reg = await getActiveSWRegistration();
      if (!active) return;

      if (reg) {
        setSwStatus('active');
        if ('pushManager' in reg) {
          try {
            const sub = await reg.pushManager.getSubscription();
            if (active && sub) {
              setPushSubscriptionActive(true);
            }
          } catch {
            // Ignore in restricted environments
          }
        }
      } else {
        setSwStatus('error');
      }
    };

    checkSW();

    const handleSWMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'NOTIFICATION_CLICKED') return;
      const data = event.data.data || {};
      if (data.itemType === 'product' && data.itemId) {
        setActiveModal({ type: 'product_detail', id: data.itemId });
      } else if (data.itemType === 'service' && data.itemId) {
        setActiveModal({ type: 'service_detail', id: data.itemId });
      } else if (data.businessId) {
        setActiveModal({ type: 'business_detail', id: data.businessId });
      }
    };

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // Also inspect URL query params on mount for deep-links opened from closed-app notifications
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const openType = params.get('open');
      const openId = params.get('id');
      if (openId) {
        if (openType === 'product') setActiveModal({ type: 'product_detail', id: openId });
        else if (openType === 'service') setActiveModal({ type: 'service_detail', id: openId });
        else if (openType === 'business') setActiveModal({ type: 'business_detail', id: openId });
      }
    }

    return () => {
      active = false;
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  // Auto-dismiss live in-app push toast banner after 7s
  useEffect(() => {
    if (!inAppBannerAlert) return;
    const timer = setTimeout(() => {
      setInAppBannerAlert(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [inAppBannerAlert]);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('achenacidade_fav_businesses', JSON.stringify(favoriteBusinessIds));
  }, [favoriteBusinessIds]);

  useEffect(() => {
    localStorage.setItem('achenacidade_fav_products', JSON.stringify(favoriteProductIds));
  }, [favoriteProductIds]);

  useEffect(() => {
    localStorage.setItem('achenacidade_fav_services', JSON.stringify(favoriteServiceIds));
  }, [favoriteServiceIds]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('achenacidade_cities', JSON.stringify(cities));
  }, [cities]);

  useEffect(() => {
    localStorage.setItem('achenacidade_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('achenacidade_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('achenacidade_businesses', JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    localStorage.setItem('achenacidade_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('achenacidade_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('achenacidade_theme', JSON.stringify(adminTheme));
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--color-brand-blue', adminTheme.primaryColor);
    rootStyle.setProperty('--color-brand-orange', adminTheme.accentColor);

    const isDefault =
      adminTheme.primaryColor.toUpperCase() === '#1D4ED8' &&
      adminTheme.accentColor.toUpperCase() === '#EA580C';

    const overrideKeys = [
      '--color-blue-500',
      '--color-blue-600',
      '--color-blue-700',
      '--color-blue-800',
      '--color-orange-500',
      '--color-orange-600',
      '--color-orange-700',
    ];

    if (isDefault) {
      overrideKeys.forEach((key) => rootStyle.removeProperty(key));
    } else {
      rootStyle.setProperty(
        '--color-blue-500',
        `color-mix(in srgb, ${adminTheme.primaryColor} 88%, white)`
      );
      rootStyle.setProperty('--color-blue-600', adminTheme.primaryColor);
      rootStyle.setProperty('--color-blue-700', adminTheme.primaryHover);
      rootStyle.setProperty(
        '--color-blue-800',
        `color-mix(in srgb, ${adminTheme.primaryHover} 85%, black)`
      );
      rootStyle.setProperty(
        '--color-orange-500',
        `color-mix(in srgb, ${adminTheme.accentColor} 88%, white)`
      );
      rootStyle.setProperty('--color-orange-600', adminTheme.accentColor);
      rootStyle.setProperty('--color-orange-700', adminTheme.accentHover);
    }
  }, [adminTheme]);

  const setAdminTheme = (theme: AdminTheme) => {
    setAdminThemeState(theme);
    trackDbMutation(saveSettingToDb('adminTheme', theme));
  };

  // Find active city
  const selectedCity = cities.find((c) => c.id === selectedCityId);

  // Helper for active public businesses (excludes cancelled subscriptions)
  const publicVisibleBusinessIds = new Set(
    businesses.filter((b) => b.subscriptionStatus !== 'cancelled').map((b) => b.id)
  );

  // Filtered Businesses (VIP plans prioritized first)
  const filteredBusinesses = businesses
    .filter((biz) => {
      if (biz.subscriptionStatus === 'cancelled') {
        return false;
      }
      // City filter
      if (selectedCityId !== 'all' && biz.cityId !== selectedCityId) {
        return false;
      }
      // Category filter
      if (selectedCategoryId !== 'all' && biz.categoryId !== selectedCategoryId) {
        return false;
      }
      // Search query for companies (independent!)
      if (searchCompanyQuery.trim()) {
        const q = searchCompanyQuery.toLowerCase();
        const matchName = biz.name.toLowerCase().includes(q);
        const matchDesc = biz.description.toLowerCase().includes(q);
        const matchNeigh = biz.neighborhood.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchNeigh) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const planA = plans.find((p) => p.id === a.planId);
      const planB = plans.find((p) => p.id === b.planId);
      const vipA = isVipPlan(planA) ? 1 : 0;
      const vipB = isVipPlan(planB) ? 1 : 0;
      return vipB - vipA;
    });

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    if (!prod.isActive || !publicVisibleBusinessIds.has(prod.businessId)) return false;
    // City filter
    if (selectedCityId !== 'all' && prod.cityId !== selectedCityId) {
      return false;
    }
    // Search query for products (independent!)
    if (searchProductQuery.trim()) {
      const q = searchProductQuery.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchDesc = prod.description.toLowerCase().includes(q);
      const matchCat = prod.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Filtered Services
  const filteredServices = services.filter((serv) => {
    if (!serv.isActive || !publicVisibleBusinessIds.has(serv.businessId)) return false;
    // City filter
    if (selectedCityId !== 'all' && serv.cityId !== selectedCityId) {
      return false;
    }
    // Search query for services (independent!)
    if (searchServiceQuery.trim()) {
      const q = searchServiceQuery.toLowerCase();
      const matchName = serv.name.toLowerCase().includes(q);
      const matchDesc = serv.description.toLowerCase().includes(q);
      const matchCat = serv.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Helper counts & combined plan quota (Produtos + Serviços)
  const getBusinessProductCount = (businessId: string) => {
    return products.filter((p) => p.businessId === businessId).length;
  };

  const getBusinessServiceCount = (businessId: string) => {
    return services.filter((s) => s.businessId === businessId).length;
  };

  const getBusinessQuotaUsage = (businessId: string): BusinessQuotaInfo => {
    const business = businesses.find((b) => b.id === businessId);
    const plan = business ? plans.find((p) => p.id === business.planId) || plans[0] : plans[0];
    const limit = plan ? plan.productLimit : 3;
    const productsCount = getBusinessProductCount(businessId);
    const servicesCount = getBusinessServiceCount(businessId);
    const totalUsed = productsCount + servicesCount;
    const remaining = Math.max(0, limit - totalUsed);
    return {
      productsCount,
      servicesCount,
      totalUsed,
      limit,
      remaining,
      isFull: totalUsed >= limit,
    };
  };

  // City Actions
  const addCity = (cityData: Omit<City, 'id' | 'slug'>) => {
    const slug = cityData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${cityData.state.toLowerCase()}`;
    const newCity: City = {
      ...cityData,
      id: `city-${Date.now()}`,
      slug,
    };
    setCities((prev) => {
      const normalized = newCity.isDefault ? prev.map((c) => ({ ...c, isDefault: false })) : prev;
      return [...normalized, newCity];
    });
    trackDbMutation(createEntityInDb('cities', newCity));
  };

  const updateCity = (id: string, updates: Partial<City>) => {
    setCities((prev) =>
      prev.map((c) => {
        if (c.id === id) return { ...c, ...updates };
        return updates.isDefault === true ? { ...c, isDefault: false } : c;
      })
    );
    trackDbMutation(updateEntityInDb('cities', id, updates as Record<string, unknown>));
  };

  const deleteCity = (id: string) => {
    setCities((prev) => prev.filter((c) => c.id !== id));
    if (selectedCityId === id) {
      setSelectedCityId('all');
    }
    trackDbMutation(deleteEntityInDb('cities', id));
  };

  // Category Actions
  const addCategory = (catData: Omit<Category, 'id' | 'slug'>) => {
    const slug = catData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
      slug,
    };
    setCategories((prev) => [...prev, newCat]);
    trackDbMutation(createEntityInDb('categories', newCat));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    trackDbMutation(updateEntityInDb('categories', id, updates as Record<string, unknown>));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    trackDbMutation(deleteEntityInDb('categories', id));
  };

  // Plan Actions
  const addPlan = (planData: Omit<Plan, 'id'>) => {
    setPlans((prev) => {
      const maxOrder = prev.reduce(
        (max, p, idx) => Math.max(max, typeof p.sortOrder === 'number' && p.sortOrder > 0 ? p.sortOrder : idx + 1),
        0
      );
      const newPlan: Plan = {
        ...planData,
        id: `plan-${Date.now()}`,
        sortOrder:
          typeof planData.sortOrder === 'number' && planData.sortOrder > 0
            ? planData.sortOrder
            : maxOrder + 1,
        showOnHome: planData.isInviteOnly ? false : planData.showOnHome ?? true,
      };
      const next = sortPlansList([...prev, newPlan]);
      trackDbMutation(createEntityInDb('plans', newPlan));
      return next;
    });
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    setPlans((prev) => {
      const next = sortPlansList(
        prev.map((p) => {
          if (p.id !== id) return p;
          const merged: Plan = { ...p, ...updates };
          if (merged.isInviteOnly) {
            merged.showOnHome = false;
          }
          return merged;
        })
      );
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.isInviteOnly) {
        normalizedUpdates.showOnHome = false;
      }
      trackDbMutation(updateEntityInDb('plans', id, normalizedUpdates as Record<string, unknown>));
      return next;
    });
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    trackDbMutation(deleteEntityInDb('plans', id));
  };

  const reorderPlans = (orderedIds: string[]) => {
    setPlans((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      const arranged: Plan[] = [];
      for (const id of orderedIds) {
        const hit = byId.get(id);
        if (hit) {
          arranged.push(hit);
          byId.delete(id);
        }
      }
      for (const remaining of byId.values()) {
        arranged.push(remaining);
      }
      const normalized = arranged.map((plan, index) => ({
        ...plan,
        sortOrder: index + 1,
      }));
      trackDbMutation(syncCollectionToDb('plans', normalized));
      return normalized;
    });
  };

  const movePlanOrder = (id: string, direction: 'up' | 'down') => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      const normalized = copy.map((plan, index) => ({
        ...plan,
        sortOrder: index + 1,
      }));
      trackDbMutation(syncCollectionToDb('plans', normalized));
      return normalized;
    });
  };

  // Plan Invites & Subscription Management Actions
  const loadPlanInvites = async (): Promise<void> => {
    if (!authSession.isAuthenticated || authSession.role !== 'admin' || !authSession.token) return;
    const res = await fetchPlanInvitesViaApi(authSession.token);
    if (res.success && res.invites) {
      setPlanInvites(res.invites);
    }
  };

  useEffect(() => {
    if (authSession.isAuthenticated && authSession.role === 'admin' && authSession.token) {
      void loadPlanInvites();
    }
  }, [authSession.isAuthenticated, authSession.role, authSession.token]);

  const createPlanInvite = async (params: {
    code?: string;
    planId?: string;
    maxUses?: number;
    recipientHint?: string;
    expiresAt?: string;
  }): Promise<{ success: boolean; invite?: PlanInvite; error?: string }> => {
    if (!authSession.token) {
      return { success: false, error: 'Sessão administrativa ausente.' };
    }
    const res = await createPlanInviteViaApi(authSession.token, {
      ...params,
      planId: params.planId || 'plan-invite-premium-6m',
    });
    if (res.success && res.invite) {
      setPlanInvites((prev) => [res.invite!, ...prev]);
      return { success: true, invite: res.invite };
    }
    return { success: false, error: res.error || 'Erro ao gerar código de convite.' };
  };

  const revokePlanInvite = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!authSession.token) {
      return { success: false, error: 'Sessão administrativa ausente.' };
    }
    const res = await revokePlanInviteViaApi(authSession.token, id);
    if (res.success) {
      setPlanInvites((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'revoked' } : inv))
      );
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const deletePlanInvite = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!authSession.token) {
      return { success: false, error: 'Sessão administrativa ausente.' };
    }
    const res = await deletePlanInviteViaApi(authSession.token, id);
    if (res.success) {
      setPlanInvites((prev) => prev.filter((inv) => inv.id !== id));
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const validateInviteCode = async (
    code: string
  ): Promise<{ valid: boolean; invite?: PlanInvite; error?: string }> => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setValidatedInvite(null);
      setInviteValidationError('Informe um código de convite.');
      return { valid: false, error: 'Informe um código de convite.' };
    }
    const res = await validatePlanInviteViaApi(normalized);
    if (res.valid && res.invite) {
      setActiveInviteCode(normalized);
      setValidatedInvite(res.invite);
      setInviteValidationError(null);
      setPreselectedPlanId(res.invite.planId || 'plan-invite-premium-6m');
      return { valid: true, invite: res.invite };
    }
    setValidatedInvite(null);
    setInviteValidationError(res.error || 'Código de convite inválido ou expirado.');
    return { valid: false, invite: res.invite, error: res.error };
  };

  const clearActiveInvite = () => {
    setActiveInviteCode(null);
    setValidatedInvite(null);
    setInviteValidationError(null);
    if (preselectedPlanId === 'plan-invite-premium-6m') {
      setPreselectedPlanId(null);
    }
  };

  const applyInviteCodeToBusiness = async (
    code: string,
    businessId: string,
    tokenOverride?: string
  ): Promise<{ success: boolean; planExpiresAt?: string; error?: string }> => {
    const token = tokenOverride || authSession.token || '';
    const biz = businesses.find((b) => b.id === businessId);
    const normalized = code.trim().toUpperCase();
    if (!token) {
      return { success: false, error: 'Faça login na sua loja para resgatar o convite.' };
    }

    const res = await redeemPlanInviteViaApi(token, {
      code: normalized,
      businessId,
      businessName: biz?.name,
    });

    if (!res.success) {
      return { success: false, error: res.error || 'Não foi possível ativar o convite.' };
    }

    const activatedPlanId = res.planId || 'plan-invite-premium-6m';
    const activatedExpiry = res.planExpiresAt || calculatePlanExpirationDate(6);

    const updates: Partial<Business> = {
      planId: activatedPlanId,
      billingCycle: 'monthly',
      planExpiresAt: activatedExpiry,
      inviteCode: normalized,
      paymentStatus: 'active',
      subscriptionStatus: 'active',
      pendingPlanId: undefined,
      pendingBillingCycle: undefined,
    };

    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, ...updates } : b)));
    if (currentBusinessAuth?.id === businessId) {
      setCurrentBusinessAuth((prev) => (prev ? { ...prev, ...updates } : null));
    }

    if (res.databaseEnabled === false) {
      trackDbMutation(
        updateEntityInDb('businesses', businessId, {
          ...updates,
          pendingPlanId: null,
          pendingBillingCycle: null,
        })
      );
    }

    if (res.invite) {
      setPlanInvites((prev) => {
        const exists = prev.some((i) => i.id === res.invite!.id);
        return exists
          ? prev.map((i) => (i.id === res.invite!.id ? res.invite! : i))
          : [res.invite!, ...prev];
      });
    }

    clearActiveInvite();
    return { success: true, planExpiresAt: activatedExpiry };
  };

  const cancelBusinessSubscription = (businessId: string, mode: 'free' | 'pause') => {
    if (mode === 'free') {
      const updates: Partial<Business> = {
        planId: 'plan-free',
        billingCycle: 'monthly',
        planExpiresAt: undefined,
        inviteCode: undefined,
        paymentStatus: 'active',
        subscriptionStatus: 'active',
        pendingPlanId: undefined,
        pendingBillingCycle: undefined,
      };
      setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, ...updates } : b)));
      if (currentBusinessAuth?.id === businessId) {
        setCurrentBusinessAuth((prev) => (prev ? { ...prev, ...updates } : null));
      }
      trackDbMutation(
        updateEntityInDb('businesses', businessId, {
          planId: 'plan-free',
          billingCycle: 'monthly',
          planExpiresAt: null,
          inviteCode: null,
          paymentStatus: 'active',
          subscriptionStatus: 'active',
          pendingPlanId: null,
          pendingBillingCycle: null,
        })
      );
      return;
    }

    const updates: Partial<Business> = {
      subscriptionStatus: 'cancelled',
    };
    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, ...updates } : b)));
    if (currentBusinessAuth?.id === businessId) {
      setCurrentBusinessAuth((prev) => (prev ? { ...prev, ...updates } : null));
    }
    trackDbMutation(updateEntityInDb('businesses', businessId, { subscriptionStatus: 'cancelled' }));
  };

  // Business Actions
  const buildBusinessObject = (bizData: Omit<Business, 'id' | 'slug' | 'createdAt'>): Business => {
    const slug = bizData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const id = `biz-${Date.now()}`;
    const ownerEmail = bizData.ownerEmail || authSession.email || bizData.email || '';
    return {
      ...bizData,
      id,
      slug,
      ownerEmail,
      hasPassword: Boolean(bizData.password?.trim()),
      createdAt: new Date().toISOString().split('T')[0],
    };
  };

  const sanitizeBusinessForState = (biz: Business): Business => {
    const { password: _omitted, ...safe } = biz;
    return {
      ...safe,
      hasPassword: Boolean(biz.password?.trim() || biz.hasPassword),
    };
  };

  const addBusiness = (bizData: Omit<Business, 'id' | 'slug' | 'createdAt'>): string => {
    const newBiz = buildBusinessObject(bizData);
    setBusinesses((prev) => [sanitizeBusinessForState(newBiz), ...prev]);
    trackDbMutation(createEntityInDb('businesses', newBiz));
    return newBiz.id;
  };

  const registerApprovedBusinessesFromDrafts = (newBusinesses: Business[]) => {
    if (!Array.isArray(newBusinesses) || newBusinesses.length === 0) return;
    setBusinesses((prev) => {
      const existingIds = new Set(prev.map((b) => b.id));
      const uniqueIncoming = newBusinesses
        .filter((b) => b && b.id && !existingIds.has(b.id))
        .map((b) => sanitizeBusinessForState(b));
      if (uniqueIncoming.length === 0) return prev;
      return [...uniqueIncoming, ...prev];
    });
  };

  const updateBusiness = (id: string, updates: Partial<Business>) => {
    const { password: rawPwd, ...safeUpdates } = updates;
    const stateUpdates: Partial<Business> = {
      ...safeUpdates,
      ...(rawPwd && rawPwd.trim() ? { hasPassword: true } : {}),
    };
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, ...stateUpdates } : b)));
    if (currentBusinessAuth?.id === id) {
      setCurrentBusinessAuth((prev) => (prev ? { ...prev, ...stateUpdates } : null));
    }
    trackDbMutation(updateEntityInDb('businesses', id, updates as Record<string, unknown>));
  };

  // Real Business Metrics Store (Zeroed by default for new stores)
  const [localMetricsStore, setLocalMetricsStore] = useState<LocalBusinessMetricsStore>(() => {
    try {
      const saved = localStorage.getItem(METRICS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [remoteMetricsByBusiness, setRemoteMetricsByBusiness] = useState<
    Record<string, BusinessMetricsSummary>
  >({});

  useEffect(() => {
    try {
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(localMetricsStore));
    } catch {
      // Ignore storage quota errors
    }
  }, [localMetricsStore]);

  const trackBusinessMetric = (businessId: string, eventType: BusinessMetricEventType) => {
    if (!businessId) return;
    const dateKey = getClientSaoPauloDateKey();

    setLocalMetricsStore((prev) => {
      const bizDays = prev[businessId] ? { ...prev[businessId] } : {};
      const dayStats = bizDays[dateKey]
        ? { ...bizDays[dateKey] }
        : { views: 0, whatsappClicks: 0, showcaseClicks: 0 };

      if (eventType === 'view') dayStats.views += 1;
      else if (eventType === 'whatsapp_click') dayStats.whatsappClicks += 1;
      else if (eventType === 'showcase_click') dayStats.showcaseClicks += 1;

      bizDays[dateKey] = dayStats;
      return { ...prev, [businessId]: bizDays };
    });

    setRemoteMetricsByBusiness((prev) => {
      const existing = prev[businessId];
      if (!existing) return prev;
      const viewsTotal = existing.viewsTotal + (eventType === 'view' ? 1 : 0);
      const whatsappClicks = existing.whatsappClicks + (eventType === 'whatsapp_click' ? 1 : 0);
      const showcaseClicks = existing.showcaseClicks + (eventType === 'showcase_click' ? 1 : 0);
      const conversionRate =
        viewsTotal > 0 ? `${((whatsappClicks / viewsTotal) * 100).toFixed(1)}%` : '0%';
      const updatedDaily = existing.daily.map((d) =>
        d.date === dateKey
          ? {
              ...d,
              views: d.views + (eventType === 'view' ? 1 : 0),
              whatsappClicks: d.whatsappClicks + (eventType === 'whatsapp_click' ? 1 : 0),
              showcaseClicks: d.showcaseClicks + (eventType === 'showcase_click' ? 1 : 0),
            }
          : d
      );
      return {
        ...prev,
        [businessId]: {
          viewsTotal,
          whatsappClicks,
          showcaseClicks,
          conversionRate,
          daily: updatedDaily,
        },
      };
    });

    void trackBusinessMetricViaApi(businessId, eventType);
  };

  const getLocalMetricsSummary = (businessId: string): BusinessMetricsSummary => {
    const days = buildClientLast7Days();
    const bizDays = localMetricsStore[businessId] || {};
    let viewsTotal = 0;
    let whatsappClicks = 0;
    let showcaseClicks = 0;

    for (const dayStats of Object.values(bizDays)) {
      viewsTotal += Number(dayStats?.views || 0);
      whatsappClicks += Number(dayStats?.whatsappClicks || 0);
      showcaseClicks += Number(dayStats?.showcaseClicks || 0);
    }

    const conversionRate =
      viewsTotal > 0 ? `${((whatsappClicks / viewsTotal) * 100).toFixed(1)}%` : '0%';

    const daily: DailyMetricPoint[] = days.map((d) => {
      const hit = bizDays[d.date];
      return {
        date: d.date,
        label: d.label,
        views: Number(hit?.views || 0),
        whatsappClicks: Number(hit?.whatsappClicks || 0),
        showcaseClicks: Number(hit?.showcaseClicks || 0),
      };
    });

    return {
      viewsTotal,
      whatsappClicks,
      showcaseClicks,
      conversionRate,
      daily,
    };
  };

  const getBusinessMetrics = (businessId: string): BusinessMetricsSummary => {
    if (!businessId) {
      return getLocalMetricsSummary('');
    }
    const localSummary = getLocalMetricsSummary(businessId);
    const remoteSummary = remoteMetricsByBusiness[businessId];
    if (!remoteSummary) return localSummary;

    const remoteSum =
      remoteSummary.viewsTotal + remoteSummary.whatsappClicks + remoteSummary.showcaseClicks;
    const localSum =
      localSummary.viewsTotal + localSummary.whatsappClicks + localSummary.showcaseClicks;
    if (remoteSum === 0 && localSum > 0) {
      return localSummary;
    }
    return remoteSummary;
  };

  const loadBusinessMetricsFromDb = async (businessId: string): Promise<void> => {
    if (!businessId) return;
    const res = await fetchBusinessMetricsViaApi(businessId);
    if (res.ok && res.metrics) {
      const m = res.metrics;
      setRemoteMetricsByBusiness((prev) => ({
        ...prev,
        [businessId]: m,
      }));
    }
  };

  const deleteBusiness = (id: string) => {
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    setProducts((prev) => prev.filter((p) => p.businessId !== id));
    setServices((prev) => prev.filter((s) => s.businessId !== id));
    setStoreProductCategories((prev) => prev.filter((c) => c.businessId !== id));
    setLocalMetricsStore((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setRemoteMetricsByBusiness((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (currentBusinessAuth?.id === id) {
      setCurrentBusinessAuth(null);
    }
    trackDbMutation(deleteEntityInDb('businesses', id));
  };

  // Push Notification Dispatcher Helper
  const updatePushPreferences = (updates: Partial<PushPreferences>) => {
    setPushPreferences((prev) => ({ ...prev, ...updates }));
  };

  const dispatchPushAlertForItem = async (params: {
    business: Business;
    itemType: 'product' | 'service';
    itemId: string;
    title: string;
    body: string;
    imageUrl?: string;
    forceDispatch?: boolean;
  }): Promise<{ sentViaSW: boolean; alert: PushAlertLog }> => {
    const sentViaSW = await sendNotificationViaServiceWorker({
      title: params.title,
      body: params.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-maskable-512x512.png',
      image: params.imageUrl,
      tag: `achenacidade-${params.itemType}-${params.itemId}`,
      data: {
        url: `/?open=${params.itemType}&id=${params.itemId}`,
        itemType: params.itemType,
        itemId: params.itemId,
        businessId: params.business.id,
      },
    });

    const newAlert: PushAlertLog = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      businessId: params.business.id,
      businessName: params.business.name,
      cityId: params.business.cityId,
      itemType: params.itemType,
      itemId: params.itemId,
      title: params.title,
      body: params.body,
      imageUrl: params.imageUrl,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      deliveredViaSW: sentViaSW,
    };

    setPushAlerts((prev) => [newAlert, ...prev].slice(0, 30));
    setInAppBannerAlert(newAlert);
    return { sentViaSW, alert: newAlert };
  };

  const isEligibleForPush = (business: Business, itemType: 'product' | 'service'): boolean => {
    if (!pushPreferences.enabled) return false;
    if (itemType === 'product' && !pushPreferences.notifyNewOffers) return false;
    if (itemType === 'service' && !pushPreferences.notifyNewServices) return false;
    if (pushPreferences.favoritesOnly && !favoriteBusinessIds.includes(business.id)) return false;

    if (pushPreferences.cityScope === 'alagoinhas_only') {
      const city = cities.find((c) => c.id === business.cityId);
      const isAlagoinhas =
        business.cityId === 'city-1' ||
        (city?.name.toLowerCase().includes('alagoinhas') ?? false);
      if (!isAlagoinhas) return false;
    }

    return true;
  };

  const notifyFavoriteOffer = async (params: {
    businessId: string;
    item: { type: 'product'; data: Product } | { type: 'service'; data: Service };
    force?: boolean;
  }): Promise<{ sentViaSW: boolean; alert?: PushAlertLog }> => {
    const business = businesses.find((b) => b.id === params.businessId);
    if (!business) {
      return { sentViaSW: false };
    }

    const requireFavorite = !params.force && pushPreferences.favoritesOnly;
    if (!params.force && !isEligibleForPush(business, params.item.type)) {
      return { sentViaSW: false };
    }

    const city = cities.find((c) => c.id === business.cityId);
    const cityName = city ? `${city.name} - ${city.state}` : 'Alagoinhas - BA';

    const { sentViaSW, title, body } = await notifyFavoriteBusinessOffer({
      business,
      favoriteBusinessIds,
      item: params.item,
      cityName,
      requireFavorite,
    });

    if (!title) {
      return { sentViaSW: false };
    }

    const newAlert: PushAlertLog = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      businessId: business.id,
      businessName: business.name,
      cityId: business.cityId,
      itemType: params.item.type,
      itemId: params.item.data.id,
      title,
      body,
      imageUrl: params.item.data.imageUrl,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      deliveredViaSW: sentViaSW,
    };

    setPushAlerts((prev) => [newAlert, ...prev].slice(0, 30));
    setInAppBannerAlert(newAlert);
    return { sentViaSW, alert: newAlert };
  };

  const enablePushNotifications = async (): Promise<{ granted: boolean; swActive: boolean; message: string }> => {
    if (!isPushSupported()) {
      setNotificationPermission('unsupported');
      setSwStatus('unsupported');
      setPushPreferences((prev) => ({ ...prev, enabled: true }));
      return {
        granted: false,
        swActive: false,
        message: 'Notificações nativas não são suportadas neste navegador; alertas internos na Central foram ativados.',
      };
    }

    let permission: NotificationPermission = Notification.permission;
    try {
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
    } catch {
      permission = Notification.permission;
    }
    setNotificationPermission(permission);

    const reg = await getActiveSWRegistration();
    const swActive = !!reg;
    setSwStatus(swActive ? 'active' : 'error');

    let subscribed = false;
    if (reg && permission === 'granted') {
      const subResult = await subscribePushManager(reg, pushPreferences.vapidPublicKey);
      subscribed = subResult.subscribed;
      setPushSubscriptionActive(subscribed || true);
    }

    setPushPreferences((prev) => ({ ...prev, enabled: true }));

    if (permission === 'granted' && swActive) {
      return {
        granted: true,
        swActive: true,
        message: 'Notificações Push via Service Worker ativadas para suas empresas favoritas em Alagoinhas!',
      };
    }

    if (permission === 'denied') {
      return {
        granted: false,
        swActive,
        message: 'Permissão de notificação bloqueada no navegador. Você continuará recebendo alertas visuais na Central do app.',
      };
    }

    return {
      granted: permission === 'granted',
      swActive,
      message: 'Preferências salvas! Alertas ativos para ofertas e serviços em Alagoinhas.',
    };
  };

  const disablePushNotifications = async () => {
    const reg = await getActiveSWRegistration();
    await unsubscribePushManager(reg);
    setPushSubscriptionActive(false);
    setPushPreferences((prev) => ({ ...prev, enabled: false }));
  };

  const markAlertAsRead = (id: string) => {
    setPushAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllAlertsAsRead = () => {
    setPushAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const clearPushAlerts = () => {
    setPushAlerts([]);
  };

  const unreadAlertsCount = pushAlerts.filter((a) => !a.read).length;

  const dismissInAppBannerAlert = () => {
    setInAppBannerAlert(null);
  };

  const triggerTestFavoritePush = async (
    itemType: 'product' | 'service' = 'service'
  ): Promise<{ sentViaSW: boolean; alert: PushAlertLog }> => {
    const alagoinhasBizList = businesses.filter((b) => {
      const city = cities.find((c) => c.id === b.cityId);
      return b.cityId === 'city-1' || (city?.name.toLowerCase().includes('alagoinhas') ?? false);
    });

    const favoredAlagoinhas = alagoinhasBizList.find((b) => favoriteBusinessIds.includes(b.id));
    const targetBiz = favoredAlagoinhas || alagoinhasBizList[0] || businesses[0];

    if (itemType === 'service') {
      const matchingService =
        services.find((s) => s.businessId === targetBiz?.id) ||
        services[0];
      const title = `Novo serviço em ${targetBiz?.name || 'Alagoinhas'}`;
      const body = matchingService
        ? `${matchingService.name} · ${formatServicePrice(matchingService)} em Alagoinhas - BA`
        : 'Novo serviço disponível para agendamento em Alagoinhas - BA!';

      return dispatchPushAlertForItem({
        business: targetBiz,
        itemType: 'service',
        itemId: matchingService?.id || '',
        title,
        body,
        imageUrl: matchingService?.imageUrl,
        forceDispatch: true,
      });
    }

    const matchingProduct =
      products.find((p) => p.businessId === targetBiz?.id) ||
      products[0];
    const priceFormatted = matchingProduct
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(matchingProduct.price)
      : 'Oferta especial';
    const title = `Nova oferta em ${targetBiz?.name || 'Alagoinhas'}`;
    const body = matchingProduct
      ? `${matchingProduct.name} por ${priceFormatted} em Alagoinhas - BA!`
      : 'Nova oferta imperdível publicada em Alagoinhas - BA!';

    return dispatchPushAlertForItem({
      business: targetBiz,
      itemType: 'product',
      itemId: matchingProduct?.id || '',
      title,
      body,
      imageUrl: matchingProduct?.imageUrl,
      forceDispatch: true,
    });
  };

  // Product Actions with combined quota limit enforcement (Products + Services)!
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    const business = businesses.find((b) => b.id === prodData.businessId);
    if (!business) {
      return { success: false, error: 'Empresa vinculada não encontrada.' };
    }

    const plan = plans.find((p) => p.id === business.planId) || plans[0];
    const quota = getBusinessQuotaUsage(business.id);

    if (quota.isFull) {
      return {
        success: false,
        error: `Cota combinada do plano ${plan.name} atingida (${quota.productsCount} produtos + ${quota.servicesCount} serviços = ${quota.totalUsed}/${quota.limit}). Faça upgrade para cadastrar mais itens!`,
      };
    }

    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setProducts((prev) => [newProd, ...prev]);
    trackDbMutation(createEntityInDb('products', newProd));

    if (isEligibleForPush(business, 'product')) {
      void notifyFavoriteOffer({
        businessId: business.id,
        item: { type: 'product', data: newProd },
        force: !pushPreferences.favoritesOnly,
      });
    }

    return { success: true };
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    trackDbMutation(updateEntityInDb('products', id, updates as Record<string, unknown>));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    trackDbMutation(deleteEntityInDb('products', id));
  };

  // Service Actions with combined quota limit enforcement (Products + Services)!
  const addService = (servData: Omit<Service, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    const business = businesses.find((b) => b.id === servData.businessId);
    if (!business) {
      return { success: false, error: 'Empresa vinculada não encontrada.' };
    }

    const plan = plans.find((p) => p.id === business.planId) || plans[0];
    const quota = getBusinessQuotaUsage(business.id);

    if (quota.isFull) {
      return {
        success: false,
        error: `Cota combinada do plano ${plan.name} atingida (${quota.productsCount} produtos + ${quota.servicesCount} serviços = ${quota.totalUsed}/${quota.limit}). Faça upgrade para cadastrar mais itens!`,
      };
    }

    const newServ: Service = {
      ...servData,
      id: `serv-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setServices((prev) => [newServ, ...prev]);
    trackDbMutation(createEntityInDb('services', newServ));

    if (isEligibleForPush(business, 'service')) {
      void notifyFavoriteOffer({
        businessId: business.id,
        item: { type: 'service', data: newServ },
        force: !pushPreferences.favoritesOnly,
      });
    }

    return { success: true };
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    trackDbMutation(updateEntityInDb('services', id, updates as Record<string, unknown>));
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    trackDbMutation(deleteEntityInDb('services', id));
  };

  // Store Product Category Actions
  const addStoreProductCategory = (catData: Omit<StoreProductCategory, 'id'>) => {
    const newCat: StoreProductCategory = {
      ...catData,
      id: `spc-${Date.now()}`,
    };
    setStoreProductCategories((prev) => [...prev, newCat]);
    trackDbMutation(createEntityInDb('storeProductCategories', newCat));
  };

  const updateStoreProductCategory = (id: string, updates: Partial<StoreProductCategory>) => {
    setStoreProductCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    trackDbMutation(updateEntityInDb('storeProductCategories', id, updates as Record<string, unknown>));
  };

  const deleteStoreProductCategory = (id: string) => {
    setStoreProductCategories((prev) => prev.filter((c) => c.id !== id));
    trackDbMutation(deleteEntityInDb('storeProductCategories', id));
  };

  const logoutBusiness = () => {
    setCurrentBusinessAuth(null);
  };

  // Favorites functions
  const toggleFavoriteBusiness = (id: string) => {
    setFavoriteBusinessIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isBusinessFavorite = (id: string) => favoriteBusinessIds.includes(id);

  const toggleFavoriteProduct = (id: string) => {
    setFavoriteProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isProductFavorite = (id: string) => favoriteProductIds.includes(id);

  const toggleFavoriteService = (id: string) => {
    setFavoriteServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isServiceFavorite = (id: string) => favoriteServiceIds.includes(id);

  const clearAllFavorites = () => {
    setFavoriteBusinessIds([]);
    setFavoriteProductIds([]);
    setFavoriteServiceIds([]);
    localStorage.removeItem('achenacidade_fav_businesses');
    localStorage.removeItem('achenacidade_fav_products');
    localStorage.removeItem('achenacidade_fav_services');
  };

  const favoriteBusinesses = businesses.filter((b) => favoriteBusinessIds.includes(b.id));
  const favoriteProducts = products.filter((p) => favoriteProductIds.includes(p.id));
  const favoriteServices = services.filter((s) => favoriteServiceIds.includes(s.id));
  const totalFavoritesCount = favoriteBusinessIds.length + favoriteProductIds.length + favoriteServiceIds.length;

  // Database-backed Authentication Actions (No passwordless auto-login)
  const authenticateAdmin = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await loginViaApi({ loginType: 'admin', email, password });
    if (!res.success || !res.session) {
      return { success: false, error: res.error || 'E-mail ou senha inválidos.' };
    }
    setCurrentBusinessAuth(null);
    setAuthSession(res.session);
    setCurrentView('admin');
    return { success: true };
  };

  const authenticateStoreOwner = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await loginViaApi({ loginType: 'business', email, password });
    if (!res.success || !res.session) {
      return { success: false, error: res.error || 'E-mail ou senha da loja inválidos.' };
    }
    const matchedBiz = businesses.find((b) => b.id === res.session?.businessId) || null;
    if (matchedBiz) {
      setCurrentBusinessAuth(matchedBiz);
    }
    setAuthSession(res.session);
    setCurrentView('business_portal');
    setBusinessPortalTab('dashboard');
    return { success: true };
  };

  const loginDemoStoreOwner = async (): Promise<{ success: boolean; error?: string }> => {
    if (authSession.isAuthenticated && authSession.role === 'business') {
      setCurrentView('business_portal');
      setBusinessPortalTab('dashboard');
      return { success: true };
    }

    const res = await loginDemoBusinessViaApi();
    if (!res.success || !res.session) {
      return {
        success: false,
        error: res.error || 'Não foi possível acessar automaticamente a área do lojista.',
      };
    }

    const matchedBiz =
      businesses.find((b) => b.id === res.session?.businessId) ||
      businesses.find((b) => b.id === 'biz-1') ||
      null;
    if (matchedBiz) {
      setCurrentBusinessAuth(matchedBiz);
    }
    setAuthSession(res.session);
    setCurrentView('business_portal');
    setBusinessPortalTab('dashboard');
    return { success: true };
  };

  const registerBusinessAndLogin = async (
    bizData: Omit<Business, 'id' | 'slug' | 'createdAt'>,
    navigateToPortal: boolean = true
  ): Promise<{ success: boolean; businessId?: string; business?: Business; error?: string }> => {
    const requestedInviteCode = bizData.inviteCode?.trim().toUpperCase();
    const isInviteSignup = bizData.planId === 'plan-invite-premium-6m' && Boolean(requestedInviteCode);

    const newBiz = buildBusinessObject(
      isInviteSignup
        ? { ...bizData, planId: 'plan-free', inviteCode: undefined, subscriptionStatus: 'active' }
        : { ...bizData, subscriptionStatus: bizData.subscriptionStatus || 'active' }
    );
    const safeBiz = sanitizeBusinessForState(newBiz);
    setBusinesses((prev) => [safeBiz, ...prev]);

    const saveRes = await createEntityInDb('businesses', newBiz);
    if (!saveRes.ok) {
      return {
        success: false,
        error: saveRes.error || 'Falha ao salvar cadastro da loja no banco de dados.',
      };
    }

    const loginEmail = (newBiz.ownerEmail || newBiz.email || '').trim();
    const rawPassword = (newBiz.password || '').trim();
    let activeToken = authSession.token;

    if (authSession.isAuthenticated && authSession.role === 'business' && authSession.token) {
      const switchRes = await switchBusinessViaApi(authSession.token, safeBiz.id);
      if (switchRes.success && switchRes.session) {
        activeToken = switchRes.session.token;
        setCurrentBusinessAuth(safeBiz);
        setAuthSession(switchRes.session);
      }
    } else if (loginEmail && rawPassword) {
      const loginRes = await loginViaApi({
        loginType: 'business',
        email: loginEmail,
        password: rawPassword,
      });
      if (loginRes.success && loginRes.session) {
        activeToken = loginRes.session.token;
        setCurrentBusinessAuth(safeBiz);
        setAuthSession(loginRes.session);
      }
    }

    let finalBiz = safeBiz;
    if (isInviteSignup && requestedInviteCode && activeToken) {
      const redeemRes = await redeemPlanInviteViaApi(activeToken, {
        code: requestedInviteCode,
        businessId: safeBiz.id,
        businessName: safeBiz.name,
      });
      if (redeemRes.success) {
        const activatedPlanId = redeemRes.planId || 'plan-invite-premium-6m';
        const activatedExpiry = redeemRes.planExpiresAt || calculatePlanExpirationDate(6);
        const activatedUpdates: Partial<Business> = {
          planId: activatedPlanId,
          billingCycle: 'monthly',
          planExpiresAt: activatedExpiry,
          inviteCode: requestedInviteCode,
          paymentStatus: 'active',
          subscriptionStatus: 'active',
        };
        finalBiz = { ...safeBiz, ...activatedUpdates };
        setBusinesses((prev) => prev.map((b) => (b.id === safeBiz.id ? finalBiz : b)));
        setCurrentBusinessAuth(finalBiz);
        if (redeemRes.databaseEnabled === false) {
          trackDbMutation(updateEntityInDb('businesses', safeBiz.id, activatedUpdates as Record<string, unknown>));
        }
        clearActiveInvite();
      }
    }

    if (navigateToPortal && activeToken) {
      setCurrentView('business_portal');
      setBusinessPortalTab('dashboard');
    }

    return {
      success: true,
      businessId: finalBiz.id,
      business: finalBiz,
    };
  };

  const switchActiveBusiness = async (
    businessId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!authSession.isAuthenticated || authSession.role !== 'business' || !authSession.token) {
      return { success: false, error: 'Sessão de lojista não autenticada.' };
    }
    const targetBiz = businesses.find((b) => b.id === businessId);
    if (!targetBiz) {
      return { success: false, error: 'Loja não encontrada.' };
    }
    const res = await switchBusinessViaApi(authSession.token, businessId);
    if (!res.success || !res.session) {
      return { success: false, error: res.error || 'Não autorizado a acessar esta loja.' };
    }
    setCurrentBusinessAuth(targetBiz);
    setAuthSession(res.session);
    return { success: true };
  };

  const renewSession = async (): Promise<{ success: boolean; error?: string }> => {
    if (!authSession.isAuthenticated || !authSession.role || !authSession.token) {
      return { success: false, error: 'Sessão não autenticada.' };
    }
    const res = await renewSessionViaApi(authSession.token);
    if (!res.success || !res.session) {
      logout();
      return { success: false, error: res.error || 'Sessão expirada. Faça login novamente.' };
    }
    setAuthSession(res.session);
    return { success: true };
  };

  const logout = () => {
    void logoutViaApi(authSession.token);
    setAuthSession({ isAuthenticated: false, role: null, name: '', email: '' });
    setCurrentBusinessAuth(null);
    setBusinessPortalTab('dashboard');
    setCurrentView('home', true);
  };

  // Modals with History State for native back button
  const openModal = (
    type: 'business_detail' | 'product_detail' | 'service_detail' | 'business_portal' | 'admin' | 'favorites' | 'notifications',
    id?: string
  ) => {
    if (type === 'admin') {
      if (authSession.isAuthenticated && authSession.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
      return;
    }
    if (type === 'business_portal') {
      if (authSession.isAuthenticated && authSession.role === 'business') {
        setCurrentView('business_portal');
      } else {
        setCurrentView('login');
      }
      return;
    }
    if (type === 'business_detail' && id) {
      trackBusinessMetric(id, 'view');
    } else if (type === 'product_detail' && id) {
      const prod = products.find((p) => p.id === id);
      if (prod?.businessId) {
        trackBusinessMetric(prod.businessId, 'showcase_click');
      }
    } else if (type === 'service_detail' && id) {
      const serv = services.find((s) => s.id === id);
      if (serv?.businessId) {
        trackBusinessMetric(serv.businessId, 'showcase_click');
      }
    }
    setActiveModal({ type, id });
    window.history.pushState({ view: currentView, modal: type, modalId: id }, '');
  };

  const closeModal = () => {
    setActiveModal({ type: null });
    if (window.history.state && window.history.state.modal) {
      window.history.back();
    }
  };

  // Support smartphone hardware & gesture back button
  useEffect(() => {
    if (!window.history.state || typeof window.history.state.view === 'undefined') {
      window.history.replaceState({ view: currentView, modal: null }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (isLoginAdminPath(window.location.pathname)) {
        setActiveModal({ type: null });
        setCurrentViewState(
          authSession.isAuthenticated && authSession.role === 'admin' ? 'admin' : 'admin_login'
        );
        return;
      }

      if (isFounderSalesPath(window.location.pathname)) {
        setActiveModal({ type: null });
        setCurrentViewState('founder_sales');
        return;
      }

      const state = event.state;
      if (state) {
        if (state.modal) {
          setActiveModal({ type: state.modal, id: state.modalId });
        } else {
          setActiveModal({ type: null });
        }
        if (state.view && state.view !== 'admin_login') {
          setCurrentViewState(state.view);
        } else {
          setCurrentViewState('home');
        }
      } else {
        setActiveModal({ type: null });
        setCurrentViewState('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, authSession.isAuthenticated, authSession.role]);

  const buildInitialBootstrapPayload = (): DirectoryBootstrapPayload => ({
    cities: initialCities,
    categories: initialCategories,
    plans: initialPlans,
    businesses: initialBusinesses,
    products: initialProducts,
    services: initialServices,
    storeProductCategories: initialStoreProductCategories,
    banners: initialBanners,
    paymentTransactions: initialPaymentTransactions,
    emailLogs: [],
    settings: {
      adminTheme: defaultTheme,
      planDiscountConfig: defaultPlanDiscountConfig,
      mercadoPagoConfig: defaultMercadoPagoConfig,
      siteModeConfig: defaultSiteModeConfig,
      smtpConfig: defaultSmtpConfig,
      emailTemplates: defaultEmailTemplates,
      sessionConfig: defaultSessionConfig,
      appGeneralConfig: defaultAppGeneralConfig,
    },
  });

  const buildCurrentSnapshotPayload = (): DirectoryBootstrapPayload => ({
    cities,
    categories,
    plans,
    businesses,
    products,
    services,
    storeProductCategories,
    banners,
    paymentTransactions,
    emailLogs,
    settings: {
      adminTheme,
      planDiscountConfig,
      mercadoPagoConfig,
      siteModeConfig,
      smtpConfig,
      emailTemplates,
      sessionConfig,
      appGeneralConfig,
    },
  });

  const applyRemoteData = (data: DirectoryBootstrapPayload) => {
    if (data.cities?.length) {
      setCities(data.cities);
      const defaultCity =
        data.cities.find((c) => c.isActive && c.isDefault) ||
        data.cities.find((c) => c.isActive) ||
        data.cities[0];
      if (defaultCity) {
        setSelectedCityId((prev) =>
          data.cities.some((c) => c.id === prev) ? prev : defaultCity.id
        );
      }
    }
    if (data.categories) setCategories(data.categories);
    if (data.plans) {
      const { merged, addedMissing } = mergePlansWithSystemDefaults(data.plans);
      setPlans(merged);
      if (addedMissing.length > 0) {
        for (const missingPlan of addedMissing) {
          trackDbMutation(createEntityInDb('plans', missingPlan));
        }
      }
    }
    if (data.businesses) setBusinesses(data.businesses);
    if (data.products) setProducts(data.products);
    if (data.services) setServices(data.services);
    if (data.storeProductCategories) setStoreProductCategories(data.storeProductCategories);
    if (data.banners) {
      setBanners(data.banners.map((b) => ({ ...b, priceMonthly: 0 })));
    }
    if (data.paymentTransactions) {
      setPaymentTransactions(
        data.paymentTransactions.filter((tx) => tx.id !== 'tx-mp-01' && tx.id !== 'tx-mp-02')
      );
    }
    if (data.emailLogs) setEmailLogs(data.emailLogs);

    if (data.settings?.adminTheme) setAdminThemeState(data.settings.adminTheme);
    if (data.settings?.planDiscountConfig) {
      setPlanDiscountConfig({
        annual: clampDiscountPercent(data.settings.planDiscountConfig.annual ?? defaultPlanDiscountConfig.annual),
        biennial: clampDiscountPercent(data.settings.planDiscountConfig.biennial ?? defaultPlanDiscountConfig.biennial),
        triennial: clampDiscountPercent(data.settings.planDiscountConfig.triennial ?? defaultPlanDiscountConfig.triennial),
      });
    }
    if (data.settings?.mercadoPagoConfig) setMercadoPagoConfig(data.settings.mercadoPagoConfig);
    if (data.settings?.siteModeConfig) {
      setSiteModeConfig({
        ...defaultSiteModeConfig,
        ...data.settings.siteModeConfig,
        launch: { ...defaultSiteModeConfig.launch, ...(data.settings.siteModeConfig.launch || {}) },
        maintenance: { ...defaultSiteModeConfig.maintenance, ...(data.settings.siteModeConfig.maintenance || {}) },
      });
    }
    if (data.settings?.smtpConfig) {
      setSmtpConfig({ ...defaultSmtpConfig, ...data.settings.smtpConfig });
    }
    if (data.settings?.emailTemplates) {
      const remoteTpl = data.settings.emailTemplates;
      setEmailTemplates({
        email_verification: { ...defaultEmailTemplates.email_verification, ...(remoteTpl.email_verification || {}) },
        payment_link: { ...defaultEmailTemplates.payment_link, ...(remoteTpl.payment_link || {}) },
        welcome: { ...defaultEmailTemplates.welcome, ...(remoteTpl.welcome || {}) },
        payment_approved: { ...defaultEmailTemplates.payment_approved, ...(remoteTpl.payment_approved || {}) },
      });
    }
    if (data.settings?.sessionConfig) setSessionConfig(data.settings.sessionConfig);
    if (Array.isArray((data.settings as any)?.bannerPlans)) setBannerPlans((data.settings as any).bannerPlans);
    if (data.settings?.appGeneralConfig) {
      setAppGeneralConfig({ ...defaultAppGeneralConfig, ...data.settings.appGeneralConfig });
    }
  };

  const refreshFromDatabase = async (): Promise<{ success: boolean; error?: string }> => {
    setDbSyncStatus('checking');
    const boot = await fetchBootstrap();

    if (!boot.databaseEnabled) {
      if (boot.error) {
        isLocalOnlyRef.current = false;
        setDbSyncStatus('error');
        setDbLastError(boot.error);
        return { success: false, error: boot.error };
      }
      isLocalOnlyRef.current = true;
      setDbSyncStatus('local_only');
      setDbLastError(null);
      return { success: false, error: 'Banco MySQL não está configurado nas variáveis de ambiente do servidor.' };
    }

    isLocalOnlyRef.current = false;

    if (boot.error) {
      setDbSyncStatus('error');
      setDbLastError(boot.error);
      return { success: false, error: boot.error };
    }

    if (boot.seeded && boot.data) {
      applyRemoteData(boot.data);
      setDbSyncStatus('connected');
      setDbLastError(null);
      setDbLastSyncedAt(new Date().toLocaleTimeString('pt-BR'));
      return { success: true };
    }

    const seedRes = await seedDatabase(buildInitialBootstrapPayload());
    if (seedRes.error) {
      setDbSyncStatus('error');
      setDbLastError(seedRes.error);
      return { success: false, error: seedRes.error };
    }
    if (seedRes.data) {
      applyRemoteData(seedRes.data);
    }
    setDbSyncStatus('connected');
    setDbLastError(null);
    setDbLastSyncedAt(new Date().toLocaleTimeString('pt-BR'));
    return { success: true };
  };

  const syncAllToDatabaseNow = async (): Promise<{ success: boolean; error?: string }> => {
    setDbSyncStatus('checking');
    const res = await syncAllDataToDb(buildCurrentSnapshotPayload());
    if (!res.databaseEnabled) {
      if (res.error) {
        isLocalOnlyRef.current = false;
        setDbSyncStatus('error');
        setDbLastError(res.error);
        return { success: false, error: res.error };
      }
      isLocalOnlyRef.current = true;
      setDbSyncStatus('local_only');
      return { success: false, error: 'Banco MySQL não configurado no servidor.' };
    }
    isLocalOnlyRef.current = false;
    if (res.error) {
      setDbSyncStatus('error');
      setDbLastError(res.error);
      return { success: false, error: res.error };
    }
    if (res.data) {
      applyRemoteData(res.data);
    }
    setDbSyncStatus('connected');
    setDbLastError(null);
    setDbLastSyncedAt(new Date().toLocaleTimeString('pt-BR'));
    return { success: true };
  };

  // Hydrate full directory state from MySQL/MariaDB on mount (auto-seeding if empty)
  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const boot = await fetchBootstrap();
      if (!active) return;

      if (!boot.databaseEnabled) {
        if (boot.error) {
          isLocalOnlyRef.current = false;
          setDbSyncStatus('error');
          setDbLastError(boot.error);
        } else {
          isLocalOnlyRef.current = true;
          setDbSyncStatus('local_only');
          setDbLastError(null);
        }
        return;
      }

      isLocalOnlyRef.current = false;

      if (boot.error) {
        setDbSyncStatus('error');
        setDbLastError(boot.error);
        return;
      }

      if (boot.seeded && boot.data) {
        applyRemoteData(boot.data);
        if (!boot.data.settings?.appGeneralConfig) {
          trackDbMutation(saveSettingToDb('appGeneralConfig', appGeneralConfig));
        }
        setDbSyncStatus('connected');
        setDbLastError(null);
        setDbLastSyncedAt(new Date().toLocaleTimeString('pt-BR'));
        return;
      }

      const seedRes = await seedDatabase(buildInitialBootstrapPayload());
      if (!active) return;
      if (seedRes.error) {
        setDbSyncStatus('error');
        setDbLastError(seedRes.error);
        return;
      }
      if (seedRes.data) {
        applyRemoteData(seedRes.data);
      }
      setDbSyncStatus('connected');
      setDbLastError(null);
      setDbLastSyncedAt(new Date().toLocaleTimeString('pt-BR'));
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  // Reset demo
  const resetToDemoData = () => {
    setBanners(initialBanners);
    setCities(initialCities);
    setSelectedCityId(initialCities[0].id);
    setCategories(initialCategories);
    setPlans(initialPlans);
    setBusinesses(initialBusinesses);
    setProducts(initialProducts);
    setServices(initialServices);
    setStoreProductCategories(initialStoreProductCategories);
    setFavoriteBusinessIds([]);
    setFavoriteProductIds([]);
    setFavoriteServiceIds([]);
    setAdminThemeState(defaultTheme);
    setPlanDiscountConfig(defaultPlanDiscountConfig);
    setMercadoPagoConfig(defaultMercadoPagoConfig);
    setPaymentTransactions(initialPaymentTransactions);
    setSiteModeConfig(defaultSiteModeConfig);
    setAppGeneralConfig(defaultAppGeneralConfig);
    setLocalMetricsStore({});
    setRemoteMetricsByBusiness({});
    localStorage.clear();
    trackDbMutation(resetDatabaseDemo(buildInitialBootstrapPayload()));
  };

  const addBanner = (b: Omit<AdBanner, 'id' | 'clicksCount'>) => {
    const newBanner: AdBanner = {
      ...b,
      id: `banner-${Date.now()}`,
      clicksCount: 0,
    };
    setBanners((prev) => [newBanner, ...prev]);
    trackDbMutation(createEntityInDb('banners', newBanner));
  };

  const updateBanner = (id: string, updates: Partial<AdBanner>) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    trackDbMutation(updateEntityInDb('banners', id, updates as Record<string, unknown>));
  };

  const deleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    trackDbMutation(deleteEntityInDb('banners', id));
  };

  const toggleBannerStatus = (id: string) => {
    const current = banners.find((b) => b.id === id);
    const nextIsActive = current ? !current.isActive : true;
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
    trackDbMutation(updateEntityInDb('banners', id, { isActive: nextIsActive }));
  };

  const recordBannerClick = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, clicksCount: (b.clicksCount || 0) + 1 } : b))
    );
    trackDbMutation(recordBannerClickInDb(id));
  };

  return (
    <DirectoryContext.Provider
      value={{
        cities,
        selectedCityId,
        selectedCity,
        setSelectedCityId,
        addCity,
        updateCity,
        deleteCity,

        categories,
        selectedCategoryId,
        setSelectedCategoryId,
        addCategory,
        updateCategory,
        deleteCategory,

        plans,
        addPlan,
        updatePlan,
        deletePlan,
        movePlanOrder,
        reorderPlans,
        planDiscountConfig,
        updatePlanDiscountConfig,
        resetPlanDiscountConfig,
        planInvites,
        loadPlanInvites,
        createPlanInvite,
        revokePlanInvite,
        deletePlanInvite,
        activeInviteCode,
        validatedInvite,
        inviteValidationError,
        validateInviteCode,
        clearActiveInvite,
        applyInviteCodeToBusiness,
        cancelBusinessSubscription,

        businesses,
        filteredBusinesses,
        addBusiness,
        updateBusiness,
        deleteBusiness,
        registerApprovedBusinessesFromDrafts,
        gmpQuotaExceeded,

        products,
        filteredProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getBusinessProductCount,

        services,
        filteredServices,
        addService,
        updateService,
        deleteService,
        getBusinessServiceCount,
        getBusinessQuotaUsage,

        storeProductCategories,
        addStoreProductCategory,
        updateStoreProductCategory,
        deleteStoreProductCategory,

        searchCompanyQuery,
        setSearchCompanyQuery,
        searchProductQuery,
        setSearchProductQuery,
        searchServiceQuery,
        setSearchServiceQuery,

        currentBusinessAuth,
        logoutBusiness,

        currentView,
        setCurrentView,
        businessPortalTab,
        setBusinessPortalTab,
        authSession,
        sessionConfig,
        updateSessionConfig,
        renewSession,
        authenticateAdmin,
        authenticateStoreOwner,
        loginDemoStoreOwner,
        registerBusinessAndLogin,
        switchActiveBusiness,
        logout,

        // Banners
        banners,
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerStatus,
        recordBannerClick,
        bannerPlans,
        addBannerPlan,
        updateBannerPlan,
        deleteBannerPlan,
        addMerchantBanner,

        adminTheme,
        setAdminTheme,

        activeModal,
        openModal,
        closeModal,

        // Mercado Pago & Payments
        mercadoPagoConfig,
        updateMercadoPagoConfig,
        paymentTransactions,
        paymentModalData,
        openPaymentModal,
        closePaymentModal,
        processPlanPayment,

        // Favorites
        favoriteBusinessIds,
        favoriteProductIds,
        favoriteServiceIds,
        toggleFavoriteBusiness,
        isBusinessFavorite,
        toggleFavoriteProduct,
        isProductFavorite,
        toggleFavoriteService,
        isServiceFavorite,
        clearAllFavorites,
        favoriteBusinesses,
        favoriteProducts,
        favoriteServices,
        totalFavoritesCount,

        // Service Worker Push Notifications
        pushPreferences,
        updatePushPreferences,
        pushAlerts,
        unreadAlertsCount,
        markAlertAsRead,
        markAllAlertsAsRead,
        clearPushAlerts,
        swStatus,
        notificationPermission,
        pushSubscriptionActive,
        enablePushNotifications,
        disablePushNotifications,
        notifyFavoriteOffer,
        triggerTestFavoritePush,
        inAppBannerAlert,
        dismissInAppBannerAlert,

        siteModeConfig,
        setSiteMode,
        updateSiteModeConfig,
        updateLaunchConfig,
        updateMaintenanceConfig,
        resetSiteModeConfig,
        adminPreviewMode,
        setAdminPreviewMode,
        visitorDemoActive,
        enterVisitorDemo,
        exitVisitorDemo,
        preselectedPlanId,
        setPreselectedPlanId,
        preselectedBillingCycle,
        setPreselectedBillingCycle,

        smtpConfig,
        updateSmtpConfig,
        emailTemplates,
        updateEmailTemplate,
        resetEmailTemplates,
        emailLogs,
        clearEmailLogs,
        sendTemplatedEmail,
        sendVerificationCodeEmail,
        verifyEmailCode,
        checkoutTarget,
        openCheckoutPage,

        appGeneralConfig,
        updateAppGeneralConfig,
        resetAppGeneralConfig,

        trackBusinessMetric,
        getBusinessMetrics,
        loadBusinessMetricsFromDb,

        dbSyncStatus,
        dbLastError,
        dbLastSyncedAt,
        refreshFromDatabase,
        syncAllToDatabaseNow,

        resetToDemoData,
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
};

export const useDirectory = () => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
};
