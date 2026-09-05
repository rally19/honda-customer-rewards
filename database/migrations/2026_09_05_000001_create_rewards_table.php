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
        Schema::create('rewards', function (Blueprint $table) {
            $table->string('id', 10)->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->integer('points_cost')->default(0);
            $table->integer('stock')->default(0);
            $table->date('start_period')->nullable();
            $table->date('end_period')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rewards');
    }
};
