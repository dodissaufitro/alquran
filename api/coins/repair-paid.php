<?php
declare(strict_types=1);

/**
 * Perbaiki semua pesanan coin status=paid yang belum dikredit.
 * CLI di server: php api/coins/repair-paid.php
 */

$_SERVER['argv'] = ['repair-paid.php', '--repair'];
require __DIR__ . '/diagnose-coin-orders.php';
