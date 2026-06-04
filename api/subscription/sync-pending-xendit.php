<?php
declare(strict_types=1);

/**
 * Sinkronkan semua pesanan pending ke Xendit (tandai paid + kredit coin).
 * CLI server: php api/subscription/sync-pending-xendit.php
 */

require_once __DIR__ . '/../env.php';
app_require_cli('sync-pending-xendit');

app_load_config();
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../coins/bootstrap.php';

if (subscription_xendit_secret_key() === null) {
    fwrite(STDERR, "XENDIT_SECRET_KEY belum di-set di .env / config.local.php\n");
    exit(1);
}

$pdo = subscription_db();
$stmt = $pdo->query(
    "SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100",
);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$fixed = 0;

foreach ($rows as $order) {
    if (!subscription_should_try_xendit_sync($order)) {
        continue;
    }
    $orderId = (string) $order['id'];
    $synced = subscription_sync_xendit_order_status($orderId);
    if ($synced === 'paid') {
        $fixed++;
        echo "OK $orderId → paid\n";
        $order = subscription_load_order_by_id($orderId) ?? $order;
        if (subscription_resolve_order_type($order) === 'coin') {
            coins_fulfill_paid_order($order);
        }
    } else {
        echo "SKIP $orderId (masih pending di Xendit)\n";
    }
}

echo "\nSelesai. Diperbarui: $fixed pesanan.\n";
