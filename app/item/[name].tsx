import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useItemStats, useItemHistory, useItemOffers } from '@/src/hooks/useMarket';
import { LoadingState } from '@/src/components/LoadingState';
import { ErrorState } from '@/src/components/ErrorState';
import { ItemImage } from '@/src/components/ItemImage';
import { WatchAlertModal } from '@/src/components/WatchAlertModal';
import { colors } from '@/src/theme/colors';
import { formatGold, formatDate, toTitleCase } from '@/src/api/tibiaMarket';
import { useWorld } from '@/src/context/WorldContext';
import { useWatchlist } from '@/src/context/WatchlistContext';
import { useTranslation } from '@/src/context/LanguageContext';

const HISTORY_DAYS_OPTIONS = [7, 14, 30, 90];

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  value: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'right' },
});

// Offer `time` is the EXPIRY timestamp (30 days after creation).
const OFFER_DURATION_SECS = 30 * 24 * 3600;

function formatOfferTime(expiryUnixSecs: number): string {
  const createdAtSecs = expiryUnixSecs - OFFER_DURATION_SECS;
  const ageSecs = Date.now() / 1000 - createdAtSecs;
  if (ageSecs < 0) return '?';
  const minutes = Math.floor(ageSecs / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(ageSecs / 3600);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(ageSecs / 86400)}d`;
}

function OfferRow({ side, amount, price, name, time }: {
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  name: string;
  time: number;
}) {
  const { t } = useTranslation();
  const color = side === 'buy' ? colors.buy : colors.sell;
  const barMax = 5000;
  const barPct = Math.min(amount / barMax, 1);

  return (
    <View style={offerStyles.row}>
      {/* Volume bar behind */}
      <View
        style={[
          offerStyles.barBg,
          {
            width: `${Math.round(barPct * 100)}%`,
            backgroundColor: side === 'buy' ? colors.buyDim : colors.sellDim,
            alignSelf: side === 'buy' ? 'flex-start' : 'flex-end',
          },
        ]}
      />
      <Text style={[offerStyles.price, { color }]}>{formatGold(price)}</Text>
      <Text style={offerStyles.amount}>{amount.toLocaleString()} {t('units')}</Text>
      <View style={offerStyles.rightCol}>
        <Text style={offerStyles.seller} numberOfLines={1}>{name}</Text>
        <Text style={offerStyles.offerAge}>{formatOfferTime(time)}</Text>
      </View>
    </View>
  );
}

const offerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 8,
    position: 'relative',
  },
  barBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    opacity: 0.6,
  },
  price: { fontSize: 14, fontWeight: '700', minWidth: 70 },
  amount: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  rightCol: { alignItems: 'flex-end' },
  seller: { color: colors.textMuted, fontSize: 11, maxWidth: 100 },
  offerAge: { color: colors.textMuted, fontSize: 10 },
});

function CustomLineChart({
  buyData,
  sellData,
  dates,
  width,
}: {
  buyData: number[];
  sellData: number[];
  dates: string[];
  width: number;
  showDots?: boolean;
}) {
  const CHART_H = 220;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 32;
  const PAD_LEFT = 52;
  const PAD_RIGHT = 12;
  const plotW = width - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const allVals = [...buyData, ...sellData].filter((v) => v > 0);
  if (allVals.length === 0) return null;

  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  // Add 5% padding so lines don't touch edges
  const pad = (maxV - minV) * 0.08 || maxV * 0.05;
  const lo = minV - pad;
  const hi = maxV + pad;
  const range = hi - lo;

  const xOf = (i: number) => PAD_LEFT + (i / Math.max(buyData.length - 1, 1)) * plotW;
  const yOf = (v: number) => PAD_TOP + plotH - ((v - lo) / range) * plotH;

  // Smooth cubic bezier path
  const smoothPath = (data: number[]) => {
    if (data.length === 0) return '';
    if (data.length === 1) return `M ${xOf(0)} ${yOf(data[0])}`;
    let d = `M ${xOf(0).toFixed(1)} ${yOf(data[0]).toFixed(1)}`;
    for (let i = 1; i < data.length; i++) {
      const x0 = xOf(i - 1), y0 = yOf(data[i - 1]);
      const x1 = xOf(i), y1 = yOf(data[i]);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx.toFixed(1)} ${y0.toFixed(1)}, ${cx.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    return d;
  };

  const yLabels = [0, 1, 2, 3].map((i) => lo + (i / 3) * range);
  const step = Math.max(1, Math.ceil(dates.length / 5));

  // Spread fill between buy and sell
  const spreadPath = () => {
    if (buyData.length === 0 || sellData.length === 0) return '';
    const top = smoothPath(buyData);
    const n = sellData.length - 1;
    let bottom = '';
    for (let i = n; i >= 0; i--) {
      const x0 = i > 0 ? xOf(i - 1) : xOf(0);
      const y0 = i > 0 ? yOf(sellData[i - 1]) : yOf(sellData[0]);
      const x1 = xOf(i), y1 = yOf(sellData[i]);
      const cx = (x0 + x1) / 2;
      bottom += i === n
        ? ` L ${x1.toFixed(1)} ${y1.toFixed(1)}`
        : ` C ${cx.toFixed(1)} ${y1.toFixed(1)}, ${cx.toFixed(1)} ${y0.toFixed(1)}, ${x0.toFixed(1)} ${y0.toFixed(1)}`;
    }
    return `${top}${bottom} Z`;
  };

  return (
    <Svg width={width} height={CHART_H}>
      <Defs>
        <SvgGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.buy} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={colors.sell} stopOpacity="0.06" />
        </SvgGradient>
      </Defs>

      {/* Chart background */}
      <Rect x={PAD_LEFT} y={PAD_TOP} width={plotW} height={plotH} fill={colors.surfaceElevated} opacity={0.3} rx={4} />

      {/* Grid lines + Y labels */}
      {yLabels.map((v, i) => (
        <G key={i}>
          <Line
            x1={PAD_LEFT} y1={yOf(v)}
            x2={width - PAD_RIGHT} y2={yOf(v)}
            stroke={colors.border} strokeDasharray="4 5" strokeWidth={0.7}
          />
          <SvgText x={PAD_LEFT - 5} y={yOf(v) + 4} textAnchor="end" fill={colors.textMuted} fontSize={9}>
            {formatGold(v)}
          </SvgText>
        </G>
      ))}

      {/* Spread fill between the two lines */}
      <Path d={spreadPath()} fill="url(#spreadGrad)" />

      {/* Sell line — draw first (behind) */}
      <Path d={smoothPath(sellData)} stroke={colors.sell} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Buy line — draw on top */}
      <Path d={smoothPath(buyData)} stroke={colors.buy} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {sellData.map((v, i) => (
        <Circle key={`s${i}`} cx={xOf(i)} cy={yOf(v)} r={3} fill={colors.sell} stroke={colors.card} strokeWidth={1.5} />
      ))}
      {buyData.map((v, i) => (
        <Circle key={`b${i}`} cx={xOf(i)} cy={yOf(v)} r={3} fill={colors.buy} stroke={colors.card} strokeWidth={1.5} />
      ))}

      {/* X-axis date labels */}
      {dates.map((d, i) =>
        i % step === 0 ? (
          <SvgText key={i} x={xOf(i)} y={CHART_H - 8} textAnchor="middle" fill={colors.textMuted} fontSize={9}>
            {d}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

export default function ItemDetailScreen() {
  const { name, world: paramWorld } = useLocalSearchParams<{ name: string; world: string }>();
  const { selectedWorld, toggleFavorite, isFavorite } = useWorld();
  const world = paramWorld ?? selectedWorld;
  const navigation = useNavigation();
  const [historyDays, setHistoryDays] = useState(30);
  const [activeChart, setActiveChart] = useState<'price' | 'volume'>('price');
  const [watchModalOpen, setWatchModalOpen] = useState(false);
  const favorite = isFavorite(name);
  const { isWatched, getAlert, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const watched = isWatched(name, world);
  const watchAlert = getAlert(name, world);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: toTitleCase(name),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 12 }}>
          <TouchableOpacity onPress={() => setWatchModalOpen(true)} style={{ padding: 4 }}>
            <MaterialCommunityIcons
              name={watched ? 'bell' : 'bell-outline'}
              size={22}
              color={watched ? colors.gold : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFavorite(name)} style={{ padding: 4 }}>
            <MaterialCommunityIcons
              name={favorite ? 'star' : 'star-outline'}
              size={22}
              color={favorite ? colors.gold : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, name, favorite, toggleFavorite, watched]);

  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch } = useItemStats(world, name);
  const { data: history, isLoading: historyLoading } = useItemHistory(world, name, historyDays);
  const { data: offers, isLoading: offersLoading } = useItemOffers(world, name);

  if (statsLoading) return <LoadingState message={t('loading_item')} />;
  if (statsError || !stats) return <ErrorState message={t('item_not_found')} onRetry={refetch} />;

  const hasHistory = history && history.length > 1;

  const buyPrices = history?.map((h) => h.buy_offer ?? 0) ?? [];
  const sellPrices = history?.map((h) => h.sell_offer ?? 0) ?? [];
  const buyVolumes = history?.map((h) => h.buy_volume ?? 0) ?? [];
  const sellVolumes = history?.map((h) => h.sell_volume ?? 0) ?? [];

  const chartDates = (history ?? []).map((h) => {
    const d = new Date(h.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const chartBuy = activeChart === 'price' ? buyPrices : buyVolumes;
  const chartSell = activeChart === 'price' ? sellPrices : sellVolumes;

  const margin =
    stats.sell_offer != null && stats.buy_offer != null
      ? stats.sell_offer - stats.buy_offer
      : null;

  const marginPct =
    margin != null && stats.buy_offer != null && stats.buy_offer > 0
      ? (margin / stats.buy_offer) * 100
      : null;

  const dealQuality =
    marginPct != null && (stats.month_sold ?? 0) >= 100 && marginPct >= 15 ? 'premium' :
    marginPct != null && (stats.month_sold ?? 0) >= 30 && marginPct >= 7 ? 'good' :
    'neutral';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero header */}
      <LinearGradient
        colors={[colors.surfaceElevated, colors.card]}
        style={styles.hero}
      >
        <View style={styles.heroLeft}>
          <View style={styles.heroImgWrap}>
            <ItemImage wikiName={stats.wiki_name || stats.name} size={64} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={2}>{toTitleCase(stats.name)}</Text>
            <Text style={styles.heroWorld}>
              <MaterialCommunityIcons name="earth" size={11} color={colors.textMuted} />{' '}
              {world}
            </Text>
            <Text style={styles.heroUpdated}>{formatDate(stats.time)}</Text>
          </View>
        </View>
        {margin != null && margin > 0 && (
          <View style={styles.heroMargin}>
            <Text style={styles.heroMarginLabel}>{t('margin')}</Text>
            <Text style={styles.heroMarginValue}>{formatGold(margin)}</Text>
            {marginPct != null && (
              <View style={[
                styles.marginPctBadge,
                dealQuality === 'premium' ? { backgroundColor: colors.goldDim, borderColor: colors.gold + '60' } :
                dealQuality === 'good' ? { backgroundColor: colors.buyDim, borderColor: colors.buyBorder } :
                { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder },
              ]}>
                <Text style={[
                  styles.marginPctText,
                  dealQuality === 'premium' ? { color: colors.gold } :
                  dealQuality === 'good' ? { color: colors.buy } :
                  { color: colors.textSecondary },
                ]}>
                  {marginPct.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Price cards */}
      <View style={styles.priceRow}>
        <LinearGradient
          colors={[colors.buyDim, colors.card]}
          style={[styles.priceCard, styles.priceCardBuy]}
        >
          <Text style={styles.priceLabelTop}>{t('buy')}</Text>
          <Text style={[styles.priceBig, { color: colors.buy }]}>
            {formatGold(stats.buy_offer)}
          </Text>
          <Text style={styles.priceSub}>{t('today_avg_prefix')} {formatGold(stats.day_average_buy)}</Text>
          <Text style={styles.priceSub}>{t('monthly_avg_prefix')} {formatGold(stats.month_average_buy)}</Text>
          {stats.buy_offer != null && stats.month_average_buy != null && stats.month_average_buy > 0 && (
            <View style={[
              styles.priceVsAvg,
              stats.buy_offer < stats.month_average_buy
                ? { backgroundColor: colors.buyDim, borderColor: colors.buyBorder }
                : { backgroundColor: colors.sellDim, borderColor: colors.sellBorder },
            ]}>
              <MaterialCommunityIcons
                name={stats.buy_offer < stats.month_average_buy ? 'arrow-down-bold' : 'arrow-up-bold'}
                size={9}
                color={stats.buy_offer < stats.month_average_buy ? colors.buy : colors.sell}
              />
              <Text style={[
                styles.priceVsAvgText,
                { color: stats.buy_offer < stats.month_average_buy ? colors.buy : colors.sell },
              ]}>
                {Math.abs(((stats.buy_offer - stats.month_average_buy) / stats.month_average_buy) * 100).toFixed(1)}% {t('vs_avg')}
              </Text>
            </View>
          )}
        </LinearGradient>

        <LinearGradient
          colors={[colors.sellDim, colors.card]}
          style={[styles.priceCard, styles.priceCardSell]}
        >
          <Text style={styles.priceLabelTop}>{t('sell')}</Text>
          <Text style={[styles.priceBig, { color: colors.sell }]}>
            {formatGold(stats.sell_offer)}
          </Text>
          <Text style={styles.priceSub}>{t('today_avg_prefix')} {formatGold(stats.day_average_sell)}</Text>
          <Text style={styles.priceSub}>{t('monthly_avg_prefix')} {formatGold(stats.month_average_sell)}</Text>
          {stats.sell_offer != null && stats.month_average_sell != null && stats.month_average_sell > 0 && (
            <View style={[
              styles.priceVsAvg,
              stats.sell_offer > stats.month_average_sell
                ? { backgroundColor: colors.buyDim, borderColor: colors.buyBorder }
                : { backgroundColor: colors.sellDim, borderColor: colors.sellBorder },
            ]}>
              <MaterialCommunityIcons
                name={stats.sell_offer > stats.month_average_sell ? 'arrow-up-bold' : 'arrow-down-bold'}
                size={9}
                color={stats.sell_offer > stats.month_average_sell ? colors.buy : colors.sell}
              />
              <Text style={[
                styles.priceVsAvgText,
                { color: stats.sell_offer > stats.month_average_sell ? colors.buy : colors.sell },
              ]}>
                {Math.abs(((stats.sell_offer - stats.month_average_sell) / stats.month_average_sell) * 100).toFixed(1)}% {t('vs_avg')}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* NPC price comparison */}
      {(stats.npc_buy.length > 0 || stats.npc_sell.length > 0) && (() => {
        const bestNpcBuy = stats.npc_buy.length > 0 ? Math.max(...stats.npc_buy.map((e) => e.price)) : null;
        const bestNpcSell = stats.npc_sell.length > 0 ? Math.min(...stats.npc_sell.map((e) => e.price)) : null;
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="store-outline" size={15} color={colors.gold} />
              <Text style={styles.sectionTitle}>NPC</Text>
            </View>
            {bestNpcBuy != null && (
              <View style={styles.npcRow}>
                <Text style={styles.npcLabel}>{t('npc_buys_for')}</Text>
                <Text style={[styles.npcPrice, { color: colors.sell }]}>{formatGold(bestNpcBuy)}</Text>
                {stats.sell_offer != null && (
                  <View style={[
                    styles.npcDiff,
                    stats.sell_offer > bestNpcBuy
                      ? { backgroundColor: colors.buyDim, borderColor: colors.buyBorder }
                      : { backgroundColor: colors.sellDim, borderColor: colors.sellBorder },
                  ]}>
                    <Text style={[styles.npcDiffText, { color: stats.sell_offer > bestNpcBuy ? colors.buy : colors.sell }]}>
                      {stats.sell_offer > bestNpcBuy ? '+' : ''}{formatGold(stats.sell_offer - bestNpcBuy)} market
                    </Text>
                  </View>
                )}
              </View>
            )}
            {bestNpcSell != null && (
              <View style={styles.npcRow}>
                <Text style={styles.npcLabel}>{t('npc_sells_for')}</Text>
                <Text style={[styles.npcPrice, { color: colors.buy }]}>{formatGold(bestNpcSell)}</Text>
                {stats.buy_offer != null && (
                  <View style={[
                    styles.npcDiff,
                    stats.buy_offer < bestNpcSell
                      ? { backgroundColor: colors.buyDim, borderColor: colors.buyBorder }
                      : { backgroundColor: colors.sellDim, borderColor: colors.sellBorder },
                  ]}>
                    <Text style={[styles.npcDiffText, { color: stats.buy_offer < bestNpcSell ? colors.buy : colors.sell }]}>
                      {stats.buy_offer < bestNpcSell ? '-' : '+'}{formatGold(Math.abs(stats.buy_offer - bestNpcSell))} market
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })()}

      {/* Order Book */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="book-open-variant" size={15} color={colors.gold} />
          <Text style={styles.sectionTitle}>{t('active_offers')}</Text>
          {offersLoading && (
            <Text style={styles.sectionSub}>{t('loading_ellipsis')}</Text>
          )}
        </View>

        {offers && (offers.buyers.length > 0 || offers.sellers.length > 0) ? (
          <View>
            {/* Headers */}
            <View style={styles.offerHeader}>
              <Text style={[styles.offerHeaderText, { color: colors.buy }]}>
                {t('buy')} ({offers.buyers.length})
              </Text>
            </View>
            {offers.buyers.slice(0, 10).map((o, i) => (
              <OfferRow key={`buy-${i}`} side="buy" amount={o.amount} price={o.price} name={o.name} time={o.time} />
            ))}
            {offers.buyers.length === 0 && (
              <Text style={styles.noOffers}>{t('no_buy_offers')}</Text>
            )}

            <View style={[styles.offerHeader, { marginTop: 12 }]}>
              <Text style={[styles.offerHeaderText, { color: colors.sell }]}>
                {t('sell')} ({offers.sellers.length})
              </Text>
            </View>
            {offers.sellers.slice(0, 10).map((o, i) => (
              <OfferRow key={`sell-${i}`} side="sell" amount={o.amount} price={o.price} name={o.name} time={o.time} />
            ))}
            {offers.sellers.length === 0 && (
              <Text style={styles.noOffers}>{t('no_sell_offers')}</Text>
            )}
          </View>
        ) : !offersLoading ? (
          <Text style={styles.noOffers}>{t('no_offers')}</Text>
        ) : null}
      </View>

      {/* Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-line" size={15} color={colors.gold} />
          <Text style={styles.sectionTitle}>{t('price_history')}</Text>
          <View style={styles.daysSelector}>
            {HISTORY_DAYS_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayBtn, historyDays === d && styles.dayBtnActive]}
                onPress={() => setHistoryDays(d)}
              >
                <Text style={[styles.dayBtnText, historyDays === d && styles.dayBtnTextActive]}>
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.chartToggle}>
          {(['price', 'volume'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.toggleBtn, activeChart === type && styles.toggleBtnActive]}
              onPress={() => setActiveChart(type)}
            >
              <Text style={[styles.toggleBtnText, activeChart === type && styles.toggleBtnTextActive]}>
                {type === 'price' ? t('price') : t('volume')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {historyLoading ? (
          <View style={styles.chartLoading}>
            <MaterialCommunityIcons name="chart-line" size={32} color={colors.textMuted} />
            <Text style={styles.chartLoadingText}>{t('loading_chart')}</Text>
          </View>
        ) : hasHistory ? (
          <>
            <CustomLineChart
              buyData={chartBuy}
              sellData={chartSell}
              dates={chartDates}
              width={Math.min(screenWidth - 28, 700)}
              showDots={historyDays <= 14}
            />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.buy }]} />
                <Text style={styles.legendText}>{t('buy_legend')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.sell }]} />
                <Text style={styles.legendText}>{t('sell_legend')}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.chartLoading}>
            <Text style={styles.chartLoadingText}>{t('no_history')}</Text>
          </View>
        )}
      </View>

      {/* Monthly stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calendar-month" size={15} color={colors.gold} />
          <Text style={styles.sectionTitle}>{t('monthly_stats')}</Text>
        </View>
        <StatRow label={t('avg_buy_price')} value={formatGold(stats.month_average_buy)} valueColor={colors.buy} />
        <StatRow label={t('avg_sell_price')} value={formatGold(stats.month_average_sell)} valueColor={colors.sell} />
        <StatRow label={t('sold')} value={`${stats.month_sold?.toLocaleString() ?? '—'} ${t('units')}`} />
        <StatRow label={t('purchased')} value={`${stats.month_bought?.toLocaleString() ?? '—'} ${t('units')}`} />
        {stats.highest_buy != null && (
          <StatRow label={t('highest_buy')} value={formatGold(stats.highest_buy)} />
        )}
        {stats.lowest_sell != null && (
          <StatRow label={t('lowest_sell')} value={formatGold(stats.lowest_sell)} />
        )}
      </View>

      {/* Today */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calendar-today" size={15} color={colors.gold} />
          <Text style={styles.sectionTitle}>{t('today')}</Text>
        </View>
        <StatRow label={t('avg_buy_price')} value={formatGold(stats.day_average_buy)} valueColor={colors.buy} />
        <StatRow label={t('avg_sell_price')} value={formatGold(stats.day_average_sell)} valueColor={colors.sell} />
        <StatRow label={t('sold')} value={`${stats.day_sold?.toLocaleString() ?? '—'} ${t('units')}`} />
        <StatRow label={t('purchased')} value={`${stats.day_bought?.toLocaleString() ?? '—'} ${t('units')}`} />
      </View>

      <WatchAlertModal
        visible={watchModalOpen}
        itemName={name}
        wikiName={stats.name}
        world={world}
        currentBuy={stats.buy_offer}
        currentSell={stats.sell_offer}
        initialBuyAlert={watchAlert?.buyAlert ?? null}
        initialSellAlert={watchAlert?.sellAlert ?? null}
        isEditing={watched}
        onSave={(buy, sell) => {
          if (buy == null && sell == null) {
            removeFromWatchlist(name, world);
          } else {
            addToWatchlist({ itemName: name, wikiName: stats.wiki_name, world, buyAlert: buy, sellAlert: sell });
          }
        }}
        onRemove={() => removeFromWatchlist(name, world)}
        onClose={() => setWatchModalOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 2,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  heroImgWrap: {
    width: 72,
    height: 72,
    backgroundColor: colors.card,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  heroInfo: { flex: 1, gap: 3 },
  heroName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 20 },
  heroWorld: { color: colors.textMuted, fontSize: 12 },
  heroUpdated: { color: colors.textMuted, fontSize: 10 },
  heroMargin: { alignItems: 'flex-end', gap: 4 },
  heroMarginLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  heroMarginValue: { color: colors.goldLight, fontSize: 18, fontWeight: '800' },
  marginPctBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  marginPctText: {
    fontSize: 11,
    fontWeight: '700',
  },

  priceRow: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: 2,
  },
  priceCard: {
    flex: 1,
    padding: 16,
    gap: 4,
    alignItems: 'center',
  },
  priceCardBuy: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  priceCardSell: {},
  priceLabelTop: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  priceBig: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  priceSub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  priceVsAvg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  priceVsAvgText: {
    fontSize: 10,
    fontWeight: '700',
  },

  section: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 2,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  sectionSub: {
    color: colors.textMuted,
    fontSize: 11,
  },

  npcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 8,
  },
  npcLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  npcPrice: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },
  npcDiff: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  npcDiffText: {
    fontSize: 10,
    fontWeight: '600',
  },
  offerHeader: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.surfaceElevated,
  },
  offerHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  noOffers: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },

  daysSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  dayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayBtnActive: {
    backgroundColor: colors.goldDim,
    borderColor: colors.gold,
  },
  dayBtnText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  dayBtnTextActive: {
    color: colors.gold,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    margin: 14,
    marginBottom: 8,
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.surfaceElevated,
  },
  toggleBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: colors.gold,
  },
  chart: {
    borderRadius: 0,
    marginHorizontal: 14,
  },
  chartLoading: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chartLoadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
