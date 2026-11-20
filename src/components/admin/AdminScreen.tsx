import React, { useEffect, useRef, useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { ImageUploadField } from '../common/ImageUploadField';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  Tag,
  CreditCard,
  Palette,
  Server,
  Plus,
  Trash2,
  Edit2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  LogOut,
  ExternalLink,
  Megaphone,
  Eye,
  EyeOff,
  Search,
  DollarSign,
  Key,
  QrCode,
  Lock,
  Globe,
  RefreshCw,
  AlertTriangle,
  Printer,
  Instagram,
  Rocket,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Mail,
  Database,
} from 'lucide-react';
import { AdminTheme, Business, Plan, PlanCycleDiscounts } from '../../types';
import { AdminBusinessEditModal } from './AdminBusinessEditModal';
import { SocialCreativesStudio } from './SocialCreativesStudio';
import { AdminSiteModeTab } from './AdminSiteModeTab';
import { AdminEmailTab } from './AdminEmailTab';
import { AdminDatabaseTab } from './AdminDatabaseTab';
import { generateHostGatorPackage, downloadFile } from '../../utils/hostgatorGenerator';
import {
  BILLING_CYCLE_LIST,
  BILLING_CYCLE_META,
  calculatePlanPricing,
  clampDiscountPercent,
  formatBRL,
} from '../../utils/planPricing';

export const AdminScreen: React.FC = () => {
  const {
    setCurrentView,
    logout,
    cities,
    addCity,
    updateCity,
    deleteCity,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    plans,
    addPlan,
    updatePlan,
    deletePlan,
    businesses,
    updateBusiness,
    deleteBusiness,
    products,
    services,
    storeProductCategories,
    getBusinessQuotaUsage,
    banners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    adminTheme,
    setAdminTheme,
    resetToDemoData,
    mercadoPagoConfig,
    updateMercadoPagoConfig,
    paymentTransactions,
    emailLogs,
    planDiscountConfig,
    updatePlanDiscountConfig,
    resetPlanDiscountConfig,
    dbSyncStatus,
    dbLastError,
  } = useDirectory();

  // Active admin tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'cities' | 'categories' | 'plans' | 'businesses' | 'banners' | 'payments' | 'emails' | 'creatives' | 'sitemode' | 'theme' | 'database' | 'hostgator'
  >('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  // Business management & edit state
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [businessSearchQuery, setBusinessSearchQuery] = useState('');
  const [businessCityFilter, setBusinessCityFilter] = useState('all');
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showAdminToast = (message: string) => {
    setAdminToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setAdminToast(null), 3500);
  };

  // In-UI ConfirmModal state (replaces window.confirm blocked in iframes)
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Edit IDs & scroll refs
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const cityFormRef = useRef<HTMLFormElement>(null);
  const catFormRef = useRef<HTMLFormElement>(null);
  const planFormRef = useRef<HTMLFormElement>(null);
  const bannerFormRef = useRef<HTMLDivElement>(null);

  // Mercado Pago Admin Form State
  const [mpForm, setMpForm] = useState({
    enabled: mercadoPagoConfig.enabled,
    environment: mercadoPagoConfig.environment,
    publicKey: mercadoPagoConfig.publicKey,
    accessToken: mercadoPagoConfig.accessToken,
    pixKey: mercadoPagoConfig.pixKey || '',
    statementDescriptor: mercadoPagoConfig.statementDescriptor || 'ACHENACIDADE',
    autoApproveInSandbox: mercadoPagoConfig.autoApproveInSandbox ?? true,
  });
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    status: 'success' | 'error' | 'idle';
    message: string;
  }>({ status: 'idle', message: '' });

  // Banner form state
  const [bannerForm, setBannerForm] = useState({
    title: '',
    tagline: '',
    position: 'top' as 'top' | 'bottom' | 'rotating_header',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=300&fit=crop&q=80',
    linkUrl: '#produtos',
    advertiserName: '',
    cityId: 'all',
    priceMonthly: 149.90,
    isActive: true,
    badgeText: 'Patrocinador Oficial',
  });

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerForm({
      title: '',
      tagline: '',
      position: 'top',
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=300&fit=crop&q=80',
      linkUrl: '#lojas',
      advertiserName: '',
      cityId: 'all',
      priceMonthly: 149.90,
      isActive: true,
      badgeText: 'Destaque Patrocinado',
    });
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.advertiserName || !bannerForm.imageUrl) return;

    const payload = {
      title: bannerForm.title.trim(),
      tagline: bannerForm.tagline.trim(),
      position: bannerForm.position,
      imageUrl: bannerForm.imageUrl,
      linkUrl: bannerForm.linkUrl.trim(),
      advertiserName: bannerForm.advertiserName.trim(),
      cityId: bannerForm.cityId,
      priceMonthly: Number(bannerForm.priceMonthly),
      isActive: bannerForm.isActive,
      badgeText: bannerForm.badgeText.trim() || 'Publicidade',
    };

    if (editingBannerId) {
      updateBanner(editingBannerId, payload);
      showAdminToast(`Banner "${payload.title}" atualizado com sucesso!`);
    } else {
      addBanner(payload);
      showAdminToast(`Banner "${payload.title}" publicado com sucesso!`);
    }

    resetBannerForm();
  };

  // City form
  const [cityForm, setCityForm] = useState({
    name: '',
    state: 'BA',
    description: '',
    isActive: true,
    isDefault: false,
  });

  // Category form
  const [catForm, setCatForm] = useState({
    name: '',
    iconName: 'Store',
    description: '',
    color: '#2563EB',
  });

  // Global multi-year discount form
  const [globalDiscountForm, setGlobalDiscountForm] = useState<PlanCycleDiscounts>({
    annual: planDiscountConfig.annual,
    biennial: planDiscountConfig.biennial,
    triennial: planDiscountConfig.triennial,
  });

  useEffect(() => {
    setGlobalDiscountForm({
      annual: planDiscountConfig.annual,
      biennial: planDiscountConfig.biennial,
      triennial: planDiscountConfig.triennial,
    });
  }, [planDiscountConfig]);

  // Plan form
  const [planForm, setPlanForm] = useState({
    name: '',
    priceMonthly: 0,
    productLimit: 5,
    businessLimit: 1,
    badge: 'Popular',
    featuresText: 'Cadastro da empresa\nDivulgação de produtos\nContato WhatsApp',
    highlighted: false,
    color: '#1D4ED8',
    useCustomDiscounts: false,
    cycleDiscounts: {
      annual: planDiscountConfig.annual,
      biennial: planDiscountConfig.biennial,
      triennial: planDiscountConfig.triennial,
    } as PlanCycleDiscounts,
  });

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [hgTab, setHgTab] = useState<'sql' | 'config' | 'api' | 'export_sql' | 'htaccess' | 'instructions'>('instructions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Package for HostGator
  const hgPackage = generateHostGatorPackage(
    cities,
    categories,
    plans,
    businesses,
    products,
    banners,
    services,
    storeProductCategories
  );

  // Metrics
  const totalCities = cities.length;
  const activeCitiesCount = cities.filter((c) => c.isActive).length;
  const totalBusinesses = businesses.length;
  const totalProducts = products.length;
  const totalServices = services.length;
  const totalCatalogItems = totalProducts + totalServices;
  const monthlyRevenue = businesses.reduce((acc, b) => {
    const p = plans.find((pl) => pl.id === b.planId);
    return acc + (p ? p.priceMonthly : 0);
  }, 0);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveMercadoPagoConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateMercadoPagoConfig({
      enabled: mpForm.enabled,
      environment: mpForm.environment,
      publicKey: mpForm.publicKey.trim(),
      accessToken: mpForm.accessToken.trim(),
      pixKey: mpForm.pixKey.trim(),
      statementDescriptor: mpForm.statementDescriptor.trim() || 'ACHENACIDADE',
      autoApproveInSandbox: mpForm.autoApproveInSandbox,
    });
    setAdminToast('Configurações do Mercado Pago salvas com sucesso!');
    setTimeout(() => setAdminToast(null), 3500);
  };

  const handleTestMercadoPagoConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult({ status: 'idle', message: '' });

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!mpForm.publicKey.trim() || !mpForm.accessToken.trim()) {
      setConnectionTestResult({
        status: 'error',
        message: 'Preencha a Public Key e o Access Token para realizar o teste de conexão.',
      });
      setIsTestingConnection(false);
      return;
    }

    const isSandboxKey = mpForm.publicKey.startsWith('TEST-') || mpForm.accessToken.startsWith('TEST-');
    if (mpForm.environment === 'production' && isSandboxKey) {
      setConnectionTestResult({
        status: 'error',
        message: 'Aviso: O ambiente está marcado como Produção, mas as chaves informadas iniciam com TEST- (Sandbox). Use chaves de produção (APP_USR-...).',
      });
      setIsTestingConnection(false);
      return;
    }

    setConnectionTestResult({
      status: 'success',
      message: `Credenciais válidas! Conexão com Mercado Pago (${mpForm.environment === 'production' ? 'Produção Ao Vivo' : 'Sandbox Teste'}) estabelecida com sucesso.`,
    });
    setIsTestingConnection(false);
  };

  const toSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleAddCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityForm.name.trim()) return;
    if (editingCityId) {
      updateCity(editingCityId, {
        ...cityForm,
        name: cityForm.name.trim(),
        description: cityForm.description.trim(),
        slug: `${toSlug(cityForm.name)}-${cityForm.state.toLowerCase()}`,
      });
      showAdminToast(`Cidade "${cityForm.name.trim()} - ${cityForm.state}" atualizada!`);
      setEditingCityId(null);
    } else {
      addCity({
        ...cityForm,
        name: cityForm.name.trim(),
        description: cityForm.description.trim(),
      });
      showAdminToast(`Cidade "${cityForm.name.trim()} - ${cityForm.state}" cadastrada!`);
    }
    setCityForm({ name: '', state: 'BA', description: '', isActive: true, isDefault: false });
  };

  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        ...catForm,
        name: catForm.name.trim(),
        description: catForm.description.trim(),
        slug: toSlug(catForm.name),
      });
      showAdminToast(`Categoria "${catForm.name.trim()}" atualizada!`);
      setEditingCategoryId(null);
    } else {
      addCategory({
        ...catForm,
        name: catForm.name.trim(),
        description: catForm.description.trim(),
      });
      showAdminToast(`Categoria "${catForm.name.trim()}" cadastrada!`);
    }
    setCatForm({ name: '', iconName: 'Store', description: '', color: '#2563EB' });
  };

  const handleSaveGlobalDiscounts = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlanDiscountConfig({
      annual: clampDiscountPercent(globalDiscountForm.annual),
      biennial: clampDiscountPercent(globalDiscountForm.biennial),
      triennial: clampDiscountPercent(globalDiscountForm.triennial),
    });
    setAdminToast('Descontos globais dos ciclos Anual, Bienal e Trienal atualizados!');
    setTimeout(() => setAdminToast(null), 3500);
  };

  const handleResetGlobalDiscounts = () => {
    resetPlanDiscountConfig();
    setGlobalDiscountForm({ annual: 15, biennial: 25, triennial: 35 });
    setAdminToast('Descontos padrão (15% Anual, 25% Bienal, 35% Trienal) restaurados.');
    setTimeout(() => setAdminToast(null), 3500);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name) return;

    const features = planForm.featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const normalizedCycleDiscounts: PlanCycleDiscounts = {
      annual: clampDiscountPercent(planForm.cycleDiscounts.annual),
      biennial: clampDiscountPercent(planForm.cycleDiscounts.biennial),
      triennial: clampDiscountPercent(planForm.cycleDiscounts.triennial),
    };

    const payload = {
      name: planForm.name,
      priceMonthly: Number(planForm.priceMonthly),
      productLimit: Number(planForm.productLimit),
      businessLimit: Number(planForm.businessLimit || 1),
      badge: planForm.badge,
      features,
      highlighted: planForm.highlighted,
      color: planForm.color,
      useCustomDiscounts: planForm.useCustomDiscounts,
      cycleDiscounts: planForm.useCustomDiscounts ? normalizedCycleDiscounts : undefined,
    };

    if (editingPlanId) {
      updatePlan(editingPlanId, payload);
      setEditingPlanId(null);
      setAdminToast(`Plano "${planForm.name}" atualizado com sucesso!`);
    } else {
      addPlan(payload);
      setAdminToast(`Plano "${planForm.name}" criado com sucesso!`);
    }
    setTimeout(() => setAdminToast(null), 3000);

    setPlanForm({
      name: '',
      priceMonthly: 0,
      productLimit: 5,
      businessLimit: 1,
      badge: 'Popular',
      featuresText: 'Cadastro da empresa\nDivulgação de produtos\nContato WhatsApp',
      highlighted: false,
      color: '#1D4ED8',
      useCustomDiscounts: false,
      cycleDiscounts: {
        annual: planDiscountConfig.annual,
        biennial: planDiscountConfig.biennial,
        triennial: planDiscountConfig.triennial,
      },
    });
  };

  const themesList: AdminTheme[] = [
    {
      themeName: 'Azul Cobalto & Laranja Vibrante (Padrão)',
      primaryColor: '#1D4ED8',
      primaryHover: '#1E40AF',
      accentColor: '#EA580C',
      accentHover: '#C2410C',
    },
    {
      themeName: 'Verde Esmeralda & Grafite',
      primaryColor: '#059669',
      primaryHover: '#047857',
      accentColor: '#0F172A',
      accentHover: '#334155',
    },
    {
      themeName: 'Roxo Noturno & Dourado',
      primaryColor: '#7C3AED',
      primaryHover: '#6D28D9',
      accentColor: '#D97706',
      accentHover: '#B45309',
    },
    {
      themeName: 'Azul Petróleo & Coral Moderno',
      primaryColor: '#0E7490',
      primaryHover: '#155E75',
      accentColor: '#F43F5E',
      accentHover: '#E11D48',
    },
    {
      themeName: 'Azul Marinho & Âmbar Executivo',
      primaryColor: '#1E3A8A',
      primaryHover: '#1E40AF',
      accentColor: '#F59E0B',
      accentHover: '#D97706',
    },
    {
      themeName: 'Terracota Sertão & Verde Oliva',
      primaryColor: '#C2410C',
      primaryHover: '#9A3412',
      accentColor: '#4D7C0F',
      accentHover: '#3F6212',
    },
    {
      themeName: 'Rosa Framboesa & Índigo Urbano',
      primaryColor: '#BE185D',
      primaryHover: '#9D174D',
      accentColor: '#4338CA',
      accentHover: '#3730A3',
    },
    {
      themeName: 'Grafite Moderno & Ciano Elétrico',
      primaryColor: '#1E293B',
      primaryHover: '#0F172A',
      accentColor: '#06B6D4',
      accentHover: '#0891B2',
    },
    {
      themeName: 'Vinho Bordô & Ouro Velho',
      primaryColor: '#881337',
      primaryHover: '#4C0519',
      accentColor: '#CA8A04',
      accentHover: '#A16207',
    },
    {
      themeName: 'Verde Floresta & Laranja Solar',
      primaryColor: '#15803D',
      primaryHover: '#166534',
      accentColor: '#F97316',
      accentHover: '#EA580C',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors pb-24 md:pb-12">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 sm:px-6 h-16 flex items-center justify-between border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar ao Início</span>
          </button>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold font-display leading-tight">
                Painel Administrativo Master
              </h1>
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                achenacidade
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dbSyncStatus === 'error' && (
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-xs font-bold text-white transition cursor-pointer"
              title={dbLastError || 'Erro ao gravar no MySQL'}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Erro MySQL</span>
            </button>
          )}
          <button
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            title="Sair da sessão administrativa"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Tabs Navigation (Desktop Sidebar + Mobile Grid Drawer) */}
      {(() => {
        const adminMenuItems: {
          id: typeof activeTab;
          label: string;
          icon: React.FC<{ className?: string }>;
          count?: number;
        }[] = [
          { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
          { id: 'cities', label: 'Cidades', icon: MapPin, count: cities.length },
          { id: 'categories', label: 'Categorias', icon: Tag, count: categories.length },
          { id: 'plans', label: 'Planos', icon: CreditCard, count: plans.length },
          { id: 'businesses', label: 'Empresas', icon: Building2, count: businesses.length },
          { id: 'banners', label: 'Banners', icon: Megaphone, count: banners.length },
          { id: 'payments', label: 'Pagamentos', icon: DollarSign },
          { id: 'emails', label: 'E-mails', icon: Mail, count: emailLogs.length },
          { id: 'creatives', label: 'Criativos', icon: Instagram },
          { id: 'sitemode', label: 'L & M', icon: Rocket },
          { id: 'theme', label: 'Cores', icon: Palette },
          { id: 'database', label: 'Banco MySQL', icon: Database },
          { id: 'hostgator', label: 'HostGator', icon: Server },
        ];

        const activeItem =
          adminMenuItems.find((item) => item.id === activeTab) || adminMenuItems[0];
        const ActiveIcon = activeItem.icon;

        return (
          <>
            {/* Mobile & Tablet Sticky Selector + Expandable 3-Col Grid */}
            <div className="lg:hidden sticky top-16 z-20 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <ActiveIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                      Seção atual
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {activeItem.label}
                      {typeof activeItem.count === 'number' ? ` (${activeItem.count})` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="px-3.5 min-h-[40px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isMobileMenuOpen ? 'Ocultar Menus' : 'Ver Menus'}</span>
                  {isMobileMenuOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isMobileMenuOpen && (
                <div className="px-3 pb-3 pt-1 grid grid-cols-3 sm:grid-cols-4 gap-2 border-t border-slate-200/70 dark:border-slate-800">
                  {adminMenuItems.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`min-h-[46px] px-2 py-2 rounded-xl text-xs font-semibold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                            }`}
                          />
                          {typeof tab.count === 'number' && (
                            <span
                              className={`text-[10px] font-mono tabular-nums ${
                                isActive ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              {tab.count}
                            </span>
                          )}
                        </div>
                        <span className="truncate max-w-full leading-tight">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Workspace Container: Left Sidebar + Main Content */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col lg:flex-row gap-6 items-start">
              <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 sticky top-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 gap-1">
                <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400">
                  Menu Administrativo
                </p>
                {adminMenuItems.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{tab.label}</span>
                      </span>
                      {typeof tab.count === 'number' && (
                        <span
                          className={`text-[11px] font-mono tabular-nums shrink-0 ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </aside>

              {/* Main Screen Body */}
              <main className="flex-1 min-w-0 w-full space-y-6">
                {/* Global Admin Feedback Toast */}
                {adminToast && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{adminToast}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminToast(null)}
                      className="text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:underline cursor-pointer shrink-0"
                    >
                      Fechar
                    </button>
                  </div>
                )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Cidades Cadastradas
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-900 dark:text-white font-mono">
                  {totalCities}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeCitiesCount} ativas no seletor
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900">
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                  Empresas Ativas
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-orange-900 dark:text-white font-mono">
                  {totalBusinesses}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Anunciando no diretório
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Anúncios na Vitrine
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-white font-mono tabular-nums">
                  {totalCatalogItems}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {totalProducts} produtos · {totalServices} serviços
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Faturamento Mensal
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  R$ {monthlyRevenue.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Soma das assinaturas
                </span>
              </div>
            </div>

            {/* HostGator Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                  <Server className="w-4 h-4" />
                  <span>Hospedagem HostGator Pronta</span>
                </div>
                <h3 className="text-base font-bold">
                  Código PHP 8.x e Banco MySQL Sincronizados
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Todas as cidades, categorias, planos e produtos estão preparados para serem exportados e importados com 1 clique no cPanel e phpMyAdmin da HostGator.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('hostgator')}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
              >
                <span>Abrir Central HostGator</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Deseja restaurar as cidades, categorias e produtos originais?
              </span>
              <button
                type="button"
                onClick={() =>
                  setPendingConfirm({
                    title: 'Restaurar Dados Padrão',
                    message:
                      'Tem certeza que deseja restaurar todas as cidades, categorias, empresas e produtos demonstrativos padrão? Suas alterações locais serão substituídas.',
                    confirmLabel: 'Restaurar Padrão',
                    variant: 'primary',
                    onConfirm: () => {
                      resetToDemoData();
                      showAdminToast('Dados demonstrativos padrão restaurados!');
                    },
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Dados Padrão</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: CIDADES */}
        {activeTab === 'cities' && (
          <div className="space-y-6">
            <form
              ref={cityFormRef}
              onSubmit={handleAddCitySubmit}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  {editingCityId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingCityId ? 'Editar Cidade do Diretório' : 'Cadastrar Nova Cidade no Diretório'}</span>
                </h4>
                {editingCityId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCityId(null);
                      setCityForm({ name: '', state: 'BA', description: '', isActive: true, isDefault: false });
                    }}
                    className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityForm.name}
                    onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                    placeholder="Ex: São José dos Campos"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado (UF) *
                  </label>
                  <select
                    value={cityForm.state}
                    onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                  >
                    {['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE', 'DF', 'GO', 'ES', 'MA', 'PA', 'PB', 'PI', 'RN', 'SE', 'AL', 'MT', 'MS', 'AM', 'TO', 'RO', 'AC', 'AP', 'RR'].map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição Resumida
                  </label>
                  <input
                    type="text"
                    value={cityForm.description}
                    onChange={(e) => setCityForm({ ...cityForm, description: e.target.value })}
                    placeholder="Ex: Polo aeroespacial e tecnológico"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cityForm.isActive}
                    onChange={(e) => setCityForm({ ...cityForm, isActive: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Cidade Ativa no Guia</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {editingCityId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingCityId ? 'Salvar Cidade' : 'Adicionar Cidade'}</span>
                </button>
              </div>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Cidade / UF</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Empresas</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {cities.map((city) => {
                    const count = businesses.filter((b) => b.cityId === city.id).length;
                    return (
                      <tr key={city.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {city.name} - {city.state}
                          {city.isDefault && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 text-[10px]">
                              Padrão
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{city.slug}</td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{count} empresas</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => updateCity(city.id, { isActive: !city.isActive })}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                              city.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {city.isActive ? 'Ativa' : 'Inativa'}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!city.isDefault && (
                              <button
                                type="button"
                                onClick={() => {
                                  cities.forEach((c) => updateCity(c.id, { isDefault: c.id === city.id }));
                                  showAdminToast(`"${city.name} - ${city.state}" definida como cidade padrão.`);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              >
                                Tornar Padrão
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCityId(city.id);
                                setCityForm({
                                  name: city.name,
                                  state: city.state,
                                  description: city.description || '',
                                  isActive: city.isActive,
                                  isDefault: !!city.isDefault,
                                });
                                cityFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs transition cursor-pointer"
                              title="Editar cidade"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingConfirm({
                                  title: 'Excluir Cidade',
                                  message: `Tem certeza que deseja remover a cidade "${city.name} - ${city.state}" do guia?`,
                                  confirmLabel: 'Excluir Cidade',
                                  variant: 'danger',
                                  onConfirm: () => {
                                    deleteCity(city.id);
                                    if (editingCityId === city.id) {
                                      setEditingCityId(null);
                                      setCityForm({ name: '', state: 'BA', description: '', isActive: true, isDefault: false });
                                    }
                                    showAdminToast(`Cidade "${city.name}" removida com sucesso.`);
                                  },
                                })
                              }
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                              title="Excluir cidade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CATEGORIAS */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <form
              ref={catFormRef}
              onSubmit={handleAddCatSubmit}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  {editingCategoryId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingCategoryId ? 'Editar Categoria Comercial' : 'Cadastrar Nova Categoria Comercial'}</span>
                </h4>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCatForm({ name: '', iconName: 'Store', description: '', color: '#2563EB' });
                    }}
                    className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="Ex: Farmácias & Drogarias"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ícone Representativo
                  </label>
                  <select
                    value={catForm.iconName}
                    onChange={(e) => setCatForm({ ...catForm, iconName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Utensils">Utensils (Gastronomia)</option>
                    <option value="Coffee">Coffee (Padarias, Cafés & Açaí)</option>
                    <option value="ShoppingBasket">ShoppingBasket (Mercados)</option>
                    <option value="Shirt">Shirt (Moda & Calçados)</option>
                    <option value="HeartPulse">HeartPulse (Clínicas & Saúde)</option>
                    <option value="Pill">Pill (Farmácias & Drogarias)</option>
                    <option value="Smartphone">Smartphone (Celulares & Tech)</option>
                    <option value="Hammer">Hammer (Construção & Reformas)</option>
                    <option value="Sofa">Sofa (Móveis & Decoração)</option>
                    <option value="Car">Car (Auto & Mecânica)</option>
                    <option value="Scissors">Scissors (Beleza & Barbearia)</option>
                    <option value="GraduationCap">GraduationCap (Educação)</option>
                    <option value="Home">Home (Imóveis)</option>
                    <option value="Dog">Dog (Pet Shop)</option>
                    <option value="BookOpen">BookOpen (Papelarias & Gráficas)</option>
                    <option value="Briefcase">Briefcase (Contabilidade & Advocacia)</option>
                    <option value="Sprout">Sprout (Agropecuária & Rações)</option>
                    <option value="Dumbbell">Dumbbell (Academias & Esportes)</option>
                    <option value="BedDouble">BedDouble (Hotéis & Pousadas)</option>
                    <option value="Glasses">Glasses (Óticas & Joias)</option>
                    <option value="Truck">Truck (Gás, Água & Bebidas)</option>
                    <option value="PartyPopper">PartyPopper (Festas & Eventos)</option>
                    <option value="Sparkles">Sparkles (Estética & Especiais)</option>
                    <option value="ShoppingBag">ShoppingBag (Varejo & Presentes)</option>
                    <option value="Store">Store (Comércio Geral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição Curta
                  </label>
                  <input
                    type="text"
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    placeholder="Ex: Remédios, perfumaria e plantão"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cor da Categoria
                  </label>
                  <input
                    type="color"
                    value={catForm.color}
                    onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {editingCategoryId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingCategoryId ? 'Atualizar Categoria' : 'Salvar Categoria'}</span>
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || '#2563EB' }}
                    />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        {cat.slug} · {cat.iconName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setCatForm({
                          name: cat.name,
                          iconName: cat.iconName || 'Store',
                          description: cat.description || '',
                          color: cat.color || '#2563EB',
                        });
                        catFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                      title="Editar categoria"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingConfirm({
                          title: 'Excluir Categoria',
                          message: `Tem certeza que deseja excluir a categoria "${cat.name}"?`,
                          confirmLabel: 'Excluir Categoria',
                          variant: 'danger',
                          onConfirm: () => {
                            deleteCategory(cat.id);
                            if (editingCategoryId === cat.id) {
                              setEditingCategoryId(null);
                              setCatForm({ name: '', iconName: 'Store', description: '', color: '#2563EB' });
                            }
                            showAdminToast(`Categoria "${cat.name}" excluída!`);
                          },
                        })
                      }
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PLANOS */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Regras Globais de Desconto por Ciclo */}
            <form
              onSubmit={handleSaveGlobalDiscounts}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Descontos Automáticos por Ciclo (Regra Global)</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aplicados automaticamente em Planos, Cadastro, Painel do Lojista e Checkout Mercado Pago (exceto planos com desconto personalizado).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetGlobalDiscounts}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 cursor-pointer self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão (15% / 25% / 35%)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ciclo Anual · 12 meses (% OFF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    step="0.5"
                    value={globalDiscountForm.annual}
                    onChange={(e) =>
                      setGlobalDiscountForm({
                        ...globalDiscountForm,
                        annual: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ciclo Bienal · 24 meses (% OFF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    step="0.5"
                    value={globalDiscountForm.biennial}
                    onChange={(e) =>
                      setGlobalDiscountForm({
                        ...globalDiscountForm,
                        biennial: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ciclo Trienal · 36 meses (% OFF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    step="0.5"
                    value={globalDiscountForm.triennial}
                    onChange={(e) =>
                      setGlobalDiscountForm({
                        ...globalDiscountForm,
                        triennial: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Regra Global de Descontos</span>
                </button>
              </div>
            </form>

            <form ref={planFormRef} onSubmit={handleSavePlan} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>{editingPlanId ? 'Editar Plano de Assinatura' : 'Cadastrar Novo Plano de Divulgação'}</span>
                </h4>
                {editingPlanId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlanId(null);
                      setPlanForm({
                        name: '',
                        priceMonthly: 0,
                        productLimit: 5,
                        businessLimit: 1,
                        badge: 'Popular',
                        featuresText: 'Cadastro da empresa\nDivulgação de produtos\nContato WhatsApp',
                        highlighted: false,
                        color: '#1D4ED8',
                        useCustomDiscounts: false,
                        cycleDiscounts: {
                          annual: planDiscountConfig.annual,
                          biennial: planDiscountConfig.biennial,
                          triennial: planDiscountConfig.triennial,
                        },
                      });
                    }}
                    className="text-xs text-slate-500 hover:underline cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="Ex: Plano Diamante"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Base Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planForm.priceMonthly}
                    onChange={(e) => setPlanForm({ ...planForm, priceMonthly: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Limite de Lojas por Conta *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={planForm.businessLimit}
                    onChange={(e) => setPlanForm({ ...planForm, businessLimit: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Limite Combinado (Produtos + Serviços) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={planForm.productLimit}
                    onChange={(e) => setPlanForm({ ...planForm, productLimit: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono font-bold text-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selo / Badge
                  </label>
                  <input
                    type="text"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    placeholder="Ex: Mais Popular, Destaque VIP"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recursos Inclusos (1 por linha)
                  </label>
                  <textarea
                    rows={3}
                    value={planForm.featuresText}
                    onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Custom Per-Plan Cycle Discounts (Optional Override) */}
              {planForm.priceMonthly > 0 && (() => {
                const draftPlan: Plan = {
                  id: editingPlanId || 'draft',
                  name: planForm.name || 'Prévia',
                  priceMonthly: Number(planForm.priceMonthly) || 0,
                  productLimit: planForm.productLimit,
                  businessLimit: planForm.businessLimit,
                  badge: planForm.badge,
                  features: [],
                  color: planForm.color,
                  useCustomDiscounts: planForm.useCustomDiscounts,
                  cycleDiscounts: planForm.cycleDiscounts,
                };

                return (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={planForm.useCustomDiscounts}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, useCustomDiscounts: e.target.checked })
                          }
                          className="rounded text-orange-600"
                        />
                        <span>Personalizar descontos exclusivos para este plano (sobrescreve a regra global)</span>
                      </label>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {planForm.useCustomDiscounts ? 'Modo Personalizado' : 'Usando Regra Global'}
                      </span>
                    </div>

                    {planForm.useCustomDiscounts && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Anual Personalizado (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="90"
                            step="0.5"
                            value={planForm.cycleDiscounts.annual}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                cycleDiscounts: {
                                  ...planForm.cycleDiscounts,
                                  annual: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Bienal Personalizado (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="90"
                            step="0.5"
                            value={planForm.cycleDiscounts.biennial}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                cycleDiscounts: {
                                  ...planForm.cycleDiscounts,
                                  biennial: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Trienal Personalizado (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="90"
                            step="0.5"
                            value={planForm.cycleDiscounts.triennial}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                cycleDiscounts: {
                                  ...planForm.cycleDiscounts,
                                  triennial: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Live 4-cycle price preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {BILLING_CYCLE_LIST.map((cycle) => {
                        const preview = calculatePlanPricing(draftPlan, cycle, planDiscountConfig);
                        return (
                          <div
                            key={cycle}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {preview.shortLabel}
                              </span>
                              {preview.discountPercent > 0 && (
                                <span className="text-[10px] font-mono font-extrabold text-emerald-600">
                                  -{preview.discountPercent}%
                                </span>
                              )}
                            </div>
                            <div className="font-mono font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                              {formatBRL(preview.totalAmount)}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                              {formatBRL(preview.effectiveMonthly)}/mês
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.highlighted}
                    onChange={(e) => setPlanForm({ ...planForm, highlighted: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Destacar como "Mais Escolhido" na Home</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{editingPlanId ? 'Salvar Modificações' : 'Criar Plano'}</span>
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between shadow-xs ${
                    p.highlighted
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.badge}
                      </span>
                    </div>

                    <div className="mt-2 text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
                      {p.priceMonthly === 0 ? 'Grátis' : `${formatBRL(p.priceMonthly)}/mês`}
                    </div>

                    {p.priceMonthly > 0 && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span>Valores por ciclo</span>
                          <span className={p.useCustomDiscounts ? 'text-orange-600' : 'text-blue-600'}>
                            {p.useCustomDiscounts ? 'Desconto Personalizado' : 'Regra Global'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono tabular-nums">
                          {(['annual', 'biennial', 'triennial'] as const).map((cycle) => {
                            const cp = calculatePlanPricing(p, cycle, planDiscountConfig);
                            return (
                              <div key={cycle} className="rounded-lg bg-white dark:bg-slate-900 px-2 py-1 border border-slate-200/70 dark:border-slate-700">
                                <div className="text-[10px] font-sans font-semibold text-slate-500 flex items-center justify-between">
                                  <span>{cp.shortLabel}</span>
                                  <span className="text-emerald-600 font-bold">-{cp.discountPercent}%</span>
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {formatBRL(cp.totalAmount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                      Cotas: {p.businessLimit || 1} {p.businessLimit === 1 ? 'loja' : 'lojas'} · {p.productLimit} itens/loja (prods + servs)
                    </div>

                    <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <span className="text-emerald-500">✓</span> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlanId(p.id);
                        setPlanForm({
                          name: p.name,
                          priceMonthly: p.priceMonthly,
                          productLimit: p.productLimit,
                          businessLimit: p.businessLimit || 1,
                          badge: p.badge,
                          featuresText: p.features.join('\n'),
                          highlighted: !!p.highlighted,
                          color: p.color,
                          useCustomDiscounts: !!p.useCustomDiscounts,
                          cycleDiscounts: {
                            annual: p.cycleDiscounts?.annual ?? planDiscountConfig.annual,
                            biennial: p.cycleDiscounts?.biennial ?? planDiscountConfig.biennial,
                            triennial: p.cycleDiscounts?.triennial ?? planDiscountConfig.triennial,
                          },
                        });
                        planFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-blue-600 hover:text-blue-800 rounded-lg bg-blue-50/70 hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
                      title="Editar plano"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingConfirm({
                          title: 'Excluir Plano',
                          message: `Tem certeza que deseja remover o plano "${p.name}"?`,
                          confirmLabel: 'Excluir Plano',
                          variant: 'danger',
                          onConfirm: () => {
                            deletePlan(p.id);
                            if (editingPlanId === p.id) {
                              setEditingPlanId(null);
                            }
                            showAdminToast(`Plano "${p.name}" removido com sucesso!`);
                          },
                        })
                      }
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Excluir plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: EMPRESAS */}
        {activeTab === 'businesses' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Todas as Empresas Cadastradas</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {businesses.length}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Como Administrador, você pode editar todos os dados, contatos, mídias, planos e credenciais de qualquer loja.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={businessSearchQuery}
                    onChange={(e) => setBusinessSearchQuery(e.target.value)}
                    placeholder="Buscar loja, contato..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none w-44 sm:w-56 focus:ring-2 focus:ring-blue-500"
                  />
                  {businessSearchQuery && (
                    <button
                      onClick={() => setBusinessSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <select
                  value={businessCityFilter}
                  onChange={(e) => setBusinessCityFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="all">Todas as Cidades</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Empresa</th>
                    <th className="p-3">Cidade</th>
                    <th className="p-3">Plano Atual</th>
                    <th className="p-3">Cota (Prod+Serv)</th>
                    <th className="p-3">Verificada</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {businesses
                    .filter((b) => {
                      const query = businessSearchQuery.toLowerCase().trim();
                      const matchesSearch =
                        !query ||
                        b.name.toLowerCase().includes(query) ||
                        b.neighborhood?.toLowerCase().includes(query) ||
                        b.whatsapp?.includes(query) ||
                        b.ownerEmail?.toLowerCase().includes(query) ||
                        b.email?.toLowerCase().includes(query);
                      const matchesCity = businessCityFilter === 'all' || b.cityId === businessCityFilter;
                      return matchesSearch && matchesCity;
                    })
                    .map((biz) => {
                      const city = cities.find((c) => c.id === biz.cityId);
                      const quota = getBusinessQuotaUsage(biz.id);

                      return (
                        <tr key={biz.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 flex items-center gap-2.5">
                            <img
                              src={biz.logoUrl}
                              alt={biz.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{biz.name}</span>
                                {biz.isVerified && (
                                  <span title="Loja Verificada" className="inline-flex">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {biz.neighborhood ? `${biz.neighborhood} · ` : ''}{biz.whatsapp}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{city?.name}</td>
                          <td className="p-3">
                            <select
                              value={biz.planId}
                              onChange={(e) => {
                                updateBusiness(biz.id, { planId: e.target.value });
                                setAdminToast(`Plano da empresa "${biz.name}" alterado.`);
                                setTimeout(() => setAdminToast(null), 3000);
                              }}
                              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-xs cursor-pointer font-medium"
                            >
                              {plans.map((pl) => (
                                <option key={pl.id} value={pl.id}>
                                  {pl.name} ({pl.productLimit} itens)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <div className={`font-mono tabular-nums font-bold ${quota.isFull ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                              {quota.totalUsed} / {quota.limit}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {quota.productsCount}p · {quota.servicesCount}s
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                updateBusiness(biz.id, { isVerified: !biz.isVerified });
                                setAdminToast(`Status de verificação da loja "${biz.name}" atualizado.`);
                                setTimeout(() => setAdminToast(null), 3000);
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                biz.isVerified
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 hover:bg-blue-200'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                              title="Clique para alternar o selo de verificação"
                            >
                              {biz.isVerified ? 'Sim' : 'Não'}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Business Button */}
                              <button
                                onClick={() => setEditingBusiness(biz)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs transition cursor-pointer shadow-2xs"
                                title="Editar dados cadastrais, contatos, mídias e senha da loja"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>

                              {/* Delete Business Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingConfirm({
                                    title: 'Excluir Empresa',
                                    message: `Remover empresa "${biz.name}"? Todos os produtos e serviços vinculados a ela também serão excluídos permanentemente.`,
                                    confirmLabel: 'Excluir Empresa',
                                    variant: 'danger',
                                    onConfirm: () => {
                                      deleteBusiness(biz.id);
                                      showAdminToast(`Empresa "${biz.name}" removida com sucesso.`);
                                    },
                                  })
                                }
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                                title="Excluir empresa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {businesses.filter((b) => {
                const query = businessSearchQuery.toLowerCase().trim();
                const matchesSearch =
                  !query ||
                  b.name.toLowerCase().includes(query) ||
                  b.neighborhood?.toLowerCase().includes(query) ||
                  b.whatsapp?.includes(query);
                const matchesCity = businessCityFilter === 'all' || b.cityId === businessCityFilter;
                return matchesSearch && matchesCity;
              }).length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  Nenhuma loja encontrada para o filtro selecionado.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: BANNERS & PUBLICIDADE (Admin exclusive & separate billing) */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            {/* Informational Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Megaphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Controle Exclusivo de Banners & Publicidade Patrocinada
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Conforme configurado, os banners publicitários são <strong>cadastrados apenas pelo Administrador</strong> e são <strong>cobrados separadamente</strong> dos planos de assinatura de produtos das lojas.
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Banners</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{banners.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Banners Ativos</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {banners.filter((b) => b.isActive).length}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Faturamento Banners</span>
                <div className="text-2xl font-black text-blue-600 mt-1">
                  R$ {banners.filter((b) => b.isActive).reduce((acc, b) => acc + b.priceMonthly, 0).toFixed(2).replace('.', ',')}
                </div>
                <span className="text-[10px] text-slate-400">/mês em publicidade</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Cliques Totais</span>
                <div className="text-2xl font-black text-orange-600 mt-1">
                  {banners.reduce((acc, b) => acc + (b.clicksCount || 0), 0)}
                </div>
              </div>
            </div>

            {/* Form: Cadastrar / Editar Banner */}
            <div ref={bannerFormRef} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {editingBannerId ? <Edit2 className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-orange-600" />}
                  {editingBannerId
                    ? 'Editar Banner Patrocinado'
                    : 'Cadastrar Novo Banner Patrocinado (Cobrança Separada)'}
                </h4>
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={resetBannerForm}
                    className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveBanner} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Título do Anúncio *
                    </label>
                    <input
                      type="text"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="Ex: Super Festival Gastronômico"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Anunciante / Empresa *
                    </label>
                    <input
                      type="text"
                      value={bannerForm.advertiserName}
                      onChange={(e) => setBannerForm({ ...bannerForm, advertiserName: e.target.value })}
                      placeholder="Ex: Rede de Restaurantes Sabor"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Posição de Exibição *
                    </label>
                    <select
                      value={bannerForm.position}
                      onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="top">Topo da Home (Acima da Pesquisa)</option>
                      <option value="bottom">Rodapé da Home (Abaixo da Pesquisa)</option>
                      <option value="rotating_header">Topo Rotativo das Páginas (Lojas/Produtos/Categorias)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cidade de Exibição
                    </label>
                    <select
                      value={bannerForm.cityId}
                      onChange={(e) => setBannerForm({ ...bannerForm, cityId: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="all">Todas as Cidades (Global)</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Valor Cobrado Avulso (R$/mês) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bannerForm.priceMonthly}
                      onChange={(e) => setBannerForm({ ...bannerForm, priceMonthly: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Texto do Selo / Badge
                    </label>
                    <input
                      type="text"
                      value={bannerForm.badgeText}
                      onChange={(e) => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                      placeholder="Ex: Patrocinador Master, Destaque"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subtítulo / Chamada (Tagline)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.tagline}
                      onChange={(e) => setBannerForm({ ...bannerForm, tagline: e.target.value })}
                      placeholder="Ex: Conheça os pratos premiados com entrega grátis em toda a região"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Link de Destino
                    </label>
                    <input
                      type="text"
                      value={bannerForm.linkUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                      placeholder="Ex: #lojas, #produtos, #planos ou https://..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <ImageUploadField
                    value={bannerForm.imageUrl}
                    onChange={(url) => setBannerForm({ ...bannerForm, imageUrl: url })}
                    label="Imagem de Fundo do Banner Publicitário"
                    helpText="Envie um arquivo de imagem em formato panorâmico (1200x300px recomendado), faça upload do computador ou selecione um modelo pronto."
                    presetSamples={[
                      { label: 'Gastronomia', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=300&fit=crop&q=80' },
                      { label: 'Tecnologia', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=300&fit=crop&q=80' },
                      { label: 'Comércio & Serviços', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=300&fit=crop&q=80' },
                      { label: 'Moda & Vendas', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop&q=80' },
                    ]}
                    aspectRatio="banner"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {editingBannerId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingBannerId ? 'Atualizar Banner' : 'Salvar e Ativar Banner'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of Registered Banners */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Banners Publicitários Cadastrados ({banners.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative h-24 rounded-xl overflow-hidden mb-3 bg-slate-950">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-600 text-white">
                          {b.position === 'top' ? 'Topo Home' : b.position === 'bottom' ? 'Rodapé Home' : 'Rotativo Páginas'}
                        </span>
                        <span className="absolute bottom-2 left-2 text-xs font-bold text-white drop-shadow-sm truncate max-w-[80%]">
                          {b.title}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">{b.advertiserName}</span>
                        <span className="font-extrabold text-blue-600">
                          R$ {b.priceMonthly.toFixed(2).replace('.', ',')}/mês
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Cidade: {b.cityId === 'all' ? 'Todas' : cities.find(c => c.id === b.cityId)?.name || b.cityId}</span>
                        <span>{b.clicksCount || 0} cliques</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBannerStatus(b.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          b.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {b.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{b.isActive ? 'Ativo' : 'Pausado'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBannerId(b.id);
                            setBannerForm({
                              title: b.title,
                              tagline: b.tagline || '',
                              position: b.position,
                              imageUrl: b.imageUrl,
                              linkUrl: b.linkUrl || '#produtos',
                              advertiserName: b.advertiserName,
                              cityId: b.cityId || 'all',
                              priceMonthly: b.priceMonthly,
                              isActive: b.isActive,
                              badgeText: b.badgeText || 'Patrocinador Oficial',
                            });
                            bannerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs transition cursor-pointer"
                          title="Editar banner"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setPendingConfirm({
                              title: 'Excluir Banner',
                              message: `Tem certeza que deseja excluir o banner publicitário "${b.title}"?`,
                              confirmLabel: 'Excluir Banner',
                              variant: 'danger',
                              onConfirm: () => {
                                deleteBanner(b.id);
                                if (editingBannerId === b.id) {
                                  resetBannerForm();
                                }
                                showAdminToast(`Banner "${b.title}" excluído com sucesso!`);
                              },
                            })
                          }
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Excluir banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAGAMENTOS (MERCADO PAGO) */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                    Integração com Mercado Pago (Planos & Assinaturas)
                  </h4>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      !mpForm.enabled
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : mpForm.environment === 'production'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {!mpForm.enabled
                      ? 'Desativado'
                      : mpForm.environment === 'production'
                      ? 'Produção (Ao Vivo)'
                      : 'Sandbox (Testes)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure as chaves da sua conta Mercado Pago para receber pagamentos de planos das lojas via PIX com QR Code dinâmico e Cartão de Crédito.
                </p>
              </div>

              {/* Botão de Testar Conexão Rápido */}
              <button
                type="button"
                onClick={handleTestMercadoPagoConnection}
                disabled={isTestingConnection}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold transition cursor-pointer shadow-2xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                <span>{isTestingConnection ? 'Testando Conexão...' : 'Testar Conexão'}</span>
              </button>
            </div>

            {/* Test Connection Alert Banner */}
            {connectionTestResult.status === 'success' && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-200 animate-fade-in shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Conexão Estabelecida com Sucesso!</strong>
                  <span>{connectionTestResult.message}</span>
                </div>
              </div>
            )}

            {connectionTestResult.status === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-2xl flex items-start gap-3 text-xs text-red-800 dark:text-red-200 animate-fade-in shadow-2xs">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Falha no Teste de Conexão</strong>
                  <span>{connectionTestResult.message}</span>
                </div>
              </div>
            )}

            {/* Formulário de Configuração das Chaves */}
            <form onSubmit={handleSaveMercadoPagoConfig} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-sky-600" />
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    Credenciais da API do Mercado Pago
                  </h5>
                </div>

                {/* Switch Ativar / Desativar */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mpForm.enabled}
                    onChange={(e) => setMpForm({ ...mpForm, enabled: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer rounded"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Habilitar Pagamentos
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Ambiente */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ambiente de Execução *
                  </label>
                  <select
                    value={mpForm.environment}
                    onChange={(e) => setMpForm({ ...mpForm, environment: e.target.value as 'sandbox' | 'production' })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="sandbox">Sandbox (Modo de Teste / Simulação sem cobrança real)</option>
                    <option value="production">Produção (Modo Real / Recebimento Oficial)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Em Sandbox você pode testar todo o fluxo do PIX e Cartão sem movimentar dinheiro real.
                  </span>
                </div>

                {/* Nome na Fatura */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome na Fatura do Cartão (Statement Descriptor)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={mpForm.statementDescriptor}
                    onChange={(e) => setMpForm({ ...mpForm, statementDescriptor: e.target.value.toUpperCase() })}
                    placeholder="ACHENACIDADE"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Texto curto de até 16 caracteres que aparece no extrato bancário do lojista.
                  </span>
                </div>

                {/* Public Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Public Key (Chave Pública) *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={mpForm.publicKey}
                      onChange={(e) => setMpForm({ ...mpForm, publicKey: e.target.value.trim() })}
                      placeholder="Ex: TEST-b8830182-1209-42b7-... ou APP_USR-..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Utilizada no checkout do frontend para tokenização segura do cartão.
                  </span>
                </div>

                {/* Access Token */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Access Token (Token de Acesso Privado) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showAccessToken ? 'text' : 'password'}
                      required
                      value={mpForm.accessToken}
                      onChange={(e) => setMpForm({ ...mpForm, accessToken: e.target.value.trim() })}
                      placeholder="Ex: TEST-192837465012-... ou APP_USR-..."
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                      title={showAccessToken ? 'Ocultar token' : 'Revelar token'}
                    >
                      {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Token secreto para autorização de cobranças e emissão de QR Code PIX.
                  </span>
                </div>

                {/* Chave PIX Padrão */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chave PIX Principal da Plataforma (E-mail, CNPJ ou Aleatória)
                  </label>
                  <div className="relative">
                    <QrCode className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                    <input
                      type="text"
                      value={mpForm.pixKey}
                      onChange={(e) => setMpForm({ ...mpForm, pixKey: e.target.value.trim() })}
                      placeholder="Ex: financeiro@achenacidade.com.br ou 12.345.678/0001-90"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Chave PIX associada à sua conta Mercado Pago para geração do payload dinâmico.
                  </span>
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  As chaves ficam salvas no sistema e são exportadas automaticamente nos arquivos de configuração HostGator.
                </span>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Configurações do Mercado Pago</span>
                </button>
              </div>
            </form>

            {/* Guia Passo a Passo: Como obter chaves */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-600" />
                <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Como obter suas credenciais no Mercado Pago Developers:
                </h5>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 font-black flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <strong className="block text-slate-900 dark:text-white">Acesse o Portal</strong>
                  <p className="text-slate-500 text-[11px]">
                    Entre em <strong>mercadopago.com.br/developers</strong> e faça login com sua conta Mercado Pago / Mercado Livre.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 font-black flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <strong className="block text-slate-900 dark:text-white">Crie a Aplicação</strong>
                  <p className="text-slate-500 text-[11px]">
                    Acesse <em>Suas integrações</em> e clique em <em>Criar aplicação</em> (ex: <em>Achenacidade Planos</em>).
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 font-black flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <strong className="block text-slate-900 dark:text-white">Copie as Chaves</strong>
                  <p className="text-slate-500 text-[11px]">
                    Copie a <strong>Public Key</strong> e o <strong>Access Token</strong> (seja de Teste/Sandbox ou Produção).
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 font-black flex items-center justify-center text-[11px]">
                    4
                  </span>
                  <strong className="block text-slate-900 dark:text-white">Cole e Salve</strong>
                  <p className="text-slate-500 text-[11px]">
                    Cole nos campos acima, clique em <strong>Testar Conexão</strong> e depois em <strong>Salvar</strong>. Pronto!
                  </p>
                </div>
              </div>
            </div>

            {/* Histórico de Transações de Pagamento */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Histórico de Transações Mercado Pago</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {paymentTransactions.length}
                    </span>
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registro de pagamentos de assinaturas realizados pelos lojistas via PIX e Cartão de Crédito.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Total Arrecadado:</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    R$ {paymentTransactions.reduce((acc, t) => acc + (t.status === 'approved' ? t.amount : 0), 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Data / Hora</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Plano</th>
                      <th className="p-3">Método</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">ID Mercado Pago</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paymentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {tx.createdAt}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {tx.businessName}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-[11px]">
                              {tx.planName}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {BILLING_CYCLE_META[tx.billingCycle || 'monthly'].shortLabel}
                              {tx.discountPercent && tx.discountPercent > 0 ? ` (-${tx.discountPercent}%)` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            {tx.paymentMethod === 'pix' ? (
                              <>
                                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                                <span>PIX</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                <span>
                                  Cartão ({tx.cardBrand || 'Crédito'}
                                  {tx.installments && tx.installments > 1 ? ` · ${tx.installments}x` : ''})
                                </span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatBRL(tx.amount)}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {tx.mercadoPagoPaymentId}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" /> Aprovado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {paymentTransactions.length === 0 && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    Nenhum pagamento registrado até o momento.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CRIATIVOS INSTAGRAM & STORIES */}
        {activeTab === 'creatives' && <SocialCreativesStudio />}

        {/* TAB: TEMA */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Identidade Visual e Cores da Marca (achenacidade)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Selecione uma paleta pré-definida ou personalize as cores primárias e de destaque da plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themesList.map((th, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setAdminTheme(th);
                    showAdminToast(`Paleta "${th.themeName}" aplicada em toda a plataforma!`);
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    adminTheme.themeName === th.themeName
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{th.themeName}</h5>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full shadow-xs border border-black/10"
                        style={{ backgroundColor: th.primaryColor }}
                        title={`Primária: ${th.primaryColor}`}
                      />
                      <div
                        className="w-5 h-5 rounded-full shadow-xs border border-black/10"
                        style={{ backgroundColor: th.primaryHover }}
                        title={`Hover: ${th.primaryHover}`}
                      />
                      <div
                        className="w-5 h-5 rounded-full shadow-xs border border-black/10"
                        style={{ backgroundColor: th.accentColor }}
                        title={`Acento: ${th.accentColor}`}
                      />
                      <span className="text-[11px] text-slate-500 font-mono">
                        {th.primaryColor} / {th.accentColor}
                      </span>
                    </div>
                  </div>

                  {adminTheme.themeName === th.themeName && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: E-MAILS & SMTP */}
        {activeTab === 'emails' && <AdminEmailTab />}

        {/* TAB: LANÇAMENTO & MANUTENÇÃO */}
        {activeTab === 'sitemode' && <AdminSiteModeTab />}

        {/* TAB: BANCO DE DADOS MYSQL */}
        {activeTab === 'database' && (
          <AdminDatabaseTab onNotify={(msg) => showAdminToast(msg)} />
        )}

        {/* TAB: HOSTGATOR */}
        {activeTab === 'hostgator' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200 mb-1">
                  <Server className="w-4 h-4" />
                  <span>Gerador & Exportador HostGator</span>
                </div>
                <h3 className="text-lg font-black font-display">
                  Deploy Completo em PHP 8.x & MySQL para HostGator (cPanel)
                </h3>
                <p className="text-xs text-white/90 max-w-xl mt-1">
                  Baixe os scripts PHP com conexão PDO segura, o arquivo schema.sql completo para importar no phpMyAdmin e o passo a passo de configuração.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    downloadFile('schema.sql', hgPackage.schemaSql, 'application/sql');
                    downloadFile('config.php', hgPackage.configPhp, 'application/x-httpd-php');
                    downloadFile('api.php', hgPackage.apiPhp, 'application/x-httpd-php');
                    downloadFile('export_sql.php', hgPackage.exportSqlPhp, 'application/x-httpd-php');
                    downloadFile('.htaccess', hgPackage.htaccess, 'text/plain');
                    downloadFile('INSTRUCOES_HOSTGATOR.txt', hgPackage.instructionsTxt, 'text/plain');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-md hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4 text-orange-600" />
                  <span>Baixar Todos os Arquivos (PHP + SQL)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
              {[
                { id: 'instructions', label: '1. Manual cPanel HostGator' },
                { id: 'sql', label: '2. schema.sql (DDL + Dados)' },
                { id: 'config', label: '3. config.php (PDO)' },
                { id: 'api', label: '4. api.php (REST)' },
                { id: 'export_sql', label: '5. export_sql.php (Exportador SQL)' },
                { id: 'htaccess', label: '6. .htaccess' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setHgTab(item.id as typeof hgTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    hgTab === item.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative rounded-2xl bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto border border-slate-800 max-h-96">
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    let content = '';
                    let filename = '';
                    if (hgTab === 'sql') { content = hgPackage.schemaSql; filename = 'schema.sql'; }
                    else if (hgTab === 'config') { content = hgPackage.configPhp; filename = 'config.php'; }
                    else if (hgTab === 'api') { content = hgPackage.apiPhp; filename = 'api.php'; }
                    else if (hgTab === 'export_sql') { content = hgPackage.exportSqlPhp; filename = 'export_sql.php'; }
                    else if (hgTab === 'htaccess') { content = hgPackage.htaccess; filename = '.htaccess'; }
                    else { content = hgPackage.instructionsTxt; filename = 'INSTRUCOES_HOSTGATOR.txt'; }
                    
                    downloadFile(filename, content);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-[11px] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>

                <button
                  onClick={() => {
                    let content = '';
                    if (hgTab === 'sql') content = hgPackage.schemaSql;
                    else if (hgTab === 'config') content = hgPackage.configPhp;
                    else if (hgTab === 'api') content = hgPackage.apiPhp;
                    else if (hgTab === 'export_sql') content = hgPackage.exportSqlPhp;
                    else if (hgTab === 'htaccess') content = hgPackage.htaccess;
                    else content = hgPackage.instructionsTxt;
                    handleCopy(hgTab, content);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] cursor-pointer"
                >
                  {copiedKey === hgTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === hgTab ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <pre className="pr-36">
                {hgTab === 'sql' && hgPackage.schemaSql}
                {hgTab === 'config' && hgPackage.configPhp}
                {hgTab === 'api' && hgPackage.apiPhp}
                {hgTab === 'export_sql' && hgPackage.exportSqlPhp}
                {hgTab === 'htaccess' && hgPackage.htaccess}
                {hgTab === 'instructions' && hgPackage.instructionsTxt}
              </pre>
            </div>
          </div>
        )}

      </main>
            </div>
          </>
        );
      })()}

      {/* Modal de Edição Completa da Loja pelo Administrador */}
      {editingBusiness && (
        <AdminBusinessEditModal
          isOpen={!!editingBusiness}
          onClose={() => setEditingBusiness(null)}
          business={editingBusiness}
          onSave={(businessId, updates) => {
            updateBusiness(businessId, updates);
            showAdminToast(`Dados da loja "${updates.name || editingBusiness.name}" foram atualizados com sucesso!`);
          }}
          cities={cities}
          categories={categories}
          plans={plans}
        />
      )}

      {/* Modal de Confirmação Unificado (compatível com iFrame / Mobile / Desktop) */}
      <ConfirmModal
        isOpen={!!pendingConfirm}
        title={pendingConfirm?.title || ''}
        message={pendingConfirm?.message || ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        variant={pendingConfirm?.variant || 'danger'}
        onConfirm={() => {
          pendingConfirm?.onConfirm();
        }}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
};
