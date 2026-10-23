<?php

namespace Tests\Feature;

use App\Models\Prize;
use App\Models\Registration;
use App\Models\Winner;
use Database\Seeders\BranchSeeder;
use Database\Seeders\PrizeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BranchSeeder::class, PrizeSeeder::class]);
    }

    public function test_promotion_returns_verified_campaign_details(): void
    {
        $this->getJson('/api/promotion')
            ->assertOk()
            ->assertJsonPath('data.period_start', '2026-10-23')
            ->assertJsonPath('data.period_end', '2026-12-31')
            ->assertJsonPath('data.units', ['iPhone 18 Pro', 'iPhone 18 Pro Max']);
    }

    public function test_branches_lists_all_published_branches_plus_website(): void
    {
        $data = $this->getJson('/api/branches')->assertOk()->json('data');

        // Derived from the seeder so adding or removing a store never breaks this test.
        $stores = collect(BranchSeeder::BRANCHES)->flatten();

        $this->assertCount($stores->count() + 1, $data); // every store + the website
        $this->assertSame($stores->first(), $data[0]['name']);
        $this->assertSame('Website', end($data)['region']);
    }

    public function test_prizes_match_published_values(): void
    {
        $this->getJson('/api/prizes')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('data.0.name', 'MSI 274QF Monitor')
            ->assertJsonPath('data.0.value', 14995)
            ->assertJsonPath('data.2.quantity', 2)
            ->assertJsonPath('data.4.quantity', 6);

        // 1 + 1 + 2 + 1 + 6 winners in total.
        $this->assertSame(11, array_sum(array_column($this->getJson('/api/prizes')->json('data'), 'quantity')));
    }

    public function test_week_one_prizes_are_kept_but_hidden(): void
    {
        Prize::create(['name' => 'Nintendo Switch 2', 'value' => 31995, 'quantity' => 1, 'sort_order' => 9, 'is_active' => true]);
        $this->seed(PrizeSeeder::class);

        $this->assertFalse(Prize::where('name', 'Nintendo Switch 2')->value('is_active'));
        $this->getJson('/api/prizes')->assertOk()->assertJsonCount(5, 'data');
    }

    public function test_winners_are_empty_until_announced_and_never_expose_contact_details(): void
    {
        $this->getJson('/api/winners')->assertOk()->assertJsonCount(0, 'data');

        $registration = Registration::factory()->create(['full_name' => 'Juan Dela Cruz']);
        Winner::create([
            'registration_id' => $registration->id,
            'prize_id' => Prize::first()->id,
            'draw_number' => 2,
            'announced_at' => now()->subMinute(),
        ]);

        $response = $this->getJson('/api/winners')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Juan D. C.');

        $this->assertStringNotContainsString($registration->email, $response->getContent());
        $this->assertStringNotContainsString($registration->contact_number, $response->getContent());
    }
}
