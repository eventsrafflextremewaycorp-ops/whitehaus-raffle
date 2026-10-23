<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRegistrationRequest;
use App\Mail\RegistrationReceived;
use App\Models\Registration;
use App\Services\ReceiptMatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

/**
 * Public customer registration (replaces condition.php -> create.php).
 */
class RegistrationController extends Controller
{
    public function store(StoreRegistrationRequest $request, ReceiptMatcher $matcher): JsonResponse
    {
        if (! config('promo.registration_open')) {
            return response()->json(['message' => 'Registration for this promo is closed.'], 403);
        }

        $data = $request->validated();

        // Private disk: storage/app/private/proofs — never publicly reachable.
        $proofPath = $request->file('proof_of_purchase')->store('proofs', 'local');

        try {
            $registration = DB::transaction(fn () => Registration::create([
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'contact_number' => $data['contact_number'],
                'address' => $data['address'],
                'unit' => $data['unit'],
                'branch_id' => $data['branch_id'],
                'purchase_date' => $data['purchase_date'],
                'reference_number' => $data['reference_number'],
                'proof_path' => $proofPath,
                'privacy_consented_at' => now(),
                'terms_accepted_at' => now(),
            ]));
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($proofPath);
            throw $e;
        }

        // If the company already listed this receipt, validate straight away.
        $matcher->matchRegistration($registration);

        // The confirmation e-mail must never make a registration fail.
        $emailed = true;
        try {
            Mail::to($registration->email)->send(new RegistrationReceived($registration->fresh('branch')));
        } catch (\Throwable $e) {
            $emailed = false;
            Log::warning('Registration e-mail failed', ['registration_id' => $registration->id, 'error' => $e->getMessage()]);
        }

        return response()->json([
            'message' => $emailed
                ? 'Registration received. Your ticket number was sent to your e-mail. Complete full payment at your selected branch to qualify for the raffle.'
                : 'Registration received. We could not send the confirmation e-mail - please keep your ticket number. Complete full payment at your selected branch to qualify for the raffle.',
            'data' => [
                'reference_number' => $registration->reference_number,
                'ticket_code' => $registration->ticket_code,
                'email_sent' => $emailed,
                'registered_at' => $registration->created_at->toIso8601String(),
            ],
        ], 201);
    }
}
