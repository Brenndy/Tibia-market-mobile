import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorld } from '@/src/context/WorldContext';
import { useTranslation } from '@/src/context/LanguageContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { MarketItemCard } from '@/src/components/MarketItemCard';
import { ItemSearchBar } from '@/src/components/ItemSearchBar';
import { SortPicker } from '@/src/components/SortPicker';
import { SkeletonCard } from '@/src/components/SkeletonCard';
import { FilterPanel, FilterState, DEFAULT_FILTERS, countActiveFilters } from '@/src/components/FilterPanel';
import { ErrorState } from '@/src/components/ErrorState';
import { colors } from '@/src/theme/colors';
import { SortField, filterAndSortItems } from '@/src/api/tibiaMarket';

const PAGE_SIZE = 50;
const INITIAL_COUNT = 50;

type PresetId = 'none' | 'hot' | 'flips' | 'cheap' | 'expensive';

interface Preset {
  id: PresetId;
  icon: string;
  labelKey: 'preset_hot' | 'preset_flips' | 'preset_cheap' | 'preset_expensive';
  sort: SortField;
  order: 'asc' | 'desc';
  filters: Partial<FilterState>;
}

const PRESETS: Preset[] = [
  {
    id: 'hot',
    icon: 'fire',
    labelKey: 'preset_hot',
    sort: 'month_sold',
    order: 'desc',
    filters: {},
  },
  {
    id: 'flips',
    icon: 'swap-horizontal-bold',
    labelKey: 'preset_flips',
    sort: 'margin',
    order: 'desc',
    filters: { minMargin: '500' },
  },
  {
    id: 'cheap',
    icon: 'trending-down',
    labelKey: 'preset_cheap',
    sort: 'buy_offer',
    order: 'asc',
    filters: {},
  },
  {
    id: 'expensive',
    icon: 'diamond-stone',
    labelKey: 'preset_expensive',
    sort: 'sell_offer',
    order: 'desc',
    filters: {},
  },
];

export default function MarketScreen() {
  const { selectedWorld } = useWorld();
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('month_sold');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activePreset, setActivePreset] = useState<PresetId>('hot');
  const activeFilterCount = countActiveFilters(filters);

  const handleSelectedItemsChange = useCallback((items: string[]) => {
    setSelectedItems(items);
    setDisplayCount(INITIAL_COUNT);
  }, []);

  const handlePresetSelect = useCallback((preset: Preset) => {
    if (activePreset === preset.id) {
      // Deactivate
      setActivePreset('none');
      setSortField('month_sold');
      setSortOrder('desc');
      setFilters(DEFAULT_FILTERS);
    } else {
      setActivePreset(preset.id);
      setSortField(preset.sort);
      setSortOrder(preset.order);
      setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
    }
    setSelectedItems([]);
    setDisplayCount(INITIAL_COUNT);
  }, [activePreset]);

  const { data: rawData, isLoading, isError, refetch, isFetching } = useMarketBoard(selectedWorld);

  const filteredItems = useMemo(() => {
    if (!rawData) return [];
    return filterAndSortItems(rawData.items, {
      sort_field: sortField,
      sort_order: sortOrder,
      selectedItemNames: selectedItems.length > 0 ? selectedItems : undefined,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      minBuyPrice: filters.minBuyPrice ? Number(filters.minBuyPrice) : undefined,
      maxBuyPrice: filters.maxBuyPrice ? Number(filters.maxBuyPrice) : undefined,
      minSellPrice: filters.minSellPrice ? Number(filters.minSellPrice) : undefined,
      maxSellPrice: filters.maxSellPrice ? Number(filters.maxSellPrice) : undefined,
      minVolume: filters.minVolume ? Number(filters.minVolume) : undefined,
      minMargin: filters.minMargin ? Number(filters.minMargin) : undefined,
    });
  }, [rawData, sortField, sortOrder, selectedItems, filters]);

  const handleSortChange = useCallback((field: SortField, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
    setActivePreset('none');
    setDisplayCount(INITIAL_COUNT);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isFetching) {
      setDisplayCount((prev) => prev + PAGE_SIZE);
    }
  }, [isFetching]);

  const handleApplyFilters = useCallback((f: FilterState) => {
    setFilters(f);
    setActivePreset('none');
    setDisplayCount(INITIAL_COUNT);
  }, []);

  if (isError) {
    return (
      <ErrorState
        message={t('item_not_found')}
        onRetry={refetch}
      />
    );
  }

  const showSkeleton = isLoading && !rawData;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <ItemSearchBar
            selectedItems={selectedItems}
            onSelectedItemsChange={handleSelectedItemsChange}
            placeholder={t('search_placeholder')}
          />
        </View>
        <SortPicker
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterPanelOpen(true)}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={18}
            color={activeFilterCount > 0 ? colors.gold : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick presets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.presetsScroll}
        contentContainerStyle={styles.presetsContent}
      >
        {PRESETS.map((preset) => {
          const active = activePreset === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => handlePresetSelect(preset)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={preset.icon as any}
                size={13}
                color={active ? colors.background : colors.textMuted}
              />
              <Text style={[styles.presetText, active && styles.presetTextActive]}>
                {t(preset.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          <View style={[styles.pulse, isFetching && styles.pulseLive]} />
          <Text style={styles.statsText}>
            {showSkeleton
              ? t('loading')
              : `${Math.min(displayCount, filteredItems.length)}/${filteredItems.length} ${t('items_label').toLowerCase()}`}
          </Text>
          <Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsWorld}>{selectedWorld}</Text>
        </View>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={() => { setFilters(DEFAULT_FILTERS); setActivePreset('none'); setSelectedItems([]); setDisplayCount(INITIAL_COUNT); }}>
            <Text style={styles.clearFilters}>{t('clear_filters')} ×</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSkeleton ? (
        <FlatList
          data={Array(7).fill(0)}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={filteredItems.slice(0, displayCount)}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <MarketItemCard item={item} world={selectedWorld} />
          )}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !!rawData}
              onRefresh={() => {
                setDisplayCount(INITIAL_COUNT);
                refetch();
              }}
              tintColor={colors.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="package-variant-closed" size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{t('no_results')}</Text>
              <Text style={styles.emptyText}>
                {selectedItems.length > 0 ? selectedItems.map(n => `"${n}"`).join(', ') : t('clear_filters')}
              </Text>
            </View>
          }
          ListFooterComponent={
            displayCount < filteredItems.length ? (
              <TouchableOpacity style={styles.loadMore} onPress={handleLoadMore}>
                <LinearGradient
                  colors={[colors.surfaceElevated, colors.card]}
                  style={styles.loadMoreGrad}
                >
                  <MaterialCommunityIcons name="chevron-down" size={16} color={colors.gold} />
                  <Text style={styles.loadMoreText}>{t('load_more')} ({filteredItems.length - displayCount})</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <FilterPanel
        visible={filterPanelOpen}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFilterPanelOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1.5,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
  },
  filterBtnActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.gold,
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: '800',
  },
  presetsScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexGrow: 0,
  },
  presetsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  presetChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  presetText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.background,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.background,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  pulseLive: {
    backgroundColor: colors.gold,
  },
  statsText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statsDot: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statsWorld: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '600',
  },
  clearFilters: {
    color: colors.sell,
    fontSize: 11,
    fontWeight: '600',
  },
  list: {
    paddingVertical: 6,
    paddingBottom: 24,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  loadMore: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  loadMoreGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  loadMoreText: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 14,
  },
});
