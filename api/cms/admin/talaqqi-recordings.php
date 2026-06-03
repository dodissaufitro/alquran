<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../../talaqqi/bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

cms_require_auth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int) $_GET['limit'])) : 50;
    $authorEmail = isset($_GET['email']) ? trim((string) $_GET['email']) : null;
    if ($authorEmail === '') {
        $authorEmail = null;
    }

    try {
        $feed = talaqqi_fetch_feed(null, $authorEmail, $page, $limit);
        cms_json([
            'ok' => true,
            'items' => $feed['items'],
            'total' => $feed['total'],
            'page' => $feed['page'],
            'limit' => $feed['limit'],
            'totalPages' => $feed['totalPages'],
        ]);
    } catch (Throwable $e) {
        cms_error($e->getMessage(), 503);
    }
}

if ($method === 'DELETE') {
    $body = cms_read_json_body();
    $id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));
    if ($id === '') {
        cms_error('Parameter id wajib.', 400);
    }

    try {
        talaqqi_admin_purge_recording($id);
        cms_json(['ok' => true, 'deleted' => $id]);
    } catch (Throwable $e) {
        if ($e instanceof InvalidArgumentException) {
            cms_error($e->getMessage(), 400);
        }
        cms_error($e->getMessage(), 503);
    }
}

cms_error('Method not allowed.', 405);
