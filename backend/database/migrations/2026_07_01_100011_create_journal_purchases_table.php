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
        if (!Schema::hasTable('journal_purchases')) {
            Schema::create('journal_purchases', function (Blueprint $table) {
                $table->string('email', 255);
                $table->string('journal_id', 128);
                $table->unsignedInteger('active_until')->index();
                $table->unsignedInteger('updated_at');

                $table->primary(['email', 'journal_id']);
                $table->index(['email', 'active_until']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_purchases');
    }
};
