<?php
declare(strict_types=1);

/**
 * Instalasi database MySQL Talaqee.
 * Usage: php api/install-mysql.php
 */

$configExample = __DIR__ . '/config.local.php.example';
$configLocal = __DIR__ . '/config.local.php';
if (is_file($configLocal)) {
    require $configLocal;
} elseif (is_file($configExample)) {
    require $configExample;
}

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$name = getenv('DB_NAME') ?: 'alquran';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
$charset = getenv('DB_CHARSET') ?: 'utf8mb4';

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
        "CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    );
    $pdo->exec("USE `$name`");

    require __DIR__ . '/database.php';
    app_db_migrate_mysql($pdo);

    echo "OK — tabel berhasil dibuat di database `$name`.\n";
    echo "Salin api/config.local.php.example ke api/config.local.php jika belum.\n";
    echo "Lanjutkan: npm run db:sync  (seed CMS + ringkasan tabel)\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'Gagal: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
