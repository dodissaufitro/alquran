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
        if (!Schema::hasTable('comments')) {
            Schema::create('comments', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('recording_id', 64)->index();
                $table->string('author_name', 255);
                $table->string('author_email', 255)->default('')->index();
                $table->string('author_role', 32);
                $table->text('body');
                $table->string('audio_file', 512)->default('');
                $table->unsignedInteger('duration_ms')->default(0);
                $table->unsignedBigInteger('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
