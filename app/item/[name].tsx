import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useItemStats, useItemHistory } from '@/src/hooks/useMarket';
import { LoadingState } from '@/src/components/LoadingState';
import { ErrorState } from '@/src/components/ErrorState';
import { colors } from '@/src/theme/colors';
import { formatGold, formatDate } from '@/src/api/tibiaMarket';
import { useWorld } from '@/src/context/WorldContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const HISTORY_DAYS_OPTIONS = [7, 14, 30, 90];

function StatRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default function ItemDetailScreen() {
  const { name, world: paramWorld } = useLocalSearchParams<{
    name: string;
    world: string;
  }>();
  const { selectedWorld, toggleFavorite, isFavorite } = useWorld();
  const world = paramWorld ?? selectedWorld;
  const navigation = useNavigation();
  const [historyDays, setHistoryDays] = useState(30);
  const [activeChart, setActiveChart] = useState<'price' | 'volume'>('price');

  const favorite = isFavorite(name);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => toggleFavorite(name)}
          style={{ marginRight: 16 }}
        >
          <MaterialCommunityIcons
            name={favorite ? 'star' : 'star-outline'}
            size={22}
            color={favorite ? colors.gold : colors.textSecondary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, name, favorite, toggleFavorite]);

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useItemStats(world, name);

  const {
    data: history,
    isLoading: historyLoading,
  } = useItemHistory(world, name, historyDays);

  if (statsLoading) {
    return <LoadingState message="Pobieranie danych przedmiotu..." />;
  }

  if (statsError || !stats) {
    return (
      <ErrorState
        message="Nie udało się pobrać danych przedmiotu."
        onRetry={refetchStats}
      />
    );
  }

  // Prepare chart data
  const hasHistory = history && history.length > 1;
  const chartLabels = hasHistory
    ? history
        .filter((_, i) => i % Math.ceil(history.length / 6) === 0)
        .map((h) => {
          const d = new Date(h.date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        })
    : [];

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
                {
                  data: buyPrices,
                  color: () => colors.buy,
                  strokeWidth: 2,
                },
                {
                  data: sellPrices,
                  color: () => colors.sell,
                  strokeWidth: 2,
                },
              ]
            : [
                {
                  data: buyVolumes,
                  color: () => colors.buy,
                  strokeWidth: 2,
                },
                {
                  data: sellVolumes,
                  color: () => colors.sell,
                  strokeWidth: 2,
                },
              ],
        legend:
          activeChart === 'price'
            ? ['Cena kupna', 'Cena sprzedaży']
            : ['Wolumen kupna', 'Wolumen sprzedaży'],
      }
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Current prices header */}
      <View style={styles.priceHeader}>
        <View style={styles.priceCard}>
          <Text style={styles.priceCardLabel}>Aktualna cena kupna</Text>
          <Text style={[styles.priceCardValue, { color: colors.buy }]}>
            {formatGold(stats.buy_offer)}
          </Text>
          <Text style={styles.priceCardSub}>
            Dziś śr. {formatGold(stats.day_average_buy)}
          </Text>
        </View>

        <View style={styles.priceDivider} />

        <View style={styles.priceCard}>
          <Text style={styles.priceCardLabel}>Aktualna cena sprzedaży</Text>
          <Text style={[styles.priceCardValue, { color: colors.sell }]}>
            {formatGold(stats.sell_offer)}
          </Text>
          <Text style={styles.priceCardSub}>
            Dziś śr. {formatGold(stats.day_average_sell)}
          </Text>
        </View>
      </View>

      {/* Chart section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historia cen</Text>
          <View style={styles.daysSelector}>
            {HISTORY_DAYS_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayBtn, historyDays === d && styles.dayBtnActive]}
                onPress={() => setHistoryDays(d)}
              >
                <Text
                  style={[styles.dayBtnText, historyDays === d && styles.dayBtnTextActive]}
                >
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chart type toggle */}
        <View style={styles.chartToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeChart === 'price' && styles.toggleBtnActive]}
            onPress={() => setActiveChart('price')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeChart === 'price' && styles.toggleBtnTextActive,
              ]}
            >
              Cena
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, activeChart === 'volume' && styles.toggleBtnActive]}
            onPress={() => setActiveChart('volume')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeChart === 'volume' && styles.toggleBtnTextActive,
              ]}
            >
              Wolumen
            </Text>
          </TouchableOpacity>
        </View>

        {historyLoading ? (
          <View style={styles.chartLoading}>
            <Text style={styles.chartLoadingText}>Ładowanie wykresu...</Text>
          </View>
        ) : chartData ? (
          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - 32}
            height={200}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.surfaceElevated,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(200, 168, 75, ${opacity})`,
              labelColor: () => colors.textMuted,
              propsForDots: { r: '3' },
              propsForBackgroundLines: {
                stroke: colors.border,
                strokeDasharray: '4',
              },
            }}
            bezier
            style={styles.chart}
            withDots={historyDays <= 14}
            formatYLabel={(v) => formatGold(Number(v))}
          />
        ) : (
          <View style={styles.chartLoading}>
            <Text style={styles.chartLoadingText}>Brak danych historycznych</Text>
          </View>
        )}

        {/* Chart legend */}
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
      </View>

      {/* Statistics section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statystyki miesięczne</Text>
        <StatRow
          label="Śr. cena kupna"
          value={formatGold(stats.month_average_buy)}
          valueColor={colors.buy}
        />
        <StatRow
          label="Śr. cena sprzedaży"
          value={formatGold(stats.month_average_sell)}
          valueColor={colors.sell}
        />
        <StatRow label="Sprzedano sztuk" value={String(stats.month_sold ?? '—')} />
        <StatRow label="Zakupiono sztuk" value={String(stats.month_bought ?? '—')} />
        {stats.highest_buy !== null && (
          <StatRow label="Najwyższe kupno" value={formatGold(stats.highest_buy)} />
        )}
        {stats.lowest_sell !== null && (
          <StatRow label="Najniższa sprzedaż" value={formatGold(stats.lowest_sell)} />
        )}
      </View>

      {/* Today section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dzisiaj</Text>
        <StatRow
          label="Śr. cena kupna"
          value={formatGold(stats.day_average_buy)}
          valueColor={colors.buy}
        />
        <StatRow
          label="Śr. cena sprzedaży"
          value={formatGold(stats.day_average_sell)}
          valueColor={colors.sell}
        />
        <StatRow label="Sprzedano sztuk" value={String(stats.day_sold ?? '—')} />
        <StatRow label="Zakupiono sztuk" value={String(stats.day_bought ?? '—')} />
      </View>

      {/* Meta */}
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="update" size={12} color={colors.textMuted} />
        <Text style={styles.metaText}>
          Ostatnia aktualizacja: {formatDate(stats.time)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  priceHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    overflow: 'hidden',
  },
  priceCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
  priceCardLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  priceCardValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  priceCardSub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  priceDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  section: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 16,
    gap: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
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
    backgroundColor: colors.goldDark,
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
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 6,
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
    borderRadius: 10,
    marginHorizontal: -8,
  },
  chartLoading: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLoadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
