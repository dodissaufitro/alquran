<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsContentSection extends Model
{
    protected $table = 'cms_content_sections';
    protected $primaryKey = 'section_key';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'section_key',
        'payload',
        'updated_at',
    ];

    protected $casts = [
        'updated_at' => 'integer',
    ];
}
