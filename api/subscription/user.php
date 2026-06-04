<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    subscription_error('Method not allowed.', 405);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    subscription_error('Body JSON tidak valid.');
}

require_once __DIR__ . '/../auth/user-api-auth.php';
require_once __DIR__ . '/../auth/google-verify.php';

$idToken = trim((string) ($data['idToken'] ?? $data['credential'] ?? ''));
$oauthAccess = trim((string) ($data['accessToken'] ?? ''));
$bodyEmail = subscription_normalize_email((string) ($data['email'] ?? ''));
$name = trim((string) ($data['name'] ?? ''));
$picture = trim((string) ($data['picture'] ?? ''));

$email = '';
$provider = 'google';

if ($oauthAccess !== '' && $idToken === '') {
    $profile = google_fetch_userinfo($oauthAccess);
    if ($profile === null) {
        subscription_error('Token akses Google tidak valid.', 401);
    }
    $email = subscription_normalize_email($profile['email']);
    $name = $profile['name'];
    if ($profile['picture'] !== null) {
        $picture = $profile['picture'];
    }
} elseif ($idToken !== '') {
    $verified = google_verify_id_token($idToken);
    if ($verified === null) {
        subscription_error('Token Google tidak valid atau kedaluwarsa.', 401);
    }
    $email = subscription_normalize_email($verified['email']);
    $name = $verified['name'];
    if ($verified['picture'] !== null) {
        $picture = $verified['picture'];
    }
} else {
    $resolved = user_api_resolve_email($bodyEmail !== '' ? $bodyEmail : null);
    if ($resolved === null) {
        subscription_error(
            'Autentikasi diperlukan. Login dengan Google (idToken) atau Bearer token setelah login email.',
            401,
        );
    }
    $email = $resolved;
    if ($bodyEmail !== '' && $bodyEmail !== $email) {
        subscription_error('Email tidak sesuai dengan akun yang login.', 403);
    }
    $provider = 'local';
}

if ($email === '') {
    subscription_error('Email wajib diisi.', 400);
}

if (mb_strlen($name) > 255) {
    $name = mb_substr($name, 0, 255);
}
if (mb_strlen($picture) > 512) {
    $picture = mb_substr($picture, 0, 512);
}

$now = time();
$params = [
    'email' => $email,
    'name' => $name !== '' ? $name : $email,
    'picture' => $picture,
    'provider' => $provider,
    'created_at' => $now,
    'updated_at' => $now,
    'last_login_at' => $now,
];

try {
    $pdo = subscription_db();
} catch (Throwable $e) {
    error_log('[subscription/user.php] DB connect: ' . $e->getMessage());
    subscription_error('Database tidak tersedia. Periksa DB_HOST di api/config.local.php.', 503);
}

try {
    if (app_db_is_mysql()) {
        $stmt = $pdo->prepare(
            'INSERT INTO users (email, name, picture, provider, created_at, updated_at, last_login_at)
             VALUES (:email, :name, :picture, :provider, :created_at, :updated_at, :last_login_at)
             ON DUPLICATE KEY UPDATE
               name = VALUES(name),
               picture = VALUES(picture),
               provider = VALUES(provider),
               updated_at = VALUES(updated_at),
               last_login_at = VALUES(last_login_at)',
        );
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO users (email, name, picture, provider, created_at, updated_at, last_login_at)
             VALUES (:email, :name, :picture, :provider, :created_at, :updated_at, :last_login_at)
             ON CONFLICT(email) DO UPDATE SET
               name = excluded.name,
               picture = excluded.picture,
               provider = excluded.provider,
               updated_at = excluded.updated_at,
               last_login_at = excluded.last_login_at',
        );
    }
    $stmt->execute($params);
} catch (Throwable $e) {
    error_log('[subscription/user.php] INSERT users: ' . $e->getMessage());
    subscription_error('Gagal menyimpan user: ' . $e->getMessage(), 500);
}

$sel = $pdo->prepare('SELECT is_super_admin FROM users WHERE email = :email');
$sel->execute(['email' => $email]);
$row = $sel->fetch(PDO::FETCH_ASSOC);
$isSuperAdmin = $row && (int) $row['is_super_admin'] === 1;

$apiToken = user_api_maybe_issue_token($pdo, $email, false);

$response = ['ok' => true, 'email' => $email, 'isSuperAdmin' => $isSuperAdmin];
if ($apiToken !== null) {
    $response['apiToken'] = $apiToken;
}
subscription_json_response($response);
