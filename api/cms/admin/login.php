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

if (app_is_production() && app_cms_password_is_weak() && !app_is_local_request()) {
    cms_error('Password CMS masih default. Set CMS_ADMIN_PASSWORD di server (api/config.local.php).', 503);
}

cms_enforce_login_rate_limit();

if (!cms_verify_login($username, $password)) {
    cms_error('Login gagal. Periksa username/password.', 401);
}

cms_clear_login_rate_limit();

$token = cms_create_session();

cms_json([
    'ok' => true,
    'token' => $token,
    'expiresIn' => cms_session_ttl(),
    'username' => cms_admin_user(),
]);
