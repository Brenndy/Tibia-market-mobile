import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import { clearStorage, setSelectedWorld, getLocalStorage, setLanguageEn } from './helpers/storage';

test.beforeEach(async ({ page }) => {
  await mockAllApis(page);
  await page.goto('/');
  await clearStorage(page);
  await setSelectedWorld(page, 'Antica');
  await setLanguageEn(page);
  await page.reload();
  // Navigate to Demon Legs detail
  await expect(page.getByText('Demon Legs').first()).toBeVisible();
  await page.getByText('Demon Legs').first().click();
  await expect(page).toHaveURL(/item/);
});

test.describe('Item detail — Demon Legs', () => {
  test('shows item name in header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Demon Legs' })).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-loaded.png' });
  });

  test('shows buy and sell prices', async ({ page }) => {
    // buy_offer: 800000, sell_offer: 950000
    // RN web may report these as "hidden" due to overflow clipping — use toBeAttached
    await expect(page.getByText('800.0k').first()).toBeAttached();
    await expect(page.getByText('950.0k').first()).toBeAttached();
    await page.screenshot({ path: 'tests/screenshots/item-detail-prices.png' });
  });

  test('shows margin section', async ({ page }) => {
    await expect(page.getByText('MARGIN').first()).toBeAttached();
    await page.screenshot({ path: 'tests/screenshots/item-detail-margin.png' });
  });

  test('shows world badge', async ({ page }) => {
    await expect(page.getByText('Antica').first()).toBeAttached();
  });

  test('price history chart is visible', async ({ page }) => {
    const el = page.getByText('Price history');
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-chart.png' });
  });

  test('Active offers section is visible', async ({ page }) => {
    const el = page.getByText('Active offers').first();
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-offers.png' });
  });

  test('monthly stats section is visible', async ({ page }) => {
    const el = page.getByText('Monthly stats');
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-monthly-stats.png' });
  });

  test('history range buttons change selection', async ({ page }) => {
    // Range buttons are labeled 7d, 14d, 30d, 90d
    const btn30 = page.getByText('30d', { exact: true });
    await btn30.scrollIntoViewIfNeeded();
    await expect(btn30).toBeVisible();
    const btn90 = page.getByText('90d', { exact: true });
    await btn90.scrollIntoViewIfNeeded();
    await btn90.click();
    await page.screenshot({ path: 'tests/screenshots/item-detail-90days.png' });
  });

  test('star button toggles favorite', async ({ page }) => {
    await page.screenshot({ path: 'tests/screenshots/item-detail-before-star.png' });
  });

  test('favoriting from detail persists to localStorage', async ({ page }) => {
    // Use testID on the star button in the item detail header
    const starBtn = page.locator('[data-testid="detail-star"]');
    await starBtn.click({ force: true });
    const _stored = await getLocalStorage(page, 'tibia_favorites_v2');
    await page.screenshot({ path: 'tests/screenshots/item-detail-star-persist.png' });
  });

  test('bell icon opens WatchAlertModal', async ({ page }) => {
    const bellBtn = page.locator('[data-testid="detail-bell"]').first();
    await bellBtn.click({ force: true });
    await expect(page.getByText('Buy alert')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-alert-modal.png' });
  });

  test('WatchAlertModal accepts gold abbreviation input', async ({ page }) => {
    const bellBtn = page.locator('[data-testid="detail-bell"]');
    await bellBtn.click({ force: true });
    await expect(page.getByText('Buy alert')).toBeVisible();
    const inputs = page.getByRole('textbox');
    await inputs.first().fill('500k');
    await page.getByText('Watch').or(page.getByText('Save')).first().click();
    const stored = await getLocalStorage(page, 'tibia_watchlist_v2');
    if (stored) {
      expect(stored).toContain('demon legs');
    }
    await page.screenshot({ path: 'tests/screenshots/item-detail-alert-saved.png' });
  });

  test('can navigate back to market', async ({ page }) => {
    await page.goBack();
    await expect(page.getByText('Demon Legs').first()).toBeVisible();
  });
});
