<?php
declare(strict_types=1);

/**
 * Autentikasi API pengguna (coin, langganan, dll.).
 * Sesi PHP (login email/password) atau Bearer token (Google / sync user).
 */

require_once __DIR__ . '/auth-bootstrap.php';

function user_api_token_hash(string $token): string
{
    return hash('sha256', $token);
}

function user_api_bearer_token(): ?string
{
    app_restore_authorization_header();

    $header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($header === '' && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (is_array($headers)) {
            $header = (string) ($headers['Authorization'] ?? $headers['authorization'] ?? '');
        }
    }
    if ($header === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            $header = (string) ($headers['Authorization'] ?? $headers['authorization'] ?? '');
        }
    }

    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
        return $matches[1];
    }

    return null;
}

/** Token dari body/query (fallback jika hosting menghapus header Authorization). */
function user_api_sanitize_token(?string $token): ?string
{
    $token = trim((string) $token);
    if ($token === '' || strlen($token) < 32) {
        return null;
    }

    return $token;
}

function user_api_email_for_token(PDO $pdo, string $token): ?string
{
    $token = trim($token);
    if ($token === '' || strlen($token) < 32) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT email FROM users WHERE api_token_hash = :hash LIMIT 1',
    );
    $stmt->execute(['hash' => user_api_token_hash($token)]);
    $email = $stmt->fetchColumn();

    return $email !== false ? auth_normalize_email((string) $email) : null;
}

function user_api_issue_token(PDO $pdo, string $email): string
{
    $email = auth_normalize_email($email);
    $token = bin2hex(random_bytes(32));
    $now = time();
    $stmt = $pdo->prepare(
        'UPDATE users SET api_token_hash = :hash, updated_at = :updated_at WHERE email = :email',
    );
    $stmt->execute([
        'hash' => user_api_token_hash($token),
        'updated_at' => $now,
        'email' => $email,
    ]);

    return $token;
}

/** Email dari sesi PHP atau Bearer token; null jika tidak terautentikasi. */
function user_api_resolve_email(?string $bodyEmail = null, ?string $bodyApiToken = null): ?string
{
    $resolved = null;

    if (!empty($_SESSION['user']['email'])) {
        $resolved = auth_normalize_email((string) $_SESSION['user']['email']);
    } else {
        $token = user_api_bearer_token();
        if ($token === null) {
            $token = user_api_sanitize_token($bodyApiToken);
        }
        if ($token !== null) {
            try {
                $pdo = app_db();
                $resolved = user_api_email_for_token($pdo, $token);
            } catch (Throwable) {
                $resolved = null;
            }
        }
    }

    if ($resolved === null || $resolved === '') {
        return null;
    }

    if ($bodyEmail !== null && $bodyEmail !== '') {
        $normalized = auth_normalize_email($bodyEmail);
        if ($normalized !== '' && $normalized !== $resolved) {
            return null;
        }
    }

    return $resolved;
}

function user_api_require_email(?string $bodyEmail = null, ?string $bodyApiToken = null): string
{
    $resolved = user_api_resolve_email($bodyEmail, $bodyApiToken);
    if ($resolved === null) {
        user_api_auth_error(
            'Autentikasi diperlukan. Keluar dari aplikasi lalu masuk lagi (login Google atau email).',
            401,
        );
    }

    return $resolved;
}

/**
 * Terbitkan token baru jika belum ada Bearer valid, atau paksa baru (login).
 *
 * @return string|null Token plaintext untuk dikirim ke klien, null jika klien sudah punya token valid
 */
function user_api_maybe_issue_token(PDO $pdo, string $email, bool $forceNew = false): ?string
{
    $email = auth_normalize_email($email);
    if ($email === '') {
        return null;
    }

    if (!$forceNew) {
        $token = user_api_bearer_token();
        if ($token !== null && user_api_email_for_token($pdo, $token) === $email) {
            return null;
        }
    }

    return user_api_issue_token($pdo, $email);
}

function user_api_auth_error(string $message, int $code = 401): void
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
