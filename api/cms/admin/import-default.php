<?php
declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    cms_error('Method not allowed.', 405);
}

cms_require_auth();

$imported = cms_import_default_json();

cms_json([
    'ok' => true,
    'imported' => $imported,
    'message' => 'Konten default berhasil diimpor.',
]);
