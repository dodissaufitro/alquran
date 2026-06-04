<?php
declare(strict_types=1);

/**
 * Sinkronkan Talaqee ke MySQL: buat DB, migrasi tabel, seed CMS, opsional salin dari SQLite.
 * Usage: php api/sync-mysql.php [--from-sqlite] [--force-seed]
 */

require_once __DIR__ . '/env.php';
app_require_cli('sync-mysql');

require_once __DIR__ . '/bootstrap.php';

$fromSqlite = in_array('--from-sqlite', $argv ?? [], true);
$forceSeed = in_array('--force-seed', $argv ?? [], true);

putenv('DB_DRIVER=mysql');
$_ENV['DB_DRIVER'] = 'mysql';

$db = app_db_settings();
$host = $db['host'];
$port = $db['port'];
$name = $db['name'];
$user = $db['user'];
$pass = $db['pass'];
$charset = $db['charset'];

echo "Talaqee — sinkron MySQL\n";
echo "Driver: mysql | Host: $host:$port | Database: $name\n\n";

try {
    $server = new PDO(
        sprintf('mysql:host=%s;port=%s;charset=%s', $host, $port, $charset),
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
    );
    $server->exec(
        "CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    );
    echo "[1/4] Database `$name` siap.\n";

    require_once __DIR__ . '/cms/bootstrap.php';

    $pdo = app_db();
    echo "[2/4] Tabel dimigrasi.\n";

    $sqlitePath = __DIR__ . '/data/app.db';
    if ($fromSqlite && is_file($sqlitePath)) {
        $copied = app_sync_from_sqlite($pdo, $sqlitePath);
        echo "[3/4] Salin dari SQLite ($sqlitePath): $copied baris.\n";
    } else {
        if ($fromSqlite) {
            echo "[3/4] Lewati SQLite — file tidak ada: $sqlitePath\n";
        } else {
            echo "[3/4] Lewati SQLite (pakai --from-sqlite jika ada api/data/app.db).\n";
        }
    }

    learning_store_import_from_cms_json_if_empty($pdo);

    require_once __DIR__ . '/coins/schema.php';
    coins_seed_packages_if_empty($pdo);
    echo "      Paket coin: tabel coin_packages (seed jika kosong).\n";

    if (learning_store_sync_ulumul_from_default($pdo)) {
        echo "      Ulumul Qur'an: materi berbayar disinkron dari default-content.json.\n";
    }

    $table = app_cms_content_table();
    $count = (int) $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
    if ($count === 0 || $forceSeed) {
        if ($forceSeed && $count > 0) {
            echo "      --force-seed: impor ulang dari default-content.json\n";
        }
        $imported = cms_import_default_json($pdo);
        echo "      Seed CMS: $imported section.\n";
    } else {
        echo "      CMS sudah berisi $count section (tanpa seed ulang).\n";
    }

    echo "[4/4] Ringkasan tabel:\n";
    foreach (app_sync_mysql_tables() as $t) {
        if (!app_table_exists($pdo, $t)) {
            continue;
        }
        $n = (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo "      - $t: $n baris\n";
    }

    echo "\nOK — aplikasi memakai MySQL (`$name`).\n";
    echo "Jalankan API: npm run api:php | CMS: http://localhost:5173/admin.html\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'Gagal: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}

/** @return list<string> */
function app_sync_mysql_tables(): array
{
    return [
        'cms_content_sections',
        'learning_categories',
        'learning_articles',
        'learning_chapters',
        'cms_sessions',
        'subscriptions',
        'orders',
        'user_coins',
        'coin_transactions',
        'coin_packages',
        'journal_purchases',
        'recordings',
        'comments',
    ];
}

function app_sync_from_sqlite(PDO $mysql, string $sqlitePath): int
{
    $sqlite = new PDO('sqlite:' . $sqlitePath);
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $total = 0;
    foreach (app_sync_mysql_tables() as $table) {
        $check = $sqlite->query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=" . $sqlite->quote($table),
        );
        if (!$check->fetchColumn()) {
            continue;
        }

        $rows = $sqlite->query("SELECT * FROM $table")->fetchAll(PDO::FETCH_ASSOC);
        if ($rows === []) {
            continue;
        }

        $columns = array_keys($rows[0]);
        $colList = implode(', ', array_map(static fn(string $c): string => "`$c`", $columns));
        $placeholders = implode(', ', array_map(static fn(string $c): string => ':' . $c, $columns));
        $pkCols = app_sync_primary_columns($table);
        $updates = implode(', ', array_map(
            static fn(string $c): string => "`$c` = VALUES(`$c`)",
            array_filter($columns, static fn(string $c): bool => !in_array($c, $pkCols, true)),
        ));

        $sql = "INSERT INTO `$table` ($colList) VALUES ($placeholders) ON DUPLICATE KEY UPDATE $updates";
        $stmt = $mysql->prepare($sql);

        foreach ($rows as $row) {
            $params = [];
            foreach ($columns as $col) {
                $params[$col] = $row[$col];
            }
            $stmt->execute($params);
            $total++;
        }

        echo "      → $table: " . count($rows) . " baris\n";
    }

    return $total;
}

/** @return list<string> */
function app_sync_primary_columns(string $table): array
{
    return match ($table) {
        'journal_purchases' => ['email', 'journal_id'],
        'cms_content_sections' => ['section_key'],
        'cms_sessions' => ['token'],
        'subscriptions' => ['email'],
        default => ['id'],
    };
}
