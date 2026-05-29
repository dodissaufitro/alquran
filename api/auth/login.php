<?php
declare(strict_types=1);

require __DIR__ . '/auth-bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_error('Method not allowed.', 405);
}

$data = auth_read_json();
$username = auth_normalize_username((string) ($data['username'] ?? ''));
$password = (string) ($data['password'] ?? '');

$usernameErr = auth_validate_username($username);
if ($usernameErr !== null) {
    auth_error($usernameErr);
}
$passwordErr = auth_validate_password($password);
if ($passwordErr !== null) {
    auth_error($passwordErr);
}

$pdo = app_db();
$row = auth_find_by_username($pdo, $username);
if ($row === null || empty($row['password_hash'])) {
    auth_error('Username atau password salah.', 401);
}

if (!password_verify($password, (string) $row['password_hash'])) {
    auth_error('Username atau password salah.', 401);
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

auth_json([
    'ok' => true,
    'user' => auth_user_row_to_public($row),
]);
