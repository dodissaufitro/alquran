<?php
declare(strict_types=1);

/**
 * Koreksi bacaan otomatis untuk rekaman talaqqi per ayat (Al-Fatihah).
 */

/** @return array{number: int, arabic: string, latin: string}|null */
function talaqqi_fatihah_ayah_reference(int $ayahNumber): ?array
{
    static $ayahs = [
        1 => ['number' => 1, 'arabic' => 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'latin' => 'Bismillāhir-raḥmānir-raḥīm'],
        2 => ['number' => 2, 'arabic' => 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'latin' => 'Al-ḥamdu lillāhi rabbil-\'ālamīn'],
        3 => ['number' => 3, 'arabic' => 'الرَّحْمَٰنِ الرَّحِيمِ', 'latin' => 'Ar-raḥmānir-raḥīm'],
        4 => ['number' => 4, 'arabic' => 'مَالِكِ يَوْمِ الدِّينِ', 'latin' => 'Māliki yawmid-dīn'],
        5 => ['number' => 5, 'arabic' => 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'latin' => 'Iyyāka na\'budu wa iyyāka nasta\'īn'],
        6 => ['number' => 6, 'arabic' => 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'latin' => 'Ihdināṣ-ṣirāṭal-mustaqīm'],
        7 => [
            'number' => 7,
            'arabic' => 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
            'latin' => 'Ṣirāṭalladzīna an\'amta \'alaihim…',
        ],
    ];

    return $ayahs[$ayahNumber] ?? null;
}

function talaqqi_strip_arabic_tashkeel(string $text): string
{
    $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $text) ?? $text;
    $text = preg_replace('/[\x{0610}-\x{061A}\x{06D6}-\x{06ED}]/u', '', $text) ?? $text;

    return $text;
}

function talaqqi_normalize_arabic_compare(string $text): string
{
    $text = talaqqi_strip_arabic_tashkeel($text);
    $text = preg_replace('/\s+/u', '', $text) ?? $text;
    $map = [
        'أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ٱ' => 'ا',
        'ى' => 'ي', 'ئ' => 'ي', 'ؤ' => 'و', 'ة' => 'ه',
        'ﻻ' => 'لا', 'لا' => 'لا',
    ];
    $text = strtr($text, $map);

    return mb_strtolower($text, 'UTF-8');
}

/** @return array{min: int, max: int} */
function talaqqi_expected_duration_ms(int $ayahNumber): array
{
    $ranges = [
        1 => [3500, 14000],
        2 => [3500, 16000],
        3 => [2500, 12000],
        4 => [2500, 12000],
        5 => [4500, 20000],
        6 => [3500, 16000],
        7 => [8000, 45000],
    ];

    return $ranges[$ayahNumber] ?? [3000, 30000];
}

/** Jarak edit Levenshtein untuk string multibyte (Arab). */
function talaqqi_mb_levenshtein(string $a, string $b): int
{
    $lenA = mb_strlen($a);
    $lenB = mb_strlen($b);
    if ($lenA === 0) {
        return $lenB;
    }
    if ($lenB === 0) {
        return $lenA;
    }

    $prev = range(0, $lenB);
    for ($i = 1; $i <= $lenA; $i++) {
        $curr = [$i];
        $ca = mb_substr($a, $i - 1, 1);
        for ($j = 1; $j <= $lenB; $j++) {
            $cost = ($ca === mb_substr($b, $j - 1, 1)) ? 0 : 1;
            $curr[$j] = min($prev[$j] + 1, $curr[$j - 1] + 1, $prev[$j - 1] + $cost);
        }
        $prev = $curr;
    }

    return $prev[$lenB];
}

/** Kemiripan dua kata/frasa Arab 0–100. */
function talaqqi_word_similarity_percent(string $a, string $b): int
{
    $a = talaqqi_normalize_arabic_compare($a);
    $b = talaqqi_normalize_arabic_compare($b);
    if ($a === $b) {
        return 100;
    }
    if ($a === '' || $b === '') {
        return 0;
    }

    $max = max(mb_strlen($a), mb_strlen($b));
    $dist = talaqqi_mb_levenshtein($a, $b);

    return (int) round((1 - $dist / $max) * 100);
}

function talaqqi_lcs_length(string $a, string $b): int
{
    $m = mb_strlen($a);
    $n = mb_strlen($b);
    $dp = array_fill(0, $m + 1, array_fill(0, $n + 1, 0));
    for ($i = 1; $i <= $m; $i++) {
        for ($j = 1; $j <= $n; $j++) {
            if (mb_substr($a, $i - 1, 1) === mb_substr($b, $j - 1, 1)) {
                $dp[$i][$j] = $dp[$i - 1][$j - 1] + 1;
            } else {
                $dp[$i][$j] = max($dp[$i - 1][$j], $dp[$i][$j - 1]);
            }
        }
    }

    return $dp[$m][$n];
}

function talaqqi_similarity_percent(string $reference, string $spoken): int
{
    $a = talaqqi_normalize_arabic_compare($reference);
    $b = talaqqi_normalize_arabic_compare($spoken);
    if ($a === '' || $b === '') {
        return 0;
    }

    $maxLen = max(mb_strlen($a), mb_strlen($b));
    $levPct = (int) round((1 - talaqqi_mb_levenshtein($a, $b) / $maxLen) * 100);

    similar_text($a, $b, $stPct);
    $stPct = (int) round($stPct);

    $sumLen = mb_strlen($a) + mb_strlen($b);
    $lcsPct = $sumLen > 0
        ? (int) round((2 * talaqqi_lcs_length($a, $b) / $sumLen) * 100)
        : 0;

    return max(0, min(100, max($levPct, $stPct, $lcsPct)));
}

/** Proporsi huruf Arab pada teks (STT Latin = tidak andal untuk diff kata). */
function talaqqi_arabic_script_ratio(string $text): float
{
    $arabic = preg_match_all('/\p{Arabic}/u', $text) ?: 0;
    $latin = preg_match_all('/\p{Latin}/u', $text) ?: 0;
    $total = $arabic + $latin;
    if ($total === 0) {
        return $arabic > 0 ? 1.0 : 0.0;
    }

    return $arabic / $total;
}

/**
 * Bersihkan transkrip STT; prioritaskan blok Arab.
 *
 * @return array{text: string, reliable: bool, arabicRatio: float}
 */
function talaqqi_prepare_transcript(string $raw): array
{
    $raw = trim($raw);
    if ($raw === '') {
        return ['text' => '', 'reliable' => false, 'arabicRatio' => 0.0];
    }

    $arabicOnly = preg_replace('/[^\p{Arabic}\s]/u', ' ', $raw) ?? $raw;
    $arabicOnly = preg_replace('/\s+/u', ' ', trim($arabicOnly)) ?? '';
    $ratioRaw = talaqqi_arabic_script_ratio($raw);
    $text = ($arabicOnly !== '' && mb_strlen($arabicOnly) >= 2) ? $arabicOnly : $raw;
    $ratio = talaqqi_arabic_script_ratio($text);
    $normLen = mb_strlen(talaqqi_normalize_arabic_compare($text));
    $reliable = $ratio >= 0.42 && $normLen >= 4;

    return ['text' => $text, 'reliable' => $reliable, 'arabicRatio' => max($ratio, $ratioRaw)];
}

/**
 * Pecah transkrip tanpa spasi mengikuti batas kata rujukan (fuzzy).
 *
 * @param list<string> $refDisplay
 * @return list<string>
 */
function talaqqi_segment_spoken_by_reference(string $reference, string $spoken, array $refDisplay): array
{
    $refNorm = array_map('talaqqi_normalize_arabic_compare', $refDisplay);
    $spNorm = talaqqi_normalize_arabic_compare($spoken);
    $spLen = mb_strlen($spNorm);
    if ($spLen === 0 || $refNorm === []) {
        return [];
    }

    $segments = [];
    $pos = 0;
    $last = count($refNorm) - 1;

    foreach ($refNorm as $idx => $wn) {
        $remain = $spLen - $pos;
        if ($remain <= 0) {
            $segments[] = '';
            continue;
        }

        $wlen = mb_strlen($wn);
        $isLast = $idx === $last;
        $maxTake = $isLast ? $remain : min($remain, $wlen + 4);
        $minTake = $isLast ? max(1, $remain) : max(1, $wlen - 2);

        $bestTake = min($maxTake, max($minTake, $wlen));
        $bestSim = -1;
        for ($take = $minTake; $take <= $maxTake; $take++) {
            $chunk = mb_substr($spNorm, $pos, $take);
            $sim = talaqqi_word_similarity_percent($wn, $chunk);
            if ($sim > $bestSim) {
                $bestSim = $sim;
                $bestTake = $take;
            }
        }

        if ($bestSim < 35 && !$isLast && $remain > $wlen) {
            $bestTake = min($wlen, $remain);
        }

        $segments[] = mb_substr($spNorm, $pos, $bestTake);
        $pos += $bestTake;
    }

    return $segments;
}

/** @return list<string> */
function talaqqi_tokenize_arabic_words(string $text): array
{
    $plain = talaqqi_strip_arabic_tashkeel($text);
    $plain = preg_replace('/\s+/u', ' ', trim($plain)) ?? $plain;
    if ($plain === '') {
        return [];
    }

    $parts = preg_split('/\s+/u', $plain, -1, PREG_SPLIT_NO_EMPTY);
    if (!is_array($parts)) {
        return [];
    }

    return array_values(array_filter(array_map('trim', $parts), static fn(string $w): bool => $w !== ''));
}

/**
 * Pecah teks rujukan beraksen menjadi kata-kata (untuk tampilan).
 *
 * @return list<string>
 */
function talaqqi_reference_display_tokens(string $reference): array
{
    $reference = trim($reference);
    if ($reference === '') {
        return [];
    }

    $parts = preg_split('/\s+/u', $reference, -1, PREG_SPLIT_NO_EMPTY);

    return is_array($parts) ? array_values($parts) : [$reference];
}

/**
 * Penyelarasan kata dengan kemiripan fuzzy (lebih tahan variasi STT).
 *
 * @param list<string> $refNorm
 * @param list<string> $spNorm
 * @return list<array{type: string, i: int, j: int, sim: int}>
 */
function talaqqi_fuzzy_word_align_ops(array $refNorm, array $spNorm): array
{
    $m = count($refNorm);
    $n = count($spNorm);
    if ($m === 0 && $n === 0) {
        return [];
    }

    $gap = 14.0;
    $dp = [];
    $from = [];
    for ($i = 0; $i <= $m; $i++) {
        $dp[$i] = array_fill(0, $n + 1, -1_000_000.0);
        $from[$i] = array_fill(0, $n + 1, '');
    }
    $dp[0][0] = 0.0;

    for ($j = 1; $j <= $n; $j++) {
        $dp[0][$j] = $dp[0][$j - 1] - $gap;
        $from[0][$j] = 'left';
    }
    for ($i = 1; $i <= $m; $i++) {
        $dp[$i][0] = $dp[$i - 1][0] - $gap;
        $from[$i][0] = 'up';
    }

    for ($i = 1; $i <= $m; $i++) {
        for ($j = 1; $j <= $n; $j++) {
            $sim = (float) talaqqi_word_similarity_percent($refNorm[$i - 1], $spNorm[$j - 1]);
            $diag = $dp[$i - 1][$j - 1] + $sim;
            $up = $dp[$i - 1][$j] - $gap;
            $left = $dp[$i][$j - 1] - $gap;
            if ($diag >= $up && $diag >= $left) {
                $dp[$i][$j] = $diag;
                $from[$i][$j] = 'diag';
            } elseif ($up >= $left) {
                $dp[$i][$j] = $up;
                $from[$i][$j] = 'up';
            } else {
                $dp[$i][$j] = $left;
                $from[$i][$j] = 'left';
            }
        }
    }

    $ops = [];
    $i = $m;
    $j = $n;
    while ($i > 0 || $j > 0) {
        if ($i > 0 && $j > 0 && $from[$i][$j] === 'diag') {
            $sim = talaqqi_word_similarity_percent($refNorm[$i - 1], $spNorm[$j - 1]);
            $type = $sim >= 86 ? 'match' : 'substitute';
            $ops[] = ['type' => $type, 'i' => $i - 1, 'j' => $j - 1, 'sim' => $sim];
            $i--;
            $j--;
        } elseif ($j > 0 && ($i === 0 || $from[$i][$j] === 'left')) {
            $ops[] = ['type' => 'extra', 'i' => -1, 'j' => $j - 1, 'sim' => 0];
            $j--;
        } elseif ($i > 0) {
            $ops[] = ['type' => 'missing', 'i' => $i - 1, 'j' => -1, 'sim' => 0];
            $i--;
        } else {
            break;
        }
    }

    return array_reverse($ops);
}

/**
 * @param list<array{type: string, i: int, j: int}> $missing
 * @param list<array{type: string, i: int, j: int}> $extras
 * @param list<string> $refDisplay
 * @param list<string> $spDisplay
 * @return array{paired: list<array{m: array, e: array}>, loneMissing: list<array>, loneExtra: list<array>}
 */
function talaqqi_pair_missing_extra_blocks(
    array $missing,
    array $extras,
    array $refDisplay,
    array $spDisplay,
): array {
    $candidates = [];
    foreach ($missing as $mi => $mOp) {
        $ri = $mOp['i'];
        $expected = $refDisplay[$ri] ?? '';
        foreach ($extras as $ej => $eOp) {
            $sj = $eOp['j'];
            $got = $spDisplay[$sj] ?? '';
            $sim = talaqqi_word_similarity_percent($expected, $got);
            $candidates[] = ['sim' => $sim, 'mi' => $mi, 'ej' => $ej];
        }
    }
    usort($candidates, static fn(array $x, array $y): int => $y['sim'] <=> $x['sim']);

    $usedM = [];
    $usedE = [];
    $paired = [];
    foreach ($candidates as $c) {
        if ($c['sim'] < 48) {
            break;
        }
        if (isset($usedM[$c['mi']]) || isset($usedE[$c['ej']])) {
            continue;
        }
        $usedM[$c['mi']] = true;
        $usedE[$c['ej']] = true;
        $paired[] = ['m' => $missing[$c['mi']], 'e' => $extras[$c['ej']], 'sim' => $c['sim']];
    }

    $loneMissing = [];
    foreach ($missing as $mi => $mOp) {
        if (!isset($usedM[$mi])) {
            $loneMissing[] = $mOp;
        }
    }
    $loneExtra = [];
    foreach ($extras as $ej => $eOp) {
        if (!isset($usedE[$ej])) {
            $loneExtra[] = $eOp;
        }
    }

    return ['paired' => $paired, 'loneMissing' => $loneMissing, 'loneExtra' => $loneExtra];
}

/**
 * @param list<string> $a normalized
 * @param list<string> $b normalized
 * @return list<array{type: string, i: int, j: int}>
 */
function talaqqi_token_diff_ops(array $a, array $b): array
{
    $m = count($a);
    $n = count($b);
    $dp = [];
    for ($i = 0; $i <= $m; $i++) {
        $dp[$i] = array_fill(0, $n + 1, 0);
    }
    for ($i = 1; $i <= $m; $i++) {
        for ($j = 1; $j <= $n; $j++) {
            if ($a[$i - 1] === $b[$j - 1]) {
                $dp[$i][$j] = $dp[$i - 1][$j - 1] + 1;
            } else {
                $dp[$i][$j] = max($dp[$i - 1][$j], $dp[$i][$j - 1]);
            }
        }
    }

    $ops = [];
    $i = $m;
    $j = $n;
    while ($i > 0 || $j > 0) {
        if ($i > 0 && $j > 0 && $a[$i - 1] === $b[$j - 1]) {
            $ops[] = ['type' => 'match', 'i' => $i - 1, 'j' => $j - 1];
            $i--;
            $j--;
        } elseif ($j > 0 && ($i === 0 || $dp[$i][$j - 1] >= $dp[$i - 1][$j])) {
            $ops[] = ['type' => 'extra', 'i' => -1, 'j' => $j - 1];
            $j--;
        } elseif ($i > 0) {
            $ops[] = ['type' => 'missing', 'i' => $i - 1, 'j' => -1];
            $i--;
        } else {
            break;
        }
    }

    return array_reverse($ops);
}

/** Detail perbedaan huruf dalam satu kata (selaras Levenshtein). */
function talaqqi_char_mistake_hint(string $expectedWord, string $spokenWord): string
{
    $e = talaqqi_normalize_arabic_compare($expectedWord);
    $g = talaqqi_normalize_arabic_compare($spokenWord);
    $lenE = mb_strlen($e);
    $lenG = mb_strlen($g);
    if ($e === $g) {
        return 'hampir sama — perhalus makhraj/mad';
    }

    $dp = [];
    for ($i = 0; $i <= $lenE; $i++) {
        $dp[$i] = array_fill(0, $lenG + 1, 0);
    }
    for ($j = 0; $j <= $lenG; $j++) {
        $dp[0][$j] = $j;
    }
    for ($i = 1; $i <= $lenE; $i++) {
        $dp[$i][0] = $i;
        $ec = mb_substr($e, $i - 1, 1);
        for ($j = 1; $j <= $lenG; $j++) {
            $cost = ($ec === mb_substr($g, $j - 1, 1)) ? 0 : 1;
            $dp[$i][$j] = min($dp[$i - 1][$j] + 1, $dp[$i][$j - 1] + 1, $dp[$i - 1][$j - 1] + $cost);
        }
    }

    $hints = [];
    $i = $lenE;
    $j = $lenG;
    while (($i > 0 || $j > 0) && count($hints) < 4) {
        if ($i > 0 && $j > 0) {
            $ec = mb_substr($e, $i - 1, 1);
            $gc = mb_substr($g, $j - 1, 1);
            $diag = $dp[$i - 1][$j - 1] + ($ec === $gc ? 0 : 1);
            if ($dp[$i][$j] === $diag) {
                if ($ec !== $gc) {
                    $showE = mb_substr($expectedWord, min($i - 1, max(0, mb_strlen($expectedWord) - 1)), 1) ?: $ec;
                    $showG = mb_substr($spokenWord, min($j - 1, max(0, mb_strlen($spokenWord) - 1)), 1) ?: $gc;
                    $hints[] = '«' . $showE . '» → «' . $showG . '»';
                }
                $i--;
                $j--;
                continue;
            }
        }
        if ($j > 0 && ($i === 0 || $dp[$i][$j - 1] + 1 === $dp[$i][$j])) {
            $gc = mb_substr($g, $j - 1, 1) ?: '';
            $hints[] = 'huruf tambahan «' . $gc . '»';
            $j--;
            continue;
        }
        if ($i > 0) {
            $ec = mb_substr($e, $i - 1, 1) ?: '';
            $hints[] = 'huruf «' . $ec . '» kurang';
            $i--;
            continue;
        }
        break;
    }

    $hints = array_reverse($hints);

    return $hints !== [] ? implode(', ', $hints) : 'pengucapan kata ini perlu disamakan dengan qari';
}

/**
 * Deteksi kesalahan per kata antara rujukan dan hasil rekaman.
 *
 * @return list<array{type: string, wordNo: int, expected: string, got: string, detail: string}>
 */
function talaqqi_detect_word_mistakes(string $reference, string $spoken): array
{
    $prepared = talaqqi_prepare_transcript($spoken);
    $spoken = $prepared['text'];
    if ($spoken === '' || !$prepared['reliable']) {
        return [];
    }

    $refDisplay = talaqqi_reference_display_tokens($reference);
    $refNorm = array_map('talaqqi_normalize_arabic_compare', $refDisplay);
    if ($refNorm === []) {
        return [];
    }

    $spDisplay = talaqqi_tokenize_arabic_words($spoken);
    $spNorm = array_map('talaqqi_normalize_arabic_compare', $spDisplay);
    $spokenNorm = talaqqi_normalize_arabic_compare($spoken);

    $needSegment = count($spNorm) <= 1 && count($refNorm) > 1 && mb_strlen($spokenNorm) >= 4;
    if ($needSegment) {
        $segments = talaqqi_segment_spoken_by_reference($reference, $spoken, $refDisplay);
        if ($segments !== []) {
            $spNorm = array_values(array_filter($segments, static fn(string $s): bool => $s !== ''));
            $spDisplay = $spNorm;
        }
    }

    if ($spNorm === [] && $spokenNorm !== '') {
        $spNorm = [$spokenNorm];
        $spDisplay = [talaqqi_strip_arabic_tashkeel($spoken)];
    }

    $overallSim = talaqqi_similarity_percent($reference, $spoken);
    if ($overallSim >= 94 && count($spNorm) >= max(1, count($refNorm) - 1)) {
        return [];
    }

    $ops = talaqqi_fuzzy_word_align_ops($refNorm, $spNorm);
    $mistakes = [];
    $lastWordNo = 0;
    $i = 0;

    while ($i < count($ops)) {
        $op = $ops[$i];
        if ($op['type'] === 'match') {
            $lastWordNo = $op['i'] + 1;
            $i++;
            continue;
        }

        if ($op['type'] === 'substitute') {
            $ri = $op['i'];
            $sj = $op['j'];
            $expected = $refDisplay[$ri] ?? '';
            $got = $spDisplay[$sj] ?? '';
            $sim = (int) ($op['sim'] ?? talaqqi_word_similarity_percent($expected, $got));
            if ($sim >= 86) {
                $lastWordNo = $ri + 1;
                $i++;
                continue;
            }
            $mistakes[] = [
                'type' => 'wrong',
                'wordNo' => $ri + 1,
                'expected' => $expected,
                'got' => $got,
                'detail' => talaqqi_char_mistake_hint($expected, $got),
            ];
            $lastWordNo = $ri + 1;
            $i++;
            continue;
        }

        if ($op['type'] === 'missing') {
            $missing = [];
            while ($i < count($ops) && $ops[$i]['type'] === 'missing') {
                $missing[] = $ops[$i];
                $i++;
            }
            $extras = [];
            while ($i < count($ops) && $ops[$i]['type'] === 'extra') {
                $extras[] = $ops[$i];
                $i++;
            }

            $pairedBlock = talaqqi_pair_missing_extra_blocks($missing, $extras, $refDisplay, $spDisplay);
            foreach ($pairedBlock['paired'] as $pair) {
                $ri = $pair['m']['i'];
                $sj = $pair['e']['j'];
                $expected = $refDisplay[$ri] ?? '';
                $got = $spDisplay[$sj] ?? '';
                $sim = (int) $pair['sim'];
                if ($sim >= 86) {
                    continue;
                }
                $mistakes[] = [
                    'type' => 'wrong',
                    'wordNo' => $ri + 1,
                    'expected' => $expected,
                    'got' => $got,
                    'detail' => talaqqi_char_mistake_hint($expected, $got),
                ];
            }
            foreach ($pairedBlock['loneMissing'] as $mOp) {
                $ri = $mOp['i'];
                $mistakes[] = [
                    'type' => 'missing',
                    'wordNo' => $ri + 1,
                    'expected' => $refDisplay[$ri] ?? '',
                    'got' => '',
                    'detail' => 'kata ini tidak terdengar / terlewat',
                ];
            }
            foreach ($pairedBlock['loneExtra'] as $eOp) {
                $sj = $eOp['j'];
                $mistakes[] = [
                    'type' => 'extra',
                    'wordNo' => $lastWordNo > 0 ? $lastWordNo : 1,
                    'expected' => '',
                    'got' => $spDisplay[$sj] ?? '',
                    'detail' => 'kata tambahan yang tidak ada di ayat',
                ];
            }
            continue;
        }

        if ($op['type'] === 'extra') {
            $sj = $op['j'];
            $mistakes[] = [
                'type' => 'extra',
                'wordNo' => $lastWordNo > 0 ? $lastWordNo : 1,
                'expected' => '',
                'got' => $spDisplay[$sj] ?? '',
                'detail' => 'kata tambahan yang tidak ada di ayat',
            ];
            $i++;
        }
    }

    return talaqqi_unique_mistakes($mistakes);
}

/** @param list<array{type: string, wordNo: int, expected: string, got: string, detail: string}> $mistakes */
function talaqqi_unique_mistakes(array $mistakes): array
{
    $seen = [];
    $unique = [];
    foreach ($mistakes as $m) {
        $key = $m['type'] . '|' . $m['wordNo'] . '|' . $m['expected'] . '|' . $m['got'];
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $unique[] = $m;
    }

    return $unique;
}

/**
 * Jika transkrip satu blok tanpa spasi — bandingkan per huruf lalu petakan ke nomor kata rujukan.
 *
 * @param list<string> $refDisplay
 * @return list<array{type: string, wordNo: int, expected: string, got: string, detail: string}>
 */
function talaqqi_detect_char_mistakes_mapped_to_words(
    string $reference,
    string $spoken,
    array $refDisplay,
): array {
    $refNorm = talaqqi_normalize_arabic_compare($reference);
    $spNorm = talaqqi_normalize_arabic_compare($spoken);
    $refChars = preg_split('//u', $refNorm, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $spChars = preg_split('//u', $spNorm, -1, PREG_SPLIT_NO_EMPTY) ?: [];

    $wordCharRanges = [];
    $offset = 0;
    foreach ($refDisplay as $wi => $word) {
        $len = mb_strlen(talaqqi_normalize_arabic_compare($word));
        $wordCharRanges[] = ['wordNo' => $wi + 1, 'word' => $word, 'start' => $offset, 'end' => $offset + $len];
        $offset += $len;
    }

    $ops = talaqqi_token_diff_ops($refChars, $spChars);
    $mistakes = [];
    $group = [];

    foreach ($ops as $op) {
        if ($op['type'] === 'match') {
            if ($group !== []) {
                $built = talaqqi_build_char_mistake_from_ops($group, $refDisplay, $wordCharRanges, $refNorm, $spNorm);
                if ($built !== null) {
                    $mistakes[] = $built;
                }
                $group = [];
            }
            continue;
        }
        $group[] = $op;
    }

    if ($group !== []) {
        $built = talaqqi_build_char_mistake_from_ops($group, $refDisplay, $wordCharRanges, $refNorm, $spNorm);
        if ($built !== null) {
            $mistakes[] = $built;
        }
    }

    return talaqqi_unique_mistakes($mistakes);
}

/**
 * @param list<array{type: string, i: int, j: int}> $group
 * @param list<string> $refDisplay
 * @param list<array{wordNo: int, word: string, start: int, end: int}> $wordCharRanges
 * @return array{type: string, wordNo: int, expected: string, got: string, detail: string}|null
 */
function talaqqi_build_char_mistake_from_ops(
    array $group,
    array $refDisplay,
    array $wordCharRanges,
    string $refNorm,
    string $spNorm,
): ?array {
    $missingPos = [];
    $extraChars = [];
    foreach ($group as $op) {
        if ($op['type'] === 'missing' && $op['i'] >= 0) {
            $missingPos[] = $op['i'];
        }
        if ($op['type'] === 'extra' && $op['j'] >= 0) {
            $extraChars[] = mb_substr($spNorm, $op['j'], 1) ?: '';
        }
    }

    if ($missingPos === [] && $extraChars === []) {
        return null;
    }

    $wordNo = 1;
    if ($missingPos !== []) {
        $pos = (int) round(array_sum($missingPos) / count($missingPos));
        foreach ($wordCharRanges as $range) {
            if ($pos >= $range['start'] && $pos < $range['end']) {
                $wordNo = $range['wordNo'];
                break;
            }
        }
    }

    $expectedWord = $refDisplay[$wordNo - 1] ?? '';
    $missingPart = '';
    foreach ($missingPos as $p) {
        $missingPart .= mb_substr($refNorm, $p, 1) ?: '';
    }
    $gotPart = implode('', $extraChars);

    if ($missingPos !== [] && $gotPart === '') {
        return [
            'type' => 'missing',
            'wordNo' => $wordNo,
            'expected' => $expectedWord,
            'got' => '',
            'detail' => 'huruf «' . $missingPart . '» pada kata ini kurang / tidak terdengar',
        ];
    }

    if ($missingPos === [] && $gotPart !== '') {
        return [
            'type' => 'extra',
            'wordNo' => $wordNo,
            'expected' => $expectedWord,
            'got' => $gotPart,
            'detail' => 'ada huruf tambahan «' . $gotPart . '» di dekat kata ini',
        ];
    }

    return [
        'type' => 'wrong',
        'wordNo' => $wordNo,
        'expected' => $expectedWord,
        'got' => $gotPart !== '' ? $gotPart : $missingPart,
        'detail' => 'huruf yang berbeda di kata ini — samakan dengan qari',
    ];
}

/** Tips latihan per ayat Fatihah. */
function talaqqi_ayah_practice_tips(int $ayahNumber): string
{
    $tips = [
        1 => 'Perhatikan bismillah: mad isti\'na (2 harakat), lam jalalah dibaca jelas, dan mad arid lalu qasr pada الرَّحِيمِ.',
        2 => 'Huruf ha di الْحَمْدُ tidak ditekan seperti ha Indonesia. Waqaf baik setelah الْعَالَمِينَ jika lanjut ayat berikutnya.',
        3 => 'Ulangi bacaan ar-rahman ar-rahim dengan ghunnah dan mad yang cukup (2 harakat).',
        4 => 'Perhatikan mad pada مَالِكِ dan waqaf sebelum يَوْمِ إذا dihentikan sementara.',
        5 => 'Latih إِيَّاكَ dengan dhamir (kasrah ya) dan jangan tertukar dengan نَعْبُدُ.',
        6 => 'Mad pada اهْدِنَا dan idgham pada الصِّرَاطَ — baca perlahan dulu.',
        7 => 'Ayat panjang: pecah per frasa, perhatikan waqaf pada عَلَيْهِمْ dan ghunnah sebelum huruf berikutnya.',
    ];

    return $tips[$ayahNumber] ?? 'Dengarkan audio qari, tiru per kata, lalu rekam lagi.';
}

function talaqqi_whisper_transcribe(string $audioPath, ?string $referenceArabic = null): ?string
{
    $apiKey = trim((string) (app_env('OPENAI_API_KEY', '') ?? ''));
    if ($apiKey === '' || !is_file($audioPath)) {
        return null;
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($audioPath) ?: 'audio/webm';
    $curl = curl_init('https://api.openai.com/v1/audio/transcriptions');
    if ($curl === false) {
        return null;
    }

    $post = [
        'file' => new CURLFile($audioPath, $mime, basename($audioPath)),
        'model' => 'whisper-1',
        'language' => 'ar',
        'response_format' => 'json',
        'temperature' => '0',
    ];
    if ($referenceArabic !== null && trim($referenceArabic) !== '') {
        $prompt = talaqqi_strip_arabic_tashkeel($referenceArabic);
        $post['prompt'] = mb_substr($prompt, 0, 220);
    }

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $post,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 90,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
        ],
    ]);

    $body = curl_exec($curl);
    $code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($body === false || $code < 200 || $code >= 300) {
        error_log('[talaqqi] Whisper gagal HTTP ' . $code);

        return null;
    }

    $json = json_decode($body, true);

    return is_array($json) && isset($json['text'])
        ? trim((string) $json['text'])
        : null;
}

/**
 * @return array{score: int, status: string, body: string, transcript: string|null}
 */
function talaqqi_analyze_recitation(
    int $ayahNumber,
    int $durationMs,
    ?string $transcriptHint,
    ?string $audioPath,
): array {
    $ref = talaqqi_fatihah_ayah_reference($ayahNumber);
    if ($ref === null) {
        return [
            'score' => 0,
            'status' => 'unknown',
            'body' => 'Koreksi otomatis: ayat tidak dikenali.',
            'transcript' => null,
        ];
    }

    $lines = [];
    $lines[] = '🤖 Koreksi otomatis (ayat ' . $ayahNumber . ')';
    $lines[] = '';
    $lines[] = '📖 Teks rujukan:';
    $lines[] = $ref['arabic'];
    $pronBlock = talaqqi_format_ayah_pronunciation_block($ayahNumber);
    if ($pronBlock !== '') {
        $lines[] = '';
        $lines[] = $pronBlock;
    }

    $hintRaw = $transcriptHint !== null && trim($transcriptHint) !== ''
        ? trim($transcriptHint)
        : null;
    $whisperRaw = null;
    if ($audioPath !== null && is_file($audioPath)) {
        $whisperRaw = talaqqi_whisper_transcribe($audioPath, $ref['arabic']);
    }

    $transcript = null;
    $transcriptSource = '';
    $hintPrepared = $hintRaw !== null ? talaqqi_prepare_transcript($hintRaw) : null;
    $whisperPrepared = $whisperRaw !== null ? talaqqi_prepare_transcript($whisperRaw) : null;

    if ($hintPrepared !== null && $whisperPrepared !== null) {
        $hintScore = talaqqi_similarity_percent($ref['arabic'], $hintPrepared['text']);
        $whisperScore = talaqqi_similarity_percent($ref['arabic'], $whisperPrepared['text']);
        if ($whisperPrepared['reliable'] && ($whisperScore >= $hintScore + 5 || !$hintPrepared['reliable'])) {
            $transcript = $whisperPrepared['text'];
            $transcriptSource = 'whisper';
        } else {
            $transcript = $hintPrepared['text'];
            $transcriptSource = 'browser';
        }
    } elseif ($whisperPrepared !== null && $whisperPrepared['text'] !== '') {
        $transcript = $whisperPrepared['text'];
        $transcriptSource = 'whisper';
    } elseif ($hintPrepared !== null && $hintPrepared['text'] !== '') {
        $transcript = $hintPrepared['text'];
        $transcriptSource = 'browser';
    }

    [$minMs, $maxMs] = talaqqi_expected_duration_ms($ayahNumber);
    $refSeg = talaqqi_fatihah_ayah_audio_segment($ayahNumber);
    if ($refSeg !== null && ($refSeg['durationMs'] ?? 0) > 0) {
        $refDur = (int) $refSeg['durationMs'];
        $minMs = (int) round($refDur * 0.72);
        $maxMs = (int) round($refDur * 1.38);
    }

    $durationScore = 100;
    if ($refSeg !== null && ($refSeg['durationMs'] ?? 0) > 0) {
        $durationScore = talaqqi_duration_match_score($durationMs, (int) $refSeg['durationMs']);
    } elseif ($durationMs > 0 && $durationMs < $minMs) {
        $durationScore = 55;
        $lines[] = '';
        $lines[] = '⏱ Durasi rekaman terlalu singkat — samakan tempo dengan alfatihah.mp3 (tombol 🎧 Qari).';
    } elseif ($durationMs > $maxMs) {
        $durationScore = 75;
        $lines[] = '';
        $lines[] = '⏱ Durasi agak panjang — samakan dengan potongan ayat di alfatihah.mp3.';
    }

    $audioRef = talaqqi_analyze_against_reference_audio(
        $ayahNumber,
        $durationMs,
        $transcript,
    );
    if ($audioRef['lines'] !== []) {
        $lines[] = '';
        $lines = array_merge($lines, $audioRef['lines']);
    }

    $textScore = null;
    $wordMistakes = [];
    $referenceAudioScore = $audioRef['audioScore'];
    if ($transcript !== null && $transcript !== '') {
        $prepared = talaqqi_prepare_transcript($transcript);
        $transcript = $prepared['text'];
        $textScore = talaqqi_similarity_percent($ref['arabic'], $transcript);
        $lines[] = '';
        $lines[] = '🎤 Hasil simak teks (otomatis' . ($transcriptSource === 'whisper' ? ', Whisper' : '') . '):';
        $lines[] = $transcript;
        $lines[] = '';
        $lines[] = 'Kesesuaian dengan rujukan: ' . $textScore . '%';

        if ($textScore >= 88) {
            $lines[] = '✅ Bacaan sudah dekat dengan teks ayat. Pertahankan dan lanjut ke ayat berikutnya.';
        } elseif ($textScore >= 72) {
            $lines[] = '⚠️ Sudah mendekati, tetapi masih ada huruf atau harakat yang perlu diperbaiki. Rekam ulang setelah dengar qari.';
        } else {
            $lines[] = '❌ Masih jauh dari teks ayat. Dengarkan qari, tiru per kata, lalu rekam lagi.';
        }

        if (!$prepared['reliable']) {
            $lines[] = '';
            $lines[] = '⚠️ Teks simak kurang andal (bukan huruf Arab). Gunakan Chrome/Edge, bahasa Arab, atau aktifkan OPENAI_API_KEY di server agar analisis per kata lebih tepat.';
        } else {
            $wordMistakes = talaqqi_detect_word_mistakes($ref['arabic'], $transcript);
            $lines[] = '';
            $lines[] = talaqqi_format_mistake_report($ref['arabic'], $transcript, $wordMistakes, $ayahNumber);
        }
    } else {
        $lines[] = '';
        $lines[] = 'ℹ️ Simak teks otomatis tidak tersedia di server ini.';
        $lines[] = 'Bandingkan rekaman Anda dengan alfatihah.mp3 (tombol 🎧 Qari), lalu rekam ulang jika perlu.';
        if ($durationMs > 0 && $durationMs >= $minMs && $durationMs <= $maxMs) {
            $lines[] = '⏱ Durasi rekaman masuk kisaran wajar untuk ayat ini.';
        }
    }

    $tajweedReport = talaqqi_format_tajweed_correction_report(
        $ayahNumber,
        $ref['arabic'],
        $wordMistakes,
        $durationMs,
        $textScore,
    );
    if ($tajweedReport !== '') {
        $lines[] = '';
        $lines[] = $tajweedReport;
    }

    $lines[] = '';
    $lines[] = '💡 Catatan latihan:';
    $lines[] = talaqqi_ayah_practice_tips($ayahNumber);

    $score = $textScore ?? $durationScore;
    if ($referenceAudioScore !== null) {
        $score = $textScore !== null
            ? (int) round($textScore * 0.45 + $referenceAudioScore * 0.55)
            : $referenceAudioScore;
    }

    $status = 'review';
    if ($textScore !== null) {
        if ($textScore >= 88 && ($referenceAudioScore ?? $durationScore) >= 80) {
            $status = 'good';
        } elseif ($textScore < 72 || ($referenceAudioScore ?? $durationScore) < 55) {
            $status = 'retry';
        }
    } elseif (($referenceAudioScore ?? $durationScore) >= 80) {
        $status = 'review';
    } else {
        $status = 'retry';
    }

    return [
        'score' => $score,
        'status' => $status,
        'body' => implode("\n", $lines),
        'transcript' => $transcript,
    ];
}

function talaqqi_recording_has_auto_correction(PDO $pdo, string $recordingId): bool
{
    $stmt = $pdo->prepare(
        "SELECT 1 FROM comments
         WHERE recording_id = :rid AND author_name = 'Koreksi Otomatis'
         LIMIT 1",
    );
    $stmt->execute(['rid' => $recordingId]);

    return (bool) $stmt->fetchColumn();
}

/**
 * Sisipkan komentar koreksi otomatis; mengembalikan baris komentar atau null.
 *
 * @return array<string, mixed>|null
 */
function talaqqi_apply_auto_correction(
    PDO $pdo,
    string $recordingId,
    int $ayahNumber,
    int $durationMs,
    string $audioFilename,
    ?string $transcriptHint = null,
): ?array {
    if (talaqqi_recording_has_auto_correction($pdo, $recordingId)) {
        return null;
    }

    $audioPath = TALAQQI_UPLOAD_DIR . '/' . basename($audioFilename);
    $analysis = talaqqi_analyze_recitation($ayahNumber, $durationMs, $transcriptHint, $audioPath);

    $id = talaqqi_new_id();
    $createdAt = (int) (microtime(true) * 1000);
    $body = $analysis['body'];
    if (mb_strlen($body) > 12000) {
        $body = mb_substr($body, 0, 11997) . '…';
    }

    $stmt = $pdo->prepare(
        'INSERT INTO comments (id, recording_id, author_name, author_email, author_role, body, audio_file, duration_ms, created_at)
         VALUES (:id, :recording_id, :author_name, :author_email, :author_role, :body, :audio_file, :duration_ms, :created_at)',
    );
    $stmt->execute([
        'id' => $id,
        'recording_id' => $recordingId,
        'author_name' => 'Koreksi Otomatis',
        'author_email' => '',
        'author_role' => 'auto',
        'body' => $body,
        'audio_file' => '',
        'duration_ms' => 0,
        'created_at' => $createdAt,
    ]);

    $sel = $pdo->prepare('SELECT * FROM comments WHERE id = :id');
    $sel->execute(['id' => $id]);
    $row = $sel->fetch(PDO::FETCH_ASSOC);

    return $row ? talaqqi_row_to_comment($row) : null;
}
