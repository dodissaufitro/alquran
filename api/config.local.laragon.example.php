<?php
declare(strict_types=1);

/**
 * DEPRECATED — gunakan file .env di root proyek.
 * Salin: cp .env.example .env
 *
 * File ini hanya override opsional jika benar-benar diperlukan.
 */
require_once __DIR__ . '/env.php';
app_load_dotenv();
