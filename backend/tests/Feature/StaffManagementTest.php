<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffManagementTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->superAdmin()->create(['email' => 'root@example.com', 'name' => 'Root']);
    }

    private function admin(): User
    {
        return User::factory()->admin()->create(['email' => 'boss@example.com', 'name' => 'Boss']);
    }

    private function staff(array $attrs = []): User
    {
        return User::factory()->staffRole()->create($attrs);
    }

    private const NEW = ['name' => 'New Person', 'email' => 'new@example.com', 'password' => 'correct-horse-battery'];

    public function test_guests_inactive_users_and_view_only_staff_cannot_use_the_staff_api(): void
    {
        $this->getJson('/api/staff')->assertUnauthorized();

        $this->actingAs(User::factory()->create())->getJson('/api/staff')->assertForbidden();           // not active
        $this->actingAs($this->staff())->getJson('/api/staff')->assertForbidden();                       // view-level staff
        $this->actingAs($this->staff())->postJson('/api/staff', self::NEW)->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'new@example.com']);
    }

    public function test_the_list_shows_roles_and_what_the_viewer_may_do(): void
    {
        $super = $this->superAdmin();
        $admin = $this->admin();
        $staff = $this->staff(['email' => 's@example.com']);

        $rows = collect($this->actingAs($admin)->getJson('/api/staff')->assertOk()
            ->assertJsonPath('meta.assignable_roles', ['staff'])->json('data'));
        $this->assertArrayNotHasKey('password', $rows[0]);
        $this->assertFalse($rows->firstWhere('email', 'root@example.com')['can_manage']);              // admin can't touch a superadmin
        $this->assertTrue($rows->firstWhere('email', 's@example.com')['can_manage']);                  // ...but can manage staff
        $this->assertTrue($rows->firstWhere('email', 'boss@example.com')['is_you']);
        $this->assertFalse($rows->firstWhere('email', 'boss@example.com')['can_toggle_active']);       // never yourself

        $this->actingAs($super)->getJson('/api/staff')->assertJsonPath('meta.assignable_roles', ['superadmin', 'admin', 'staff']);
    }

    public function test_an_admin_can_add_staff_who_can_then_sign_in(): void
    {
        $this->actingAs($this->admin())->postJson('/api/staff', ['name' => 'New Person', 'email' => ' New@Example.com ', 'password' => 'correct-horse-battery'])
            ->assertCreated()->assertJsonPath('data.email', 'new@example.com')->assertJsonPath('data.role', 'staff')->assertJsonPath('data.active', true);

        $user = User::where('email', 'new@example.com')->first();
        $this->assertTrue(Hash::check('correct-horse-battery', $user->password));

        $this->app['auth']->forgetGuards();
        $this->flushSession();
        $this->postJson('/api/auth/login', ['email' => 'new@example.com', 'password' => 'correct-horse-battery'])
            ->assertOk()->assertJsonPath('data.role', 'staff')->assertJsonPath('data.can.manage_records', false);
    }

    public function test_an_admin_cannot_create_admins_or_superadmins_but_a_superadmin_can(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->postJson('/api/staff', self::NEW + ['role' => 'admin'])->assertForbidden();
        $this->actingAs($admin)->postJson('/api/staff', self::NEW + ['role' => 'superadmin'])->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'new@example.com']);

        $super = $this->superAdmin();
        $this->actingAs($super)->postJson('/api/staff', self::NEW + ['role' => 'admin'])->assertCreated()->assertJsonPath('data.role', 'admin');
        $this->actingAs($super)->postJson('/api/staff', ['email' => 'sa@example.com'] + self::NEW + ['role' => 'superadmin'])->assertCreated();
    }

    public function test_adding_staff_validates_input(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/staff', ['name' => 'A', 'email' => 'boss@example.com', 'password' => 'a-long-enough-password'])
            ->assertStatus(422)->assertJsonValidationErrors('email');
        $this->actingAs($admin)->postJson('/api/staff', ['name' => 'A', 'email' => 'a@example.com', 'password' => 'short'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->actingAs($admin)->postJson('/api/staff', ['name' => '', 'email' => 'not-an-email', 'password' => 'a-long-enough-password'])
            ->assertStatus(422)->assertJsonValidationErrors(['name', 'email']);
        $this->actingAs($admin)->postJson('/api/staff', self::NEW + ['role' => 'owner'])->assertStatus(422)->assertJsonValidationErrors('role');
    }

    public function test_an_admin_manages_staff_but_not_other_admins_or_the_superadmin(): void
    {
        $admin = $this->admin();
        $staff = $this->staff(['email' => 'old@example.com']);
        $otherAdmin = User::factory()->admin()->create();
        $super = $this->superAdmin();

        $this->actingAs($admin)->patchJson("/api/staff/{$staff->id}", ['name' => 'Renamed', 'email' => 'new@example.com'])->assertOk()->assertJsonPath('data.name', 'Renamed');
        $this->assertSame('new@example.com', $staff->fresh()->email);
        $this->actingAs($admin)->postJson("/api/staff/{$staff->id}/password", ['password' => 'brand-new-password-1'])->assertOk();
        $this->assertTrue(Hash::check('brand-new-password-1', $staff->fresh()->password));
        $this->actingAs($admin)->patchJson("/api/staff/{$staff->id}/active", ['active' => false])->assertOk();
        $this->assertFalse($staff->fresh()->is_admin);

        foreach ([$otherAdmin, $super] as $target) {
            $this->actingAs($admin)->patchJson("/api/staff/{$target->id}", ['name' => 'X', 'email' => 'x'.$target->id.'@example.com'])->assertForbidden();
            $this->actingAs($admin)->postJson("/api/staff/{$target->id}/password", ['password' => 'brand-new-password-1'])->assertForbidden();
            $this->actingAs($admin)->patchJson("/api/staff/{$target->id}/active", ['active' => false])->assertForbidden();
            $this->assertTrue($target->fresh()->is_admin);
        }
    }

    public function test_an_admin_cannot_promote_staff(): void
    {
        $staff = $this->staff();

        $this->actingAs($this->admin())->patchJson("/api/staff/{$staff->id}", ['name' => $staff->name, 'email' => $staff->email, 'role' => 'admin'])->assertForbidden();
        $this->assertSame('staff', $staff->fresh()->role);
    }

    public function test_a_superadmin_can_change_roles_and_manage_admins(): void
    {
        $super = $this->superAdmin();
        $target = User::factory()->admin()->create();

        $this->actingAs($super)->patchJson("/api/staff/{$target->id}", ['name' => $target->name, 'email' => $target->email, 'role' => 'staff'])
            ->assertOk()->assertJsonPath('data.role', 'staff');
        $this->actingAs($super)->patchJson("/api/staff/{$target->id}", ['name' => $target->name, 'email' => $target->email, 'role' => 'superadmin'])->assertOk();
        $this->actingAs($super)->patchJson("/api/staff/{$target->id}/active", ['active' => false])->assertOk();
        $this->assertFalse($target->fresh()->is_admin);
    }

    public function test_nobody_can_change_their_own_role_or_deactivate_themselves(): void
    {
        $super = $this->superAdmin();
        $admin = $this->admin();

        $this->actingAs($super)->patchJson("/api/staff/{$super->id}", ['name' => 'Root', 'email' => 'root@example.com', 'role' => 'staff'])->assertStatus(422);
        $this->actingAs($super)->patchJson("/api/staff/{$super->id}/active", ['active' => false])->assertStatus(422);
        $this->actingAs($admin)->patchJson("/api/staff/{$admin->id}/active", ['active' => false])->assertForbidden();
        $this->assertSame('superadmin', $super->fresh()->role);
        $this->assertTrue($super->fresh()->is_admin);
        $this->assertTrue($admin->fresh()->is_admin);
    }

    public function test_anyone_in_the_list_may_edit_their_own_name_and_password(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->patchJson("/api/staff/{$admin->id}", ['name' => 'Boss Renamed', 'email' => 'boss@example.com'])->assertOk();
        $this->assertSame('Boss Renamed', $admin->fresh()->name);
        $this->actingAs($admin)->postJson("/api/staff/{$admin->id}/password", ['password' => 'brand-new-password-1'])->assertOk();
    }

    public function test_deactivated_staff_cannot_sign_in_and_can_be_reactivated(): void
    {
        $admin = $this->admin();
        $other = $this->staff(['email' => 'gone@example.com']);

        $this->actingAs($admin)->patchJson("/api/staff/{$other->id}/active", ['active' => false])->assertOk()->assertJsonPath('data.active', false);

        $this->app['auth']->forgetGuards();
        $this->flushSession();
        $this->postJson('/api/auth/login', ['email' => 'gone@example.com', 'password' => 'password-for-tests'])->assertForbidden();

        $this->actingAs($admin)->patchJson("/api/staff/{$other->id}/active", ['active' => true])->assertOk();
        $this->assertTrue($other->fresh()->is_admin);
        $this->assertSame('staff', $other->fresh()->role);   // the role is kept while deactivated
    }

    public function test_deactivating_ends_that_persons_database_sessions(): void
    {
        config(['session.driver' => 'database']);
        $this->flushHeaders();   // not a stateful request: no session row of its own
        $admin = $this->admin();
        $other = $this->staff();

        DB::table('sessions')->insert([
            ['id' => 's1', 'user_id' => $other->id, 'payload' => 'x', 'last_activity' => time()],
            ['id' => 's2', 'user_id' => $other->id, 'payload' => 'x', 'last_activity' => time()],
            ['id' => 's3', 'user_id' => $admin->id, 'payload' => 'x', 'last_activity' => time()],
        ]);

        $this->actingAs($admin)->patchJson("/api/staff/{$other->id}/active", ['active' => false])->assertOk();

        $this->assertSame(0, DB::table('sessions')->where('user_id', $other->id)->count());
        $this->assertSame(1, DB::table('sessions')->where('user_id', $admin->id)->count());
    }
}
