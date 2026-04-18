import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import { clearStorage, setSelectedWorld } from './helpers/storage';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:50164';

test.describe('lazy static data', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.goto(BASE);
    await clearStorage(page);
    await setSelectedWorld(page, 'Antica');
  });

  test('item-list.json is NOT fetched on initial page load', async ({ page }) => {
    const itemListRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/data/item-list.json')) itemListRequests.push(url);
    });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    expect(itemListRequests).toHaveLength(0);
  });

  test('static-filter-data.json files ARE preloaded on boot', async ({ page }) => {
    const preloaded = new Set<string>();
    page.on('response', (resp) => {
      const u = resp.url();
      if (u.includes('/data/vocations.json')) preloaded.add('vocations');
      if (u.includes('/data/monk-items.json')) preloaded.add('monk');
      if (u.includes('/data/delivery-items.json')) preloaded.add('delivery');
    });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    expect(preloaded.has('vocations')).toBe(true);
    expect(preloaded.has('monk')).toBe(true);
    expect(preloaded.has('delivery')).toBe(true);
  });

  test('item-list.json IS fetched after focusing the search bar', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const itemListPromise = page.waitForResponse((r) => r.url().includes('/data/item-list.json'));
    const search = page.getByPlaceholder(/search/i).first();
    await search.focus();
    const resp = await itemListPromise;
    expect(resp.status()).toBe(200);
  });

  test('static data is written to localStorage after first load', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Trigger item-list fetch too, so both caches are populated.
    const search = page.getByPlaceholder(/search/i).first();
    await search.focus();
    await page.waitForResponse((r) => r.url().includes('/data/item-list.json'));

    const [staticCache, itemListCache] = await page.evaluate(() => [
      localStorage.getItem('tibia_static_filter_data_v1'),
      localStorage.getItem('tibia_item_list_v1'),
    ]);
    expect(staticCache).not.toBeNull();
    expect(itemListCache).not.toBeNull();

    const parsedStatic = JSON.parse(staticCache!);
    expect(parsedStatic.vocations).toBeDefined();
    expect(Array.isArray(parsedStatic.monkItems)).toBe(true);
    expect(Array.isArray(parsedStatic.deliveryItems)).toBe(true);

    const parsedItems = JSON.parse(itemListCache!);
    expect(Array.isArray(parsedItems)).toBe(true);
    expect(parsedItems.length).toBeGreaterThan(1000);
  });

  test('second reload resolves from localStorage instantly (no blocking fetch)', async ({
    page,
  }) => {
    // Warm the cache.
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const search = page.getByPlaceholder(/search/i).first();
    await search.focus();
    await page.waitForResponse((r) => r.url().includes('/data/item-list.json'));

    // Confirm localStorage has both keys populated.
    const primed = await page.evaluate(() => ({
      staticKey: localStorage.getItem('tibia_static_filter_data_v1') !== null,
      itemListKey: localStorage.getItem('tibia_item_list_v1') !== null,
    }));
    expect(primed.staticKey).toBe(true);
    expect(primed.itemListKey).toBe(true);

    // Reload. Filter data must be available *synchronously* via the cache —
    // we assert by checking that loadStaticFilterData resolves before a
    // network round-trip would even begin (we block fetch and see it still
    // resolves).
    await page.route('**/data/vocations.json', () => {
      // Hang — if the cache path works, we never reach here for the initial
      // UI render; the background refresh may hang harmlessly.
    });
    await page.route('**/data/monk-items.json', () => {});
    await page.route('**/data/delivery-items.json', () => {});
    await page.route('**/data/item-list.json', () => {});

    await page.reload();
    // If the cache is working, the app renders fine even though /data is
    // blocked. We verify by checking the search bar still shows suggestions.
    await page
      .getByPlaceholder(/search/i)
      .first()
      .focus();
    await page
      .getByPlaceholder(/search/i)
      .first()
      .fill('dragon');
    await expect(page.getByText(/dragon/i).first()).toBeVisible({ timeout: 5_000 });
  });
});
