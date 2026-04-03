import axios from 'axios';

const BASE_URL =
  typeof window !== 'undefined' && window.location?.hostname !== 'localhost'
    ? '/api/tibia'
    : 'https://api.tibiamarket.top:8001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

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
  time: string;
  category: string | null;
  tier: number | null;
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
}

export interface World {
  name: string;
  type: string;
  location: string;
  pvp_type: string;
  battleye: boolean;
  transfer_type: string;
  players_online: number;
  record_players: number;
  record_date: string;
  creation_date: string;
  premium_only: boolean;
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
  | 'month_average_sell';

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchMarketBoard(
  world: string,
  options?: {
    sort_field?: SortField;
    sort_order?: 'asc' | 'desc';
    rows?: number;
    offset?: number;
    name?: string;
    category?: string;
  }
): Promise<MarketBoard> {
  const params: Record<string, string | number> = { world };
  if (options?.sort_field) params.sort_field = options.sort_field;
  if (options?.sort_order) params.sort_order = options.sort_order;
  if (options?.rows !== undefined) params.rows = options.rows;
  if (options?.offset !== undefined) params.offset = options.offset;
  if (options?.name) params.name = options.name;
  if (options?.category) params.category = options.category;

  const { data } = await api.get<MarketBoard>('/market_board', { params });
  return data;
}

export async function fetchItemStats(
  world: string,
  itemName: string
): Promise<ItemStats> {
  const { data } = await api.get<ItemStats>('/market_board/item', {
    params: { world, name: itemName },
  });
  return data;
}

export async function fetchItemHistory(
  world: string,
  itemName: string,
  days = 30
): Promise<ItemHistory[]> {
  const { data } = await api.get<ItemHistory[]>('/market_board/item/history', {
    params: { world, name: itemName, days },
  });
  return data;
}

export async function fetchWorlds(): Promise<World[]> {
  const { data } = await api.get<World[]>('/worlds');
  return data;
}

export async function fetchCategories(): Promise<string[]> {
  const { data } = await api.get<string[]>('/market_board/categories');
  return data;
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
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
