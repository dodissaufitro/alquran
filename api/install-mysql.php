<?php
declare(strict_types=1);

/**
 * Instalasi database MySQL Talaqee.
 * Usage: php api/install-mysql.php
 */

require_once __DIR__ . '/env.php';
app_require_cli('install-mysql');

require_once __DIR__ . '/bootstrap.php';

$db = app_db_settings();
$host = $db['host'];
$port = $db['port'];
$name = $db['name'];
$user = $db['user'];
$pass = $db['pass'];
$charset = $db['charset'];

echo "Talaqee — instalasi MySQL\n";
echo "Host: $host:$port\n";
echo "Database: $name\n";

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%s;charset=%s', $host, $port, $charset),
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
    );
    $pdo->exec(
        sprintf(
            'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET %s COLLATE %s_unicode_ci',
            str_replace('`', '``', $name),
            $charset,
            $charset,
        ),
    );
    $pdo->exec('USE `' . str_replace('`', '``', $name) . '`');

    app_db_migrate_mysql($pdo);

    echo "OK — tabel berhasil dibuat di database `$name`.\n";
    echo "Pastikan file .env berisi DB_* yang benar.\n";
    echo "Lanjutkan: npm run db:sync  (seed CMS + ringkasan tabel)\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'Gagal: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
