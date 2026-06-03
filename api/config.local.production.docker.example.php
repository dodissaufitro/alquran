<?php
declare(strict_types=1);

/**
 * Production Docker — salin ke api/config.local.php di VPS.
 *
 *   cp api/config.local.production.docker.example.php api/config.local.php
 *
 * Sesuaikan DB_PASSWORD dengan password MySQL di host VPS.
 * DB_HOST=host.docker.internal → MySQL di host (bukan di dalam container PHP).
 * Jika MySQL pakai service docker-compose (db), ganti DB_HOST=db.
 */

putenv('DB_DRIVER=mysql');
putenv('DB_HOST=host.docker.internal');
putenv('DB_PORT=3306');
putenv('DB_NAME=alquran');
putenv('DB_USER=root');
putenv('DB_PASSWORD=GANTI_PASSWORD_MYSQL');
putenv('DB_CHARSET=utf8mb4');

putenv('APP_ORIGIN=https://app.talaqee.com');
putenv('APP_ENV=production');
putenv('API_CORS_ORIGIN=https://app.talaqee.com');

putenv('CMS_ADMIN_USER=app.talaqee.com');
putenv('CMS_ADMIN_PASSWORD=GANTI_PASSWORD_CMS_KUAT');

// Google OAuth (backend — tukar token APK / callback)
// putenv('GOOGLE_CLIENT_ID=....apps.googleusercontent.com');
// putenv('GOOGLE_CLIENT_SECRET=GOCSPX-...');

// putenv('SUBSCRIPTION_DEMO_SECRET=faithfulpath-jurnal-demo-2026');
