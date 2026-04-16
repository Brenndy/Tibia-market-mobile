import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
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
import { GoldSpinner } from '@/src/components/LoadingState';
import { ItemDetailModal } from '@/src/components/ItemDetailModal';
import {
  FilterPanel,
  FilterState,
  DEFAULT_FILTERS,
  countActiveFilters,
} from '@/src/components/FilterPanel';
import { ErrorState } from '@/src/components/ErrorState';
import { colors } from '@/src/theme/colors';
import { SortField, filterAndSortItems } from '@/src/api/tibiaMarket';
import { storage } from '@/src/utils/storage';

const PAGE_SIZE = 50;
const INITIAL_COUNT = 50;
const DESKTOP_BREAKPOINT = 900;
const VIEW_MODE_KEY = 'tibia_view_mode_v1';
type ViewMode = 'list' | 'grid';

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
  const [showFab, setShowFab] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;
  const activeFilterCount = countActiveFilters(filters);
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const [viewMode, setViewModeState] = useState<ViewMode>('list');
  const numColumns = isDesktop && viewMode === 'grid' ? (width >= 1400 ? 3 : 2) : 1;

  useEffect(() => {
    storage.getItem(VIEW_MODE_KEY).then((v) => {
      if (v === 'grid' || v === 'list') setViewModeState(v);
    });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    storage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  const [modalItemName, setModalItemName] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(fabAnim, {
      toValue: showFab ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showFab, fabAnim]);

  const handleSelectedItemsChange = useCallback((items: string[]) => {
    setSelectedItems(items);
    setDisplayCount(INITIAL_COUNT);
  }, []);

  const { data: rawData, isLoading, isError, refetch } = useMarketBoard(selectedWorld);

  const TOP_BAR_H = 116;
  const HEADER_HEIGHT = TOP_BAR_H;

  const scrollY = useRef(new Animated.Value(0)).current;

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
    setDisplayCount(INITIAL_COUNT);
  }, []);

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  }, []);

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
    listener: (e: any) => {
      const y = e.nativeEvent.contentOffset.y;
      setShowFab(y > TOP_BAR_H);
    },
  });

  const handleApplyFilters = useCallback((f: FilterState) => {
    setFilters(f);
    setDisplayCount(INITIAL_COUNT);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  if (isError) {
    return <ErrorState message={t('item_not_found')} onRetry={refetch} />;
  }

  const showSkeleton = isLoading && !rawData;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <Animated.View
          style={{
            transform: [{ translateY: topBarTranslate }],
            opacity: topBarOpacity,
            zIndex: 2,
          }}
        >
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
                <Text
                  style={[
                    styles.filterBtnText,
                    activeFilterCount > 0 && styles.filterBtnTextActive,
                  ]}
                >
                  {t('filters')}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              </TouchableOpacity>
              {isDesktop && (
                <View style={styles.viewToggle}>
                  <TouchableOpacity
                    style={[
                      styles.viewToggleBtn,
                      viewMode === 'list' && styles.viewToggleBtnActive,
                    ]}
                    onPress={() => setViewMode('list')}
                  >
                    <MaterialCommunityIcons
                      name="view-agenda"
                      size={16}
                      color={viewMode === 'list' ? colors.gold : colors.textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.viewToggleBtn,
                      viewMode === 'grid' && styles.viewToggleBtnActive,
                    ]}
                    onPress={() => setViewMode('grid')}
                  >
                    <MaterialCommunityIcons
                      name="view-grid"
                      size={16}
                      color={viewMode === 'grid' ? colors.gold : colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {activeFilterCount > 0 && (
          <Animated.View style={{ transform: [{ translateY: topBarTranslate }] }}>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {`${filteredItems.length} ${t('items_label').toLowerCase()}`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFilters(DEFAULT_FILTERS);
                  setSelectedItems([]);
                  setDisplayCount(INITIAL_COUNT);
                }}
              >
                <Text style={styles.clearFilters}>{t('clear_filters')} ×</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>

      {showSkeleton ? (
        <View style={styles.loaderCenter}>
          <GoldSpinner size={64} />
          <Text style={styles.loaderText}>{t('loading')}</Text>
        </View>
      ) : (
        <Animated.FlatList
          ref={listRef}
          key={`grid-${numColumns}`}
          data={filteredItems.slice(0, displayCount)}
          keyExtractor={(item) => item.name}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
          renderItem={({ item }) => (
            <View style={numColumns > 1 ? styles.gridItem : undefined}>
              <MarketItemCard
                item={item}
                world={selectedWorld}
                onPress={numColumns > 1 ? () => setModalItemName(item.name) : undefined}
                stretch={numColumns > 1}
              />
            </View>
          )}
          contentContainerStyle={[styles.list, { paddingTop: HEADER_HEIGHT + 12 }]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={52}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>{t('no_results')}</Text>
              <Text style={styles.emptyText}>
                {selectedItems.length > 0
                  ? selectedItems.map((n) => `"${n}"`).join(', ')
                  : t('clear_filters')}
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
                  <Text style={styles.loadMoreText}>
                    {t('load_more')} ({filteredItems.length - displayCount})
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <Animated.View
        style={[
          styles.fab,
          {
            opacity: fabAnim,
            transform: [{ scale: fabAnim }],
          },
        ]}
        pointerEvents={showFab ? 'auto' : 'none'}
      >
        <TouchableOpacity style={styles.fabBtn} onPress={scrollToTop} activeOpacity={0.85}>
          <MaterialCommunityIcons name="chevron-up" size={24} color={colors.background} />
        </TouchableOpacity>
      </Animated.View>

      <FilterPanel
        visible={filterPanelOpen}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFilterPanelOpen(false)}
      />

      <ItemDetailModal
        name={modalItemName}
        world={selectedWorld}
        onClose={() => setModalItemName(null)}
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    height: 44,
    overflow: 'hidden',
  },
  viewToggleBtn: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: colors.goldDim,
  },
  gridRow: {
    gap: 0,
    alignItems: 'stretch',
  },
  gridItem: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  fabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loaderText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
