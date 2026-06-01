<?php
declare(strict_types=1);

require_once __DIR__ . '/auth-bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_error('Method not allowed.', 405);
}

$data = auth_read_json();
$login = trim((string) ($data['email'] ?? $data['login'] ?? $data['username'] ?? ''));
$password = (string) ($data['password'] ?? '');

if ($login === '') {
    auth_error('Email wajib diisi.');
}
$passwordErr = auth_validate_password($password);
if ($passwordErr !== null) {
    auth_error($passwordErr);
}

$pdo = app_db();
$row = auth_find_by_login($pdo, $login);
if ($row === null || empty($row['password_hash'])) {
    auth_error('Email atau password salah.', 401);
}

if (!password_verify($password, (string) $row['password_hash'])) {
    auth_error('Email atau password salah.', 401);
}

$now = time();
$upd = $pdo->prepare(
    'UPDATE users SET last_login_at = :last_login_at, updated_at = :updated_at WHERE email = :email',
);
$upd->execute([
    'last_login_at' => $now,
    'updated_at' => $now,
    'email' => $row['email'],
]);

$publicUser = auth_user_row_to_public($row);
$_SESSION['user'] = $publicUser;

auth_json([
    'ok' => true,
    'user' => $publicUser,
]);
