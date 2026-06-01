<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'PUT'], true)) {
    cms_error('Method not allowed.', 405);
}

cms_require_auth();

$section = trim((string) ($_GET['section'] ?? ''));

if ($method === 'GET') {
    if ($section === '') {
        cms_json([
            'ok' => true,
            'content' => cms_get_all_public(),
        ]);
    }

    $payload = $section === 'jurnal' ? cms_resolve_jurnal() : cms_get_section($section);
    if ($payload === null) {
        cms_error('Section belum ada.', 404);
    }

    cms_json(['ok' => true, 'section' => $section, 'payload' => $payload]);
}

$body = cms_read_json_body();
$key = trim((string) ($body['section'] ?? $section));
if ($key === '') {
    cms_error('Parameter section wajib.', 400);
}

if (!array_key_exists('payload', $body)) {
    cms_error('Field payload wajib.', 400);
}

cms_save_section($key, $body['payload']);
cms_json(['ok' => true, 'section' => $key, 'updatedAt' => time()]);
