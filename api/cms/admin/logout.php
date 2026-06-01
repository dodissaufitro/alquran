<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

cms_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    cms_error('Method not allowed.', 405);
}

$token = cms_bearer_token();
if ($token !== null && $token !== '') {
    cms_delete_session($token);
}

cms_json(['ok' => true]);
