<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    talaqqi_error('Method not allowed', 405);
}

try {
    $pdo = talaqqi_db();

    // Ambil semua santri (bukan super admin) dari tabel users,
    // lalu gabung dengan jumlah rekaman dari tabel recordings.
    $stmt = $pdo->query(
        "SELECT
            u.email,
            u.name,
            COALESCE(r.recording_count, 0)  AS recording_count,
            COALESCE(r.last_activity, 0)    AS last_activity
         FROM users u
         LEFT JOIN (
             SELECT author_email,
                    COUNT(*)  AS recording_count,
                    MAX(created_at) AS last_activity
             FROM recordings
             WHERE author_email IS NOT NULL AND TRIM(author_email) != ''
             GROUP BY author_email
         ) r ON LOWER(r.author_email) = LOWER(u.email)
         WHERE u.is_super_admin = 0
         ORDER BY last_activity DESC, u.name ASC"
    );

    $rows   = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $santri = array_map(static function (array $row): array {
        return [
            'email'          => $row['email'],
            'name'           => $row['name'] ?: $row['email'],
            'recordingCount' => (int) $row['recording_count'],
            'lastActivity'   => (int) $row['last_activity'],
        ];
    }, $rows);

    talaqqi_json_response([
        'ok'         => true,
        'santri'     => $santri,
        'serverTime' => (int) (microtime(true) * 1000),
    ]);
} catch (Throwable $e) {
    talaqqi_error($e->getMessage(), 500);
}
