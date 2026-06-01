<?php
declare(strict_types=1);

/**
 * Simpan sesi login web singkat → deep link pendek ke APK.
 * POST JSON { "credential": "<Google JWT>" } → { "ok": true, "bridge": "..." }
 */
require_once __DIR__ . '/../bootstrap.php';

$appOrigin = app_origin();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: ' . $appOrigin);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require __DIR__ . '/apk-bridge-lib.php';

header('Access-Control-Allow-Origin: ' . $appOrigin);

$raw = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);
$credential = is_array($body) ? trim((string) ($body['credential'] ?? '')) : '';

if ($credential === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'credential wajib']);
    exit;
}

$payload = apk_bridge_decode_jwt_payload($credential);
if ($payload === null) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Token Google tidak valid']);
    exit;
}

$exp = (int) ($payload['exp'] ?? 0);
if ($exp > 0 && $exp < time()) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Token Google kedaluwarsa']);
    exit;
}

$email = trim((string) ($payload['email'] ?? ''));
if ($email === '' || !str_contains($email, '@')) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email tidak ditemukan di token']);
    exit;
}

$name = trim((string) ($payload['name'] ?? $payload['given_name'] ?? $email));
$picture = trim((string) ($payload['picture'] ?? ''));

try {
    $bridge = apk_bridge_create([
        'credential' => $credential,
        'email' => $email,
        'name' => $name,
        'picture' => $picture !== '' ? $picture : null,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Gagal membuat sesi bridge']);
    exit;
}

echo json_encode([
    'ok' => true,
    'bridge' => $bridge,
    'returnUrl' => $appOrigin . '/api/auth/apk-return.php?bridge=' . rawurlencode($bridge),
]);
