<?php
declare(strict_types=1);

/**
 * Sinkron ulang jurnal/buku dengan bab otomatis (alur coin per bab).
 * Usage: php api/sync-jurnal-chapters.php
 */

require_once __DIR__ . '/env.php';
app_require_cli('sync-jurnal-chapters');

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/learning-store.php';

$pdo = app_db();
$now = time();

$jurnal = learning_store_load_jurnal($pdo);
if ($jurnal === null) {
    $path = learning_store_default_json_path();
    $decoded = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
    $jurnal = is_array($decoded['jurnal'] ?? null) ? $decoded['jurnal'] : null;
}

if ($jurnal === null) {
    fwrite(STDERR, "Kategori jurnal tidak ditemukan.\n");
    exit(1);
}

learning_store_save_jurnal_category($pdo, $jurnal, $now);

$count = 0;
$chCount = 0;
$stmt = $pdo->query(
    "SELECT a.id,
            (SELECT COUNT(*) FROM learning_chapters c WHERE c.article_id = a.id) AS ch
     FROM learning_articles a
     WHERE a.category_id = 'jurnal'",
);
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    $chCount += (int) ($row['ch'] ?? 0);
}

echo "OK — jurnal disinkronkan: {$count} artikel, {$chCount} bab di database.\n";
