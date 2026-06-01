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
if ($categoryId !== '') {
    $payload = cms_public_learning_category_payload($categoryId);
    if (empty($payload['ok'])) {
        cms_error((string) ($payload['error'] ?? 'Kategori tidak ditemukan.'), 404);
    }
    cms_json($payload);
}

cms_json(cms_public_learning_payload());
