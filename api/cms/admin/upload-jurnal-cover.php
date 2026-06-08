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

/** @return array{ext: string, mime: string}|null */
function cms_detect_uploaded_image(string $tmp, string $originalName): ?array
{
    $imageType = @exif_imagetype($tmp);
    $fromType = [
        IMAGETYPE_JPEG => ['ext' => 'jpg', 'mime' => 'image/jpeg'],
        IMAGETYPE_PNG => ['ext' => 'png', 'mime' => 'image/png'],
        IMAGETYPE_WEBP => ['ext' => 'webp', 'mime' => 'image/webp'],
        IMAGETYPE_GIF => ['ext' => 'gif', 'mime' => 'image/gif'],
        IMAGETYPE_BMP => ['ext' => 'jpg', 'mime' => 'image/jpeg'],
    ];
    if ($imageType !== false && isset($fromType[$imageType])) {
        return $fromType[$imageType];
    }

    $info = @getimagesize($tmp);
    if (is_array($info) && isset($info[2])) {
        $mime = is_string($info['mime'] ?? null) ? (string) $info['mime'] : '';
        $map = [
            IMAGETYPE_JPEG => ['ext' => 'jpg', 'mime' => 'image/jpeg'],
            IMAGETYPE_PNG => ['ext' => 'png', 'mime' => 'image/png'],
            IMAGETYPE_WEBP => ['ext' => 'webp', 'mime' => 'image/webp'],
            IMAGETYPE_GIF => ['ext' => 'gif', 'mime' => 'image/gif'],
        ];
        $t = (int) $info[2];
        if (isset($map[$t])) {
            return $map[$t];
        }
        if ($mime !== '') {
            $byMime = cms_cover_mime_map();
            if (isset($byMime[$mime])) {
                return ['ext' => $byMime[$mime], 'mime' => $mime];
            }
        }
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmp) ?: '';
    $byMime = cms_cover_mime_map();
    if (isset($byMime[$mime])) {
        return ['ext' => $byMime[$mime], 'mime' => $mime];
    }

    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $extMap = [
        'jpg' => ['ext' => 'jpg', 'mime' => 'image/jpeg'],
        'jpeg' => ['ext' => 'jpg', 'mime' => 'image/jpeg'],
        'png' => ['ext' => 'png', 'mime' => 'image/png'],
        'webp' => ['ext' => 'webp', 'mime' => 'image/webp'],
        'gif' => ['ext' => 'gif', 'mime' => 'image/gif'],
    ];
    if (isset($extMap[$ext]) && @getimagesize($tmp) !== false) {
        return $extMap[$ext];
    }

    return null;
}

/** @return array<string, string> */
function cms_cover_mime_map(): array
{
    return [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/pjpeg' => 'jpg',
        'image/png' => 'png',
        'image/x-png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];
}

function cms_upload_error_message(int $code): string
{
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE =>
            'Ukuran file melebihi batas server. Pilih gambar lebih kecil atau kompres dulu.',
        UPLOAD_ERR_PARTIAL => 'Upload terputus. Coba lagi.',
        UPLOAD_ERR_NO_FILE => 'File sampul wajib diunggah (field: cover).',
        UPLOAD_ERR_NO_TMP_DIR => 'Folder sementara server tidak tersedia.',
        UPLOAD_ERR_CANT_WRITE => 'Server gagal menulis file upload.',
        UPLOAD_ERR_EXTENSION => 'Upload diblokir ekstensi PHP.',
        default => 'Upload gagal (kode ' . $code . ').',
    };
}

/** Normalisasi ke JPEG dengan GD — lebih kecil & kompatibel di semua perangkat. */
function cms_normalize_cover_to_jpeg(string $src, string $dest, int $maxEdge = 1600): bool
{
    if (!extension_loaded('gd')) {
        return false;
    }

    $imageType = @exif_imagetype($src);
    $img = match ($imageType) {
        IMAGETYPE_JPEG => @imagecreatefromjpeg($src),
        IMAGETYPE_PNG => @imagecreatefrompng($src),
        IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($src) : false,
        IMAGETYPE_GIF => @imagecreatefromgif($src),
        default => false,
    };

    if ($img === false) {
        $blob = @file_get_contents($src);
        if ($blob === false) {
            return false;
        }
        $img = @imagecreatefromstring($blob);
    }
    if ($img === false) {
        return false;
    }

    $w = imagesx($img);
    $h = imagesy($img);
    if ($w <= 0 || $h <= 0) {
        imagedestroy($img);
        return false;
    }

    $scale = min(1.0, $maxEdge / max($w, $h));
    $tw = max(1, (int) round($w * $scale));
    $th = max(1, (int) round($h * $scale));

    $out = imagecreatetruecolor($tw, $th);
    if ($out === false) {
        imagedestroy($img);
        return false;
    }

    $white = imagecolorallocate($out, 255, 255, 255);
    imagefill($out, 0, 0, $white);
    imagecopyresampled($out, $img, 0, 0, 0, 0, $tw, $th, $w, $h);
    imagedestroy($img);

    $ok = imagejpeg($out, $dest, 88);
    imagedestroy($out);

    return $ok;
}

$file = $_FILES['cover'] ?? null;
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $code = is_array($file) ? (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) : UPLOAD_ERR_NO_FILE;
    cms_error(cms_upload_error_message($code), 400);
}

$tmp = (string) ($file['tmp_name'] ?? '');
$originalName = (string) ($file['name'] ?? 'cover.jpg');
if ($tmp === '' || !is_uploaded_file($tmp)) {
    cms_error('File upload tidak valid.', 400);
}

$maxBytes = 12 * 1024 * 1024;
$size = (int) ($file['size'] ?? 0);
if ($size <= 0 || $size > $maxBytes) {
    cms_error('Ukuran file maksimal 12 MB.', 400);
}

$detected = cms_detect_uploaded_image($tmp, $originalName);
if ($detected === null) {
    cms_error(
        'Format tidak didukung atau file rusak. Gunakan JPG, PNG, WebP, atau GIF — lalu coba lagi.',
        400,
    );
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

$filename = $slug . '-' . time() . '.jpg';
$dest = $uploadDir . '/' . $filename;

if (cms_normalize_cover_to_jpeg($tmp, $dest)) {
    cms_json([
        'ok' => true,
        'url' => '/uploads/jurnal-covers/' . $filename,
        'filename' => $filename,
    ]);
}

$ext = $detected['ext'];
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
