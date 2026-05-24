<?php
declare(strict_types=1);

/**
 * Materi kajian — penyimpanan relasional MySQL/SQLite (kategori, artikel, bab).
 */

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
}

/** Perbaiki skema lama (PK hanya `id`) agar bab unik per artikel. */
function learning_store_fix_chapters_pk_mysql(PDO $pdo): void
{
    if (!app_table_exists($pdo, 'learning_chapters')) {
        return;
    }

    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = \'learning_chapters\'
           AND column_name = \'id\' AND column_key = \'PRI\'',
    );
    $stmt->execute();
    $idAlonePk = (int) $stmt->fetchColumn() > 0;

    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.table_constraints
         WHERE table_schema = DATABASE() AND table_name = \'learning_chapters\'
           AND constraint_type = \'PRIMARY KEY\'',
    );
    $stmt->execute();
    if (!$idAlonePk) {
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
    if ($row) {
        $learning = json_decode((string) $row['payload'], true);
        if (is_array($learning) && $learning !== []) {
            learning_store_save_learning_list($pdo, $learning, $now);
        }
    }

    $stmt = $pdo->prepare("SELECT payload FROM $table WHERE section_key = 'jurnal'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $jurnal = json_decode((string) $row['payload'], true);
        if (is_array($jurnal) && ($jurnal['id'] ?? '') === 'jurnal') {
            learning_store_save_jurnal_category($pdo, $jurnal, $now);
        }
    }
}

/**
 * @param list<mixed> $categories
 */
function learning_store_save_learning_list(PDO $pdo, array $categories, int $now): void
{
    $pdo->beginTransaction();
    try {
        learning_store_delete_category_tree($pdo, 'jurnal', true);

        $sort = 0;
        foreach ($categories as $cat) {
            if (!is_array($cat)) {
                continue;
            }
            $id = trim((string) ($cat['id'] ?? ''));
            if ($id === '' || $id === 'jurnal') {
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
    $pdo->beginTransaction();
    try {
        learning_store_delete_category_tree($pdo, 'jurnal', false);
        learning_store_upsert_category($pdo, $category, 0, $now);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
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

/** @param array<string, mixed> $article */
function learning_store_insert_article(PDO $pdo, string $categoryId, array $article, int $sortOrder, int $now): void
{
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
        'price_idr' => isset($article['priceIdr']) ? (int) $article['priceIdr'] : null,
        'preview' => isset($article['preview']) ? (string) $article['preview'] : null,
        'content_type' => $contentType,
        'page_count' => isset($article['pageCount']) ? (int) $article['pageCount'] : null,
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
                    preview = :preview,
                    content_type = :content_type,
                    page_count = :page_count,
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
            price_idr, preview, content_type, page_count, sort_order, updated_at
        ) VALUES (
            :id, :category_id, :title, :summary, :body, :read_minutes,
            :price_idr, :preview, :content_type, :page_count, :sort_order, :updated_at
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

        $pdo->prepare(
            'INSERT INTO learning_chapters (
                article_id, id, chapter_number, title, summary, body, read_minutes, sort_order, updated_at
            ) VALUES (
                :article_id, :id, :chapter_number, :title, :summary, :body, :read_minutes, :sort_order, :updated_at
            )',
        )->execute([
            'article_id' => $articleId,
            'id' => $chapterId,
            'chapter_number' => max(1, (int) ($chapter['number'] ?? 1)),
            'title' => (string) ($chapter['title'] ?? ''),
            'summary' => (string) ($chapter['summary'] ?? ''),
            'body' => (string) ($chapter['body'] ?? ''),
            'read_minutes' => max(1, (int) ($chapter['readMinutes'] ?? 5)),
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
        return learning_store_load_categories_with_articles($pdo, ['jurnal', 'talaqqi-fatihah']);
    }

    $stmt = $pdo->query(
        'SELECT * FROM learning_categories WHERE id != \'jurnal\' ORDER BY sort_order ASC, id ASC',
    );
    $categories = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categories[] = learning_store_category_row_to_array($pdo, $row);
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
    learning_store_import_from_cms_json_if_empty($pdo);

    $stmt = $pdo->prepare('SELECT * FROM learning_categories WHERE id = :id');
    $stmt->execute(['id' => 'jurnal']);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    return learning_store_category_row_to_array($pdo, $row);
}

/** @return list<array<string, mixed>> */
function learning_store_load_articles_for_category(PDO $pdo, string $categoryId): array
{
    $artStmt = $pdo->prepare(
        'SELECT * FROM learning_articles WHERE category_id = :cid ORDER BY sort_order ASC, id ASC',
    );
    $artStmt->execute(['cid' => $categoryId]);

    $articles = [];
    while ($art = $artStmt->fetch(PDO::FETCH_ASSOC)) {
        $articles[] = learning_store_article_row_to_array($pdo, $art);
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

/** @param array<string, mixed> $row */
function learning_store_article_row_to_array(PDO $pdo, array $row): array
{
    $articleId = (string) $row['id'];
    $out = [
        'id' => $articleId,
        'title' => (string) $row['title'],
        'summary' => (string) $row['summary'],
        'readMinutes' => (int) $row['read_minutes'],
        'body' => (string) $row['body'],
    ];

    if ($row['price_idr'] !== null) {
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

    $chStmt = $pdo->prepare(
        'SELECT * FROM learning_chapters WHERE article_id = :aid ORDER BY sort_order ASC, chapter_number ASC',
    );
    $chStmt->execute(['aid' => $articleId]);
    $chapters = [];
    while ($ch = $chStmt->fetch(PDO::FETCH_ASSOC)) {
        $chapters[] = [
            'id' => (string) $ch['id'],
            'number' => (int) $ch['chapter_number'],
            'title' => (string) $ch['title'],
            'summary' => (string) $ch['summary'],
            'readMinutes' => (int) $ch['read_minutes'],
            'body' => (string) $ch['body'],
        ];
    }
    if ($chapters !== []) {
        $out['chapters'] = $chapters;
    }

    return $out;
}
