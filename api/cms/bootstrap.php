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
    'ulumul',
    'hadithCategories',
    'hadiths',
    'fiqhCategories',
    'fiqhItems',
    'sirahCategories',
    'sirahItems',
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

/** Cache browser/CDN untuk API publik CMS (kurangi muatan di hosting). */
function cms_maybe_send_public_cache(int $updatedAt): void
{
    if ($updatedAt <= 0) {
        return;
    }

    $etag = 'W/"cms-' . dechex($updatedAt) . '"';
    header('ETag: ' . $etag);
    header('Cache-Control: public, max-age=120, stale-while-revalidate=600');

    $ifNoneMatch = trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));
    if ($ifNoneMatch === $etag || $ifNoneMatch === trim($etag, 'W/')) {
        http_response_code(304);
        exit;
    }
}

function cms_json_public(mixed $data, int $code = 200): void
{
    $updatedAt = 0;
    if (is_array($data)) {
        $updatedAt = (int) ($data['updatedAt'] ?? 0);
    }
    cms_maybe_send_public_cache($updatedAt);
    cms_json($data, $code);
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
        cms_error(app_db_connection_error_message($e), 503);
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
            static fn(mixed $category): bool => is_array($category)
                && !in_array((string) ($category['id'] ?? ''), ['jurnal', 'ulumul-quran'], true),
        ));
    }

    $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if ($encoded === false) {
        cms_error('Payload tidak bisa di-encode ke JSON.', 400);
    }

    $pdo ??= cms_db();
    $now ??= time();

    if ($key === 'jurnal' && is_array($payload)) {
        learning_store_save_jurnal_category($pdo, $payload, $now);
    } elseif ($key === 'ulumul' && is_array($payload)) {
        learning_store_save_ulumul_category($pdo, $payload, $now);
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
        'jurnal',
        'ulumul-quran',
        'tajwid',
        'talaqqi-fatihah',
        'tafsir-tahlili',
        'tafsir-tematik',
    ];
}

/** @param list<array<string, mixed>> $categories */
function cms_sort_learning_categories(array $categories): array
{
    $rank = array_flip(cms_learning_category_order());
    usort(
        $categories,
        static function (array $a, array $b) use ($rank): int {
            $ai = $rank[(string) ($a['id'] ?? '')] ?? 999;
            $bi = $rank[(string) ($b['id'] ?? '')] ?? 999;

            return $ai <=> $bi;
        },
    );

    return $categories;
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

/**
 * Gabungkan coin_price / priceIdr dari section CMS `ulumul` ke artikel dari tabel
 * (production sering punya baris DB tanpa coin_price terisi).
 *
 * @param array<string, mixed> $category
 * @return array<string, mixed>
 */
function cms_merge_paid_category_from_cms_section(PDO $pdo, string $sectionKey, array $category): array
{
    try {
        $section = cms_get_section($sectionKey, $pdo);
    } catch (Throwable) {
        return $category;
    }

    if (!is_array($section)) {
        return $category;
    }

    $byId = [];
    foreach ((array) ($section['articles'] ?? []) as $src) {
        if (!is_array($src)) {
            continue;
        }
        $id = (string) ($src['id'] ?? '');
        if ($id !== '') {
            $byId[$id] = $src;
        }
    }

    $merged = [];
    foreach ((array) ($category['articles'] ?? []) as $article) {
        if (!is_array($article)) {
            continue;
        }
        $id = (string) ($article['id'] ?? '');
        $src = $id !== '' ? ($byId[$id] ?? null) : null;
        if ($src !== null) {
            if ((int) ($article['coinPrice'] ?? 0) <= 0 && (int) ($src['coinPrice'] ?? 0) > 0) {
                $article['coinPrice'] = (int) $src['coinPrice'];
            }
            if ((int) ($article['priceIdr'] ?? 0) <= 0 && (int) ($src['priceIdr'] ?? 0) > 0) {
                $article['priceIdr'] = (int) $src['priceIdr'];
            }
        }
        $merged[] = $article;
    }

    $category['articles'] = $merged;

    return $category;
}

/** Ambil kategori Ulumul Qur'an — section `ulumul`, fallback dari learning (data lama). */
function cms_resolve_ulumul(?PDO $pdo = null): ?array
{
    $pdo ??= cms_db();
    learning_store_import_from_cms_json_if_empty($pdo);
    $fromTables = learning_store_load_ulumul($pdo);
    if ($fromTables !== null) {
        return cms_merge_paid_category_from_cms_section($pdo, 'ulumul', $fromTables);
    }

    $table = app_cms_content_table();
    $stmt = $pdo->prepare("SELECT payload FROM $table WHERE section_key = 'ulumul'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $ulumul = json_decode((string) $row['payload'], true);
        if (is_array($ulumul) && ($ulumul['id'] ?? '') === 'ulumul-quran') {
            return $ulumul;
        }
    }

    $learning = cms_get_section('learning', $pdo);
    if (!is_array($learning)) {
        return null;
    }

    foreach ($learning as $category) {
        if (is_array($category) && ($category['id'] ?? '') === 'ulumul-quran') {
            return $category;
        }
    }

    return null;
}

/** Gabungkan kategori berbayar (jurnal, Ulumul) ke daftar learning untuk API publik & aplikasi. */
function cms_merge_learning_public(array $learning, ?array $jurnal, ?array $ulumul = null): array
{
    $byId = [];
    foreach ($learning as $category) {
        if (!is_array($category)) {
            continue;
        }
        $id = (string) ($category['id'] ?? '');
        if ($id === '' || $id === 'jurnal' || $id === 'ulumul-quran' || $id === 'talaqqi-fatihah') {
            continue;
        }
        $byId[$id] = $category;
    }

    if ($jurnal !== null) {
        $byId['jurnal'] = $jurnal;
    }
    if ($ulumul !== null && ($ulumul['id'] ?? '') === 'ulumul-quran') {
        $byId['ulumul-quran'] = $ulumul;
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

/**
 * Materi kajian publik — kategori + artikel dari section CMS `learning` (JSON).
 *
 * @param bool $syncKajianRows Sinkron ke learning_articles (hanya admin/save — jangan di request app).
 */
function cms_public_learning_materi(?PDO $pdo = null, bool $syncKajianRows = false): array
{
    $pdo ??= cms_db();
    $learning = cms_get_section('learning', $pdo);
    if (!is_array($learning)) {
        return [];
    }

    $categories = [];
    foreach ($learning as $category) {
        if (!is_array($category)) {
            continue;
        }
        $id = (string) ($category['id'] ?? '');
        if ($id === '' || in_array($id, ['jurnal', 'ulumul-quran'], true)) {
            continue;
        }
        $articles = is_array($category['articles'] ?? null) ? $category['articles'] : [];
        if ($syncKajianRows && in_array($id, cms_kajian_coin_category_ids(), true)) {
            $sort = 0;
            $now = time();
            foreach ($articles as $article) {
                if (is_array($article)) {
                    learning_store_ensure_kajian_article_row($pdo, $id, $article, $sort++, $now, $category);
                }
            }
        }
        if (in_array($id, cms_kajian_coin_category_ids(), true)) {
            $articles = learning_store_apply_table_coin_prices($pdo, $articles, $id);
            $articles = learning_store_apply_table_cover_images($pdo, $articles, $id);
        }
        $category['articles'] = cms_public_articles_for_list($articles);
        $categories[] = $category;
    }

    if ($categories !== []) {
        return cms_sort_learning_categories($categories);
    }

    learning_store_import_from_cms_json_if_empty($pdo);
    if (learning_store_has_data($pdo)) {
        return learning_store_load_learning($pdo, true);
    }

    return [];
}

/** @param list<mixed>|null $articles */
function cms_public_articles_for_list(?array $articles): array
{
    if (!is_array($articles)) {
        return [];
    }

    return learning_store_articles_for_list(
        array_values(array_filter($articles, static fn (mixed $a): bool => is_array($a))),
    );
}

/** @param array<string, mixed>|null $category */
function cms_public_category_for_list(?array $category): ?array
{
    if (!is_array($category)) {
        return null;
    }
    $articles = $category['articles'] ?? null;
    if (is_array($articles)) {
        $category['articles'] = cms_public_articles_for_list($articles);
    }

    return $category;
}

/** Detail satu artikel (isi penuh + bab) — untuk lazy-load setelah tap dari daftar. */
function cms_public_learning_article_detail_payload(
    string $categoryId,
    string $articleId,
    ?PDO $pdo = null,
): array {
    $pdo ??= cms_db();
    learning_store_import_from_cms_json_if_empty($pdo);

    $categoryId = trim($categoryId);
    $articleId = trim($articleId);
    if ($articleId === '') {
        return ['ok' => false, 'error' => 'ID artikel tidak valid.'];
    }

    $fromDb = learning_store_load_article_detail_by_id($pdo, $articleId);
    if ($fromDb !== null) {
        $resolvedCategoryId = $categoryId;
        if ($resolvedCategoryId === '' && app_table_exists($pdo, 'learning_articles')) {
            $catStmt = $pdo->prepare(
                'SELECT category_id FROM learning_articles WHERE id = :id LIMIT 1',
            );
            $catStmt->execute(['id' => $articleId]);
            $resolvedCategoryId = (string) ($catStmt->fetchColumn() ?: '');
        }

        return [
            'ok' => true,
            'source' => 'mysql',
            'categoryId' => $resolvedCategoryId,
            'article' => $fromDb,
            'updatedAt' => learning_store_learning_updated_at($pdo),
        ];
    }

    $found = learning_store_find_article_in_cms_sources($articleId);
    if ($found !== null) {
        return [
            'ok' => true,
            'source' => 'cms',
            'categoryId' => $found['categoryId'],
            'article' => $found['article'],
            'updatedAt' => max(
                cms_section_updated_at($pdo, 'learning'),
                cms_section_updated_at($pdo, 'ulumul'),
                cms_section_updated_at($pdo, 'jurnal'),
            ),
        ];
    }

    return ['ok' => false, 'error' => 'Artikel tidak ditemukan.'];
}

function cms_section_updated_at(PDO $pdo, string $sectionKey): int
{
    $table = app_cms_content_table();
    $stmt = $pdo->prepare("SELECT updated_at FROM $table WHERE section_key = :key LIMIT 1");
    $stmt->execute(['key' => $sectionKey]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ? (int) $row['updated_at'] : 0;
}

/** Payload artikel satu kategori — kajian dari JSON; jurnal/Ulumul dari tabel. */
function cms_public_learning_category_payload(string $categoryId, ?PDO $pdo = null): array
{
    $pdo ??= cms_db();
    learning_store_import_from_cms_json_if_empty($pdo);

    if ($categoryId === '') {
        return ['ok' => false, 'error' => 'Kategori tidak valid.'];
    }

    if ($categoryId === 'jurnal') {
        $jurnal = cms_resolve_jurnal($pdo);
        if ($jurnal === null) {
            return ['ok' => false, 'error' => 'Kategori tidak ditemukan.'];
        }
        $articles = cms_public_articles_for_list(
            is_array($jurnal['articles'] ?? null) ? $jurnal['articles'] : null,
        );

        return [
            'ok' => true,
            'source' => 'mysql',
            'categoryId' => $categoryId,
            'articles' => $articles,
            'articleCount' => count($articles),
            'updatedAt' => learning_store_learning_updated_at($pdo),
        ];
    }

    if ($categoryId === 'ulumul-quran') {
        $ulumul = cms_resolve_ulumul($pdo);
        if ($ulumul === null) {
            return ['ok' => false, 'error' => 'Kategori tidak ditemukan.'];
        }
        $articles = cms_public_articles_for_list(
            is_array($ulumul['articles'] ?? null) ? $ulumul['articles'] : null,
        );

        return [
            'ok' => true,
            'source' => 'mysql',
            'categoryId' => $categoryId,
            'articles' => $articles,
            'articleCount' => count($articles),
            'updatedAt' => learning_store_learning_updated_at($pdo),
        ];
    }

    foreach (cms_public_learning_materi($pdo) as $category) {
        if ((string) ($category['id'] ?? '') !== $categoryId) {
            continue;
        }
        $articles = is_array($category['articles'] ?? null) ? $category['articles'] : [];
        if (in_array($categoryId, cms_kajian_coin_category_ids(), true)) {
            $articles = learning_store_apply_table_coin_prices($pdo, $articles, $categoryId);
            $articles = learning_store_apply_table_cover_images($pdo, $articles, $categoryId);
        }

        return [
            'ok' => true,
            'source' => 'cms_content',
            'categoryId' => $categoryId,
            'articles' => cms_public_articles_for_list($articles),
            'articleCount' => count($articles),
            'updatedAt' => cms_section_updated_at($pdo, 'learning'),
        ];
    }

    if (learning_store_has_data($pdo)) {
        $stmt = $pdo->prepare('SELECT 1 FROM learning_categories WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $categoryId]);
        if ($stmt->fetchColumn()) {
            $articles = learning_store_load_articles_for_category($pdo, $categoryId, true);

            return [
                'ok' => true,
                'source' => 'mysql',
                'categoryId' => $categoryId,
                'articles' => $articles,
                'articleCount' => count($articles),
                'updatedAt' => learning_store_learning_updated_at($pdo),
            ];
        }
    }

    return ['ok' => false, 'error' => 'Kategori tidak ditemukan.'];
}

/** Payload pembelajaran untuk aplikasi — kajian dari JSON, jurnal/Ulumul dari tabel. */
function cms_public_learning_payload(?PDO $pdo = null): array
{
    $pdo ??= cms_db();
    learning_store_import_from_cms_json_if_empty($pdo);

    $categories = cms_public_learning_materi($pdo);
    $jurnal = learning_store_load_jurnal($pdo);
    $ulumul = learning_store_load_ulumul($pdo);
    $updatedAt = max(
        cms_section_updated_at($pdo, 'learning'),
        learning_store_learning_updated_at($pdo),
    );

    $articleCounts = ['talaqqi-fatihah' => 0];
    foreach ($categories as $category) {
        if (!is_array($category)) {
            continue;
        }
        $id = (string) ($category['id'] ?? '');
        if ($id === '') {
            continue;
        }
        $articles = $category['articles'] ?? [];
        $articleCounts[$id] = is_array($articles) ? count($articles) : 0;
    }
    if ($jurnal !== null) {
        $ja = $jurnal['articles'] ?? [];
        $articleCounts['jurnal'] = is_array($ja) ? count($ja) : 0;
    }
    if ($ulumul !== null) {
        $ua = $ulumul['articles'] ?? [];
        $articleCounts['ulumul-quran'] = is_array($ua) ? count($ua) : 0;
    }

    if ($jurnal !== null) {
        $jurnal = cms_public_category_for_list($jurnal);
    }
    if ($ulumul !== null) {
        $ulumul = cms_public_category_for_list($ulumul);
    }

    return [
        'ok' => true,
        'source' => 'cms_content',
        'categories' => cms_merge_learning_public($categories, $jurnal, $ulumul),
        'jurnal' => $jurnal,
        'ulumul' => $ulumul,
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
        if ($key === 'jurnal' || $key === 'ulumul') {
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

    // Materi jurnal/Ulumul/kajian — dimuat lewat GET /api/cms/public/learning.php (hindari duplikasi & query berat).
    $out['learningMateriEndpoint'] = '/api/cms/public/learning.php';
    $out['learning'] = null;
    $out['jurnal'] = null;
    $out['ulumul'] = null;

    $mergedUpdated = max(
        $out['updatedAt'],
        cms_section_updated_at($pdo, 'learning'),
        learning_store_learning_updated_at($pdo),
    );
    $out['updatedAt'] = $mergedUpdated;

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

/** Batasi percobaan login CMS per IP (brute force). */
function cms_enforce_login_rate_limit(): void
{
    if (app_is_local_request() || !app_is_production()) {
        return;
    }

    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $dir = sys_get_temp_dir() . '/talaqee_cms_login';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $file = $dir . '/' . hash('sha256', $ip) . '.json';
    $now = time();
    $window = 900;
    $maxAttempts = 8;
    $data = ['attempts' => [], 'blocked_until' => 0];
    if (is_file($file)) {
        $decoded = json_decode((string) file_get_contents($file), true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }
    if ((int) ($data['blocked_until'] ?? 0) > $now) {
        cms_error('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.', 429);
    }
    $attempts = array_values(array_filter(
        (array) ($data['attempts'] ?? []),
        static fn ($t) => is_int($t) && $t > $now - $window,
    ));
    if (count($attempts) >= $maxAttempts) {
        $data['blocked_until'] = $now + $window;
        $data['attempts'] = $attempts;
        file_put_contents($file, json_encode($data), LOCK_EX);
        cms_error('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.', 429);
    }
    $attempts[] = $now;
    $data['attempts'] = $attempts;
    $data['blocked_until'] = 0;
    file_put_contents($file, json_encode($data), LOCK_EX);
}

function cms_clear_login_rate_limit(): void
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $file = sys_get_temp_dir() . '/talaqee_cms_login/' . hash('sha256', $ip) . '.json';
    if (is_file($file)) {
        @unlink($file);
    }
}

/** @param list<mixed> $articles
 * @return list<array{id: string, priceIdr: int, coinPrice: int}> */
function cms_paid_catalog_from_articles(array $articles): array
{
    $catalog = [];
    foreach ($articles as $article) {
        if (!is_array($article)) {
            continue;
        }
        $id = (string) ($article['id'] ?? '');
        if ($id === '') {
            continue;
        }

        $coinPrice = (int) ($article['coinPrice'] ?? 0);
        $priceIdr = (int) ($article['priceIdr'] ?? 0);
        if ($coinPrice <= 0 && $priceIdr > 0) {
            $coinPrice = max(5, (int) round($priceIdr / 2000));
        }
        if ($coinPrice <= 0 && $priceIdr <= 0) {
            continue;
        }

        $entry = [
            'id' => $id,
            'priceIdr' => $priceIdr > 0 ? $priceIdr : ($coinPrice > 0 ? $coinPrice * 2000 : 0),
        ];
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

/** Kategori materi kajian berbayar coin (Tajwid, Tafsir). */
function cms_kajian_coin_category_ids(): array
{
    return ['tajwid', 'tafsir-tahlili', 'tafsir-tematik'];
}

/** Katalog artikel Tajwid & Tafsir — hanya yang coin_price > 0 di learning_articles. */
function cms_paid_kajian_catalog_from_learning(?PDO $pdo = null): array
{
    try {
        $pdo ??= cms_db();
        if (!app_table_exists($pdo, 'learning_articles')) {
            return [];
        }

        $ids = cms_kajian_coin_category_ids();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare(
            "SELECT id, coin_price FROM learning_articles
             WHERE category_id IN ($placeholders)
               AND coin_price IS NOT NULL AND coin_price > 0",
        );
        $stmt->execute($ids);

        $catalog = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $coinPrice = (int) ($row['coin_price'] ?? 0);
            if ($coinPrice <= 0) {
                continue;
            }
            $catalog[] = [
                'id' => (string) ($row['id'] ?? ''),
                'priceIdr' => $coinPrice * 2000,
                'coinPrice' => $coinPrice,
            ];
        }

        return $catalog;
    } catch (Throwable) {
        return [];
    }
}

/** Katalog materi kajian berbayar (Ulumul Qur'an, dll.) — DB + fallback JSON */
function cms_paid_learning_catalog(): array
{
    $byId = [];

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
        return [];
    }

    return array_values($byId);
}

/** Gabungan katalog jurnal + materi kajian berbayar */
function cms_paid_content_catalog(): array
{
    $byId = [];
    foreach (array_merge(
        cms_journal_catalog(),
        cms_paid_learning_catalog(),
        cms_paid_kajian_catalog_from_learning(),
    ) as $item) {
        $byId[$item['id']] = $item;
    }

    return array_values($byId);
}
