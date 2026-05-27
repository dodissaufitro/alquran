<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    subscription_error('Method not allowed.', 405);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    subscription_error('Body JSON tidak valid.');
}

$email = subscription_normalize_email((string) ($data['email'] ?? ''));
$name = trim((string) ($data['name'] ?? ''));
$picture = trim((string) ($data['picture'] ?? ''));

if (mb_strlen($name) > 255) {
    $name = mb_substr($name, 0, 255);
}
if (mb_strlen($picture) > 512) {
    $picture = mb_substr($picture, 0, 512);
}

$now = time();
$params = [
    'email' => $email,
    'name' => $name,
    'picture' => $picture,
    'provider' => 'google',
    'created_at' => $now,
    'updated_at' => $now,
    'last_login_at' => $now,
];

$pdo = subscription_db();
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

// Baca is_super_admin dari DB (hanya bisa di-set manual / via CMS admin)
$sel = $pdo->prepare('SELECT is_super_admin FROM users WHERE email = :email');
$sel->execute(['email' => $email]);
$row = $sel->fetch(PDO::FETCH_ASSOC);
$isSuperAdmin = $row && (int) $row['is_super_admin'] === 1;

subscription_json_response(['ok' => true, 'email' => $email, 'isSuperAdmin' => $isSuperAdmin]);

