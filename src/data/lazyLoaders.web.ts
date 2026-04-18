// Web loaders — picked by Metro on web via the `.web.ts` platform suffix.
// Fetches JSONs from /data/* (served by Vercel from public/data/), so the
// raw data is NEVER included in the initial JS bundle.
//
// Vercel edge caches these with long TTL + stale-while-revalidate via the
// `headers` rule in vercel.json, so subsequent users in a region get them
// from the nearest PoP.

import type { ItemEntry } from './itemList';
export type { ItemEntry };

export interface StaticFilterData {
  vocations: Record<string, string[]>;
  monkItems: Set<string>;
  deliveryItems: Set<string>;
}

let staticDataPromise: Promise<StaticFilterData> | null = null;
export function loadStaticFilterData(): Promise<StaticFilterData> {
  if (!staticDataPromise) {
    staticDataPromise = (async () => {
      const [vocations, monkArr, deliveryArr] = await Promise.all([
        fetch('/data/vocations.json').then((r) => r.json() as Promise<Record<string, string[]>>),
        fetch('/data/monk-items.json').then((r) => r.json() as Promise<string[]>),
        fetch('/data/delivery-items.json').then((r) => r.json() as Promise<string[]>),
      ]);
      return {
        vocations,
        monkItems: new Set(monkArr.map((n) => n.toLowerCase())),
        deliveryItems: new Set(deliveryArr.map((n) => n.toLowerCase())),
      };
    })();
  }
  return staticDataPromise;
}

let itemListPromise: Promise<ItemEntry[]> | null = null;
export function loadItemList(): Promise<ItemEntry[]> {
  if (!itemListPromise) {
    itemListPromise = fetch('/data/item-list.json').then((r) => r.json() as Promise<ItemEntry[]>);
  }
  return itemListPromise;
}
