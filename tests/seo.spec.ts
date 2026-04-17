import { test, expect, Page } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import { clearStorage, setSelectedWorld, setLanguageEn } from './helpers/storage';

// Guardrail: per-route <title> / description / canonical land in the DOM via
// RouteSEO (src/components/SEOHead.tsx) mounted in app/_layout.tsx. If someone
// moves Helmet calls back into screens, or drops an entry from STATIC_ROUTES,
// these assertions will flag it.
//
// Note: Playwright runs against `expo start --web` (dev server), which serves
// a minimal HTML shell — global tags from +html.tsx only exist in the static
// production build. This spec therefore verifies Helmet output only.
// Production tags are covered by the prod smoke test (manual / CI curl).

test.beforeEach(async ({ page }) => {
  await mockAllApis(page);
  await page.goto('/');
  await clearStorage(page);
  await setSelectedWorld(page, 'Antica');
  await setLanguageEn(page);
});

// Helmet updates the existing <title> text rather than inserting a new element,
// so we wait for a tag Helmet *does* insert (canonical link) to know it ran.
async function waitForHelmet(page: Page): Promise<void> {
  await page.waitForSelector('link[rel="canonical"][data-rh="true"]', {
    state: 'attached',
    timeout: 15_000,
  });
}

async function helmetAttr(page: Page, selector: string, attr: string): Promise<string> {
  await page.waitForSelector(`${selector}[data-rh="true"]`, {
    state: 'attached',
    timeout: 15_000,
  });
  return (await page.locator(`${selector}[data-rh="true"]`).getAttribute(attr)) ?? '';
}

test.describe('SEO — per-route head tags', () => {
  test('homepage has brand title, description and canonical', async ({ page }) => {
    await page.goto('/');
    await waitForHelmet(page);

    await expect(page).toHaveTitle(/TibiaTrader.*Live Tibia market prices/, { timeout: 10_000 });

    const d = await helmetAttr(page, 'meta[name="description"]', 'content');
    expect(d.length).toBeGreaterThan(50);
    expect(d.toLowerCase()).toContain('tibia');

    expect(await helmetAttr(page, 'link[rel="canonical"]', 'href')).toBe(
      'https://tibiatrader.com/',
    );
  });

  test('watchlist has its own title and canonical', async ({ page }) => {
    await page.goto('/watchlist');
    await waitForHelmet(page);

    await expect(page).toHaveTitle(/watchlist.*TibiaTrader/i, { timeout: 10_000 });

    const d = await helmetAttr(page, 'meta[name="description"]', 'content');
    expect(d).toMatch(/alert/i);

    expect(await helmetAttr(page, 'link[rel="canonical"]', 'href')).toBe(
      'https://tibiatrader.com/watchlist',
    );
  });

  test('statistics has its own title and canonical', async ({ page }) => {
    await page.goto('/statistics');
    await waitForHelmet(page);

    await expect(page).toHaveTitle(/statistics|stats/i, { timeout: 10_000 });
    await expect(page).toHaveTitle(/TibiaTrader/);

    expect(await helmetAttr(page, 'link[rel="canonical"]', 'href')).toBe(
      'https://tibiatrader.com/statistics',
    );
  });

  test('world-select has its own title and canonical', async ({ page }) => {
    await page.goto('/world-select');
    await waitForHelmet(page);

    await expect(page).toHaveTitle(/world/i, { timeout: 10_000 });
    await expect(page).toHaveTitle(/TibiaTrader/);

    expect(await helmetAttr(page, 'link[rel="canonical"]', 'href')).toBe(
      'https://tibiatrader.com/world-select',
    );
  });

  test('item page emits item name in title and canonical', async ({ page }) => {
    // URL path segment is URL-encoded; RouteSEO decodes it and Title-Cases.
    await page.goto('/item/demon%20legs');
    await waitForHelmet(page);

    await expect(page).toHaveTitle(/demon legs/i, { timeout: 10_000 });
    await expect(page).toHaveTitle(/TibiaTrader/);

    const canonicalHref = await helmetAttr(page, 'link[rel="canonical"]', 'href');
    expect(canonicalHref).toContain('/item/');
    expect(canonicalHref).toMatch(/demon(%20|\s)legs/i);
  });

  test('canonical never contains the (tabs) group', async ({ page }) => {
    for (const path of ['/', '/watchlist', '/statistics']) {
      await page.goto(path);
      await waitForHelmet(page);
      expect(await helmetAttr(page, 'link[rel="canonical"]', 'href')).not.toContain('(tabs)');
    }
  });

  test('og:title mirrors title and og:url mirrors canonical', async ({ page }) => {
    await page.goto('/watchlist');
    await waitForHelmet(page);

    const currentTitle = await page.title();
    expect(await helmetAttr(page, 'meta[property="og:title"]', 'content')).toBe(currentTitle);

    const cUrl = await helmetAttr(page, 'link[rel="canonical"]', 'href');
    expect(await helmetAttr(page, 'meta[property="og:url"]', 'content')).toBe(cUrl);
  });
});

test.describe('SEO — Polish (?lang=pl) landings', () => {
  test('homepage with ?lang=pl has Polish title and self-referencing canonical', async ({
    page,
  }) => {
    await page.goto('/?lang=pl');
    await waitForHelmet(page);

    // Polish homepage title contains "Ceny" (Prices) — a Polish-only word that
    // wouldn't appear in any EN variant.
    await expect(page).toHaveTitle(/Ceny/, { timeout: 10_000 });
    await expect(page).toHaveTitle(/TibiaTrader/);

    const d = await helmetAttr(page, 'meta[name="description"]', 'content');
    expect(d).toMatch(/Przeglądaj|Tibii/);

    // Canonical for PL landing self-references with the lang param so Google
    // treats it as a distinct URL from the EN root.
    expect(await helmetAttr(page, 'link[rel="canonical"]', 'href')).toBe(
      'https://tibiatrader.com/?lang=pl',
    );

    expect(await helmetAttr(page, 'meta[property="og:locale"]', 'content')).toBe('pl_PL');
  });

  test('watchlist with ?lang=pl has Polish title', async ({ page }) => {
    await page.goto('/watchlist?lang=pl');
    await waitForHelmet(page);

    await expect(page).toHaveTitle(/Obserwowane|Alerty/, { timeout: 10_000 });
    expect(await helmetAttr(page, 'link[rel="canonical"]', 'href')).toBe(
      'https://tibiatrader.com/watchlist?lang=pl',
    );
  });

  test('EN default (no lang param) emits og:locale=en_US', async ({ page }) => {
    await page.goto('/');
    await waitForHelmet(page);
    expect(await helmetAttr(page, 'meta[property="og:locale"]', 'content')).toBe('en_US');
  });
});

test.describe('SEO — hreflang alternates', () => {
  async function hreflangHref(page: Page, lang: string): Promise<string> {
    const sel = `link[rel="alternate"][hreflang="${lang}"][data-rh="true"]`;
    await page.waitForSelector(sel, { state: 'attached', timeout: 15_000 });
    return (await page.locator(sel).getAttribute('href')) ?? '';
  }

  test('homepage emits self-referencing hreflang pair', async ({ page }) => {
    await page.goto('/');
    await waitForHelmet(page);
    expect(await hreflangHref(page, 'en')).toBe('https://tibiatrader.com/');
    expect(await hreflangHref(page, 'pl')).toBe('https://tibiatrader.com/?lang=pl');
    expect(await hreflangHref(page, 'x-default')).toBe('https://tibiatrader.com/');
  });

  test('subpage hreflang points at the same subpage, not homepage', async ({ page }) => {
    await page.goto('/watchlist');
    await waitForHelmet(page);
    expect(await hreflangHref(page, 'en')).toBe('https://tibiatrader.com/watchlist');
    expect(await hreflangHref(page, 'pl')).toBe('https://tibiatrader.com/watchlist?lang=pl');
    expect(await hreflangHref(page, 'x-default')).toBe('https://tibiatrader.com/watchlist');
  });

  test('item page hreflang preserves the item slug', async ({ page }) => {
    await page.goto('/item/demon%20legs');
    await waitForHelmet(page);
    expect(await hreflangHref(page, 'en')).toBe('https://tibiatrader.com/item/demon%20legs');
    expect(await hreflangHref(page, 'pl')).toBe(
      'https://tibiatrader.com/item/demon%20legs?lang=pl',
    );
  });

  test('Polish landing still points hreflang=en at the EN URL (no self-ref to PL)', async ({
    page,
  }) => {
    await page.goto('/watchlist?lang=pl');
    await waitForHelmet(page);
    expect(await hreflangHref(page, 'en')).toBe('https://tibiatrader.com/watchlist');
    expect(await hreflangHref(page, 'pl')).toBe('https://tibiatrader.com/watchlist?lang=pl');
  });
});

test.describe('SEO — BreadcrumbList JSON-LD', () => {
  async function breadcrumbJson(page: Page): Promise<{
    '@type': string;
    itemListElement: { position: number; name: string; item: string }[];
  } | null> {
    // Helmet emits the script with data-rh="true"; +html.tsx has its own
    // WebApplication JSON-LD without that attribute, so the selector below
    // picks only the route-driven BreadcrumbList.
    const handle = page.locator('script[type="application/ld+json"][data-rh="true"]');
    const count = await handle.count();
    if (count === 0) return null;
    const text = await handle.first().textContent();
    return text ? JSON.parse(text) : null;
  }

  test('homepage has no BreadcrumbList (single-crumb is useless)', async ({ page }) => {
    await page.goto('/');
    await waitForHelmet(page);
    expect(await breadcrumbJson(page)).toBeNull();
  });

  test('watchlist emits Home → Watchlist breadcrumbs', async ({ page }) => {
    await page.goto('/watchlist');
    await waitForHelmet(page);
    const data = await breadcrumbJson(page);
    expect(data?.['@type']).toBe('BreadcrumbList');
    expect(data?.itemListElement).toHaveLength(2);
    expect(data?.itemListElement[0].name).toBe('Home');
    expect(data?.itemListElement[1].name).toBe('Watchlist');
    expect(data?.itemListElement[1].item).toBe('https://tibiatrader.com/watchlist');
  });

  test('item page emits Home → Market → Item breadcrumbs', async ({ page }) => {
    await page.goto('/item/demon%20legs');
    await waitForHelmet(page);
    const data = await breadcrumbJson(page);
    expect(data?.itemListElement).toHaveLength(3);
    expect(data?.itemListElement[2].name).toBe('Demon Legs');
    expect(data?.itemListElement[2].item).toBe('https://tibiatrader.com/item/demon%20legs');
  });

  test('Polish landing emits Polish breadcrumb labels', async ({ page }) => {
    await page.goto('/watchlist?lang=pl');
    await waitForHelmet(page);
    const data = await breadcrumbJson(page);
    expect(data?.itemListElement[0].name).toBe('Strona główna');
    expect(data?.itemListElement[1].name).toBe('Obserwowane');
  });
});
