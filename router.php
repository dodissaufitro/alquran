<?php
declare(strict_types=1);

/**
 * Router untuk PHP built-in server production (VPS / port custom).
 *
 * Jalankan dari root proyek:
 *   php -S 0.0.0.0:8090 -t . router.php
 *
 * Melayani:
 * - /api/*           → file PHP di folder api/
 * - /, /assets/*, …  → file statis dari dist/
 * - SPA              → dist/index.html (kecuali admin.html)
 */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

if ($path === '/admin' || $path === '/admin/') {
    header('Location: /admin.html', true, 302);
    return true;
}

if ($path === '/admin.html') {
    $adminFile = __DIR__ . '/dist/admin.html';
    if (is_file($adminFile)) {
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-cache');
        readfile($adminFile);
        return true;
    }
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "CMS admin belum tersedia: dist/admin.html tidak ditemukan.\n";
    echo "Jalankan npm run build lalu rebuild Docker image (docker compose -f docker-compose.prod.yml up -d --build).\n";
    return true;
}

if (str_starts_with($path, '/api/')) {
    $blockedApiScripts = [
        '/api/install-mysql.php',
        '/api/sync-mysql.php',
        '/api/sync-ulumul.php',
        '/api/subscription/test-xendit-buku.php',
    ];
    if (in_array($path, $blockedApiScripts, true)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Not Found\n";
        return true;
    }

    require_once __DIR__ . '/api/env.php';
    app_load_config();
    $apiFile = app_safe_path_under(__DIR__ . '/api', substr($path, 5));
    if ($apiFile !== null && str_ends_with(strtolower($apiFile), '.php')) {
        require $apiFile;
        return true;
    }
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Not Found: {$path}\nPastikan folder api/ ada di server.";
    return true;
}

/** Sampul jurnal/buku di-upload CMS — layani dari uploads/ atau public/uploads/ (legacy) */
if (str_starts_with($path, '/uploads/')) {
    require_once __DIR__ . '/api/env.php';
    app_load_config();
    $relative = substr($path, strlen('/uploads/'));
    $candidates = [
        app_safe_path_under(__DIR__ . '/uploads', $relative),
        app_safe_path_under(__DIR__ . '/public/uploads', $relative),
    ];
    foreach ($candidates as $uploadFile) {
        if ($uploadFile === null) {
            continue;
        }
        $ext = strtolower(pathinfo($uploadFile, PATHINFO_EXTENSION));
        $types = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
        ];
        header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
        header('Cache-Control: public, max-age=86400');
        readfile($uploadFile);
        return true;
    }
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Not Found: {$path}";
    return true;
}

function router_static_mime(string $ext): string
{
    $types = [
        'html' => 'text/html; charset=utf-8',
        'js' => 'application/javascript; charset=utf-8',
        'mjs' => 'application/javascript; charset=utf-8',
        'css' => 'text/css; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'woff2' => 'font/woff2',
        'ico' => 'image/x-icon',
    ];

    return $types[$ext] ?? 'application/octet-stream';
}

function router_is_built_asset_path(string $path): bool
{
    if (str_starts_with($path, '/assets/')) {
        return true;
    }

    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

    return in_array($ext, ['js', 'mjs', 'css', 'woff2', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'ico'], true);
}

$distPath = $path === '/' ? '/index.html' : $path;
$distFile = __DIR__ . '/dist' . $distPath;

if (is_file($distFile)) {
    $ext = strtolower(pathinfo($distFile, PATHINFO_EXTENSION));
    header('Content-Type: ' . router_static_mime($ext));
    if ($ext !== 'html') {
        header('Cache-Control: public, max-age=31536000, immutable');
    }
    readfile($distFile);
    return true;
}

if (router_is_built_asset_path($path)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Asset tidak ditemukan: {$path}\n";
    echo "Folder dist/assets/ kosong atau build belum deploy.\n";
    echo "Jalankan: docker compose -f docker-compose.prod.yml up -d --build\n";
    return true;
}

$index = __DIR__ . '/dist/index.html';
if (is_file($index) && !str_starts_with($path, '/admin')) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    return true;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "Not Found: {$path}";
return true;
