<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_once __DIR__ . '/payment.php';
require_once __DIR__ . '/xendit.php';

app_send_cors_headers('GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (app_is_options_request()) {
    http_response_code(204);
    exit;
}

const SUBSCRIPTION_DATA_DIR = __DIR__ . '/data';

function subscription_period_seconds(): int
{
    return app_subscription_period_seconds();
}

function subscription_json_response(mixed $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function subscription_error(string $message, int $code = 400): void
{
    subscription_json_response(['ok' => false, 'error' => $message], $code);
}

function subscription_env(string $key, ?string $default = null): ?string
{
    return app_env($key, $default);
}

function subscription_price_idr(): int
{
    $raw = subscription_env('SUBSCRIPTION_PRICE_IDR', '29000');
    $price = (int) $raw;
    return $price > 0 ? $price : 29000;
}

function subscription_demo_secret(): ?string
{
    return subscription_env('SUBSCRIPTION_DEMO_SECRET');
}

function subscription_app_origin(): string
{
    $origin = subscription_env('SUBSCRIPTION_APP_ORIGIN') ?? subscription_env('APP_ORIGIN');
    if ($origin !== null && $origin !== '') {
        return rtrim($origin, '/');
    }
    return app_origin();
}

/** web | android (APK Capacitor) */
function subscription_normalize_client_platform(mixed $platform): string
{
    $p = strtolower(trim((string) $platform));
    return in_array($p, ['android', 'capacitor', 'apk', 'native'], true) ? 'android' : 'web';
}

function subscription_payment_return_url(string $kind, string $orderId, string $clientPlatform = 'web'): string
{
    $params = 'fp_payment=' . rawurlencode($kind) . '&orderId=' . rawurlencode($orderId);

    if ($clientPlatform === 'android') {
        $apkReturn = subscription_env('SUBSCRIPTION_APK_RETURN_URL');
        $base = ($apkReturn !== null && $apkReturn !== '')
            ? rtrim($apkReturn, '/')
            : app_subscription_apk_return_url();

        return str_contains($base, '?') ? $base . '&' . $params : $base . '?' . $params;
    }

    $base = subscription_redirect_base_url();
    if (str_contains($base, '?')) {
        return $base . '&' . $params;
    }

    return $base . '/?' . $params;
}

function subscription_db(): PDO
{
    return app_db();
}

/** @return list<array{id: string, priceIdr: int, coinPrice?: int}> */
function subscription_static_ulumul_catalog(): array
{
    return [
        ['id' => 'pengertian-ulum', 'priceIdr' => 50000, 'coinPrice' => 25],
        ['id' => 'asbabun-nuzul', 'priceIdr' => 50000, 'coinPrice' => 25],
        ['id' => 'makki-madani', 'priceIdr' => 50000, 'coinPrice' => 25],
    ];
}

/** @param list<array{id: string, priceIdr: int, coinPrice?: int}> $catalog
 * @param list<array{id: string, priceIdr: int, coinPrice?: int}> $extra
 * @return list<array{id: string, priceIdr: int, coinPrice?: int}> */
function subscription_merge_paid_catalog(array $catalog, array $extra): array
{
    $byId = [];
    foreach ($catalog as $item) {
        $byId[$item['id']] = $item;
    }
    foreach ($extra as $item) {
        if (!isset($byId[$item['id']])) {
            $byId[$item['id']] = $item;
        }
    }

    return array_values($byId);
}

/** Daftar statis jurnal + Ulumul jika CMS tidak tersedia */
function subscription_static_journal_catalog(): array
{
    return [
        ['id' => 'sholat-digital', 'priceIdr' => 19000],
        ['id' => 'ramadan-ibadah', 'priceIdr' => 25000],
        ['id' => 'adab-ilmu', 'priceIdr' => 15000],
        ['id' => 'zakat-dan-infaq', 'priceIdr' => 22000],
        ['id' => 'parenting-islami', 'priceIdr' => 27000],
        ['id' => 'muamalah-sehari-hari', 'priceIdr' => 18000],
        ['id' => 'buku-hadits-arbaein', 'priceIdr' => 32000],
        ['id' => 'buku-tahajud-malamm', 'priceIdr' => 24000],
        ['id' => 'buku-sirah-10-hari', 'priceIdr' => 29000],
        ...subscription_static_ulumul_catalog(),
    ];
}

/** Katalog jurnal — id & harga dari CMS jika tersedia, fallback ke daftar statis */
function subscription_journal_catalog(): array
{
    $cmsBootstrap = __DIR__ . '/../cms/bootstrap.php';
    if (is_file($cmsBootstrap)) {
        require_once $cmsBootstrap;
        $fromCms = cms_paid_content_catalog();
        if (count($fromCms) > 0) {
            return subscription_merge_paid_catalog($fromCms, subscription_static_ulumul_catalog());
        }
    }

    return subscription_static_journal_catalog();
}

function subscription_journal_price(string $journalId): int
{
    foreach (subscription_journal_catalog() as $item) {
        if ($item['id'] === $journalId) {
            return (int) $item['priceIdr'];
        }
    }
    subscription_error('Jurnal tidak ditemukan.', 404);
}

function subscription_journal_ids(): array
{
    return array_map(static fn (array $item): string => $item['id'], subscription_journal_catalog());
}

function subscription_journal_purchase_until(string $email, string $journalId): ?int
{
    $pdo = subscription_db();
    $stmt = $pdo->prepare(
        'SELECT active_until FROM journal_purchases WHERE email = :email AND journal_id = :journal_id',
    );
    $stmt->execute(['email' => $email, 'journal_id' => $journalId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }
    $until = (int) $row['active_until'];
    return $until > time() ? $until : null;
}

function subscription_activate_journal(string $email, string $journalId, ?int $periodSeconds = null): int
{
    $periodSeconds ??= subscription_period_seconds();
    $pdo = subscription_db();
    $now = time();
    $current = subscription_journal_purchase_until($email, $journalId);
    $base = $current !== null && $current > $now ? $current : $now;
    $activeUntil = $base + $periodSeconds;

    $params = [
        'email' => $email,
        'journal_id' => $journalId,
        'active_until' => $activeUntil,
        'updated_at' => $now,
    ];

    if (app_db_is_mysql()) {
        $stmt = $pdo->prepare(
            'INSERT INTO journal_purchases (email, journal_id, active_until, updated_at)
             VALUES (:email, :journal_id, :active_until, :updated_at)
             ON DUPLICATE KEY UPDATE
               active_until = VALUES(active_until),
               updated_at = VALUES(updated_at)',
        );
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO journal_purchases (email, journal_id, active_until, updated_at)
             VALUES (:email, :journal_id, :active_until, :updated_at)
             ON CONFLICT(email, journal_id) DO UPDATE SET
               active_until = excluded.active_until,
               updated_at = excluded.updated_at',
        );
    }
    $stmt->execute($params);

    return $activeUntil;
}

function subscription_journal_purchases_payload(string $email): array
{
    $now = time();
    $catalog = subscription_journal_catalog();
    $byId = [];

    foreach ($catalog as $item) {
        $byId[$item['id']] = [
            'journalId' => $item['id'],
            'priceIdr' => (int) $item['priceIdr'],
            'active' => false,
            'activeUntil' => null,
        ];
    }

    // Langganan lama (semua jurnal) tetap dihormati hingga habis
    $legacyUntil = subscription_active_until($email);
    if ($legacyUntil !== null) {
        foreach (array_keys($byId) as $journalId) {
            $byId[$journalId]['active'] = true;
            $byId[$journalId]['activeUntil'] = $legacyUntil;
        }
    }

    $pdo = subscription_db();
    $stmt = $pdo->prepare(
        'SELECT journal_id, active_until FROM journal_purchases WHERE email = :email',
    );
    $stmt->execute(['email' => $email]);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $journalId = (string) $row['journal_id'];
        if (!isset($byId[$journalId])) {
            continue;
        }
        $until = (int) $row['active_until'];
        if ($until <= $now) {
            continue;
        }
        $existing = $byId[$journalId]['activeUntil'];
        if ($existing === null || $until > $existing) {
            $byId[$journalId]['active'] = true;
            $byId[$journalId]['activeUntil'] = $until;
        }
    }

    return array_values($byId);
}

function subscription_normalize_email(string $email): string
{
    $email = strtolower(trim($email));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        subscription_error('Email tidak valid.', 400);
    }
    return $email;
}

function subscription_active_until(string $email): ?int
{
    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT active_until FROM subscriptions WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }
    $until = (int) $row['active_until'];
    if ($until <= time()) {
        return null;
    }
    return $until;
}

function subscription_activate(string $email, ?int $periodSeconds = null): int
{
    $periodSeconds ??= subscription_period_seconds();
    $pdo = subscription_db();
    $now = time();
    $current = subscription_active_until($email);
    $base = $current !== null && $current > $now ? $current : $now;
    $activeUntil = $base + $periodSeconds;

    $params = [
        'email' => $email,
        'active_until' => $activeUntil,
        'updated_at' => $now,
    ];

    if (app_db_is_mysql()) {
        $stmt = $pdo->prepare(
            'INSERT INTO subscriptions (email, active_until, updated_at)
             VALUES (:email, :active_until, :updated_at)
             ON DUPLICATE KEY UPDATE
               active_until = VALUES(active_until),
               updated_at = VALUES(updated_at)',
        );
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO subscriptions (email, active_until, updated_at)
             VALUES (:email, :active_until, :updated_at)
             ON CONFLICT(email) DO UPDATE SET
               active_until = excluded.active_until,
               updated_at = excluded.updated_at',
        );
    }
    $stmt->execute($params);

    return $activeUntil;
}

function subscription_status_payload(string $email): array
{
    $journals = subscription_journal_purchases_payload($email);
    $anyActive = false;
    $latestUntil = null;
    foreach ($journals as $journal) {
        if ($journal['active']) {
            $anyActive = true;
            $until = $journal['activeUntil'];
            if ($until !== null && ($latestUntil === null || $until > $latestUntil)) {
                $latestUntil = $until;
            }
        }
    }

    return [
        'ok' => true,
        'email' => $email,
        'active' => $anyActive,
        'activeUntil' => $latestUntil,
        'journals' => $journals,
    ];
}

function subscription_new_order_id(): string
{
    return 'JRN-' . strtoupper(bin2hex(random_bytes(4)));
}
