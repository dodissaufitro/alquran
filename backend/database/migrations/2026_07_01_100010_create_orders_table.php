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
        if (!Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->string('id', 32)->primary();
                $table->string('email', 255)->index();
                $table->string('journal_id', 128)->default('');
                $table->unsignedInteger('amount_idr');
                $table->string('status', 32);
                $table->unsignedInteger('created_at');
                $table->unsignedInteger('paid_at')->nullable();
                $table->string('payment_provider', 32)->default('');
                $table->string('payment_ref', 128)->default('');
                $table->text('qr_string')->nullable();
                $table->string('checkout_url', 512)->default('');
                $table->string('order_type', 16)->default('journal');
                $table->unsignedInteger('coin_amount')->default(0);
                $table->string('package_id', 32)->default('');
                $table->string('payment_sync_token', 64)->default('');

                $table->index(['email', 'status']);
                $table->index(['status', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
