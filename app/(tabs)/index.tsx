import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorld } from '@/src/context/WorldContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { MarketItemCard } from '@/src/components/MarketItemCard';
import { SearchBar } from '@/src/components/SearchBar';
import { SortPicker } from '@/src/components/SortPicker';
import { WorldBadge } from '@/src/components/WorldBadge';
import { SkeletonCard } from '@/src/components/SkeletonCard';
import { FilterPanel, FilterState, DEFAULT_FILTERS, countActiveFilters } from '@/src/components/FilterPanel';
import { ErrorState } from '@/src/components/ErrorState';
import { colors } from '@/src/theme/colors';
import { SortField } from '@/src/api/tibiaMarket';

const PAGE_SIZE = 50;

export default function MarketScreen() {
  const { selectedWorld } = useWorld();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('month_sold');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [offset, setOffset] = useState(0);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFilterCount = countActiveFilters(filters);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <WorldBadge />,
      headerRightContainerStyle: { paddingRight: 12 },
    });
  }, [navigation]);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
      setOffset(0);
    }, 350);
  }, []);

  const queryOptions = useMemo(
    () => ({
      sort_field: sortField,
      sort_order: sortOrder,
      rows: PAGE_SIZE,
      offset,
      name: debouncedSearch || undefined,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      minBuyPrice: filters.minBuyPrice ? Number(filters.minBuyPrice) : undefined,
      maxBuyPrice: filters.maxBuyPrice ? Number(filters.maxBuyPrice) : undefined,
      minSellPrice: filters.minSellPrice ? Number(filters.minSellPrice) : undefined,
      maxSellPrice: filters.maxSellPrice ? Number(filters.maxSellPrice) : undefined,
      minVolume: filters.minVolume ? Number(filters.minVolume) : undefined,
      minMargin: filters.minMargin ? Number(filters.minMargin) : undefined,
    }),
    [sortField, sortOrder, offset, debouncedSearch, filters]
  );

  const { data, isLoading, isError, refetch, isFetching } = useMarketBoard(
    selectedWorld,
    queryOptions
  );

  const handleSortChange = useCallback((field: SortField, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
    setOffset(0);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && data?.items && data.items.length === PAGE_SIZE) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [isFetching, data]);

  const handleApplyFilters = useCallback((f: FilterState) => {
    setFilters(f);
    setOffset(0);
  }, []);

  if (isError) {
    return (
      <ErrorState
        message="Nie udało się pobrać danych marketu. Sprawdź połączenie."
        onRetry={refetch}
      />
    );
  }

  const showSkeleton = isLoading && !data;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={handleSearchChange} />
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

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          <View style={[styles.pulse, isFetching && styles.pulseLive]} />
          <Text style={styles.statsText}>
            {showSkeleton ? 'Ładowanie...' : `${data?.items.length ?? 0} przedmiotów`}
          </Text>
          <Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsWorld}>{selectedWorld}</Text>
        </View>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={() => { setFilters(DEFAULT_FILTERS); setOffset(0); }}>
            <Text style={styles.clearFilters}>Wyczyść filtry ×</Text>
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
          data={data?.items ?? []}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <MarketItemCard item={item} world={selectedWorld} />
          )}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !!data}
              onRefresh={() => {
                setOffset(0);
                refetch();
              }}
              tintColor={colors.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="package-variant-closed" size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Brak wyników</Text>
              <Text style={styles.emptyText}>
                {debouncedSearch
                  ? `Nie znaleziono "${debouncedSearch}"`
                  : 'Zmień filtry lub świat'}
              </Text>
            </View>
          }
          ListFooterComponent={
            data?.items && data.items.length === PAGE_SIZE ? (
              <TouchableOpacity style={styles.loadMore} onPress={handleLoadMore}>
                <LinearGradient
                  colors={[colors.surfaceElevated, colors.card]}
                  style={styles.loadMoreGrad}
                >
                  <MaterialCommunityIcons name="chevron-down" size={16} color={colors.gold} />
                  <Text style={styles.loadMoreText}>Załaduj więcej</Text>
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
