<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    talaqqi_error('Method not allowed', 405);
}

talaqqi_json_response([
    'ok' => true,
    'service' => app_service_id('talaqqi-php'),
    'room' => app_env('TALAQQI_CHAT_ROOM', 'talaqqi-fatihah'),
    'version' => 1,
    'serverTime' => (int) (microtime(true) * 1000),
]);
