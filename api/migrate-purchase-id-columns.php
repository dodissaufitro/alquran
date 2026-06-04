<?php
declare(strict_types=1);

/**
 * Perlebar journal_id / ref_id ke 128 karakter (production).
 * Usage: php api/migrate-purchase-id-columns.php
 */

require_once __DIR__ . '/bootstrap.php';

app_require_cli('migrate-purchase-id-columns');

$pdo = app_db();
app_widen_purchase_id_columns($pdo);

echo "OK — kolom pembelian diperlebar (driver: " . app_db_driver() . ").\n";
