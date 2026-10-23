<?php

use Database\Seeders\PrizeSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Weeks 2 to 10: adds prizes.is_active and, on a database that already holds the Week 1 data,
 * switches the Week 1 prizes off, adds the Week 2 to 10 prizes.
 * Nothing is deleted, so winners and registrations keep pointing at their prize and branch.
 * A brand-new database is filled by `php artisan db:seed` instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('prizes', 'is_active')) {
            Schema::table('prizes', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('sort_order');
            });
        }

        $now = now();

        if (DB::table('prizes')->exists()) {
            DB::table('prizes')->whereIn('name', PrizeSeeder::RETIRED)->update(['is_active' => false]);

            foreach (PrizeSeeder::CURRENT as $i => $prize) {
                $row = $prize + ['sort_order' => $i + 1, 'is_active' => true, 'updated_at' => $now];
                if (DB::table('prizes')->where('name', $prize['name'])->exists()) {
                    DB::table('prizes')->where('name', $prize['name'])->update($row);
                } else {
                    DB::table('prizes')->insert($row + ['created_at' => $now]);
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('prizes', 'is_active')) {
            Schema::table('prizes', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }
    }
};
