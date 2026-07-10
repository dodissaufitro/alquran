<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recording extends Model
{
    protected $table = 'recordings';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'author_name',
        'author_email',
        'author_role',
        'ayah_number',
        'audio_file',
        'duration_ms',
        'created_at',
    ];

    protected $casts = [
        'ayah_number' => 'integer',
        'duration_ms' => 'integer',
        'created_at' => 'integer',
    ];

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'recording_id', 'id');
    }
}
