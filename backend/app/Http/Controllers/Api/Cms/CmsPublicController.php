<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Models\CmsContentSection;
use App\Models\LearningCategory;
use App\Models\LearningArticle;

class CmsPublicController extends Controller
{
    public function __construct()
    {
        // Removed legacy require_once
    }

    public function all(): JsonResponse
    {
        $sections = CmsContentSection::all();
        $data = ['ok' => true];
        $maxUpdated = 0;
        foreach ($sections as $s) {
            $payload = is_string($s->payload) ? json_decode($s->payload, true) : $s->payload;
            $data[$s->section_key] = $payload;
            if ($s->updated_at > $maxUpdated) {
                $maxUpdated = $s->updated_at;
            }
        }
        $data['updatedAt'] = $maxUpdated;

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
            $cat = LearningCategory::find($categoryId);
            if (!$cat) return response()->json(['ok' => false], 404);
            $articles = LearningArticle::where('category_id', $categoryId)->orderBy('sort_order')->get()->map(function($a) {
                return [
                    'id' => $a->id,
                    'categoryId' => $a->category_id,
                    'title' => $a->title,
                    'summary' => $a->summary,
                    'readMinutes' => $a->read_minutes,
                    'priceIdr' => $a->price_idr,
                    'coinPrice' => $a->coin_price,
                    'preview' => $a->preview,
                    'contentType' => $a->content_type,
                    'pageCount' => $a->page_count,
                    'coverImage' => $a->cover_image,
                    'sortOrder' => $a->sort_order,
                ];
            });
            return response()->json([
                'ok' => true,
                'category' => [
                    'id' => $cat->id,
                    'title' => $cat->title,
                    'description' => $cat->description,
                    'icon' => $cat->icon,
                    'sortOrder' => $cat->sort_order,
                ],
                'articles' => $articles,
            ], 200);
        }

        $categories = LearningCategory::orderBy('sort_order')->get()->map(function($c) {
            return [
                'id' => $c->id,
                'title' => $c->title,
                'description' => $c->description,
                'icon' => $c->icon,
                'sortOrder' => $c->sort_order,
            ];
        });
        return response()->json(['ok' => true, 'categories' => $categories], 200);
    }

    public function learningArticle(Request $request): JsonResponse
    {
        $categoryId = trim((string) $request->query('categoryId', ''));
        $articleId = trim((string) $request->query('articleId', ''));
        
        $article = LearningArticle::with('chapters')->find($articleId);
        if (!$article || $article->category_id !== $categoryId) {
            return response()->json(['ok' => false], 404);
        }
        
        $chapters = $article->chapters->sortBy('sort_order')->map(function($ch) {
            return [
                'id' => $ch->id,
                'title' => $ch->title,
                'body' => $ch->body,
                'sortOrder' => $ch->sort_order,
            ];
        })->values();

        return response()->json([
            'ok' => true,
            'article' => [
                'id' => $article->id,
                'categoryId' => $article->category_id,
                'title' => $article->title,
                'summary' => $article->summary,
                'body' => $article->body,
                'readMinutes' => $article->read_minutes,
                'priceIdr' => $article->price_idr,
                'coinPrice' => $article->coin_price,
                'preview' => $article->preview,
                'contentType' => $article->content_type,
                'pageCount' => $article->page_count,
                'coverImage' => $article->cover_image,
                'sortOrder' => $article->sort_order,
                'chapters' => $chapters,
            ]
        ], 200);
    }
}
