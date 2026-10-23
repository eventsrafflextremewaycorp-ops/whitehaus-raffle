<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Registration */
class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'contact_number' => $this->contact_number,
            'address' => $this->address,
            'unit' => $this->unit,
            'branch' => $this->branch?->name,
            'purchase_date' => $this->purchase_date?->toDateString(),
            'reference_number' => $this->reference_number,
            'ticket_code' => $this->ticket_code,
            'registered_at' => $this->created_at?->toIso8601String(),
            'validated_at' => $this->validated_at?->toIso8601String(),
            'validation_method' => $this->validation_method,
            'has_proof' => (bool) $this->proof_path,
        ];
    }
}
