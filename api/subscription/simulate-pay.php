<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    subscription_error('Method not allowed.', 405);
}

$demoSecret = subscription_demo_secret();
if ($demoSecret === null) {
    subscription_error('Simulasi pembayaran tidak diaktifkan.', 503);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    subscription_error('Body JSON tidak valid.');
}

$email = subscription_normalize_email((string) ($data['email'] ?? ''));
$orderId = trim((string) ($data['orderId'] ?? ''));
$demoKey = trim((string) ($data['demoKey'] ?? ''));

if ($orderId === '') {
    subscription_error('orderId wajib diisi.');
}
if (!hash_equals($demoSecret, $demoKey)) {
    subscription_error('Kunci demo tidak valid.', 403);
}

$pdo = subscription_db();
$stmt = $pdo->prepare('SELECT payment_provider FROM orders WHERE id = :id AND email = :email');
$stmt->execute(['id' => $orderId, 'email' => $email]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    subscription_error('Pesanan tidak ditemukan.', 404);
}
if (($row['payment_provider'] ?? '') !== 'demo') {
    subscription_error('Simulasi hanya untuk mode demo QR.', 400);
}

subscription_complete_order($orderId, $email);

subscription_json_response(array_merge(subscription_status_payload($email), [
    'orderId' => $orderId,
    'paid' => true,
    'message' => 'Pembayaran demo berhasil.',
]));
