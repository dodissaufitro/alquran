<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    subscription_error('Method not allowed.', 405);
}

$raw = file_get_contents('php://input') ?: '';

if (isset($_SERVER['HTTP_X_CALLBACK_TOKEN'])) {
    subscription_handle_xendit_webhook($raw);
}

$data = json_decode($raw, true);
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

$email = (string) $row['email'];
$provider = (string) ($row['payment_provider'] ?? '');

// Midtrans: verifikasi status ke API gateway (jangan percaya body notifikasi saja)
if ($provider === 'midtrans' && subscription_midtrans_server_key() !== null) {
    $synced = subscription_sync_midtrans_order_status($orderId, $email);
    subscription_json_response([
        'ok' => true,
        'synced' => $synced === 'paid',
    ]);
}

// Tanpa Midtrans terkonfigurasi — abaikan notifikasi mentah (cegah pembayaran palsu)
subscription_json_response(['ok' => true, 'ignored' => true]);
