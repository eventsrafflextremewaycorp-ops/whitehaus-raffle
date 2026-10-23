<?php

/*
|--------------------------------------------------------------------------
| WhiteHaus campaign configuration
|--------------------------------------------------------------------------
| Values verified against https://xtremewaycorp.com/whitehaus/ (Oct 2026).
| Update these when a new campaign week starts; the registration form and
| server-side validation both read from here.
*/

return [
    'name' => env('PROMO_NAME', 'Apple iPhone 18 Pro and Apple iPhone 18 Pro Max Weeks 2 to 10: WhiteHaus'),

    // Inclusive promo period (Asia/Manila calendar dates).
    'period_start' => env('PROMO_PERIOD_START', '2026-10-23'),
    'period_end' => env('PROMO_PERIOD_END', '2026-12-31'),

    'draw_at' => env('PROMO_DRAW_AT', '2027-01-04 15:00'),
    'draw_venue' => 'Xtremeway Corp. Head Office, in the presence of a DTI representative',

    'permit_no' => env('PROMO_PERMIT_NO', 'DTI Fair Trade Permit No. FTEB-270269 Series of 2026'),

    // Options offered on the original registration form ("Participating Unit").
    'units' => ['iPhone 18 Pro', 'iPhone 18 Pro Max'],

    // Proof of purchase: original form accepted JPEG/JPG/PNG up to 2 MB.
    'proof_max_kb' => 2048,

    // Raffle draw, same structure as the original draw app: draw numbers count DOWN
    // from `max_draw`; numbers 1..major_draws are Major Prizes, the rest Consolation Prizes.
    'draw' => [
        'max_draw' => (int) env('PROMO_MAX_DRAW', 23),
        'major_draws' => (int) env('PROMO_MAJOR_DRAWS', 3),
    ],

    // Registration e-mail (replaces the PHP mail() call in add_record()).
    'mail' => [
        'from_address' => env('MAIL_FROM_ADDRESS', 'admin@xtremewaycorp.com'),
        'from_name' => env('MAIL_FROM_NAME', 'WhiteHaus'),
        'subject' => env('PROMO_MAIL_SUBJECT', 'Apple iPhone 18 Pro and Pro Max - WhiteHaus registration'),
    ],

    // Whether registrations are accepted right now (set false after the period closes).
    'registration_open' => (bool) env('PROMO_REGISTRATION_OPEN', true),
];
