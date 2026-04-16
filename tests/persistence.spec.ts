import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import {
  clearStorage,
  setSelectedWorld,
  seedFavorites,
  seedWatchlist,
  getLocalStorage,
  setLanguageEn,
  ALERT_ANTICA_DEMON_LEGS,
} from './helpers/storage';

test.beforeEach(async ({ page }) => {
  await mockAllApis(page);
  await page.goto('/');
  await clearStorage(page);
});

test.describe('localStorage persistence', () => {
  test('selected world survives page reload', async ({ page }) => {
    await setSelectedWorld(page, 'Belobra');
    await page.reload();
    // WorldBadge in header should show Belobra
    await expect(page.getByText('Belobra').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/persistence-world.png' });
  });

  test('favorites survive page reload', async ({ page }) => {
    await seedFavorites(page, ['demon legs', 'magic sword']);
    await setSelectedWorld(page, 'Antica');
    await setLanguageEn(page);
    await page.reload();
    // Navigate directly — tab bar has tabBarShowLabel: false
    await page.goto('/watchlist');
    await page.getByText('Favorites').click();
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/persistence-favorites.png' });
  });

  test('watchlist alerts survive page reload', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS]);
    await setSelectedWorld(page, 'Antica');
    await setLanguageEn(page);
    await page.reload();
    await page.goto('/watchlist');
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/persistence-watchlist.png' });
  });

  test('app starts without errors when localStorage is empty', async ({ page }) => {
    await clearStorage(page);
    await page.reload();
    // Market screen should load without crashing — header shows "TibiaTrader"
    await expect(page.getByText('TibiaTrader').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/persistence-empty-storage.png' });
  });

  test('favoriting and unfavoriting updates localStorage correctly', async ({ page }) => {
    await setSelectedWorld(page, 'Antica');
    await setLanguageEn(page);
    await page.reload();
    await expect(page.getByText('Demon Legs')).toBeVisible();

    // Read initial state (v2 = per-world Record)
    const before = await getLocalStorage(page, 'tibia_favorites_v2');
    const beforeData: Record<string, string[]> = before ? JSON.parse(before) : {};
    expect(beforeData['Antica'] ?? []).not.toContain('demon legs');

    // Star Demon Legs using testID
    const starBtn = page.locator('[data-testid="star-demon legs"]');
    await starBtn.click({ force: true });

    const after = await getLocalStorage(page, 'tibia_favorites_v2');
    const afterData: Record<string, string[]> = after ? JSON.parse(after) : {};
    expect(afterData['Antica'] ?? []).toContain('demon legs');

    // Unstar
    await starBtn.click({ force: true });
    const final = await getLocalStorage(page, 'tibia_favorites_v2');
    const finalData: Record<string, string[]> = final ? JSON.parse(final) : {};
    expect(finalData['Antica'] ?? []).not.toContain('demon legs');
  });
});
