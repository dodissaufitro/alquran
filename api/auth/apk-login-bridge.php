<?php
declare(strict_types=1);

/**
 * Simpan sesi login web singkat → deep link pendek ke APK.
 * POST JSON { "credential": "<Google JWT>" } → { "ok": true, "bridge": "..." }
 */
require_once __DIR__ . '/../bootstrap-lite.php';

$appOrigin = app_origin();

app_send_cors_headers('POST, OPTIONS');

if (app_is_options_request()) {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require __DIR__ . '/apk-bridge-lib.php';

$raw = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);
$credential = is_array($body) ? trim((string) ($body['credential'] ?? '')) : '';

if ($credential === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'credential wajib']);
    exit;
}

$verified = google_verify_id_token($credential);
if ($verified === null) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Token Google tidak valid']);
    exit;
}

$email = $verified['email'];
$name = $verified['name'];
$picture = $verified['picture'] ?? '';

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
