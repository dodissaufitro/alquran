<?php
declare(strict_types=1);

/**
 * Sinkronkan materi Ulumul Qur'an berbayar dari default-content.json ke MySQL.
 * Usage: php api/sync-ulumul.php
 */

require_once __DIR__ . '/env.php';
app_require_cli('sync-ulumul');

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/cms/bootstrap.php';

putenv('DB_DRIVER=mysql');
$_ENV['DB_DRIVER'] = 'mysql';

$pdo = app_db();
app_learning_migrate($pdo);
learning_store_import_from_cms_json_if_empty($pdo);

echo "Sinkron Ulumul Qur'an...\n";

if (!learning_store_sync_ulumul_from_default($pdo)) {
    fwrite(STDERR, "Gagal — kategori ulumul-quran tidak ditemukan di default-content.json.\n");
    exit(1);
}

$articles = learning_store_load_articles_for_category($pdo, 'ulumul-quran');
$chapterCount = (int) $pdo->query('SELECT COUNT(*) FROM learning_chapters')->fetchColumn();
echo "OK — " . count($articles) . " materi Ulumul ($chapterCount bab total):\n";
foreach ($articles as $article) {
    $price = $article['priceIdr'] ?? 0;
    $bab = count($article['chapters'] ?? []);
    echo "  - {$article['id']} (Rp " . number_format((int) $price, 0, ',', '.') . ", $bab bab)\n";
}
