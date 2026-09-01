# Shop Builder

A multi-tenant SaaS platform for building online stores. A merchant signs up, gets
a store on their own subdomain (or a connected custom domain), and runs the whole
shop — catalogue, theme, pages, navigation, orders, staff — from a visual admin
panel. No code required.

The admin panel and the storefront are both fully localised; **Bulgarian is the
default language**, with a one-click switch to English.

> **Status:** feature-complete through the planned roadmap (phases 0–8, see
> [`docs/PLAN.md`](docs/PLAN.md)). What remains before a public launch is
> operational: real Stripe keys + Price IDs, and production wildcard DNS/TLS.

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Feature reference](#feature-reference)
- [Internationalization](#internationalization)
- [Project layout](#project-layout)
- [Local setup](#local-setup)
- [Configuration](#configuration)
- [Testing & quality](#testing--quality)
- [Deployment notes](#deployment-notes)

---

## What it does

### For the merchant (admin panel)

| Area            | Capabilities                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**   | Store name, live storefront link, current plan.                                                                                                                                                                                                                                                        |
| **Products**    | Full CRUD; option groups (e.g. Size / Colour) that generate a variant matrix; per-variant SKU, price, compare-at price, stock; drag-and-drop images with alt text and reordering; SEO fields. List view with debounced search, status filter and sorting. **CSV import** with a column-mapping wizard. |
| **Categories**  | Nested categories (parent/child) with cycle prevention; assign products from the product form.                                                                                                                                                                                                         |
| **Collections** | Curated, ordered product groups with a searchable product picker; visible/hidden toggle.                                                                                                                                                                                                               |
| **Themes**      | Design-token editor — 7 colour swatches, heading/body fonts, sliders for base size, type scale, corner radius, spacing and container width, button style — with a live mini-storefront preview. Presets: Minimal / Bold / Classic. One active theme per store.                                         |
| **Pages**       | Section-based page builder (see below). Home, Shop, Cart and Thank-you are built-in pages (slug locked, not deletable) whose sections wrap the corresponding storefront view; plus any number of custom pages, each publishable independently.                                                         |
| **Navigation**  | Header and footer menu editor — repeatable link rows; the target picker lists Home / All products / Cart, then **every custom page by name**, then Category / Collection / Custom URL; optional automatic top-level category links; footer note.                                                       |
| **Messages**    | Contact-form submissions from the storefront — expandable list with per-field values, unread indicator (auto-marked read on open), mark unread, delete. Also emailed to the store notification email when one is set.                                                                                  |
| **Orders**      | List and detail (line items, customer, shipping address, notes, payments); change order status and payment status.                                                                                                                                                                                     |
| **Customers**   | The store's account holders — list with search, edit name/email, reset password, delete (past orders are kept).                                                                                                                                                                                        |
| **Owners**      | Store staff with full admin access — add an owner (new user or attach an existing one), edit name/email, remove (with "not yourself" / "not the last owner" guards). An owner's password can only be changed by that owner, from their own security settings.                                          |
| **Billing**     | Current plan, usage bars (products, team members), plan cards with upgrade via Stripe Checkout, and a link to the Stripe billing portal.                                                                                                                                                               |
| **Settings**    | Currency code & symbol, store notification email, flat shipping rate, free-shipping threshold, tax rate & tax-inclusive pricing, and the custom-domain connection with CNAME instructions.                                                                                                             |
| **Account**     | Profile (name/email), security (password, two-factor authentication, passkeys), appearance (light/dark/system), and the **admin language** switch.                                                                                                                                                     |

### For the shopper (storefront)

- Themed storefront on `{store}.<central-domain>` or a connected custom domain,
  styled entirely by the store's active theme.
- Home and custom pages rendered from the same section registry used in the builder.
- Product listing (grid + pagination), product detail (image gallery, variant
  picker, quantity, add to cart), category and collection pages.
- Cookie-based cart (add / update / remove), `bcmath` money maths.
- Checkout: contact + shipping address form, order summary, **pay on delivery** or
  **pay by card** (Stripe Checkout, shown only when the store's plan allows it and
  Stripe is configured). Public order-confirmation page by token.
- Order-confirmation email rendered in the buyer's language.
- Customer accounts: register / sign in / account page with order history
  (a per-store `customer` auth guard, separate from platform users).
- Owner editing bar: a signed-in owner viewing their own storefront sees a
  floating toolbar (Edit home / Theme / Product / Catalog / Orders / Admin) and a
  per-section "Edit" affordance that deep-links into the builder.

### For the platform operator

- Plan enforcement (`config/plans.php`): free / pro / business, each with limits on
  product count, staff count, custom domains and card payments.
- Laravel Cashier subscriptions billed to the **tenant** (not the user); a webhook
  listener keeps `tenants.plan` in sync with the active subscription.
- Payment and billing gateways are behind interfaces with fake implementations, so
  the whole flow is testable without hitting Stripe.

---

## Tech stack

| Layer          | Choice                                                                      |
| -------------- | --------------------------------------------------------------------------- |
| Backend        | Laravel 13, PHP 8.3                                                         |
| Admin frontend | Inertia.js v3 + React 19 + TypeScript (Laravel React starter kit)           |
| UI components  | shadcn/ui (Radix) + Tailwind CSS 4 + lucide-react                           |
| Storefront     | React via Inertia, styled from design tokens                                |
| Database       | MySQL 8 / MariaDB — database `shop_builder`, InnoDB                         |
| Auth           | Laravel Fortify — registration, email verification, 2FA, passkeys           |
| Multi-tenancy  | Single database + `tenant_id` scoping; subdomain / custom-domain resolution |
| Store payments | Stripe Checkout (one provider for now, behind an interface)                 |
| SaaS billing   | Laravel Cashier                                                             |
| Typed routes   | Laravel Wayfinder (generated on `npm run build`)                            |
| Build          | Vite 8                                                                      |
| Quality        | Pest 4, Larastan (PHPStan), Pint                                            |

---

## Architecture

### Multi-tenancy

One database, shared schema, isolation by `tenant_id`.

- **`TenantContext`** singleton with `Tenant::current()` / `currentOrFail()` /
  `setCurrent()` / `forgetCurrent()`.
- **`BelongsToTenant`** trait — adds a global scope that filters every query by the
  active tenant and auto-fills `tenant_id` on create. Used by catalogue, cart,
  order, theme, page, settings and navigation models. In tests, call
  `Tenant::setCurrent()` explicitly.
- **`users`** are global accounts. Membership in a store is the `tenant_user` pivot
  (model `TenantMembership`) with a `role` (`owner` / `staff`).

### Request routing

`routes/web.php` requires `routes/storefront.php` **first**, so a store subdomain
never falls through to the central marketing/admin routes.

| Host                                          | Routes                                          | Middleware                                                      |
| --------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `<central-domain>`                            | Marketing, auth, onboarding, admin panel        | `auth`, `verified`, `EnsureTenantSelected`                      |
| `{store}.<central-domain>` or a custom domain | Public storefront + `{store}/admin` owner entry | `SetStorefrontLocale`, `ResolveStorefrontTenant`, `ResolveCart` |

- **`ResolveStorefrontTenant`** resolves the tenant from `$request->getHost()`
  (subdomain slug _or_ connected custom domain), not from a route parameter, and
  `forgetParameter('store')` so route-model binding still works. Unknown host → 404.
- **`EnsureTenantSelected`** binds the signed-in user's store for admin routes and
  respects `session('active_tenant_id')` (groundwork for multi-store owners).
- The storefront catch-all `GET {slug}` is registered **last**, constrained by a
  slug regex, and renders a published `type=page` page.
- A shared session cookie (`SESSION_DOMAIN=.<central-domain>`,
  `SESSION_COOKIE=sb_session`) lets a signed-in owner be recognised on their
  storefront subdomain, which drives the owner editing bar.

### Inertia shared data

`HandleInertiaRequests` shares:

- `locale` and `i18n` (the translation map) as **lazy** props — they must resolve
  _after_ route middleware so the storefront locale middleware has run.
- `storefront` (lazy) — store name, active theme tokens, cart count, currency
  symbol, categories, resolved navigation, and `manage` (admin deep-links) when
  the visitor is an owner of that store.

### Payments & billing abstraction

- `App\Services\Payments` — `PaymentGateway` interface, `StripePaymentGateway`
  (Stripe Checkout for one-off orders) and `FakePaymentGateway`. Storefront webhook
  at `POST /stripe/webhook` marks the order paid and sends the confirmation email.
- `App\Services\Billing` — `BillingGateway` interface, `StripeBillingGateway`
  (Cashier Checkout + billing portal) and `FakeBillingGateway`. Webhook at
  `POST /billing/webhook`; `SyncTenantPlan` listener syncs `tenants.plan`.
- `PlanGate` enforces `config/plans.php` limits.

Both real gateways are config-gated on `STRIPE_SECRET`; the card option simply
disappears from the UI when Stripe is not configured.

---

## Data model

**Platform:** `tenants`, `tenant_user`, `subscriptions`, `subscription_items`
(Cashier). `users` carry a `locale` preference.

**Catalogue** (all `tenant_id`-scoped): `products` (+ `options` JSON),
`product_variants`, `product_images` (public disk), `categories` (nested),
`category_product`, `collections`, `collection_product` (ordered).

**Theme & content:** `themes` (`tokens` JSON, one active per store), `pages`
(`type`, `blocks` JSON, `is_published`), `store_navigation` (header/footer links,
footer note), `store_settings` (currency, email, shipping, tax).

**Shop & orders:** `customers` (per-tenant accounts), `carts` / `cart_items`
(cookie-identified), `orders` (sequential `number` from 1001 per store, `token`,
`status`, `payment_status`, `payment_method`, `shipping_address` JSON, totals,
`currency`, `locale`), `order_lines` (product/variant snapshot), `payments`
(provider, ref, amount, status).

**Best sellers:** `Product::scopeBestSelling()` ranks by units sold across every
non-cancelled order (payment-on-delivery is normal, so unpaid still counts),
tenant-scoped through a `Product::orderLines` has-many-through relation.

---

## Feature reference

### Theme engine

`App\Support\Theme\ThemePresets` is the single source of truth for the token
shape: `colors` (primary, primaryForeground, background, foreground, muted,
mutedForeground, border), `typography` (headingFont, bodyFont, baseSize, scale),
`radius`, `spacing`, `container`, `buttonStyle`. `ThemeRequest` validates every
field. `resources/js/lib/theme.ts` → `themeToCssVars()` maps tokens to `--sb-*`
custom properties, shared by the editor preview and the storefront.

- `resources/js/sections/*` — each `SectionDef` has a `fields` schema and a
  `Render` component. Field types: `text`, `textarea`, `html`, `image`, `color`,
  `icon` (curated icon set), `select`, `number` (buttons for short ranges,
  slider otherwise), `boolean`, `collection`, and `repeater` (arrays of
  sub-rows — used by lists, tabs, galleries, etc.).
- ~40 sections, grouped in the "Add" menu, roughly matching a page-builder
  widget library:
    - **Layout** — Columns: a container block that splits into 2–4 columns
      (equal or ratio layouts like 1 : 2, 3 : 1), each column holding its own
      stack of elements. Gap, vertical alignment, and "stack on mobile" are
      per-container options. Nesting is one level deep — a column cannot hold
      another Columns block. Stored as `Block.columns` (`Block[][]`), validated
      recursively by `PageRequest`, edited via `ColumnsEditor` (per-column
      add / reorder / delete), rendered by the shared block renderer with a
      `NestedContext` that drops section gutters inside a column.
    - **Store** — Hero, Text block, Image + text, Product grid (2–6 columns,
      small / medium / large card size, source = _Newest_ / _Best sellers_ / a
      collection), Featured collection (same column and card-size options).
    - **Basic** — Heading, Text editor, Image, Button, Divider, Spacer, Icon,
      Blockquote, Alert, Star rating, Google map, HTML / embed.
    - **Media** — Video (YouTube/Vimeo), Image gallery, Image carousel.
    - **Content** — Icon box, Image box, Icon list, Features grid, Testimonial,
      Team, Logo grid, Price list, Social icons, **Contact form** (a working
      form with a repeater of fields — short text / email / phone / long text /
      dropdown / radio / checkbox / on-off switch, each full- or half-width and
      optionally required; submissions POST to `/forms`, land in `form_submissions`
      and show under **Messages** in the admin, and email the store's
      `store_email` if set).
    - **Advanced** — Tabs, Accordion, Toggle, FAQ, Counters, Progress bars,
      Countdown, Animated headline, Testimonial carousel, Pricing table, Call to
      action, Flip box.
- Editor (`pages/edit`): left panel is a `@dnd-kit` sortable section list plus the
  selected section's schema form (with inline repeater editing); right panel is
  `PageCanvas`, a live preview styled by the active theme with real sample
  products/collections.
- `Page.type` is `home` / `shop` / `cart` / `thankyou` / `page`. The first four
  are system pages (`Page::SYSTEM_TYPES`, `Page::seedSystemPages()`) — seeded on
  onboarding, backfilled by migration, slug locked, not deletable, always in the
  Pages list with a badge. Their sections wrap the built-in storefront view:
  **Shop** above the product grid on `/products` (its title / SEO description
  also become that page's heading and intro), **Cart** above the cart contents,
  **Thank-you** below the order summary on `/order/{token}`.
- `App\Support\Blocks\BlockRegistry` is the PHP allow-list; `PageRequest` validates
  block structure. The storefront renders the **same** section components from
  `pages.blocks` via the shared `StorefrontBlocks` component, so interactive
  widgets (tabs, carousels, counters) work identically in the editor and live.
- What is deliberately **not** here (from a WordPress/Elementor comparison):
  a multi-step / logic form builder (the Contact form covers the common case),
  WordPress-post / shortcode / dynamic-tag widgets, WooCommerce widgets (the
  storefront has its own cart and checkout), and theme-builder / popup features.

### Storefront

`storefront-layout.tsx` wraps everything in `themeToCssVars(active theme)`; header
uses the resolved navigation (falling back to a single "Shop" link), footer shows
the note, links and copyright. `App\Support\Storefront\NavLinks` turns
`{label, type, value}` rows into hrefs and drops anything unresolvable.

### Checkout & orders

`POST /checkout` creates the order and lines in a transaction. Offline orders clear
the cart immediately; card orders keep the cart until Stripe confirms (so
"cancel" on Stripe's page still leaves something to check out), and use
`Inertia::location()` for the cross-origin redirect. The confirmation page clears
the cart for a recent card order. `orders.locale` (set at checkout) lets the
Stripe webhook render the confirmation email in the buyer's language.

---

## Internationalization

- **One React hook** — `resources/js/lib/i18n.ts` `useT()`:
  `t('English source string', { placeholder })`, reading the shared `i18n` map and
  `locale`. A missing key renders as-is, so English is the source language.
- **Dictionaries** — `lang/bg.json` (English key → Bulgarian, one file for the
  whole app) and `lang/en.json` (only the namespaced enum keys like
  `status.active`, `plan.pro`, `buttonStyle.solid` that must still read in
  English). Backend flash and validation messages go through `__()`.
- **Storefront language** — a Globe switcher in the header hits
  `/locale/{bg|en}`, which stores an `sb_locale` cookie; `SetStorefrontLocale`
  applies it per request.
- **Admin language** — a per-user preference (`users.locale`, default `bg`),
  switched from the account menu (`PATCH /settings/locale`) and applied by the
  `SetUserLocale` middleware. `APP_LOCALE` stays `en`.
- Owner-authored content (page blocks, product and category names) is never
  translated.

---

## Project layout

```
app/
  Http/
    Controllers/            # admin panel controllers
      Storefront/            # public storefront + {store}/admin entry
      Settings/              # profile, security, locale
    Middleware/              # tenancy, cart, locale resolution
    Requests/                # form-request validation
  Models/
  Services/
    Payments/                # PaymentGateway + Stripe/Fake
    Billing/                 # BillingGateway + Stripe/Fake, PlanGate
  Support/
    Theme/ThemePresets.php
    Blocks/BlockRegistry.php
    Storefront/NavLinks.php
    Tenancy/                 # TenantContext, BelongsToTenant
config/
  plans.php                  # SaaS plan limits
  cashier.php  services.php  # Stripe (billing + storefront)
lang/
  bg.json  en.json           # UI translations
  bg/validation.php
resources/js/
  pages/
    admin/                   # admin panel screens
    storefront/              # storefront screens
    auth/  settings/
  sections/                  # page-builder + storefront sections
    registry.tsx             #   aggregates every SectionDef
    commerce.tsx basic.tsx boxes.tsx interactive.tsx
    shared.tsx icons.tsx
  components/                # shared React components
  layouts/                   # app, auth, settings, storefront
  lib/                       # i18n, theme, blocks, money
routes/
  web.php                    # marketing + admin (requires storefront.php first)
  storefront.php             # subdomain / custom-domain routes
  settings.php  console.php
database/migrations/
docs/PLAN.md                 # roadmap (Bulgarian)
tests/Feature/               # Pest feature tests
```

---

## Local setup

Requirements: PHP 8.3+, Composer, Node 20+, MySQL 8 / MariaDB.

```bash
git clone https://github.com/sasho-krist/shop-builder.git
cd shop-builder
composer install
npm install
cp .env.example .env
php artisan key:generate
# create an empty database named `shop_builder`, then:
php artisan migrate
php artisan storage:link
composer dev
```

`composer dev` runs the PHP server, queue worker and Vite together.

Open `http://shop-builder.localhost:8000`. Browsers resolve any `*.localhost` name
to `127.0.0.1`, so store subdomains like `acme.shop-builder.localhost:8000` work
with no hosts-file changes.

Optional demo data — 10 wellness products with generated cover images, variants and
categories:

```bash
php artisan db:seed --class=DemoCatalogSeeder
```

---

## Configuration

Key `.env` values beyond the Laravel defaults:

| Variable                                     | Purpose                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `APP_URL`                                    | Central app origin, e.g. `http://shop-builder.localhost:8000`                          |
| `APP_CENTRAL_DOMAIN`                         | Bare central domain used to tell storefront hosts apart, e.g. `shop-builder.localhost` |
| `SESSION_DOMAIN`                             | `.shop-builder.localhost` — shares the session across subdomains                       |
| `SESSION_COOKIE`                             | `sb_session`                                                                           |
| `STRIPE_KEY` / `STRIPE_SECRET`               | Stripe API keys (enable both storefront card payments and Cashier)                     |
| `STRIPE_WEBHOOK_SECRET`                      | Cashier billing webhook signing secret (`/billing/webhook`)                            |
| `STRIPE_STOREFRONT_WEBHOOK_SECRET`           | Storefront one-off payment webhook secret (`/stripe/webhook`)                          |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS` | Cashier Price IDs for the paid plans                                                   |

Everything Stripe is optional for local development — without keys, card payments
and paid-plan checkout are simply hidden and the fake gateways drive the tests.

---

## Testing & quality

```bash
composer test          # Pint (check) + PHPStan + Pest  — full gate
php artisan test        # Pest only
npm run check:fix       # format + lint the frontend
npm run types:check     # tsc --noEmit
npm run build           # production assets + regenerate Wayfinder routes
vendor/bin/phpstan analyse --memory-limit=1G
```

PHPStan needs `--memory-limit=1G` (already wired into `composer types:check`).
There are ~35 Pest feature test files covering tenancy isolation, the full
merchant + shopper flow, payments/billing (via fakes), and localisation.

---

## Deployment notes

- Deploys as a **plain PHP/Laravel app** — no Node process in production. The
  frontend is a static build (`npm run build` → `public/build`), committed or
  uploaded. Inertia SSR is off (`INERTIA_SSR_ENABLED`, default false).
- Every store needs its own hostname. Ideal: wildcard DNS (`*.example.com`) +
  wildcard TLS. On hosting without wildcard TLS, create each store's subdomain
  explicitly (its cert is then issued per-host); connected custom domains always
  need their own cert.
- No queue worker or scheduler is required (no queued jobs, no scheduled tasks);
  `QUEUE_CONNECTION=sync` is fine.
- Provide real Stripe keys, webhook secrets and Price IDs to enable payments and
  subscriptions.
- Step-by-step shared-hosting (cPanel) walkthrough: [`DEPLOY.md`](DEPLOY.md).

## License

MIT
