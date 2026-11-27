import type { Business } from '../types';

type BusinessMediaInput =
  | (Partial<Business> & { photo_url?: string | null; logo_url?: string | null; cover_url?: string | null })
  | null
  | undefined;

function cleanUrl(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveBusinessPhotoUrl(business: BusinessMediaInput): string {
  if (!business) return '';
  return cleanUrl(business.photoUrl) || cleanUrl(business.photo_url);
}

export function getBusinessLogoUrl(business: BusinessMediaInput): string {
  if (!business) return '';
  return (
    cleanUrl(business.logoUrl) ||
    cleanUrl(business.logo_url) ||
    resolveBusinessPhotoUrl(business) ||
    cleanUrl(business.coverUrl) ||
    cleanUrl(business.cover_url)
  );
}

export function getBusinessCoverUrl(business: BusinessMediaInput): string {
  if (!business) return '';
  return (
    cleanUrl(business.coverUrl) ||
    cleanUrl(business.cover_url) ||
    resolveBusinessPhotoUrl(business) ||
    cleanUrl(business.logoUrl) ||
    cleanUrl(business.logo_url)
  );
}
