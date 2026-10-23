<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Every read, export, proof download and validation of customer
        // registrations goes through this gate.
        // view-level access to the staff area (customers, receipts, tickets, winners) and running the draw: any active account
        Gate::define('manage-registrations', fn (User $user): bool => $user->isActive());
        // changing records: validation, receipts, undo / publish / prize assignment: admin and superadmin
        Gate::define('manage-records', fn (User $user): bool => $user->isAdminOrAbove());
        // adding and managing staff accounts: admin and superadmin (admins only manage `staff` accounts)
        Gate::define('manage-staff', fn (User $user): bool => $user->isAdminOrAbove());
        // managing admins and superadmins: superadmin only
        Gate::define('manage-admins', fn (User $user): bool => $user->isSuperAdmin());

        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by(
            strtolower((string) $request->input('email')).'|'.$request->ip()
        ));

        RateLimiter::for('password-reset', fn (Request $request) => Limit::perMinute(5)->by(
            strtolower((string) $request->input('email')).'|'.$request->ip()
        ));

        // Reset links open the React page on this same site, e.g. https://whitehaus.example.com/reset-password?token=...&email=...
        ResetPassword::createUrlUsing(fn (User $user, string $token) => rtrim((string) config('app.url'), '/')
            .'/reset-password?token='.urlencode($token).'&email='.urlencode($user->email));

        ResetPassword::toMailUsing(fn (User $user, string $token) => (new MailMessage)
            ->subject('Reset your '.config('app.name').' staff password')
            ->greeting('Hi '.$user->name.',')
            ->line('Someone asked to reset the password for your '.config('app.name').' staff account.')
            ->action('Choose a new password', rtrim((string) config('app.url'), '/')
                .'/reset-password?token='.urlencode($token).'&email='.urlencode($user->email))
            ->line('This link expires in 60 minutes and works once.')
            ->line('If you did not ask for this, ignore this e-mail - your password stays the same.'));

        RateLimiter::for('registrations', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
    }
}
