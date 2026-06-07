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
$transcriptHint = trim((string) ($_POST['transcriptHint'] ?? ''));
if ($transcriptHint !== '' && mb_strlen($transcriptHint) > 1200) {
    $transcriptHint = mb_substr($transcriptHint, 0, 1200);
}

if ($authorName === '' || mb_strlen($authorName) > 50) {
    talaqqi_error('Nama wajib diisi (maks. 50 karakter).');
}

if (app_api_auth_strict()) {
    require_once __DIR__ . '/../auth/user-api-auth.php';
    $authorEmail = user_api_resolve_email($authorEmail !== '' ? $authorEmail : null);
    if ($authorEmail === null) {
        talaqqi_error('Login diperlukan untuk merekam.', 401);
    }
} elseif ($authorEmail === '') {
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

$comments = [];
if ($ayahNumber !== null && $ayahNumber >= 1 && $ayahNumber <= 7) {
    try {
        $autoComment = talaqqi_apply_auto_correction(
            $pdo,
            $id,
            $ayahNumber,
            $durationMs,
            $filename,
            $transcriptHint !== '' ? $transcriptHint : null,
        );
        if ($autoComment !== null) {
            $comments[] = $autoComment;
        }
    } catch (Throwable $e) {
        error_log('[talaqqi/recording] auto correction: ' . $e->getMessage());
    }
}

$sel = $pdo->prepare('SELECT * FROM recordings WHERE id = :id');
$sel->execute(['id' => $id]);
$row = $sel->fetch(PDO::FETCH_ASSOC);
$item = talaqqi_row_to_recording($row, $comments);

talaqqi_json_response([
    'ok' => true,
    'item' => $item,
    'coinBalance' => $coinBalance,
    'coinSpent' => coins_recording_cost(),
    'autoCorrection' => $comments[0] ?? null,
]);
