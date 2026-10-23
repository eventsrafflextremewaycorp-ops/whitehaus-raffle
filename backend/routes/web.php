<?php

use Illuminate\Support\Facades\Route;

/*
| The website is a React single-page app. In production its build (frontend `npm run build:laravel`)
| sits in public/ next to index.php, so Laravel serves the site AND the API from one domain: no CORS,
| and the Sanctum session cookie is first-party. Real files (assets/*, brand/*) are served by the web
| server directly; every other non-API URL (/register, /draw, ...) returns the SPA's index.html and
| React Router takes over in the browser.
*/
Route::get('/{any?}', function () {
    $index = public_path('index.html');

    if (! is_file($index)) {
        // No build yet (e.g. API-only development): show where the API lives.
        return response()->json([
            'app' => config('app.name'),
            'api' => url('/api'),
            'message' => 'The React frontend has not been built into public/. Run `npm run build:laravel` in /frontend, or `npm run dev` for development.',
        ]);
    }

    return response()->file($index, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-cache',
    ]);
})->where('any', '^(?!api(/|$)|sanctum(/|$)|up$).*$');
