<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    cms_error('Method not allowed.', 405);
}

$body = cms_read_json_body();
$username = trim((string) ($body['username'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($username === '' || $password === '') {
    cms_error('Username dan password wajib diisi.', 400);
}

if (!cms_verify_login($username, $password)) {
    cms_error('Login gagal. Periksa username/password.', 401);
}

$token = cms_create_session();

cms_json([
    'ok' => true,
    'token' => $token,
    'expiresIn' => cms_session_ttl(),
    'username' => cms_admin_user(),
]);
