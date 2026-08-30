# Shop Builder

A multi-tenant SaaS platform for building online stores. Users sign up, get a store
on their own subdomain, and manage products, themes and page content through a
visual admin panel — no code required.

> **Status:** early development. See [`docs/PLAN.md`](docs/PLAN.md) for the full roadmap.

## Tech stack

- **Backend:** Laravel 13, PHP 8.3, MySQL/MariaDB
- **Frontend:** Inertia.js v3 + React 19 + TypeScript, Tailwind CSS 4, shadcn/ui
- **Storefront:** React with Inertia SSR, theme driven by design tokens
- **Auth:** Laravel Fortify (registration, email verification, 2FA, passkeys)
- **Tooling:** Vite 8, Pest 4, Larastan (PHPStan), Pint

## Local setup

Requirements: PHP 8.3+, Composer, Node 20+, MySQL 8 / MariaDB.

```bash
git clone https://github.com/sasho-krist/shop-builder.git
cd shop-builder
composer install
npm install
cp .env.example .env
php artisan key:generate
# create the database `shop_builder`, then:
php artisan migrate
php artisan storage:link
composer run dev
```

`composer run dev` starts the PHP server, queue worker and Vite together.

Open `http://shop-builder.localhost:8000`. Browsers resolve any `*.localhost`
name to `127.0.0.1`, so store subdomains like `acme.shop-builder.localhost:8000`
work with no hosts-file changes.

## Quality checks

```bash
composer run test        # Pint + PHPStan + Pest
vendor/bin/pint          # format
vendor/bin/phpstan       # static analysis
```

## License

MIT
