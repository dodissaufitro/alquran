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

$healthSecret = trim((string) (app_env('HEALTH_CHECK_SECRET') ?: ''));
$provided = trim((string) ($_GET['secret'] ?? $_SERVER['HTTP_X_HEALTH_SECRET'] ?? ''));
$healthDetailed = $healthSecret !== '' && $provided !== '' && hash_equals($healthSecret, $provided);

$dbOk = false;
$dbError = null;
$usersTable = false;
$userCount = null;
$coinPaidWithoutCredit = null;
$latestCoinOrder = null;
$xenditConfigured = subscription_xendit_secret_key() !== null;

try {
    $pdo = subscription_db();
    $pdo->query('SELECT 1');
    $dbOk = true;

    $usersTable = app_table_exists($pdo, 'users');
    if ($usersTable) {
        $userCount = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    }

    if (app_table_exists($pdo, 'orders') && app_table_exists($pdo, 'coin_transactions')) {
        $coinPaidWithoutCredit = (int) $pdo->query(
            "SELECT COUNT(*) FROM orders o
             WHERE o.id LIKE 'COIN-%' AND o.status = 'paid'
             AND NOT EXISTS (
               SELECT 1 FROM coin_transactions t
               WHERE t.email = o.email AND t.ref_type = 'purchase' AND t.ref_id = o.id AND t.type = 'credit'
             )",
        )->fetchColumn();

        $row = $pdo->query(
            "SELECT id, email, status, coin_amount, package_id, payment_provider, paid_at, created_at
             FROM orders WHERE id LIKE 'COIN-%' ORDER BY created_at DESC LIMIT 1",
        )->fetch(PDO::FETCH_ASSOC);
        if (is_array($row)) {
            $latestCoinOrder = [
                'id' => (string) $row['id'],
                'status' => (string) $row['status'],
                'coinAmount' => (int) ($row['coin_amount'] ?? 0),
                'packageId' => (string) ($row['package_id'] ?? ''),
                'paymentProvider' => (string) ($row['payment_provider'] ?? ''),
                'paidAt' => $row['paid_at'] !== null ? (int) $row['paid_at'] : null,
            ];
        }
    }
} catch (Throwable $e) {
    $dbError = $e->getMessage();
}

if (!$healthDetailed) {
    subscription_json_response([
        'ok' => $dbOk && $usersTable,
        'service' => 'subscription',
    ]);
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
    'payments' => [
        'xendit_configured' => $xenditConfigured,
        'coin_paid_without_credit' => $coinPaidWithoutCredit,
        'latest_coin_order' => $latestCoinOrder,
    ],
    'hint' => $dbOk && $usersTable
        ? 'POST /api/subscription/user.php — butuh idToken Google atau Bearer.'
        : 'Perbaiki DB: api/config.local.php, lalu jalankan php api/sync-mysql.php',
]);
