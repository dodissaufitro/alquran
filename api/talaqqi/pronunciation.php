<?php
declare(strict_types=1);

/**
 * Pengucapan (transliterasi) Al-Fatihah per ayat & per kata.
 */

/** @return array<string, array{ayahLatin: string, words: list<array{arabic: string, latin: string}>}>|null */
function talaqqi_load_fatihah_pronunciation_data(): ?array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $file = __DIR__ . '/data/fatihah-word-pronunciation.json';
    if (!is_file($file)) {
        return null;
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    $cache = is_array($decoded) ? $decoded : null;

    return $cache;
}

function talaqqi_display_latin(string $latin): string
{
    $latin = trim($latin);
    if ($latin === '') {
        return '';
    }

    return str_replace("'", "'", $latin);
}

/** @return array{ayahLatin: string, words: list<array{arabic: string, latin: string}>}|null */
function talaqqi_pronunciation_for_ayah(int $ayahNumber): ?array
{
    $data = talaqqi_load_fatihah_pronunciation_data();
    if ($data === null) {
        return null;
    }
    $key = (string) $ayahNumber;
    $entry = $data[$key] ?? null;
    if (!is_array($entry)) {
        return null;
    }

    $ref = talaqqi_fatihah_ayah_reference($ayahNumber);
    $ayahLatin = trim((string) ($entry['ayahLatin'] ?? ''));
    if ($ayahLatin === '' && $ref !== null) {
        $ayahLatin = trim((string) ($ref['latin'] ?? ''));
    }

    $words = [];
    foreach (($entry['words'] ?? []) as $w) {
        if (!is_array($w)) {
            continue;
        }
        $words[] = [
            'arabic' => trim((string) ($w['arabic'] ?? '')),
            'latin' => talaqqi_display_latin((string) ($w['latin'] ?? '')),
        ];
    }

    return ['ayahLatin' => talaqqi_display_latin($ayahLatin), 'words' => $words];
}

function talaqqi_word_pronunciation(int $ayahNumber, int $wordNo, string $expectedArabic = ''): string
{
    $entry = talaqqi_pronunciation_for_ayah($ayahNumber);
    if ($entry === null) {
        return '';
    }

    $idx = $wordNo - 1;
    if (isset($entry['words'][$idx])) {
        $latin = $entry['words'][$idx]['latin'];
        if ($latin !== '') {
            return $latin;
        }
    }

    if ($expectedArabic !== '') {
        $normExpected = talaqqi_normalize_arabic_compare($expectedArabic);
        foreach ($entry['words'] as $w) {
            if (talaqqi_normalize_arabic_compare($w['arabic']) === $normExpected) {
                return $w['latin'];
            }
        }
    }

    return '';
}

function talaqqi_format_ayah_pronunciation_block(int $ayahNumber): string
{
    $entry = talaqqi_pronunciation_for_ayah($ayahNumber);
    if ($entry === null) {
        $ref = talaqqi_fatihah_ayah_reference($ayahNumber);
        if ($ref === null || trim((string) ($ref['latin'] ?? '')) === '') {
            return '';
        }

        return "🗣 Pengucapan (latin):\n" . talaqqi_display_latin((string) $ref['latin']);
    }

    $lines = ['🗣 Pengucapan (latin):'];
    if ($entry['ayahLatin'] !== '') {
        $lines[] = 'Seluruh ayat: ' . $entry['ayahLatin'];
    }

    if ($entry['words'] !== []) {
        $lines[] = 'Per kata:';
        foreach ($entry['words'] as $i => $w) {
            $no = $i + 1;
            $ar = $w['arabic'] !== '' ? '«' . $w['arabic'] . '»' : '—';
            $lat = $w['latin'] !== '' ? $w['latin'] : '(—)';
            $lines[] = $no . '. ' . $ar . ' → ' . $lat;
        }
    }

    return implode("\n", $lines);
}

/** @param list<array{type: string, wordNo: int, expected: string, got: string, detail: string}> $mistakes */
function talaqqi_format_mistake_report(
    string $reference,
    string $spoken,
    array $mistakes,
    int $ayahNumber = 0,
): string {
    if ($mistakes === []) {
        return '✅ Kata per kata sesuai rujukan (hasil simak). Tetap samakan makhraj & mad dengan audio qari.';
    }

    $lines = ['🔍 Di mana salahnya (dari rekaman):'];
    $max = 15;
    $shown = 0;
    foreach ($mistakes as $m) {
        if ($shown >= $max) {
            $lines[] = '… +' . (count($mistakes) - $max) . ' catatan lainnya.';
            break;
        }
        $shown++;
        $no = (int) $m['wordNo'];
        $label = 'Kata ke-' . $no;
        $pron = $ayahNumber > 0
            ? talaqqi_word_pronunciation($ayahNumber, $no, $m['expected'])
            : '';
        if ($m['type'] === 'missing') {
            $lines[] = $shown . '. ' . $label . ' «' . $m['expected'] . '» — ' . $m['detail'];
        } elseif ($m['type'] === 'extra') {
            $lines[] = $shown . '. ' . $label . ' — tambahan «' . $m['got'] . '» (' . $m['detail'] . ')';
        } else {
            $lines[] = $shown . '. ' . $label . ' «' . $m['expected'] . '» — Anda «' . $m['got'] . '»';
            if ($m['detail'] !== '') {
                $lines[] = '   ↳ ' . $m['detail'];
            }
        }
        if ($pron !== '') {
            $lines[] = '   🗣 Pengucapan: ' . $pron;
        }
    }

    $lines[] = '';
    $lines[] = '📖 Urutan kata rujukan:';
    $refTokens = talaqqi_reference_display_tokens($reference);
    $wrongNos = [];
    foreach ($mistakes as $m) {
        $wrongNos[(int) $m['wordNo']] = true;
    }
    $annotated = [];
    foreach ($refTokens as $idx => $word) {
        $n = $idx + 1;
        $annotated[] = isset($wrongNos[$n]) ? '【' . $word . '】' : $word;
    }
    $lines[] = implode(' ', $annotated);
    $lines[] = '(【 】 = bagian yang perlu diperbaiki)';

    return implode("\n", $lines);
}
