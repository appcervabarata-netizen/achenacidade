import type { AppGeneralConfig, Category, City } from '../types';

export interface AutoSeoInput {
  appName?: string;
  tagline?: string;
  cityLabel?: string;
  cities?: City[];
  categories?: Category[];
  ogImageUrl?: string;
  canonicalUrl?: string;
}

function clampTitle(raw: string): string {
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (clean.length <= 60) return clean;
  return clean.slice(0, 57).trimEnd() + '...';
}

function clampDescription(raw: string): string {
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (clean.length <= 160) return clean;
  return clean.slice(0, 157).trimEnd() + '...';
}

export function buildAutoSeoSuggestions(input: AutoSeoInput): Pick<
  AppGeneralConfig,
  'seoTitle' | 'seoDescription' | 'seoKeywords' | 'ogImageUrl' | 'canonicalUrl'
> {
  const appName = (input.appName || 'achenacidade').trim() || 'achenacidade';
  const activeCities = (input.cities || []).filter((c) => c.isActive);
  const primaryCity =
    activeCities.find((c) => c.isDefault) ||
    activeCities[0];
  const cityText =
    (input.cityLabel || '').trim() ||
    (primaryCity ? `${primaryCity.name} - ${primaryCity.state}` : 'sua cidade');

  const topCategories = (input.categories || [])
    .slice(0, 5)
    .map((c) => c.name.split('&')[0].trim().toLowerCase())
    .filter(Boolean);

  // Ideal 30-60 chars
  let seoTitle = `${appName} — Guia Comercial, Lojas e Ofertas em ${primaryCity?.name || 'Sua Cidade'}`;
  if (seoTitle.length > 60) {
    seoTitle = `${appName} — Guia Comercial, Lojas e Ofertas Locais`;
  }
  if (seoTitle.length < 30) {
    seoTitle = `${appName} — Empresas, Produtos e Serviços Locais`;
  }
  seoTitle = clampTitle(seoTitle);

  // Ideal 120-160 chars
  let seoDescription = `Encontre empresas, produtos e serviços em ${cityText}. Fale direto pelo WhatsApp com lojas locais e aproveite ofertas no ${appName}.`;
  if (seoDescription.length < 120) {
    seoDescription = `${seoDescription} Guia comercial completo para compras rápidas.`;
  }
  seoDescription = clampDescription(seoDescription);

  const cityKeywords = activeCities.slice(0, 4).map((c) => `lojas em ${c.name.toLowerCase()}`);
  const keywordPool = [
    appName.toLowerCase(),
    'guia comercial',
    `empresas em ${primaryCity?.name.toLowerCase() || 'alagoinhas'}`,
    'produtos locais',
    'serviços locais',
    'ofertas whatsapp',
    ...topCategories,
    ...cityKeywords,
  ];
  const uniqueKeywords = Array.from(new Set(keywordPool)).join(', ');

  const defaultCanonical =
    (input.canonicalUrl || '').trim() ||
    (typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://achenacidade.com.br/');

  return {
    seoTitle,
    seoDescription,
    seoKeywords: uniqueKeywords,
    ogImageUrl: (input.ogImageUrl || '').trim() || '/logo.png',
    canonicalUrl: defaultCanonical,
  };
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  const selector = `meta[${attrName}="${attrValue}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content.trim()) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  if (typeof document === 'undefined' || !href) return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function toAbsoluteUrl(urlOrPath: string, origin: string): string {
  const val = urlOrPath.trim();
  if (!val) return '';
  if (/^https?:\/\//i.test(val) || val.startsWith('data:')) return val;
  if (val.startsWith('/')) return `${origin}${val}`;
  return `${origin}/${val}`;
}

export function normalizeWhatsappUrl(number: string, message?: string): string {
  const digits = (number || '').replace(/\D/g, '');
  if (!digits) return '';
  const withCountry = digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
  const query = message?.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
  return `https://wa.me/${withCountry}${query}`;
}

export function formatWebsiteUrl(rawUrl?: string): string {
  const val = (rawUrl || '').trim();
  if (!val) return '';
  if (/^https?:\/\//i.test(val)) return val;
  return `https://${val.replace(/^\/+/, '')}`;
}

export function formatInstagramUrl(rawInstagram?: string): string {
  const val = (rawInstagram || '').trim();
  if (!val) return '';
  if (/^https?:\/\//i.test(val)) return val;
  if (/instagram\.com/i.test(val)) {
    return `https://${val.replace(/^\/+/, '')}`;
  }
  const handle = val.replace(/^@+/, '').replace(/^\/+|\/+$/g, '');
  return handle ? `https://instagram.com/${encodeURIComponent(handle)}` : '';
}

export function formatInstagramLabel(rawInstagram?: string): string {
  const val = (rawInstagram || '').trim();
  if (!val) return '';
  if (/^https?:\/\//i.test(val) || /instagram\.com/i.test(val)) {
    try {
      const parsed = new URL(val.startsWith('http') ? val : `https://${val}`);
      const seg = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
      return seg ? `@${seg}` : 'Instagram';
    } catch {
      return val;
    }
  }
  return val.startsWith('@') ? val : `@${val}`;
}

export function formatFacebookUrl(rawFacebook?: string): string {
  const val = (rawFacebook || '').trim();
  if (!val) return '';
  if (/^https?:\/\//i.test(val)) return val;
  if (/facebook\.com|fb\.com/i.test(val)) {
    return `https://${val.replace(/^\/+/, '')}`;
  }
  const handle = val.replace(/^@+/, '').replace(/^\/+|\/+$/g, '');
  return handle ? `https://facebook.com/${encodeURIComponent(handle)}` : '';
}

export function formatTelHref(rawPhone?: string): string {
  const clean = (rawPhone || '').replace(/[^\d+]/g, '');
  if (!clean) return '';
  return `tel:${clean}`;
}

export function formatMailtoHref(rawEmail?: string): string {
  const clean = (rawEmail || '').trim();
  if (!clean) return '';
  return `mailto:${clean}`;
}

export function formatMapsSearchUrl(parts: Array<string | undefined>): string {
  const query = parts
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ');
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function applySeoToDocumentHead(config: AppGeneralConfig): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = window.location.origin;
  const currentUrl = window.location.origin + window.location.pathname;
  const canonicalHref = (config.canonicalUrl || '').trim() || currentUrl;
  const title = (config.seoTitle || '').trim() || `${config.appName || 'achenacidade'} — Guia Comercial Local`;
  const description =
    (config.seoDescription || '').trim() ||
    'Encontre empresas, produtos e serviços na sua cidade com contato direto via WhatsApp.';
  const ogImage = toAbsoluteUrl(config.ogImageUrl || '/logo.png', origin);

  document.title = title;
  upsertMetaTag('name', 'description', description);
  upsertMetaTag('name', 'keywords', config.seoKeywords || '');
  upsertMetaTag('name', 'robots', config.robotsIndex === false ? 'noindex, nofollow' : 'index, follow');
  upsertMetaTag('name', 'apple-mobile-web-app-title', config.appName || 'achenacidade');
  upsertMetaTag('name', 'google-site-verification', config.googleSiteVerification || '');

  // Open Graph
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:site_name', config.appName || 'achenacidade');
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:url', canonicalHref);
  upsertMetaTag('property', 'og:image', ogImage);

  // Twitter
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', ogImage);
  if (config.twitterHandle?.trim()) {
    const formatted = config.twitterHandle.trim().startsWith('@')
      ? config.twitterHandle.trim()
      : `@${config.twitterHandle.trim()}`;
    upsertMetaTag('name', 'twitter:site', formatted);
  } else {
    upsertMetaTag('name', 'twitter:site', '');
  }

  // Canonical
  upsertCanonicalLink(canonicalHref);

  // Schema.org JSON-LD
  const sameAs = [
    config.instagramUrl,
    config.facebookUrl,
    config.youtubeUrl,
    config.tiktokUrl,
    config.linkedinUrl,
    config.whatsappGroupUrl,
    config.websiteUrl,
  ]
    .map((u) => (u || '').trim())
    .filter((u) => /^https?:\/\//i.test(u));

  const jsonLdPayload = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: config.appName || 'achenacidade',
        url: canonicalHref,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        description,
        inLanguage: 'pt-BR',
        ...(ogImage ? { image: ogImage } : {}),
      },
      {
        '@type': 'Organization',
        name: config.appName || 'achenacidade',
        url: config.websiteUrl?.trim() || canonicalHref,
        ...(ogImage ? { logo: ogImage } : {}),
        ...(config.contactEmail?.trim() ? { email: config.contactEmail.trim() } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
        ...(config.whatsappNumber?.replace(/\D/g, '')
          ? {
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                telephone: `+55${config.whatsappNumber.replace(/\D/g, '').replace(/^55/, '')}`,
                availableLanguage: ['Portuguese'],
              },
            }
          : {}),
      },
    ],
  };

  let jsonLdScript = document.getElementById('achenacidade-jsonld') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'achenacidade-jsonld';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }
  jsonLdScript.textContent = JSON.stringify(jsonLdPayload);
}
