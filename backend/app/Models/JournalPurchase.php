<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class JournalPurchase extends Model
{
    protected $table = 'journal_purchases';
    protected $primaryKey = ['email', 'journal_id'];
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'email',
        'journal_id',
        'active_until',
        'updated_at',
    ];

    protected $casts = [
        'active_until' => 'integer',
        'updated_at' => 'integer',
    ];

    protected function setKeysForSaveQuery($query): Builder
    {
        return $query
            ->where('email', $this->getAttribute('email'))
            ->where('journal_id', $this->getAttribute('journal_id'));
    }
}
