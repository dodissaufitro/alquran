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
        if (!Schema::hasTable('cms_content_sections')) {
            Schema::create('cms_content_sections', function (Blueprint $table) {
                $table->string('section_key', 64)->primary();
                $table->longText('payload');
                $table->unsignedInteger('updated_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_content_sections');
    }
};
