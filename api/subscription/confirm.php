<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    subscription_error('Method not allowed.', 405);
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

$demoSecret = subscription_demo_secret();
if ($demoSecret === null) {
    subscription_error('Konfirmasi pembayaran demo tidak diaktifkan di server.', 503);
}
if (!hash_equals($demoSecret, $demoKey)) {
    subscription_error('Kunci pembayaran demo tidak valid.', 403);
}

$pdo = subscription_db();
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id AND email = :email');
$stmt->execute(['id' => $orderId, 'email' => $email]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    subscription_error('Pesanan tidak ditemukan.', 404);
}
if ($order['status'] === 'paid') {
    subscription_json_response(array_merge(subscription_status_payload($email), [
        'orderId' => $orderId,
        'message' => 'Langganan sudah aktif.',
    ]));
}

$now = time();
$update = $pdo->prepare(
    'UPDATE orders SET status = :status, paid_at = :paid_at WHERE id = :id',
);
$update->execute([
    'status' => 'paid',
    'paid_at' => $now,
    'id' => $orderId,
]);

$journalId = trim((string) ($order['journal_id'] ?? ''));
if ($journalId === '') {
    subscription_error('Pesanan ini tidak terkait jurnal. Buat pesanan baru dari daftar jurnal.', 400);
}

$activeUntil = subscription_activate_journal($email, $journalId);

subscription_json_response(array_merge(subscription_status_payload($email), [
    'orderId' => $orderId,
    'journalId' => $journalId,
    'message' => 'Pembayaran berhasil. Jurnal dapat dibaca.',
]));
