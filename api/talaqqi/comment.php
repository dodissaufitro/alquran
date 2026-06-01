<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    talaqqi_error('Method not allowed', 405);
}

$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if (str_contains($contentType, 'application/json')) {
    $data = talaqqi_read_delete_json();
    if ($data === null) {
        talaqqi_error('JSON tidak valid.');
    }
    if (($data['action'] ?? '') === 'delete') {
        talaqqi_delete_comment($data);
    }
}

$hasAudioUpload = isset($_FILES['audio'])
    && is_array($_FILES['audio'])
    && (int) ($_FILES['audio']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK
    && is_uploaded_file((string) ($_FILES['audio']['tmp_name'] ?? ''));

if ($hasAudioUpload) {
    $recordingId = trim((string) ($_POST['recordingId'] ?? ''));
    $authorName  = trim((string) ($_POST['authorName'] ?? ''));
    $authorEmail = strtolower(trim((string) ($_POST['authorEmail'] ?? '')));
    $authorRole  = trim((string) ($_POST['authorRole'] ?? 'guru'));
    $body        = trim((string) ($_POST['body'] ?? ''));
    $durationMs  = (int) ($_POST['durationMs'] ?? 0);
} else {
    if (!isset($data) || !is_array($data)) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        if (!is_array($data)) {
            talaqqi_error('JSON tidak valid.');
        }
    }
    $recordingId = trim((string) ($data['recordingId'] ?? ''));
    $authorName  = trim((string) ($data['authorName'] ?? ''));
    $authorEmail = strtolower(trim((string) ($data['authorEmail'] ?? '')));
    $authorRole  = trim((string) ($data['authorRole'] ?? 'guru'));
    $body        = trim((string) ($data['body'] ?? ''));
    $durationMs  = 0;
}

if ($recordingId === '') {
    talaqqi_error('Data komentar tidak lengkap: ID rekaman kosong.');
}
if ($authorName === '') {
    talaqqi_error('Data komentar tidak lengkap: nama pengguna kosong.');
}

if (!in_array($authorRole, ['santri', 'guru'], true)) {
    $authorRole = 'guru';
}

if ($authorEmail !== '' && !filter_var($authorEmail, FILTER_VALIDATE_EMAIL)) {
    $authorEmail = '';
}

$audioFile = '';
if ($hasAudioUpload) {
    $stored = talaqqi_store_uploaded_audio($_FILES['audio'], $durationMs);
    $audioFile = $stored['filename'];
    $durationMs = $stored['durationMs'];
    if ($body === '') {
        $body = 'Koreksi suara';
    }
}

if ($body === '' && $audioFile === '') {
    talaqqi_error('Isi teks atau rekaman suara wajib ada.');
}

if ($body !== '' && mb_strlen($body) > 1000) {
    talaqqi_error('Komentar terlalu panjang.');
}

$pdo = talaqqi_db();
$check = $pdo->prepare('SELECT id FROM recordings WHERE id = :id');
$check->execute(['id' => $recordingId]);
if (!$check->fetch()) {
    talaqqi_error('Rekaman tidak ditemukan.', 404);
}

$id        = talaqqi_new_id();
$createdAt = (int) (microtime(true) * 1000);

$stmt = $pdo->prepare(
    'INSERT INTO comments (id, recording_id, author_name, author_email, author_role, body, audio_file, duration_ms, created_at)
     VALUES (:id, :recording_id, :author_name, :author_email, :author_role, :body, :audio_file, :duration_ms, :created_at)',
);
$stmt->execute([
    'id'           => $id,
    'recording_id' => $recordingId,
    'author_name'  => $authorName,
    'author_email' => $authorEmail,
    'author_role'  => $authorRole,
    'body'         => $body,
    'audio_file'   => $audioFile,
    'duration_ms'  => $durationMs,
    'created_at'   => $createdAt,
]);

$sel = $pdo->prepare('SELECT * FROM comments WHERE id = :id');
$sel->execute(['id' => $id]);
$row = $sel->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    talaqqi_error('Gagal menyimpan komentar.', 500);
}

talaqqi_json_response([
    'ok'      => true,
    'comment' => talaqqi_row_to_comment($row),
]);
