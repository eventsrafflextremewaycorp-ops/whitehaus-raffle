<?php

use App\Models\Registration;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Upgrades databases that already ran the first version of the registrations/winners
 * migrations (before tickets and the draw existed). On a fresh install every step is a no-op.
 * Nothing is dropped and no rows are deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            if (! Schema::hasColumn('registrations', 'ticket_code')) {
                $table->string('ticket_code', 32)->nullable()->unique()->after('reference_number');
            }
            if (! Schema::hasColumn('registrations', 'validation_method')) {
                $table->string('validation_method', 10)->nullable()->after('validated_by');
            }
        });

        // Give existing registrations their ticket number.
        Registration::query()->whereNull('ticket_code')->orderBy('id')->each(function (Registration $r) {
            $r->forceFill(['ticket_code' => Registration::newTicketCode()])->save();
        });

        Schema::table('winners', function (Blueprint $table) {
            if (! Schema::hasColumn('winners', 'draw_number')) {
                $table->unsignedSmallInteger('draw_number')->nullable()->unique()->after('prize_id');
            }
            if (! Schema::hasColumn('winners', 'drawn_by')) {
                $table->foreignId('drawn_by')->nullable()->after('draw_number')->constrained('users')->nullOnDelete();
            }
        });

        // A winner no longer needs a real prize (the draw number defines the category).
        Schema::table('winners', function (Blueprint $table) {
            $table->unsignedBigInteger('prize_id')->nullable()->change();
        });

        // Old rule: one win per registration (UNIQUE). The "Exclude winners" toggle needs a plain index instead.
        $indexes = collect(Schema::getIndexes('winners'))->pluck('name');
        if ($indexes->contains('winners_registration_id_unique')) {
            Schema::table('winners', function (Blueprint $table) {
                $table->index('registration_id', 'winners_registration_id_index');
            });
            Schema::table('winners', function (Blueprint $table) {
                $table->dropUnique('winners_registration_id_unique');
            });
        }
    }

    public function down(): void
    {
        // Intentionally empty: this only repairs older databases.
    }
};
