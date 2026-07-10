<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalPurchase;
use App\Models\Order;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        $email = trim((string) $request->query('email', ''));
        if ($email === '') {
            return response()->json(['ok' => false, 'error' => 'Email wajib diisi.'], 400);
        }

        $now = time();
        $subscription = Subscription::find($email);
        $active = false;
        $activeUntil = null;
        if ($subscription && $subscription->active_until > $now) {
            $active = true;
            $activeUntil = $subscription->active_until;
        }

        $journalPurchases = JournalPurchase::where('email', $email)->get();
        $activePurchases = [];
        $journals = [];

        foreach ($journalPurchases as $jp) {
            $jActive = false;
            if ($jp->active_until === null || $jp->active_until > $now) {
                $jActive = true;
                $activePurchases[] = $jp->journal_id;
            }
            $journals[] = [
                'journalId' => $jp->journal_id,
                'priceIdr' => 0, // Legacy field
                'active' => $jActive,
                'activeUntil' => $jp->active_until,
            ];
        }

        return response()->json([
            'ok' => true,
            'active' => $active,
            'activeUntil' => $activeUntil,
            'activePurchases' => $activePurchases,
            'journals' => $journals,
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $email = trim((string) $request->input('email', ''));
        $journalId = trim((string) $request->input('journalId', ''));

        if ($email === '') {
            return response()->json(['ok' => false, 'error' => 'Email wajib.'], 400);
        }
        if ($journalId === '') {
            return response()->json(['ok' => false, 'error' => 'Journal ID wajib.'], 400);
        }

        $orderId = 'ORD-' . strtoupper(Str::random(10));
        $amountIdr = 50000; // Harga default simulasi

        Order::create([
            'id' => $orderId,
            'email' => $email,
            'journal_id' => $journalId,
            'amount_idr' => $amountIdr,
            'status' => 'pending',
            'created_at' => time(),
            'payment_provider' => 'demo',
            'qr_string' => 'demo-qr-string',
        ]);

        return response()->json([
            'ok' => true,
            'orderId' => $orderId,
            'journalId' => $journalId,
            'amountIdr' => $amountIdr,
            'currency' => 'IDR',
            'demoMode' => true,
            'payment' => [
                'provider' => 'demo',
                'qrString' => 'demo-qr-string',
                'qrImageUrl' => '',
                'expiresAt' => time() + 3600,
                'canSimulateDemo' => true,
            ],
        ]);
    }

    public function orderStatus(Request $request): JsonResponse
    {
        $email = trim((string) $request->query('email', ''));
        $orderId = trim((string) $request->query('orderId', ''));

        if ($email === '' || $orderId === '') {
            return response()->json(['ok' => false, 'error' => 'Email dan Order ID wajib.'], 400);
        }

        $order = Order::where('id', $orderId)->where('email', $email)->first();
        if (!$order) {
            return response()->json(['ok' => false, 'error' => 'Order tidak ditemukan.'], 404);
        }

        return response()->json([
            'ok' => true,
            'orderId' => $order->id,
            'status' => $order->status,
            'journalId' => $order->journal_id,
            'amountIdr' => $order->amount_idr,
            'paid' => $order->status === 'paid',
            'activeUntil' => null,
        ]);
    }

    public function simulatePay(Request $request): JsonResponse
    {
        $email = trim((string) $request->input('email', ''));
        $orderId = trim((string) $request->input('orderId', ''));

        if ($email === '' || $orderId === '') {
            return response()->json(['ok' => false, 'error' => 'Email dan Order ID wajib.'], 400);
        }

        $order = Order::where('id', $orderId)->where('email', $email)->first();
        if (!$order) {
            return response()->json(['ok' => false, 'error' => 'Order tidak ditemukan.'], 404);
        }

        if ($order->status !== 'paid') {
            $order->status = 'paid';
            $order->paid_at = time();
            $order->save();

            // Beri akses ke jurnal selamanya (null)
            JournalPurchase::updateOrCreate(
                ['email' => $email, 'journal_id' => $order->journal_id],
                ['active_until' => null, 'updated_at' => time()]
            );
        }

        return $this->status($request);
    }
}
