import crypto from 'crypto';
import mysql from 'mysql2/promise';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

export const DEFAULT_ADMIN_EMAIL = 'vital.crispiniano@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'Vitor2027cidade';

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function isPasswordHashed(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('scrypt$');
}

export function verifyPassword(plain: string, stored: unknown): boolean {
  if (!plain || typeof stored !== 'string' || !stored) return false;
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    try {
      const actualBuf = crypto.scryptSync(plain, salt, 64);
      const expectedBuf = Buffer.from(expectedHex, 'hex');
      if (actualBuf.length !== expectedBuf.length) return false;
      return crypto.timingSafeEqual(actualBuf, expectedBuf);
    } catch {
      return false;
    }
  }
  const a = Buffer.from(plain, 'utf8');
  const b = Buffer.from(stored, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hashIfPresent(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str) return null;
  return isPasswordHashed(str) ? str : hashPassword(str);
}

export interface DbRuntimeConfig {
  configured: boolean;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  uri?: string;
  ssl?: boolean;
}

let pool: Pool | null = null;
let schemaInitialized = false;
let schemaPromise: Promise<boolean> | null = null;

export function getDbConfig(): DbRuntimeConfig {
  const uri = process.env.DATABASE_URL?.trim();
  if (uri && (uri.startsWith('mysql://') || uri.startsWith('mariadb://'))) {
    return {
      configured: true,
      uri,
      ssl: process.env.DB_SSL === 'true',
    };
  }

  const host = (process.env.DB_HOST || process.env.MYSQL_HOST || '').trim();
  const database = (process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE || '').trim();
  const user = (process.env.DB_USER || process.env.MYSQL_USER || '').trim();
  const password = process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? '';
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);

  if (host && database && user) {
    return {
      configured: true,
      host,
      port,
      database,
      user,
      password,
      ssl: process.env.DB_SSL === 'true',
    };
  }

  return { configured: false };
}

export function isDatabaseConfigured(): boolean {
  return getDbConfig().configured;
}

export function getPool(): Pool | null {
  const cfg = getDbConfig();
  if (!cfg.configured) return null;

  if (!pool) {
    if (cfg.uri) {
      pool = mysql.createPool({
        uri: cfg.uri,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 8000,
        enableKeepAlive: true,
        charset: 'utf8mb4',
        ...(cfg.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
      });
    } else {
      pool = mysql.createPool({
        host: cfg.host,
        port: cfg.port || 3306,
        database: cfg.database,
        user: cfg.user,
        password: cfg.password || '',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 8000,
        enableKeepAlive: true,
        charset: 'utf8mb4',
        ...(cfg.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
      });
    }
  }

  return pool;
}

export function isTransientConnectionError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code || '';
  const msg = err instanceof Error ? err.message : String(err || '');
  return (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    /ECONNREFUSED|ETIMEDOUT|PROTOCOL_CONNECTION_LOST|Connection lost/i.test(msg)
  );
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    schemaInitialized = false;
    schemaPromise = null;
  }
}

function parseJsonColumn<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

let lastMigratedColumns: string[] = [];
let lastDroppedLegacyTables: string[] = [];

export const LEGACY_PORTUGUESE_TABLES = [
  'pagamentos',
  'categorias_produtos_loja',
  'servicos',
  'produtos',
  'empresas',
  'planos',
  'categorias',
  'cidades',
  'usuarios',
  'configuracoes',
  'sessoes',
  'anuncios',
];

const EXPECTED_TABLE_COLUMNS: Record<string, Array<{ name: string; definition: string }>> = {
  app_meta: [
    { name: 'meta_value', definition: "VARCHAR(500) NOT NULL DEFAULT ''" },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  admin_users: [
    { name: 'email', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT 'Administrador Master'" },
    { name: 'password_hash', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'role', definition: "VARCHAR(32) NOT NULL DEFAULT 'admin'" },
    { name: 'is_active', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'last_login_at', definition: 'VARCHAR(64) NULL' },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'created_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  auth_sessions: [
    { name: 'role', definition: "VARCHAR(32) NOT NULL DEFAULT 'business'" },
    { name: 'user_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'email', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'business_id', definition: 'VARCHAR(120) NULL' },
    { name: 'ip_address', definition: 'VARCHAR(120) NULL' },
    { name: 'user_agent', definition: 'VARCHAR(500) NULL' },
    { name: 'created_at', definition: 'BIGINT NOT NULL DEFAULT 0' },
    { name: 'expires_at', definition: 'BIGINT NOT NULL DEFAULT 0' },
    { name: 'last_activity_at', definition: 'BIGINT NOT NULL DEFAULT 0' },
    { name: 'revoked', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
  ],
  cities: [
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'state', definition: "VARCHAR(32) NOT NULL DEFAULT ''" },
    { name: 'slug', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'is_active', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'is_default', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'banner_url', definition: 'LONGTEXT NULL' },
    { name: 'description', definition: 'TEXT NULL' },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  categories: [
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'slug', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'icon_name', definition: "VARCHAR(120) NOT NULL DEFAULT 'Tag'" },
    { name: 'description', definition: 'TEXT NULL' },
    { name: 'color', definition: 'VARCHAR(32) NULL' },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  plans: [
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'price_monthly', definition: 'DECIMAL(10,2) NOT NULL DEFAULT 0' },
    { name: 'product_limit', definition: 'INT NOT NULL DEFAULT 3' },
    { name: 'business_limit', definition: 'INT NOT NULL DEFAULT 1' },
    { name: 'badge', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'features', definition: 'JSON NULL' },
    { name: 'highlighted', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'color', definition: "VARCHAR(32) NOT NULL DEFAULT '#1D4ED8'" },
    { name: 'use_custom_discounts', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'cycle_discounts', definition: 'JSON NULL' },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  businesses: [
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'slug', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'city_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'category_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'plan_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'description', definition: 'LONGTEXT NULL' },
    { name: 'phone', definition: "VARCHAR(80) NOT NULL DEFAULT ''" },
    { name: 'whatsapp', definition: "VARCHAR(80) NOT NULL DEFAULT ''" },
    { name: 'email', definition: 'VARCHAR(255) NULL' },
    { name: 'owner_email', definition: 'VARCHAR(255) NULL' },
    { name: 'address', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'neighborhood', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'opening_hours', definition: 'TEXT NULL' },
    { name: 'weekly_schedule', definition: 'JSON NULL' },
    { name: 'logo_url', definition: 'LONGTEXT NULL' },
    { name: 'cover_url', definition: 'LONGTEXT NULL' },
    { name: 'instagram', definition: 'VARCHAR(255) NULL' },
    { name: 'facebook', definition: 'VARCHAR(255) NULL' },
    { name: 'website', definition: 'VARCHAR(255) NULL' },
    { name: 'password', definition: 'VARCHAR(255) NULL' },
    { name: 'is_verified', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'email_verified', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'payment_status', definition: "VARCHAR(40) NOT NULL DEFAULT 'active'" },
    { name: 'pending_plan_id', definition: 'VARCHAR(120) NULL' },
    { name: 'pending_billing_cycle', definition: 'VARCHAR(32) NULL' },
    { name: 'billing_cycle', definition: 'VARCHAR(32) NULL' },
    { name: 'plan_expires_at', definition: 'VARCHAR(64) NULL' },
    { name: 'payment_token', definition: 'VARCHAR(255) NULL' },
    { name: 'created_at', definition: "VARCHAR(64) NOT NULL DEFAULT ''" },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  products: [
    { name: 'business_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'city_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'price', definition: 'DECIMAL(10,2) NOT NULL DEFAULT 0' },
    { name: 'original_price', definition: 'DECIMAL(10,2) NULL' },
    { name: 'description', definition: 'LONGTEXT NULL' },
    { name: 'image_url', definition: 'LONGTEXT NULL' },
    { name: 'category', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'is_active', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'featured', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'created_at', definition: "VARCHAR(64) NOT NULL DEFAULT ''" },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  services: [
    { name: 'business_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'city_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'price_type', definition: "VARCHAR(32) NOT NULL DEFAULT 'fixed'" },
    { name: 'price', definition: 'DECIMAL(10,2) NULL' },
    { name: 'duration', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'service_mode', definition: "VARCHAR(32) NOT NULL DEFAULT 'on_site'" },
    { name: 'description', definition: 'LONGTEXT NULL' },
    { name: 'image_url', definition: 'LONGTEXT NULL' },
    { name: 'category', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'is_active', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'featured', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'created_at', definition: "VARCHAR(64) NOT NULL DEFAULT ''" },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  store_product_categories: [
    { name: 'business_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'description', definition: 'TEXT NULL' },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  banners: [
    { name: 'title', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'position', definition: "VARCHAR(40) NOT NULL DEFAULT 'top'" },
    { name: 'image_url', definition: 'LONGTEXT NULL' },
    { name: 'link_url', definition: 'VARCHAR(500) NULL' },
    { name: 'advertiser_name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'city_id', definition: "VARCHAR(120) NOT NULL DEFAULT 'all'" },
    { name: 'price_monthly', definition: 'DECIMAL(10,2) NOT NULL DEFAULT 0' },
    { name: 'is_active', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'clicks_count', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'badge_text', definition: 'VARCHAR(120) NULL' },
    { name: 'tagline', definition: 'TEXT NULL' },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  payment_transactions: [
    { name: 'business_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'business_name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'plan_id', definition: "VARCHAR(120) NOT NULL DEFAULT ''" },
    { name: 'plan_name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'billing_cycle', definition: 'VARCHAR(32) NULL' },
    { name: 'cycle_months', definition: 'INT NULL' },
    { name: 'base_amount', definition: 'DECIMAL(10,2) NULL' },
    { name: 'discount_percent', definition: 'DECIMAL(5,2) NULL' },
    { name: 'discount_amount', definition: 'DECIMAL(10,2) NULL' },
    { name: 'amount', definition: 'DECIMAL(10,2) NOT NULL DEFAULT 0' },
    { name: 'payment_method', definition: "VARCHAR(32) NOT NULL DEFAULT 'pix'" },
    { name: 'status', definition: "VARCHAR(32) NOT NULL DEFAULT 'approved'" },
    { name: 'mercado_pago_payment_id', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'qr_code', definition: 'LONGTEXT NULL' },
    { name: 'qr_code_text', definition: 'LONGTEXT NULL' },
    { name: 'installments', definition: 'INT NULL' },
    { name: 'card_last_four', definition: 'VARCHAR(16) NULL' },
    { name: 'card_brand', definition: 'VARCHAR(64) NULL' },
    { name: 'payer_email', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'created_at', definition: "VARCHAR(64) NOT NULL DEFAULT ''" },
    { name: 'paid_at', definition: 'VARCHAR(64) NULL' },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  email_logs: [
    { name: 'recipient_to', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'template_key', definition: "VARCHAR(64) NOT NULL DEFAULT 'test'" },
    { name: 'template_name', definition: "VARCHAR(255) NOT NULL DEFAULT ''" },
    { name: 'subject', definition: "VARCHAR(500) NOT NULL DEFAULT ''" },
    { name: 'html_body', definition: 'LONGTEXT NULL' },
    { name: 'text_body', definition: 'LONGTEXT NULL' },
    { name: 'verification_code', definition: 'VARCHAR(32) NULL' },
    { name: 'payment_url', definition: 'VARCHAR(500) NULL' },
    { name: 'delivery_mode', definition: "VARCHAR(32) NOT NULL DEFAULT 'local_fallback'" },
    { name: 'status', definition: "VARCHAR(32) NOT NULL DEFAULT 'sent'" },
    { name: 'error_message', definition: 'TEXT NULL' },
    { name: 'created_at', definition: "VARCHAR(64) NOT NULL DEFAULT ''" },
    { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
  app_settings: [
    { name: 'setting_value', definition: 'JSON NULL' },
    { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
  ],
};

async function ensureMissingColumns(conn: PoolConnection): Promise<string[]> {
  const added: string[] = [];
  const [colRows] = await conn.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()`
  );

  const existingByTable = new Map<string, Set<string>>();
  for (const row of colRows) {
    const tbl = String(row.tableName || '').toLowerCase();
    const col = String(row.columnName || '').toLowerCase();
    if (!existingByTable.has(tbl)) {
      existingByTable.set(tbl, new Set());
    }
    existingByTable.get(tbl)!.add(col);
  }

  for (const [tableName, columns] of Object.entries(EXPECTED_TABLE_COLUMNS)) {
    const existingCols = existingByTable.get(tableName.toLowerCase());
    if (!existingCols) continue;

    for (const col of columns) {
      if (!existingCols.has(col.name.toLowerCase())) {
        try {
          await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${col.name}\` ${col.definition}`);
        } catch (err) {
          if (col.definition.startsWith('JSON')) {
            await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${col.name}\` LONGTEXT NULL`);
          } else {
            throw err;
          }
        }
        added.push(`${tableName}.${col.name}`);
      }
    }
  }

  if (added.length > 0) {
    console.log('MySQL schema auto-migrated missing columns:', added.join(', '));
  }

  return added;
}

async function dropLegacyPortugueseTables(conn: PoolConnection): Promise<string[]> {
  const [tableRows] = await conn.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS tableName
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()`
  );

  const existingTables = new Set(
    tableRows.map((row) => String(row.tableName || '').toLowerCase())
  );

  const toDrop = LEGACY_PORTUGUESE_TABLES.filter((tbl) =>
    existingTables.has(tbl.toLowerCase())
  );

  if (toDrop.length === 0) {
    return [];
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const tbl of toDrop) {
      await conn.query(`DROP TABLE IF EXISTS \`${tbl}\``);
    }
  } finally {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  console.log('Dropped legacy Portuguese MySQL tables:', toDrop.join(', '));
  return toDrop;
}

async function ensureDefaultAdminUser(conn: PoolConnection): Promise<void> {
  // Remove legacy demo admin placeholder if present
  await conn.query(
    `DELETE FROM admin_users WHERE LOWER(email) = 'admin@achenacidade.com.br'`
  );

  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, password_hash FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
    [DEFAULT_ADMIN_EMAIL]
  );

  if (rows.length === 0) {
    await conn.query(
      `INSERT INTO admin_users (id, email, name, password_hash, role, is_active, sort_order)
       VALUES (?, ?, ?, ?, 'admin', 1, 0)`,
      ['admin-master-1', DEFAULT_ADMIN_EMAIL, 'Administrador Master', hashPassword(DEFAULT_ADMIN_PASSWORD)]
    );
  } else if (!rows[0].password_hash) {
    await conn.query(
      `UPDATE admin_users SET password_hash = ?, is_active = 1 WHERE id = ?`,
      [hashPassword(DEFAULT_ADMIN_PASSWORD), rows[0].id]
    );
  }
}

export async function ensureDatabaseSchema(forceMigrate = false): Promise<boolean> {
  const activePool = getPool();
  if (!activePool) return false;
  if (schemaInitialized && !forceMigrate) return true;

  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    let conn: PoolConnection | null = null;
    try {
      conn = await activePool.getConnection();
      const droppedTables = await dropLegacyPortugueseTables(conn);
      if (droppedTables.length > 0) {
        lastDroppedLegacyTables = droppedTables;
      }

      await conn.query(`
        CREATE TABLE IF NOT EXISTS app_meta (
          meta_key VARCHAR(120) PRIMARY KEY,
          meta_value VARCHAR(500) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id VARCHAR(120) PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(32) NOT NULL DEFAULT 'admin',
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          last_login_at VARCHAR(64) NULL,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_admin_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          token VARCHAR(128) PRIMARY KEY,
          role VARCHAR(32) NOT NULL,
          user_id VARCHAR(120) NOT NULL,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          business_id VARCHAR(120) NULL,
          ip_address VARCHAR(120) NULL,
          user_agent VARCHAR(500) NULL,
          created_at BIGINT NOT NULL,
          expires_at BIGINT NOT NULL,
          last_activity_at BIGINT NOT NULL,
          revoked TINYINT(1) NOT NULL DEFAULT 0,
          KEY idx_auth_expires (expires_at),
          KEY idx_auth_user (role, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS cities (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          state VARCHAR(32) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          is_default TINYINT(1) NOT NULL DEFAULT 0,
          banner_url LONGTEXT NULL,
          description TEXT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          icon_name VARCHAR(120) NOT NULL,
          description TEXT NULL,
          color VARCHAR(32) NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS plans (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
          product_limit INT NOT NULL DEFAULT 3,
          business_limit INT NOT NULL DEFAULT 1,
          badge VARCHAR(120) NOT NULL,
          features JSON NOT NULL,
          highlighted TINYINT(1) NOT NULL DEFAULT 0,
          color VARCHAR(32) NOT NULL,
          use_custom_discounts TINYINT(1) NOT NULL DEFAULT 0,
          cycle_discounts JSON NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS businesses (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          city_id VARCHAR(120) NOT NULL,
          category_id VARCHAR(120) NOT NULL,
          plan_id VARCHAR(120) NOT NULL,
          description LONGTEXT NULL,
          phone VARCHAR(80) NOT NULL DEFAULT '',
          whatsapp VARCHAR(80) NOT NULL DEFAULT '',
          email VARCHAR(255) NULL,
          owner_email VARCHAR(255) NULL,
          address VARCHAR(255) NOT NULL DEFAULT '',
          neighborhood VARCHAR(255) NOT NULL DEFAULT '',
          opening_hours TEXT NULL,
          weekly_schedule JSON NULL,
          logo_url LONGTEXT NOT NULL,
          cover_url LONGTEXT NULL,
          instagram VARCHAR(255) NULL,
          facebook VARCHAR(255) NULL,
          website VARCHAR(255) NULL,
          password VARCHAR(255) NULL,
          is_verified TINYINT(1) NOT NULL DEFAULT 0,
          email_verified TINYINT(1) NOT NULL DEFAULT 0,
          payment_status VARCHAR(40) NOT NULL DEFAULT 'active',
          pending_plan_id VARCHAR(120) NULL,
          pending_billing_cycle VARCHAR(32) NULL,
          billing_cycle VARCHAR(32) NULL,
          plan_expires_at VARCHAR(64) NULL,
          payment_token VARCHAR(255) NULL,
          created_at VARCHAR(64) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(120) PRIMARY KEY,
          business_id VARCHAR(120) NOT NULL,
          city_id VARCHAR(120) NOT NULL,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          original_price DECIMAL(10,2) NULL,
          description LONGTEXT NULL,
          image_url LONGTEXT NOT NULL,
          category VARCHAR(255) NOT NULL DEFAULT '',
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          featured TINYINT(1) NOT NULL DEFAULT 0,
          created_at VARCHAR(64) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS services (
          id VARCHAR(120) PRIMARY KEY,
          business_id VARCHAR(120) NOT NULL,
          city_id VARCHAR(120) NOT NULL,
          name VARCHAR(255) NOT NULL,
          price_type VARCHAR(32) NOT NULL DEFAULT 'fixed',
          price DECIMAL(10,2) NULL,
          duration VARCHAR(120) NOT NULL DEFAULT '',
          service_mode VARCHAR(32) NOT NULL DEFAULT 'on_site',
          description LONGTEXT NULL,
          image_url LONGTEXT NOT NULL,
          category VARCHAR(255) NOT NULL DEFAULT '',
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          featured TINYINT(1) NOT NULL DEFAULT 0,
          created_at VARCHAR(64) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS store_product_categories (
          id VARCHAR(120) PRIMARY KEY,
          business_id VARCHAR(120) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS banners (
          id VARCHAR(120) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          position VARCHAR(40) NOT NULL,
          image_url LONGTEXT NOT NULL,
          link_url VARCHAR(500) NULL,
          advertiser_name VARCHAR(255) NOT NULL,
          city_id VARCHAR(120) NOT NULL DEFAULT 'all',
          price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          clicks_count INT NOT NULL DEFAULT 0,
          badge_text VARCHAR(120) NULL,
          tagline TEXT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS payment_transactions (
          id VARCHAR(120) PRIMARY KEY,
          business_id VARCHAR(120) NOT NULL,
          business_name VARCHAR(255) NOT NULL,
          plan_id VARCHAR(120) NOT NULL,
          plan_name VARCHAR(255) NOT NULL,
          billing_cycle VARCHAR(32) NULL,
          cycle_months INT NULL,
          base_amount DECIMAL(10,2) NULL,
          discount_percent DECIMAL(5,2) NULL,
          discount_amount DECIMAL(10,2) NULL,
          amount DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(32) NOT NULL,
          status VARCHAR(32) NOT NULL,
          mercado_pago_payment_id VARCHAR(255) NOT NULL,
          qr_code LONGTEXT NULL,
          qr_code_text LONGTEXT NULL,
          installments INT NULL,
          card_last_four VARCHAR(16) NULL,
          card_brand VARCHAR(64) NULL,
          payer_email VARCHAR(255) NOT NULL,
          created_at VARCHAR(64) NOT NULL,
          paid_at VARCHAR(64) NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id VARCHAR(120) PRIMARY KEY,
          recipient_to VARCHAR(255) NOT NULL,
          template_key VARCHAR(64) NOT NULL,
          template_name VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          html_body LONGTEXT NOT NULL,
          text_body LONGTEXT NOT NULL,
          verification_code VARCHAR(32) NULL,
          payment_url VARCHAR(500) NULL,
          delivery_mode VARCHAR(32) NOT NULL,
          status VARCHAR(32) NOT NULL,
          error_message TEXT NULL,
          created_at VARCHAR(64) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          setting_key VARCHAR(120) PRIMARY KEY,
          setting_value JSON NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      const addedColumns = await ensureMissingColumns(conn);
      if (addedColumns.length > 0) {
        lastMigratedColumns = addedColumns;
      }

      await ensureDefaultAdminUser(conn);

      schemaInitialized = true;
      return true;
    } catch (err) {
      if (isTransientConnectionError(err)) {
        await closePool().catch(() => {});
      }
      throw err;
    } finally {
      if (conn) {
        conn.release();
      }
      schemaPromise = null;
    }
  })();

  return schemaPromise;
}

export interface FullDirectoryPayload {
  cities: any[];
  categories: any[];
  plans: any[];
  businesses: any[];
  products: any[];
  services: any[];
  storeProductCategories: any[];
  banners: any[];
  paymentTransactions: any[];
  emailLogs?: any[];
  settings: Record<string, any>;
}

export async function isSeedCompleted(connOrPool?: Pool | PoolConnection): Promise<boolean> {
  const executor = connOrPool || getPool();
  if (!executor) return false;
  const [rows] = await executor.query<RowDataPacket[]>(
    `SELECT meta_value FROM app_meta WHERE meta_key = 'initial_seed_done' LIMIT 1`
  );
  return rows.length > 0 && rows[0].meta_value === '1';
}

export async function readAllDirectoryData(connOrPool?: Pool | PoolConnection): Promise<FullDirectoryPayload> {
  const executor = connOrPool || getPool();
  if (!executor) {
    throw new Error('Database pool is not initialized.');
  }

  const [cityRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM cities ORDER BY sort_order ASC, id ASC`);
  const [categoryRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM categories ORDER BY sort_order ASC, id ASC`);
  const [planRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM plans ORDER BY sort_order ASC, id ASC`);
  const [bizRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM businesses ORDER BY sort_order ASC, id ASC`);
  const [prodRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM products ORDER BY sort_order ASC, id ASC`);
  const [servRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM services ORDER BY sort_order ASC, id ASC`);
  const [spcRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM store_product_categories ORDER BY sort_order ASC, id ASC`);
  const [bannerRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM banners ORDER BY sort_order ASC, id ASC`);
  const [txRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM payment_transactions ORDER BY sort_order ASC, id ASC`);
  const [emailLogRows] = await executor.query<RowDataPacket[]>(`SELECT * FROM email_logs ORDER BY sort_order ASC, id ASC LIMIT 60`);
  const [settingRows] = await executor.query<RowDataPacket[]>(`SELECT setting_key, setting_value FROM app_settings`);

  const settings: Record<string, any> = {};
  for (const row of settingRows) {
    settings[row.setting_key] = parseJsonColumn(row.setting_value, {});
  }

  return {
    cities: cityRows.map((r) => ({
      id: r.id,
      name: r.name,
      state: r.state,
      slug: r.slug,
      isActive: Boolean(r.is_active),
      isDefault: Boolean(r.is_default),
      ...(r.banner_url ? { bannerUrl: r.banner_url } : {}),
      ...(r.description ? { description: r.description } : {}),
    })),
    categories: categoryRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      iconName: r.icon_name,
      ...(r.description ? { description: r.description } : {}),
      ...(r.color ? { color: r.color } : {}),
    })),
    plans: planRows.map((r) => ({
      id: r.id,
      name: r.name,
      priceMonthly: toNumber(r.price_monthly, 0),
      productLimit: toNumber(r.product_limit, 3),
      businessLimit: toNumber(r.business_limit, 1),
      badge: r.badge,
      features: parseJsonColumn<string[]>(r.features, []),
      highlighted: Boolean(r.highlighted),
      color: r.color,
      useCustomDiscounts: Boolean(r.use_custom_discounts),
      ...(r.cycle_discounts ? { cycleDiscounts: parseJsonColumn(r.cycle_discounts, undefined) } : {}),
    })),
    businesses: bizRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      cityId: r.city_id,
      categoryId: r.category_id,
      planId: r.plan_id,
      description: r.description || '',
      phone: r.phone || '',
      whatsapp: r.whatsapp || '',
      ...(r.email ? { email: r.email } : {}),
      ...(r.owner_email ? { ownerEmail: r.owner_email } : {}),
      address: r.address || '',
      neighborhood: r.neighborhood || '',
      ...(r.opening_hours ? { openingHours: r.opening_hours } : {}),
      ...(r.weekly_schedule ? { weeklySchedule: parseJsonColumn(r.weekly_schedule, undefined) } : {}),
      logoUrl: r.logo_url || '',
      ...(r.cover_url ? { coverUrl: r.cover_url } : {}),
      ...(r.instagram ? { instagram: r.instagram } : {}),
      ...(r.facebook ? { facebook: r.facebook } : {}),
      ...(r.website ? { website: r.website } : {}),
      hasPassword: Boolean(r.password),
      isVerified: Boolean(r.is_verified),
      emailVerified: Boolean(r.email_verified),
      paymentStatus: r.payment_status || 'active',
      ...(r.pending_plan_id ? { pendingPlanId: r.pending_plan_id } : {}),
      ...(r.pending_billing_cycle ? { pendingBillingCycle: r.pending_billing_cycle } : {}),
      ...(r.billing_cycle ? { billingCycle: r.billing_cycle } : {}),
      ...(r.plan_expires_at ? { planExpiresAt: r.plan_expires_at } : {}),
      ...(r.payment_token ? { paymentToken: r.payment_token } : {}),
      createdAt: r.created_at,
    })),
    products: prodRows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      cityId: r.city_id,
      name: r.name,
      price: toNumber(r.price, 0),
      ...(toOptionalNumber(r.original_price) !== undefined ? { originalPrice: toOptionalNumber(r.original_price) } : {}),
      description: r.description || '',
      imageUrl: r.image_url || '',
      category: r.category || '',
      isActive: Boolean(r.is_active),
      featured: Boolean(r.featured),
      createdAt: r.created_at,
    })),
    services: servRows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      cityId: r.city_id,
      name: r.name,
      priceType: r.price_type || 'fixed',
      ...(toOptionalNumber(r.price) !== undefined ? { price: toOptionalNumber(r.price) } : {}),
      duration: r.duration || '',
      serviceMode: r.service_mode || 'on_site',
      description: r.description || '',
      imageUrl: r.image_url || '',
      category: r.category || '',
      isActive: Boolean(r.is_active),
      featured: Boolean(r.featured),
      createdAt: r.created_at,
    })),
    storeProductCategories: spcRows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      name: r.name,
      ...(r.description ? { description: r.description } : {}),
    })),
    banners: bannerRows.map((r) => ({
      id: r.id,
      title: r.title,
      position: r.position,
      imageUrl: r.image_url,
      ...(r.link_url ? { linkUrl: r.link_url } : {}),
      advertiserName: r.advertiser_name,
      cityId: r.city_id,
      priceMonthly: toNumber(r.price_monthly, 0),
      isActive: Boolean(r.is_active),
      clicksCount: toNumber(r.clicks_count, 0),
      ...(r.badge_text ? { badgeText: r.badge_text } : {}),
      ...(r.tagline ? { tagline: r.tagline } : {}),
    })),
    paymentTransactions: txRows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      businessName: r.business_name,
      planId: r.plan_id,
      planName: r.plan_name,
      ...(r.billing_cycle ? { billingCycle: r.billing_cycle } : {}),
      ...(toOptionalNumber(r.cycle_months) !== undefined ? { cycleMonths: toOptionalNumber(r.cycle_months) } : {}),
      ...(toOptionalNumber(r.base_amount) !== undefined ? { baseAmount: toOptionalNumber(r.base_amount) } : {}),
      ...(toOptionalNumber(r.discount_percent) !== undefined ? { discountPercent: toOptionalNumber(r.discount_percent) } : {}),
      ...(toOptionalNumber(r.discount_amount) !== undefined ? { discountAmount: toOptionalNumber(r.discount_amount) } : {}),
      amount: toNumber(r.amount, 0),
      paymentMethod: r.payment_method,
      status: r.status,
      mercadoPagoPaymentId: r.mercado_pago_payment_id,
      ...(r.qr_code ? { qrCode: r.qr_code } : {}),
      ...(r.qr_code_text ? { qrCodeText: r.qr_code_text } : {}),
      ...(toOptionalNumber(r.installments) !== undefined ? { installments: toOptionalNumber(r.installments) } : {}),
      ...(r.card_last_four ? { cardLastFour: r.card_last_four } : {}),
      ...(r.card_brand ? { cardBrand: r.card_brand } : {}),
      payerEmail: r.payer_email,
      createdAt: r.created_at,
      ...(r.paid_at ? { paidAt: r.paid_at } : {}),
    })),
    emailLogs: emailLogRows.map((r) => ({
      id: r.id,
      to: r.recipient_to,
      templateKey: r.template_key,
      templateName: r.template_name,
      subject: r.subject,
      htmlBody: r.html_body,
      textBody: r.text_body,
      ...(r.verification_code ? { verificationCode: r.verification_code } : {}),
      ...(r.payment_url ? { paymentUrl: r.payment_url } : {}),
      deliveryMode: r.delivery_mode,
      status: r.status,
      ...(r.error_message ? { errorMessage: r.error_message } : {}),
      createdAt: r.created_at,
    })),
    settings,
  };
}

export async function replaceCollectionInConn(conn: PoolConnection, collection: string, items: any[]): Promise<void> {
  const safeItems = Array.isArray(items) ? items : [];

  switch (collection) {
    case 'cities': {
      await conn.query(`DELETE FROM cities`);
      for (let i = 0; i < safeItems.length; i++) {
        const c = safeItems[i];
        await conn.query(
          `INSERT INTO cities (id, name, state, slug, is_active, is_default, banner_url, description, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.name || '', c.state || '', c.slug || '', c.isActive ? 1 : 0, c.isDefault ? 1 : 0, c.bannerUrl || null, c.description || null, i]
        );
      }
      break;
    }

    case 'categories': {
      await conn.query(`DELETE FROM categories`);
      for (let i = 0; i < safeItems.length; i++) {
        const c = safeItems[i];
        await conn.query(
          `INSERT INTO categories (id, name, slug, icon_name, description, color, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.name || '', c.slug || '', c.iconName || 'Tag', c.description || null, c.color || null, i]
        );
      }
      break;
    }

    case 'plans': {
      await conn.query(`DELETE FROM plans`);
      for (let i = 0; i < safeItems.length; i++) {
        const p = safeItems[i];
        await conn.query(
          `INSERT INTO plans (id, name, price_monthly, product_limit, business_limit, badge, features, highlighted, color, use_custom_discounts, cycle_discounts, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.name || '',
            toNumber(p.priceMonthly, 0),
            toNumber(p.productLimit, 3),
            toNumber(p.businessLimit, 1),
            p.badge || '',
            JSON.stringify(p.features || []),
            p.highlighted ? 1 : 0,
            p.color || '#1D4ED8',
            p.useCustomDiscounts ? 1 : 0,
            p.cycleDiscounts ? JSON.stringify(p.cycleDiscounts) : null,
            i,
          ]
        );
      }
      break;
    }

    case 'businesses': {
      const [existingPwdRows] = await conn.query<RowDataPacket[]>(`SELECT id, password FROM businesses`);
      const existingPwdMap = new Map<string, string>();
      for (const row of existingPwdRows) {
        if (row.id && row.password) {
          existingPwdMap.set(String(row.id), String(row.password));
        }
      }
      await conn.query(`DELETE FROM businesses`);
      for (let i = 0; i < safeItems.length; i++) {
        const b = safeItems[i];
        const finalPassword = hashIfPresent(b.password) ?? existingPwdMap.get(String(b.id)) ?? null;
        await conn.query(
          `INSERT INTO businesses (
             id, name, slug, city_id, category_id, plan_id, description, phone, whatsapp, email, owner_email,
             address, neighborhood, opening_hours, weekly_schedule, logo_url, cover_url, instagram, facebook,
             website, password, is_verified, email_verified, payment_status, pending_plan_id,
             pending_billing_cycle, billing_cycle, plan_expires_at, payment_token, created_at, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.id,
            b.name || '',
            b.slug || '',
            b.cityId || '',
            b.categoryId || '',
            b.planId || '',
            b.description || '',
            b.phone || '',
            b.whatsapp || '',
            b.email || null,
            b.ownerEmail || null,
            b.address || '',
            b.neighborhood || '',
            b.openingHours || null,
            b.weeklySchedule ? JSON.stringify(b.weeklySchedule) : null,
            b.logoUrl || '',
            b.coverUrl || null,
            b.instagram || null,
            b.facebook || null,
            b.website || null,
            finalPassword,
            b.isVerified ? 1 : 0,
            b.emailVerified ? 1 : 0,
            b.paymentStatus || 'active',
            b.pendingPlanId || null,
            b.pendingBillingCycle || null,
            b.billingCycle || null,
            b.planExpiresAt || null,
            b.paymentToken || null,
            b.createdAt || new Date().toISOString().split('T')[0],
            i,
          ]
        );
      }
      break;
    }

    case 'products': {
      await conn.query(`DELETE FROM products`);
      for (let i = 0; i < safeItems.length; i++) {
        const p = safeItems[i];
        await conn.query(
          `INSERT INTO products (id, business_id, city_id, name, price, original_price, description, image_url, category, is_active, featured, created_at, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.businessId || '',
            p.cityId || '',
            p.name || '',
            toNumber(p.price, 0),
            toOptionalNumber(p.originalPrice) ?? null,
            p.description || '',
            p.imageUrl || '',
            p.category || '',
            p.isActive === false ? 0 : 1,
            p.featured ? 1 : 0,
            p.createdAt || new Date().toISOString().split('T')[0],
            i,
          ]
        );
      }
      break;
    }

    case 'services': {
      await conn.query(`DELETE FROM services`);
      for (let i = 0; i < safeItems.length; i++) {
        const s = safeItems[i];
        await conn.query(
          `INSERT INTO services (id, business_id, city_id, name, price_type, price, duration, service_mode, description, image_url, category, is_active, featured, created_at, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id,
            s.businessId || '',
            s.cityId || '',
            s.name || '',
            s.priceType || 'fixed',
            toOptionalNumber(s.price) ?? null,
            s.duration || '',
            s.serviceMode || 'on_site',
            s.description || '',
            s.imageUrl || '',
            s.category || '',
            s.isActive === false ? 0 : 1,
            s.featured ? 1 : 0,
            s.createdAt || new Date().toISOString().split('T')[0],
            i,
          ]
        );
      }
      break;
    }

    case 'storeProductCategories':
    case 'store_product_categories': {
      await conn.query(`DELETE FROM store_product_categories`);
      for (let i = 0; i < safeItems.length; i++) {
        const c = safeItems[i];
        await conn.query(
          `INSERT INTO store_product_categories (id, business_id, name, description, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [c.id, c.businessId || '', c.name || '', c.description || null, i]
        );
      }
      break;
    }

    case 'banners': {
      await conn.query(`DELETE FROM banners`);
      for (let i = 0; i < safeItems.length; i++) {
        const b = safeItems[i];
        await conn.query(
          `INSERT INTO banners (id, title, position, image_url, link_url, advertiser_name, city_id, price_monthly, is_active, clicks_count, badge_text, tagline, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.id,
            b.title || '',
            b.position || 'top',
            b.imageUrl || '',
            b.linkUrl || null,
            b.advertiserName || '',
            b.cityId || 'all',
            toNumber(b.priceMonthly, 0),
            b.isActive === false ? 0 : 1,
            toNumber(b.clicksCount, 0),
            b.badgeText || null,
            b.tagline || null,
            i,
          ]
        );
      }
      break;
    }

    case 'paymentTransactions':
    case 'payment_transactions': {
      await conn.query(`DELETE FROM payment_transactions`);
      for (let i = 0; i < safeItems.length; i++) {
        const t = safeItems[i];
        await conn.query(
          `INSERT INTO payment_transactions (
             id, business_id, business_name, plan_id, plan_name, billing_cycle, cycle_months, base_amount,
             discount_percent, discount_amount, amount, payment_method, status, mercado_pago_payment_id,
             qr_code, qr_code_text, installments, card_last_four, card_brand, payer_email, created_at, paid_at, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.businessId || '',
            t.businessName || '',
            t.planId || '',
            t.planName || '',
            t.billingCycle || null,
            toOptionalNumber(t.cycleMonths) ?? null,
            toOptionalNumber(t.baseAmount) ?? null,
            toOptionalNumber(t.discountPercent) ?? null,
            toOptionalNumber(t.discountAmount) ?? null,
            toNumber(t.amount, 0),
            t.paymentMethod || 'pix',
            t.status || 'approved',
            t.mercadoPagoPaymentId || '',
            t.qrCode || null,
            t.qrCodeText || null,
            toOptionalNumber(t.installments) ?? null,
            t.cardLastFour || null,
            t.cardBrand || null,
            t.payerEmail || '',
            t.createdAt || '',
            t.paidAt || null,
            i,
          ]
        );
      }
      break;
    }

    case 'emailLogs':
    case 'email_logs': {
      await conn.query(`DELETE FROM email_logs`);
      const trimmedLogs = safeItems.slice(0, 60);
      for (let i = 0; i < trimmedLogs.length; i++) {
        const l = trimmedLogs[i];
        await conn.query(
          `INSERT INTO email_logs (
             id, recipient_to, template_key, template_name, subject, html_body, text_body,
             verification_code, payment_url, delivery_mode, status, error_message, created_at, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            l.id,
            l.to || '',
            l.templateKey || 'test',
            l.templateName || '',
            l.subject || '',
            l.htmlBody || '',
            l.textBody || '',
            l.verificationCode || null,
            l.paymentUrl || null,
            l.deliveryMode || 'local_fallback',
            l.status || 'sent',
            l.errorMessage || null,
            l.createdAt || '',
            i,
          ]
        );
      }
      break;
    }

    default:
      throw new Error(`Unsupported collection: ${collection}`);
  }
}

export async function syncCollection(collection: string, items: any[]): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  await ensureDatabaseSchema();

  const conn = await activePool.getConnection();
  try {
    await conn.beginTransaction();
    await replaceCollectionInConn(conn, collection, items);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function upsertSetting(key: string, value: any): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  await ensureDatabaseSchema();

  await activePool.query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, JSON.stringify(value ?? {})]
  );
}

export async function seedInitialDirectoryIfEmpty(
  payload: FullDirectoryPayload,
  forceReset = false
): Promise<{ seededNow: boolean; data: FullDirectoryPayload }> {
  const activePool = getPool();
  if (!activePool) {
    throw new Error('Database not configured.');
  }

  await ensureDatabaseSchema();

  const conn = await activePool.getConnection();
  try {
    await conn.beginTransaction();

    if (!forceReset) {
      const [metaRows] = await conn.query<RowDataPacket[]>(
        `SELECT meta_value FROM app_meta WHERE meta_key = 'initial_seed_done' FOR UPDATE`
      );
      if (metaRows.length > 0 && metaRows[0].meta_value === '1') {
        const existingData = await readAllDirectoryData(conn);
        await conn.commit();
        return { seededNow: false, data: existingData };
      }
    }

    await replaceCollectionInConn(conn, 'cities', payload.cities || []);
    await replaceCollectionInConn(conn, 'categories', payload.categories || []);
    await replaceCollectionInConn(conn, 'plans', payload.plans || []);
    await replaceCollectionInConn(conn, 'businesses', payload.businesses || []);
    await replaceCollectionInConn(conn, 'products', payload.products || []);
    await replaceCollectionInConn(conn, 'services', payload.services || []);
    await replaceCollectionInConn(conn, 'storeProductCategories', payload.storeProductCategories || []);
    await replaceCollectionInConn(conn, 'banners', payload.banners || []);
    await replaceCollectionInConn(conn, 'paymentTransactions', payload.paymentTransactions || []);

    if (forceReset) {
      await replaceCollectionInConn(conn, 'emailLogs', payload.emailLogs || []);
      await conn.query(`DELETE FROM app_settings`);
    }

    const settingsEntries = Object.entries(payload.settings || {});
    for (const [key, val] of settingsEntries) {
      await conn.query(
        `INSERT INTO app_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, JSON.stringify(val ?? {})]
      );
    }

    await conn.query(
      `INSERT INTO app_meta (meta_key, meta_value)
       VALUES ('initial_seed_done', '1')
       ON DUPLICATE KEY UPDATE meta_value = '1'`
    );

    const data = await readAllDirectoryData(conn);
    await conn.commit();
    return { seededNow: true, data };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function incrementBannerClicksDb(bannerId: string): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  await ensureDatabaseSchema();
  await activePool.query(
    `UPDATE banners SET clicks_count = clicks_count + 1 WHERE id = ?`,
    [bannerId]
  );
}

const RESOURCE_TABLE_MAP: Record<string, string> = {
  cities: 'cities',
  categories: 'categories',
  plans: 'plans',
  businesses: 'businesses',
  products: 'products',
  services: 'services',
  storeProductCategories: 'store_product_categories',
  store_product_categories: 'store_product_categories',
  banners: 'banners',
  paymentTransactions: 'payment_transactions',
  payment_transactions: 'payment_transactions',
  emailLogs: 'email_logs',
  email_logs: 'email_logs',
};

export async function upsertEntity(resource: string, item: any): Promise<void> {
  const activePool = getPool();
  if (!activePool) return;
  await ensureDatabaseSchema();

  if (!item || !item.id) {
    throw new Error(`Missing entity id for ${resource}`);
  }

  const conn = await activePool.getConnection();
  try {
    await conn.beginTransaction();

    switch (resource) {
      case 'cities': {
        if (item.isDefault) {
          await conn.query(`UPDATE cities SET is_default = 0 WHERE id <> ?`, [item.id]);
        }
        await conn.query(
          `INSERT INTO cities (id, name, state, slug, is_active, is_default, banner_url, description, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             state = VALUES(state),
             slug = VALUES(slug),
             is_active = VALUES(is_active),
             is_default = VALUES(is_default),
             banner_url = VALUES(banner_url),
             description = VALUES(description)`,
          [
            item.id,
            item.name || '',
            item.state || '',
            item.slug || '',
            item.isActive === false ? 0 : 1,
            item.isDefault ? 1 : 0,
            item.bannerUrl || null,
            item.description || null,
            0,
          ]
        );
        break;
      }

      case 'categories': {
        await conn.query(
          `INSERT INTO categories (id, name, slug, icon_name, description, color, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             slug = VALUES(slug),
             icon_name = VALUES(icon_name),
             description = VALUES(description),
             color = VALUES(color)`,
          [
            item.id,
            item.name || '',
            item.slug || '',
            item.iconName || 'Tag',
            item.description || null,
            item.color || null,
            0,
          ]
        );
        break;
      }

      case 'plans': {
        await conn.query(
          `INSERT INTO plans (id, name, price_monthly, product_limit, business_limit, badge, features, highlighted, color, use_custom_discounts, cycle_discounts, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             price_monthly = VALUES(price_monthly),
             product_limit = VALUES(product_limit),
             business_limit = VALUES(business_limit),
             badge = VALUES(badge),
             features = VALUES(features),
             highlighted = VALUES(highlighted),
             color = VALUES(color),
             use_custom_discounts = VALUES(use_custom_discounts),
             cycle_discounts = VALUES(cycle_discounts)`,
          [
            item.id,
            item.name || '',
            toNumber(item.priceMonthly, 0),
            toNumber(item.productLimit, 3),
            toNumber(item.businessLimit, 1),
            item.badge || '',
            JSON.stringify(item.features || []),
            item.highlighted ? 1 : 0,
            item.color || '#1D4ED8',
            item.useCustomDiscounts ? 1 : 0,
            item.cycleDiscounts ? JSON.stringify(item.cycleDiscounts) : null,
            0,
          ]
        );
        break;
      }

      case 'businesses': {
        const hashedPwd = hashIfPresent(item.password);
        await conn.query(
          `INSERT INTO businesses (
             id, name, slug, city_id, category_id, plan_id, description, phone, whatsapp, email, owner_email,
             address, neighborhood, opening_hours, weekly_schedule, logo_url, cover_url, instagram, facebook,
             website, password, is_verified, email_verified, payment_status, pending_plan_id,
             pending_billing_cycle, billing_cycle, plan_expires_at, payment_token, created_at, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             slug = VALUES(slug),
             city_id = VALUES(city_id),
             category_id = VALUES(category_id),
             plan_id = VALUES(plan_id),
             description = VALUES(description),
             phone = VALUES(phone),
             whatsapp = VALUES(whatsapp),
             email = VALUES(email),
             owner_email = VALUES(owner_email),
             address = VALUES(address),
             neighborhood = VALUES(neighborhood),
             opening_hours = VALUES(opening_hours),
             weekly_schedule = VALUES(weekly_schedule),
             logo_url = VALUES(logo_url),
             cover_url = VALUES(cover_url),
             instagram = VALUES(instagram),
             facebook = VALUES(facebook),
             website = VALUES(website),
             password = COALESCE(VALUES(password), password),
             is_verified = VALUES(is_verified),
             email_verified = VALUES(email_verified),
             payment_status = VALUES(payment_status),
             pending_plan_id = VALUES(pending_plan_id),
             pending_billing_cycle = VALUES(pending_billing_cycle),
             billing_cycle = VALUES(billing_cycle),
             plan_expires_at = VALUES(plan_expires_at),
             payment_token = VALUES(payment_token)`,
          [
            item.id,
            item.name || '',
            item.slug || '',
            item.cityId || '',
            item.categoryId || '',
            item.planId || '',
            item.description || '',
            item.phone || '',
            item.whatsapp || '',
            item.email || null,
            item.ownerEmail || null,
            item.address || '',
            item.neighborhood || '',
            item.openingHours || null,
            item.weeklySchedule ? JSON.stringify(item.weeklySchedule) : null,
            item.logoUrl || '',
            item.coverUrl || null,
            item.instagram || null,
            item.facebook || null,
            item.website || null,
            hashedPwd,
            item.isVerified ? 1 : 0,
            item.emailVerified ? 1 : 0,
            item.paymentStatus || 'active',
            item.pendingPlanId || null,
            item.pendingBillingCycle || null,
            item.billingCycle || null,
            item.planExpiresAt || null,
            item.paymentToken || null,
            item.createdAt || new Date().toISOString().split('T')[0],
            0,
          ]
        );
        break;
      }

      case 'products': {
        await conn.query(
          `INSERT INTO products (id, business_id, city_id, name, price, original_price, description, image_url, category, is_active, featured, created_at, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             business_id = VALUES(business_id),
             city_id = VALUES(city_id),
             name = VALUES(name),
             price = VALUES(price),
             original_price = VALUES(original_price),
             description = VALUES(description),
             image_url = VALUES(image_url),
             category = VALUES(category),
             is_active = VALUES(is_active),
             featured = VALUES(featured)`,
          [
            item.id,
            item.businessId || '',
            item.cityId || '',
            item.name || '',
            toNumber(item.price, 0),
            toOptionalNumber(item.originalPrice) ?? null,
            item.description || '',
            item.imageUrl || '',
            item.category || '',
            item.isActive === false ? 0 : 1,
            item.featured ? 1 : 0,
            item.createdAt || new Date().toISOString().split('T')[0],
            0,
          ]
        );
        break;
      }

      case 'services': {
        await conn.query(
          `INSERT INTO services (id, business_id, city_id, name, price_type, price, duration, service_mode, description, image_url, category, is_active, featured, created_at, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             business_id = VALUES(business_id),
             city_id = VALUES(city_id),
             name = VALUES(name),
             price_type = VALUES(price_type),
             price = VALUES(price),
             duration = VALUES(duration),
             service_mode = VALUES(service_mode),
             description = VALUES(description),
             image_url = VALUES(image_url),
             category = VALUES(category),
             is_active = VALUES(is_active),
             featured = VALUES(featured)`,
          [
            item.id,
            item.businessId || '',
            item.cityId || '',
            item.name || '',
            item.priceType || 'fixed',
            toOptionalNumber(item.price) ?? null,
            item.duration || '',
            item.serviceMode || 'on_site',
            item.description || '',
            item.imageUrl || '',
            item.category || '',
            item.isActive === false ? 0 : 1,
            item.featured ? 1 : 0,
            item.createdAt || new Date().toISOString().split('T')[0],
            0,
          ]
        );
        break;
      }

      case 'storeProductCategories':
      case 'store_product_categories': {
        await conn.query(
          `INSERT INTO store_product_categories (id, business_id, name, description, sort_order)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             business_id = VALUES(business_id),
             name = VALUES(name),
             description = VALUES(description)`,
          [item.id, item.businessId || '', item.name || '', item.description || null, 0]
        );
        break;
      }

      case 'banners': {
        await conn.query(
          `INSERT INTO banners (id, title, position, image_url, link_url, advertiser_name, city_id, price_monthly, is_active, clicks_count, badge_text, tagline, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             position = VALUES(position),
             image_url = VALUES(image_url),
             link_url = VALUES(link_url),
             advertiser_name = VALUES(advertiser_name),
             city_id = VALUES(city_id),
             price_monthly = VALUES(price_monthly),
             is_active = VALUES(is_active),
             clicks_count = VALUES(clicks_count),
             badge_text = VALUES(badge_text),
             tagline = VALUES(tagline)`,
          [
            item.id,
            item.title || '',
            item.position || 'top',
            item.imageUrl || '',
            item.linkUrl || null,
            item.advertiserName || '',
            item.cityId || 'all',
            toNumber(item.priceMonthly, 0),
            item.isActive === false ? 0 : 1,
            toNumber(item.clicksCount, 0),
            item.badgeText || null,
            item.tagline || null,
            0,
          ]
        );
        break;
      }

      case 'paymentTransactions':
      case 'payment_transactions': {
        await conn.query(
          `INSERT INTO payment_transactions (
             id, business_id, business_name, plan_id, plan_name, billing_cycle, cycle_months, base_amount,
             discount_percent, discount_amount, amount, payment_method, status, mercado_pago_payment_id,
             qr_code, qr_code_text, installments, card_last_four, card_brand, payer_email, created_at, paid_at, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             paid_at = VALUES(paid_at),
             amount = VALUES(amount)`,
          [
            item.id,
            item.businessId || '',
            item.businessName || '',
            item.planId || '',
            item.planName || '',
            item.billingCycle || null,
            toOptionalNumber(item.cycleMonths) ?? null,
            toOptionalNumber(item.baseAmount) ?? null,
            toOptionalNumber(item.discountPercent) ?? null,
            toOptionalNumber(item.discountAmount) ?? null,
            toNumber(item.amount, 0),
            item.paymentMethod || 'pix',
            item.status || 'approved',
            item.mercadoPagoPaymentId || '',
            item.qrCode || null,
            item.qrCodeText || null,
            toOptionalNumber(item.installments) ?? null,
            item.cardLastFour || null,
            item.cardBrand || null,
            item.payerEmail || '',
            item.createdAt || '',
            item.paidAt || null,
            0,
          ]
        );
        break;
      }

      case 'emailLogs':
      case 'email_logs': {
        await conn.query(
          `INSERT INTO email_logs (
             id, recipient_to, template_key, template_name, subject, html_body, text_body,
             verification_code, payment_url, delivery_mode, status, error_message, created_at, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             delivery_mode = VALUES(delivery_mode),
             error_message = VALUES(error_message)`,
          [
            item.id,
            item.to || '',
            item.templateKey || 'test',
            item.templateName || '',
            item.subject || '',
            item.htmlBody || '',
            item.textBody || '',
            item.verificationCode || null,
            item.paymentUrl || null,
            item.deliveryMode || 'local_fallback',
            item.status || 'sent',
            item.errorMessage || null,
            item.createdAt || '',
            0,
          ]
        );
        break;
      }

      default:
        throw new Error(`Unsupported resource: ${resource}`);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

type FieldTransform = (v: unknown) => unknown;
interface FieldDef {
  col: string;
  transform?: FieldTransform;
}

const boolTransform: FieldTransform = (v) => (v ? 1 : 0);
const nullableStr: FieldTransform = (v) => (v === undefined || v === null || v === '' ? null : String(v));
const strTransform: FieldTransform = (v) => (v === undefined || v === null ? '' : String(v));
const numTransform: FieldTransform = (v) => toNumber(v, 0);
const optNumTransform: FieldTransform = (v) => toOptionalNumber(v) ?? null;
const jsonTransform: FieldTransform = (v) => (v === undefined || v === null ? null : JSON.stringify(v));

const RESOURCE_FIELD_MAPS: Record<string, Record<string, FieldDef>> = {
  cities: {
    name: { col: 'name', transform: strTransform },
    state: { col: 'state', transform: strTransform },
    slug: { col: 'slug', transform: strTransform },
    isActive: { col: 'is_active', transform: boolTransform },
    isDefault: { col: 'is_default', transform: boolTransform },
    bannerUrl: { col: 'banner_url', transform: nullableStr },
    description: { col: 'description', transform: nullableStr },
  },
  categories: {
    name: { col: 'name', transform: strTransform },
    slug: { col: 'slug', transform: strTransform },
    iconName: { col: 'icon_name', transform: strTransform },
    description: { col: 'description', transform: nullableStr },
    color: { col: 'color', transform: nullableStr },
  },
  plans: {
    name: { col: 'name', transform: strTransform },
    priceMonthly: { col: 'price_monthly', transform: numTransform },
    productLimit: { col: 'product_limit', transform: numTransform },
    businessLimit: { col: 'business_limit', transform: numTransform },
    badge: { col: 'badge', transform: strTransform },
    features: { col: 'features', transform: (v) => JSON.stringify(Array.isArray(v) ? v : []) },
    highlighted: { col: 'highlighted', transform: boolTransform },
    color: { col: 'color', transform: strTransform },
    useCustomDiscounts: { col: 'use_custom_discounts', transform: boolTransform },
    cycleDiscounts: { col: 'cycle_discounts', transform: jsonTransform },
  },
  businesses: {
    name: { col: 'name', transform: strTransform },
    slug: { col: 'slug', transform: strTransform },
    cityId: { col: 'city_id', transform: strTransform },
    categoryId: { col: 'category_id', transform: strTransform },
    planId: { col: 'plan_id', transform: strTransform },
    description: { col: 'description', transform: strTransform },
    phone: { col: 'phone', transform: strTransform },
    whatsapp: { col: 'whatsapp', transform: strTransform },
    email: { col: 'email', transform: nullableStr },
    ownerEmail: { col: 'owner_email', transform: nullableStr },
    address: { col: 'address', transform: strTransform },
    neighborhood: { col: 'neighborhood', transform: strTransform },
    openingHours: { col: 'opening_hours', transform: nullableStr },
    weeklySchedule: { col: 'weekly_schedule', transform: jsonTransform },
    logoUrl: { col: 'logo_url', transform: strTransform },
    coverUrl: { col: 'cover_url', transform: nullableStr },
    instagram: { col: 'instagram', transform: nullableStr },
    facebook: { col: 'facebook', transform: nullableStr },
    website: { col: 'website', transform: nullableStr },
    password: { col: 'password', transform: hashIfPresent },
    isVerified: { col: 'is_verified', transform: boolTransform },
    emailVerified: { col: 'email_verified', transform: boolTransform },
    paymentStatus: { col: 'payment_status', transform: strTransform },
    pendingPlanId: { col: 'pending_plan_id', transform: nullableStr },
    pendingBillingCycle: { col: 'pending_billing_cycle', transform: nullableStr },
    billingCycle: { col: 'billing_cycle', transform: nullableStr },
    planExpiresAt: { col: 'plan_expires_at', transform: nullableStr },
    paymentToken: { col: 'payment_token', transform: nullableStr },
  },
  products: {
    businessId: { col: 'business_id', transform: strTransform },
    cityId: { col: 'city_id', transform: strTransform },
    name: { col: 'name', transform: strTransform },
    price: { col: 'price', transform: numTransform },
    originalPrice: { col: 'original_price', transform: optNumTransform },
    description: { col: 'description', transform: strTransform },
    imageUrl: { col: 'image_url', transform: strTransform },
    category: { col: 'category', transform: strTransform },
    isActive: { col: 'is_active', transform: boolTransform },
    featured: { col: 'featured', transform: boolTransform },
  },
  services: {
    businessId: { col: 'business_id', transform: strTransform },
    cityId: { col: 'city_id', transform: strTransform },
    name: { col: 'name', transform: strTransform },
    priceType: { col: 'price_type', transform: strTransform },
    price: { col: 'price', transform: optNumTransform },
    duration: { col: 'duration', transform: strTransform },
    serviceMode: { col: 'service_mode', transform: strTransform },
    description: { col: 'description', transform: strTransform },
    imageUrl: { col: 'image_url', transform: strTransform },
    category: { col: 'category', transform: strTransform },
    isActive: { col: 'is_active', transform: boolTransform },
    featured: { col: 'featured', transform: boolTransform },
  },
  storeProductCategories: {
    businessId: { col: 'business_id', transform: strTransform },
    name: { col: 'name', transform: strTransform },
    description: { col: 'description', transform: nullableStr },
  },
  banners: {
    title: { col: 'title', transform: strTransform },
    position: { col: 'position', transform: strTransform },
    imageUrl: { col: 'image_url', transform: strTransform },
    linkUrl: { col: 'link_url', transform: nullableStr },
    advertiserName: { col: 'advertiser_name', transform: strTransform },
    cityId: { col: 'city_id', transform: strTransform },
    priceMonthly: { col: 'price_monthly', transform: numTransform },
    isActive: { col: 'is_active', transform: boolTransform },
    clicksCount: { col: 'clicks_count', transform: numTransform },
    badgeText: { col: 'badge_text', transform: nullableStr },
    tagline: { col: 'tagline', transform: nullableStr },
  },
};

export async function updateEntityById(
  resource: string,
  id: string,
  updates: Record<string, unknown>
): Promise<{ updated: boolean }> {
  const activePool = getPool();
  if (!activePool) return { updated: false };
  await ensureDatabaseSchema();

  const normalizedResource =
    resource === 'store_product_categories'
      ? 'storeProductCategories'
      : resource;
  const table = RESOURCE_TABLE_MAP[normalizedResource];
  const fieldMap = RESOURCE_FIELD_MAPS[normalizedResource];

  if (!table || !fieldMap) {
    throw new Error(`Unsupported update resource: ${resource}`);
  }

  const setClauses: string[] = [];
  const params: unknown[] = [];

  for (const [key, def] of Object.entries(fieldMap)) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const rawVal = updates[key];
      if (normalizedResource === 'businesses' && key === 'password') {
        if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
          continue;
        }
      }
      const dbVal = def.transform ? def.transform(rawVal) : rawVal;
      setClauses.push(`${def.col} = ?`);
      params.push(dbVal);
    }
  }

  if (setClauses.length === 0) {
    return { updated: false };
  }

  const conn = await activePool.getConnection();
  try {
    await conn.beginTransaction();

    if (normalizedResource === 'cities' && updates.isDefault === true) {
      await conn.query(`UPDATE cities SET is_default = 0 WHERE id <> ?`, [id]);
    }

    const [result] = await conn.query<any>(
      `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ?`,
      [...params, id]
    );

    await conn.commit();
    return { updated: (result?.affectedRows || 0) > 0 };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function deleteEntityById(resource: string, id: string): Promise<{ deleted: boolean }> {
  const activePool = getPool();
  if (!activePool) return { deleted: false };
  await ensureDatabaseSchema();

  const table = RESOURCE_TABLE_MAP[resource];
  if (!table) {
    throw new Error(`Unsupported delete resource: ${resource}`);
  }

  const conn = await activePool.getConnection();
  try {
    await conn.beginTransaction();

    if (resource === 'businesses') {
      await conn.query(`DELETE FROM products WHERE business_id = ?`, [id]);
      await conn.query(`DELETE FROM services WHERE business_id = ?`, [id]);
      await conn.query(`DELETE FROM store_product_categories WHERE business_id = ?`, [id]);
    }

    if ((resource === 'emailLogs' || resource === 'email_logs') && id === 'all') {
      await conn.query(`DELETE FROM email_logs`);
      await conn.commit();
      return { deleted: true };
    }

    const [result] = await conn.query<any>(`DELETE FROM ${table} WHERE id = ?`, [id]);
    await conn.commit();
    return { deleted: (result?.affectedRows || 0) > 0 };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export interface SessionSettingsValues {
  adminSessionDurationMinutes: number;
  businessSessionDurationMinutes: number;
}

export interface DbAuthSessionPayload {
  isAuthenticated: true;
  role: 'admin' | 'business';
  userId: string;
  name: string;
  email: string;
  businessId?: string;
  token: string;
  loginTimestamp: number;
  expiresAt: number;
  durationMinutes: number;
}

function clampDurationMinutes(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(5, Math.min(43200, Math.round(parsed)));
}

export async function getSessionConfigFromDb(connOrPool?: Pool | PoolConnection): Promise<SessionSettingsValues> {
  const executor = connOrPool || getPool();
  const defaults: SessionSettingsValues = {
    adminSessionDurationMinutes: 120,
    businessSessionDurationMinutes: 1440,
  };
  if (!executor) return defaults;

  try {
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT setting_value FROM app_settings WHERE setting_key = 'sessionConfig' LIMIT 1`
    );
    if (rows.length === 0) return defaults;
    const parsed = parseJsonColumn<Partial<SessionSettingsValues>>(rows[0].setting_value, {});
    return {
      adminSessionDurationMinutes: clampDurationMinutes(parsed.adminSessionDurationMinutes, 120),
      businessSessionDurationMinutes: clampDurationMinutes(parsed.businessSessionDurationMinutes, 1440),
    };
  } catch {
    return defaults;
  }
}

export async function cleanupExpiredSessions(connOrPool?: Pool | PoolConnection): Promise<void> {
  const executor = connOrPool || getPool();
  if (!executor) return;
  try {
    await executor.query(
      `DELETE FROM auth_sessions WHERE expires_at < ? OR revoked = 1`,
      [Date.now()]
    );
  } catch {
    // Ignore cleanup errors if table is initializing
  }
}

export async function authenticateWithDb(
  params: {
    loginType: 'admin' | 'business';
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  },
  allowRetry = true
): Promise<{ success: boolean; session?: DbAuthSessionPayload; error?: string }> {
  const activePool = getPool();
  const normalizedEmail = params.email.trim().toLowerCase();
  const rawPassword = params.password;

  if (!normalizedEmail || !rawPassword) {
    return { success: false, error: 'Informe o e-mail e a senha de acesso.' };
  }

  if (!activePool) {
    return { success: false, error: 'Banco de dados não configurado no servidor.' };
  }

  let conn: PoolConnection | null = null;
  try {
    await ensureDatabaseSchema();
    conn = await activePool.getConnection();
  } catch (err) {
    if (allowRetry && isTransientConnectionError(err)) {
      await closePool().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 400));
      return authenticateWithDb(params, false);
    }
    throw err;
  }

  try {
    await cleanupExpiredSessions(conn);
    const sessionCfg = await getSessionConfigFromDb(conn);
    const now = Date.now();

    if (params.loginType === 'admin') {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, email, name, password_hash, is_active
         FROM admin_users
         WHERE LOWER(email) = ?
         LIMIT 1`,
        [normalizedEmail]
      );

      if (rows.length === 0) {
        return { success: false, error: 'Usuário administrador ou senha inválidos.' };
      }

      const adminRow = rows[0];
      if (!Boolean(adminRow.is_active)) {
        return { success: false, error: 'Esta conta administrativa está desativada.' };
      }

      if (!verifyPassword(rawPassword, adminRow.password_hash)) {
        return { success: false, error: 'Usuário administrador ou senha inválidos.' };
      }

      if (!isPasswordHashed(adminRow.password_hash)) {
        await conn.query(`UPDATE admin_users SET password_hash = ? WHERE id = ?`, [
          hashPassword(rawPassword),
          adminRow.id,
        ]);
      }

      const durationMinutes = sessionCfg.adminSessionDurationMinutes;
      const expiresAt = now + durationMinutes * 60 * 1000;
      const token = crypto.randomBytes(32).toString('hex');

      await conn.query(`UPDATE admin_users SET last_login_at = ? WHERE id = ?`, [
        new Date(now).toISOString(),
        adminRow.id,
      ]);

      await conn.query(
        `INSERT INTO auth_sessions (
           token, role, user_id, email, name, business_id, ip_address, user_agent,
           created_at, expires_at, last_activity_at, revoked
         ) VALUES (?, 'admin', ?, ?, ?, NULL, ?, ?, ?, ?, ?, 0)`,
        [
          token,
          adminRow.id,
          adminRow.email,
          adminRow.name || 'Administrador Master',
          params.ipAddress || null,
          (params.userAgent || '').slice(0, 480) || null,
          now,
          expiresAt,
          now,
        ]
      );

      return {
        success: true,
        session: {
          isAuthenticated: true,
          role: 'admin',
          userId: String(adminRow.id),
          name: String(adminRow.name || 'Administrador Master'),
          email: String(adminRow.email),
          token,
          loginTimestamp: now,
          expiresAt,
          durationMinutes,
        },
      };
    }

    const [bizRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, name, email, owner_email, password
       FROM businesses
       WHERE LOWER(owner_email) = ? OR LOWER(email) = ?
       ORDER BY sort_order ASC, id ASC`,
      [normalizedEmail, normalizedEmail]
    );

    if (bizRows.length === 0) {
      return { success: false, error: 'Nenhuma loja encontrada com este e-mail.' };
    }

    let matchedBiz: RowDataPacket | null = null;
    let hasAnyPasswordConfigured = false;
    for (const row of bizRows) {
      if (row.password && String(row.password).trim() !== '') {
        hasAnyPasswordConfigured = true;
        if (verifyPassword(rawPassword, row.password)) {
          matchedBiz = row;
          break;
        }
      }
    }

    if (!hasAnyPasswordConfigured) {
      return {
        success: false,
        error: 'Esta loja ainda não possui senha cadastrada. Solicite ao administrador definir uma senha.',
      };
    }

    if (!matchedBiz) {
      return { success: false, error: 'E-mail ou senha da loja inválidos.' };
    }

    if (!isPasswordHashed(matchedBiz.password)) {
      await conn.query(`UPDATE businesses SET password = ? WHERE id = ?`, [
        hashPassword(rawPassword),
        matchedBiz.id,
      ]);
    }

    const durationMinutes = sessionCfg.businessSessionDurationMinutes;
    const expiresAt = now + durationMinutes * 60 * 1000;
    const token = crypto.randomBytes(32).toString('hex');
    const resolvedEmail = String(matchedBiz.owner_email || matchedBiz.email || normalizedEmail);

    await conn.query(
      `INSERT INTO auth_sessions (
         token, role, user_id, email, name, business_id, ip_address, user_agent,
         created_at, expires_at, last_activity_at, revoked
       ) VALUES (?, 'business', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        token,
        matchedBiz.id,
        resolvedEmail,
        matchedBiz.name,
        matchedBiz.id,
        params.ipAddress || null,
        (params.userAgent || '').slice(0, 480) || null,
        now,
        expiresAt,
        now,
      ]
    );

    return {
      success: true,
      session: {
        isAuthenticated: true,
        role: 'business',
        userId: String(matchedBiz.id),
        name: String(matchedBiz.name),
        email: resolvedEmail,
        businessId: String(matchedBiz.id),
        token,
        loginTimestamp: now,
        expiresAt,
        durationMinutes,
      },
    };
  } finally {
    conn.release();
  }
}

export async function verifySessionTokenInDb(token: string): Promise<DbAuthSessionPayload | null> {
  const activePool = getPool();
  if (!activePool || !token) return null;
  await ensureDatabaseSchema();

  const now = Date.now();
  const [rows] = await activePool.query<RowDataPacket[]>(
    `SELECT * FROM auth_sessions WHERE token = ? AND revoked = 0 LIMIT 1`,
    [token]
  );

  if (rows.length === 0) return null;
  const row = rows[0];
  const expiresAt = Number(row.expires_at || 0);
  if (now >= expiresAt) {
    await activePool.query(`DELETE FROM auth_sessions WHERE token = ?`, [token]);
    return null;
  }

  if (row.role === 'admin') {
    const [admins] = await activePool.query<RowDataPacket[]>(
      `SELECT id FROM admin_users WHERE id = ? AND is_active = 1 LIMIT 1`,
      [row.user_id]
    );
    if (admins.length === 0) {
      await activePool.query(`DELETE FROM auth_sessions WHERE token = ?`, [token]);
      return null;
    }
  } else if (row.role === 'business' && row.business_id) {
    const [bizes] = await activePool.query<RowDataPacket[]>(
      `SELECT id FROM businesses WHERE id = ? LIMIT 1`,
      [row.business_id]
    );
    if (bizes.length === 0) {
      await activePool.query(`DELETE FROM auth_sessions WHERE token = ?`, [token]);
      return null;
    }
  }

  await activePool.query(`UPDATE auth_sessions SET last_activity_at = ? WHERE token = ?`, [
    now,
    token,
  ]);

  const sessionCfg = await getSessionConfigFromDb(activePool);
  const durationMinutes =
    row.role === 'admin'
      ? sessionCfg.adminSessionDurationMinutes
      : sessionCfg.businessSessionDurationMinutes;

  return {
    isAuthenticated: true,
    role: row.role === 'admin' ? 'admin' : 'business',
    userId: String(row.user_id),
    name: String(row.name),
    email: String(row.email),
    ...(row.business_id ? { businessId: String(row.business_id) } : {}),
    token: String(row.token),
    loginTimestamp: Number(row.created_at),
    expiresAt,
    durationMinutes,
  };
}

export async function renewSessionTokenInDb(token: string): Promise<DbAuthSessionPayload | null> {
  const activePool = getPool();
  if (!activePool || !token) return null;
  const existing = await verifySessionTokenInDb(token);
  if (!existing) return null;

  const sessionCfg = await getSessionConfigFromDb(activePool);
  const now = Date.now();
  const durationMinutes =
    existing.role === 'admin'
      ? sessionCfg.adminSessionDurationMinutes
      : sessionCfg.businessSessionDurationMinutes;
  const expiresAt = now + durationMinutes * 60 * 1000;

  await activePool.query(
    `UPDATE auth_sessions SET expires_at = ?, last_activity_at = ? WHERE token = ?`,
    [expiresAt, now, token]
  );

  return {
    ...existing,
    loginTimestamp: now,
    expiresAt,
    durationMinutes,
  };
}

export async function revokeSessionTokenInDb(token: string): Promise<void> {
  const activePool = getPool();
  if (!activePool || !token) return;
  try {
    await ensureDatabaseSchema();
    await activePool.query(`DELETE FROM auth_sessions WHERE token = ?`, [token]);
  } catch {
    // Ignore revoke errors
  }
}

export async function switchBusinessSessionInDb(
  token: string,
  targetBusinessId: string
): Promise<{ success: boolean; session?: DbAuthSessionPayload; error?: string }> {
  const activePool = getPool();
  if (!activePool || !token) {
    return { success: false, error: 'Sessão inválida.' };
  }

  const current = await verifySessionTokenInDb(token);
  if (!current || current.role !== 'business') {
    return { success: false, error: 'Sessão de lojista inválida ou expirada.' };
  }

  const [rows] = await activePool.query<RowDataPacket[]>(
    `SELECT id, name, email, owner_email FROM businesses WHERE id = ? LIMIT 1`,
    [targetBusinessId]
  );

  if (rows.length === 0) {
    return { success: false, error: 'Loja não encontrada.' };
  }

  const target = rows[0];
  const sessionEmail = current.email.trim().toLowerCase();
  const targetOwner = String(target.owner_email || '').trim().toLowerCase();
  const targetEmail = String(target.email || '').trim().toLowerCase();

  if (targetOwner !== sessionEmail && targetEmail !== sessionEmail && target.id !== current.businessId) {
    return { success: false, error: 'Você não tem permissão para acessar esta loja.' };
  }

  await activePool.query(
    `UPDATE auth_sessions SET business_id = ?, name = ?, last_activity_at = ? WHERE token = ?`,
    [target.id, target.name, Date.now(), token]
  );

  return {
    success: true,
    session: {
      ...current,
      businessId: String(target.id),
      name: String(target.name),
    },
  };
}

export async function changeAdminPasswordInDb(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const activePool = getPool();
  if (!activePool) return { success: false, error: 'Banco de dados não configurado.' };

  const session = await verifySessionTokenInDb(token);
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Sessão administrativa inválida ou expirada.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  const [rows] = await activePool.query<RowDataPacket[]>(
    `SELECT id, password_hash FROM admin_users WHERE id = ? LIMIT 1`,
    [session.userId]
  );

  if (rows.length === 0) {
    return { success: false, error: 'Usuário administrador não encontrado.' };
  }

  if (!verifyPassword(currentPassword, rows[0].password_hash)) {
    return { success: false, error: 'Senha atual incorreta.' };
  }

  await activePool.query(`UPDATE admin_users SET password_hash = ? WHERE id = ?`, [
    hashPassword(newPassword),
    session.userId,
  ]);

  return { success: true };
}

export interface DatabaseDiagnostics {
  configured: boolean;
  connected: boolean;
  seeded: boolean;
  version?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  counts?: Record<string, number>;
  migratedColumns?: string[];
  droppedLegacyTables?: string[];
  remainingLegacyTables?: string[];
  error?: string;
}

export async function cleanupLegacyTables(): Promise<{ droppedTables: string[] }> {
  const activePool = getPool();
  if (!activePool) return { droppedTables: [] };
  const conn = await activePool.getConnection();
  try {
    const droppedTables = await dropLegacyPortugueseTables(conn);
    if (droppedTables.length > 0) {
      lastDroppedLegacyTables = droppedTables;
    }
    return { droppedTables };
  } finally {
    conn.release();
  }
}

export async function migrateDatabaseSchema(): Promise<{
  addedColumns: string[];
  droppedLegacyTables: string[];
}> {
  lastMigratedColumns = [];
  lastDroppedLegacyTables = [];
  await ensureDatabaseSchema(true);
  return {
    addedColumns: lastMigratedColumns,
    droppedLegacyTables: lastDroppedLegacyTables,
  };
}

export async function getDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
  const cfg = getDbConfig();
  if (!cfg.configured) {
    return {
      configured: false,
      connected: false,
      seeded: false,
    };
  }

  const safeTarget = cfg.uri
    ? { host: 'via DATABASE_URL', port: 3306, database: '(DATABASE_URL)', user: '(DATABASE_URL)' }
    : { host: cfg.host, port: cfg.port || 3306, database: cfg.database, user: cfg.user };

  try {
    const activePool = getPool();
    if (!activePool) {
      return {
        configured: false,
        connected: false,
        seeded: false,
      };
    }

    lastMigratedColumns = [];
    lastDroppedLegacyTables = [];
    await ensureDatabaseSchema(true);
    await cleanupExpiredSessions(activePool);

    const [verRows] = await activePool.query<RowDataPacket[]>(`SELECT VERSION() AS version`);
    const version = verRows[0]?.version ? String(verRows[0].version) : undefined;
    const seeded = await isSeedCompleted(activePool);

    const [allTableRows] = await activePool.query<RowDataPacket[]>(
      `SELECT TABLE_NAME AS tableName FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()`
    );
    const existingSet = new Set(allTableRows.map((r) => String(r.tableName || '').toLowerCase()));
    const remainingLegacyTables = LEGACY_PORTUGUESE_TABLES.filter((t) =>
      existingSet.has(t.toLowerCase())
    );

    const tables = [
      'admin_users',
      'auth_sessions',
      'cities',
      'categories',
      'plans',
      'businesses',
      'products',
      'services',
      'store_product_categories',
      'banners',
      'payment_transactions',
      'email_logs',
      'app_settings',
    ];
    const counts: Record<string, number> = {};
    for (const tbl of tables) {
      const [cRows] = await activePool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${tbl}`);
      counts[tbl] = Number(cRows[0]?.total || 0);
    }

    return {
      configured: true,
      connected: true,
      seeded,
      version,
      ...safeTarget,
      counts,
      migratedColumns: lastMigratedColumns,
      droppedLegacyTables: lastDroppedLegacyTables,
      remainingLegacyTables,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      seeded: false,
      ...safeTarget,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao conectar no MySQL.',
    };
  }
}

