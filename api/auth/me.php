<?php
declare(strict_types=1);

require_once __DIR__ . '/auth-bootstrap.php';

// Mendukung request OPTIONS (CORS) sudah di-handle oleh auth-bootstrap.php

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    auth_error('Method not allowed.', 405);
}

if (isset($_SESSION['user'])) {
    auth_touch_session_activity();
    auth_json([
        'ok' => true,
        'user' => $_SESSION['user'],
    ]);
} else {
    auth_json([
        'ok' => false,
        'error' => 'No active user session.',
    ], 401);
}
