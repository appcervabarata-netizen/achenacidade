import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Instagram,
  Download,
  Copy,
  Check,
  Sparkles,
  Store,
  Users,
  Smartphone,
  Square,
  Palette,
  Image as ImageIcon,
  Type,
  Layers,
  Eye,
  Upload,
  RotateCcw,
  Package,
} from 'lucide-react';

type AudienceType = 'moradores' | 'lojistas';
type FormatType = 'feed' | 'stories';
type CreativeTheme = 'cobalt-orange' | 'orange-energy' | 'clean-app';
type ScrimLevel = 'light' | 'medium' | 'strong';

interface CreativeTemplate {
  id: string;
  audience: AudienceType;
  label: string;
  kicker: string;
  cityBadge: string;
  headline: string;
  subheadline: string;
  highlights: string[];
  ctaText: string;
  footerText: string;
  bgImage: string;
  theme: CreativeTheme;
  scrim: ScrimLevel;
  caption: string;
}

import residentsShoppingImg from '../../assets/images/creative_residents_shopping_1794870463267.jpg';
import storeOwnerImg from '../../assets/images/creative_store_owner_1794870463106.jpg';
import mobileWhatsappImg from '../../assets/images/creative_mobile_whatsapp_1794870463342.jpg';

const GENERATED_BACKGROUNDS = [
  {
    id: 'bg-residents',
    label: 'Compras em Alagoinhas',
    url: residentsShoppingImg,
  },
  {
    id: 'bg-store-owner',
    label: 'Lojista Conectado',
    url: storeOwnerImg,
  },
  {
    id: 'bg-mobile',
    label: 'App no Celular (Azul & Laranja)',
    url: mobileWhatsappImg,
  },
];

const CREATIVE_TEMPLATES: CreativeTemplate[] = [
  {
    id: 'lancamento-moradores',
    audience: 'moradores',
    label: '01. Lançamento Oficial (Geral)',
    kicker: 'LANÇAMENTO OFICIAL',
    cityBadge: 'Alagoinhas - BA',
    headline: 'Chegou o Achenacidade em Alagoinhas!',
    subheadline:
      'Encontre lojas, serviços, gastronomia e ofertas da nossa cidade direto na palma da mão.',
    highlights: ['Busca Rápida', 'WhatsApp Direto', '100% Gratuito'],
    ctaText: 'Acesse o Guia Agora',
    footerText: '@achenacidade · achenacidade.com.br',
    bgImage: GENERATED_BACKGROUNDS[0].url,
    theme: 'cobalt-orange',
    scrim: 'medium',
    caption: `🚀 CHEGOU EM ALAGOINHAS - BA!\n\nO Achenacidade acaba de chegar para conectar você às melhores lojas, restaurantes, serviços e ofertas de Alagoinhas em segundos!\n\n✅ Pesquise empresas ou produtos\n✅ Fale direto no WhatsApp da loja\n✅ Apoie o comércio da nossa cidade\n\n👉 Acesse agora mesmo pelo link na bio!\n\n#Alagoinhas #AlagoinhasBA #Achenacidade #ComercioAlagoinhas #GuiaComercial #Bahia`,
  },
  {
    id: 'whatsapp-moradores',
    audience: 'moradores',
    label: '02. Achou, Chamou no WhatsApp',
    kicker: 'PRATICIDADE NO DIA A DIA',
    cityBadge: 'Alagoinhas - BA',
    headline: 'Achou, chamou no WhatsApp!',
    subheadline:
      'Precisa de algo hoje em Alagoinhas? Compare produtos locais e converse sem intermediários.',
    highlights: ['Sem Taxas', 'Lojas Verificadas', 'Bairros Locais'],
    ctaText: 'Pesquisar Lojas & Produtos',
    footerText: '@achenacidade · achenacidade.com.br',
    bgImage: GENERATED_BACKGROUNDS[2].url,
    theme: 'orange-energy',
    scrim: 'medium',
    caption: `📱 Precisou de algum produto ou serviço em Alagoinhas?\n\nNo Achenacidade você encontra em segundos, vê os detalhes e chama direto no WhatsApp do lojista — sem complicação e sem intermediários!\n\n🧡 Do Centro ao Jardim Petrolar, toda Alagoinhas em um só lugar.\n\n👉 Clique no link da bio e experimente!\n\n#AlagoinhasBA #Alagoinhas #ComprasAlagoinhas #Achenacidade #Bahia #DeliveryAlagoinhas`,
  },
  {
    id: 'ofertas-moradores',
    audience: 'moradores',
    label: '03. Vitrine de Ofertas Locais',
    kicker: 'COMÉRCIO FORTE',
    cityBadge: 'Alagoinhas - BA',
    headline: 'As Melhores Ofertas de Alagoinhas Estão Aqui',
    subheadline:
      'Gastronomia, moda, tecnologia, saúde e serviços com atendimento rápido na sua cidade.',
    highlights: ['Ofertas Reais', 'Favoritos', 'Perto de Você'],
    ctaText: 'Descobrir Lojas Locais',
    footerText: '@achenacidade · achenacidade.com.br',
    bgImage: GENERATED_BACKGROUNDS[0].url,
    theme: 'clean-app',
    scrim: 'light',
    caption: `🛍️ Valorize o comércio da nossa terra!\n\nNo Achenacidade você descobre lojas incríveis em Alagoinhas - BA com preços transparentes, horários de funcionamento e contato imediato.\n\nSalve suas lojas favoritas e não perca nenhuma novidade da cidade!\n\n🔗 Acesse pelo link na bio.\n\n#AlagoinhasBahia #CompreLocal #ComercioLocal #Alagoinhas #Achenacidade`,
  },
  {
    id: 'lojista-gratis',
    audience: 'lojistas',
    label: '04. Lojista: Cadastro Grátis',
    kicker: 'PARA EMPREENDEDORES',
    cityBadge: 'Alagoinhas - BA',
    headline: 'Lojista de Alagoinhas: Cadastre sua Loja Grátis!',
    subheadline:
      'Coloque sua empresa no maior guia digital da cidade e receba clientes direto no seu WhatsApp.',
    highlights: ['Plano Grátis', 'Catálogo Digital', 'Ativação Rápida'],
    ctaText: 'Cadastrar Minha Loja Agora',
    footerText: '@achenacidade · achenacidade.com.br',
    bgImage: GENERATED_BACKGROUNDS[1].url,
    theme: 'cobalt-orange',
    scrim: 'medium',
    caption: `🏪 ATENÇÃO LOJISTA E PRESTADOR DE SERVIÇO DE ALAGOINHAS - BA!\n\nSua empresa já está sendo encontrada quando os clientes pesquisam no celular?\n\nCadastre sua loja GRATUITAMENTE no Achenacidade e comece a divulgar seus produtos, horários, redes sociais e botão direto do WhatsApp!\n\n🔥 Vagas de lançamento abertas para Alagoinhas.\n👉 Cadastre-se agora pelo link na bio!\n\n#EmpreendedoresAlagoinhas #AlagoinhasBA #LojistasAlagoinhas #MarketingLocal #Achenacidade`,
  },
  {
    id: 'lojista-venda-mais',
    audience: 'lojistas',
    label: '05. Planos & Vitrine de Produtos',
    kicker: 'VENDA TODOS OS DIAS',
    cityBadge: 'Alagoinhas - BA',
    headline: 'Sua Vitrine Aberta 24h em Alagoinhas',
    subheadline:
      'Divulgue até 50 produtos com foto e preço, ganhe selo verificado e destaque no topo da cidade.',
    highlights: ['Selo Verificado', 'Até 50 Produtos', 'Pedidos no Whats'],
    ctaText: 'Conhecer Planos para Lojas',
    footerText: '@achenacidade · achenacidade.com.br',
    bgImage: GENERATED_BACKGROUNDS[2].url,
    theme: 'orange-energy',
    scrim: 'medium',
    caption: `📈 Quer aumentar suas vendas em Alagoinhas sem depender só do boca a boca?\n\nCom os planos do Achenacidade você monta sua vitrine digital em minutos:\n✔️ Fotos e preços dos seus produtos\n✔️ Selo de Empresa Verificada\n✔️ Destaque prioritário nas buscas da cidade\n✔️ Pagamento facilitado via PIX ou Cartão\n\n🚀 Clique no link da bio e destaque seu negócio hoje mesmo!\n\n#NegociosAlagoinhas #Alagoinhas #VendasOnline #ComercioAlagoinhas #Achenacidade`,
  },
  {
    id: 'lojista-bairros',
    audience: 'lojistas',
    label: '06. Alcance em Todos os Bairros',
    kicker: 'VISIBILIDADE REGIONAL',
    cityBadge: 'Alagoinhas - BA',
    headline: 'Do Centro ao Jardim Petrolar: Seja Encontrado!',
    subheadline:
      'Conecte sua marca a milhares de moradores de Alagoinhas que buscam produtos todos os dias.',
    highlights: ['Centro & Bairros', 'Fácil de Usar', 'Suporte Local'],
    ctaText: 'Anunciar Minha Empresa',
    footerText: '@achenacidade · achenacidade.com.br',
    bgImage: GENERATED_BACKGROUNDS[1].url,
    theme: 'clean-app',
    scrim: 'medium',
    caption: `📍 Centro, Alagoinhas Velha, Jardim Petrolar, Kennedy, Santa Terezinha...\n\nNão importa o bairro onde sua loja fica: no Achenacidade os moradores de toda Alagoinhas - BA encontram você com 1 toque!\n\n📲 Comece no plano gratuito ou escolha o Destaque Ouro.\n🔗 Link na bio para cadastrar sua empresa!\n\n#AlagoinhasBA #Alagoinhas #EmpresariosBA #DivulgueSuaMarca #Achenacidade`,
  },
];

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export const SocialCreativesStudio: React.FC = () => {
  const [audienceFilter, setAudienceFilter] = useState<'all' | AudienceType>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(CREATIVE_TEMPLATES[0].id);
  const [format, setFormat] = useState<FormatType>('feed');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);

  // Editable creative state
  const [kicker, setKicker] = useState(CREATIVE_TEMPLATES[0].kicker);
  const [cityBadge, setCityBadge] = useState(CREATIVE_TEMPLATES[0].cityBadge);
  const [headline, setHeadline] = useState(CREATIVE_TEMPLATES[0].headline);
  const [subheadline, setSubheadline] = useState(CREATIVE_TEMPLATES[0].subheadline);
  const [highlights, setHighlights] = useState<string[]>(CREATIVE_TEMPLATES[0].highlights);
  const [ctaText, setCtaText] = useState(CREATIVE_TEMPLATES[0].ctaText);
  const [footerText, setFooterText] = useState(CREATIVE_TEMPLATES[0].footerText);
  const [bgImage, setBgImage] = useState(CREATIVE_TEMPLATES[0].bgImage);
  const [theme, setTheme] = useState<CreativeTheme>(CREATIVE_TEMPLATES[0].theme);
  const [scrim, setScrim] = useState<ScrimLevel>(CREATIVE_TEMPLATES[0].scrim);
  const [caption, setCaption] = useState(CREATIVE_TEMPLATES[0].caption);

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const applyTemplate = (tpl: CreativeTemplate) => {
    setSelectedTemplateId(tpl.id);
    setKicker(tpl.kicker);
    setCityBadge(tpl.cityBadge);
    setHeadline(tpl.headline);
    setSubheadline(tpl.subheadline);
    setHighlights(tpl.highlights);
    setCtaText(tpl.ctaText);
    setFooterText(tpl.footerText);
    setBgImage(tpl.bgImage);
    setTheme(tpl.theme);
    setScrim(tpl.scrim);
    setCaption(tpl.caption);
  };

  const getCachedImage = useCallback(async (src: string): Promise<HTMLImageElement | null> => {
    if (!src) return null;
    const cached = imageCacheRef.current.get(src);
    if (cached && cached.complete) return cached;
    try {
      const loaded = await loadImage(src);
      imageCacheRef.current.set(src, loaded);
      return loaded;
    } catch {
      return null;
    }
  }, []);

  const renderCreative = useCallback(
    async (targetCanvas: HTMLCanvasElement, targetFormat: FormatType) => {
      const W = 1080;
      const H = targetFormat === 'feed' ? 1080 : 1920;
      targetCanvas.width = W;
      targetCanvas.height = H;

      const ctx = targetCanvas.getContext('2d');
      if (!ctx) return;

      const isStories = targetFormat === 'stories';

      // Load bg + logo concurrently
      const [bgImg, logoImg] = await Promise.all([
        getCachedImage(bgImage),
        getCachedImage('/logo.png'),
      ]);

      // 1. Base Canvas Background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, W, H);

      // 2. Background Photography (Cover Crop)
      if (bgImg) {
        const imgAspect = bgImg.width / bgImg.height;
        const canvasAspect = W / H;
        let drawW = W;
        let drawH = H;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > canvasAspect) {
          drawH = H;
          drawW = H * imgAspect;
          offsetX = -(drawW - W) / 2;
        } else {
          drawW = W;
          drawH = W / imgAspect;
          offsetY = -(drawH - H) / 2;
        }

        ctx.save();
        ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      }

      // 3. Theme-Specific Scrims & Brand Overlays
      const scrimMult = scrim === 'light' ? 0.72 : scrim === 'strong' ? 1.15 : 0.92;

      if (theme === 'cobalt-orange') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, `rgba(15, 23, 42, ${Math.min(0.95, 0.78 * scrimMult)})`);
        grad.addColorStop(0.38, `rgba(29, 78, 216, ${Math.min(0.8, 0.35 * scrimMult)})`);
        grad.addColorStop(0.72, `rgba(15, 23, 42, ${Math.min(0.96, 0.85 * scrimMult)})`);
        grad.addColorStop(1, `rgba(15, 23, 42, 0.97)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Warm orange radial glow at bottom-right
        const glow = ctx.createRadialGradient(W * 0.85, H * 0.82, 40, W * 0.85, H * 0.82, 580);
        glow.addColorStop(0, 'rgba(234, 88, 12, 0.34)');
        glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      } else if (theme === 'orange-energy') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, `rgba(194, 65, 12, ${Math.min(0.94, 0.78 * scrimMult)})`);
        grad.addColorStop(0.42, `rgba(234, 88, 12, ${Math.min(0.85, 0.32 * scrimMult)})`);
        grad.addColorStop(0.74, `rgba(15, 23, 42, ${Math.min(0.96, 0.88 * scrimMult)})`);
        grad.addColorStop(1, `rgba(15, 23, 42, 0.98)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Cobalt blue glow accent
        const glow = ctx.createRadialGradient(W * 0.15, H * 0.18, 30, W * 0.15, H * 0.18, 500);
        glow.addColorStop(0, 'rgba(29, 78, 216, 0.35)');
        glow.addColorStop(1, 'rgba(29, 78, 216, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      } else {
        // 'clean-app' theme: dark top scrim + crisp white lower showcase card
        const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
        topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.82)');
        topGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
        topGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, W, H);

        // Crisp white card bottom area
        const cardY = isStories ? H * 0.46 : H * 0.48;
        const cardH = H - cardY;
        ctx.save();
        drawRoundedRect(ctx, 44, cardY, W - 88, cardH - (isStories ? 220 : 44), 48);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
        ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
        ctx.shadowBlur = 45;
        ctx.fill();
        ctx.restore();
      }

      // 4. Outer Brand Accent Top Strip (Subtle 10px bar)
      const stripGrad = ctx.createLinearGradient(0, 0, W, 0);
      stripGrad.addColorStop(0, '#1D4ED8');
      stripGrad.addColorStop(0.5, '#EA580C');
      stripGrad.addColorStop(1, '#F97316');
      ctx.fillStyle = stripGrad;
      ctx.fillRect(0, 0, W, 12);

      // Safe coordinates
      const padX = 72;
      const topSafeY = isStories ? 235 : 70;
      const bottomSafeY = isStories ? H - 250 : H - 64;

      // 5. TOP BRAND HEADER LOCKUP (Logo + Achenacidade + City Pin)
      const logoSize = isStories ? 94 : 84;
      if (logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(padX + logoSize / 2, topSafeY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.28)';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(padX + logoSize / 2, topSafeY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, padX, topSafeY, logoSize, logoSize);
        ctx.restore();
      }

      // Brand Wordmark "achenacidade"
      const wordX = padX + logoSize + 24;
      const wordY = topSafeY + (isStories ? 42 : 38);
      ctx.font = '800 42px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      const achenaWidth = ctx.measureText('achena').width;
      ctx.fillText('achena', wordX, wordY);
      ctx.fillStyle = theme === 'orange-energy' ? '#FDE047' : '#F97316';
      ctx.fillText('cidade', wordX + achenaWidth, wordY);

      // Subtitle under brand: Alagoinhas - BA
      ctx.font = '700 23px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(`📍 ${cityBadge}`, wordX, wordY + 36);

      // Top-right Kicker tag (Clean high-contrast capsule)
      if (kicker.trim()) {
        ctx.font = '800 22px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
        const kickerUpper = kicker.trim().toUpperCase();
        const kMetrics = ctx.measureText(kickerUpper);
        const kPadX = 24;
        const kW = kMetrics.width + kPadX * 2;
        const kH = 48;
        const kX = W - padX - kW;
        const kY = topSafeY + (logoSize - kH) / 2;

        // Only draw top-right pill if it doesn't collide with brand wordmark
        if (kX > wordX + 260) {
          ctx.save();
          drawRoundedRect(ctx, kX, kY, kW, kH, 24);
          ctx.fillStyle = theme === 'orange-energy' ? '#0F172A' : '#EA580C';
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(kickerUpper, kX + kW / 2, kY + kH / 2 + 1);
          ctx.restore();
          ctx.textAlign = 'left';
        }
      }

      // 6. MAIN TYPOGRAPHY BLOCK
      const isCleanApp = theme === 'clean-app';
      const contentPadX = isCleanApp ? 88 : padX;
      const maxTextWidth = W - contentPadX * 2;

      // Determine Y starting position for main headline/copy
      let cursorY = isCleanApp
        ? isStories
          ? H * 0.51
          : H * 0.53
        : isStories
        ? H * 0.48
        : H * 0.37;

      // City Accent Label inside Clean App or main canvas
      if (isCleanApp && kicker.trim()) {
        ctx.font = '800 23px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#EA580C';
        ctx.textBaseline = 'top';
        ctx.fillText(kicker.trim().toUpperCase(), contentPadX, cursorY);
        cursorY += 42;
      }

      // Headline
      const headlineSize = isStories ? 76 : 64;
      ctx.font = `800 ${headlineSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const headlineLines = wrapLines(ctx, headline, maxTextWidth);
      const lineH = headlineSize * 1.13;

      ctx.save();
      ctx.fillStyle = isCleanApp ? '#0F172A' : '#FFFFFF';
      if (!isCleanApp) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 4;
      }
      ctx.textBaseline = 'top';
      headlineLines.slice(0, 4).forEach((line, idx) => {
        ctx.fillText(line, contentPadX, cursorY + idx * lineH);
      });
      ctx.restore();

      cursorY += Math.min(headlineLines.length, 4) * lineH + (isStories ? 28 : 20);

      // Subheadline
      const subSize = isStories ? 34 : 29;
      ctx.font = `500 ${subSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const subLines = wrapLines(ctx, subheadline, maxTextWidth);
      const subLineH = subSize * 1.38;

      ctx.save();
      ctx.fillStyle = isCleanApp ? '#334155' : '#E2E8F0';
      if (!isCleanApp) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 12;
      }
      ctx.textBaseline = 'top';
      subLines.slice(0, 3).forEach((line, idx) => {
        ctx.fillText(line, contentPadX, cursorY + idx * subLineH);
      });
      ctx.restore();

      cursorY += Math.min(subLines.length, 3) * subLineH + (isStories ? 42 : 28);

      // 7. HIGHLIGHTS ROW (3 Crisp Unboxed / Minimal Tags with Checkmarks)
      const validHighlights = highlights.filter((h) => h.trim());
      if (validHighlights.length > 0) {
        ctx.font = `700 ${isStories ? 25 : 22}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
        let chipX = contentPadX;
        const chipH = isStories ? 52 : 44;

        validHighlights.slice(0, 3).forEach((item) => {
          const text = `✓ ${item.trim()}`;
          const textW = ctx.measureText(text).width;
          const chipW = textW + 34;

          if (chipX + chipW <= W - contentPadX + 20) {
            ctx.save();
            drawRoundedRect(ctx, chipX, cursorY, chipW, chipH, 14);
            if (isCleanApp) {
              ctx.fillStyle = '#EFF6FF';
              ctx.strokeStyle = '#BFDBFE';
              ctx.lineWidth = 2;
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#1D4ED8';
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
              ctx.lineWidth = 2;
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#FFFFFF';
            }
            ctx.textBaseline = 'middle';
            ctx.fillText(text, chipX + 17, cursorY + chipH / 2 + 1);
            ctx.restore();

            chipX += chipW + 14;
          }
        });

        cursorY += chipH + (isStories ? 48 : 30);
      }

      // 8. PRIMARY CTA BUTTON
      const ctaY = Math.min(cursorY, bottomSafeY - (isStories ? 185 : 140));
      const ctaH = isStories ? 94 : 82;
      ctx.font = `800 ${isStories ? 34 : 30}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const ctaLabel = `${ctaText.trim()}  →`;
      const ctaTextW = ctx.measureText(ctaLabel).width;
      const ctaW = Math.min(maxTextWidth, Math.max(420, ctaTextW + 92));

      ctx.save();
      drawRoundedRect(ctx, contentPadX, ctaY, ctaW, ctaH, 24);
      const btnGrad = ctx.createLinearGradient(contentPadX, ctaY, contentPadX + ctaW, ctaY);
      if (theme === 'orange-energy') {
        btnGrad.addColorStop(0, '#1D4ED8');
        btnGrad.addColorStop(1, '#2563EB');
      } else {
        btnGrad.addColorStop(0, '#EA580C');
        btnGrad.addColorStop(1, '#F97316');
      }
      ctx.fillStyle = btnGrad;
      ctx.shadowColor = 'rgba(234, 88, 12, 0.42)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ctaLabel, contentPadX + ctaW / 2, ctaY + ctaH / 2 + 2);
      ctx.restore();
      ctx.textAlign = 'left';

      // 9. FOOTER BAR (Handle + Website + City Marker)
      const footerY = isCleanApp
        ? isStories
          ? H - 255
          : H - 86
        : bottomSafeY - 12;

      ctx.save();
      ctx.font = `700 ${isStories ? 26 : 22}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = isCleanApp ? '#475569' : '#CBD5E1';
      ctx.textBaseline = 'middle';
      ctx.fillText(footerText, contentPadX, footerY);

      ctx.textAlign = 'right';
      ctx.fillStyle = isCleanApp ? '#1D4ED8' : '#F97316';
      ctx.font = `800 ${isStories ? 25 : 22}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillText(cityBadge, W - contentPadX, footerY);
      ctx.restore();
    },
    [bgImage, cityBadge, ctaText, footerText, getCachedImage, headline, highlights, kicker, scrim, subheadline, theme]
  );

  // Redraw preview canvas whenever any control changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCreative(canvas, format);
  }, [format, renderCreative]);

  const triggerDownload = (canvas: HTMLCanvasElement, filename: string) => {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCurrent = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);
    await renderCreative(canvas, format);
    const suffix = format === 'feed' ? 'feed-1080x1080' : 'stories-1080x1920';
    triggerDownload(canvas, `achenacidade-alagoinhas-${selectedTemplateId}-${suffix}.png`);
    setIsExporting(false);
    setExportToast(`Criativo ${format === 'feed' ? 'Feed (1080×1080)' : 'Stories (1080×1920)'} baixado em PNG!`);
    setTimeout(() => setExportToast(null), 3500);
  };

  const handleDownloadBothFormats = async () => {
    setIsExporting(true);
    const offscreen = document.createElement('canvas');

    await renderCreative(offscreen, 'feed');
    triggerDownload(offscreen, `achenacidade-alagoinhas-${selectedTemplateId}-feed-1080x1080.png`);

    await new Promise((r) => setTimeout(r, 350));

    await renderCreative(offscreen, 'stories');
    triggerDownload(offscreen, `achenacidade-alagoinhas-${selectedTemplateId}-stories-1080x1920.png`);

    setIsExporting(false);
    setExportToast('Kit completo (Feed 1080×1080 + Stories 1080×1920) baixado em PNG!');
    setTimeout(() => setExportToast(null), 4000);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBgImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredTemplates = CREATIVE_TEMPLATES.filter(
    (t) => audienceFilter === 'all' || t.audience === audienceFilter
  );

  return (
    <div className="space-y-6">
      {/* Studio Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Instagram className="w-4 h-4" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
              Estúdio de Criativos Instagram & Stories · Alagoinhas - BA
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personalize textos, cores e formatos do kit oficial de lançamento em Alagoinhas (Moradores e Lojistas) e baixe em PNG de alta resolução (1080px).
          </p>
        </div>

        {/* Audience Filter Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 self-start">
          <button
            type="button"
            onClick={() => setAudienceFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              audienceFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Todos ({CREATIVE_TEMPLATES.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setAudienceFilter('moradores');
              const first = CREATIVE_TEMPLATES.find((t) => t.audience === 'moradores');
              if (first) applyTemplate(first);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              audienceFilter === 'moradores'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Para Moradores</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAudienceFilter('lojistas');
              const first = CREATIVE_TEMPLATES.find((t) => t.audience === 'lojistas');
              if (first) applyTemplate(first);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              audienceFilter === 'lojistas'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Para Lojistas</span>
          </button>
        </div>
      </div>

      {exportToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportToast(null)}
            className="text-xs underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Template Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredTemplates.map((tpl) => {
          const isSelected = tpl.id === selectedTemplateId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <img
                src={tpl.bgImage}
                alt={tpl.label}
                className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className={tpl.audience === 'lojistas' ? 'text-orange-600' : 'text-blue-600'}>
                    {tpl.audience === 'lojistas' ? 'Lojistas' : 'Moradores'}
                  </span>
                  <span>·</span>
                  <span>{tpl.kicker}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {tpl.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Split: Left Controls + Right Live Canvas & Caption */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls Editor */}
        <div className="lg:col-span-6 space-y-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Formato & Tema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Formato da Arte</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('feed')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    format === 'feed'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Feed 1:1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('stories')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    format === 'stories'
                      ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Stories 9:16</span>
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Palette className="w-3.5 h-3.5 text-orange-600" />
                <span>Paleta Visual</span>
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as CreativeTheme)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="cobalt-orange">Azul Cobalto & Laranja (Padrão)</option>
                <option value="orange-energy">Laranja Energia & Azul Marinho</option>
                <option value="clean-app">Cartão Clean Branco & Foto</option>
              </select>
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>Textos do Criativo</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const current = CREATIVE_TEMPLATES.find((t) => t.id === selectedTemplateId);
                  if (current) applyTemplate(current);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Padrão</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Etiqueta Superior (Kicker)
                </label>
                <input
                  type="text"
                  value={kicker}
                  onChange={(e) => setKicker(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Cidade Principal
                </label>
                <input
                  type="text"
                  value={cityBadge}
                  onChange={(e) => setCityBadge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Título Principal (Chamada)
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Subtítulo Explicativo
              </label>
              <textarea
                rows={2}
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Botão de Ação (CTA)
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Rodapé (@instagram / Site)
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                3 Benefícios em Destaque (separados por vírgula)
              </label>
              <input
                type="text"
                value={highlights.join(', ')}
                onChange={(e) =>
                  setHighlights(
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .slice(0, 3)
                  )
                }
                placeholder="Ex: Busca Rápida, WhatsApp Direto, 100% Gratuito"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Background Selector & Contrast */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Imagem de Fundo da Arte</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold">Contraste:</span>
                <select
                  value={scrim}
                  onChange={(e) => setScrim(e.target.value as ScrimLevel)}
                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="light">Suave</option>
                  <option value="medium">Equilibrado</option>
                  <option value="strong">Intenso</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {GENERATED_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBgImage(bg.url)}
                  className={`relative rounded-xl overflow-hidden border-2 aspect-square cursor-pointer transition ${
                    bgImage === bg.url
                      ? 'border-blue-600 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                  title={bg.label}
                >
                  <img
                    src={bg.url}
                    alt={bg.label}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}

              <button
                type="button"
                onClick={() => customFileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center gap-1 p-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer aspect-square"
                title="Enviar uma foto própria de Alagoinhas ou loja parceira"
              >
                <Upload className="w-4 h-4" />
                <span className="text-center leading-tight">Sua Foto</span>
              </button>
              <input
                ref={customFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomBgUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Ready-to-Post Instagram Caption */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Legenda Pronta para Instagram + Hashtags de Alagoinhas</span>
              </label>

              <button
                type="button"
                onClick={handleCopyCaption}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  copiedCaption
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white'
                }`}
              >
                {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCaption ? 'Copiada!' : 'Copiar Legenda'}</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-none resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Live High-Res Canvas Preview & Download */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Pré-Visualização ({format === 'feed' ? 'Instagram Feed 1080×1080 px' : 'Instagram Stories 1080×1920 px'})
                </span>
                <span className="text-[11px] text-slate-500">
                  Renderizado em resolução nativa para exportação nítida sem perda de qualidade.
                </span>
              </div>

              {format === 'stories' && (
                <button
                  type="button"
                  onClick={() => setShowSafeZones(!showSafeZones)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                    showSafeZones
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Guias Safe-Zone</span>
                </button>
              )}
            </div>

            {/* Canvas Wrapper with Exact Aspect Ratio */}
            <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div
                className={`relative overflow-hidden rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700 transition-all ${
                  format === 'feed'
                    ? 'w-full max-w-[440px] aspect-square'
                    : 'w-full max-w-[290px] aspect-[9/16]'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full block"
                />

                {/* Optional Visual Safe-Zone Overlay for Stories (not exported in PNG) */}
                {format === 'stories' && showSafeZones && (
                  <>
                    <div className="pointer-events-none absolute top-0 inset-x-0 h-[11%] bg-rose-500/15 border-b border-dashed border-rose-400 flex items-end justify-center pb-1">
                      <span className="text-[9px] font-bold text-white bg-rose-600/80 px-1.5 py-0.5 rounded">
                        Área do Perfil Stories
                      </span>
                    </div>
                    <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[12%] bg-rose-500/15 border-t border-dashed border-rose-400 flex items-start justify-center pt-1">
                      <span className="text-[9px] font-bold text-white bg-rose-600/80 px-1.5 py-0.5 rounded">
                        Área de Mensagem / Link Stories
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Download Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadCurrent}
                disabled={isExporting}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>
                  {format === 'feed'
                    ? 'Baixar PNG Feed (1080×1080)'
                    : 'Baixar PNG Stories (1080×1920)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBothFormats}
                disabled={isExporting}
                className="py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Package className="w-4 h-4 shrink-0" />
                <span>Baixar Kit Feed + Stories (2 PNGs)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
