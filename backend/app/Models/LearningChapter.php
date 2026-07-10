<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearningChapter extends Model
{
    protected $table = 'learning_chapters';
    protected $primaryKey = ['article_id', 'id'];
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'article_id',
        'id',
        'chapter_number',
        'title',
        'summary',
        'body',
        'read_minutes',
        'coin_price',
        'sort_order',
        'updated_at',
    ];

    protected $casts = [
        'chapter_number' => 'integer',
        'read_minutes' => 'integer',
        'coin_price' => 'integer',
        'sort_order' => 'integer',
        'updated_at' => 'integer',
    ];

    protected function setKeysForSaveQuery($query): Builder
    {
        return $query
            ->where('article_id', $this->getAttribute('article_id'))
            ->where('id', $this->getAttribute('id'));
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(LearningArticle::class, 'article_id', 'id');
    }
}
