<?php

namespace Tests\Feature;

use App\Models\CompanyReceipt;
use App\Models\Registration;
use App\Models\User;
use Database\Seeders\BranchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CompanyReceiptTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BranchSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_receipt_endpoints_are_staff_only(): void
    {
        $this->getJson('/api/company-receipts')->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson('/api/company-receipts', ['receipt_number' => 'X1'])->assertForbidden();
    }

    public function test_adding_a_receipt_validates_the_matching_registration_once(): void
    {
        $a = Registration::factory()->create(['reference_number' => 'OR-1001']);

        $this->actingAs($this->admin)->postJson('/api/company-receipts', ['receipt_number' => ' or-1001 '])
            ->assertCreated()->assertJsonPath('matched', true)->assertJsonPath('data.status', 'taken');

        $a->refresh();
        $this->assertNotNull($a->validated_at);
        $this->assertSame('receipt', $a->validation_method);

        $this->actingAs($this->admin)->postJson('/api/company-receipts', ['receipt_number' => 'OR-1001'])
            ->assertUnprocessable();
    }

    public function test_csv_import_adds_matches_and_reports_duplicates(): void
    {
        $match = Registration::factory()->create(['reference_number' => 'OR-2002']);
        $other = Registration::factory()->create(['reference_number' => 'OR-9999']);

        $csv = "Receipt Number,Date\nOR-2002,2026-10-17\nOR-3003,2026-10-18\nOR-3003,\nor-2002,\n,\n";
        $file = UploadedFile::fake()->createWithContent('receipts.csv', $csv);

        $this->actingAs($this->admin)->post('/api/company-receipts/import', ['file' => $file], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.added', 2)
            ->assertJsonPath('data.duplicates', 2)
            ->assertJsonPath('data.invalid', 1) // the empty "," row
            ->assertJsonPath('data.matched', 1);

        $this->assertNotNull($match->fresh()->validated_at);
        $this->assertNull($other->fresh()->validated_at);
        $this->assertSame(1, CompanyReceipt::where('status', 'active')->count());
    }

    public function test_new_registration_is_validated_if_its_receipt_is_already_listed(): void
    {
        CompanyReceipt::create(['receipt_number' => 'GX-000777', 'status' => 'active']);
        $this->travelTo(now()->setDate(2026, 10, 25)->setTime(12, 0));
        \Illuminate\Support\Facades\Storage::fake('local');
        \Illuminate\Support\Facades\Mail::fake();

        $this->post('/api/registrations', [
            'full_name' => 'Ana Reyes', 'email' => 'ana@example.com', 'contact_number' => '09171234567',
            'address' => 'Quezon City', 'unit' => 'iPhone 18 Pro',
            'branch_id' => \App\Models\Branch::value('id'), 'purchase_date' => '2026-10-24',
            'reference_number' => 'gx-000777',
            'proof_of_purchase' => UploadedFile::fake()->image('r.jpg')->size(100),
            'privacy_consent' => '1', 'terms' => '1',
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->assertNotNull(Registration::first()->validated_at);
    }

    public function test_unvalidating_frees_the_receipt_and_taken_receipts_cannot_be_deleted(): void
    {
        $r = Registration::factory()->create(['reference_number' => 'OR-5']);
        $this->actingAs($this->admin)->postJson('/api/company-receipts', ['receipt_number' => 'OR-5']);
        $receipt = CompanyReceipt::first();

        $this->actingAs($this->admin)->deleteJson("/api/company-receipts/{$receipt->id}")->assertUnprocessable();

        $this->actingAs($this->admin)->patchJson("/api/registered-customers/{$r->id}/validation", ['validated' => false])->assertOk();
        $this->assertSame('active', $receipt->fresh()->status);
        $this->assertNull($r->fresh()->validated_at);

        $this->actingAs($this->admin)->deleteJson("/api/company-receipts/{$receipt->id}")->assertOk();
    }
}
