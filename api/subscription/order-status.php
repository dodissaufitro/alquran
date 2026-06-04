<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    subscription_error('Method not allowed.', 405);
}

$authEmail = subscription_authenticated_email((string) ($_GET['email'] ?? ''));
$orderId = trim((string) ($_GET['orderId'] ?? ''));
if ($orderId === '') {
    subscription_error('orderId wajib diisi.');
}

$order = subscription_load_order_by_id($orderId);
if (!$order) {
    subscription_error('Pesanan tidak ditemukan.', 404);
}

subscription_assert_order_owner($order, $authEmail);

$ownerEmail = subscription_normalize_email((string) $order['email']);
$status = (string) $order['status'];

if ($status !== 'paid') {
    $provider = (string) ($order['payment_provider'] ?? '');
    if ($provider === 'midtrans') {
        $synced = subscription_sync_midtrans_order_status($orderId);
        if ($synced !== null) {
            $status = $synced;
        }
    } elseif ($provider === 'xendit') {
        $synced = subscription_sync_xendit_order_status($orderId);
        if ($synced !== null) {
            $status = $synced;
        }
    }

    if ($status === 'paid') {
        $order = subscription_load_order_by_id($orderId) ?? $order;
    }
}

$journalId = (string) ($order['journal_id'] ?? '');
$orderType = subscription_resolve_order_type($order);
$activeUntil = null;
$coinAmount = (int) ($order['coin_amount'] ?? 0);
$balance = null;
$coinCredited = false;

if ($orderType === 'coin') {
    require_once __DIR__ . '/../coins/bootstrap.php';
    if ($coinAmount <= 0) {
        $coinAmount = coins_resolve_order_coin_amount($order);
    }
}

if ($status === 'paid') {
    if ($orderType === 'coin') {
        $coinCredited = subscription_fulfill_paid_order($order, $orderType);
        $balance = coins_get_balance($ownerEmail);
    } elseif ($journalId !== '') {
        $activeUntil = subscription_journal_purchase_until($ownerEmail, $journalId);
    }
} elseif ($orderType === 'coin') {
    $coinCredited = coins_order_was_credited($ownerEmail, $orderId);
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
    'coinCredited' => $coinCredited,
    'activeUntil' => $activeUntil,
    'paid' => $status === 'paid',
]);
