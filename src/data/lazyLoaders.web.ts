// Web loaders — picked by Metro on web via the `.web.ts` platform suffix.
// Fetches JSONs from /data/* (served by Vercel from public/data/), so the
// raw data is NEVER included in the initial JS bundle.
//
// Strategy: stale-while-revalidate on two layers.
//   1. Browser HTTP cache (via `cache-control: public, max-age=3600` from Vercel)
//      — survives reload, but first-ever visit still pays the roundtrip.
//   2. `localStorage` persistent cache (this file) — on next visit we resolve
//      instantly from disk with stale bytes and refresh in the background,
//      so the UI is usable before the network round-trips.

import type { ItemEntry } from './itemList';
export type { ItemEntry };

export interface StaticFilterData {
  vocations: Record<string, string[]>;
  monkItems: Set<string>;
  deliveryItems: Set<string>;
}

const STATIC_KEY = 'tibia_static_filter_data_v1';
const ITEM_LIST_KEY = 'tibia_item_list_v1';

interface CachedStatic {
  vocations: Record<string, string[]>;
  monkItems: string[];
  deliveryItems: string[];
}

function readCache<T>(key: string): T | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — silently skip; next visit retries.
  }
}

function hydrateStatic(cached: CachedStatic): StaticFilterData {
  return {
    vocations: cached.vocations,
    monkItems: new Set(cached.monkItems.map((n) => n.toLowerCase())),
    deliveryItems: new Set(cached.deliveryItems.map((n) => n.toLowerCase())),
  };
}

async function fetchStaticFresh(): Promise<StaticFilterData> {
  const [vocations, monkArr, deliveryArr] = await Promise.all([
    fetch('/data/vocations.json').then((r) => r.json() as Promise<Record<string, string[]>>),
    fetch('/data/monk-items.json').then((r) => r.json() as Promise<string[]>),
    fetch('/data/delivery-items.json').then((r) => r.json() as Promise<string[]>),
  ]);
  writeCache(STATIC_KEY, {
    vocations,
    monkItems: monkArr,
    deliveryItems: deliveryArr,
  } satisfies CachedStatic);
  return hydrateStatic({ vocations, monkItems: monkArr, deliveryItems: deliveryArr });
}

let staticDataPromise: Promise<StaticFilterData> | null = null;
export function loadStaticFilterData(): Promise<StaticFilterData> {
  if (!staticDataPromise) {
    const cached = readCache<CachedStatic>(STATIC_KEY);
    if (cached) {
      // SWR: serve cache now, refresh in background for next visit.
      fetchStaticFresh().catch(() => {});
      staticDataPromise = Promise.resolve(hydrateStatic(cached));
    } else {
      staticDataPromise = fetchStaticFresh();
    }
  }
  return staticDataPromise;
}

async function fetchItemListFresh(): Promise<ItemEntry[]> {
  const list = await fetch('/data/item-list.json').then((r) => r.json() as Promise<ItemEntry[]>);
  writeCache(ITEM_LIST_KEY, list);
  return list;
}

let itemListPromise: Promise<ItemEntry[]> | null = null;
export function loadItemList(): Promise<ItemEntry[]> {
  if (!itemListPromise) {
    const cached = readCache<ItemEntry[]>(ITEM_LIST_KEY);
    if (cached) {
      fetchItemListFresh().catch(() => {});
      itemListPromise = Promise.resolve(cached);
    } else {
      itemListPromise = fetchItemListFresh();
    }
  }
  return itemListPromise;
}
