<?php
declare(strict_types=1);

$configLocal = __DIR__ . '/config.local.php';
if (is_file($configLocal)) {
    require $configLocal;
}

$apiConfig = __DIR__ . '/../config.local.php';
if (is_file($apiConfig)) {
    require $apiConfig;
}

require_once __DIR__ . '/../database.php';

require __DIR__ . '/payment.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

const SUBSCRIPTION_DATA_DIR = __DIR__ . '/data';
const SUBSCRIPTION_PERIOD_SECONDS = 30 * 24 * 60 * 60;

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
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
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

function subscription_db(): PDO
{
    return app_db();
}

/** Katalog jurnal — id & harga dari CMS jika tersedia, fallback ke daftar statis */
function subscription_journal_catalog(): array
{
    $cmsBootstrap = __DIR__ . '/../cms/bootstrap.php';
    if (is_file($cmsBootstrap)) {
        require_once $cmsBootstrap;
        $fromCms = cms_journal_catalog();
        if (count($fromCms) > 0) {
            return $fromCms;
        }
    }

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
    ];
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

function subscription_activate_journal(string $email, string $journalId, int $periodSeconds = SUBSCRIPTION_PERIOD_SECONDS): int
{
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

function subscription_activate(string $email, int $periodSeconds = SUBSCRIPTION_PERIOD_SECONDS): int
{
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
