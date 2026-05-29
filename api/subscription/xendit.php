<?php
declare(strict_types=1);

function subscription_xendit_secret_key(): ?string
{
    $key = subscription_env('XENDIT_SECRET_KEY');
    return $key !== null && $key !== '' ? $key : null;
}

function subscription_xendit_webhook_token(): ?string
{
    $token = subscription_env('XENDIT_WEBHOOK_TOKEN');
    return $token !== null && $token !== '' ? $token : null;
}

function subscription_redirect_base_url(): string
{
    $base = subscription_env('SUBSCRIPTION_REDIRECT_BASE_URL');
    if ($base !== null && $base !== '') {
        return rtrim($base, '/');
    }
    return 'https://localhost';
}

function subscription_xendit_request(string $method, string $path, ?array $body = null): array
{
    $secretKey = subscription_xendit_secret_key();
    if ($secretKey === null) {
        subscription_error('Xendit belum dikonfigurasi.', 503);
    }

    $url = 'https://api.xendit.co' . $path;
    $ch = curl_init($url);
    if ($ch === false) {
        subscription_error('Tidak dapat menghubungi Xendit.', 502);
    }

    $headers = [
        'Accept: application/json',
        'Authorization: Basic ' . base64_encode($secretKey . ':'),
    ];

    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => $headers,
    ];

    if ($method === 'POST') {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_HTTPHEADER][] = 'Content-Type: application/json';
        $opts[CURLOPT_POSTFIELDS] = json_encode($body ?? [], JSON_UNESCAPED_UNICODE);
    }

    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $httpCode < 200 || $httpCode >= 300) {
        $errBody = json_decode($raw !== false ? $raw : '', true);
        $msg = is_array($errBody) && isset($errBody['message'])
            ? (string) $errBody['message']
            : 'Gagal menghubungi Xendit. Periksa kunci API dan izin Invoice di dashboard.';
        subscription_error($msg, 502);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        subscription_error('Respons Xendit tidak valid.', 502);
    }

    return $decoded;
}

/** @return array{provider:string,qrString:string,qrImageUrl:string,expiresAt:int,canSimulateDemo:bool,paymentRef?:string,checkoutUrl:string} */
function subscription_xendit_create_invoice(
    string $orderId,
    int $amount,
    string $email,
    string $description,
): array {
    $base = subscription_redirect_base_url();
    $successUrl = $base . '/?fp_payment=success&orderId=' . rawurlencode($orderId);
    $failureUrl = $base . '/?fp_payment=failed&orderId=' . rawurlencode($orderId);

    $body = [
        'external_id' => $orderId,
        'amount' => $amount,
        'payer_email' => $email,
        'description' => $description,
        'invoice_duration' => 86400,
        'currency' => 'IDR',
        'success_redirect_url' => $successUrl,
        'failure_redirect_url' => $failureUrl,
    ];

    $invoice = subscription_xendit_request('POST', '/v2/invoices', $body);
    $checkoutUrl = trim((string) ($invoice['invoice_url'] ?? ''));
    if ($checkoutUrl === '') {
        subscription_error('Link pembayaran Xendit tidak tersedia.', 502);
    }

    $expiry = (string) ($invoice['expiry_date'] ?? '');
    $expiresAt = $expiry !== '' ? strtotime($expiry) : (time() + 24 * 60 * 60);
    if ($expiresAt === false) {
        $expiresAt = time() + 24 * 60 * 60;
    }

    return [
        'provider' => 'xendit',
        'qrString' => '',
        'qrImageUrl' => '',
        'checkoutUrl' => $checkoutUrl,
        'expiresAt' => $expiresAt,
        'canSimulateDemo' => false,
        'paymentRef' => (string) ($invoice['id'] ?? ''),
    ];
}

function subscription_sync_xendit_order_status(string $orderId, string $email): ?string
{
    $secretKey = subscription_xendit_secret_key();
    if ($secretKey === null) {
        return null;
    }

    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id AND email = :email');
    $stmt->execute(['id' => $orderId, 'email' => $email]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order || $order['status'] === 'paid') {
        return $order['status'] ?? null;
    }

    if (($order['payment_provider'] ?? '') !== 'xendit') {
        return (string) $order['status'];
    }

    $invoiceId = trim((string) ($order['payment_ref'] ?? ''));
    if ($invoiceId === '') {
        return (string) $order['status'];
    }

    $invoice = subscription_xendit_request('GET', '/v2/invoices/' . rawurlencode($invoiceId));
    $status = strtoupper((string) ($invoice['status'] ?? ''));
    if ($status === 'PAID' || $status === 'SETTLED') {
        subscription_complete_order($orderId, $email);
        return 'paid';
    }

    return (string) $order['status'];
}

function subscription_handle_xendit_webhook(string $raw): void
{
    $expected = subscription_xendit_webhook_token();
    $token = (string) ($_SERVER['HTTP_X_CALLBACK_TOKEN'] ?? '');
    if ($expected === null || $token === '' || !hash_equals($expected, $token)) {
        subscription_error('Webhook tidak sah.', 401);
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        subscription_error('Webhook tidak valid.', 400);
    }

    $status = strtoupper((string) ($data['status'] ?? ''));
    $orderId = trim((string) ($data['external_id'] ?? ''));
    if ($orderId === '' || !in_array($status, ['PAID', 'SETTLED'], true)) {
        subscription_json_response(['ok' => true, 'ignored' => true]);
    }

    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT email FROM orders WHERE id = :id');
    $stmt->execute(['id' => $orderId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        subscription_json_response(['ok' => true, 'ignored' => true]);
    }

    subscription_complete_order($orderId, (string) $row['email']);
    subscription_json_response(['ok' => true]);
}
