<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$since = isset($_GET['since']) ? (int) $_GET['since'] : null;
$authorEmail = isset($_GET['email']) ? trim((string) $_GET['email']) : null;
if ($authorEmail === '') {
    $authorEmail = null;
}
$items = talaqqi_fetch_feed($since, $authorEmail);

talaqqi_json_response([
    'ok' => true,
    'items' => $items,
    'serverTime' => time() * 1000,
]);
