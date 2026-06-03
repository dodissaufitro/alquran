<?php
declare(strict_types=1);

/**
 * Contoh: buat invoice Xendit untuk buku "Arba'in Nawawi".
 * Jalankan: php api/subscription/test-xendit-buku.php
 * Butuh config.local.php + izin Invoice di dashboard Xendit.
 */
require_once __DIR__ . '/../env.php';
app_require_cli('test-xendit-buku');

require_once __DIR__ . '/bootstrap.php';

$email = 'pembeli@example.com';
$journalId = 'buku-hadits-arbaein';
$amount = subscription_journal_price($journalId);
$orderId = subscription_new_order_id();
$now = time();

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

$payment = subscription_xendit_create_invoice(
    $orderId,
    $amount,
    $email,
    'Pembelian: ' . $journalId,
);
subscription_save_order_payment($orderId, $payment);

echo json_encode(
    [
        'ok' => true,
        'orderId' => $orderId,
        'journalId' => $journalId,
        'amountIdr' => $amount,
        'checkoutUrl' => $payment['checkoutUrl'],
        'hint' => 'Buka checkoutUrl di browser untuk simulasi pembayaran (mode development).',
    ],
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
) . PHP_EOL;
