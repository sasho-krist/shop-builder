// Regenerates docs/screenshots/*.png for the portfolio entry.
//
//   npm i -D playwright-core          # once (uses your installed Chrome, no download)
//   composer dev                      # or: php artisan serve  (localhost:8000 must be up)
//   node scripts/portfolio-screenshots.mjs
//
// Login is the local demo store owner (maria@aura.test / password). Adjust below
// if your seed differs.

import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const ADMIN = 'http://shop-builder.localhost:8000';
const STORE = 'http://aura.shop-builder.localhost:8000';
const EMAIL = 'maria@aura.test';
const PASSWORD = 'password';
const OUT = 'docs/screenshots';

const VIEWPORT = { width: 1440, height: 900 };
const SCALE = 1.5;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    locale: 'bg-BG',
});
const page = await ctx.newPage();

const settle = async (ms = 1200) => {
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(ms);
};
const shot = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log(`✓ ${name}.png`);
};
const step = async (name, fn) => {
    try {
        await fn();
        await shot(name);
    } catch (err) {
        console.error(`✗ ${name}: ${err.message}`);
    }
};

// ── log in ──────────────────────────────────────────────────────────────────
await page.goto(`${ADMIN}/login`);
await settle();
await page.fill('input[type=email]', EMAIL);
await page.fill('input[type=password]', PASSWORD);
await page.click('button[type=submit]:has-text("Log in")');
await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
await settle();

// ── 1. page editor ──────────────────────────────────────────────────────────
await step('1-editor', async () => {
    await page.goto(`${ADMIN}/pages`);
    await settle();
    await page.locator('button:has-text("Home")').first().click();
    await settle(1600);
});

// ── 2. section library ("Add" menu) ─────────────────────────────────────────
await step('2-sections', async () => {
    await page.locator('button:has-text("Добави")').first().click();
    await page.waitForTimeout(500);
});

// ── 3. columns container editor ─────────────────────────────────────────────
await step('3-columns', async () => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.locator('button.flex-1:has-text("Колони")').first().click();
    await settle(900);
});

// ── 4. theme editor ─────────────────────────────────────────────────────────
await step('5-theme', async () => {
    await page.goto(`${ADMIN}/themes`);
    await settle();
    await page
        .locator('button:has-text("Редактирай"), button:has-text("Edit")')
        .first()
        .click();
    await settle(1400);
});

// ── 5. an existing product (options + variant matrix) ───────────────────────
await step('6-products', async () => {
    await page.goto(`${ADMIN}/products`);
    await settle();
    await page.locator('table a').first().click();
    await settle(1400);
});

// ── 6. storefront (fresh context → no owner toolbar) ────────────────────────
try {
    const anon = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: SCALE,
        locale: 'bg-BG',
    });
    const p = await anon.newPage();
    await p.goto(`${STORE}/`);
    await p.waitForLoadState('networkidle').catch(() => {});
    await p.waitForTimeout(1400);
    await p.screenshot({ path: `${OUT}/4-storefront.png` });
    await anon.close();
    console.log('✓ 4-storefront.png');
} catch (err) {
    console.error(`✗ 4-storefront: ${err.message}`);
}

await browser.close();
console.log(`\nDone → ${OUT}/`);
