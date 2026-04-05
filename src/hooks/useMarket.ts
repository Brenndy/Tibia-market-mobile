import { useQuery } from 'react-query';
import {
  fetchMarketBoard,
  fetchItemStats,
  fetchItemHistory,
  fetchWorlds,
  fetchCategories,
  fetchItemOffers,
} from '../api/tibiaMarket';

// One fetch per world. staleTime=10min (no refetch while fresh), cacheTime=30min (stays in memory).
export function useMarketBoard(world: string) {
  return useQuery(
    ['marketBoard', world],
    () => fetchMarketBoard(world),
    {
      enabled: !!world,
      keepPreviousData: true,
      staleTime: 10 * 60_000,  // won't refetch for 10 minutes
      cacheTime: 30 * 60_000,  // stays in memory 30 minutes after unmount
    }
  );
}

export function useItemStats(world: string, itemName: string) {
  return useQuery(
    ['itemStats', world, itemName],
    () => fetchItemStats(world, itemName),
    {
      enabled: !!world && !!itemName,
      staleTime: 60_000,
    }
  );
}

export function useItemHistory(world: string, itemName: string, days = 30) {
  return useQuery(
    ['itemHistory', world, itemName, days],
    () => fetchItemHistory(world, itemName, days),
    {
      enabled: !!world && !!itemName,
      staleTime: 60_000,
    }
  );
}

export function useWorlds() {
  return useQuery('worlds', fetchWorlds, {
    staleTime: 5 * 60_000,
  });
}

export function useCategories() {
  return useQuery('categories', fetchCategories, {
    staleTime: 60 * 60_000,
  });
}

export function useItemOffers(world: string, itemName: string) {
  return useQuery(
    ['itemOffers', world, itemName],
    () => fetchItemOffers(world, itemName),
    {
      enabled: !!world && !!itemName,
      staleTime: 30_000,
    }
  );
}
