<?php
declare(strict_types=1);

require_once __DIR__ . '/auth-bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_error('Method not allowed.', 405);
}

$data = auth_read_json();
$username = auth_normalize_username((string) ($data['username'] ?? ''));
$password = (string) ($data['password'] ?? '');
$name = trim((string) ($data['name'] ?? ''));
$emailRaw = trim((string) ($data['email'] ?? ''));

$usernameErr = auth_validate_username($username);
if ($usernameErr !== null) {
    auth_error($usernameErr);
}
$passwordErr = auth_validate_password($password);
if ($passwordErr !== null) {
    auth_error($passwordErr);
}

if ($name === '') {
    auth_error('Nama wajib diisi.');
}
if (mb_strlen($name) > 255) {
    $name = mb_substr($name, 0, 255);
}

$pdo = app_db();
if (auth_username_taken($pdo, $username)) {
    auth_error('Username sudah dipakai.', 409);
}

if ($emailRaw !== '') {
    if (!filter_var($emailRaw, FILTER_VALIDATE_EMAIL)) {
        auth_error('Format email tidak valid.');
    }
    $email = strtolower($emailRaw);
    if (mb_strlen($email) > 255) {
        auth_error('Email terlalu panjang.');
    }
    if (auth_email_taken($pdo, $email)) {
        auth_error('Email sudah terdaftar.', 409);
    }
} else {
    $email = auth_internal_email($username);
    if (auth_email_taken($pdo, $email)) {
        auth_error('Username sudah dipakai.', 409);
    }
}

$hash = password_hash($password, PASSWORD_DEFAULT);
if ($hash === false) {
    auth_error('Gagal membuat password.', 500);
}

$now = time();
$params = [
    'email' => $email,
    'username' => $username,
    'name' => $name,
    'picture' => '',
    'provider' => 'local',
    'password_hash' => $hash,
    'created_at' => $now,
    'updated_at' => $now,
    'last_login_at' => $now,
];

$stmt = $pdo->prepare(
    'INSERT INTO users (email, username, name, picture, provider, password_hash, created_at, updated_at, last_login_at)
     VALUES (:email, :username, :name, :picture, :provider, :password_hash, :created_at, :updated_at, :last_login_at)',
);
$stmt->execute($params);

$row = auth_find_by_username($pdo, $username);
if ($row === null) {
    auth_error('Registrasi gagal.', 500);
}

$publicUser = auth_user_row_to_public($row);
$_SESSION['user'] = $publicUser;
auth_touch_session_activity();

$payload = [
    'ok' => true,
    'user' => $publicUser,
];
try {
    require_once __DIR__ . '/user-api-auth.php';
    $payload['apiToken'] = user_api_issue_token($pdo, (string) $row['email']);
} catch (Throwable $e) {
    error_log('[auth/register] api token: ' . $e->getMessage());
}

auth_json($payload);
