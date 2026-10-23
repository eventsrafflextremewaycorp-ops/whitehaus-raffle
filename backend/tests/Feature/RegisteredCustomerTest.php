<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Registration;
use App\Models\User;
use Database\Seeders\BranchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisteredCustomerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BranchSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_guests_cannot_read_or_export_records(): void
    {
        $this->getJson('/api/registered-customers')->assertUnauthorized();
        $this->getJson('/api/registered-customers/export')->assertUnauthorized();
    }

    public function test_non_admin_users_are_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/registered-customers')->assertForbidden();
        $this->actingAs($user)->get('/api/registered-customers/export')->assertForbidden();
    }

    public function test_index_returns_laravel_pagination_metadata(): void
    {
        Registration::factory()->count(23)->create();

        $this->actingAs($this->admin)
            ->getJson('/api/registered-customers?per_page=10&page=3')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.current_page', 3)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 23)
            ->assertJsonPath('meta.from', 21)
            ->assertJsonPath('meta.to', 23)
            ->assertJsonMissingPath('data.0.proof_path');
    }

    public function test_search_date_range_and_status_combine_and_drive_pagination(): void
    {
        $branch = Branch::where('name', 'SM City Sucat')->value('id');

        Registration::factory()->count(12)->create(['branch_id' => $branch, 'created_at' => '2026-10-17 10:00:00']);
        Registration::factory()->count(5)->create(['branch_id' => $branch, 'created_at' => '2026-10-20 10:00:00']);
        Registration::factory()->create(['full_name' => 'Unique Person', 'created_at' => '2026-10-17 11:00:00']);
        Registration::factory()->create(['branch_id' => $branch, 'created_at' => '2026-10-17 12:00:00', 'validated_at' => now()]);

        $this->actingAs($this->admin)
            ->getJson('/api/registered-customers?search=sucat&date_from=2026-10-16&date_to=2026-10-18&per_page=10')
            ->assertOk()
            ->assertJsonPath('meta.total', 13)
            ->assertJsonPath('meta.last_page', 2);

        $this->actingAs($this->admin)
            ->getJson('/api/registered-customers?search=sucat&date_from=2026-10-16&date_to=2026-10-18&status=validated')
            ->assertJsonPath('meta.total', 1);

        $this->actingAs($this->admin)
            ->getJson('/api/registered-customers?search=unique%20person')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.full_name', 'Unique Person');
    }

    public function test_invalid_date_range_is_rejected(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/registered-customers?date_from=2026-10-20&date_to=2026-10-17')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date_to');
    }

    public function test_export_streams_csv_of_all_filtered_rows(): void
    {
        Registration::factory()->count(15)->create(['created_at' => '2026-10-17 10:00:00']);
        Registration::factory()->create(['full_name' => '=HYPERLINK("x")', 'created_at' => '2026-10-17 10:00:00']);
        Registration::factory()->count(4)->create(['created_at' => '2026-10-21 10:00:00']);

        $response = $this->actingAs($this->admin)
            ->get('/api/registered-customers/export?date_from=2026-10-17&date_to=2026-10-17')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $lines = array_values(array_filter(explode("\n", trim($response->streamedContent()))));

        $this->assertStringContainsString('Full Name', $lines[0]);
        $this->assertCount(17, $lines); // header + 16 matching rows across pages
        $this->assertStringContainsString("'=HYPERLINK", $response->streamedContent());
    }

    public function test_export_of_empty_result_contains_only_headers(): void
    {
        $response = $this->actingAs($this->admin)->get('/api/registered-customers/export?search=nobody')->assertOk();

        $this->assertCount(1, array_filter(explode("\n", trim($response->streamedContent()))));
    }

    public function test_admin_can_validate_and_unvalidate(): void
    {
        $registration = Registration::factory()->create();

        $this->actingAs($this->admin)
            ->patchJson("/api/registered-customers/{$registration->id}/validation", ['validated' => true])
            ->assertOk();
        $this->assertNotNull($registration->fresh()->validated_at);

        $this->actingAs($this->admin)
            ->patchJson("/api/registered-customers/{$registration->id}/validation", ['validated' => false])
            ->assertOk();
        $this->assertNull($registration->fresh()->validated_at);
    }

    public function test_admin_login_and_non_admin_rejection(): void
    {
        $headers = ['Origin' => 'http://localhost:3000', 'Referer' => 'http://localhost:3000/'];

        $this->postJson('/api/auth/login', ['email' => $this->admin->email, 'password' => 'password-for-tests'], $headers)
            ->assertOk()
            ->assertJsonPath('data.email', $this->admin->email);

        $this->postJson('/api/auth/logout', [], $headers)->assertOk();

        $user = User::factory()->create();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password-for-tests'], $headers)
            ->assertForbidden();

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong'], $headers)
            ->assertUnprocessable();
    }
}
