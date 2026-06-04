<?php
declare(strict_types=1);

require_once __DIR__ . '/auth-bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_error('Method not allowed.', 405);
}

$token = null;
$header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if (preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
    $token = $matches[1];
}

try {
    $pdo = app_db();
    require_once __DIR__ . '/user-api-auth.php';
    $email = $token !== null ? user_api_email_for_token($pdo, $token) : null;
    if ($email === null && !empty($_SESSION['user']['email'])) {
        $email = auth_normalize_email((string) $_SESSION['user']['email']);
    }
    if ($email !== null && $email !== '') {
        $stmt = $pdo->prepare(
            'UPDATE users SET api_token_hash = NULL, updated_at = :updated_at WHERE email = :email',
        );
        $stmt->execute(['email' => $email, 'updated_at' => time()]);
    }
} catch (Throwable $e) {
    error_log('[auth/logout] revoke token: ' . $e->getMessage());
}

// Hapus isi session
$_SESSION = [];

// Hapus cookie session jika ada
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Hancurkan session
session_destroy();

auth_json([
    'ok' => true,
    'message' => 'Session successfully destroyed.',
]);
