<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use App\Models\CmsSession;
use App\Models\YoutubeVideo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmsYoutubeController extends Controller
{
    protected function checkAdminAuth(Request $request): ?JsonResponse
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['ok' => false, 'error' => 'Token admin diperlukan.'], 401);
        }
        CmsSession::where('expires_at', '<', time())->delete();
        $sess = CmsSession::where('token', $token)->first();
        if (!$sess) {
            return response()->json(['ok' => false, 'error' => 'Sesi kedaluwarsa atau tidak valid.'], 401);
        }
        return null;
    }

    protected function seedDefaultIfEmpty(): void
    {
        if (YoutubeVideo::count() > 0) {
            return;
        }

        $now = time();
        $defaults = [
            [
                'title' => 'Kajian & Shorts | Aulia Nurfitri',
                'video_id' => 'r_kjvVzDcic',
                'channel_id' => 'UCo-TAqTPvuYyKB9HZBByQiw',
                'category' => 'Kajian',
                'description' => 'Siaran dan kajian pilihan dari ustadz/pembina.',
                'thumbnail' => 'https://i.ytimg.com/vi/r_kjvVzDcic/hqdefault.jpg',
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Video Kajian Pilihan 2 | Aulia Nurfitri',
                'video_id' => '0nK1ffzq9f8',
                'channel_id' => 'UCo-TAqTPvuYyKB9HZBByQiw',
                'category' => 'Kajian',
                'description' => 'Video kajian tematik lanjutan.',
                'thumbnail' => 'https://i.ytimg.com/vi/0nK1ffzq9f8/hqdefault.jpg',
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Live Makkah Al-Mukarramah 24/7',
                'video_id' => 'XanZ6Iru_kM',
                'channel_id' => null,
                'category' => 'Live Makkah',
                'description' => 'Siaran langsung dari Masjidil Haram Makkah.',
                'thumbnail' => 'https://i.ytimg.com/vi/XanZ6Iru_kM/hqdefault.jpg',
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($defaults as $item) {
            YoutubeVideo::create($item);
        }
    }

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        $this->seedDefaultIfEmpty();

        $items = YoutubeVideo::orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'ok' => true,
            'items' => $items
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'video_id' => 'nullable|string|max:64',
            'channel_id' => 'nullable|string|max:128',
            'url' => 'nullable|string|max:512',
            'thumbnail' => 'nullable|string|max:512',
            'category' => 'nullable|string|max:64',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $item = YoutubeVideo::create([
            'title' => $data['title'],
            'video_id' => $data['video_id'] ?? null,
            'channel_id' => $data['channel_id'] ?? null,
            'url' => $data['url'] ?? null,
            'thumbnail' => $data['thumbnail'] ?? null,
            'category' => $data['category'] ?? 'Kajian',
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json([
            'ok' => true,
            'item' => $item
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        $item = YoutubeVideo::find($id);
        if (!$item) {
            return response()->json(['ok' => false, 'error' => 'Video tidak ditemukan'], 404);
        }

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'video_id' => 'nullable|string|max:64',
            'channel_id' => 'nullable|string|max:128',
            'url' => 'nullable|string|max:512',
            'thumbnail' => 'nullable|string|max:512',
            'category' => 'nullable|string|max:64',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $item->update($data);

        return response()->json([
            'ok' => true,
            'item' => $item
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        $item = YoutubeVideo::find($id);
        if ($item) {
            $item->delete();
        }

        return response()->json([
            'ok' => true
        ]);
    }

    public function publicIndex(): JsonResponse
    {
        $this->seedDefaultIfEmpty();

        YoutubeVideo::where('video_id', 'qoMO5M5zKTM')->update([
            'video_id' => 'XanZ6Iru_kM',
            'thumbnail' => 'https://i.ytimg.com/vi/XanZ6Iru_kM/hqdefault.jpg'
        ]);

        $items = YoutubeVideo::where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'ok' => true,
            'items' => $items
        ]);
    }
}
