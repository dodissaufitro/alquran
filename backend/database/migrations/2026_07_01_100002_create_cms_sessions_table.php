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
        if (!Schema::hasTable('cms_sessions')) {
            Schema::create('cms_sessions', function (Blueprint $table) {
                $table->string('token', 64)->primary();
                $table->unsignedInteger('expires_at')->index();
                $table->unsignedInteger('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_sessions');
    }
};
