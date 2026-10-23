<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Staff accounts. Routes require can:manage-staff (admin or superadmin).
 *
 *   superadmin  can manage everyone and give any role.
 *   admin       can only add / edit / reset / deactivate accounts whose role is `staff`, and only create `staff`.
 *
 * Nobody can change their own role or deactivate themselves, so at least one active superadmin always remains
 * (only a superadmin can touch a superadmin, and never themselves).
 *
 * "Active" means users.is_admin = 1. Deactivating keeps the row (and its login history) but blocks sign-in and
 * ends the person's open sessions. Accounts are never hard-deleted here.
 */
class StaffController extends Controller
{
    private const MIN_PASSWORD = 12;

    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user();

        $lastLogin = LoginLog::query()
            ->selectRaw('user_id, MAX(logged_in_at) as last_login_at')
            ->groupBy('user_id')
            ->pluck('last_login_at', 'user_id');

        $order = "CASE role WHEN 'superadmin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END";

        $staff = User::query()
            ->orderByDesc('is_admin')
            ->orderByRaw($order)
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->present($user, $viewer, $lastLogin[$user->id] ?? null));

        return response()->json([
            'data' => $staff,
            'meta' => ['assignable_roles' => $viewer->assignableRoles()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $viewer = $request->user();
        $this->normaliseEmail($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:'.self::MIN_PASSWORD, 'max:200'],
            'role' => ['nullable', Rule::in(User::ROLES)],
        ]);

        $role = $data['role'] ?? User::ROLE_STAFF;
        $this->authoriseRole($viewer, $role);

        $user = new User(['name' => trim($data['name']), 'email' => $data['email'], 'password' => $data['password']]);
        $user->is_admin = true;
        $user->role = $role;
        $user->save();

        return response()->json(['data' => $this->present($user, $viewer, null)], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();
        // You may always edit your own name and email; changing someone else needs permission over them.
        if (! $viewer->is($user)) {
            $this->authoriseTarget($viewer, $user);
        }
        $this->normaliseEmail($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['nullable', Rule::in(User::ROLES)],
        ]);

        if (isset($data['role']) && $data['role'] !== $user->role) {
            if ($viewer->is($user)) {
                return response()->json(['message' => 'You cannot change your own role.'], 422);
            }
            $this->authoriseRole($viewer, $data['role']);
            $user->role = $data['role'];
        }

        $user->name = trim($data['name']);
        $user->email = $data['email'];
        $user->save();

        return response()->json(['data' => $this->present($user, $viewer, null)]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();
        // Everyone may change their own password here; otherwise the target must be someone they manage.
        if (! $viewer->is($user)) {
            $this->authoriseTarget($viewer, $user);
        }

        $data = $request->validate([
            'password' => ['required', 'string', 'min:'.self::MIN_PASSWORD, 'max:200'],
        ]);

        $user->password = $data['password'];
        $user->save();

        // Anyone signed in with the old password is signed out, except the person doing the reset.
        $this->endSessions($user, $viewer->is($user) ? $request->session()->getId() : null);

        return response()->json(['message' => 'Password updated.']);
    }

    public function setActive(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();
        $this->authoriseTarget($viewer, $user);

        $data = $request->validate(['active' => ['required', 'boolean']]);
        $active = (bool) $data['active'];

        if (! $active && $viewer->is($user)) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->is_admin = $active;
        $user->save();

        if (! $active) {
            $this->endSessions($user);
        }

        return response()->json(['data' => $this->present($user, $viewer, null)]);
    }

    /** 403 unless `$viewer` may manage `$target`. */
    private function authoriseTarget(User $viewer, User $target): void
    {
        abort_unless($viewer->canManage($target), 403, 'You do not have permission to manage this account.');
    }

    /** 403 unless `$viewer` may hand out `$role`. */
    private function authoriseRole(User $viewer, string $role): void
    {
        abort_unless(in_array($role, $viewer->assignableRoles(), true), 403, 'You do not have permission to give that role.');
    }

    private function normaliseEmail(Request $request): void
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => strtolower(trim($request->input('email')))]);
        }
    }

    /** Ends the user's browser sessions (database session driver); `$except` keeps one session id. */
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

    private function present(User $user, User $viewer, $lastLoginAt): array
    {
        $isYou = $user->is($viewer);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'active' => (bool) $user->is_admin,
            'is_you' => $isYou,
            // Whether the viewer may edit / reset / deactivate this row. Changing your own role or active state is never allowed,
            // but you can edit your own name / email and set your own password.
            'can_manage' => $viewer->canManage($user) || $isYou,
            'can_change_role' => $viewer->isSuperAdmin() && ! $isYou,
            'can_toggle_active' => $viewer->canManage($user) && ! $isYou,
            'created_at' => $user->created_at?->toIso8601String(),
            'last_login_at' => $lastLoginAt ? Carbon::parse($lastLoginAt)->toIso8601String() : null,
        ];
    }
}
