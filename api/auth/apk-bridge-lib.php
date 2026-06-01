<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap-lite.php';

function apk_bridge_storage_dir(): string
{
    $dir = __DIR__ . '/../data/apk-bridge';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return $dir;
}

function apk_bridge_decode_jwt_payload(string $jwt): ?array
{
    $parts = explode('.', $jwt);
    if (count($parts) < 2) {
        return null;
    }
    $b64 = strtr($parts[1], '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad > 0) {
        $b64 .= str_repeat('=', 4 - $pad);
    }
    $json = base64_decode($b64, true);
    if ($json === false) {
        return null;
    }
    $payload = json_decode($json, true);
    return is_array($payload) ? $payload : null;
}

/** @param array<string, mixed> $data */
function apk_bridge_create(array $data): string
{
    apk_bridge_gc();
    $bridge = bin2hex(random_bytes(16));
    $payload = [
        'created' => time(),
        'expires' => time() + 300,
        'data' => $data,
    ];
    $path = apk_bridge_storage_dir() . '/' . $bridge . '.json';
    file_put_contents($path, json_encode($payload, JSON_UNESCAPED_UNICODE));
    return $bridge;
}

/** @return array<string, mixed>|null */
function apk_bridge_peek(string $bridge): ?array
{
    if (!preg_match('/^[a-f0-9]{32}$/', $bridge)) {
        return null;
    }
    $path = apk_bridge_storage_dir() . '/' . $bridge . '.json';
    if (!is_file($path)) {
        return null;
    }
    $raw = file_get_contents($path);
    if ($raw === false) {
        return null;
    }
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        return null;
    }
    $expires = (int) ($payload['expires'] ?? 0);
    if ($expires < time()) {
        @unlink($path);
        return null;
    }
    $data = $payload['data'] ?? null;
    return is_array($data) ? $data : null;
}

/** @return array<string, mixed>|null */
function apk_bridge_consume(string $bridge): ?array
{
    $data = apk_bridge_peek($bridge);
    if ($data === null) {
        return null;
    }
    $path = apk_bridge_storage_dir() . '/' . $bridge . '.json';
    @unlink($path);
    return $data;
}

function apk_bridge_gc(): void
{
    $dir = apk_bridge_storage_dir();
    foreach (glob($dir . '/*.json') ?: [] as $file) {
        $raw = @file_get_contents($file);
        if ($raw === false) {
            continue;
        }
        $payload = json_decode($raw, true);
        $expires = is_array($payload) ? (int) ($payload['expires'] ?? 0) : 0;
        if ($expires > 0 && $expires < time()) {
            @unlink($file);
        }
    }
}

function apk_bridge_redirect_to_app(string $deepLink): void
{
    app_load_config();
    $androidPackage = app_android_package();

    header('Content-Type: text/html; charset=utf-8');
    $isAndroid = isset($_SERVER['HTTP_USER_AGENT'])
        && stripos((string) $_SERVER['HTTP_USER_AGENT'], 'Android') !== false;

    $intentTarget = null;
    if ($isAndroid && preg_match('#^' . preg_quote($androidPackage, '#') . '://oauth\?(.+)$#', $deepLink, $m)) {
        $intentTarget = 'intent://oauth?' . $m[1]
            . '#Intent;scheme=' . $androidPackage . ';package=' . $androidPackage . ';end';
    }
    ?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kembali ke Talaqee</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; color: #1a3d36; }
    a.btn { display: inline-block; margin-top: 1rem; padding: 12px 20px; border-radius: 999px;
      background: #1b5e50; color: #fff; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <p>Login berhasil. Membuka aplikasi Talaqee…</p>
  <script>
    (function () {
      var scheme = <?= json_encode($deepLink, JSON_UNESCAPED_UNICODE) ?>;
      <?php if ($intentTarget !== null): ?>
      var intent = <?= json_encode($intentTarget, JSON_UNESCAPED_UNICODE) ?>;
      window.location.href = intent;
      setTimeout(function () { window.location.href = scheme; }, 1000);
      <?php else: ?>
      window.location.replace(scheme);
      <?php endif; ?>
    })();
  </script>
  <p><a class="btn" href="<?= htmlspecialchars($deepLink, ENT_QUOTES, 'UTF-8') ?>">Buka aplikasi Talaqee</a></p>
</body>
</html>
    <?php
    exit;
}
