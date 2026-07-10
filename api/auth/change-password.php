<?php
declare(strict_types=1);

require_once __DIR__ . '/auth-bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_error('Method not allowed.', 405);
}

if (empty($_SESSION['user'])) {
    auth_error('Unauthorized', 401);
}

$input = auth_read_json();
$oldPassword = (string)($input['old_password'] ?? '');
$newPassword = (string)($input['new_password'] ?? '');

if ($oldPassword === '' || $newPassword === '') {
    auth_error('Old password and new password are required.');
}

if (strlen($newPassword) < 8) {
    auth_error('New password must be at least 8 characters long.');
}

$db = db_connect();
$email = $_SESSION['user']['email'];

$stmt = $db->prepare("SELECT password_hash, provider FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    auth_error('User not found.');
}

if ($user['provider'] !== 'credentials') {
    auth_error('Cannot change password for users registered via Google.');
}

if (!password_verify($oldPassword, $user['password_hash'])) {
    auth_error('Incorrect old password.');
}

$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$time = time();

$stmt = $db->prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?");
$stmt->execute([$newHash, $time, $email]);

auth_touch_session_activity();

auth_json([
    'ok' => true
]);
