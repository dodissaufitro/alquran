<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserCoin extends Model
{
    protected $table = 'user_coins';
    protected $primaryKey = 'email';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'email',
        'balance',
        'updated_at',
    ];

    protected $casts = [
        'balance' => 'integer',
        'updated_at' => 'integer',
    ];
}
