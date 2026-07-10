<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsSession extends Model
{
    protected $table = 'cms_sessions';
    protected $primaryKey = 'token';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'token',
        'expires_at',
        'created_at',
    ];

    protected $casts = [
        'expires_at' => 'integer',
        'created_at' => 'integer',
    ];
}
