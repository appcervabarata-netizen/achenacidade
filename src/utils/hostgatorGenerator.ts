import { City, Category, Plan, Business, Product, Service, AdBanner, StoreProductCategory } from '../types';

export interface HostGatorPackage {
  schemaSql: string;
  configPhp: string;
  apiPhp: string;
  exportSqlPhp: string;
  htaccess: string;
  instructionsTxt: string;
}

export function generateHostGatorPackage(
  cities: City[],
  categories: Category[],
  plans: Plan[],
  businesses: Business[],
  products: Product[],
  banners: AdBanner[] = [],
  services: Service[] = [],
  storeProductCategories: StoreProductCategory[] = []
): HostGatorPackage {
  // 1. MySQL Schema DDL
  const schemaSql = `-- ========================================================
-- achenacidade — Estrutura e Dados Iniciais para MySQL
-- Compatível com HostGator (cPanel / phpMyAdmin)
-- Versão MySQL: 5.7+ / 8.0+ / MariaDB 10.3+
-- Codificação: utf8mb4_unicode_ci
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABELA DE CIDADES
CREATE TABLE IF NOT EXISTS \`cidades\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`name\` VARCHAR(150) NOT NULL,
  \`state\` VARCHAR(32) NOT NULL,
  \`slug\` VARCHAR(180) NOT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
  \`banner_url\` LONGTEXT NULL,
  \`description\` TEXT NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_slug\` (\`slug\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS \`categorias\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`name\` VARCHAR(150) NOT NULL,
  \`slug\` VARCHAR(180) NOT NULL,
  \`icon_name\` VARCHAR(80) DEFAULT 'Store',
  \`description\` TEXT NULL,
  \`color\` VARCHAR(32) DEFAULT '#2563EB',
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_cat_slug\` (\`slug\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE PLANOS DE ANÚNCIO
CREATE TABLE IF NOT EXISTS \`planos\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`name\` VARCHAR(150) NOT NULL,
  \`price_monthly\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`product_limit\` INT NOT NULL DEFAULT 3,
  \`business_limit\` INT NOT NULL DEFAULT 1,
  \`badge\` VARCHAR(80) DEFAULT 'Gratuito',
  \`features_json\` LONGTEXT,
  \`use_custom_discounts\` TINYINT(1) DEFAULT 0,
  \`cycle_discounts_json\` LONGTEXT,
  \`highlighted\` TINYINT(1) DEFAULT 0,
  \`color\` VARCHAR(32) DEFAULT '#1D4ED8',
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA DE EMPRESAS (Completa: Acesso, Horário Semanal, Mídia, Verificação e Ciclo/Pagamento)
CREATE TABLE IF NOT EXISTS \`empresas\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`slug\` VARCHAR(255) NOT NULL,
  \`city_id\` VARCHAR(120) NOT NULL,
  \`category_id\` VARCHAR(120) NOT NULL,
  \`plan_id\` VARCHAR(120) NOT NULL,
  \`description\` LONGTEXT NULL,
  \`phone\` VARCHAR(80) DEFAULT '',
  \`whatsapp\` VARCHAR(80) NOT NULL,
  \`email\` VARCHAR(255) DEFAULT '',
  \`owner_email\` VARCHAR(255) DEFAULT '',
  \`address\` VARCHAR(255) DEFAULT '',
  \`neighborhood\` VARCHAR(255) DEFAULT '',
  \`opening_hours\` TEXT NULL,
  \`weekly_schedule_json\` LONGTEXT NULL,
  \`logo_url\` LONGTEXT NULL,
  \`cover_url\` LONGTEXT NULL,
  \`instagram\` VARCHAR(255) DEFAULT '',
  \`facebook\` VARCHAR(255) DEFAULT '',
  \`website\` VARCHAR(255) DEFAULT '',
  \`password\` VARCHAR(255) DEFAULT '',
  \`is_verified\` TINYINT(1) DEFAULT 0,
  \`email_verified\` TINYINT(1) DEFAULT 0,
  \`payment_status\` VARCHAR(40) DEFAULT 'active',
  \`pending_plan_id\` VARCHAR(120) NULL,
  \`pending_billing_cycle\` VARCHAR(32) NULL,
  \`billing_cycle\` VARCHAR(32) NULL,
  \`plan_expires_at\` VARCHAR(64) NULL,
  \`payment_token\` VARCHAR(255) NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_city\` (\`city_id\`),
  KEY \`idx_category\` (\`category_id\`),
  KEY \`idx_plan\` (\`plan_id\`),
  CONSTRAINT \`fk_emp_city\` FOREIGN KEY (\`city_id\`) REFERENCES \`cidades\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_emp_cat\` FOREIGN KEY (\`category_id\`) REFERENCES \`categorias\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_emp_plan\` FOREIGN KEY (\`plan_id\`) REFERENCES \`planos\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELA DE PRODUTOS DAS EMPRESAS
CREATE TABLE IF NOT EXISTS \`produtos\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`business_id\` VARCHAR(120) NOT NULL,
  \`city_id\` VARCHAR(120) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`original_price\` DECIMAL(10,2) DEFAULT NULL,
  \`description\` LONGTEXT NULL,
  \`image_url\` LONGTEXT NULL,
  \`category\` VARCHAR(255) DEFAULT '',
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`featured\` TINYINT(1) DEFAULT 0,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_prod_biz\` (\`business_id\`),
  KEY \`idx_prod_city\` (\`city_id\`),
  CONSTRAINT \`fk_prod_biz\` FOREIGN KEY (\`business_id\`) REFERENCES \`empresas\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_prod_city\` FOREIGN KEY (\`city_id\`) REFERENCES \`cidades\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5B. TABELA DE SERVIÇOS DAS EMPRESAS
CREATE TABLE IF NOT EXISTS \`servicos\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`business_id\` VARCHAR(120) NOT NULL,
  \`city_id\` VARCHAR(120) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`price\` DECIMAL(10,2) DEFAULT NULL,
  \`price_type\` VARCHAR(32) NOT NULL DEFAULT 'fixed',
  \`duration\` VARCHAR(120) DEFAULT '',
  \`service_mode\` VARCHAR(32) NOT NULL DEFAULT 'on_site',
  \`description\` LONGTEXT NULL,
  \`image_url\` LONGTEXT NULL,
  \`category\` VARCHAR(255) DEFAULT '',
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`featured\` TINYINT(1) DEFAULT 0,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_serv_biz\` (\`business_id\`),
  KEY \`idx_serv_city\` (\`city_id\`),
  CONSTRAINT \`fk_serv_biz\` FOREIGN KEY (\`business_id\`) REFERENCES \`empresas\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_serv_city\` FOREIGN KEY (\`city_id\`) REFERENCES \`cidades\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5C. TABELA DE CATEGORIAS INTERNAS DE PRODUTOS DAS LOJAS
CREATE TABLE IF NOT EXISTS \`categorias_produtos_loja\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`business_id\` VARCHAR(120) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_spc_biz\` (\`business_id\`),
  CONSTRAINT \`fk_spc_biz\` FOREIGN KEY (\`business_id\`) REFERENCES \`empresas\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABELA DE BANNERS PUBLICITÁRIOS (Patrocinados)
CREATE TABLE IF NOT EXISTS \`banners\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`tagline\` TEXT NULL,
  \`position\` VARCHAR(40) NOT NULL DEFAULT 'top',
  \`image_url\` LONGTEXT NOT NULL,
  \`link_url\` VARCHAR(500) DEFAULT '',
  \`advertiser_name\` VARCHAR(255) NOT NULL,
  \`city_id\` VARCHAR(120) DEFAULT 'all',
  \`price_monthly\` DECIMAL(10,2) DEFAULT 0.00,
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`clicks_count\` INT DEFAULT 0,
  \`badge_text\` VARCHAR(120) DEFAULT 'Publicidade',
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABELA DE PAGAMENTOS E ASSINATURAS (MERCADO PAGO)
CREATE TABLE IF NOT EXISTS \`pagamentos\` (
  \`id\` VARCHAR(120) NOT NULL,
  \`business_id\` VARCHAR(120) NOT NULL,
  \`business_name\` VARCHAR(255) DEFAULT '',
  \`plan_id\` VARCHAR(120) NOT NULL,
  \`plan_name\` VARCHAR(255) DEFAULT '',
  \`billing_cycle\` VARCHAR(32) DEFAULT 'monthly',
  \`cycle_months\` INT DEFAULT 1,
  \`base_amount\` DECIMAL(10,2) DEFAULT NULL,
  \`discount_percent\` DECIMAL(5,2) DEFAULT 0.00,
  \`discount_amount\` DECIMAL(10,2) DEFAULT 0.00,
  \`amount\` DECIMAL(10,2) NOT NULL,
  \`payment_method\` VARCHAR(32) NOT NULL,
  \`status\` VARCHAR(32) DEFAULT 'approved',
  \`mercadopago_payment_id\` VARCHAR(255),
  \`qr_code\` LONGTEXT NULL,
  \`qr_code_text\` LONGTEXT NULL,
  \`payer_email\` VARCHAR(255),
  \`installments\` INT DEFAULT 1,
  \`card_last_four\` VARCHAR(16) NULL,
  \`card_brand\` VARCHAR(64) NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` VARCHAR(64) NOT NULL,
  \`paid_at\` VARCHAR(64) NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_business\` (\`business_id\`),
  KEY \`idx_plan\` (\`plan_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- INSERÇÃO DOS DADOS ATUAIS DA PLATAFORMA
-- ========================================================

-- Cidades
${cities
  .map(
    (c, idx) =>
      `INSERT INTO \`cidades\` (\`id\`, \`name\`, \`state\`, \`slug\`, \`is_active\`, \`is_default\`, \`banner_url\`, \`description\`, \`sort_order\`) VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.state)}, ${escapeSql(c.slug)}, ${c.isActive ? 1 : 0}, ${c.isDefault ? 1 : 0}, ${escapeSql(c.bannerUrl || '')}, ${escapeSql(c.description || '')}, ${idx}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`is_default\`=VALUES(\`is_default\`), \`sort_order\`=VALUES(\`sort_order\`);`
  )
  .join('\n')}

-- Categorias
${categories
  .map(
    (cat, idx) =>
      `INSERT INTO \`categorias\` (\`id\`, \`name\`, \`slug\`, \`icon_name\`, \`description\`, \`color\`, \`sort_order\`) VALUES (${escapeSql(cat.id)}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${escapeSql(cat.iconName)}, ${escapeSql(cat.description || '')}, ${escapeSql(cat.color || '#2563EB')}, ${idx}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`sort_order\`=VALUES(\`sort_order\`);`
  )
  .join('\n')}

-- Planos
${plans
  .map(
    (p, idx) =>
      `INSERT INTO \`planos\` (\`id\`, \`name\`, \`price_monthly\`, \`product_limit\`, \`business_limit\`, \`badge\`, \`features_json\`, \`use_custom_discounts\`, \`cycle_discounts_json\`, \`highlighted\`, \`color\`, \`sort_order\`) VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${p.priceMonthly.toFixed(2)}, ${p.productLimit}, ${p.businessLimit ?? 1}, ${escapeSql(p.badge)}, ${escapeSql(JSON.stringify(p.features))}, ${p.useCustomDiscounts ? 1 : 0}, ${escapeSql(JSON.stringify(p.cycleDiscounts || null))}, ${p.highlighted ? 1 : 0}, ${escapeSql(p.color)}, ${idx}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`business_limit\`=VALUES(\`business_limit\`), \`sort_order\`=VALUES(\`sort_order\`);`
  )
  .join('\n')}

-- Empresas
${businesses
  .map(
    (b, idx) =>
      `INSERT INTO \`empresas\` (\`id\`, \`name\`, \`slug\`, \`city_id\`, \`category_id\`, \`plan_id\`, \`description\`, \`phone\`, \`whatsapp\`, \`email\`, \`owner_email\`, \`address\`, \`neighborhood\`, \`opening_hours\`, \`weekly_schedule_json\`, \`logo_url\`, \`cover_url\`, \`instagram\`, \`facebook\`, \`website\`, \`password\`, \`is_verified\`, \`email_verified\`, \`payment_status\`, \`pending_plan_id\`, \`pending_billing_cycle\`, \`billing_cycle\`, \`plan_expires_at\`, \`payment_token\`, \`created_at\`, \`sort_order\`) VALUES (${escapeSql(b.id)}, ${escapeSql(b.name)}, ${escapeSql(b.slug)}, ${escapeSql(b.cityId)}, ${escapeSql(b.categoryId)}, ${escapeSql(b.planId)}, ${escapeSql(b.description)}, ${escapeSql(b.phone)}, ${escapeSql(b.whatsapp)}, ${escapeSql(b.email || '')}, ${escapeSql(b.ownerEmail || '')}, ${escapeSql(b.address)}, ${escapeSql(b.neighborhood)}, ${escapeSql(b.openingHours || '')}, ${escapeSql(JSON.stringify(b.weeklySchedule || []))}, ${escapeSql(b.logoUrl)}, ${escapeSql(b.coverUrl || '')}, ${escapeSql(b.instagram || '')}, ${escapeSql(b.facebook || '')}, ${escapeSql(b.website || '')}, ${escapeSql(b.password || '123456')}, ${b.isVerified ? 1 : 0}, ${b.emailVerified ? 1 : 0}, ${escapeSql(b.paymentStatus || 'active')}, ${escapeSql(b.pendingPlanId || '')}, ${escapeSql(b.pendingBillingCycle || '')}, ${escapeSql(b.billingCycle || '')}, ${escapeSql(b.planExpiresAt || '')}, ${escapeSql(b.paymentToken || '')}, ${escapeSql(b.createdAt || new Date().toISOString().split('T')[0])}, ${idx}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`sort_order\`=VALUES(\`sort_order\`);`
  )
  .join('\n')}

-- Produtos
${products
  .map(
    (prod, idx) =>
      `INSERT INTO \`produtos\` (\`id\`, \`business_id\`, \`city_id\`, \`name\`, \`price\`, \`original_price\`, \`description\`, \`image_url\`, \`category\`, \`is_active\`, \`featured\`, \`created_at\`, \`sort_order\`) VALUES (${escapeSql(prod.id)}, ${escapeSql(prod.businessId)}, ${escapeSql(prod.cityId)}, ${escapeSql(prod.name)}, ${prod.price.toFixed(2)}, ${prod.originalPrice ? prod.originalPrice.toFixed(2) : 'NULL'}, ${escapeSql(prod.description)}, ${escapeSql(prod.imageUrl)}, ${escapeSql(prod.category)}, ${prod.isActive ? 1 : 0}, ${prod.featured ? 1 : 0}, ${escapeSql(prod.createdAt || new Date().toISOString().split('T')[0])}, ${idx}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`sort_order\`=VALUES(\`sort_order\`);`
  )
  .join('\n')}

-- Serviços
${services
  .map(
    (serv, idx) =>
      `INSERT INTO \`servicos\` (\`id\`, \`business_id\`, \`city_id\`, \`name\`, \`price\`, \`price_type\`, \`duration\`, \`service_mode\`, \`description\`, \`image_url\`, \`category\`, \`is_active\`, \`featured\`, \`created_at\`, \`sort_order\`) VALUES (${escapeSql(serv.id)}, ${escapeSql(serv.businessId)}, ${escapeSql(serv.cityId)}, ${escapeSql(serv.name)}, ${serv.price !== undefined && serv.price !== null ? serv.price.toFixed(2) : 'NULL'}, ${escapeSql(serv.priceType)}, ${escapeSql(serv.duration || '')}, ${escapeSql(serv.serviceMode)}, ${escapeSql(serv.description)}, ${escapeSql(serv.imageUrl)}, ${escapeSql(serv.category)}, ${serv.isActive ? 1 : 0}, ${serv.featured ? 1 : 0}, ${escapeSql(serv.createdAt || new Date().toISOString().split('T')[0])}, ${idx}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`sort_order\`=VALUES(\`sort_order\`);`
  )
  .join('\n')}

-- Categorias de Produtos das Lojas
${storeProductCategories
  .map(
    (spc, idx) =>
      `INSERT INTO \`categorias_produtos_loja\` (\`id\`, \`business_id\`, \`name\`, \`description\`, \`sort_order\`) VALUES (${escapeSql(spc.id)}, ${escapeSql(spc.businessId)}, ${escapeSql(spc.name)}, ${escapeSql(spc.description || '')}, ${idx}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`sort_order\`=VALUES(\`sort_order\`);`
  )
  .join('\n')}

-- Banners
${banners
  .map(
    (b, idx) =>
      `INSERT INTO \`banners\` (\`id\`, \`title\`, \`tagline\`, \`position\`, \`image_url\`, \`link_url\`, \`advertiser_name\`, \`city_id\`, \`price_monthly\`, \`is_active\`, \`clicks_count\`, \`badge_text\`, \`sort_order\`) VALUES (${escapeSql(b.id)}, ${escapeSql(b.title)}, ${escapeSql(b.tagline || '')}, ${escapeSql(b.position)}, ${escapeSql(b.imageUrl)}, ${escapeSql(b.linkUrl || '')}, ${escapeSql(b.advertiserName)}, ${escapeSql(b.cityId)}, ${b.priceMonthly.toFixed(2)}, ${b.isActive ? 1 : 0}, ${b.clicksCount || 0}, ${escapeSql(b.badgeText || 'Publicidade')}, ${idx}) ON DUPLICATE KEY UPDATE \`title\`=VALUES(\`title\`), \`sort_order\`=VALUES(\`sort_order\`);`
  )
  .join('\n')}

SET FOREIGN_KEY_CHECKS = 1;
`;

  // 2. config.php (HostGator PDO)
  const configPhp = `<?php
/**
 * achenacidade — Configuração do Banco de Dados MySQL para HostGator
 *
 * Preencha com os dados do seu cPanel na HostGator:
 * 1. Crie o banco de dados no menu "Bancos de Dados MySQL" do cPanel.
 * 2. Crie um usuário e senha para o banco de dados.
 * 3. Associe o usuário ao banco de dados com TODOS OS PRIVILÉGIOS.
 */

// Configurações do HostGator
define('DB_HOST', 'localhost'); // Na HostGator geralmente é 'localhost'
define('DB_NAME', 'seuusuario_achenacidade'); // Nome completo criado no cPanel
define('DB_USER', 'seuusuario_admin');        // Usuário completo criado no cPanel
define('DB_PASS', 'SuaSenhaSeguraAqui123!'); // Senha definida no cPanel
define('DB_CHARSET', 'utf8mb4');

// Configurações do Gateway de Pagamento Mercado Pago (Planos e Assinaturas)
define('MP_ENABLED', true);
define('MP_ENVIRONMENT', 'sandbox'); // 'sandbox' ou 'production'
define('MP_PUBLIC_KEY', 'TEST-b8830182-1209-42b7-a392-192837465012');
define('MP_ACCESS_TOKEN', 'TEST-192837465012-111005-b8830182120942b7a392192837465012-91053872');
define('MP_STATEMENT_DESCRIPTOR', 'ACHENACIDADE');
define('MP_PIX_KEY', 'financeiro@achenacidade.com.br');

// Configuração de CORS para permitir requisições do frontend PWA
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Responde OPTIONS imediatamente para preflight CORS do navegador
if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Função singleton para conexão segura com PDO
 */
function getDbConnection() {
    static \$pdo = null;
    if (\$pdo === null) {
        \$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        \$options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, \$options);
        } catch (PDOException \$e) {
            http_response_code(500);
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode([
                'success' => false,
                'error' => 'Falha na conexão com o banco de dados HostGator.',
                'details' => \$e->getMessage()
            ]);
            exit();
        }
    }
    return \$pdo;
}
`;

  // 3. export_sql.php (SCRIPT PHP SOLICITADO PARA EXPORTAR LOJAS E PRODUTOS PARA SQL)
  const exportSqlPhp = `<?php
/**
 * achenacidade — Script PHP de Exportação de Lojas, Produtos e Dados para Arquivo SQL
 * Compatível com Hospedagem HostGator (cPanel / phpMyAdmin / MySQL 5.7+ / 8.0+)
 *
 * Este script conecta-se ao banco de dados MySQL via PDO e gera um arquivo .sql completo
 * contendo a estrutura (DDL) e todas as instruções INSERT prontas para download ou migração.
 */

require_once __DIR__ . '/config.php';

try {
    \$db = getDbConnection();

    // Nome do arquivo gerado para download
    \$filename = 'achenacidade_export_' . date('Y-m-d_H-i-s') . '.sql';

    // Configura cabeçalhos de resposta para forçar o download do arquivo .sql no navegador
    header('Content-Type: application/sql; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . \$filename . '"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    \$out = fopen('php://output', 'w');

    function writeSqlLine(\$handle, \$text = '') {
        fwrite(\$handle, \$text . "\n");
    }

    writeSqlLine(\$out, "-- ========================================================");
    writeSqlLine(\$out, "-- achenacidade — Exportação de Lojas, Produtos e Banners");
    writeSqlLine(\$out, "-- Gerado em: " . date('Y-m-d H:i:s'));
    writeSqlLine(\$out, "-- Servidor: HostGator MySQL / MariaDB");
    writeSqlLine(\$out, "-- ========================================================");
    writeSqlLine(\$out, "");
    writeSqlLine(\$out, "SET NAMES utf8mb4;");
    writeSqlLine(\$out, "SET FOREIGN_KEY_CHECKS = 0;");
    writeSqlLine(\$out, "");

    // Lista de tabelas a serem exportadas em ordem de integridade referencial
    \$tables = ['cidades', 'categorias', 'planos', 'empresas', 'produtos', 'servicos', 'categorias_produtos_loja', 'banners', 'pagamentos'];

    foreach (\$tables as \$table) {
        // Verifica se a tabela existe no banco de dados
        \$checkStmt = \$db->query("SHOW TABLES LIKE " . \$db->quote(\$table));
        if (\$checkStmt->rowCount() === 0) {
            continue;
        }

        writeSqlLine(\$out, "-- --------------------------------------------------------");
        writeSqlLine(\$out, "-- Estrutura e Registros da tabela \`\$table\`");
        writeSqlLine(\$out, "-- --------------------------------------------------------");

        // Exporta a instrução CREATE TABLE
        \$createStmt = \$db->query("SHOW CREATE TABLE \`\$table\`");
        \$createRow = \$createStmt->fetch(PDO::FETCH_NUM);
        if (isset(\$createRow[1])) {
            writeSqlLine(\$out, "DROP TABLE IF EXISTS \`\$table\`;");
            writeSqlLine(\$out, \$createRow[1] . ";");
            writeSqlLine(\$out, "");
        }

        // Exporta os dados (INSERTS)
        \$dataStmt = \$db->query("SELECT * FROM \`\$table\`");
        \$rows = \$dataStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty(\$rows)) {
            writeSqlLine(\$out, "-- (Nenhum registro cadastrado em \`\$table\`)");
            writeSqlLine(\$out, "");
            continue;
        }

        \$columns = array_keys(\$rows[0]);
        \$colNames = implode(", ", array_map(function(\$c) { return "\`" . \$c . "\`"; }, \$columns));

        foreach (\$rows as \$row) {
            \$values = [];
            foreach (\$row as \$val) {
                if (\$val === null) {
                    \$values[] = "NULL";
                } else {
                    \$values[] = \$db->quote(\$val);
                }
            }
            \$insertSql = "INSERT INTO \`\$table\` (\$colNames) VALUES (" . implode(", ", \$values) . ");";
            writeSqlLine(\$out, \$insertSql);
        }

        writeSqlLine(\$out, "");
    }

    writeSqlLine(\$out, "SET FOREIGN_KEY_CHECKS = 1;");
    writeSqlLine(\$out, "-- Fim da exportação SQL achenacidade");

    fclose(\$out);
    exit();

} catch (Exception \$e) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao exportar dados SQL: ' . \$e->getMessage()
    ]);
}
`;

  // 4. api.php (HostGator REST Endpoints)
  const apiPhp = `<?php
/**
 * achenacidade — API REST em PHP para HostGator
 *
 * Roteamento por action: api.php?action=...
 */

require_once __DIR__ . '/config.php';

header("Content-Type: application/json; charset=UTF-8");

\$action = isset(\$_GET['action']) ? trim(\$_GET['action']) : '';
\$method = \$_SERVER['REQUEST_METHOD'];
\$db = getDbConnection();

try {
    switch (\$action) {

        case 'cities':
            \$stmt = \$db->query("SELECT * FROM cidades WHERE is_active = 1 ORDER BY is_default DESC, name ASC");
            echo json_encode(['success' => true, 'data' => \$stmt->fetchAll()]);
            break;

        case 'categories':
            \$stmt = \$db->query("SELECT * FROM categorias ORDER BY name ASC");
            echo json_encode(['success' => true, 'data' => \$stmt->fetchAll()]);
            break;

        case 'plans':
            \$stmt = \$db->query("SELECT * FROM planos ORDER BY price_monthly ASC");
            \$plans = \$stmt->fetchAll();
            foreach (\$plans as &\$p) {
                \$p['features'] = json_decode(\$p['features_json'] ?? '[]', true);
            }
            echo json_encode(['success' => true, 'data' => \$plans]);
            break;

        case 'businesses':
            \$cityId = isset(\$_GET['city_id']) ? trim(\$_GET['city_id']) : '';
            \$categoryId = isset(\$_GET['category_id']) ? trim(\$_GET['category_id']) : '';
            \$search = isset(\$_GET['search']) ? trim(\$_GET['search']) : '';

            \$sql = "SELECT e.*, c.name AS city_name, cat.name AS category_name, p.product_limit, p.badge AS plan_badge 
                    FROM empresas e
                    JOIN cidades c ON c.id = e.city_id
                    JOIN categorias cat ON cat.id = e.category_id
                    JOIN planos p ON p.id = e.plan_id
                    WHERE 1=1";
            \$params = [];

            if (!empty(\$cityId) && \$cityId !== 'all') {
                \$sql .= " AND e.city_id = :city_id";
                \$params[':city_id'] = \$cityId;
            }

            if (!empty(\$categoryId) && \$categoryId !== 'all') {
                \$sql .= " AND e.category_id = :category_id";
                \$params[':category_id'] = \$categoryId;
            }

            if (!empty(\$search)) {
                \$sql .= " AND (e.name LIKE :search OR e.description LIKE :search OR e.neighborhood LIKE :search)";
                \$params[':search'] = '%' . \$search . '%';
            }

            \$sql .= " ORDER BY p.highlighted DESC, e.is_verified DESC, e.name ASC";

            \$stmt = \$db->prepare(\$sql);
            \$stmt->execute(\$params);
            \$businesses = \$stmt->fetchAll();

            foreach (\$businesses as &\$b) {
                \$b['weekly_schedule'] = json_decode(\$b['weekly_schedule_json'] ?? '[]', true);
            }

            echo json_encode(['success' => true, 'data' => \$businesses]);
            break;

        case 'products':
            \$cityId = isset(\$_GET['city_id']) ? trim(\$_GET['city_id']) : '';
            \$search = isset(\$_GET['search']) ? trim(\$_GET['search']) : '';

            \$sql = "SELECT pr.*, e.name AS business_name, e.whatsapp AS business_whatsapp, e.phone AS business_phone, c.name AS city_name
                    FROM produtos pr
                    JOIN empresas e ON e.id = pr.business_id
                    JOIN cidades c ON c.id = pr.city_id
                    WHERE pr.is_active = 1";
            \$params = [];

            if (!empty(\$cityId) && \$cityId !== 'all') {
                \$sql .= " AND pr.city_id = :city_id";
                \$params[':city_id'] = \$cityId;
            }

            if (!empty(\$search)) {
                \$sql .= " AND (pr.name LIKE :search OR pr.description LIKE :search OR pr.category LIKE :search)";
                \$params[':search'] = '%' . \$search . '%';
            }

            \$sql .= " ORDER BY pr.featured DESC, pr.created_at DESC";

            \$stmt = \$db->prepare(\$sql);
            \$stmt->execute(\$params);
            echo json_encode(['success' => true, 'data' => \$stmt->fetchAll()]);
            break;

        case 'services':
            \$cityId = isset(\$_GET['city_id']) ? trim(\$_GET['city_id']) : '';
            \$search = isset(\$_GET['search']) ? trim(\$_GET['search']) : '';
            \$mode = isset(\$_GET['mode']) ? trim(\$_GET['mode']) : '';

            \$sql = "SELECT sv.*, e.name AS business_name, e.whatsapp AS business_whatsapp, e.phone AS business_phone, c.name AS city_name
                    FROM servicos sv
                    JOIN empresas e ON e.id = sv.business_id
                    JOIN cidades c ON c.id = sv.city_id
                    WHERE sv.is_active = 1";
            \$params = [];

            if (!empty(\$cityId) && \$cityId !== 'all') {
                \$sql .= " AND sv.city_id = :city_id";
                \$params[':city_id'] = \$cityId;
            }

            if (!empty(\$mode) && \$mode !== 'all') {
                \$sql .= " AND sv.service_mode = :mode";
                \$params[':mode'] = \$mode;
            }

            if (!empty(\$search)) {
                \$sql .= " AND (sv.name LIKE :search OR sv.description LIKE :search OR sv.category LIKE :search)";
                \$params[':search'] = '%' . \$search . '%';
            }

            \$sql .= " ORDER BY sv.featured DESC, sv.created_at DESC";

            \$stmt = \$db->prepare(\$sql);
            \$stmt->execute(\$params);
            echo json_encode(['success' => true, 'data' => \$stmt->fetchAll()]);
            break;

        case 'banners':
            \$position = isset(\$_GET['position']) ? trim(\$_GET['position']) : '';
            \$cityId = isset(\$_GET['city_id']) ? trim(\$_GET['city_id']) : '';

            \$sql = "SELECT * FROM banners WHERE is_active = 1";
            \$params = [];

            if (!empty(\$position)) {
                \$sql .= " AND position = :position";
                \$params[':position'] = \$position;
            }

            if (!empty(\$cityId) && \$cityId !== 'all') {
                \$sql .= " AND (city_id = 'all' OR city_id = :city_id)";
                \$params[':city_id'] = \$cityId;
            }

            \$stmt = \$db->prepare(\$sql);
            \$stmt->execute(\$params);
            echo json_encode(['success' => true, 'data' => \$stmt->fetchAll()]);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Ação não reconhecida.',
                'available_actions' => ['cities', 'categories', 'plans', 'businesses', 'products', 'services', 'banners']
            ]);
            break;
    }
} catch (Exception \$e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => \$e->getMessage()]);
}
`;

  // 5. .htaccess para cPanel HostGator
  const htaccess = `# ========================================================
# achenacidade — Apache .htaccess para Hospedagem HostGator
# ========================================================

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Forçar HTTPS seguro
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Cabeçalhos CORS
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# Desabilitar listagem de diretórios por segurança
Options -Indexes
`;

  // 6. Instruções passo a passo
  const instructionsTxt = `========================================================================
achenacidade — MANUAL DE IMPLANTAÇÃO NA HOSPEDAGEM HOSTGATOR (cPanel)
========================================================================

Este pacote contém todo o código PHP 8.x, a API REST e o script de exportação SQL
pronto para rodar na hospedagem HostGator.

------------------------------------------------------------------------
ETAPA 1: CRIAR O BANCO DE DADOS NO cPANEL DA HOSTGATOR
------------------------------------------------------------------------
1. Faça login no seu cPanel da HostGator (ex: seudominio.com.br/cpanel).
2. Na seção "Bancos de dados", clique em "Assistente de Banco de Dados MySQL".
3. Crie um novo banco (Ex: cpaneluser_achenacidade).
4. Crie um usuário e uma senha segura (Ex: cpaneluser_admin). Guarde a senha!
5. Na tela seguinte, marque a opção "TODOS OS PRIVILÉGIOS" e conclua.

------------------------------------------------------------------------
ETAPA 2: IMPORTAR A ESTRUTURA E DADOS (schema.sql)
------------------------------------------------------------------------
1. No cPanel, abra a ferramenta "phpMyAdmin".
2. No menu à esquerda, clique sobre o banco de dados que você criou.
3. No topo, clique na aba "Importar".
4. Selecione o arquivo "schema.sql" deste pacote e clique em "Executar".

------------------------------------------------------------------------
ETAPA 3: USAR O SCRIPT DE EXPORTAÇÃO SQL (export_sql.php)
------------------------------------------------------------------------
1. O arquivo "export_sql.php" permite exportar todo o banco de dados atual
   (empresas, produtos, cidades, categorias, planos e banners) diretamente
   do servidor HostGator a qualquer momento.
2. Acesse via navegador: https://seudominio.com.br/api/export_sql.php
   O navegador baixará um arquivo .sql completo formatado para phpMyAdmin.

------------------------------------------------------------------------
ETAPA 4: CONFIGURAR O ARQUIVO config.php E SUBIR ARQUIVOS
------------------------------------------------------------------------
1. Atualize no arquivo config.php os dados do seu banco:
   define('DB_NAME', 'seuusuario_achenacidade');
   define('DB_USER', 'seuusuario_admin');
   define('DB_PASS', 'SuaSenhaSeguraAqui123!');
2. Faça upload de config.php, api.php, export_sql.php e .htaccess para public_html.
`;

  return {
    schemaSql,
    configPhp,
    apiPhp,
    exportSqlPhp,
    htaccess,
    instructionsTxt,
  };
}

function escapeSql(val: string): string {
  if (val === null || val === undefined) return 'NULL';
  const clean = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${clean}'`;
}

/**
 * Função utilitária para fazer download direto no navegador de um arquivo gerado
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
