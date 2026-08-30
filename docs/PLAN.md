# Shop Builder — План за разработка

Multi-tenant SaaS платформа за създаване на онлайн магазини. Всеки потребител се
регистрира, получава магазин на поддомейн и през визуален админ панел управлява
продукти, тема и съдържание на страниците.

---

## 1. Технологичен стек (фиксиран)

| Слой                  | Избор                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Backend               | Laravel 13, PHP 8.3                                                         |
| Admin frontend        | Inertia.js v3 + React 19 + TypeScript (официален Laravel React starter kit) |
| UI компоненти         | shadcn/ui (Radix) + Tailwind CSS 4 + lucide-react                           |
| Storefront            | React, server-side rendered през Inertia SSR                                |
| Тема / стилове        | Дизайн токени (JSON) → CSS custom properties на storefront `:root`          |
| БД                    | MySQL 8 / MariaDB — база `shop_builder`, engine InnoDB                      |
| Auth                  | Laravel Fortify (регистрация, email verification, 2FA, passkeys)            |
| Multi-tenancy         | Single database + `tenant_id` scoping (ръчно), поддомейн резолюция          |
| Плащания в магазините | Stripe (MVP — един provider), после разширяемо                              |
| SaaS billing          | Laravel Cashier (абонаментни планове на платформата)                        |
| Build                 | Vite 8, Wayfinder за типизирани роути                                       |
| Качество              | Pest 4, Larastan (PHPStan), Pint                                            |

Локална среда: WAMP, `http://shop-builder.localhost:8000`, поддомейни
`*.shop-builder.localhost` (браузърите ги резолвват към 127.0.0.1 — без hosts файл).

---

## 2. Архитектура на tenancy

**Модел:** една база, споделена схема, изолация чрез `tenant_id`.

- `tenants` — id, name, slug (поддомейн), custom_domain, plan, status, trial_ends_at ✅
- `users` — глобални акаунти; pivot `tenant_user` с роля (`owner`, `staff`) ✅
- `TenantContext` singleton + `Tenant::current()` / `currentOrFail()` / `setCurrent()` ✅
- `ResolveStorefrontTenant` middleware — резолюция от `{store}` поддомейн (или custom domain) ✅
- `EnsureTenantSelected` middleware — свързва активния магазин за админ роутите ✅
- `BelongsToTenant` trait (global scope + auto-fill `tenant_id`) ✅ — ползва се от
  `Product` / `ProductVariant`; в тестове се задава `Tenant::setCurrent()`
- Публичен storefront и админ панел ползват един и същ tenant контекст, различни route групи

**Route групи:**

| Домейн                          | Група                                 | Auth                |
| ------------------------------- | ------------------------------------- | ------------------- |
| `shop-builder.localhost`        | Marketing + auth + onboarding + админ | guest / user        |
| `{slug}.shop-builder.localhost` | Публичен storefront (Inertia SSR)     | customer (по избор) |

_Забележка: изнасянето на админа на отделен `app.` поддомейн е оставено за
по-късна фаза — за MVP админът живее на централния домейн._

**Ъпгрейд път:** ако потрябва по-силна изолация — миграция към `stancl/tenancy`
с database-per-tenant. Схемата се проектира да не пречи на това.

---

## 3. Модел на данните (ядро)

### Платформа

- `tenants`, `tenant_user`, `subscriptions` (Cashier), `subscription_items`

### Каталог (всички с `tenant_id`)

- `products` — title, slug, description, status, seo\_\* ✅
- `product_variants` — name, sku, price, compare_at_price, stock_quantity, position, options (JSON) ✅
- `product_images` — media_id, position, alt
- `categories` — parent_id (nested), name, slug, description, position ✅
- `category_product` (pivot) ✅
- `attributes` / `attribute_values` — за вариации и филтри
- `collections` — ръчни/автоматични групи; `collection_product` (pivot)
- `media` — disk, path, mime, size, width, height, alt

### Тема и съдържание

- `themes` — name, tokens (JSON: colors, typography, spacing, radius, shadows), is_active
- `pages` — type (home/product/category/cart/page), slug, blocks (JSON), seo_*, is_published
- `menus` / `menu_items` — навигация (header, footer)
- `settings` — key/value per tenant (валута, език, ДДС, зони за доставка, payment креденшъли)

### Магазин / поръчки

- `customers` — акаунти на купувачите (per tenant)
- `addresses` — за customer и за поръчки
- `carts` / `cart_items` — persistнати
- `orders` — number, status, financial_status, суми (subtotal/tax/shipping/total), currency
- `order_lines` — product/variant snapshot, qty, unit_price
- `order_events` — история на статусите
- `payments` — provider, provider_ref, amount, status

---

## 4. Theme engine

1. **Дизайн токени** — JSON структура:
    ```json
    {
        "colors": {
            "primary": "#16a34a",
            "bg": "#ffffff",
            "text": "#0a0a0a",
            "muted": "#6b7280",
            "border": "#e5e7eb"
        },
        "typography": { "heading": "Inter", "body": "Inter", "scale": 1.25 },
        "radius": "0.5rem",
        "spacing": "1rem",
        "container": "1280px"
    }
    ```
2. Backend отдава активната тема → storefront я инжектира като `--color-primary`, `--radius` … на `<html>`.
3. Tailwind класовете в компонентите сочат към тези променливи → смяна на тема без rebuild.
4. **Presets** — 2–3 стартови теми (Minimal / Bold / Classic): различни token JSON + различен стартов layout на страниците.
5. Редактор: форма с color pickers / font selects / slider-и → `postMessage` към preview iframe за мигновен ъпдейт.

---

## 5. Page / Section builder

- **Регистър от секции** — React компоненти, всяка с `schema` + `render(props)`.
- Типове полета в schema: `text`, `richtext`, `image`, `color`, `select`, `number`, `boolean`, `product-picker`, `collection-picker`, `repeater`.
- **Стартов набор секции:** `Header`, `HeroBanner`, `ProductGrid`, `FeaturedCollection`, `ImageWithText`, `RichText`, `Newsletter`, `Footer`.
- Редактор: ляв панел = списък секции (add / drag-reorder / remove) + форма от schema; център = жив preview. Данните се пазят в `pages.blocks` (JSON).
- **Card / list / table изглед:** `ProductGrid` има настройки `display: grid | list | table`, `columns`, `cardStyle` (image ratio, показвай цена/бадж/рейтинг). Глобален "product card" preset идва от темата; секцията може да го override-не.
- Заглавия: всяка секция има editable heading полета; типографията идва от темата.
- Storefront рендерира същите компоненти от `pages.blocks` → блокът се пише веднъж.

---

## 6. Storefront

Роути per tenant: `/`, `/c/{category}`, `/p/{product}`, `/collections/{slug}`, `/cart`, `/checkout`, `/account`.

- Inertia SSR рендерира `pages.blocks` през регистъра от секции.
- Количка: persistната (`carts` по session/customer), add/update/remove, преизчисляване на суми + ДДС + доставка.
- Checkout: адрес → метод на доставка → Stripe плащане → `order` → потвърждаващ имейл.
- Клиентски акаунт: история на поръчки, адреси (Фаза 7).

---

## 7. Фази на изпълнение

| Фаза                               | Съдържание                                                                                                                                                          | Критерий за готовност                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **0. Setup** ✅                    | Repo, Laravel 13 + React starter kit, БД (InnoDB), Pest/PHPStan/Pint, `.env` за `shop-builder.localhost`                                                            | `composer run dev` върви, `php artisan test` минава, login работи                                |
| **1. Tenancy + Auth** ✅           | `tenants` + `tenant_user`, `TenantContext`, storefront/admin middleware, поддомейн роути, signup → onboarding → създава магазин + owner, dashboard показва магазина | Регистрация създава магазин, `{slug}.shop-builder.localhost` зарежда tenant контекст (200 / 404) |
| **2a. Каталог — продукти** ✅      | `products` + `product_variants`, `BelongsToTenant`, админ CRUD (list/create/edit/delete) с variants repeater, sidebar nav                                           | Създаване/редакция/триене на продукт с вариации; изолация по магазин (404 за чужд)               |
| **2b. Каталог — категории** ✅     | `categories` (nested, parent_id) + `category_product`, админ CRUD (dialog, tree, cycle-prevention), продукт ↔ категории от продуктовата форма                       | Влагане на подкатегории; забрана за цикли; продукт се маркира в категории                        |
| **2c–2d. Каталог — останало**      | Атрибути (за вариации/филтри); media library + product images; колекции + CSV импорт                                                                                | Пълен каталог със снимки и импорт                                                                |
| **3. Theme engine**                | Token редактор, CSS var pipeline, 2–3 стартови теми, превключване                                                                                                   | Смяна и редакция на тема с жив preview                                                           |
| **4. Page builder**                | Регистър от секции, schema-driven форми, drag-reorder, live preview                                                                                                 | Сглобяване на home/category/product страници от блокове                                          |
| **5. Storefront**                  | Inertia SSR storefront, роути, рендер на blocks, количка                                                                                                            | Работещ публичен магазин с разглеждане и количка                                                 |
| **6. Checkout & поръчки**          | Checkout flow, Stripe, управление на поръчки, имейли, статуси                                                                                                       | Реална продажба end-to-end                                                                       |
| **7. Клиенти, настройки, домейни** | Клиентски акаунти, настройки за доставка/ДДС/валута, custom domain                                                                                                  | Готов за реален магазин                                                                          |
| **8. SaaS billing**                | Планове, Cashier абонаменти, onboarding wizard, лимити по план                                                                                                      | Готов за реални клиенти на платформата                                                           |

**MVP = Фази 0–6.** Фази 7–8 са за реално пускане в production.

---

## 8. Отворени решения

- Име на платформата + основен домейн за production (wildcard DNS + wildcard TLS)
- Хостинг: SSR иска Node процес → Laravel Forge + VPS е простият вариант
- Многоезичност / много валути — от старта или по-късно?
- Първи реален магазин за тестване

---

## 9. React ramp-up (за разработчик без React опит)

Учи се чрез модификация на готовите страници в starter kit-а, не от нулата.
Нужен минимум, по ред:

1. Компоненти и props, JSX
2. Състояние: `useState`, `useEffect`
3. Форми през Inertia `useForm` (submit; validation errors идват от Laravel)
4. Навигация: `<Link>`, `router.visit`, Wayfinder типизирани роути
5. shadcn/ui компоненти (copy-paste, не се учат)
6. TypeScript — само базови типове в началото

Реалистично: 1–2 седмици паралелно с Фаза 0–1.
