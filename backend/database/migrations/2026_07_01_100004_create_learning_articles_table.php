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
        if (!Schema::hasTable('learning_articles')) {
            Schema::create('learning_articles', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('category_id', 64);
                $table->string('title', 512)->default('');
                $table->text('summary');
                $table->longText('body');
                $table->unsignedInteger('read_minutes')->default(5);
                $table->unsignedInteger('price_idr')->nullable();
                $table->unsignedInteger('coin_price')->nullable();
                $table->text('preview')->nullable();
                $table->string('content_type', 16)->nullable();
                $table->unsignedInteger('page_count')->nullable();
                $table->string('cover_image', 512)->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->unsignedInteger('updated_at');

                $table->index('category_id');
                $table->index(['category_id', 'sort_order']);
                $table->index(['category_id', 'coin_price']);

                $table->foreign('category_id')
                    ->references('id')
                    ->on('learning_categories')
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
        Schema::dropIfExists('learning_articles');
    }
};
