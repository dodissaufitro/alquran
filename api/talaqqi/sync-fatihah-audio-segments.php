<?php
declare(strict_types=1);

/**
 * CLI: sinkron batas ayat + transkrip rujukan dari public/alfatihah/alfatihah.mp3
 * Gunakan Whisper (OPENAI_API_KEY) bila tersedia; jika tidak, bagi proporsional teks ayat.
 */
if (PHP_SAPI !== 'cli') {
    exit(1);
}

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/correction.php';
require_once __DIR__ . '/audio-reference.php';

$mp3 = talaqqi_fatihah_reference_mp3_path();
if (!is_file($mp3)) {
    fwrite(STDERR, "Tidak ada: {$mp3}\n");
    exit(1);
}

$totalMs = talaqqi_mp3_duration_estimate_ms($mp3) ?? 0;
$segments = [];
$transcripts = [];
$method = 'proportional';

$verbose = talaqqi_whisper_transcribe_verbose($mp3);
if ($verbose !== null && $verbose['segments'] !== []) {
    $mapped = talaqqi_map_whisper_segments_to_fatihah_ayahs($verbose['segments']);
    if ($mapped !== null) {
        $segments = $mapped['segments'];
        $transcripts = $mapped['transcripts'];
        $method = 'whisper';
        $last = $segments['7'] ?? null;
        $totalMs = $last !== null ? (int) $last['endMs'] : $totalMs;
    }
}

if ($segments === []) {
    $weights = [];
    for ($i = 1; $i <= 7; $i++) {
        $r = talaqqi_fatihah_ayah_reference($i);
        $weights[$i] = mb_strlen(talaqqi_normalize_arabic_compare($r['arabic'] ?? ''));
    }
    $sum = array_sum($weights) ?: 1;
    $cursor = 0;
    foreach ($weights as $n => $w) {
        $seg = (int) round($totalMs * ($w / $sum));
        $segments[(string) $n] = [
            'startMs' => $cursor,
            'endMs' => $cursor + $seg,
            'durationMs' => $seg,
        ];
        $cursor += $seg;
    }
    if (isset($segments['7'])) {
        $segments['7']['endMs'] = $totalMs;
        $segments['7']['durationMs'] = $totalMs - (int) $segments['7']['startMs'];
    }
    for ($n = 1; $n <= 7; $n++) {
        $ref = talaqqi_fatihah_ayah_reference($n);
        $transcripts[(string) $n] = $ref['arabic'] ?? '';
    }
}

$payload = [
    'source' => talaqqi_fatihah_reference_public_url(),
    'label' => 'Qari rujukan aplikasi',
    'totalDurationMs' => $totalMs,
    'method' => $method,
    'ayahs' => $segments,
];

$publicFile = talaqqi_public_root() . '/alfatihah/segments.json';
$dataFile = __DIR__ . '/data/fatihah-audio-segments.json';
$json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
file_put_contents($publicFile, $json);
file_put_contents($dataFile, $json);

if ($transcripts !== []) {
    file_put_contents(
        __DIR__ . '/data/fatihah-reference-transcripts.json',
        json_encode($transcripts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
    );
}

echo "OK method={$method} totalMs={$totalMs}\n";
