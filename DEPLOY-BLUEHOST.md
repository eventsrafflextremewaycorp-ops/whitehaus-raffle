# Deploying to Bluehost (shared hosting)

React is built to static files and Laravel serves them, so this works on shared hosting. Use one domain or subdomain, for example `whitehaus.yourdomain.com`.

## 1. Prepare on your computer

```
cd backend && composer install --no-dev --optimize-autoloader
cd ../frontend && npm install && npm run build:laravel
```
`backend/` now holds `vendor/` and the built site in `public/`. This is what you upload.

## 2. cPanel setup

1. **Domains → Subdomains** (or Addon Domain): create `whitehaus.yourdomain.com` and set its **document root to `whitehaus/backend/public`** (a folder in your home directory, outside `public_html`).
2. **MultiPHP Manager**: set that domain to PHP 8.2 or newer. Enable the extensions `mbstring`, `openssl`, `pdo_mysql`, `fileinfo`, `ctype`, `xml`, `curl`.
3. **MySQL Databases**: create a database, a user, and give the user all privileges.
4. **SSL**: enable AutoSSL for the domain.

## 3. Upload

Upload the whole `backend/` folder to `~/whitehaus/backend` (zip it, upload with File Manager, then Extract). Include `vendor/` and `public/`, but not `.env`.

## 4. Production `.env`

Create `~/whitehaus/backend/.env` (copy `.env.example`) with:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://whitehaus.yourdomain.com
DB_DATABASE=...   DB_USERNAME=...   DB_PASSWORD=...   (Bluehost prefixes these, e.g. cpuser_gx)
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=null
SANCTUM_STATEFUL_DOMAINS=whitehaus.yourdomain.com
MAIL_MAILER=smtp
MAIL_HOST=mail.yourdomain.com   (cPanel → Email Accounts → Connect Devices)
MAIL_PORT=587
MAIL_USERNAME=admin@yourdomain.com
MAIL_PASSWORD=...
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=admin@yourdomain.com
```
`SANCTUM_STATEFUL_DOMAINS` must be the exact host the browser uses, with no scheme. If you also serve `www.`, list both, comma separated. A wrong value makes staff login return 401/419.

## 5. Initialise (SSH, Bluehost Terminal, or Advanced → Terminal)

```
cd ~/whitehaus/backend
php artisan key:generate --force
php artisan migrate --force
php artisan db:seed --force
php artisan gx:create-admin you@yourdomain.com "Your Name"     # creates the first SUPERADMIN
php artisan config:cache && php artisan route:cache
chmod -R 775 storage bootstrap/cache
```
The seeder adds promo content (branches, prizes). Use a fresh, empty database for a first deploy. On an existing database, `migrate` applies only the new migrations (including `000007`). Never run `migrate:fresh` on data you want to keep.

## 6. Check

- `https://whitehaus.yourdomain.com/` shows the site.
- Refreshing `/prizes` works (SPA fallback).
- `https://whitehaus.yourdomain.com/api/prizes` returns JSON.
- `/draw` shows only the login form until you sign in.
- Register a test customer and confirm the email arrives (check `storage/logs/laravel.log` if not).

## Updating later

After uploading new backend files always run `php artisan migrate --force` (a new release may add a migration, e.g. the one that adds user roles; it keeps existing accounts and makes the oldest one superadmin), then `php artisan config:clear && php artisan route:clear`.

Rebuild the frontend (`npm run build:laravel`), then upload `backend/public` again. For backend changes, upload the changed files, run `php artisan migrate --force`, and re-run `php artisan config:cache`.

## No SSH?

Run `composer install` locally and upload `vendor/`. The artisan steps need a terminal. If you truly have none, import the tables by running `php artisan migrate --pretend` locally against an empty MySQL to get the SQL, then run it in phpMyAdmin. Insert the staff user with a bcrypt hash from `php -r "echo password_hash('YourPassword', PASSWORD_BCRYPT);"`. Also record the migrations in the `migrations` table, or a later `migrate` will try to recreate them.

## Troubleshooting

| Symptom | Cause |
|---|---|
| 500 error | `storage/` or `bootstrap/cache` not writable, or no `APP_KEY` |
| Login returns 419 / 401 | `SANCTUM_STATEFUL_DOMAINS` or `APP_URL` doesn't match the domain, or `SESSION_SECURE_COOKIE=true` on plain http |
| Site shows JSON about "frontend not built" | `public/index.html` wasn't uploaded |
| Refreshing a page gives 404 | The document root isn't `backend/public`, or `.htaccess` is missing |
| No registration email | Wrong `MAIL_*` values; check the log |
