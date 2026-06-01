<?php
declare(strict_types=1);

/**
 * Halaman redirect ke APK setelah login web (fallback jika intent otomatis gagal).
 * GET ?bridge=...
 */
require_once __DIR__ . '/../bootstrap.php';
require __DIR__ . '/apk-bridge-lib.php';

$bridge = isset($_GET['bridge']) ? trim((string) $_GET['bridge']) : '';
if ($bridge === '' || apk_bridge_peek($bridge) === null) {
    http_response_code(400);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="id"><body><p>Sesi login tidak valid atau kedaluwarsa.</p></body></html>';
    exit;
}

$deepLink = app_oauth_deep_link() . '?bridge=' . rawurlencode($bridge);
apk_bridge_redirect_to_app($deepLink);
