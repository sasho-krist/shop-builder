# Deploying to shared hosting (cPanel / bulinfo.net)

This app deploys as a **normal PHP/Laravel application**. It is **not** a Node.js
app — do not use cPanel's "Setup Node.js App". Node is only used on your own
machine, once, to build the frontend.

What the server needs:

- PHP **8.3+** (cPanel → _Select PHP Version_) with `pdo_mysql`, `mbstring`,
  `openssl`, `bcmath`, `curl`, `fileinfo`, `gd` (or `imagick`), `zip`, `intl`.
  8.4 is fine.
- A MySQL database
- Composer (usually present in the shell; see step 4 if not)
- SSH / Terminal access (jailshell is fine)

> **If `proc_open` is disabled in CLI PHP** (common on cPanel — check with
> `php -r 'var_dump(function_exists("proc_open"));'`): `composer install`'s
> post-script and `php artisan about` will error harmlessly. You must then run
> `php artisan package:discover` manually (step 4), and you must **not**
> `route:cache` (step 7). Everything else works.

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

If it is below 8.3, use a newer EA path explicitly (and set the domain's
MultiPHP version in cPanel to match):

```bash
alias php='/opt/cpanel/ea-php83/root/usr/bin/php'   # or ea-php84
```

Use that `php` for every `artisan`/`composer` command below.

## 4. Composer

This account already has `~/composer.phar`:

```bash
cd ~/shop-builder
php ~/composer.phar install --no-dev --optimize-autoloader
php artisan package:discover        # required — composer's post-script can't run it
```

(If `composer` is also on `PATH`, `composer install --no-dev -o` works too.)

The `install` will print an error at the end —
`Process class relies on proc_open` on the `package:discover` post-script. That
is expected here; the packages and autoloader are already written. The manual
`php artisan package:discover` line finishes the job. Skipping it leaves
package service providers (Fortify's auth routes, etc.) unregistered → `/login`
and `/register` return 404.

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
php artisan view:cache

find storage bootstrap/cache -type d -exec chmod 775 {} \;
```

> **Do NOT run `php artisan route:cache` on this host.** With `proc_open`
> disabled, the route-cache build misses package-registered routes, so
> `/login` and `/register` start returning 404. `config:cache` gives almost all
> of the performance benefit without the risk. If you ran it and hit 404s,
> `php artisan optimize:clear` recovers. After any `route:cache` on a host where
> it _does_ work, remember it must be re-run on every deploy.

Do **not** run `php artisan db:seed` on a `--no-dev` install either — the
default seeder needs `fakerphp/faker`, a dev dependency. You create the first
account and store through the UI (steps 8–11). To fill a store with the demo
catalogue afterwards: `php artisan db:seed --class=DemoCatalogSeeder --force`
(no Faker dependency) with that store bound.

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

## 10. Wildcard subdomain — so every store just works

Ask the host (ticket) to set up **once**:

1. A **wildcard subdomain** `*.shop.sasho-dev.com` with document root
   `/storage/sashodeo/shop-builder/public` (same as the central host).
2. A **wildcard Let's Encrypt certificate** for `*.shop.sasho-dev.com`
   (DNS-01 validation — the host does this, not you).

After that, creating a store in the admin is all it takes — its subdomain
(`{slug}.shop.sasho-dev.com`) resolves and serves immediately, no per-store
cPanel work. This is the setup currently in production.

**Without the wildcard**, create each store's subdomain by hand: cPanel →
Domains → Create A New Domain → `{slug}.shop.sasho-dev.com`, doc root
`shop-builder/public`, then Run AutoSSL. A store can also bring its **own
domain**: Store Settings → custom domain, owner points a CNAME at the server,
you add it in cPanel (Alias/Addon) with doc root `shop-builder/public` + AutoSSL.

## 11. Fill the store

`https://shop.sasho-dev.com` → **Pages → Home** → add sections (Hero, Product
grid) → Save. Make sure products are **active** and have at least one variant
**with a price** (a product without a priced variant fails to save). Set a
**Theme**.

---

## Updating a live deploy

```bash
cd ~/shop-builder
git pull                              # or re-upload
php ~/composer.phar install --no-dev --optimize-autoloader
php artisan package:discover
# upload the fresh public/build/ from your PC (unless it rode in on the branch)
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache && php artisan view:cache
```

---

## Troubleshooting

| Symptom                                                                                         | Fix                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login` or `/register` → 404 (rest of the app works)                                           | Package providers didn't register. Run `php artisan package:discover`, then `php artisan optimize:clear`. **Never** `route:cache` on a host with `proc_open` disabled.                               |
| New (sub)domain serves a 163-byte page redirecting to `/cgi-sys/defaultwebpage.cgi`             | LiteSpeed hasn't rebuilt its vhost config for the new domain. Verify the docroot in cPanel → Domains, then open a host ticket: "please rebuild the httpd config + restart LiteSpeed for `<domain>`". |
| Subdomain → browser `DNS_PROBE_FINISHED_NXDOMAIN`, but `nslookup <host> 1.1.1.1` returns the IP | Your resolver cached the old NXDOMAIN. Switch the PC's DNS to `1.1.1.1`, `ipconfig /flushdns`, clear `chrome://net-internals/#dns` — or just wait ~1h.                                               |
| Blank 500 page                                                                                  | `tail storage/logs/laravel.log`. Usually a missing `APP_KEY`, unwritable `storage/`, or wrong DB creds.                                                                                              |
| CSS/JS 404, unstyled page                                                                       | `public/build/manifest.json` is missing — upload the `npm run build` output.                                                                                                                         |
| "419 Page Expired" on login                                                                     | `SESSION_DOMAIN` must be `.shop.sasho-dev.com` (leading dot, = central host) and `APP_URL` must be `https://…`.                                                                                      |
| Redirect loop / assets load over `http://`                                                      | Host is behind a proxy. In `bootstrap/app.php`, inside `withMiddleware`, add `$middleware->trustProxies(at: '*');` and re-cache config.                                                              |
| Store subdomain returns 404 (Laravel 404, not the cPanel page)                                  | The store `slug` must equal the subdomain label, and the store `status` must be `active`.                                                                                                            |
| Product won't save, no visible error                                                            | It needs a variant with a **price** — scroll to the Variants section and fill Price on the "Default" row.                                                                                            |
| Emails not sending                                                                              | Use a real cPanel mailbox; port 465 + `MAIL_SCHEME=smtps`, username is the full address.                                                                                                             |

### Verifying a vhost without waiting for DNS

```bash
curl -skI --resolve <host>:443:109.206.237.11 https://<host>/
```

A working Laravel response has `vary: X-Inertia` and `set-cookie: sb_session=…`.
A broken one is `Content-Length: 163` with a `Last-Modified` header (static
default page → vhost not active).

## Notes

- `public/.htaccess` is already correct for Apache / LiteSpeed. cPanel appends a
  `# BEGIN cPanel-generated php ini directives` block to it on domain creation —
  harmless, the Laravel rewrite rules stay.
- No queue worker and no cron are needed (no queued jobs, no scheduled tasks).
- Inertia SSR is off (`INERTIA_SSR_ENABLED=false`) — there is no SSR bundle.
- To reset caches during debugging: `php artisan optimize:clear` (then
  `php artisan config:cache` again, **not** `route:cache`).
- `php artisan about` fails with a `proc_open` error on this host — that's
  expected and harmless; it doesn't affect serving requests.
