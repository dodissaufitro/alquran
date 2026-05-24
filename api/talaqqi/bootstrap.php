<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
        $commentsByRecording[$rid][] = [
            'id' => $c['id'],
            'authorName' => $c['author_name'],
            'authorRole' => $c['author_role'],
            'body' => $c['body'],
            'createdAt' => (int) $c['created_at'],
        ];
    }

    $items = [];
    foreach ($rows as $row) {
        $items[] = talaqqi_row_to_recording($row, $commentsByRecording[$row['id']] ?? []);
    }
    return $items;
}
