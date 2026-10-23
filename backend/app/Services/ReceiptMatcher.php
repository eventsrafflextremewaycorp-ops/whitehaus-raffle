<?php

namespace App\Services;

use App\Models\CompanyReceipt;
use App\Models\Registration;
use Illuminate\Support\Facades\DB;

/**
 * Receipt-based validation (was validation/update.php + insert_serial.php + import.php).
 *
 * A registration is validated when its reference number equals an ACTIVE company receipt;
 * the receipt then becomes TAKEN and is linked to that registration, so one receipt can
 * validate only one registration.
 */
class ReceiptMatcher
{
    /** Try to validate one registration against the receipt list. */
    public function matchRegistration(Registration $registration): bool
    {
        $receipt = CompanyReceipt::query()
            ->where('receipt_number', CompanyReceipt::normalize($registration->reference_number))
            ->first();

        return $receipt ? $this->claim($receipt, $registration) : false;
    }

    /** Try to match one receipt to the registration carrying the same reference number. */
    public function matchReceipt(CompanyReceipt $receipt): bool
    {
        if ($receipt->status !== CompanyReceipt::ACTIVE) {
            return false;
        }

        $registration = Registration::query()
            ->where('reference_number', $receipt->receipt_number)
            ->whereNull('validated_at')
            ->first();

        return $registration ? $this->claim($receipt, $registration) : false;
    }

    private function claim(CompanyReceipt $receipt, Registration $registration): bool
    {
        return DB::transaction(function () use ($receipt, $registration) {
            $receipt = CompanyReceipt::query()->lockForUpdate()->find($receipt->id);
            $registration = Registration::query()->lockForUpdate()->find($registration->id);

            if (! $receipt || ! $registration
                || $receipt->status !== CompanyReceipt::ACTIVE
                || $registration->validated_at !== null) {
                return false;
            }

            $receipt->forceFill([
                'status' => CompanyReceipt::TAKEN,
                'registration_id' => $registration->id,
                'taken_at' => now(),
            ])->save();

            $registration->forceFill([
                'validated_at' => now(),
                'validated_by' => null,
                'validation_method' => 'receipt',
            ])->save();

            return true;
        });
    }

    /** Staff un-validated a registration: free its receipt so it can be used again. */
    public function release(Registration $registration): void
    {
        CompanyReceipt::query()
            ->where('registration_id', $registration->id)
            ->update(['status' => CompanyReceipt::ACTIVE, 'registration_id' => null, 'taken_at' => null]);
    }
}
