<?php
declare(strict_types=1);

/** CLI: unduh transliterasi kata per ayat Al-Fatihah dari Quran.com */
if (PHP_SAPI !== 'cli') {
    exit(1);
}

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/correction.php';

$url = 'https://api.quran.com/api/v4/verses/by_chapter/1?words=true&word_fields=text_uthmani,transliteration';
$raw = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 25]]));
if ($raw === false) {
    fwrite(STDERR, "Gagal fetch API\n");
    exit(1);
}

$json = json_decode($raw, true);
$out = [];
foreach (($json['verses'] ?? []) as $verse) {
    $n = (int) ($verse['verse_number'] ?? 0);
    if ($n < 1 || $n > 7) {
        continue;
    }
    $words = [];
    foreach (($verse['words'] ?? []) as $w) {
        if (($w['char_type_name'] ?? '') !== 'word') {
            continue;
        }
        $arabic = trim((string) ($w['text_uthmani'] ?? $w['text'] ?? ''));
        $latin = trim((string) ($w['transliteration']['text'] ?? ''));
        if ($arabic === '') {
            continue;
        }
        $words[] = ['arabic' => $arabic, 'latin' => $latin];
    }
    $ref = talaqqi_fatihah_ayah_reference($n);
    $out[(string) $n] = [
        'ayahLatin' => $ref['latin'] ?? '',
        'words' => $words,
    ];
}

$file = __DIR__ . '/data/fatihah-word-pronunciation.json';
file_put_contents($file, json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo 'OK ' . count($out) . " ayat → {$file}\n";
