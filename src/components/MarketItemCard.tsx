import React, { memo } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MarketItem, formatGold } from '../api/tibiaMarket';
import { colors } from '../theme/colors';
import { useWorld } from '../context/WorldContext';
import { ItemImage } from './ItemImage';

interface MarketItemCardProps {
  item: MarketItem;
  world: string;
}

function PriceTrend({ current, average }: { current: number | null; average: number | null }) {
  if (current == null || average == null || average === 0) return null;
  const diff = ((current - average) / average) * 100;
  const up = diff > 0;
  const icon = up ? 'trending-up' : 'trending-down';
  const color = up ? colors.sell : colors.buy;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 }}>
      <MaterialCommunityIcons name={icon as any} size={11} color={color} />
      <Text style={{ color, fontSize: 10, fontWeight: '600' }}>
        {Math.abs(diff).toFixed(1)}%
      </Text>
    </View>
  );
}

export const MarketItemCard = memo(function MarketItemCard({
  item,
  world,
}: MarketItemCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useWorld();
  const { width } = useWindowDimensions();
  const narrow = width < 400;
  const favorite = isFavorite(item.name);

  const margin =
    item.sell_offer != null && item.buy_offer != null
      ? item.sell_offer - item.buy_offer
      : null;

  const marginPct =
    margin != null && item.buy_offer != null && item.buy_offer > 0
      ? (margin / item.buy_offer) * 100
      : null;

  const marginBarWidth =
    marginPct != null ? Math.min(marginPct / 30, 1) : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/item/[name]',
          params: { name: item.name, world },
        })
      }
      activeOpacity={0.8}
    >
      {/* Top row: image + name + category + star */}
      <View style={styles.topRow}>
        <View style={styles.imgWrap}>
          <ItemImage wikiName={item.wiki_name} size={42} />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.category && (
            <View style={styles.catBadge}>
              <Text style={styles.catText}>{item.category}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.starBtn}
        >
          <MaterialCommunityIcons
            name={favorite ? 'star' : 'star-outline'}
            size={18}
            color={favorite ? colors.gold : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerH} />

      {/* Price row */}
      <View style={styles.pricesRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>KUPNO</Text>
          <Text style={[styles.priceValue, { color: colors.buy, fontSize: narrow ? 14 : 16 }]}>
            {formatGold(item.buy_offer)}
          </Text>
          {!narrow && <Text style={styles.avgLabel}>śr. {formatGold(item.month_average_buy)}</Text>}
          <PriceTrend current={item.buy_offer} average={item.month_average_buy} />
        </View>

        <View style={styles.dividerV} />

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>SPRZEDAŻ</Text>
          <Text style={[styles.priceValue, { color: colors.sell, fontSize: narrow ? 14 : 16 }]}>
            {formatGold(item.sell_offer)}
          </Text>
          {!narrow && <Text style={styles.avgLabel}>śr. {formatGold(item.month_average_sell)}</Text>}
          <PriceTrend current={item.sell_offer} average={item.month_average_sell} />
        </View>

        <View style={styles.dividerV} />

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>OBRÓT/M.</Text>
          <Text style={[styles.priceValue, { fontSize: narrow ? 14 : 16 }]}>
            {item.month_sold != null ? item.month_sold.toLocaleString() : '—'}
          </Text>
          <Text style={styles.avgLabel}>szt.</Text>
        </View>
      </View>

      {/* Margin bar */}
      {margin != null && margin > 0 && (
        <View style={styles.marginRow}>
          <Text style={styles.marginLabel}>MARŻA</Text>
          <Text style={styles.marginValue}>{formatGold(margin)}</Text>
          {marginPct != null && (
            <Text style={styles.marginPct}>{marginPct.toFixed(1)}%</Text>
          )}
          <View style={styles.barWrap}>
            <View style={styles.barTrack}>
              <LinearGradient
                colors={[colors.buy, colors.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, { width: `${Math.round(marginBarWidth * 100)}%` }]}
              />
            </View>
          </View>
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
    borderRadius: 14,
    marginHorizontal: 12,
    marginVertical: 5,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  imgWrap: {
    width: 44,
    height: 44,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  titleCol: {
    flex: 1,
    gap: 5,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  catText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  starBtn: {
    padding: 2,
  },
  dividerH: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 14,
  },
  pricesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  priceBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  priceLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  priceValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  avgLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  dividerV: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
  },
  marginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexWrap: 'nowrap',
  },
  marginLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  marginValue: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: '700',
  },
  marginPct: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  barWrap: {
    flex: 1,
  },
  barTrack: {
    height: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 4,
  },
});
