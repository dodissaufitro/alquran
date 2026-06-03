<?php
declare(strict_types=1);

/**
 * Konfigurasi terpusat — semua API membaca dari file .env di root proyek.
 * Override opsional (legacy): api/config.local.php, api/subscription/config.local.php
 */

function app_load_dotenv(?string $path = null): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }

    if ($path !== null) {
        app_parse_env_file($path);
        $loaded = true;
        return;
    }

    $root = dirname(__DIR__);
    $candidates = [
        $root . DIRECTORY_SEPARATOR . '.env',
        $root . DIRECTORY_SEPARATOR . '.env.local',
    ];

    $anyLoaded = false;
    foreach ($candidates as $file) {
        if (is_file($file)) {
            app_parse_env_file($file);
            $anyLoaded = true;
        }
    }

    if (!$anyLoaded && is_file($root . DIRECTORY_SEPARATOR . '.env.production')) {
        app_parse_env_file($root . DIRECTORY_SEPARATOR . '.env.production');
    }

    $loaded = true;
}

function app_parse_env_file(string $path): void
{
    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        if ($key === '') {
            continue;
        }

        $value = trim($value);
        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"'))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
    }
}

function app_load_config(): void
{
    static $booted = false;
    if ($booted) {
        return;
    }

    app_load_dotenv();

    $legacy = __DIR__ . '/config.local.php';
    if (is_file($legacy)) {
        require $legacy;
    }

    $subscriptionLegacy = __DIR__ . '/subscription/config.local.php';
    if (is_file($subscriptionLegacy)) {
        require $subscriptionLegacy;
    }

    $booted = true;
}

function app_env(string $key, ?string $default = null): ?string
{
    app_load_config();
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
}

function app_env_int(string $key, int $default): int
{
    $raw = app_env($key);
    if ($raw === null || $raw === '') {
        return $default;
    }
    $value = (int) $raw;
    return $value > 0 ? $value : $default;
}

function app_env_bool(string $key, bool $default = false): bool
{
    $raw = strtolower(app_env($key) ?? '');
    if ($raw === '') {
        return $default;
    }
    return in_array($raw, ['1', 'true', 'yes', 'on'], true);
}

function app_project_root(): string
{
    return dirname(__DIR__);
}

function app_env_file_path(): ?string
{
    $root = app_project_root();
    foreach (['.env', '.env.local', '.env.production'] as $name) {
        $path = $root . DIRECTORY_SEPARATOR . $name;
        if (is_file($path)) {
            return $path;
        }
    }
    return null;
}

function app_origin(): string
{
    $origin = app_env('SUBSCRIPTION_APP_ORIGIN') ?? app_env('APP_ORIGIN', 'https://app.talaqee.com');
    return rtrim($origin ?? 'https://app.talaqee.com', '/');
}

function app_android_package(): string
{
    return app_env('ANDROID_PACKAGE', 'com.faithfulpath.alquran') ?? 'com.faithfulpath.alquran';
}

function app_oauth_deep_link(): string
{
    return app_android_package() . '://oauth';
}

function app_payment_deep_link(): string
{
    return app_android_package() . '://payment';
}

function app_google_oauth_redirect_uri(): string
{
    $explicit = app_env('GOOGLE_OAUTH_REDIRECT_URI');
    if ($explicit !== null && $explicit !== '') {
        return rtrim($explicit, '/');
    }

    $path = app_env('GOOGLE_OAUTH_CALLBACK_PATH', '/api/auth/google-app-callback.php')
        ?? '/api/auth/google-app-callback.php';

    return app_origin() . $path;
}

/** @return list<string> */
function app_allowed_oauth_redirects(): array
{
    return [app_oauth_deep_link(), app_google_oauth_redirect_uri()];
}

function app_internal_email_suffix(): string
{
    return app_env('INTERNAL_EMAIL_SUFFIX', '@app.faithfulpath') ?? '@app.faithfulpath';
}

function app_cors_origin(): string
{
    return app_env('API_CORS_ORIGIN', '*') ?? '*';
}

function app_service_id(string $suffix): string
{
    $prefix = app_env('APP_SERVICE_PREFIX', 'faithfulpath') ?? 'faithfulpath';
    return $prefix . '-' . $suffix;
}

function app_qr_image_url(string $payload): string
{
    $base = rtrim(
        app_env('QR_API_BASE_URL', 'https://api.qrserver.com/v1/create-qr-code/') ?? '',
        '/',
    );
    $size = app_env('QR_API_SIZE', '300x300') ?? '300x300';
    $margin = app_env('QR_API_MARGIN', '10') ?? '10';

    return $base . '/?size=' . rawurlencode($size)
        . '&margin=' . rawurlencode($margin)
        . '&data=' . rawurlencode($payload);
}

function app_subscription_redirect_base(): string
{
    $base = app_env('SUBSCRIPTION_REDIRECT_BASE_URL');
    if ($base !== null && $base !== '') {
        return rtrim($base, '/');
    }
    return app_origin();
}

function app_subscription_apk_return_url(): string
{
    $url = app_env('SUBSCRIPTION_APK_RETURN_URL');
    if ($url !== null && $url !== '') {
        return rtrim($url, '/');
    }
    return app_origin() . '/payment-return.html';
}

function app_xendit_api_base(): string
{
    return rtrim(app_env('XENDIT_API_BASE', 'https://api.xendit.co') ?? 'https://api.xendit.co', '/');
}

function app_midtrans_base_url(): string
{
    $isProd = app_env_bool('MIDTRANS_IS_PRODUCTION', false);
    if ($isProd) {
        return rtrim(
            app_env('MIDTRANS_API_BASE_PRODUCTION', 'https://api.midtrans.com') ?? 'https://api.midtrans.com',
            '/',
        );
    }
    return rtrim(
        app_env('MIDTRANS_API_BASE_SANDBOX', 'https://api.sandbox.midtrans.com') ?? 'https://api.sandbox.midtrans.com',
        '/',
    );
}

/** @return array{driver:string,host:string,port:string,name:string,user:string,pass:string,charset:string} */
function app_db_settings(): array
{
    return [
        'driver' => app_env('DB_DRIVER', 'mysql') ?? 'mysql',
        'host' => app_env('DB_HOST', '127.0.0.1') ?? '127.0.0.1',
        'port' => app_env('DB_PORT', '3306') ?? '3306',
        'name' => app_env('DB_NAME', 'alquran') ?? 'alquran',
        'user' => app_env('DB_USER', 'root') ?? 'root',
        'pass' => app_env('DB_PASSWORD', '') ?? '',
        'charset' => app_env('DB_CHARSET', 'utf8mb4') ?? 'utf8mb4',
    ];
}

function app_db_connection_error_message(Throwable $e): string
{
    $msg = $e->getMessage();
    $db = app_db_settings();
    $base = 'Koneksi database gagal (' . $db['host'] . ':' . $db['port'] . '/' . $db['name'] . '). ';

    if (str_contains($msg, '2002') || str_contains($msg, 'actively refused')) {
        return $base
            . 'MySQL tidak berjalan atau host salah. Laragon: nyalakan MySQL, pastikan .env berisi DB_HOST=127.0.0.1. '
            . 'Docker: DB_HOST=host.docker.internal atau db. Tes: /api/cms/public/health.php';
    }

    if (str_contains($msg, '1045') || str_contains($msg, 'Access denied')) {
        return $base
            . 'User/password salah. Sesuaikan DB_USER dan DB_PASSWORD di file .env (Laragon default: root, password kosong).';
    }

    if (str_contains($msg, '1049') || str_contains($msg, 'Unknown database')) {
        return $base
            . 'Database belum ada. Jalankan: npm run db:install lalu npm run db:sync';
    }

    if (!app_env_file_path()) {
        return $base
            . 'File .env tidak ditemukan. Salin: copy .env.example .env lalu sesuaikan DB_*.';
    }

    return $base
        . 'Periksa DB_* di .env. Tes: /api/cms/public/health.php — ' . $msg;
}

function app_cms_admin_user(): string
{
    return app_env('CMS_ADMIN_USER', 'app.talaqee.com') ?? 'app.talaqee.com';
}

function app_cms_admin_password(): string
{
    return app_env('CMS_ADMIN_PASSWORD', 'Jakarta1945@@') ?? 'Jakarta1945@@';
}

function app_cms_session_ttl(): int
{
    return app_env_int('CMS_SESSION_TTL_SECONDS', 7 * 24 * 60 * 60);
}

function app_talaqqi_max_audio_bytes(): int
{
    return app_env_int('TALAQQI_MAX_AUDIO_BYTES', 8 * 1024 * 1024);
}

function app_talaqqi_upload_max_filesize(): string
{
    return app_env('TALAQQI_UPLOAD_MAX_FILESIZE', '16M') ?? '16M';
}

function app_talaqqi_post_max_size(): string
{
    return app_env('TALAQQI_POST_MAX_SIZE', '16M') ?? '16M';
}

function app_subscription_period_seconds(): int
{
    return app_env_int('SUBSCRIPTION_PERIOD_SECONDS', 30 * 24 * 60 * 60);
}

function app_coins_period_seconds(): int
{
    return app_env_int('COINS_PERIOD_SECONDS', 365 * 24 * 60 * 60);
}

function app_request_method(): string
{
    return strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
}

function app_is_options_request(): bool
{
    return app_request_method() === 'OPTIONS';
}

function app_send_cors_headers(string $methods = 'GET, POST, OPTIONS', string $headers = 'Content-Type'): void
{
    $origin = app_cors_origin();
    if (!str_contains($headers, 'Authorization')) {
        $headers = trim($headers . ', Authorization');
    }
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: ' . $methods);
    header('Access-Control-Allow-Headers: ' . $headers);
    if ($origin !== '*') {
        header('Access-Control-Allow-Credentials: true');
    }
}

/** Production hanya jika APP_ENV=production|prod (localhost/dev tetap mode development). */
function app_is_production(): bool
{
    $env = strtolower(trim(app_env('APP_ENV', 'development') ?? 'development'));

    return in_array($env, ['production', 'prod'], true);
}

/** Autentikasi API ketat (Bearer token) — hanya di production. */
function app_api_auth_strict(): bool
{
    return app_is_production();
}

function app_is_local_request(): bool
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if ($ip === '127.0.0.1' || $ip === '::1') {
        return true;
    }
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === 'localhost' || str_starts_with($host, 'localhost:')) {
        return true;
    }

    return false;
}

function app_cms_password_is_weak(): bool
{
    $password = app_cms_admin_password();
    $weak = ['Jakarta1945@@', 'faithfulpath-cms-2026', 'admin', 'password'];

    return in_array($password, $weak, true) || strlen($password) < 12;
}

/** Blokir akses HTTP ke skrip maintenance (install/sync). */
function app_require_cli(string $scriptName = 'script'): void
{
    if (PHP_SAPI === 'cli') {
        return;
    }
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Not Found\n";
    exit;
}

/**
 * Resolve path aman di dalam direktori dasar (cegah path traversal).
 */
function app_safe_path_under(string $baseDir, string $relativePath): ?string
{
    $base = realpath($baseDir);
    if ($base === false) {
        return null;
    }

    $relativePath = str_replace('\\', '/', $relativePath);
    if (str_contains($relativePath, '..') || str_contains($relativePath, "\0")) {
        return null;
    }

    $candidate = realpath($base . '/' . ltrim($relativePath, '/'));
    if ($candidate === false || !is_file($candidate)) {
        $direct = $base . '/' . ltrim($relativePath, '/');
        if (!is_file($direct)) {
            return null;
        }
        $candidate = realpath($direct);
        if ($candidate === false) {
            return null;
        }
    }

    if (!str_starts_with($candidate, $base . DIRECTORY_SEPARATOR) && $candidate !== $base) {
        return null;
    }

    return $candidate;
}
