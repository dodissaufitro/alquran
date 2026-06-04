<?php
declare(strict_types=1);

/**
 * Diagnosa & perbaiki pesanan coin paid tanpa kredit.
 * CLI: php api/coins/diagnose-coin-orders.php [--repair]
 */

require_once __DIR__ . '/../env.php';
app_require_cli('diagnose-coin-orders');

$repair = in_array('--repair', $argv ?? [], true);

// Muat kredensial: .env → config.local.php
app_load_config();
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/bootstrap.php';

$pdo = subscription_db();
echo "DB: " . app_env('DB_HOST') . '/' . app_env('DB_NAME') . ' user=' . app_env('DB_USER') . "\n\n";

$stmt = $pdo->query(
    "SELECT o.id, o.email, o.status, o.order_type, o.coin_amount, o.package_id,
            o.amount_idr, o.payment_provider, o.payment_ref, o.paid_at, o.created_at
     FROM orders o
     WHERE o.id LIKE 'COIN-%'
     ORDER BY o.created_at DESC
     LIMIT 20",
);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

if ($orders === []) {
    echo "Tidak ada pesanan COIN-*.\n";
    exit(0);
}

echo str_pad('Order', 22) . str_pad('Status', 10) . str_pad('Coins', 8) . "Credited?\n";
echo str_repeat('-', 60) . "\n";

$toRepair = [];

foreach ($orders as $order) {
    $orderId = (string) $order['id'];
    $email = subscription_normalize_email((string) $order['email']);
    $credited = coins_order_credit_exists($email, $orderId);
    $type = subscription_resolve_order_type($order);
    $coins = coins_resolve_order_coin_amount($order);

    echo str_pad($orderId, 22)
        . str_pad((string) $order['status'], 10)
        . str_pad((string) $coins, 8)
        . ($credited ? 'yes' : 'NO')
        . " (type=$type, pkg=" . ($order['package_id'] ?? '') . ")\n";

    if ((string) $order['status'] === 'paid' && !$credited && $type === 'coin') {
        $toRepair[] = $order;
    }
}

echo "\nPaid tanpa kredit: " . count($toRepair) . "\n";

if (!$repair) {
    if ($toRepair !== []) {
        echo "Jalankan: php api/coins/diagnose-coin-orders.php --repair\n";
    }
    exit(0);
}

foreach ($toRepair as $order) {
    $ok = coins_fulfill_paid_order($order);
    echo ($ok ? '[OK] ' : '[FAIL] ') . $order['id'] . ' → ' . $order['email'] . "\n";
}

echo "\nSelesai.\n";
