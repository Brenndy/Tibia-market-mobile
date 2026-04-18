// Default loaders — picked by Metro on native (iOS / Android).
// Imports ship bundled JSONs into the app binary, so lookups are sync
// but wrapped in a Promise to keep a single API across platforms.
//
// The `.web.ts` sibling uses fetch('/data/…') instead, keeping these
// blobs OUT of the web bundle.

import vocationsData from './vocations.json';
import monkItemsData from './monkItems.json';
import deliveryItemsData from './deliveryItems.json';
import { ITEM_LIST } from './itemList';

export type { ItemEntry } from './itemList';

export interface StaticFilterData {
  vocations: Record<string, string[]>;
  monkItems: Set<string>;
  deliveryItems: Set<string>;
}

let staticDataPromise: Promise<StaticFilterData> | null = null;
export function loadStaticFilterData(): Promise<StaticFilterData> {
  if (!staticDataPromise) {
    staticDataPromise = Promise.resolve({
      vocations: vocationsData as Record<string, string[]>,
      monkItems: new Set((monkItemsData as string[]).map((n) => n.toLowerCase())),
      deliveryItems: new Set((deliveryItemsData as string[]).map((n) => n.toLowerCase())),
    });
  }
  return staticDataPromise;
}

let itemListPromise: Promise<typeof ITEM_LIST> | null = null;
export function loadItemList(): Promise<typeof ITEM_LIST> {
  if (!itemListPromise) {
    itemListPromise = Promise.resolve(ITEM_LIST);
  }
  return itemListPromise;
}
