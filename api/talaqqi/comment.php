<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    talaqqi_error('Method not allowed', 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '{}', true);
if (!is_array($data)) {
    talaqqi_error('JSON tidak valid.');
}

$recordingId = trim((string) ($data['recordingId'] ?? ''));
$authorName = trim((string) ($data['authorName'] ?? ''));
$authorRole = trim((string) ($data['authorRole'] ?? 'guru'));
$body = trim((string) ($data['body'] ?? ''));

if ($recordingId === '' || $authorName === '' || $body === '') {
    talaqqi_error('Data komentar tidak lengkap.');
}

if (!in_array($authorRole, ['santri', 'guru'], true)) {
    $authorRole = 'guru';
}

if (mb_strlen($body) > 1000) {
    talaqqi_error('Komentar terlalu panjang.');
}

$pdo = talaqqi_db();
$check = $pdo->prepare('SELECT id FROM recordings WHERE id = :id');
$check->execute(['id' => $recordingId]);
if (!$check->fetch()) {
    talaqqi_error('Rekaman tidak ditemukan.', 404);
}

$id = talaqqi_new_id();
$createdAt = (int) (microtime(true) * 1000);
$stmt = $pdo->prepare(
    'INSERT INTO comments (id, recording_id, author_name, author_role, body, created_at)
     VALUES (:id, :recording_id, :author_name, :author_role, :body, :created_at)',
);
$stmt->execute([
    'id' => $id,
    'recording_id' => $recordingId,
    'author_name' => $authorName,
    'author_role' => $authorRole,
    'body' => $body,
    'created_at' => $createdAt,
]);

talaqqi_json_response([
    'ok' => true,
    'comment' => [
        'id' => $id,
        'recordingId' => $recordingId,
        'authorName' => $authorName,
        'authorRole' => $authorRole,
        'body' => $body,
        'createdAt' => $createdAt,
    ],
]);
