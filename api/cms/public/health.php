<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

cms_cors();

if (app_is_options_request()) {
    http_response_code(204);
    exit;
}

if (app_request_method() !== 'GET') {
    cms_error('Method not allowed.', 405);
}

$dbOk = false;
$dbError = null;

try {
    $pdo = app_db();
    $pdo->query('SELECT 1');
    $dbOk = true;
} catch (Throwable $e) {
    $dbError = $e->getMessage();
}

$db = app_db_settings();

cms_json([
    'ok' => $dbOk,
    'checks' => [
        'php' => PHP_VERSION,
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'mbstring' => extension_loaded('mbstring'),
        'env_file' => app_env_file_path(),
        'writable_api_data' => is_dir(__DIR__ . '/../../data')
            ? is_writable(__DIR__ . '/../../data')
            : is_writable(__DIR__ . '/../..'),
        'dist_index' => is_file(__DIR__ . '/../../../dist/index.html'),
        'dist_admin' => is_file(__DIR__ . '/../../../dist/admin.html'),
    ],
    'db' => [
        'driver' => $db['driver'],
        'host' => $db['host'],
        'name' => $db['name'],
        'connected' => $dbOk,
        'error' => $dbError,
    ],
    'hint' => $dbOk
        ? null
        : 'Periksa file .env (DB_HOST, DB_USER, DB_PASSWORD). '
            . 'Docker/VPS: DB_HOST=host.docker.internal jika MySQL di host yang sama.',
]);
