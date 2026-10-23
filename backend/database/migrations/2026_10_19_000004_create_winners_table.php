<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('winners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->restrictOnDelete();
            // Real prize, optional: the raffle itself only fixes the draw number
            // (4-23 Consolation, 1-3 Major), exactly like the original draw app.
            $table->foreignId('prize_id')->nullable()->constrained()->restrictOnDelete();
            // Descending draw number. UNIQUE = a draw can never be recorded twice.
            $table->unsignedSmallInteger('draw_number')->unique();
            $table->foreignId('drawn_by')->nullable()->constrained('users')->nullOnDelete();
            // Winners are listed publicly only after staff publish them (Mechanics, section C).
            $table->dateTime('announced_at')->nullable();
            $table->timestamps();

            $table->index('registration_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('winners');
    }
};
