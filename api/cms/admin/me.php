<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    cms_error('Method not allowed.', 405);
}

cms_require_auth();

cms_json([
    'ok' => true,
    'username' => cms_admin_user(),
    'sections' => CMS_SECTION_KEYS,
]);
