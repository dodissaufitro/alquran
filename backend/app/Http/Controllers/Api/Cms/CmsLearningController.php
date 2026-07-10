<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use App\Models\CmsSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Models\LearningArticle;
use App\Models\LearningCategory;
use App\Models\LearningChapter;
use Illuminate\Support\Facades\DB;

class CmsLearningController extends Controller
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

    public function handle(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        $now = time();

        if ($request->isMethod('delete')) {
            $articleId = trim((string) $request->query('articleId', ''));
            if ($articleId === '') {
                return response()->json(['ok' => false, 'error' => 'Parameter articleId wajib.'], 400);
            }

            try {
                $article = LearningArticle::find($articleId);
                if (!$article) {
                    throw new \InvalidArgumentException('Artikel tidak ditemukan.');
                }
                LearningChapter::where('article_id', $articleId)->delete();
                $article->delete();
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
            DB::beginTransaction();

            if ($previousArticleId && $previousArticleId !== $article['id']) {
                $existing = LearningArticle::find($previousArticleId);
                if ($existing) {
                    DB::table('learning_articles')->where('id', $previousArticleId)->update(['id' => $article['id']]);
                    DB::table('learning_chapters')->where('article_id', $previousArticleId)->update(['article_id' => $article['id']]);
                }
            }

            if ($categoryMeta) {
                LearningCategory::updateOrCreate(
                    ['id' => $categoryId],
                    [
                        'title' => $categoryMeta['title'] ?? '',
                        'description' => $categoryMeta['description'] ?? '',
                        'icon' => $categoryMeta['icon'] ?? '',
                        'sort_order' => $categoryMeta['sortOrder'] ?? 0,
                        'updated_at' => $now,
                    ]
                );
            }

            LearningArticle::updateOrCreate(
                ['id' => $article['id']],
                [
                    'category_id' => $categoryId,
                    'title' => $article['title'] ?? '',
                    'summary' => $article['summary'] ?? '',
                    'body' => $article['body'] ?? '',
                    'read_minutes' => $article['readMinutes'] ?? 0,
                    'price_idr' => $article['priceIdr'] ?? 0,
                    'coin_price' => $article['coinPrice'] ?? 0,
                    'preview' => $article['preview'] ?? '',
                    'content_type' => $article['contentType'] ?? 'jurnal',
                    'page_count' => $article['pageCount'] ?? 0,
                    'cover_image' => $article['coverImage'] ?? '',
                    'sort_order' => $sortOrder,
                    'updated_at' => $now,
                ]
            );

            if (isset($article['chapters']) && is_array($article['chapters'])) {
                LearningChapter::where('article_id', $article['id'])->delete();
                foreach ($article['chapters'] as $idx => $chapter) {
                    LearningChapter::create([
                        'id' => $chapter['id'] ?? uniqid(),
                        'article_id' => $article['id'],
                        'title' => $chapter['title'] ?? '',
                        'body' => $chapter['body'] ?? '',
                        'sort_order' => $idx,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 400);
        }
    }
}
