<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    coins_error('Method not allowed.', 405);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    coins_error('Body JSON tidak valid.');
}

$email = coins_authenticated_email((string) ($data['email'] ?? ''));
$journalId = trim((string) ($data['journalId'] ?? ''));
if ($journalId === '') {
    coins_error('journalId wajib diisi.');
}

$result = coins_unlock_journal($email, $journalId);

subscription_json_response(array_merge(subscription_status_payload($email), $result, [
    'message' => 'Jurnal berhasil dibuka dengan coin.',
]));
