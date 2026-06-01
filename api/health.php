<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap-lite.php';

app_send_cors_headers('GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (app_is_options_request()) {
    http_response_code(204);
    exit;
}

echo json_encode([
    'ok' => true,
    'service' => 'talaqee-api',
    'origin' => app_origin(),
    'php' => PHP_VERSION,
    'time' => time(),
], JSON_UNESCAPED_UNICODE);
