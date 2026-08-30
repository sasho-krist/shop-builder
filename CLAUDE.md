# Shop Builder — CLAUDE.md

Multi-tenant SaaS платформа за създаване на онлайн магазини. Всеки потребител
получава магазин на поддомейн и го управлява през визуален админ панел.

**Пълен план:** [`docs/PLAN.md`](docs/PLAN.md)

## Технологичен стек

- **Backend:** Laravel 13, PHP 8.3
- **Admin frontend:** Inertia.js v3 + React 19 + TypeScript (Laravel React starter kit)
- **UI:** shadcn/ui (Radix) + Tailwind CSS 4 + lucide-react
- **Storefront:** React + Inertia SSR, тема от дизайн токени → CSS custom properties
- **БД:** MySQL/MariaDB — база `shop_builder`, engine **InnoDB** (задължително — WAMP
  по подразбиране е MyISAM; виж `config/database.php` `DB_ENGINE`)
- **Auth:** Laravel Fortify
- **Тестове:** Pest 4, Larastan (PHPStan), Pint

## Работна директория (Windows)

```
C:\wamp64\www\shop-builder\
```

PHP: `php`, Artisan: `php artisan`. Shell-ът е PowerShell — Bash tool-ът има fork
проблеми в тази среда, ползвай PowerShell.

## Основни команди

```bash
composer run dev          # PHP server + queue + Vite наведнъж
npm run build             # build на frontend assets
npm run dev               # само Vite
composer run test         # Pint + PHPStan + Pest — преди commit
vendor/bin/pint           # форматиране
vendor/bin/phpstan        # статичен анализ
php artisan test          # само тестове
```

## Локална среда

- URL: `http://shop-builder.test` (добави в hosts файла)
- Поддомейни за магазини: `*.shop-builder.test`
- `APP_CENTRAL_DOMAIN` в `.env` държи root домейна за tenant резолюция

## Код конвенции

- PHPStan (Larastan) — строга типизация; не добавяй `@phpstan-ignore` без причина
- Pint preset `laravel` — автоматично форматиране
- Без коментари освен ако WHY е неочевиден
- Без backward-compat hacks — изтривай мъртъв код директно
- Мулти-tenant: всеки shop-owned модел ползва `BelongsToTenant` trait

## Git workflow

Branches: `main`. Feature branch + Pull Request.

### Claude Code / AI агенти — забрана за git операции по запис

Claude **НЕ** трябва да прави `git checkout -b` на нов бранч, `git commit`,
`git push` или Pull Request, освен ако потребителят изрично не поиска това в
конкретния момент. Промените се оставят некомитнати за преглед. Важи за всички
задачи в това repo.
