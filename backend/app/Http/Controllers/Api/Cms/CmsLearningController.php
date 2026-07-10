<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use App\Models\CmsSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmsLearningController extends Controller
{
    public function __construct()
    {
        require_once base_path('../api/cms/bootstrap.php');
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

    public function handle(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        $pdo = cms_db();
        $now = time();

        if ($request->isMethod('delete')) {
            $articleId = trim((string) $request->query('articleId', ''));
            if ($articleId === '') {
                return response()->json(['ok' => false, 'error' => 'Parameter articleId wajib.'], 400);
            }

            try {
                learning_store_delete_single_article($pdo, $articleId, $now);
                return response()->json(['ok' => true, 'deleted' => $articleId]);
            } catch (\InvalidArgumentException $e) {
                return response()->json(['ok' => false, 'error' => $e->getMessage()], 404);
            } catch (\Throwable $e) {
                return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
            }
        }

        // PUT/POST
        $categoryId = trim((string) $request->input('categoryId', ''));
        $article = $request->input('article');
        $sortOrder = (int) $request->input('sortOrder', 0);
        $categoryMeta = $request->input('category');
        $previousArticleId = trim((string) $request->input('previousArticleId', ''));
        if ($previousArticleId === '') {
            $previousArticleId = null;
        }

        if ($categoryId === '') {
            return response()->json(['ok' => false, 'error' => 'Field categoryId wajib.'], 400);
        }
        if (!is_array($article)) {
            return response()->json(['ok' => false, 'error' => 'Field article wajib (objek).'], 400);
        }
        if ($categoryMeta !== null && !is_array($categoryMeta)) {
            return response()->json(['ok' => false, 'error' => 'Field category harus objek jika dikirim.'], 400);
        }

        try {
            learning_store_upsert_single_article(
                $pdo,
                $categoryId,
                $article,
                $sortOrder,
                $now,
                is_array($categoryMeta) ? $categoryMeta : null,
                $previousArticleId,
            );
            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 400);
        }
    }
}
