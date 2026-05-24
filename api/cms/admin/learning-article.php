<?php
declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['PUT', 'POST', 'DELETE'], true)) {
    cms_error('Method not allowed.', 405);
}

cms_require_auth();

$pdo = cms_db();
$now = time();

if ($method === 'DELETE') {
    $articleId = trim((string) ($_GET['articleId'] ?? ''));
    if ($articleId === '') {
        cms_error('Parameter articleId wajib.', 400);
    }

    try {
        learning_store_delete_single_article($pdo, $articleId, $now);
    } catch (InvalidArgumentException $e) {
        cms_error($e->getMessage(), 404);
    }

    cms_json(['ok' => true, 'deleted' => $articleId]);
}

$body = cms_read_json_body();
$categoryId = trim((string) ($body['categoryId'] ?? ''));
$article = $body['article'] ?? null;
$sortOrder = (int) ($body['sortOrder'] ?? 0);
$categoryMeta = $body['category'] ?? null;
$previousArticleId = trim((string) ($body['previousArticleId'] ?? ''));
if ($previousArticleId === '') {
    $previousArticleId = null;
}

if ($categoryId === '') {
    cms_error('Field categoryId wajib.', 400);
}
if (!is_array($article)) {
    cms_error('Field article wajib (objek).', 400);
}
if ($categoryMeta !== null && !is_array($categoryMeta)) {
    cms_error('Field category harus objek jika dikirim.', 400);
}

try {
    learning_store_upsert_single_article(
        $pdo,
        $categoryId,
        $article,
        $sortOrder,
        $now,
        is_array($categoryMeta) ? $categoryMeta : null,
        $previousArticleId,
    );
} catch (InvalidArgumentException $e) {
    cms_error($e->getMessage(), 400);
}

cms_json([
    'ok' => true,
    'categoryId' => $categoryId,
    'articleId' => (string) ($article['id'] ?? ''),
    'updated' => $previousArticleId !== null,
    'table' => 'learning_articles',
]);
