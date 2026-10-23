<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Self-service passwords for every role (staff, admin, superadmin).
 *
 *   POST /api/account/password       signed in: change your own password (current password required)
 *   POST /api/auth/forgot-password   signed out: e-mail a reset link (active accounts only)
 *   POST /api/auth/reset-password    signed out: set a new password with the e-mailed token
 *
 * Passwords are stored as one-way bcrypt hashes, so nobody (not even a superadmin) can read them;
 * they can only be changed or reset.
 */
class PasswordController extends Controller
{
    private const MIN_PASSWORD = 12;

    public function change(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:'.self::MIN_PASSWORD, 'max:200', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Your current password is incorrect.']);
        }
        if (Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => 'Choose a password different from your current one.']);
        }

        $user->password = $data['password'];
        $user->save();

        // Sign out every other browser that used the old password; keep this one.
        $this->endSessions($user, $request->session()->getId());

        return response()->json(['message' => 'Your password has been changed.']);
    }

    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $email = strtolower(trim($data['email']));

        // Only active staff-area accounts get a link. The reply is the same either way, so the form
        // cannot be used to find out which e-mail addresses have accounts.
        $user = User::where('email', $email)->first();
        if ($user && $user->isActive()) {
            Password::broker()->sendResetLink(['email' => $email]);
        }

        return response()->json([
            'message' => 'If that e-mail belongs to an active staff account, a reset link is on its way. It expires in 60 minutes.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:'.self::MIN_PASSWORD, 'max:200', 'confirmed'],
        ]);
        $data['email'] = strtolower(trim($data['email']));

        $status = Password::broker()->reset(
            ['email' => $data['email'], 'token' => $data['token'], 'password' => $data['password'], 'password_confirmation' => $request->input('password_confirmation')],
            function (User $user, string $password) {
                $user->password = $password;
                $user->setRememberToken(Str::random(60));
                $user->save();
                $this->endSessions($user);
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'This reset link is invalid or has expired. Request a new one.',
            ]);
        }

        return response()->json(['message' => 'Your password has been reset. You can sign in now.']);
    }

    private function endSessions(User $user, ?string $except = null): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        DB::table(config('session.table', 'sessions'))
            ->where('user_id', $user->id)
            ->when($except, fn ($q) => $q->where('id', '!=', $except))
            ->delete();
    }
}
