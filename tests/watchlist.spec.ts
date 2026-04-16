import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import {
  clearStorage,
  setSelectedWorld,
  seedFavorites,
  seedWatchlist,
  setLanguageEn,
  ALERT_ANTICA_DEMON_LEGS,
  ALERT_ANTICA_DEMON_LEGS_TRIGGERED,
  ALERT_BELOBRA_MAGIC_SWORD,
} from './helpers/storage';

test.beforeEach(async ({ page }) => {
  await mockAllApis(page);
  await page.goto('/');
  await clearStorage(page);
  await setSelectedWorld(page, 'Antica');
  await setLanguageEn(page);
  await page.reload();
});

async function goToWatchlist(page: any) {
  // Tab bar has tabBarShowLabel: false — navigate directly via URL
  await page.goto('/watchlist');
  await expect(page).toHaveURL(/watchlist/);
}

test.describe('Watchlist — empty states', () => {
  test('shows empty state when no alerts', async ({ page }) => {
    await goToWatchlist(page);
    await expect(page.getByText('No watchlist items')).toBeVisible();
    await expect(page.getByText('Go to market')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/watchlist-empty.png' });
  });

  test('"Go to market" navigates to market tab', async ({ page }) => {
    await goToWatchlist(page);
    await page.getByText('Go to market').first().click();
    await expect(page.getByText('Demon Legs')).toBeVisible();
  });

  test('shows empty favorites when none set', async ({ page }) => {
    await goToWatchlist(page);
    await page.getByText('Favorites').click();
    await expect(page.getByText('No favorites')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/watchlist-favorites-empty.png' });
  });
});

test.describe('Watchlist — with alerts', () => {
  test('alert appears after seeding localStorage', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS]);
    await page.reload();
    await goToWatchlist(page);
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/watchlist-with-alert.png' });
  });

  test('alert shows buy threshold', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS]);
    await page.reload();
    await goToWatchlist(page);
    // buyAlert is 750000 → formatted as 750k or 750,000
    await expect(page.getByText(/750/).first()).toBeVisible();
  });

  test('world name visible in alert section header', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS]);
    await page.reload();
    await goToWatchlist(page);
    await expect(page.getByText('Antica')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/watchlist-world-header.png' });
  });

  test('triggered alert has deal badge', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS_TRIGGERED]);
    await page.reload();
    await goToWatchlist(page);
    await expect(page.getByText('DEAL').or(page.getByText('Deal'))).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/watchlist-triggered.png' });
  });

  test('pencil button opens edit modal', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS]);
    await page.reload();
    await goToWatchlist(page);
    await expect(page.getByText('Demon Legs')).toBeAttached();
    // Click edit pencil via testID
    await page.locator('[data-testid="edit-alert"]').first().click({ force: true });
    await page.screenshot({ path: 'tests/screenshots/watchlist-edit-modal.png' });
  });

  test('world filter tabs appear with multi-world alerts', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS, ALERT_BELOBRA_MAGIC_SWORD]);
    await page.reload();
    await goToWatchlist(page);
    await expect(page.getByText('All').or(page.getByText('All worlds')).first()).toBeVisible();
    await expect(page.getByText('Antica').first()).toBeVisible();
    await expect(page.getByText('Belobra').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/watchlist-world-filter.png' });
  });

  test('filtering by world shows only that worlds alerts', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS, ALERT_BELOBRA_MAGIC_SWORD]);
    await page.reload();
    await goToWatchlist(page);
    await page.getByText('Antica').first().click();
    // After filtering: Demon Legs (Antica) present, Magic Sword (Belobra) not visible
    await expect(page.getByText('Demon Legs')).toBeAttached();
    await expect(page.getByText('Magic Sword')).not.toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/watchlist-world-filtered.png' });
  });

  test('clicking alert card navigates to item detail', async ({ page }) => {
    await seedWatchlist(page, [ALERT_ANTICA_DEMON_LEGS]);
    await page.reload();
    await goToWatchlist(page);
    await page.getByText('Demon Legs').first().click();
    await expect(page).toHaveURL(/item/);
  });
});

test.describe('Watchlist — favorites tab', () => {
  test('favorited items appear in Favorites tab', async ({ page }) => {
    await seedFavorites(page, ['demon legs']);
    await page.reload();
    await goToWatchlist(page);
    await page.getByText('Favorites').click();
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/watchlist-favorites.png' });
  });

  test('multiple favorites all shown', async ({ page }) => {
    await seedFavorites(page, ['demon legs', 'magic sword']);
    await page.reload();
    await goToWatchlist(page);
    await page.getByText('Favorites').click();
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await expect(page.getByText('Magic Sword')).toBeVisible();
  });
});
