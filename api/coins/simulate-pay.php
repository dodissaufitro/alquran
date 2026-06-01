<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    coins_error('Method not allowed.', 405);
}

$demoSecret = subscription_demo_secret();
if ($demoSecret === null) {
    coins_error('Simulasi pembayaran tidak diaktifkan.', 503);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    coins_error('Body JSON tidak valid.');
}

$email = subscription_normalize_email((string) ($data['email'] ?? ''));
$orderId = trim((string) ($data['orderId'] ?? ''));
$demoKey = trim((string) ($data['demoKey'] ?? ''));

if ($orderId === '') {
    coins_error('orderId wajib diisi.');
}
if (!hash_equals($demoSecret, $demoKey)) {
    coins_error('Kunci demo tidak valid.', 403);
}

$pdo = subscription_db();
$stmt = $pdo->prepare('SELECT order_type, payment_provider FROM orders WHERE id = :id AND email = :email');
$stmt->execute(['id' => $orderId, 'email' => $email]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    coins_error('Pesanan tidak ditemukan.', 404);
}
if (($row['order_type'] ?? '') !== 'coin') {
    coins_error('Pesanan bukan pembelian coin.', 400);
}
if (($row['payment_provider'] ?? '') !== 'demo') {
    coins_error('Simulasi hanya untuk mode demo QR.', 400);
}

subscription_complete_order($orderId, $email);

subscription_json_response(array_merge(coins_wallet_payload($email), [
    'orderId' => $orderId,
    'paid' => true,
    'message' => 'Coin berhasil ditambahkan.',
]));
