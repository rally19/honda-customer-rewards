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
        Schema::create('qr_point_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();
            $table->string('activity_id', 10)->nullable();
            $table->string('activity_name');
            $table->integer('points')->default(0);
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->boolean('requires_manual_confirmation')->default(false);
            $table->boolean('auto_regenerate')->default(false);
            $table->integer('duration_minutes')->default(5);
            $table->string('status', 30)->default('active'); // active, pending_confirmation, claimed, rejected, expired, cancelled
            $table->unsignedBigInteger('scanned_by_user_id')->nullable();
            $table->string('scanned_by_user_name')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->foreign('activity_id')->references('id')->on('activities')->nullOnDelete();
            $table->foreign('admin_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('scanned_by_user_id')->references('id')->on('users')->nullOnDelete();

            $table->index('token');
            $table->index('status');
            $table->index('expires_at');
            $table->index('admin_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qr_point_tokens');
    }
};
