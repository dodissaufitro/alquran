<?php
declare(strict_types=1);

/**
 * Bridge OAuth Google → deep link APK.
 * Daftarkan di Google Console → Authorized redirect URIs:
 *   https://app.talaqee.com/api/auth/google-app-callback.php
 */
$appScheme = 'com.faithfulpath.alquran://oauth';

$code = isset($_GET['code']) ? trim((string) $_GET['code']) : '';
$error = isset($_GET['error']) ? trim((string) $_GET['error']) : '';
$errorDesc = isset($_GET['error_description']) ? trim((string) $_GET['error_description']) : '';

// Fallback jika query string ada tapi $_GET kosong (beberapa proxy)
if ($code === '' && $error === '' && !empty($_SERVER['QUERY_STRING'])) {
    parse_str((string) $_SERVER['QUERY_STRING'], $qs);
    $code = trim((string) ($qs['code'] ?? ''));
    $error = trim((string) ($qs['error'] ?? ''));
    $errorDesc = trim((string) ($qs['error_description'] ?? ''));
}

if ($code === '' && $error === '') {
    header('Content-Type: text/html; charset=utf-8');
    http_response_code(200);
    ?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Faithful Path — OAuth Callback</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 520px; margin: 2rem auto; padding: 0 1rem; color: #1a3d36; line-height: 1.6; }
    h1 { font-size: 1.25rem; }
    code { background: #f0f4f3; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    .ok { color: #2e7d32; font-weight: 600; }
  </style>
</head>
<body>
  <h1>OAuth callback aktif</h1>
  <p class="ok">Endpoint siap.</p>
  <p>Halaman ini <strong>bukan</strong> untuk dibuka langsung. Google mengarahkan ke sini <em>setelah</em> user login, dengan parameter <code>?code=...</code>.</p>
  <p>Di Google Console → OAuth Web client → <strong>Authorized redirect URIs</strong>, pastikan ada:</p>
  <p><code>https://app.talaqee.com/api/auth/google-app-callback.php</code></p>
  <p>Tes bridge (harus muncul link ke app):</p>
  <p><a href="?code=test-bridge">?code=test-bridge</a></p>
</body>
</html>
    <?php
    exit;
}

if ($code !== '') {
    $target = $appScheme . '?code=' . rawurlencode($code);
} else {
    $target = $appScheme . '?error=' . rawurlencode($error);
    if ($errorDesc !== '') {
        $target .= '&error_description=' . rawurlencode($errorDesc);
    }
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Login Faithful Path</title>
  <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($target, ENT_QUOTES, 'UTF-8') ?>" />
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; color: #1a3d36; }
    a { color: #1b5e50; font-weight: 600; }
  </style>
</head>
<body>
  <p>Membuka aplikasi Faithful Path…</p>
  <script>
    window.location.replace(<?= json_encode($target, JSON_UNESCAPED_UNICODE) ?>);
  </script>
  <p><a href="<?= htmlspecialchars($target, ENT_QUOTES, 'UTF-8') ?>">Ketuk di sini jika tidak otomatis</a></p>
</body>
</html>
