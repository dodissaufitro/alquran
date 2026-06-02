<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

app_send_cors_headers('GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (app_is_options_request()) {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    subscription_error('Method not allowed.', 405);
}

$dbOk = false;
$dbError = null;
$usersTable = false;
$userCount = null;

try {
    $pdo = subscription_db();
    $pdo->query('SELECT 1');
    $dbOk = true;

    $usersTable = app_table_exists($pdo, 'users');
    if ($usersTable) {
        $userCount = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    }
} catch (Throwable $e) {
    $dbError = $e->getMessage();
}

$db = app_db_settings();

subscription_json_response([
    'ok' => $dbOk && $usersTable,
    'service' => 'subscription',
    'checks' => [
        'db_connected' => $dbOk,
        'users_table' => $usersTable,
        'user_count' => $userCount,
        'env_file' => app_env_file_path(),
        'config_local' => is_file(__DIR__ . '/../config.local.php'),
    ],
    'db' => [
        'host' => $db['host'],
        'name' => $db['name'],
        'user' => $db['user'],
        'error' => $dbError,
    ],
    'hint' => $dbOk && $usersTable
        ? 'POST /api/subscription/user.php menyimpan email setelah login Google.'
        : 'Perbaiki DB: api/config.local.php (DB_HOST=host.docker.internal), lalu jalankan php api/sync-mysql.php',
]);
