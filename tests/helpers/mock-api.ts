import { Page } from '@playwright/test';
import metadata from '../fixtures/metadata.json';
import marketValues from '../fixtures/market-values.json';
import worldData from '../fixtures/world-data.json';
import tibiaDataWorlds from '../fixtures/tibiadata-worlds.json';
import itemHistory from '../fixtures/item-history.json';
import itemOffers from '../fixtures/item-offers.json';

export async function mockAllApis(page: Page) {
  // Item metadata — cached once by the app
  await page.route('**/api/tibia/item_metadata**', (route) => route.fulfill({ json: metadata }));

  // Market values — any world
  await page.route('**/api/tibia/market_values**', (route) =>
    route.fulfill({ json: marketValues }),
  );

  // World data — full list or single world query
  await page.route('**/api/tibia/world_data**', (route) => route.fulfill({ json: worldData }));

  // TibiaData worlds (pvp_type + battleye)
  await page.route('**/tibiadata.com/**', (route) => route.fulfill({ json: tibiaDataWorlds }));

  // Item price history
  await page.route('**/api/tibia/item_history**', (route) => route.fulfill({ json: itemHistory }));

  // Item offers (market board)
  await page.route('**/api/tibia/market_board**', (route) => route.fulfill({ json: itemOffers }));

  // Wiki images — return 404 (app has fallback)
  await page.route('**/api/wiki/**', (route) => route.fulfill({ status: 404 }));
}
