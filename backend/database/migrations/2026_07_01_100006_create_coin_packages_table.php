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
        if (!Schema::hasTable('coin_packages')) {
            Schema::create('coin_packages', function (Blueprint $table) {
                $table->string('id', 32)->primary();
                $table->string('label', 255)->default('');
                $table->unsignedInteger('base_coins')->default(0);
                $table->unsignedInteger('bonus_coins')->default(0);
                $table->unsignedInteger('bonus_percent')->nullable();
                $table->unsignedInteger('price_idr')->default(0);
                $table->string('badge', 64)->nullable();
                $table->boolean('starter_pack')->default(false);
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('updated_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_packages');
    }
};
