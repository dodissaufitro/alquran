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
    header('Access-Control-Allow-Origin: ' . app_cors_origin());
    header('Access-Control-Allow-Methods: ' . $methods);
    header('Access-Control-Allow-Headers: ' . $headers);
}
