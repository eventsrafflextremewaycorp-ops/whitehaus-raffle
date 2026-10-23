<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Roles
 *   superadmin  everything, including creating and managing admins
 *   admin       everything except managing admins; creates / edits / deactivates `staff` accounts
 *   staff       view-level access plus running the draw (no changes to records, receipts or winners)
 *
 * `is_admin` means "active": it lets the account sign in to the staff area. A deactivated account keeps its role.
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public const ROLE_SUPERADMIN = 'superadmin';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_STAFF = 'staff';
    public const ROLES = [self::ROLE_SUPERADMIN, self::ROLE_ADMIN, self::ROLE_STAFF];

    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function isActive(): bool
    {
        return (bool) $this->is_admin;
    }

    public function isSuperAdmin(): bool
    {
        return $this->isActive() && $this->role === self::ROLE_SUPERADMIN;
    }

    /** Admin or superadmin: may change records and manage staff. */
    public function isAdminOrAbove(): bool
    {
        return $this->isActive() && in_array($this->role, [self::ROLE_ADMIN, self::ROLE_SUPERADMIN], true);
    }

    /** Roles this account may give to others. */
    public function assignableRoles(): array
    {
        return match (true) {
            $this->isSuperAdmin() => self::ROLES,
            $this->isAdminOrAbove() => [self::ROLE_STAFF],
            default => [],
        };
    }

    /** Whether this account may edit, reset, deactivate or re-role `$target` (never itself for role/active changes). */
    public function canManage(User $target): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->isAdminOrAbove() && $target->role === self::ROLE_STAFF;
    }
}
