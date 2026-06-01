<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../learning-store.php';

const CMS_DATA_DIR = __DIR__ . '/data';
const CMS_DEFAULT_JSON = CMS_DATA_DIR . '/default-content.json';

function cms_cors(): void
{
    app_send_cors_headers('GET, POST, PUT, DELETE, OPTIONS', 'Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
}

/** @var list<string> */
const CMS_SECTION_KEYS = [
    'learning',
    'jurnal',
    'hadithCategories',
    'hadiths',
    'duaCategories',
    'duas',
    'podcasts',
    'publicMeetings',
    'scheduledMeetings',
    'talaqqi',
    'settings',
];

function cms_json(mixed $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function cms_error(string $message, int $code = 400): void
{
    cms_json(['ok' => false, 'error' => $message], $code);
}

function cms_env(string $key, ?string $default = null): ?string
{
    return app_env($key, $default);
}

function cms_session_ttl(): int
{
    return app_cms_session_ttl();
}

function cms_admin_user(): string
{
    return app_cms_admin_user();
}

function cms_admin_password(): string
{
    return app_cms_admin_password();
}

function cms_db(): PDO
{
    static $seeded = false;

    try {
        $pdo = app_db();
    } catch (Throwable $e) {
        error_log('[Talaqee CMS] DB error: ' . $e->getMessage());
        cms_error(
            'Koneksi database gagal. Periksa file .env (DB_HOST, DB_USER, DB_PASSWORD). '
            . 'Docker: DB_HOST=host.docker.internal, bukan 127.0.0.1. '
            . 'Tes: /api/cms/public/health.php',
            503,
        );
    }

    if (!$seeded) {
        cms_seed_if_empty($pdo);
        $seeded = true;
    }
    return $pdo;
}

function cms_seed_if_empty(PDO $pdo): void
{
    $table = app_cms_content_table();
    $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
    $count = (int) $stmt->fetchColumn();
    if ($count > 0) {
        return;
    }
    cms_import_default_json($pdo);
}

function cms_import_default_json(?PDO $pdo = null): int
{
    if (!is_file(CMS_DEFAULT_JSON)) {
        cms_error('File default-content.json tidak ditemukan. Jalankan: npm run cms:export', 500);
    }

    $raw = file_get_contents(CMS_DEFAULT_JSON);
    if ($raw === false) {
        cms_error('Gagal membaca default-content.json.', 500);
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        cms_error('default-content.json tidak valid.', 500);
    }

    $pdo ??= cms_db();
    $now = time();
    $imported = 0;

    foreach (CMS_SECTION_KEYS as $key) {
        if (!array_key_exists($key, $data)) {
            continue;
        }
        cms_save_section($key, $data[$key], $pdo, $now);
        $imported++;
    }

    return $imported;
}

function cms_save_section(string $key, mixed $payload, ?PDO $pdo = null, ?int $now = null): void
{
    if (!in_array($key, CMS_SECTION_KEYS, true)) {
        cms_error('Section tidak dikenal: ' . $key, 400);
    }

    if ($key === 'learning' && is_array($payload)) {
        $payload = array_values(array_filter(
            $payload,
            static fn(mixed $category): bool => is_array($category) && ($category['id'] ?? '') !== 'jurnal',
        ));
    }

    $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if ($encoded === false) {
        cms_error('Payload tidak bisa di-encode ke JSON.', 400);
    }

    $pdo ??= cms_db();
    $now ??= time();

    if ($key === 'learning' && is_array($payload)) {
        learning_store_save_learning_list($pdo, $payload, $now);
    } elseif ($key === 'jurnal' && is_array($payload)) {
        learning_store_save_jurnal_category($pdo, $payload, $now);
    }

    app_cms_upsert_section($pdo, $key, $encoded, $now);
}

function cms_get_section(string $key, ?PDO $pdo = null): mixed
{
    if (!in_array($key, CMS_SECTION_KEYS, true)) {
        cms_error('Section tidak dikenal: ' . $key, 400);
    }

    $pdo ??= cms_db();
    $table = app_cms_content_table();
    $stmt = $pdo->prepare("SELECT payload FROM $table WHERE section_key = :key");
    $stmt->execute(['key' => $key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    return json_decode((string) $row['payload'], true);
}

/** @return list<string> */
function cms_learning_category_order(): array
{
    return [
        'talaqqi-fatihah',
        'tajwid',
        'ulumul-quran',
        'tafsir-tahlili',
        'tafsir-tematik',
        'jurnal',
    ];
}

/** Ambil kategori jurnal — section `jurnal`, fallback dari learning (data lama). */
function cms_resolve_jurnal(?PDO $pdo = null): ?array
{
    $pdo ??= cms_db();
    learning_store_import_from_cms_json_if_empty($pdo);
    $fromTables = learning_store_load_jurnal($pdo);
    if ($fromTables !== null) {
        return $fromTables;
    }

    $table = app_cms_content_table();
    $stmt = $pdo->prepare("SELECT payload FROM $table WHERE section_key = 'jurnal'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $jurnal = json_decode((string) $row['payload'], true);
        if (is_array($jurnal) && ($jurnal['id'] ?? '') === 'jurnal') {
            return $jurnal;
        }
    }

    $learning = cms_get_section('learning', $pdo);
    if (!is_array($learning)) {
        return null;
    }

    foreach ($learning as $category) {
        if (is_array($category) && ($category['id'] ?? '') === 'jurnal') {
            return $category;
        }
    }

    return null;
}

/** Gabungkan kategori jurnal ke daftar learning untuk API publik & aplikasi. */
function cms_merge_learning_public(array $learning, ?array $jurnal): array
{
    $byId = [];
    foreach ($learning as $category) {
        if (!is_array($category)) {
            continue;
        }
        $id = (string) ($category['id'] ?? '');
        if ($id === '' || $id === 'jurnal' || $id === 'talaqqi-fatihah') {
            continue;
        }
        $byId[$id] = $category;
    }

    if ($jurnal !== null) {
        $byId['jurnal'] = $jurnal;
    }

    $ordered = [];
    foreach (cms_learning_category_order() as $id) {
        if (isset($byId[$id])) {
            $ordered[] = $byId[$id];
            unset($byId[$id]);
        }
    }

    foreach ($byId as $category) {
        $ordered[] = $category;
    }

    return $ordered;
}

/** Materi kajian publik — artikel dari tabel learning_articles per category_id. */
function cms_public_learning_materi(?PDO $pdo = null): array
{
    $pdo ??= cms_db();
    learning_store_import_from_cms_json_if_empty($pdo);

    if (!learning_store_has_data($pdo)) {
        return [];
    }

    return learning_store_load_learning($pdo, true);
}

/** Payload artikel satu kategori — dari learning_articles WHERE category_id. */
function cms_public_learning_category_payload(string $categoryId, ?PDO $pdo = null): array
{
    $pdo ??= cms_db();
    learning_store_import_from_cms_json_if_empty($pdo);

    if ($categoryId === '' || $categoryId === 'talaqqi-fatihah') {
        return ['ok' => false, 'error' => 'Kategori tidak valid.'];
    }

    $stmt = $pdo->prepare('SELECT * FROM learning_categories WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $categoryId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return ['ok' => false, 'error' => 'Kategori tidak ditemukan.'];
    }

    $articles = learning_store_load_articles_for_category($pdo, $categoryId);

    return [
        'ok' => true,
        'source' => 'mysql',
        'categoryId' => $categoryId,
        'articles' => $articles,
        'articleCount' => count($articles),
        'updatedAt' => learning_store_learning_updated_at($pdo),
    ];
}

/** Payload pembelajaran untuk aplikasi (Android) — tabel relasional + jurnal terpisah. */
function cms_public_learning_payload(?PDO $pdo = null): array
{
    $pdo ??= cms_db();
    learning_store_import_from_cms_json_if_empty($pdo);

    $categories = cms_public_learning_materi($pdo);
    $jurnal = learning_store_load_jurnal($pdo);
    $updatedAt = learning_store_learning_updated_at($pdo);
    $articleCounts = learning_store_article_counts_by_category($pdo, ['talaqqi-fatihah']);

    return [
        'ok' => true,
        'source' => 'mysql',
        'categories' => $categories,
        'jurnal' => $jurnal,
        'articleCounts' => $articleCounts,
        'updatedAt' => $updatedAt,
    ];
}

function cms_get_all_public(): array
{
    $pdo = cms_db();
    $table = app_cms_content_table();
    $out = ['ok' => true, 'version' => 1, 'updatedAt' => 0];

    foreach (CMS_SECTION_KEYS as $key) {
        if ($key === 'jurnal') {
            continue;
        }
        $stmt = $pdo->prepare("SELECT payload, updated_at FROM $table WHERE section_key = :key");
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            continue;
        }
        $out[$key] = json_decode((string) $row['payload'], true);
        $updated = (int) $row['updated_at'];
        if ($updated > $out['updatedAt']) {
            $out['updatedAt'] = $updated;
        }
    }

    learning_store_import_from_cms_json_if_empty($pdo);
    if (learning_store_has_data($pdo)) {
        $out['learning'] = cms_merge_learning_public(
            learning_store_load_learning($pdo, true),
            learning_store_load_jurnal($pdo),
        );
        $tableUpdated = learning_store_learning_updated_at($pdo);
        if ($tableUpdated > $out['updatedAt']) {
            $out['updatedAt'] = $tableUpdated;
        }
    }

    $jurnal = cms_resolve_jurnal($pdo);
    if ($jurnal !== null && !learning_store_has_data($pdo)) {
        $out['jurnal'] = $jurnal;
        if (isset($out['learning']) && is_array($out['learning'])) {
            $out['learning'] = cms_merge_learning_public($out['learning'], $jurnal);
        }
        $stmt = $pdo->prepare("SELECT updated_at FROM $table WHERE section_key = 'jurnal'");
        $stmt->execute();
        $jRow = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($jRow) {
            $updated = (int) $jRow['updated_at'];
            if ($updated > $out['updatedAt']) {
                $out['updatedAt'] = $updated;
            }
        }
    }

    return $out;
}

function cms_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        cms_error('Body JSON tidak valid.', 400);
    }
    return $data;
}

function cms_new_token(): string
{
    return bin2hex(random_bytes(32));
}

function cms_create_session(): string
{
    $pdo = cms_db();
    $table = app_cms_sessions_table();
    $token = cms_new_token();
    $now = time();
    $expires = $now + cms_session_ttl();

    $stmt = $pdo->prepare(
        "INSERT INTO $table (token, expires_at, created_at) VALUES (:token, :expires, :created)",
    );
    $stmt->execute([
        'token' => $token,
        'expires' => $expires,
        'created' => $now,
    ]);

    return $token;
}

function cms_delete_session(string $token): void
{
    $pdo = cms_db();
    $table = app_cms_sessions_table();
    $stmt = $pdo->prepare("DELETE FROM $table WHERE token = :token");
    $stmt->execute(['token' => $token]);
}

function cms_purge_expired_sessions(): void
{
    $pdo = cms_db();
    $table = app_cms_sessions_table();
    $pdo->prepare("DELETE FROM $table WHERE expires_at < :now")
        ->execute(['now' => time()]);
}

function cms_bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
        return $m[1];
    }
    return null;
}

function cms_require_auth(): string
{
    cms_purge_expired_sessions();
    $token = cms_bearer_token();
    if ($token === null || $token === '') {
        cms_error('Token admin diperlukan.', 401);
    }

    $pdo = cms_db();
    $table = app_cms_sessions_table();
    $stmt = $pdo->prepare("SELECT expires_at FROM $table WHERE token = :token");
    $stmt->execute(['token' => $token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || (int) $row['expires_at'] < time()) {
        cms_error('Sesi admin tidak valid atau kedaluwarsa.', 401);
    }

    return $token;
}

function cms_verify_login(string $username, string $password): bool
{
    return hash_equals(cms_admin_user(), $username)
        && hash_equals(cms_admin_password(), $password);
}

/** @param list<mixed> $articles
 * @return list<array{id: string, priceIdr: int, coinPrice?: int}> */
function cms_paid_catalog_from_articles(array $articles): array
{
    $catalog = [];
    foreach ($articles as $article) {
        if (!is_array($article)) {
            continue;
        }
        $id = (string) ($article['id'] ?? '');
        $price = (int) ($article['priceIdr'] ?? 0);
        $coinPrice = (int) ($article['coinPrice'] ?? 0);
        if ($id === '' || $price <= 0) {
            continue;
        }
        $entry = ['id' => $id, 'priceIdr' => $price];
        if ($coinPrice > 0) {
            $entry['coinPrice'] = $coinPrice;
        }
        $catalog[] = $entry;
    }

    return $catalog;
}

/** Materi Ulumul berbayar — dari section CMS learning atau default-content.json */
function cms_ulumul_paid_catalog_fallback(?PDO $pdo = null): array
{
    try {
        $pdo ??= cms_db();
        $learning = cms_get_section('learning', $pdo);
        if (is_array($learning)) {
            foreach ($learning as $category) {
                if (!is_array($category) || ($category['id'] ?? '') !== 'ulumul-quran') {
                    continue;
                }
                $fromSection = cms_paid_catalog_from_articles((array) ($category['articles'] ?? []));
                if ($fromSection !== []) {
                    return $fromSection;
                }
            }
        }
    } catch (Throwable) {
        // fallback ke file default
    }

    $defaultPath = __DIR__ . '/data/default-content.json';
    if (!is_file($defaultPath)) {
        return [];
    }

    $decoded = json_decode((string) file_get_contents($defaultPath), true);
    if (!is_array($decoded)) {
        return [];
    }

    $learning = $decoded['learning'] ?? null;
    if (!is_array($learning)) {
        return [];
    }

    foreach ($learning as $category) {
        if (!is_array($category) || ($category['id'] ?? '') !== 'ulumul-quran') {
            continue;
        }

        return cms_paid_catalog_from_articles((array) ($category['articles'] ?? []));
    }

    return [];
}

/** Katalog jurnal untuk langganan — baca dari CMS section jurnal */
function cms_journal_catalog(): array
{
    $category = cms_resolve_jurnal();
    if (!is_array($category)) {
        return [];
    }

    return cms_paid_catalog_from_articles((array) ($category['articles'] ?? []));
}

/** Katalog materi kajian berbayar (Ulumul Qur'an, dll.) — DB + fallback JSON */
function cms_paid_learning_catalog(): array
{
    $byId = [];
    foreach (cms_ulumul_paid_catalog_fallback() as $item) {
        $byId[$item['id']] = $item;
    }

    try {
        $pdo = cms_db();
        learning_store_import_from_cms_json_if_empty($pdo);

        foreach (['ulumul-quran'] as $categoryId) {
            $articles = learning_store_load_articles_for_category($pdo, $categoryId);
            foreach (cms_paid_catalog_from_articles($articles) as $item) {
                $byId[$item['id']] = $item;
            }
        }
    } catch (Throwable) {
        // fallback JSON sudah di $byId
    }

    return array_values($byId);
}

/** Gabungan katalog jurnal + materi kajian berbayar */
function cms_paid_content_catalog(): array
{
    $byId = [];
    foreach (array_merge(cms_journal_catalog(), cms_paid_learning_catalog()) as $item) {
        $byId[$item['id']] = $item;
    }

    return array_values($byId);
}
