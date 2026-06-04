<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    cms_error('Method not allowed.', 405);
}

$categoryId = isset($_GET['categoryId']) ? trim((string) $_GET['categoryId']) : '';
$articleId = isset($_GET['articleId']) ? trim((string) $_GET['articleId']) : '';

$payload = cms_public_learning_article_detail_payload($categoryId, $articleId);
if (empty($payload['ok'])) {
    cms_error((string) ($payload['error'] ?? 'Artikel tidak ditemukan.'), 404);
}

cms_json_public($payload);
