import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '2mb' }));

interface IncomingSmtpConfig {
  enabled?: boolean;
  senderName?: string;
  senderEmail?: string;
  replyToEmail?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

function resolveSmtpTransportConfig(clientSmtp?: IncomingSmtpConfig) {
  const clientHasCreds = Boolean(
    clientSmtp?.enabled && clientSmtp.host?.trim() && clientSmtp.user?.trim() && clientSmtp.pass?.trim()
  );

  if (clientHasCreds && clientSmtp) {
    return {
      source: 'admin_panel' as const,
      host: clientSmtp.host!.trim(),
      port: Number(clientSmtp.port || 587),
      secure: Boolean(clientSmtp.secure),
      auth: {
        user: clientSmtp.user!.trim(),
        pass: clientSmtp.pass!.trim(),
      },
      from: `"${clientSmtp.senderName || 'achenacidade'}" <${clientSmtp.senderEmail || clientSmtp.user!.trim()}>`,
      replyTo: clientSmtp.replyToEmail || clientSmtp.senderEmail || clientSmtp.user!.trim(),
    };
  }

  const envHasCreds = Boolean(
    process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  );

  if (envHasCreds) {
    return {
      source: 'env' as const,
      host: process.env.SMTP_HOST!.trim(),
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.trim(),
      },
      from: process.env.SMTP_FROM || `"achenacidade" <${process.env.SMTP_USER!.trim()}>`,
      replyTo: clientSmtp?.replyToEmail || process.env.SMTP_USER!.trim(),
    };
  }

  return null;
}

app.get('/api/email/status', (_req, res) => {
  const hasEnvSmtp = Boolean(
    process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  );
  res.json({
    hasEnvSmtp,
    envSenderEmail: hasEnvSmtp ? process.env.SMTP_USER : undefined,
  });
});

app.post('/api/email/send', async (req, res) => {
  const { to, subject, html, text, smtp } = req.body as {
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
    smtp?: IncomingSmtpConfig;
  };

  if (!to || !subject) {
    res.status(400).json({ success: false, error: 'Destinatário e assunto são obrigatórios.' });
    return;
  }

  const resolved = resolveSmtpTransportConfig(smtp);
  if (!resolved) {
    res.json({
      success: true,
      deliveryMode: 'local_fallback',
      message: 'SMTP não configurado no momento; cópia registrada na Caixa de Saída de testes.',
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: resolved.host,
      port: resolved.port,
      secure: resolved.secure,
      auth: resolved.auth,
    });

    const info = await transporter.sendMail({
      from: resolved.from,
      replyTo: resolved.replyTo,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    });

    res.json({
      success: true,
      deliveryMode: 'smtp',
      messageId: info.messageId,
      source: resolved.source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao enviar via SMTP.';
    res.json({
      success: false,
      deliveryMode: 'local_fallback',
      error: message,
    });
  }
});

app.post('/api/email/test-smtp', async (req, res) => {
  const { to, smtp } = req.body as {
    to?: string;
    smtp?: IncomingSmtpConfig;
  };

  const resolved = resolveSmtpTransportConfig(smtp);
  if (!resolved) {
    res.status(400).json({
      success: false,
      error: 'Preencha Host, Usuário e Senha SMTP (ou configure as variáveis SMTP_* no servidor) antes de testar.',
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: resolved.host,
      port: resolved.port,
      secure: resolved.secure,
      auth: resolved.auth,
    });

    await transporter.verify();

    if (to && to.trim()) {
      await transporter.sendMail({
        from: resolved.from,
        replyTo: resolved.replyTo,
        to: to.trim(),
        subject: 'Teste de Conexão SMTP — achenacidade',
        text: 'Sua configuração SMTP do achenacidade está funcionando corretamente!',
        html: '<div style="font-family:sans-serif;padding:24px;background:#f8fafc;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;"><h2 style="color:#1d4ed8;margin-top:0;">Conexão SMTP Validada!</h2><p style="color:#334155;font-size:14px;line-height:1.6;">O envio de e-mails transacionais do <strong>achenacidade</strong> foi autenticado com sucesso neste servidor SMTP.</p></div></div>',
      });
    }

    res.json({
      success: true,
      message: to?.trim()
        ? `Conexão SMTP verificada e e-mail de teste enviado para ${to.trim()}!`
        : 'Conexão SMTP autenticada com sucesso!',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao autenticar no servidor SMTP.';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`achenacidade server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
