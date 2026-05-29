<?php
declare(strict_types=1);

/**
 * Bridge OAuth Google → deep link APK.
 * Daftarkan di Google Console → Authorized redirect URIs (Web client):
 *   https://app.talaqee.com/api/auth/google-app-callback.php
 */
$appScheme = 'com.faithfulpath.alquran://oauth';
$redirectUri = 'https://app.talaqee.com/api/auth/google-app-callback.php';

$configLocal = __DIR__ . '/../config.local.php';
if (is_file($configLocal)) {
    require $configLocal;
}

function google_callback_redirect(string $deepLink): void
{
    header('Content-Type: text/html; charset=utf-8');
    $isAndroid = isset($_SERVER['HTTP_USER_AGENT'])
        && stripos((string) $_SERVER['HTTP_USER_AGENT'], 'Android') !== false;

    $intentTarget = null;
    if ($isAndroid && preg_match('#^com\.faithfulpath\.alquran://oauth\?(.+)$#', $deepLink, $m)) {
        $intentTarget = 'intent://oauth?' . $m[1]
            . '#Intent;scheme=com.faithfulpath.alquran;package=com.faithfulpath.alquran;end';
    }
    ?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Login Faithful Path</title>
  <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($deepLink, ENT_QUOTES, 'UTF-8') ?>" />
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; color: #1a3d36; }
    a { color: #1b5e50; font-weight: 600; display: block; margin: 1rem 0; }
  </style>
</head>
<body>
  <p>Membuka aplikasi Faithful Path…</p>
  <script>
    (function () {
      var scheme = <?= json_encode($deepLink, JSON_UNESCAPED_UNICODE) ?>;
      <?php if ($intentTarget !== null): ?>
      var intent = <?= json_encode($intentTarget, JSON_UNESCAPED_UNICODE) ?>;
      window.location.href = intent;
      setTimeout(function () { window.location.href = scheme; }, 1200);
      <?php else: ?>
      window.location.replace(scheme);
      <?php endif; ?>
    })();
  </script>
  <p><a href="<?= htmlspecialchars($deepLink, ENT_QUOTES, 'UTF-8') ?>">Buka aplikasi (tap jika tidak otomatis)</a></p>
</body>
</html>
    <?php
    exit;
}

function google_exchange_code(string $code, string $redirectUri): ?string
{
    $clientId = getenv('GOOGLE_CLIENT_ID') ?: '';
    $clientSecret = getenv('GOOGLE_CLIENT_SECRET') ?: '';
    if ($clientId === '' || $clientSecret === '') {
        return null;
    }

    $ch = curl_init('https://oauth2.googleapis.com/token');
    if ($ch === false) {
        return null;
    }

    $postFields = http_build_query([
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'code' => $code,
        'redirect_uri' => $redirectUri,
        'grant_type' => 'authorization_code',
    ]);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    $token = json_decode($response, true);
    if (!is_array($token) || empty($token['access_token'])) {
        return null;
    }

    return (string) $token['access_token'];
}

$code = isset($_GET['code']) ? trim((string) $_GET['code']) : '';
$error = isset($_GET['error']) ? trim((string) $_GET['error']) : '';
$errorDesc = isset($_GET['error_description']) ? trim((string) $_GET['error_description']) : '';

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
  <p>Daftarkan di Google Console → OAuth Web client → <strong>Authorized redirect URIs</strong>:</p>
  <p><code><?= htmlspecialchars($redirectUri, ENT_QUOTES, 'UTF-8') ?></code></p>
</body>
</html>
    <?php
    exit;
}

if ($error !== '') {
    $target = $appScheme . '?error=' . rawurlencode($error);
    if ($errorDesc !== '') {
        $target .= '&error_description=' . rawurlencode($errorDesc);
    }
    google_callback_redirect($target);
}

if ($code === 'test-bridge') {
    google_callback_redirect($appScheme . '?access_token=test-bridge-token');
}

$accessToken = google_exchange_code($code, $redirectUri);
if ($accessToken === null) {
    google_callback_redirect(
        $appScheme . '?error=' . rawurlencode('Gagal menukar kode Google. Cek GOOGLE_CLIENT_SECRET di server.')
    );
}

google_callback_redirect($appScheme . '?access_token=' . rawurlencode($accessToken));
