<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisteredCustomerFilterRequest extends FormRequest
{
    public const PER_PAGE_OPTIONS = [10, 25, 50, 100];

    public function authorize(): bool
    {
        return $this->user()?->can('manage-registrations') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'status' => ['nullable', Rule::in(['all', 'validated', 'unvalidated'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', Rule::in(self::PER_PAGE_OPTIONS)],
        ];
    }

    public function messages(): array
    {
        return [
            'date_to.after_or_equal' => 'The "To" date must be the same as or after the "From" date.',
        ];
    }

    /** @return array{search: ?string, date_from: ?string, date_to: ?string, status: string} */
    public function filters(): array
    {
        return [
            'search' => $this->validated('search'),
            'date_from' => $this->validated('date_from'),
            'date_to' => $this->validated('date_to'),
            'status' => $this->validated('status') ?? 'all',
        ];
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? 10);
    }
}
