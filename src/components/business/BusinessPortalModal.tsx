import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  X,
  Building2,
  Package,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Sparkles,
  Store,
  DollarSign,
  Image as ImageIcon,
} from 'lucide-react';
import { Business, Product } from '../../types';

export const BusinessPortalModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    cities,
    categories,
    plans,
    businesses,
    products,
    updateBusiness,
    addProduct,
    deleteProduct,
    currentBusinessAuth,
    authSession,
    registerBusinessAndLogin,
    setCurrentView,
  } = useDirectory();

  // Tab: 'manage_products' | 'register_business'
  const [activeTab, setActiveTab] = useState<'manage_products' | 'register_business'>('manage_products');

  // Register Business Form State
  const [bizForm, setBizForm] = useState({
    name: '',
    cityId: cities[0]?.id || '',
    categoryId: categories[0]?.id || '',
    planId: plans[0]?.id || '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    neighborhood: '',
    openingHours: 'Seg a Sex: 09:00 às 18:00',
    logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=200&h=200&fit=crop&q=80',
    instagram: '',
    website: '',
  });

  // Add Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=400&fit=crop&q=80',
    category: '',
  });

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeleteProd, setConfirmDeleteProd] = useState<{ id: string; name: string } | null>(null);

  if (activeModal.type !== 'business_portal') {
    return null;
  }

  // Active authenticated business session only (no unauthenticated fallback)
  const isAuthenticatedBusiness =
    authSession.isAuthenticated && authSession.role === 'business';
  const activeBusiness = isAuthenticatedBusiness
    ? currentBusinessAuth || businesses.find((b) => b.id === authSession.businessId) || null
    : null;
  const activePlan = activeBusiness ? plans.find((p) => p.id === activeBusiness.planId) || plans[0] : null;
  const businessProducts = activeBusiness ? products.filter((p) => p.businessId === activeBusiness.id) : [];

  const productLimit = activePlan ? activePlan.productLimit : 3;
  const currentProductCount = businessProducts.length;
  const isQuotaFull = currentProductCount >= productLimit;

  // Handle Business Registration
  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticatedBusiness) {
      setNotification({ text: 'Faça login antes de cadastrar uma nova filial.', type: 'error' });
      return;
    }
    if (!bizForm.name || !bizForm.whatsapp) {
      setNotification({ text: 'Por favor preencha ao menos o nome da empresa e o WhatsApp.', type: 'error' });
      return;
    }

    const res = await registerBusinessAndLogin(
      {
        ...bizForm,
        email: bizForm.email || authSession.email,
        ownerEmail: authSession.email,
      },
      false
    );
    if (!res.success) {
      setNotification({ text: res.error || 'Falha ao cadastrar empresa no banco.', type: 'error' });
      return;
    }
    setNotification({ text: 'Empresa cadastrada com sucesso! Agora você pode cadastrar seus produtos.', type: 'success' });
    setActiveTab('manage_products');
  };

  // Handle Add Product (Validates Quota!)
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    if (!prodForm.name || !prodForm.price) {
      setNotification({ text: 'Informe o nome e o preço do produto.', type: 'error' });
      return;
    }

    const numericPrice = parseFloat(prodForm.price.replace(',', '.'));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setNotification({ text: 'Preço inválido.', type: 'error' });
      return;
    }

    const numericOriginalPrice = prodForm.originalPrice ? parseFloat(prodForm.originalPrice.replace(',', '.')) : undefined;

    const result = addProduct({
      businessId: activeBusiness.id,
      cityId: activeBusiness.cityId,
      name: prodForm.name,
      price: numericPrice,
      originalPrice: numericOriginalPrice,
      description: prodForm.description || 'Produto disponível para pronta entrega ou encomenda.',
      imageUrl: prodForm.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=400&fit=crop&q=80',
      category: prodForm.category || 'Geral',
      isActive: true,
      featured: false,
    });

    if (!result.success) {
      setNotification({ text: result.error || 'Erro ao cadastrar produto.', type: 'error' });
    } else {
      setNotification({ text: 'Produto cadastrado e divulgado com sucesso!', type: 'success' });
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

  // Quick Plan Upgrade
  const handleUpgradePlan = (newPlanId: string) => {
    if (!activeBusiness) return;
    updateBusiness(activeBusiness.id, { planId: newPlanId });
    setNotification({ text: 'Plano atualizado com sucesso! Nova cota de produtos liberada.', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">
                Portal do Anunciante — achenacidade
              </h2>
              <p className="text-xs text-slate-300">
                Gerencie sua empresa, escolha planos e publique produtos na internet
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subnav Tabs */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('manage_products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'manage_products'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Vitrine & Meus Produtos
          </button>

          <button
            onClick={() => setActiveTab('register_business')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'register_business'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Cadastrar Nova Empresa
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
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
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!activeBusiness && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-orange-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Autenticação Necessária
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Entre com o e-mail e senha da sua loja para gerenciar produtos e serviços.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  setCurrentView('login');
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Ir para a Tela de Login
              </button>
            </div>
          )}

          {/* TAB 1: MANAGE PRODUCTS */}
          {activeTab === 'manage_products' && activeBusiness && (
            <div className="space-y-6">
              
              {/* Store Identity & Plan Quota Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={activeBusiness.logoUrl}
                    alt={activeBusiness.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white/20 bg-white"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                      Gerenciando Loja
                    </span>
                    <h3 className="text-lg font-bold">{activeBusiness.name}</h3>
                    <p className="text-xs text-blue-200">{activeBusiness.neighborhood} · {activeBusiness.whatsapp}</p>
                  </div>
                </div>

                {/* Quota Gauge */}
                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 sm:min-w-64">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-200 font-medium">Cota de Produtos:</span>
                    <span className="font-extrabold text-orange-400">
                      {currentProductCount} de {productLimit} usados
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isQuotaFull ? 'bg-red-500' : 'bg-emerald-400'
                      }`}
                      style={{
                        width: `${Math.min(100, (currentProductCount / productLimit) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Plano: <strong>{activePlan?.name}</strong></span>
                    {isQuotaFull && (
                      <span className="text-red-300 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Limite atingido
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Upgrade Plan Options if quota reached or near full */}
              {isQuotaFull && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold">Faça Upgrade para Adicionar Mais Produtos</h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        Sua cota de {productLimit} produtos do plano {activePlan?.name} foi totalmente preenchida. Escolha um plano maior abaixo para continuar divulgando itens na internet:
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {plans
                          .filter((p) => p.productLimit > productLimit)
                          .map((higherPlan) => (
                            <button
                              key={higherPlan.id}
                              onClick={() => handleUpgradePlan(higherPlan.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <span>Mudar para {higherPlan.name} ({higherPlan.productLimit} produtos)</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add New Product Form */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Cadastrar Novo Produto na Vitrine
                  </h4>
                </div>

                <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodForm.name}
                      onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      placeholder="Ex: Tênis Esportivo Pro Runner"
                      disabled={isQuotaFull}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Preço (R$) *
                      </label>
                      <input
                        type="text"
                        required
                        value={prodForm.price}
                        onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                        placeholder="Ex: 149.90"
                        disabled={isQuotaFull}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Preço De: (opcional)
                      </label>
                      <input
                        type="text"
                        value={prodForm.originalPrice}
                        onChange={(e) => setProdForm({ ...prodForm, originalPrice: e.target.value })}
                        placeholder="Ex: 199.90"
                        disabled={isQuotaFull}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Categoria do Produto
                    </label>
                    <input
                      type="text"
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                      placeholder="Ex: Calçados, Eletrônicos..."
                      disabled={isQuotaFull}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      URL da Imagem
                    </label>
                    <input
                      type="url"
                      value={prodForm.imageUrl}
                      onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                      disabled={isQuotaFull}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Descrição do Produto
                    </label>
                    <textarea
                      rows={2}
                      value={prodForm.description}
                      onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                      placeholder="Detalhes, especificações técnicas, cores ou tamanhos..."
                      disabled={isQuotaFull}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isQuotaFull}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Publicar Produto no Diretório</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of currently registered products */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Produtos Ativos desta Loja ({businessProducts.length})
                </h4>

                <div className="space-y-2">
                  {businessProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </h5>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            R$ {prod.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteProd({ id: prod.id, name: prod.name })}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: REGISTER BUSINESS */}
          {activeTab === 'register_business' && (
            <form onSubmit={handleRegisterBusiness} className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cadastre sua Empresa no achenacidade
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preencha os dados e escolha o plano para definir quantos produtos poderá divulgar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Empresa / Loja *
                  </label>
                  <input
                    type="text"
                    required
                    value={bizForm.name}
                    onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                    placeholder="Ex: Padaria Bella Vista"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade *
                  </label>
                  <select
                    value={bizForm.cityId}
                    onChange={(e) => setBizForm({ ...bizForm, cityId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name} - {city.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria Comercial *
                  </label>
                  <select
                    value={bizForm.categoryId}
                    onChange={(e) => setBizForm({ ...bizForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plano de Anúncio Desejado *
                  </label>
                  <select
                    value={bizForm.planId}
                    onChange={(e) => setBizForm({ ...bizForm, planId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600 cursor-pointer"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — até {p.productLimit} produtos ({p.priceMonthly === 0 ? 'Grátis' : `R$ ${p.priceMonthly.toFixed(2)}/mês`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Comercial (com DDD) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bizForm.whatsapp}
                    onChange={(e) => setBizForm({ ...bizForm, whatsapp: e.target.value })}
                    placeholder="Ex: 19998765432"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone Fixo
                  </label>
                  <input
                    type="text"
                    value={bizForm.phone}
                    onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                    placeholder="Ex: (19) 3254-0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={bizForm.address}
                    onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                    placeholder="Ex: Rua das Flores, 120"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={bizForm.neighborhood}
                    onChange={(e) => setBizForm({ ...bizForm, neighborhood: e.target.value })}
                    placeholder="Ex: Centro"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição da Empresa & Especialidades
                  </label>
                  <textarea
                    rows={3}
                    value={bizForm.description}
                    onChange={(e) => setBizForm({ ...bizForm, description: e.target.value })}
                    placeholder="Conte um pouco sobre sua loja, diferenciais, tradição e atendimento..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Cadastrar Empresa e Ativar Plano</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

      <ConfirmModal
        isOpen={!!confirmDeleteProd}
        title="Excluir Produto"
        message={`Deseja remover o produto "${confirmDeleteProd?.name || ''}"?`}
        confirmLabel="Excluir Produto"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteProd) {
            deleteProduct(confirmDeleteProd.id);
            setNotification({ text: 'Produto removido.', type: 'success' });
          }
        }}
        onCancel={() => setConfirmDeleteProd(null)}
      />
    </div>
  );
};
