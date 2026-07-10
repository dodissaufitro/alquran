<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $table = 'subscriptions';
    protected $primaryKey = 'email';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'email',
        'active_until',
        'updated_at',
    ];

    protected $casts = [
        'active_until' => 'integer',
        'updated_at' => 'integer',
    ];
}
