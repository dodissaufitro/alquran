<?php
declare(strict_types=1);

@ini_set('upload_max_filesize', '16M');
@ini_set('post_max_size', '16M');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

const TALAQQI_UPLOAD_DIR = __DIR__ . '/uploads';
const TALAQQI_DATA_DIR = __DIR__ . '/data';

$apiConfig = __DIR__ . '/../config.local.php';
if (is_file($apiConfig)) {
    require $apiConfig;
}

require __DIR__ . '/../database.php';

function talaqqi_json_response(mixed $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function talaqqi_error(string $message, int $code = 400): void
{
    talaqqi_json_response(['ok' => false, 'error' => $message], $code);
}

function talaqqi_db(): PDO
{
    if (!is_dir(TALAQQI_UPLOAD_DIR)) {
        mkdir(TALAQQI_UPLOAD_DIR, 0755, true);
    }
  return app_db();
}

function talaqqi_ensure_column(PDO $pdo, string $table, string $column, string $definition): void
{
    app_ensure_column($pdo, $table, $column, strtoupper($definition), $definition);
}

function talaqqi_new_id(): string
{
    return bin2hex(random_bytes(8));
}

function talaqqi_audio_url(string $file): string
{
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/talaqqi'), '/\\');
    return $base . '/audio.php?f=' . rawurlencode($file);
}

function talaqqi_normalize_email(string $email): string
{
    $email = strtolower(trim($email));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        talaqqi_error('Email tidak valid.', 400);
    }
    return $email;
}

function talaqqi_normalize_email_optional(string $email): string
{
    $email = strtolower(trim($email));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return '';
    }
    return $email;
}

function talaqqi_actor_is_super_admin(PDO $pdo, string $email): bool
{
    $email = talaqqi_normalize_email_optional($email);
    if ($email === '') {
        return false;
    }
    $stmt = $pdo->prepare('SELECT is_super_admin FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row && (int) ($row['is_super_admin'] ?? 0) === 1;
}

function talaqqi_unlink_audio_file(string $filename): void
{
    $filename = basename(trim($filename));
    if ($filename === '' || !preg_match('/^[a-f0-9]{16}\.(webm|ogg|mp3|m4a)$/', $filename)) {
        return;
    }
    $path = TALAQQI_UPLOAD_DIR . '/' . $filename;
    if (is_file($path)) {
        @unlink($path);
    }
}

/** @return array<string, mixed>|null */
function talaqqi_read_delete_json(): ?array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);

    return is_array($data) ? $data : null;
}

/** @param array<string, mixed> $data */
function talaqqi_delete_recording(array $data): void
{
    $id = trim((string) ($data['id'] ?? ''));
    $actorEmail = trim((string) ($data['actorEmail'] ?? ''));

    if ($id === '') {
        talaqqi_error('ID rekaman wajib diisi.');
    }
    if ($actorEmail === '') {
        talaqqi_error('Login diperlukan untuk menghapus rekaman.');
    }

    $actorEmail = talaqqi_normalize_email($actorEmail);
    $pdo = talaqqi_db();

    $stmt = $pdo->prepare('SELECT * FROM recordings WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        talaqqi_error('Rekaman tidak ditemukan.', 404);
    }

    $ownerEmail = talaqqi_normalize_email_optional((string) ($row['author_email'] ?? ''));
    $isOwner = $ownerEmail !== '' && $ownerEmail === $actorEmail;
    $isSuperAdmin = talaqqi_actor_is_super_admin($pdo, $actorEmail);

    if (!$isOwner && !$isSuperAdmin) {
        talaqqi_error('Anda tidak berhak menghapus rekaman ini.', 403);
    }

    $cStmt = $pdo->prepare('SELECT audio_file FROM comments WHERE recording_id = :id');
    $cStmt->execute(['id' => $id]);
    while ($c = $cStmt->fetch(PDO::FETCH_ASSOC)) {
        talaqqi_unlink_audio_file((string) ($c['audio_file'] ?? ''));
    }

    $pdo->prepare('DELETE FROM comments WHERE recording_id = :id')->execute(['id' => $id]);
    $pdo->prepare('DELETE FROM recordings WHERE id = :id')->execute(['id' => $id]);
    talaqqi_unlink_audio_file((string) ($row['audio_file'] ?? ''));

    talaqqi_json_response(['ok' => true, 'id' => $id]);
}

/** @param array<string, mixed> $data */
function talaqqi_delete_comment(array $data): void
{
    $id = trim((string) ($data['id'] ?? ''));
    $actorEmail = trim((string) ($data['actorEmail'] ?? ''));

    if ($id === '') {
        talaqqi_error('ID komentar wajib diisi.');
    }
    if ($actorEmail === '') {
        talaqqi_error('Login diperlukan untuk menghapus komentar.');
    }

    $actorEmail = talaqqi_normalize_email($actorEmail);
    $pdo = talaqqi_db();

    $stmt = $pdo->prepare('SELECT * FROM comments WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        talaqqi_error('Komentar tidak ditemukan.', 404);
    }

    $commentAuthor = talaqqi_normalize_email_optional((string) ($row['author_email'] ?? ''));
    $isCommentAuthor = $commentAuthor !== '' && $commentAuthor === $actorEmail;
    $isSuperAdmin = talaqqi_actor_is_super_admin($pdo, $actorEmail);

    if (!$isCommentAuthor && !$isSuperAdmin) {
        talaqqi_error('Anda tidak berhak menghapus komentar ini.', 403);
    }

    $pdo->prepare('DELETE FROM comments WHERE id = :id')->execute(['id' => $id]);
    talaqqi_unlink_audio_file((string) ($row['audio_file'] ?? ''));

    talaqqi_json_response([
        'ok' => true,
        'id' => $id,
        'recordingId' => $row['recording_id'],
    ]);
}

/** @return array{filename: string, durationMs: int} */
function talaqqi_store_uploaded_audio(array $file, int $durationMs = 0): array
{
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        talaqqi_error('File audio tidak diterima.');
    }
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
        talaqqi_error('Format audio tidak didukung.');
    }

    $id = talaqqi_new_id();
    $filename = $id . '.' . $ext;
    $dest = TALAQQI_UPLOAD_DIR . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        talaqqi_error('Gagal menyimpan audio.', 500);
    }

    return ['filename' => $filename, 'durationMs' => max(0, $durationMs)];
}

function talaqqi_row_to_comment(array $row): array
{
    $audioFile = trim((string) ($row['audio_file'] ?? ''));
    return [
        'id' => $row['id'],
        'recordingId' => $row['recording_id'],
        'authorName' => $row['author_name'],
        'authorEmail' => isset($row['author_email']) && $row['author_email'] !== ''
            ? $row['author_email']
            : null,
        'authorRole' => $row['author_role'],
        'body' => (string) ($row['body'] ?? ''),
        'audioUrl' => $audioFile !== '' ? talaqqi_audio_url($audioFile) : null,
        'durationMs' => (int) ($row['duration_ms'] ?? 0),
        'createdAt' => (int) $row['created_at'],
    ];
}

function talaqqi_row_to_recording(array $row, array $comments): array
{
    return [
        'id' => $row['id'],
        'authorName' => $row['author_name'],
        'authorEmail' => isset($row['author_email']) && $row['author_email'] !== ''
            ? $row['author_email']
            : null,
        'authorRole' => $row['author_role'],
        'ayahNumber' => $row['ayah_number'] !== null ? (int) $row['ayah_number'] : null,
        'durationMs' => (int) $row['duration_ms'],
        'audioUrl' => talaqqi_audio_url($row['audio_file']),
        'createdAt' => (int) $row['created_at'],
        'comments' => $comments,
    ];
}

function talaqqi_fetch_feed(?int $since = null, ?string $authorEmail = null): array
{
    $pdo = talaqqi_db();
    $params = [];
    $where = [];

    if ($since !== null && $since > 0) {
        $where[] = 'created_at > :since';
        $params['since'] = $since;
    }
    if ($authorEmail !== null && $authorEmail !== '') {
        $where[] = 'author_email = :author_email';
        $params['author_email'] = talaqqi_normalize_email($authorEmail);
    }

    $sql = 'SELECT * FROM recordings';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY created_at ASC LIMIT 200';

    if ($params) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    } else {
        $stmt = $pdo->query($sql);
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$rows) {
        return [];
    }

    $ids = array_column($rows, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $cStmt = $pdo->prepare("SELECT * FROM comments WHERE recording_id IN ($placeholders) ORDER BY created_at ASC");
    $cStmt->execute($ids);
    $commentsByRecording = [];
    while ($c = $cStmt->fetch(PDO::FETCH_ASSOC)) {
        $rid = $c['recording_id'];
        $commentsByRecording[$rid][] = talaqqi_row_to_comment($c);
    }

    $items = [];
    foreach ($rows as $row) {
        $items[] = talaqqi_row_to_recording($row, $commentsByRecording[$row['id']] ?? []);
    }
    return $items;
}
