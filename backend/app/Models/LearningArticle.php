<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LearningArticle extends Model
{
    protected $table = 'learning_articles';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'category_id',
        'title',
        'summary',
        'body',
        'read_minutes',
        'price_idr',
        'coin_price',
        'preview',
        'content_type',
        'page_count',
        'cover_image',
        'sort_order',
        'updated_at',
    ];

    protected $casts = [
        'read_minutes' => 'integer',
        'price_idr' => 'integer',
        'coin_price' => 'integer',
        'page_count' => 'integer',
        'sort_order' => 'integer',
        'updated_at' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(LearningCategory::class, 'category_id', 'id');
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(LearningChapter::class, 'article_id', 'id');
    }
}
