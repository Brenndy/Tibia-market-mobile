// Fetches Tibia API item metadata, filters to the POPULAR_ITEMS set, and
// writes a compact JSON subset to src/data/itemSeoMetadata.json. Consumed
// by app/item/[name].tsx (via SEOContent) to render unique, crawlable body
// content per item page — category, NPC offers, wiki link, same-category
// cross-links. This fixes the thin-content problem that kept Google from
// indexing the 150 prerendered item pages (they all shared the same
// "Popular items" list and a generic one-liner).
//
// Run: node scripts/fetch-item-metadata.js
// Re-run when POPULAR_ITEMS changes or the API schema evolves.

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const POPULAR_ITEMS_PATH = path.join(ROOT, 'src/data/popularItems.ts');
const OUTPUT_PATH = path.join(ROOT, 'src/data/itemSeoMetadata.json');
const API_URL = 'https://tibiatrader.com/api/tibia/item_metadata';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch (e) {
            reject(e);
          }
        });
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

function loadPopularItems() {
  const src = fs.readFileSync(POPULAR_ITEMS_PATH, 'utf8');
  const arrayMatch = src.match(/POPULAR_ITEMS:\s*string\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (!arrayMatch) throw new Error('Could not parse POPULAR_ITEMS from popularItems.ts');
  return [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function compactOffers(offers) {
  // The API returns currency_object_type_id / currency_quest_flag_display_name
  // on every offer — both are noise for SEO copy. Keep just name/location/price.
  if (!Array.isArray(offers)) return [];
  return offers.map((o) => ({ name: o.name, location: o.location, price: o.price }));
}

async function main() {
  console.log('Loading POPULAR_ITEMS...');
  const popular = loadPopularItems();
  console.log(`  ${popular.length} items`);

  console.log('Fetching', API_URL);
  const all = await fetchJson(API_URL);
  console.log(`  ${all.length} total items in API response`);

  // First match by name wins — some names map to multiple variants distinguished
  // by wiki_name (e.g. "special flask"), but we only need one metadata record
  // per slug to build SEO copy.
  const popularSet = new Set(popular);
  const subset = {};
  for (const item of all) {
    if (popularSet.has(item.name) && !subset[item.name]) {
      subset[item.name] = {
        id: item.id,
        category: item.category,
        wiki_name: item.wiki_name,
        npc_sell: compactOffers(item.npc_sell),
        npc_buy: compactOffers(item.npc_buy),
      };
    }
  }

  const missing = popular.filter((name) => !subset[name]);
  if (missing.length > 0) {
    console.warn(`  WARN: ${missing.length} items missing from API:`, missing);
  }
  console.log(`  matched ${Object.keys(subset).length} / ${popular.length}`);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(subset, null, 2) + '\n');
  console.log('Wrote', OUTPUT_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
