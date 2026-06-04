<?php
declare(strict_types=1);

require_once __DIR__ . '/../subscription/bootstrap.php';
require_once __DIR__ . '/../learning-store.php';
require_once __DIR__ . '/schema.php';

function coins_period_seconds(): int
{
    return app_coins_period_seconds();
}

function coins_recording_cost(): int
{
    $raw = subscription_env('COIN_RECORDING_COST', '5');
    $cost = (int) $raw;
    return $cost > 0 ? $cost : 5;
}

function coins_authenticated_email(?string $bodyEmail = null): string
{
    return subscription_authenticated_email($bodyEmail);
}

/** @return list<array{id:string,coins:int,baseCoins:int,bonusCoins?:int,bonusPercent?:int,priceIdr:int,label:string,badge?:string,starterPack?:bool}> */
function coins_packages(): array
{
    try {
        $pdo = subscription_db();
        if (!app_table_exists($pdo, 'coin_packages')) {
            return coins_packages_fallback_defaults();
        }

        $stmt = $pdo->query(
            'SELECT * FROM coin_packages WHERE is_active = 1 ORDER BY sort_order ASC, id ASC',
        );
        $packages = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $packages[] = coins_package_row_to_array($row);
        }

        return $packages !== [] ? $packages : coins_packages_fallback_defaults();
    } catch (Throwable) {
        return coins_packages_fallback_defaults();
    }
}

/** @return list<array<string, mixed>> */
function coins_packages_fallback_defaults(): array
{
    $out = [];
    foreach (coins_default_packages_seed() as $pkg) {
        $base = (int) ($pkg['baseCoins'] ?? 0);
        $bonus = (int) ($pkg['bonusCoins'] ?? 0);
        $row = [
            'id' => (string) $pkg['id'],
            'baseCoins' => $base,
            'bonusCoins' => $bonus,
            'coins' => $base + $bonus,
            'priceIdr' => (int) $pkg['priceIdr'],
            'label' => (string) $pkg['label'],
        ];
        if (isset($pkg['bonusPercent'])) {
            $row['bonusPercent'] = (int) $pkg['bonusPercent'];
        }
        if (!empty($pkg['badge'])) {
            $row['badge'] = (string) $pkg['badge'];
        }
        if (!empty($pkg['starterPack'])) {
            $row['starterPack'] = true;
        }
        $out[] = $row;
    }

    return $out;
}

function coins_package_by_id(string $packageId): array
{
    foreach (coins_packages() as $pkg) {
        if ($pkg['id'] === $packageId) {
            return $pkg;
        }
    }
    coins_error('Paket coin tidak ditemukan.', 404);
}

function coins_error(string $message, int $code = 400): void
{
    subscription_error($message, $code);
}

function coins_chapter_purchase_id(string $articleId, string $chapterId): string
{
    return $articleId . '/' . $chapterId;
}

/** @return array{articleId: string, chapterId: string|null} */
function coins_parse_purchase_id(string $purchaseId): array
{
    $purchaseId = trim($purchaseId);
    $pos = strpos($purchaseId, '/');
    if ($pos === false || $pos <= 0) {
        return ['articleId' => $purchaseId, 'chapterId' => null];
    }

    return [
        'articleId' => substr($purchaseId, 0, $pos),
        'chapterId' => substr($purchaseId, $pos + 1) ?: null,
    ];
}

function coins_chapter_coin_price(string $articleId, string $chapterId): int
{
    $articleId = trim($articleId);
    $chapterId = trim($chapterId);
    if ($articleId === '' || $chapterId === '') {
        coins_error('Artikel atau bab tidak valid.', 400);
    }

    try {
        $pdo = subscription_db();
        if (app_table_exists($pdo, 'learning_chapters')) {
            $stmt = $pdo->prepare(
                'SELECT c.coin_price, c.article_id, a.coin_price AS article_coin, a.category_id
                 FROM learning_chapters c
                 INNER JOIN learning_articles a ON a.id = c.article_id
                 WHERE c.article_id = :aid AND c.id = :cid
                 LIMIT 1',
            );
            $stmt->execute(['aid' => $articleId, 'cid' => $chapterId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $coin = (int) ($row['coin_price'] ?? 0);
                if ($coin > 0) {
                    return $coin;
                }
                $articleCoin = (int) ($row['article_coin'] ?? 0);
                if ($articleCoin > 0) {
                    $countStmt = $pdo->prepare(
                        'SELECT COUNT(*) FROM learning_chapters WHERE article_id = :aid',
                    );
                    $countStmt->execute(['aid' => $articleId]);
                    $count = max(1, (int) $countStmt->fetchColumn());

                    return max(1, (int) round($articleCoin / $count));
                }

                return 0;
            }
        }
    } catch (Throwable) {
        /* fallback CMS JSON */
    }

    $cmsBootstrap = __DIR__ . '/../cms/bootstrap.php';
    if (is_file($cmsBootstrap)) {
        require_once $cmsBootstrap;
        $learning = cms_get_section('learning');
        if (is_array($learning)) {
            foreach ($learning as $category) {
                if (!is_array($category) || (string) ($category['id'] ?? '') !== 'tafsir-tahlili') {
                    continue;
                }
                foreach ((array) ($category['articles'] ?? []) as $article) {
                    if (!is_array($article) || (string) ($article['id'] ?? '') !== $articleId) {
                        continue;
                    }
                    $chapters = is_array($article['chapters'] ?? null) ? $article['chapters'] : [];
                    $chapterCount = max(1, count($chapters));
                    foreach ($chapters as $chapter) {
                        if (!is_array($chapter) || (string) ($chapter['id'] ?? '') !== $chapterId) {
                            continue;
                        }
                        $coin = (int) ($chapter['coinPrice'] ?? 0);
                        if ($coin > 0) {
                            return $coin;
                        }
                        $articleCoin = (int) ($article['coinPrice'] ?? 0);
                        if ($articleCoin > 0) {
                            return max(1, (int) round($articleCoin / $chapterCount));
                        }

                        return 0;
                    }
                }
            }
        }
    }

    coins_error('Bab tidak ditemukan.', 404);
}

function coins_journal_coin_price(string $journalId, int $priceIdr = 0): int
{
    $parsed = coins_parse_purchase_id($journalId);
    if ($parsed['chapterId'] !== null) {
        return coins_chapter_coin_price($parsed['articleId'], $parsed['chapterId']);
    }

    $journalId = $parsed['articleId'];

    try {
        $pdo = subscription_db();
        if (app_table_exists($pdo, 'learning_articles')) {
            $stmt = $pdo->prepare(
                'SELECT category_id, coin_price, price_idr FROM learning_articles WHERE id = :id LIMIT 1',
            );
            $stmt->execute(['id' => $journalId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $categoryId = (string) ($row['category_id'] ?? '');
                $coin = (int) ($row['coin_price'] ?? 0);
                if ($coin > 0) {
                    return $coin;
                }
                if (learning_store_is_kajian_coin_category($categoryId)) {
                    $chCount = 0;
                    if (app_table_exists($pdo, 'learning_chapters')) {
                        $cStmt = $pdo->prepare(
                            'SELECT COUNT(*) FROM learning_chapters WHERE article_id = :id',
                        );
                        $cStmt->execute(['id' => $journalId]);
                        $chCount = (int) $cStmt->fetchColumn();
                    }
                    if ($chCount > 0 && learning_store_uses_chapter_coin_unlock($categoryId)) {
                        return 0;
                    }

                    return 0;
                }
                $idr = (int) ($row['price_idr'] ?? 0);
                if ($idr > 0) {
                    return max(5, (int) round($idr / 2000));
                }

                return 0;
            }
        }
    } catch (Throwable) {
        /* fallback ke CMS */
    }

    $cmsBootstrap = __DIR__ . '/../cms/bootstrap.php';
    if (is_file($cmsBootstrap)) {
        require_once $cmsBootstrap;

        $lookupInArticles = static function (?array $articles) use ($journalId, $priceIdr): ?int {
            if (!is_array($articles)) {
                return null;
            }
            foreach ($articles as $article) {
                if (!is_array($article) || (string) ($article['id'] ?? '') !== $journalId) {
                    continue;
                }
                $explicit = (int) ($article['coinPrice'] ?? 0);
                if ($explicit > 0) {
                    return $explicit;
                }
                $idr = (int) ($article['priceIdr'] ?? $priceIdr);
                if ($idr > 0) {
                    return max(5, (int) round($idr / 2000));
                }
            }

            return null;
        };

        $learning = cms_get_section('learning');
        if (is_array($learning)) {
            foreach ($learning as $category) {
                if (!is_array($category)) {
                    continue;
                }
                if (!in_array((string) ($category['id'] ?? ''), cms_kajian_coin_category_ids(), true)) {
                    continue;
                }
                foreach ((array) ($category['articles'] ?? []) as $article) {
                    if (is_array($article) && (string) ($article['id'] ?? '') === $journalId) {
                        return 0;
                    }
                }
            }
        }

        $jurnal = cms_resolve_jurnal();
        $fromJurnal = $lookupInArticles(is_array($jurnal) ? ($jurnal['articles'] ?? null) : null);
        if ($fromJurnal !== null) {
            return $fromJurnal;
        }

        try {
            $pdo = cms_db();
            learning_store_import_from_cms_json_if_empty($pdo);
            $fromUlumul = $lookupInArticles(
                learning_store_load_articles_for_category($pdo, 'ulumul-quran'),
            );
            if ($fromUlumul !== null) {
                return $fromUlumul;
            }
        } catch (Throwable) {
            /* fallback ke katalog statis */
        }

        foreach (cms_paid_kajian_catalog_from_learning() as $item) {
            if ($item['id'] === $journalId && (int) ($item['coinPrice'] ?? 0) > 0) {
                return (int) $item['coinPrice'];
            }
        }
    }

    if ($priceIdr > 0) {
        return max(5, (int) round($priceIdr / 2000));
    }

    coins_error('Konten tidak ditemukan di database.', 404);
}

/**
 * Daftar harga coin untuk app — dari learning_articles & learning_chapters (bukan CMS JSON).
 *
 * @return list<array{journalId: string, coinPrice: int}>
 */
function coins_journal_prices_from_tables(PDO $pdo): array
{
    $prices = [];
    $seen = [];

    if (!app_table_exists($pdo, 'learning_articles')) {
        return [];
    }

    $stmt = $pdo->query(
        'SELECT id, category_id, coin_price, price_idr FROM learning_articles ORDER BY category_id, sort_order, id',
    );
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $id = (string) ($row['id'] ?? '');
        if ($id === '') {
            continue;
        }
        $categoryId = (string) ($row['category_id'] ?? '');
        if (
            learning_store_uses_chapter_coin_unlock($categoryId)
            && app_table_exists($pdo, 'learning_chapters')
        ) {
            $ch = $pdo->prepare('SELECT 1 FROM learning_chapters WHERE article_id = :id LIMIT 1');
            $ch->execute(['id' => $id]);
            if ($ch->fetchColumn()) {
                continue;
            }
        }
        $coin = (int) ($row['coin_price'] ?? 0);
        if ($coin <= 0 && (int) ($row['price_idr'] ?? 0) > 0 && !learning_store_is_kajian_coin_category($categoryId)) {
            $coin = max(5, (int) round((int) $row['price_idr'] / 2000));
        }
        if ($coin > 0 && !isset($seen[$id])) {
            $seen[$id] = true;
            $prices[] = ['journalId' => $id, 'coinPrice' => $coin];
        }
    }

    if (app_table_exists($pdo, 'learning_chapters')) {
        $chStmt = $pdo->query(
            'SELECT c.article_id, c.id, c.coin_price, a.coin_price AS article_coin
             FROM learning_chapters c
             INNER JOIN learning_articles a ON a.id = c.article_id
             ORDER BY c.article_id, c.sort_order, c.chapter_number',
        );
        while ($row = $chStmt->fetch(PDO::FETCH_ASSOC)) {
            $articleId = (string) ($row['article_id'] ?? '');
            $chapterId = (string) ($row['id'] ?? '');
            if ($articleId === '' || $chapterId === '') {
                continue;
            }
            $purchaseId = coins_chapter_purchase_id($articleId, $chapterId);
            $coin = (int) ($row['coin_price'] ?? 0);
            if ($coin <= 0) {
                $articleCoin = (int) ($row['article_coin'] ?? 0);
                if ($articleCoin > 0) {
                    $cntStmt = $pdo->prepare(
                        'SELECT COUNT(*) FROM learning_chapters WHERE article_id = :aid',
                    );
                    $cntStmt->execute(['aid' => $articleId]);
                    $count = max(1, (int) $cntStmt->fetchColumn());
                    $coin = max(1, (int) round($articleCoin / $count));
                }
            }
            if ($coin > 0 && !isset($seen[$purchaseId])) {
                $seen[$purchaseId] = true;
                $prices[] = ['journalId' => $purchaseId, 'coinPrice' => $coin];
            }
        }
    }

    return $prices;
}

function coins_get_balance(string $email): int
{
    $email = subscription_normalize_email($email);
    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT balance FROM user_coins WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? (int) $row['balance'] : 0;
}

function coins_user_is_super_admin(string $email): bool
{
    $pdo = subscription_db();
    $stmt = $pdo->prepare('SELECT is_super_admin FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row && (int) ($row['is_super_admin'] ?? 0) === 1;
}

function coins_new_tx_id(): string
{
    return 'CTX-' . strtoupper(bin2hex(random_bytes(4)));
}

function coins_new_order_id(): string
{
    return 'COIN-' . strtoupper(bin2hex(random_bytes(4)));
}

function coins_log_transaction(
    PDO $pdo,
    string $email,
    string $type,
    int $amount,
    int $balanceAfter,
    string $refType = '',
    string $refId = '',
    string $note = '',
): void {
    $stmt = $pdo->prepare(
        'INSERT INTO coin_transactions (id, email, type, amount, balance_after, ref_type, ref_id, note, created_at)
         VALUES (:id, :email, :type, :amount, :balance_after, :ref_type, :ref_id, :note, :created_at)',
    );
    $stmt->execute([
        'id' => coins_new_tx_id(),
        'email' => $email,
        'type' => $type,
        'amount' => $amount,
        'balance_after' => $balanceAfter,
        'ref_type' => $refType,
        'ref_id' => $refId,
        'note' => $note,
        'created_at' => time(),
    ]);
}

function coins_credit(string $email, int $amount, string $refType, string $refId, string $note = ''): int
{
    if ($amount <= 0) {
        coins_error('Jumlah coin tidak valid.');
    }

    $pdo = subscription_db();
    $now = time();
    $pdo->beginTransaction();
    try {
        $lock = app_db_is_mysql() ? ' FOR UPDATE' : '';
        $stmt = $pdo->prepare("SELECT balance FROM user_coins WHERE email = :email{$lock}");
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = $row ? (int) $row['balance'] : 0;
        $newBalance = $balance + $amount;

        if ($row) {
            $upd = $pdo->prepare('UPDATE user_coins SET balance = :balance, updated_at = :updated_at WHERE email = :email');
            $upd->execute(['balance' => $newBalance, 'updated_at' => $now, 'email' => $email]);
        } else {
            $ins = $pdo->prepare(
                'INSERT INTO user_coins (email, balance, updated_at) VALUES (:email, :balance, :updated_at)',
            );
            $ins->execute(['email' => $email, 'balance' => $newBalance, 'updated_at' => $now]);
        }

        coins_log_transaction($pdo, $email, 'credit', $amount, $newBalance, $refType, $refId, $note);
        $pdo->commit();
        return $newBalance;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function coins_debit(string $email, int $amount, string $refType, string $refId, string $note = ''): int
{
    if ($amount <= 0) {
        coins_error('Jumlah coin tidak valid.');
    }

    if (coins_user_is_super_admin($email)) {
        return coins_get_balance($email);
    }

    $pdo = subscription_db();
    $now = time();
    $pdo->beginTransaction();
    try {
        $lock = app_db_is_mysql() ? ' FOR UPDATE' : '';
        $stmt = $pdo->prepare("SELECT balance FROM user_coins WHERE email = :email{$lock}");
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = $row ? (int) $row['balance'] : 0;

        if ($balance < $amount) {
            $pdo->rollBack();
            coins_error('Saldo coin tidak cukup. Beli coin terlebih dahulu.', 402);
        }

        $newBalance = $balance - $amount;

        if ($row) {
            $upd = $pdo->prepare('UPDATE user_coins SET balance = :balance, updated_at = :updated_at WHERE email = :email');
            $upd->execute(['balance' => $newBalance, 'updated_at' => $now, 'email' => $email]);
        } else {
            $ins = $pdo->prepare(
                'INSERT INTO user_coins (email, balance, updated_at) VALUES (:email, :balance, :updated_at)',
            );
            $ins->execute(['email' => $email, 'balance' => $newBalance, 'updated_at' => $now]);
        }

        coins_log_transaction($pdo, $email, 'debit', -$amount, $newBalance, $refType, $refId, $note);
        $pdo->commit();
        return $newBalance;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function coins_unlock_journal(string $email, string $journalId): array
{
    $coinPrice = coins_journal_coin_price($journalId);

    if ($coinPrice <= 0) {
        coins_error('Materi ini gratis dan tidak perlu dibuka dengan coin.', 400);
    }

    $parsed = coins_parse_purchase_id($journalId);
    $note = $parsed['chapterId'] !== null
        ? 'Buka bab tafsir'
        : 'Buka jurnal/buku';

    $existingUntil = subscription_journal_purchase_until($email, $journalId);
    if ($existingUntil !== null) {
        return [
            'journalId' => $journalId,
            'coinPrice' => $coinPrice,
            'activeUntil' => $existingUntil,
            'balance' => coins_get_balance($email),
            'alreadyOwned' => true,
        ];
    }

    if (!coins_user_is_super_admin($email)) {
        coins_debit($email, $coinPrice, 'journal', $journalId, $note);
    }

    $activeUntil = subscription_activate_journal($email, $journalId, coins_period_seconds());

    return [
        'journalId' => $journalId,
        'coinPrice' => $coinPrice,
        'activeUntil' => $activeUntil,
        'balance' => coins_get_balance($email),
        'alreadyOwned' => false,
    ];
}

function coins_charge_recording(string $email): int
{
    if (coins_user_is_super_admin($email)) {
        return coins_get_balance($email);
    }

    $cost = coins_recording_cost();
    return coins_debit($email, $cost, 'recording', '', 'Rekaman talaqqi');
}

function coins_order_credit_exists(string $email, string $orderId): bool
{
    $pdo = subscription_db();
    $stmt = $pdo->prepare(
        "SELECT 1 FROM coin_transactions
         WHERE email = :email AND ref_type = 'purchase' AND ref_id = :ref_id AND type = 'credit'
         LIMIT 1",
    );
    $stmt->execute([
        'email' => subscription_normalize_email($email),
        'ref_id' => $orderId,
    ]);

    return (bool) $stmt->fetchColumn();
}

/** Kredit coin untuk pesanan top-up (idempoten — aman dipanggil ulang). */
function coins_fulfill_paid_order(array $order): void
{
    $email = subscription_normalize_email((string) $order['email']);
    $orderId = (string) $order['id'];

    if ($orderId === '' || coins_order_credit_exists($email, $orderId)) {
        return;
    }

    $coinAmount = (int) ($order['coin_amount'] ?? 0);
    $packageId = trim((string) ($order['package_id'] ?? ''));

    if ($coinAmount <= 0 && $packageId !== '') {
        try {
            $pkg = coins_package_by_id($packageId);
            $coinAmount = (int) $pkg['coins'];
        } catch (Throwable $e) {
            error_log('coins_fulfill_paid_order package lookup: ' . $e->getMessage());
        }
    }

    if ($coinAmount <= 0) {
        error_log('coins_fulfill_paid_order: invalid coin_amount for order ' . $orderId);
        coins_error('Pesanan coin tidak valid.', 400);
    }

    coins_credit($email, $coinAmount, 'purchase', $orderId, 'Top up coin');
}

function coins_complete_order(array $order): void
{
    coins_fulfill_paid_order($order);
}

function coins_wallet_payload(string $email): array
{
    $pdo = subscription_db();
    $balance = coins_get_balance($email);

    return [
        'ok' => true,
        'email' => $email,
        'balance' => $balance,
        'balanceTopUp' => $balance,
        'balanceBonus' => 0,
        'recordingCost' => coins_recording_cost(),
        'packages' => coins_packages(),
        'journalPrices' => coins_journal_prices_from_tables($pdo),
    ];
}
