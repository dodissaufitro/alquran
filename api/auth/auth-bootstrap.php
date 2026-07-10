<?php
declare(strict_types=1);

require_once __DIR__ . '/../env.php';
app_load_config();
app_send_cors_headers('POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (app_is_options_request()) {
    http_response_code(204);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/** Sesi PHP: logout otomatis setelah 1 jam tanpa aktivitas */
const AUTH_SESSION_IDLE_SECONDS = 3600;

function auth_enforce_session_idle(): void
{
    if (empty($_SESSION['user'])) {
        return;
    }
    $last = (int) ($_SESSION['last_activity'] ?? 0);
    if ($last === 0) {
        $_SESSION['last_activity'] = time();
        return;
    }
    if (time() - $last > AUTH_SESSION_IDLE_SECONDS) {
        $_SESSION = [];
    }
}

function auth_touch_session_activity(): void
{
    if (!empty($_SESSION['user'])) {
        $_SESSION['last_activity'] = time();
    }
}

auth_enforce_session_idle();

require_once __DIR__ . '/../bootstrap.php';

function auth_json(mixed $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function auth_error(string $message, int $code = 400): void
{
    auth_json(['ok' => false, 'error' => $message], $code);
}

function auth_read_json(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        auth_error('Body JSON tidak valid.');
    }
    return $data;
}

function auth_normalize_username(string $username): string
{
    return strtolower(trim($username));
}

function auth_validate_username(string $username): ?string
{
    if ($username === '') {
        return 'Username wajib diisi.';
    }
    if (strlen($username) < 3 || strlen($username) > 32) {
        return 'Username harus 3–32 karakter.';
    }
    if (!preg_match('/^[a-z0-9_]+$/', $username)) {
        return 'Username hanya huruf kecil, angka, dan underscore.';
    }
    return null;
}

function auth_validate_password(string $password): ?string
{
    if ($password === '') {
        return 'Password wajib diisi.';
    }
    if (strlen($password) < 6) {
        return 'Password minimal 6 karakter.';
    }
    return null;
}

function auth_internal_email(string $username): string
{
    return $username . app_internal_email_suffix();
}

function auth_user_row_to_public(array $row): array
{
    $email = (string) ($row['email'] ?? '');
    $username = (string) ($row['username'] ?? '');
    $suffix = app_internal_email_suffix();
    if ($username === '' && str_ends_with($email, $suffix)) {
        $username = substr($email, 0, -strlen($suffix));
    }

    return [
        'username' => $username,
        'email' => $email,
        'name' => (string) ($row['name'] ?? $username),
        'phone' => (string) ($row['phone'] ?? ''),
        'picture' => (string) ($row['picture'] ?? ''),
        'isSuperAdmin' => (int) ($row['is_super_admin'] ?? 0) === 1,
    ];
}

function auth_find_by_username(PDO $pdo, string $username): ?array
{
    $stmt = $pdo->prepare(
        'SELECT email, username, name, picture, password_hash, is_super_admin
         FROM users WHERE username = :username LIMIT 1',
    );
    $stmt->execute(['username' => $username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function auth_normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function auth_find_by_email(PDO $pdo, string $email): ?array
{
    $email = auth_normalize_email($email);
    if ($email === '') {
        return null;
    }
    $stmt = $pdo->prepare(
        'SELECT email, username, name, picture, password_hash, is_super_admin
         FROM users WHERE email = :email LIMIT 1',
    );
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/** Login identifier: email (jika ada @) atau username */
function auth_find_by_login(PDO $pdo, string $login): ?array
{
    $login = trim($login);
    if ($login === '') {
        return null;
    }
    if (str_contains($login, '@')) {
        return auth_find_by_email($pdo, $login);
    }
    return auth_find_by_username($pdo, auth_normalize_username($login));
}

function auth_username_taken(PDO $pdo, string $username): bool
{
    return auth_find_by_username($pdo, $username) !== null;
}

function auth_email_taken(PDO $pdo, string $email): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    return (bool) $stmt->fetchColumn();
}
