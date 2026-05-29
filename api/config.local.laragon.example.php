<?php
declare(strict_types=1);

/**
 * Laragon local — salin ke api/config.local.php untuk dev di PC
 * (Production VPS pakai config dari config.local.production.example.php)
 */

putenv('DB_DRIVER=mysql');
putenv('DB_HOST=127.0.0.1');
putenv('DB_PORT=3306');
putenv('DB_NAME=alquran');
putenv('DB_USER=root');
putenv('DB_PASSWORD=');
putenv('DB_CHARSET=utf8mb4');

putenv('CMS_ADMIN_USER=admin');
putenv('CMS_ADMIN_PASSWORD=faithfulpath-cms-2026');

/** Sama dengan VITE_GOOGLE_CLIENT_ID di .env */
putenv('GOOGLE_CLIENT_ID=GANTI_DENGAN_GOOGLE_CLIENT_ID.apps.googleusercontent.com');
putenv('GOOGLE_CLIENT_SECRET=GANTI_DENGAN_GOOGLE_CLIENT_SECRET');
