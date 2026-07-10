<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LearningCategory extends Model
{
    protected $table = 'learning_categories';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'title',
        'subtitle',
        'description',
        'sort_order',
        'updated_at',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'updated_at' => 'integer',
    ];

    public function articles(): HasMany
    {
        return $this->hasMany(LearningArticle::class, 'category_id', 'id');
    }
}
