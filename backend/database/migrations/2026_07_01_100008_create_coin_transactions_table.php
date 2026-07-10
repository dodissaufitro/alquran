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
        if (!Schema::hasTable('coin_transactions')) {
            Schema::create('coin_transactions', function (Blueprint $table) {
                $table->string('id', 32)->primary();
                $table->string('email', 255)->index();
                $table->string('type', 16);
                $table->integer('amount');
                $table->unsignedInteger('balance_after');
                $table->string('ref_type', 32)->default('');
                $table->string('ref_id', 128)->default('');
                $table->string('note', 255)->default('');
                $table->unsignedInteger('created_at')->index();

                $table->index(['email', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_transactions');
    }
};
