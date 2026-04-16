import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import {
  clearStorage,
  setSelectedWorld,
  seedFavorites,
  seedWatchlist,
  getLocalStorage,
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
    await page.reload();
    await setSelectedWorld(page, 'Antica');
    await page.reload();
    // Go to Favorites tab
    await page.getByText('Alerts').click();
    await page.getByText('Favorites').click();
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/persistence-favorites.png' });
  });

  test('watchlist alerts survive page reload', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS]);
    await setSelectedWorld(page, 'Antica');
    await page.reload();
    await page.getByText('Alerts').click();
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/persistence-watchlist.png' });
  });

  test('app starts without errors when localStorage is empty', async ({ page }) => {
    await clearStorage(page);
    await page.reload();
    // Market screen should load without crashing
    await expect(page.getByText('Market').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/persistence-empty-storage.png' });
  });

  test('favoriting and unfavoriting updates localStorage correctly', async ({ page }) => {
    await setSelectedWorld(page, 'Antica');
    await page.reload();
    await expect(page.getByText('Demon Legs')).toBeVisible();

    // Read initial state
    const before = await getLocalStorage(page, 'tibia_favorites_v1');
    const beforeList: string[] = before ? JSON.parse(before) : [];
    expect(beforeList).not.toContain('demon legs');

    // Star Demon Legs
    const card = page.locator('text=Demon Legs').locator('../../../..');
    await card.getByRole('button').first().click();

    const after = await getLocalStorage(page, 'tibia_favorites_v1');
    const afterList: string[] = after ? JSON.parse(after) : [];
    expect(afterList).toContain('demon legs');

    // Unstar
    await card.getByRole('button').first().click();
    const final = await getLocalStorage(page, 'tibia_favorites_v1');
    const finalList: string[] = final ? JSON.parse(final) : [];
    expect(finalList).not.toContain('demon legs');
  });
});
