<?php
declare(strict_types=1);

function subscription_qr_image_url(string $payload): string
{
    return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=' . rawurlencode($payload);
}

function subscription_midtrans_is_production(): bool
{
    return subscription_env('MIDTRANS_IS_PRODUCTION', '0') === '1';
}

function subscription_midtrans_base_url(): string
{
    return subscription_midtrans_is_production()
        ? 'https://api.midtrans.com'
        : 'https://api.sandbox.midtrans.com';
}

function subscription_midtrans_server_key(): ?string
{
    $key = subscription_env('MIDTRANS_SERVER_KEY');
    return $key !== null && $key !== '' ? $key : null;
}

/** @return array{provider:string,qrString:string,qrImageUrl:string,expiresAt:int,canSimulateDemo:bool,paymentRef?:string,checkoutUrl?:string} */
function subscription_create_checkout_payment(
    string $orderId,
    int $amount,
    string $email,
    string $journalId,
    string $clientPlatform = 'web',
    string $paymentMethod = 'qris',
): array {
    $description = 'Pembelian: ' . $journalId;
    $platform = subscription_normalize_client_platform($clientPlatform);
    $method = strtolower(trim($paymentMethod));

    // QRIS & metode umum → gateway Xendit (invoice) jika sudah dikonfigurasi
    if (subscription_xendit_secret_key() !== null) {
        return subscription_xendit_create_invoice($orderId, $amount, $email, $description, $platform);
    }

    // Tanpa Xendit: QRIS inline Midtrans, atau demo lokal
    if ($method === 'qris' || $method === '' || $method === 'gateway') {
        return subscription_create_qris_payment($orderId, $amount, $email);
    }

    return subscription_create_qris_payment($orderId, $amount, $email);
}

/** @return array{provider:string,qrString:string,qrImageUrl:string,expiresAt:int,canSimulateDemo:bool,paymentRef?:string} */
function subscription_create_qris_payment(string $orderId, int $amount, string $email): array
{
    $serverKey = subscription_midtrans_server_key();
    if ($serverKey !== null) {
        return subscription_midtrans_charge_qris($orderId, $amount, $email, $serverKey);
    }

    $expiresAt = time() + 15 * 60;
    $qrString = 'FAITHFULPATH|PAY|' . $orderId . '|' . $amount;

    return [
        'provider' => 'demo',
        'qrString' => $qrString,
        'qrImageUrl' => subscription_qr_image_url($qrString),
        'expiresAt' => $expiresAt,
        'canSimulateDemo' => subscription_demo_secret() !== null,
    ];
}

/** @return array{provider:string,qrString:string,qrImageUrl:string,expiresAt:int,canSimulateDemo:bool,paymentRef?:string} */
function subscription_midtrans_charge_qris(string $orderId, int $amount, string $email, string $serverKey): array
{
    $payload = [
        'payment_type' => 'qris',
        'transaction_details' => [
            'order_id' => $orderId,
            'gross_amount' => $amount,
        ],
        'customer_details' => [
            'email' => $email,
        ],
    ];

    $ch = curl_init(subscription_midtrans_base_url() . '/v2/charge');
    if ($ch === false) {
        subscription_error('Tidak dapat menghubungi gateway pembayaran.', 502);
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: Basic ' . base64_encode($serverKey . ':'),
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 30,
    ]);

    $raw = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $httpCode < 200 || $httpCode >= 300) {
        subscription_error('Gagal membuat QRIS. Periksa kunci Midtrans.', 502);
    }

    $body = json_decode($raw, true);
    if (!is_array($body)) {
        subscription_error('Respons pembayaran tidak valid.', 502);
    }

    $qrString = (string) ($body['qr_string'] ?? '');
    $qrImageUrl = '';

    if (isset($body['actions']) && is_array($body['actions'])) {
        foreach ($body['actions'] as $action) {
            if (!is_array($action)) {
                continue;
            }
            $name = (string) ($action['name'] ?? '');
            if ($name === 'generate-qr-code' || $name === 'generate-qr-code-v2') {
                $qrImageUrl = (string) ($action['url'] ?? '');
                break;
            }
        }
    }

    if ($qrImageUrl === '' && $qrString !== '') {
        $qrImageUrl = subscription_qr_image_url($qrString);
    }

    if ($qrImageUrl === '') {
        subscription_error('QRIS tidak tersedia dari gateway.', 502);
    }

    $expiry = (string) ($body['expiry_time'] ?? '');
    $expiresAt = $expiry !== '' ? strtotime($expiry) : (time() + 15 * 60);
    if ($expiresAt === false) {
        $expiresAt = time() + 15 * 60;
    }

    return [
        'provider' => 'midtrans',
        'qrString' => $qrString,
        'qrImageUrl' => $qrImageUrl,
        'expiresAt' => $expiresAt,
        'canSimulateDemo' => false,
        'paymentRef' => (string) ($body['transaction_id'] ?? ''),
    ];
}

function subscription_save_order_payment(string $orderId, array $payment): void
{
    $pdo = subscription_db();
    $stmt = $pdo->prepare(
        'UPDATE orders SET payment_provider = :provider, payment_ref = :ref, qr_string = :qr, checkout_url = :checkout_url
         WHERE id = :id',
    );
    $stmt->execute([
        'provider' => $payment['provider'],
        'ref' => $payment['paymentRef'] ?? '',
        'qr' => $payment['qrString'] ?? '',
        'checkout_url' => $payment['checkoutUrl'] ?? '',
        'id' => $orderId,
    ]);
}

function subscription_complete_order(string $orderId, string $email): void
{
    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id AND email = :email');
    $stmt->execute(['id' => $orderId, 'email' => $email]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        subscription_error('Pesanan tidak ditemukan.', 404);
    }

    if ($order['status'] === 'paid') {
        return;
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

    $orderType = trim((string) ($order['order_type'] ?? 'journal'));
    if ($orderType === 'coin') {
        require_once __DIR__ . '/../coins/bootstrap.php';
        coins_complete_order($order);
        return;
    }

    $journalId = trim((string) ($order['journal_id'] ?? ''));
    if ($journalId === '') {
        subscription_error('Pesanan tidak terkait jurnal.', 400);
    }

    subscription_activate_journal($email, $journalId);
}

function subscription_sync_midtrans_order_status(string $orderId, string $email): ?string
{
    $serverKey = subscription_midtrans_server_key();
    if ($serverKey === null) {
        return null;
    }

    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id AND email = :email');
    $stmt->execute(['id' => $orderId, 'email' => $email]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order || $order['status'] === 'paid') {
        return $order['status'] ?? null;
    }

    if (($order['payment_provider'] ?? '') !== 'midtrans') {
        return (string) $order['status'];
    }

    $ch = curl_init(subscription_midtrans_base_url() . '/v2/' . rawurlencode($orderId) . '/status');
    if ($ch === false) {
        return (string) $order['status'];
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Basic ' . base64_encode($serverKey . ':'),
        ],
        CURLOPT_TIMEOUT => 15,
    ]);

    $raw = curl_exec($ch);
    curl_close($ch);

    if ($raw === false) {
        return (string) $order['status'];
    }

    $body = json_decode($raw, true);
    if (!is_array($body)) {
        return (string) $order['status'];
    }

    $transactionStatus = (string) ($body['transaction_status'] ?? '');
    if (in_array($transactionStatus, ['capture', 'settlement'], true)) {
        subscription_complete_order($orderId, $email);
        return 'paid';
    }

    return (string) $order['status'];
}
