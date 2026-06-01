<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

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
if ($status === 'pending') {
    $provider = (string) ($order['payment_provider'] ?? '');
    if ($provider === 'midtrans') {
        $synced = subscription_sync_midtrans_order_status($orderId, $email);
        if ($synced !== null) {
            $status = $synced;
        }
    } elseif ($provider === 'xendit') {
        $synced = subscription_sync_xendit_order_status($orderId, $email);
        if ($synced !== null) {
            $status = $synced;
        }
    }
}

$journalId = (string) ($order['journal_id'] ?? '');
$orderType = (string) ($order['order_type'] ?? 'journal');
$activeUntil = null;
$coinAmount = (int) ($order['coin_amount'] ?? 0);
$balance = null;

if ($status === 'paid') {
    if ($orderType === 'coin') {
        require_once __DIR__ . '/../coins/bootstrap.php';
        $balance = coins_get_balance($email);
    } elseif ($journalId !== '') {
        $activeUntil = subscription_journal_purchase_until($email, $journalId);
    }
}

subscription_json_response([
    'ok' => true,
    'orderId' => $orderId,
    'status' => $status,
    'orderType' => $orderType,
    'journalId' => $journalId,
    'amountIdr' => (int) $order['amount_idr'],
    'coinAmount' => $coinAmount,
    'balance' => $balance,
    'activeUntil' => $activeUntil,
    'paid' => $status === 'paid',
]);
