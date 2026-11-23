export interface City {
  id: string;
  name: string;
  state: string; // e.g. "SP", "RJ", "MG"
  slug: string;
  isActive: boolean;
  isDefault?: boolean;
  bannerUrl?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string; // Lucide icon identifier
  description?: string;
  color?: string;
}

export type BillingCycle = 'monthly' | 'annual' | 'biennial' | 'triennial';

export interface PlanCycleDiscounts {
  annual: number; // % discount for 12 months
  biennial: number; // % discount for 24 months
  triennial: number; // % discount for 36 months
}

export interface PlanDiscountConfig {
  annual: number;
  biennial: number;
  triennial: number;
}

export type PlanBillingType = 'recurring' | 'lifetime' | 'invite_trial';
export type PlanVipTier = 'none' | 'pro' | 'premium' | 'founder';

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number; // in BRL, e.g. 0, 49.90, 99.90
  priceOnce?: number; // one-time price in BRL for lifetime plans, e.g. 500
  billingType?: PlanBillingType; // 'recurring' (default), 'lifetime', 'invite_trial'
  trialMonths?: number; // e.g. 6 for invite trial plans
  isInviteOnly?: boolean; // when true, hidden from public plans unless unlocked by invite code/link
  vipTier?: PlanVipTier; // 'none' | 'pro' | 'premium' | 'founder'
  productLimit: number; // Max products/services combined allowed for this plan per store
  businessLimit: number; // Max stores/businesses allowed per user account
  badge: string; // e.g. "Gratuito", "Profissional", "Destaque Ouro", "Sócio Fundador VIP"
  features: string[];
  highlighted?: boolean;
  color: string;
  useCustomDiscounts?: boolean;
  cycleDiscounts?: PlanCycleDiscounts;
  sortOrder?: number; // Display ordering controlled by Admin
  showOnHome?: boolean; // Whether plan appears in Home PlansSection
}

export interface DaySchedule {
  day: string; // 'Segunda-feira', 'Terça-feira', etc.
  shortDay: string; // 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'
  isOpen: boolean;
  openTime: string; // '08:00'
  closeTime: string; // '18:00'
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  cityId: string;
  categoryId: string;
  planId: string;
  description: string;
  phone: string;
  whatsapp: string;
  email?: string;
  ownerEmail?: string;
  address: string;
  neighborhood: string;
  openingHours?: string;
  weeklySchedule?: DaySchedule[];
  logoUrl: string;
  coverUrl?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  password?: string;
  hasPassword?: boolean;
  isVerified?: boolean;
  emailVerified?: boolean;
  paymentStatus?: 'active' | 'pending_payment';
  pendingPlanId?: string;
  pendingBillingCycle?: BillingCycle;
  billingCycle?: BillingCycle;
  planExpiresAt?: string;
  inviteCode?: string;
  subscriptionStatus?: 'active' | 'cancelled';
  paymentToken?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  cityId: string; // cached for quick city filtering
  name: string;
  price: number; // in BRL
  originalPrice?: number;
  description: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  featured?: boolean;
  createdAt: string;
}

export type ServicePriceType = 'fixed' | 'from' | 'hourly' | 'quote';
export type ServiceMode = 'on_site' | 'home_visit' | 'online' | 'both';

export interface Service {
  id: string;
  businessId: string;
  cityId: string;
  name: string;
  priceType: ServicePriceType;
  price?: number; // in BRL when priceType !== 'quote'
  duration: string; // e.g. '45 min', '2 horas', 'Sob consulta'
  serviceMode: ServiceMode;
  description: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface AdminTheme {
  primaryColor: string;
  primaryHover: string;
  accentColor: string;
  accentHover: string;
  themeName: string;
}

export type BannerPosition = 'top' | 'bottom' | 'rotating_header';

export interface AdBanner {
  id: string;
  title: string;
  position: BannerPosition;
  imageUrl: string;
  linkUrl?: string;
  advertiserName: string;
  cityId: string; // 'all' or specific cityId
  priceMonthly: number; // in BRL, billed separately (cobrado separadamente)
  isActive: boolean;
  clicksCount?: number;
  badgeText?: string;
  tagline?: string;
}

export interface StoreProductCategory {
  id: string;
  businessId: string;
  name: string;
  description?: string;
}

export interface BannerPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  viewsLimit?: number;
  description?: string;
  highlighted?: boolean;
}

export interface SessionConfig {
  adminSessionDurationMinutes: number;
  businessSessionDurationMinutes: number;
}

export interface AuthSession {
  isAuthenticated: boolean;
  role: 'admin' | 'business' | null;
  userId?: string;
  name: string;
  email: string;
  businessId?: string;
  token?: string;
  loginTimestamp?: number;
  expiresAt?: number;
  durationMinutes?: number;
}

export type AppView =
  | 'home'
  | 'categories'
  | 'stores'
  | 'products'
  | 'services'
  | 'plans'
  | 'founder_sales'
  | 'banner_ad_page'
  | 'admin'
  | 'admin_login'
  | 'business_portal'
  | 'login'
  | 'register_store'
  | 'checkout';

export type BusinessPortalTab =
  | 'dashboard'
  | 'products'
  | 'services'
  | 'prod_categories'
  | 'banners'
  | 'edit_profile'
  | 'plans'
  | 'register_new';

export interface MercadoPagoConfig {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  publicKey: string;
  accessToken: string;
  pixKey?: string;
  statementDescriptor: string; // Ex: ACHENACIDADE
  autoApproveInSandbox?: boolean;
}

export interface PaymentTransaction {
  id: string;
  businessId: string;
  businessName: string;
  planId: string;
  planName: string;
  billingCycle?: BillingCycle;
  cycleMonths?: number;
  baseAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  amount: number;
  paymentMethod: 'pix' | 'credit_card';
  status: 'approved' | 'pending' | 'rejected';
  mercadoPagoPaymentId: string;
  qrCode?: string;
  qrCodeText?: string;
  installments?: number;
  cardLastFour?: string;
  cardBrand?: string;
  payerEmail: string;
  createdAt: string;
  paidAt?: string;
}

export interface PushPreferences {
  enabled: boolean;
  cityScope: 'alagoinhas_only' | 'all_cities';
  notifyNewOffers: boolean;
  notifyNewServices: boolean;
  favoritesOnly: boolean;
  vapidPublicKey?: string;
}

export interface PushAlertLog {
  id: string;
  businessId: string;
  businessName: string;
  cityId: string;
  itemType: 'product' | 'service';
  itemId: string;
  title: string;
  body: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
  deliveredViaSW: boolean;
}

export type SiteMode = 'normal' | 'launch' | 'maintenance';

export interface LaunchBenefit {
  id: string;
  title: string;
  description: string;
  highlightMetric?: string;
}

export interface LaunchPageConfig {
  targetDateIso: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  secondaryCtaText: string;
  availableSpots: number;
  benefitsTitle: string;
  benefitsSubtitle: string;
  benefits: LaunchBenefit[];
  whatsappNumber: string;
  whatsappMessage: string;
  guaranteeNote: string;
}

export interface MaintenancePageConfig {
  targetDateIso: string;
  badgeLabel: string;
  headline: string;
  description: string;
  ctaText: string;
  whatsappNumber: string;
  showWhatsappButton: boolean;
}

export interface SiteModeConfig {
  mode: SiteMode;
  launch: LaunchPageConfig;
  maintenance: MaintenancePageConfig;
}

export type EmailTemplateKey =
  | 'email_verification'
  | 'payment_link'
  | 'welcome'
  | 'payment_approved';

export interface EmailTemplate {
  key: EmailTemplateKey;
  name: string;
  description: string;
  enabled: boolean;
  subject: string;
  heading: string;
  body: string;
  buttonText: string;
  footerNote: string;
  availableVariables: string[];
}

export interface SmtpConfig {
  enabled: boolean;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  host: string;
  port: number;
  secure: boolean;
  allowSelfSignedCert?: boolean;
  user: string;
  pass: string;
  allowLocalFallback: boolean;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  templateKey: EmailTemplateKey | 'test';
  templateName: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  verificationCode?: string;
  paymentUrl?: string;
  deliveryMode: 'smtp' | 'local_fallback';
  status: 'sent' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

export interface CheckoutTarget {
  businessId: string;
  planId: string;
  billingCycle?: BillingCycle;
  token?: string;
}

export interface AppGeneralConfig {
  // Identidade Geral, Contato & WhatsApp
  appName: string;
  tagline: string;
  cityLabel: string;
  contactEmail: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  whatsappGroupUrl: string;
  whatsappGroupLabel: string;

  // Redes Sociais Oficiais
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  websiteUrl: string;

  // SEO & Metadados Sociais
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImageUrl: string;
  canonicalUrl: string;
  twitterHandle: string;
  googleSiteVerification: string;
  robotsIndex: boolean;
}

export type BusinessMetricEventType = 'view' | 'whatsapp_click' | 'showcase_click';

export interface DailyMetricPoint {
  date: string; // YYYY-MM-DD
  label: string; // Ex: Seg, Ter, Qua
  views: number;
  whatsappClicks: number;
  showcaseClicks: number;
}

export interface BusinessMetricsSummary {
  viewsTotal: number;
  whatsappClicks: number;
  showcaseClicks: number;
  conversionRate: string;
  daily: DailyMetricPoint[];
}

export type PlanInviteStatus = 'active' | 'used' | 'revoked' | 'expired';

export interface PlanInvite {
  id: string;
  code: string;
  planId: string;
  maxUses: number;
  usedCount: number;
  recipientHint?: string;
  expiresAt?: string; // YYYY-MM-DD optional expiry of the invite link itself
  status: PlanInviteStatus;
  redeemedByBusinessId?: string;
  redeemedByBusinessName?: string;
  redeemedAt?: string;
  createdAt: string;
}
