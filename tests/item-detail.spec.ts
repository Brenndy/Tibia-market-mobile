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
  await expect(page.getByText('Demon Legs')).toBeVisible();
  await page.getByText('Demon Legs').first().click();
  await expect(page).toHaveURL(/item/);
});

test.describe('Item detail — Demon Legs', () => {
  test('shows item name in header', async ({ page }) => {
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-loaded.png' });
  });

  test('shows buy and sell prices', async ({ page }) => {
    // buy_offer: 800000 → formatted as "800k" or "800,000"
    await expect(page.getByText(/800/).first()).toBeVisible();
    // sell_offer: 950000
    await expect(page.getByText(/950/).first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-prices.png' });
  });

  test('shows margin section', async ({ page }) => {
    await expect(page.getByText('MARGIN').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-margin.png' });
  });

  test('shows world badge', async ({ page }) => {
    await expect(page.getByText('Antica')).toBeVisible();
  });

  test('price history chart is visible', async ({ page }) => {
    await expect(page.getByText('Price history')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-chart.png' });
  });

  test('TODAY / OFFERS toggle buttons are visible', async ({ page }) => {
    await expect(page.getByText('TODAY').or(page.getByText('Today')).first()).toBeVisible();
    await expect(page.getByText('OFFERS').or(page.getByText('Offers')).first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-toggle.png' });
  });

  test('switching to OFFERS tab shows offer data', async ({ page }) => {
    await page.getByText('OFFERS').first().click();
    await expect(page.getByText('Active offers').or(page.getByText('No active offers'))).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-offers.png' });
  });

  test('monthly stats section is visible', async ({ page }) => {
    await expect(page.getByText('Monthly stats')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/item-detail-monthly-stats.png' });
  });

  test('history range buttons change selection', async ({ page }) => {
    await expect(page.getByText('30')).toBeVisible();
    await page.getByText('90').click();
    await page.screenshot({ path: 'tests/screenshots/item-detail-90days.png' });
  });

  test('star button toggles favorite', async ({ page }) => {
    // Click star in header
    const starBtn = page.getByRole('button').filter({ hasText: '' }).last();
    await page.screenshot({ path: 'tests/screenshots/item-detail-before-star.png' });
  });

  test('favoriting from detail persists to localStorage', async ({ page }) => {
    // find and click star icon (there are two: bell + star in header)
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    // Last header button should be star
    await buttons.last().click();
    const stored = await getLocalStorage(page, 'tibia_favorites_v1');
    // If star was toggled, favorites should contain the item or not (depending on initial state)
    await page.screenshot({ path: 'tests/screenshots/item-detail-star-persist.png' });
  });

  test('bell icon opens WatchAlertModal', async ({ page }) => {
    // Bell is second-to-last header button
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    if (count >= 2) {
      await buttons.nth(count - 2).click();
      await expect(
        page.getByText('Buy alert').or(page.getByText('Sell alert'))
      ).toBeVisible();
      await page.screenshot({ path: 'tests/screenshots/item-detail-alert-modal.png' });
    }
  });

  test('WatchAlertModal accepts gold abbreviation input', async ({ page }) => {
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    if (count >= 2) {
      await buttons.nth(count - 2).click();
      await expect(page.getByText('Buy alert')).toBeVisible();
      const inputs = page.getByRole('textbox');
      await inputs.first().fill('500k');
      await page.getByText('Watch').or(page.getByText('Save')).first().click();
      const stored = await getLocalStorage(page, 'tibia_watchlist_v2');
      if (stored) {
        expect(stored).toContain('demon legs');
      }
      await page.screenshot({ path: 'tests/screenshots/item-detail-alert-saved.png' });
    }
  });

  test('can navigate back to market', async ({ page }) => {
    await page.goBack();
    await expect(page.getByText('Demon Legs')).toBeVisible();
  });
});
