<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use App\Models\CmsSession;
use App\Models\User;
use App\Models\UserCoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Recording;
use App\Models\Comment;

class CmsAdminListController extends Controller
{
    public function __construct()
    {
        // Removed legacy require_once
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

    public function talaqqiRecordings(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        if ($request->isMethod('delete')) {
            $id = trim((string) ($request->input('id') ?? $request->query('id', '')));
            if ($id === '') {
                return response()->json(['ok' => false, 'error' => 'Parameter id wajib.'], 400);
            }

            try {
                $recording = Recording::find($id);
                if ($recording) {
                    Comment::where('recording_id', $id)->delete();
                    $recording->delete();
                }
                return response()->json(['ok' => true, 'deleted' => $id]);
            } catch (\Throwable $e) {
                return response()->json(['ok' => false, 'error' => $e->getMessage()], 400);
            }
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 50)));
        $authorEmail = trim((string) $request->query('email', ''));
        if ($authorEmail === '') {
            $authorEmail = null;
        }

        try {
            $query = Recording::query();
            if ($authorEmail !== null) {
                $query->where('author_email', $authorEmail);
            }
            $total = $query->count();
            $offset = ($page - 1) * $limit;
            $recordings = $query->orderByDesc('created_at')->offset($offset)->limit($limit)->get();
            
            $items = $recordings->map(function ($r) {
                $commentCount = Comment::where('recording_id', $r->id)->count();
                return [
                    'id' => (string) $r->id,
                    'authorName' => (string) $r->author_name,
                    'authorEmail' => (string) $r->author_email,
                    'authorRole' => (string) $r->author_role,
                    'ayahNumber' => (int) $r->ayah_number,
                    'audioFile' => (string) $r->audio_file,
                    'durationMs' => (int) $r->duration_ms,
                    'createdAt' => (int) $r->created_at,
                    'commentCount' => (int) $commentCount,
                ];
            });

            $totalPages = $limit > 0 ? (int) ceil($total / $limit) : 0;

            return response()->json([
                'ok' => true,
                'items' => $items,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => $totalPages,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function users(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 25)));
        $search = trim((string) $request->query('q', ''));
        $offset = ($page - 1) * $limit;

        $query = User::query();
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%$search%")
                  ->orWhere('name', 'like', "%$search%")
                  ->orWhere('username', 'like', "%$search%");
            });
        }

        $total = $query->count();
        $items = $query->orderByDesc('last_login_at')->orderBy('email')
            ->offset($offset)->limit($limit)
            ->get();

        $emails = $items->pluck('email')->toArray();
        $balances = UserCoin::whereIn('email', $emails)->pluck('balance', 'email');

        $formatted = $items->map(function ($u) use ($balances) {
            return [
                'email' => (string) $u->email,
                'name' => (string) $u->name,
                'username' => $u->username !== null && $u->username !== '' ? (string) $u->username : null,
                'picture' => (string) $u->picture,
                'provider' => (string) $u->provider,
                'isSuperAdmin' => (bool) $u->is_super_admin,
                'balance' => (int) ($balances[$u->email] ?? 0),
                'createdAt' => (int) $u->created_at,
                'updatedAt' => (int) $u->updated_at,
                'lastLoginAt' => (int) $u->last_login_at,
            ];
        });

        $totalPages = $limit > 0 ? (int) ceil($total / $limit) : 0;

        return response()->json([
            'ok' => true,
            'items' => $formatted,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => $totalPages,
        ]);
    }

    public function userCoins(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 25)));
        $search = trim((string) $request->query('q', ''));
        $offset = ($page - 1) * $limit;

        $query = DB::table('users as u')
            ->leftJoin('user_coins as c', 'c.email', '=', 'u.email')
            ->leftJoin(DB::raw('(SELECT email, COUNT(*) as tx_count FROM coin_transactions GROUP BY email) as t'), 't.email', '=', 'u.email');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('u.email', 'like', "%$search%")
                  ->orWhere('u.name', 'like', "%$search%")
                  ->orWhere('u.username', 'like', "%$search%");
            });
        }

        $total = $query->count();
        $items = $query->select([
                'u.email',
                'u.name',
                'u.username',
                'u.provider',
                'u.last_login_at',
                DB::raw('COALESCE(c.balance, 0) as balance'),
                DB::raw('COALESCE(c.updated_at, 0) as coin_updated_at'),
                DB::raw('COALESCE(t.tx_count, 0) as tx_count'),
            ])
            ->orderByDesc('balance')
            ->orderByDesc('u.last_login_at')
            ->orderBy('u.email')
            ->offset($offset)->limit($limit)
            ->get()
            ->map(function ($row) {
                return [
                    'email' => (string) $row->email,
                    'name' => (string) $row->name,
                    'username' => $row->username !== null && $row->username !== '' ? (string) $row->username : null,
                    'provider' => (string) $row->provider,
                    'lastLoginAt' => (int) $row->last_login_at,
                    'balance' => (int) $row->balance,
                    'coinUpdatedAt' => (int) $row->coin_updated_at,
                    'txCount' => (int) $row->tx_count,
                ];
            });

        $totalPages = $limit > 0 ? (int) ceil($total / $limit) : 0;

        return response()->json([
            'ok' => true,
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => $totalPages,
        ]);
    }
}
