<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    subscription_error('Method not allowed.', 405);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);

// Xendit Invoice webhook: { "external_id", "status", "id", ... }
if (is_array($data) && isset($data['external_id'], $data['status']) && !isset($data['transaction_status'])) {
    subscription_handle_xendit_webhook($raw);
}

if (!is_array($data)) {
    subscription_error('Notifikasi tidak valid.', 400);
}

$orderId = trim((string) ($data['order_id'] ?? ''));
$status = (string) ($data['transaction_status'] ?? '');
$fraud = (string) ($data['fraud_status'] ?? 'accept');

if ($orderId === '' || !in_array($status, ['capture', 'settlement'], true)) {
    subscription_json_response(['ok' => true, 'ignored' => true]);
}

if ($fraud !== 'accept' && $fraud !== '') {
    subscription_json_response(['ok' => true, 'ignored' => true]);
}

$pdo = subscription_db();
$stmt = $pdo->prepare('SELECT email, payment_provider FROM orders WHERE id = :id');
$stmt->execute(['id' => $orderId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    subscription_json_response(['ok' => true, 'ignored' => true]);
}

$provider = (string) ($row['payment_provider'] ?? '');

if ($provider === 'midtrans' && subscription_midtrans_server_key() !== null) {
    $synced = subscription_sync_midtrans_order_status($orderId);
    subscription_json_response([
        'ok' => true,
        'synced' => $synced === 'paid',
    ]);
}

subscription_json_response(['ok' => true, 'ignored' => true]);
