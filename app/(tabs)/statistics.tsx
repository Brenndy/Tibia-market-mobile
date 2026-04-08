import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useWorld } from '@/src/context/WorldContext';
import { useTranslation } from '@/src/context/LanguageContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { LoadingState } from '@/src/components/LoadingState';
import { ErrorState } from '@/src/components/ErrorState';
import { ItemImage } from '@/src/components/ItemImage';
import { colors } from '@/src/theme/colors';
import { formatGold, toTitleCase, filterAndSortItems, MarketItem } from '@/src/api/tibiaMarket';

type RankType = 'month_sold' | 'month_bought' | 'buy_offer' | 'sell_offer';

const RANK_OPTION_KEYS: { key: 'most_sold' | 'most_bought' | 'most_expensive_buy' | 'most_expensive_sell'; value: RankType; icon: string }[] = [
  { key: 'most_sold', value: 'month_sold', icon: 'trending-up' },
  { key: 'most_bought', value: 'month_bought', icon: 'cart' },
  { key: 'most_expensive_buy', value: 'buy_offer', icon: 'currency-usd' },
  { key: 'most_expensive_sell', value: 'sell_offer', icon: 'tag' },
];

const PODIUM_COLORS = [colors.gold, '#9ca3af', '#cd7f32'] as const;
const PODIUM_BG = ['#2a2410', '#1e1f20', '#231a10'] as const;

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

  const isPodium = rank <= 3;
  const podiumColor = isPodium ? PODIUM_COLORS[rank - 1] : colors.textMuted;

  return (
    <TouchableOpacity
      style={[styles.rankCard, rank === 1 && styles.rankCardFirst]}
      onPress={() =>
        router.push({ pathname: '/item/[name]', params: { name: item.name, world } })
      }
      activeOpacity={0.75}
    >
      {/* Rank badge */}
      <View style={[styles.rankBadge, { borderColor: podiumColor + '50', backgroundColor: podiumColor + '18' }]}>
        <Text style={[styles.rankNum, { color: podiumColor }]}>{rank}</Text>
      </View>

      {/* Item image */}
      <View style={styles.rankImgWrap}>
        <ItemImage wikiName={item.wiki_name} size={36} />
      </View>

      {/* Name + category */}
      <View style={styles.rankInfo}>
        <Text style={styles.rankName} numberOfLines={1}>
          {toTitleCase(item.name)}
        </Text>
        {item.category && (
          <Text style={styles.rankCategory} numberOfLines={1}>{item.category}</Text>
        )}
      </View>

      {/* Value */}
      <Text style={[styles.rankValue, rank === 1 && { color: colors.gold }]}>
        {field === 'month_sold' || field === 'month_bought'
          ? `${(value ?? 0).toLocaleString()} ${units}`
          : formatGold(value as number | null)}
      </Text>
    </TouchableOpacity>
  );
}

// Horizontal bar chart — easier to read item names
function HorizontalBarChart({
  items,
  field,
  units,
}: {
  items: MarketItem[];
  field: RankType;
  units: string;
}) {
  const isPrice = field === 'buy_offer' || field === 'sell_offer';
  const values = items.map((i) => {
    const v = i[field];
    return typeof v === 'number' ? v : 0;
  });
  const maxVal = Math.max(...values, 1);

  return (
    <View style={styles.hBarContainer}>
      {items.map((item, idx) => {
        const val = values[idx];
        const pct = val / maxVal;
        const podiumColor = idx < 3 ? PODIUM_COLORS[idx] : colors.gold;
        const label = isPrice ? formatGold(val) : `${val.toLocaleString()} ${units}`;

        return (
          <View key={item.name} style={styles.hBarRow}>
            {/* Rank + image */}
            <View style={styles.hBarLeft}>
              <Text style={[styles.hBarRank, { color: idx < 3 ? podiumColor : colors.textMuted }]}>
                {idx + 1}
              </Text>
              <View style={styles.hBarImg}>
                <ItemImage wikiName={item.wiki_name} size={24} />
              </View>
              <Text style={styles.hBarName} numberOfLines={1}>
                {toTitleCase(item.name).split(' ')[0]}
              </Text>
            </View>
            {/* Bar */}
            <View style={styles.hBarTrack}>
              <View style={[styles.hBarFill, { width: `${Math.max(pct * 100, 3)}%` as any, backgroundColor: podiumColor + (idx === 0 ? 'ff' : 'bb') }]} />
            </View>
            {/* Value */}
            <Text style={[styles.hBarVal, { color: idx === 0 ? colors.gold : colors.textSecondary }]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function StatisticsScreen() {
  const { selectedWorld } = useWorld();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [activeRank, setActiveRank] = useState<RankType>('month_sold');

  useEffect(() => {
    const unsubscribe = navigation.getParent()?.addListener('tabPress' as any, () => {
      if (navigation.isFocused()) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return () => unsubscribe?.();
  }, [navigation]);

  const RANK_OPTIONS = RANK_OPTION_KEYS.map((o) => ({ ...o, label: t(o.key) }));

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const { data: rawData, isLoading, isError, refetch } = useMarketBoard(selectedWorld);

  const rankedItems = useMemo(() =>
    rawData ? filterAndSortItems(rawData.items, { sort_field: activeRank, sort_order: 'desc' }) : [],
    [rawData, activeRank]
  );

  const data = rawData ? { ...rawData, items: rankedItems } : undefined;
  const top15 = rankedItems.slice(0, 15);

  if (!isMounted || isLoading) {
    return <LoadingState message={t('loading_stats')} />;
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <ScrollView
      ref={scrollRef}
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

      {/* Top 15 list */}
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>
          {RANK_OPTIONS.find((o) => o.value === activeRank)?.label ?? t('ranking')}
        </Text>
        {top15.map((item, idx) => (
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
                {data.items.length.toLocaleString()}
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
                  ? new Date(data.last_update).toLocaleTimeString(undefined, {
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
    paddingBottom: 80,
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
    gap: 10,
  },
  rankCardFirst: {
    backgroundColor: colors.goldDim,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  rankImgWrap: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 0,
  },
  // Horizontal bar chart
  hBarContainer: {
    gap: 10,
  },
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 100,
  },
  hBarRank: {
    fontSize: 11,
    fontWeight: '800',
    width: 16,
    textAlign: 'center',
  },
  hBarImg: {
    width: 28,
    height: 28,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hBarName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  hBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  hBarVal: {
    fontSize: 11,
    fontWeight: '700',
    width: 72,
    textAlign: 'right',
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
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});
