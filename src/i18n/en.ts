import type { TranslationKey } from './pl';

export const en: Record<TranslationKey, string> = {
  // Tabs
  tab_market: 'Market',
  tab_alerts: 'Alerts',
  tab_statistics: 'Statistics',
  tab_favorites: 'Favorites',

  // Common
  loading: 'Loading...',
  cancel: 'Cancel',
  save: 'Save',
  units: 'pcs.',

  // Market screen
  search_placeholder: 'Search items...',
  loading_market: 'Loading market...',
  buy: 'BUY',
  sell: 'SELL',
  volume_monthly: 'VOL/MO.',
  margin: 'MARGIN',
  avg_prefix: 'avg.',

  // Sort
  sort_by: 'Sort by',
  sort_month_sold: 'Monthly volume',
  sort_margin: 'Margin',
  sort_buy_offer: 'Buy price',
  sort_sell_offer: 'Sell price',
  sort_month_avg_buy: 'Avg. buy/month',
  sort_month_avg_sell: 'Avg. sell/month',
  sort_month_bought: 'Monthly purchases',
  sort_day_sold: 'Daily volume',
  sort_name: 'Name',
  sort_npc_margin: 'NPC Markup',

  // Filter panel
  advanced_filters: 'Advanced filters',
  reset: 'Reset',
  category: 'Category',
  buy_price_range: 'Buy price',
  sell_price_range: 'Sell price',
  min_volume_monthly: 'Min. monthly volume (pcs.)',
  min_margin_gp: 'Min. margin (gp)',
  min_volume_label: 'Min. volume',
  min_margin_label: 'Min. margin',
  apply_filters: 'Apply filters',
  min_label: 'Min',
  max_label: 'Max',
  placeholder_volume: 'e.g. 100',
  placeholder_margin: 'e.g. 500',

  // Watchlist
  no_alerts_title: 'No watchlist items',
  no_alerts_desc: 'Go to an item and tap the bell icon to set price alerts.',
  go_to_market: 'Go to market',
  opportunity: 'DEAL',
  all_worlds: 'All',
  no_alert_set: 'No alert',

  // WatchAlertModal
  buy_alert: 'Buy alert',
  sell_alert: 'Sell alert',
  buy_alert_desc: 'Notify when buy price is',
  sell_alert_desc: 'Notify when sell price is',
  below_value: '≤ threshold',
  above_value: '≥ threshold',
  watch: 'Watch',
  buy_prefix: 'Buy:',
  sell_prefix: 'Sell:',
  alert_active: '🟢 Alert is now active!',
  price_must_drop: 'Price must drop by',
  price_must_rise: 'Price must rise by',
  suggest_label: 'Quick:',
  toast_alert_saved: 'Alert saved',
  toast_alert_removed: 'Alert removed',

  // Statistics
  loading_stats: 'Loading statistics...',
  most_sold: 'Most traded',
  most_bought: 'Most purchased',
  most_expensive_buy: 'Most expensive (buy)',
  most_expensive_sell: 'Most expensive (sell)',
  top_5: 'Top 5',
  items_label: 'Items',
  highest_buy_price: 'Highest buy',
  last_update: 'Last update',
  summary: 'Summary',
  ranking: 'Ranking',

  // Favorites
  no_favorites_title: 'No favorites',
  no_favorites_desc: 'Add items to favorites by tapping the star on the market list.',
  loading_favorites: 'Loading favorites...',
  favorites_not_found: 'Favorite items were not found on this world.',

  // WorldSelect
  search_world: 'Search world...',
  loading_worlds: 'Loading worlds...',

  // Item detail
  loading_item: 'Loading item data...',
  item_not_found: 'Failed to load data.',
  active_offers: 'Active offers',
  loading_ellipsis: 'Loading...',
  no_buy_offers: 'No buy offers',
  no_sell_offers: 'No sell offers',
  no_offers: 'No active offers',
  price_history: 'Price history',
  no_history: 'No historical data',
  price: 'Price',
  volume: 'Volume',
  loading_chart: 'Loading chart...',
  buy_legend: 'Buy',
  sell_legend: 'Sell',
  monthly_stats: 'Monthly stats',
  avg_buy_price: 'Avg. buy price',
  avg_sell_price: 'Avg. sell price',
  sold: 'Sold',
  purchased: 'Purchased',
  highest_buy: 'Highest buy',
  lowest_sell: 'Lowest sell',
  today: 'Today',
  day_activity: 'TODAY',
  offers: 'OFFERS',
  today_avg_prefix: 'Today avg.',
  monthly_avg_prefix: 'Mo. avg.',
  item_detail_title: 'Item details',
  back_market: 'Market',
  select_world_title: 'Select world',
  load_more: 'Load more',
  no_results: 'No results',
  clear_filters: 'Clear filters',

  // Filter button
  filters: 'Filters',
  quick_filters: 'Quick filters',
  filter_yasir: 'Yasir',
  npc_buys_for: 'NPC buys for',
  npc_sells_for: 'NPC sells for',
  offer_date: 'Date',
  vocation_filter: 'Vocation',
  voc_knight: 'Knight',
  voc_paladin: 'Paladin',
  voc_sorcerer: 'Sorcerer',
  voc_druid: 'Druid',

  // Quick presets
  preset_hot: 'Hot',
  preset_flips: 'Flips',
  preset_cheap: 'Cheap',
  preset_expensive: 'Expensive',

  // Deal quality
  deal_premium: 'Great deal',
  deal_good: 'Good deal',
  margin_pct: '% margin',
  flip_score: 'Flip score',
  vs_avg: 'vs avg.',

  // Watchlist
  alert_singular: 'alert',
  alerts_plural: 'alerts',
  favorite_singular: 'favorite',
  favorites_plural: 'favorites',
  syncing: 'syncing…',
  active_label: 'active',
  active_label_one: 'active',
  active_label_few: 'active',
  active_label_many: 'active',

  // World select
  worlds_count_one: 'world',
  worlds_count_few: 'worlds',
  worlds_count_many: 'worlds',
};
