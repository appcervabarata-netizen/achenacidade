import React, { useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { ArrowLeft, Image as ImageIcon, Sparkles, CreditCard, CheckCircle, AlertCircle, Building2, MapPin } from 'lucide-react';
import { ImageUploadField } from '../common/ImageUploadField';
import { formatBRL } from '../../utils/planPricing';

export const BannerAdPage: React.FC = () => {
  const {
    cities,
    bannerPlans,
    addMerchantBanner,
    setCurrentView,
  } = useDirectory();

  const activeCities = cities.filter((c) => c.isActive);

  const [form, setForm] = useState({
    title: '',
    advertiserName: '',
    whatsapp: '',
    linkUrl: '#produtos',
    position: 'top' as 'top' | 'bottom' | 'rotating_header',
    cityId: 'all',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=300&fit=crop&q=80',
    selectedPlanId: bannerPlans[0]?.id || '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlan = bannerPlans.find((p) => p.id === form.selectedPlanId) || bannerPlans[0];
  const priceToPay = selectedPlan ? selectedPlan.price : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!form.imageUrl.trim()) {
      setErrorMsg('Por favor, selecione ou informe a imagem do banner.');
      return;
    }
    if (!form.title.trim()) {
      setErrorMsg('Informe o nome / título do banner.');
      return;
    }
    if (!form.advertiserName.trim()) {
      setErrorMsg('Informe o nome do cliente / anunciante.');
      return;
    }
    if (!form.whatsapp.trim()) {
      setErrorMsg('Informe o número do WhatsApp para contato.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = addMerchantBanner({
        title: form.title.trim(),
        tagline: `Anúncio verificado · ${selectedPlan ? selectedPlan.name : 'Plano de Banner'}`,
        position: form.position,
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim() || '#produtos',
        advertiserName: form.advertiserName.trim(),
        cityId: form.cityId,
        priceMonthly: priceToPay,
        badgeText: selectedPlan ? selectedPlan.name : 'Destaque',
      });

      setIsSubmitting(false);
      if (res.success) {
        setSuccessMsg(
          `Banner pré-cadastrado com sucesso! Valor de ${formatBRL(priceToPay)}. PIX gerado para ativação imediata.`
        );
        setTimeout(() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 2500);
      } else {
        setErrorMsg(res.error || 'Não foi possível cadastrar o banner.');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="achenacidade" className="w-8 h-8 object-contain rounded-full bg-white shadow-xs" />
          <span className="font-extrabold text-slate-900 dark:text-white font-display text-sm sm:text-base">
            achena<span className="text-orange-600">cidade</span>
          </span>
        </div>

        <div className="w-24" />
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-bold mb-2 border border-orange-200 dark:border-orange-900">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Publicidade Rotativa em Destaque</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            Anuncie na Sua Cidade
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Alcance milhares de pessoas na sua região com banners em alta visibilidade no portal.
          </p>
        </div>

        {errorMsg && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
          
          {/* Left Column: Pré-cadastro do Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <span>Pré-cadastro do Banner</span>
              </h2>
            </div>

            {/* Imagem do Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Imagem do Banner <span className="text-rose-500">*</span>
              </label>
              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="Selecionar Foto do Banner"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Recomendado: 1200x300px (Proporção horizontal 4:1)</span>
            </div>

            {/* Nome do Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Banner / Título <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Super Promoção de Inauguração"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Cliente / Empresa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.advertiserName}
                onChange={(e) => setForm({ ...form, advertiserName: e.target.value })}
                placeholder="Ex: Loja Modelo Alagoinhas"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                WhatsApp (só números) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })}
                placeholder="75999887766"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Posicionamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Posição de Exibição
                </label>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="top">Topo da Página Inicial</option>
                  <option value="rotating_header">Cabeçalho Rotativo (Slider)</option>
                  <option value="bottom">Rodapé / Seção Inferior</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cidade Alvo
                </label>
                <select
                  value={form.cityId}
                  onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="all">Todas as Cidades</option>
                  {activeCities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} - {c.state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Escolha seu Plano & Total a Pagar */}
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Escolha seu Plano</span>
                </h2>
              </div>

              <div className="space-y-3">
                {bannerPlans.map((plan) => {
                  const isSelected = form.selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setForm({ ...form, selectedPlanId: plan.id })}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {plan.name}
                          </span>
                          {plan.highlighted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Destaque
                            </span>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {plan.description}
                          </p>
                        )}
                        {plan.viewsLimit && (
                          <span className="inline-block mt-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            Até {plan.viewsLimit.toLocaleString()} visualizações estimadas
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                          {formatBRL(plan.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total to Pay Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total a Pagar
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {formatBRL(priceToPay)}
              </div>
              <p className="text-xs text-slate-500">
                {selectedPlan ? `Plano selecionado: ${selectedPlan.name}` : 'Nenhum plano selecionado'}
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-60"
              >
                <CreditCard className="w-5 h-5" />
                <span>{isSubmitting ? 'Gerando PIX...' : 'Gerar PIX e Ativar Anúncio'}</span>
              </button>
            </div>

          </div>

        </form>
      </main>
    </div>
  );
};
