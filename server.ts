import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  isDatabaseConfigured,
  getPool,
  closePool,
  ensureDatabaseSchema,
  isSeedCompleted,
  readAllDirectoryData,
  seedInitialDirectoryIfEmpty,
  syncCollection,
  upsertSetting,
  incrementBannerClicksDb,
} from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'));

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (err) {
  console.warn('Could not pre-create uploads directory:', err);
}

app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));

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

app.post('/api/uploads', async (req, res) => {
  try {
    const { dataUrl, filename } = req.body as { dataUrl?: string; filename?: string };
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ success: false, error: 'Imagem inválida.' });
      return;
    }

    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/i);
    if (!match) {
      res.status(400).json({ success: false, error: 'Formato de imagem não suportado.' });
      return;
    }

    const rawType = match[1].toLowerCase();
    const ext = rawType === 'jpeg' ? 'jpg' : rawType === 'svg+xml' ? 'svg' : rawType;
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 8 * 1024 * 1024) {
      res.status(413).json({ success: false, error: 'A imagem excede o limite de 8MB.' });
      return;
    }

    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    const safeSlug = (filename || 'img')
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'img';
    const fileName = `${Date.now()}-${safeSlug}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, fileName);

    await fs.promises.writeFile(targetPath, buffer);
    res.json({ success: true, url: `/uploads/${fileName}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao salvar imagem no servidor.';
    res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/bootstrap', async (_req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ databaseEnabled: false, seeded: false });
    return;
  }

  try {
    await ensureDatabaseSchema();
    const seeded = await isSeedCompleted();
    if (!seeded) {
      res.json({ databaseEnabled: true, seeded: false });
      return;
    }
    const data = await readAllDirectoryData();
    res.json({ databaseEnabled: true, seeded: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database bootstrap error.';
    console.error('Error in /api/bootstrap:', message);
    res.status(500).json({ databaseEnabled: true, seeded: false, error: message });
  }
});

app.post('/api/bootstrap/seed', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ databaseEnabled: false, seeded: false });
    return;
  }

  try {
    const result = await seedInitialDirectoryIfEmpty(req.body, false);
    res.json({ databaseEnabled: true, seeded: true, seededNow: result.seededNow, data: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database seed error.';
    console.error('Error in /api/bootstrap/seed:', message);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/bootstrap/reset', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ databaseEnabled: false, reset: false });
    return;
  }

  try {
    const result = await seedInitialDirectoryIfEmpty(req.body, true);
    res.json({ databaseEnabled: true, reset: true, data: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database reset error.';
    console.error('Error in /api/bootstrap/reset:', message);
    res.status(500).json({ success: false, error: message });
  }
});

app.put('/api/sync/:collection', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    const { collection } = req.params;
    const { items } = req.body as { items?: any[] };
    await syncCollection(collection, Array.isArray(items) ? items : []);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database sync error.';
    console.error(`Error syncing collection ${req.params.collection}:`, message);
    res.status(500).json({ success: false, error: message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    const { key } = req.params;
    const { value } = req.body as { value?: any };
    await upsertSetting(key, value);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Settings sync error.';
    console.error(`Error saving setting ${req.params.key}:`, message);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/banners/:id/click', async (req, res) => {
  if (!isDatabaseConfigured()) {
    res.json({ success: true, databaseEnabled: false });
    return;
  }

  try {
    await incrementBannerClicksDb(req.params.id);
    res.json({ success: true, databaseEnabled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Banner click error.';
    res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/health', async (_req, res) => {
  let database: 'connected' | 'not_configured' | 'error' = 'not_configured';
  if (isDatabaseConfigured()) {
    try {
      const dbPool = getPool();
      if (dbPool) {
        await dbPool.query('SELECT 1');
        database = 'connected';
      }
    } catch {
      database = 'error';
    }
  }
  res.status(200).json({ status: 'ok', database });
});

async function startServer() {
  if (isDatabaseConfigured()) {
    ensureDatabaseSchema()
      .then(() => console.log('MySQL/MariaDB schema verified successfully.'))
      .catch((err) => console.error('Initial DB connection check failed (will retry on request):', err?.message || err));
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`achenacidade server running on http://0.0.0.0:${PORT}`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down achenacidade server gracefully...`);
    server.close(async () => {
      try {
        await closePool();
      } catch {
        // Ignore pool close errors on exit
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer();
