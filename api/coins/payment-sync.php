<?php
declare(strict_types=1);

/**
 * Sinkron pembayaran setelah redirect Xendit (tanpa Bearer — pakai syncToken dari checkout).
 * Dipanggil dari payment-return.html dan aplikasi.
 */
require_once __DIR__ . '/bootstrap.php';

app_send_cors_headers('GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (app_is_options_request()) {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    coins_error('Method not allowed.', 405);
}

$orderId = trim((string) ($_GET['orderId'] ?? ''));
$syncToken = trim((string) ($_GET['syncToken'] ?? ''));
if ($orderId === '' || $syncToken === '') {
    coins_error('orderId dan syncToken wajib diisi.', 400);
}

$order = subscription_load_order_by_id($orderId);
if (!$order || !subscription_verify_order_sync_token($order, $syncToken)) {
    coins_error('Pesanan tidak valid.', 403);
}

$order = subscription_load_order_by_id($orderId) ?? [];
$result = subscription_process_order_payment_sync($orderId);

subscription_json_response([
    'ok' => true,
    'orderId' => $orderId,
    'syncToken' => trim((string) ($order['payment_sync_token'] ?? '')),
    'status' => $result['status'],
    'paid' => $result['paid'],
    'balance' => $result['balance'],
    'coinAmount' => $result['coinAmount'],
    'coinCredited' => $result['coinCredited'],
    'orderType' => $result['orderType'],
]);
