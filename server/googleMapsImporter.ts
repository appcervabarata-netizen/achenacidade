import crypto from 'crypto';
import type { DbGoogleMapsBusinessDraft } from './db.ts';

export interface DirectoryCategoryTarget {
  id: string;
  name: string;
  slug: string;
}

export interface DirectoryCityTarget {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
}

export interface ImporterQueryPlanItem {
  categoryId: string;
  categoryName: string;
  queryTerm: string;
  locationLabel: string;
  cityQuery: string;
  includedType?: string;
}

export interface GoogleMapsBatchResult {
  success: boolean;
  addedDrafts: DbGoogleMapsBusinessDraft[];
  skippedDuplicates: number;
  queriesExecuted: number;
  nextCursor: number;
  quotaExceeded: boolean;
  error?: string;
  summary: string;
}

// Coordenadas centrais de Alagoinhas - BA (litoral norte / agreste baiano)
const ALAGOINHAS_CENTER = {
  latitude: -12.1336,
  longitude: -38.4192,
};

// Localidades da microrregião de Alagoinhas - BA e entorno imediato
const REGIONAL_LOCATIONS: Array<{
  label: string;
  cityQuery: string;
}> = [
  { label: 'Alagoinhas - Centro', cityQuery: 'Centro, Alagoinhas, BA' },
  { label: 'Alagoinhas - Alagoinhas Velha', cityQuery: 'Alagoinhas Velha, Alagoinhas, BA' },
  { label: 'Alagoinhas - Jardim Petrolar', cityQuery: 'Jardim Petrolar, Alagoinhas, BA' },
  { label: 'Alagoinhas - Santa Terezinha', cityQuery: 'Santa Terezinha, Alagoinhas, BA' },
  { label: 'Alagoinhas - Teresópolis', cityQuery: 'Teresópolis, Alagoinhas, BA' },
  { label: 'Alagoinhas - Cidade', cityQuery: 'Alagoinhas, BA' },
  { label: 'Aramari - BA (Região)', cityQuery: 'Aramari, BA' },
  { label: 'Catu - BA (Região)', cityQuery: 'Catu, BA' },
  { label: 'Entre Rios - BA (Região)', cityQuery: 'Entre Rios, BA' },
  { label: 'Pojuca - BA (Região)', cityQuery: 'Pojuca, BA' },
  { label: 'Inhambupe - BA (Região)', cityQuery: 'Inhambupe, BA' },
];

// Matriz de categorias reais do diretório com termos em PT-BR e Table A types da Places API (New)
const CATEGORY_QUERY_BLUEPRINTS: Array<{
  categoryId: string;
  categoryName: string;
  terms: Array<{ queryTerm: string; includedType?: string }>;
}> = [
  {
    categoryId: 'cat-1',
    categoryName: 'Gastronomia & Bares',
    terms: [
      { queryTerm: 'restaurante churrascaria pizzaria', includedType: 'restaurant' },
      { queryTerm: 'hamburgueria lanchonete bar' },
    ],
  },
  {
    categoryId: 'cat-13',
    categoryName: 'Farmácias & Drogarias',
    terms: [{ queryTerm: 'farmácia drogaria', includedType: 'pharmacy' }],
  },
  {
    categoryId: 'cat-11',
    categoryName: 'Supermercados & Empórios',
    terms: [{ queryTerm: 'supermercado mercadinho açougue', includedType: 'supermarket' }],
  },
  {
    categoryId: 'cat-7',
    categoryName: 'Serviços Automotivos',
    terms: [
      { queryTerm: 'oficina mecânica auto center', includedType: 'car_repair' },
      { queryTerm: 'autopeças lava jato' },
    ],
  },
  {
    categoryId: 'cat-5',
    categoryName: 'Construção & Reforma',
    terms: [{ queryTerm: 'material de construção tintas ferragens', includedType: 'hardware_store' }],
  },
  {
    categoryId: 'cat-2',
    categoryName: 'Moda & Acessórios',
    terms: [{ queryTerm: 'loja de roupas calçados moda', includedType: 'clothing_store' }],
  },
  {
    categoryId: 'cat-8',
    categoryName: 'Beleza & Barbearia',
    terms: [
      { queryTerm: 'salão de beleza estética', includedType: 'beauty_salon' },
      { queryTerm: 'barbearia' },
    ],
  },
  {
    categoryId: 'cat-3',
    categoryName: 'Saúde & Bem-Estar',
    terms: [
      { queryTerm: 'clínica médica laboratório odontologia' },
      { queryTerm: 'clínica odontológica dentista', includedType: 'dentist' },
    ],
  },
  {
    categoryId: 'cat-4',
    categoryName: 'Tecnologia & Celulares',
    terms: [{ queryTerm: 'assistência técnica celular loja de eletrônicos', includedType: 'electronics_store' }],
  },
  {
    categoryId: 'cat-6',
    categoryName: 'Pet Shop & Veterinária',
    terms: [{ queryTerm: 'pet shop clínica veterinária', includedType: 'pet_store' }],
  },
  {
    categoryId: 'cat-14',
    categoryName: 'Padarias, Doces & Açaí',
    terms: [{ queryTerm: 'padaria confeitaria cafeteria açaí', includedType: 'bakery' }],
  },
  {
    categoryId: 'cat-15',
    categoryName: 'Móveis, Eletro & Decoração',
    terms: [{ queryTerm: 'loja de móveis eletrodomésticos colchões', includedType: 'furniture_store' }],
  },
  {
    categoryId: 'cat-16',
    categoryName: 'Papelarias, Gráficas & Presentes',
    terms: [{ queryTerm: 'papelaria gráfica livraria presentes' }],
  },
  {
    categoryId: 'cat-19',
    categoryName: 'Academias, Esportes & Lazer',
    terms: [{ queryTerm: 'academia musculação crossfit', includedType: 'gym' }],
  },
  {
    categoryId: 'cat-21',
    categoryName: 'Óticas, Joias & Relojoarias',
    terms: [{ queryTerm: 'ótica relojoaria joalheria' }],
  },
  {
    categoryId: 'cat-17',
    categoryName: 'Contabilidade, Advocacia & Consultoria',
    terms: [{ queryTerm: 'escritório de contabilidade advocacia' }],
  },
  {
    categoryId: 'cat-18',
    categoryName: 'Agropecuária, Rações & Jardinagem',
    terms: [{ queryTerm: 'agropecuária casa de ração floricultura' }],
  },
  {
    categoryId: 'cat-22',
    categoryName: 'Gás, Água & Bebidas',
    terms: [{ queryTerm: 'distribuidora de gás água mineral bebidas' }],
  },
  {
    categoryId: 'cat-10',
    categoryName: 'Imóveis & Imobiliárias',
    terms: [{ queryTerm: 'imobiliária corretor de imóveis', includedType: 'real_estate_agency' }],
  },
  {
    categoryId: 'cat-9',
    categoryName: 'Educação & Cursos',
    terms: [{ queryTerm: 'escola curso profissionalizante idiomas' }],
  },
  {
    categoryId: 'cat-20',
    categoryName: 'Hotéis, Pousadas & Turismo',
    terms: [{ queryTerm: 'hotel pousada hospedagem', includedType: 'hotel' }],
  },
  {
    categoryId: 'cat-12',
    categoryName: 'Festas & Eventos',
    terms: [{ queryTerm: 'buffet decoração festas eventos' }],
  },
];

export function resolveGoogleMapsApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
    ''
  );
}

export function buildRotatingQuerySchedule(
  availableCategories?: DirectoryCategoryTarget[],
  options?: { onlyAlagoinhas?: boolean }
): ImporterQueryPlanItem[] {
  const categoryNameById = new Map((availableCategories || []).map((c) => [c.id, c.name]));
  const plan: ImporterQueryPlanItem[] = [];
  const locations = options?.onlyAlagoinhas
    ? REGIONAL_LOCATIONS.filter((loc) => loc.cityQuery.toLowerCase().includes('alagoinhas'))
    : REGIONAL_LOCATIONS;

  // Intercala categorias diferentes antes de avançar para a próxima localidade/termo
  // garantindo máxima variedade em cada lote (50 ou 10 empresas)
  for (let locIdx = 0; locIdx < locations.length; locIdx++) {
    const loc = locations[locIdx];
    for (let catIdx = 0; catIdx < CATEGORY_QUERY_BLUEPRINTS.length; catIdx++) {
      const bp = CATEGORY_QUERY_BLUEPRINTS[catIdx];
      const term = bp.terms[locIdx % bp.terms.length];
      plan.push({
        categoryId: bp.categoryId,
        categoryName: categoryNameById.get(bp.categoryId) || bp.categoryName,
        queryTerm: term.queryTerm,
        locationLabel: loc.label,
        cityQuery: loc.cityQuery,
        includedType: term.includedType,
      });
    }
  }

  return plan;
}

export function normalizeBusinessSignature(name: string, phone?: string): string {
  const cleanName = (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  const digits = (phone || '').replace(/\D/g, '').slice(-8);
  return `${cleanName}::${digits}`;
}

function extractBrazilianPhoneAndWhatsapp(national?: string, international?: string): {
  phone: string;
  whatsapp: string;
} {
  const formatted = (national || international || '').trim();
  const rawDigits = (international || national || '').replace(/\D/g, '');
  let localDigits = rawDigits;
  if (localDigits.startsWith('55') && (localDigits.length === 12 || localDigits.length === 13)) {
    localDigits = localDigits.slice(2);
  }

  // Celular brasileiro (11 dígitos com 9 na posição 2) vira WhatsApp 55...
  let whatsapp = '';
  if (localDigits.length === 11 && localDigits[2] === '9') {
    whatsapp = `55${localDigits}`;
  }

  return {
    phone: formatted,
    whatsapp,
  };
}

function extractAddressParts(
  place: any,
  fallbackCityLabel: string,
  onlyAlagoinhas = false
): {
  address: string;
  neighborhood: string;
  cityName: string;
  isWithinRegion: boolean;
} {
  const components: Array<{ longText?: string; shortText?: string; types?: string[] }> =
    Array.isArray(place?.addressComponents) ? place.addressComponents : [];

  const findComponent = (types: string[]) =>
    components.find((c) => Array.isArray(c.types) && c.types.some((t) => types.includes(t)));

  const streetComp = findComponent(['route']);
  const numberComp = findComponent(['street_number']);
  const neighborhoodComp = findComponent([
    'sublocality_level_1',
    'sublocality',
    'neighborhood',
  ]);
  const cityComp = findComponent(['administrative_area_level_2', 'locality']);
  const stateComp = findComponent(['administrative_area_level_1']);

  const fullFormatted = String(place?.formattedAddress || place?.shortFormattedAddress || '').trim();

  let neighborhood = neighborhoodComp?.longText?.trim() || '';
  if (!neighborhood && fullFormatted) {
    // Formato típico Brasil: "Rua X, 123 - Bairro, Alagoinhas - BA, 48000-000, Brasil"
    const dashParts = fullFormatted.split(' - ');
    if (dashParts.length >= 2) {
      const candidate = dashParts[1].split(',')[0]?.trim();
      if (candidate && candidate.length >= 3 && !/^\d{5}-?\d{3}$/.test(candidate)) {
        neighborhood = candidate;
      }
    }
  }
  if (!neighborhood) {
    neighborhood = 'Centro';
  }

  const cityRaw = cityComp?.longText?.trim() || fallbackCityLabel.split(' - ')[0] || 'Alagoinhas';
  const stateRaw = stateComp?.shortText?.trim() || 'BA';
  const cityName = `${cityRaw} - ${stateRaw}`;

  const shortStreet = streetComp?.longText
    ? `${streetComp.longText}${numberComp?.longText ? `, ${numberComp.longText}` : ''}`
    : '';
  const address =
    String(place?.shortFormattedAddress || '').trim() ||
    shortStreet ||
    fullFormatted;

  const normalizedCity = cityRaw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const allowedRegionalCities = [
    'alagoinhas',
    'aramari',
    'entre rios',
    'catu',
    'pojuca',
    'inhambupe',
    'esplanada',
    'cardeal da silva',
    'satiro dias',
    'ouriçangas',
    'ouricangas',
    'pedrao',
    'teodoro sampaio',
  ];

  const isWithinRegion =
    stateRaw.toUpperCase() === 'BA' &&
    (onlyAlagoinhas
      ? normalizedCity.includes('alagoinhas')
      : allowedRegionalCities.some((allowed) => normalizedCity.includes(allowed)));

  return {
    address,
    neighborhood,
    cityName,
    isWithinRegion,
  };
}

function mapCityIdFromDetectedCity(
  detectedCityName: string,
  activeCities: DirectoryCityTarget[]
): string {
  const cleanDetected = detectedCityName
    .split(' - ')[0]
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const exactMatch = activeCities.find(
    (c) =>
      c.isActive &&
      c.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') === cleanDetected
  );
  if (exactMatch) return exactMatch.id;

  const alagoinhasCity =
    activeCities.find((c) => c.name.toLowerCase().includes('alagoinhas') && c.isActive) ||
    activeCities.find((c) => c.isActive) ||
    activeCities[0];
  return alagoinhasCity?.id || 'city-1';
}

function inferBestCategoryFromPlace(
  place: any,
  fallbackCategoryId: string,
  fallbackCategoryName: string,
  availableCategories: DirectoryCategoryTarget[]
): { categoryId: string; categoryName: string } {
  const types: string[] = Array.isArray(place?.types) ? place.types : [];
  const primaryType = String(place?.primaryType || '');
  const allTypes = new Set([primaryType, ...types].filter(Boolean));

  const rules: Array<{ types: string[]; categoryId: string }> = [
    { types: ['pharmacy', 'drugstore'], categoryId: 'cat-13' },
    { types: ['bakery', 'cafe', 'ice_cream_shop'], categoryId: 'cat-14' },
    { types: ['restaurant', 'meal_takeaway', 'fast_food_restaurant', 'bar', 'steak_house', 'pizza_restaurant'], categoryId: 'cat-1' },
    { types: ['supermarket', 'grocery_store', 'butcher_shop'], categoryId: 'cat-11' },
    { types: ['car_repair', 'car_wash', 'auto_parts_store', 'tire_shop'], categoryId: 'cat-7' },
    { types: ['hardware_store', 'home_improvement_store'], categoryId: 'cat-5' },
    { types: ['clothing_store', 'shoe_store', 'department_store'], categoryId: 'cat-2' },
    { types: ['beauty_salon', 'hair_salon', 'barber_shop', 'spa'], categoryId: 'cat-8' },
    { types: ['dentist', 'doctor', 'hospital', 'physiotherapist', 'medical_lab'], categoryId: 'cat-3' },
    { types: ['electronics_store', 'cell_phone_store', 'computer_store'], categoryId: 'cat-4' },
    { types: ['pet_store', 'veterinary_care'], categoryId: 'cat-6' },
    { types: ['furniture_store', 'home_goods_store'], categoryId: 'cat-15' },
    { types: ['book_store', 'stationery_store', 'print_shop'], categoryId: 'cat-16' },
    { types: ['gym', 'fitness_center', 'sporting_goods_store'], categoryId: 'cat-19' },
    { types: ['jewelry_store', 'optician'], categoryId: 'cat-21' },
    { types: ['accounting', 'lawyer'], categoryId: 'cat-17' },
    { types: ['florist', 'garden_center'], categoryId: 'cat-18' },
    { types: ['real_estate_agency'], categoryId: 'cat-10' },
    { types: ['school', 'university'], categoryId: 'cat-9' },
    { types: ['hotel', 'lodging'], categoryId: 'cat-20' },
  ];

  for (const rule of rules) {
    if (rule.types.some((t) => allTypes.has(t))) {
      const cat = availableCategories.find((c) => c.id === rule.categoryId);
      if (cat) return { categoryId: cat.id, categoryName: cat.name };
    }
  }

  return { categoryId: fallbackCategoryId, categoryName: fallbackCategoryName };
}

export interface ResolvedGooglePlacePhoto {
  photoUrl?: string;
  photoAttributionName?: string;
  photoAttributionUri?: string;
}

// Place Photos (New): resolves direct CDN photoUri via skipHttpRedirect=true (never embeds API keys in persisted URLs)
// Reference: https://developers.google.com/maps/documentation/places/web-service/place-photos?utm_campaign=gmp_mcp_codeassist_v1_aistudio
export async function resolvePhotoFromPlacePhotosArray(
  photos: unknown,
  apiKey: string
): Promise<ResolvedGooglePlacePhoto> {
  if (!Array.isArray(photos) || photos.length === 0 || !apiKey) {
    return {};
  }

  for (const photo of photos.slice(0, 2)) {
    const photoName = typeof (photo as any)?.name === 'string' ? (photo as any).name.trim() : '';
    if (!photoName) continue;

    try {
      const cleanName = photoName.replace(/^\/+/, '');
      const mediaEndpoint = `https://places.googleapis.com/v1/${cleanName}/media?maxWidthPx=800&skipHttpRedirect=true`;
      const response = await fetch(mediaEndpoint, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
      });
      if (!response.ok) continue;

      const data = (await response.json().catch(() => ({}))) as { photoUri?: string };
      const rawUri = typeof data?.photoUri === 'string' ? data.photoUri.trim() : '';
      const normalizedUri = rawUri.startsWith('//') ? `https:${rawUri}` : rawUri;
      if (!normalizedUri.startsWith('http://') && !normalizedUri.startsWith('https://')) {
        continue;
      }

      const attrList = Array.isArray((photo as any)?.authorAttributions)
        ? (photo as any).authorAttributions
        : [];
      const firstAttr = attrList[0] as { displayName?: string; uri?: string } | undefined;
      const attrName = typeof firstAttr?.displayName === 'string' ? firstAttr.displayName.trim() : '';
      const rawAttrUri = typeof firstAttr?.uri === 'string' ? firstAttr.uri.trim() : '';
      const attrUri = rawAttrUri.startsWith('//') ? `https:${rawAttrUri}` : rawAttrUri;

      return {
        photoUrl: normalizedUri,
        ...(attrName ? { photoAttributionName: attrName } : {}),
        ...(attrUri ? { photoAttributionUri: attrUri } : {}),
      };
    } catch {
      // Try next photo candidate if available
    }
  }

  return {};
}

export async function fetchGooglePlacePhotoByPlaceId(
  googlePlaceId: string
): Promise<{ success: boolean; photo?: ResolvedGooglePlacePhoto; error?: string }> {
  const apiKey = resolveGoogleMapsApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'Chave GOOGLE_MAPS_API_KEY não configurada no servidor.',
    };
  }
  const cleanId = (googlePlaceId || '').trim();
  if (!cleanId) {
    return { success: false, error: 'Place ID do Google Maps ausente.' };
  }

  try {
    const detailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,photos',
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
      }
    );
    const detailsData = (await detailsRes.json().catch(() => ({}))) as any;
    if (!detailsRes.ok) {
      return {
        success: false,
        error: String(detailsData?.error?.message || `Google Maps Places API (${detailsRes.status})`),
      };
    }

    const resolved = await resolvePhotoFromPlacePhotosArray(detailsData?.photos, apiKey);
    if (!resolved.photoUrl) {
      return {
        success: false,
        error: 'Este estabelecimento não possui foto pública cadastrada no Google Maps.',
      };
    }

    return { success: true, photo: resolved };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao consultar foto no Google Maps.',
    };
  }
}

export async function runGoogleMapsImportBatch(params: {
  targetCount: number;
  startCursor: number;
  existingPlaceIds: Set<string>;
  existingSignatures: Set<string>;
  categories?: DirectoryCategoryTarget[];
  cities?: DirectoryCityTarget[];
  onlyAlagoinhas?: boolean;
}): Promise<GoogleMapsBatchResult> {
  const apiKey = resolveGoogleMapsApiKey();
  if (!apiKey) {
    return {
      success: false,
      addedDrafts: [],
      skippedDuplicates: 0,
      queriesExecuted: 0,
      nextCursor: params.startCursor,
      quotaExceeded: false,
      error:
        'Chave da API do Google Maps (GOOGLE_MAPS_API_KEY) não encontrada no servidor. Configure ou reinicie o servidor após ativar o Google Maps Platform.',
      summary: 'Chave Google Maps não configurada no servidor.',
    };
  }

  const schedule = buildRotatingQuerySchedule(params.categories, {
    onlyAlagoinhas: Boolean(params.onlyAlagoinhas),
  });
  const totalPlans = schedule.length;
  const target = Math.max(1, Math.min(60, Math.round(params.targetCount)));

  // Para lotes de 50, busca até 5 por categoria/query para espalhar em ~10-15 categorias distintas;
  // Para lotes de 10, busca até 5 por query para cobrir ao menos 2-3 categorias distintas.
  const maxPerQuery = target >= 40 ? 5 : 5;
  const maxQueries = target >= 40 ? 18 : 6;

  const addedDrafts: DbGoogleMapsBusinessDraft[] = [];
  let skippedDuplicates = 0;
  let queriesExecuted = 0;
  let cursor = ((params.startCursor % totalPlans) + totalPlans) % totalPlans;
  let quotaExceeded = false;
  let lastApiError: string | undefined;

  const seenPlaceIds = new Set(params.existingPlaceIds);
  const seenSignatures = new Set(params.existingSignatures);

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.shortFormattedAddress',
    'places.addressComponents',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.regularOpeningHours',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.photos',
    'places.primaryType',
    'places.primaryTypeDisplayName',
    'places.types',
    'places.businessStatus',
    'places.rating',
    'places.userRatingCount',
  ].join(',');

  while (addedDrafts.length < target && queriesExecuted < maxQueries) {
    const queryItem = schedule[cursor];
    cursor = (cursor + 1) % totalPlans;
    queriesExecuted += 1;

    try {
      const requestBody: Record<string, unknown> = {
        textQuery: `${queryItem.queryTerm} em ${queryItem.cityQuery}`,
        languageCode: 'pt-BR',
        regionCode: 'BR',
        pageSize: 10,
        locationBias: {
          circle: {
            center: ALAGOINHAS_CENTER,
            radius: 45000.0,
          },
        },
        ...(queryItem.includedType ? { includedType: queryItem.includedType } : {}),
      };

      // Places API (New): Text Search via server-side HTTP POST (avoids CORS and secures key)
      // Reference: https://developers.google.com/maps/documentation/places/web-service/text-search?utm_campaign=gmp_mcp_codeassist_v1_aistudio
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask,
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json().catch(() => ({}))) as any;

      if (!response.ok) {
        const apiMsg = String(data?.error?.message || `HTTP ${response.status}`);
        const apiStatus = String(data?.error?.status || '');
        if (
          response.status === 429 ||
          apiStatus === 'RESOURCE_EXHAUSTED' ||
          apiMsg.toLowerCase().includes('quota')
        ) {
          quotaExceeded = true;
          lastApiError = 'Limite de cota da API do Google Maps atingido temporariamente.';
          break;
        }
        lastApiError = `Google Maps Places API (${response.status}): ${apiMsg}`;
        if (response.status === 401 || response.status === 403) {
          break;
        }
        continue;
      }

      const places: any[] = Array.isArray(data?.places) ? data.places : [];
      let pickedFromThisQuery = 0;

      for (const place of places) {
        if (addedDrafts.length >= target || pickedFromThisQuery >= maxPerQuery) {
          break;
        }
        if (place?.businessStatus === 'CLOSED_PERMANENTLY') {
          continue;
        }

        const googlePlaceId = String(place?.id || '').trim();
        const displayName = String(place?.displayName?.text || '').trim();
        if (!googlePlaceId || !displayName) continue;

        const { phone, whatsapp } = extractBrazilianPhoneAndWhatsapp(
          place?.nationalPhoneNumber,
          place?.internationalPhoneNumber
        );
        const signature = normalizeBusinessSignature(displayName, phone);

        if (seenPlaceIds.has(googlePlaceId) || seenSignatures.has(signature)) {
          skippedDuplicates += 1;
          continue;
        }

        const addr = extractAddressParts(
          place,
          queryItem.locationLabel,
          Boolean(params.onlyAlagoinhas)
        );
        if (!addr.isWithinRegion) {
          continue;
        }

        const mappedCat = inferBestCategoryFromPlace(
          place,
          queryItem.categoryId,
          queryItem.categoryName,
          params.categories || []
        );

        const cityId = mapCityIdFromDetectedCity(addr.cityName, params.cities || []);
        const weekdayDescriptions: string[] = Array.isArray(
          place?.regularOpeningHours?.weekdayDescriptions
        )
          ? place.regularOpeningHours.weekdayDescriptions
          : [];
        const openingHours =
          weekdayDescriptions.length > 0 ? weekdayDescriptions.join(' | ').slice(0, 480) : undefined;

        const typeLabel =
          String(place?.primaryTypeDisplayName?.text || '').trim() || mappedCat.categoryName;
        const ratingPart =
          typeof place?.rating === 'number' && typeof place?.userRatingCount === 'number'
            ? ` Avaliação ${place.rating.toFixed(1)} (${place.userRatingCount} avaliações no Google Maps).`
            : '';

        const description = `${typeLabel} em ${addr.neighborhood}, ${addr.cityName}.${ratingPart} Cadastro importado do Google Maps aguardando conferência e atualização pelo lojista.`;

        const resolvedPhoto = await resolvePhotoFromPlacePhotosArray(place?.photos, apiKey);

        const draft: DbGoogleMapsBusinessDraft = {
          id: `draft-gmp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          googlePlaceId,
          name: displayName,
          cityId,
          cityName: addr.cityName,
          categoryId: mappedCat.categoryId,
          categoryName: mappedCat.categoryName,
          planId: 'plan-free',
          description,
          phone,
          whatsapp,
          address: addr.address,
          neighborhood: addr.neighborhood,
          ...(openingHours ? { openingHours } : {}),
          ...(place?.websiteUri ? { website: String(place.websiteUri) } : {}),
          ...(place?.googleMapsUri ? { googleMapsUri: String(place.googleMapsUri) } : {}),
          ...(resolvedPhoto.photoUrl ? { photoUrl: resolvedPhoto.photoUrl } : {}),
          ...(resolvedPhoto.photoAttributionName
            ? { photoAttributionName: resolvedPhoto.photoAttributionName }
            : {}),
          ...(resolvedPhoto.photoAttributionUri
            ? { photoAttributionUri: resolvedPhoto.photoAttributionUri }
            : {}),
          ...(place?.primaryType ? { primaryType: String(place.primaryType) } : {}),
          ...(typeof place?.rating === 'number' ? { rating: Number(place.rating) } : {}),
          ...(typeof place?.userRatingCount === 'number'
            ? { userRatingCount: Number(place.userRatingCount) }
            : {}),
          sourceQuery: `${queryItem.queryTerm} (${queryItem.cityQuery})`,
          sourceLocationLabel: addr.cityName,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        seenPlaceIds.add(googlePlaceId);
        seenSignatures.add(signature);
        addedDrafts.push(draft);
        pickedFromThisQuery += 1;
      }
    } catch (err) {
      lastApiError = err instanceof Error ? err.message : 'Erro de rede ao consultar Google Maps.';
    }
  }

  const distinctCategories = new Set(addedDrafts.map((d) => d.categoryName || d.categoryId)).size;
  const summary =
    addedDrafts.length > 0
      ? `${addedDrafts.length} nova(s) empresa(s) em ${distinctCategories} categoria(s) salvas como rascunho (${skippedDuplicates} duplicada(s) ignorada(s)).`
      : lastApiError ||
        (skippedDuplicates > 0
          ? `Nenhuma empresa inédita neste lote (${skippedDuplicates} duplicadas já cadastradas ou descartadas).`
          : 'Nenhum novo estabelecimento localizado nesta varredura.');

  return {
    success: addedDrafts.length > 0 || (!lastApiError && !quotaExceeded),
    addedDrafts,
    skippedDuplicates,
    queriesExecuted,
    nextCursor: cursor,
    quotaExceeded,
    ...(lastApiError ? { error: lastApiError } : {}),
    summary,
  };
}
