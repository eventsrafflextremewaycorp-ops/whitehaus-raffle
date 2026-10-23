<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyReceiptController;
use App\Http\Controllers\Api\DrawController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\PublicContentController;
use App\Http\Controllers\Api\RegisteredCustomerController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\SiteImageController;
use App\Http\Controllers\Api\StaffController;
use Illuminate\Support\Facades\Route;

/*
| API contract (all JSON, prefix /api)
|--------------------------------------------------------------------------
| Public
|   GET    /promotion                     campaign config (dates, units, permit)
|   GET    /branches                      participating branches
|   GET    /prizes                        raffle prizes
|   GET    /winners                       announced winners (masked names)
|   POST   /registrations                 customer registration (multipart)
|   POST   /auth/login                    admin sign-in (Sanctum SPA cookie)
|   POST   /auth/forgot-password          {email}  e-mails a reset link (active accounts only, same reply either way)
|   POST   /auth/reset-password           {token,email,password,password_confirmation}
|   POST   /account/password              signed in: {current_password,password,password_confirmation}
|
| Signed in (auth:sanctum). Roles: superadmin > admin > staff
|   view level (staff, admin, superadmin): can:manage-registrations
|   records (admin, superadmin): can:manage-records   staff accounts: can:manage-staff
|   GET    /auth/me
|   POST   /auth/logout
|   GET    /registered-customers          ?search&date_from&date_to&status&page&per_page
|   GET    /registered-customers/export   same filters, CSV download
|   GET    /registered-customers/{id}/proof
|   PATCH  /registered-customers/{id}/validation   {validated: bool}
|   GET|POST /company-receipts            list (?search&status) / add one
|   POST    /company-receipts/import      CSV import + automatic validation
|   DELETE  /company-receipts/{id}
|   GET     /draw                         state: next draw number, category, eligible tickets
|   POST    /draw/spin                    server-side random pick, saved atomically
|   GET     /draw/tickets  /draw/winners
|   DELETE  /draw/winners/latest          undo the most recent draw (unpublished only)
|   POST    /draw/winners/publish         {published: bool} show/hide winners on the public page
|   PATCH   /draw/winners/{id}/prize      {prize_id}
|   POST|DELETE /site/banner            home banner image (records level: admin, superadmin)
|   POST|DELETE /site/banner-mobile     optional phone-sized banner
|   POST|DELETE /prizes/{id}/image       prize photo (records level)
|   GET|POST /staff                      list staff / add one {name,email,password}
|   PATCH   /staff/{id}                  {name,email}
|   POST    /staff/{id}/password         {password}  (ends that person's other sessions)
|   PATCH   /staff/{id}/active           {active: bool}  (cannot deactivate yourself)
*/

Route::get('/promotion', [PublicContentController::class, 'promotion']);
Route::get('/branches', [PublicContentController::class, 'branches']);
Route::get('/prizes', [PublicContentController::class, 'prizes']);
Route::get('/winners', [PublicContentController::class, 'winners']);

Route::post('/registrations', [RegistrationController::class, 'store'])->middleware('throttle:registrations');

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/auth/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:password-reset');
Route::post('/auth/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:password-reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Every active account: change your own password.
    Route::post('/account/password', [PasswordController::class, 'change'])
        ->middleware(['can:manage-registrations', 'throttle:password-reset']);

    // View level: every active account (staff, admin, superadmin), including the CSV download. Staff can also run the draw.
    Route::middleware('can:manage-registrations')->group(function () {
        Route::get('/registered-customers', [RegisteredCustomerController::class, 'index']);
        Route::get('/registered-customers/export', [RegisteredCustomerController::class, 'export']);
        Route::get('/registered-customers/{registration}/proof', [RegisteredCustomerController::class, 'proof'])->whereNumber('registration');
        Route::get('/company-receipts', [CompanyReceiptController::class, 'index']);

        Route::get('/draw', [DrawController::class, 'state']);
        Route::post('/draw/spin', [DrawController::class, 'spin'])->middleware('throttle:30,1');
        Route::get('/draw/tickets', [DrawController::class, 'tickets']);
        Route::get('/draw/winners', [DrawController::class, 'winners']);
    });

    // Changing records: admin and superadmin only.
    Route::middleware('can:manage-records')->group(function () {
        Route::patch('/registered-customers/{registration}/validation', [RegisteredCustomerController::class, 'updateValidation'])->whereNumber('registration');

        Route::post('/company-receipts', [CompanyReceiptController::class, 'store']);
        Route::post('/company-receipts/import', [CompanyReceiptController::class, 'import']);
        Route::delete('/company-receipts/{receipt}', [CompanyReceiptController::class, 'destroy'])->whereNumber('receipt');

        // Home banner and prize photos (JPG/PNG/WebP, 5 MB).
        Route::post('/site/banner', [SiteImageController::class, 'setBanner'])->middleware('throttle:30,1');
        Route::delete('/site/banner', [SiteImageController::class, 'clearBanner']);
        Route::post('/site/banner-mobile', [SiteImageController::class, 'setMobileBanner'])->middleware('throttle:30,1');
        Route::delete('/site/banner-mobile', [SiteImageController::class, 'clearMobileBanner']);
        Route::post('/prizes/{prize}/image', [SiteImageController::class, 'setPrizeImage'])->whereNumber('prize')->middleware('throttle:30,1');
        Route::delete('/prizes/{prize}/image', [SiteImageController::class, 'clearPrizeImage'])->whereNumber('prize');

        Route::delete('/draw/winners/latest', [DrawController::class, 'undoLast']);
        Route::post('/draw/winners/publish', [DrawController::class, 'publish']);
        Route::patch('/draw/winners/{winner}/prize', [DrawController::class, 'assignPrize'])->whereNumber('winner');
    });

    // Staff accounts: admin and superadmin (the controller limits admins to `staff` accounts).
    Route::middleware(['can:manage-staff', 'throttle:60,1'])->prefix('staff')->group(function () {
        Route::get('/', [StaffController::class, 'index']);
        Route::post('/', [StaffController::class, 'store']);
        Route::patch('/{user}', [StaffController::class, 'update'])->whereNumber('user');
        Route::post('/{user}/password', [StaffController::class, 'resetPassword'])->whereNumber('user');
        Route::patch('/{user}/active', [StaffController::class, 'setActive'])->whereNumber('user');
    });
});
