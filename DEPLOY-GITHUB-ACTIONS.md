# Auto-deploy to Bluehost with GitHub Actions

Every push to the `main` branch runs the backend tests, builds the site, uploads it to Bluehost over SSH, runs `php artisan migrate --force`, clears the caches and checks the live site answers. A failing test or build stops the deploy before anything is uploaded.

The workflow is `.github/workflows/deploy.yml`. Its repository folder is this project's root (the folder that contains `backend/` and `frontend/`).

## What it does and does not touch

- It uploads `backend/` (including a production `vendor/` and the freshly built website in `public/`) to `DEPLOY_PATH`.
- It **never** uploads or deletes: `.env`, `storage/` (logs, sessions, uploaded proofs), `bootstrap/cache/`, `tests/`, `*.sqlite`.
- Old built files in `public/assets/` are removed so the folder stays tidy. Nothing else on the server is deleted.
- Migrations only move forward. A revert of the code does not undo a migration.

## One-time setup

### 1. Put the project on GitHub (private repository)

On your PC, in PowerShell, from the project folder:

```
git init
git add .
git status
```
Check that `git status` does **not** list any `.env` file. The included `.gitignore` excludes them. Then:

```
git commit -m "WhiteHaus"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
git push -u origin main
```
Create the empty private repository on github.com first.

### 2. Make a deploy key (only for deploying)

Already have one working for another site (for example the Vismay website)? Skip steps 2 to 4 and reuse it: put the same `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`, `SSH_HOST`, `SSH_USERNAME` and `SSH_PORT` values in this repository's secrets. Secrets belong to one repository, so each repository needs its own copy.


```
ssh-keygen -t ed25519 -C "gx-deploy" -f $HOME\.ssh\gx_deploy
```
Press Enter twice to leave the passphrase empty (GitHub cannot type one). This makes two files: `gx_deploy` (private, never share) and `gx_deploy.pub` (public).

### 3. Allow that key on Bluehost

Open the cPanel **Terminal** (or SSH in) and run, pasting the one line from `gx_deploy.pub` between the quotes:

```
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA...your public key... gx-deploy" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```
Test it from your PC: `ssh -i $HOME\.ssh\gx_deploy YOUR_CPANEL_USER@YOUR_HOST "echo ok"` should print `ok` without asking for a password.

### 4. Get the server's fingerprint (so GitHub only talks to your real server)

On your PC:
```
ssh-keyscan -p 22 YOUR_HOST
```
Copy all the lines it prints (`YOUR_HOST ssh-ed25519 ...`, `... ssh-rsa ...`). Use the exact host you used in step 3.

### 5. Add the settings in GitHub

Repository, then **Settings → Secrets and variables → Actions**.

**Secrets** (tab "Secrets", button "New repository secret"):

| Name | Value |
|---|---|
| `SSH_HOST` | the host you SSH to (domain or server IP) |
| `SSH_USERNAME` | your cPanel username, e.g. `platioy0` (the name `SSH_USER` also works) |
| `SSH_PRIVATE_KEY` | the whole content of the private file `gx_deploy`, including the BEGIN and END lines |
| `SSH_KNOWN_HOSTS` | the lines from step 4 |

**Variables** (tab "Variables", button "New repository variable"):

| Name | Value |
|---|---|
| `DEPLOY_PATH` | `/home3/platioy0/whitehaus/backend` (the folder that contains `artisan`) |
| `SITE_URL` | `https://whitehaus.xtremewaycorp.com` |
| `SSH_PORT` | `22` (only if different; it may also be a secret, as in the Vismay workflow) |
| `PHP_BIN` | only if the default `php` on the server is older than 8.2, e.g. `/opt/cpanel/ea-php82/root/usr/bin/php` (check with `ls /opt/cpanel | grep php`) |

### 6. First run

Push any change to `main`, or open the **Actions** tab, choose **Test and deploy to Bluehost**, and click **Run workflow**. Green means the site is updated. Red shows which step failed, and its log says why.

Optional: **Settings → Environments → production → Required reviewers** adds a manual approval button before each deploy.

## Daily use

```
git add .
git commit -m "what changed"
git push
```
About 3 to 6 minutes later the live site is updated.

## If a deploy fails

| Step that failed | Usual cause |
|---|---|
| Backend tests | A test caught a bug. Read the log and fix it. Nothing was uploaded. |
| Build the frontend | A JavaScript error. Nothing was uploaded. |
| Upload files | Wrong `SSH_HOST` / `SSH_USER` / key, the key isn't in `authorized_keys`, or `SSH_KNOWN_HOSTS` doesn't match the host. |
| Migrate and clear caches | Wrong `DEPLOY_PATH`, wrong `PHP_BIN`, or a migration error. The message is in the log. |
| Check the live site | The site returns an error. Look at `storage/logs/laravel.log` on the server. |

To go back to the previous version: revert the commit (`git revert HEAD`) and push.

## Good to know

- First time only: `composer.lock` and `package-lock.json` don't exist yet. The workflow works without them but installs the newest compatible versions each time. Run `composer install` in `backend/` and `npm install` in `frontend/` once on your PC, then commit the two lock files so every build uses the same versions.
- The deploy key can log in to your hosting account. Keep the private key only in GitHub's secret store, and remove its line from `~/.ssh/authorized_keys` if you ever stop using it.
- `.env` lives only on the server. Change it there (File Manager or Terminal), then run `php artisan config:clear`.
