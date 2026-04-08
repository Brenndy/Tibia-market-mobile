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
import { MarketItem, formatGold, toTitleCase } from '../api/tibiaMarket';
import { colors } from '../theme/colors';
import { useWorld } from '../context/WorldContext';
import { useTranslation } from '../context/LanguageContext';
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

function getDealQuality(item: MarketItem): 'premium' | 'good' | 'none' {
  if (item.sell_offer == null || item.buy_offer == null || item.buy_offer <= 0) return 'none';
  const marginPct = ((item.sell_offer - item.buy_offer) / item.buy_offer) * 100;
  const volume = item.month_sold ?? 0;
  if (marginPct >= 15 && volume >= 100) return 'premium';
  if (marginPct >= 7 && volume >= 30) return 'good';
  return 'none';
}

export const MarketItemCard = memo(function MarketItemCard({
  item,
  world,
}: MarketItemCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useWorld();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const narrow = width < 400;
  const favorite = isFavorite(item.name);
  const dealQuality = getDealQuality(item);

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

  const dealColor =
    dealQuality === 'premium' ? colors.gold :
    dealQuality === 'good' ? colors.buy :
    'transparent';

  return (
    <TouchableOpacity
      style={[styles.card, dealQuality !== 'none' && { borderColor: dealColor + '60' }]}
      onPress={() =>
        router.push({
          pathname: '/item/[name]',
          params: { name: item.name, world },
        })
      }
      activeOpacity={0.8}
    >
      {/* Deal quality accent strip */}
      {dealQuality !== 'none' && (
        <View style={[styles.dealStrip, { backgroundColor: dealColor }]} />
      )}

      {/* Top row: image + name + category + star */}
      <View style={[styles.topRow, dealQuality !== 'none' && styles.topRowWithStrip]}>
        <View style={styles.imgWrap}>
          <ItemImage wikiName={item.wiki_name} size={42} />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.name} numberOfLines={1}>{toTitleCase(item.name)}</Text>
          <View style={styles.badgeRow}>
            {item.category && (
              <View style={styles.catBadge}>
                <Text style={styles.catText}>{item.category}</Text>
              </View>
            )}
            {dealQuality === 'premium' && (
              <View style={[styles.dealBadge, { backgroundColor: colors.goldDim, borderColor: colors.gold + '80' }]}>
                <MaterialCommunityIcons name="fire" size={9} color={colors.gold} />
                <Text style={[styles.dealBadgeText, { color: colors.gold }]}>{t('deal_premium')}</Text>
              </View>
            )}
            {dealQuality === 'good' && (
              <View style={[styles.dealBadge, { backgroundColor: colors.buyDim, borderColor: colors.buyBorder }]}>
                <MaterialCommunityIcons name="check-circle" size={9} color={colors.buy} />
                <Text style={[styles.dealBadgeText, { color: colors.buy }]}>{t('deal_good')}</Text>
              </View>
            )}
          </View>
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
          <Text style={styles.priceLabel}>{t('buy')}</Text>
          <Text style={[styles.priceValue, { color: colors.buy, fontSize: narrow ? 14 : 16 }]}>
            {formatGold(item.buy_offer)}
          </Text>
          {!narrow && <Text style={styles.avgLabel}>{t('avg_prefix')} {formatGold(item.month_average_buy)}</Text>}
          <PriceTrend current={item.buy_offer} average={item.month_average_buy} />
        </View>

        <View style={styles.dividerV} />

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>{t('sell')}</Text>
          <Text style={[styles.priceValue, { color: colors.sell, fontSize: narrow ? 14 : 16 }]}>
            {formatGold(item.sell_offer)}
          </Text>
          {!narrow && <Text style={styles.avgLabel}>{t('avg_prefix')} {formatGold(item.month_average_sell)}</Text>}
          <PriceTrend current={item.sell_offer} average={item.month_average_sell} />
        </View>

        <View style={styles.dividerV} />

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>{t('volume_monthly')}</Text>
          <Text style={[styles.priceValue, { fontSize: narrow ? 14 : 16 }]}>
            {item.month_sold != null ? item.month_sold.toLocaleString() : '—'}
          </Text>
          <Text style={styles.avgLabel}>{t('units')}</Text>
        </View>
      </View>

      {/* Active offers */}
      {((item.buy_offers ?? 0) > 0 || (item.sell_offers ?? 0) > 0) && (
        <View style={styles.activityRow}>
          <Text style={styles.activityHeader}>{t('offers')}</Text>
          <View style={styles.activityPills}>
            {(item.buy_offers ?? 0) > 0 && (
              <View style={[styles.activityPill, styles.activityPillBuy]}>
                <Text style={styles.activityPillLabel}>{t('buy')}</Text>
                <Text style={styles.activityPillValueBuy}>
                  {(item.buy_offers as number).toLocaleString()}
                </Text>
              </View>
            )}
            {(item.sell_offers ?? 0) > 0 && (
              <View style={[styles.activityPill, styles.activityPillSell]}>
                <Text style={styles.activityPillLabel}>{t('sell')}</Text>
                <Text style={styles.activityPillValueSell}>
                  {(item.sell_offers as number).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Margin bar */}
      {margin != null && margin > 0 && (
        <View style={styles.marginRow}>
          <Text style={styles.marginLabel}>{t('margin')}</Text>
          <Text style={styles.marginValue}>{formatGold(margin)}</Text>
          {marginPct != null && (
            <Text style={[styles.marginPct, marginPct >= 15 ? { color: colors.gold } : marginPct >= 7 ? { color: colors.buy } : {}]}>
              {marginPct.toFixed(1)}%
            </Text>
          )}
          <View style={styles.barWrap}>
            <View style={styles.barTrack}>
              <LinearGradient
                colors={marginPct != null && marginPct >= 15 ? [colors.goldDark, colors.gold] : [colors.buy, colors.buy + 'aa']}
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
  dealStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  topRowWithStrip: {
    paddingLeft: 18,
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
  badgeRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
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
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dealBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    paddingBottom: 8,
    paddingTop: 6,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexWrap: 'nowrap',
  },
  marginLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  marginValue: {
    color: colors.goldLight,
    fontSize: 12,
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
    height: 5,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
    minWidth: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 8,
  },
  activityHeader: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    minWidth: 28,
  },
  activityPills: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  activityPillBuy: {
    backgroundColor: colors.buyDim,
    borderColor: colors.buyBorder,
  },
  activityPillSell: {
    backgroundColor: colors.sellDim,
    borderColor: colors.sellBorder,
  },
  activityPillLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  activityPillValueBuy: {
    color: colors.buy,
    fontSize: 11,
    fontWeight: '700',
  },
  activityPillValueSell: {
    color: colors.sell,
    fontSize: 11,
    fontWeight: '700',
  },
});
