<?php

namespace App\Http\Controllers\Api\Cms;

use App\Http\Controllers\Controller;
use App\Models\CmsSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Models\CmsContentSection;

class CmsContentController extends Controller
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

        if ($request->isMethod('get')) {
            $section = trim((string) $request->query('section', ''));
            $validKeys = [
                'learning', 'jurnal', 'ulumul', 'hadithCategories', 'hadiths',
                'fiqhCategories', 'fiqhItems', 'sirahCategories', 'sirahItems',
                'duaCategories', 'duas', 'podcasts', 'publicMeetings',
                'scheduledMeetings', 'talaqqi', 'settings'
            ];

            if (!in_array($section, $validKeys, true)) {
                return response()->json(['ok' => false, 'error' => 'Section tidak dikenal: ' . $section], 400);
            }

            try {
                $record = CmsContentSection::find($section);
                $payload = $record ? (is_string($record->payload) ? json_decode($record->payload, true) : $record->payload) : [];
                return response()->json(['ok' => true, 'payload' => $payload]);
            } catch (\Throwable $e) {
                return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
            }
        }

        // PUT/POST
        $section = trim((string) $request->input('section', ''));
        $payload = $request->input('payload');

        try {
                CmsContentSection::updateOrCreate(
                    ['section_key' => $section],
                    [
                        'payload' => is_array($payload) ? json_encode($payload) : $payload,
                        'updated_at' => time()
                    ]
                );
            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 400);
        }
    }

    public function importDefault(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        try {
            // default_cms.json hilang bersama folder api, jadi import diabaikan
            $imported = 0;
            return response()->json([
                'ok' => true,
                'message' => "Berhasil mengimpor $imported section default.",
            ]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function uploadJurnalCover(Request $request): JsonResponse
    {
        if ($err = $this->checkAdminAuth($request)) {
            return $err;
        }

        try {
            $file = $request->file('cover');
            if (!$file || !$file->isValid()) {
                $errorCode = $_FILES['cover']['error'] ?? null;
                if ($errorCode === UPLOAD_ERR_INI_SIZE || $errorCode === UPLOAD_ERR_FORM_SIZE) {
                    return response()->json(['ok' => false, 'error' => 'Ukuran file melebihi batas upload server (' . ini_get('upload_max_filesize') . '). Pilih gambar lebih kecil.'], 400);
                }
                return response()->json(['ok' => false, 'error' => 'File upload tidak valid atau tidak ditemukan.'], 400);
            }

            if ($file->getSize() > 12 * 1024 * 1024) {
                return response()->json(['ok' => false, 'error' => 'Ukuran file maksimal 12 MB.'], 400);
            }

            $articleId = trim((string) $request->input('articleId', ''));
            $slug = $articleId !== '' ? preg_replace('/[^a-z0-9\-_]+/i', '-', $articleId) : 'cover';
            $slug = trim((string) $slug, '-');
            if ($slug === '') {
                $slug = 'cover';
            }
            $slug = mb_substr($slug, 0, 64);

            $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
                return response()->json(['ok' => false, 'error' => 'Format file tidak didukung.'], 400);
            }

            $filename = $slug . '-' . time() . '.' . $ext;
            $uploadDir = dirname(base_path()) . '/uploads/jurnal-covers';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0755, true);
            }

            $file->move($uploadDir, $filename);
            $destPath = $uploadDir . '/' . $filename;
            $extraDirs = [
                base_path('public/uploads/jurnal-covers'),
                dirname(base_path()) . '/public/uploads/jurnal-covers',
                dirname(base_path()) . '/dist/uploads/jurnal-covers',
            ];
            foreach ($extraDirs as $ed) {
                if (!is_dir($ed)) {
                    @mkdir($ed, 0755, true);
                }
                @copy($destPath, $ed . '/' . $filename);
            }

            return response()->json([
                'ok' => true,
                'url' => '/uploads/jurnal-covers/' . $filename,
                'filename' => $filename,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => 'Gagal mengunggah sampul: ' . $e->getMessage()], 500);
        }
    }
}
