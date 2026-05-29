<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

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
        talaqqi_delete_recording($data);
    }
    talaqqi_error('Permintaan JSON tidak dikenali.');
}

$authorName = trim((string) ($_POST['authorName'] ?? ''));
$authorEmail = trim((string) ($_POST['authorEmail'] ?? ''));
$authorRole = trim((string) ($_POST['authorRole'] ?? 'santri'));
$ayahNumber = isset($_POST['ayahNumber']) && $_POST['ayahNumber'] !== ''
    ? (int) $_POST['ayahNumber']
    : null;
$durationMs = (int) ($_POST['durationMs'] ?? 0);

if ($authorName === '' || mb_strlen($authorName) > 50) {
    talaqqi_error('Nama wajib diisi (maks. 50 karakter).');
}

if ($authorEmail === '') {
    talaqqi_error('Login diperlukan. Email pengguna wajib dikirim.');
}
$authorEmail = talaqqi_normalize_email($authorEmail);

if (!in_array($authorRole, ['santri', 'guru'], true)) {
    $authorRole = 'santri';
}

if ($ayahNumber !== null && ($ayahNumber < 1 || $ayahNumber > 7)) {
    talaqqi_error('Ayat harus 1–7.');
}

if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    talaqqi_error('File audio tidak diterima.');
}

$file = $_FILES['audio'];
$maxBytes = 8 * 1024 * 1024;
if ($file['size'] > $maxBytes) {
    talaqqi_error('Audio terlalu besar (maks. 8 MB).');
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']) ?: '';
$allowed = [
    'audio/webm' => 'webm',
    'audio/ogg' => 'ogg',
    'audio/mpeg' => 'mp3',
    'audio/mp4' => 'm4a',
    'video/webm' => 'webm',
    'application/octet-stream' => 'webm',
];
$ext = $allowed[$mime] ?? null;
if ($ext === null) {
    talaqqi_error('Format audio tidak didukung. Gunakan rekaman dari browser/ponsel.');
}

require_once __DIR__ . '/../coins/bootstrap.php';
$coinBalance = coins_charge_recording($authorEmail);

$id = talaqqi_new_id();
$filename = $id . '.' . $ext;
$dest = TALAQQI_UPLOAD_DIR . '/' . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
    talaqqi_error('Gagal menyimpan audio.', 500);
}

$createdAt = (int) (microtime(true) * 1000);
$pdo = talaqqi_db();
$stmt = $pdo->prepare(
    'INSERT INTO recordings (id, author_name, author_email, author_role, ayah_number, audio_file, duration_ms, created_at)
     VALUES (:id, :author_name, :author_email, :author_role, :ayah_number, :audio_file, :duration_ms, :created_at)',
);
$stmt->execute([
    'id' => $id,
    'author_name' => $authorName,
    'author_email' => $authorEmail,
    'author_role' => $authorRole,
    'ayah_number' => $ayahNumber,
    'audio_file' => $filename,
    'duration_ms' => $durationMs,
    'created_at' => $createdAt,
]);

$sel = $pdo->prepare('SELECT * FROM recordings WHERE id = :id');
$sel->execute(['id' => $id]);
$row = $sel->fetch(PDO::FETCH_ASSOC);
$item = talaqqi_row_to_recording($row, []);

talaqqi_json_response([
    'ok' => true,
    'item' => $item,
    'coinBalance' => $coinBalance,
    'coinSpent' => coins_recording_cost(),
]);
