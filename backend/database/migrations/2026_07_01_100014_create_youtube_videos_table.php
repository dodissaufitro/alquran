<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('youtube_videos')) {
            Schema::create('youtube_videos', function (Blueprint $table) {
                $table->id();
                $table->string('title', 255);
                $table->string('video_id', 64)->nullable()->index();
                $table->string('channel_id', 128)->nullable()->index();
                $table->string('url', 512)->nullable();
                $table->string('thumbnail', 512)->nullable();
                $table->string('category', 64)->default('Kajian')->index();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->unsignedInteger('created_at');
                $table->unsignedInteger('updated_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('youtube_videos');
    }
};
