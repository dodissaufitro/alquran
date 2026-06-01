<?php
declare(strict_types=1);

/** Ambil & hapus sesi bridge (sekali pakai) — GET ?bridge=... */
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../bootstrap.php';
require __DIR__ . '/apk-bridge-lib.php';

$bridge = isset($_GET['bridge']) ? trim((string) $_GET['bridge']) : '';
if ($bridge === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'bridge wajib']);
    exit;
}

$data = apk_bridge_consume($bridge);
if ($data === null) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Sesi login tidak ditemukan atau kedaluwarsa']);
    exit;
}

echo json_encode([
    'ok' => true,
    'credential' => $data['credential'] ?? null,
    'email' => $data['email'] ?? null,
    'name' => $data['name'] ?? null,
    'picture' => $data['picture'] ?? null,
]);
