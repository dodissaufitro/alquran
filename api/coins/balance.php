<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    coins_error('Method not allowed.', 405);
}

$email = coins_authenticated_email((string) ($_GET['email'] ?? ''));
subscription_json_response(coins_wallet_payload($email));
