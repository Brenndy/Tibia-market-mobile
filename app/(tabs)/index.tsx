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
import { useWorld } from '@/src/context/WorldContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { MarketItemCard } from '@/src/components/MarketItemCard';
import { SearchBar } from '@/src/components/SearchBar';
import { SortPicker } from '@/src/components/SortPicker';
import { WorldBadge } from '@/src/components/WorldBadge';
import { LoadingState } from '@/src/components/LoadingState';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    }, 400);
  }, []);

  const queryOptions = useMemo(
    () => ({
      sort_field: sortField,
      sort_order: sortOrder,
      rows: PAGE_SIZE,
      offset,
      name: debouncedSearch || undefined,
    }),
    [sortField, sortOrder, offset, debouncedSearch]
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

  if (isLoading && !data) {
    return <LoadingState message="Pobieranie danych marketu..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Nie udało się pobrać danych marketu. Sprawdź połączenie."
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters bar */}
      <View style={styles.filtersBar}>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={handleSearchChange} />
        </View>
        <SortPicker
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      </View>

      {/* Summary row */}
      {data && (
        <View style={styles.summaryRow}>
          <MaterialCommunityIcons name="update" size={12} color={colors.textMuted} />
          <Text style={styles.summaryText}>
            {data.items.length} przedmiotów · {data.world}
          </Text>
          {isFetching && (
            <Text style={[styles.summaryText, { color: colors.gold }]}>Aktualizacja...</Text>
          )}
        </View>
      )}

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
            <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Brak wyników dla "{debouncedSearch}"</Text>
          </View>
        }
        ListFooterComponent={
          data?.items && data.items.length === PAGE_SIZE ? (
            <TouchableOpacity style={styles.loadMore} onPress={handleLoadMore}>
              <Text style={styles.loadMoreText}>Załaduj więcej</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filtersBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchWrap: {
    flex: 1.5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 5,
    backgroundColor: colors.background,
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  list: {
    paddingVertical: 6,
    paddingBottom: 20,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  loadMoreText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 14,
  },
});
