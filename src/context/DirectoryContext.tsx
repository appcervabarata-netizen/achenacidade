import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { City, Category, Plan, Business, Product, Service, AdminTheme, AdBanner, AppView, StoreProductCategory, SessionConfig, AuthSession, MercadoPagoConfig, PaymentTransaction, PushPreferences, PushAlertLog, SiteMode, SiteModeConfig, LaunchPageConfig, MaintenancePageConfig, SmtpConfig, EmailTemplate, EmailTemplateKey, EmailLogEntry, CheckoutTarget, BillingCycle, PlanDiscountConfig } from '../types';
import {
  initialCities,
  initialCategories,
  initialPlans,
  initialBusinesses,
  initialProducts,
  initialServices,
  initialBanners,
  initialStoreProductCategories,
  defaultTheme,
  defaultMercadoPagoConfig,
  initialPaymentTransactions,
  defaultSiteModeConfig,
  defaultSmtpConfig,
  defaultEmailTemplates,
  defaultPlanDiscountConfig,
} from '../data/initialData';
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
  parseBillingCycleParam,
} from '../utils/planPricing';

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

  // Plans & Multi-Year Billing Cycle Discounts
  plans: Plan[];
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  planDiscountConfig: PlanDiscountConfig;
  updatePlanDiscountConfig: (updates: Partial<PlanDiscountConfig>) => void;
  resetPlanDiscountConfig: () => void;

  // Businesses
  businesses: Business[];
  filteredBusinesses: Business[];
  addBusiness: (biz: Omit<Business, 'id' | 'slug' | 'createdAt'>) => string;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;

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

  // Banners System (Admin exclusive & separate billing)
  banners: AdBanner[];
  addBanner: (banner: Omit<AdBanner, 'id' | 'clicksCount'>) => void;
  updateBanner: (id: string, updates: Partial<AdBanner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerStatus: (id: string) => void;
  recordBannerClick: (id: string) => void;

  // Auth Session System
  authSession: AuthSession;
  sessionConfig: SessionConfig;
  updateSessionConfig: (updates: Partial<SessionConfig>) => void;
  renewSession: () => void;
  loginAsAdmin: (email?: string) => void;
  loginAsStoreOwner: (businessId: string, email?: string) => void;
  logout: () => void;

  // Business portal session
  currentBusinessAuth: Business | null;
  loginAsBusiness: (businessId: string, directBiz?: Business) => void;
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
    businessName?: string;
    cityName?: string;
  }) => Promise<{ success: boolean; code: string; deliveredViaSmtp: boolean; logEntry?: EmailLogEntry }>;
  verifyEmailCode: (email: string, code: string) => { valid: boolean; error?: string };
  checkoutTarget: CheckoutTarget | null;
  openCheckoutPage: (
    businessId: string,
    planId: string,
    token?: string,
    billingCycle?: BillingCycle
  ) => void;

  // Reset to default
  resetToDemoData: () => void;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

export const DirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      const migrated = localStorage.getItem('achenacidade_services_quota_v1');
      const saved = localStorage.getItem('achenacidade_plans');
      if (!saved) return initialPlans;
      const parsed: Plan[] = JSON.parse(saved);
      if (!migrated) {
        const updated = parsed.map((p) => {
          const def = initialPlans.find((ip) => ip.id === p.id);
          return def ? { ...p, features: def.features } : p;
        });
        localStorage.setItem('achenacidade_plans', JSON.stringify(updated));
        localStorage.setItem('achenacidade_services_quota_v1', 'true');
        return updated;
      }
      return parsed;
    } catch {
      return initialPlans;
    }
  });

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
  const [currentView, setCurrentViewState] = useState<AppView>('home');

  const setCurrentView = (view: AppView, replace: boolean = false) => {
    setCurrentViewState((prev) => {
      if (prev !== view) {
        if (replace) {
          window.history.replaceState({ view, modal: null }, '');
        } else {
          window.history.pushState({ view, modal: null }, '');
        }
      }
      return view;
    });
  };

  // Ad Banners State (Admin only, billed separately)
  const [banners, setBanners] = useState<AdBanner[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_banners');
      return saved ? JSON.parse(saved) : initialBanners;
    } catch {
      return initialBanners;
    }
  });

  useEffect(() => {
    localStorage.setItem('achenacidade_banners', JSON.stringify(banners));
  }, [banners]);

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
    setSessionConfig((prev) => ({ ...prev, ...updates }));
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
    setSiteModeConfig((prev) => ({ ...prev, mode }));
  };

  const updateSiteModeConfig = (updates: Partial<SiteModeConfig>) => {
    setSiteModeConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateLaunchConfig = (updates: Partial<LaunchPageConfig>) => {
    setSiteModeConfig((prev) => ({
      ...prev,
      launch: { ...prev.launch, ...updates },
    }));
  };

  const updateMaintenanceConfig = (updates: Partial<MaintenancePageConfig>) => {
    setSiteModeConfig((prev) => ({
      ...prev,
      maintenance: { ...prev.maintenance, ...updates },
    }));
  };

  const resetSiteModeConfig = () => {
    setSiteModeConfig(defaultSiteModeConfig);
  };

  const [adminPreviewMode, setAdminPreviewMode] = useState<'none' | 'launch' | 'maintenance'>('none');
  const [preselectedPlanId, setPreselectedPlanId] = useState<string | null>(null);
  const [preselectedBillingCycle, setPreselectedBillingCycle] = useState<BillingCycle>('monthly');

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
    setPlanDiscountConfig((prev) => ({
      annual: updates.annual !== undefined ? clampDiscountPercent(updates.annual) : prev.annual,
      biennial: updates.biennial !== undefined ? clampDiscountPercent(updates.biennial) : prev.biennial,
      triennial: updates.triennial !== undefined ? clampDiscountPercent(updates.triennial) : prev.triennial,
    }));
  };

  const resetPlanDiscountConfig = () => {
    setPlanDiscountConfig(defaultPlanDiscountConfig);
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
    localStorage.setItem('achenacidade_mercadopago_config', JSON.stringify(mercadoPagoConfig));
  }, [mercadoPagoConfig]);

  const updateMercadoPagoConfig = (updates: Partial<MercadoPagoConfig>) => {
    setMercadoPagoConfig((prev) => ({ ...prev, ...updates }));
  };

  // Payment Transactions History
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_payment_transactions');
      return saved ? JSON.parse(saved) : initialPaymentTransactions;
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
    setSmtpConfig((prev) => ({ ...prev, ...updates }));
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
    setEmailTemplates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const resetEmailTemplates = () => {
    setEmailTemplates(defaultEmailTemplates);
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
  };

  const verificationCodesRef = useRef<Record<string, { code: string; expiresAt: number }>>({});

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
    return result;
  };

  const sendVerificationCodeEmail = async (params: {
    to: string;
    businessName?: string;
    cityName?: string;
  }): Promise<{ success: boolean; code: string; deliveredViaSmtp: boolean; logEntry?: EmailLogEntry }> => {
    const normalizedEmail = params.to.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodesRef.current[normalizedEmail] = {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    const res = await sendTemplatedEmail({
      key: 'email_verification',
      to: params.to.trim(),
      variables: {
        codigo: code,
        nome_empresa: params.businessName?.trim() || 'sua empresa',
        cidade: params.cityName || 'Alagoinhas - BA',
      },
      highlightCode: code,
    });

    return {
      success: true,
      code,
      deliveredViaSmtp: res.deliveredViaSmtp,
      logEntry: res.logEntry,
    };
  };

  const verifyEmailCode = (email: string, code: string): { valid: boolean; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const record = verificationCodesRef.current[normalizedEmail];
    if (!record) {
      return { valid: false, error: 'Solicite um código de verificação para este e-mail primeiro.' };
    }
    if (Date.now() > record.expiresAt) {
      return { valid: false, error: 'Este código expirou. Clique em reenviar para gerar um novo.' };
    }
    if (code.trim() !== record.code) {
      return { valid: false, error: 'Código incorreto. Confira os 6 dígitos enviados ao seu e-mail.' };
    }
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

  // Support deep-links sent in Payment Link or Welcome emails (?checkout=1&businessId=...&planId=...&cycle=...&token=...)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const isCheckout = searchParams.get('checkout') === '1';
      const bizId = searchParams.get('businessId');
      const pId = searchParams.get('planId');
      const token = searchParams.get('token') || undefined;
      const cycleParam = searchParams.get('cycle');

      if (isCheckout && bizId && pId) {
        setCheckoutTarget({
          businessId: bizId,
          planId: pId,
          token,
          billingCycle: cycleParam ? parseBillingCycleParam(cycleParam) : undefined,
        });
        setCurrentViewState('checkout');
      } else if (searchParams.get('painel') === '1' && bizId) {
        const targetBiz = businesses.find((b) => b.id === bizId);
        if (targetBiz) {
          loginAsBusiness(targetBiz.id, targetBiz);
        }
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
    const planLabelWithCycle =
      pricing.months > 1
        ? `${targetPlan.name} (${pricing.shortLabel}${
            pricing.discountPercent > 0 ? ` · ${pricing.discountPercent}% OFF` : ''
          })`
        : targetPlan.name;

    const mpPaymentId = 'MP-' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const txId = `tx-${Date.now()}`;
    const now = new Date();
    const nowStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');

    const cardLastFour = params.cardData?.number ? params.cardData.number.replace(/\s+/g, '').slice(-4) : undefined;
    let cardBrand = 'Mastercard';
    if (params.cardData?.number.startsWith('4')) cardBrand = 'Visa';
    else if (params.cardData?.number.startsWith('5')) cardBrand = 'Mastercard';
    else if (params.cardData?.number.startsWith('6')) cardBrand = 'Elo';
    else if (params.cardData?.number.startsWith('3')) cardBrand = 'Amex';

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
      status: 'approved',
      mercadoPagoPaymentId: mpPaymentId,
      installments: params.paymentMethod === 'credit_card' ? params.cardData?.installments || 1 : 1,
      cardLastFour,
      cardBrand: params.paymentMethod === 'credit_card' ? cardBrand : undefined,
      payerEmail: params.payerEmail || targetBusiness.ownerEmail || targetBusiness.email || 'lojista@achenacidade.com.br',
      createdAt: nowStr,
      paidAt: nowStr,
    };

    const wasPendingPaid = targetBusiness.paymentStatus === 'pending_payment';

    // 1. Instantly activate store, unlock chosen paid plan, and save active billing cycle + expiration
    updateBusiness(targetBusiness.id, {
      planId: targetPlan.id,
      billingCycle: effectiveCycle,
      planExpiresAt: calculatePlanExpirationDate(pricing.months),
      paymentStatus: 'active',
      pendingPlanId: undefined,
      pendingBillingCycle: undefined,
    });

    // 2. Add to transaction history
    setPaymentTransactions((prev) => [newTransaction, ...prev]);

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

  // Auth session (persisted in localStorage with expiration checking)
  const [authSession, setAuthSession] = useState<AuthSession>(() => {
    try {
      const savedRaw = localStorage.getItem('achenacidade_auth');
      if (!savedRaw) {
        return { isAuthenticated: false, role: null, name: '', email: '' };
      }
      const saved: AuthSession = JSON.parse(savedRaw);
      // If session is expired, invalidate it
      if (saved.isAuthenticated && saved.expiresAt && Date.now() > saved.expiresAt) {
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
          logout();
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [authSession.isAuthenticated, authSession.expiresAt]);

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
  };

  // Find active city
  const selectedCity = cities.find((c) => c.id === selectedCityId);

  // Filtered Businesses
  const filteredBusinesses = businesses.filter((biz) => {
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
  });

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    if (!prod.isActive) return false;
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
    if (!serv.isActive) return false;
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
    setCities((prev) => [...prev, newCity]);
  };

  const updateCity = (id: string, updates: Partial<City>) => {
    setCities((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCity = (id: string) => {
    setCities((prev) => prev.filter((c) => c.id !== id));
    if (selectedCityId === id) {
      setSelectedCityId('all');
    }
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
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Plan Actions
  const addPlan = (planData: Omit<Plan, 'id'>) => {
    const newPlan: Plan = {
      ...planData,
      id: `plan-${Date.now()}`,
    };
    setPlans((prev) => [...prev, newPlan]);
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  // Business Actions
  const addBusiness = (bizData: Omit<Business, 'id' | 'slug' | 'createdAt'>): string => {
    const slug = bizData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const id = `biz-${Date.now()}`;
    const ownerEmail = bizData.ownerEmail || authSession.email || bizData.email || 'lojista@achenacidade.com.br';
    const newBiz: Business = {
      ...bizData,
      id,
      slug,
      ownerEmail,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBusinesses((prev) => [newBiz, ...prev]);
    return id;
  };

  const updateBusiness = (id: string, updates: Partial<Business>) => {
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    if (currentBusinessAuth?.id === id) {
      setCurrentBusinessAuth((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteBusiness = (id: string) => {
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    setProducts((prev) => prev.filter((p) => p.businessId !== id));
    setServices((prev) => prev.filter((s) => s.businessId !== id));
    if (currentBusinessAuth?.id === id) {
      setCurrentBusinessAuth(null);
    }
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
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
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
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Store Product Category Actions
  const addStoreProductCategory = (catData: Omit<StoreProductCategory, 'id'>) => {
    const newCat: StoreProductCategory = {
      ...catData,
      id: `spc-${Date.now()}`,
    };
    setStoreProductCategories((prev) => [...prev, newCat]);
  };

  const updateStoreProductCategory = (id: string, updates: Partial<StoreProductCategory>) => {
    setStoreProductCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteStoreProductCategory = (id: string) => {
    setStoreProductCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Business auth session
  const loginAsBusiness = (businessId: string, directBiz?: Business) => {
    const biz = directBiz || businesses.find((b) => b.id === businessId);
    if (biz) {
      setCurrentBusinessAuth(biz);
      const now = Date.now();
      const durationMs = (sessionConfig.businessSessionDurationMinutes || 1440) * 60 * 1000;
      setAuthSession({
        isAuthenticated: true,
        role: 'business',
        name: biz.name,
        email: biz.ownerEmail || biz.email || 'lojista@achenacidade.com.br',
        businessId: biz.id,
        loginTimestamp: now,
        expiresAt: now + durationMs,
      });
      setCurrentView('business_portal');
    }
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

  // Auth Actions
  const loginAsAdmin = (email: string = 'admin@achenacidade.com.br') => {
    const now = Date.now();
    const durationMs = (sessionConfig.adminSessionDurationMinutes || 120) * 60 * 1000;
    const session: AuthSession = {
      isAuthenticated: true,
      role: 'admin',
      name: 'Administrador Master',
      email,
      loginTimestamp: now,
      expiresAt: now + durationMs,
    };
    setAuthSession(session);
    setCurrentView('admin');
  };

  const loginAsStoreOwner = (businessId: string, email: string = '') => {
    const biz = businesses.find((b) => b.id === businessId);
    if (biz) {
      setCurrentBusinessAuth(biz);
      const now = Date.now();
      const durationMs = (sessionConfig.businessSessionDurationMinutes || 1440) * 60 * 1000;
      const session: AuthSession = {
        isAuthenticated: true,
        role: 'business',
        name: biz.name,
        email: email || biz.ownerEmail || biz.email || 'lojista@achenacidade.com.br',
        businessId: biz.id,
        loginTimestamp: now,
        expiresAt: now + durationMs,
      };
      setAuthSession(session);
      setCurrentView('business_portal');
    }
  };

  const renewSession = () => {
    if (!authSession.isAuthenticated || !authSession.role) return;
    const now = Date.now();
    const durationMinutes = authSession.role === 'admin'
      ? (sessionConfig.adminSessionDurationMinutes || 120)
      : (sessionConfig.businessSessionDurationMinutes || 1440);
    setAuthSession((prev) => ({
      ...prev,
      loginTimestamp: now,
      expiresAt: now + durationMinutes * 60 * 1000,
    }));
  };

  const logout = () => {
    setAuthSession({ isAuthenticated: false, role: null, name: '', email: '' });
    setCurrentBusinessAuth(null);
    setCurrentView('home');
  };

  // Modals with History State for native back button
  const openModal = (
    type: 'business_detail' | 'product_detail' | 'service_detail' | 'business_portal' | 'admin' | 'favorites' | 'notifications',
    id?: string
  ) => {
    // If opening admin or business_portal, switch full-screen screen view instead of popup
    if (type === 'admin') {
      setCurrentView('admin');
      return;
    }
    if (type === 'business_portal') {
      setCurrentView('business_portal');
      return;
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
      const state = event.state;
      if (state) {
        if (state.modal) {
          setActiveModal({ type: state.modal, id: state.modalId });
        } else {
          setActiveModal({ type: null });
        }
        if (state.view) {
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
  }, [currentView]);

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
    setFavoriteBusinessIds([]);
    setFavoriteProductIds([]);
    setFavoriteServiceIds([]);
    setAdminThemeState(defaultTheme);
    setPlanDiscountConfig(defaultPlanDiscountConfig);
    setMercadoPagoConfig(defaultMercadoPagoConfig);
    setPaymentTransactions(initialPaymentTransactions);
    setSiteModeConfig(defaultSiteModeConfig);
    localStorage.clear();
  };

  const addBanner = (b: Omit<AdBanner, 'id' | 'clicksCount'>) => {
    const newBanner: AdBanner = {
      ...b,
      id: `banner-${Date.now()}`,
      clicksCount: 0,
    };
    setBanners((prev) => [newBanner, ...prev]);
  };

  const updateBanner = (id: string, updates: Partial<AdBanner>) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleBannerStatus = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const recordBannerClick = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, clicksCount: (b.clicksCount || 0) + 1 } : b))
    );
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
        planDiscountConfig,
        updatePlanDiscountConfig,
        resetPlanDiscountConfig,

        businesses,
        filteredBusinesses,
        addBusiness,
        updateBusiness,
        deleteBusiness,

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
        loginAsBusiness,
        logoutBusiness,

        currentView,
        setCurrentView,
        authSession,
        sessionConfig,
        updateSessionConfig,
        renewSession,
        loginAsAdmin,
        loginAsStoreOwner,
        logout,

        // Banners
        banners,
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerStatus,
        recordBannerClick,

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
