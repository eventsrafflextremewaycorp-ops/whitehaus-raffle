<?php

namespace Tests\Feature;

use App\Models\Registration;
use App\Models\User;
use App\Models\Winner;
use App\Services\DrawService;
use Database\Seeders\BranchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DrawTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BranchSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    private function validated(int $count = 1): void
    {
        Registration::factory()->count($count)->create(['validated_at' => now()]);
    }

    public function test_every_draw_endpoint_requires_login_and_admin(): void
    {
        // Guests first: once actingAs() has been used, that user stays signed in for the rest of the test.
        foreach (['/api/draw', '/api/draw/tickets', '/api/draw/winners'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson('/api/draw/spin')->assertUnauthorized();

        foreach (['/api/draw', '/api/draw/tickets', '/api/draw/winners'] as $url) {
            $this->actingAs(User::factory()->create())->getJson($url)->assertForbidden();
        }
        $this->actingAs(User::factory()->create())->postJson('/api/draw/spin')->assertForbidden();
        $this->assertDatabaseCount('winners', 0);
    }

    public function test_category_mapping_matches_the_original_draw(): void
    {
        $this->assertSame('Consolation Prize (20)', DrawService::category(23));
        $this->assertSame('Consolation Prize (1)', DrawService::category(4));
        $this->assertSame('Major Prize (3)', DrawService::category(3));
        $this->assertSame('Major Prize (1)', DrawService::category(1));
        $this->assertSame('WhiteHaus Raffle Draw', DrawService::category(0));
    }

    public function test_draw_counts_down_from_the_maximum_and_finishes(): void
    {
        config(['promo.draw.max_draw' => 4, 'promo.draw.major_draws' => 3]);
        $this->validated(10);

        $this->actingAs($this->admin)->getJson('/api/draw')
            ->assertJsonPath('data.next_draw', 4)
            ->assertJsonPath('data.category', 'Consolation Prize (1)')
            ->assertJsonPath('data.eligible', 10);

        foreach ([4, 3, 2, 1] as $draw) {
            $this->actingAs($this->admin)->postJson('/api/draw/spin')
                ->assertCreated()
                ->assertJsonPath('data.winner.draw_number', $draw);
        }

        $this->actingAs($this->admin)->postJson('/api/draw/spin')->assertStatus(409);
        $this->actingAs($this->admin)->getJson('/api/draw')->assertJsonPath('data.finished', true);
        $this->assertSame(4, Winner::count());
        $this->assertSame(4, Winner::distinct('registration_id')->count('registration_id'));
    }

    public function test_only_validated_tickets_can_win_and_winners_are_excluded_by_default(): void
    {
        Registration::factory()->count(5)->create(); // not validated
        $this->actingAs($this->admin)->postJson('/api/draw/spin')->assertUnprocessable();

        $this->validated(2);
        $this->actingAs($this->admin)->postJson('/api/draw/spin')->assertCreated();
        $this->actingAs($this->admin)->postJson('/api/draw/spin')->assertCreated();
        // both validated tickets have won; nobody left.
        $this->actingAs($this->admin)->postJson('/api/draw/spin')->assertUnprocessable();

        // With "exclude winners" off, previous winners are in the pool again.
        $this->actingAs($this->admin)->postJson('/api/draw/spin', ['include_winners' => true])->assertCreated();
        $this->assertSame(3, Winner::count());
    }

    public function test_undo_only_removes_the_latest_draw_and_not_after_publishing(): void
    {
        $this->validated(3);
        $this->actingAs($this->admin)->postJson('/api/draw/spin');
        $this->actingAs($this->admin)->postJson('/api/draw/spin');

        $this->actingAs($this->admin)->deleteJson('/api/draw/winners/latest')->assertOk();
        $this->assertSame(1, Winner::count());
        $this->assertSame(DrawService::maxDraw(), Winner::value('draw_number'));

        $this->actingAs($this->admin)->postJson('/api/draw/winners/publish', ['published' => true])->assertOk();
        $this->actingAs($this->admin)->deleteJson('/api/draw/winners/latest')->assertUnprocessable();
    }

    public function test_published_winners_show_on_the_public_page_masked_with_their_category(): void
    {
        $this->validated(1);
        Registration::query()->update(['full_name' => 'Juan Dela Cruz']);

        $this->actingAs($this->admin)->postJson('/api/draw/spin');
        $this->getJson('/api/winners')->assertJsonCount(0, 'data');

        $this->actingAs($this->admin)->postJson('/api/draw/winners/publish', ['published' => true]);

        $response = $this->getJson('/api/winners')->assertOk()
            ->assertJsonPath('data.0.name', 'Juan D. C.')
            ->assertJsonPath('data.0.prize', 'Consolation Prize (20)');
        $this->assertStringNotContainsString('@', $response->getContent());
    }

    public function test_a_won_registration_cannot_be_unvalidated(): void
    {
        $this->validated(1);
        $this->actingAs($this->admin)->postJson('/api/draw/spin');
        $registration = Registration::first();

        $this->actingAs($this->admin)
            ->patchJson("/api/registered-customers/{$registration->id}/validation", ['validated' => false])
            ->assertUnprocessable();
    }

    public function test_tickets_list_shows_entry_status(): void
    {
        $this->validated(2);
        Registration::factory()->create();

        $this->actingAs($this->admin)->getJson('/api/draw/tickets?entry=eligible')->assertJsonPath('meta.total', 2);
        $this->actingAs($this->admin)->getJson('/api/draw/tickets?entry=pending')->assertJsonPath('meta.total', 1);
    }
}
