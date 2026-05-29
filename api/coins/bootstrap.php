<?php
declare(strict_types=1);

require_once __DIR__ . '/../subscription/bootstrap.php';

const COINS_PERIOD_SECONDS = 365 * 24 * 60 * 60;

function coins_recording_cost(): int
{
    $raw = subscription_env('COIN_RECORDING_COST', '5');
    $cost = (int) $raw;
    return $cost > 0 ? $cost : 5;
}

/** @return list<array{id:string,coins:int,priceIdr:int,label:string,badge?:string}> */
function coins_packages(): array
{
    return [
        ['id' => 'coin-50', 'coins' => 50, 'priceIdr' => 15000, 'label' => '50 Coin'],
        ['id' => 'coin-120', 'coins' => 120, 'priceIdr' => 35000, 'label' => '120 Coin', 'badge' => 'Populer'],
        ['id' => 'coin-300', 'coins' => 300, 'priceIdr' => 85000, 'label' => '300 Coin'],
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
    $cmsBootstrap = __DIR__ . '/../cms/bootstrap.php';
    if (is_file($cmsBootstrap)) {
        require_once $cmsBootstrap;
        $category = cms_resolve_jurnal();
        if (is_array($category)) {
            foreach ($category['articles'] ?? [] as $article) {
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

    $activeUntil = subscription_activate_journal($email, $journalId, COINS_PERIOD_SECONDS);

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
        'recordingCost' => coins_recording_cost(),
        'packages' => coins_packages(),
        'journalPrices' => $journalPrices,
    ];
}
