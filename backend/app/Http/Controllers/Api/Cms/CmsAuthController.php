<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use App\Models\CmsSession;
use App\Models\CmsAdmin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmsAuthController extends Controller
{
    public function __construct()
    {
        // Removed legacy require_once
    }

    public function login(Request $request): JsonResponse
    {
        $username = trim((string) $request->input('username', ''));
        $password = (string) $request->input('password', '');

        if ($username === '' || $password === '') {
            return response()->json(['ok' => false, 'error' => 'Username dan password wajib diisi.'], 400);
        }

        $admin = CmsAdmin::where('username', $username)->first();

        if (!$admin || !Hash::check($password, $admin->password)) {
            return response()->json(['ok' => false, 'error' => 'Login gagal. Periksa username/password.'], 401);
        }

        $token = bin2hex(random_bytes(32));
        $ttl = (int) env('CMS_SESSION_TTL_SECONDS', 2592000);

        CmsSession::create([
            'token' => $token,
            'expires_at' => time() + $ttl,
            'created_at' => time(),
        ]);

        return response()->json([
            'ok' => true,
            'token' => $token,
            'expiresIn' => $ttl,
            'username' => $username,
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
                'username' => env('CMS_ADMIN_USER', 'admin'),
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
