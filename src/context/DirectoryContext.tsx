import React, { createContext, useContext, useState, useEffect } from 'react';
import { City, Category, Plan, Business, Product, AdminTheme, AdBanner, AppView, StoreProductCategory, SessionConfig, AuthSession } from '../types';
import {
  initialCities,
  initialCategories,
  initialPlans,
  initialBusinesses,
  initialProducts,
  initialBanners,
  initialStoreProductCategories,
  defaultTheme,
} from '../data/initialData';

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

  // Plans
  plans: Plan[];
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;

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
    type: 'business_detail' | 'product_detail' | 'business_portal' | 'admin' | 'favorites' | null;
    id?: string;
  };
  openModal: (type: 'business_detail' | 'product_detail' | 'business_portal' | 'admin' | 'favorites', id?: string) => void;
  closeModal: () => void;

  // Favorites System (localStorage)
  favoriteBusinessIds: string[];
  favoriteProductIds: string[];
  toggleFavoriteBusiness: (id: string) => void;
  isBusinessFavorite: (id: string) => boolean;
  toggleFavoriteProduct: (id: string) => void;
  isProductFavorite: (id: string) => boolean;
  clearAllFavorites: () => void;
  favoriteBusinesses: Business[];
  favoriteProducts: Product[];
  totalFavoritesCount: number;

  // Reset to default
  resetToDemoData: () => void;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

export const DirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or fall back to defaults
  const [cities, setCities] = useState<City[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_cities');
      return saved ? JSON.parse(saved) : initialCities;
    } catch {
      return initialCities;
    }
  });

  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    const defaultCity = cities.find((c) => c.isDefault) || cities[0];
    return defaultCity ? defaultCity.id : 'all';
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_categories');
      return saved ? JSON.parse(saved) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const [plans, setPlans] = useState<Plan[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_plans');
      return saved ? JSON.parse(saved) : initialPlans;
    } catch {
      return initialPlans;
    }
  });

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const saved = localStorage.getItem('achenacidade_businesses');
      return saved ? JSON.parse(saved) : initialBusinesses;
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
          alert('Sua sessão expirou por segurança. Faça login novamente para continuar.');
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [authSession.isAuthenticated, authSession.expiresAt]);

  // Active Modals
  const [activeModal, setActiveModal] = useState<{
    type: 'business_detail' | 'product_detail' | 'business_portal' | 'admin' | 'favorites' | null;
    id?: string;
  }>({ type: null });

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('achenacidade_fav_businesses', JSON.stringify(favoriteBusinessIds));
  }, [favoriteBusinessIds]);

  useEffect(() => {
    localStorage.setItem('achenacidade_fav_products', JSON.stringify(favoriteProductIds));
  }, [favoriteProductIds]);

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
    localStorage.setItem('achenacidade_theme', JSON.stringify(adminTheme));
    // Apply primary brand colors dynamically to document root
    document.documentElement.style.setProperty('--color-brand-blue', adminTheme.primaryColor);
    document.documentElement.style.setProperty('--color-brand-orange', adminTheme.accentColor);
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

  // Helper count
  const getBusinessProductCount = (businessId: string) => {
    return products.filter((p) => p.businessId === businessId).length;
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
    if (currentBusinessAuth?.id === id) {
      setCurrentBusinessAuth(null);
    }
  };

  // Product Actions with strict quota limit enforcement!
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    const business = businesses.find((b) => b.id === prodData.businessId);
    if (!business) {
      return { success: false, error: 'Empresa vinculada não encontrada.' };
    }

    const plan = plans.find((p) => p.id === business.planId) || plans[0];
    const currentCount = getBusinessProductCount(business.id);

    if (currentCount >= plan.productLimit) {
      return {
        success: false,
        error: `Limite de produtos do plano ${plan.name} atingido (${currentCount}/${plan.productLimit}). Faça upgrade para cadastrar mais produtos!`,
      };
    }

    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setProducts((prev) => [newProd, ...prev]);
    return { success: true };
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
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

  const clearAllFavorites = () => {
    setFavoriteBusinessIds([]);
    setFavoriteProductIds([]);
    localStorage.removeItem('achenacidade_fav_businesses');
    localStorage.removeItem('achenacidade_fav_products');
  };

  const favoriteBusinesses = businesses.filter((b) => favoriteBusinessIds.includes(b.id));
  const favoriteProducts = products.filter((p) => favoriteProductIds.includes(p.id));
  const totalFavoritesCount = favoriteBusinessIds.length + favoriteProductIds.length;

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
    type: 'business_detail' | 'product_detail' | 'business_portal' | 'admin' | 'favorites',
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
    setFavoriteBusinessIds([]);
    setFavoriteProductIds([]);
    setAdminThemeState(defaultTheme);
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

        storeProductCategories,
        addStoreProductCategory,
        updateStoreProductCategory,
        deleteStoreProductCategory,

        searchCompanyQuery,
        setSearchCompanyQuery,
        searchProductQuery,
        setSearchProductQuery,

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

        // Favorites
        favoriteBusinessIds,
        favoriteProductIds,
        toggleFavoriteBusiness,
        isBusinessFavorite,
        toggleFavoriteProduct,
        isProductFavorite,
        clearAllFavorites,
        favoriteBusinesses,
        favoriteProducts,
        totalFavoritesCount,

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
