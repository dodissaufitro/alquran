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

$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$limit = isset($_GET['limit']) ? min(100, max(1, (int) $_GET['limit'])) : 25;
$search = trim((string) ($_GET['q'] ?? ''));
$offset = ($page - 1) * $limit;

try {
    $pdo = cms_db();

    if (!app_table_exists($pdo, 'users')) {
        cms_json([
            'ok' => true,
            'items' => [],
            'total' => 0,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => 0,
        ]);
    }

    $hasCoins = app_table_exists($pdo, 'user_coins');
    $hasTx = app_table_exists($pdo, 'coin_transactions');

    $joinCoins = $hasCoins
        ? 'LEFT JOIN user_coins c ON c.email = u.email'
        : '';
    $balanceExpr = $hasCoins ? 'COALESCE(c.balance, 0)' : '0';
    $updatedExpr = $hasCoins ? 'COALESCE(c.updated_at, 0)' : '0';

    $txJoin = $hasTx
        ? 'LEFT JOIN (
                SELECT email, COUNT(*) AS tx_count
                FROM coin_transactions
                GROUP BY email
           ) t ON t.email = u.email'
        : '';
    $txCountExpr = $hasTx ? 'COALESCE(t.tx_count, 0)' : '0';

    $where = '';
    $params = [];
    if ($search !== '') {
        $like = '%' . $search . '%';
        $where = ' WHERE (u.email LIKE :q OR u.name LIKE :q OR u.username LIKE :q)';
        $params['q'] = $like;
    }

    $from = "FROM users u {$joinCoins} {$txJoin}";

    $countStmt = $pdo->prepare("SELECT COUNT(*) {$from}" . $where);
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $sql = "SELECT
                u.email,
                u.name,
                u.username,
                u.provider,
                u.last_login_at,
                {$balanceExpr} AS balance,
                {$updatedExpr} AS coin_updated_at,
                {$txCountExpr} AS tx_count
            {$from}"
        . $where
        . " ORDER BY balance DESC, u.last_login_at DESC, u.email ASC
            LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $items = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $items[] = [
            'email' => (string) ($row['email'] ?? ''),
            'name' => (string) ($row['name'] ?? ''),
            'username' => $row['username'] !== null && $row['username'] !== ''
                ? (string) $row['username']
                : null,
            'provider' => (string) ($row['provider'] ?? ''),
            'lastLoginAt' => (int) ($row['last_login_at'] ?? 0),
            'balance' => (int) ($row['balance'] ?? 0),
            'coinUpdatedAt' => (int) ($row['coin_updated_at'] ?? 0),
            'txCount' => (int) ($row['tx_count'] ?? 0),
        ];
    }

    $totalPages = $limit > 0 ? (int) ceil($total / $limit) : 0;

    cms_json([
        'ok' => true,
        'items' => $items,
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'totalPages' => $totalPages,
    ]);
} catch (Throwable $e) {
    cms_error($e->getMessage(), 503);
}
