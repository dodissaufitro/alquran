<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    protected $table = 'comments';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'recording_id',
        'author_name',
        'author_email',
        'author_role',
        'body',
        'audio_file',
        'duration_ms',
        'created_at',
    ];

    protected $casts = [
        'duration_ms' => 'integer',
        'created_at' => 'integer',
    ];

    public function recording(): BelongsTo
    {
        return $this->belongsTo(Recording::class, 'recording_id', 'id');
    }
}
