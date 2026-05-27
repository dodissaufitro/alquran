<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'DELETE') {
    talaqqi_error('Method not allowed', 405);
}

$data = talaqqi_read_delete_json();
if ($data === null) {
    talaqqi_error('JSON tidak valid.');
}

talaqqi_delete_comment($data);
