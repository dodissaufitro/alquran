<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    subscription_error('Method not allowed.', 405);
}

$email = subscription_normalize_email((string) ($_GET['email'] ?? ''));
$orderId = trim((string) ($_GET['orderId'] ?? ''));
if ($orderId === '') {
    subscription_error('orderId wajib diisi.');
}

$pdo = subscription_db();
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id AND email = :email');
$stmt->execute(['id' => $orderId, 'email' => $email]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    subscription_error('Pesanan tidak ditemukan.', 404);
}

$status = (string) $order['status'];
if ($status === 'pending' && ($order['payment_provider'] ?? '') === 'midtrans') {
    $synced = subscription_sync_midtrans_order_status($orderId, $email);
    if ($synced !== null) {
        $status = $synced;
    }
}

$journalId = (string) ($order['journal_id'] ?? '');
$activeUntil = null;
if ($status === 'paid' && $journalId !== '') {
    $activeUntil = subscription_journal_purchase_until($email, $journalId);
}

subscription_json_response([
    'ok' => true,
    'orderId' => $orderId,
    'status' => $status,
    'journalId' => $journalId,
    'amountIdr' => (int) $order['amount_idr'],
    'activeUntil' => $activeUntil,
    'paid' => $status === 'paid',
]);
