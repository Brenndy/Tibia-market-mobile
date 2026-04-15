import axios from 'axios';
import { Platform } from 'react-native';
import vocationsData from '../data/vocations.json';

// Web production: relative Vercel rewrite (/api/tibia → api.tibiamarket.top)
// Native & web dev: Vercel proxy (avoids direct API rate limits from dev IP)
// Set EXPO_PUBLIC_API_PROXY_URL in your .env to point to your own Vercel deployment.
// NOTE: React Native sets global.window = global, so typeof window check alone is unreliable.
// Also guard typeof window for SSR/static rendering where window is undefined entirely.
const IS_PRODUCTION_WEB =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.location?.hostname !== 'localhost';

const PROXY_URL =
  process.env.EXPO_PUBLIC_API_PROXY_URL ?? 'https://tibia-market-mobile.vercel.app';

const BASE_URL = IS_PRODUCTION_WEB ? '/api/tibia' : `${PROXY_URL}/api/tibia`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NpcEntry {
  name: string;
  location: string;
  price: number;
}

export interface MarketItem {
  name: string;
  wiki_name: string;
  buy_offer: number | null;
  sell_offer: number | null;
  month_average_buy: number | null;
  month_average_sell: number | null;
  month_sold: number | null;
  month_bought: number | null;
  day_average_buy: number | null;
  day_average_sell: number | null;
  day_sold: number | null;
  day_bought: number | null;
  buy_offers: number | null;
  sell_offers: number | null;
  time: string;
  category: string | null;
  tier: number | null;
  npc_sell: NpcEntry[];
  npc_buy: NpcEntry[];
}

export interface MarketBoard {
  world: string;
  last_update: string;
  items: MarketItem[];
}

export interface ItemHistory {
  date: string;
  buy_offer: number | null;
  sell_offer: number | null;
  buy_average: number | null;
  sell_average: number | null;
  buy_volume: number | null;
  sell_volume: number | null;
}

export interface ItemStats {
  name: string;
  wiki_name: string;
  world: string;
  buy_offer: number | null;
  sell_offer: number | null;
  month_average_buy: number | null;
  month_average_sell: number | null;
  month_sold: number | null;
  month_bought: number | null;
  day_average_buy: number | null;
  day_average_sell: number | null;
  day_sold: number | null;
  day_bought: number | null;
  highest_buy: number | null;
  lowest_sell: number | null;
  time: string;
  npc_sell: NpcEntry[];
  npc_buy: NpcEntry[];
}

export interface World {
  name: string;
  last_update: string;
  pvp_type: string;
  battleye: boolean;
}

export type SortField =
  | 'name'
  | 'buy_offer'
  | 'sell_offer'
  | 'month_sold'
  | 'month_bought'
  | 'day_sold'
  | 'day_bought'
  | 'month_average_buy'
  | 'month_average_sell'
  | 'margin'
  | 'npc_sell_margin';

export interface ItemOffer {
  name: string;
  amount: number;
  price: number;
  time: number;
}

export interface ItemOfferBook {
  item_id: number;
  sellers: ItemOffer[];
  buyers: ItemOffer[];
  update_time: number;
}

// ─── Internal API types ───────────────────────────────────────────────────────

interface RawMetadata {
  id: number;
  name: string;
  wiki_name: string;
  category: string | null;
  tier: number | null;
  npc_sell: Array<{ name: string; location: string; price: number; currency_object_type_id: number }>;
  npc_buy: Array<{ name: string; location: string; price: number; currency_object_type_id: number }>;
}

interface RawMarketValue {
  id: number;
  time: number;
  buy_offer: number;
  sell_offer: number;
  month_average_buy: number;
  month_average_sell: number;
  month_sold: number;
  month_bought: number;
  month_highest_buy: number;
  month_lowest_sell: number;
  day_average_buy: number;
  day_average_sell: number;
  day_sold: number;
  day_bought: number;
  buy_offers: number;
  sell_offers: number;
}

interface RawWorldData {
  name: string;
  last_update: string;
}

interface TibiaDataWorld {
  name: string;
  pvp_type: string;
  battleye_protected: boolean;
}

interface TibiaDataWorldsResponse {
  worlds: {
    regular_worlds: TibiaDataWorld[];
    tournament_worlds?: TibiaDataWorld[];
  };
}

// ─── Metadata cache ───────────────────────────────────────────────────────────

let metaByName: Map<string, RawMetadata> | null = null;
let metaById: Map<number, RawMetadata> | null = null;

async function getMetadata() {
  if (metaByName && metaById) return { metaByName, metaById };
  const { data } = await api.get<RawMetadata[]>('/item_metadata');
  metaByName = new Map();
  metaById = new Map();
  for (const item of data) {
    metaByName.set(item.name.toLowerCase(), item);
    metaById.set(item.id, item);
  }
  return { metaByName, metaById };
}

function nullIfNegative(v: number): number | null {
  return v < 0 ? null : v;
}

function unixToISO(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

// ─── API Functions ────────────────────────────────────────────────────────────

// Fetches all raw market items for a world — no filtering, no sorting.
// All processing happens client-side via filterAndSortItems().
export async function fetchMarketBoard(world: string): Promise<MarketBoard> {
  const { metaById } = await getMetadata();

  const [{ data: rawValues }, { data: worldData }] = await Promise.all([
    api.get<RawMarketValue[]>('/market_values', { params: { server: world, limit: 10000 } }),
    api.get<RawWorldData[]>('/world_data', { params: { servers: world } }),
  ]);

  const last_update = worldData[0]?.last_update ?? new Date().toISOString();

  // Dedupe by id — live API occasionally returns the same id twice which causes
  // React key collisions downstream. Keep first occurrence.
  const seenIds = new Set<number>();
  const uniqueValues = rawValues.filter((v) => {
    if (seenIds.has(v.id)) return false;
    seenIds.add(v.id);
    return true;
  });

  const items: MarketItem[] = uniqueValues.map((v) => {
    const meta = metaById.get(v.id);
    const npcSellRaw = meta?.npc_sell ?? [];
    const npcBuyRaw = meta?.npc_buy ?? [];
    // Only include entries paid in gold (currency_object_type_id === 0)
    const npc_sell = npcSellRaw
      .filter((e) => e.currency_object_type_id === 0)
      .map((e) => ({ name: e.name, location: e.location, price: e.price }));
    const npc_buy = npcBuyRaw
      .filter((e) => e.currency_object_type_id === 0)
      .map((e) => ({ name: e.name, location: e.location, price: e.price }));
    return {
      name: meta?.name ?? String(v.id),
      wiki_name: meta?.wiki_name ?? '',
      category: meta?.category ?? null,
      tier: meta?.tier ?? null,
      npc_sell,
      npc_buy,
      buy_offer: nullIfNegative(v.buy_offer),
      sell_offer: nullIfNegative(v.sell_offer),
      month_average_buy: nullIfNegative(v.month_average_buy),
      month_average_sell: nullIfNegative(v.month_average_sell),
      month_sold: nullIfNegative(v.month_sold),
      month_bought: nullIfNegative(v.month_bought),
      day_average_buy: nullIfNegative(v.day_average_buy),
      day_average_sell: nullIfNegative(v.day_average_sell),
      day_sold: nullIfNegative(v.day_sold),
      day_bought: nullIfNegative(v.day_bought),
      buy_offers: nullIfNegative(v.buy_offers),
      sell_offers: nullIfNegative(v.sell_offers),
      time: unixToISO(v.time),
    };
  });

  return { world, last_update, items };
}

export type Vocation = 'knight' | 'paladin' | 'sorcerer' | 'druid';

export interface FilterSortOptions {
  sort_field?: SortField;
  sort_order?: 'asc' | 'desc';
  selectedItemNames?: string[];  // filter to exact item names (multi-select)
  name?: string;                 // substring search fallback
  categories?: string[];
  minBuyPrice?: number;
  maxBuyPrice?: number;
  minSellPrice?: number;
  maxSellPrice?: number;
  minVolume?: number;
  minMargin?: number;
  yasirOnly?: boolean;
  vocations?: Vocation[];
}

// Pure client-side filter + sort on already-fetched items.
// Call this inside useMemo — no API requests.
export function filterAndSortItems(items: MarketItem[], options: FilterSortOptions): MarketItem[] {
  let result = items;

  if (options.selectedItemNames && options.selectedItemNames.length > 0) {
    const nameSet = new Set(options.selectedItemNames.map((n) => n.toLowerCase()));
    result = result.filter((i) => nameSet.has(i.name.toLowerCase()));
  } else if (options.name) {
    const q = options.name.toLowerCase();
    result = result.filter((i) => i.name.toLowerCase().includes(q));
  }
  if (options.categories && options.categories.length > 0) {
    const cats = new Set(options.categories);
    result = result.filter((i) => i.category != null && cats.has(i.category));
  }
  if (options.minBuyPrice != null) {
    result = result.filter((i) => i.buy_offer != null && i.buy_offer >= options.minBuyPrice!);
  }
  if (options.maxBuyPrice != null) {
    result = result.filter((i) => i.buy_offer != null && i.buy_offer <= options.maxBuyPrice!);
  }
  if (options.minSellPrice != null) {
    result = result.filter((i) => i.sell_offer != null && i.sell_offer >= options.minSellPrice!);
  }
  if (options.maxSellPrice != null) {
    result = result.filter((i) => i.sell_offer != null && i.sell_offer <= options.maxSellPrice!);
  }
  if (options.minVolume != null) {
    result = result.filter((i) => (i.month_sold ?? 0) >= options.minVolume!);
  }
  if (options.minMargin != null) {
    result = result.filter((i) => {
      if (i.sell_offer == null || i.buy_offer == null) return false;
      return i.sell_offer - i.buy_offer >= options.minMargin!;
    });
  }
  if (options.yasirOnly) {
    result = result.filter((i) => i.npc_buy.some((e) => e.name === 'Yasir'));
  }
  if (options.vocations && options.vocations.length > 0) {
    const selectedVocs = new Set(options.vocations);
    result = result.filter((i) => {
      const itemVocs: string[] = (vocationsData as Record<string, string[]>)[i.name] ?? [];
      if (itemVocs.length === 0) return false; // no restriction = not vocation-specific
      return itemVocs.some((v) => selectedVocs.has(v as Vocation));
    });
  }

  const rawField = options.sort_field ?? 'month_sold';
  const order = options.sort_order ?? 'desc';

  if (rawField === 'margin') {
    result = result
      .map((i) => ({ ...i, _margin: i.sell_offer != null && i.buy_offer != null ? i.sell_offer - i.buy_offer : null }))
      .sort((a: any, b: any) => {
        const av = a._margin ?? -Infinity;
        const bv = b._margin ?? -Infinity;
        return order === 'desc' ? bv - av : av - bv;
      });
  } else if (rawField === 'npc_sell_margin') {
    // Sort by how much more the market sell price is vs the cheapest NPC sell price
    // Ratio = sell_offer / min(npc_sell.price) — filter out ratio >= 100_000 (unrealistic)
    result = result
      .filter((i) => i.npc_sell.length > 0 && i.sell_offer != null)
      .map((i) => {
        const minNpc = Math.min(...i.npc_sell.map((e) => e.price));
        const ratio = minNpc > 0 ? (i.sell_offer as number) / minNpc : null;
        return { ...i, _npcMargin: ratio !== null && ratio < 100_000 ? ratio : null };
      })
      .filter((i: any) => i._npcMargin !== null)
      .sort((a: any, b: any) => {
        const av = a._npcMargin ?? -Infinity;
        const bv = b._npcMargin ?? -Infinity;
        return order === 'desc' ? bv - av : av - bv;
      });
  } else {
    result = [...result].sort((a, b) => {
      const av = (a as any)[rawField] ?? (rawField === 'name' ? '' : -Infinity);
      const bv = (b as any)[rawField] ?? (rawField === 'name' ? '' : -Infinity);
      if (av < bv) return order === 'desc' ? 1 : -1;
      if (av > bv) return order === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return result;
}

export async function fetchItemStats(
  world: string,
  itemName: string
): Promise<ItemStats> {
  const { metaByName } = await getMetadata();
  const meta = metaByName.get(itemName.toLowerCase());
  if (!meta) throw new Error(`Item not found: ${itemName}`);

  const { data } = await api.get<RawMarketValue[]>('/market_values', {
    params: { server: world, item_ids: meta.id },
  });

  const v = data[0];
  if (!v) throw new Error(`No market data for: ${itemName}`);

  const npcSellRaw = meta.npc_sell ?? [];
  const npcBuyRaw = meta.npc_buy ?? [];
  return {
    name: meta.name,
    wiki_name: meta.wiki_name,
    world,
    npc_sell: npcSellRaw.filter((e) => e.currency_object_type_id === 0).map((e) => ({ name: e.name, location: e.location, price: e.price })),
    npc_buy: npcBuyRaw.filter((e) => e.currency_object_type_id === 0).map((e) => ({ name: e.name, location: e.location, price: e.price })),
    buy_offer: nullIfNegative(v.buy_offer),
    sell_offer: nullIfNegative(v.sell_offer),
    month_average_buy: nullIfNegative(v.month_average_buy),
    month_average_sell: nullIfNegative(v.month_average_sell),
    month_sold: nullIfNegative(v.month_sold),
    month_bought: nullIfNegative(v.month_bought),
    day_average_buy: nullIfNegative(v.day_average_buy),
    day_average_sell: nullIfNegative(v.day_average_sell),
    day_sold: nullIfNegative(v.day_sold),
    day_bought: nullIfNegative(v.day_bought),
    highest_buy: nullIfNegative(v.month_highest_buy),
    lowest_sell: nullIfNegative(v.month_lowest_sell),
    time: unixToISO(v.time),
  };
}

export async function fetchItemHistory(
  world: string,
  itemName: string,
  days = 30
): Promise<ItemHistory[]> {
  const { metaByName } = await getMetadata();
  const meta = metaByName.get(itemName.toLowerCase());
  if (!meta) return [];

  const { data } = await api.get<RawMarketValue[]>('/item_history', {
    params: { server: world, item_id: meta.id, start_days_ago: days, end_days_ago: 0 },
  });

  return data.map((v) => ({
    date: unixToISO(v.time),
    buy_offer: nullIfNegative(v.buy_offer),
    sell_offer: nullIfNegative(v.sell_offer),
    buy_average: nullIfNegative(v.day_average_buy),
    sell_average: nullIfNegative(v.day_average_sell),
    buy_volume: nullIfNegative(v.day_bought),
    sell_volume: nullIfNegative(v.day_sold),
  }));
}

const TIBIADATA_BASE = 'https://api.tibiadata.com/v4';

export async function fetchWorlds(): Promise<World[]> {
  const [marketResult, tibiaResult] = await Promise.allSettled([
    api.get<RawWorldData[]>('/world_data'),
    axios.get<TibiaDataWorldsResponse>(`${TIBIADATA_BASE}/worlds`, { timeout: 8000 }),
  ]);

  if (marketResult.status === 'rejected') throw marketResult.reason;

  const metaMap = new Map<string, { pvp_type: string; battleye: boolean }>();
  if (tibiaResult.status === 'fulfilled') {
    const all = [
      ...(tibiaResult.value.data.worlds.regular_worlds ?? []),
      ...(tibiaResult.value.data.worlds.tournament_worlds ?? []),
    ];
    for (const w of all) {
      metaMap.set(w.name.toLowerCase(), {
        pvp_type: w.pvp_type ?? '',
        battleye: w.battleye_protected ?? false,
      });
    }
  }

  return marketResult.value.data.map((w) => {
    const meta = metaMap.get(w.name.toLowerCase());
    return {
      name: w.name,
      last_update: w.last_update,
      pvp_type: meta?.pvp_type ?? '',
      battleye: meta?.battleye ?? false,
    };
  });
}

export async function fetchCategories(): Promise<string[]> {
  const { metaByName } = await getMetadata();
  const cats = new Set<string>();
  for (const item of metaByName.values()) {
    if (item.category) cats.add(item.category);
  }
  return Array.from(cats).sort();
}

export function toTitleCase(name: string): string {
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatGold(value: number | null): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}kk`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function fetchItemOffers(
  world: string,
  itemName: string
): Promise<ItemOfferBook | null> {
  const { metaByName } = await getMetadata();
  const meta = metaByName.get(itemName.toLowerCase());
  if (!meta) return null;

  try {
    const { data } = await api.get<{
      id: number;
      sellers: Array<{ name: string; amount: number; price: number; time: number }>;
      buyers: Array<{ name: string; amount: number; price: number; time: number }>;
      update_time: number;
    }>('/market_board', {
      params: { server: world, item_id: meta.id },
    });
    return {
      item_id: data.id,
      sellers: data.sellers ?? [],
      buyers: data.buyers ?? [],
      update_time: data.update_time,
    };
  } catch {
    return null;
  }
}

export function getItemImageUrl(wikiName: string): string {
  if (!wikiName) return '';
  const encoded = wikiName.replace(/ /g, '_');
  if (IS_PRODUCTION_WEB) {
    return `/api/item-image?name=${encodeURIComponent(encoded)}`;
  }
  return `${PROXY_URL}/api/item-image?name=${encodeURIComponent(encoded)}`;
}
