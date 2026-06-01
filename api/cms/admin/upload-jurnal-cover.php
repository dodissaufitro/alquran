<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    cms_error('Method not allowed.', 405);
}

cms_require_auth();

$file = $_FILES['cover'] ?? null;
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $code = is_array($file) ? (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) : UPLOAD_ERR_NO_FILE;
    if ($code === UPLOAD_ERR_NO_FILE) {
        cms_error('File sampul wajib diunggah (field: cover).');
    }
    cms_error('Upload gagal (kode ' . $code . ').', 400);
}

$tmp = (string) ($file['tmp_name'] ?? '');
if ($tmp === '' || !is_uploaded_file($tmp)) {
    cms_error('File upload tidak valid.', 400);
}

$maxBytes = 5 * 1024 * 1024;
$size = (int) ($file['size'] ?? 0);
if ($size <= 0 || $size > $maxBytes) {
    cms_error('Ukuran file maksimal 5 MB.', 400);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($tmp) ?: '';
/** @var array<string, string> $allowed */
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];
if (!isset($allowed[$mime])) {
    cms_error('Format tidak didukung. Gunakan JPG, PNG, atau WebP.', 400);
}

$articleId = trim((string) ($_POST['articleId'] ?? ''));
$slug = $articleId !== '' ? preg_replace('/[^a-z0-9\-_]+/i', '-', $articleId) : 'cover';
$slug = trim((string) $slug, '-');
if ($slug === '') {
    $slug = 'cover';
}
$slug = mb_substr($slug, 0, 64);

$uploadDir = dirname(__DIR__, 3) . '/uploads/jurnal-covers';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
    cms_error('Folder upload tidak bisa dibuat.', 500);
}

$ext = $allowed[$mime];
$filename = $slug . '-' . time() . '.' . $ext;
$dest = $uploadDir . '/' . $filename;

if (!move_uploaded_file($tmp, $dest)) {
    cms_error('Gagal menyimpan file sampul.', 500);
}

cms_json([
    'ok' => true,
    'url' => '/uploads/jurnal-covers/' . $filename,
    'filename' => $filename,
]);
