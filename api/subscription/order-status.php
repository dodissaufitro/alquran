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

$result = subscription_process_order_payment_sync($orderId);

$order = subscription_load_order_by_id($orderId) ?? $order;
$syncToken = trim((string) ($order['payment_sync_token'] ?? ''));

subscription_json_response([
    'ok' => true,
    'orderId' => $orderId,
    'syncToken' => $syncToken !== '' ? $syncToken : null,
    'status' => $result['status'],
    'orderType' => $result['orderType'],
    'journalId' => (string) ($order['journal_id'] ?? ''),
    'amountIdr' => (int) $order['amount_idr'],
    'coinAmount' => $result['coinAmount'],
    'balance' => $result['balance'],
    'coinCredited' => $result['coinCredited'],
    'activeUntil' => $result['activeUntil'],
    'paid' => $result['paid'],
]);
