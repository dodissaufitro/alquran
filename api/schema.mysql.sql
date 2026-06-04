-- Talaqee — skema MySQL
-- Jalankan di phpMyAdmin atau: mysql -u root < api/schema.mysql.sql

CREATE DATABASE IF NOT EXISTS alquran
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE alquran;

CREATE TABLE IF NOT EXISTS cms_content_sections (
  section_key VARCHAR(64) NOT NULL PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  updated_at INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS learning_categories (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT '',
  subtitle VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS learning_articles (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  category_id VARCHAR(64) NOT NULL,
  title VARCHAR(512) NOT NULL DEFAULT '',
  summary TEXT NOT NULL,
  body LONGTEXT NOT NULL,
  read_minutes INT UNSIGNED NOT NULL DEFAULT 5,
  price_idr INT UNSIGNED NULL,
  coin_price INT UNSIGNED NULL,
  preview TEXT NULL,
  content_type VARCHAR(16) NULL,
  page_count INT UNSIGNED NULL,
  cover_image VARCHAR(512) NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at INT UNSIGNED NOT NULL,
  INDEX idx_learning_articles_category (category_id),
  INDEX idx_la_category_sort (category_id, sort_order),
  INDEX idx_la_category_coin (category_id, coin_price),
  CONSTRAINT fk_learning_articles_category
    FOREIGN KEY (category_id) REFERENCES learning_categories(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS learning_chapters (
  article_id VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  chapter_number INT UNSIGNED NOT NULL DEFAULT 1,
  title VARCHAR(512) NOT NULL DEFAULT '',
  summary TEXT NOT NULL,
  body LONGTEXT NOT NULL,
  read_minutes INT UNSIGNED NOT NULL DEFAULT 5,
  coin_price INT UNSIGNED NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at INT UNSIGNED NOT NULL,
  PRIMARY KEY (article_id, id),
  INDEX idx_learning_chapters_article (article_id),
  INDEX idx_lc_article_sort (article_id, sort_order),
  CONSTRAINT fk_learning_chapters_article
    FOREIGN KEY (article_id) REFERENCES learning_articles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coin_packages (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  label VARCHAR(255) NOT NULL DEFAULT '',
  base_coins INT UNSIGNED NOT NULL DEFAULT 0,
  bonus_coins INT UNSIGNED NOT NULL DEFAULT 0,
  bonus_percent INT UNSIGNED NULL,
  price_idr INT UNSIGNED NOT NULL DEFAULT 0,
  badge VARCHAR(64) NULL,
  starter_pack TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_coins (
  email VARCHAR(255) NOT NULL PRIMARY KEY,
  balance INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coin_transactions (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  type VARCHAR(16) NOT NULL,
  amount INT NOT NULL,
  balance_after INT UNSIGNED NOT NULL,
  ref_type VARCHAR(32) NOT NULL DEFAULT '',
  ref_id VARCHAR(128) NOT NULL DEFAULT '',
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at INT UNSIGNED NOT NULL,
  INDEX idx_coin_tx_email (email),
  INDEX idx_coin_tx_created (created_at),
  INDEX idx_coin_tx_email_created (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_sessions (
  token VARCHAR(64) NOT NULL PRIMARY KEY,
  expires_at INT UNSIGNED NOT NULL,
  created_at INT UNSIGNED NOT NULL,
  INDEX idx_cms_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  email VARCHAR(255) NOT NULL PRIMARY KEY,
  active_until INT UNSIGNED NOT NULL,
  updated_at INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  journal_id VARCHAR(128) NOT NULL DEFAULT '',
  amount_idr INT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at INT UNSIGNED NOT NULL,
  paid_at INT UNSIGNED NULL,
  payment_provider VARCHAR(32) NOT NULL DEFAULT '',
  payment_ref VARCHAR(128) NOT NULL DEFAULT '',
  qr_string TEXT NULL,
  checkout_url VARCHAR(512) NOT NULL DEFAULT '',
  order_type VARCHAR(16) NOT NULL DEFAULT 'journal',
  coin_amount INT UNSIGNED NOT NULL DEFAULT 0,
  package_id VARCHAR(32) NOT NULL DEFAULT '',
  INDEX idx_orders_email (email),
  INDEX idx_orders_email_status (email, status),
  INDEX idx_orders_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal_purchases (
  email VARCHAR(255) NOT NULL,
  journal_id VARCHAR(128) NOT NULL,
  active_until INT UNSIGNED NOT NULL,
  updated_at INT UNSIGNED NOT NULL,
  PRIMARY KEY (email, journal_id),
  INDEX idx_jp_email_active (email, active_until),
  INDEX idx_jp_active_until (active_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recordings (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NULL,
  author_role VARCHAR(32) NOT NULL,
  ayah_number INT UNSIGNED NULL,
  audio_file VARCHAR(512) NOT NULL,
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
  created_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_recordings_created (created_at),
  INDEX idx_recordings_author_email (author_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  recording_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(32) NOT NULL,
  body TEXT NOT NULL,
  created_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_comments_recording (recording_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
