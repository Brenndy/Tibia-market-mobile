import { Page } from '@playwright/test';

export async function setSelectedWorld(page: Page, world: string) {
  await page.evaluate((w) => localStorage.setItem('tibia_selected_world_v1', w), world);
}

/**
 * Seed favorites. Pass either a flat list (scoped to Antica by default) or a
 * pre-built Record<world, string[]> for multi-world scenarios.
 * Storage key is v2: per-world structure.
 */
export async function seedFavorites(
  page: Page,
  items: string[] | Record<string, string[]>,
  world = 'Antica',
) {
  const payload = Array.isArray(items) ? { [world]: items } : items;
  await page.evaluate(
    (list) => localStorage.setItem('tibia_favorites_v2', JSON.stringify(list)),
    payload,
  );
}

export async function seedWatchlist(page: Page, alerts: object[]) {
  await page.evaluate(
    (list) => localStorage.setItem('tibia_watchlist_v2', JSON.stringify(list)),
    alerts,
  );
}

export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('tibia_selected_world_v1');
    localStorage.removeItem('tibia_favorites_v1'); // legacy — cleared for safety
    localStorage.removeItem('tibia_favorites_v2');
    localStorage.removeItem('tibia_watchlist_v2');
    localStorage.removeItem('tibia_notified_alerts_v1');
    localStorage.removeItem('tibia_language_v1');
    localStorage.removeItem('tibia_view_mode_v1');
  });
}

export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

/** Set language to EN via localStorage before page load. */
export async function setLanguageEn(page: Page) {
  await page.evaluate(() => localStorage.setItem('tibia_language_v1', 'en'));
}

export const ALERT_ANTICA_DEMON_LEGS = {
  itemName: 'demon legs',
  wikiName: 'Demon_Legs',
  world: 'Antica',
  buyAlert: 750000,
  sellAlert: null,
  addedAt: '2026-04-08T10:00:00Z',
};

export const ALERT_ANTICA_DEMON_LEGS_TRIGGERED = {
  itemName: 'demon legs',
  wikiName: 'Demon_Legs',
  world: 'Antica',
  buyAlert: 999999, // above current buy_offer 800000 → triggered
  sellAlert: null,
  addedAt: '2026-04-08T10:00:00Z',
};

export const ALERT_BELOBRA_MAGIC_SWORD = {
  itemName: 'magic sword',
  wikiName: 'Magic_Sword',
  world: 'Belobra',
  buyAlert: null,
  sellAlert: 40000, // below current sell_offer 52000 → triggered
  addedAt: '2026-04-08T10:00:00Z',
};

// User's "buy soulbleeder cheap" scenario mapped to test item:
// sell_offer is 950000; alert fires when sell drops ≤ 1_000_000.
export const ALERT_ANTICA_DEMON_LEGS_SELL_BELOW = {
  itemName: 'demon legs',
  wikiName: 'Demon_Legs',
  world: 'Antica',
  buyAlert: null,
  sellAlert: 1000000,
  sellAlertCondition: 'below' as const,
  addedAt: '2026-04-17T10:00:00Z',
};

// Flipper scenario: fire when buy offers rise above threshold.
// buy_offer is 800000; alert fires when buy ≥ 700000.
export const ALERT_ANTICA_DEMON_LEGS_BUY_ABOVE = {
  itemName: 'demon legs',
  wikiName: 'Demon_Legs',
  world: 'Antica',
  buyAlert: 700000,
  sellAlert: null,
  buyAlertCondition: 'above' as const,
  addedAt: '2026-04-17T10:00:00Z',
};
