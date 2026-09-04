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
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'points')) {
                $table->unsignedInteger('points')->default(0)->after('role');
            }

            if (! Schema::hasColumn('users', 'lifetime_points')) {
                $table->unsignedInteger('lifetime_points')->default(0)->after('points');
            }

            if (! Schema::hasColumn('users', 'tier')) {
                $table->string('tier', 20)->default('Bronze')->after('lifetime_points');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'tier')) {
                $table->dropColumn('tier');
            }

            if (Schema::hasColumn('users', 'lifetime_points')) {
                $table->dropColumn('lifetime_points');
            }

            if (Schema::hasColumn('users', 'points')) {
                $table->dropColumn('points');
            }
        });
    }
};
