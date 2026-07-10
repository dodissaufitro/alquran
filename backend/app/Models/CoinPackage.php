<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinPackage extends Model
{
    protected $table = 'coin_packages';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'label',
        'base_coins',
        'bonus_coins',
        'bonus_percent',
        'price_idr',
        'badge',
        'starter_pack',
        'sort_order',
        'is_active',
        'updated_at',
    ];

    protected $casts = [
        'base_coins' => 'integer',
        'bonus_coins' => 'integer',
        'bonus_percent' => 'integer',
        'price_idr' => 'integer',
        'starter_pack' => 'boolean',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'updated_at' => 'integer',
    ];
}
