<?php
declare(strict_types=1);

/** Bootstrap ringan — tanpa koneksi database (bridge OAuth APK) */
if (defined('TALAQEE_API_BOOTSTRAPPED_LITE')) {
    return;
}

define('TALAQEE_API_BOOTSTRAPPED_LITE', true);

require_once __DIR__ . '/env.php';
app_load_config();
