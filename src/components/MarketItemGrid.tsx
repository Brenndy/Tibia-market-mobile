import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { MarketItem } from '@/src/api/tibiaMarket';
import { MarketItemCard } from '@/src/components/MarketItemCard';

interface MarketItemGridProps {
  items: MarketItem[];
  world: string;
  numColumns: number;
  onItemPress?: (name: string) => void;
}

// Per-item wrapper: shared between Animated.FlatList renderItem on the
// market page and plain .map() usage in watchlist sections. Exporting it
// means the grid visuals stay aligned by construction.
export function MarketItemGridItem({
  item,
  world,
  numColumns,
  onPress,
  footerSlot,
}: {
  item: MarketItem;
  world: string;
  numColumns: number;
  onPress?: () => void;
  footerSlot?: React.ReactNode;
}) {
  const isGrid = numColumns > 1;
  const flexBasis: DimensionValue | undefined = isGrid
    ? (`${100 / numColumns}%` as DimensionValue)
    : undefined;
  return (
    <View style={isGrid ? [styles.gridItem, { flexBasis }] : undefined}>
      <MarketItemCard
        item={item}
        world={world}
        stretch={isGrid}
        onPress={onPress}
        footerSlot={footerSlot}
      />
    </View>
  );
}

export function MarketItemGrid({ items, world, numColumns, onItemPress }: MarketItemGridProps) {
  const isGrid = numColumns > 1;
  return (
    <View style={isGrid ? styles.grid : styles.list}>
      {items.map((item) => (
        <MarketItemGridItem
          key={`${world}-${item.id}`}
          item={item}
          world={world}
          numColumns={numColumns}
          onPress={isGrid && onItemPress ? () => onItemPress(item.name) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  list: { gap: 8 },
  gridItem: { padding: 6 },
});
