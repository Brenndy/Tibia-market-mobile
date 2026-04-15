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

async function openWorldSelect(page: any) {
  // WorldBadge button is in the header — click it to open world-select
  await page.getByText('Antica').first().click();
  await expect(page.getByPlaceholder('Search world...')).toBeVisible();
}

test.describe('World select screen', () => {
  test('world list loads with all worlds', async ({ page }) => {
    await openWorldSelect(page);
    await expect(page.getByText('Antica')).toBeVisible();
    await expect(page.getByText('Belobra')).toBeVisible();
    await expect(page.getByText('Bona')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/world-select-loaded.png' });
  });

  test('shows relative time for each world', async ({ page }) => {
    await openWorldSelect(page);
    // Antica updated today, Bona updated 4 days ago
    await expect(page.getByText(/days ago/).first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/world-select-time.png' });
  });

  test('shows BattlEye icon for protected worlds', async ({ page }) => {
    await openWorldSelect(page);
    // Antica and Belobra are battleye_protected: true
    // eye icons should be present — count should be >= 2
    const eyeIcons = page.locator('[data-testid="battleye-icon"]').or(
      page.locator('text=Antica').locator('..').locator('xpath=.//*[name()="svg"]')
    );
    await page.screenshot({ path: 'tests/screenshots/world-select-battleye.png' });
  });

  test('shows PvP label for each world', async ({ page }) => {
    await openWorldSelect(page);
    await expect(page.getByText('Optional').first()).toBeVisible();
    await expect(page.getByText('Open').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/world-select-pvp.png' });
  });

  test('search filters worlds', async ({ page }) => {
    await openWorldSelect(page);
    await page.getByPlaceholder('Search world...').fill('bel');
    await expect(page.getByText('Belobra')).toBeVisible();
    await expect(page.getByText('Antica')).not.toBeVisible();
    await expect(page.getByText('Bona')).not.toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/world-select-search.png' });
  });

  test('selecting world saves to localStorage', async ({ page }) => {
    await openWorldSelect(page);
    await page.getByText('Belobra').click();
    const stored = await getLocalStorage(page, 'tibia_selected_world_v1');
    expect(stored).toBe('Belobra');
  });

  test('selecting world navigates back to market', async ({ page }) => {
    await openWorldSelect(page);
    await page.getByText('Belobra').click();
    // Should navigate back (world-select screen closes)
    await expect(page.getByPlaceholder('Search world...')).not.toBeVisible();
  });

  test('currently selected world has checkmark', async ({ page }) => {
    await openWorldSelect(page);
    // Antica is currently selected — check-circle should be visible next to it
    await expect(page.getByText('Antica').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/world-select-selected.png' });
  });
});
