<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email');
            $table->string('contact_number', 20);
            $table->text('address');
            $table->string('unit');
            $table->foreignId('branch_id')->constrained()->restrictOnDelete();
            $table->date('purchase_date');
            // One registration per order/receipt reference.
            $table->string('reference_number')->unique();
            // Promo code / raffle ticket emailed to the customer (replaces tickets.id + GX-xxxx promoCode).
            // Only validated registrations are entered into the draw.
            $table->string('ticket_code', 32)->nullable()->unique();
            // Stored on the private disk; served only to admins.
            $table->string('proof_path');
            $table->dateTime('privacy_consented_at');
            $table->dateTime('terms_accepted_at');
            $table->dateTime('validated_at')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            // 'receipt' = matched automatically against the company receipt list, 'manual' = by staff.
            $table->string('validation_method', 10)->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index('validated_at');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
