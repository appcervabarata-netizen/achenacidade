import React, { useEffect, useState } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { EmailLogEntry, EmailTemplateKey } from '../../types';
import {
  buildStyledEmailHtml,
  interpolateEmailVariables,
  testSmtpConnection,
} from '../../utils/emailService';
import {
  Mail,
  Server,
  FileEdit,
  Inbox,
  CheckCircle2,
  AlertCircle,
  Send,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';

export const AdminEmailTab: React.FC = () => {
  const {
    smtpConfig,
    updateSmtpConfig,
    emailTemplates,
    updateEmailTemplate,
    resetEmailTemplates,
    emailLogs,
    clearEmailLogs,
  } = useDirectory();

  const [subTab, setSubTab] = useState<'templates' | 'smtp' | 'outbox'>('templates');
  const [selectedKey, setSelectedKey] = useState<EmailTemplateKey>('email_verification');
  const [templateDraft, setTemplateDraft] = useState(emailTemplates[selectedKey]);
  const [smtpDraft, setSmtpDraft] = useState(smtpConfig);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'ok' | 'err'; msg: string }>({
    status: 'idle',
    msg: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [envSmtpInfo, setEnvSmtpInfo] = useState<{ hasEnvSmtp: boolean; envSenderEmail?: string }>({
    hasEnvSmtp: false,
  });
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [previewLog, setPreviewLog] = useState<EmailLogEntry | null>(null);

  useEffect(() => {
    setTemplateDraft(emailTemplates[selectedKey]);
  }, [selectedKey, emailTemplates]);

  useEffect(() => {
    setSmtpDraft(smtpConfig);
  }, [smtpConfig]);

  useEffect(() => {
    fetch('/api/email/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setEnvSmtpInfo(data);
      })
      .catch(() => {});
  }, []);

  const showNotice = (msg: string) => {
    setSaveToast(msg);
    window.setTimeout(() => setSaveToast(null), 3500);
  };

  const sampleVariables: Record<string, string> = {
    '{{codigo}}': '482915',
    '{{nome_empresa}}': 'Ateliê Dendê Alagoinhas',
    '{{cidade}}': 'Alagoinhas - BA',
    '{{nome_plano}}': 'Destaque Ouro',
    '{{valor_plano}}': 'R$ 99,90',
    '{{link_pagamento}}': 'https://achenacidade.com.br/?checkout=1&businessId=biz-demo&planId=plan-3',
    '{{email_login}}': 'contato@ateliedende.com.br',
    '{{link_painel}}': 'https://achenacidade.com.br/?painel=1&businessId=biz-demo',
    '{{valor_pago}}': 'R$ 99,90',
    '{{metodo_pagamento}}': 'PIX',
    '{{id_transacao}}': 'MP-9482018471',
  };

  const plainSampleVars: Record<string, string> = Object.fromEntries(
    Object.entries(sampleVariables).map(([k, v]) => [k.replace(/[{}]/g, ''), v])
  );

  const previewHtml = buildStyledEmailHtml({
    heading: interpolateEmailVariables(templateDraft.heading, plainSampleVars),
    body: interpolateEmailVariables(templateDraft.body, plainSampleVars),
    buttonText: interpolateEmailVariables(templateDraft.buttonText, plainSampleVars),
    actionUrl:
      selectedKey === 'payment_link'
        ? plainSampleVars.link_pagamento
        : selectedKey === 'welcome' || selectedKey === 'payment_approved'
        ? plainSampleVars.link_painel
        : undefined,
    footerNote: interpolateEmailVariables(templateDraft.footerNote, plainSampleVars),
    highlightCode: selectedKey === 'email_verification' ? '482915' : undefined,
  });

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailTemplate(selectedKey, templateDraft);
    showNotice(`Modelo "${templateDraft.name}" atualizado com sucesso.`);
  };

  const handleInsertVariable = (varToken: string) => {
    setTemplateDraft((prev) => ({
      ...prev,
      body: prev.body ? `${prev.body} ${varToken}` : varToken,
    }));
  };

  const normalizeHostInput = (raw: string) =>
    raw
      .trim()
      .replace(/^(https?|smtps?):\/\//i, '')
      .split('/')[0]
      .split('?')[0]
      .replace(/:\d+$/, '')
      .trim();

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = { ...smtpDraft, host: normalizeHostInput(smtpDraft.host) };
    setSmtpDraft(sanitized);
    updateSmtpConfig(sanitized);
    showNotice('Configurações de SMTP e remetente salvas.');
  };

  const handleRunSmtpTest = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle', msg: '' });
    const sanitized = { ...smtpDraft, host: normalizeHostInput(smtpDraft.host) };
    setSmtpDraft(sanitized);
    updateSmtpConfig(sanitized);
    const res = await testSmtpConnection({
      to: testRecipient.trim() || undefined,
      smtpConfig: sanitized,
    });
    setTestResult({
      status: res.success ? 'ok' : 'err',
      msg: res.message,
    });
    setIsTesting(false);
  };

  const templateKeys: EmailTemplateKey[] = [
    'email_verification',
    'payment_link',
    'welcome',
    'payment_approved',
  ];

  return (
    <div className="space-y-6">
      {saveToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setSubTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            subTab === 'templates'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Modelos Editáveis (4)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('smtp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            subTab === 'smtp'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Configuração SMTP</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('outbox')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            subTab === 'outbox'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Caixa de Saída ({emailLogs.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: 4 EDITABLE TEMPLATES */}
      {subTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {templateKeys.map((key) => {
              const tpl = emailTemplates[key];
              const isSelected = selectedKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Mail className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-blue-600'}`} />
                    <span
                      className={`text-[10px] font-bold ${
                        tpl.enabled ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {tpl.enabled ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                    {tpl.name}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form */}
            <form
              onSubmit={handleSaveTemplate}
              className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {templateDraft.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{templateDraft.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetEmailTemplates();
                    showNotice('Todos os modelos restaurados para o texto padrão.');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Padrão</span>
                </button>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templateDraft.enabled}
                  onChange={(e) =>
                    setTemplateDraft({ ...templateDraft, enabled: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Ativar envio automático deste modelo</span>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assunto do E-mail
                </label>
                <input
                  type="text"
                  value={templateDraft.subject}
                  onChange={(e) =>
                    setTemplateDraft({ ...templateDraft, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título Interno de Destaque
                </label>
                <input
                  type="text"
                  value={templateDraft.heading}
                  onChange={(e) =>
                    setTemplateDraft({ ...templateDraft, heading: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Texto do E-mail
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Clique para inserir variável:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {templateDraft.availableVariables.map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => handleInsertVariable(token)}
                      className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-mono cursor-pointer hover:bg-blue-100"
                    >
                      {token}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={5}
                  value={templateDraft.body}
                  onChange={(e) => setTemplateDraft({ ...templateDraft, body: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm leading-relaxed"
                />
              </div>

              {selectedKey !== 'email_verification' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Texto do Botão de Ação
                  </label>
                  <input
                    type="text"
                    value={templateDraft.buttonText}
                    onChange={(e) =>
                      setTemplateDraft({ ...templateDraft, buttonText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rodapé / Observação
                </label>
                <input
                  type="text"
                  value={templateDraft.footerNote}
                  onChange={(e) =>
                    setTemplateDraft({ ...templateDraft, footerNote: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Texto deste Modelo</span>
              </button>
            </form>

            {/* Live HTML Preview */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pré-visualização do E-mail
                </span>
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                  Assunto: {interpolateEmailVariables(templateDraft.subject, plainSampleVars)}
                </span>
              </div>

              <div
                className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 max-h-[540px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SMTP CONFIGURATION */}
      {subTab === 'smtp' && (
        <form
          onSubmit={handleSaveSmtp}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                Servidor SMTP para Envios Reais
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure um servidor SMTP (HostGator, Gmail, Zoho, Brevo ou Resend) ou use variáveis de ambiente no servidor.
              </p>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-lg ${
                envSmtpInfo.hasEnvSmtp || (smtpDraft.enabled && smtpDraft.host && smtpDraft.user)
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              {smtpDraft.enabled && smtpDraft.host && smtpDraft.user
                ? 'SMTP Configurado no Painel'
                : envSmtpInfo.hasEnvSmtp
                ? `SMTP via Servidor (${envSmtpInfo.envSenderEmail})`
                : 'Modo Teste Local (Caixa de Saída)'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={smtpDraft.enabled}
                onChange={(e) => setSmtpDraft({ ...smtpDraft, enabled: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Ativar envio SMTP personalizado abaixo</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={smtpDraft.allowLocalFallback}
                onChange={(e) =>
                  setSmtpDraft({ ...smtpDraft, allowLocalFallback: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Registrar na Caixa de Saída de testes se SMTP não estiver configurado</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Remetente
              </label>
              <input
                type="text"
                value={smtpDraft.senderName}
                onChange={(e) => setSmtpDraft({ ...smtpDraft, senderName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                E-mail Remetente
              </label>
              <input
                type="email"
                value={smtpDraft.senderEmail}
                onChange={(e) => setSmtpDraft({ ...smtpDraft, senderEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                E-mail para Resposta (Reply-To)
              </label>
              <input
                type="email"
                value={smtpDraft.replyToEmail}
                onChange={(e) => setSmtpDraft({ ...smtpDraft, replyToEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Host SMTP
              </label>
              <input
                type="text"
                value={smtpDraft.host}
                onChange={(e) => setSmtpDraft({ ...smtpDraft, host: e.target.value })}
                onBlur={(e) =>
                  setSmtpDraft((prev) => ({ ...prev, host: normalizeHostInput(e.target.value) }))
                }
                placeholder="mail.achenacidade.com.br (sem https://)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Informe apenas o domínio (ex: mail.achenacidade.com.br), sem https:// ou barra final.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Porta
              </label>
              <input
                type="number"
                value={smtpDraft.port}
                onChange={(e) =>
                  setSmtpDraft({ ...smtpDraft, port: Number(e.target.value) || 587 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-mono"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtpDraft.secure}
                  onChange={(e) => setSmtpDraft({ ...smtpDraft, secure: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>SSL/TLS (Porta 465)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Usuário SMTP
              </label>
              <input
                type="text"
                value={smtpDraft.user}
                onChange={(e) => setSmtpDraft({ ...smtpDraft, user: e.target.value })}
                placeholder="seu-email@seudominio.com.br"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Senha / App Password SMTP
              </label>
              <div className="relative flex items-center">
                <input
                  type={showSmtpPass ? 'text' : 'password'}
                  value={smtpDraft.pass}
                  onChange={(e) => setSmtpDraft({ ...smtpDraft, pass: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass((v) => !v)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Connection */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Testar Autenticação & Envio Real
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="E-mail opcional para receber o teste (ex: voce@gmail.com)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm"
              />
              <button
                type="button"
                disabled={isTesting}
                onClick={handleRunSmtpTest}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-orange-400" />
                <span>{isTesting ? 'Testando...' : 'Testar Conexão SMTP'}</span>
              </button>
            </div>

            {testResult.status !== 'idle' && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                  testResult.status === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {testResult.status === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configuração SMTP</span>
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 3: OUTBOX / EMAIL LOGS */}
      {subTab === 'outbox' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                Caixa de Saída & Histórico de E-mails
              </h3>
              <p className="text-xs text-slate-500">
                Audite códigos de 6 dígitos, links de pagamento e comprovantes gerados pelo sistema.
              </p>
            </div>

            {emailLogs.length > 0 && (
              <button
                type="button"
                onClick={clearEmailLogs}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico</span>
              </button>
            )}
          </div>

          {emailLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Nenhum e-mail registrado ainda. Faça um teste enviando o código de validação no formulário de cadastro.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {emailLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-bold ${
                          entry.deliveryMode === 'smtp'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {entry.deliveryMode === 'smtp' ? 'SMTP Real' : 'Caixa de Teste'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {entry.templateName}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono tabular-nums text-slate-400">{entry.createdAt}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {entry.subject}
                    </p>
                    <p className="text-xs text-slate-500">
                      Para: <span className="font-medium text-slate-700 dark:text-slate-300">{entry.to}</span>
                      {entry.verificationCode && (
                        <>
                          {' '}
                          · Código: <strong className="font-mono text-orange-600">{entry.verificationCode}</strong>
                        </>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewLog(entry)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Visualizar E-mail</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Log Inspector Modal */}
      {previewLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setPreviewLog(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">Para: {previewLog.to}</p>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {previewLog.subject}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewLog.paymentUrl && (
              <div className="px-5 py-2.5 bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200 dark:border-orange-900 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-orange-800 dark:text-orange-300 truncate">
                  Link de Pagamento: {previewLog.paymentUrl}
                </span>
                <a
                  href={previewLog.paymentUrl}
                  className="font-bold text-orange-700 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Abrir Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div
              className="flex-1 overflow-y-auto bg-slate-100 p-4"
              dangerouslySetInnerHTML={{ __html: previewLog.htmlBody }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
