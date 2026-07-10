<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class YoutubeVideo extends Model
{
    protected $table = 'youtube_videos';
    public $timestamps = false;

    protected $fillable = [
        'title',
        'video_id',
        'channel_id',
        'url',
        'thumbnail',
        'category',
        'description',
        'is_active',
        'sort_order',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'created_at' => 'integer',
        'updated_at' => 'integer',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            $now = time();
            if (!$model->created_at) $model->created_at = $now;
            if (!$model->updated_at) $model->updated_at = $now;
            if (!$model->thumbnail && $model->video_id) {
                $model->thumbnail = 'https://i.ytimg.com/vi/' . $model->video_id . '/hqdefault.jpg';
            }
        });

        static::updating(function ($model) {
            $model->updated_at = time();
            if (!$model->thumbnail && $model->video_id) {
                $model->thumbnail = 'https://i.ytimg.com/vi/' . $model->video_id . '/hqdefault.jpg';
            }
        });
    }
}
