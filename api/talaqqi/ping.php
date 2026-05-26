<?php
declare(strict_types=1);

/**
 * Health ringan — tanpa database (untuk cek routing / Docker).
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

echo json_encode([
    'ok' => true,
    'service' => 'faithfulpath-talaqqi-ping',
    'serverTime' => (int) (microtime(true) * 1000),
], JSON_UNESCAPED_UNICODE);
