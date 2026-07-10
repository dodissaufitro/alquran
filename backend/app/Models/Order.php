<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'email',
        'journal_id',
        'amount_idr',
        'status',
        'created_at',
        'paid_at',
        'payment_provider',
        'payment_ref',
        'qr_string',
        'checkout_url',
        'order_type',
        'coin_amount',
        'package_id',
        'payment_sync_token',
    ];

    protected $casts = [
        'amount_idr' => 'integer',
        'created_at' => 'integer',
        'paid_at' => 'integer',
        'coin_amount' => 'integer',
    ];
}
