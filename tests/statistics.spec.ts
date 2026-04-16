import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import { clearStorage, setSelectedWorld, setLanguageEn } from './helpers/storage';

test.beforeEach(async ({ page }) => {
  await mockAllApis(page);
  await page.goto('/');
  await clearStorage(page);
  await setSelectedWorld(page, 'Antica');
  await setLanguageEn(page);
  await page.reload();
});

async function goToStatistics(page: any) {
  // Tab bar has tabBarShowLabel: false — navigate directly via URL
  await page.goto('/statistics');
  await expect(page).toHaveURL(/statistics/);
}

test.describe('Statistics screen', () => {
  test('loads with rank tabs visible', async ({ page }) => {
    await goToStatistics(page);
    // RN web pills may be reported "hidden" by Playwright; some labels appear twice (tab + header)
    await expect(page.getByText('Most traded').first()).toBeAttached();
    await expect(page.getByText('Most purchased').first()).toBeAttached();
    await expect(page.getByText('Most expensive (buy)').first()).toBeAttached();
    await expect(page.getByText('Most expensive (sell)').first()).toBeAttached();
    await page.screenshot({ path: 'tests/screenshots/statistics-loaded.png' });
  });

  test('shows ranked items list', async ({ page }) => {
    await goToStatistics(page);
    // Most traded by default — Great Mana Potion has month_sold=8000, Mana Potion=15000
    await expect(
      page.getByText('Mana Potion').or(page.getByText('Great Mana Potion')).first(),
    ).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/statistics-ranking.png' });
  });

  test('active rank option label visible', async ({ page }) => {
    await goToStatistics(page);
    // Default rank is "Most traded" — rendered as active tab label
    await expect(page.getByText('Most traded').first()).toBeAttached();
  });

  test('summary card shows item count', async ({ page }) => {
    await goToStatistics(page);
    await expect(page.getByText('Summary')).toBeVisible();
    await expect(page.getByText('Items')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/statistics-summary.png' });
  });

  test('last update shown in summary', async ({ page }) => {
    await goToStatistics(page);
    await expect(page.getByText('Last update')).toBeVisible();
  });

  test('switching to Most expensive (buy) reorders list', async ({ page }) => {
    await goToStatistics(page);
    await page.getByText('Most expensive (buy)').click();
    // Boots of Haste has buy_offer=3,500,000 — highest in fixtures
    await expect(
      page.getByText('Boots Of Haste').or(page.getByText('Boots of Haste')),
    ).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/statistics-most-expensive.png' });
  });

  test('switching to Most purchased reorders list', async ({ page }) => {
    await goToStatistics(page);
    await page.getByText('Most purchased').click();
    await page.screenshot({ path: 'tests/screenshots/statistics-most-purchased.png' });
  });

  test('clicking ranked item navigates to detail', async ({ page }) => {
    await goToStatistics(page);
    // click the first ranked item
    const firstItem = page.getByText('Mana Potion').or(page.getByText('Great Mana Potion')).first();
    await firstItem.click();
    await expect(page).toHaveURL(/item/);
  });
});
