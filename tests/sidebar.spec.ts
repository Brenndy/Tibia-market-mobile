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

test.describe('Desktop sidebar — GitHub stars', () => {
  test.skip(
    ({ viewport }) => !viewport || viewport.width < 900,
    'desktop-only: sidebar only renders above 900px breakpoint',
  );

  async function mockGithubApi(page: import('@playwright/test').Page, stars: number) {
    await page.route('**/api.github.com/repos/Brenndy/Tibia-market-mobile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stargazers_count: stars }),
      }),
    );
  }

  test('shows Star on GitHub CTA + star count when API responds', async ({ page, context }) => {
    await mockGithubApi(page, 42);
    await page.goto('/');
    const widget = page.locator('[data-testid="gh-stars"]').first();
    await expect(widget).toBeVisible();
    await expect(widget).toContainText(/Star on GitHub/i);
    await expect(widget).toContainText(/42/);

    // Clicking triggers a new tab to the repo — intercept window.open so we
    // don't actually navigate. Linking.openURL on web uses window.open.
    const popupPromise = context.waitForEvent('page').catch(() => null);
    await widget.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      expect(popup.url()).toContain('github.com/Brenndy/Tibia-market-mobile');
    }
  });

  test('renders placeholder when GitHub API fails', async ({ page }) => {
    await page.route('**/api.github.com/repos/Brenndy/Tibia-market-mobile', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
    );
    await page.goto('/');
    const widget = page.locator('[data-testid="gh-stars"]').first();
    await expect(widget).toBeVisible();
    await expect(widget).toContainText('—');
  });

  test('collapses to compact icon + count in collapsed sidebar', async ({ page }) => {
    await mockGithubApi(page, 1337);
    await page.goto('/');
    await page.locator('[data-testid="sidebar-toggle"]').click();
    const widget = page.locator('[data-testid="gh-stars"]').first();
    await expect(widget).toBeVisible();
    await expect(widget).toContainText(/1\.3k/);
  });
});
