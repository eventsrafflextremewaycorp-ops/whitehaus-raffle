<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The company's own list of paid receipts (was "Company Serials" in /validation).
        // A registration whose reference number matches an *active* receipt is validated,
        // and the receipt becomes *taken*.
        Schema::create('company_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->string('status', 10)->default('active'); // active | taken
            $table->date('date_bought')->nullable();
            $table->foreignId('registration_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('taken_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_receipts');
    }
};
