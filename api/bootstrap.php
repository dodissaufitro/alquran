<?php
declare(strict_types=1);

/** Bootstrap API — muat .env lalu koneksi database */
if (defined('TALAQEE_API_BOOTSTRAPPED')) {
    return;
}

define('TALAQEE_API_BOOTSTRAPPED', true);

require_once __DIR__ . '/env.php';
app_load_config();
require_once __DIR__ . '/database.php';
