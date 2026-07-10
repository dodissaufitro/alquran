<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use App\Models\CmsSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmsAuthController extends Controller
{
    public function __construct()
    {
        require_once base_path('../api/cms/bootstrap.php');
    }

    public function login(Request $request): JsonResponse
    {
        $username = trim((string) $request->input('username', ''));
        $password = (string) $request->input('password', '');

        if ($username === '' || $password === '') {
            return response()->json(['ok' => false, 'error' => 'Username dan password wajib diisi.'], 400);
        }

        if (function_exists('cms_enforce_login_rate_limit')) {
            try {
                cms_enforce_login_rate_limit();
            } catch (\Throwable $e) {
                // Ignore rate limit throw on dev or let cms_error handle
            }
        }

        if (!cms_verify_login($username, $password)) {
            return response()->json(['ok' => false, 'error' => 'Login gagal. Periksa username/password.'], 401);
        }

        if (function_exists('cms_clear_login_rate_limit')) {
            try {
                cms_clear_login_rate_limit();
            } catch (\Throwable $e) {}
        }

        $token = bin2hex(random_bytes(32));
        $ttl = function_exists('cms_session_ttl') ? cms_session_ttl() : 2592000;

        CmsSession::create([
            'token' => $token,
            'expires_at' => time() + $ttl,
            'created_at' => time(),
        ]);

        return response()->json([
            'ok' => true,
            'token' => $token,
            'expiresIn' => $ttl,
            'username' => function_exists('cms_admin_user') ? cms_admin_user() : $username,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        if ($token) {
            CmsSession::where('token', $token)->delete();
        }
        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        return response()->json([
            'ok' => true,
            'user' => [
                'username' => function_exists('cms_admin_user') ? cms_admin_user() : 'admin',
            ],
        ]);
    }

    protected function checkAdminAuth(Request $request): ?JsonResponse
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['ok' => false, 'error' => 'Token admin diperlukan.'], 401);
        }
        CmsSession::where('expires_at', '<', time())->delete();
        $session = CmsSession::where('token', $token)->where('expires_at', '>', time())->first();
        if (!$session) {
            return response()->json(['ok' => false, 'error' => 'Sesi admin tidak valid atau kedaluwarsa.'], 401);
        }
        return null;
    }
}
