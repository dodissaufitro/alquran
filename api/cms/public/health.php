<?php
declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    cms_error('Method not allowed.', 405);
}

$checks = [
    'php' => PHP_VERSION,
    'pdo' => extension_loaded('pdo'),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'mbstring' => extension_loaded('mbstring'),
    'config_local' => is_file(__DIR__ . '/../../config.local.php'),
    'writable_api_data' => is_dir(__DIR__ . '/../../data')
        ? is_writable(__DIR__ . '/../../data')
        : is_writable(__DIR__ . '/../..'),
];

$dbOk = false;
$dbError = null;

try {
    $pdo = app_db();
    $pdo->query('SELECT 1');
    $dbOk = true;
} catch (Throwable $e) {
    $dbError = $e->getMessage();
}

cms_json([
    'ok' => $dbOk,
    'checks' => $checks,
    'db' => [
        'driver' => app_env('DB_DRIVER', 'mysql'),
        'host' => app_env('DB_HOST', '127.0.0.1'),
        'name' => app_env('DB_NAME', 'alquran'),
        'connected' => $dbOk,
        'error' => $dbError,
    ],
    'hint' => $dbOk
        ? null
        : 'Docker: set DB_HOST=host.docker.internal di api/config.local.php. Pastikan ekstensi pdo_mysql aktif.',
]);
