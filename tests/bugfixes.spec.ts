/**
 * Regression tests for bugs found during full UI sweep on 2026-04-15.
 * See tests/screenshots/review/REPORT.md for context.
 *
 * Each test in this file pins behaviour that silently broke during that sweep
 * so we can spot regressions on both web AND Android.
 */
import { test, expect, Page } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import {
  clearStorage,
  setSelectedWorld,
  setLanguageEn,
  seedFavorites,
  getLocalStorage,
} from './helpers/storage';
import marketValues from './fixtures/market-values.json';

async function freshLoad(page: Page, path = '/') {
  await mockAllApis(page);
  await page.goto(path);
  await clearStorage(page);
  await setSelectedWorld(page, 'Antica');
  await setLanguageEn(page);
  await page.reload();
}

/**
 * BUG #1 — Alert save silent failure.
 *
 * Before fix: clicking "Watch" with both inputs empty closed the modal without
 * saving anything — because empty inputs parsed to null, which was interpreted
 * as "remove from watchlist". User thought their alert was saved.
 *
 * After fix: the button is disabled until at least one input has a positive number.
 */
test.describe('Alert modal — save validation', () => {
  test.beforeEach(async ({ page }) => {
    await freshLoad(page);
    // Land on an item detail so we can open the alert modal
    await page.goto('/item/demon%20legs?world=Antica');
    await page.waitForSelector('text=Demon Legs', { state: 'visible' });
  });

  test('Watch button is disabled with both inputs empty', async ({ page }) => {
    // Open alert modal via bell icon in header
    await page.getByText('󰂜').first().click();
    await expect(page.getByTestId('buy-alert-input')).toBeVisible();
    await expect(page.getByTestId('sell-alert-input')).toBeVisible();

    const saveBtn = page.getByTestId('watch-save-btn');
    await expect(saveBtn).toBeVisible();
    // The button should be disabled (half opacity) and clicking it is a no-op.
    await expect(saveBtn).toHaveAttribute('aria-disabled', 'true');
    await page.screenshot({ path: 'tests/screenshots/alert-modal-empty-disabled.png' });
  });

  test('Watch button with empty inputs never persists a zombie alert', async ({ page }) => {
    await page.getByText('󰂜').first().click();
    const saveBtn = page.getByTestId('watch-save-btn');
    await expect(saveBtn).toBeVisible();

    // The button is disabled — RN web translates TouchableOpacity disabled into
    // pointer-events:none, so we can't click it. Dispatch a click event directly
    // to prove the underlying handler is also a no-op (defense in depth).
    await saveBtn.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    // Give React a tick to flush any state/storage writes that shouldn't happen.
    await page.waitForTimeout(200);

    const stored = await getLocalStorage(page, 'tibia_watchlist_v2');
    expect(stored === null || stored === '[]').toBe(true);

    // Modal is still open — user wasn't fooled into thinking anything was saved.
    await expect(saveBtn).toBeVisible();
  });

  test('Watch button enables once one input has a value', async ({ page }) => {
    await page.getByText('󰂜').first().click();
    await page.getByTestId('buy-alert-input').fill('500k');

    const saveBtn = page.getByTestId('watch-save-btn');
    await expect(saveBtn).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('Saving with buy threshold only persists to localStorage', async ({ page }) => {
    await page.getByText('󰂜').first().click();
    await page.getByTestId('buy-alert-input').fill('500k');
    await page.getByTestId('watch-save-btn').click();

    // Modal closes
    await expect(page.getByTestId('buy-alert-input')).not.toBeVisible();

    const raw = await getLocalStorage(page, 'tibia_watchlist_v2');
    expect(raw).not.toBeNull();
    const list = JSON.parse(raw!);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      itemName: 'demon legs',
      world: 'Antica',
      buyAlert: 500000,
      sellAlert: null,
    });
  });

  test('Saving with sell threshold only persists to localStorage', async ({ page }) => {
    await page.getByText('󰂜').first().click();
    await page.getByTestId('sell-alert-input').fill('1.5kk');
    await page.getByTestId('watch-save-btn').click();

    const raw = await getLocalStorage(page, 'tibia_watchlist_v2');
    const list = JSON.parse(raw!);
    expect(list[0].buyAlert).toBeNull();
    expect(list[0].sellAlert).toBe(1_500_000);
  });
});

/**
 * BUG #2 — React duplicate key warning when API returns the same id twice.
 *
 * The live API occasionally returned `silver rune emblem` twice; we now dedupe
 * by id at the fetch layer. This test overrides the market_values response with
 * an explicit duplicate and asserts: (a) only one row renders and (b) no
 * "Encountered two children with the same key" error lands in the console.
 */
test.describe('Market fetch — dedupe by id', () => {
  test('duplicate ids in API response collapse into a single row', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await mockAllApis(page);
    // Override with a payload containing id=1 twice.
    const dupPayload = [marketValues[0], marketValues[0], ...marketValues.slice(1, 5)];
    await page.route('**/api/tibia/market_values**', (route) =>
      route.fulfill({ json: dupPayload })
    );

    await page.goto('/');
    await clearStorage(page);
    await setSelectedWorld(page, 'Antica');
    await setLanguageEn(page);
    await page.reload();

    // Wait for market list to render
    await page.waitForSelector('text=Demon Legs');

    // id=1 → Demon Legs; should render exactly once
    const matches = page.getByText('Demon Legs', { exact: true });
    await expect(matches).toHaveCount(1);

    // No duplicate-key React warning
    const dupKeyErrors = consoleErrors.filter((e) =>
      e.includes('Encountered two children with the same key')
    );
    expect(dupKeyErrors).toEqual([]);
  });
});

/**
 * BUG #3a — i18n: favorites count reused "alert" label.
 */
test.describe('i18n — favorites count label', () => {
  test('favorites section header uses favorite_singular/plural, not alert', async ({ page }) => {
    await freshLoad(page);
    await seedFavorites(page, ['demon legs', 'magic sword'], 'Antica');
    // Tab bar has tabBarShowLabel: false so we can't click by label — go direct.
    await page.goto('/watchlist');
    await page.getByText('Favorites', { exact: false }).first().click();

    // Section header under the world name — EN has same singular/plural form
    // but what matters is the word "favorites" (not "alerts")
    await expect(page.getByText(/2 favorites?/i).first()).toBeVisible();
    await expect(page.getByText(/2 alerts?/)).toHaveCount(0);
    await page.screenshot({ path: 'tests/screenshots/favorites-count-label.png' });
  });

  test('polish plural: 1 favorite uses singular form', async ({ page }) => {
    await freshLoad(page);
    await page.evaluate(() => localStorage.setItem('tibia_language_v1', 'pl'));
    await seedFavorites(page, ['demon legs'], 'Antica');
    await page.goto('/watchlist');
    await page.getByText('Ulubione', { exact: false }).first().click();
    await expect(page.getByText(/1 ulubiony/).first()).toBeVisible();
  });

  test('polish plural: 5 favorites uses genitive many form', async ({ page }) => {
    await freshLoad(page);
    await page.evaluate(() => localStorage.setItem('tibia_language_v1', 'pl'));
    await seedFavorites(page, ['a', 'b', 'c', 'd', 'e'], 'Antica');
    await page.goto('/watchlist');
    await page.getByText('Ulubione', { exact: false }).first().click();
    await expect(page.getByText(/5 ulubionych/).first()).toBeVisible();
  });
});

/**
 * BUG #3b — world-select header used lower-cased title as plural label,
 * rendering "105 select world". Now uses proper pluralized noun.
 */
test.describe('i18n — world-select header count', () => {
  test('English: count label reads "N worlds"', async ({ page }) => {
    await freshLoad(page);
    await page.goto('/world-select');
    const count = page.getByTestId('worlds-count');
    await expect(count).toBeVisible();
    const text = await count.innerText();
    expect(text).toMatch(/^\d+\s+world(s)?$/);
    // The old bug produced "N select world" — make sure we don't regress
    expect(text.toLowerCase()).not.toContain('select world');
  });

  test('Polish: count label uses świat/światy/światów', async ({ page }) => {
    await freshLoad(page);
    await page.evaluate(() => localStorage.setItem('tibia_language_v1', 'pl'));
    await page.goto('/world-select');
    const count = page.getByTestId('worlds-count');
    await expect(count).toBeVisible();
    const text = await count.innerText();
    expect(text).toMatch(/^\d+\s+(świat|światy|światów)$/);
  });
});
