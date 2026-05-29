<?php
declare(strict_types=1);

/**
 * Production — https://app.talaqee.com/
 * MySQL di host VPS (bukan container `db`).
 *
 * Salin ke api/config.local.php di server:
 *   cp api/config.local.production.example.php api/config.local.php
 * Lalu isi DB_PASSWORD yang benar.
 */

putenv('DB_DRIVER=mysql');
// Container Docker → MySQL di host: host.docker.internal
// MySQL di server VPS app.talaqee.com — dari container pakai host.docker.internal
putenv('DB_HOST=host.docker.internal');
putenv('DB_PORT=3306');
putenv('DB_NAME=alquran');
putenv('DB_USER=alquran');
putenv('DB_PASSWORD=GANTI_PASSWORD_DB');
putenv('DB_CHARSET=utf8mb4');

putenv('CMS_ADMIN_USER=admin');
putenv('CMS_ADMIN_PASSWORD=GANTI_PASSWORD_CMS_KUAT');

putenv('GOOGLE_CLIENT_ID=GANTI_CLIENT_ID.apps.googleusercontent.com');
putenv('GOOGLE_CLIENT_SECRET=GANTI_CLIENT_SECRET');
