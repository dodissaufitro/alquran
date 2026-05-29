<?php
declare(strict_types=1);

/**
 * Bridge OAuth Google → deep link APK.
 * Daftarkan URL ini di Google Console → Authorized redirect URIs:
 *   https://app.talaqee.com/api/auth/google-app-callback.php
 */
$appScheme = 'com.faithfulpath.alquran://oauth';

$code = isset($_GET['code']) ? trim((string) $_GET['code']) : '';
$error = isset($_GET['error']) ? trim((string) $_GET['error']) : '';
$errorDesc = isset($_GET['error_description']) ? trim((string) $_GET['error_description']) : '';

if ($code !== '') {
    $target = $appScheme . '?code=' . rawurlencode($code);
} elseif ($error !== '') {
    $target = $appScheme . '?error=' . rawurlencode($error);
    if ($errorDesc !== '') {
        $target .= '&error_description=' . rawurlencode($errorDesc);
    }
} else {
    http_response_code(400);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><body><p>Parameter OAuth tidak ditemukan.</p></body></html>';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Login Faithful Path</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; color: #1a3d36; }
  </style>
</head>
<body>
  <p>Login berhasil. Kembali ke aplikasi…</p>
  <script>
    window.location.replace(<?= json_encode($target, JSON_UNESCAPED_UNICODE) ?>);
  </script>
  <p><a href="<?= htmlspecialchars($target, ENT_QUOTES, 'UTF-8') ?>">Ketuk di sini jika tidak otomatis</a></p>
</body>
</html>
