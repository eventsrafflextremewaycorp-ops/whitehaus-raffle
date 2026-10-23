<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            BranchSeeder::class,
            PrizeSeeder::class,
        ]);

        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if ($email && $password) {
            $user = User::firstOrNew(['email' => strtolower($email)]);
            $user->name = env('ADMIN_NAME') ?: 'Administrator';
            $user->password = $password;
            $user->is_admin = true;
            $user->role = 'superadmin';
            $user->save();
            $this->command?->info("Admin account ready: {$user->email}");
        } else {
            $this->command?->warn('No ADMIN_EMAIL/ADMIN_PASSWORD set. Run `php artisan gx:create-admin you@example.com` to create an admin.');
        }
    }
}
