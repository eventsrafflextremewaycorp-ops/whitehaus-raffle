<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Roles: superadmin > admin > staff.
 * users.is_admin keeps its meaning "may sign in to the staff area" (active); users.role says what they may do.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 20)->default('staff')->after('is_admin');
            });
        }

        // Existing accounts all had full access: the oldest active account becomes the superadmin,
        // everyone else who could sign in becomes an admin. Nothing is lost; change roles on the Staff accounts screen.
        $first = DB::table('users')->where('is_admin', true)->orderBy('id')->value('id');
        if ($first) {
            DB::table('users')->where('is_admin', true)->update(['role' => 'admin']);
            DB::table('users')->where('id', $first)->update(['role' => 'superadmin']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
