import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWorld } from '@/src/context/WorldContext';
import { useTranslation } from '@/src/context/LanguageContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { LoadingState } from '@/src/components/LoadingState';
import { ErrorState } from '@/src/components/ErrorState';
import { colors } from '@/src/theme/colors';
import { formatGold, toTitleCase, filterAndSortItems, MarketItem } from '@/src/api/tibiaMarket';

type RankType = 'month_sold' | 'month_bought' | 'buy_offer' | 'sell_offer';

const RANK_OPTION_KEYS: { key: 'most_sold' | 'most_bought' | 'most_expensive_buy' | 'most_expensive_sell'; value: RankType; icon: string }[] = [
  { key: 'most_sold', value: 'month_sold', icon: 'trending-up' },
  { key: 'most_bought', value: 'month_bought', icon: 'cart' },
  { key: 'most_expensive_buy', value: 'buy_offer', icon: 'currency-usd' },
  { key: 'most_expensive_sell', value: 'sell_offer', icon: 'tag' },
];

const MEDAL_ICONS = ['trophy', 'medal', 'medal-outline'] as const;
const MEDAL_COLORS = [colors.gold, '#9ca3af', '#cd7f32'] as const;

function RankCard({
  item,
  rank,
  field,
  world,
  units,
}: {
  item: MarketItem;
  rank: number;
  field: RankType;
  world: string;
  units: string;
}) {
  const router = useRouter();
  const value = item[field];

  const isMedal = rank <= 3;
  const medalColor = isMedal ? MEDAL_COLORS[rank - 1] : colors.textMuted;
  const medalIcon = isMedal ? MEDAL_ICONS[rank - 1] : null;

  return (
    <TouchableOpacity
      style={[styles.rankCard, isMedal && rank === 1 && styles.rankCardFirst]}
      onPress={() =>
        router.push({ pathname: '/item/[name]', params: { name: item.name, world } })
      }
      activeOpacity={0.75}
    >
      <View style={[styles.rankNumWrap, { borderColor: medalColor + '40', backgroundColor: medalColor + '15' }]}>
        {medalIcon ? (
          <MaterialCommunityIcons name={medalIcon} size={14} color={medalColor} />
        ) : (
          <Text style={[styles.rankNum, { color: medalColor }]}>{rank}</Text>
        )}
      </View>
      <View style={styles.rankInfo}>
        <Text style={styles.rankName} numberOfLines={1}>
          {toTitleCase(item.name)}
        </Text>
        {item.category && (
          <Text style={styles.rankCategory}>{item.category}</Text>
        )}
      </View>
      <Text style={[styles.rankValue, rank === 1 && { color: colors.gold }]}>
        {field === 'month_sold' || field === 'month_bought'
          ? `${value ?? '—'} ${units}`
          : formatGold(value as number | null)}
      </Text>
    </TouchableOpacity>
  );
}

function CustomBarChart({
  items,
  field,
  width,
}: {
  items: MarketItem[];
  field: RankType;
  width: number;
}) {
  const CHART_H = 200;
  const PAD_TOP = 28;
  const PAD_BOTTOM = 32;
  const PAD_H = 8;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;
  const barZoneW = width - PAD_H * 2;
  const barSlot = barZoneW / items.length;
  const barPad = barSlot * 0.22;
  const barW = barSlot - barPad;

  const values = items.map((i) => {
    const v = i[field];
    return typeof v === 'number' ? v : 0;
  });
  const maxVal = Math.max(...values, 1);

  return (
    <Svg width={width} height={CHART_H}>
      {items.map((item, idx) => {
        const val = values[idx];
        const barH = Math.max((val / maxVal) * plotH, 4);
        const x = PAD_H + idx * barSlot + barPad / 2;
        const y = PAD_TOP + plotH - barH;
        const opacity = 1 - idx * 0.12;
        const label = item.name.split(' ')[0].slice(0, 9);
        const valLabel = formatGold(val);

        return (
          <G key={idx}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={colors.gold}
              opacity={opacity}
              rx={4}
            />
            <SvgText
              x={x + barW / 2}
              y={y - 5}
              textAnchor="middle"
              fill={colors.textSecondary}
              fontSize={10}
              fontWeight="600"
            >
              {valLabel}
            </SvgText>
            <SvgText
              x={x + barW / 2}
              y={CHART_H - 8}
              textAnchor="middle"
              fill={colors.textMuted}
              fontSize={10}
            >
              {label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function StatisticsScreen() {
  const { selectedWorld } = useWorld();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const [activeRank, setActiveRank] = useState<RankType>('month_sold');

  const RANK_OPTIONS = RANK_OPTION_KEYS.map((o) => ({ ...o, label: t(o.key) }));

  const { data: rawData, isLoading, isError, refetch } = useMarketBoard(selectedWorld);

  const rankedItems = useMemo(() =>
    rawData ? filterAndSortItems(rawData.items, { sort_field: activeRank, sort_order: 'desc' }) : [],
    [rawData, activeRank]
  );

  const data = rawData ? { ...rawData, items: rankedItems } : undefined;
  const top5 = rankedItems.slice(0, 5);
  const top10 = rankedItems.slice(0, 10);

  if (isLoading) {
    return <LoadingState message={t('loading_stats')} />;
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
      {top5.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('top_5')}</Text>
          <CustomBarChart items={top5} field={activeRank} width={Math.min(screenWidth - 32, 600)} />
        </View>
      )}

      {/* Top 10 list */}
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>
          {RANK_OPTIONS.find((o) => o.value === activeRank)?.label ?? t('ranking')}
        </Text>
        {top10.map((item, idx) => (
          <RankCard
            key={item.name}
            item={item}
            rank={idx + 1}
            field={activeRank}
            world={selectedWorld}
            units={t('units')}
          />
        ))}
      </View>

      {/* Summary stats */}
      {data && (
        <View style={styles.summaryCard}>
          <Text style={styles.listTitle}>{t('summary')} {selectedWorld}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="package-variant" size={24} color={colors.gold} />
              <Text style={styles.summaryValue}>
                {data.items.length > 0 ? '50+' : '0'}
              </Text>
              <Text style={styles.summaryLabel}>{t('items_label')}</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="trending-up" size={24} color={colors.buy} />
              <Text style={styles.summaryValue}>
                {formatGold(data.items[0]?.buy_offer ?? null)}
              </Text>
              <Text style={styles.summaryLabel}>{t('highest_buy_price')}</Text>
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
              <Text style={styles.summaryLabel}>{t('last_update')}</Text>
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
  rankCardFirst: {
    backgroundColor: colors.goldDim,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  rankNumWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontSize: 13,
    fontWeight: '800',
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
