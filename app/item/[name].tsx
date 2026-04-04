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
import { LineChart } from 'react-native-chart-kit';
import { useItemStats, useItemHistory, useItemOffers } from '@/src/hooks/useMarket';
import { LoadingState } from '@/src/components/LoadingState';
import { ErrorState } from '@/src/components/ErrorState';
import { ItemImage } from '@/src/components/ItemImage';
import { WatchAlertModal } from '@/src/components/WatchAlertModal';
import { colors } from '@/src/theme/colors';
import { formatGold, formatDate } from '@/src/api/tibiaMarket';
import { useWorld } from '@/src/context/WorldContext';
import { useWatchlist } from '@/src/context/WatchlistContext';

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

function OfferRow({ side, amount, price, name, time }: {
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  name: string;
  time: number;
}) {
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
      <Text style={offerStyles.amount}>{amount.toLocaleString()} szt.</Text>
      <Text style={offerStyles.seller} numberOfLines={1}>{name}</Text>
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
  seller: { color: colors.textMuted, fontSize: 11, maxWidth: 100 },
});

export default function ItemDetailScreen() {
  const { name, world: paramWorld } = useLocalSearchParams<{ name: string; world: string }>();
  const { selectedWorld, toggleFavorite, isFavorite } = useWorld();
  const world = paramWorld ?? selectedWorld;
  const navigation = useNavigation();
  const [historyDays, setHistoryDays] = useState(30);
  const [activeChart, setActiveChart] = useState<'price' | 'volume'>('price');
  const [watchModalOpen, setWatchModalOpen] = useState(false);
  const favorite = isFavorite(name);
  const { isWatched, getAlert, addToWatchlist, removeFromWatchlist, updateAlert } = useWatchlist();
  const watched = isWatched(name);
  const watchAlert = getAlert(name);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
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

  const { width: screenWidth } = useWindowDimensions();

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch } = useItemStats(world, name);
  const { data: history, isLoading: historyLoading } = useItemHistory(world, name, historyDays);
  const { data: offers, isLoading: offersLoading } = useItemOffers(world, name);

  if (statsLoading) return <LoadingState message="Pobieranie danych przedmiotu..." />;
  if (statsError || !stats) return <ErrorState message="Nie udało się pobrać danych." onRetry={refetch} />;

  const hasHistory = history && history.length > 1;

  const buyPrices = history?.map((h) => h.buy_offer ?? 0) ?? [];
  const sellPrices = history?.map((h) => h.sell_offer ?? 0) ?? [];
  const buyVolumes = history?.map((h) => h.buy_volume ?? 0) ?? [];
  const sellVolumes = history?.map((h) => h.sell_volume ?? 0) ?? [];

  const chartData = hasHistory
    ? {
        labels: history
          .filter((_, i) => i % Math.ceil(history.length / 6) === 0)
          .map((h) => {
            const d = new Date(h.date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }),
        datasets:
          activeChart === 'price'
            ? [
                { data: buyPrices, color: () => colors.buy, strokeWidth: 2 },
                { data: sellPrices, color: () => colors.sell, strokeWidth: 2 },
              ]
            : [
                { data: buyVolumes, color: () => colors.buy, strokeWidth: 2 },
                { data: sellVolumes, color: () => colors.sell, strokeWidth: 2 },
              ],
      }
    : null;

  const margin =
    stats.sell_offer != null && stats.buy_offer != null
      ? stats.sell_offer - stats.buy_offer
      : null;

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
            <Text style={styles.heroName} numberOfLines={2}>{stats.name}</Text>
            <Text style={styles.heroWorld}>
              <MaterialCommunityIcons name="earth" size={11} color={colors.textMuted} />{' '}
              {world}
            </Text>
            <Text style={styles.heroUpdated}>{formatDate(stats.time)}</Text>
          </View>
        </View>
        {margin != null && margin > 0 && (
          <View style={styles.heroMargin}>
            <Text style={styles.heroMarginLabel}>MARŻA</Text>
            <Text style={styles.heroMarginValue}>{formatGold(margin)}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Price cards */}
      <View style={styles.priceRow}>
        <LinearGradient
          colors={[colors.buyDim, colors.card]}
          style={[styles.priceCard, styles.priceCardBuy]}
        >
          <Text style={styles.priceLabelTop}>KUPNO</Text>
          <Text style={[styles.priceBig, { color: colors.buy }]}>
            {formatGold(stats.buy_offer)}
          </Text>
          <Text style={styles.priceSub}>Dzisiaj śr. {formatGold(stats.day_average_buy)}</Text>
          <Text style={styles.priceSub}>Mies. śr. {formatGold(stats.month_average_buy)}</Text>
        </LinearGradient>

        <LinearGradient
          colors={[colors.sellDim, colors.card]}
          style={[styles.priceCard, styles.priceCardSell]}
        >
          <Text style={styles.priceLabelTop}>SPRZEDAŻ</Text>
          <Text style={[styles.priceBig, { color: colors.sell }]}>
            {formatGold(stats.sell_offer)}
          </Text>
          <Text style={styles.priceSub}>Dzisiaj śr. {formatGold(stats.day_average_sell)}</Text>
          <Text style={styles.priceSub}>Mies. śr. {formatGold(stats.month_average_sell)}</Text>
        </LinearGradient>
      </View>

      {/* Order Book */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="book-open-variant" size={15} color={colors.gold} />
          <Text style={styles.sectionTitle}>Aktywne oferty</Text>
          {offersLoading && (
            <Text style={styles.sectionSub}>Ładowanie...</Text>
          )}
        </View>

        {offers && (offers.buyers.length > 0 || offers.sellers.length > 0) ? (
          <View>
            {/* Headers */}
            <View style={styles.offerHeader}>
              <Text style={[styles.offerHeaderText, { color: colors.buy }]}>
                KUPNO ({offers.buyers.length})
              </Text>
            </View>
            {offers.buyers.slice(0, 10).map((o, i) => (
              <OfferRow key={`buy-${i}`} side="buy" amount={o.amount} price={o.price} name={o.name} time={o.time} />
            ))}
            {offers.buyers.length === 0 && (
              <Text style={styles.noOffers}>Brak ofert kupna</Text>
            )}

            <View style={[styles.offerHeader, { marginTop: 12 }]}>
              <Text style={[styles.offerHeaderText, { color: colors.sell }]}>
                SPRZEDAŻ ({offers.sellers.length})
              </Text>
            </View>
            {offers.sellers.slice(0, 10).map((o, i) => (
              <OfferRow key={`sell-${i}`} side="sell" amount={o.amount} price={o.price} name={o.name} time={o.time} />
            ))}
            {offers.sellers.length === 0 && (
              <Text style={styles.noOffers}>Brak ofert sprzedaży</Text>
            )}
          </View>
        ) : !offersLoading ? (
          <Text style={styles.noOffers}>Brak aktywnych ofert</Text>
        ) : null}
      </View>

      {/* Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-line" size={15} color={colors.gold} />
          <Text style={styles.sectionTitle}>Historia cen</Text>
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
                {type === 'price' ? 'Cena' : 'Wolumen'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {historyLoading ? (
          <View style={styles.chartLoading}>
            <MaterialCommunityIcons name="chart-line" size={32} color={colors.textMuted} />
            <Text style={styles.chartLoadingText}>Ładowanie wykresu...</Text>
          </View>
        ) : chartData ? (
          <>
            <LineChart
              data={chartData}
              width={Math.min(screenWidth - 28, 700)}
              height={200}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.surfaceElevated,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(201, 162, 39, ${opacity})`,
                labelColor: () => colors.textMuted,
                propsForDots: { r: '3' },
                propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '4' },
              }}
              bezier
              style={styles.chart}
              withDots={historyDays <= 14}
              formatYLabel={(v) => formatGold(Number(v))}
            />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.buy }]} />
                <Text style={styles.legendText}>Kupno</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.sell }]} />
                <Text style={styles.legendText}>Sprzedaż</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.chartLoading}>
            <Text style={styles.chartLoadingText}>Brak danych historycznych</Text>
          </View>
        )}
      </View>

      {/* Monthly stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calendar-month" size={15} color={colors.gold} />
          <Text style={styles.sectionTitle}>Statystyki miesięczne</Text>
        </View>
        <StatRow label="Śr. cena kupna" value={formatGold(stats.month_average_buy)} valueColor={colors.buy} />
        <StatRow label="Śr. cena sprzedaży" value={formatGold(stats.month_average_sell)} valueColor={colors.sell} />
        <StatRow label="Sprzedano" value={`${stats.month_sold?.toLocaleString() ?? '—'} szt.`} />
        <StatRow label="Zakupiono" value={`${stats.month_bought?.toLocaleString() ?? '—'} szt.`} />
        {stats.highest_buy != null && (
          <StatRow label="Najwyższe kupno" value={formatGold(stats.highest_buy)} />
        )}
        {stats.lowest_sell != null && (
          <StatRow label="Najniższa sprzedaż" value={formatGold(stats.lowest_sell)} />
        )}
      </View>

      {/* Today */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calendar-today" size={15} color={colors.gold} />
          <Text style={styles.sectionTitle}>Dzisiaj</Text>
        </View>
        <StatRow label="Śr. cena kupna" value={formatGold(stats.day_average_buy)} valueColor={colors.buy} />
        <StatRow label="Śr. cena sprzedaży" value={formatGold(stats.day_average_sell)} valueColor={colors.sell} />
        <StatRow label="Sprzedano" value={`${stats.day_sold?.toLocaleString() ?? '—'} szt.`} />
        <StatRow label="Zakupiono" value={`${stats.day_bought?.toLocaleString() ?? '—'} szt.`} />
      </View>

      <WatchAlertModal
        visible={watchModalOpen}
        itemName={name}
        wikiName={stats.name}
        currentBuy={stats.buy_offer}
        currentSell={stats.sell_offer}
        initialBuyAlert={watchAlert?.buyAlert ?? null}
        initialSellAlert={watchAlert?.sellAlert ?? null}
        isEditing={watched}
        onSave={(buy, sell) => {
          if (buy == null && sell == null) {
            removeFromWatchlist(name);
          } else {
            addToWatchlist({ itemName: name, wikiName: stats.name, buyAlert: buy, sellAlert: sell });
          }
        }}
        onRemove={() => removeFromWatchlist(name)}
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
  heroMargin: { alignItems: 'flex-end', gap: 2 },
  heroMarginLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  heroMarginValue: { color: colors.goldLight, fontSize: 18, fontWeight: '800' },

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
