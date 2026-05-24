<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    talaqqi_error('Method not allowed', 405);
}

try {
    $pdo = talaqqi_db();
    $stmt = $pdo->query(
        "SELECT author_email AS email,
                MAX(author_name) AS name,
                COUNT(*) AS recording_count,
                MAX(created_at) AS last_activity
         FROM recordings
         WHERE author_email IS NOT NULL AND TRIM(author_email) != ''
         GROUP BY author_email
         ORDER BY last_activity DESC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $santri = array_map(static function (array $row): array {
        return [
            'email' => $row['email'],
            'name' => $row['name'] ?: $row['email'],
            'recordingCount' => (int) $row['recording_count'],
            'lastActivity' => (int) $row['last_activity'],
        ];
    }, $rows);

    talaqqi_json_response([
        'ok' => true,
        'santri' => $santri,
        'serverTime' => (int) (microtime(true) * 1000),
    ]);
} catch (Throwable $e) {
    talaqqi_error($e->getMessage(), 500);
}
