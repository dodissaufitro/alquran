<?php
declare(strict_types=1);

/** CLI: unduh markup tajwid Al-Fatihah dari Quran.com → data/fatihah-tajweed.json */
if (PHP_SAPI !== 'cli') {
    exit(1);
}

require_once __DIR__ . '/../bootstrap.php';

$url = 'https://api.quran.com/api/v4/verses/by_chapter/1?fields=text_uthmani_tajweed';
$ctx = stream_context_create(['http' => ['timeout' => 25]]);
$raw = @file_get_contents($url, false, $ctx);
if ($raw === false) {
    fwrite(STDERR, "Gagal fetch API\n");
    exit(1);
}
$json = json_decode($raw, true);
$out = [];
foreach (($json['verses'] ?? []) as $verse) {
    $n = (int) ($verse['verse_number'] ?? 0);
    $text = trim((string) ($verse['text_uthmani_tajweed'] ?? ''));
    if ($n > 0 && $text !== '') {
        $out[(string) $n] = $text;
    }
}
$dir = __DIR__ . '/data';
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}
file_put_contents($dir . '/fatihah-tajweed.json', json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo 'OK ' . count($out) . " ayat\n";
