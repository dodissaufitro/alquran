<?php
declare(strict_types=1);

/**
 * Verifikasi Google ID token (server-side) — jangan hanya decode JWT payload.
 */
require_once __DIR__ . '/../bootstrap-lite.php';

/**
 * @return array{email:string,name:string,picture:?string,sub:?string}|null
 */
function google_verify_id_token(string $idToken): ?array
{
    $idToken = trim($idToken);
    if ($idToken === '' || substr_count($idToken, '.') < 2) {
        return null;
    }

    $clientId = trim((string) (app_env('GOOGLE_CLIENT_ID') ?: ''));
    if ($clientId === '') {
        error_log('[google-verify] GOOGLE_CLIENT_ID tidak diset');
        return null;
    }

    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($idToken);
    $ch = curl_init($url);
    if ($ch === false) {
        return null;
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $code < 200 || $code >= 300) {
        error_log('[google-verify] tokeninfo HTTP ' . $code);
        return null;
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        return null;
    }

    if (isset($data['error'])) {
        error_log('[google-verify] ' . (string) ($data['error_description'] ?? $data['error']));
        return null;
    }

    $aud = (string) ($data['aud'] ?? '');
    if ($aud !== $clientId) {
        error_log('[google-verify] aud mismatch');
        return null;
    }

    $email = trim((string) ($data['email'] ?? ''));
    if ($email === '' || !str_contains($email, '@')) {
        return null;
    }

    $exp = (int) ($data['exp'] ?? 0);
    if ($exp > 0 && $exp < time()) {
        return null;
    }

    $name = trim((string) ($data['name'] ?? $data['given_name'] ?? $email));
    $picture = trim((string) ($data['picture'] ?? ''));

    return [
        'email' => strtolower($email),
        'name' => $name !== '' ? $name : $email,
        'picture' => $picture !== '' ? $picture : null,
        'sub' => isset($data['sub']) ? (string) $data['sub'] : null,
    ];
}

/** @return array{email:string,name:string,picture:?string}|null */
function google_fetch_userinfo(string $accessToken): ?array
{
    $accessToken = trim($accessToken);
    if ($accessToken === '') {
        return null;
    }

    $ch = curl_init('https://www.googleapis.com/oauth2/v3/userinfo');
    if ($ch === false) {
        return null;
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken],
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $code < 200 || $code >= 300) {
        return null;
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        return null;
    }

    $email = trim((string) ($data['email'] ?? ''));
    if ($email === '' || !str_contains($email, '@')) {
        return null;
    }

    $name = trim((string) ($data['name'] ?? $email)) ?: $email;
    $picture = trim((string) ($data['picture'] ?? ''));

    return [
        'email' => strtolower($email),
        'name' => $name,
        'picture' => $picture !== '' ? $picture : null,
    ];
}
