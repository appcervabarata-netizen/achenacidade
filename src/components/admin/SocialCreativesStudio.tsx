import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Gift,
  Crown,
  BadgeCheck,
  Ticket,
  Link2,
  Plus,
  Tag,
} from 'lucide-react';
import { useDirectory } from '../../context/DirectoryContext';
import { formatBRL } from '../../utils/planPricing';

type CreativeCategory = 'moradores' | 'gratuito' | 'vitalicio' | 'convite' | 'lojistas';
type FormatType = 'feed' | 'stories';
type CreativeTheme = 'cobalt-orange' | 'orange-energy' | 'clean-app' | 'founder-gold' | 'invite-vip';
type ScrimLevel = 'light' | 'medium' | 'strong';

interface CreativeTemplate {
  id: string;
  category: CreativeCategory;
  label: string;
  kicker: string;
  cityBadge: string;
  promoTag?: string;
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
    label: 'Compras na Cidade',
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

const CATEGORY_META: Record<
  CreativeCategory,
  {
    title: string;
    shortLabel: string;
    description: string;
    badgeClass: string;
    accentBorder: string;
  }
> = {
  gratuito: {
    title: 'Bloco · Cadastro Gratuito (Atrair Lojistas Sem Barreira)',
    shortLabel: 'Cadastro Gratuito',
    description: 'Artes e legendas focadas em entrada sem custo, zero mensalidade e ativação rápida pelo celular.',
    badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60',
    accentBorder: 'border-emerald-200 dark:border-emerald-900/60',
  },
  vitalicio: {
    title: 'Bloco · Cadastro Vitalício — Sócio Fundador',
    shortLabel: 'Vitalício (Sócio Fundador)',
    description: 'Focado no pagamento único de Sócio Fundador com 150 produtos/serviços, selo exclusivo e acesso perpétuo.',
    badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60',
    accentBorder: 'border-amber-200 dark:border-amber-900/60',
  },
  convite: {
    title: 'Bloco · Divulgação de Convite VIP (6 Meses Grátis)',
    shortLabel: 'Divulgar Convite',
    description: 'Artes para divulgar seu código ou link exclusivo (?convite=CODIGO) de 6 meses grátis no Plano Premium.',
    badgeClass: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60',
    accentBorder: 'border-indigo-200 dark:border-indigo-900/60',
  },
  moradores: {
    title: 'Bloco · Lançamento & Moradores',
    shortLabel: 'Para Moradores',
    description: 'Comunicação voltada para consumidores encontrarem lojas, ofertas e WhatsApp direto na cidade.',
    badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60',
    accentBorder: 'border-blue-200 dark:border-blue-900/60',
  },
  lojistas: {
    title: 'Bloco · Visibilidade & Planos Gerais',
    shortLabel: 'Planos Gerais',
    description: 'Mensagens comerciais amplas sobre vitrine digital 24h e presença em todos os bairros.',
    badgeClass: 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60',
    accentBorder: 'border-orange-200 dark:border-orange-900/60',
  },
};

function buildBaseTemplates(params: {
  cityName: string;
  founderPriceLabel: string;
  founderLimit: number;
  freeLimit: number;
  inviteSampleCode: string;
  siteHost: string;
}): CreativeTemplate[] {
  const { cityName, founderPriceLabel, founderLimit, freeLimit, inviteSampleCode, siteHost } = params;

  return [
    // =====================================================
    // BLOCO 1: CADASTRO GRATUITO
    // =====================================================
    {
      id: 'gratuito-zero-mensalidade',
      category: 'gratuito',
      label: 'G1. Cadastro 100% Gratuito (Sem Cartão)',
      kicker: 'CADASTRO GRATUITO',
      cityBadge: cityName,
      promoTag: 'R$ 0,00 · GRÁTIS PARA SEMPRE',
      headline: `Cadastre sua Loja Grátis em ${cityName.split(' - ')[0]}!`,
      subheadline:
        `Entre no guia comercial sem pagar mensalidade, sem cartão de crédito e comece a receber clientes hoje.`,
      highlights: ['R$ 0/mês', 'WhatsApp Direto', `Até ${freeLimit} Itens`],
      ctaText: 'Cadastrar Minha Loja Grátis',
      footerText: `@achenacidade · ${siteHost}`,
      bgImage: GENERATED_BACKGROUNDS[1].url,
      theme: 'cobalt-orange',
      scrim: 'medium',
      caption: `🆓 LOJISTA E AUTÔNOMO DE ${cityName.toUpperCase()}: CADASTRO 100% GRATUITO!\n\nSua empresa ainda não aparece quando o cliente pesquisa no celular? Coloque sua loja no Achenacidade sem gastar nada:\n\n✅ R$ 0,00 de mensalidade (sem precisar cadastrar cartão)\n✅ Botão direto para o seu WhatsApp\n✅ Endereço, horário de funcionamento e perfil da loja\n✅ Até ${freeLimit} produtos ou serviços cadastrados\n\n👉 Clique no link da bio e faça seu cadastro gratuito em 2 minutos!\n\n#CadastroGratuito #Empreendedores #GuiaComercial #Achenacidade #ComercioLocal`,
    },
    {
      id: 'gratuito-vitrine-busca',
      category: 'gratuito',
      label: 'G2. Apareça nas Buscas Sem Pagar Nada',
      kicker: 'ZERO MENSALIDADE',
      cityBadge: cityName,
      promoTag: 'SEM TAXAS · SEM COMISSÃO DE VENDA',
      headline: 'Sua Empresa Encontrada Todos os Dias Sem Custo Fixo',
      subheadline:
        'Quem mora na cidade pesquisa aqui antes de comprar. Garanta o perfil gratuito da sua loja em menos de 3 minutos.',
      highlights: ['Sem Fidelidade', 'Perfil Completo', 'Ativação Imediata'],
      ctaText: 'Criar Perfil Gratuito Agora',
      footerText: `@achenacidade · ${siteHost}`,
      bgImage: GENERATED_BACKGROUNDS[2].url,
      theme: 'clean-app',
      scrim: 'light',
      caption: `📲 Clientes estão procurando pelo que você vende agora mesmo!\n\nNo Achenacidade, você cria o perfil da sua empresa gratuitamente e é encontrado por bairro, categoria, produto ou serviço.\n\n💚 Zero mensalidade no Plano Gratuito\n💚 Zero comissão sobre suas vendas\n💚 Atendimento direto do cliente para o seu WhatsApp\n\n🔗 Acesse o link na bio e ative seu perfil grátis hoje!\n\n#ComercioForte #DivulgueGratis #NegociosLocais #Achenacidade`,
    },
    {
      id: 'gratuito-autonomos-servicos',
      category: 'gratuito',
      label: 'G3. Para Serviços & Pequenos Negócios',
      kicker: 'PARA LOJAS E SERVIÇOS',
      cityBadge: cityName,
      promoTag: 'PLANO GRÁTIS LIBERADO',
      headline: 'Trabalha por Conta Própria ou Tem Loja Física?',
      subheadline:
        'Divulgue seu serviço ou comércio no plano gratuito do guia oficial da cidade e receba contatos diretos.',
      highlights: ['Cadastro Rápido', 'Link na Bio', 'Grátis de Verdade'],
      ctaText: 'Começar Grátis Hoje',
      footerText: `@achenacidade · ${siteHost}`,
      bgImage: GENERATED_BACKGROUNDS[1].url,
      theme: 'orange-energy',
      scrim: 'medium',
      caption: `⚡ Prestadores de serviço, autônomos e lojistas!\n\nNão deixe seu negócio invisível no digital. Faça seu cadastro gratuito no Achenacidade e tenha um cartão digital completo com WhatsApp, Instagram e localização.\n\n✔️ Ideal para quem está começando\n✔️ Sem boleto, sem taxa escondida\n\n👉 Cadastre-se grátis pelo link da bio!\n\n#PrestadoresDeServico #Autonomos #Lojistas #Achenacidade`,
    },

    // =====================================================
    // BLOCO 2: CADASTRO VITALÍCIO (SÓCIO FUNDADOR)
    // =====================================================
    {
      id: 'vitalicio-socio-fundador',
      category: 'vitalicio',
      label: 'V1. Plano Vitalício Sócio Fundador',
      kicker: 'ACESSO VITALÍCIO',
      cityBadge: cityName,
      promoTag: `PAGAMENTO ÚNICO · ${founderPriceLabel}`,
      headline: 'Seja Sócio Fundador: Pague 1 Vez e Nunca Mais Pague Mensalidade!',
      subheadline:
        `Garanta ${founderLimit} produtos/serviços, todos os destaques VIP e Selo Exclusivo de Sócio Fundador para sempre.`,
      highlights: [`${founderLimit} Itens VIP`, 'Selo Fundador', 'Vitalício Real'],
      ctaText: 'Garantir Vaga de Sócio Fundador',
      footerText: `@achenacidade · ${siteHost}/socio-fundador`,
      bgImage: GENERATED_BACKGROUNDS[1].url,
      theme: 'founder-gold',
      scrim: 'medium',
      caption: `👑 OPORTUNIDADE ÚNICA: PLANO VITALÍCIO SÓCIO FUNDADOR!\n\nCansado de pagar mensalidades todo mês para divulgar sua loja? Torne-se Sócio Fundador do Achenacidade!\n\n💰 Investimento único de ${founderPriceLabel} (nunca mais paga mensalidade!)\n📦 Até ${founderLimit} produtos ou serviços na vitrine\n👑 Selo exclusivo de Sócio Fundador VIP\n⭐ Todos os destaques VIP do Plano Premium + Banners Rotativos\n\n⚠️ Vagas limitadas para lojistas fundadores da cidade!\n👉 Saiba tudo e garanta a sua em: ${siteHost}/socio-fundador\n\n#SocioFundador #PlanoVitalicio #Empresarios #Achenacidade #Oportunidade`,
    },
    {
      id: 'vitalicio-economia-anual',
      category: 'vitalicio',
      label: 'V2. Adeus Mensalidade (150 Itens + VIP)',
      kicker: 'SÓCIO FUNDADOR VIP',
      cityBadge: cityName,
      promoTag: `VITALÍCIO · ${founderLimit} PRODUTOS E SERVIÇOS`,
      headline: `Vitrine VIP Completa Para Sempre por Apenas ${founderPriceLabel}`,
      subheadline:
        'Enquanto outros planos cobram todo mês, como Sócio Fundador sua loja fica no topo das buscas vitaliciamente.',
      highlights: ['Zero Mensalidade', 'Banners Rotativos', 'Topo das Buscas'],
      ctaText: 'Quero Meu Plano Vitalício',
      footerText: `@achenacidade · ${siteHost}/socio-fundador`,
      bgImage: GENERATED_BACKGROUNDS[2].url,
      theme: 'founder-gold',
      scrim: 'strong',
      caption: `💎 FAÇA AS CONTAS: PAGUE UMA ÚNICA VEZ E TENHA VIP PARA SEMPRE!\n\nCom o Plano Sócio Fundador do Achenacidade (${founderPriceLabel} pagamento único), você garante:\n\n🏆 Posição de destaque VIP nas pesquisas\n📸 Catálogo gigante para até ${founderLimit} produtos/serviços\n🎨 Cadastro de banners rotativos exclusivos no painel\n🛡️ Selo dourado exclusivo de Sócio Fundador\n\n🔗 Garanta seu acesso vitalício antes que o lote feche: ${siteHost}/socio-fundador\n\n#Vitalicio #SocioFundador #MarketingLocal #Achenacidade`,
    },
    {
      id: 'vitalicio-lote-limitado',
      category: 'vitalicio',
      label: 'V3. Chamada Urgência Lote Fundador',
      kicker: 'ÚLTIMAS VAGAS',
      cityBadge: cityName,
      promoTag: `ÚLTIMAS VAGAS · ${founderPriceLabel} ÚNICO`,
      headline: 'Coloque Sua Marca Entre os Sócios Fundadores da Cidade',
      subheadline:
        'Acesso vitalício sem renovação, limite ampliado para 150 ofertas e selo de autoridade no maior guia local.',
      highlights: ['Pago 1 Vez Só', 'Selo Exclusivo', 'PIX ou Cartão'],
      ctaText: 'Virar Sócio Fundador Agora',
      footerText: `@achenacidade · ${siteHost}/socio-fundador`,
      bgImage: GENERATED_BACKGROUNDS[0].url,
      theme: 'clean-app',
      scrim: 'light',
      caption: `🔥 ÚLTIMAS VAGAS PARA SÓCIO FUNDADOR DO ACHENACIDADE!\n\nEssa é a chance de travar para sempre os melhores benefícios VIP para sua empresa por um pagamento único de ${founderPriceLabel}.\n\n✅ Sem mensalidade nunca mais\n✅ Até ${founderLimit} produtos/serviços\n✅ Parcelamento no cartão ou à vista no PIX\n\n👉 Garanta agora pelo link: ${siteHost}/socio-fundador\n\n#SocioFundador #Achenacidade #ComercioLocal #Empreendedorismo`,
    },

    // =====================================================
    // BLOCO 3: CADASTRO VIA CONVITE (6 MESES PREMIUM GRÁTIS)
    // =====================================================
    {
      id: 'convite-premium-6-meses',
      category: 'convite',
      label: 'C1. Convite VIP: 6 Meses de Premium Grátis',
      kicker: 'CONVITE EXCLUSIVO',
      cityBadge: cityName,
      promoTag: `CÓDIGO: ${inviteSampleCode}`,
      headline: 'Você Ganhou 6 Meses Grátis do Plano Premium!',
      subheadline:
        'Use o convite exclusivo do administrador para liberar destaque VIP, vitrine completa e banners rotativos sem pagar nada.',
      highlights: ['6 Meses Grátis', 'Destaque Premium', 'Sem Compromisso'],
      ctaText: 'Ativar Meu Convite de 6 Meses',
      footerText: `@achenacidade · ${siteHost}/?convite=${inviteSampleCode}`,
      bgImage: GENERATED_BACKGROUNDS[1].url,
      theme: 'invite-vip',
      scrim: 'medium',
      caption: `🎁 CONVITE VIP PARA SUA LOJA: 6 MESES DE PLANO PREMIUM 100% GRÁTIS!\n\nEstou liberando um convite especial para lojistas testarem todo o poder do Plano Premium no Achenacidade durante 6 meses sem pagar nada!\n\n✨ O que você ganha por 6 meses:\n✅ Destaque VIP no topo das buscas\n✅ Vitrine completa de produtos e serviços\n✅ Banners rotativos + Selo Verificado\n✅ Depois dos 6 meses, você escolhe o plano ideal ou cancela sem multa!\n\n🎟️ Código do Convite: ${inviteSampleCode}\n🔗 Clique e ative direto: https://${siteHost}/?convite=${inviteSampleCode}\n\n#ConviteVIP #6MesesGratis #Lojistas #Achenacidade #PlanoPremium`,
    },
    {
      id: 'convite-vip-cupom',
      category: 'convite',
      label: 'C2. Cupom Para Compartilhar no WhatsApp & Stories',
      kicker: 'PASSE LIVRE VIP',
      cityBadge: cityName,
      promoTag: `USE O CONVITE: ${inviteSampleCode}`,
      headline: 'Convite Liberado: 180 Dias de Loja Destaque Sem Pagar Nada!',
      subheadline:
        'Ative sua loja hoje com nosso link de convite. Ao final dos 6 meses você decide livremente se quer continuar.',
      highlights: ['Link Exclusivo', 'Banners Inclusos', 'Você Decide Depois'],
      ctaText: 'Resgatar Convite VIP Agora',
      footerText: `@achenacidade · ${siteHost}/?convite=${inviteSampleCode}`,
      bgImage: GENERATED_BACKGROUNDS[2].url,
      theme: 'invite-vip',
      scrim: 'strong',
      caption: `🎟️ VOCÊ RECEBEU UM PASSE LIVRE DE 6 MESES NO ACHENACIDADE!\n\nQuer ver sua loja aparecendo em destaque para toda a cidade sem investir nada agora?\n\nUse o meu convite exclusivo e ganhe 6 MESES DO PLANO PREMIUM GRÁTIS!\n\n🔑 Código: ${inviteSampleCode}\n👉 Acesse direto pelo link do convite: https://${siteHost}/?convite=${inviteSampleCode}\n\n#ParceriaLocal #ConviteExclusivo #Achenacidade #MarketingDigital`,
    },
    {
      id: 'convite-clean-card',
      category: 'convite',
      label: 'C3. Convite Clean Card (Alta Legibilidade)',
      kicker: 'CONVITE DE PARCEIRO',
      cityBadge: cityName,
      promoTag: `CONVITE ATIVO · ${inviteSampleCode}`,
      headline: 'Experimente o Plano Premium por 6 Meses Grátis via Convite',
      subheadline:
        'Acesso reservado apenas por código ou link enviado pela administração. Vagas limitadas de convite.',
      highlights: ['Só Via Convite', 'Acesso Imediato', '6 Meses R$ 0'],
      ctaText: 'Usar Código de Convite',
      footerText: `@achenacidade · ${siteHost}/?convite=${inviteSampleCode}`,
      bgImage: GENERATED_BACKGROUNDS[0].url,
      theme: 'clean-app',
      scrim: 'light',
      caption: `📩 CONVITE ESPECIAL PARA EMPREENDEDORES!\n\nO acesso ao plano de 6 meses grátis do Premium é exclusivo apenas para quem recebe este link ou código.\n\nAproveite para cadastrar sua loja, seus produtos e seus banners rotativos gratuitamente por meio ano!\n\n🎟️ Código: ${inviteSampleCode}\n🔗 Link direto: https://${siteHost}/?convite=${inviteSampleCode}\n\n#ConviteAchenacidade #Empresarios #ComercioLocal #Achenacidade`,
    },

    // =====================================================
    // BLOCO 4: MORADORES & LANÇAMENTO
    // =====================================================
    {
      id: 'lancamento-moradores',
      category: 'moradores',
      label: 'M1. Lançamento Oficial (Geral)',
      kicker: 'LANÇAMENTO OFICIAL',
      cityBadge: cityName,
      headline: `Chegou o Achenacidade em ${cityName.split(' - ')[0]}!`,
      subheadline:
        'Encontre lojas, serviços, gastronomia e ofertas da nossa cidade direto na palma da mão.',
      highlights: ['Busca Rápida', 'WhatsApp Direto', '100% Gratuito'],
      ctaText: 'Acesse o Guia Agora',
      footerText: `@achenacidade · ${siteHost}`,
      bgImage: GENERATED_BACKGROUNDS[0].url,
      theme: 'cobalt-orange',
      scrim: 'medium',
      caption: `🚀 CHEGOU EM ${cityName.toUpperCase()}!\n\nO Achenacidade acaba de chegar para conectar você às melhores lojas, restaurantes, serviços e ofertas da cidade em segundos!\n\n✅ Pesquise empresas ou produtos\n✅ Fale direto no WhatsApp da loja\n✅ Apoie o comércio da nossa cidade\n\n👉 Acesse agora mesmo pelo link na bio!\n\n#Achenacidade #ComercioLocal #GuiaComercial`,
    },
    {
      id: 'whatsapp-moradores',
      category: 'moradores',
      label: 'M2. Achou, Chamou no WhatsApp',
      kicker: 'PRATICIDADE NO DIA A DIA',
      cityBadge: cityName,
      headline: 'Achou, chamou no WhatsApp!',
      subheadline:
        'Precisa de algo hoje na cidade? Compare produtos locais e converse sem intermediários.',
      highlights: ['Sem Taxas', 'Lojas Verificadas', 'Bairros Locais'],
      ctaText: 'Pesquisar Lojas & Produtos',
      footerText: `@achenacidade · ${siteHost}`,
      bgImage: GENERATED_BACKGROUNDS[2].url,
      theme: 'orange-energy',
      scrim: 'medium',
      caption: `📱 Precisou de algum produto ou serviço na cidade?\n\nNo Achenacidade você encontra em segundos, vê os detalhes e chama direto no WhatsApp do lojista — sem complicação e sem intermediários!\n\n👉 Clique no link da bio e experimente!\n\n#ComprasLocais #Achenacidade #DeliveryLocal`,
    },
    {
      id: 'ofertas-moradores',
      category: 'moradores',
      label: 'M3. Vitrine de Ofertas Locais',
      kicker: 'COMÉRCIO FORTE',
      cityBadge: cityName,
      headline: 'As Melhores Ofertas da Cidade Estão Aqui',
      subheadline:
        'Gastronomia, moda, tecnologia, saúde e serviços com atendimento rápido perto de você.',
      highlights: ['Ofertas Reais', 'Favoritos', 'Perto de Você'],
      ctaText: 'Descobrir Lojas Locais',
      footerText: `@achenacidade · ${siteHost}`,
      bgImage: GENERATED_BACKGROUNDS[0].url,
      theme: 'clean-app',
      scrim: 'light',
      caption: `🛍️ Valorize o comércio da nossa terra!\n\nNo Achenacidade você descobre lojas incríveis com preços transparentes, horários de funcionamento e contato imediato.\n\n🔗 Acesse pelo link na bio.\n\n#CompreLocal #ComercioLocal #Achenacidade`,
    },

    // =====================================================
    // BLOCO 5: PLANOS & VISIBILIDADE GERAL PARA LOJISTAS
    // =====================================================
    {
      id: 'lojista-venda-mais',
      category: 'lojistas',
      label: 'L1. Planos & Vitrine de Produtos',
      kicker: 'VENDA TODOS OS DIAS',
      cityBadge: cityName,
      headline: 'Sua Vitrine Aberta 24h na Cidade',
      subheadline:
        'Divulgue produtos com foto e preço, ganhe selo verificado e destaque no topo das buscas.',
      highlights: ['Selo Verificado', 'Catálogo Online', 'Pedidos no Whats'],
      ctaText: 'Conhecer Planos para Lojas',
      footerText: `@achenacidade · ${siteHost}`,
      bgImage: GENERATED_BACKGROUNDS[2].url,
      theme: 'orange-energy',
      scrim: 'medium',
      caption: `📈 Quer aumentar suas vendas sem depender só do boca a boca?\n\nCom os planos do Achenacidade você monta sua vitrine digital em minutos:\n✔️ Fotos e preços dos seus produtos\n✔️ Selo de Empresa Verificada\n✔️ Destaque prioritário nas buscas\n✔️ Pagamento facilitado via PIX ou Cartão\n\n🚀 Clique no link da bio e destaque seu negócio hoje mesmo!\n\n#VendasOnline #ComercioLocal #Achenacidade`,
    },
    {
      id: 'lojista-bairros',
      category: 'lojistas',
      label: 'L2. Alcance em Todos os Bairros',
      kicker: 'VISIBILIDADE REGIONAL',
      cityBadge: cityName,
      headline: 'Do Centro aos Bairros: Seja Encontrado!',
      subheadline:
        'Conecte sua marca a milhares de moradores que buscam produtos e serviços todos os dias.',
      highlights: ['Centro & Bairros', 'Fácil de Usar', 'Suporte Local'],
      ctaText: 'Anunciar Minha Empresa',
      footerText: `@achenacidade · ${siteHost}`,
      bgImage: GENERATED_BACKGROUNDS[1].url,
      theme: 'clean-app',
      scrim: 'medium',
      caption: `📍 Não importa o bairro onde sua loja fica: no Achenacidade os moradores encontram você com 1 toque!\n\n📲 Comece no plano gratuito, ative um convite VIP ou garanta sua vaga de Sócio Fundador.\n🔗 Link na bio!\n\n#Empresarios #DivulgueSuaMarca #Achenacidade`,
    },
  ];
}

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
  const { plans, planInvites, createPlanInvite, selectedCity } = useDirectory();

  const cityName = useMemo(
    () => (selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : 'Alagoinhas - BA'),
    [selectedCity]
  );

  const siteHost = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.host && !window.location.hostname.includes('localhost')) {
      return window.location.host;
    }
    return 'achenacidade.com.br';
  }, []);

  const siteOrigin = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://achenacidade.com.br';
  }, []);

  const founderPlan = useMemo(
    () => plans.find((p) => p.id === 'plan-founder' || p.vipTier === 'founder'),
    [plans]
  );
  const freePlan = useMemo(
    () => plans.find((p) => p.id === 'plan-free' || p.priceMonthly === 0),
    [plans]
  );

  const activeInvites = useMemo(
    () =>
      planInvites.filter((inv) => {
        if (inv.status !== 'active') return false;
        if (inv.expiresAt && new Date(`${inv.expiresAt}T23:59:59`).getTime() < Date.now()) {
          return false;
        }
        return inv.usedCount < inv.maxUses;
      }),
    [planInvites]
  );

  const founderPriceLabel = formatBRL(Number(founderPlan?.priceOnce ?? 500));
  const founderLimit = Number(founderPlan?.productLimit ?? 150);
  const freeLimit = Number(freePlan?.productLimit ?? 5);
  const firstActiveInviteCode = activeInvites[0]?.code || 'VIP6M-EXEMPLO';

  const templates = useMemo(
    () =>
      buildBaseTemplates({
        cityName,
        founderPriceLabel,
        founderLimit,
        freeLimit,
        inviteSampleCode: firstActiveInviteCode,
        siteHost,
      }),
    [cityName, founderPriceLabel, founderLimit, freeLimit, firstActiveInviteCode, siteHost]
  );

  const [categoryFilter, setCategoryFilter] = useState<'all' | CreativeCategory>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('gratuito-zero-mensalidade');
  const [format, setFormat] = useState<FormatType>('feed');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);

  // Editable creative state
  const initialTpl = templates[0];
  const [kicker, setKicker] = useState(initialTpl.kicker);
  const [cityBadge, setCityBadge] = useState(initialTpl.cityBadge);
  const [promoTag, setPromoTag] = useState(initialTpl.promoTag || '');
  const [headline, setHeadline] = useState(initialTpl.headline);
  const [subheadline, setSubheadline] = useState(initialTpl.subheadline);
  const [highlights, setHighlights] = useState<string[]>(initialTpl.highlights);
  const [ctaText, setCtaText] = useState(initialTpl.ctaText);
  const [footerText, setFooterText] = useState(initialTpl.footerText);
  const [bgImage, setBgImage] = useState(initialTpl.bgImage);
  const [theme, setTheme] = useState<CreativeTheme>(initialTpl.theme);
  const [scrim, setScrim] = useState<ScrimLevel>(initialTpl.scrim);
  const [caption, setCaption] = useState(initialTpl.caption);

  // Invite promotion helper state
  const [selectedInviteCode, setSelectedInviteCode] = useState<string>(firstActiveInviteCode);
  const [isCreatingQuickInvite, setIsCreatingQuickInvite] = useState(false);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || templates[0],
    [templates, selectedTemplateId]
  );

  const applyTemplate = useCallback((tpl: CreativeTemplate) => {
    setSelectedTemplateId(tpl.id);
    setKicker(tpl.kicker);
    setCityBadge(tpl.cityBadge);
    setPromoTag(tpl.promoTag || '');
    setHeadline(tpl.headline);
    setSubheadline(tpl.subheadline);
    setHighlights(tpl.highlights);
    setCtaText(tpl.ctaText);
    setFooterText(tpl.footerText);
    setBgImage(tpl.bgImage);
    setTheme(tpl.theme);
    setScrim(tpl.scrim);
    setCaption(tpl.caption);
  }, []);

  // Inject chosen/generated invite code across promoTag, footerText and caption cleanly
  const applyInviteCodeToCreative = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim().toUpperCase() || 'VIP6M-EXEMPLO';
      setSelectedInviteCode(code);
      const inviteUrl = `${siteOrigin}/?convite=${encodeURIComponent(code)}`;

      setPromoTag((prev) => {
        if (/código|convite/i.test(prev) || !prev.trim()) {
          return `CONVITE VIP: ${code}`;
        }
        return `CONVITE: ${code}`;
      });
      setFooterText(`@achenacidade · ${siteHost}/?convite=${code}`);
      setCaption((prev) => {
        let updated = prev;
        if (updated.includes(selectedInviteCode)) {
          updated = updated.split(selectedInviteCode).join(code);
        } else if (updated.includes('VIP6M-EXEMPLO')) {
          updated = updated.split('VIP6M-EXEMPLO').join(code);
        } else {
          updated = `${updated}\n\n🎟️ Código do Convite: ${code}\n🔗 Link direto: ${inviteUrl}`;
        }
        return updated;
      });
    },
    [selectedInviteCode, siteHost, siteOrigin]
  );

  const handleQuickCreateInvite = async () => {
    setIsCreatingQuickInvite(true);
    const res = await createPlanInvite({
      planId: 'plan-invite-premium-6m',
      maxUses: 10,
      recipientHint: 'Divulgação Redes Sociais (Criativos)',
    });
    setIsCreatingQuickInvite(false);
    if (res.success && res.invite) {
      applyInviteCodeToCreative(res.invite.code);
      setExportToast(`Novo convite VIP "${res.invite.code}" criado e aplicado no criativo!`);
      setTimeout(() => setExportToast(null), 4000);
    } else {
      setExportToast(res.error || 'Não foi possível criar um novo código agora.');
      setTimeout(() => setExportToast(null), 4000);
    }
  };

  const handleCopyQuickLink = (key: string, url: string, msg: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkKey(key);
    setExportToast(msg);
    setTimeout(() => {
      setCopiedLinkKey((prev) => (prev === key ? null : prev));
    }, 2200);
    setTimeout(() => setExportToast(null), 3500);
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
      const isCleanApp = theme === 'clean-app';
      const hasPromoTag = Boolean(promoTag.trim());
      const cleanCardY = isStories ? H * 0.44 : H * 0.41;

      if (theme === 'cobalt-orange') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, `rgba(15, 23, 42, ${Math.min(0.95, 0.78 * scrimMult)})`);
        grad.addColorStop(0.38, `rgba(29, 78, 216, ${Math.min(0.8, 0.35 * scrimMult)})`);
        grad.addColorStop(0.72, `rgba(15, 23, 42, ${Math.min(0.96, 0.85 * scrimMult)})`);
        grad.addColorStop(1, `rgba(15, 23, 42, 0.97)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

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

        const glow = ctx.createRadialGradient(W * 0.15, H * 0.18, 30, W * 0.15, H * 0.18, 500);
        glow.addColorStop(0, 'rgba(29, 78, 216, 0.35)');
        glow.addColorStop(1, 'rgba(29, 78, 216, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      } else if (theme === 'founder-gold') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, `rgba(9, 14, 28, ${Math.min(0.96, 0.84 * scrimMult)})`);
        grad.addColorStop(0.42, `rgba(30, 41, 59, ${Math.min(0.88, 0.54 * scrimMult)})`);
        grad.addColorStop(0.76, `rgba(15, 23, 42, ${Math.min(0.98, 0.92 * scrimMult)})`);
        grad.addColorStop(1, `rgba(9, 14, 28, 0.99)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const goldGlow = ctx.createRadialGradient(W * 0.82, H * 0.22, 30, W * 0.82, H * 0.22, 620);
        goldGlow.addColorStop(0, 'rgba(245, 158, 11, 0.36)');
        goldGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = goldGlow;
        ctx.fillRect(0, 0, W, H);
      } else if (theme === 'invite-vip') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, `rgba(30, 27, 75, ${Math.min(0.96, 0.84 * scrimMult)})`);
        grad.addColorStop(0.4, `rgba(67, 56, 202, ${Math.min(0.85, 0.45 * scrimMult)})`);
        grad.addColorStop(0.74, `rgba(15, 23, 42, ${Math.min(0.97, 0.91 * scrimMult)})`);
        grad.addColorStop(1, `rgba(15, 23, 42, 0.99)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const emeraldGlow = ctx.createRadialGradient(W * 0.84, H * 0.82, 40, W * 0.84, H * 0.82, 560);
        emeraldGlow.addColorStop(0, 'rgba(16, 185, 129, 0.32)');
        emeraldGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = emeraldGlow;
        ctx.fillRect(0, 0, W, H);
      } else {
        // 'clean-app' theme
        const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
        topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.84)');
        topGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.28)');
        topGrad.addColorStop(1, 'rgba(15, 23, 42, 0.86)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, W, H);

        const cardH = H - cleanCardY;
        ctx.save();
        drawRoundedRect(ctx, 44, cleanCardY, W - 88, cardH - (isStories ? 220 : 40), 48);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
        ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
        ctx.shadowBlur = 45;
        ctx.fill();
        ctx.restore();
      }

      // 4. Outer Brand Accent Top Strip
      const stripGrad = ctx.createLinearGradient(0, 0, W, 0);
      if (theme === 'founder-gold') {
        stripGrad.addColorStop(0, '#D97706');
        stripGrad.addColorStop(0.5, '#FBBF24');
        stripGrad.addColorStop(1, '#EA580C');
      } else if (theme === 'invite-vip') {
        stripGrad.addColorStop(0, '#4F46E5');
        stripGrad.addColorStop(0.5, '#10B981');
        stripGrad.addColorStop(1, '#6366F1');
      } else {
        stripGrad.addColorStop(0, '#1D4ED8');
        stripGrad.addColorStop(0.5, '#EA580C');
        stripGrad.addColorStop(1, '#F97316');
      }
      ctx.fillStyle = stripGrad;
      ctx.fillRect(0, 0, W, 12);

      // Safe coordinates
      const padX = 72;
      const topSafeY = isStories ? 235 : 68;
      const bottomSafeY = isStories ? H - 250 : H - 62;

      // 5. TOP BRAND HEADER LOCKUP
      const logoSize = isStories ? 94 : 82;
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

      const wordX = padX + logoSize + 24;
      const wordY = topSafeY + (isStories ? 42 : 36);
      ctx.font = '800 42px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      const achenaWidth = ctx.measureText('achena').width;
      ctx.fillText('achena', wordX, wordY);
      ctx.fillStyle =
        theme === 'orange-energy'
          ? '#FDE047'
          : theme === 'founder-gold'
          ? '#FBBF24'
          : theme === 'invite-vip'
          ? '#34D399'
          : '#F97316';
      ctx.fillText('cidade', wordX + achenaWidth, wordY);

      ctx.font = '700 23px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(`📍 ${cityBadge}`, wordX, wordY + 36);

      // Top-right Kicker pill
      if (kicker.trim()) {
        ctx.font = '800 21px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
        const kickerUpper = kicker.trim().toUpperCase();
        const kMetrics = ctx.measureText(kickerUpper);
        const kPadX = 24;
        const kW = kMetrics.width + kPadX * 2;
        const kH = 46;
        const kX = W - padX - kW;
        const kY = topSafeY + (logoSize - kH) / 2;

        if (kX > wordX + 250) {
          ctx.save();
          drawRoundedRect(ctx, kX, kY, kW, kH, 23);
          ctx.fillStyle =
            theme === 'orange-energy'
              ? '#0F172A'
              : theme === 'founder-gold'
              ? '#D97706'
              : theme === 'invite-vip'
              ? '#059669'
              : '#EA580C';
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
      const contentPadX = isCleanApp ? 84 : padX;
      const maxTextWidth = W - contentPadX * 2;

      let cursorY = isCleanApp
        ? cleanCardY + (isStories ? 56 : 36)
        : hasPromoTag
        ? isStories
          ? H * 0.41
          : H * 0.285
        : isStories
        ? H * 0.48
        : H * 0.36;

      // Floating Promo / Invite Code / Price Ticket Badge
      if (hasPromoTag) {
        const promoText = promoTag.trim().toUpperCase();
        ctx.font = `800 ${isStories ? 25 : 22}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
        const pMetrics = ctx.measureText(promoText);
        const pW = Math.min(maxTextWidth, pMetrics.width + 52);
        const pH = isStories ? 58 : 48;
        const pX = contentPadX;
        const pY = isCleanApp ? cleanCardY - pH / 2 - 4 : cursorY;

        ctx.save();
        drawRoundedRect(ctx, pX, pY, pW, pH, 16);
        if (theme === 'founder-gold') {
          ctx.fillStyle = '#FEF3C7';
          ctx.strokeStyle = '#F59E0B';
        } else if (theme === 'invite-vip') {
          ctx.fillStyle = '#ECFDF5';
          ctx.strokeStyle = '#10B981';
        } else if (isCleanApp) {
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#F97316';
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = '#38BDF8';
        }
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle =
          theme === 'founder-gold'
            ? '#92400E'
            : theme === 'invite-vip'
            ? '#065F46'
            : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(promoText, pX + pW / 2, pY + pH / 2 + 1, pW - 24);
        ctx.restore();
        ctx.textAlign = 'left';

        if (!isCleanApp) {
          cursorY += pH + (isStories ? 26 : 18);
        } else {
          cursorY += 10;
        }
      }

      if (isCleanApp && kicker.trim()) {
        ctx.font = '800 21px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#EA580C';
        ctx.textBaseline = 'top';
        ctx.fillText(kicker.trim().toUpperCase(), contentPadX, cursorY);
        cursorY += isStories ? 38 : 32;
      }

      // Headline (auto-scale slightly if long so it never collides with CTA)
      let headlineSize = isCleanApp ? (isStories ? 64 : 52) : isStories ? 72 : 58;
      ctx.font = `800 ${headlineSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      let headlineLines = wrapLines(ctx, headline, maxTextWidth);
      if (headlineLines.length > 3) {
        headlineSize = isCleanApp ? (isStories ? 56 : 46) : isStories ? 62 : 52;
        ctx.font = `800 ${headlineSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
        headlineLines = wrapLines(ctx, headline, maxTextWidth);
      }
      const lineH = headlineSize * 1.13;

      ctx.save();
      ctx.fillStyle = isCleanApp ? '#0F172A' : '#FFFFFF';
      if (!isCleanApp) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 4;
      }
      ctx.textBaseline = 'top';
      headlineLines.slice(0, 3).forEach((line, idx) => {
        ctx.fillText(line, contentPadX, cursorY + idx * lineH);
      });
      ctx.restore();

      cursorY += Math.min(headlineLines.length, 3) * lineH + (isStories ? 24 : 16);

      // Subheadline
      const subSize = isCleanApp ? (isStories ? 31 : 25) : isStories ? 33 : 27;
      ctx.font = `500 ${subSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const subLines = wrapLines(ctx, subheadline, maxTextWidth);
      const subLineH = subSize * 1.34;

      ctx.save();
      ctx.fillStyle = isCleanApp ? '#334155' : '#E2E8F0';
      if (!isCleanApp) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 12;
      }
      ctx.textBaseline = 'top';
      const maxSubLines = isCleanApp && !isStories ? 2 : 3;
      subLines.slice(0, maxSubLines).forEach((line, idx) => {
        ctx.fillText(line, contentPadX, cursorY + idx * subLineH);
      });
      ctx.restore();

      cursorY += Math.min(subLines.length, maxSubLines) * subLineH + (isStories ? 36 : 22);

      // 7. HIGHLIGHTS ROW
      const validHighlights = highlights.filter((h) => h.trim());
      if (validHighlights.length > 0) {
        ctx.font = `700 ${isStories ? 24 : 21}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
        let chipX = contentPadX;
        const chipH = isStories ? 50 : 42;

        validHighlights.slice(0, 3).forEach((item) => {
          const text = `✓ ${item.trim()}`;
          const textW = ctx.measureText(text).width;
          const chipW = textW + 30;

          if (chipX + chipW <= W - contentPadX + 20) {
            ctx.save();
            drawRoundedRect(ctx, chipX, cursorY, chipW, chipH, 13);
            if (isCleanApp) {
              ctx.fillStyle = '#EFF6FF';
              ctx.strokeStyle = '#BFDBFE';
              ctx.lineWidth = 2;
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#1D4ED8';
            } else if (theme === 'founder-gold') {
              ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
              ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
              ctx.lineWidth = 2;
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#FEF3C7';
            } else if (theme === 'invite-vip') {
              ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
              ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
              ctx.lineWidth = 2;
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#ECFDF5';
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
              ctx.lineWidth = 2;
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#FFFFFF';
            }
            ctx.textBaseline = 'middle';
            ctx.fillText(text, chipX + 15, cursorY + chipH / 2 + 1);
            ctx.restore();

            chipX += chipW + 12;
          }
        });

        cursorY += chipH + (isStories ? 42 : 24);
      }

      // 8. FOOTER Y & PRIMARY CTA BUTTON
      const footerY = isCleanApp
        ? isStories
          ? H - 255
          : H - 78
        : bottomSafeY - 12;

      const ctaH = isCleanApp ? (isStories ? 88 : 74) : isStories ? 92 : 78;
      const ctaY = Math.min(cursorY, footerY - ctaH - (isStories ? 44 : 34));

      ctx.font = `800 ${isStories ? 32 : 28}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const ctaLabel = `${ctaText.trim()}  →`;
      const ctaTextW = ctx.measureText(ctaLabel).width;
      const ctaW = Math.min(maxTextWidth, Math.max(420, ctaTextW + 88));

      ctx.save();
      drawRoundedRect(ctx, contentPadX, ctaY, ctaW, ctaH, 22);
      const btnGrad = ctx.createLinearGradient(contentPadX, ctaY, contentPadX + ctaW, ctaY);
      if (theme === 'orange-energy') {
        btnGrad.addColorStop(0, '#1D4ED8');
        btnGrad.addColorStop(1, '#2563EB');
        ctx.shadowColor = 'rgba(37, 99, 235, 0.42)';
      } else if (theme === 'founder-gold') {
        btnGrad.addColorStop(0, '#D97706');
        btnGrad.addColorStop(1, '#F59E0B');
        ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
      } else if (theme === 'invite-vip') {
        btnGrad.addColorStop(0, '#059669');
        btnGrad.addColorStop(1, '#10B981');
        ctx.shadowColor = 'rgba(16, 185, 129, 0.42)';
      } else {
        btnGrad.addColorStop(0, '#EA580C');
        btnGrad.addColorStop(1, '#F97316');
        ctx.shadowColor = 'rgba(234, 88, 12, 0.42)';
      }
      ctx.fillStyle = btnGrad;
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = theme === 'founder-gold' ? '#0F172A' : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ctaLabel, contentPadX + ctaW / 2, ctaY + ctaH / 2 + 2, ctaW - 32);
      ctx.restore();
      ctx.textAlign = 'left';

      // 9. FOOTER BAR
      ctx.save();
      ctx.font = `700 ${isStories ? 24 : 21}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = isCleanApp ? '#475569' : '#CBD5E1';
      ctx.textBaseline = 'middle';
      ctx.fillText(footerText, contentPadX, footerY, W - contentPadX * 2 - 220);

      ctx.textAlign = 'right';
      ctx.fillStyle = isCleanApp
        ? '#1D4ED8'
        : theme === 'founder-gold'
        ? '#FBBF24'
        : theme === 'invite-vip'
        ? '#34D399'
        : '#F97316';
      ctx.font = `800 ${isStories ? 24 : 21}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillText(cityBadge, W - contentPadX, footerY);
      ctx.restore();
    },
    [bgImage, cityBadge, ctaText, footerText, getCachedImage, headline, highlights, kicker, promoTag, scrim, subheadline, theme]
  );

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
    triggerDownload(canvas, `achenacidade-${selectedTemplateId}-${suffix}.png`);
    setIsExporting(false);
    setExportToast(`Criativo ${format === 'feed' ? 'Feed (1080×1080)' : 'Stories (1080×1920)'} baixado em PNG!`);
    setTimeout(() => setExportToast(null), 3500);
  };

  const handleDownloadBothFormats = async () => {
    setIsExporting(true);
    const offscreen = document.createElement('canvas');

    await renderCreative(offscreen, 'feed');
    triggerDownload(offscreen, `achenacidade-${selectedTemplateId}-feed-1080x1080.png`);

    await new Promise((r) => setTimeout(r, 350));

    await renderCreative(offscreen, 'stories');
    triggerDownload(offscreen, `achenacidade-${selectedTemplateId}-stories-1080x1920.png`);

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

  const categoryOrder: CreativeCategory[] = ['gratuito', 'vitalicio', 'convite', 'moradores', 'lojistas'];

  const visibleCategories = useMemo(
    () => (categoryFilter === 'all' ? categoryOrder : [categoryFilter]),
    [categoryFilter]
  );

  const countByCategory = useMemo(() => {
    const map: Record<CreativeCategory, number> = {
      gratuito: 0,
      vitalicio: 0,
      convite: 0,
      moradores: 0,
      lojistas: 0,
    };
    templates.forEach((t) => {
      map[t.category] += 1;
    });
    return map;
  }, [templates]);

  const activeCategory = selectedTemplate.category;

  return (
    <div className="space-y-6">
      {/* Studio Top Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Instagram className="w-4 h-4" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
              Estúdio de Criativos Instagram & Stories · {cityName}
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Escolha um bloco estratégico (Cadastro Gratuito, Vitalício Sócio Fundador, Divulgação de Convite ou Moradores) e exporte artes 1080px em PNG com legenda pronta.
          </p>
        </div>

        {/* Category Block Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 self-start">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Todos ({templates.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('gratuito');
              const first = templates.find((t) => t.category === 'gratuito');
              if (first) applyTemplate(first);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'gratuito'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Cadastro Gratuito ({countByCategory.gratuito})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('vitalicio');
              const first = templates.find((t) => t.category === 'vitalicio');
              if (first) applyTemplate(first);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'vitalicio'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Vitalício ({countByCategory.vitalicio})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('convite');
              const first = templates.find((t) => t.category === 'convite');
              if (first) applyTemplate(first);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'convite'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Via Convite ({countByCategory.convite})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('moradores');
              const first = templates.find((t) => t.category === 'moradores');
              if (first) applyTemplate(first);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'moradores'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Moradores</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('lojistas');
              const first = templates.find((t) => t.category === 'lojistas');
              if (first) applyTemplate(first);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'lojistas'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Planos Gerais</span>
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

      {/* Grouped Strategic Option Blocks */}
      <div className="space-y-4">
        {visibleCategories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const catTemplates = templates.filter((t) => t.category === cat);
          return (
            <div
              key={cat}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border ${meta.accentBorder} shadow-xs space-y-3`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${meta.badgeClass}`}>
                      {meta.shortLabel}
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {meta.title}
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {meta.description}
                  </p>
                </div>

                {/* Contextual Quick Action Bar per Block */}
                {cat === 'gratuito' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyQuickLink(
                        'free-link',
                        `${siteOrigin}/?cadastro=gratis`,
                        'Link para divulgação do Cadastro Gratuito copiado!'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {copiedLinkKey === 'free-link' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                    <span>{copiedLinkKey === 'free-link' ? 'Link Copiado!' : 'Copiar Link de Cadastro'}</span>
                  </button>
                )}

                {cat === 'vitalicio' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyQuickLink(
                        'founder-link',
                        `${siteOrigin}/socio-fundador`,
                        'Link da página de vendas Sócio Fundador copiado!'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {copiedLinkKey === 'founder-link' ? <Check className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
                    <span>{copiedLinkKey === 'founder-link' ? 'Página Copiada!' : 'Copiar Link /socio-fundador'}</span>
                  </button>
                )}

                {cat === 'convite' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyQuickLink(
                        'invite-link',
                        `${siteOrigin}/?convite=${encodeURIComponent(selectedInviteCode)}`,
                        `Link de convite (${selectedInviteCode}) copiado!`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {copiedLinkKey === 'invite-link' ? <Check className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
                    <span>{copiedLinkKey === 'invite-link' ? 'Link Copiado!' : `Copiar Link (?convite=${selectedInviteCode})`}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {catTemplates.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={tpl.bgImage}
                        alt={tpl.label}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                          <span className="text-slate-700 dark:text-slate-300">{tpl.kicker}</span>
                          {tpl.promoTag && (
                            <>
                              <span>·</span>
                              <span className="truncate text-blue-600 dark:text-blue-400">{tpl.promoTag}</span>
                            </>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {tpl.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
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
                <option value="founder-gold">Sócio Fundador (Dourado & Navy VIP)</option>
                <option value="invite-vip">Convite VIP (Índigo & Esmeralda)</option>
                <option value="clean-app">Cartão Clean Branco & Foto</option>
              </select>
            </div>
          </div>

          {/* Dedicated Block Focus Controls */}
          {activeCategory === 'convite' && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  <span>Vincular Código de Convite na Arte & Legenda</span>
                </span>
                <button
                  type="button"
                  onClick={handleQuickCreateInvite}
                  disabled={isCreatingQuickInvite}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isCreatingQuickInvite ? 'Criando...' : 'Gerar Novo Convite VIP'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                    Convites Ativos no Sistema
                  </label>
                  <select
                    value={activeInvites.some((i) => i.code === selectedInviteCode) ? selectedInviteCode : ''}
                    onChange={(e) => {
                      if (e.target.value) applyInviteCodeToCreative(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">
                      {activeInvites.length > 0 ? 'Selecionar convite criado...' : 'Nenhum convite ativo ainda'}
                    </option>
                    {activeInvites.map((inv) => (
                      <option key={inv.id} value={inv.code}>
                        {inv.code} ({inv.usedCount}/{inv.maxUses} usos{inv.recipientHint ? ` · ${inv.recipientHint}` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                    Código Personalizado na Arte
                  </label>
                  <input
                    type="text"
                    value={selectedInviteCode}
                    onChange={(e) => applyInviteCodeToCreative(e.target.value)}
                    placeholder="EX: VIP6M-XXXX"
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'vitalicio' && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-4 h-4" />
                  <span>Atalhos Rápidos · Plano Vitalício ({founderPriceLabel} · {founderLimit} itens)</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  `PAGAMENTO ÚNICO · ${founderPriceLabel}`,
                  `VITALÍCIO · ${founderLimit} ITENS VIP`,
                  'SELO SÓCIO FUNDADOR EXCLUSIVO',
                  'NUNCA MAIS PAGUE MENSALIDADE',
                ].map((tagOption) => (
                  <button
                    key={tagOption}
                    type="button"
                    onClick={() => setPromoTag(tagOption)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      promoTag === tagOption
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100/60'
                    }`}
                  >
                    {tagOption}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeCategory === 'gratuito' && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2.5">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4" />
                <span>Atalhos de Selo · Foco em Cadastro Gratuito</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'R$ 0,00 · GRÁTIS PARA SEMPRE',
                  'SEM CARTÃO DE CRÉDITO',
                  '0% DE COMISSÃO DE VENDA',
                  'ATIVE SUA LOJA EM 2 MINUTOS',
                ].map((tagOption) => (
                  <button
                    key={tagOption}
                    type="button"
                    onClick={() => setPromoTag(tagOption)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      promoTag === tagOption
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/60'
                    }`}
                  >
                    {tagOption}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  const current = templates.find((t) => t.id === selectedTemplateId);
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
              <label className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-blue-500" />
                  <span>Faixa de Destaque / Código na Arte (Opcional)</span>
                </span>
                {promoTag && (
                  <button
                    type="button"
                    onClick={() => setPromoTag('')}
                    className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    Remover faixa
                  </button>
                )}
              </label>
              <input
                type="text"
                value={promoTag}
                onChange={(e) => setPromoTag(e.target.value)}
                placeholder="Ex: CONVITE VIP: VIP6M-XXXX ou PAGAMENTO ÚNICO · R$ 500"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                  Rodapé (@instagram / Link)
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
                title="Enviar uma foto própria ou loja parceira"
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
                <span>Legenda Pronta (Instagram, WhatsApp & Grupos)</span>
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
              rows={6}
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
