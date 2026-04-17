import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import { clearStorage, setSelectedWorld, setLanguageEn, getLocalStorage } from './helpers/storage';

test.beforeEach(async ({ page }) => {
  await mockAllApis(page);
  await page.goto('/');
  await clearStorage(page);
  await setSelectedWorld(page, 'Antica');
  await setLanguageEn(page);
  await page.reload();
});

test.describe('Desktop sidebar — collapse/expand', () => {
  test.skip(
    ({ viewport }) => !viewport || viewport.width < 900,
    'desktop-only: sidebar only renders above 900px breakpoint',
  );

  test('defaults to expanded — brand text visible, toggle present', async ({ page }) => {
    await expect(page.getByText('TibiaTrader')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-toggle"]')).toBeVisible();
  });

  test('clicking toggle collapses sidebar and persists the preference', async ({ page }) => {
    await page.locator('[data-testid="sidebar-toggle"]').click();
    await expect(page.getByText('TibiaTrader')).not.toBeVisible();
    // Market label is hidden in collapsed mode (icon-only)
    await expect(page.getByText('Market', { exact: true })).not.toBeVisible();
    const stored = await getLocalStorage(page, 'tibia_sidebar_collapsed_v1');
    expect(stored).toBe('1');
  });

  test('collapsed state survives a reload', async ({ page }) => {
    await page.locator('[data-testid="sidebar-toggle"]').click();
    await expect(page.getByText('TibiaTrader')).not.toBeVisible();
    await page.reload();
    await expect(page.getByText('TibiaTrader')).not.toBeVisible();
  });

  test('clicking toggle again re-expands sidebar', async ({ page }) => {
    const toggle = page.locator('[data-testid="sidebar-toggle"]');
    await toggle.click();
    await expect(page.getByText('TibiaTrader')).not.toBeVisible();
    await toggle.click();
    await expect(page.getByText('TibiaTrader')).toBeVisible();
    const stored = await getLocalStorage(page, 'tibia_sidebar_collapsed_v1');
    expect(stored).toBe('0');
  });

  test('nav icons remain clickable in collapsed mode', async ({ page }) => {
    await page.locator('[data-testid="sidebar-toggle"]').click();
    // Click the Alerts nav item by accessibility label
    await page.getByLabel('Alerts').first().click();
    await expect(page).toHaveURL(/watchlist/);
  });
});
