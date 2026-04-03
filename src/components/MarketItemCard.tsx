import React, { memo } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MarketItem, formatGold } from '../api/tibiaMarket';
import { colors } from '../theme/colors';
import { useWorld } from '../context/WorldContext';

interface MarketItemCardProps {
  item: MarketItem;
  world: string;
}

export const MarketItemCard = memo(function MarketItemCard({
  item,
  world,
}: MarketItemCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useWorld();
  const favorite = isFavorite(item.name);

  const spread =
    item.sell_offer !== null && item.buy_offer !== null
      ? item.sell_offer - item.buy_offer
      : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/item/[name]',
          params: { name: item.name, world },
        })
      }
      activeOpacity={0.75}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.name)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name={favorite ? 'star' : 'star-outline'}
            size={18}
            color={favorite ? colors.gold : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Price row */}
      <View style={styles.pricesRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Kupno</Text>
          <Text style={[styles.priceValue, { color: colors.buy }]}>
            {formatGold(item.buy_offer)}
          </Text>
          <Text style={styles.avgText}>śr. {formatGold(item.month_average_buy)}</Text>
        </View>

        <View style={styles.priceDivider} />

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Sprzedaż</Text>
          <Text style={[styles.priceValue, { color: colors.sell }]}>
            {formatGold(item.sell_offer)}
          </Text>
          <Text style={styles.avgText}>śr. {formatGold(item.month_average_sell)}</Text>
        </View>

        <View style={styles.priceDivider} />

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Obrót/mies.</Text>
          <Text style={styles.priceValue}>
            {item.month_sold ?? '—'}
          </Text>
          <Text style={styles.avgText}>szt.</Text>
        </View>
      </View>

      {/* Spread */}
      {spread !== null && spread > 0 && (
        <View style={styles.spreadRow}>
          <Text style={styles.spreadLabel}>Marża:</Text>
          <Text style={styles.spreadValue}>{formatGold(spread)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginRight: 8,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  pricesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceBlock: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  priceValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  avgText: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  priceDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  spreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 6,
  },
  spreadLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spreadValue: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
});
