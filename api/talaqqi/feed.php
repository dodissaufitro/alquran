<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$since = isset($_GET['since']) ? (int) $_GET['since'] : null;
$authorEmail = isset($_GET['email']) ? trim((string) $_GET['email']) : null;
if ($authorEmail === '') {
    $authorEmail = null;
}
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

try {
    $feed = talaqqi_fetch_feed($since, $authorEmail, $page, $limit);
    talaqqi_json_response([
        'ok' => true,
        'items' => $feed['items'],
        'total' => $feed['total'],
        'page' => $feed['page'],
        'limit' => $feed['limit'],
        'totalPages' => $feed['totalPages'],
        'serverTime' => time() * 1000,
    ]);
} catch (Throwable $e) {
    talaqqi_error($e->getMessage(), 503);
}
