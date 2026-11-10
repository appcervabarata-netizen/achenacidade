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

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number; // in BRL, e.g. 0, 49.90, 99.90
  productLimit: number; // Max products allowed for this plan
  businessLimit: number; // Max stores/businesses allowed per user account
  badge: string; // e.g. "Gratuito", "Profissional", "Destaque Ouro"
  features: string[];
  highlighted?: boolean;
  color: string;
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
  isVerified?: boolean;
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

export interface SessionConfig {
  adminSessionDurationMinutes: number; // e.g. 120 (2h)
  businessSessionDurationMinutes: number; // e.g. 1440 (24h)
}

export interface AuthSession {
  isAuthenticated: boolean;
  role: 'admin' | 'business' | null;
  name: string;
  email: string;
  businessId?: string;
  loginTimestamp?: number;
  expiresAt?: number;
}

export type AppView =
  | 'home'
  | 'categories'
  | 'stores'
  | 'products'
  | 'plans'
  | 'admin'
  | 'business_portal'
  | 'login'
  | 'register_store';

