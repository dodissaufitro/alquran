<?php
declare(strict_types=1);

/**
 * Rujukan audio Al-Fatihah: public/alfatihah/alfatihah.mp3
 */

function talaqqi_public_root(): string
{
    return dirname(__DIR__, 2) . '/public';
}

function talaqqi_fatihah_reference_mp3_path(): string
{
    return talaqqi_public_root() . '/alfatihah/alfatihah.mp3';
}

function talaqqi_fatihah_reference_public_url(): string
{
    return '/alfatihah/alfatihah.mp3';
}

/** @return array{source: string, totalDurationMs: int, method: string, ayahs: array<string, array{startMs: int, endMs: int, durationMs: int}>}|null */
function talaqqi_load_fatihah_audio_segments(): ?array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $paths = [
        talaqqi_public_root() . '/alfatihah/segments.json',
        __DIR__ . '/data/fatihah-audio-segments.json',
    ];
    foreach ($paths as $file) {
        if (!is_file($file)) {
            continue;
        }
        $decoded = json_decode((string) file_get_contents($file), true);
        if (is_array($decoded) && isset($decoded['ayahs']) && is_array($decoded['ayahs'])) {
            $cache = $decoded;

            return $cache;
        }
    }

    return null;
}

/** @return array{startMs: int, endMs: int, durationMs: int}|null */
function talaqqi_fatihah_ayah_audio_segment(int $ayahNumber): ?array
{
    $data = talaqqi_load_fatihah_audio_segments();
    if ($data === null) {
        return null;
    }
    $key = (string) $ayahNumber;
    $seg = $data['ayahs'][$key] ?? null;
    if (!is_array($seg)) {
        return null;
    }

    return [
        'startMs' => (int) ($seg['startMs'] ?? 0),
        'endMs' => (int) ($seg['endMs'] ?? 0),
        'durationMs' => (int) ($seg['durationMs'] ?? 0),
    ];
}

function talaqqi_mp3_duration_estimate_ms(string $path): ?int
{
    if (!is_file($path)) {
        return null;
    }
    $size = filesize($path);
    if ($size === false || $size < 128) {
        return null;
    }

    $fh = fopen($path, 'rb');
    if ($fh === false) {
        return null;
    }
    $hdr = fread($fh, 4096) ?: '';
    fclose($fh);

    if (preg_match('/bitrate:\s*(\d+)/i', $hdr, $m)) {
        $bps = (int) $m[1];

        return (int) round(($size * 8) / max(16000, $bps) * 1000);
    }

    return (int) round(($size * 8) / 64000 * 1000);
}

/** Skor 0–100: seberapa dekat durasi rekaman santri dengan potongan qari rujukan. */
function talaqqi_duration_match_score(int $userDurationMs, int $referenceDurationMs): int
{
    if ($userDurationMs <= 0 || $referenceDurationMs <= 0) {
        return 0;
    }

    $ratio = $userDurationMs / $referenceDurationMs;
    if ($ratio >= 0.78 && $ratio <= 1.28) {
        return 100;
    }
    if ($ratio >= 0.65 && $ratio <= 1.45) {
        return 78;
    }
    if ($ratio >= 0.5 && $ratio <= 1.7) {
        return 55;
    }

    return 35;
}

/** @return array<string, string> */
function talaqqi_load_reference_ayah_transcripts(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $file = __DIR__ . '/data/fatihah-reference-transcripts.json';
    if (!is_file($file)) {
        $cache = [];

        return $cache;
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    $cache = is_array($decoded) ? array_map('strval', $decoded) : [];

    return $cache;
}

function talaqqi_reference_ayah_transcript(int $ayahNumber): ?string
{
    $all = talaqqi_load_reference_ayah_transcripts();
    $key = (string) $ayahNumber;

    return isset($all[$key]) && trim($all[$key]) !== '' ? trim($all[$key]) : null;
}

/**
 * Transkrip verbose Whisper (segmen berwaktu).
 *
 * @return array{text: string, segments: list<array{start: float, end: float, text: string}>}|null
 */
function talaqqi_whisper_transcribe_verbose(string $audioPath): ?array
{
    $apiKey = trim((string) (app_env('OPENAI_API_KEY', '') ?? ''));
    if ($apiKey === '' || !is_file($audioPath)) {
        return null;
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($audioPath) ?: 'audio/mpeg';
    $curl = curl_init('https://api.openai.com/v1/audio/transcriptions');
    if ($curl === false) {
        return null;
    }

    $post = [
        'file' => new CURLFile($audioPath, $mime, basename($audioPath)),
        'model' => 'whisper-1',
        'language' => 'ar',
        'response_format' => 'verbose_json',
        'temperature' => '0',
    ];

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $post,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 180,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey],
    ]);

    $body = curl_exec($curl);
    $code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($body === false || $code < 200 || $code >= 300) {
        error_log('[talaqqi] Whisper verbose gagal HTTP ' . $code);

        return null;
    }

    $json = json_decode($body, true);
    if (!is_array($json)) {
        return null;
    }

    $segments = [];
    foreach (($json['segments'] ?? []) as $seg) {
        if (!is_array($seg)) {
            continue;
        }
        $segments[] = [
            'start' => (float) ($seg['start'] ?? 0),
            'end' => (float) ($seg['end'] ?? 0),
            'text' => trim((string) ($seg['text'] ?? '')),
        ];
    }

    return [
        'text' => trim((string) ($json['text'] ?? '')),
        'segments' => $segments,
    ];
}

/**
 * Petakan segmen Whisper ke ayat 1–7 & perbarui batas waktu.
 *
 * @param list<array{start: float, end: float, text: string}> $segments
 * @return array{segments: array<string, array{startMs: int, endMs: int, durationMs: int}>, transcripts: array<string, string>}|null
 */
function talaqqi_map_whisper_segments_to_fatihah_ayahs(array $segments): ?array
{
    if ($segments === []) {
        return null;
    }

    $ayahNorms = [];
    for ($n = 1; $n <= 7; $n++) {
        $ref = talaqqi_fatihah_ayah_reference($n);
        if ($ref === null) {
            return null;
        }
        $ayahNorms[$n] = talaqqi_normalize_arabic_compare($ref['arabic']);
    }

    $cursor = 0;
    $normStream = '';
    $timedChars = [];
    foreach ($segments as $seg) {
        $norm = talaqqi_normalize_arabic_compare($seg['text']);
        $len = mb_strlen($norm);
        for ($i = 0; $i < $len; $i++) {
            $timedChars[] = [
                'ch' => mb_substr($norm, $i, 1),
                'start' => $seg['start'],
                'end' => $seg['end'],
            ];
        }
        $normStream .= $norm;
    }

    $outSegments = [];
    $transcripts = [];
    $searchFrom = 0;

    for ($n = 1; $n <= 7; $n++) {
        $target = $ayahNorms[$n];
        $foundAt = -1;
        $streamLen = mb_strlen($normStream);
        for ($p = $searchFrom; $p < $streamLen; $p++) {
            $slice = mb_substr($normStream, $p, mb_strlen($target));
            $sim = talaqqi_word_similarity_percent($target, $slice);
            if ($sim >= 82) {
                $foundAt = $p;
                break;
            }
        }

        if ($foundAt < 0) {
            return null;
        }

        $startIdx = $foundAt;
        $endIdx = min($streamLen - 1, $foundAt + mb_strlen($target) - 1);
        $searchFrom = $endIdx + 1;

        $startMs = (int) round(($timedChars[$startIdx]['start'] ?? 0) * 1000);
        $endMs = (int) round(($timedChars[$endIdx]['end'] ?? 0) * 1000);
        if ($endMs <= $startMs) {
            $endMs = $startMs + 500;
        }

        $outSegments[(string) $n] = [
            'startMs' => $startMs,
            'endMs' => $endMs,
            'durationMs' => $endMs - $startMs,
        ];

        $rawParts = [];
        foreach ($segments as $seg) {
            $segStartMs = (int) round($seg['start'] * 1000);
            $segEndMs = (int) round($seg['end'] * 1000);
            if ($segEndMs >= $startMs && $segStartMs <= $endMs) {
                $rawParts[] = $seg['text'];
            }
        }
        $transcripts[(string) $n] = trim(implode(' ', $rawParts));
    }

    return ['segments' => $outSegments, 'transcripts' => $transcripts];
}

/**
 * Bandingkan rekaman santri dengan potongan alfatihah.mp3.
 *
 * @return array{lines: list<string>, audioScore: int|null, refDurationMs: int}
 */
function talaqqi_analyze_against_reference_audio(
    int $ayahNumber,
    int $userDurationMs,
    ?string $userTranscript,
): array {
    $lines = [];
    $seg = talaqqi_fatihah_ayah_audio_segment($ayahNumber);
    if ($seg === null || !is_file(talaqqi_fatihah_reference_mp3_path())) {
        $lines[] = 'ℹ️ Audio rujukan /alfatihah/alfatihah.mp3 belum dikonfigurasi di server.';

        return ['lines' => $lines, 'audioScore' => null, 'refDurationMs' => 0];
    }

    $refDur = max(1, (int) $seg['durationMs']);
    $durScore = talaqqi_duration_match_score($userDurationMs, $refDur);
    $ratio = $userDurationMs > 0 ? round($userDurationMs / $refDur, 2) : 0;

    $lines[] = '🎧 Koreksi suara (qari rujukan: alfatihah.mp3):';
    $lines[] = 'Durasi bacaan qari pada ayat ini: ' . (int) round($refDur / 100) / 10 . ' detik.';
    if ($userDurationMs > 0) {
        $lines[] = 'Durasi rekaman Anda: ' . (int) round($userDurationMs / 100) / 10 . ' detik (rasio ' . $ratio . '×).';
    }

    if ($durScore >= 100) {
        $lines[] = '✅ Tempo mendekati qari rujukan aplikasi.';
    } elseif ($durScore >= 78) {
        $lines[] = '⚠️ Tempo agak berbeda — dengarkan ulang potongan ayat di alfatihah.mp3 lalu tiru.';
    } else {
        if ($ratio < 0.65) {
            $lines[] = '❌ Terlalu cepat/singkat dibanding qari rujukan — perpanjang mad & jangan terburu-buru.';
        } else {
            $lines[] = '❌ Terlalu panjang dibanding qari rujukan — periksa mad berlebihan atau jeda.';
        }
    }

    $audioScore = $durScore;
    $refTranscript = talaqqi_reference_ayah_transcript($ayahNumber);

    if ($userTranscript !== null && trim($userTranscript) !== '' && $refTranscript !== null) {
        $voiceScore = talaqqi_similarity_percent($refTranscript, $userTranscript);
        $audioScore = (int) round(($durScore * 0.35) + ($voiceScore * 0.65));
        $lines[] = 'Kesesuaian lafaz dengan simak qari rujukan: ' . $voiceScore . '%';
        if ($voiceScore >= 85) {
            $lines[] = '✅ Lafaz mendekati bacaan pada alfatihah.mp3.';
        } elseif ($voiceScore >= 70) {
            $lines[] = '⚠️ Lafaz mendekati, masih ada perbedaan dengan qari rujukan — ulangi sambil dengar alfatihah.mp3.';
        } else {
            $lines[] = '❌ Lafaz masih jauh dari qari rujukan — tiru per kata dari alfatihah.mp3 (tombol 🎧 Qari).';
        }
    } else {
        $lines[] = '💡 Dengarkan ayat ini dari alfatihah.mp3 (tombol 🎧 Qari), lalu rekam ulang dengan tempo yang sama.';
    }

    return [
        'lines' => $lines,
        'audioScore' => $audioScore,
        'refDurationMs' => $refDur,
    ];
}
