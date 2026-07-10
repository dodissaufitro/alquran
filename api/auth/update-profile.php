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
$name = trim((string)($input['name'] ?? ''));
$phone = trim((string)($input['phone'] ?? ''));

if ($name === '') {
    auth_error('Name is required.');
}

$db = db_connect();
$email = $_SESSION['user']['email'];

$stmt = $db->prepare("UPDATE users SET name = ?, phone = ?, updated_at = ? WHERE email = ?");
$time = time();
$stmt->execute([$name, $phone, $time, $email]);

$_SESSION['user']['name'] = $name;
$_SESSION['user']['phone'] = $phone;
auth_touch_session_activity();

auth_json([
    'ok' => true,
    'user' => $_SESSION['user']
]);
