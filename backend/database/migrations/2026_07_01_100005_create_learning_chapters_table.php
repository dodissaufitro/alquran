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
        if (!Schema::hasTable('learning_chapters')) {
            Schema::create('learning_chapters', function (Blueprint $table) {
                $table->string('article_id', 64);
                $table->string('id', 64);
                $table->unsignedInteger('chapter_number')->default(1);
                $table->string('title', 512)->default('');
                $table->text('summary');
                $table->longText('body');
                $table->unsignedInteger('read_minutes')->default(5);
                $table->unsignedInteger('coin_price')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->unsignedInteger('updated_at');

                $table->primary(['article_id', 'id']);
                $table->index('article_id');
                $table->index(['article_id', 'sort_order']);

                $table->foreign('article_id')
                    ->references('id')
                    ->on('learning_articles')
                    ->onDelete('cascade')
                    ->onUpdate('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_chapters');
    }
};
