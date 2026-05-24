<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    subscription_error('Method not allowed.', 405);
}

$raw = file_get_contents('php://input') ?: '';
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
$stmt = $pdo->prepare('SELECT email FROM orders WHERE id = :id');
$stmt->execute(['id' => $orderId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    subscription_json_response(['ok' => true, 'ignored' => true]);
}

subscription_complete_order($orderId, (string) $row['email']);

subscription_json_response(['ok' => true]);
