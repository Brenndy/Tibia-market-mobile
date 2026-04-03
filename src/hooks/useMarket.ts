import { useQuery } from 'react-query';
import {
  fetchMarketBoard,
  fetchItemStats,
  fetchItemHistory,
  fetchWorlds,
  fetchCategories,
  SortField,
} from '../api/tibiaMarket';

export function useMarketBoard(
  world: string,
  options?: {
    sort_field?: SortField;
    sort_order?: 'asc' | 'desc';
    rows?: number;
    offset?: number;
    name?: string;
    category?: string;
  }
) {
  return useQuery(
    ['marketBoard', world, options],
    () => fetchMarketBoard(world, options),
    {
      enabled: !!world,
      keepPreviousData: true,
      staleTime: 60_000,
    }
  );
}

export function useItemStats(world: string, itemName: string) {
  return useQuery(
    ['itemStats', world, itemName],
    () => fetchItemStats(world, itemName),
    {
      enabled: !!world && !!itemName,
    }
  );
}

export function useItemHistory(world: string, itemName: string, days = 30) {
  return useQuery(
    ['itemHistory', world, itemName, days],
    () => fetchItemHistory(world, itemName, days),
    {
      enabled: !!world && !!itemName,
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
