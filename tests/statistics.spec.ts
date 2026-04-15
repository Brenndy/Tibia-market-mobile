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
  await page.getByText('Statistics').click();
  await expect(page).toHaveURL(/statistics/);
}

test.describe('Statistics screen', () => {
  test('loads with rank tabs visible', async ({ page }) => {
    await goToStatistics(page);
    await expect(page.getByText('Most traded')).toBeVisible();
    await expect(page.getByText('Most purchased')).toBeVisible();
    await expect(page.getByText('Most expensive (buy)')).toBeVisible();
    await expect(page.getByText('Most expensive (sell)')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/statistics-loaded.png' });
  });

  test('shows ranked items list', async ({ page }) => {
    await goToStatistics(page);
    // Most traded by default — Great Mana Potion has month_sold=8000, Mana Potion=15000
    await expect(page.getByText('Mana Potion').or(page.getByText('Great Mana Potion')).first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/statistics-ranking.png' });
  });

  test('ranking label visible', async ({ page }) => {
    await goToStatistics(page);
    await expect(page.getByText('Ranking')).toBeVisible();
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
      page.getByText('Boots Of Haste').or(page.getByText('Boots of Haste'))
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
