import type { EmailLogEntry, EmailTemplate, EmailTemplateKey, SmtpConfig } from '../types';

export function interpolateEmailVariables(
  templateText: string,
  variables: Record<string, string>
): string {
  return templateText.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
  });
}

export function buildStyledEmailHtml(params: {
  heading: string;
  body: string;
  buttonText?: string;
  actionUrl?: string;
  footerNote?: string;
  highlightCode?: string;
}): string {
  const escapedBody = params.body
    .split('\n')
    .map((line) => line.trim())
    .map((line) =>
      line
        ? `<p style="margin:0 0 12px 0;color:#334155;font-size:15px;line-height:1.6;">${line}</p>`
        : '<div style="height:8px;"></div>'
    )
    .join('');

  const codeBlock = params.highlightCode
    ? `<div style="margin:24px 0;padding:18px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center;">
         <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#1d4ed8;margin-bottom:6px;">Código de Validação</div>
         <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;">${params.highlightCode}</div>
       </div>`
    : '';

  const buttonBlock =
    params.buttonText && params.actionUrl
      ? `<div style="margin:26px 0;text-align:center;">
           <a href="${params.actionUrl}" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#ea580c;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;">
             ${params.buttonText}
           </a>
           <div style="margin-top:10px;font-size:11px;color:#64748b;word-break:break-all;">
             Ou acesse o link: <a href="${params.actionUrl}" style="color:#1d4ed8;">${params.actionUrl}</a>
           </div>
         </div>`
      : '';

  const footerBlock = params.footerNote
    ? `<div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
         ${params.footerNote}
       </div>`
    : '';

  return `
  <div style="font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;padding:32px 16px;">
    <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);padding:24px 28px;color:#ffffff;">
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.4px;">
          achena<span style="color:#fb923c;">cidade</span>
        </div>
        <div style="font-size:12px;color:#bfdbfe;margin-top:4px;">Guia Comercial · Alagoinhas - BA</div>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
          ${params.heading}
        </h1>
        ${escapedBody}
        ${codeBlock}
        ${buttonBlock}
        ${footerBlock}
      </div>
    </div>
  </div>`;
}

export async function dispatchTransactionalEmail(params: {
  template: EmailTemplate;
  templateKey: EmailTemplateKey | 'test';
  to: string;
  variables: Record<string, string>;
  smtpConfig: SmtpConfig;
  actionUrl?: string;
  highlightCode?: string;
}): Promise<{ logEntry: EmailLogEntry; deliveredViaSmtp: boolean; error?: string }> {
  const subject = interpolateEmailVariables(params.template.subject, params.variables);
  const heading = interpolateEmailVariables(params.template.heading, params.variables);
  const body = interpolateEmailVariables(params.template.body, params.variables);
  const buttonText = interpolateEmailVariables(params.template.buttonText, params.variables);
  const footerNote = interpolateEmailVariables(params.template.footerNote, params.variables);

  const htmlBody = buildStyledEmailHtml({
    heading,
    body,
    buttonText,
    actionUrl: params.actionUrl,
    footerNote,
    highlightCode: params.highlightCode,
  });

  const textBody = [
    heading,
    '',
    body,
    params.highlightCode ? `Código: ${params.highlightCode}` : '',
    params.actionUrl ? `${buttonText || 'Acessar'}: ${params.actionUrl}` : '',
    '',
    footerNote,
  ]
    .filter(Boolean)
    .join('\n');

  let deliveryMode: 'smtp' | 'local_fallback' = 'local_fallback';
  let status: 'sent' | 'failed' = 'sent';
  let errorMessage: string | undefined;

  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.to,
        subject,
        html: htmlBody,
        text: textBody,
        smtp: params.smtpConfig,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      deliveryMode = data.deliveryMode === 'smtp' ? 'smtp' : 'local_fallback';
      if (data.success === false && data.error) {
        errorMessage = data.error;
        if (!params.smtpConfig.allowLocalFallback) {
          status = 'failed';
        }
      }
    } else {
      errorMessage = `HTTP ${response.status}`;
      if (!params.smtpConfig.allowLocalFallback) {
        status = 'failed';
      }
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Servidor indisponível';
    if (!params.smtpConfig.allowLocalFallback) {
      status = 'failed';
    }
  }

  const now = new Date();
  const logEntry: EmailLogEntry = {
    id: `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    to: params.to,
    templateKey: params.templateKey,
    templateName: params.template.name,
    subject,
    htmlBody,
    textBody,
    verificationCode: params.highlightCode,
    paymentUrl: params.templateKey === 'payment_link' ? params.actionUrl : undefined,
    deliveryMode,
    status,
    errorMessage,
    createdAt: `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`,
  };

  return {
    logEntry,
    deliveredViaSmtp: deliveryMode === 'smtp' && status === 'sent',
    error: errorMessage,
  };
}

export async function testSmtpConnection(params: {
  to?: string;
  smtpConfig: SmtpConfig;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/email/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.to,
        smtp: params.smtpConfig,
      }),
    });
    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message || data.error || 'Resposta recebida do servidor.',
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Não foi possível conectar ao servidor SMTP.',
    };
  }
}
