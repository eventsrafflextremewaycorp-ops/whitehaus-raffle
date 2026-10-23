<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<\App\Models\User> */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => 'password-for-tests',
            'remember_token' => Str::random(10),
        ];
    }

    /** Active admin (may change records and manage staff). */
    public function admin(): static
    {
        return $this->afterMaking(function ($user) {
            $user->is_admin = true;
            $user->role = 'admin';
        });
    }

    public function superAdmin(): static
    {
        return $this->afterMaking(function ($user) {
            $user->is_admin = true;
            $user->role = 'superadmin';
        });
    }

    /** Active view-and-draw account. */
    public function staffRole(): static
    {
        return $this->afterMaking(function ($user) {
            $user->is_admin = true;
            $user->role = 'staff';
        });
    }
}
