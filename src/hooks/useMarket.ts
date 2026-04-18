import { useQuery, useQueries } from 'react-query';
import {
  fetchMarketBoard,
  fetchItemStats,
  fetchItemHistory,
  fetchWorlds,
  fetchCategories,
  fetchItemOffers,
  MarketBoard,
} from '../api/tibiaMarket';

// One fetch per world. staleTime=10min (no refetch while fresh), cacheTime=30min (stays in memory).
export function useMarketBoard(world: string) {
  return useQuery(['marketBoard', world], () => fetchMarketBoard(world), {
    enabled: !!world,
    keepPreviousData: true,
    staleTime: 10 * 60_000,
    cacheTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Fetches market boards for several worlds in parallel, sharing the single-world
// cache. Returns a map world → board (undefined until loaded) plus a map of loading
// flags so callers can tell "no data yet" from "item genuinely not on this world".
export function useMarketBoards(worlds: string[]): {
  boardByWorld: Map<string, MarketBoard | undefined>;
  loadingByWorld: Map<string, boolean>;
} {
  const results = useQueries(
    worlds.map((world) => ({
      queryKey: ['marketBoard', world],
      queryFn: () => fetchMarketBoard(world),
      enabled: !!world,
      keepPreviousData: true,
      staleTime: 10 * 60_000,
      cacheTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  );
  const boardByWorld = new Map<string, MarketBoard | undefined>();
  const loadingByWorld = new Map<string, boolean>();
  worlds.forEach((world, i) => {
    const r = results[i];
    boardByWorld.set(world, r?.data as MarketBoard | undefined);
    loadingByWorld.set(world, !!r?.isLoading);
  });
  return { boardByWorld, loadingByWorld };
}

export function useItemStats(world: string, itemName: string) {
  return useQuery(['itemStats', world, itemName], () => fetchItemStats(world, itemName), {
    enabled: !!world && !!itemName,
    staleTime: 60_000,
  });
}

export function useItemHistory(world: string, itemName: string, days = 30) {
  return useQuery(
    ['itemHistory', world, itemName, days],
    () => fetchItemHistory(world, itemName, days),
    {
      enabled: !!world && !!itemName,
      staleTime: 60_000,
    },
  );
}

export function useWorlds() {
  return useQuery('worlds', fetchWorlds, {
    staleTime: 15 * 60_000,
    cacheTime: 60 * 60_000,
    retry: 1,
  });
}

export function useCategories() {
  return useQuery('categories', fetchCategories, {
    staleTime: 60 * 60_000,
  });
}

export function useItemOffers(world: string, itemName: string) {
  return useQuery(['itemOffers', world, itemName], () => fetchItemOffers(world, itemName), {
    enabled: !!world && !!itemName,
    staleTime: 30_000,
  });
}
