<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordSelfServiceTest extends TestCase
{
    use RefreshDatabase;

    private const NEW = 'a-brand-new-password';

    public function test_every_role_can_change_their_own_password(): void
    {
        foreach (['staffRole', 'admin', 'superAdmin'] as $state) {
            $user = User::factory()->{$state}()->create();

            $this->actingAs($user)->postJson('/api/account/password', [
                'current_password' => 'password-for-tests', 'password' => self::NEW, 'password_confirmation' => self::NEW,
            ])->assertOk();

            $this->assertTrue(Hash::check(self::NEW, $user->fresh()->password), $state);
        }
    }

    public function test_changing_needs_the_right_current_password_and_a_confirmed_new_one(): void
    {
        $user = User::factory()->staffRole()->create();

        $this->actingAs($user)->postJson('/api/account/password', ['current_password' => 'wrong', 'password' => self::NEW, 'password_confirmation' => self::NEW])
            ->assertStatus(422)->assertJsonValidationErrors('current_password');
        $this->actingAs($user)->postJson('/api/account/password', ['current_password' => 'password-for-tests', 'password' => self::NEW, 'password_confirmation' => 'different'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->actingAs($user)->postJson('/api/account/password', ['current_password' => 'password-for-tests', 'password' => 'short', 'password_confirmation' => 'short'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('password-for-tests', $user->fresh()->password));
    }

    public function test_changing_requires_sign_in_and_signs_out_other_browsers(): void
    {
        $this->postJson('/api/account/password', [])->assertUnauthorized();

        config(['session.driver' => 'database']);
        $user = User::factory()->staffRole()->create();
        DB::table('sessions')->insert(['id' => 'other-browser', 'user_id' => $user->id, 'payload' => 'x', 'last_activity' => time()]);

        $this->actingAs($user)->postJson('/api/account/password', ['current_password' => 'password-for-tests', 'password' => self::NEW, 'password_confirmation' => self::NEW])->assertOk();
        $this->assertSame(0, DB::table('sessions')->where('id', 'other-browser')->count());
    }

    public function test_forgot_password_emails_active_accounts_only_and_answers_the_same_way(): void
    {
        Notification::fake();
        $active = User::factory()->staffRole()->create(['email' => 'active@example.com']);
        $inactive = User::factory()->create(['email' => 'inactive@example.com']);   // is_admin = false

        $a = $this->postJson('/api/auth/forgot-password', ['email' => 'Active@Example.com'])->assertOk()->json('message');
        $b = $this->postJson('/api/auth/forgot-password', ['email' => 'inactive@example.com'])->assertOk()->json('message');
        $c = $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk()->json('message');

        $this->assertSame($a, $b);
        $this->assertSame($a, $c);
        Notification::assertSentTo($active, ResetPassword::class, function (ResetPassword $n) use ($active) {
            $url = $n->toMail($active)->actionUrl;

            return str_contains($url, '/reset-password?token=') && str_contains($url, 'email=active%40example.com');
        });
        Notification::assertNotSentTo($inactive, ResetPassword::class);
    }

    public function test_a_valid_token_resets_the_password_once(): void
    {
        $user = User::factory()->admin()->create(['email' => 'r@example.com']);
        $token = Password::broker()->createToken($user);
        $body = ['token' => $token, 'email' => 'r@example.com', 'password' => self::NEW, 'password_confirmation' => self::NEW];

        $this->postJson('/api/auth/reset-password', $body)->assertOk();
        $this->assertTrue(Hash::check(self::NEW, $user->fresh()->password));

        $this->postJson('/api/auth/reset-password', $body)->assertStatus(422);       // token already used
        $this->postJson('/api/auth/login', ['email' => 'r@example.com', 'password' => self::NEW])->assertOk();
    }

    public function test_a_bad_token_is_refused(): void
    {
        $user = User::factory()->admin()->create(['email' => 'r@example.com']);

        $this->postJson('/api/auth/reset-password', ['token' => 'nope', 'email' => 'r@example.com', 'password' => self::NEW, 'password_confirmation' => self::NEW])
            ->assertStatus(422)->assertJsonValidationErrors('email');
        $this->assertTrue(Hash::check('password-for-tests', $user->fresh()->password));
    }
}
