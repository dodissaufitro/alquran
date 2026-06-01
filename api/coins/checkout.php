<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    coins_error('Method not allowed.', 405);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    coins_error('Body JSON tidak valid.');
}

$email = subscription_normalize_email((string) ($data['email'] ?? ''));
$clientPlatform = subscription_normalize_client_platform($data['clientPlatform'] ?? 'web');
$packageId = trim((string) ($data['packageId'] ?? ''));
if ($packageId === '') {
    coins_error('packageId wajib diisi.');
}

$pkg = coins_package_by_id($packageId);
$amount = (int) $pkg['priceIdr'];
$coinAmount = (int) $pkg['coins'];
$orderId = coins_new_order_id();
$now = time();

try {
    $pdo = subscription_db();
    $stmt = $pdo->prepare(
        'INSERT INTO orders (
            id, email, journal_id, amount_idr, status, created_at, paid_at,
            payment_provider, payment_ref, qr_string, checkout_url,
            order_type, coin_amount, package_id
         ) VALUES (
            :id, :email, :journal_id, :amount_idr, :status, :created_at, NULL,
            :payment_provider, :payment_ref, :qr_string, :checkout_url,
            :order_type, :coin_amount, :package_id
         )',
    );
    $stmt->execute([
        'id' => $orderId,
        'email' => $email,
        'journal_id' => '',
        'amount_idr' => $amount,
        'status' => 'pending',
        'created_at' => $now,
        'payment_provider' => '',
        'payment_ref' => '',
        'qr_string' => '',
        'checkout_url' => '',
        'order_type' => 'coin',
        'coin_amount' => $coinAmount,
        'package_id' => $packageId,
    ]);
} catch (Throwable $e) {
    error_log('coins checkout: ' . $e->getMessage());
    coins_error('Gagal membuat pesanan coin. Muat ulang halaman atau jalankan migrasi database.', 500);
}

$description = 'Top up ' . $pkg['label'];
$paymentMethod = trim((string) ($data['paymentMethod'] ?? 'qris'));
$payment = subscription_create_checkout_payment(
    $orderId,
    $amount,
    $email,
    $packageId,
    $clientPlatform,
    $paymentMethod !== '' ? $paymentMethod : 'qris',
);
subscription_save_order_payment($orderId, $payment);

subscription_json_response([
    'ok' => true,
    'orderId' => $orderId,
    'packageId' => $packageId,
    'coinAmount' => $coinAmount,
    'amountIdr' => $amount,
    'currency' => 'IDR',
    'email' => $email,
    'demoMode' => subscription_demo_secret() !== null,
    'payment' => $payment,
]);
