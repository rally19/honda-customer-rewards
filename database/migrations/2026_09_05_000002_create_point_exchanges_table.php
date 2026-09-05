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
        Schema::create('point_exchanges', function (Blueprint $table) {
            $table->string('id', 10)->primary();
            $table->string('reward_id', 10)->nullable();
            $table->string('reward_name');
            $table->string('reward_image')->nullable();
            $table->integer('points_cost')->default(0);
            $table->unsignedBigInteger('user_id');
            $table->string('user_name');
            $table->string('user_email');
            $table->string('user_phone', 25)->nullable();
            $table->text('user_address')->nullable();
            $table->string('status')->default('hold'); // hold, claimed, rejected, cancelled
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->foreign('reward_id')->references('id')->on('rewards')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('admin_id')->references('id')->on('users')->nullOnDelete();

            $table->index('user_id');
            $table->index('reward_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('point_exchanges');
    }
};
