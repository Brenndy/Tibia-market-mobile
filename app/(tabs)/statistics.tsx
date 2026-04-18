import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useWorld } from '@/src/context/WorldContext';
import { useTranslation } from '@/src/context/LanguageContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { useResponsiveColumns } from '@/src/hooks/useResponsiveColumns';
import { LoadingState } from '@/src/components/LoadingState';
import { ErrorState } from '@/src/components/ErrorState';
import { ItemDetailModal } from '@/src/components/ItemDetailModal';
import { FilterPillBar, FilterPill } from '@/src/components/FilterPillBar';
import { RankBadge } from '@/src/components/ui/RankBadge';
import { ItemImageBox } from '@/src/components/ui/ItemImageBox';
import { colors } from '@/src/theme/colors';
import { formatGold, toTitleCase, filterAndSortItems, MarketItem } from '@/src/api/tibiaMarket';

type RankType = 'month_sold' | 'month_bought' | 'buy_offer' | 'sell_offer';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const RANK_OPTION_KEYS: {
  key: 'most_sold' | 'most_bought' | 'most_expensive_buy' | 'most_expensive_sell';
  value: RankType;
  icon: IconName;
}[] = [
  { key: 'most_sold', value: 'month_sold', icon: 'trending-up' },
  { key: 'most_bought', value: 'month_bought', icon: 'cart' },
  { key: 'most_expensive_buy', value: 'buy_offer', icon: 'currency-usd' },
  { key: 'most_expensive_sell', value: 'sell_offer', icon: 'tag' },
];

function RankCard({
  item,
  rank,
  field,
  world,
  units,
  onOpenModal,
}: {
  item: MarketItem;
  rank: number;
  field: RankType;
  world: string;
  units: string;
  onOpenModal?: (name: string) => void;
}) {
  const router = useRouter();
  const value = item[field];
  const handlePress = () => {
    if (onOpenModal) onOpenModal(item.name);
    else router.push({ pathname: '/item/[name]', params: { name: item.name, world } });
  };

  return (
    <TouchableOpacity
      style={[styles.rankCard, rank === 1 && styles.rankCardFirst]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <RankBadge rank={rank} />
      <ItemImageBox wikiName={item.wiki_name} size={36} boxSize={40} />
      <View style={styles.rankInfo}>
        <Text style={styles.rankName} numberOfLines={1}>
          {toTitleCase(item.name)}
        </Text>
        {item.category && (
          <Text style={styles.rankCategory} numberOfLines={1}>
            {item.category}
          </Text>
        )}
      </View>
      <Text style={[styles.rankValue, rank === 1 && { color: colors.gold }]}>
        {field === 'month_sold' || field === 'month_bought'
          ? `${(value ?? 0).toLocaleString()} ${units}`
          : formatGold(value as number | null)}
      </Text>
    </TouchableOpacity>
  );
}

export default function StatisticsScreen() {
  const { selectedWorld } = useWorld();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [activeRank, setActiveRank] = useState<RankType>('month_sold');
  const [modalItemName, setModalItemName] = useState<string | null>(null);
  const { isDesktop } = useResponsiveColumns();

  useEffect(() => {
    const unsubscribe = navigation.getParent()?.addListener('tabPress' as never, () => {
      if (navigation.isFocused()) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return () => unsubscribe?.();
  }, [navigation]);

  const rankFilters: FilterPill<RankType>[] = RANK_OPTION_KEYS.map((o) => ({
    value: o.value,
    label: t(o.key),
    icon: o.icon,
  }));

  const { data: rawData, isLoading, isError, refetch } = useMarketBoard(selectedWorld);

  const rankedItems = useMemo(
    () =>
      rawData
        ? filterAndSortItems(rawData.items, { sort_field: activeRank, sort_order: 'desc' })
        : [],
    [rawData, activeRank],
  );

  const data = rawData ? { ...rawData, items: rankedItems } : undefined;
  const top15 = rankedItems.slice(0, 15);

  if (isLoading) return <LoadingState message={t('loading_stats')} />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const activeLabel = rankFilters.find((f) => f.value === activeRank)?.label ?? t('ranking');

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FilterPillBar<RankType> items={rankFilters} active={activeRank} onChange={setActiveRank} />

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>{activeLabel}</Text>
          {top15.map((item, idx) => (
            <RankCard
              key={item.id}
              item={item}
              rank={idx + 1}
              field={activeRank}
              world={selectedWorld}
              units={t('units')}
              onOpenModal={isDesktop ? setModalItemName : undefined}
            />
          ))}
        </View>

        {data && (
          <View style={styles.summaryCard}>
            <Text style={styles.listTitle}>
              {t('summary')} {selectedWorld}
            </Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="package-variant" size={24} color={colors.gold} />
                <Text style={styles.summaryValue}>{data.items.length.toLocaleString()}</Text>
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
      <ItemDetailModal
        name={modalItemName}
        world={selectedWorld}
        onClose={() => setModalItemName(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 80, gap: 16 },
  listCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 16,
  },
  listTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
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
  rankInfo: { flex: 1 },
  rankName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  rankCategory: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  rankValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', flexShrink: 0 },
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 16,
  },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 6 },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '600', textAlign: 'center' },
});
