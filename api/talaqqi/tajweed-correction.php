<?php
declare(strict_types=1);

/**
 * Koreksi tajwid Al-Fatihah — markup Quran.com + petunjuk praktik per kata.
 */

/** @return array<string, string> */
function talaqqi_tajweed_rule_labels(): array
{
    return [
        'ham_wasl' => 'Hamzah wasl',
        'laam_shamsiyah' => 'Lam syamsiyah',
        'laam_qamariyah' => 'Lam qamariyah',
        'madda_normal' => 'Mad thobi\'i (2 harakat)',
        'madda_permissible' => 'Mad jaiz munfasil/muttasil',
        'madda_necessary' => 'Mad wajib muttasil',
        'madda_obligatory' => 'Mad lazim',
        'madda_pbligatory' => 'Mad lazim',
        'ghunnah' => 'Ghunnah',
        'ghn' => 'Ghunnah',
        'ikhafa' => 'Ikhfa',
        'ikhafa_shafawi' => 'Ikhfa syafawi',
        'iqlab' => 'Iqlab',
        'idgham_ghunnah' => 'Idgham bighunnah',
        'idgham_wo_ghunnah' => 'Idgham tanpa ghunnah',
        'idgham_shafawi' => 'Idgham syafawi',
        'qalaqah' => 'Qalqalah',
        'qalqah' => 'Qalqalah',
        'silent' => 'Huruf tidak dibaca',
        'slnt' => 'Huruf tidak dibaca',
        'lam_jalalah' => 'Lam jalalah',
        'hams' => 'Hams (ringan)',
        'waqaf' => 'Waqaf (berhenti)',
    ];
}

function talaqqi_tajweed_rule_label(string $ruleClass): string
{
    $labels = talaqqi_tajweed_rule_labels();
    $key = strtolower(preg_replace('/[^a-z0-9_]/', '', $ruleClass) ?? $ruleClass);

    return $labels[$key] ?? ucfirst(str_replace('_', ' ', $key));
}

function talaqqi_tajweed_practice_tip(string $ruleClass, string $snippet, string $word): string
{
    $rule = strtolower(preg_replace('/[^a-z0-9_]/', '', $ruleClass) ?? $ruleClass);
    $tips = [
        'ham_wasl' => 'Hamzah wasl jangan dibaca keras saat washal; samakan dengan qari.',
        'laam_shamsiyah' => 'Lam pada lafaz «' . $word . '» dibaca tipis (syamsiyah), tidak ditekan.',
        'laam_qamariyah' => 'Lam qamariyah dibaca jelas (qamariyah).',
        'madda_normal' => 'Panjangkan mad pada «' . $snippet . '» sekitar 2 harakat (mad thobi\'i).',
        'madda_permissible' => 'Mad jaiz: panjang 2, 4, atau 6 harakat sesuai qiroah — jangan dipendekkan.',
        'madda_necessary' => 'Mad wajib muttasil — wajib dipanjangkan (4–5 harakat).',
        'madda_obligatory' => 'Mad lazim — wajib dipanjangkan 6 harakat.',
        'madda_pbligatory' => 'Mad lazim — wajib dipanjangkan 6 harakat.',
        'ghunnah' => 'Dengungkan ghunnah 2 harakat pada tasydid nun/mim (غنة).',
        'ghn' => 'Dengungkan ghunnah 2 harakat pada tasydid nun/mim (غنة).',
        'ikhafa' => 'Baca ikhfa dengan sifat antara izhar dan idgham, disertai dengung ringan.',
        'ikhafa_shafawi' => 'Ikhfa syafawi pada mim sukun — bibir hampir menutup dengan dengung.',
        'iqlab' => 'Ubah bacaan nun sakinah menjadi mim dengan ghunnah (iqlab).',
        'idgham_ghunnah' => 'Gabungkan huruf dan dengungkan ghunnah (idgham bighunnah).',
        'idgham_wo_ghunnah' => 'Gabungkan huruf tanpa ghunnah (idgham bilaghunnah).',
        'idgham_shafawi' => 'Idgham mim sukun ke mim berikutnya dengan ghunnah.',
        'qalaqah' => 'Qalqalah: pantulan suara pada huruf qalqalah saat sukun.',
        'qalqah' => 'Qalqalah: pantulan suara pada huruf qalqalah saat sukun.',
        'silent' => 'Huruf ini tidak dilafazkan (sukun khusus pada rasm).',
        'slnt' => 'Huruf ini tidak dilafazkan (sukun khusus pada rasm).',
    ];

    return $tips[$rule] ?? ('Terapkan kaidah ' . talaqqi_tajweed_rule_label($ruleClass) . ' pada «' . $snippet . '».');
}

function talaqqi_normalize_tajweed_markup_html(string $html): string
{
    $html = preg_replace('/<tajweed\s+class=([a-z0-9_]+)\s*>/i', '<tajweed class="$1">', $html) ?? $html;
    $html = str_replace(['<\/tajweed>', '<\\/tajweed>'], '</tajweed>', $html);
    $html = preg_replace('/<span[^>]*>.*?<\/span>/us', '', $html) ?? $html;

    return trim($html);
}

/**
 * @return array{plain: string, rules: list<array{rule: string, snippet: string, charStart: int}>}
 */
function talaqqi_parse_tajweed_markup(string $html): array
{
    $html = talaqqi_normalize_tajweed_markup_html($html);
    $plain = '';
    $rules = [];
    $offset = 0;
    $pattern = '/<tajweed class="([^"]+)">(.*?)<\/tajweed>/us';

    while (preg_match($pattern, $html, $m, PREG_OFFSET_CAPTURE)) {
        $startTag = $m[0][1];
        $before = substr($html, 0, $startTag);
        $beforePlain = trim(strip_tags($before));
        if ($beforePlain !== '') {
            $plain .= $beforePlain;
            $offset = mb_strlen(talaqqi_normalize_arabic_compare($plain));
        }

        $ruleClass = $m[1][0];
        $snippet = $m[2][0];
        $rules[] = [
            'rule' => $ruleClass,
            'snippet' => $snippet,
            'charStart' => $offset,
        ];
        $plain .= $snippet;
        $offset = mb_strlen(talaqqi_normalize_arabic_compare($plain));

        $html = substr($html, $startTag + strlen($m[0][0]));
    }

    $tail = trim(strip_tags($html));
    if ($tail !== '') {
        $plain .= $tail;
    }

    return ['plain' => $plain, 'rules' => $rules];
}

function talaqqi_char_offset_to_word_no(int $offset, array $refDisplay): int
{
    $pos = 0;
    foreach ($refDisplay as $idx => $word) {
        $len = mb_strlen(talaqqi_normalize_arabic_compare($word));
        if ($offset < $pos + $len) {
            return $idx + 1;
        }
        $pos += $len;
    }

    return max(1, count($refDisplay));
}

/** @param list<string> $refDisplay */
function talaqqi_word_at_char_offset(int $offset, array $refDisplay): string
{
    $wordNo = talaqqi_char_offset_to_word_no($offset, $refDisplay);

    return $refDisplay[$wordNo - 1] ?? '';
}

function talaqqi_fatihah_tajweed_markup(int $ayahNumber): ?string
{
    static $cache = null;
    if ($cache === null) {
        $dataDir = defined('TALAQQI_DATA_DIR') ? TALAQQI_DATA_DIR : (__DIR__ . '/data');
        $file = $dataDir . '/fatihah-tajweed.json';
        if (!is_file($file)) {
            return null;
        }
        $decoded = json_decode((string) file_get_contents($file), true);
        $cache = is_array($decoded) ? $decoded : [];
    }

    $key = (string) $ayahNumber;

    return isset($cache[$key]) ? (string) $cache[$key] : null;
}

/**
 * @param list<string> $refDisplay
 * @return list<array{wordNo: int, rule: string, label: string, snippet: string, word: string, tip: string}>
 */
function talaqqi_tajweed_points_from_markup(string $markup, array $refDisplay): array
{
    $parsed = talaqqi_parse_tajweed_markup($markup);
    $points = [];
    $seen = [];

    foreach ($parsed['rules'] as $r) {
        $wordNo = talaqqi_char_offset_to_word_no((int) $r['charStart'], $refDisplay);
        $word = $refDisplay[$wordNo - 1] ?? '';
        $rule = strtolower(preg_replace('/[^a-z0-9_]/', '', $r['rule']) ?? $r['rule']);
        $key = $wordNo . '|' . $rule;
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $points[] = [
            'wordNo' => $wordNo,
            'rule' => $rule,
            'label' => talaqqi_tajweed_rule_label($rule),
            'snippet' => $r['snippet'],
            'word' => $word,
            'tip' => talaqqi_tajweed_practice_tip($rule, $r['snippet'], $word),
        ];
    }

    return $points;
}

/**
 * Tajwid dari harakat pada kata rujukan (cadangan jika markup tidak ada).
 *
 * @return list<array{wordNo: int, rule: string, label: string, snippet: string, word: string, tip: string}>
 */
function talaqqi_tajweed_points_from_harakat(array $refDisplay): array
{
    $points = [];
    foreach ($refDisplay as $idx => $word) {
        $wordNo = $idx + 1;
        if (preg_match('/نّ|مّ|نّ|مّ|[نم][\x{064B}-\x{065F}]*ّ/u', $word) || preg_match('/ّ/u', $word) && preg_match('/[نم]/u', $word)) {
            $points[] = [
                'wordNo' => $wordNo,
                'rule' => 'ghunnah',
                'label' => talaqqi_tajweed_rule_label('ghunnah'),
                'snippet' => 'ّ',
                'word' => $word,
                'tip' => talaqqi_tajweed_practice_tip('ghunnah', 'ّ', $word),
            ];
        }
        if (preg_match('/ٰ/u', $word)) {
            $points[] = [
                'wordNo' => $wordNo,
                'rule' => 'madda_normal',
                'label' => talaqqi_tajweed_rule_label('madda_normal'),
                'snippet' => 'ٰ',
                'word' => $word,
                'tip' => talaqqi_tajweed_practice_tip('madda_normal', 'ٰ', $word),
            ];
        }
        if (preg_match('/[قطبجد]/u', $word) && preg_match('/ْ|ّ/u', $word)) {
            $points[] = [
                'wordNo' => $wordNo,
                'rule' => 'qalaqah',
                'label' => talaqqi_tajweed_rule_label('qalaqah'),
                'snippet' => $word,
                'word' => $word,
                'tip' => talaqqi_tajweed_practice_tip('qalaqah', $word, $word),
            ];
        }
    }

    return $points;
}

/** @return list<array{wordNo: int, rule: string, label: string, snippet: string, word: string, tip: string}> */
function talaqqi_collect_ayah_tajweed_points(int $ayahNumber, string $reference): array
{
    $refDisplay = talaqqi_reference_display_tokens($reference);
    $markup = talaqqi_fatihah_tajweed_markup($ayahNumber);
    $points = $markup !== null
        ? talaqqi_tajweed_points_from_markup($markup, $refDisplay)
        : [];

    if ($points === []) {
        $points = talaqqi_tajweed_points_from_harakat($refDisplay);
    }

    $extra = talaqqi_fatihah_extra_tajweed_notes($ayahNumber);
    $seen = [];
    foreach ($points as $p) {
        $seen[$p['wordNo'] . '|' . $p['rule']] = true;
    }
    foreach ($extra as $e) {
        $key = $e['wordNo'] . '|' . $e['rule'];
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $wn = (int) $e['wordNo'];
        $word = $refDisplay[$wn - 1] ?? '';
        $points[] = [
            'wordNo' => $wn,
            'rule' => $e['rule'],
            'label' => talaqqi_tajweed_rule_label($e['rule']),
            'snippet' => $e['snippet'] ?? '',
            'word' => $word,
            'tip' => $e['tip'],
        ];
    }

    usort($points, static fn(array $a, array $b): int => $a['wordNo'] <=> $b['wordNo']);

    return $points;
}

/**
 * Catatan tajwid antar-kata / waqaf khusus Fatihah.
 *
 * @return list<array{wordNo: int, rule: string, snippet?: string, tip: string}>
 */
function talaqqi_fatihah_extra_tajweed_notes(int $ayahNumber): array
{
    $notes = [
        1 => [
            [
                'wordNo' => 2,
                'rule' => 'lam_jalalah',
                'tip' => 'Lafaz «اللَّهِ» setelah «بِسْمِ» — lam dibaca tipis (lam jalalah), bukan lam tebal.',
            ],
        ],
        2 => [
            [
                'wordNo' => 1,
                'rule' => 'hams',
                'tip' => 'Ha pada «الْحَمْدُ» dibaca ringan (hams), jangan seperti ha Indonesia yang tebal.',
            ],
        ],
        5 => [
            [
                'wordNo' => 1,
                'rule' => 'madda_permissible',
                'tip' => '«إِيَّاكَ» — panjangkan mad ya (dhamir) sesuai qiroah, jangan dipendekkan.',
            ],
            [
                'wordNo' => 4,
                'rule' => 'waqaf',
                'tip' => 'Waqaf baik setelah «نَعْبُدُ» jika berhenti; jangan memutus di tengah «وَإِيَّاكَ».',
            ],
        ],
        6 => [
            [
                'wordNo' => 3,
                'rule' => 'idgham_ghunnah',
                'tip' => 'Pada «الصِّرَاطَ» — tasydid sin setelah lam, samakan idgham/penyebutan dengan qari.',
            ],
        ],
        7 => [
            [
                'wordNo' => 6,
                'rule' => 'waqaf',
                'tip' => 'Berhenti pada «عَلَيْهِمْ» sebelum «غَيْرِ» agar makna doa terjaga.',
            ],
            [
                'wordNo' => 10,
                'rule' => 'madda_necessary',
                'tip' => '«الضَّالِّينَ» — perhatikan mad dan tasydid di akhir ayat, jangan terburu-buru.',
            ],
        ],
    ];

    return $notes[$ayahNumber] ?? [];
}

/**
 * @param list<array{type: string, wordNo: int, expected: string, got: string, detail: string}> $wordMistakes
 */
function talaqqi_format_tajweed_correction_report(
    int $ayahNumber,
    string $reference,
    array $wordMistakes,
    int $durationMs,
    ?int $textScore,
): string {
    $points = talaqqi_collect_ayah_tajweed_points($ayahNumber, $reference);
    if ($points === []) {
        return '';
    }

    $wrongNos = [];
    foreach ($wordMistakes as $m) {
        $wrongNos[(int) $m['wordNo']] = true;
    }

    $lines = ['📿 Koreksi tajwid (rujukan mushaf):'];
    $shown = 0;
    $max = 12;

    if ($wordMistakes !== []) {
        $lines[] = '';
        $lines[] = 'Perbaiki tajwid pada kata yang belum sesuai simak:';
        foreach ($wordMistakes as $m) {
            if ($shown >= $max) {
                break;
            }
            $wn = (int) $m['wordNo'];
            $related = array_values(array_filter(
                $points,
                static fn(array $p): bool => $p['wordNo'] === $wn,
            ));
            if ($related === []) {
                continue;
            }
            $shown++;
            $labels = array_map(static fn(array $p): string => $p['label'], $related);
            $lines[] = $shown . '. Kata ke-' . $wn . ' «' . ($m['expected'] ?: $related[0]['word']) . '»: '
                . implode(', ', array_unique($labels));
            $lines[] = '   ↳ ' . $related[0]['tip'];
            if (count($related) > 1) {
                $lines[] = '   ↳ ' . $related[1]['tip'];
            }
            $pron = talaqqi_word_pronunciation($ayahNumber, $wn, $m['expected']);
            if ($pron !== '') {
                $lines[] = '   🗣 Pengucapan: ' . $pron;
            }
        }
    }

    $madRules = ['madda_normal', 'madda_permissible', 'madda_necessary', 'madda_obligatory', 'madda_pbligatory'];
    $madCount = 0;
    foreach ($points as $p) {
        if (in_array($p['rule'], $madRules, true)) {
            $madCount++;
        }
    }

    [$minMs] = talaqqi_expected_duration_ms($ayahNumber);
    if ($madCount >= 2 && $durationMs > 0 && $durationMs < (int) ($minMs * 0.85)) {
        $lines[] = '';
        $lines[] = '⏱ Durasi rekaman agak singkat untuk jumlah mad di ayat ini — perlambat mad & ghunnah.';
    } elseif ($madCount >= 1 && $durationMs > 0 && $durationMs > (int) ($minMs * 2.2)) {
        $lines[] = '';
        $lines[] = '⏱ Durasi agak panjang — periksa mad berlebihan atau jeda di tengah kata.';
    }

    $checklistAdded = 0;
    $lines[] = '';
    $lines[] = 'Checklist tajwid ayat ini:';
    foreach ($points as $p) {
        if ($shown + $checklistAdded >= $max) {
            $lines[] = '… +' . (count($points) - $checklistAdded) . ' kaidah lain pada mushaf.';
            break;
        }
        if (isset($wrongNos[$p['wordNo']]) && $wordMistakes !== []) {
            continue;
        }
        $checklistAdded++;
        $pron = talaqqi_word_pronunciation($ayahNumber, (int) $p['wordNo'], $p['word']);
        $pronLine = $pron !== '' ? ' (🗣 ' . $pron . ')' : '';
        $lines[] = '• Kata ke-' . $p['wordNo'] . ' «' . $p['word'] . '»' . $pronLine . ' — ' . $p['label'] . ': ' . $p['tip'];
    }

    if ($textScore !== null && $textScore < 72 && $wordMistakes === []) {
        $lines[] = '';
        $lines[] = '💡 Meski kata terdengar mirip, samakan makhraj & mad dengan audio qari (tombol 🎧).';
    }

    return implode("\n", $lines);
}
