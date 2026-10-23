<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Branch> */
class BranchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Test Branch '.fake()->unique()->numberBetween(1, 99999),
            'region' => 'Metro Manila',
            'is_online' => false,
            'is_active' => true,
        ];
    }
}
