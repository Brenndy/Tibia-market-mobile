import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import {
  useWatchlist,
  isAlertTriggered,
  getBuyCondition,
  getSellCondition,
  WatchAlert,
} from '@/src/context/WatchlistContext';
import { useWorld } from '@/src/context/WorldContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { useResponsiveColumns } from '@/src/hooks/useResponsiveColumns';
import { useTranslation } from '@/src/context/LanguageContext';
import { ItemDetailModal } from '@/src/components/ItemDetailModal';
import { MarketItemGrid, MarketItemGridItem } from '@/src/components/MarketItemGrid';
import { WorldSectionHeader } from '@/src/components/WorldSectionHeader';
import { EmptyState } from '@/src/components/EmptyState';
import { TabSwitcher } from '@/src/components/TabSwitcher';
import { FilterPillBar, FilterPill } from '@/src/components/FilterPillBar';
import { AlertThresholdFooter } from '@/src/components/AlertThresholdFooter';
import { Pill } from '@/src/components/ui/Pill';
import { ItemImageBox } from '@/src/components/ui/ItemImageBox';
import { colors } from '@/src/theme/colors';
import { toTitleCase } from '@/src/api/tibiaMarket';
import { pluralKey } from '@/src/utils/plural';
import AsyncStorage from '@react-native-async-storage/async-storage';

const pluralActive = (n: number) =>
  pluralKey(n, { one: 'active_label_one', few: 'active_label_few', many: 'active_label_many' });

// Placeholder shown when the market board hasn't yet returned data for an
// item the user is watching — keeps the alert visible and preserves layout.
function AlertLoadingCard({ alert }: { alert: WatchAlert }) {
  const { t } = useTranslation();
  return (
    <View style={styles.loadingCard}>
      <ItemImageBox wikiName={alert.wikiName} size={42} />
      <View style={styles.loadingCol}>
        <Text style={styles.loadingName} numberOfLines={1}>
          {toTitleCase(alert.itemName)}
        </Text>
        <Text style={styles.loadingText}>{t('loading_ellipsis')}</Text>
      </View>
    </View>
  );
}

// ─── WorldAlertsSection ───────────────────────────────────────────────────────

const NOTIFIED_KEY = 'tibia_notified_alerts_v1';

function WorldAlertsSection({
  world,
  alerts,
  numColumns,
  onItemPress,
}: {
  world: string;
  alerts: WatchAlert[];
  numColumns: number;
  onItemPress?: (name: string, world: string) => void;
}) {
  const isGrid = numColumns > 1;
  const { data, isLoading } = useMarketBoard(world);
  const { t } = useTranslation();
  const checkedRef = useRef<string>('');

  const getItem = (name: string) => data?.items.find((i) => i.name === name);

  useEffect(() => {
    if (!data) return;
    const dataKey = data.last_update + alerts.length;
    if (checkedRef.current === dataKey) return;
    checkedRef.current = dataKey;

    if (Platform.OS === 'web') return;
    (async () => {
      const { sendPriceAlert } = await import('@/src/services/notifications');
      const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
      const notifiedSet: Set<string> = new Set(raw ? JSON.parse(raw) : []);
      const toAdd: string[] = [];

      for (const alert of alerts) {
        const item = data.items.find((i) => i.name === alert.itemName);
        if (!item) continue;
        const buyOffer = item.buy_offer ?? null;
        const sellOffer = item.sell_offer ?? null;
        const fired = isAlertTriggered(alert, buyOffer, sellOffer);

        if (fired.buy && alert.buyAlert != null && buyOffer != null) {
          const dir = getBuyCondition(alert);
          const key = `${world}:${alert.itemName}:buy:${dir}:${alert.buyAlert}`;
          if (!notifiedSet.has(key)) {
            await sendPriceAlert(alert.itemName, 'buy', dir, buyOffer, alert.buyAlert);
            toAdd.push(key);
          }
        }
        if (fired.sell && alert.sellAlert != null && sellOffer != null) {
          const dir = getSellCondition(alert);
          const key = `${world}:${alert.itemName}:sell:${dir}:${alert.sellAlert}`;
          if (!notifiedSet.has(key)) {
            await sendPriceAlert(alert.itemName, 'sell', dir, sellOffer, alert.sellAlert);
            toAdd.push(key);
          }
        }
      }

      if (toAdd.length > 0) {
        const updated = [...Array.from(notifiedSet), ...toAdd].slice(-500);
        await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(updated));
      }
    })();
  }, [data, alerts, world]);

  const triggeredCount = alerts.filter((a) => {
    const item = getItem(a.itemName);
    const tr = isAlertTriggered(a, item?.buy_offer ?? null, item?.sell_offer ?? null);
    return tr.buy || tr.sell;
  }).length;

  const right = isLoading ? (
    <Text style={styles.worldLoading}>{t('syncing')}</Text>
  ) : triggeredCount > 0 ? (
    <Pill
      label={`${triggeredCount} ${t(pluralActive(triggeredCount))}`}
      tone="triggered"
      icon="bell-ring"
    />
  ) : (
    <Pill label="OK" tone="ok" icon="check-circle-outline" />
  );

  const sorted = [...alerts].sort((a, b) => {
    const aItem = getItem(a.itemName);
    const bItem = getItem(b.itemName);
    const aT = isAlertTriggered(a, aItem?.buy_offer ?? null, aItem?.sell_offer ?? null);
    const bT = isAlertTriggered(b, bItem?.buy_offer ?? null, bItem?.sell_offer ?? null);
    return (bT.buy || bT.sell ? 1 : 0) - (aT.buy || aT.sell ? 1 : 0);
  });

  return (
    <View style={styles.worldSection}>
      <WorldSectionHeader
        world={world}
        count={alerts.length}
        countLabel={alerts.length === 1 ? t('alert_singular') : t('alerts_plural')}
        right={right}
      />
      <View style={isGrid ? styles.grid : styles.list}>
        {sorted.map((alert) => {
          const marketItem = getItem(alert.itemName);
          if (!marketItem) {
            return (
              <View
                key={`${alert.world}-${alert.itemName}`}
                style={isGrid ? { flexBasis: `${100 / numColumns}%`, padding: 6 } : undefined}
              >
                <AlertLoadingCard alert={alert} />
              </View>
            );
          }
          return (
            <MarketItemGridItem
              key={`${alert.world}-${alert.itemName}`}
              item={marketItem}
              world={world}
              numColumns={numColumns}
              onPress={isGrid && onItemPress ? () => onItemPress(alert.itemName, world) : undefined}
              footerSlot={
                <AlertThresholdFooter
                  alert={alert}
                  currentBuy={marketItem.buy_offer ?? null}
                  currentSell={marketItem.sell_offer ?? null}
                />
              }
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── WorldFavoritesSection ────────────────────────────────────────────────────

function WorldFavoritesSection({
  world,
  favoriteNames,
  numColumns,
  onItemPress,
}: {
  world: string;
  favoriteNames: string[];
  numColumns: number;
  onItemPress?: (name: string) => void;
}) {
  const { data, isLoading } = useMarketBoard(world);
  const { t } = useTranslation();

  const items = (data?.items ?? []).filter((i) => favoriteNames.includes(i.name));

  return (
    <View style={styles.worldSection}>
      <WorldSectionHeader
        world={world}
        count={favoriteNames.length}
        countLabel={favoriteNames.length === 1 ? t('favorite_singular') : t('favorites_plural')}
        right={isLoading ? <Text style={styles.worldLoading}>{t('syncing')}</Text> : null}
      />
      <MarketItemGrid
        items={items}
        world={world}
        numColumns={numColumns}
        onItemPress={onItemPress}
      />
    </View>
  );
}

// ─── WatchlistScreen ──────────────────────────────────────────────────────────

type WatchTab = 'alerts' | 'favorites';

export default function WatchlistScreen() {
  const { watchlist } = useWatchlist();
  const { allFavorites } = useWorld();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [worldFilter, setWorldFilter] = useState<string | null>(null);
  const [favWorldFilter, setFavWorldFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WatchTab>('alerts');
  const [modalItemName, setModalItemName] = useState<string | null>(null);
  const [modalItemWorld, setModalItemWorld] = useState<string | null>(null);
  const { numColumns, isDesktop } = useResponsiveColumns();

  useEffect(() => {
    const unsubscribe = navigation.getParent()?.addListener('tabPress' as never, () => {
      if (navigation.isFocused()) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return () => unsubscribe?.();
  }, [navigation]);

  const worlds = [...new Set(watchlist.map((a) => a.world))].sort();
  const filteredAlerts = worldFilter ? watchlist.filter((a) => a.world === worldFilter) : watchlist;
  const filteredWorlds = worldFilter ? [worldFilter] : worlds;

  const favWorlds = Object.keys(allFavorites)
    .filter((w) => (allFavorites[w] ?? []).length > 0)
    .sort();
  const filteredFavWorlds = favWorldFilter ? [favWorldFilter] : favWorlds;
  const totalFavs = favWorlds.reduce((sum, w) => sum + (allFavorites[w]?.length ?? 0), 0);

  const alertFilters: FilterPill<string | null>[] = [
    { value: null, label: t('all_worlds'), count: watchlist.length },
    ...worlds.map((w) => ({
      value: w,
      label: w,
      icon: 'earth' as const,
      count: watchlist.filter((a) => a.world === w).length,
    })),
  ];

  const favFilters: FilterPill<string | null>[] = [
    { value: null, label: t('all_worlds'), count: totalFavs },
    ...favWorlds.map((w) => ({
      value: w,
      label: w,
      icon: 'earth' as const,
      count: (allFavorites[w] ?? []).length,
    })),
  ];

  const openItemModal = (name: string, world: string) => {
    setModalItemWorld(world);
    setModalItemName(name);
  };

  return (
    <View style={styles.container}>
      <TabSwitcher<WatchTab>
        active={activeTab}
        onChange={setActiveTab}
        items={[
          {
            value: 'alerts',
            label: t('tab_alerts'),
            icon: 'bell',
            badge: watchlist.length > 0 ? watchlist.length : null,
          },
          {
            value: 'favorites',
            label: t('tab_favorites'),
            icon: 'star',
            badge: totalFavs > 0 ? totalFavs : null,
          },
        ]}
      />

      {activeTab === 'alerts' ? (
        watchlist.length === 0 ? (
          <EmptyState
            icon="bell-sleep-outline"
            title={t('no_alerts_title')}
            description={t('no_alerts_desc')}
            cta={{ label: t('go_to_market'), icon: 'store', onPress: () => router.push('/') }}
          />
        ) : (
          <>
            {worlds.length > 1 && (
              <FilterPillBar<string | null>
                items={alertFilters}
                active={worldFilter}
                onChange={setWorldFilter}
              />
            )}
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {filteredWorlds.map((world) => (
                <WorldAlertsSection
                  key={world}
                  world={world}
                  alerts={filteredAlerts.filter((a) => a.world === world)}
                  numColumns={numColumns}
                  onItemPress={isDesktop ? openItemModal : undefined}
                />
              ))}
            </ScrollView>
          </>
        )
      ) : totalFavs === 0 ? (
        <EmptyState
          icon="star-outline"
          title={t('no_favorites_title')}
          description={t('no_favorites_desc')}
          cta={{ label: t('go_to_market'), icon: 'store', onPress: () => router.push('/') }}
        />
      ) : (
        <>
          {favWorlds.length > 1 && (
            <FilterPillBar<string | null>
              items={favFilters}
              active={favWorldFilter}
              onChange={setFavWorldFilter}
            />
          )}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {filteredFavWorlds.map((world) => (
              <WorldFavoritesSection
                key={world}
                world={world}
                favoriteNames={allFavorites[world] ?? []}
                numColumns={numColumns}
                onItemPress={isDesktop ? (name) => openItemModal(name, world) : undefined}
              />
            ))}
          </ScrollView>
        </>
      )}

      <ItemDetailModal
        name={modalItemName}
        world={modalItemWorld ?? ''}
        onClose={() => {
          setModalItemName(null);
          setModalItemWorld(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  content: {
    padding: 12,
    gap: 16,
    paddingBottom: 80,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },

  worldSection: { gap: 8 },
  worldLoading: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  list: { gap: 8 },

  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 14,
  },
  loadingCol: { flex: 1, gap: 4 },
  loadingName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  loadingText: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },
});
