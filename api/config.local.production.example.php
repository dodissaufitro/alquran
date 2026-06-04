<?php
declare(strict_types=1);

/**
 * Salin ke server sebagai api/config.local.php (jangan commit password asli).
 * Docker: ganti DB_HOST ke host.docker.internal atau db
 */

putenv('DB_DRIVER=mysql');
// IP MySQL di VPS (cek health.php → db.host), atau host.docker.internal jika MySQL di host Docker
putenv('DB_HOST=182.16.255.93');
putenv('DB_PORT=3306');
putenv('DB_NAME=alquran');
putenv('DB_USER=alquran');
putenv('DB_PASSWORD=GANTI_PASSWORD_MYSQL');
putenv('DB_CHARSET=utf8mb4');

$_ENV['DB_DRIVER'] = 'mysql';
$_ENV['DB_HOST'] = '182.16.255.93';
$_ENV['DB_PORT'] = '3306';
$_ENV['DB_NAME'] = 'alquran';
$_ENV['DB_USER'] = 'alquran';
$_ENV['DB_PASSWORD'] = 'GANTI_PASSWORD_MYSQL';
$_ENV['DB_CHARSET'] = 'utf8mb4';
