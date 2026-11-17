import { Service, ServiceMode, ServicePriceType } from '../types';

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatServicePrice(service: Pick<Service, 'priceType' | 'price'>): string {
  if (service.priceType === 'quote' || !service.price || service.price <= 0) {
    return 'Sob orçamento';
  }
  const formatted = formatCurrencyBRL(service.price);
  if (service.priceType === 'from') return `A partir de ${formatted}`;
  if (service.priceType === 'hourly') return `${formatted}/hora`;
  return formatted;
}

export function getServicePriceTypeLabel(priceType: ServicePriceType): string {
  switch (priceType) {
    case 'fixed':
      return 'Preço fixo';
    case 'from':
      return 'A partir de';
    case 'hourly':
      return 'Por hora';
    case 'quote':
      return 'Sob orçamento';
  }
}

export function getServiceModeLabel(mode: ServiceMode): string {
  switch (mode) {
    case 'on_site':
      return 'No local';
    case 'home_visit':
      return 'Em domicílio';
    case 'online':
      return 'Online / Remoto';
    case 'both':
      return 'Local e Domicílio';
  }
}

export function getServiceWhatsAppMessage(service: Service, businessName?: string): string {
  const priceText =
    service.priceType === 'quote' || !service.price
      ? 'solicitar um orçamento'
      : `saber mais (${formatServicePrice(service)})`;
  return `Olá${businessName ? ` ${businessName}` : ''}! Vi o serviço "${service.name}" no achenacidade e gostaria de ${priceText}.`;
}
