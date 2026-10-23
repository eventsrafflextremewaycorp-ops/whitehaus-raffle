<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public registration form.
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'full_name' => trim((string) $this->input('full_name')),
            'email' => strtolower(trim((string) $this->input('email'))),
            'contact_number' => trim((string) $this->input('contact_number')),
            'reference_number' => strtoupper(trim((string) $this->input('reference_number'))),
        ]);
    }

    public function rules(): array
    {
        $today = now()->toDateString();
        $periodEnd = min((string) config('promo.period_end'), $today);

        return [
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:191'],
            'contact_number' => ['required', 'string', 'regex:/^\+?[0-9\s\-()]{7,20}$/'],
            'address' => ['required', 'string', 'max:500'],
            'unit' => ['required', Rule::in(config('promo.units'))],
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')->where('is_active', true)],
            'purchase_date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:'.config('promo.period_start'),
                'before_or_equal:'.$periodEnd,
            ],
            'reference_number' => ['required', 'string', 'max:100', Rule::unique('registrations', 'reference_number')],
            'proof_of_purchase' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.config('promo.proof_max_kb')],
            'privacy_consent' => ['accepted'],
            'terms' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'purchase_date.after_or_equal' => 'The purchase date must fall within the promo period.',
            'purchase_date.before_or_equal' => 'The purchase date must fall within the promo period and cannot be in the future.',
            'reference_number.unique' => 'This reference number has already been registered.',
            'contact_number.regex' => 'Enter a valid contact number.',
            'proof_of_purchase.mimes' => 'Upload a JPG, PNG or PDF file.',
            'proof_of_purchase.max' => 'The proof of purchase must not be larger than 2 MB.',
            'privacy_consent.accepted' => 'Please agree to the Data Privacy Statement.',
            'terms.accepted' => 'Please agree to the terms and conditions.',
            'branch_id.required' => 'Select the participating branch.',
            'branch_id.exists' => 'Select a valid participating branch.',
            'unit.in' => 'Select a participating unit.',
        ];
    }

    public function attributes(): array
    {
        return [
            'full_name' => 'full name',
            'contact_number' => 'contact number',
            'address' => 'complete address',
            'unit' => 'participating unit',
            'branch_id' => 'participating branch',
            'purchase_date' => 'purchase date',
            'reference_number' => 'reference number',
            'proof_of_purchase' => 'proof of purchase',
        ];
    }
}
