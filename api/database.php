<?php
declare(strict_types=1);

/**
 * Koneksi database Faithful Path — MySQL (Laragon) atau SQLite (fallback dev).
 * Konfigurasi via api/config.local.php (salin dari config.local.php.example).
 */

function app_config_local(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $file = __DIR__ . '/config.local.php';
    if (is_file($file)) {
        require $file;
    }
    $loaded = true;
}

function app_env(string $key, ?string $default = null): ?string
{
    app_config_local();
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
}

function app_db_driver(): string
{
    $driver = strtolower(app_env('DB_DRIVER', 'mysql') ?? 'mysql');
    return in_array($driver, ['mysql', 'sqlite'], true) ? $driver : 'mysql';
}

function app_db_is_mysql(): bool
{
    return app_db_driver() === 'mysql';
}

function app_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    app_config_local();

    if (app_db_is_mysql()) {
        $host = app_env('DB_HOST', '127.0.0.1') ?? '127.0.0.1';
        $port = app_env('DB_PORT', '3306') ?? '3306';
        $name = app_env('DB_NAME', 'alquran') ?? 'alquran';
        $user = app_env('DB_USER', 'root') ?? 'root';
        $pass = app_env('DB_PASSWORD', '') ?? '';
        $charset = app_env('DB_CHARSET', 'utf8mb4') ?? 'utf8mb4';

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } else {
        $dataDir = __DIR__ . '/data';
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }
        $pdo = new PDO('sqlite:' . $dataDir . '/app.db');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    app_db_migrate($pdo);

    return $pdo;
}

function app_db_migrate(PDO $pdo): void
{
    if (app_db_is_mysql()) {
        app_db_migrate_mysql($pdo);
    } else {
        app_db_migrate_sqlite($pdo);
    }
}

function app_db_migrate_mysql(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS cms_content_sections (
            section_key VARCHAR(64) NOT NULL PRIMARY KEY,
            payload LONGTEXT NOT NULL,
            updated_at INT UNSIGNED NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS cms_sessions (
            token VARCHAR(64) NOT NULL PRIMARY KEY,
            expires_at INT UNSIGNED NOT NULL,
            created_at INT UNSIGNED NOT NULL,
            INDEX idx_cms_sessions_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS subscriptions (
            email VARCHAR(255) NOT NULL PRIMARY KEY,
            active_until INT UNSIGNED NOT NULL,
            updated_at INT UNSIGNED NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users (
            email VARCHAR(255) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL DEFAULT \'\',
            picture VARCHAR(512) NOT NULL DEFAULT \'\',
            provider VARCHAR(32) NOT NULL DEFAULT \'google\',
            is_super_admin TINYINT(1) NOT NULL DEFAULT 0,
            created_at INT UNSIGNED NOT NULL,
            updated_at INT UNSIGNED NOT NULL,
            last_login_at INT UNSIGNED NOT NULL,
            INDEX idx_users_last_login (last_login_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );
    app_ensure_column($pdo, 'users', 'is_super_admin', 'TINYINT(1) NOT NULL DEFAULT 0', 'INTEGER NOT NULL DEFAULT 0');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(32) NOT NULL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            journal_id VARCHAR(64) NOT NULL DEFAULT \'\',
            amount_idr INT UNSIGNED NOT NULL,
            status VARCHAR(32) NOT NULL,
            created_at INT UNSIGNED NOT NULL,
            paid_at INT UNSIGNED NULL,
            payment_provider VARCHAR(32) NOT NULL DEFAULT \'\',
            payment_ref VARCHAR(128) NOT NULL DEFAULT \'\',
            qr_string TEXT NULL,
            checkout_url VARCHAR(512) NOT NULL DEFAULT \'\',
            INDEX idx_orders_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );
    app_ensure_column($pdo, 'orders', 'journal_id', 'VARCHAR(64) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'orders', 'payment_provider', 'VARCHAR(32) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'orders', 'payment_ref', 'VARCHAR(128) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'orders', 'qr_string', 'TEXT NULL', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'orders', 'checkout_url', 'VARCHAR(512) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS journal_purchases (
            email VARCHAR(255) NOT NULL,
            journal_id VARCHAR(64) NOT NULL,
            active_until INT UNSIGNED NOT NULL,
            updated_at INT UNSIGNED NOT NULL,
            PRIMARY KEY (email, journal_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS recordings (
            id VARCHAR(64) NOT NULL PRIMARY KEY,
            author_name VARCHAR(255) NOT NULL,
            author_email VARCHAR(255) NULL,
            author_role VARCHAR(32) NOT NULL,
            ayah_number INT UNSIGNED NULL,
            audio_file VARCHAR(512) NOT NULL,
            duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
            created_at INT UNSIGNED NOT NULL,
            INDEX idx_recordings_created (created_at),
            INDEX idx_recordings_author_email (author_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS comments (
            id VARCHAR(64) NOT NULL PRIMARY KEY,
            recording_id VARCHAR(64) NOT NULL,
            author_name VARCHAR(255) NOT NULL,
            author_email VARCHAR(255) NOT NULL DEFAULT \'\',
            author_role VARCHAR(32) NOT NULL,
            body TEXT NOT NULL,
            audio_file VARCHAR(512) NOT NULL DEFAULT \'\',
            duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
            created_at INT UNSIGNED NOT NULL,
            INDEX idx_comments_recording (recording_id),
            INDEX idx_comments_author_email (author_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );
    app_ensure_column($pdo, 'comments', 'author_email', 'VARCHAR(255) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'comments', 'audio_file', 'VARCHAR(512) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'comments', 'duration_ms', 'INT UNSIGNED NOT NULL DEFAULT 0', 'INTEGER NOT NULL DEFAULT 0');

    require_once __DIR__ . '/learning-store.php';
    app_learning_migrate($pdo);
}

function app_db_migrate_sqlite(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS cms_content_sections (
            section_key TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )',
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS cms_sessions (
            token TEXT PRIMARY KEY,
            expires_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )',
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS subscriptions (
            email TEXT PRIMARY KEY,
            active_until INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )',
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT \'\',
            picture TEXT NOT NULL DEFAULT \'\',
            provider TEXT NOT NULL DEFAULT \'google\',
            is_super_admin INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            last_login_at INTEGER NOT NULL
        )',
    );
    app_ensure_column($pdo, 'users', 'is_super_admin', 'TINYINT(1) NOT NULL DEFAULT 0', 'INTEGER NOT NULL DEFAULT 0');
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            journal_id TEXT NOT NULL DEFAULT \'\',
            amount_idr INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            paid_at INTEGER,
            payment_provider TEXT NOT NULL DEFAULT \'\',
            payment_ref TEXT NOT NULL DEFAULT \'\',
            qr_string TEXT NOT NULL DEFAULT \'\',
            checkout_url TEXT NOT NULL DEFAULT \'\'
        )',
    );
    app_ensure_column($pdo, 'orders', 'journal_id', 'VARCHAR(64) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'orders', 'payment_provider', 'VARCHAR(32) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'orders', 'payment_ref', 'VARCHAR(128) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'orders', 'qr_string', 'TEXT NOT NULL', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'orders', 'checkout_url', 'TEXT NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email)');
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS journal_purchases (
            email TEXT NOT NULL,
            journal_id TEXT NOT NULL,
            active_until INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (email, journal_id)
        )',
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS recordings (
            id TEXT PRIMARY KEY,
            author_name TEXT NOT NULL,
            author_email TEXT,
            author_role TEXT NOT NULL,
            ayah_number INTEGER,
            audio_file TEXT NOT NULL,
            duration_ms INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL
        )',
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            recording_id TEXT NOT NULL,
            author_name TEXT NOT NULL,
            author_email TEXT NOT NULL DEFAULT \'\',
            author_role TEXT NOT NULL,
            body TEXT NOT NULL,
            audio_file TEXT NOT NULL DEFAULT \'\',
            duration_ms INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        )',
    );
    app_ensure_column($pdo, 'comments', 'author_email', 'VARCHAR(255) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'comments', 'audio_file', 'VARCHAR(512) NOT NULL DEFAULT \'\'', 'TEXT NOT NULL DEFAULT \'\'');
    app_ensure_column($pdo, 'comments', 'duration_ms', 'INT UNSIGNED NOT NULL DEFAULT 0', 'INTEGER NOT NULL DEFAULT 0');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_comments_recording ON comments(recording_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_recordings_created ON recordings(created_at)');

    require_once __DIR__ . '/learning-store.php';
    app_learning_migrate($pdo);
}

/** @deprecated use orders */
function app_orders_table(): string
{
    return 'orders';
}

function app_table_exists(PDO $pdo, string $table): bool
{
    if (app_db_is_mysql()) {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = :table',
        );
        $stmt->execute(['table' => $table]);
        return (int) $stmt->fetchColumn() > 0;
    }

    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name=" . $pdo->quote($table));
    return (bool) $stmt->fetchColumn();
}

function app_column_exists(PDO $pdo, string $table, string $column): bool
{
    if (app_db_is_mysql()) {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column',
        );
        $stmt->execute(['table' => $table, 'column' => $column]);
        return (int) $stmt->fetchColumn() > 0;
    }

    $stmt = $pdo->query("PRAGMA table_info($table)");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (($row['name'] ?? '') === $column) {
            return true;
        }
    }
    return false;
}

function app_ensure_column(PDO $pdo, string $table, string $column, string $mysqlDef, string $sqliteDef): void
{
    if (app_column_exists($pdo, $table, $column)) {
        return;
    }
    $def = app_db_is_mysql() ? $mysqlDef : $sqliteDef;
    $pdo->exec("ALTER TABLE $table ADD COLUMN $column $def");
}

function app_cms_upsert_section(PDO $pdo, string $key, string $payload, int $updatedAt): void
{
    if (app_db_is_mysql()) {
        $stmt = $pdo->prepare(
            'INSERT INTO cms_content_sections (section_key, payload, updated_at)
             VALUES (:key, :payload, :updated_at)
             ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = VALUES(updated_at)',
        );
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO cms_content_sections (section_key, payload, updated_at)
             VALUES (:key, :payload, :updated_at)
             ON CONFLICT(section_key) DO UPDATE SET
               payload = excluded.payload,
               updated_at = excluded.updated_at',
        );
    }
    $stmt->execute(['key' => $key, 'payload' => $payload, 'updated_at' => $updatedAt]);
}

function app_cms_content_table(): string
{
    return 'cms_content_sections';
}

function app_cms_sessions_table(): string
{
    return 'cms_sessions';
}
