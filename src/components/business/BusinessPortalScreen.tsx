import React, { useState, useRef, useEffect } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { BillingCycle, DaySchedule, ServicePriceType, ServiceMode } from '../../types';
import { ImageUploadField } from '../common/ImageUploadField';
import { BillingCycleSelector } from '../common/BillingCycleSelector';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  BILLING_CYCLE_META,
  calculatePlanPricing,
  canManageRotatingBanners,
  formatBRL,
  getPlanExpirationInfo,
  isFounderPlan,
  isInviteTrialPlan,
  isLifetimePlan,
  isPaidPlan,
} from '../../utils/planPricing';
import { formatServicePrice, getServiceModeLabel } from '../../utils/serviceFormatters';
import { cloneWeeklySchedule } from '../../utils/scheduleHelpers';
import { getBusinessLogoUrl } from '../../utils/businessMedia';
import serviceTechRepairImg from '../../assets/images/service_tech_repair_1794881238745.jpg';
import servicePetGroomingImg from '../../assets/images/service_pet_grooming_1794881240613.jpg';
import serviceCoffeeCateringImg from '../../assets/images/service_coffee_catering_1794881242678.jpg';
import serviceFashionTailoringImg from '../../assets/images/service_fashion_tailoring_1794881240460.jpg';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  AlertCircle,
  Store,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Phone,
  MessageCircle,
  MapPin,
  Tag,
  Package,
  Clock,
  Globe,
  Instagram,
  Facebook,
  Mail,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Calendar,
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Users,
  Edit2,
  Zap,
  Plus,
  Trash2,
  LogOut,
  ShieldCheck,
  Check,
  FolderPlus,
  Folder,
  Layers,
  Wrench,
  Award,
  Gift,
  Ban,
} from 'lucide-react';

const defaultWeeklySchedule: DaySchedule[] = [
  { day: 'Segunda-feira', shortDay: 'Seg', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Terça-feira', shortDay: 'Ter', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Quarta-feira', shortDay: 'Qua', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Quinta-feira', shortDay: 'Qui', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Sexta-feira', shortDay: 'Sex', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Sábado', shortDay: 'Sáb', isOpen: true, openTime: '08:00', closeTime: '13:00' },
  { day: 'Domingo', shortDay: 'Dom', isOpen: false, openTime: '09:00', closeTime: '13:00' },
];

export const BusinessPortalScreen: React.FC = () => {
  const {
    setCurrentView,
    businessPortalTab: activeTab,
    setBusinessPortalTab: setActiveTab,
    logout,
    cities,
    categories,
    plans,
    businesses,
    products,
    services,
    registerBusinessAndLogin,
    updateBusiness,
    addProduct,
    deleteProduct,
    addService,
    deleteService,
    getBusinessQuotaUsage,
    storeProductCategories,
    addStoreProductCategory,
    updateStoreProductCategory,
    deleteStoreProductCategory,
    currentBusinessAuth,
    switchActiveBusiness,
    renewSession,
    authSession,
    openPaymentModal,
    openCheckoutPage,
    sendTemplatedEmail,
    sendVerificationCodeEmail,
    verifyEmailCode,
    paymentTransactions,
    planDiscountConfig,
    preselectedBillingCycle,
    getBusinessMetrics,
    loadBusinessMetricsFromDb,
    applyInviteCodeToBusiness,
    cancelBusinessSubscription,
    activeInviteCode,
    banners,
    addMerchantBanner,
    toggleBannerStatus,
    deleteBanner,
  } = useDirectory();

  // Strictly use authenticated business session (no unauthenticated demo fallback)
  const activeBusiness =
    currentBusinessAuth || businesses.find((b) => b.id === authSession.businessId) || null;
  const activePlan = activeBusiness ? plans.find((p) => p.id === activeBusiness.planId) || plans[0] : null;
  const expirationInfo = getPlanExpirationInfo(activeBusiness, activePlan);
  const businessProducts = activeBusiness ? products.filter((p) => p.businessId === activeBusiness.id) : [];
  const businessServices = activeBusiness ? services.filter((s) => s.businessId === activeBusiness.id) : [];
  const activeStoreCategories = activeBusiness ? storeProductCategories.filter((c) => c.businessId === activeBusiness.id) : [];

  // User's owned businesses (restricted strictly to the authenticated user's account)
  const userOwnerEmail = activeBusiness?.ownerEmail || authSession.email || '';
  const myBusinesses = businesses.filter(
    (b) =>
      (userOwnerEmail &&
        ((b.ownerEmail && b.ownerEmail.toLowerCase() === userOwnerEmail.toLowerCase()) ||
          (b.email && b.email.toLowerCase() === userOwnerEmail.toLowerCase()))) ||
      b.id === activeBusiness?.id
  );

  const storeLimit = activePlan ? (activePlan.businessLimit || 1) : 1;
  const isStoreQuotaFull = myBusinesses.length >= storeLimit;

  const quota = activeBusiness
    ? getBusinessQuotaUsage(activeBusiness.id)
    : { productsCount: 0, servicesCount: 0, totalUsed: 0, limit: 3, remaining: 3, isFull: false };
  const productLimit = quota.limit;
  const isQuotaFull = quota.isFull;

  const canCreateRotatingBanners = canManageRotatingBanners(activePlan);
  const myMerchantBanners = activeBusiness
    ? banners.filter(
        (b) =>
          b.advertiserName.trim().toLowerCase() === activeBusiness.name.trim().toLowerCase()
      )
    : [];

  const [merchantBannerForm, setMerchantBannerForm] = useState({
    title: '',
    tagline: '',
    position: 'rotating_header' as 'top' | 'bottom' | 'rotating_header',
    linkUrl: '#produtos',
    cityId: activeBusiness?.cityId || 'all',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=300&fit=crop&q=80',
    badgeText: 'Anunciante VIP',
  });

  // Active Tab state synced via DirectoryContext for Mobile Bottom Menu
  const [upgradeCycle, setUpgradeCycle] = useState<BillingCycle>(
    activeBusiness?.billingCycle || preselectedBillingCycle || 'monthly'
  );

  // Store Product Category creation form
  const [storeCatForm, setStoreCatForm] = useState({
    name: '',
    description: '',
  });
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isResendingVerifyCode, setIsResendingVerifyCode] = useState(false);
  const [verifyEmailFeedback, setVerifyEmailFeedback] = useState<{
    type: 'info' | 'success' | 'error';
    text: string;
    debugCode?: string;
  } | null>(null);

  const [inviteInput, setInviteInput] = useState(activeInviteCode || '');
  const [isApplyingInvite, setIsApplyingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    setVerifyCodeInput('');
    setVerifyEmailFeedback(null);
  }, [activeBusiness?.id]);

  useEffect(() => {
    if (activeInviteCode && !inviteInput) {
      setInviteInput(activeInviteCode);
    }
  }, [activeInviteCode]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset image samples for quick selection
  const productPresetSamples = [
    { label: 'Hambúrguer Gourmet', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop&q=80' },
    { label: 'Pizza Calabresa', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=400&fit=crop&q=80' },
    { label: 'Fone Bluetooth', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=400&fit=crop&q=80' },
    { label: 'Tênis Esportivo', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=400&fit=crop&q=80' },
    { label: 'Café Especial', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=400&fit=crop&q=80' },
  ];

  const servicePresetSamples = [
    { label: 'Assistência Técnica', url: serviceTechRepairImg },
    { label: 'Banho & Tosa', url: servicePetGroomingImg },
    { label: 'Coffee Break & Eventos', url: serviceCoffeeCateringImg },
    { label: 'Ajustes & Costura', url: serviceFashionTailoringImg },
  ];

  const logoPresetSamples = [
    { label: 'Gastronomia', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=300&fit=crop&q=80' },
    { label: 'Boutique', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&q=80' },
    { label: 'Tecnologia', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop&q=80' },
    { label: 'Drogaria', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&q=80' },
  ];

  // Edit Store Profile Form State
  const [editForm, setEditForm] = useState({
    name: '',
    cityId: '',
    categoryId: '',
    planId: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    neighborhood: '',
    logoUrl: '',
    instagram: '',
    facebook: '',
    website: '',
  });

  // Password Edit State
  const [editPassword, setEditPassword] = useState('');
  const [confirmEditPassword, setConfirmEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Day-by-day customized schedule state
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    () => cloneWeeklySchedule(activeBusiness?.weeklySchedule)
  );

  // New Business Form State
  const [newBizForm, setNewBizForm] = useState({
    name: '',
    cityId: cities[0]?.id || '',
    categoryId: categories[0]?.id || '',
    planId: plans.find((p) => !p.isInviteOnly)?.id || plans[0]?.id || '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    neighborhood: '',
    logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=300&h=300&fit=crop&q=80',
    instagram: '',
    facebook: '',
    website: '',
    password: '',
    confirmPassword: '',
  });

  // New Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=400&fit=crop&q=80',
    category: '',
  });

  // New Service Form State
  const [servForm, setServForm] = useState({
    name: '',
    priceType: 'fixed' as ServicePriceType,
    price: '',
    duration: '',
    serviceMode: 'on_site' as ServiceMode,
    category: '',
    imageUrl: serviceTechRepairImg,
    description: '',
  });

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Populate edit form when activeBusiness changes
  useEffect(() => {
    if (activeBusiness) {
      setEditForm({
        name: activeBusiness.name || '',
        cityId: activeBusiness.cityId || cities[0]?.id || '',
        categoryId: activeBusiness.categoryId || categories[0]?.id || '',
        planId: activeBusiness.planId || plans[0]?.id || '',
        description: activeBusiness.description || '',
        phone: activeBusiness.phone || '',
        whatsapp: activeBusiness.whatsapp || '',
        email: activeBusiness.email || '',
        address: activeBusiness.address || '',
        neighborhood: activeBusiness.neighborhood || '',
        logoUrl: activeBusiness.logoUrl || '',
        instagram: activeBusiness.instagram || '',
        facebook: activeBusiness.facebook || '',
        website: activeBusiness.website || '',
      });
      setSchedule(cloneWeeklySchedule(activeBusiness.weeklySchedule));
    }
  }, [activeBusiness, cities, categories, plans]);

  useEffect(() => {
    if (activeBusiness?.id) {
      void loadBusinessMetricsFromDb(activeBusiness.id);
    }
  }, [activeBusiness?.id]);

  // Real metrics for the Dashboard (starts at 0 for newly registered stores)
  const realMetrics = getBusinessMetrics(activeBusiness?.id || '');
  const metrics = {
    viewsTotal: realMetrics.viewsTotal,
    whatsappClicks: realMetrics.whatsappClicks,
    productClicks: realMetrics.showcaseClicks,
    activeProducts: quota.totalUsed,
    productLimit,
    conversionRate: realMetrics.conversionRate,
    daily: realMetrics.daily,
  };
  const maxDailyViews = Math.max(1, ...metrics.daily.map((d) => d.views));

  // Schedule Handlers
  const handleDayToggle = (index: number) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === index ? { ...item, isOpen: !item.isOpen } : item))
    );
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleCopyDayToAll = (fromIndex: number) => {
    const source = schedule[fromIndex];
    setSchedule((prev) =>
      prev.map((item) => ({
        ...item,
        isOpen: source.isOpen,
        openTime: source.openTime,
        closeTime: source.closeTime,
      }))
    );
    setNotification({
      text: `Horário de ${source.day} copiado para todos os dias!`,
      type: 'success',
    });
  };

  const getCompiledScheduleSummary = () => {
    const openDays = schedule.filter((s) => s.isOpen);
    if (openDays.length === 0) return 'Temporariamente Fechado';
    if (openDays.length === 7) {
      const first = openDays[0];
      const allSame = openDays.every((d) => d.openTime === first.openTime && d.closeTime === first.closeTime);
      if (allSame) return `Todos os dias: ${first.openTime} às ${first.closeTime}`;
    }

    const segSex = schedule.slice(0, 5);
    const sab = schedule[5];
    const dom = schedule[6];
    const segSexAllOpen = segSex.every((d) => d.isOpen);
    const segSexSameTime = segSexAllOpen && segSex.every((d) => d.openTime === segSex[0].openTime && d.closeTime === segSex[0].closeTime);

    if (segSexSameTime) {
      let str = `Seg a Sex: ${segSex[0].openTime} às ${segSex[0].closeTime}`;
      if (sab.isOpen) str += ` | Sáb: ${sab.openTime} às ${sab.closeTime}`;
      else str += ` | Sáb: Fechado`;
      if (dom.isOpen) str += ` | Dom: ${dom.openTime} às ${dom.closeTime}`;
      else str += ` | Dom: Fechado`;
      return str;
    }

    return schedule
      .map((d) => (d.isOpen ? `${d.shortDay}: ${d.openTime}-${d.closeTime}` : `${d.shortDay}: Fechado`))
      .join(' | ');
  };

  // Logo Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ text: 'A imagem deve ter no máximo 5MB.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (isNew) {
          setNewBizForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
        } else {
          setEditForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
        }
        setNotification({ text: `Logomarca "${file.name}" alterada com sucesso!`, type: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Store Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    if (!editForm.name.trim() || !editForm.whatsapp.trim()) {
      setNotification({ text: 'Nome da empresa e WhatsApp são obrigatórios.', type: 'error' });
      return;
    }

    if (editPassword && editPassword !== confirmEditPassword) {
      setNotification({ text: 'A confirmação de senha não confere.', type: 'error' });
      return;
    }

    const compiledHours = getCompiledScheduleSummary();

    updateBusiness(activeBusiness.id, {
      name: editForm.name.trim(),
      cityId: editForm.cityId,
      categoryId: editForm.categoryId,
      planId: editForm.planId,
      description: editForm.description.trim(),
      phone: editForm.phone.trim(),
      whatsapp: editForm.whatsapp.trim(),
      email: editForm.email.trim(),
      address: editForm.address.trim(),
      neighborhood: editForm.neighborhood.trim(),
      openingHours: compiledHours,
      weeklySchedule: schedule,
      logoUrl: editForm.logoUrl || activeBusiness.logoUrl,
      coverUrl: editForm.logoUrl || activeBusiness.coverUrl,
      instagram: editForm.instagram.trim(),
      facebook: editForm.facebook.trim(),
      website: editForm.website.trim(),
      ...(editPassword ? { password: editPassword } : {}),
    });

    setNotification({ text: 'Perfil e dados da empresa atualizados com sucesso!', type: 'success' });
    setEditPassword('');
    setConfirmEditPassword('');
  };

  // Add Product Handler
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    if (!prodForm.name || !prodForm.price) {
      setNotification({ text: 'Informe ao menos o nome e o preço do produto.', type: 'error' });
      return;
    }

    const numericPrice = parseFloat(prodForm.price.replace(',', '.'));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setNotification({ text: 'Preço numérico inválido.', type: 'error' });
      return;
    }

    const numericOriginalPrice = prodForm.originalPrice ? parseFloat(prodForm.originalPrice.replace(',', '.')) : undefined;

    const result = addProduct({
      businessId: activeBusiness.id,
      cityId: activeBusiness.cityId,
      name: prodForm.name,
      price: numericPrice,
      originalPrice: numericOriginalPrice,
      description: prodForm.description || 'Produto disponível no estabelecimento.',
      imageUrl: prodForm.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=400&fit=crop&q=80',
      category: prodForm.category || 'Geral',
      isActive: true,
      featured: false,
    });

    if (!result.success) {
      setNotification({ text: result.error || 'Cota combinada do plano excedida.', type: 'error' });
    } else {
      setNotification({ text: 'Produto cadastrado e publicado na vitrine!', type: 'success' });
      setProdForm({
        name: '',
        price: '',
        originalPrice: '',
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=400&fit=crop&q=80',
        category: '',
      });
    }
  };

  // Add Service Handler
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    if (!servForm.name.trim()) {
      setNotification({ text: 'Informe o nome do serviço.', type: 'error' });
      return;
    }

    let numericPrice: number | undefined;
    if (servForm.priceType !== 'quote') {
      const parsed = parseFloat(servForm.price.replace(',', '.'));
      if (isNaN(parsed) || parsed <= 0) {
        setNotification({ text: 'Informe um valor numérico válido ou selecione "Sob orçamento".', type: 'error' });
        return;
      }
      numericPrice = parsed;
    }

    const result = addService({
      businessId: activeBusiness.id,
      cityId: activeBusiness.cityId,
      name: servForm.name.trim(),
      price: numericPrice,
      priceType: servForm.priceType,
      duration: servForm.duration.trim() || 'Sob consulta',
      serviceMode: servForm.serviceMode,
      description: servForm.description.trim() || 'Serviço disponível para agendamento e orçamento via WhatsApp.',
      imageUrl: servForm.imageUrl || serviceTechRepairImg,
      category: servForm.category.trim() || 'Serviços Gerais',
      isActive: true,
      featured: false,
    });

    if (!result.success) {
      setNotification({ text: result.error || 'Cota combinada do plano excedida.', type: 'error' });
    } else {
      setNotification({ text: 'Serviço cadastrado e publicado na vitrine!', type: 'success' });
      setServForm({
        name: '',
        priceType: 'fixed',
        price: '',
        duration: '',
        serviceMode: 'on_site',
        category: '',
        imageUrl: serviceTechRepairImg,
        description: '',
      });
    }
  };

  // Plan Upgrade Handler with Mercado Pago Checkout
  const handleUpgradePlan = (newPlanId: string, cycle: BillingCycle = upgradeCycle) => {
    if (!activeBusiness) return;
    const targetPlan = plans.find((p) => p.id === newPlanId);
    if (!targetPlan) return;
    if (targetPlan.isInviteOnly && activeBusiness.planId !== targetPlan.id) {
      setNotification({ text: 'Este plano é exclusivo via código de convite VIP.', type: 'error' });
      return;
    }

    if (isPaidPlan(targetPlan)) {
      openPaymentModal(newPlanId, activeBusiness.id, isLifetimePlan(targetPlan) ? 'monthly' : cycle);
    } else {
      updateBusiness(activeBusiness.id, {
        planId: newPlanId,
        billingCycle: 'monthly',
        planExpiresAt: undefined,
        subscriptionStatus: 'active',
        paymentStatus: 'active',
      });
      setNotification({ text: 'Plano gratuito ativado! Cota combinada de produtos e serviços atualizada.', type: 'success' });
    }
  };

  const handleRedeemInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    const trimmed = inviteInput.trim().toUpperCase();
    if (!trimmed) {
      setInviteFeedback({ type: 'error', text: 'Digite o código do convite VIP.' });
      return;
    }
    setIsApplyingInvite(true);
    setInviteFeedback(null);
    try {
      const res = await applyInviteCodeToBusiness(trimmed, activeBusiness.id);
      if (!res.success) {
        setInviteFeedback({
          type: 'error',
          text: res.error || 'Código de convite inválido, expirado ou já utilizado.',
        });
      } else {
        setInviteInput('');
        setInviteFeedback({
          type: 'success',
          text: `Convite VIP ativado! Sua loja recebeu 6 meses grátis do Plano Premium${
            res.planExpiresAt ? ` (válido até ${res.planExpiresAt})` : ''
          }.`,
        });
      }
    } finally {
      setIsApplyingInvite(false);
    }
  };

  if (!authSession.isAuthenticated || authSession.role !== 'business' || !activeBusiness) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Store className="w-12 h-12 text-blue-600 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
          Sessão da Loja Não Autenticada
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
          Faça login com o e-mail e senha da sua loja para gerenciar produtos, serviços e configurações.
        </p>
        <button
          type="button"
          onClick={() => setCurrentView('login')}
          className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
        >
          Ir para Tela de Login
        </button>
      </div>
    );
  }

  const remainingSessionMinutes = authSession.expiresAt
    ? Math.max(0, Math.ceil((authSession.expiresAt - Date.now()) / 60000))
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors pb-24 md:pb-12">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 sm:px-6 h-16 flex items-center justify-between border-b border-slate-800 shadow-md">
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
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-white flex items-center justify-center shrink-0">
              {getBusinessLogoUrl(activeBusiness) ? (
                <img
                  src={getBusinessLogoUrl(activeBusiness)}
                  alt={activeBusiness?.name || 'Loja'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Building2 className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold font-display leading-tight truncate max-w-44 sm:max-w-xs">
                {activeBusiness ? activeBusiness.name : 'Painel do Lojista'}
              </h1>
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">
                Painel Administrativo da Loja
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Business Store Switcher Dropdown (Restricted strictly to the logged-in user's stores) */}
          {myBusinesses.length > 1 ? (
            <select
              value={activeBusiness?.id || ''}
              onChange={(e) => {
                void switchActiveBusiness(e.target.value);
              }}
              className="hidden md:block bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer outline-none"
            >
              {myBusinesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span>Loja Ativa</span>
            </span>
          )}

          {remainingSessionMinutes !== null && (
            <button
              type="button"
              onClick={() => {
                void renewSession().then((res) => {
                  if (res.success) {
                    setNotification({ text: 'Sessão renovada com sucesso no banco de dados!', type: 'success' });
                  }
                });
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-emerald-300 border border-slate-700 cursor-pointer"
              title="Clique para renovar o tempo de sessão"
            >
              <Clock className="w-3 h-3" />
              <span>
                {remainingSessionMinutes >= 60
                  ? `${Math.floor(remainingSessionMinutes / 60)}h ${remainingSessionMinutes % 60}m`
                  : `${remainingSessionMinutes}m`}{' '}
                · Renovar
              </span>
            </button>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            title="Sair da sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation Header (Desktop/Tablet - Mobile uses dedicated Merchant Bottom Menu) */}
      <div className="hidden md:flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 items-center gap-2 overflow-x-auto sticky top-16 z-20 scrollbar-none shadow-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos ({businessProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'services'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Serviços ({businessServices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prod_categories')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'prod_categories'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderPlus className="w-4 h-4 text-emerald-500" />
          <span>Categorias({activeStoreCategories.length})</span>
        </button>

        {canCreateRotatingBanners && (
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Banners ({myMerchantBanners.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('edit_profile')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'edit_profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Edit2 className="w-4 h-4" />
          <span>Editar Perfil</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Meu Plano</span>
        </button>

        <button
          onClick={() => setActiveTab('register_new')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'register_new'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Loja</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Post-registration Email Verification Banner */}
      {activeBusiness && !activeBusiness.emailVerified && (() => {
        const targetEmail = (activeBusiness.ownerEmail || activeBusiness.email || '').trim();
        if (!targetEmail) return null;
        const cityName = cities.find((c) => c.id === activeBusiness.cityId)?.name || 'Alagoinhas';

        return (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-blue-950 dark:text-blue-100">
                      Valide o e-mail cadastrado ({targetEmail})
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                      Enviamos um código de 6 dígitos para o seu e-mail após o cadastro da empresa. Digite-o ao lado para confirmar a titularidade da conta.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Código 6 dígitos"
                    className="w-36 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono tracking-widest text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    disabled={isVerifyingEmail || verifyCodeInput.trim().length !== 6}
                    onClick={async () => {
                      setIsVerifyingEmail(true);
                      setVerifyEmailFeedback(null);
                      try {
                        const res = await verifyEmailCode(targetEmail, verifyCodeInput.trim(), activeBusiness.id);
                        if (!res.valid) {
                          setVerifyEmailFeedback({
                            type: 'error',
                            text: res.error || 'Código inválido. Verifique os 6 dígitos recebidos.',
                          });
                        } else {
                          setNotification({
                            type: 'success',
                            text: 'E-mail validado com sucesso! Sua conta foi confirmada.',
                          });
                          setVerifyCodeInput('');
                        }
                      } finally {
                        setIsVerifyingEmail(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingEmail ? 'Validando...' : 'Confirmar E-mail'}
                  </button>
                  <button
                    type="button"
                    disabled={isResendingVerifyCode}
                    onClick={async () => {
                      setIsResendingVerifyCode(true);
                      setVerifyEmailFeedback(null);
                      try {
                        const res = await sendVerificationCodeEmail({
                          to: targetEmail,
                          businessId: activeBusiness.id,
                          businessName: activeBusiness.name,
                          cityName,
                        });
                        if (!res.success) {
                          setVerifyEmailFeedback({
                            type: 'error',
                            text: res.error || 'Não foi possível reenviar o código.',
                          });
                        } else {
                          setVerifyEmailFeedback({
                            type: 'info',
                            text: res.deliveredViaSmtp
                              ? `Novo código de 6 dígitos enviado para ${targetEmail}.`
                              : `Código gerado em modo local para ${targetEmail} (SMTP não configurado para envio externo).`,
                            debugCode: res.deliveredViaSmtp ? undefined : res.code,
                          });
                        }
                      } finally {
                        setIsResendingVerifyCode(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-xs font-bold text-blue-800 dark:text-blue-200 hover:bg-blue-100/70 transition cursor-pointer disabled:opacity-50"
                  >
                    {isResendingVerifyCode ? 'Reenviando...' : 'Reenviar Código'}
                  </button>
                </div>
              </div>

              {verifyEmailFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    verifyEmailFeedback.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                      : 'bg-white/80 text-blue-900 border border-blue-200 dark:bg-slate-900/80 dark:text-blue-200 dark:border-blue-800'
                  }`}
                >
                  <p>{verifyEmailFeedback.text}</p>
                  {verifyEmailFeedback.debugCode && (
                    <p className="mt-1 text-[11px] font-semibold">
                      Código gerado em modo local:{' '}
                      <span className="font-mono font-extrabold text-orange-600">{verifyEmailFeedback.debugCode}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Pending Payment Alert Banner */}
      {activeBusiness?.paymentStatus === 'pending_payment' && activeBusiness?.pendingPlanId && (() => {
        const pendingPlan = plans.find((p) => p.id === activeBusiness.pendingPlanId);
        if (!pendingPlan) return null;
        const pendingCycle = activeBusiness.pendingBillingCycle || 'monthly';
        const pendingPricing = calculatePlanPricing(pendingPlan, pendingCycle, planDiscountConfig);
        const cityName = cities.find((c) => c.id === activeBusiness.cityId)?.name || 'Alagoinhas';
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const paymentLink = `${origin}/?checkout=1&businessId=${encodeURIComponent(
          activeBusiness.id
        )}&planId=${encodeURIComponent(pendingPlan.id)}&cycle=${encodeURIComponent(
          pendingCycle
        )}&token=${encodeURIComponent(activeBusiness.paymentToken || '')}`;

        return (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-200">
                    Pagamento pendente para liberar o {pendingPlan.name} ({pendingPricing.label})
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                    Sua loja está ativa temporariamente com limites gratuitos. Conclua o pagamento de{' '}
                    <span className="font-bold font-mono tabular-nums">
                      {formatBRL(pendingPricing.totalAmount)}
                    </span>{' '}
                    {pendingPricing.discountPercent > 0 ? `(já com ${pendingPricing.discountPercent}% OFF) ` : ''}
                    para liberar até {pendingPlan.productLimit} produtos e serviços.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const recipient = activeBusiness.ownerEmail || activeBusiness.email || '';
                    if (!recipient) return;
                    const res = await sendTemplatedEmail({
                      key: 'payment_link',
                      to: recipient,
                      variables: {
                        nome_empresa: activeBusiness.name,
                        nome_plano: `${pendingPlan.name} (${pendingPricing.label})`,
                        valor_plano: formatBRL(pendingPricing.totalAmount),
                        link_pagamento: paymentLink,
                        cidade: cityName,
                      },
                      actionUrl: paymentLink,
                    });
                    setNotification({
                      type: 'success',
                      text: res.deliveredViaSmtp
                        ? `Link de pagamento reenviado para ${recipient}.`
                        : `Link de pagamento registrado na Caixa de Saída para ${recipient}.`,
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100/70 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Reenviar Link por E-mail</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openCheckoutPage(
                      activeBusiness.id,
                      pendingPlan.id,
                      activeBusiness.paymentToken,
                      pendingCycle
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Ir para Página de Pagamento</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancelled / Paused Subscription Banner */}
      {activeBusiness?.subscriptionStatus === 'cancelled' && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  Assinatura Cancelada · Loja Pausada no Guia Público
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  A vitrine da sua loja está temporariamente oculta para visitantes. Reative no Plano Grátis ou escolha um novo plano para voltar a aparecer nas buscas.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleUpgradePlan('plan-free')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                Reativar no Plano Grátis
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('plans')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold transition cursor-pointer"
              >
                Escolher Novo Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6-Month Invite Trial Expiration / Expiring Soon Alert Banner */}
      {activeBusiness &&
        activeBusiness.subscriptionStatus !== 'cancelled' &&
        expirationInfo.isTrialInvite &&
        (expirationInfo.isExpired || expirationInfo.isExpiringSoon) && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                expirationInfo.isExpired
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    expirationInfo.isExpired
                      ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className={`text-xs sm:text-sm font-extrabold ${
                      expirationInfo.isExpired
                        ? 'text-rose-900 dark:text-rose-200'
                        : 'text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    {expirationInfo.isExpired
                      ? `Seu período gratuito de 6 meses (Convite VIP) encerrou em ${expirationInfo.expiresAtFormatted}`
                      : `Seu Convite VIP Premium (6 meses grátis) vence em ${
                          expirationInfo.daysRemaining === 0
                            ? 'hoje'
                            : `${expirationInfo.daysRemaining} dia(s)`
                        } (${expirationInfo.expiresAtFormatted})`}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      expirationInfo.isExpired
                        ? 'text-rose-800 dark:text-rose-300'
                        : 'text-amber-800 dark:text-amber-300/90'
                    }`}
                  >
                    Escolha um dos planos disponíveis (incluindo o Sócio Fundador vitalício) para continuar com sua loja divulgada ou cancele sua assinatura sem cobranças.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar Assinatura
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('plans')}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Escolher Novo Plano</span>
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Main Body per Tab */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">

        {/* TAB 1: DASHBOARD DE MÉTRICAS */}
        {activeTab === 'dashboard' && activeBusiness && (
          <div className="space-y-6">
            
            {/* Top Banner Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-blue-500/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 bg-white shrink-0 shadow-sm flex items-center justify-center">
                  {getBusinessLogoUrl(activeBusiness) ? (
                    <img
                      src={getBusinessLogoUrl(activeBusiness)}
                      alt={activeBusiness.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Building2 className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-600 text-white">
                      {activeBusiness.subscriptionStatus === 'cancelled' ? 'Pausada' : 'Loja Ativa'}
                    </span>
                    {isFounderPlan(activePlan) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        <Award className="w-3 h-3" />
                        Sócio Fundador VIP
                      </span>
                    )}
                    <span className="text-xs text-blue-200">{activePlan?.name}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-display mt-0.5">
                    {activeBusiness.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeBusiness.address} · WhatsApp: {activeBusiness.whatsapp}
                  </p>
                </div>
              </div>

              {/* Quick Quota Gauge */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 md:min-w-80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-medium">Cota (Produtos + Serviços):</span>
                  <span className="font-extrabold text-orange-400 font-mono tabular-nums">
                    {quota.totalUsed} de {quota.limit}
                  </span>
                </div>
                
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isQuotaFull ? 'bg-red-500' : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(100, quota.limit > 0 ? (quota.totalUsed / quota.limit) * 100 : 0)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 tabular-nums">
                    {quota.productsCount} prod. · {quota.servicesCount} serv.
                  </span>
                  {isQuotaFull ? (
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="text-orange-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> Fazer Upgrade
                    </button>
                  ) : (
                    <span className="text-emerald-300 font-medium tabular-nums">
                      {quota.remaining} vagas disponíveis
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Visualizações Totais */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Visualizações da Loja
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {metrics.viewsTotal}
                </div>
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                  {metrics.viewsTotal > 0 ? 'Acessos reais registrados' : 'Aguardando primeiros acessos'}
                </span>
              </div>

              {/* Card 2: Contatos via WhatsApp */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Cliques no WhatsApp
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                  {metrics.whatsappClicks}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Clientes direcionados ao Zap
                </span>
              </div>

              {/* Card 3: Cliques nos Produtos & Serviços */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Cliques na Vitrine
                  </span>
                  <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-orange-600 font-mono tabular-nums">
                  {metrics.productClicks}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Produtos e serviços visualizados
                </span>
              </div>

              {/* Card 4: Taxa de Conversão estimada */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Taxa de Contato
                  </span>
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
                  {metrics.conversionRate}
                </div>
                <span className="text-[11px] font-semibold text-purple-600 mt-1 block">
                  Visitantes que acionam o Zap
                </span>
              </div>
            </div>

            {/* Performance Bar Chart / Detailed Metrics Breakdown */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Desempenho Semanal dos Anúncios
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acompanhamento do alcance da loja e contatos iniciados pelos clientes.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
                  Últimos 7 dias
                </span>
              </div>

              {/* Real 7-day performance bars */}
              <div className="grid grid-cols-7 gap-2 pt-4 items-end h-40">
                {metrics.daily.map((d) => {
                  const barHeight =
                    d.views > 0 ? `${Math.max(12, Math.round((d.views / maxDailyViews) * 100))}%` : '6%';
                  return (
                    <div key={d.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-slate-500 tabular-nums">
                        {d.views}
                      </span>
                      <div
                        className={`w-full rounded-xl transition-all ${
                          d.views > 0
                            ? 'bg-gradient-to-t from-blue-700 to-sky-400 hover:brightness-110'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                        style={{ height: barHeight }}
                        title={`${d.label} (${d.date}): ${d.views} visualizações · ${d.showcaseClicks} cliques vitrine · ${d.whatsappClicks} cliques WhatsApp`}
                      />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Sua loja está visível para clientes em <strong>{cities.find(c => c.id === activeBusiness.cityId)?.name || 'sua cidade'}</strong>.
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition shadow-xs"
                >
                  + Cadastrar Produto
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer transition shadow-xs"
                >
                  + Cadastrar Serviço
                </button>
                <button
                  onClick={() => setActiveTab('edit_profile')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition"
                >
                  Editar Perfil da Loja
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: GERENCIAR PRODUTOS */}
        {activeTab === 'products' && activeBusiness && (
          <div className="space-y-6">
            
            {/* Header info & quota indicator */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Gestão da Vitrine de Produtos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cadastre produtos com foto, nome e preço. A cota do plano soma produtos e serviços publicados pela sua empresa.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 tabular-nums">
                  {quota.totalUsed} de {quota.limit} itens ({quota.productsCount} prod. + {quota.servicesCount} serv.)
                </span>
                {isQuotaFull && (
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Aumentar Cota
                  </button>
                )}
              </div>
            </div>

            {/* Form Cadastrar Produto */}
            <form onSubmit={handleAddProduct} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Cadastrar Novo Produto na Vitrine
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Produto / Oferta *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="Ex: Fone de Ouvido Bluetooth ANC Sem Fio"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    placeholder="Ex: 149.90"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Original (opcional para mostrar Oferta)
                  </label>
                  <input
                    type="text"
                    value={prodForm.originalPrice}
                    onChange={(e) => setProdForm({ ...prodForm, originalPrice: e.target.value })}
                    placeholder="Ex: 189.90"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria do Produto
                  </label>
                  {activeStoreCategories.length > 0 ? (
                    <select
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Selecione ou digite abaixo...</option>
                      {activeStoreCategories.map((sc) => (
                        <option key={sc.id} value={sc.name}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                      placeholder="Ex: Lanches, Eletrônicos, Bebidas"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Ou crie categorias na aba "Categorias da Loja"</span>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <ImageUploadField
                    value={prodForm.imageUrl}
                    onChange={(url) => setProdForm({ ...prodForm, imageUrl: url })}
                    label="Foto do Produto / Oferta"
                    helpText="Arraste uma foto do produto do computador, faça upload do arquivo ou selecione uma imagem demonstrativa pronta."
                    presetSamples={productPresetSamples}
                    aspectRatio="square"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição do Produto & Detalhes
                  </label>
                  <textarea
                    rows={2}
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="Descreva as especificações, cores disponíveis ou prazos..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isQuotaFull}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                    isQuotaFull
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar Produto</span>
                </button>
              </div>
            </form>

            {/* List of Registered Products */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Produtos Publicados ({businessProducts.length})
              </h4>

              {businessProducts.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhum produto cadastrado ainda. Use o formulário acima para publicar suas ofertas!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {businessProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </h4>
                          <div className="mt-0.5">
                            {prod.originalPrice && (
                              <span className="text-[10px] text-slate-400 line-through mr-1">
                                R$ {prod.originalPrice.toFixed(2)}
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              R$ {prod.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPendingConfirm({
                            title: 'Excluir Produto',
                            message: `Remover o produto "${prod.name}" da vitrine?`,
                            confirmLabel: 'Excluir Produto',
                            onConfirm: () => {
                              deleteProduct(prod.id);
                              setNotification({ text: 'Produto removido.', type: 'success' });
                            },
                          })
                        }
                        className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2B: GERENCIAR SERVIÇOS */}
        {activeTab === 'services' && activeBusiness && (
          <div className="space-y-6">
            {/* Header info & combined quota indicator */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Gestão do Catálogo de Serviços
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Divulgue serviços com cobrança fixa, por hora, a partir de ou sob orçamento, informando duração e modalidade de atendimento.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900 tabular-nums">
                  {quota.totalUsed} de {quota.limit} itens ({quota.productsCount} prod. + {quota.servicesCount} serv.)
                </span>
                {isQuotaFull && (
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Aumentar Cota
                  </button>
                )}
              </div>
            </div>

            {/* Form Cadastrar Serviço */}
            <form onSubmit={handleAddService} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                Cadastrar Novo Serviço no Catálogo
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    required
                    value={servForm.name}
                    onChange={(e) => setServForm({ ...servForm, name: e.target.value })}
                    placeholder="Ex: Formatação e Limpeza Preventiva de Notebook"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Cobrança *
                  </label>
                  <select
                    value={servForm.priceType}
                    onChange={(e) => setServForm({ ...servForm, priceType: e.target.value as ServicePriceType })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="fixed">Preço Fixo</option>
                    <option value="from">A partir de</option>
                    <option value="hourly">Por hora</option>
                    <option value="quote">Sob orçamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {servForm.priceType === 'quote' ? 'Valor (não obrigatório sob orçamento)' : 'Valor (R$) *'}
                  </label>
                  <input
                    type="text"
                    disabled={servForm.priceType === 'quote'}
                    required={servForm.priceType !== 'quote'}
                    value={servForm.priceType === 'quote' ? '' : servForm.price}
                    onChange={(e) => setServForm({ ...servForm, price: e.target.value })}
                    placeholder={servForm.priceType === 'quote' ? 'Definido no orçamento via WhatsApp' : 'Ex: 120.00'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duração Estimada *
                  </label>
                  <input
                    type="text"
                    value={servForm.duration}
                    onChange={(e) => setServForm({ ...servForm, duration: e.target.value })}
                    placeholder="Ex: 1h30, No mesmo dia, 45 min"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Modalidade de Atendimento *
                  </label>
                  <select
                    value={servForm.serviceMode}
                    onChange={(e) => setServForm({ ...servForm, serviceMode: e.target.value as ServiceMode })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="on_site">Atendimento no local</option>
                    <option value="home_visit">Atendimento em domicílio</option>
                    <option value="online">Online / Remoto</option>
                    <option value="both">No local e em domicílio</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria do Serviço
                  </label>
                  <input
                    type="text"
                    value={servForm.category}
                    onChange={(e) => setServForm({ ...servForm, category: e.target.value })}
                    placeholder="Ex: Manutenção, Estética Pet, Costura"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <ImageUploadField
                    value={servForm.imageUrl}
                    onChange={(url) => setServForm({ ...servForm, imageUrl: url })}
                    label="Foto de Capa do Serviço"
                    helpText="Envie uma foto ilustrativa do serviço prestado ou escolha uma imagem demonstrativa pronta."
                    presetSamples={servicePresetSamples}
                    aspectRatio="square"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição do Serviço & O que está incluso
                  </label>
                  <textarea
                    rows={2}
                    value={servForm.description}
                    onChange={(e) => setServForm({ ...servForm, description: e.target.value })}
                    placeholder="Explique etapas, garantia, materiais inclusos ou requisitos de agendamento..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isQuotaFull}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                    isQuotaFull
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar Serviço</span>
                </button>
              </div>
            </form>

            {/* List of Registered Services */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Serviços Publicados ({businessServices.length})
              </h4>

              {businessServices.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhum serviço cadastrado ainda. Use o formulário acima para divulgar seus serviços!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {businessServices.map((serv) => (
                    <div
                      key={serv.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={serv.imageUrl}
                          alt={serv.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {serv.name}
                          </h4>
                          <div className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 mt-0.5 tabular-nums">
                            {formatServicePrice(serv)}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                            {getServiceModeLabel(serv.serviceMode)}{serv.duration ? ` · ${serv.duration}` : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPendingConfirm({
                            title: 'Excluir Serviço',
                            message: `Remover o serviço "${serv.name}" do catálogo?`,
                            confirmLabel: 'Excluir Serviço',
                            onConfirm: () => {
                              deleteService(serv.id);
                              setNotification({ text: 'Serviço removido.', type: 'success' });
                            },
                          })
                        }
                        className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shrink-0"
                        title="Excluir serviço"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: CADASTRO DE CATEGORIAS DE PRODUTOS DA LOJA */}
        {activeTab === 'prod_categories' && activeBusiness && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                <FolderPlus className="w-4 h-4" />
                <span>Gestão de Categorias da Loja</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Cadastro de Categoria de Produtos ({activeBusiness.name})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organize seu cardápio ou catálogo criando categorias personalizadas para seus produtos (ex: Hambúrgueres, Bebidas, Sobremesas, Roupas Femininas, Medicamentos).
              </p>
            </div>

            {/* Form Cadastrar Categoria */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!storeCatForm.name.trim()) {
                  setNotification({ text: 'Informe o nome da categoria.', type: 'error' });
                  return;
                }
                addStoreProductCategory({
                  businessId: activeBusiness.id,
                  name: storeCatForm.name.trim(),
                  description: storeCatForm.description.trim(),
                });
                setStoreCatForm({ name: '', description: '' });
                setNotification({ text: `Categoria "${storeCatForm.name}" cadastrada com sucesso!`, type: 'success' });
              }}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Adicionar Nova Categoria de Produto
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeCatForm.name}
                    onChange={(e) => setStoreCatForm({ ...storeCatForm, name: e.target.value })}
                    placeholder="Ex: Hambúrgueres Artesanais, Bebidas, Promoções"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição da Categoria (opcional)
                  </label>
                  <input
                    type="text"
                    value={storeCatForm.description}
                    onChange={(e) => setStoreCatForm({ ...storeCatForm, description: e.target.value })}
                    placeholder="Ex: Lanches com blend 180g acompanhados de batata palito"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Categoria</span>
                </button>
              </div>
            </form>

            {/* Lista de Categorias Cadastradas */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Categorias Registradas na Loja ({activeStoreCategories.length})
              </h4>

              {activeStoreCategories.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhuma categoria de produto cadastrada ainda. Use o formulário acima para registrar suas seções!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeStoreCategories.map((cat) => {
                    const prodsInCat = businessProducts.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;

                    return (
                      <div
                        key={cat.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-emerald-600 shrink-0" />
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {cat.name}
                            </h5>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {cat.description}
                            </p>
                          )}
                          <span className="inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md mt-1">
                            {prodsInCat} produto(s) nesta categoria
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setPendingConfirm({
                              title: 'Excluir Categoria da Loja',
                              message: `Excluir a categoria "${cat.name}"?`,
                              confirmLabel: 'Excluir Categoria',
                              onConfirm: () => {
                                deleteStoreProductCategory(cat.id);
                                setNotification({ text: 'Categoria removida.', type: 'success' });
                              },
                            })
                          }
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shrink-0"
                          title="Excluir categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EDITAR PERFIL & DADOS DA EMPRESA */}
        {activeTab === 'edit_profile' && activeBusiness && (
          <form onSubmit={handleSaveProfile} className="p-4 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                Editar Dados & Perfil da Empresa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualize as informações comerciais, logotipo, canais de contato, horários e senha da conta.
              </p>
            </div>

            {/* Upload Logomarca */}
            <ImageUploadField
              value={editForm.logoUrl || activeBusiness.logoUrl}
              onChange={(url) => setEditForm({ ...editForm, logoUrl: url })}
              label="Logomarca Oficial da Empresa"
              helpText="Arraste uma imagem de logotipo do seu computador, selecione um arquivo ou escolha um exemplo pronto."
              presetSamples={logoPresetSamples}
              aspectRatio="icon"
            />

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cidade *
                </label>
                <select
                  value={editForm.cityId}
                  onChange={(e) => setEditForm({ ...editForm, cityId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {cities.filter(c => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria Comercial *
                </label>
                <select
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Comercial (com DDD) *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Contatos & Redes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone Fixo
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Comercial
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Facebook (URL ou perfil)
                </label>
                <input
                  type="text"
                  value={editForm.facebook}
                  onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instagram (@perfil)
                </label>
                <input
                  type="text"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Website Oficial
                </label>
                <input
                  type="text"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={editForm.neighborhood}
                  onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Horário de Funcionamento por Dia e Horário (layout responsivo mobile igual ao cadastro) */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Horário de Funcionamento por Dia e Horário
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Defina os horários de abertura
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyDayToAll(0)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                >
                  Copiar Seg para todos
                </button>
              </div>

              <div className="space-y-2.5">
                {schedule.map((dayItem, idx) => (
                  <div
                    key={dayItem.day}
                    className={`p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      dayItem.isOpen
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 opacity-65'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-wrap">
                      <input
                        type="checkbox"
                        checked={dayItem.isOpen}
                        onChange={() => handleDayToggle(idx)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex-1 sm:flex-none sm:min-w-32">
                        {dayItem.day}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          dayItem.isOpen
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {dayItem.isOpen ? 'Aberto' : 'Fechado'}
                      </span>
                    </label>

                    {dayItem.isOpen ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs pl-6 sm:pl-0">
                        <span className="text-slate-500">Das</span>
                        <input
                          type="time"
                          value={dayItem.openTime}
                          onChange={(e) => handleTimeChange(idx, 'openTime', e.target.value)}
                          className="min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                        />
                        <span className="text-slate-500">às</span>
                        <input
                          type="time"
                          value={dayItem.closeTime}
                          onChange={(e) => handleTimeChange(idx, 'closeTime', e.target.value)}
                          className="min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic pl-6 sm:pl-0">
                        Estabelecimento fechado neste dia
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Troca de Senha */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" /> Alterar Senha de Acesso (Opcional)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Deixe em branco para não alterar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmEditPassword}
                    onChange={(e) => setConfirmEditPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descrição da Empresa
              </label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Salvar Alterações no Perfil</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB: BANNERS ROTATIVOS (INCLUSO NOS PLANOS VIP) */}
        {activeTab === 'banners' && activeBusiness && (
          <div className="space-y-6">
            {!canCreateRotatingBanners ? (
              <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-amber-600 mx-auto" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">
                  Banners Rotativos Inclusos nos Planos VIP
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                  Seu plano atual ({activePlan?.name}) não inclui cadastro gratuito de banners rotativos no portal. Faça upgrade para o Plano Premium Ouro ou Sócio Fundador para liberar este recurso.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('plans')}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                >
                  Ver Planos VIP Disponíveis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!merchantBannerForm.title.trim() || !merchantBannerForm.imageUrl.trim()) {
                      setNotification({ type: 'error', text: 'Preencha o nome do banner e selecione uma imagem.' });
                      return;
                    }
                    const res = addMerchantBanner({
                      title: merchantBannerForm.title.trim(),
                      tagline: merchantBannerForm.tagline.trim(),
                      position: merchantBannerForm.position,
                      imageUrl: merchantBannerForm.imageUrl.trim(),
                      linkUrl: merchantBannerForm.linkUrl.trim() || '#produtos',
                      advertiserName: activeBusiness.name,
                      cityId: merchantBannerForm.cityId,
                      priceMonthly: 0,
                      badgeText: merchantBannerForm.badgeText.trim() || 'Anunciante VIP',
                    });
                    if (res.success) {
                      setMerchantBannerForm({
                        title: '',
                        tagline: '',
                        position: 'rotating_header',
                        linkUrl: '#produtos',
                        cityId: activeBusiness.cityId || 'all',
                        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=300&fit=crop&q=80',
                        badgeText: 'Anunciante VIP',
                      });
                      setNotification({ type: 'success', text: 'Banner rotativo cadastrado e publicado no guia!' });
                    } else {
                      setNotification({ type: 'error', text: res.error || 'Erro ao cadastrar banner.' });
                    }
                  }}
                  className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span>Novo Banner Rotativo (Incluso no Plano)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Recurso incluso na sua assinatura {activePlan?.name}, sem cobrança adicional.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Banner *
                    </label>
                    <input
                      type="text"
                      required
                      value={merchantBannerForm.title}
                      onChange={(e) => setMerchantBannerForm({ ...merchantBannerForm, title: e.target.value })}
                      placeholder="Ex: Promoção Relâmpago da Semana"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Frase de Chamada (Opcional)
                    </label>
                    <input
                      type="text"
                      value={merchantBannerForm.tagline}
                      onChange={(e) => setMerchantBannerForm({ ...merchantBannerForm, tagline: e.target.value })}
                      placeholder="Ex: Até 30% OFF em toda a loja"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Posição
                      </label>
                      <select
                        value={merchantBannerForm.position}
                        onChange={(e) =>
                          setMerchantBannerForm({ ...merchantBannerForm, position: e.target.value as any })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="rotating_header">Cabeçalho Rotativo</option>
                        <option value="top">Banner Topo da Home</option>
                        <option value="bottom">Banner Rodapé</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cidade Alvo
                      </label>
                      <select
                        value={merchantBannerForm.cityId}
                        onChange={(e) => setMerchantBannerForm({ ...merchantBannerForm, cityId: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="all">Todas as Cidades</option>
                        {cities
                          .filter((c) => c.isActive)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} - {c.state}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Link de Destino
                      </label>
                      <input
                        type="text"
                        value={merchantBannerForm.linkUrl}
                        onChange={(e) => setMerchantBannerForm({ ...merchantBannerForm, linkUrl: e.target.value })}
                        placeholder="#produtos ou https://..."
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Etiqueta / Selo
                      </label>
                      <input
                        type="text"
                        value={merchantBannerForm.badgeText}
                        onChange={(e) => setMerchantBannerForm({ ...merchantBannerForm, badgeText: e.target.value })}
                        placeholder="Anunciante VIP"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <ImageUploadField
                      value={merchantBannerForm.imageUrl}
                      onChange={(url) => setMerchantBannerForm({ ...merchantBannerForm, imageUrl: url })}
                      label="Imagem do Banner (1200x300 recomendado)"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publicar Banner Rotativo</span>
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Seus Banners Cadastrados ({myMerchantBanners.length})
                  </h4>
                  {myMerchantBanners.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                      Você ainda não publicou nenhum banner rotativo pelo painel. Use o formulário ao lado para criar o primeiro!
                    </div>
                  ) : (
                    myMerchantBanners.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={b.imageUrl}
                            alt={b.title}
                            className="w-24 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {b.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  b.isActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                }`}
                              >
                                {b.isActive ? 'Ativo' : 'Pausado'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {b.position === 'rotating_header'
                                ? 'Cabeçalho Rotativo'
                                : b.position === 'top'
                                ? 'Topo da Home'
                                : 'Rodapé'}{' '}
                              · {b.clicksCount} cliques
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleBannerStatus(b.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            {b.isActive ? 'Pausar' : 'Ativar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBanner(b.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Excluir banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEU PLANO & UPGRADE */}
        {activeTab === 'plans' && activeBusiness && (
          <div className="space-y-6">
            {(() => {
              const currentCycle = activeBusiness.billingCycle || 'monthly';
              const currentCyclePricing = calculatePlanPricing(
                activePlan || undefined,
                currentCycle,
                planDiscountConfig
              );
              const activeIsLifetime = isLifetimePlan(activePlan);
              const activeIsInvite = isInviteTrialPlan(activePlan);
              const activeIsFounder = isFounderPlan(activePlan);
              const activeIsPaid = isPaidPlan(activePlan);

              return (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                      Plano Atual Contratado
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                        {activePlan?.name}
                      </h3>
                      {activeIsFounder && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Award className="w-3.5 h-3.5" />
                          Vitalício · Sem Vencimento
                        </span>
                      )}
                      {!activeIsFounder && activeIsLifetime && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          Vitalício
                        </span>
                      )}
                      {activeIsInvite && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          <Gift className="w-3.5 h-3.5" />
                          Convite VIP · 6 Meses Grátis
                        </span>
                      )}
                      {!activeIsLifetime && !activeIsInvite && activeIsPaid && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          Ciclo {BILLING_CYCLE_META[currentCycle].label}
                        </span>
                      )}
                      {activeBusiness.subscriptionStatus === 'cancelled' && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          Cancelado / Pausado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Sua empresa possui limite para cadastrar até <strong>{activePlan?.productLimit} produtos e/ou serviços somados</strong> na vitrine comercial (uso atual: {quota.totalUsed}/{quota.limit}).
                    </p>
                    {activeIsLifetime ? (
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-1">
                        Acesso permanente sem mensalidades futuras (1 loja · {activePlan?.productLimit} itens).
                      </p>
                    ) : activeBusiness.planExpiresAt ? (
                      <p
                        className={`text-xs font-semibold mt-1 font-mono tabular-nums ${
                          expirationInfo.isExpired
                            ? 'text-rose-600 dark:text-rose-400'
                            : expirationInfo.isExpiringSoon
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {expirationInfo.isExpired
                          ? `Período expirado em: ${expirationInfo.expiresAtFormatted || activeBusiness.planExpiresAt}`
                          : `Válido até: ${expirationInfo.expiresAtFormatted || activeBusiness.planExpiresAt}`}
                      </p>
                    ) : null}

                    {activeBusiness.subscriptionStatus !== 'cancelled' &&
                      (activeIsPaid || activeIsInvite || activeBusiness.planId !== 'plan-free') && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setShowCancelModal(true)}
                            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancelar ou Pausar Assinatura</span>
                          </button>
                        </div>
                      )}
                  </div>

                  <div className="px-5 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-500">
                      {activeIsLifetime
                        ? 'Pagamento Único:'
                        : activeIsInvite
                        ? 'Convite Especial (6 meses):'
                        : !activeIsPaid
                        ? 'Valor do Plano:'
                        : `Valor (${BILLING_CYCLE_META[currentCycle].shortLabel}):`}
                    </span>
                    <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono tabular-nums">
                      {activeIsLifetime
                        ? formatBRL(currentCyclePricing.totalAmount)
                        : !activeIsPaid
                        ? 'Grátis'
                        : formatBRL(currentCyclePricing.totalAmount)}
                    </div>
                    {!activeIsLifetime && activeIsPaid && currentCycle !== 'monthly' && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                        {formatBRL(currentCyclePricing.effectiveMonthly)}/mês (-{currentCyclePricing.discountPercent}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Redeem Invite Code VIP Card */}
            <form
              onSubmit={handleRedeemInvite}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    Possui um Código de Convite VIP (6 Meses Premium Grátis)?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Insira o código exclusivo enviado pelo administrador para liberar o plano Convite Premium por 6 meses gratuitos.
                  </p>
                  {inviteFeedback && (
                    <p
                      className={`text-xs font-bold mt-1.5 ${
                        inviteFeedback.type === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {inviteFeedback.text}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <input
                  type="text"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                  placeholder="EX: VIP-ACHENA-6M"
                  className="flex-1 md:w-48 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isApplyingInvite || !inviteInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition"
                >
                  {isApplyingInvite ? 'Validando...' : 'Ativar Convite'}
                </button>
              </div>
            </form>

            {/* List of Available Plans for Upgrade + Cycle Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Planos de Anúncio Disponíveis para Upgrade ou Renovação
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Escolha ciclos Anual, Bienal ou Trienal para ganhar descontos automáticos ou garanta o plano Sócio Fundador vitalício.
                </p>
              </div>
              <BillingCycleSelector
                value={upgradeCycle}
                onChange={setUpgradeCycle}
                globalDiscounts={planDiscountConfig}
                compact
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans
                .filter((p) => !p.isInviteOnly || p.id === activeBusiness.planId)
                .map((p) => {
                  const isCurrentPlan = activeBusiness.planId === p.id;
                  const currentCycle = activeBusiness.billingCycle || 'monthly';
                  const pIsLifetime = isLifetimePlan(p);
                  const pIsInvite = isInviteTrialPlan(p);
                  const pIsPaid = isPaidPlan(p);
                  const pIsFounder = isFounderPlan(p);
                  const isSamePlanAndCycle =
                    isCurrentPlan &&
                    activeBusiness.subscriptionStatus !== 'cancelled' &&
                    (pIsLifetime || pIsInvite || !pIsPaid || currentCycle === upgradeCycle) &&
                    activeBusiness.paymentStatus !== 'pending_payment';
                  const pricing = calculatePlanPricing(p, upgradeCycle, planDiscountConfig);

                  return (
                    <div
                      key={p.id}
                      className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border flex flex-col justify-between shadow-xs transition ${
                        isCurrentPlan
                          ? 'border-2 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                          : pIsFounder
                          ? 'border-amber-400 dark:border-amber-700 hover:border-amber-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              pIsFounder
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {pIsFounder && <Award className="w-3 h-3" />}
                            {p.badge}
                          </span>
                          {isCurrentPlan && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white whitespace-nowrap shrink-0">
                              Plano Atual
                            </span>
                          )}
                        </div>

                        <h5 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                          {p.name}
                        </h5>

                        <div className="mt-3 mb-4 space-y-1">
                          {pIsLifetime ? (
                            <>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                  {formatBRL(pricing.totalAmount)}
                                </span>
                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                  pagamento único
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Vitalício · 1 loja · sem mensalidades
                              </p>
                            </>
                          ) : pIsInvite ? (
                            <>
                              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
                                Grátis
                              </div>
                              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                Convite VIP · {p.trialMonths || 6} meses grátis
                              </p>
                            </>
                          ) : !pIsPaid ? (
                            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                              Grátis
                            </div>
                          ) : (
                            <>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                  {formatBRL(pricing.effectiveMonthly)}
                                </span>
                                <span className="text-xs text-slate-500 font-semibold">/mês</span>
                                {pricing.discountPercent > 0 && (
                                  <span className="text-[11px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                    -{pricing.discountPercent}%
                                  </span>
                                )}
                              </div>

                              {upgradeCycle !== 'monthly' ? (
                                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                                  <div className="flex items-center gap-1.5 font-mono tabular-nums">
                                    <span className="line-through text-slate-400">
                                      {formatBRL(pricing.baseTotal)}
                                    </span>
                                    <span className="font-extrabold text-blue-700 dark:text-blue-300">
                                      {formatBRL(pricing.totalAmount)} ({pricing.shortLabel})
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                    Economia de {formatBRL(pricing.discountAmount)} · até 12x no cartão ou PIX
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500">Cobrança mensal recorrente</p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-4 tabular-nums">
                          Cota: {p.businessLimit || 1} {p.businessLimit === 1 ? 'loja' : 'lojas'} · até {p.productLimit} itens
                        </div>

                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-6">
                          {p.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleUpgradePlan(p.id, upgradeCycle)}
                        disabled={isSamePlanAndCycle || pIsInvite}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition whitespace-nowrap ${
                          isSamePlanAndCycle || pIsInvite
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                            : pIsFounder
                            ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                            : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
                        }`}
                      >
                        {pIsInvite
                          ? 'Ativo via Convite VIP'
                          : isSamePlanAndCycle
                          ? 'Plano em Uso'
                          : isCurrentPlan && activeBusiness.subscriptionStatus === 'cancelled'
                          ? 'Reativar Plano'
                          : isCurrentPlan
                          ? `Mudar para Ciclo ${pricing.shortLabel}`
                          : pIsLifetime
                          ? `Assinar Vitalício · ${formatBRL(pricing.totalAmount)}`
                          : !pIsPaid
                          ? 'Alterar para Plano Gratuito'
                          : `Contratar ${pricing.shortLabel} · ${formatBRL(pricing.totalAmount)}`}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Histórico de Faturas & Pagamentos da Loja */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Histórico de Pagamentos & Faturas da Loja
                  </h4>
                  <p className="text-xs text-slate-500">
                    Comprovantes de pagamentos processados pelo Mercado Pago para a sua empresa.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {paymentTransactions.filter((t) => t.businessId === activeBusiness.id).length} fatura(s)
                </span>
              </div>

              {paymentTransactions.filter((t) => t.businessId === activeBusiness.id).length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paymentTransactions
                    .filter((t) => t.businessId === activeBusiness.id)
                    .map((tx) => {
                      const cycleLabel = BILLING_CYCLE_META[tx.billingCycle || 'monthly'].shortLabel;
                      return (
                        <div key={tx.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {tx.planName} · {cycleLabel}
                              </span>
                              {tx.discountPercent && tx.discountPercent > 0 ? (
                                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                  (-{tx.discountPercent}%)
                                </span>
                              ) : null}
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Aprovado
                              </span>
                            </div>
                            <span className="text-slate-500 text-[11px] block">
                              {tx.createdAt} ·{' '}
                              {tx.paymentMethod === 'pix'
                                ? 'PIX'
                                : `Cartão final ${tx.cardLastFour || '****'}${
                                    tx.installments && tx.installments > 1 ? ` (${tx.installments}x)` : ''
                                  }`}{' '}
                              · Ref: {tx.mercadoPagoPaymentId}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white block">
                              {formatBRL(tx.amount)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">Pago via Mercado Pago</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500">
                  Nenhuma fatura anterior registrada para esta loja.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CADASTRAR NOVA LOJA */}
        {activeTab === 'register_new' && (
          <div className="space-y-6">
            {isStoreQuotaFull ? (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Cota de Lojas Atingida ({myBusinesses.length} de {storeLimit} lojas)</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                    Seu plano atual ({activePlan?.name}) permite o cadastro de até {storeLimit} {storeLimit === 1 ? 'loja' : 'lojas'}.
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Você já possui <strong>{myBusinesses.length} {myBusinesses.length === 1 ? 'loja cadastrada' : 'lojas cadastradas'}</strong> nesta conta. Para adicionar filiais ou novas lojas, faça upgrade para um plano com cota expandida.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('plans')}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Fazer Upgrade de Plano</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Voltar ao Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newBizForm.name.trim() || !newBizForm.whatsapp.trim()) {
                    setNotification({ text: 'Informe ao menos o nome da empresa e o WhatsApp.', type: 'error' });
                    return;
                  }

                  const newBizData = {
                    name: newBizForm.name.trim(),
                    cityId: newBizForm.cityId,
                    categoryId: newBizForm.categoryId,
                    planId: newBizForm.planId,
                    description: newBizForm.description.trim() || 'Nova empresa no achenacidade.',
                    phone: newBizForm.phone.trim(),
                    whatsapp: newBizForm.whatsapp.trim(),
                    email: newBizForm.email.trim() || userOwnerEmail,
                    ownerEmail: userOwnerEmail,
                    address: newBizForm.address.trim() || 'Endereço Comercial',
                    neighborhood: newBizForm.neighborhood.trim() || 'Centro',
                    openingHours: 'Segunda a Sexta: 08:30 às 18:00',
                    weeklySchedule: defaultWeeklySchedule,
                    logoUrl: newBizForm.logoUrl,
                    coverUrl: newBizForm.logoUrl,
                    instagram: newBizForm.instagram.trim(),
                    facebook: newBizForm.facebook.trim(),
                    website: newBizForm.website.trim(),
                    ...(newBizForm.password.trim() ? { password: newBizForm.password.trim() } : {}),
                    isVerified: false,
                  };

                  const res = await registerBusinessAndLogin(newBizData, true);
                  if (!res.success) {
                    setNotification({ text: res.error || 'Erro ao cadastrar nova loja no banco.', type: 'error' });
                    return;
                  }

                  setActiveTab('dashboard');
                  setNotification({ text: `Loja "${newBizForm.name}" criada com sucesso! Você está no painel da sua nova loja.`, type: 'success' });
                }}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
              >
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                    Cadastrar Adicional de Empresa / Loja
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cadastre uma nova filial ou outra empresa comercial da sua propriedade no achenacidade.
                  </p>
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Nova Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={newBizForm.name}
                  onChange={(e) => setNewBizForm({ ...newBizForm, name: e.target.value })}
                  placeholder="Ex: Farmácia Saúde & Vida"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cidade *
                </label>
                <select
                  value={newBizForm.cityId}
                  onChange={(e) => setNewBizForm({ ...newBizForm, cityId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer"
                >
                  {cities.filter(c => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria *
                </label>
                <select
                  value={newBizForm.categoryId}
                  onChange={(e) => setNewBizForm({ ...newBizForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Plano Escolhido *
                </label>
                <select
                  value={newBizForm.planId}
                  onChange={(e) => setNewBizForm({ ...newBizForm, planId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-bold text-blue-600 cursor-pointer"
                >
                  {plans
                    .filter((p) => !p.isInviteOnly)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — até {p.productLimit} itens (
                        {isLifetimePlan(p)
                          ? `${formatBRL(p.priceOnce ?? 500)} único · Vitalício`
                          : p.priceMonthly === 0
                          ? 'Grátis'
                          : `${formatBRL(p.priceMonthly)}/mês`}
                        )
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={newBizForm.whatsapp}
                  onChange={(e) => setNewBizForm({ ...newBizForm, whatsapp: e.target.value })}
                  placeholder="Ex: 19998765432"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUploadField
                  value={newBizForm.logoUrl}
                  onChange={(url) => setNewBizForm({ ...newBizForm, logoUrl: url })}
                  label="Logomarca da Nova Loja"
                  helpText="Faça upload do arquivo de logotipo da nova filial ou escolha uma imagem de exemplo."
                  presetSamples={logoPresetSamples}
                  aspectRatio="icon"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={newBizForm.neighborhood}
                  onChange={(e) => setNewBizForm({ ...newBizForm, neighborhood: e.target.value })}
                  placeholder="Ex: Centro"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Nova Loja e Ativar</span>
              </button>
            </div>
          </form>
          )}
        </div>
        )}

      </main>

      <ConfirmModal
        isOpen={!!pendingConfirm}
        title={pendingConfirm?.title || ''}
        message={pendingConfirm?.message || ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        variant="danger"
        onConfirm={() => pendingConfirm?.onConfirm()}
        onCancel={() => setPendingConfirm(null)}
      />

      {/* Cancel / Downgrade Subscription Modal */}
      {showCancelModal && activeBusiness && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                  Cancelar ou Migrar Plano
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Escolha como deseja encerrar o plano atual de <strong>{activeBusiness.name}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  cancelBusinessSubscription(activeBusiness.id, 'free');
                  setShowCancelModal(false);
                  setNotification({
                    type: 'success',
                    text: 'Sua loja foi migrada para o Plano Grátis e permanece visível no diretório.',
                  });
                }}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 text-left transition cursor-pointer"
              >
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                  1. Migrar para o Plano Grátis (até 3 itens)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Sem mensalidades. Sua loja continua visível no diretório público com limite gratuito.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cancelBusinessSubscription(activeBusiness.id, 'pause');
                  setShowCancelModal(false);
                  setNotification({
                    type: 'success',
                    text: 'Assinatura cancelada e vitrine da loja pausada no guia público.',
                  });
                }}
                className="w-full p-4 rounded-2xl border border-rose-200 dark:border-rose-900 hover:border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-left transition cursor-pointer"
              >
                <span className="text-xs font-extrabold text-rose-800 dark:text-rose-300 block">
                  2. Cancelar e Pausar Divulgação Pública
                </span>
                <span className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 block">
                  Oculta a loja e os anúncios das buscas públicas. Você poderá reativar quando quiser.
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Voltar e Manter Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
