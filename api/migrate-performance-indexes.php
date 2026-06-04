<?php
declare(strict_types=1);

/**
 * Terapkan indeks performa di MySQL/SQLite hosting.
 * Usage: php api/migrate-performance-indexes.php
 */

require_once __DIR__ . '/bootstrap.php';

app_require_cli('migrate-performance-indexes');

$pdo = app_db();
app_apply_performance_indexes($pdo);

echo "OK — indeks performa diterapkan (" . app_db_driver() . ").\n";
