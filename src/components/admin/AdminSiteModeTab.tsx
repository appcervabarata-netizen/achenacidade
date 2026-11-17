import React, { useState, useEffect } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { LaunchBenefit, SiteMode } from '../../types';
import {
  Rocket,
  Wrench,
  Globe,
  Clock,
  Eye,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  MessageCircle,
  Save,
} from 'lucide-react';

export const AdminSiteModeTab: React.FC = () => {
  const {
    siteModeConfig,
    setSiteMode,
    updateLaunchConfig,
    updateMaintenanceConfig,
    resetSiteModeConfig,
    setAdminPreviewMode,
  } = useDirectory();

  const [launchForm, setLaunchForm] = useState(siteModeConfig.launch);
  const [maintenanceForm, setMaintenanceForm] = useState(siteModeConfig.maintenance);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setLaunchForm(siteModeConfig.launch);
    setMaintenanceForm(siteModeConfig.maintenance);
  }, [siteModeConfig]);

  const showToast = (msg: string) => {
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(null), 3500);
  };

  const addQuickOffsetToIso = (hoursOffset: number): string => {
    const target = new Date(Date.now() + hoursOffset * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
  };

  const handleSaveLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    updateLaunchConfig(launchForm);
    showToast('Configurações da Página de Lançamento salvas com sucesso.');
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    updateMaintenanceConfig(maintenanceForm);
    showToast('Configurações da Página de Manutenção salvas com sucesso.');
  };

  const handleAddBenefit = () => {
    const newBenefit: LaunchBenefit = {
      id: `ben-${Date.now()}`,
      highlightMetric: 'Novo Benefício',
      title: 'Vantagem comercial para sua empresa',
      description: 'Descreva aqui como este recurso ajuda os lojistas de Alagoinhas a vender mais.',
    };
    setLaunchForm((prev) => ({
      ...prev,
      benefits: [...prev.benefits, newBenefit],
    }));
  };

  const handleUpdateBenefit = (id: string, field: keyof LaunchBenefit, value: string) => {
    setLaunchForm((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    }));
  };

  const handleDeleteBenefit = (id: string) => {
    setLaunchForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((b) => b.id !== id),
    }));
  };

  const modeCards: {
    mode: SiteMode;
    title: string;
    desc: string;
    icon: React.FC<{ className?: string }>;
    accentClass: string;
  }[] = [
    {
      mode: 'normal',
      title: 'Site Principal Normal',
      desc: 'Exibe a página inicial completa com busca tripla de Empresas, Produtos e Serviços.',
      icon: Globe,
      accentClass: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
    },
    {
      mode: 'launch',
      title: 'Página de Lançamento Ativa',
      desc: 'Tela cheia persuasiva para captação de lojistas com cronômetro, benefícios e planos.',
      icon: Rocket,
      accentClass: 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300',
    },
    {
      mode: 'maintenance',
      title: 'Página de Manutenção Ativa',
      desc: 'Exibe aviso programado com cronômetro regressivo e botão visível para cadastro.',
      icon: Wrench,
      accentClass: 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
    },
  ];

  return (
    <div className="space-y-8">
      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 1. Seletor do Modo Público do App */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
              Modo de Exibição Pública do Site
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alterne instantaneamente entre a página principal normal, a página de lançamento ou manutenção. O acesso Admin permanece sempre disponível.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetSiteModeConfig();
              showToast('Configurações de Lançamento e Manutenção restauradas para o padrão.');
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modeCards.map((item) => {
            const Icon = item.icon;
            const isSelected = siteModeConfig.mode === item.mode;

            return (
              <button
                key={item.mode}
                type="button"
                onClick={() => {
                  setSiteMode(item.mode);
                  showToast(`Modo alterado para: ${item.title}`);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? item.accentClass
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-bold">
                    {isSelected ? 'Ativo agora' : 'Clique para ativar'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Editor Completo da Página de Lançamento */}
      <form
        onSubmit={handleSaveLaunch}
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                Configurações da Página de Lançamento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Edite o cronômetro, copy persuasivo, vagas inaugurais, benefícios e WhatsApp comercial.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              updateLaunchConfig(launchForm);
              setAdminPreviewMode('launch');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5 text-orange-400" />
            <span>Pré-visualizar Lançamento</span>
          </button>
        </div>

        {/* Timer + Vagas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Data e Hora Alvo do Cronômetro de Lançamento
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600 shrink-0" />
              <input
                type="datetime-local"
                value={launchForm.targetDateIso.slice(0, 16)}
                onChange={(e) => setLaunchForm({ ...launchForm, targetDateIso: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { label: '+3 dias', hours: 72 },
                { label: '+7 dias', hours: 168 },
                { label: '+15 dias', hours: 360 },
                { label: '+30 dias', hours: 720 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setLaunchForm({ ...launchForm, targetDateIso: addQuickOffsetToIso(preset.hours) })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Vagas Inaugurais Restantes (Gatilho de Escassez)
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={launchForm.availableSpots}
              onChange={(e) =>
                setLaunchForm({ ...launchForm, availableSpots: Number(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-mono"
            />
          </div>
        </div>

        {/* Textos principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subtítulo de Topo (Eyebrow)
            </label>
            <input
              type="text"
              value={launchForm.eyebrow}
              onChange={(e) => setLaunchForm({ ...launchForm, eyebrow: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Texto do Botão Principal (CTA)
            </label>
            <input
              type="text"
              value={launchForm.ctaText}
              onChange={(e) => setLaunchForm({ ...launchForm, ctaText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Título Principal (Promessa de Valor para Lojistas)
          </label>
          <input
            type="text"
            value={launchForm.headline}
            onChange={(e) => setLaunchForm({ ...launchForm, headline: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Subtítulo Explicativo
          </label>
          <textarea
            rows={2}
            value={launchForm.subheadline}
            onChange={(e) => setLaunchForm({ ...launchForm, subheadline: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp Comercial (DDD + Número)
            </label>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="text"
                value={launchForm.whatsappNumber}
                onChange={(e) => setLaunchForm({ ...launchForm, whatsappNumber: e.target.value })}
                placeholder="75999990000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Texto do Botão WhatsApp
            </label>
            <input
              type="text"
              value={launchForm.secondaryCtaText}
              onChange={(e) => setLaunchForm({ ...launchForm, secondaryCtaText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nota de Garantia / Sem Fidelidade
            </label>
            <input
              type="text"
              value={launchForm.guaranteeNote}
              onChange={(e) => setLaunchForm({ ...launchForm, guaranteeNote: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Mensagem Automática para WhatsApp
          </label>
          <input
            type="text"
            value={launchForm.whatsappMessage}
            onChange={(e) => setLaunchForm({ ...launchForm, whatsappMessage: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
          />
        </div>

        {/* Editor Dinâmico de Benefícios */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Benefícios e Argumentos de Venda ({launchForm.benefits.length})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize cada bloco de vantagens exibido na página de lançamento.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddBenefit}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Benefício</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={launchForm.benefitsTitle}
              onChange={(e) => setLaunchForm({ ...launchForm, benefitsTitle: e.target.value })}
              placeholder="Título da seção de benefícios"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-semibold"
            />
            <input
              type="text"
              value={launchForm.benefitsSubtitle}
              onChange={(e) => setLaunchForm({ ...launchForm, benefitsSubtitle: e.target.value })}
              placeholder="Subtítulo da seção de benefícios"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {launchForm.benefits.map((benefit, index) => (
              <div
                key={benefit.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400 font-mono">
                    Benefício {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteBenefit(benefit.id)}
                    className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="Remover benefício"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={benefit.highlightMetric || ''}
                    onChange={(e) =>
                      handleUpdateBenefit(benefit.id, 'highlightMetric', e.target.value)
                    }
                    placeholder="Destaque (ex: 0% de Taxa)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <input
                    type="text"
                    value={benefit.title}
                    onChange={(e) => handleUpdateBenefit(benefit.id, 'title', e.target.value)}
                    placeholder="Título do benefício"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>

                <textarea
                  rows={2}
                  value={benefit.description}
                  onChange={(e) => handleUpdateBenefit(benefit.id, 'description', e.target.value)}
                  placeholder="Descrição persuasiva"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Página de Lançamento</span>
          </button>
        </div>
      </form>

      {/* 3. Editor da Página de Manutenção */}
      <form
        onSubmit={handleSaveMaintenance}
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                Configurações da Página de Manutenção
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure o cronômetro de retorno, texto informativo e botão de cadastro de lojistas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              updateMaintenanceConfig(maintenanceForm);
              setAdminPreviewMode('maintenance');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Pré-visualizar Manutenção</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Previsão de Retorno (Data e Hora do Timer)
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="datetime-local"
                value={maintenanceForm.targetDateIso.slice(0, 16)}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, targetDateIso: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { label: '+1 hora', hours: 1 },
                { label: '+3 horas', hours: 3 },
                { label: '+12 horas', hours: 12 },
                { label: '+24 horas', hours: 24 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      targetDateIso: addQuickOffsetToIso(preset.hours),
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Rótulo de Aviso
            </label>
            <input
              type="text"
              value={maintenanceForm.badgeLabel}
              onChange={(e) =>
                setMaintenanceForm({ ...maintenanceForm, badgeLabel: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Título da Manutenção
          </label>
          <input
            type="text"
            value={maintenanceForm.headline}
            onChange={(e) =>
              setMaintenanceForm({ ...maintenanceForm, headline: e.target.value })
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Texto de Descrição da Manutenção
          </label>
          <textarea
            rows={3}
            value={maintenanceForm.description}
            onChange={(e) =>
              setMaintenanceForm({ ...maintenanceForm, description: e.target.value })
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Texto do Botão de Cadastro
            </label>
            <input
              type="text"
              value={maintenanceForm.ctaText}
              onChange={(e) =>
                setMaintenanceForm({ ...maintenanceForm, ctaText: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp de Suporte (DDD + Número)
            </label>
            <input
              type="text"
              value={maintenanceForm.whatsappNumber}
              onChange={(e) =>
                setMaintenanceForm({ ...maintenanceForm, whatsappNumber: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={maintenanceForm.showWhatsappButton}
            onChange={(e) =>
              setMaintenanceForm({ ...maintenanceForm, showWhatsappButton: e.target.checked })
            }
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Exibir botão secundário de suporte via WhatsApp na página de manutenção</span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Página de Manutenção</span>
          </button>
        </div>
      </form>
    </div>
  );
};
