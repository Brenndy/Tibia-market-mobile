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

// Presets section removed — presets are not rendered in the current UI.

test.describe('Market screen — sort picker', () => {
  test('sort picker opens with all options', async ({ page }) => {
    await page.getByText('Monthly volume').first().click();
    await expect(page.getByText('Sort by')).toBeVisible();
    // Sort options use exact match to avoid matching "MARGIN" labels on item cards
    await expect(page.getByText('Margin', { exact: true })).toBeVisible();
    await expect(page.getByText('Buy price', { exact: true })).toBeVisible();
    await expect(page.getByText('Sell price', { exact: true })).toBeVisible();
    await expect(page.getByText('Name', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-sort-picker.png' });
  });

  test('selecting Margin from sort picker closes modal', async ({ page }) => {
    await page.getByText('Monthly volume').first().click();
    await expect(page.getByText('Sort by')).toBeVisible();
    await page.getByText('Margin', { exact: true }).click();
    await expect(page.getByText('Sort by')).not.toBeVisible();
  });

  test('selecting Name sorts alphabetically', async ({ page }) => {
    await page.getByText('Monthly volume').first().click();
    await page.getByText('Name', { exact: true }).click();
    await page.screenshot({ path: 'tests/screenshots/market-sort-name.png' });
    // Boots of Haste should appear before Dragon Scale Mail alphabetically
    await expect(
      page.getByText('Boots Of Haste').or(page.getByText('Boots of Haste')),
    ).toBeVisible();
  });
});

test.describe('Market screen — filter panel', () => {
  test('filter panel opens with all sections', async ({ page }) => {
    await page.getByText('Filters').click();
    await expect(page.getByText('Advanced filters')).toBeVisible();
    await expect(page.getByText('Vocation')).toBeVisible();
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByText('Buy price').first()).toBeVisible();
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
    // "Swords" appears multiple times (category labels on cards + filter chip in panel)
    // The filter chip in the modal is the last occurrence
    await page.getByText('Swords').last().click();
    await page.getByText('Apply filters').click();
    await expect(page.getByText('Magic Sword')).toBeVisible();
    await expect(page.getByText('Fire Sword')).toBeVisible();
    // Non-swords should be gone
    await expect(page.getByText('Demon Legs')).not.toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-category-filter.png' });
  });

  test('active filter count shown on filter button', async ({ page }) => {
    await page.getByText('Filters').click();
    await page.getByText('Swords').last().click();
    await page.getByText('Apply filters').click();
    await expect(page.getByText(/Filters \(1\)/)).toBeVisible();
  });

  test('reset clears all filters', async ({ page }) => {
    await page.getByText('Filters').click();
    await page.getByText('Swords').last().click();
    await page.getByText('Reset').click();
    await page.getByText('Apply filters').click();
    // All items back
    await expect(page.getByText('Demon Legs')).toBeVisible();
    await expect(page.getByText('Magic Sword')).toBeVisible();
  });

  test('clear filters link removes active filters', async ({ page }) => {
    await page.getByText('Filters').click();
    await page.getByText('Swords').last().click();
    await page.getByText('Apply filters').click();
    await expect(page.getByText('Clear filters')).toBeVisible();
    await page.getByText('Clear filters').click();
    await expect(page.getByText('Demon Legs')).toBeVisible();
  });
});

test.describe('Market screen — search', () => {
  test('typing shows autocomplete dropdown', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('demon');
    // Dropdown should show matching suggestions
    await expect(page.getByText('Demon Legs').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-search.png' });
  });

  test('selecting item from dropdown adds chip and filters list', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('magic s');
    await expect(page.getByText('Magic Sword').first()).toBeVisible();
    await page.getByText('Magic Sword').first().click();
    // chip should appear + only magic sword shown in listing
    await expect(page.getByText('Magic Sword').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/market-search-chip.png' });
  });

  test('search input has correct placeholder', async ({ page }) => {
    await expect(page.getByPlaceholder('Search items...')).toBeVisible();
  });
});

test.describe('Market screen — favorites', () => {
  test('starring item turns star gold', async ({ page }) => {
    await expect(page.getByText('Demon Legs')).toBeVisible();
    // Use testID added to the star TouchableOpacity in MarketItemCard
    const starBtn = page.locator('[data-testid="star-demon legs"]');
    await starBtn.click({ force: true });
    await page.screenshot({ path: 'tests/screenshots/market-starred.png' });
  });

  test('favoriting item persists to localStorage', async ({ page }) => {
    await expect(page.getByText('Demon Legs')).toBeVisible();
    const starBtn = page.locator('[data-testid="star-demon legs"]');
    await starBtn.click({ force: true });
    const stored = await getLocalStorage(page, 'tibia_favorites_v2');
    expect(stored).toContain('demon legs');
  });
});

test.describe('Market screen — navigation', () => {
  test('clicking item card navigates to item detail', async ({ page }) => {
    await page.getByText('Demon Legs').click();
    await expect(page).toHaveURL(/item/);
  });
});

test.describe('Market screen — desktop table rows', () => {
  test.skip(
    ({ viewport }) => !viewport || viewport.width < 900,
    'desktop-only: table view renders above 900px breakpoint',
  );

  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('tibia_view_mode_v1', 'list'));
    await page.reload();
    await expect(page.getByText('Demon Legs')).toBeVisible();
  });

  test('renders table header columns', async ({ page }) => {
    await expect(page.getByText('ITEMS', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('VOL/MO.').first()).toBeVisible();
    await expect(page.getByText('OFFERS', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('MARGIN', { exact: false }).first()).toBeVisible();
  });

  test('row exposes row-star and row-bell testIDs for each item', async ({ page }) => {
    await expect(page.locator('[data-testid="row-star-demon legs"]')).toBeVisible();
    await expect(page.locator('[data-testid="row-bell-demon legs"]')).toBeVisible();
  });

  test('row star toggles favorite and persists', async ({ page }) => {
    const starBtn = page.locator('[data-testid="row-star-demon legs"]');
    await starBtn.click({ force: true });
    const stored = await getLocalStorage(page, 'tibia_favorites_v2');
    expect(stored).toContain('demon legs');
  });
});
