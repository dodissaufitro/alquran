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

    $where = '';
    $params = [];
    if ($search !== '') {
        $like = '%' . $search . '%';
        $where = ' WHERE (email LIKE :q OR name LIKE :q OR username LIKE :q)';
        $params['q'] = $like;
    }

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM users' . $where);
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $sql = 'SELECT email, name, username, picture, provider, is_super_admin, created_at, updated_at, last_login_at
            FROM users'
        . $where
        . ' ORDER BY last_login_at DESC, email ASC
            LIMIT :limit OFFSET :offset';

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
            'picture' => (string) ($row['picture'] ?? ''),
            'provider' => (string) ($row['provider'] ?? ''),
            'isSuperAdmin' => (int) ($row['is_super_admin'] ?? 0) === 1,
            'createdAt' => (int) ($row['created_at'] ?? 0),
            'updatedAt' => (int) ($row['updated_at'] ?? 0),
            'lastLoginAt' => (int) ($row['last_login_at'] ?? 0),
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
