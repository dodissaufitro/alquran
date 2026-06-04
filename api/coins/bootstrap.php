<?php
declare(strict_types=1);

require_once __DIR__ . '/../subscription/bootstrap.php';
require_once __DIR__ . '/../learning-store.php';
require_once __DIR__ . '/schema.php';

function coins_period_seconds(): int
{
    return app_coins_period_seconds();
}

function coins_recording_cost(): int
{
    $raw = subscription_env('COIN_RECORDING_COST', '5');
    $cost = (int) $raw;
    return $cost > 0 ? $cost : 5;
}

function coins_authenticated_email(?string $bodyEmail = null, ?string $bodyApiToken = null): string
{
    return subscription_authenticated_email($bodyEmail, $bodyApiToken);
}

/** @return list<array{id:string,coins:int,baseCoins:int,bonusCoins?:int,bonusPercent?:int,priceIdr:int,label:string,badge?:string,starterPack?:bool}> */
function coins_packages(): array
{
    try {
        $pdo = subscription_db();
        if (!app_table_exists($pdo, 'coin_packages')) {
            return coins_packages_fallback_defaults();
        }

        $stmt = $pdo->query(
            'SELECT * FROM coin_packages WHERE is_active = 1 ORDER BY sort_order ASC, id ASC',
        );
        $packages = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $packages[] = coins_package_row_to_array($row);
        }

        return $packages !== [] ? $packages : coins_packages_fallback_defaults();
    } catch (Throwable) {
        return coins_packages_fallback_defaults();
    }
}

/** @return list<array<string, mixed>> */
function coins_packages_fallback_defaults(): array
{
    $out = [];
    foreach (coins_default_packages_seed() as $pkg) {
        $base = (int) ($pkg['baseCoins'] ?? 0);
        $bonus = (int) ($pkg['bonusCoins'] ?? 0);
        $row = [
            'id' => (string) $pkg['id'],
            'baseCoins' => $base,
            'bonusCoins' => $bonus,
            'coins' => $base + $bonus,
            'priceIdr' => (int) $pkg['priceIdr'],
            'label' => (string) $pkg['label'],
        ];
        if (isset($pkg['bonusPercent'])) {
            $row['bonusPercent'] = (int) $pkg['bonusPercent'];
        }
        if (!empty($pkg['badge'])) {
            $row['badge'] = (string) $pkg['badge'];
        }
        if (!empty($pkg['starterPack'])) {
            $row['starterPack'] = true;
        }
        $out[] = $row;
    }

    return $out;
}

function coins_package_by_id(string $packageId): array
{
    foreach (coins_packages() as $pkg) {
        if ($pkg['id'] === $packageId) {
            return $pkg;
        }
    }
    coins_error('Paket coin tidak ditemukan.', 404);
}

function coins_error(string $message, int $code = 400): void
{
    subscription_error($message, $code);
}

function coins_purchase_id_max_len(): int
{
    return 128;
}

function coins_purchase_id_fits(string $purchaseId): bool
{
    return strlen(trim($purchaseId)) > 0 && strlen($purchaseId) <= coins_purchase_id_max_len();
}

function coins_validate_purchase_id(string $purchaseId): void
{
    $purchaseId = trim($purchaseId);
    if ($purchaseId === '') {
        coins_error('ID materi tidak valid.', 400);
    }
    if (!coins_purchase_id_fits($purchaseId)) {
        coins_error(
            'ID materi terlalu panjang untuk disimpan. Hubungi admin atau coba dari perangkat lain.',
            400,
        );
    }
}

function coins_chapter_purchase_id(string $articleId, string $chapterId): string
{
    return $articleId . '/' . $chapterId;
}

/** @return array{articleId: string, chapterId: string|null} */
function coins_parse_purchase_id(string $purchaseId): array
{
    $purchaseId = trim($purchaseId);
    $pos = strpos($purchaseId, '/');
    if ($pos === false || $pos <= 0) {
        return ['articleId' => $purchaseId, 'chapterId' => null];
    }

    return [
        'articleId' => substr($purchaseId, 0, $pos),
        'chapterId' => substr($purchaseId, $pos + 1) ?: null,
    ];
}

/** @param array<string, mixed> $article */
function coins_coin_from_article_payload(array $article, int $priceIdr = 0): ?int
{
    $explicit = (int) ($article['coinPrice'] ?? 0);
    if ($explicit > 0) {
        return $explicit;
    }
    $idr = (int) ($article['priceIdr'] ?? $priceIdr);
    if ($idr > 0) {
        return max(5, (int) round($idr / 2000));
    }

    return null;
}

/** @param list<mixed>|null $articles */
function coins_lookup_coin_in_articles(?array $articles, string $articleId, int $priceIdr = 0): ?int
{
    if (!is_array($articles)) {
        return null;
    }
    foreach ($articles as $article) {
        if (!is_array($article) || (string) ($article['id'] ?? '') !== $articleId) {
            continue;
        }

        return coins_coin_from_article_payload($article, $priceIdr);
    }

    return null;
}

/** Harga coin artikel dari semua sumber CMS (section JSON, tabel, katalog, default). */
function coins_lookup_cms_article_coin_price(string $articleId, int $priceIdr = 0): ?int
{
    $articleId = trim($articleId);
    if ($articleId === '') {
        return null;
    }

    $cmsBootstrap = __DIR__ . '/../cms/bootstrap.php';
    if (!is_file($cmsBootstrap)) {
        return null;
    }
    require_once $cmsBootstrap;

    try {
        $pdo = cms_db();
        foreach (['ulumul', 'jurnal'] as $sectionKey) {
            $payload = cms_get_section($sectionKey, $pdo);
            if (!is_array($payload)) {
                continue;
            }
            $fromSection = coins_lookup_coin_in_articles(
                is_array($payload['articles'] ?? null) ? $payload['articles'] : null,
                $articleId,
                $priceIdr,
            );
            if ($fromSection !== null && $fromSection > 0) {
                return $fromSection;
            }
        }

        $ulumul = cms_resolve_ulumul($pdo);
        $fromUlumul = coins_lookup_coin_in_articles(
            is_array($ulumul) ? ($ulumul['articles'] ?? null) : null,
            $articleId,
            $priceIdr,
        );
        if ($fromUlumul !== null && $fromUlumul > 0) {
            return $fromUlumul;
        }

        $jurnal = cms_resolve_jurnal($pdo);
        $fromJurnal = coins_lookup_coin_in_articles(
            is_array($jurnal) ? ($jurnal['articles'] ?? null) : null,
            $articleId,
            $priceIdr,
        );
        if ($fromJurnal !== null && $fromJurnal > 0) {
            return $fromJurnal;
        }

        learning_store_import_from_cms_json_if_empty($pdo);
        $fromTable = coins_lookup_coin_in_articles(
            learning_store_load_articles_for_category($pdo, 'ulumul-quran'),
            $articleId,
            $priceIdr,
        );
        if ($fromTable !== null && $fromTable > 0) {
            return $fromTable;
        }
        $fromJurnalTable = coins_lookup_coin_in_articles(
            learning_store_load_articles_for_category($pdo, 'jurnal'),
            $articleId,
            $priceIdr,
        );
        if ($fromJurnalTable !== null && $fromJurnalTable > 0) {
            return $fromJurnalTable;
        }
    } catch (Throwable) {
        /* fallback file / learning section */
    }

    $learning = cms_get_section('learning');
    if (is_array($learning)) {
        foreach ($learning as $category) {
            if (!is_array($category)) {
                continue;
            }
            $fromCat = coins_lookup_coin_in_articles(
                is_array($category['articles'] ?? null) ? $category['articles'] : null,
                $articleId,
                $priceIdr,
            );
            if ($fromCat !== null && $fromCat > 0) {
                return $fromCat;
            }
        }
    }

    foreach (cms_paid_learning_catalog() as $item) {
        if ($item['id'] === $articleId && (int) ($item['coinPrice'] ?? 0) > 0) {
            return (int) $item['coinPrice'];
        }
    }

    foreach (cms_ulumul_paid_catalog_fallback() as $item) {
        if ($item['id'] === $articleId && (int) ($item['coinPrice'] ?? 0) > 0) {
            return (int) $item['coinPrice'];
        }
    }

    foreach (cms_paid_kajian_catalog_from_learning() as $item) {
        if ($item['id'] === $articleId && (int) ($item['coinPrice'] ?? 0) > 0) {
            return (int) $item['coinPrice'];
        }
    }

    if (is_file(CMS_DEFAULT_JSON)) {
        $decoded = json_decode((string) file_get_contents(CMS_DEFAULT_JSON), true);
        if (is_array($decoded)) {
            foreach (['learning', null] as $key) {
                $sections = $key === null
                    ? (is_array($decoded['ulumul'] ?? null) ? [$decoded['ulumul']] : [])
                    : (is_array($decoded[$key] ?? null) ? $decoded[$key] : []);
                if (!is_array($sections)) {
                    continue;
                }
                foreach ($sections as $category) {
                    if (!is_array($category)) {
                        continue;
                    }
                    $fromDefault = coins_lookup_coin_in_articles(
                        is_array($category['articles'] ?? null) ? $category['articles'] : null,
                        $articleId,
                        $priceIdr,
                    );
                    if ($fromDefault !== null && $fromDefault > 0) {
                        return $fromDefault;
                    }
                }
            }
            if (is_array($decoded['jurnal'] ?? null)) {
                $fromJurnalDefault = coins_lookup_coin_in_articles(
                    is_array($decoded['jurnal']['articles'] ?? null) ? $decoded['jurnal']['articles'] : null,
                    $articleId,
                    $priceIdr,
                );
                if ($fromJurnalDefault !== null && $fromJurnalDefault > 0) {
                    return $fromJurnalDefault;
                }
            }
        }
    }

    return null;
}

/** @param array<string, mixed> $row */
function coins_price_from_learning_article_row(array $row, string $articleId): ?int
{
    $categoryId = (string) ($row['category_id'] ?? '');
    $coin = (int) ($row['coin_price'] ?? 0);
    if ($coin > 0) {
        return $coin;
    }
    if (learning_store_is_kajian_coin_category($categoryId)) {
        $chCount = 0;
        try {
            $pdo = subscription_db();
            if (app_table_exists($pdo, 'learning_chapters')) {
                $cStmt = $pdo->prepare(
                    'SELECT COUNT(*) FROM learning_chapters WHERE article_id = :id',
                );
                $cStmt->execute(['id' => $articleId]);
                $chCount = (int) $cStmt->fetchColumn();
            }
        } catch (Throwable) {
            $chCount = 0;
        }
        if ($chCount > 0 && learning_store_uses_chapter_coin_unlock($categoryId)) {
            return 0;
        }

        return null;
    }
    $idr = (int) ($row['price_idr'] ?? 0);
    if ($idr > 0) {
        return max(5, (int) round($idr / 2000));
    }

    return null;
}

function coins_valid_client_price_hint(int $hint): bool
{
    return $hint > 0 && $hint <= 1000;
}

/** Cek artikel/bab di tabel learning_* saja (tanpa CMS). */
/** Bab dikenali di payload CMS (tanpa upsert penuh). */
function coins_chapter_exists_in_cms(string $articleId, string $chapterId): bool
{
    $articleId = trim($articleId);
    $chapterId = trim($chapterId);
    if ($articleId === '' || $chapterId === '') {
        return false;
    }

    $found = learning_store_find_article_in_cms_sources($articleId);
    if ($found === null) {
        return false;
    }

    foreach ((array) ($found['article']['chapters'] ?? []) as $chapter) {
        if (is_array($chapter) && (string) ($chapter['id'] ?? '') === $chapterId) {
            return true;
        }
    }

    return false;
}

/** Terima coinPrice dari app jika konten valid (DB atau CMS). */
function coins_accept_client_hint(string $articleId, ?string $chapterId, int $hint): bool
{
    if (!coins_valid_client_price_hint($hint)) {
        return false;
    }

    $chapterId = $chapterId !== null ? trim($chapterId) : '';
    if ($chapterId === '') {
        return coins_learning_row_exists($articleId, null)
            || coins_lookup_cms_article_coin_price($articleId) !== null;
    }

    $purchaseId = coins_chapter_purchase_id($articleId, $chapterId);
    if (!coins_purchase_id_fits($purchaseId)) {
        return false;
    }

    if (coins_learning_row_exists($articleId, $chapterId)) {
        return true;
    }

    if (coins_learning_row_exists($articleId, null)) {
        return true;
    }

    if (coins_chapter_exists_in_cms($articleId, $chapterId)) {
        return true;
    }

    return coins_purchase_content_exists($purchaseId);
}

function coins_learning_row_exists(string $articleId, ?string $chapterId = null): bool
{
    $articleId = trim($articleId);
    if ($articleId === '') {
        return false;
    }

    try {
        $pdo = subscription_db();
        if (!app_table_exists($pdo, 'learning_articles')) {
            return false;
        }
        $stmt = $pdo->prepare('SELECT 1 FROM learning_articles WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $articleId]);
        if (!$stmt->fetchColumn()) {
            return false;
        }
        $chapterId = $chapterId !== null ? trim($chapterId) : '';
        if ($chapterId === '') {
            return true;
        }
        if (!app_table_exists($pdo, 'learning_chapters')) {
            return false;
        }
        $chStmt = $pdo->prepare(
            'SELECT 1 FROM learning_chapters WHERE article_id = :aid AND id = :cid LIMIT 1',
        );
        $chStmt->execute(['aid' => $articleId, 'cid' => $chapterId]);

        return (bool) $chStmt->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

function coins_purchase_content_exists(string $purchaseId): bool
{
    $parsed = coins_parse_purchase_id($purchaseId);
    $articleId = $parsed['articleId'];
    if ($articleId === '') {
        return false;
    }

    try {
        $pdo = subscription_db();
        if (app_table_exists($pdo, 'learning_articles')) {
            $stmt = $pdo->prepare('SELECT 1 FROM learning_articles WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $articleId]);
            if ($stmt->fetchColumn()) {
                if ($parsed['chapterId'] === null || $parsed['chapterId'] === '') {
                    return true;
                }
                if (app_table_exists($pdo, 'learning_chapters')) {
                    $chStmt = $pdo->prepare(
                        'SELECT 1 FROM learning_chapters WHERE article_id = :aid AND id = :cid LIMIT 1',
                    );
                    $chStmt->execute(['aid' => $articleId, 'cid' => $parsed['chapterId']]);
                    if ($chStmt->fetchColumn()) {
                        return true;
                    }
                }
            }
        }
    } catch (Throwable) {
        /* CMS */
    }

    $found = learning_store_find_article_in_cms_sources($articleId);
    if ($found !== null) {
        if ($parsed['chapterId'] === null || $parsed['chapterId'] === '') {
            return true;
        }
        foreach ((array) ($found['article']['chapters'] ?? []) as $chapter) {
            if (is_array($chapter) && (string) ($chapter['id'] ?? '') === $parsed['chapterId']) {
                return true;
            }
        }

        return false;
    }

    if ($parsed['chapterId'] !== null && $parsed['chapterId'] !== '') {
        return false;
    }

    return coins_lookup_cms_article_coin_price($articleId) !== null;
}

function coins_chapter_coin_price(
    string $articleId,
    string $chapterId,
    int $coinPriceHint = 0,
    int $priceIdr = 0,
): int {
    $articleId = trim($articleId);
    $chapterId = trim($chapterId);
    if ($articleId === '' || $chapterId === '') {
        coins_error('Artikel atau bab tidak valid.', 400);
    }

    if (coins_accept_client_hint($articleId, $chapterId, $coinPriceHint)) {
        return $coinPriceHint;
    }

    try {
        $pdo = subscription_db();
        if (app_table_exists($pdo, 'learning_chapters')) {
            $stmt = $pdo->prepare(
                'SELECT c.coin_price, c.article_id, a.coin_price AS article_coin, a.category_id
                 FROM learning_chapters c
                 INNER JOIN learning_articles a ON a.id = c.article_id
                 WHERE c.article_id = :aid AND c.id = :cid
                 LIMIT 1',
            );
            $stmt->execute(['aid' => $articleId, 'cid' => $chapterId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $coin = (int) ($row['coin_price'] ?? 0);
                if ($coin > 0) {
                    return $coin;
                }
                $articleCoin = (int) ($row['article_coin'] ?? 0);
                if ($articleCoin <= 0) {
                    $cmsArticleCoin = coins_lookup_cms_article_coin_price($articleId);
                    if ($cmsArticleCoin !== null && $cmsArticleCoin > 0) {
                        $articleCoin = $cmsArticleCoin;
                    }
                }
                if ($articleCoin > 0) {
                    $countStmt = $pdo->prepare(
                        'SELECT COUNT(*) FROM learning_chapters WHERE article_id = :aid',
                    );
                    $countStmt->execute(['aid' => $articleId]);
                    $count = max(1, (int) $countStmt->fetchColumn());
                    if ($count <= 1) {
                        $chaptersInCms = coins_chapter_count_from_cms($articleId);
                        if ($chaptersInCms > 0) {
                            $count = $chaptersInCms;
                        }
                    }

                    return max(1, (int) round($articleCoin / $count));
                }
            }
        }
    } catch (Throwable) {
        /* fallback CMS JSON */
    }

    $fromCms = coins_chapter_coin_price_from_cms($articleId, $chapterId);
    if ($fromCms !== null && $fromCms > 0) {
        return $fromCms;
    }

    $purchaseId = coins_chapter_purchase_id($articleId, $chapterId);
    if (
        $coinPriceHint > 0
        && $coinPriceHint <= 1000
        && coins_purchase_content_exists($purchaseId)
    ) {
        return $coinPriceHint;
    }

    if ($priceIdr > 0) {
        return max(5, (int) round($priceIdr / 2000));
    }

    coins_error('Bab tidak ditemukan.', 404);
}

/** Jumlah bab artikel dari CMS (fallback jika tabel learning_chapters kosong). */
function coins_chapter_count_from_cms(string $articleId): int
{
    $articleId = trim($articleId);
    if ($articleId === '') {
        return 0;
    }

    $cmsBootstrap = __DIR__ . '/../cms/bootstrap.php';
    if (!is_file($cmsBootstrap)) {
        return 0;
    }
    require_once $cmsBootstrap;

    try {
        $pdo = cms_db();
        foreach (['ulumul', 'jurnal'] as $sectionKey) {
            $payload = cms_get_section($sectionKey, $pdo);
            if (!is_array($payload)) {
                continue;
            }
            foreach ((array) ($payload['articles'] ?? []) as $article) {
                if (!is_array($article) || (string) ($article['id'] ?? '') !== $articleId) {
                    continue;
                }
                $chapters = is_array($article['chapters'] ?? null) ? $article['chapters'] : [];

                return count($chapters);
            }
        }
        $ulumul = cms_resolve_ulumul($pdo);
        if (is_array($ulumul)) {
            foreach ((array) ($ulumul['articles'] ?? []) as $article) {
                if (!is_array($article) || (string) ($article['id'] ?? '') !== $articleId) {
                    continue;
                }
                $chapters = is_array($article['chapters'] ?? null) ? $article['chapters'] : [];

                return count($chapters);
            }
        }
    } catch (Throwable) {
        return 0;
    }

    return 0;
}

/** Harga coin bab dari payload CMS (Tafsir Tahlili & Ulumul Qur'an). */
function coins_chapter_coin_price_from_cms(string $articleId, string $chapterId): ?int
{
    $cmsBootstrap = __DIR__ . '/../cms/bootstrap.php';
    if (!is_file($cmsBootstrap)) {
        return null;
    }
    require_once $cmsBootstrap;

    $resolveFromArticle = static function (array $article) use ($chapterId): ?int {
        if ((string) ($article['id'] ?? '') === '') {
            return null;
        }
        $chapters = is_array($article['chapters'] ?? null) ? $article['chapters'] : [];
        $chapterCount = max(1, count($chapters));
        foreach ($chapters as $chapter) {
            if (!is_array($chapter) || (string) ($chapter['id'] ?? '') !== $chapterId) {
                continue;
            }
            $coin = (int) ($chapter['coinPrice'] ?? 0);
            if ($coin > 0) {
                return $coin;
            }
            $articleCoin = (int) ($article['coinPrice'] ?? 0);
            if ($articleCoin > 0) {
                return max(1, (int) round($articleCoin / $chapterCount));
            }

            /* Bab ada di CMS tetapi tanpa harga — biarkan hint/DB yang mengisi. */
            return null;
        }

        return null;
    };

    try {
        $pdo = cms_db();
        foreach (['ulumul', 'jurnal'] as $sectionKey) {
            $payload = cms_get_section($sectionKey, $pdo);
            if (!is_array($payload)) {
                continue;
            }
            foreach ((array) ($payload['articles'] ?? []) as $article) {
                if (!is_array($article) || (string) ($article['id'] ?? '') !== $articleId) {
                    continue;
                }
                $coin = $resolveFromArticle($article);
                if ($coin !== null && $coin > 0) {
                    return $coin;
                }
            }
        }

        $ulumul = cms_resolve_ulumul($pdo);
        if (is_array($ulumul)) {
            foreach ((array) ($ulumul['articles'] ?? []) as $article) {
                if (!is_array($article) || (string) ($article['id'] ?? '') !== $articleId) {
                    continue;
                }
                $coin = $resolveFromArticle($article);
                if ($coin !== null && $coin > 0) {
                    return $coin;
                }
            }
        }
    } catch (Throwable) {
        /* fallback section learning */
    }

    $learning = cms_get_section('learning');
    if (is_array($learning)) {
        foreach ($learning as $category) {
            if (!is_array($category)) {
                continue;
            }
            $catId = (string) ($category['id'] ?? '');
            if (!in_array($catId, ['tafsir-tahlili', 'ulumul-quran'], true)) {
                continue;
            }
            foreach ((array) ($category['articles'] ?? []) as $article) {
                if (!is_array($article) || (string) ($article['id'] ?? '') !== $articleId) {
                    continue;
                }
                $coin = $resolveFromArticle($article);
                if ($coin !== null && $coin > 0) {
                    return $coin;
                }
            }
        }
    }

    return null;
}

function coins_journal_coin_price(string $journalId, int $priceIdr = 0, int $coinPriceHint = 0): int
{
    $parsed = coins_parse_purchase_id($journalId);
    if ($parsed['chapterId'] !== null) {
        return coins_chapter_coin_price(
            $parsed['articleId'],
            $parsed['chapterId'],
            $coinPriceHint,
            $priceIdr,
        );
    }

    $journalId = $parsed['articleId'];

    if (coins_accept_client_hint($journalId, null, $coinPriceHint)) {
        return $coinPriceHint;
    }

    $dbPrice = null;

    try {
        $pdo = subscription_db();
        if (app_table_exists($pdo, 'learning_articles')) {
            $stmt = $pdo->prepare(
                'SELECT category_id, coin_price, price_idr FROM learning_articles WHERE id = :id LIMIT 1',
            );
            $stmt->execute(['id' => $journalId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $dbPrice = coins_price_from_learning_article_row($row, $journalId);
            }
        }
    } catch (Throwable) {
        /* fallback ke CMS */
    }

    $cmsPrice = coins_lookup_cms_article_coin_price($journalId, $priceIdr);
    if ($cmsPrice !== null && $cmsPrice > 0) {
        return $cmsPrice;
    }

    if ($dbPrice !== null && $dbPrice > 0) {
        return $dbPrice;
    }

    if (
        $coinPriceHint > 0
        && $coinPriceHint <= 1000
        && coins_purchase_content_exists($journalId)
    ) {
        return $coinPriceHint;
    }

    if ($dbPrice !== null) {
        return $dbPrice;
    }

    if ($priceIdr > 0) {
        return max(5, (int) round($priceIdr / 2000));
    }

    coins_error('Konten tidak ditemukan di database.', 404);
}

/**
 * Daftar harga coin untuk app — dari learning_articles & learning_chapters (bukan CMS JSON).
 *
 * @return list<array{journalId: string, coinPrice: int}>
 */
function coins_journal_prices_from_tables(PDO $pdo): array
{
    $prices = [];
    $seen = [];

    if (!app_table_exists($pdo, 'learning_articles')) {
        return [];
    }

    $stmt = $pdo->query(
        'SELECT id, category_id, coin_price, price_idr FROM learning_articles ORDER BY category_id, sort_order, id',
    );
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $id = (string) ($row['id'] ?? '');
        if ($id === '') {
            continue;
        }
        $categoryId = (string) ($row['category_id'] ?? '');
        if (
            learning_store_uses_chapter_coin_unlock($categoryId)
            && app_table_exists($pdo, 'learning_chapters')
        ) {
            $ch = $pdo->prepare('SELECT 1 FROM learning_chapters WHERE article_id = :id LIMIT 1');
            $ch->execute(['id' => $id]);
            if ($ch->fetchColumn()) {
                continue;
            }
        }
        $coin = (int) ($row['coin_price'] ?? 0);
        if ($coin <= 0 && (int) ($row['price_idr'] ?? 0) > 0 && !learning_store_is_kajian_coin_category($categoryId)) {
            $coin = max(5, (int) round((int) $row['price_idr'] / 2000));
        }
        if ($coin > 0 && !isset($seen[$id])) {
            $seen[$id] = true;
            $prices[] = ['journalId' => $id, 'coinPrice' => $coin];
        }
    }

    if (app_table_exists($pdo, 'learning_chapters')) {
        $chStmt = $pdo->query(
            'SELECT c.article_id, c.id, c.coin_price, a.coin_price AS article_coin
             FROM learning_chapters c
             INNER JOIN learning_articles a ON a.id = c.article_id
             ORDER BY c.article_id, c.sort_order, c.chapter_number',
        );
        while ($row = $chStmt->fetch(PDO::FETCH_ASSOC)) {
            $articleId = (string) ($row['article_id'] ?? '');
            $chapterId = (string) ($row['id'] ?? '');
            if ($articleId === '' || $chapterId === '') {
                continue;
            }
            $purchaseId = coins_chapter_purchase_id($articleId, $chapterId);
            $coin = (int) ($row['coin_price'] ?? 0);
            if ($coin <= 0) {
                $articleCoin = (int) ($row['article_coin'] ?? 0);
                if ($articleCoin > 0) {
                    $cntStmt = $pdo->prepare(
                        'SELECT COUNT(*) FROM learning_chapters WHERE article_id = :aid',
                    );
                    $cntStmt->execute(['aid' => $articleId]);
                    $count = max(1, (int) $cntStmt->fetchColumn());
                    $coin = max(1, (int) round($articleCoin / $count));
                }
            }
            if ($coin > 0 && !isset($seen[$purchaseId])) {
                $seen[$purchaseId] = true;
                $prices[] = ['journalId' => $purchaseId, 'coinPrice' => $coin];
            }
        }
    }

    return $prices;
}

function coins_get_balance(string $email): int
{
    $email = subscription_normalize_email($email);
    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT balance FROM user_coins WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? (int) $row['balance'] : 0;
}

function coins_user_is_super_admin(string $email): bool
{
    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT is_super_admin FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row && (int) ($row['is_super_admin'] ?? 0) === 1;
}

function coins_new_tx_id(): string
{
    return 'CTX-' . strtoupper(bin2hex(random_bytes(4)));
}

function coins_new_order_id(): string
{
    return 'COIN-' . strtoupper(bin2hex(random_bytes(4)));
}

function coins_log_transaction(
    PDO $pdo,
    string $email,
    string $type,
    int $amount,
    int $balanceAfter,
    string $refType = '',
    string $refId = '',
    string $note = '',
): void {
    $stmt = $pdo->prepare(
        'INSERT INTO coin_transactions (id, email, type, amount, balance_after, ref_type, ref_id, note, created_at)
         VALUES (:id, :email, :type, :amount, :balance_after, :ref_type, :ref_id, :note, :created_at)',
    );
    $stmt->execute([
        'id' => coins_new_tx_id(),
        'email' => $email,
        'type' => $type,
        'amount' => $amount,
        'balance_after' => $balanceAfter,
        'ref_type' => $refType,
        'ref_id' => $refId,
        'note' => $note,
        'created_at' => time(),
    ]);
}

function coins_credit(string $email, int $amount, string $refType, string $refId, string $note = ''): int
{
    if ($amount <= 0) {
        coins_error('Jumlah coin tidak valid.');
    }

    $pdo = subscription_db();
    $now = time();
    $pdo->beginTransaction();
    try {
        $lock = app_db_is_mysql() ? ' FOR UPDATE' : '';
        $stmt = $pdo->prepare("SELECT balance FROM user_coins WHERE email = :email{$lock}");
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = $row ? (int) $row['balance'] : 0;
        $newBalance = $balance + $amount;

        if ($row) {
            $upd = $pdo->prepare('UPDATE user_coins SET balance = :balance, updated_at = :updated_at WHERE email = :email');
            $upd->execute(['balance' => $newBalance, 'updated_at' => $now, 'email' => $email]);
        } else {
            $ins = $pdo->prepare(
                'INSERT INTO user_coins (email, balance, updated_at) VALUES (:email, :balance, :updated_at)',
            );
            $ins->execute(['email' => $email, 'balance' => $newBalance, 'updated_at' => $now]);
        }

        coins_log_transaction($pdo, $email, 'credit', $amount, $newBalance, $refType, $refId, $note);
        $pdo->commit();
        return $newBalance;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function coins_debit(string $email, int $amount, string $refType, string $refId, string $note = ''): int
{
    if ($amount <= 0) {
        coins_error('Jumlah coin tidak valid.');
    }

    if (coins_user_is_super_admin($email)) {
        return coins_get_balance($email);
    }

    $pdo = subscription_db();
    $now = time();
    $pdo->beginTransaction();
    try {
        $lock = app_db_is_mysql() ? ' FOR UPDATE' : '';
        $stmt = $pdo->prepare("SELECT balance FROM user_coins WHERE email = :email{$lock}");
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = $row ? (int) $row['balance'] : 0;

        if ($balance < $amount) {
            $pdo->rollBack();
            coins_error('Saldo coin tidak cukup. Beli coin terlebih dahulu.', 402);
        }

        $newBalance = $balance - $amount;

        if ($row) {
            $upd = $pdo->prepare('UPDATE user_coins SET balance = :balance, updated_at = :updated_at WHERE email = :email');
            $upd->execute(['balance' => $newBalance, 'updated_at' => $now, 'email' => $email]);
        } else {
            $ins = $pdo->prepare(
                'INSERT INTO user_coins (email, balance, updated_at) VALUES (:email, :balance, :updated_at)',
            );
            $ins->execute(['email' => $email, 'balance' => $newBalance, 'updated_at' => $now]);
        }

        coins_log_transaction($pdo, $email, 'debit', -$amount, $newBalance, $refType, $refId, $note);
        $pdo->commit();
        return $newBalance;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function coins_unlock_journal(
    string $email,
    string $journalId,
    int $coinPriceHint = 0,
    int $priceIdrHint = 0,
): array {
    $journalId = trim($journalId);
    coins_validate_purchase_id($journalId);

    $parsed = coins_parse_purchase_id($journalId);
    $note = $parsed['chapterId'] !== null
        ? 'Buka bab tafsir'
        : 'Buka jurnal/buku';

    $existingUntil = subscription_journal_purchase_until($email, $journalId);
    if ($existingUntil !== null) {
        $coinPrice = coins_valid_client_price_hint($coinPriceHint)
            ? $coinPriceHint
            : coins_journal_coin_price($journalId, $priceIdrHint, $coinPriceHint);

        return [
            'journalId' => $journalId,
            'coinPrice' => $coinPrice,
            'activeUntil' => $existingUntil,
            'balance' => coins_get_balance($email),
            'alreadyOwned' => true,
        ];
    }

    $coinPrice = 0;
    if (coins_accept_client_hint($parsed['articleId'], $parsed['chapterId'], $coinPriceHint)) {
        $coinPrice = $coinPriceHint;
    }

    if ($coinPrice <= 0) {
        try {
            $pdo = subscription_db();
            learning_store_ensure_coin_purchase_index(
                $pdo,
                $parsed['articleId'],
                $parsed['chapterId'],
            );
        } catch (Throwable) {
            /* fallback harga dari CMS */
        }
        $coinPrice = coins_journal_coin_price($journalId, $priceIdrHint, $coinPriceHint);
    }

    if ($coinPrice <= 0) {
        coins_error('Materi ini gratis dan tidak perlu dibuka dengan coin.', 400);
    }

    $activeUntil = subscription_activate_journal($email, $journalId, coins_period_seconds());

    if (!coins_user_is_super_admin($email)) {
        try {
            coins_debit($email, $coinPrice, 'journal', $journalId, $note);
        } catch (Throwable $e) {
            subscription_revoke_journal_purchase($email, $journalId);
            throw $e;
        }
    }

    return [
        'journalId' => $journalId,
        'coinPrice' => $coinPrice,
        'activeUntil' => $activeUntil,
        'balance' => coins_get_balance($email),
        'alreadyOwned' => false,
    ];
}

function coins_charge_recording(string $email): int
{
    if (coins_user_is_super_admin($email)) {
        return coins_get_balance($email);
    }

    $cost = coins_recording_cost();
    return coins_debit($email, $cost, 'recording', '', 'Rekaman talaqqi');
}

function coins_order_credit_exists(string $email, string $orderId): bool
{
    $pdo = subscription_db();
    $stmt = $pdo->prepare(
        "SELECT 1 FROM coin_transactions
         WHERE email = :email AND ref_type = 'purchase' AND ref_id = :ref_id AND type = 'credit'
         LIMIT 1",
    );
    $stmt->execute([
        'email' => subscription_normalize_email($email),
        'ref_id' => $orderId,
    ]);

    return (bool) $stmt->fetchColumn();
}

/** Jumlah coin dari baris pesanan (kolom DB, paket, atau cocokkan harga IDR). */
function coins_resolve_order_coin_amount(array $order): int
{
    $coinAmount = (int) ($order['coin_amount'] ?? 0);
    if ($coinAmount > 0) {
        return $coinAmount;
    }

    $packageId = trim((string) ($order['package_id'] ?? ''));
    if ($packageId !== '') {
        try {
            $pkg = coins_package_by_id($packageId);

            return (int) $pkg['coins'];
        } catch (Throwable $e) {
            error_log('coins_resolve_order_coin_amount package: ' . $e->getMessage());
        }
    }

    $amountIdr = (int) ($order['amount_idr'] ?? 0);
    if ($amountIdr > 0) {
        foreach (coins_packages() as $pkg) {
            if ((int) ($pkg['priceIdr'] ?? 0) === $amountIdr) {
                return (int) $pkg['coins'];
            }
        }
    }

    return 0;
}

/**
 * Kredit coin untuk pesanan top-up (idempoten). Tidak melempar error ke klien — aman dipanggil dari webhook/polling.
 *
 * @return bool true jika saldo sudah / berhasil dikredit
 */
function coins_fulfill_paid_order(array $order): bool
{
    $email = subscription_normalize_email((string) $order['email']);
    $orderId = (string) $order['id'];

    if ($orderId === '') {
        return false;
    }

    if (coins_order_credit_exists($email, $orderId)) {
        return true;
    }

    $coinAmount = coins_resolve_order_coin_amount($order);
    if ($coinAmount <= 0) {
        error_log(
            'coins_fulfill_paid_order: coin_amount=0 for order '
            . $orderId
            . ' package_id='
            . (string) ($order['package_id'] ?? ''),
        );

        return false;
    }

    try {
        coins_credit($email, $coinAmount, 'purchase', $orderId, 'Top up coin');

        return true;
    } catch (Throwable $e) {
        error_log('coins_fulfill_paid_order credit failed ' . $orderId . ': ' . $e->getMessage());

        return false;
    }
}

function coins_complete_order(array $order): void
{
    coins_fulfill_paid_order($order);
}

function coins_order_was_credited(string $email, string $orderId): bool
{
    return coins_order_credit_exists($email, $orderId);
}

function coins_wallet_payload(string $email): array
{
    $pdo = subscription_db();
    $balance = coins_get_balance($email);

    return [
        'ok' => true,
        'email' => $email,
        'balance' => $balance,
        'balanceTopUp' => $balance,
        'balanceBonus' => 0,
        'recordingCost' => coins_recording_cost(),
        'packages' => coins_packages(),
        'journalPrices' => coins_journal_prices_from_tables($pdo),
    ];
}
