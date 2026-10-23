<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Registration;
use Database\Seeders\BranchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use App\Mail\RegistrationReceived;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BranchSeeder::class);
        $this->travelTo(now()->setDate(2026, 10, 25)->setTime(12, 0));
        Storage::fake('local');
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'full_name' => 'Maria Santos',
            'email' => 'Maria@Example.com',
            'contact_number' => '0917 123 4567',
            'address' => '123 Sample St., Pasig City',
            'unit' => 'iPhone 18 Pro Max',
            'branch_id' => Branch::where('name', 'SM City Sucat')->value('id'),
            'purchase_date' => '2026-10-24',
            'reference_number' => 'gx-000123',
            'proof_of_purchase' => UploadedFile::fake()->image('receipt.jpg')->size(500),
            'privacy_consent' => '1',
            'terms' => '1',
        ], $overrides);
    }

    public function test_customer_can_register(): void
    {
        $this->post('/api/registrations', $this->payload(), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.reference_number', 'GX-000123');

        $registration = Registration::firstOrFail();
        $this->assertSame('maria@example.com', $registration->email);
        Storage::disk('local')->assertExists($registration->proof_path);
    }

    public function test_purchase_date_must_be_inside_promo_period(): void
    {
        $this->post('/api/registrations', $this->payload(['purchase_date' => '2026-10-22']), ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('purchase_date');
    }

    public function test_purchase_date_cannot_be_in_the_future(): void
    {
        $this->post('/api/registrations', $this->payload(['purchase_date' => '2026-10-26']), ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('purchase_date');
    }

    public function test_reference_number_is_unique(): void
    {
        $this->post('/api/registrations', $this->payload(), ['Accept' => 'application/json'])->assertCreated();

        $this->post('/api/registrations', $this->payload(['reference_number' => 'GX-000123']), ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reference_number');
    }

    public function test_required_fields_consents_and_file_type_are_validated(): void
    {
        $this->post('/api/registrations', [
            'proof_of_purchase' => UploadedFile::fake()->create('receipt.exe', 100, 'application/x-msdownload'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'full_name', 'email', 'contact_number', 'address', 'unit', 'branch_id',
                'purchase_date', 'reference_number', 'proof_of_purchase', 'privacy_consent', 'terms',
            ]);
    }

    public function test_proof_larger_than_two_megabytes_is_rejected(): void
    {
        $this->post('/api/registrations', $this->payload([
            'proof_of_purchase' => UploadedFile::fake()->image('big.png')->size(2049),
        ]), ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('proof_of_purchase');
    }

    public function test_registration_can_be_closed(): void
    {
        config(['promo.registration_open' => false]);

        $this->post('/api/registrations', $this->payload(), ['Accept' => 'application/json'])->assertForbidden();
        $this->assertDatabaseCount('registrations', 0);
    }

    public function test_pdf_proof_is_accepted(): void
    {
        $this->post('/api/registrations', $this->payload([
            'proof_of_purchase' => UploadedFile::fake()->create('receipt.pdf', 300, 'application/pdf'),
        ]), ['Accept' => 'application/json'])->assertCreated();
    }

    public function test_registration_issues_a_ticket_and_emails_it(): void
    {
        Mail::fake();

        $response = $this->post('/api/registrations', $this->payload(), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.email_sent', true);

        $ticket = $response->json('data.ticket_code');
        $this->assertMatchesRegularExpression('/^WH-[A-Z0-9]{20}$/', $ticket);

        Mail::assertSent(RegistrationReceived::class, function (RegistrationReceived $mail) use ($ticket) {
            return $mail->hasTo('maria@example.com')
                && $mail->registration->ticket_code === $ticket
                && str_contains($mail->render(), $ticket);
        });
    }

    public function test_a_failing_mail_server_does_not_break_registration(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        $this->post('/api/registrations', $this->payload(), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.email_sent', false);

        $this->assertDatabaseCount('registrations', 1);
    }
}
