<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    talaqqi_error('Method not allowed', 405);
}

talaqqi_json_response([
    'ok' => true,
    'service' => 'faithfulpath-talaqqi-php',
    'room' => 'talaqqi-fatihah',
    'version' => 1,
    'serverTime' => (int) (microtime(true) * 1000),
]);
