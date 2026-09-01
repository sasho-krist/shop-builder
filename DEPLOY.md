# Deploying to shared hosting (cPanel / bulinfo.net)

This app deploys as a **normal PHP/Laravel application**. It is **not** a Node.js
app — do not use cPanel's "Setup Node.js App". Node is only used on your own
machine, once, to build the frontend.

What the server needs:

- PHP **8.3** (cPanel → _Select PHP Version_) with `pdo_mysql`, `mbstring`,
  `openssl`, `bcmath`, `curl`, `fileinfo`, `gd` (or `imagick`), `zip`, `intl`
- A MySQL database
- Composer (usually present in the shell; see step 4 if not)
- SSH / Terminal access (jailshell is fine)

---

## The one architectural caveat: a hostname per store

The storefront resolves the store from the request host
(`{slug}.<central-domain>` or a connected custom domain). So:

1. The central host must be a **dedicated (sub)domain** — not one that already
   serves another site. On this account `sasho-dev.com` is taken, so use e.g.
   **`shop.sasho-dev.com`** as the central host.
2. Every store then needs its own hostname with a valid certificate:
    - **Best:** wildcard DNS `*.shop.sasho-dev.com` + wildcard TLS → new stores
      work instantly.
    - **Shared hosting without wildcard TLS:** create each store's subdomain
      explicitly in cPanel (step 10). AutoSSL issues its cert per host. Fine for
      a handful of demo stores; not a hands-off SaaS.

With central host `shop.sasho-dev.com`, a store with slug `aura` is served at
`aura.shop.sasho-dev.com`, and `SESSION_DOMAIN=.shop.sasho-dev.com`.

---

## 1. Build the frontend (on your PC)

```bash
npm ci
npm run build            # → public/build/  (manifest.json + assets)
```

`public/build/` **must** reach the server. Either commit it for this deploy, or
upload it separately — the app 500s without `public/build/manifest.json`.

Optionally also vendor the PHP deps locally to skip Composer on the server:

```bash
composer install --no-dev --optimize-autoloader
```

## 2. Get the code onto the server

**Recommended: clone from GitHub over SSH.** Put it **outside** `public_html`,
e.g. `~/shop-builder` (`/storage/sashodeo/shop-builder`):

```bash
cd ~
git --version                     # confirm git is available
git clone https://github.com/sasho-krist/shop-builder.git
cd shop-builder
```

(Public repo → no auth. A private repo needs a deploy key or a PAT in the URL.)

Two things are **gitignored** and must arrive another way:

- **`vendor/`** → step 4 (`composer install` on the server), or upload your local
  `vendor/` folder.
- **`public/build/`** → cannot be built on the server (no Node). Zip **only**
  `public/build/` on your PC and extract it into `~/shop-builder/public/build/`.
  (`resources/js/actions`, `resources/js/routes`, `resources/js/wayfinder` are
  also gitignored but are build-time only — not needed at runtime.)

Do **not** zip the whole project — `node_modules/` alone is hundreds of MB.

For repeat deploys, a simple option is a `deploy` branch that force-adds
`public/build/` (`git add -f public/build && git commit`), so `git pull` on the
server ships the assets too.

Alternatively, upload one zip of the whole project **with** `vendor/` and
`public/build/` but **without** `node_modules/` and `.git/`, and extract via the
File Manager.

## 3. Pick the right PHP binary

In the shell:

```bash
php -v
```

If it is not 8.3, use the EA path explicitly (and set the domain's MultiPHP to
8.3 in cPanel):

```bash
alias php='/opt/cpanel/ea-php83/root/usr/bin/php'
```

Use that `php` for every `artisan`/`composer` command below.

## 4. Composer

This account already has `~/composer.phar`:

```bash
cd ~/shop-builder
php ~/composer.phar install --no-dev --optimize-autoloader
```

(If `composer` is also on `PATH`, `composer install --no-dev -o` works too.)

## 5. Create the database

cPanel → **MySQL Databases**: create a database (e.g. `sashodeo_shop`) and a user
with a strong password, then **add the user to the database with ALL PRIVILEGES**.
Note the full names (cPanel prefixes them, e.g. `sashodeo_shop`).

## 6. Configure `.env`

```bash
cp .env.production.example .env
php artisan key:generate
```

Then edit `.env` and set at least:

- `APP_URL=https://shop.sasho-dev.com`
- `APP_CENTRAL_DOMAIN=shop.sasho-dev.com`
- `SESSION_DOMAIN=.shop.sasho-dev.com` (leading dot)
- `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` from step 5
- `MAIL_*` — a cPanel email account

Leave the Stripe keys blank unless you have them — checkout falls back to
pay-on-delivery.

## 7. Migrate, link storage, cache config

```bash
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

find storage bootstrap/cache -type d -exec chmod 775 {} \;
```

Do **not** run `php artisan db:seed` on a `--no-dev` install — the default
seeder needs `fakerphp/faker`, which is a dev dependency. You create the first
account and store through the UI (step 10). To fill a store with the demo
catalogue afterwards, run `php artisan db:seed --class=DemoCatalogSeeder --force`
(it has no Faker dependency) with that store bound, or from the store's shell
session.

## 8. Create the central subdomain and point it at `public/`

**Do not touch `~/public_html`** — it serves `sasho-dev.com` and several other
apps. Create a new subdomain instead:

cPanel → **Domains** (or **Subdomains**) → **Create A New Domain** →
`shop.sasho-dev.com`. In the create dialog (or afterwards via **Manage** →
_Document Root_) set the document root to **`shop-builder/public`**.

cPanel usually defaults the docroot to `~/shop.sasho-dev.com` or
`~/public_html/shop`; change it to `~/shop-builder/public` and delete the empty
folder it created.

## 9. SSL

cPanel → **SSL/TLS Status** → tick `shop.sasho-dev.com` → **Run AutoSSL**.

## 10. Add a store

1. Open `https://shop.sasho-dev.com`, register, complete onboarding, create a
   store with slug `aura`.
2. cPanel → **Domains** → **Create A New Domain** → `aura.shop.sasho-dev.com`,
   document root **`shop-builder/public`** (the same folder as the central host).
3. **SSL/TLS Status** → **Run AutoSSL** so `aura.shop.sasho-dev.com` gets a cert.
4. Visit `https://aura.shop.sasho-dev.com`.

Repeat per store (one subdomain each). A store can instead use its **own
domain**: Store Settings → custom domain, the owner points a CNAME at the server,
you add that domain in cPanel (Alias/Addon) with document root
`shop-builder/public`, then run AutoSSL.

---

## Updating a live deploy

```bash
cd ~/shop-builder
git pull                              # or re-upload
php ~/composer.phar install --no-dev --optimize-autoloader
# upload the fresh public/build/ from your PC (unless it rode in on the branch)
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

---

## Troubleshooting

| Symptom                                    | Fix                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Blank 500 page                             | `tail storage/logs/laravel.log`. Usually a missing `APP_KEY`, unwritable `storage/`, or wrong DB creds.                                 |
| CSS/JS 404, unstyled page                  | `public/build/manifest.json` is missing — upload the `npm run build` output.                                                            |
| "419 Page Expired" on login                | `SESSION_DOMAIN` must be `.shop.sasho-dev.com` (leading dot, = central host) and `APP_URL` must be `https://…`.                         |
| Redirect loop / assets load over `http://` | Host is behind a proxy. In `bootstrap/app.php`, inside `withMiddleware`, add `$middleware->trustProxies(at: '*');` and re-cache config. |
| Store subdomain returns 404                | The store `slug` must equal the subdomain label, and the store `status` must be `active`.                                               |
| Emails not sending                         | Use a real cPanel mailbox; port 465 + `MAIL_SCHEME=smtps`, username is the full address.                                                |

## Notes

- `public/.htaccess` is already correct for Apache / LiteSpeed.
- No queue worker and no cron are needed (no queued jobs, no scheduled tasks).
- To reset caches during debugging: `php artisan optimize:clear`.
