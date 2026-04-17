import React, { memo, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarketItem, formatGold, toTitleCase } from '../api/tibiaMarket';
import { colors } from '../theme/colors';
import { useWorld } from '../context/WorldContext';
import { useWatchlist, isAlertTriggered } from '../context/WatchlistContext';
import { useTranslation } from '../context/LanguageContext';
import { ItemImage } from './ItemImage';
import { WatchAlertModal } from './WatchAlertModal';

const MARGIN_DISPLAY_CAP = 500;

interface Props {
  item: MarketItem;
  world: string;
  onPress: () => void;
}

function TrendChip({ current, average }: { current: number | null; average: number | null }) {
  if (current == null || average == null || average === 0) return null;
  const diff = ((current - average) / average) * 100;
  const up = diff > 0;
  const icon = up ? 'trending-up' : 'trending-down';
  const color = up ? colors.sell : colors.buy;
  return (
    <View style={styles.trend}>
      <MaterialCommunityIcons name={icon as any} size={10} color={color} />
      <Text style={[styles.trendText, { color }]}>{Math.abs(diff).toFixed(1)}%</Text>
    </View>
  );
}

export const MarketItemRow = memo(function MarketItemRow({ item, world, onPress }: Props) {
  const { toggleFavorite, isFavorite } = useWorld();
  const { isWatched, addToWatchlist, removeFromWatchlist, getAlert } = useWatchlist();
  const [watchModalVisible, setWatchModalVisible] = useState(false);
  const favorite = isFavorite(item.name, world);
  const watched = isWatched(item.name, world);
  const existingAlert = getAlert(item.name, world);
  const triggered = existingAlert
    ? isAlertTriggered(existingAlert, item.buy_offer, item.sell_offer)
    : { buy: false, sell: false };
  const alertFiring = triggered.buy || triggered.sell;

  const margin =
    item.sell_offer != null && item.buy_offer != null ? item.sell_offer - item.buy_offer : null;
  const marginPct =
    margin != null && item.buy_offer != null && item.buy_offer > 0
      ? (margin / item.buy_offer) * 100
      : null;
  const marginIsOutlier = marginPct != null && marginPct >= MARGIN_DISPLAY_CAP;
  const marginBarWidth = marginPct != null ? Math.min(marginPct / 30, 1) : 0;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[styles.row, alertFiring && styles.rowTriggered]}
      >
        {/* Icon + name + category */}
        <View style={styles.nameCell}>
          <View style={styles.imgWrap}>
            <ItemImage wikiName={item.wiki_name} size={32} />
          </View>
          <View style={styles.nameCol}>
            <Text style={styles.name} numberOfLines={1}>
              {toTitleCase(item.name)}
            </Text>
            {item.category && (
              <Text style={styles.category} numberOfLines={1}>
                {item.category}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.priceCell}>
          <Text style={[styles.price, { color: colors.buy }]}>{formatGold(item.buy_offer)}</Text>
          <TrendChip current={item.buy_offer} average={item.month_average_buy} />
        </View>

        <View style={styles.priceCell}>
          <Text style={[styles.price, { color: colors.sell }]}>{formatGold(item.sell_offer)}</Text>
          <TrendChip current={item.sell_offer} average={item.month_average_sell} />
        </View>

        <View style={styles.volCell}>
          <Text style={styles.vol}>
            {item.month_sold != null ? item.month_sold.toLocaleString() : '—'}
          </Text>
        </View>

        <View style={styles.offersCell}>
          {(item.buy_offers ?? 0) > 0 && (
            <View style={[styles.pill, styles.pillBuy]}>
              <Text style={[styles.pillText, { color: colors.buy }]}>
                {(item.buy_offers as number).toLocaleString()}
              </Text>
            </View>
          )}
          {(item.sell_offers ?? 0) > 0 && (
            <View style={[styles.pill, styles.pillSell]}>
              <Text style={[styles.pillText, { color: colors.sell }]}>
                {(item.sell_offers as number).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.marginCell}>
          {margin != null && margin > 0 && marginPct != null ? (
            <>
              <View style={styles.marginTop}>
                <Text style={styles.marginValue}>{formatGold(margin)}</Text>
                <Text
                  style={[
                    styles.marginPct,
                    marginIsOutlier
                      ? { color: colors.textMuted }
                      : marginPct >= 15
                        ? { color: colors.gold }
                        : marginPct >= 7
                          ? { color: colors.buy }
                          : {},
                  ]}
                >
                  {marginIsOutlier ? `${MARGIN_DISPLAY_CAP}%+` : `${marginPct.toFixed(1)}%`}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <LinearGradient
                  colors={
                    marginIsOutlier
                      ? [colors.textMuted + '60', colors.textMuted + '60']
                      : marginPct >= 15
                        ? [colors.goldDark, colors.gold]
                        : [colors.buy, colors.buy + 'aa']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${Math.round(marginBarWidth * 100)}%` }]}
                />
              </View>
            </>
          ) : (
            <Text style={styles.placeholderDash}>—</Text>
          )}
        </View>

        <View style={styles.actionsCell}>
          <TouchableOpacity
            testID={`row-bell-${item.name}`}
            onPress={(e: any) => {
              e?.stopPropagation?.();
              e?.preventDefault?.();
              setWatchModalVisible(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.iconBtn,
              watched && styles.iconBtnActive,
              alertFiring && styles.iconBtnTriggered,
            ]}
          >
            <MaterialCommunityIcons
              name={alertFiring ? 'bell-ring' : watched ? 'bell' : 'bell-outline'}
              size={16}
              color={watched ? colors.gold : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            testID={`row-star-${item.name}`}
            onPress={(e: any) => {
              e?.stopPropagation?.();
              e?.preventDefault?.();
              toggleFavorite(item.name, world);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.iconBtn, favorite && styles.iconBtnActive]}
          >
            <MaterialCommunityIcons
              name={favorite ? 'star' : 'star-outline'}
              size={16}
              color={favorite ? colors.gold : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {watchModalVisible && (
        <WatchAlertModal
          visible={watchModalVisible}
          itemName={item.name}
          wikiName={item.wiki_name}
          world={world}
          currentBuy={item.buy_offer}
          currentSell={item.sell_offer}
          initialBuyAlert={existingAlert?.buyAlert ?? null}
          initialSellAlert={existingAlert?.sellAlert ?? null}
          initialBuyAlertCondition={existingAlert?.buyAlertCondition}
          initialSellAlertCondition={existingAlert?.sellAlertCondition}
          isEditing={watched}
          onSave={(buy, sell, buyCond, sellCond) => {
            if (buy == null && sell == null) {
              removeFromWatchlist(item.name, world);
            } else {
              addToWatchlist({
                itemName: item.name,
                wikiName: item.wiki_name,
                world,
                buyAlert: buy,
                sellAlert: sell,
                buyAlertCondition: buyCond,
                sellAlertCondition: sellCond,
              });
            }
          }}
          onRemove={() => removeFromWatchlist(item.name, world)}
          onClose={() => setWatchModalVisible(false)}
        />
      )}
    </>
  );
});

export function MarketRowHeader() {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <View style={styles.nameCell}>
        <Text style={styles.headerText}>{t('items_label')}</Text>
      </View>
      <View style={styles.priceCell}>
        <Text style={styles.headerText}>{t('buy')}</Text>
      </View>
      <View style={styles.priceCell}>
        <Text style={styles.headerText}>{t('sell')}</Text>
      </View>
      <View style={styles.volCell}>
        <Text style={styles.headerText}>{t('volume_monthly')}</Text>
      </View>
      <View style={styles.offersCell}>
        <Text style={styles.headerText}>{t('offers')}</Text>
      </View>
      <View style={styles.marginCell}>
        <Text style={styles.headerText}>{t('margin')}</Text>
      </View>
      <View style={styles.actionsCell} />
    </View>
  );
}

const ICON_WIDTH = 44;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 12,
    minHeight: 60,
  },
  rowTriggered: {
    backgroundColor: colors.goldDim + '40',
  },
  nameCell: {
    flex: 2.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 240,
  },
  imgWrap: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  category: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  priceCell: {
    flex: 1,
    minWidth: 90,
    gap: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  volCell: {
    flex: 0.9,
    minWidth: 70,
  },
  vol: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  offersCell: {
    flex: 0.9,
    minWidth: 80,
    flexDirection: 'row',
    gap: 4,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  pillBuy: {
    borderColor: colors.buyBorder,
    backgroundColor: colors.buyDim,
  },
  pillSell: {
    borderColor: colors.sellBorder,
    backgroundColor: colors.sellDim,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  marginCell: {
    flex: 1.5,
    minWidth: 140,
    gap: 4,
  },
  marginTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  placeholderDash: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actionsCell: {
    flexDirection: 'row',
    gap: 6,
    width: ICON_WIDTH + ICON_WIDTH + 6,
    justifyContent: 'flex-end',
  },
  iconBtn: {
    width: ICON_WIDTH,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.goldDim,
    borderColor: colors.gold + '40',
  },
  iconBtnTriggered: {
    backgroundColor: colors.goldDim,
    borderColor: colors.gold,
  },
});
