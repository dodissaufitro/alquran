<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'email';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'email',
        'name',
        'phone',
        'picture',
        'provider',
        'is_super_admin',
        'username',
        'password_hash',
        'api_token_hash',
        'created_at',
        'updated_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
        'api_token_hash',
    ];

    protected $casts = [
        'is_super_admin' => 'boolean',
        'created_at' => 'integer',
        'updated_at' => 'integer',
        'last_login_at' => 'integer',
    ];
}
