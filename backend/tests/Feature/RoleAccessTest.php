<?php

namespace Tests\Feature;

use App\Models\CompanyReceipt;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** What each role may open: staff = view + draw, admin = + change records + manage staff, superadmin = + manage admins. */
class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_view_and_run_the_draw_but_not_change_records(): void
    {
        $staff = User::factory()->staffRole()->create();
        $reg = Registration::factory()->create(['validated_at' => now()]);
        $receipt = CompanyReceipt::create(['receipt_number' => 'OR-EXISTING']);   // must exist: a missing id would 404 before the permission check

        // view level + draw
        foreach (['/api/registered-customers', "/api/registered-customers/{$reg->id}/proof", '/api/company-receipts', '/api/draw', '/api/draw/tickets', '/api/draw/winners'] as $url) {
            $this->assertNotSame(403, $this->actingAs($staff)->getJson($url)->getStatusCode(), "staff should be allowed to GET $url");
        }
        $this->actingAs($staff)->postJson('/api/draw/spin')->assertCreated();
        $winnerId = \App\Models\Winner::value('id');
        $this->actingAs($staff)->getJson('/api/registered-customers/export')->assertOk();   // staff may download the CSV

        // changing records is refused
        $this->actingAs($staff)->patchJson("/api/registered-customers/{$reg->id}/validation", ['validated' => false])->assertForbidden();
        $this->actingAs($staff)->postJson('/api/company-receipts', ['receipt_number' => 'OR-1'])->assertForbidden();
        $this->actingAs($staff)->postJson('/api/company-receipts/import')->assertForbidden();
        $this->actingAs($staff)->deleteJson("/api/company-receipts/{$receipt->id}")->assertForbidden();
        $this->actingAs($staff)->deleteJson('/api/draw/winners/latest')->assertForbidden();
        $this->actingAs($staff)->postJson('/api/draw/winners/publish', ['published' => true])->assertForbidden();
        $this->actingAs($staff)->patchJson("/api/draw/winners/{$winnerId}/prize", ['prize_id' => null])->assertForbidden();
        $this->assertNotNull($reg->fresh()->validated_at);
    }

    public function test_admins_and_superadmins_can_change_records_and_download(): void
    {
        $reg = Registration::factory()->create(['validated_at' => now()]);

        foreach ([User::factory()->admin()->create(), User::factory()->superAdmin()->create()] as $user) {
            $this->actingAs($user)->getJson('/api/registered-customers/export')->assertOk();
            $this->actingAs($user)->postJson('/api/company-receipts', ['receipt_number' => 'OR-'.$user->id])->assertStatus(201);
        }
        $this->actingAs(User::factory()->admin()->create())->patchJson("/api/registered-customers/{$reg->id}/validation", ['validated' => false])->assertOk();
    }

    public function test_me_reports_the_role_and_abilities(): void
    {
        $this->actingAs(User::factory()->staffRole()->create())->getJson('/api/auth/me')
            ->assertOk()->assertJsonPath('data.role', 'staff')->assertJsonPath('data.can.manage_records', false)->assertJsonPath('data.can.manage_staff', false);
        $this->actingAs(User::factory()->admin()->create())->getJson('/api/auth/me')
            ->assertJsonPath('data.can.manage_staff', true)->assertJsonPath('data.can.manage_admins', false);
        $this->actingAs(User::factory()->superAdmin()->create())->getJson('/api/auth/me')
            ->assertJsonPath('data.can.manage_admins', true);
    }

    public function test_a_deactivated_account_loses_all_access_even_with_a_session(): void
    {
        $user = User::factory()->superAdmin()->create();
        $user->is_admin = false;
        $user->save();

        $this->actingAs($user)->getJson('/api/draw')->assertForbidden();
        $this->actingAs($user)->getJson('/api/staff')->assertForbidden();
    }
}
