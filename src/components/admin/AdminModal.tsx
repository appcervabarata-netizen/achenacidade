import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  X,
  ShieldCheck,
  Building2,
  MapPin,
  Tag,
  CreditCard,
  Palette,
  Server,
  Plus,
  Trash2,
  Edit2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { City, Category, Plan, AdminTheme, Business } from '../../types';
import { AdminBusinessEditModal } from './AdminBusinessEditModal';
import { generateHostGatorPackage, downloadFile } from '../../utils/hostgatorGenerator';

export const AdminModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    cities,
    addCity,
    updateCity,
    deleteCity,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    plans,
    addPlan,
    updatePlan,
    deletePlan,
    businesses,
    updateBusiness,
    deleteBusiness,
    products,
    adminTheme,
    setAdminTheme,
    resetToDemoData,
  } = useDirectory();

  // Active admin tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'cities' | 'categories' | 'plans' | 'businesses' | 'theme' | 'hostgator'
  >('dashboard');

  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // City form
  const [cityForm, setCityForm] = useState({
    name: '',
    state: 'SP',
    description: '',
    isActive: true,
    isDefault: false,
  });

  // Category form
  const [catForm, setCatForm] = useState({
    name: '',
    iconName: 'Store',
    description: '',
    color: '#2563EB',
  });

  // Plan form
  const [planForm, setPlanForm] = useState({
    name: '',
    priceMonthly: 0,
    productLimit: 5,
    businessLimit: 1,
    badge: 'Popular',
    featuresText: 'Cadastro da empresa\nDivulgação de produtos\nContato WhatsApp',
    highlighted: false,
    color: '#1D4ED8',
  });

  // Editing state for plans
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // HostGator code preview tab
  const [hgTab, setHgTab] = useState<'sql' | 'config' | 'api' | 'htaccess' | 'instructions'>('instructions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (activeModal.type !== 'admin') {
    return null;
  }

  // Pre-generate HostGator code package based on current live data
  const hgPackage = generateHostGatorPackage(cities, categories, plans, businesses, products);

  // Metrics
  const totalCities = cities.length;
  const activeCitiesCount = cities.filter((c) => c.isActive).length;
  const totalBusinesses = businesses.length;
  const totalProducts = products.length;
  const monthlyRevenue = businesses.reduce((acc, b) => {
    const p = plans.find((pl) => pl.id === b.planId);
    return acc + (p ? p.priceMonthly : 0);
  }, 0);

  // Copy code helper
  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  // Add/Edit City
  const handleAddCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityForm.name.trim()) return;
    if (editingCityId) {
      updateCity(editingCityId, {
        ...cityForm,
        name: cityForm.name.trim(),
        slug: `${toSlug(cityForm.name)}-${cityForm.state.toLowerCase()}`,
      });
      setEditingCityId(null);
    } else {
      addCity(cityForm);
    }
    setCityForm({ name: '', state: 'SP', description: '', isActive: true, isDefault: false });
  };

  // Add/Edit Category
  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        ...catForm,
        name: catForm.name.trim(),
        slug: toSlug(catForm.name),
      });
      setEditingCategoryId(null);
    } else {
      addCategory(catForm);
    }
    setCatForm({ name: '', iconName: 'Store', description: '', color: '#2563EB' });
  };

  // Save Plan
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name) return;

    const features = planForm.featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingPlanId) {
      updatePlan(editingPlanId, {
        name: planForm.name,
        priceMonthly: Number(planForm.priceMonthly),
        productLimit: Number(planForm.productLimit),
        businessLimit: Number(planForm.businessLimit),
        badge: planForm.badge,
        features,
        highlighted: planForm.highlighted,
        color: planForm.color,
      });
      setEditingPlanId(null);
    } else {
      addPlan({
        name: planForm.name,
        priceMonthly: Number(planForm.priceMonthly),
        productLimit: Number(planForm.productLimit),
        businessLimit: Number(planForm.businessLimit),
        badge: planForm.badge,
        features,
        highlighted: planForm.highlighted,
        color: planForm.color,
      });
    }

    setPlanForm({
      name: '',
      priceMonthly: 0,
      productLimit: 5,
      businessLimit: 1,
      badge: 'Popular',
      featuresText: 'Cadastro da empresa\nDivulgação de produtos\nContato WhatsApp',
      highlighted: false,
      color: '#1D4ED8',
    });
  };

  // Preset Themes
  const themesList: AdminTheme[] = [
    {
      themeName: 'Azul Cobalto & Laranja Vibrante (Padrão)',
      primaryColor: '#1D4ED8',
      primaryHover: '#1E40AF',
      accentColor: '#EA580C',
      accentHover: '#C2410C',
    },
    {
      themeName: 'Verde Esmeralda & Grafite',
      primaryColor: '#059669',
      primaryHover: '#047857',
      accentColor: '#0F172A',
      accentHover: '#334155',
    },
    {
      themeName: 'Roxo Noturno & Dourado',
      primaryColor: '#7C3AED',
      primaryHover: '#6D28D9',
      accentColor: '#D97706',
      accentHover: '#B45309',
    },
    {
      themeName: 'Azul Petróleo & Coral Moderno',
      primaryColor: '#0E7490',
      primaryHover: '#155E75',
      accentColor: '#F43F5E',
      accentHover: '#E11D48',
    },
    {
      themeName: 'Azul Marinho & Âmbar Executivo',
      primaryColor: '#1E3A8A',
      primaryHover: '#1E40AF',
      accentColor: '#F59E0B',
      accentHover: '#D97706',
    },
    {
      themeName: 'Terracota Sertão & Verde Oliva',
      primaryColor: '#C2410C',
      primaryHover: '#9A3412',
      accentColor: '#4D7C0F',
      accentHover: '#3F6212',
    },
    {
      themeName: 'Rosa Framboesa & Índigo Urbano',
      primaryColor: '#BE185D',
      primaryHover: '#9D174D',
      accentColor: '#4338CA',
      accentHover: '#3730A3',
    },
    {
      themeName: 'Grafite Moderno & Ciano Elétrico',
      primaryColor: '#1E293B',
      primaryHover: '#0F172A',
      accentColor: '#06B6D4',
      accentHover: '#0891B2',
    },
    {
      themeName: 'Vinho Bordô & Ouro Velho',
      primaryColor: '#881337',
      primaryHover: '#4C0519',
      accentColor: '#CA8A04',
      accentHover: '#A16207',
    },
    {
      themeName: 'Verde Floresta & Laranja Solar',
      primaryColor: '#15803D',
      primaryHover: '#166534',
      accentColor: '#F97316',
      accentHover: '#EA580C',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display">
                  Painel Administrativo Master
                </h2>
                <span className="text-[10px] font-extrabold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  achenacidade
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Gestão de Cidades, Categorias, Planos, Empresas e Exportação HostGator
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'dashboard', label: 'Dashboard & Métricas', icon: Sparkles },
            { id: 'cities', label: `Cidades (${cities.length})`, icon: MapPin },
            { id: 'categories', label: `Categorias (${categories.length})`, icon: Tag },
            { id: 'plans', label: `Planos (${plans.length})`, icon: CreditCard },
            { id: 'businesses', label: `Empresas (${businesses.length})`, icon: Building2 },
            { id: 'theme', label: 'Cores & Marca', icon: Palette },
            { id: 'hostgator', label: 'HostGator (PHP/MySQL)', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Cidades Cadastradas
                  </span>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-900 dark:text-white font-mono">
                    {totalCities}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeCitiesCount} ativas no seletor
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900">
                  <span className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                    Empresas Ativas
                  </span>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-orange-900 dark:text-white font-mono">
                    {totalBusinesses}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Anunciando no diretório
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    Produtos na Vitrine
                  </span>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-white font-mono">
                    {totalProducts}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Controlados por plano
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Faturamento Mensal
                  </span>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                    R$ {monthlyRevenue.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Soma das assinaturas
                  </span>
                </div>
              </div>

              {/* HostGator Quick Notice */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                    <Server className="w-4 h-4" />
                    <span>Hospedagem HostGator Pronta</span>
                  </div>
                  <h4 className="text-base font-bold">
                    Código PHP e Banco MySQL Sincronizados
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Todas as cidades, categorias, planos e produtos estão preparados para serem exportados e importados com 1 clique no cPanel e phpMyAdmin da HostGator.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('hostgator')}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                >
                  <span>Abrir Central HostGator</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Reset to Demo Data button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Deseja restaurar as cidades, categorias e produtos originais?
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPendingConfirm({
                      title: 'Restaurar Dados Padrão',
                      message: 'Tem certeza? Isso restaurará os dados demonstrativos padrão.',
                      confirmLabel: 'Restaurar Padrão',
                      variant: 'primary',
                      onConfirm: () => resetToDemoData(),
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Dados Padrão</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: CIDADES */}
          {activeTab === 'cities' && (
            <div className="space-y-6">
              
              {/* Form: Adicionar Cidade */}
              <form onSubmit={handleAddCitySubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Nova Cidade no Diretório</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome da Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={cityForm.name}
                      onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                      placeholder="Ex: São José dos Campos"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Estado (UF) *
                    </label>
                    <select
                      value={cityForm.state}
                      onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      {['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE', 'DF', 'GO', 'ES'].map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Descrição Resumida
                    </label>
                    <input
                      type="text"
                      value={cityForm.description}
                      onChange={(e) => setCityForm({ ...cityForm, description: e.target.value })}
                      placeholder="Ex: Polo aeroespacial e de tecnologia"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cityForm.isActive}
                      onChange={(e) => setCityForm({ ...cityForm, isActive: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Cidade Ativa no Guia</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Cidade</span>
                  </button>
                </div>
              </form>

              {/* Lista de Cidades */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Cidade / UF</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Empresas</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {cities.map((city) => {
                      const count = businesses.filter((b) => b.cityId === city.id).length;

                      return (
                        <tr key={city.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {city.name} - {city.state}
                            {city.isDefault && (
                              <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 text-[10px]">
                                Padrão
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500 font-mono">{city.slug}</td>
                          <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{count} empresas</td>
                          <td className="p-3">
                            <button
                              onClick={() => updateCity(city.id, { isActive: !city.isActive })}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                                city.isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {city.isActive ? 'Ativa' : 'Inativa'}
                            </button>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {!city.isDefault && (
                              <button
                                type="button"
                                onClick={() => {
                                  cities.forEach((c) => updateCity(c.id, { isDefault: c.id === city.id }));
                                }}
                                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                              >
                                Tornar Padrão
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCityId(city.id);
                                setCityForm({
                                  name: city.name,
                                  state: city.state,
                                  description: city.description || '',
                                  isActive: city.isActive,
                                  isDefault: !!city.isDefault,
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                              title="Editar cidade"
                            >
                              <Edit2 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingConfirm({
                                  title: 'Excluir Cidade',
                                  message: `Tem certeza que deseja remover a cidade "${city.name}"?`,
                                  confirmLabel: 'Excluir Cidade',
                                  variant: 'danger',
                                  onConfirm: () => deleteCity(city.id),
                                })
                              }
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="Excluir cidade"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CATEGORIAS */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              
              {/* Form: Adicionar Categoria */}
              <form onSubmit={handleAddCatSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Nova Categoria Comercial</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome da Categoria *
                    </label>
                    <input
                      type="text"
                      required
                      value={catForm.name}
                      onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="Ex: Farmácias & Drogarias"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ícone Representativo
                    </label>
                    <select
                      value={catForm.iconName}
                      onChange={(e) => setCatForm({ ...catForm, iconName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="Utensils">Utensils (Gastronomia)</option>
                      <option value="Coffee">Coffee (Padarias, Cafés & Açaí)</option>
                      <option value="ShoppingBasket">ShoppingBasket (Mercados)</option>
                      <option value="Shirt">Shirt (Moda)</option>
                      <option value="HeartPulse">HeartPulse (Saúde)</option>
                      <option value="Pill">Pill (Farmácias & Drogarias)</option>
                      <option value="Smartphone">Smartphone (Tecnologia)</option>
                      <option value="Hammer">Hammer (Construção)</option>
                      <option value="Sofa">Sofa (Móveis & Decoração)</option>
                      <option value="Dog">Dog (Pet Shop)</option>
                      <option value="Car">Car (Automotivo)</option>
                      <option value="Scissors">Scissors (Beleza)</option>
                      <option value="BookOpen">BookOpen (Papelarias & Gráficas)</option>
                      <option value="Briefcase">Briefcase (Contabilidade & Advocacia)</option>
                      <option value="Sprout">Sprout (Agropecuária & Rações)</option>
                      <option value="Dumbbell">Dumbbell (Academias & Esportes)</option>
                      <option value="BedDouble">BedDouble (Hotéis & Pousadas)</option>
                      <option value="Glasses">Glasses (Óticas & Joias)</option>
                      <option value="Truck">Truck (Gás, Água & Bebidas)</option>
                      <option value="Store">Store (Comércio Geral)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cor da Categoria
                    </label>
                    <input
                      type="color"
                      value={catForm.color}
                      onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                      className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCatForm({ name: '', iconName: 'Store', description: '', color: '#2563EB' });
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingCategoryId ? 'Atualizar Categoria' : 'Salvar Categoria'}</span>
                  </button>
                </div>
              </form>

              {/* Lista de Categorias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        {cat.slug} · {cat.iconName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(cat.id);
                          setCatForm({
                            name: cat.name,
                            iconName: cat.iconName || 'Store',
                            description: cat.description || '',
                            color: cat.color || '#2563EB',
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1.5 cursor-pointer"
                        title="Editar categoria"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingConfirm({
                            title: 'Excluir Categoria',
                            message: `Excluir categoria "${cat.name}"?`,
                            confirmLabel: 'Excluir Categoria',
                            variant: 'danger',
                            onConfirm: () => deleteCategory(cat.id),
                          })
                        }
                        className="text-red-500 hover:text-red-700 p-1.5 cursor-pointer"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PLANOS (100% CONFIGURÁVEL PELO ADMIN) */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              
              {/* Form: Criar / Editar Plano */}
              <form onSubmit={handleSavePlan} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>{editingPlanId ? 'Editar Plano de Assinatura' : 'Cadastrar Novo Plano de Divulgação'}</span>
                  </h4>
                  {editingPlanId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlanId(null);
                        setPlanForm({
                          name: '',
                          priceMonthly: 0,
                          productLimit: 5,
                          businessLimit: 1,
                          badge: 'Popular',
                          featuresText: 'Cadastro da empresa\nDivulgação de produtos\nContato WhatsApp',
                          highlighted: false,
                          color: '#1D4ED8',
                        });
                      }}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Plano *
                    </label>
                    <input
                      type="text"
                      required
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="Ex: Plano Diamante"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preço Mensal (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={planForm.priceMonthly}
                      onChange={(e) => setPlanForm({ ...planForm, priceMonthly: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Limite de Lojas/Conta *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={planForm.businessLimit}
                      onChange={(e) => setPlanForm({ ...planForm, businessLimit: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono font-bold text-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Limite de Produtos/Loja *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={planForm.productLimit}
                      onChange={(e) => setPlanForm({ ...planForm, productLimit: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono font-bold text-orange-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Selo / Badge
                    </label>
                    <input
                      type="text"
                      value={planForm.badge}
                      onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                      placeholder="Ex: Mais Popular, Destaque VIP"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recursos Inclusos (1 por linha)
                    </label>
                    <textarea
                      rows={3}
                      value={planForm.featuresText}
                      onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.highlighted}
                      onChange={(e) => setPlanForm({ ...planForm, highlighted: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Destacar como "Mais Escolhido" na Home</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>{editingPlanId ? 'Salvar Modificações' : 'Criar Plano'}</span>
                  </button>
                </div>
              </form>

              {/* Cards de Planos Existentes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      p.highlighted
                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</h5>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {p.badge}
                        </span>
                      </div>

                      <div className="mt-2 text-lg font-black text-slate-900 dark:text-white font-mono">
                        {p.priceMonthly === 0 ? 'Grátis' : `R$ ${p.priceMonthly.toFixed(2)}/mês`}
                      </div>

                      <div className="mt-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                        Cota: {p.businessLimit || 1} {p.businessLimit === 1 ? 'loja' : 'lojas'} · {p.productLimit} produtos
                      </div>

                      <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <span className="text-emerald-500">✓</span> {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingPlanId(p.id);
                          setPlanForm({
                            name: p.name,
                            priceMonthly: p.priceMonthly,
                            productLimit: p.productLimit,
                            businessLimit: p.businessLimit || 1,
                            badge: p.badge,
                            featuresText: p.features.join('\n'),
                            highlighted: !!p.highlighted,
                            color: p.color,
                          });
                        }}
                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                        title="Editar plano"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPendingConfirm({
                            title: 'Excluir Plano',
                            message: `Remover plano "${p.name}"?`,
                            confirmLabel: 'Excluir Plano',
                            variant: 'danger',
                            onConfirm: () => deletePlan(p.id),
                          })
                        }
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Excluir plano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: EMPRESAS */}
          {activeTab === 'businesses' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Todas as Empresas Cadastradas ({businesses.length})
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Cidade</th>
                      <th className="p-3">Plano Atual</th>
                      <th className="p-3">Produtos</th>
                      <th className="p-3">Verificada</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {businesses.map((biz) => {
                      const city = cities.find((c) => c.id === biz.cityId);
                      const currentPlan = plans.find((p) => p.id === biz.planId);
                      const prodCount = products.filter((pr) => pr.businessId === biz.id).length;

                      return (
                        <tr key={biz.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 flex items-center gap-2">
                            <img
                              src={biz.logoUrl}
                              alt={biz.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{biz.name}</div>
                              <span className="text-[10px] text-slate-500">{biz.neighborhood} · {biz.whatsapp}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{city?.name}</td>
                          <td className="p-3">
                            <select
                              value={biz.planId}
                              onChange={(e) => updateBusiness(biz.id, { planId: e.target.value })}
                              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-xs cursor-pointer"
                            >
                              {plans.map((pl) => (
                                <option key={pl.id} value={pl.id}>
                                  {pl.name} ({pl.productLimit} prods)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 font-mono font-semibold">
                            {prodCount} / {currentPlan?.productLimit}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => updateBusiness(biz.id, { isVerified: !biz.isVerified })}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                                biz.isVerified
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {biz.isVerified ? 'Sim' : 'Não'}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingBusiness(biz)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs transition cursor-pointer shadow-2xs"
                                title="Editar dados cadastrais, contatos, mídias e senha da loja"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingConfirm({
                                    title: 'Excluir Empresa',
                                    message: `Remover empresa "${biz.name}"? Seus produtos também serão excluídos.`,
                                    confirmLabel: 'Excluir Empresa',
                                    variant: 'danger',
                                    onConfirm: () => deleteBusiness(biz.id),
                                  })
                                }
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                                title="Excluir empresa"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PERSONALIZAÇÃO DE TEMA */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Identidade Visual e Cores da Marca (achenacidade)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selecione uma paleta pré-definida ou personalize as cores primárias e de destaque da plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themesList.map((th, idx) => (
                  <div
                    key={idx}
                    onClick={() => setAdminTheme(th)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      adminTheme.themeName === th.themeName
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">{th.themeName}</h5>
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full shadow-xs"
                          style={{ backgroundColor: th.primaryColor }}
                          title={`Primária: ${th.primaryColor}`}
                        />
                        <div
                          className="w-5 h-5 rounded-full shadow-xs"
                          style={{ backgroundColor: th.accentColor }}
                          title={`Acento: ${th.accentColor}`}
                        />
                        <span className="text-[11px] text-slate-500 font-mono">
                          {th.primaryColor} / {th.accentColor}
                        </span>
                      </div>
                    </div>

                    {adminTheme.themeName === th.themeName && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: HOSTGATOR PHP & MYSQL (CENTRAL COMPLETA) */}
          {activeTab === 'hostgator' && (
            <div className="space-y-6">
              
              {/* HostGator Header & Download All */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200 mb-1">
                    <Server className="w-4 h-4" />
                    <span>Gerador & Exportador HostGator</span>
                  </div>
                  <h3 className="text-lg font-black font-display">
                    Deploy Completo em PHP 8.x & MySQL para HostGator (cPanel)
                  </h3>
                  <p className="text-xs text-white/90 max-w-xl mt-1">
                    Baixe os scripts PHP com conexão PDO segura, o arquivo schema.sql completo para importar no phpMyAdmin e o passo a passo de configuração.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      downloadFile('schema.sql', hgPackage.schemaSql, 'application/sql');
                      downloadFile('config.php', hgPackage.configPhp, 'application/x-httpd-php');
                      downloadFile('api.php', hgPackage.apiPhp, 'application/x-httpd-php');
                      downloadFile('.htaccess', hgPackage.htaccess, 'text/plain');
                      downloadFile('INSTRUCOES_HOSTGATOR.txt', hgPackage.instructionsTxt, 'text/plain');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-md hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 text-orange-600" />
                    <span>Baixar Todos os Arquivos</span>
                  </button>
                </div>
              </div>

              {/* Subtabs for scripts */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
                {[
                  { id: 'instructions', label: '1. Manual cPanel HostGator' },
                  { id: 'sql', label: '2. schema.sql (MySQL)' },
                  { id: 'config', label: '3. config.php (PDO)' },
                  { id: 'api', label: '4. api.php (REST)' },
                  { id: 'htaccess', label: '5. .htaccess' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setHgTab(item.id as typeof hgTab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      hgTab === item.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Code viewer with copy button */}
              <div className="relative rounded-2xl bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto border border-slate-800 max-h-96">
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      let content = '';
                      let filename = '';
                      if (hgTab === 'sql') { content = hgPackage.schemaSql; filename = 'schema.sql'; }
                      else if (hgTab === 'config') { content = hgPackage.configPhp; filename = 'config.php'; }
                      else if (hgTab === 'api') { content = hgPackage.apiPhp; filename = 'api.php'; }
                      else if (hgTab === 'htaccess') { content = hgPackage.htaccess; filename = '.htaccess'; }
                      else { content = hgPackage.instructionsTxt; filename = 'INSTRUCOES_HOSTGATOR.txt'; }
                      
                      downloadFile(filename, content);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-[11px] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Arquivo</span>
                  </button>

                  <button
                    onClick={() => {
                      let content = '';
                      if (hgTab === 'sql') content = hgPackage.schemaSql;
                      else if (hgTab === 'config') content = hgPackage.configPhp;
                      else if (hgTab === 'api') content = hgPackage.apiPhp;
                      else if (hgTab === 'htaccess') content = hgPackage.htaccess;
                      else content = hgPackage.instructionsTxt;
                      handleCopy(hgTab, content);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] cursor-pointer"
                  >
                    {copiedKey === hgTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === hgTab ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <pre className="pr-36">
                  {hgTab === 'sql' && hgPackage.schemaSql}
                  {hgTab === 'config' && hgPackage.configPhp}
                  {hgTab === 'api' && hgPackage.apiPhp}
                  {hgTab === 'htaccess' && hgPackage.htaccess}
                  {hgTab === 'instructions' && hgPackage.instructionsTxt}
                </pre>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Modal de Edição de Loja */}
      {editingBusiness && (
        <AdminBusinessEditModal
          isOpen={!!editingBusiness}
          onClose={() => setEditingBusiness(null)}
          business={editingBusiness}
          onSave={(businessId, updates) => {
            updateBusiness(businessId, updates);
          }}
          cities={cities}
          categories={categories}
          plans={plans}
        />
      )}

      <ConfirmModal
        isOpen={!!pendingConfirm}
        title={pendingConfirm?.title || ''}
        message={pendingConfirm?.message || ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        variant={pendingConfirm?.variant || 'danger'}
        onConfirm={() => pendingConfirm?.onConfirm()}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
};
