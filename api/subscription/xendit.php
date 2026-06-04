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
    return app_subscription_redirect_base();
}

function subscription_xendit_request(string $method, string $path, ?array $body = null): array
{
    $decoded = subscription_xendit_request_safe($method, $path, $body);
    if ($decoded === null) {
        subscription_error('Gagal menghubungi Xendit. Periksa kunci API dan izin Invoice di dashboard.', 502);
    }

    return $decoded;
}

/** @return array<string, mixed>|null */
function subscription_xendit_request_safe(string $method, string $path, ?array $body = null): ?array
{
    $secretKey = subscription_xendit_secret_key();
    if ($secretKey === null) {
        return null;
    }

    $url = app_xendit_api_base() . $path;
    $ch = curl_init($url);
    if ($ch === false) {
        error_log('subscription_xendit_request_safe: curl_init failed');

        return null;
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
        error_log(
            'subscription_xendit_request_safe: HTTP '
            . $httpCode
            . ' '
            . $method
            . ' '
            . $path
            . ' body='
            . ($raw !== false ? substr((string) $raw, 0, 500) : 'false'),
        );

        return null;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        error_log('subscription_xendit_request_safe: invalid JSON from ' . $path);

        return null;
    }

    return $decoded;
}

function subscription_order_uses_xendit(array $order): bool
{
    $provider = strtolower(trim((string) ($order['payment_provider'] ?? '')));
    if ($provider === 'xendit') {
        return true;
    }

    $checkout = strtolower((string) ($order['checkout_url'] ?? ''));
    if (str_contains($checkout, 'xendit')) {
        return true;
    }

    return trim((string) ($order['payment_ref'] ?? '')) !== '';
}

/** Pesanan pending yang perlu dicek ke API Xendit. */
function subscription_should_try_xendit_sync(array $order): bool
{
    if (subscription_xendit_secret_key() === null) {
        return false;
    }

    if (subscription_order_uses_xendit($order)) {
        return true;
    }

    $orderId = strtoupper(trim((string) ($order['id'] ?? '')));
    if ($orderId !== '' && str_starts_with($orderId, 'COIN-')) {
        return true;
    }

    return trim((string) ($order['checkout_url'] ?? '')) !== '';
}

function subscription_xendit_invoice_is_paid(array $invoice): bool
{
    $status = strtoupper((string) ($invoice['status'] ?? ''));

    return in_array($status, ['PAID', 'SETTLED'], true);
}

/** @return list<array<string, mixed>> */
function subscription_xendit_normalize_invoice_list(mixed $response): array
{
    if (!is_array($response)) {
        return [];
    }

    if (isset($response[0]) && is_array($response[0])) {
        return array_values(array_filter($response, 'is_array'));
    }

    if (isset($response['data']) && is_array($response['data'])) {
        return array_values(array_filter($response['data'], 'is_array'));
    }

    if (isset($response['id'], $response['status'])) {
        return [$response];
    }

    return [];
}

/** @return array<string, mixed>|null */
function subscription_xendit_fetch_invoice_by_id(string $invoiceId): ?array
{
    $invoiceId = trim($invoiceId);
    if ($invoiceId === '') {
        return null;
    }

    $decoded = subscription_xendit_request_safe('GET', '/v2/invoices/' . rawurlencode($invoiceId));

    return is_array($decoded) && isset($decoded['id']) ? $decoded : null;
}

/** @return array<string, mixed>|null Invoice terbaru untuk external_id (order id). */
function subscription_xendit_fetch_invoice_by_external_id(string $orderId): ?array
{
    $orderId = trim($orderId);
    if ($orderId === '') {
        return null;
    }

    $decoded = subscription_xendit_request_safe(
        'GET',
        '/v2/invoices/?external_id=' . rawurlencode($orderId),
    );
    $invoices = subscription_xendit_normalize_invoice_list($decoded);
    if ($invoices === []) {
        return null;
    }

    usort(
        $invoices,
        static function (array $a, array $b): int {
            $ta = strtotime((string) ($a['updated'] ?? $a['created'] ?? '')) ?: 0;
            $tb = strtotime((string) ($b['updated'] ?? $b['created'] ?? '')) ?: 0;

            return $tb <=> $ta;
        },
    );

    return $invoices[0];
}

/** @return array<string, mixed>|null */
function subscription_xendit_resolve_invoice_for_order(string $orderId, array $order): ?array
{
    $ref = trim((string) ($order['payment_ref'] ?? ''));
    if ($ref !== '') {
        $byId = subscription_xendit_fetch_invoice_by_id($ref);
        if ($byId !== null) {
            return $byId;
        }
    }

    return subscription_xendit_fetch_invoice_by_external_id($orderId);
}

function subscription_xendit_persist_invoice_ref(string $orderId, array $invoice): void
{
    $invoiceId = trim((string) ($invoice['id'] ?? ''));
    if ($invoiceId === '') {
        return;
    }

    $pdo = subscription_db();
    $stmt = $pdo->prepare(
        'UPDATE orders SET payment_provider = :provider, payment_ref = :ref
         WHERE id = :id',
    );
    $stmt->execute([
        'provider' => 'xendit',
        'ref' => $invoiceId,
        'id' => $orderId,
    ]);
}

/** @return array{provider:string,qrString:string,qrImageUrl:string,expiresAt:int,canSimulateDemo:bool,paymentRef?:string,checkoutUrl:string} */
function subscription_xendit_create_invoice(
    string $orderId,
    int $amount,
    string $email,
    string $description,
    string $clientPlatform = 'web',
): array {
    $successUrl = subscription_payment_return_url('success', $orderId, $clientPlatform);
    $failureUrl = subscription_payment_return_url('failed', $orderId, $clientPlatform);

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

function subscription_sync_xendit_order_status(string $orderId): ?string
{
    if (subscription_xendit_secret_key() === null) {
        return null;
    }

    $order = subscription_load_order_by_id($orderId);
    if (!$order) {
        return null;
    }

    $email = subscription_normalize_email((string) $order['email']);
    $orderType = subscription_resolve_order_type($order);
    $currentStatus = (string) ($order['status'] ?? 'pending');

    if ($currentStatus === 'paid') {
        subscription_fulfill_paid_order($order, $orderType);

        return 'paid';
    }

    if (!subscription_should_try_xendit_sync($order)) {
        return $currentStatus;
    }

    $invoice = subscription_xendit_resolve_invoice_for_order($orderId, $order);
    if ($invoice === null) {
        return $currentStatus;
    }

    subscription_xendit_persist_invoice_ref($orderId, $invoice);

    if (subscription_xendit_invoice_is_paid($invoice)) {
        subscription_complete_order($orderId, $email);

        return 'paid';
    }

    return $currentStatus;
}

function subscription_handle_xendit_webhook(string $raw): void
{
    $expected = subscription_xendit_webhook_token();
    $token = (string) ($_SERVER['HTTP_X_CALLBACK_TOKEN'] ?? '');
    if ($expected !== null && $expected !== '') {
        if ($token === '' || !hash_equals($expected, $token)) {
            subscription_error('Webhook tidak sah.', 401);
        }
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        subscription_error('Webhook tidak valid.', 400);
    }

    $status = strtoupper((string) ($data['status'] ?? ''));
    $orderId = trim((string) ($data['external_id'] ?? ''));
    if ($orderId === '') {
        subscription_json_response(['ok' => true, 'ignored' => true]);

        return;
    }

    if (!in_array($status, ['PAID', 'SETTLED'], true)) {
        subscription_json_response(['ok' => true, 'ignored' => true]);

        return;
    }

    $synced = subscription_sync_xendit_order_status($orderId);
    subscription_json_response([
        'ok' => true,
        'orderId' => $orderId,
        'synced' => $synced === 'paid',
    ]);
}
