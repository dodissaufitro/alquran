<?php
declare(strict_types=1);

/**
 * Materi berbayar (jurnal, Ulumul) — tabel relasional MySQL/SQLite; harga coin di coin_price.
 * Materi kajian (tajwid, tafsir, …) — konten di section CMS `learning` (JSON);
 * harga coin di kolom learning_articles.coin_price (NULL/0 = gratis).
 */

/** @return list<string> */
function learning_store_kajian_coin_category_ids(): array
{
    return ['tajwid', 'tafsir-tahlili', 'tafsir-tematik'];
}

function learning_store_is_kajian_coin_category(string $categoryId): bool
{
    return in_array($categoryId, learning_store_kajian_coin_category_ids(), true);
}

/** Kategori yang membayar per bab (katalog dibuka dulu, coin per bab). */
function learning_store_uses_chapter_coin_unlock(string $categoryId): bool
{
    return in_array($categoryId, ['tafsir-tahlili', 'ulumul-quran', 'jurnal'], true);
}

function app_learning_migrate(PDO $pdo): void
{
    if (app_db_is_mysql()) {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS learning_categories (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL DEFAULT \'\',
                subtitle VARCHAR(255) NOT NULL DEFAULT \'\',
                description TEXT NOT NULL,
                sort_order INT UNSIGNED NOT NULL DEFAULT 0,
                updated_at INT UNSIGNED NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS learning_articles (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                category_id VARCHAR(64) NOT NULL,
                title VARCHAR(512) NOT NULL DEFAULT \'\',
                summary TEXT NOT NULL,
                body LONGTEXT NOT NULL,
                read_minutes INT UNSIGNED NOT NULL DEFAULT 5,
                price_idr INT UNSIGNED NULL,
                preview TEXT NULL,
                content_type VARCHAR(16) NULL,
                page_count INT UNSIGNED NULL,
                sort_order INT UNSIGNED NOT NULL DEFAULT 0,
                updated_at INT UNSIGNED NOT NULL,
                INDEX idx_learning_articles_category (category_id),
                CONSTRAINT fk_learning_articles_category
                    FOREIGN KEY (category_id) REFERENCES learning_categories(id)
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS learning_chapters (
                article_id VARCHAR(64) NOT NULL,
                id VARCHAR(64) NOT NULL,
                chapter_number INT UNSIGNED NOT NULL DEFAULT 1,
                title VARCHAR(512) NOT NULL DEFAULT \'\',
                summary TEXT NOT NULL,
                body LONGTEXT NOT NULL,
                read_minutes INT UNSIGNED NOT NULL DEFAULT 5,
                sort_order INT UNSIGNED NOT NULL DEFAULT 0,
                updated_at INT UNSIGNED NOT NULL,
                PRIMARY KEY (article_id, id),
                INDEX idx_learning_chapters_article (article_id),
                CONSTRAINT fk_learning_chapters_article
                    FOREIGN KEY (article_id) REFERENCES learning_articles(id)
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        );
        learning_store_fix_chapters_pk_mysql($pdo);
    } else {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS learning_categories (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT \'\',
                subtitle TEXT NOT NULL DEFAULT \'\',
                description TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL
            )',
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS learning_articles (
                id TEXT PRIMARY KEY,
                category_id TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT \'\',
                summary TEXT NOT NULL,
                body TEXT NOT NULL,
                read_minutes INTEGER NOT NULL DEFAULT 5,
                price_idr INTEGER,
                preview TEXT,
                content_type TEXT,
                page_count INTEGER,
                sort_order INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (category_id) REFERENCES learning_categories(id) ON DELETE CASCADE
            )',
        );
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_learning_articles_category ON learning_articles(category_id)');
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS learning_chapters (
                article_id TEXT NOT NULL,
                id TEXT NOT NULL,
                chapter_number INTEGER NOT NULL DEFAULT 1,
                title TEXT NOT NULL DEFAULT \'\',
                summary TEXT NOT NULL,
                body TEXT NOT NULL,
                read_minutes INTEGER NOT NULL DEFAULT 5,
                sort_order INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (article_id, id),
                FOREIGN KEY (article_id) REFERENCES learning_articles(id) ON DELETE CASCADE
            )',
        );
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_learning_chapters_article ON learning_chapters(article_id)');
    }

    app_ensure_column($pdo, 'learning_articles', 'cover_image', 'VARCHAR(512) NULL', 'TEXT NULL');
    app_ensure_column($pdo, 'learning_articles', 'coin_price', 'INT UNSIGNED NULL', 'INTEGER NULL');
    app_ensure_column($pdo, 'learning_chapters', 'coin_price', 'INT UNSIGNED NULL', 'INTEGER NULL');

    if (app_table_exists($pdo, 'learning_articles')) {
        if (app_db_is_mysql()) {
            $pdo->exec(
                'UPDATE learning_articles
                 SET coin_price = GREATEST(5, ROUND(price_idr / 2000))
                 WHERE (coin_price IS NULL OR coin_price = 0)
                   AND price_idr IS NOT NULL AND price_idr > 0
                   AND category_id != \'ulumul-quran\'
                   AND category_id NOT IN (\'tajwid\', \'tafsir-tahlili\', \'tafsir-tematik\')',
            );
            $pdo->exec(
                'UPDATE learning_articles
                 SET coin_price = GREATEST(5, ROUND(price_idr / 2000))
                 WHERE category_id = \'ulumul-quran\'
                   AND (coin_price IS NULL OR coin_price = 0)
                   AND price_idr IS NOT NULL AND price_idr > 0',
            );
        } else {
            $pdo->exec(
                'UPDATE learning_articles
                 SET coin_price = MAX(5, ROUND(price_idr / 2000.0))
                 WHERE (coin_price IS NULL OR coin_price = 0)
                   AND price_idr IS NOT NULL AND price_idr > 0
                   AND category_id != \'ulumul-quran\'
                   AND category_id NOT IN (\'tajwid\', \'tafsir-tahlili\', \'tafsir-tematik\')',
            );
            $pdo->exec(
                'UPDATE learning_articles
                 SET coin_price = MAX(5, ROUND(price_idr / 2000.0))
                 WHERE category_id = \'ulumul-quran\'
                   AND (coin_price IS NULL OR coin_price = 0)
                   AND price_idr IS NOT NULL AND price_idr > 0',
            );
        }
    }
}

/** @param array<string, mixed> $article */
function learning_store_resolve_coin_price(array $article, ?string $categoryId = null): ?int
{
    $coin = (int) ($article['coinPrice'] ?? 0);
    if ($coin > 0) {
        return $coin;
    }
    if ($categoryId !== null && learning_store_is_kajian_coin_category($categoryId)) {
        return null;
    }
    $idr = (int) ($article['priceIdr'] ?? 0);
    if ($idr > 0) {
        return max(5, (int) round($idr / 2000));
    }

    return null;
}

/** @return array<string, int|null> id artikel → coin_price dari tabel */
function learning_store_coin_price_map_for_category(PDO $pdo, string $categoryId): array
{
    if (!learning_store_is_kajian_coin_category($categoryId)
        || !app_table_exists($pdo, 'learning_articles')) {
        return [];
    }

    $stmt = $pdo->prepare(
        'SELECT id, coin_price FROM learning_articles WHERE category_id = :cid',
    );
    $stmt->execute(['cid' => $categoryId]);
    $map = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $id = (string) ($row['id'] ?? '');
        if ($id === '') {
            continue;
        }
        $coin = $row['coin_price'];
        $map[$id] = ($coin !== null && $coin !== '') ? (int) $coin : null;
    }

    return $map;
}

/**
 * Gabungkan coin_price dari tabel ke artikel kajian (Tajwid/Tafsir).
 * Sumber kebenaran: learning_articles.coin_price — NULL/0 = gratis.
 *
 * @param list<mixed> $articles
 * @return list<mixed>
 */
function learning_store_apply_table_coin_prices(PDO $pdo, array $articles, string $categoryId): array
{
    if (!learning_store_is_kajian_coin_category($categoryId)) {
        return $articles;
    }

    $map = learning_store_coin_price_map_for_category($pdo, $categoryId);
    $out = [];
    foreach ($articles as $article) {
        if (!is_array($article)) {
            $out[] = $article;
            continue;
        }
        $id = (string) ($article['id'] ?? '');
        unset($article['coinPrice']);
        if ($id !== '' && array_key_exists($id, $map)) {
            $coin = $map[$id];
            if ($coin !== null && $coin > 0) {
                $article['coinPrice'] = $coin;
            }
        }
        $out[] = $article;
    }

    return $out;
}

/**
 * Buat baris learning_articles jika belum ada (migrasi sekali dari JSON admin).
 *
 * @param array<string, mixed> $article
 * @param array<string, mixed>|null $categoryMeta
 */
function learning_store_ensure_kajian_article_row(
    PDO $pdo,
    string $categoryId,
    array $article,
    int $sortOrder,
    int $now,
    ?array $categoryMeta = null,
): void {
    if (!learning_store_is_kajian_coin_category($categoryId)) {
        return;
    }

    $articleId = trim((string) ($article['id'] ?? ''));
    if ($articleId === '') {
        return;
    }

    $check = $pdo->prepare('SELECT 1 FROM learning_articles WHERE id = :id LIMIT 1');
    $check->execute(['id' => $articleId]);
    if ($check->fetchColumn()) {
        return;
    }

    $catMeta = $categoryMeta;
    if ($catMeta === null) {
        $learning = learning_store_get_learning_section($pdo);
        $idx = learning_store_find_category_index($learning, $categoryId);
        if ($idx !== null && is_array($learning[$idx])) {
            $catMeta = $learning[$idx];
        }
    }
    if ($catMeta !== null) {
        learning_store_upsert_category_meta($pdo, $catMeta, 0, $now);
    }

    learning_store_upsert_article_row($pdo, $categoryId, $article, $sortOrder, $now);
}

/** @param list<mixed> $learning */
function learning_store_admin_learning_section(PDO $pdo, mixed $learning): mixed
{
    if (!is_array($learning)) {
        return $learning;
    }

    $now = time();
    $out = [];
    foreach ($learning as $category) {
        if (!is_array($category)) {
            $out[] = $category;
            continue;
        }
        $catId = (string) ($category['id'] ?? '');
        $articles = is_array($category['articles'] ?? null) ? $category['articles'] : [];
        if (learning_store_is_kajian_coin_category($catId)) {
            $sort = 0;
            foreach ($articles as $article) {
                if (is_array($article)) {
                    learning_store_ensure_kajian_article_row($pdo, $catId, $article, $sort++, $now, $category);
                }
            }
            $articles = learning_store_apply_table_coin_prices($pdo, $articles, $catId);
        }
        $category['articles'] = $articles;
        $out[] = $category;
    }

    return $out;
}

/** Perbaiki skema lama (PK hanya `id`) agar bab unik per artikel. */
function learning_store_fix_chapters_pk_mysql(PDO $pdo): void
{
    if (!app_table_exists($pdo, 'learning_chapters')) {
        return;
    }

    $stmt = $pdo->query(
        "SELECT GROUP_CONCAT(column_name ORDER BY ordinal_position SEPARATOR ',') AS pk_cols
         FROM information_schema.key_column_usage
         WHERE table_schema = DATABASE()
           AND table_name = 'learning_chapters'
           AND constraint_name = 'PRIMARY'",
    );
    $pkCols = (string) ($stmt->fetchColumn() ?: '');
    if ($pkCols === 'article_id,id') {
        return;
    }
    if ($pkCols !== 'id') {
        return;
    }

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    $pdo->exec('DROP TABLE IF EXISTS learning_chapters');
    $pdo->exec(
        'CREATE TABLE learning_chapters (
            article_id VARCHAR(64) NOT NULL,
            id VARCHAR(64) NOT NULL,
            chapter_number INT UNSIGNED NOT NULL DEFAULT 1,
            title VARCHAR(512) NOT NULL DEFAULT \'\',
            summary TEXT NOT NULL,
            body LONGTEXT NOT NULL,
            read_minutes INT UNSIGNED NOT NULL DEFAULT 5,
            sort_order INT UNSIGNED NOT NULL DEFAULT 0,
            updated_at INT UNSIGNED NOT NULL,
            PRIMARY KEY (article_id, id),
            INDEX idx_learning_chapters_article (article_id),
            CONSTRAINT fk_learning_chapters_article
                FOREIGN KEY (article_id) REFERENCES learning_articles(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
}

/** Jumlah artikel per kategori langsung dari learning_articles. */
function learning_store_article_counts_by_category(PDO $pdo, array $excludeIds = []): array
{
    if ($excludeIds === []) {
        $stmt = $pdo->query(
            'SELECT category_id, COUNT(*) AS cnt FROM learning_articles GROUP BY category_id',
        );
    } else {
        $placeholders = implode(',', array_fill(0, count($excludeIds), '?'));
        $stmt = $pdo->prepare(
            "SELECT category_id, COUNT(*) AS cnt FROM learning_articles
             WHERE category_id NOT IN ($placeholders)
             GROUP BY category_id",
        );
        $stmt->execute($excludeIds);
    }

    $counts = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $counts[(string) $row['category_id']] = (int) $row['cnt'];
    }

    return $counts;
}

function learning_store_has_data(PDO $pdo): bool
{
    if (!app_table_exists($pdo, 'learning_categories')) {
        return false;
    }
    return (int) $pdo->query('SELECT COUNT(*) FROM learning_categories')->fetchColumn() > 0;
}

/** Salin dari JSON cms_content_sections jika tabel masih kosong. */
function learning_store_import_from_cms_json_if_empty(PDO $pdo): void
{
    if (learning_store_has_data($pdo)) {
        return;
    }

    $table = app_cms_content_table();
    $now = time();

    $stmt = $pdo->prepare("SELECT payload FROM $table WHERE section_key = 'learning'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("SELECT payload FROM $table WHERE section_key = 'jurnal'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $jurnal = json_decode((string) $row['payload'], true);
        if (is_array($jurnal) && ($jurnal['id'] ?? '') === 'jurnal') {
            learning_store_save_jurnal_category($pdo, $jurnal, $now);
        }
    }

    $stmt = $pdo->prepare("SELECT payload FROM $table WHERE section_key = 'ulumul'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $ulumul = json_decode((string) $row['payload'], true);
        if (is_array($ulumul) && ($ulumul['id'] ?? '') === 'ulumul-quran') {
            learning_store_save_ulumul_category($pdo, $ulumul, $now);
        }
    }
}

/** Kategori materi kajian — disimpan di section CMS `learning`, bukan tabel relasional. */
function learning_store_uses_cms_json_storage(string $categoryId): bool
{
    return $categoryId !== ''
        && !in_array($categoryId, ['jurnal', 'ulumul-quran', 'talaqqi-fatihah'], true);
}

/** @return list<array<string, mixed>> */
function learning_store_get_learning_section(PDO $pdo): array
{
    $table = app_cms_content_table();
    $stmt = $pdo->prepare("SELECT payload FROM $table WHERE section_key = 'learning'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return [];
    }

    $decoded = json_decode((string) $row['payload'], true);

    return is_array($decoded) ? $decoded : [];
}

/** @param list<array<string, mixed>> $categories */
function learning_store_save_learning_section(PDO $pdo, array $categories, int $now): void
{
    $encoded = json_encode(array_values($categories), JSON_UNESCAPED_UNICODE);
    if ($encoded === false) {
        throw new RuntimeException('Gagal meng-encode section learning.');
    }

    app_cms_upsert_section($pdo, 'learning', $encoded, $now);
}

/** @param list<array<string, mixed>> $learning */
function learning_store_find_category_index(array $learning, string $categoryId): ?int
{
    foreach ($learning as $index => $category) {
        if (is_array($category) && (string) ($category['id'] ?? '') === $categoryId) {
            return $index;
        }
    }

    return null;
}

/**
 * @param array<string, mixed> $article
 * @param array<string, mixed>|null $categoryMeta
 */
function learning_store_upsert_kajian_article_json(
    PDO $pdo,
    string $categoryId,
    array $article,
    int $sortOrder,
    int $now,
    ?array $categoryMeta = null,
    ?string $previousArticleId = null,
): void {
    $learning = learning_store_get_learning_section($pdo);
    $index = learning_store_find_category_index($learning, $categoryId);

    $storedCategory = ($index !== null && is_array($learning[$index])) ? $learning[$index] : null;
    $storedArticles = [];
    if ($storedCategory !== null && is_array($storedCategory['articles'] ?? null)) {
        $storedArticles = $storedCategory['articles'];
    }

    if ($categoryMeta !== null) {
        $category = $categoryMeta;
        $category['id'] = $categoryId;
        // Admin mengirim meta tanpa `articles` — jangan timpa daftar yang sudah ada di DB.
        if (!array_key_exists('articles', $categoryMeta) || !is_array($categoryMeta['articles'])) {
            $category['articles'] = $storedArticles;
        }
    } elseif ($storedCategory !== null) {
        $category = $storedCategory;
    } else {
        throw new InvalidArgumentException('Kategori tidak ditemukan: ' . $categoryId);
    }

    $articles = is_array($category['articles'] ?? null) ? $category['articles'] : [];
    $articleId = trim((string) ($article['id'] ?? ''));
    $lookupId = trim($previousArticleId ?? $articleId);
    $replaced = false;

    foreach ($articles as $i => $existing) {
        if (!is_array($existing)) {
            continue;
        }
        $existingId = trim((string) ($existing['id'] ?? ''));
        if ($existingId === $lookupId || $existingId === $articleId) {
            $articles[$i] = $article;
            $replaced = true;
            break;
        }
    }

    if (!$replaced) {
        if ($sortOrder >= 0 && $sortOrder < count($articles)) {
            array_splice($articles, $sortOrder, 0, [$article]);
        } else {
            $articles[] = $article;
        }
    }

    $category['articles'] = array_values($articles);
    if ($index === null) {
        $learning[] = $category;
    } else {
        $learning[$index] = $category;
    }

    learning_store_save_learning_section($pdo, $learning, $now);
}

function learning_store_delete_kajian_article_json(PDO $pdo, string $articleId, int $now): bool
{
    $learning = learning_store_get_learning_section($pdo);

    foreach ($learning as $index => $category) {
        if (!is_array($category)) {
            continue;
        }
        $articles = $category['articles'] ?? null;
        if (!is_array($articles)) {
            continue;
        }

        $nextArticles = [];
        $removed = false;
        foreach ($articles as $article) {
            if (is_array($article) && trim((string) ($article['id'] ?? '')) === $articleId) {
                $removed = true;
                continue;
            }
            $nextArticles[] = $article;
        }

        if ($removed) {
            $category['articles'] = array_values($nextArticles);
            $learning[$index] = $category;
            learning_store_save_learning_section($pdo, $learning, $now);

            return true;
        }
    }

    return false;
}

/**
 * @param list<mixed> $categories
 */
function learning_store_save_learning_list(PDO $pdo, array $categories, int $now): void
{
    $pdo->beginTransaction();
    try {
        learning_store_delete_category_tree_except($pdo, ['jurnal', 'ulumul-quran']);

        $sort = 0;
        foreach ($categories as $cat) {
            if (!is_array($cat)) {
                continue;
            }
            $id = trim((string) ($cat['id'] ?? ''));
            if ($id === '' || $id === 'jurnal' || $id === 'ulumul-quran') {
                continue;
            }
            learning_store_upsert_category($pdo, $cat, $sort++, $now);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/** @param array<string, mixed> $category */
function learning_store_save_jurnal_category(PDO $pdo, array $category, int $now): void
{
    learning_store_save_paid_category($pdo, 'jurnal', $category, $now);
}

/** @param array<string, mixed> $category */
function learning_store_save_ulumul_category(PDO $pdo, array $category, int $now): void
{
    learning_store_save_paid_category($pdo, 'ulumul-quran', $category, $now);
}

/** @param array<string, mixed> $category */
function learning_store_save_paid_category(PDO $pdo, string $categoryId, array $category, int $now): void
{
    $pdo->beginTransaction();
    try {
        learning_store_delete_category_tree($pdo, $categoryId, false);
        learning_store_upsert_category($pdo, $category, 0, $now);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/** @param list<string> $exceptCategoryIds */
function learning_store_delete_category_tree_except(PDO $pdo, array $exceptCategoryIds): void
{
    $exceptCategoryIds = array_values(array_filter(array_map('strval', $exceptCategoryIds)));
    if ($exceptCategoryIds === []) {
        return;
    }

    $placeholders = implode(',', array_fill(0, count($exceptCategoryIds), '?'));
    $stmt = $pdo->prepare(
        "SELECT id FROM learning_articles WHERE category_id NOT IN ($placeholders)",
    );
    $stmt->execute($exceptCategoryIds);
    $articleIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if ($articleIds !== []) {
        $artPlaceholders = implode(',', array_fill(0, count($articleIds), '?'));
        $pdo->prepare("DELETE FROM learning_chapters WHERE article_id IN ($artPlaceholders)")
            ->execute($articleIds);
        $pdo->prepare("DELETE FROM learning_articles WHERE id IN ($artPlaceholders)")
            ->execute($articleIds);
    }

    $pdo->prepare("DELETE FROM learning_categories WHERE id NOT IN ($placeholders)")
        ->execute($exceptCategoryIds);
}

function learning_store_delete_category_tree(PDO $pdo, string $exceptCategoryId, bool $excludeThatCategory): void
{
    if ($excludeThatCategory) {
        $stmt = $pdo->prepare(
            'SELECT id FROM learning_articles WHERE category_id != :except',
        );
        $stmt->execute(['except' => $exceptCategoryId]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM learning_articles WHERE category_id = :id');
        $stmt->execute(['id' => $exceptCategoryId]);
    }

    $articleIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if ($articleIds !== []) {
        $placeholders = implode(',', array_fill(0, count($articleIds), '?'));
        $pdo->prepare("DELETE FROM learning_chapters WHERE article_id IN ($placeholders)")
            ->execute($articleIds);
        $pdo->prepare("DELETE FROM learning_articles WHERE id IN ($placeholders)")
            ->execute($articleIds);
    }

    if ($excludeThatCategory) {
        $pdo->prepare('DELETE FROM learning_categories WHERE id != :except')
            ->execute(['except' => $exceptCategoryId]);
    } else {
        $pdo->prepare('DELETE FROM learning_categories WHERE id = :id')
            ->execute(['id' => $exceptCategoryId]);
    }
}

/** @param array<string, mixed> $cat */
function learning_store_upsert_category(PDO $pdo, array $cat, int $sortOrder, int $now): void
{
    $categoryId = trim((string) ($cat['id'] ?? ''));
    if ($categoryId === '') {
        return;
    }

    learning_store_upsert_category_meta($pdo, $cat, $sortOrder, $now);

    $ids = $pdo->prepare('SELECT id FROM learning_articles WHERE category_id = :cid');
    $ids->execute(['cid' => $categoryId]);
    $articleIds = $ids->fetchAll(PDO::FETCH_COLUMN);
    if ($articleIds !== []) {
        $placeholders = implode(',', array_fill(0, count($articleIds), '?'));
        $pdo->prepare("DELETE FROM learning_chapters WHERE article_id IN ($placeholders)")
            ->execute($articleIds);
        $pdo->prepare("DELETE FROM learning_articles WHERE id IN ($placeholders)")
            ->execute($articleIds);
    }

    $articles = is_array($cat['articles'] ?? null) ? $cat['articles'] : [];
    $artSort = 0;
    foreach ($articles as $article) {
        if (!is_array($article)) {
            continue;
        }
        learning_store_insert_article($pdo, $categoryId, $article, $artSort++, $now);
    }
}

/** @param array<string, mixed> $cat */
function learning_store_upsert_category_meta(PDO $pdo, array $cat, int $sortOrder, int $now): void
{
    $categoryId = trim((string) ($cat['id'] ?? ''));
    if ($categoryId === '') {
        return;
    }

    if (app_db_is_mysql()) {
        $stmt = $pdo->prepare(
            'INSERT INTO learning_categories (id, title, subtitle, description, sort_order, updated_at)
             VALUES (:id, :title, :subtitle, :description, :sort_order, :updated_at)
             ON DUPLICATE KEY UPDATE
               title = VALUES(title),
               subtitle = VALUES(subtitle),
               description = VALUES(description),
               sort_order = VALUES(sort_order),
               updated_at = VALUES(updated_at)',
        );
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO learning_categories (id, title, subtitle, description, sort_order, updated_at)
             VALUES (:id, :title, :subtitle, :description, :sort_order, :updated_at)
             ON CONFLICT(id) DO UPDATE SET
               title = excluded.title,
               subtitle = excluded.subtitle,
               description = excluded.description,
               sort_order = excluded.sort_order,
               updated_at = excluded.updated_at',
        );
    }

    $stmt->execute([
        'id' => $categoryId,
        'title' => (string) ($cat['title'] ?? ''),
        'subtitle' => (string) ($cat['subtitle'] ?? ''),
        'description' => (string) ($cat['description'] ?? ''),
        'sort_order' => $sortOrder,
        'updated_at' => $now,
    ]);
}

/**
 * Simpan satu artikel ke learning_articles (berdasarkan category_id) tanpa menghapus artikel lain.
 *
 * @param array<string, mixed> $article
 * @param array<string, mixed>|null $categoryMeta
 */
function learning_store_upsert_single_article(
    PDO $pdo,
    string $categoryId,
    array $article,
    int $sortOrder,
    int $now,
    ?array $categoryMeta = null,
    ?string $previousArticleId = null,
): void {
    $categoryId = trim($categoryId);
    if ($categoryId === '') {
        throw new InvalidArgumentException('category_id wajib diisi.');
    }

    $articleId = trim((string) ($article['id'] ?? ''));
    if ($articleId === '') {
        throw new InvalidArgumentException('ID artikel wajib diisi.');
    }

    if (learning_store_uses_cms_json_storage($categoryId)) {
        learning_store_upsert_kajian_article_json(
            $pdo,
            $categoryId,
            $article,
            $sortOrder,
            $now,
            $categoryMeta,
            $previousArticleId,
        );
        if (learning_store_is_kajian_coin_category($categoryId)) {
            $catMeta = $categoryMeta;
            if ($catMeta === null) {
                $learning = learning_store_get_learning_section($pdo);
                $idx = learning_store_find_category_index($learning, $categoryId);
                if ($idx !== null && is_array($learning[$idx])) {
                    $catMeta = $learning[$idx];
                }
            }
            if ($catMeta !== null) {
                learning_store_upsert_category_meta($pdo, $catMeta, 0, $now);
            }
            learning_store_upsert_article_row(
                $pdo,
                $categoryId,
                $article,
                $sortOrder,
                $now,
                $previousArticleId,
            );
        }

        return;
    }

    if ($categoryMeta !== null) {
        learning_store_upsert_category_meta($pdo, $categoryMeta, 0, $now);
    } else {
        $check = $pdo->prepare('SELECT 1 FROM learning_categories WHERE id = :id LIMIT 1');
        $check->execute(['id' => $categoryId]);
        if (!$check->fetchColumn()) {
            throw new InvalidArgumentException('Kategori tidak ditemukan: ' . $categoryId);
        }
    }

    learning_store_upsert_article_row($pdo, $categoryId, $article, $sortOrder, $now, $previousArticleId);
    learning_store_sync_section_json_for_category($pdo, $categoryId, $now);
}

function learning_store_delete_single_article(PDO $pdo, string $articleId, int $now): void
{
    $articleId = trim($articleId);
    if ($articleId === '') {
        throw new InvalidArgumentException('ID artikel wajib diisi.');
    }

    if (learning_store_delete_kajian_article_json($pdo, $articleId, $now)) {
        $pdo->prepare('DELETE FROM learning_chapters WHERE article_id = :id')->execute(['id' => $articleId]);
        $pdo->prepare('DELETE FROM learning_articles WHERE id = :id')->execute(['id' => $articleId]);

        return;
    }

    $stmt = $pdo->prepare('SELECT category_id FROM learning_articles WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $articleId]);
    $categoryId = $stmt->fetchColumn();
    if ($categoryId === false) {
        throw new InvalidArgumentException('Artikel tidak ditemukan: ' . $articleId);
    }

    $pdo->prepare('DELETE FROM learning_chapters WHERE article_id = :id')->execute(['id' => $articleId]);
    $pdo->prepare('DELETE FROM learning_articles WHERE id = :id')->execute(['id' => $articleId]);

    learning_store_sync_section_json_for_category($pdo, (string) $categoryId, $now);
}

function learning_store_sync_section_json_for_category(PDO $pdo, string $categoryId, int $now): void
{
    if ($categoryId === 'jurnal') {
        $jurnal = learning_store_load_jurnal($pdo);
        if ($jurnal === null) {
            return;
        }
        $encoded = json_encode($jurnal, JSON_UNESCAPED_UNICODE);
        if ($encoded === false) {
            return;
        }
        app_cms_upsert_section($pdo, 'jurnal', $encoded, $now);
        return;
    }

    if ($categoryId === 'ulumul-quran') {
        $ulumul = learning_store_load_ulumul($pdo);
        if ($ulumul === null) {
            return;
        }
        $encoded = json_encode($ulumul, JSON_UNESCAPED_UNICODE);
        if ($encoded === false) {
            return;
        }
        app_cms_upsert_section($pdo, 'ulumul', $encoded, $now);
        return;
    }

    if (learning_store_uses_cms_json_storage($categoryId)) {
        return;
    }

    learning_store_sync_cms_learning_json($pdo, $now);
}

function learning_store_sync_cms_learning_json(PDO $pdo, int $now): void
{
    $payload = learning_store_load_learning($pdo);
    $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if ($encoded === false) {
        return;
    }
    app_cms_upsert_section($pdo, 'learning', $encoded, $now);
}

/**
 * Jurnal/buku tanpa bab di CMS → buat bab otomatis (satu bab atau pecah isi buku).
 *
 * @param array<string, mixed> $article
 * @return array<string, mixed>
 */
function learning_store_normalize_jurnal_article(array $article): array
{
    $chapters = is_array($article['chapters'] ?? null) ? $article['chapters'] : [];
    if ($chapters !== []) {
        return $article;
    }

    $body = trim((string) ($article['body'] ?? ''));
    if ($body === '') {
        return $article;
    }

    $title = trim((string) ($article['title'] ?? 'Bacaan'));
    $readMinutes = max(1, (int) ($article['readMinutes'] ?? 5));
    $contentType = (string) ($article['contentType'] ?? '');

    $built = [];
    if ($contentType === 'buku') {
        $parts = preg_split('/\n\n(?=\*\*|- \*\*)/', $body) ?: [];
        if (count($parts) > 1) {
            $n = 0;
            foreach ($parts as $part) {
                $chunk = trim((string) $part);
                if ($chunk === '') {
                    continue;
                }
                $n++;
                $chapterTitle = $title;
                if (preg_match('/^\*\*([^*]+)\*\*/', $chunk, $m)) {
                    $chapterTitle = trim($m[1]);
                } elseif (preg_match('/^- \*\*([^*]+)\*\*/', $chunk, $m)) {
                    $chapterTitle = trim($m[1]);
                }
                $plain = preg_replace('/\*\*/', '', $chunk) ?? $chunk;
                $plain = preg_replace('/\s+/', ' ', $plain) ?? $plain;
                $built[] = [
                    'id' => 'bab-' . $n,
                    'number' => $n,
                    'title' => $chapterTitle,
                    'summary' => mb_substr(trim($plain), 0, 140) ?: $title,
                    'readMinutes' => max(3, (int) ceil(strlen($chunk) / 800)),
                    'body' => $chunk,
                ];
            }
        }
    }

    if ($built === []) {
        $built[] = [
            'id' => 'bab-1',
            'number' => 1,
            'title' => 'Bacaan lengkap',
            'summary' => (string) ($article['summary'] ?? ''),
            'readMinutes' => $readMinutes,
            'body' => $body,
        ];
    }

    $article['chapters'] = $built;

    return $article;
}

/** @param array<string, mixed> $article */
function learning_store_insert_article(PDO $pdo, string $categoryId, array $article, int $sortOrder, int $now): void
{
    if ($categoryId === 'jurnal') {
        $article = learning_store_normalize_jurnal_article($article);
    }
    learning_store_upsert_article_row($pdo, $categoryId, $article, $sortOrder, $now);
}

/** @param array<string, mixed> $article */
function learning_store_upsert_article_row(
    PDO $pdo,
    string $categoryId,
    array $article,
    int $sortOrder,
    int $now,
    ?string $previousArticleId = null,
): void {
    $articleId = trim((string) ($article['id'] ?? ''));
    if ($articleId === '') {
        throw new InvalidArgumentException('ID artikel wajib diisi.');
    }

    $lookupId = trim($previousArticleId ?? $articleId);
    if ($lookupId === '') {
        $lookupId = $articleId;
    }

    $contentType = $article['contentType'] ?? null;
    if ($contentType !== 'jurnal' && $contentType !== 'buku') {
        $contentType = null;
    }

    $params = [
        'id' => $articleId,
        'category_id' => $categoryId,
        'title' => (string) ($article['title'] ?? ''),
        'summary' => (string) ($article['summary'] ?? ''),
        'body' => (string) ($article['body'] ?? ''),
        'read_minutes' => max(1, (int) ($article['readMinutes'] ?? 5)),
        'price_idr' => $categoryId === 'ulumul-quran'
            ? null
            : (isset($article['priceIdr']) ? (int) $article['priceIdr'] : null),
        'coin_price' => learning_store_resolve_coin_price($article, $categoryId),
        'preview' => isset($article['preview']) ? (string) $article['preview'] : null,
        'content_type' => $contentType,
        'page_count' => isset($article['pageCount']) ? (int) $article['pageCount'] : null,
        'cover_image' => isset($article['coverImage']) ? trim((string) $article['coverImage']) : null,
        'sort_order' => $sortOrder,
        'updated_at' => $now,
    ];

    $existsStmt = $pdo->prepare('SELECT id FROM learning_articles WHERE id = :id LIMIT 1');
    $existsStmt->execute(['id' => $lookupId]);
    $exists = (bool) $existsStmt->fetchColumn();

    if ($exists) {
        if ($lookupId !== $articleId) {
            $pdo->prepare('DELETE FROM learning_chapters WHERE article_id = :id')->execute(['id' => $lookupId]);
            $pdo->prepare('DELETE FROM learning_articles WHERE id = :id')->execute(['id' => $lookupId]);
            $exists = false;
        } else {
            $pdo->prepare(
                'UPDATE learning_articles SET
                    category_id = :category_id,
                    title = :title,
                    summary = :summary,
                    body = :body,
                    read_minutes = :read_minutes,
                    price_idr = :price_idr,
                    coin_price = :coin_price,
                    preview = :preview,
                    content_type = :content_type,
                    page_count = :page_count,
                    cover_image = :cover_image,
                    sort_order = :sort_order,
                    updated_at = :updated_at
                 WHERE id = :id',
            )->execute($params);
            learning_store_replace_article_chapters($pdo, $articleId, $article, $now);
            return;
        }
    }

    $pdo->prepare(
        'INSERT INTO learning_articles (
            id, category_id, title, summary, body, read_minutes,
            price_idr, coin_price, preview, content_type, page_count, cover_image, sort_order, updated_at
        ) VALUES (
            :id, :category_id, :title, :summary, :body, :read_minutes,
            :price_idr, :coin_price, :preview, :content_type, :page_count, :cover_image, :sort_order, :updated_at
        )',
    )->execute($params);
    learning_store_replace_article_chapters($pdo, $articleId, $article, $now);
}

/** @param array<string, mixed> $article */
function learning_store_replace_article_chapters(PDO $pdo, string $articleId, array $article, int $now): void
{
    $pdo->prepare('DELETE FROM learning_chapters WHERE article_id = :id')->execute(['id' => $articleId]);

    $chapters = is_array($article['chapters'] ?? null) ? $article['chapters'] : [];
    $chSort = 0;
    foreach ($chapters as $chapter) {
        if (!is_array($chapter)) {
            continue;
        }
        $chapterId = trim((string) ($chapter['id'] ?? ''));
        if ($chapterId === '') {
            continue;
        }

        $chapterCoin = (int) ($chapter['coinPrice'] ?? 0);
        if ($chapterCoin <= 0) {
            $articleCoin = (int) ($article['coinPrice'] ?? 0);
            $chapterCount = max(1, count($chapters));
            if ($articleCoin > 0) {
                $chapterCoin = max(1, (int) round($articleCoin / $chapterCount));
            }
        }
        $pdo->prepare(
            'INSERT INTO learning_chapters (
                article_id, id, chapter_number, title, summary, body, read_minutes, coin_price, sort_order, updated_at
            ) VALUES (
                :article_id, :id, :chapter_number, :title, :summary, :body, :read_minutes, :coin_price, :sort_order, :updated_at
            )',
        )->execute([
            'article_id' => $articleId,
            'id' => $chapterId,
            'chapter_number' => max(1, (int) ($chapter['number'] ?? 1)),
            'title' => (string) ($chapter['title'] ?? ''),
            'summary' => (string) ($chapter['summary'] ?? ''),
            'body' => (string) ($chapter['body'] ?? ''),
            'read_minutes' => max(1, (int) ($chapter['readMinutes'] ?? 5)),
            'coin_price' => $chapterCoin > 0 ? $chapterCoin : null,
            'sort_order' => $chSort++,
            'updated_at' => $now,
        ]);
    }
}

/** @return list<array<string, mixed>> */
function learning_store_load_learning(PDO $pdo, bool $forPublic = false): array
{
    learning_store_import_from_cms_json_if_empty($pdo);

    if ($forPublic) {
        return learning_store_load_categories_with_articles($pdo, ['jurnal', 'talaqqi-fatihah', 'ulumul-quran']);
    }

    $stmt = $pdo->query(
        'SELECT * FROM learning_categories WHERE id != \'jurnal\' ORDER BY sort_order ASC, id ASC',
    );
    $categories = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $cat = learning_store_category_row_to_array($pdo, $row);
        if ($forPublic) {
            $cat['articles'] = learning_store_articles_for_list(
                is_array($cat['articles'] ?? null) ? $cat['articles'] : [],
            );
        }
        $categories[] = $cat;
    }

    return $categories;
}

/**
 * Kategori + artikel + bab dari tabel relasional (untuk API publik / aplikasi).
 *
 * @param list<string> $excludeIds
 * @return list<array<string, mixed>>
 */
function learning_store_load_categories_with_articles(PDO $pdo, array $excludeIds = []): array
{
    learning_store_import_from_cms_json_if_empty($pdo);

    if ($excludeIds === []) {
        $stmt = $pdo->query(
            'SELECT * FROM learning_categories ORDER BY sort_order ASC, id ASC',
        );
    } else {
        $placeholders = implode(',', array_fill(0, count($excludeIds), '?'));
        $stmt = $pdo->prepare(
            "SELECT * FROM learning_categories WHERE id NOT IN ($placeholders)
             ORDER BY sort_order ASC, id ASC",
        );
        $stmt->execute($excludeIds);
    }

    $categories = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categories[] = learning_store_category_row_to_array($pdo, $row);
    }

    return $categories;
}

function learning_store_learning_updated_at(PDO $pdo): int
{
    $updated = 0;
    foreach (['learning_categories', 'learning_articles', 'learning_chapters'] as $table) {
        if (!app_table_exists($pdo, $table)) {
            continue;
        }
        $col = $table === 'learning_categories' ? 'updated_at' : 'updated_at';
        $value = (int) $pdo->query("SELECT COALESCE(MAX($col), 0) FROM $table")->fetchColumn();
        if ($value > $updated) {
            $updated = $value;
        }
    }
    return $updated;
}

/** @return array<string, mixed>|null */
function learning_store_load_jurnal(PDO $pdo): ?array
{
    return learning_store_load_paid_category($pdo, 'jurnal');
}

/** @return array<string, mixed>|null */
function learning_store_load_ulumul(PDO $pdo): ?array
{
    $category = learning_store_load_paid_category($pdo, 'ulumul-quran');
    if ($category === null) {
        return null;
    }
    if (!function_exists('cms_merge_paid_category_from_cms_section')) {
        require_once __DIR__ . '/cms/bootstrap.php';
    }

    return cms_merge_paid_category_from_cms_section($pdo, 'ulumul', $category);
}

/** @return array<string, mixed>|null */
function learning_store_load_paid_category(PDO $pdo, string $categoryId): ?array
{
    learning_store_import_from_cms_json_if_empty($pdo);

    $stmt = $pdo->prepare('SELECT * FROM learning_categories WHERE id = :id');
    $stmt->execute(['id' => $categoryId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    return learning_store_category_row_to_array($pdo, $row);
}

/** @return list<array<string, mixed>> */
function learning_store_load_articles_for_category(
    PDO $pdo,
    string $categoryId,
    bool $listOnly = false,
): array {
    $artStmt = $pdo->prepare(
        'SELECT * FROM learning_articles WHERE category_id = :cid ORDER BY sort_order ASC, id ASC',
    );
    $artStmt->execute(['cid' => $categoryId]);

    $articles = [];
    while ($art = $artStmt->fetch(PDO::FETCH_ASSOC)) {
        $row = learning_store_article_row_to_array($pdo, $art);
        $articles[] = $listOnly ? learning_store_strip_article_for_list($row) : $row;
    }

    return $articles;
}

/** @param array<string, mixed> $row */
function learning_store_category_row_to_array(PDO $pdo, array $row): array
{
    $categoryId = (string) $row['id'];
    $articles = learning_store_load_articles_for_category($pdo, $categoryId);

    return [
        'id' => $categoryId,
        'title' => (string) $row['title'],
        'subtitle' => (string) $row['subtitle'],
        'description' => (string) $row['description'],
        'articles' => $articles,
        'articleCount' => count($articles),
    ];
}

/** Hapus isi panjang untuk daftar/katalog (lazy-load detail terpisah). */
function learning_store_strip_article_for_list(array $article): array
{
    unset($article['body']);
    if (!isset($article['chapters']) || !is_array($article['chapters'])) {
        return $article;
    }

    $article['chapters'] = array_values(array_map(
        static function (mixed $chapter): mixed {
            if (!is_array($chapter)) {
                return $chapter;
            }
            unset($chapter['body']);

            return $chapter;
        },
        $article['chapters'],
    ));

    return $article;
}

/** @param list<array<string, mixed>> $articles
 * @return list<array<string, mixed>> */
function learning_store_articles_for_list(array $articles): array
{
    $out = [];
    foreach ($articles as $article) {
        if (!is_array($article)) {
            continue;
        }
        $out[] = learning_store_strip_article_for_list($article);
    }

    return $out;
}

/** @return array<string, mixed>|null */
function learning_store_apply_cms_coin_to_article(PDO $pdo, array $article, string $categoryId): array
{
    if (!in_array($categoryId, ['ulumul-quran', 'jurnal'], true)) {
        return $article;
    }

    $articleId = (string) ($article['id'] ?? '');
    if ($articleId === '') {
        return $article;
    }

    $sectionKey = $categoryId === 'ulumul-quran' ? 'ulumul' : 'jurnal';
    if (!function_exists('cms_get_section')) {
        $cmsBootstrap = __DIR__ . '/cms/bootstrap.php';
        if (!is_file($cmsBootstrap)) {
            return $article;
        }
        require_once $cmsBootstrap;
    }

    try {
        $section = cms_get_section($sectionKey, $pdo);
    } catch (Throwable) {
        return $article;
    }

    if (!is_array($section)) {
        return $article;
    }

    foreach ((array) ($section['articles'] ?? []) as $src) {
        if (!is_array($src) || (string) ($src['id'] ?? '') !== $articleId) {
            continue;
        }
        if ((int) ($article['coinPrice'] ?? 0) <= 0 && (int) ($src['coinPrice'] ?? 0) > 0) {
            $article['coinPrice'] = (int) $src['coinPrice'];
        }
        if ((int) ($article['priceIdr'] ?? 0) <= 0 && (int) ($src['priceIdr'] ?? 0) > 0) {
            $article['priceIdr'] = (int) $src['priceIdr'];
        }
        break;
    }

    $articleCoin = (int) ($article['coinPrice'] ?? 0);
    if ($articleCoin <= 0 || !isset($article['chapters']) || !is_array($article['chapters'])) {
        return $article;
    }

    $chapterCount = max(1, count($article['chapters']));
    foreach ($article['chapters'] as $idx => $chapterRow) {
        if (!is_array($chapterRow)) {
            continue;
        }
        if ((int) ($chapterRow['coinPrice'] ?? 0) <= 0) {
            $article['chapters'][$idx]['coinPrice'] = max(1, (int) round($articleCoin / $chapterCount));
        }
    }

    return $article;
}

function learning_store_load_article_detail_by_id(PDO $pdo, string $articleId): ?array
{
    $articleId = trim($articleId);
    if ($articleId === '' || !app_table_exists($pdo, 'learning_articles')) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT * FROM learning_articles WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $articleId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    $article = learning_store_article_row_to_array($pdo, $row);
    $categoryId = (string) ($row['category_id'] ?? '');

    return learning_store_apply_cms_coin_to_article($pdo, $article, $categoryId);
}

/** @param array<string, mixed> $row */
function learning_store_article_row_to_array(PDO $pdo, array $row): array
{
    $articleId = (string) $row['id'];
    $categoryId = (string) ($row['category_id'] ?? '');
    $out = [
        'id' => $articleId,
        'title' => (string) $row['title'],
        'summary' => (string) $row['summary'],
        'readMinutes' => (int) $row['read_minutes'],
        'body' => (string) $row['body'],
    ];

    if ($row['coin_price'] !== null && $row['coin_price'] !== '' && (int) $row['coin_price'] > 0) {
        $out['coinPrice'] = (int) $row['coin_price'];
    } elseif (!learning_store_is_kajian_coin_category($categoryId)
        && $row['price_idr'] !== null && $row['price_idr'] !== '') {
        $out['coinPrice'] = max(5, (int) round((int) $row['price_idr'] / 2000));
    }
    if ($row['price_idr'] !== null && $row['price_idr'] !== '') {
        $out['priceIdr'] = (int) $row['price_idr'];
    }
    if ($row['preview'] !== null && $row['preview'] !== '') {
        $out['preview'] = (string) $row['preview'];
    }
    $contentType = $row['content_type'] ?? null;
    if ($contentType === 'jurnal' || $contentType === 'buku') {
        $out['contentType'] = $contentType;
    }
    if ($row['page_count'] !== null) {
        $out['pageCount'] = (int) $row['page_count'];
    }
    if (!empty($row['cover_image'])) {
        $out['coverImage'] = (string) $row['cover_image'];
    }

    $chStmt = $pdo->prepare(
        'SELECT * FROM learning_chapters WHERE article_id = :aid ORDER BY sort_order ASC, chapter_number ASC',
    );
    $chStmt->execute(['aid' => $articleId]);
    $chapters = [];
    while ($ch = $chStmt->fetch(PDO::FETCH_ASSOC)) {
        $row = [
            'id' => (string) $ch['id'],
            'number' => (int) $ch['chapter_number'],
            'title' => (string) $ch['title'],
            'summary' => (string) $ch['summary'],
            'readMinutes' => (int) $ch['read_minutes'],
            'body' => (string) $ch['body'],
        ];
        if ($ch['coin_price'] !== null && $ch['coin_price'] !== '' && (int) $ch['coin_price'] > 0) {
            $row['coinPrice'] = (int) $ch['coin_price'];
        }
        $chapters[] = $row;
    }
    if ($chapters !== []) {
        $articleCoin = (int) ($out['coinPrice'] ?? 0);
        if ($articleCoin > 0) {
            $chapterCount = max(1, count($chapters));
            foreach ($chapters as $idx => $chapterRow) {
                if ((int) ($chapterRow['coinPrice'] ?? 0) <= 0) {
                    $chapters[$idx]['coinPrice'] = max(1, (int) round($articleCoin / $chapterCount));
                }
            }
        }
        $out['chapters'] = $chapters;
    }

    return $out;
}

/**
 * Cari artikel di sumber CMS (ulumul, jurnal, learning) untuk sinkronisasi pembelian coin.
 *
 * @return array{categoryId: string, category: array<string, mixed>, article: array<string, mixed>, sortOrder: int}|null
 */
function learning_store_find_article_in_cms_sources(string $articleId): ?array
{
    $articleId = trim($articleId);
    if ($articleId === '') {
        return null;
    }

    $cmsBootstrap = dirname(__DIR__) . '/cms/bootstrap.php';
    if (!is_file($cmsBootstrap)) {
        return null;
    }
    require_once $cmsBootstrap;

    $scanCategory = static function (array $category) use ($articleId): ?array {
        $categoryId = (string) ($category['id'] ?? '');
        if ($categoryId === '') {
            return null;
        }
        $articles = is_array($category['articles'] ?? null) ? $category['articles'] : [];
        $sort = 0;
        foreach ($articles as $article) {
            if (!is_array($article)) {
                continue;
            }
            if ((string) ($article['id'] ?? '') === $articleId) {
                return [
                    'categoryId' => $categoryId,
                    'category' => $category,
                    'article' => $article,
                    'sortOrder' => $sort,
                ];
            }
            $sort++;
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
            $hit = $scanCategory($payload);
            if ($hit !== null) {
                return $hit;
            }
        }

        foreach ([cms_resolve_ulumul($pdo), cms_resolve_jurnal($pdo)] as $category) {
            if (!is_array($category)) {
                continue;
            }
            $hit = $scanCategory($category);
            if ($hit !== null) {
                return $hit;
            }
        }
    } catch (Throwable) {
        /* lanjut ke section learning */
    }

    $learning = cms_get_section('learning');
    if (is_array($learning)) {
        foreach ($learning as $category) {
            if (!is_array($category)) {
                continue;
            }
            $hit = $scanCategory($category);
            if ($hit !== null) {
                return $hit;
            }
        }
    }

    return null;
}

/** @param array<string, mixed> $article
 * @param array<string, mixed> $chapter */
function learning_store_insert_chapter_row(
    PDO $pdo,
    string $articleId,
    array $article,
    array $chapter,
    int $now,
): void {
    $chapterId = trim((string) ($chapter['id'] ?? ''));
    if ($chapterId === '') {
        return;
    }

    $chapters = is_array($article['chapters'] ?? null) ? $article['chapters'] : [];
    $chapterCoin = (int) ($chapter['coinPrice'] ?? 0);
    if ($chapterCoin <= 0) {
        $articleCoin = (int) ($article['coinPrice'] ?? 0);
        $chapterCount = max(1, count($chapters));
        if ($articleCoin > 0) {
            $chapterCoin = max(1, (int) round($articleCoin / $chapterCount));
        }
    }

    $sortStmt = $pdo->prepare(
        'SELECT COALESCE(MAX(sort_order), -1) FROM learning_chapters WHERE article_id = :aid',
    );
    $sortStmt->execute(['aid' => $articleId]);
    $sortOrder = (int) $sortStmt->fetchColumn() + 1;

    $params = [
        'article_id' => $articleId,
        'id' => $chapterId,
        'chapter_number' => max(1, (int) ($chapter['number'] ?? ($sortOrder + 1))),
        'title' => (string) ($chapter['title'] ?? ''),
        'summary' => (string) ($chapter['summary'] ?? ''),
        'body' => (string) ($chapter['body'] ?? ''),
        'read_minutes' => max(1, (int) ($chapter['readMinutes'] ?? 5)),
        'coin_price' => $chapterCoin > 0 ? $chapterCoin : null,
        'sort_order' => $sortOrder,
        'updated_at' => $now,
    ];

    try {
        if (app_db_is_mysql()) {
            $pdo->prepare(
                'INSERT INTO learning_chapters (
                    article_id, id, chapter_number, title, summary, body, read_minutes, coin_price, sort_order, updated_at
                ) VALUES (
                    :article_id, :id, :chapter_number, :title, :summary, :body, :read_minutes, :coin_price, :sort_order, :updated_at
                )
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    coin_price = COALESCE(VALUES(coin_price), coin_price),
                    updated_at = VALUES(updated_at)',
            )->execute($params);
        } else {
            $pdo->prepare(
                'INSERT OR IGNORE INTO learning_chapters (
                    article_id, id, chapter_number, title, summary, body, read_minutes, coin_price, sort_order, updated_at
                ) VALUES (
                    :article_id, :id, :chapter_number, :title, :summary, :body, :read_minutes, :coin_price, :sort_order, :updated_at
                )',
            )->execute($params);
        }
    } catch (Throwable) {
        /* baris mungkin sudah ada */
    }
}

/** Sinkronkan satu artikel (dan bab) ke tabel learning_* sebelum pembelian coin. */
function learning_store_ensure_coin_purchase_index(PDO $pdo, string $articleId, ?string $chapterId = null): void
{
    $articleId = trim($articleId);
    if ($articleId === '') {
        return;
    }

    $chapterId = $chapterId !== null ? trim($chapterId) : '';

    $rowStmt = $pdo->prepare('SELECT 1 FROM learning_articles WHERE id = :id LIMIT 1');
    $rowStmt->execute(['id' => $articleId]);
    $hasArticle = (bool) $rowStmt->fetchColumn();

    if ($hasArticle && $chapterId === '') {
        return;
    }

    if ($hasArticle && $chapterId !== '') {
        $chStmt = $pdo->prepare(
            'SELECT 1 FROM learning_chapters WHERE article_id = :aid AND id = :cid LIMIT 1',
        );
        $chStmt->execute(['aid' => $articleId, 'cid' => $chapterId]);
        if ($chStmt->fetchColumn()) {
            return;
        }

        $found = learning_store_find_article_in_cms_sources($articleId);
        if ($found !== null) {
            $now = time();
            foreach ((array) ($found['article']['chapters'] ?? []) as $chapter) {
                if (!is_array($chapter) || (string) ($chapter['id'] ?? '') !== $chapterId) {
                    continue;
                }
                learning_store_insert_chapter_row($pdo, $articleId, $found['article'], $chapter, $now);

                return;
            }
        }

        return;
    }

    $found = learning_store_find_article_in_cms_sources($articleId);
    if ($found === null) {
        return;
    }

    $now = time();
    learning_store_upsert_category_meta($pdo, $found['category'], 0, $now);
    learning_store_upsert_article_row(
        $pdo,
        $found['categoryId'],
        $found['article'],
        $found['sortOrder'],
        $now,
    );
}

/** @return list<string> */
function learning_store_canonical_ulumul_article_ids(): array
{
    return ['pengertian-ulum', 'asbabun-nuzul', 'makki-madani'];
}

function learning_store_default_json_path(): string
{
    return __DIR__ . '/cms/data/default-content.json';
}

/** @return array<string, mixed>|null */
function learning_store_category_from_default_json(string $categoryId): ?array
{
    $path = learning_store_default_json_path();
    if (!is_file($path)) {
        return null;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded)) {
        return null;
    }

    $learning = $decoded['learning'] ?? null;
    if (!is_array($learning)) {
        return null;
    }

    foreach ($learning as $category) {
        if (is_array($category) && ($category['id'] ?? '') === $categoryId) {
            return $category;
        }
    }

    return null;
}

/** Impor ulang satu kategori dari default-content.json (ganti artikel lama). */
function learning_store_sync_category_from_default(PDO $pdo, string $categoryId): bool
{
    $category = learning_store_category_from_default_json($categoryId);
    if ($category === null) {
        return false;
    }

    $now = time();

    if (learning_store_uses_cms_json_storage($categoryId)) {
        $learning = learning_store_get_learning_section($pdo);
        $index = learning_store_find_category_index($learning, $categoryId);
        if ($index !== null) {
            $learning[$index] = $category;
        } else {
            $learning[] = $category;
        }
        learning_store_save_learning_section($pdo, $learning, $now);

        return true;
    }

    $sortStmt = $pdo->prepare('SELECT sort_order FROM learning_categories WHERE id = :id LIMIT 1');
    $sortStmt->execute(['id' => $categoryId]);
    $sortOrder = $sortStmt->fetchColumn();
    $sortOrder = $sortOrder !== false ? (int) $sortOrder : 2;

    learning_store_upsert_category($pdo, $category, $sortOrder, $now);

    return true;
}

/** Kajian hanya di JSON — jangan timpa section `learning` dari tabel relasional. */
function learning_store_persist_cms_learning_section(PDO $pdo, int $now): void
{
    unset($pdo, $now);
}

/** Sinkron materi Ulumul berbayar — 3 jurnal dari default-content.json. */
function learning_store_sync_ulumul_from_default(PDO $pdo): bool
{
    learning_store_fix_chapters_pk_mysql($pdo);

    $synced = learning_store_sync_category_from_default($pdo, 'ulumul-quran');
    if (!$synced) {
        return false;
    }

    learning_store_persist_cms_learning_section($pdo, time());

    return true;
}
