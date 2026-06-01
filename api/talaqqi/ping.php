<?php
declare(strict_types=1);

/**
 * Health ringan — tanpa database (untuk cek routing / Docker).
 */
require_once __DIR__ . '/../bootstrap.php';

app_send_cors_headers('GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

echo json_encode([
    'ok' => true,
    'service' => app_service_id('talaqqi-ping'),
    'serverTime' => (int) (microtime(true) * 1000),
], JSON_UNESCAPED_UNICODE);
