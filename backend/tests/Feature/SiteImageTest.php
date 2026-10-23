<?php

namespace Tests\Feature;

use App\Models\Prize;
use App\Models\User;
use App\Support\SiteImages;
use Database\Seeders\PrizeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/** Home banner and prize photos: admins and superadmins only, images only. */
class SiteImageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PrizeSeeder::class);
        $this->cleanUploads();
    }

    protected function tearDown(): void
    {
        $this->cleanUploads();
        parent::tearDown();
    }

    private function cleanUploads(): void
    {
        foreach (glob(SiteImages::dir().'/banner*-*.*') ?: [] as $f) {
            @unlink($f);
        }
        File::deleteDirectory(SiteImages::dir('prizes'));
    }

    public function test_admin_can_add_and_remove_a_separate_mobile_banner(): void
    {
        $admin = User::factory()->admin()->create();
        $this->assertNull($this->getJson('/api/promotion')->json('data.banner_mobile_url'));

        $desktop = $this->actingAs($admin)->postJson('/api/site/banner', ['image' => UploadedFile::fake()->image('wide.jpg', 2400, 800)])->json('data.banner_url');
        $mobile = $this->actingAs($admin)->postJson('/api/site/banner-mobile', ['image' => UploadedFile::fake()->image('phone.jpg', 1080, 1350)])
            ->assertOk()->json('data.banner_mobile_url');

        $this->assertStringContainsString('/uploads/bannermobile-', $mobile);
        $this->assertSame($desktop, $this->getJson('/api/promotion')->json('data.banner_url'), 'the main banner is untouched');
        $this->assertSame($mobile, $this->getJson('/api/promotion')->json('data.banner_mobile_url'));

        $this->actingAs($admin)->deleteJson('/api/site/banner-mobile')->assertOk();
        $this->assertNull($this->getJson('/api/promotion')->json('data.banner_mobile_url'));
        $this->assertSame($desktop, $this->getJson('/api/promotion')->json('data.banner_url'));

        $staff = User::factory()->staffRole()->create();
        $this->actingAs($staff)->postJson('/api/site/banner-mobile', ['image' => UploadedFile::fake()->image('x.jpg')])->assertForbidden();
    }

    public function test_admin_can_upload_replace_and_remove_the_banner(): void
    {
        $admin = User::factory()->admin()->create();

        $this->assertNull($this->getJson('/api/promotion')->json('data.banner_url'));

        $first = $this->actingAs($admin)
            ->postJson('/api/site/banner', ['image' => UploadedFile::fake()->image('one.jpg', 2400, 800)])
            ->assertOk()->json('data.banner_url');
        $this->assertStringContainsString('/uploads/banner-', $first);
        $this->assertSame($first, $this->getJson('/api/promotion')->json('data.banner_url'));

        $second = $this->actingAs($admin)
            ->postJson('/api/site/banner', ['image' => UploadedFile::fake()->image('two.png', 2400, 800)])
            ->assertOk()->json('data.banner_url');
        $this->assertNotSame($first, $second);
        $this->assertCount(1, glob(SiteImages::dir().'/banner-*.*'), 'only the newest banner is kept');

        $this->actingAs($admin)->deleteJson('/api/site/banner')->assertOk();
        $this->assertNull($this->getJson('/api/promotion')->json('data.banner_url'));
    }

    public function test_superadmin_can_set_a_prize_photo_and_it_shows_on_the_public_list(): void
    {
        $super = User::factory()->superAdmin()->create();
        $prize = Prize::where('is_active', true)->orderBy('sort_order')->first();

        $this->actingAs($super)
            ->postJson("/api/prizes/{$prize->id}/image", ['image' => UploadedFile::fake()->image('p.webp', 800, 600)])
            ->assertOk()
            ->assertJsonPath('data.id', $prize->id);

        $url = $this->getJson('/api/prizes')->json('data.0.image_url');
        $this->assertStringContainsString('/uploads/prizes/prize-'.$prize->id.'-', $url);
        $this->assertFileExists(public_path($prize->fresh()->image_path));

        $old = $prize->fresh()->image_path;
        $this->actingAs($super)->postJson("/api/prizes/{$prize->id}/image", ['image' => UploadedFile::fake()->image('q.jpg', 800, 600)])->assertOk();
        $this->assertFileDoesNotExist(public_path($old), 'the replaced photo is deleted');

        $this->actingAs($super)->deleteJson("/api/prizes/{$prize->id}/image")->assertOk()->assertJsonPath('data.image_url', null);
        $this->assertNull($prize->fresh()->image_path);
    }

    public function test_staff_and_visitors_cannot_upload(): void
    {
        $staff = User::factory()->staffRole()->create();
        $prize = Prize::first();
        $img = fn () => UploadedFile::fake()->image('x.jpg');

        $this->postJson('/api/site/banner', ['image' => $img()])->assertUnauthorized();
        $this->actingAs($staff)->postJson('/api/site/banner', ['image' => $img()])->assertForbidden();
        $this->actingAs($staff)->deleteJson('/api/site/banner')->assertForbidden();
        $this->actingAs($staff)->postJson("/api/prizes/{$prize->id}/image", ['image' => $img()])->assertForbidden();
        $this->actingAs($staff)->deleteJson("/api/prizes/{$prize->id}/image")->assertForbidden();
        $this->assertNull($this->getJson('/api/promotion')->json('data.banner_url'));
    }

    public function test_only_jpg_png_and_webp_images_are_accepted(): void
    {
        $admin = User::factory()->admin()->create();

        foreach ([UploadedFile::fake()->create('evil.php', 10, 'application/x-php'), UploadedFile::fake()->create('doc.pdf', 10, 'application/pdf'), UploadedFile::fake()->createWithContent('v.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')] as $bad) {
            $this->actingAs($admin)->postJson('/api/site/banner', ['image' => $bad])->assertUnprocessable()->assertJsonValidationErrors('image');
        }

        $this->actingAs($admin)->postJson('/api/site/banner', ['image' => UploadedFile::fake()->image('big.jpg')->size(6000)])->assertUnprocessable();
        $this->actingAs($admin)->postJson('/api/site/banner', [])->assertUnprocessable();
        $this->assertSame([], glob(SiteImages::dir().'/banner-*.*') ?: []);
    }
}
