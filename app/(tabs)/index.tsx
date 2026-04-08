import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
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
  const navigation = useNavigation();
  const listRef = useRef<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('month_sold');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activePreset, setActivePreset] = useState<PresetId>('hot');
  const [isMounted, setIsMounted] = useState(false);
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

  const { data: rawData, isLoading, isError, refetch } = useMarketBoard(selectedWorld);

  // Collapsing header: topBar fades+slides, presetsRow slides only
  const TOP_BAR_H = 116; // searchBar(44) + toolRow(44) + gaps/padding
  const PRESETS_H = 52;
  const HEADER_HEIGHT = TOP_BAR_H + PRESETS_H;

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const unsubscribe = navigation.getParent()?.addListener('tabPress' as any, () => {
      if (navigation.isFocused()) {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        scrollY.setValue(0);
      }
    });
    return () => unsubscribe?.();
  }, [navigation, scrollY]);

  const topBarTranslate = scrollY.interpolate({
    inputRange: [0, TOP_BAR_H],
    outputRange: [0, -TOP_BAR_H],
    extrapolate: 'clamp',
  });
  const topBarOpacity = scrollY.interpolate({
    inputRange: [0, TOP_BAR_H * 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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
      yasirOnly: filters.yasirOnly || undefined,
      vocations: filters.vocations.length > 0 ? filters.vocations : undefined,
    });
  }, [rawData, sortField, sortOrder, selectedItems, filters]);

  const handleSortChange = useCallback((field: SortField, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
    setActivePreset('none');
    setDisplayCount(INITIAL_COUNT);
  }, []);

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

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

  const showSkeleton = !isMounted || (isLoading && !rawData);

  return (
    <View style={styles.container}>
      {/* Collapsing header */}
      <View style={styles.headerWrapper}>
        {/* Top bar: fades + slides up */}
        <Animated.View style={{ transform: [{ translateY: topBarTranslate }], opacity: topBarOpacity }}>
          <View style={styles.topBar}>
            <ItemSearchBar
              selectedItems={selectedItems}
              onSelectedItemsChange={handleSelectedItemsChange}
              placeholder={t('search_placeholder')}
            />
            <View style={styles.toolRow}>
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
                  size={15}
                  color={activeFilterCount > 0 ? colors.gold : colors.textSecondary}
                />
                <Text style={[styles.filterBtnText, activeFilterCount > 0 && styles.filterBtnTextActive]}>
                  {t('filters')}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Presets + stats: slides up only (stays sharp) */}
        <Animated.View style={{ transform: [{ translateY: topBarTranslate }] }}>
          <View style={styles.presetsRow}>
            {PRESETS.map((preset) => {
              const active = activePreset === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetTab, active && styles.presetTabActive]}
                  onPress={() => handlePresetSelect(preset)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={preset.icon as any}
                    size={15}
                    color={active ? colors.gold : colors.textMuted}
                  />
                  <Text style={[styles.presetText, active && styles.presetTextActive]} numberOfLines={1}>
                    {t(preset.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {activeFilterCount > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {`${filteredItems.length} ${t('items_label').toLowerCase()}`}
              </Text>
              <TouchableOpacity onPress={() => { setFilters(DEFAULT_FILTERS); setActivePreset('none'); setSelectedItems([]); setDisplayCount(INITIAL_COUNT); }}>
                <Text style={styles.clearFilters}>{t('clear_filters')} ×</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
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
        <Animated.FlatList
          ref={listRef}
          data={filteredItems.slice(0, displayCount)}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <MarketItemCard item={item} world={selectedWorld} />
          )}
          contentContainerStyle={[styles.list, { paddingTop: HEADER_HEIGHT }]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          onScroll={handleScroll}
          scrollEventThrottle={1}
          bounces={false}
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
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  toolRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
  },
  filterBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  filterBtnTextActive: {
    color: colors.gold,
  },
  filterBtnActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  presetsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  presetTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 3,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  presetTabActive: {
    borderBottomColor: colors.gold,
  },
  presetText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.gold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.background,
  },
  statsText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  clearFilters: {
    color: colors.sell,
    fontSize: 11,
    fontWeight: '600',
  },
  list: {
    paddingVertical: 6,
    paddingBottom: 80,
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
