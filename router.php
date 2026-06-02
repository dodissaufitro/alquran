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
    $file = __DIR__ . $path;
    if (is_file($file)) {
        require $file;
        return true;
    }
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Not Found: {$path}\nPastikan folder api/ ada di server.";
    return true;
}

/** Sampul jurnal/buku di-upload CMS — layani dari uploads/ atau public/uploads/ (legacy) */
if (str_starts_with($path, '/uploads/')) {
    $candidates = [
        __DIR__ . $path,
        __DIR__ . '/public' . $path,
    ];
    foreach ($candidates as $uploadFile) {
        if (!is_file($uploadFile)) {
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

$distPath = $path === '/' ? '/index.html' : $path;
$distFile = __DIR__ . '/dist' . $distPath;

if (is_file($distFile)) {
    $ext = strtolower(pathinfo($distFile, PATHINFO_EXTENSION));
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
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    readfile($distFile);
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
