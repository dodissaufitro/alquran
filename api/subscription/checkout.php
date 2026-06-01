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
$clientPlatform = subscription_normalize_client_platform($data['clientPlatform'] ?? 'web');
$journalId = trim((string) ($data['journalId'] ?? ''));
if ($journalId === '') {
    subscription_error('journalId wajib diisi.');
}

$amount = subscription_journal_price($journalId);
$orderId = subscription_new_order_id();
$now = time();

try {
    $pdo = subscription_db();
    $stmt = $pdo->prepare(
        'INSERT INTO orders (
            id, email, journal_id, amount_idr, status, created_at, paid_at,
            payment_provider, payment_ref, qr_string, checkout_url
         ) VALUES (
            :id, :email, :journal_id, :amount_idr, :status, :created_at, NULL,
            :payment_provider, :payment_ref, :qr_string, :checkout_url
         )',
    );
    $stmt->execute([
        'id' => $orderId,
        'email' => $email,
        'journal_id' => $journalId,
        'amount_idr' => $amount,
        'status' => 'pending',
        'created_at' => $now,
        'payment_provider' => '',
        'payment_ref' => '',
        'qr_string' => '',
        'checkout_url' => '',
    ]);
} catch (Throwable $e) {
    error_log('subscription checkout: ' . $e->getMessage());
    subscription_error(
        'Gagal membuat pesanan. Muat ulang halaman (skema database akan diperbarui otomatis) atau jalankan migrasi MySQL.',
        500,
    );
}

$payment = subscription_create_checkout_payment($orderId, $amount, $email, $journalId, $clientPlatform);
subscription_save_order_payment($orderId, $payment);

subscription_json_response([
    'ok' => true,
    'orderId' => $orderId,
    'journalId' => $journalId,
    'amountIdr' => $amount,
    'currency' => 'IDR',
    'email' => $email,
    'demoMode' => subscription_demo_secret() !== null,
    'payment' => $payment,
]);
