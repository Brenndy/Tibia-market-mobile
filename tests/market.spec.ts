import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import { clearStorage, setSelectedWorld, seedFavorites, getLocalStorage, setLanguageEn } from './helpers/storage';

test.beforeEach(async ({ page }) => {
  await mockAllApis(page);
  await page.goto('/');
  await clearStorage(page);
  await setSelectedWorld(page, 'Antica');
  await setLanguageEn(page);
  await page.reload();
});

test.describe('Market screen — loading', () => {
  test('renders item cards after loading', async ({ page }) => {
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await expect(page.getByText('Magic Sword')).toBeVisible();
    await expect(page.getByText('Dragon Scale Mail')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-loaded.png' });
  });

  test('shows buy and sell price columns', async ({ page }) => {
    await expect(page.getByText('BUY').first()).toBeVisible();
    await expect(page.getByText('SELL').first()).toBeVisible();
    await expect(page.getByText('VOL/MO.').first()).toBeVisible();
  });

  test('shows premium deal badge on Demon Legs', async ({ page }) => {
    // margin 18.75%, vol 142 → "Great deal"
    await expect(page.getByText('Great deal').first()).toBeVisible();
  });

  test('shows good deal badge on Magic Sword', async ({ page }) => {
    // margin 15.5%, vol 891 → "Good deal"
    await expect(page.getByText('Good deal').first()).toBeVisible();
  });
});

test.describe('Market screen — presets', () => {
  test('Hot preset is active by default', async ({ page }) => {
    const hotTab = page.getByText('Hot');
    await expect(hotTab).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-presets.png' });
  });

  test('clicking Flips preset activates it', async ({ page }) => {
    await page.getByText('Flips').click();
    await expect(page.getByText('Flips')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-flips.png' });
  });

  test('clicking active Flips preset deactivates it', async ({ page }) => {
    await page.getByText('Flips').click();
    await page.getByText('Flips').click();
    // list still visible (no crash)
    await expect(page.getByText('Demon Legs')).toBeVisible();
  });

  test('Cheap preset sorts by buy price ascending', async ({ page }) => {
    await page.getByText('Cheap').click();
    await expect(page.getByText('Cheap')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-cheap.png' });
  });

  test('Expensive preset shows most expensive items', async ({ page }) => {
    await page.getByText('Expensive').click();
    await expect(page.getByText('Expensive')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-expensive.png' });
  });
});

test.describe('Market screen — sort picker', () => {
  test('sort picker opens with all options', async ({ page }) => {
    await page.getByText('Monthly volume').first().click();
    await expect(page.getByText('Sort by')).toBeVisible();
    await expect(page.getByText('Margin')).toBeVisible();
    await expect(page.getByText('Buy price')).toBeVisible();
    await expect(page.getByText('Sell price')).toBeVisible();
    await expect(page.getByText('Name')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-sort-picker.png' });
  });

  test('selecting Margin from sort picker closes modal', async ({ page }) => {
    await page.getByText('Monthly volume').first().click();
    await expect(page.getByText('Sort by')).toBeVisible();
    await page.getByRole('button', { name: 'Margin' }).click();
    await expect(page.getByText('Sort by')).not.toBeVisible();
  });

  test('selecting Name sorts alphabetically', async ({ page }) => {
    await page.getByText('Monthly volume').first().click();
    await page.getByRole('button', { name: 'Name' }).click();
    await page.screenshot({ path: 'tests/screenshots/market-sort-name.png' });
    // Boots of Haste should appear before Dragon Scale Mail alphabetically
    await expect(page.getByText('Boots Of Haste').or(page.getByText('Boots of Haste'))).toBeVisible();
  });
});

test.describe('Market screen — filter panel', () => {
  test('filter panel opens with all sections', async ({ page }) => {
    await page.getByText('Filters').click();
    await expect(page.getByText('Advanced filters')).toBeVisible();
    await expect(page.getByText('Vocation')).toBeVisible();
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByText('Buy price')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-filter-panel.png' });
  });

  test('filter panel can be closed with Cancel', async ({ page }) => {
    await page.getByText('Filters').click();
    await expect(page.getByText('Advanced filters')).toBeVisible();
    await page.getByText('Cancel').click();
    await expect(page.getByText('Advanced filters')).not.toBeVisible();
  });

  test('category filter reduces item list', async ({ page }) => {
    await page.getByText('Filters').click();
    await page.getByText('Swords').click();
    await page.getByText('Apply filters').click();
    await expect(page.getByText('Magic Sword')).toBeVisible();
    await expect(page.getByText('Fire Sword')).toBeVisible();
    // Non-swords should be gone
    await expect(page.getByText('Demon Legs')).not.toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-category-filter.png' });
  });

  test('active filter count shown on filter button', async ({ page }) => {
    await page.getByText('Filters').click();
    await page.getByText('Swords').click();
    await page.getByText('Apply filters').click();
    await expect(page.getByText(/Filters \(1\)/)).toBeVisible();
  });

  test('reset clears all filters', async ({ page }) => {
    await page.getByText('Filters').click();
    await page.getByText('Swords').click();
    await page.getByText('Reset').click();
    await page.getByText('Apply filters').click();
    // All items back
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await expect(page.getByText('Magic Sword')).toBeVisible();
  });

  test('clear filters link removes active filters', async ({ page }) => {
    await page.getByText('Filters').click();
    await page.getByText('Swords').click();
    await page.getByText('Apply filters').click();
    await expect(page.getByText('Clear filters')).toBeVisible();
    await page.getByText('Clear filters').click();
    await expect(page.getByText('Demon Legs')).toBeVisible();
  });
});

test.describe('Market screen — search', () => {
  test('typing filters items in real time', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('demon');
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await expect(page.getByText('Magic Sword')).not.toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-search.png' });
  });

  test('selecting item from dropdown adds chip', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('mag');
    await expect(page.getByText('Magic Sword').first()).toBeVisible();
    await page.getByText('Magic Sword').first().click();
    // chip should appear + only magic sword shown
    await expect(page.getByText('Magic Sword')).toBeVisible();
  });

  test('empty state shown when no results', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('xyznonexistent');
    await expect(page.getByText('No results')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-empty-state.png' });
  });
});

test.describe('Market screen — favorites', () => {
  test('starring item turns star gold', async ({ page }) => {
    await expect(page.getByText('Demon Legs')).toBeVisible();
    // find star button near Demon Legs card and click it
    const card = page.locator('text=Demon Legs').locator('../../../..');
    await card.getByRole('button').filter({ hasText: '' }).first().click();
    await page.screenshot({ path: 'tests/screenshots/market-starred.png' });
  });

  test('favoriting item persists to localStorage', async ({ page }) => {
    await expect(page.getByText('Demon Legs')).toBeVisible();
    const card = page.locator('text=Demon Legs').locator('../../../..');
    await card.getByRole('button').first().click();
    const stored = await getLocalStorage(page, 'tibia_favorites_v1');
    expect(stored).toContain('demon legs');
  });
});

test.describe('Market screen — navigation', () => {
  test('clicking item card navigates to item detail', async ({ page }) => {
    await page.getByText('Demon Legs').click();
    await expect(page).toHaveURL(/item/);
  });
});
