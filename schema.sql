-- ========================================================
-- achenacidade — Estrutura Completa do Banco de Dados MySQL / MariaDB
-- Compatível com CapRover (MySQL 5.7+ / 8.0+ / MariaDB 10.3+) e phpMyAdmin
-- Padrão exclusivo com nomes de tabelas em inglês
-- Codificação: utf8mb4_unicode_ci
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Remove tabelas antigas em português caso tenham sido importadas anteriormente
DROP TABLE IF EXISTS `pagamentos`;
DROP TABLE IF EXISTS `categorias_produtos_loja`;
DROP TABLE IF EXISTS `servicos`;
DROP TABLE IF EXISTS `produtos`;
DROP TABLE IF EXISTS `empresas`;
DROP TABLE IF EXISTS `planos`;
DROP TABLE IF EXISTS `categorias`;
DROP TABLE IF EXISTS `cidades`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `configuracoes`;
DROP TABLE IF EXISTS `sessoes`;
DROP TABLE IF EXISTS `anuncios`;

CREATE TABLE IF NOT EXISTS `app_meta` (
  `meta_key` VARCHAR(120) PRIMARY KEY,
  `meta_value` VARCHAR(500) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(120) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` VARCHAR(64) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auth_sessions` (
  `token` VARCHAR(128) PRIMARY KEY,
  `role` VARCHAR(32) NOT NULL,
  `user_id` VARCHAR(120) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `business_id` VARCHAR(120) NULL,
  `ip_address` VARCHAR(120) NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` BIGINT NOT NULL,
  `expires_at` BIGINT NOT NULL,
  `last_activity_at` BIGINT NOT NULL,
  `revoked` TINYINT(1) NOT NULL DEFAULT 0,
  KEY `idx_auth_expires` (`expires_at`),
  KEY `idx_auth_user` (`role`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(120) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `state` VARCHAR(32) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `banner_url` LONGTEXT NULL,
  `description` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(120) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `icon_name` VARCHAR(120) NOT NULL DEFAULT 'Tag',
  `description` TEXT NULL,
  `color` VARCHAR(32) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(120) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `price_monthly` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `product_limit` INT NOT NULL DEFAULT 3,
  `business_limit` INT NOT NULL DEFAULT 1,
  `badge` VARCHAR(120) NOT NULL DEFAULT '',
  `features` JSON NOT NULL,
  `highlighted` TINYINT(1) NOT NULL DEFAULT 0,
  `color` VARCHAR(32) NOT NULL DEFAULT '#1D4ED8',
  `use_custom_discounts` TINYINT(1) NOT NULL DEFAULT 0,
  `cycle_discounts` JSON NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `businesses` (
  `id` VARCHAR(120) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `city_id` VARCHAR(120) NOT NULL,
  `category_id` VARCHAR(120) NOT NULL,
  `plan_id` VARCHAR(120) NOT NULL,
  `description` LONGTEXT NULL,
  `phone` VARCHAR(80) NOT NULL DEFAULT '',
  `whatsapp` VARCHAR(80) NOT NULL DEFAULT '',
  `email` VARCHAR(255) NULL,
  `owner_email` VARCHAR(255) NULL,
  `address` VARCHAR(255) NOT NULL DEFAULT '',
  `neighborhood` VARCHAR(255) NOT NULL DEFAULT '',
  `opening_hours` TEXT NULL,
  `weekly_schedule` JSON NULL,
  `logo_url` LONGTEXT NOT NULL,
  `cover_url` LONGTEXT NULL,
  `instagram` VARCHAR(255) NULL,
  `facebook` VARCHAR(255) NULL,
  `website` VARCHAR(255) NULL,
  `password` VARCHAR(255) NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `payment_status` VARCHAR(40) NOT NULL DEFAULT 'active',
  `pending_plan_id` VARCHAR(120) NULL,
  `pending_billing_cycle` VARCHAR(32) NULL,
  `billing_cycle` VARCHAR(32) NULL,
  `plan_expires_at` VARCHAR(64) NULL,
  `payment_token` VARCHAR(255) NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(120) PRIMARY KEY,
  `business_id` VARCHAR(120) NOT NULL,
  `city_id` VARCHAR(120) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `original_price` DECIMAL(10,2) NULL,
  `description` LONGTEXT NULL,
  `image_url` LONGTEXT NOT NULL,
  `category` VARCHAR(255) NOT NULL DEFAULT '',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(120) PRIMARY KEY,
  `business_id` VARCHAR(120) NOT NULL,
  `city_id` VARCHAR(120) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price_type` VARCHAR(32) NOT NULL DEFAULT 'fixed',
  `price` DECIMAL(10,2) NULL,
  `duration` VARCHAR(120) NOT NULL DEFAULT '',
  `service_mode` VARCHAR(32) NOT NULL DEFAULT 'on_site',
  `description` LONGTEXT NULL,
  `image_url` LONGTEXT NOT NULL,
  `category` VARCHAR(255) NOT NULL DEFAULT '',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `store_product_categories` (
  `id` VARCHAR(120) PRIMARY KEY,
  `business_id` VARCHAR(120) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `banners` (
  `id` VARCHAR(120) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `position` VARCHAR(40) NOT NULL DEFAULT 'top',
  `image_url` LONGTEXT NOT NULL,
  `link_url` VARCHAR(500) NULL,
  `advertiser_name` VARCHAR(255) NOT NULL,
  `city_id` VARCHAR(120) NOT NULL DEFAULT 'all',
  `price_monthly` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `clicks_count` INT NOT NULL DEFAULT 0,
  `badge_text` VARCHAR(120) NULL,
  `tagline` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id` VARCHAR(120) PRIMARY KEY,
  `business_id` VARCHAR(120) NOT NULL,
  `business_name` VARCHAR(255) NOT NULL,
  `plan_id` VARCHAR(120) NOT NULL,
  `plan_name` VARCHAR(255) NOT NULL,
  `billing_cycle` VARCHAR(32) NULL,
  `cycle_months` INT NULL,
  `base_amount` DECIMAL(10,2) NULL,
  `discount_percent` DECIMAL(5,2) NULL,
  `discount_amount` DECIMAL(10,2) NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `mercado_pago_payment_id` VARCHAR(255) NOT NULL,
  `qr_code` LONGTEXT NULL,
  `qr_code_text` LONGTEXT NULL,
  `installments` INT NULL,
  `card_last_four` VARCHAR(16) NULL,
  `card_brand` VARCHAR(64) NULL,
  `payer_email` VARCHAR(255) NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `paid_at` VARCHAR(64) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` VARCHAR(120) PRIMARY KEY,
  `recipient_to` VARCHAR(255) NOT NULL,
  `template_key` VARCHAR(64) NOT NULL,
  `template_name` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `html_body` LONGTEXT NOT NULL,
  `text_body` LONGTEXT NOT NULL,
  `verification_code` VARCHAR(32) NULL,
  `payment_url` VARCHAR(500) NULL,
  `delivery_mode` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `error_message` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` VARCHAR(120) PRIMARY KEY,
  `setting_value` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
