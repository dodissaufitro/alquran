<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../bootstrap.php';

function google_auth_json(mixed $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function google_auth_error(string $message, int $code = 400): void
{
    google_auth_json(['ok' => false, 'error' => $message], $code);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $clientId = app_env('GOOGLE_CLIENT_ID') ?: '';
    $clientSecret = app_env('GOOGLE_CLIENT_SECRET') ?: '';
    google_auth_json([
        'ok' => true,
        'service' => 'google-token',
        'method' => 'POST',
        'hint' => 'Endpoint aktif. Login APK memanggil POST dengan code + codeVerifier.',
        'config' => [
            'googleClientId' => $clientId !== '',
            'googleClientSecret' => $clientSecret !== '',
        ],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    google_auth_error('Method not allowed. Gunakan POST (login APK) atau GET (cek status).', 405);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    google_auth_error('Body JSON tidak valid.');
}

$code = trim((string) ($data['code'] ?? ''));
$codeVerifier = trim((string) ($data['codeVerifier'] ?? ''));
$redirectUri = trim((string) ($data['redirectUri'] ?? ''));

if ($code === '' || $codeVerifier === '' || $redirectUri === '') {
    google_auth_error('code, codeVerifier, dan redirectUri wajib diisi.');
}

$allowedRedirects = app_allowed_oauth_redirects();
if (!in_array($redirectUri, $allowedRedirects, true)) {
    google_auth_error('redirectUri tidak diizinkan.');
}

$clientId = app_env('GOOGLE_CLIENT_ID') ?: '';
$clientSecret = app_env('GOOGLE_CLIENT_SECRET') ?: '';

if ($clientId === '' || $clientSecret === '') {
    google_auth_error(
        'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET belum diset di file .env.',
        503,
    );
}

$ch = curl_init('https://oauth2.googleapis.com/token');
if ($ch === false) {
    google_auth_error('Tidak dapat menghubungi Google.', 502);
}

$postFields = http_build_query([
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'code' => $code,
    'code_verifier' => $codeVerifier,
    'redirect_uri' => $redirectUri,
    'grant_type' => 'authorization_code',
]);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postFields,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_TIMEOUT => 30,
]);

$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $httpCode < 200 || $httpCode >= 300) {
    $body = json_decode($response !== false ? $response : '', true);
    $msg = is_array($body) && isset($body['error_description'])
        ? (string) $body['error_description']
        : 'Gagal menukar kode Google.';
    google_auth_error($msg, 502);
}

$token = json_decode($response, true);
if (!is_array($token) || empty($token['access_token'])) {
    google_auth_error('Token Google tidak valid.', 502);
}

google_auth_json([
    'ok' => true,
    'accessToken' => (string) $token['access_token'],
    'expiresIn' => (int) ($token['expires_in'] ?? 0),
]);
