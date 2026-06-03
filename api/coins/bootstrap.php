<?php
declare(strict_types=1);

require_once __DIR__ . '/../subscription/bootstrap.php';

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

/** @return list<array{id:string,coins:int,baseCoins:int,bonusCoins?:int,bonusPercent?:int,priceIdr:int,label:string,badge?:string,starterPack?:bool}> */
function coins_packages(): array
{
    return [
        [
            'id' => 'coin-starter',
            'baseCoins' => 50,
            'bonusCoins' => 0,
            'coins' => 50,
            'priceIdr' => 1000,
            'label' => 'Starter 50 Koin',
            'badge' => 'Starter pack',
            'starterPack' => true,
        ],
        [
            'id' => 'coin-100',
            'baseCoins' => 100,
            'bonusCoins' => 0,
            'coins' => 100,
            'priceIdr' => 10000,
            'label' => '100 Koin',
        ],
        [
            'id' => 'coin-220',
            'baseCoins' => 200,
            'bonusCoins' => 20,
            'bonusPercent' => 10,
            'coins' => 220,
            'priceIdr' => 20000,
            'label' => '220 Koin',
        ],
        [
            'id' => 'coin-500',
            'baseCoins' => 450,
            'bonusCoins' => 50,
            'bonusPercent' => 11,
            'coins' => 500,
            'priceIdr' => 45000,
            'label' => '500 Koin',
        ],
        [
            'id' => 'coin-1150',
            'baseCoins' => 1000,
            'bonusCoins' => 150,
            'bonusPercent' => 15,
            'coins' => 1150,
            'priceIdr' => 100000,
            'label' => '1150 Koin',
        ],
        [
            'id' => 'coin-2400',
            'baseCoins' => 2000,
            'bonusCoins' => 400,
            'bonusPercent' => 20,
            'coins' => 2400,
            'priceIdr' => 200000,
            'label' => '2400 Koin',
        ],
    ];
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

function coins_journal_coin_price(string $journalId, int $priceIdr = 0): int
{
    try {
        $pdo = subscription_db();
        if (app_table_exists($pdo, 'learning_articles')) {
            $stmt = $pdo->prepare(
                'SELECT coin_price, price_idr FROM learning_articles WHERE id = :id LIMIT 1',
            );
            $stmt->execute(['id' => $journalId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $coin = (int) ($row['coin_price'] ?? 0);
                if ($coin > 0) {
                    return $coin;
                }
                $idr = (int) ($row['price_idr'] ?? 0);
                if ($idr > 0) {
                    return max(5, (int) round($idr / 2000));
                }
            }
        }
    } catch (Throwable) {
        /* fallback ke CMS JSON */
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

        $learning = cms_get_section('learning');
        if (is_array($learning)) {
            foreach ($learning as $category) {
                if (!is_array($category)) {
                    continue;
                }
                if (!in_array((string) ($category['id'] ?? ''), cms_kajian_coin_category_ids(), true)) {
                    continue;
                }
                $fromKajian = $lookupInArticles($category['articles'] ?? null);
                if ($fromKajian !== null) {
                    return $fromKajian;
                }
            }
        }

        foreach (cms_paid_kajian_catalog_from_learning() as $item) {
            if ($item['id'] === $journalId) {
                if (isset($item['coinPrice']) && (int) $item['coinPrice'] > 0) {
                    return (int) $item['coinPrice'];
                }
                $idr = (int) ($item['priceIdr'] ?? 0);
                if ($idr > 0) {
                    return max(5, (int) round($idr / 2000));
                }
            }
        }
    }

    if ($priceIdr > 0) {
        return max(5, (int) round($priceIdr / 2000));
    }

    foreach (subscription_journal_catalog() as $item) {
        if ($item['id'] === $journalId) {
            return max(5, (int) round(((int) $item['priceIdr']) / 2000));
        }
    }

    coins_error('Jurnal tidak ditemukan.', 404);
}

function coins_get_balance(string $email): int
{
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
    subscription_journal_price($journalId);
    $coinPrice = coins_journal_coin_price($journalId);

    if (!coins_user_is_super_admin($email)) {
        coins_debit($email, $coinPrice, 'journal', $journalId, 'Buka jurnal/buku');
    }

    $activeUntil = subscription_activate_journal($email, $journalId, coins_period_seconds());

    return [
        'journalId' => $journalId,
        'coinPrice' => $coinPrice,
        'activeUntil' => $activeUntil,
        'balance' => coins_get_balance($email),
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

function coins_complete_order(array $order): void
{
    $email = (string) $order['email'];
    $coinAmount = (int) ($order['coin_amount'] ?? 0);
    $packageId = (string) ($order['package_id'] ?? '');

    if ($coinAmount <= 0 && $packageId !== '') {
        $pkg = coins_package_by_id($packageId);
        $coinAmount = (int) $pkg['coins'];
    }

    if ($coinAmount <= 0) {
        coins_error('Pesanan coin tidak valid.', 400);
    }

    coins_credit($email, $coinAmount, 'purchase', (string) $order['id'], 'Top up coin');
}

function coins_wallet_payload(string $email): array
{
    $catalog = subscription_journal_catalog();
    $journalPrices = [];
    foreach ($catalog as $item) {
        $journalPrices[] = [
            'journalId' => $item['id'],
            'coinPrice' => coins_journal_coin_price($item['id'], (int) $item['priceIdr']),
        ];
    }

    return [
        'ok' => true,
        'email' => $email,
        'balance' => coins_get_balance($email),
        'balanceTopUp' => coins_get_balance($email),
        'balanceBonus' => 0,
        'recordingCost' => coins_recording_cost(),
        'packages' => coins_packages(),
        'journalPrices' => $journalPrices,
    ];
}
