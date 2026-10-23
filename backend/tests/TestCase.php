<?php

namespace Tests;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Requests from the React app's origin are "stateful" (session cookie + login). Tests pretend to be that origin.
        $this->withHeaders(['Origin' => 'http://localhost:3000', 'Referer' => 'http://localhost:3000/']);
    }

    /**
     * Stateful requests keep a session, and Sanctum's AuthenticateSession signs out a session whose stored password
     * hash belongs to another user. Tests switch between several users, so start every actingAs() with a clean session.
     */
    public function actingAs(Authenticatable $user, $guard = null)
    {
        $this->app['auth']->forgetGuards();
        $this->flushSession();

        return parent::actingAs($user, $guard);
    }
}
