import { test, expect } from '@playwright/test';
import { mockAllApis } from './helpers/mock-api';
import { clearStorage, setSelectedWorld } from './helpers/storage';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:50164';

test('search suggestions work with lazy-loaded item list', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
  });

  await mockAllApis(page);
  await page.goto(BASE);
  await clearStorage(page);
  await setSelectedWorld(page, 'Antica');
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const search = page.getByPlaceholder(/search/i).first();
  await search.focus();
  await page.waitForResponse((r) => r.url().includes('/data/item-list.json'));
  await search.fill('dragon');

  // Wait for any suggestion containing "Dragon"
  await expect(page.getByText(/dragon/i).first()).toBeVisible({ timeout: 5_000 });

  await page.screenshot({ path: 'tests/screenshots/lazy-search-suggestions.png', fullPage: false });

  const appErrors = errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('chunk') &&
      !e.includes('Failed to fetch'),
  );
  expect(appErrors, `Unexpected errors: ${appErrors.join('\n')}`).toHaveLength(0);
});
