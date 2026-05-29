<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Headers: Range');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$file = basename((string) ($_GET['f'] ?? ''));
if ($file === '' || preg_match('/^[a-f0-9]{16}\.(webm|ogg|mp3|m4a)$/', $file) !== 1) {
    http_response_code(404);
    exit;
}

$path = __DIR__ . '/uploads/' . $file;
if (!is_file($path)) {
    http_response_code(404);
    exit;
}

$ext = pathinfo($file, PATHINFO_EXTENSION);
$types = [
    'webm' => 'audio/webm',
    'ogg' => 'audio/ogg',
    'mp3' => 'audio/mpeg',
    'm4a' => 'audio/mp4',
];
$size = filesize($path);
if ($size === false) {
    http_response_code(500);
    exit;
}

header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('Cache-Control: public, max-age=86400');
header('Accept-Ranges: bytes');

$range = $_SERVER['HTTP_RANGE'] ?? '';
if ($range !== '' && preg_match('/bytes=(\d*)-(\d*)/', $range, $m) === 1) {
    $start = $m[1] !== '' ? (int) $m[1] : 0;
    $end = $m[2] !== '' ? (int) $m[2] : $size - 1;

    if ($start > $end || $start >= $size) {
        header("Content-Range: bytes */{$size}");
        http_response_code(416);
        exit;
    }

    $end = min($end, $size - 1);
    $length = $end - $start + 1;

    http_response_code(206);
    header("Content-Range: bytes {$start}-{$end}/{$size}");
    header('Content-Length: ' . $length);

    $fp = fopen($path, 'rb');
    if ($fp === false) {
        http_response_code(500);
        exit;
    }
    fseek($fp, $start);
    $remaining = $length;
    while ($remaining > 0 && !feof($fp)) {
        $chunk = fread($fp, min(8192, $remaining));
        if ($chunk === false) {
            break;
        }
        echo $chunk;
        $remaining -= strlen($chunk);
    }
    fclose($fp);
    exit;
}

header('Content-Length: ' . $size);
readfile($path);
