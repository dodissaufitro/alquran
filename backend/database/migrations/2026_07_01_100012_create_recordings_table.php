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
        if (!Schema::hasTable('recordings')) {
            Schema::create('recordings', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('author_name', 255);
                $table->string('author_email', 255)->nullable()->index();
                $table->string('author_role', 32);
                $table->unsignedInteger('ayah_number')->nullable();
                $table->string('audio_file', 512);
                $table->unsignedInteger('duration_ms')->default(0);
                $table->unsignedBigInteger('created_at')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recordings');
    }
};
