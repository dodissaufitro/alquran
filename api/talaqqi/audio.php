<?php
declare(strict_types=1);

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
header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('Cache-Control: public, max-age=86400');
readfile($path);
