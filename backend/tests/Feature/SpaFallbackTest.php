<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class SpaFallbackTest extends TestCase
{
    private string $index;

    private ?string $backup = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->index = public_path('index.html');
        $this->backup = is_file($this->index) ? File::get($this->index) : null;
    }

    protected function tearDown(): void
    {
        $this->backup === null ? File::delete($this->index) : File::put($this->index, $this->backup);
        parent::tearDown();
    }

    public function test_spa_routes_return_the_react_index_page(): void
    {
        File::put($this->index, '<!doctype html><div id="root"></div>');

        foreach (['/', '/register', '/draw/tickets', '/registered-customers/receipts'] as $url) {
            $response = $this->get($url)->assertOk();
            // index.html is sent as a file download-style response, so read the file itself.
            $this->assertStringContainsString('<div id="root">', file_get_contents($response->baseResponse->getFile()->getPathname()));
        }
    }

    public function test_api_paths_are_never_swallowed_by_the_spa_fallback(): void
    {
        File::put($this->index, '<!doctype html><div id="root"></div>');

        $this->getJson('/api/promotion')->assertOk()->assertJsonPath('data.period_start', '2026-10-23');
        $this->getJson('/api/does-not-exist')->assertNotFound()->assertDontSee('<div id="root">', false);
    }

    public function test_without_a_build_the_root_explains_what_to_do(): void
    {
        File::delete($this->index);

        $this->getJson('/')->assertOk()->assertJsonPath('api', url('/api'));
    }
}
