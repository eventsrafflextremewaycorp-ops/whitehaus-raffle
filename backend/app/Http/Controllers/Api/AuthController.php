<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Sanctum SPA (cookie) authentication for the admin area.
 * The frontend first calls GET /sanctum/csrf-cookie, then POST /api/auth/login.
 */
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::guard('web')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        $user = Auth::guard('web')->user();

        if (! $user->is_admin) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['message' => 'This account does not have access to the staff area.'], 403);
        }

        // Concurrent sessions are allowed on purpose: signing in here never signs the
        // same account out of another browser (no logoutOtherDevices).
        $request->session()->regenerate();

        $log = LoginLog::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'logged_in_at' => now(),
        ]);
        $request->session()->put('login_log_id', $log->id);

        return response()->json(['data' => $this->present($user)]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->present($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        if ($logId = $request->session()->get('login_log_id')) {
            LoginLog::whereKey($logId)->where('user_id', $request->user()?->id)->update(['logged_out_at' => now()]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    private function present($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_admin' => (bool) $user->is_admin,
            'role' => $user->role,
            // what the screens may offer; the API re-checks every request
            'can' => [
                'manage_records' => $user->isAdminOrAbove(),
                'manage_staff' => $user->isAdminOrAbove(),
                'manage_admins' => $user->isSuperAdmin(),
            ],
        ];
    }
}
