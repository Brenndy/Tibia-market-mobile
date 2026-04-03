import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWorld } from '@/src/context/WorldContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { LoadingState } from '@/src/components/LoadingState';
import { ErrorState } from '@/src/components/ErrorState';
import { WorldBadge } from '@/src/components/WorldBadge';
import { colors } from '@/src/theme/colors';
import { formatGold, MarketItem } from '@/src/api/tibiaMarket';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;

type RankType = 'month_sold' | 'month_bought' | 'buy_offer' | 'sell_offer';

const RANK_OPTIONS: { label: string; value: RankType; icon: string }[] = [
  { label: 'Najczęściej sprzedawane', value: 'month_sold', icon: 'trending-up' },
  { label: 'Najczęściej kupowane', value: 'month_bought', icon: 'cart' },
  { label: 'Najdroższe (kupno)', value: 'buy_offer', icon: 'currency-usd' },
  { label: 'Najdroższe (sprzedaż)', value: 'sell_offer', icon: 'tag' },
];

function RankCard({
  item,
  rank,
  field,
  world,
}: {
  item: MarketItem;
  rank: number;
  field: RankType;
  world: string;
}) {
  const router = useRouter();
  const value = item[field];

  const rankColor =
    rank === 1 ? colors.gold : rank === 2 ? '#9ca3af' : rank === 3 ? '#b45309' : colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.rankCard}
      onPress={() =>
        router.push({ pathname: '/item/[name]', params: { name: item.name, world } })
      }
      activeOpacity={0.75}
    >
      <Text style={[styles.rankNum, { color: rankColor }]}>#{rank}</Text>
      <View style={styles.rankInfo}>
        <Text style={styles.rankName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.category && (
          <Text style={styles.rankCategory}>{item.category}</Text>
        )}
      </View>
      <Text style={styles.rankValue}>
        {field === 'month_sold' || field === 'month_bought'
          ? `${value ?? '—'} szt.`
          : formatGold(value as number | null)}
      </Text>
    </TouchableOpacity>
  );
}

export default function StatisticsScreen() {
  const { selectedWorld } = useWorld();
  const navigation = useNavigation();
  const [activeRank, setActiveRank] = useState<RankType>('month_sold');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <WorldBadge />,
      headerRightContainerStyle: { paddingRight: 12 },
    });
  }, [navigation]);

  const { data, isLoading, isError, refetch } = useMarketBoard(selectedWorld, {
    sort_field: activeRank,
    sort_order: 'desc',
    rows: 10,
  });

  const top5 = data?.items.slice(0, 5) ?? [];

  const chartData =
    top5.length > 0
      ? {
          labels: top5.map((i) => i.name.split(' ')[0].slice(0, 8)),
          datasets: [
            {
              data: top5.map((i) => {
                const v = i[activeRank];
                return typeof v === 'number' ? v : 0;
              }),
            },
          ],
        }
      : null;

  if (isLoading) {
    return <LoadingState message="Ładowanie statystyk..." />;
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Rank type selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rankSelector}
      >
        {RANK_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.rankTab, activeRank === opt.value && styles.rankTabActive]}
            onPress={() => setActiveRank(opt.value)}
          >
            <MaterialCommunityIcons
              name={opt.icon as any}
              size={14}
              color={activeRank === opt.value ? colors.gold : colors.textMuted}
            />
            <Text
              style={[
                styles.rankTabText,
                activeRank === opt.value && styles.rankTabTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bar chart */}
      {chartData && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top 5</Text>
          <BarChart
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
              propsForBackgroundLines: {
                stroke: colors.border,
                strokeDasharray: '4',
              },
            }}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {/* Top 10 list */}
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>
          {RANK_OPTIONS.find((o) => o.value === activeRank)?.label ?? 'Ranking'}
        </Text>
        {data?.items.map((item, idx) => (
          <RankCard
            key={item.name}
            item={item}
            rank={idx + 1}
            field={activeRank}
            world={selectedWorld}
          />
        ))}
      </View>

      {/* Summary stats */}
      {data && (
        <View style={styles.summaryCard}>
          <Text style={styles.listTitle}>Podsumowanie {selectedWorld}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="package-variant" size={24} color={colors.gold} />
              <Text style={styles.summaryValue}>
                {data.items.length > 0 ? '50+' : '0'}
              </Text>
              <Text style={styles.summaryLabel}>Przedmiotów</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="trending-up" size={24} color={colors.buy} />
              <Text style={styles.summaryValue}>
                {formatGold(data.items[0]?.buy_offer ?? null)}
              </Text>
              <Text style={styles.summaryLabel}>Najwyższe kupno</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="update" size={24} color={colors.textSecondary} />
              <Text style={styles.summaryValue}>
                {data.last_update
                  ? new Date(data.last_update).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </Text>
              <Text style={styles.summaryLabel}>Ostatnia aktualizacja</Text>
            </View>
          </View>
        </View>
      )}
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
  rankSelector: {
    gap: 8,
    paddingVertical: 2,
  },
  rankTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  rankTabActive: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
  },
  rankTabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rankTabTextActive: {
    color: colors.gold,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 16,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 10,
    marginHorizontal: -8,
  },
  listCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 16,
    gap: 0,
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 12,
  },
  rankNum: {
    fontSize: 16,
    fontWeight: '800',
    width: 32,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rankCategory: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rankValue: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
