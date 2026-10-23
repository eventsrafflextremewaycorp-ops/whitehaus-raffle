<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;

// php artisan gx:create-admin admin@example.com "Admin Name" [--role=superadmin|admin|staff]
Artisan::command('gx:create-admin {email} {name=Administrator} {--role=superadmin : superadmin, admin or staff}', function (string $email, string $name) {
    $role = (string) $this->option('role');
    if (! in_array($role, User::ROLES, true)) {
        $this->error('The role must be one of: '.implode(', ', User::ROLES).'.');

        return 1;
    }

    $password = $this->secret('Password (min. 12 characters)');

    $validator = Validator::make(
        ['email' => $email, 'password' => $password],
        ['email' => ['required', 'email'], 'password' => ['required', 'string', 'min:12']]
    );

    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }

    $user = User::firstOrNew(['email' => strtolower($email)]);
    $user->name = $name;
    $user->password = $password; // hashed by the model cast
    $user->is_admin = true;
    $user->role = $role;
    $user->save();

    $this->info("Account ready: {$user->email} ({$role})");

    return 0;
})->purpose('Create or update a staff-area account (default role: superadmin) - used to create the first superadmin');

// php artisan gx:test-mail you@gmail.com
// Sends one plain test e-mail with the current MAIL_* settings and prints what it is using.
Artisan::command('gx:test-mail {to : address to send the test to}', function (string $to) {
    $mailer = (string) config('mail.default');
    $this->line('Mailer:  '.$mailer);
    $this->line('Host:    '.(config('mail.mailers.smtp.host') ?: '(not set)').':'.config('mail.mailers.smtp.port'));
    $this->line('From:    '.config('mail.from.address'));

    if (in_array($mailer, ['log', 'array'], true)) {
        $this->warn("MAIL_MAILER is \"{$mailer}\": nothing is really sent, the message is only written to storage/logs/laravel.log. Set MAIL_MAILER=smtp in .env, run `php artisan config:clear`, and try again.");
    }

    try {
        \Illuminate\Support\Facades\Mail::raw(
            "This is a test e-mail from ".config('app.name').".\nIf you can read it, e-mail sending works.",
            fn ($m) => $m->to($to)->subject(config('app.name').' test e-mail')
        );
    } catch (\Throwable $e) {
        $this->error('Sending failed: '.$e->getMessage());

        return 1;
    }

    $this->info("Handed to the mail server for {$to}. Check the inbox and the Spam folder in a minute.");

    return 0;
})->purpose('Send a test e-mail to check the MAIL_* settings');
