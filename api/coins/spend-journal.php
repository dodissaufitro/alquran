<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    coins_error('Method not allowed.', 405);
}

$purchaseId = '';

try {
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        coins_error('Body JSON tidak valid.');
    }

    $email = coins_authenticated_email(
        (string) ($data['email'] ?? ''),
        (string) ($data['apiToken'] ?? ''),
    );
    $articleId = trim((string) ($data['journalId'] ?? ''));
    $chapterId = trim((string) ($data['chapterId'] ?? ''));
    if ($articleId === '') {
        coins_error('journalId wajib diisi.');
    }

    $purchaseId = $chapterId !== ''
        ? coins_chapter_purchase_id($articleId, $chapterId)
        : $articleId;

    coins_validate_purchase_id($purchaseId);

    $coinPriceHint = max(0, (int) ($data['coinPrice'] ?? 0));
    $priceIdrHint = max(0, (int) ($data['priceIdr'] ?? 0));

    $result = coins_unlock_journal($email, $purchaseId, $coinPriceHint, $priceIdrHint);

    $message = $chapterId !== ''
        ? 'Bab berhasil dibuka dengan coin.'
        : 'Jurnal berhasil dibuka dengan coin.';

    $activePurchases = [];
    try {
        $activePurchases = subscription_active_purchase_ids($email);
    } catch (Throwable) {
        $activePurchases = [$purchaseId];
    }

    subscription_json_response([
        'ok' => true,
        'email' => $email,
        'balance' => $result['balance'],
        'activeUntil' => $result['activeUntil'],
        'journalId' => $result['journalId'],
        'coinPrice' => $result['coinPrice'],
        'alreadyOwned' => $result['alreadyOwned'] ?? false,
        'activePurchases' => $activePurchases,
        'message' => $message,
    ]);
} catch (Throwable $e) {
    $msg = $e->getMessage();
    error_log('[spend-journal] ' . $msg . ' purchase=' . ($purchaseId ?? ''));
    if (
        str_contains($msg, 'journal_id')
        || str_contains($msg, 'ref_id')
        || str_contains($msg, 'Data too long')
    ) {
        coins_error(
            'ID materi terlalu panjang. Hubungi admin atau muat ulang daftar bab.',
            400,
        );
    }
    coins_error('Pembelian gagal. Coba lagi sebentar.', 500);
}
