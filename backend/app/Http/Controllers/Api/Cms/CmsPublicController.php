<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmsPublicController extends Controller
{
    public function __construct()
    {
        require_once base_path('../api/cms/bootstrap.php');
    }

    public function all(): JsonResponse
    {
        $data = cms_get_all_public();
        $updatedAt = (int) ($data['updatedAt'] ?? 0);
        if ($updatedAt > 0) {
            $etag = 'W/"cms-' . dechex($updatedAt) . '"';
            $ifNoneMatch = trim((string) request()->header('If-None-Match', ''));
            if ($ifNoneMatch === $etag || $ifNoneMatch === trim($etag, 'W/')) {
                return response()->json([], 304);
            }
            return response()->json($data)
                ->header('ETag', $etag)
                ->header('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
        }
        return response()->json($data);
    }

    public function health(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'service' => 'Talaqee CMS Backend (Laravel)',
            'time' => time(),
        ]);
    }

    public function learning(Request $request): JsonResponse
    {
        $categoryId = trim((string) $request->query('categoryId', ''));
        if ($categoryId !== '') {
            $data = cms_public_learning_category_payload($categoryId);
            return response()->json($data, $data['ok'] ? 200 : 404);
        }
        $data = cms_public_learning_payload();
        return response()->json($data);
    }

    public function learningArticle(Request $request): JsonResponse
    {
        $categoryId = trim((string) $request->query('categoryId', ''));
        $articleId = trim((string) $request->query('articleId', ''));
        $data = cms_public_learning_article_detail_payload($categoryId, $articleId);
        return response()->json($data, $data['ok'] ? 200 : 404);
    }
}
