<?php
declare(strict_types=1);

/**
 * Skema & seed paket top-up coin (tabel coin_packages).
 */

/** @return list<array<string, mixed>> */
function coins_default_packages_seed(): array
{
    return [
        [
            'id' => 'coin-starter',
            'baseCoins' => 50,
            'bonusCoins' => 0,
            'bonusPercent' => null,
            'priceIdr' => 1000,
            'label' => 'Starter 50 Koin',
            'badge' => 'Starter pack',
            'starterPack' => true,
            'sortOrder' => 0,
        ],
        [
            'id' => 'coin-100',
            'baseCoins' => 100,
            'bonusCoins' => 0,
            'bonusPercent' => null,
            'priceIdr' => 10000,
            'label' => '100 Koin',
            'badge' => null,
            'starterPack' => false,
            'sortOrder' => 10,
        ],
        [
            'id' => 'coin-220',
            'baseCoins' => 200,
            'bonusCoins' => 20,
            'bonusPercent' => 10,
            'priceIdr' => 20000,
            'label' => '220 Koin',
            'badge' => null,
            'starterPack' => false,
            'sortOrder' => 20,
        ],
        [
            'id' => 'coin-500',
            'baseCoins' => 450,
            'bonusCoins' => 50,
            'bonusPercent' => 11,
            'priceIdr' => 45000,
            'label' => '500 Koin',
            'badge' => null,
            'starterPack' => false,
            'sortOrder' => 30,
        ],
        [
            'id' => 'coin-1150',
            'baseCoins' => 1000,
            'bonusCoins' => 150,
            'bonusPercent' => 15,
            'priceIdr' => 100000,
            'label' => '1150 Koin',
            'badge' => null,
            'starterPack' => false,
            'sortOrder' => 40,
        ],
        [
            'id' => 'coin-2400',
            'baseCoins' => 2000,
            'bonusCoins' => 400,
            'bonusPercent' => 20,
            'priceIdr' => 200000,
            'label' => '2400 Koin',
            'badge' => null,
            'starterPack' => false,
            'sortOrder' => 50,
        ],
    ];
}

function coins_migrate_tables(PDO $pdo): void
{
    if (app_db_is_mysql()) {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS coin_packages (
                id VARCHAR(32) NOT NULL PRIMARY KEY,
                label VARCHAR(255) NOT NULL DEFAULT \'\',
                base_coins INT UNSIGNED NOT NULL DEFAULT 0,
                bonus_coins INT UNSIGNED NOT NULL DEFAULT 0,
                bonus_percent INT UNSIGNED NULL,
                price_idr INT UNSIGNED NOT NULL DEFAULT 0,
                badge VARCHAR(64) NULL,
                starter_pack TINYINT(1) NOT NULL DEFAULT 0,
                sort_order INT UNSIGNED NOT NULL DEFAULT 0,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                updated_at INT UNSIGNED NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        );
    } else {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS coin_packages (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL DEFAULT \'\',
                base_coins INTEGER NOT NULL DEFAULT 0,
                bonus_coins INTEGER NOT NULL DEFAULT 0,
                bonus_percent INTEGER NULL,
                price_idr INTEGER NOT NULL DEFAULT 0,
                badge TEXT NULL,
                starter_pack INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                updated_at INTEGER NOT NULL
            )',
        );
    }
}

function coins_seed_packages_if_empty(PDO $pdo): void
{
    if (!app_table_exists($pdo, 'coin_packages')) {
        return;
    }

    $count = (int) $pdo->query('SELECT COUNT(*) FROM coin_packages')->fetchColumn();
    if ($count > 0) {
        return;
    }

    $now = time();
    $stmt = $pdo->prepare(
        'INSERT INTO coin_packages (
            id, label, base_coins, bonus_coins, bonus_percent, price_idr,
            badge, starter_pack, sort_order, is_active, updated_at
         ) VALUES (
            :id, :label, :base_coins, :bonus_coins, :bonus_percent, :price_idr,
            :badge, :starter_pack, :sort_order, 1, :updated_at
         )',
    );

    foreach (coins_default_packages_seed() as $pkg) {
        $stmt->execute([
            'id' => (string) $pkg['id'],
            'label' => (string) $pkg['label'],
            'base_coins' => (int) $pkg['baseCoins'],
            'bonus_coins' => (int) $pkg['bonusCoins'],
            'bonus_percent' => $pkg['bonusPercent'],
            'price_idr' => (int) $pkg['priceIdr'],
            'badge' => $pkg['badge'],
            'starter_pack' => !empty($pkg['starterPack']) ? 1 : 0,
            'sort_order' => (int) $pkg['sortOrder'],
            'updated_at' => $now,
        ]);
    }
}

/** @param array<string, mixed> $row */
function coins_package_row_to_array(array $row): array
{
    $base = (int) ($row['base_coins'] ?? 0);
    $bonus = (int) ($row['bonus_coins'] ?? 0);
    $pkg = [
        'id' => (string) ($row['id'] ?? ''),
        'baseCoins' => $base,
        'bonusCoins' => $bonus,
        'coins' => $base + $bonus,
        'priceIdr' => (int) ($row['price_idr'] ?? 0),
        'label' => (string) ($row['label'] ?? ''),
    ];
    if (!empty($row['bonus_percent'])) {
        $pkg['bonusPercent'] = (int) $row['bonus_percent'];
    }
    if (!empty($row['badge'])) {
        $pkg['badge'] = (string) $row['badge'];
    }
    if ((int) ($row['starter_pack'] ?? 0) === 1) {
        $pkg['starterPack'] = true;
    }

    return $pkg;
}
