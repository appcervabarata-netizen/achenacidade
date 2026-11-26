import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Crown,
  HelpCircle,
  Search,
  ShoppingBag,
  Store,
  Wrench,
  Compass,
} from 'lucide-react';

export const VisitorDemoGuideBar: React.FC = () => {
  const {
    visitorDemoActive,
    exitVisitorDemo,
    currentView,
    setCurrentView,
    siteModeConfig,
  } = useDirectory();

  const [showInstructions, setShowInstructions] = useState(false);

  if (!visitorDemoActive) return null;

  return (
    <div className="bg-slate-950 text-white border-b border-blue-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Mode label & quick guidance toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-600 text-white text-[11px] font-extrabold tracking-wide whitespace-nowrap">
            <Compass className="w-3.5 h-3.5" />
            <span>MODO DEMONSTRAÇÃO</span>
          </span>

          <span className="text-xs text-blue-100 hidden sm:inline">
            Navegue livremente para testar as buscas, lojas e produtos do aplicativo.
          </span>

          <button
            type="button"
            onClick={() => setShowInstructions((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Como pesquisar e ver produtos?</span>
            {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: Quick navigation shortcuts + Return */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                currentView === 'home' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>3 Buscas</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('stores')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                currentView === 'stores' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>Lojas</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('products')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                currentView === 'products' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Produtos</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('services')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                currentView === 'services' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>Serviços</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentView('founder_sales');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Vitalício R$ 500</span>
          </button>

          <button
            type="button"
            onClick={exitVisitorDemo}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {siteModeConfig.mode === 'launch' ? 'Voltar ao Lançamento' : 'Sair da Demo'}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Step-by-Step Guide */}
      {showInstructions && (
        <div className="bg-slate-900 border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <p className="font-bold text-blue-300 mb-1">1. Como Pesquisar na Página Inicial</p>
              <p className="text-slate-300 leading-relaxed">
                Na tela de Início existem 3 caixas separadas: busque por <strong>Empresas</strong> (nome ou bairro), <strong>Produtos</strong> (item ou oferta) ou <strong>Serviços</strong> (profissional).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <p className="font-bold text-orange-300 mb-1">2. Como Ver Produtos e Preços</p>
              <p className="text-slate-300 leading-relaxed">
                Clique na aba <strong>Produtos</strong> ou abra qualquer <strong>Loja</strong> para visualizar fotos, valores, descrição completa e o botão de contato direto no WhatsApp.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <p className="font-bold text-emerald-300 mb-1">3. Favoritos & Área do Lojista</p>
              <p className="text-slate-300 leading-relaxed">
                Salve lojas nos favoritos e clique em <strong>Entrar → Área do Lojista</strong> para testar o painel onde o comerciante cadastra itens e banners.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
