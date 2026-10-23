<?php

namespace Tests\Feature;

use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConcurrentSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_same_staff_account_can_be_signed_in_from_two_browsers_at_once(): void
    {
        $admin = User::factory()->admin()->create(['email' => 'staff@example.com']);
        $login = ['email' => 'staff@example.com', 'password' => 'password-for-tests'];

        $this->postJson('/api/auth/login', $login)->assertOk();
        $this->assertAuthenticatedAs($admin, 'web');

        // second browser / session
        $this->flushSession();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', $login)->assertOk();

        // both sessions are recorded as open; nothing signed the first one out
        $this->assertSame(2, LoginLog::where('user_id', $admin->id)->whereNull('logged_out_at')->count());
    }

    public function test_logout_closes_only_its_own_login_log(): void
    {
        $admin = User::factory()->admin()->create(['email' => 'staff@example.com']);
        $other = LoginLog::create(['user_id' => $admin->id, 'logged_in_at' => now()]);

        $this->postJson('/api/auth/login', ['email' => 'staff@example.com', 'password' => 'password-for-tests'])->assertOk();
        $this->postJson('/api/auth/logout')->assertOk();

        $this->assertNull($other->fresh()->logged_out_at);
        $this->assertSame(1, LoginLog::whereNotNull('logged_out_at')->count());
    }
}
