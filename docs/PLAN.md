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
- `product_images` — disk, path, alt, width, height, position ✅ (директно, без media
  таблица за MVP; shared media library — по-късно ако потрябва)
- `categories` — parent_id (nested), name, slug, description, position ✅
- `category_product` (pivot) ✅
- `attributes` / `attribute_values` — за вариации и филтри
- `collections` — title, slug, description, is_visible, position ✅; `collection_product`
  (pivot с `position`) ✅
- `media` — disk, path, mime, size, width, height, alt

### Тема и съдържание

- `themes` — name, tokens (JSON: colors×7, typography, radius, spacing, container,
  buttonStyle), is_active ✅ (една активна на магазин)
- `pages` — type (home/page), title, slug, blocks (JSON), seo_*, is_published ✅
- `menus` / `menu_items` — навигация (header, footer)
- `settings` — key/value per tenant (валута, език, ДДС, зони за доставка, payment креденшъли)

### Магазин / поръчки

- `customers` — акаунти на купувачите (per tenant)
- `addresses` — за customer и за поръчки
- `carts` (tenant_id, token) / `cart_items` (cart_id, product_variant_id, quantity) ✅
- `orders` — number, token, status, payment_status, payment_method, email/name/phone,
  shipping_address (JSON), subtotal/shipping_total/total, currency ✅
- `order_lines` — product/variant snapshot (title, variant_name, sku), unit_price,
  quantity, subtotal ✅
- `payments` — provider, provider_ref, amount, status (Фаза 6b)

---

## 4. Theme engine ✅

- **Token shape** — единствен източник на истина е `App\Support\Theme\ThemePresets`:
  `colors` (primary, primaryForeground, background, foreground, muted,
  mutedForeground, border), `typography` (headingFont, bodyFont, baseSize, scale),
  `radius`, `spacing`, `container`, `buttonStyle`. `ThemeRequest` валидира всяко
  поле (hex regex, диапазони, whitelist за шрифтове/бутон-стил).
- **Presets** — Minimal / Bold / Classic (`ThemePresets::all()`); в редактора
  бутон „Start from" ги зарежда в live формата.
- **Pipeline** — `resources/js/lib/theme.ts` → `themeToCssVars()` мапва токените към
  `--sb-*` custom properties. Ползва се и от редактора (live preview), и от
  storefront-а (`coming-soon` вече е стилизиран от активната тема).
- **Редактор** (`themes/edit`) — ляв панел с `ColorField` (swatch + popover +
  native color input + hex), font selects, **slider-и** за baseSize / scale /
  radius / spacing / container, ToggleGroup за button style; десен панел =
  `ThemePreview` (мини storefront: header + hero + product grid) който се
  прерисува мигновено.
- Дефолтна активна тема се създава при onboarding.
- Оставено за после: Google Fonts зареждане в storefront-а, per-section
  override на product card стила (в Phase 4).

---

## 5. Page / Section builder ✅ (4a)

- **`pages` таблица** — type (home/page), title, slug, `blocks` (JSON), seo, is_published.
  Home страница се създава при onboarding. `PageRequest` валидира структурата
  (тип на блока в `BlockRegistry::TYPES`, `blocks.*.id/props` present).
- **Регистър от секции** — `resources/js/sections/registry.tsx`, всяка `SectionDef`
  има `fields` (schema) + `Render` компонент. Field типове: `text`, `textarea`,
  `image`, `color`, `select`, `number` (slider), `boolean`, `collection`.
- **Стартов набор:** Hero, Text (RichText), Image + text, Product grid
  (grid/list, columns 2–4, latest/collection source, show price), Featured collection.
- **Редактор** (`pages/edit`) — ляв панел: sortable списък от секции (**@dnd-kit**
  drag-reorder, add меню, delete) + schema форма за избраната; десен панел:
  `PageCanvas` жив preview, стилизиран от активната тема, с реални примерни
  продукти/колекции (`previewContext`). Блоковете се пазят в `pages.blocks`.
- `MediaController@store` — качване на изображение → URL за image полетата.
- Storefront ще рендерира същите section компоненти от `pages.blocks` (Фаза 5).
- Оставено за после: още секции (Header/Footer/Newsletter), `richtext` редактор,
  drag-reorder на variant/image списъци (сега up/down), `table` display на
  product card, per-section card override.

---

## 6. Storefront ✅ (5a)

Роути на поддомейна (`routes/storefront.php`, група `ResolveStorefrontTenant` +
`ResolveCart`): `/`, `/products`, `/p/{slug}`, `/cart` (GET/POST/PATCH/DELETE).
`ResolveStorefrontTenant` прави `forgetParameter('store')` за да не чупи binding-а.

- **Layout** (`storefront-layout.tsx`) — themed header (име, Shop, cart badge) +
  footer; целият wrapper е `themeToCssVars(активна тема)`. Темата + `cartCount`
  идват като **lazy** shared Inertia prop (`storefront`) — резолвва се след route
  middleware, не при `share()`.
- **Home** — рендерира `pages.blocks` през същия `sections/registry.tsx`; секциите
  получават реален `sectionContext` (активни продукти + видими колекции); product
  карти линкват към `/p/{slug}` (`ctx.hrefBase`).
- **Product listing / detail** — grid + пагинация; detail с галерия, избор на
  вариант, количество, „Add to cart".
- **Количка** — `carts` + `cart_items`, идентифицирана с `sb_cart` cookie (в
  `encryptCookies except`); add/update/remove; subtotal с `bcmath`.
- Категорийни/колекционни storefront страници, клиентски акаунти, ДДС/доставка
  — следващи фази.

---

## 7. Checkout & поръчки ✅ (6a)

- `orders` (tenant_id, number seq per store from 1001, token, status, payment_status,
  payment_method, email/name/phone, shipping_address JSON, subtotal/shipping/total,
  currency BGN) + `order_lines` (snapshot: product_title, variant_name, sku,
  unit_price, quantity, subtotal; `product_variant_id` nullOnDelete).
- **Storefront checkout** — `/checkout` (contact + address форма, cart summary),
  `POST /checkout` създава order + lines в транзакция, изчиства количката,
  redirect към `/order/{token}` (публична потвърждаваща страница по token).
- **Плащане** — за MVP само „offline" (плащане при доставка); `payment_status`
  се управлява ръчно от админа. Stripe / `payments` таблица — следваща стъпка.
- **Админ** — `orders.index` (списък + пагинация), `orders.show` (артикули,
  клиент, адрес, бележки) + смяна на status / payment_status.
- Доставка = 0 (flat/зони са Фаза 8).

---

## 8. Фази на изпълнение

| Фаза                                  | Съдържание                                                                                                                                                                           | Критерий за готовност                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **0. Setup** ✅                       | Repo, Laravel 13 + React starter kit, БД (InnoDB), Pest/PHPStan/Pint, `.env` за `shop-builder.localhost`                                                                             | `composer run dev` върви, `php artisan test` минава, login работи                                |
| **1. Tenancy + Auth** ✅              | `tenants` + `tenant_user`, `TenantContext`, storefront/admin middleware, поддомейн роути, signup → onboarding → създава магазин + owner, dashboard показва магазина                  | Регистрация създава магазин, `{slug}.shop-builder.localhost` зарежда tenant контекст (200 / 404) |
| **2a. Каталог — продукти** ✅         | `products` + `product_variants`, `BelongsToTenant`, админ CRUD (list/create/edit/delete) с variants repeater, sidebar nav                                                            | Създаване/редакция/триене на продукт с вариации; изолация по магазин (404 за чужд)               |
| **2b. Каталог — категории** ✅        | `categories` (nested, parent_id) + `category_product`, админ CRUD (dialog, tree, cycle-prevention), продукт ↔ категории от продуктовата форма                                        | Влагане на подкатегории; забрана за цикли; продукт се маркира в категории                        |
| **2c. Снимки + филтри** ✅            | `product_images` (public disk) — upload/drag-drop/reorder/alt/delete; списък с продукти: search (debounced) + status филтър + sort + thumbnail                                       | Качване и подреждане на снимки; филтриране/търсене в списъка                                     |
| **2d. Колекции** ✅                   | `collections` + `collection_product` (ordered), админ CRUD, searchable product picker (`GET products/search` JSON) с reorder/remove                                                  | Създаване на колекция с подредени продукти; JSON search е scoped по магазин                      |
| **2e. Каталог — останало** (по избор) | Атрибути (Размер/Цвят → вариантна матрица + storefront филтри); CSV импорт                                                                                                           | Може да се направи и по-късно — не блокира builder-а                                             |
| **3. Theme engine** ✅                | `themes` + `ThemePresets`, редактор (color pickers, font selects, slider-и, ToggleGroup) + live `ThemePreview`, `lib/theme.ts` CSS-var pipeline, активна тема стилизира storefront-а | Смяна и редакция на тема с жив preview; storefront ползва активната тема                         |
| **4a. Page builder** ✅               | `pages` + `BlockRegistry`, 5 секции с schema, @dnd-kit drag-reorder, schema форми, `PageCanvas` жив preview с реални данни + тема, `MediaController` upload                          | Сглобяване на home страницата от секции; блоковете се пазят и рендерират в preview               |
| **5a. Storefront** ✅                 | Themed layout, home рендерира `pages.blocks` с реални данни, product listing/detail, `carts`/`cart_items` (cookie), add/update/remove                                                | Публичен магазин: разглеждане, продуктова страница, работеща количка                             |
| **6a. Checkout & поръчки** ✅         | `orders` + `order_lines` (snapshot), storefront checkout → order + token confirmation, offline плащане, админ orders list/detail + status                                            | Клиент прави поръчка end-to-end; админът я вижда и управлява                                     |
| **6b. Плащане**                       | Stripe (или друг provider), `payments` таблица, имейл потвърждения                                                                                                                   | Реално онлайн плащане                                                                            |
| **7. Клиенти, настройки, домейни** 🔨 | Клиентски акаунти ✅ (регистрация/вход/акаунт с история на поръчките, per-tenant `customer` guard), настройки за доставка/ДДС/валута ✅, custom domain — следва                      | Готов за реален магазин                                                                          |
| **8. SaaS billing**                   | Планове, Cashier абонаменти, onboarding wizard, лимити по план                                                                                                                       | Готов за реални клиенти на платформата                                                           |

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
