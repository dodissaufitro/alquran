<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    coins_error('Method not allowed.', 405);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    coins_error('Body JSON tidak valid.');
}

$email = coins_authenticated_email((string) ($data['email'] ?? ''));
$articleId = trim((string) ($data['journalId'] ?? ''));
$chapterId = trim((string) ($data['chapterId'] ?? ''));
if ($articleId === '') {
    coins_error('journalId wajib diisi.');
}

$purchaseId = $chapterId !== ''
    ? coins_chapter_purchase_id($articleId, $chapterId)
    : $articleId;

$coinPriceHint = max(0, (int) ($data['coinPrice'] ?? 0));
$priceIdrHint = max(0, (int) ($data['priceIdr'] ?? 0));

$result = coins_unlock_journal($email, $purchaseId, $coinPriceHint, $priceIdrHint);

$message = $chapterId !== ''
    ? 'Bab berhasil dibuka dengan coin.'
    : 'Jurnal berhasil dibuka dengan coin.';

subscription_json_response([
    'ok' => true,
    'email' => $email,
    'balance' => $result['balance'],
    'activeUntil' => $result['activeUntil'],
    'journalId' => $result['journalId'],
    'coinPrice' => $result['coinPrice'],
    'alreadyOwned' => $result['alreadyOwned'] ?? false,
    'activePurchases' => subscription_active_purchase_ids($email),
    'message' => $message,
]);
