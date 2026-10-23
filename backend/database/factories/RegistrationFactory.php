<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Registration> */
class RegistrationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'contact_number' => '09'.fake()->numerify('#########'),
            'address' => fake()->streetAddress().', '.fake()->city(),
            'unit' => fake()->randomElement(['iPhone 18 Pro', 'iPhone 18 Pro Max']),
            'branch_id' => Branch::query()->inRandomOrder()->value('id') ?? Branch::factory(),
            'purchase_date' => '2026-10-17',
            'reference_number' => strtoupper(fake()->unique()->bothify('GX-######??')),
            'proof_path' => 'proofs/test.jpg',
            'privacy_consented_at' => now(),
            'terms_accepted_at' => now(),
        ];
    }
}
