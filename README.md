# WhiteHaus: React + Laravel

A React single-page app (Vite, React Router, Tailwind 4, Lucide) in front of a Laravel 12 API (Sanctum cookie auth).
In production the built React app is served by Laravel from `backend/public`, so one domain serves both the site and the API (same origin, no CORS). This runs on Bluehost **shared hosting** (PHP only). See `DEPLOY-BLUEHOST.md`.

```
whitehaus-react/
  backend/    Laravel 12 API + SPA fallback route
  frontend/   React 19 + Vite 7 + Tailwind 4
  docs/       screenshots
  DEPLOY-BLUEHOST.md
```

## Local development

Requirements: PHP 8.2+, Composer, Node 20.19+, MySQL/MariaDB.

Backend
```
cd backend
composer install
cp .env.example .env            # set DB_* values
php artisan key:generate
php artisan migrate --seed
php artisan gx:create-admin you@example.com "Your Name"   # prompts for a password; or set ADMIN_EMAIL / ADMIN_PASSWORD in .env and run db:seed
php artisan serve               # http://localhost:8000
```

Frontend
```
cd frontend
npm install
npm run dev                     # http://localhost:5173
```
Vite proxies `/api` and `/sanctum` to Laravel (`VITE_DEV_API`, default `http://localhost:8000`), so dev is also same origin.
`.env.example` already lists `localhost:5173` in `SANCTUM_STATEFUL_DOMAINS`.

## Production build (same origin)

```
cd frontend
npm install
npm run build:laravel
```
This runs `vite build` and copies `dist/*` into `backend/public` without overwriting `index.php`, `.htaccess`, `robots.txt` or `favicon.ico`.
`routes/web.php` returns `public/index.html` for every non-file URL except `api/*`, `sanctum/*` and `up`, so deep links and refreshes work.

## Routes

| Path | Access | Page |
|---|---|---|
| `/` | public | Home |
| `/promo-mechanics`, `/participating-branches`, `/prizes`, `/winners`, `/privacy` | public | Content pages |
| `/register` | public | Registration (ticket code + confirmation email) |
| `/login` | public | Staff sign-in (the **Login** button in the header) |
| `/registered-customers` | staff login | Registrations, validation, CSV export |
| `/registered-customers/receipts` | staff login | Company receipts (add / import / delete) |
| `/draw` | staff login | Draw board |
| `/draw/tickets`, `/draw/winners` | staff login | Tickets list, winners admin |
| `/account` | staff login | My account: your details and change your own password (header menu → My account) |
| `/forgot-password`, `/reset-password` | public | Request and use an emailed password-reset link |
| `/staff` | admin / superadmin | Staff accounts: add, edit, reset password, deactivate / reactivate, roles |

Visitors see only the public links plus **Login** and **Register**. **Registered Customers** and **Draw** appear in the header only after signing in, together with an account menu (your initials) holding My account, Staff accounts (admins), the theme choice and Sign out. The Register button is hidden on staff pages and the login page.
Staff pages show only a login form until you sign in. Several browsers or sessions can be logged in at the same time (database sessions).

## API

Public: `GET /api/promotion`, `/branches`, `/prizes`, `/winners`; `POST /api/registrations`.
Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
Staff accounts (admin, superadmin): `GET|POST /api/staff`, `PATCH /api/staff/{id}`, `POST /api/staff/{id}/password`, `PATCH /api/staff/{id}/active`.
Staff: `/api/registered-customers` (list, export, validation, proof), `/api/company-receipts` (list, add, import, delete), `/api/draw` (state, spin, tickets, winners, undo, publish, assign prize).
Mutating requests need the Sanctum CSRF flow (`/sanctum/csrf-cookie`, then `X-XSRF-TOKEN`), which `frontend/src/lib/api.js` handles.

## Colours and theme

Visitors choose **Light**, **Dark** or **Match my device** from the sun/moon icon in the header (also in the mobile menu). The choice is kept in the browser (`gx-theme`); "Match my device" follows the phone or computer setting and changes live. `index.html` applies it before the first paint, so there is no flash.

All colours are defined once at the top of `frontend/src/index.css`: the light values in `@theme`, the dark values under `html[data-theme="dark"]`. Page background `ink-950`, cards `ink-900`, borders `ink-700`, text `ink-100` to `ink-400`, headings `heading`, accent `brand-*`. Change those to re-theme the site. Put the two logo files in `frontend/public/brand/`: `whitehaus_black.png` (for the white/light theme) and `whitehaus_white.png` (for the dark theme). The header switches between them with the theme; these are the full wordmark with the tagline. If one is missing, the plain text name is shown.

## Deploying

- By hand: `DEPLOY-BLUEHOST.md`.
- Automatically on every `git push`: `DEPLOY-GITHUB-ACTIONS.md` (tests, build, upload over SSH, migrate, cache clear).

## Home banner and prize photos (managed on the site)

Admins and superadmins (not staff) change these images from the public pages while signed in:

- **Home banner:** on the home page, use **Upload banner / Change banner / Remove** on the banner. Recommended 2400 x 800 px (3:1) for computers and tablets. Below it there is a second, optional upload for **phones** (for example 1080 x 1350 px, 4:5); without it, phones show the main banner in full, uncropped. Routes: `POST|DELETE /api/site/banner` and `/api/site/banner-mobile`.
- **Prize photos:** on the Prizes page (and the prize list on the home page), use **Upload image / Change image / Remove** on each prize.

JPG, PNG or WebP up to 5 MB (no SVG). Files are saved in `backend/public/uploads/` on the server, so they survive redeploys (the GitHub deploy never deletes that folder) and are not in Git. Visitors and staff accounts see the images but no buttons, and the API refuses their uploads. Until a banner is uploaded a plain placeholder is shown (a `public/brand/banner.jpg` file, if you ship one, is used as the fallback). New backend files: `SiteImageController`, `SiteImages`, routes `POST|DELETE /api/site/banner` and `POST|DELETE /api/prizes/{id}/image`. No migration is needed. If you move the site to another server, copy the `public/uploads` folder too.

## Roles and staff accounts

| | Staff | Admin | Superadmin |
|---|---|---|---|
| View registered customers, proofs, receipts, tickets, winners | yes | yes | yes |
| Download the registered-customers CSV | yes | yes | yes |
| Run the draw (spin) | yes | yes | yes |
| Validate / unvalidate registrations | no | yes | yes |
| Add, import, remove company receipts | no | yes | yes |
| Undo the last draw, publish winners, assign prizes | no | yes | yes |
| Add, edit, reset password, deactivate **staff** accounts | no | yes | yes |
| Add or manage **admins** and **superadmins**, change roles | no | no | yes |

Signed-in admins and the superadmin open **Staff accounts** (`/staff`) to add people (name, email, password of 12+ characters with a Generate button), edit them, reset passwords, and deactivate or reactivate accounts. Only the superadmin sees the role selector. Admins can only create and manage `staff` accounts.
Nobody can change their own role or deactivate themselves, so a superadmin always remains. Deactivating blocks sign-in and ends that person's open sessions. Accounts are never deleted, so login history is kept. The API enforces all of this; hidden buttons are only a convenience.

Existing databases: migration `000008` adds `users.role`. The oldest active account becomes the superadmin and other active accounts become admins. Change them on the Staff accounts screen.
The first superadmin is created with `php artisan gx:create-admin you@example.com "Your Name"` (default `--role=superadmin`; `--role=admin` and `--role=staff` also work).

## Passwords (every role)

Passwords are stored as one-way bcrypt hashes, so nobody can read them, not even the superadmin. They can only be changed or reset.

- **My account** (`/account`, in the account menu at the top right for every role): change your own password. It asks for your current password, and other browsers are signed out.
- **Forgot your password?** (link on the sign-in form, `/forgot-password`): enter your email and an active account gets a reset link. The reply is the same for unknown emails, so the form can't be used to discover accounts. The link opens `/reset-password`, works once, and expires after 60 minutes. Every browser that account was signed in on is signed out.
- **Staff accounts** (admin / superadmin): reset someone else's password directly.

Reset emails need working `MAIL_*` settings, and `APP_URL` must be the public address (e.g. `https://whitehaus.xtremewaycorp.com`), because the link in the email is built from it.

## Campaign content (Weeks 2 to 10)

Content comes from the Marketing document "Promo Mechanics, Apple iPhone 18 Pro and Pro Max, Weeks 2 to 10" (shared with GameXtreme), laid out like the WhiteHaus promo pages on xtremewaycorp.com/whitehaus: purchases from **October 23 to December 31, 2026**, freebies worth up to **Php 2,995**, raffle on **January 4, 2027 at 3:00 PM**, five prizes for 11 winners (MSI 274QF Monitor x1, Shokz E320-ST-BK Earbuds OpenDots 2 x1, Airpods 4 ANC x2, Shokz OpenRun Air 2 Headset x1, Razer Kishi V3 x6).

- Wording and dates: `frontend/src/lib/content/promo.js` (legal copy, kept as published) and `backend/config/promo.php`.
- Stores: the 13 WhiteHaus stores in `backend/database/seeders/BranchSeeder.php`, plus a "WhiteHaus Website" option for online orders.
- Raffle tickets are numbered `WH-...` (GameXtreme uses `GX-...`).
- **Logos:** `frontend/public/brand/whitehaus_black.png` (light theme) and `whitehaus_white.png` (dark theme) are in place. If one is missing the plain text name is shown.
- **Not known yet, please confirm:** the WhiteHaus website address (the footer links to xtremewaycorp.com/whitehaus for now), the sender mailbox (`MAIL_FROM_ADDRESS`, default `admin@xtremewaycorp.com`) and the brand colours (this copy uses the same red accent and layout as GameXtreme; change the `brand-*` values in `frontend/src/index.css` to re-colour it).

## This is a separate site

WhiteHaus runs on its own: its own subdomain (for example `whitehaus.xtremewaycorp.com`), its own database, its own `.env` and `APP_KEY`, its own staff accounts, registrations and draw. Follow `DEPLOY-BLUEHOST.md` again for the new subdomain, using a new database and the server folder `~/whitehaus/backend`. Do not point it at the GameXtreme database.

## Draw rules (unchanged)

Prizes are drawn 23 → 4 as consolation, then 3 → 1 as major. The winner is chosen on the server (`random_int`, locked transaction, unique `draw_number`), and the browser only animates it. The "Exclude winners" toggle is kept, and the last draw can be undone.

## Tests

Backend: `php artisan test` (DrawTest, CompanyReceiptTest, ConcurrentSessionTest, RegistrationTest, SpaFallbackTest, StaffManagementTest, RoleAccessTest, PasswordSelfServiceTest, ...).
Frontend: `npm run lint`.

## What was and was not verified

Verified in the build environment: PHP syntax (`php -l`), JS syntax, and every route (light and dark, guest and signed-in) rendered in headless Chromium at desktop and mobile widths against a mocked API (no horizontal scroll, no runtime errors, Register-button rule, login gating, navigation).

**Not run here** (no network access to the registries, no database): `npm install`, `vite build`, `composer install`, `php artisan test`, and SQL against real MySQL. The routing tests used a stand-in for `react-router-dom`, not the real package. Run the commands above on your machine first and report any error.

## Notes

- Existing databases: run `php artisan migrate`. Migration `000007` upgrades older `winners` tables (the `draw_number` fix).
- Change `ADMIN_*` passwords and any credentials that were in your older project. Do not reuse them.
- Not ported: nothing from the earlier Laravel feature set was dropped.
