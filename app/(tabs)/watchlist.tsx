import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useMarketBoards } from '@/src/hooks/useMarket';
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
import { colors } from '@/src/theme/colors';
import { MarketBoard, MarketItem } from '@/src/api/tibiaMarket';
import { pluralKey } from '@/src/utils/plural';
import AsyncStorage from '@react-native-async-storage/async-storage';

const pluralActive = (n: number) =>
  pluralKey(n, { one: 'active_label_one', few: 'active_label_few', many: 'active_label_many' });

// ─── WorldAlertsSection ───────────────────────────────────────────────────────

const NOTIFIED_KEY = 'tibia_notified_alerts_v1';

function WorldAlertsSection({
  world,
  alerts,
  visibleItems,
  board,
  isLoading,
  numColumns,
  onItemPress,
}: {
  world: string;
  alerts: WatchAlert[];
  visibleItems: MarketItem[];
  board: MarketBoard | undefined;
  isLoading: boolean;
  numColumns: number;
  onItemPress?: (name: string, world: string) => void;
}) {
  const isGrid = numColumns > 1;
  const { t } = useTranslation();
  const checkedRef = useRef<string>('');

  const alertByName = new Map(alerts.map((a) => [a.itemName, a]));

  useEffect(() => {
    if (!board) return;
    const dataKey = board.last_update + alerts.length;
    if (checkedRef.current === dataKey) return;
    checkedRef.current = dataKey;

    if (Platform.OS === 'web') return;
    (async () => {
      const { sendPriceAlert } = await import('@/src/services/notifications');
      const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
      const notifiedSet: Set<string> = new Set(raw ? JSON.parse(raw) : []);
      const toAdd: string[] = [];

      for (const alert of alerts) {
        const item = board.items.find((i) => i.name === alert.itemName);
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
  }, [board, alerts, world]);

  const triggeredCount = visibleItems.filter((item) => {
    const alert = alertByName.get(item.name)!;
    const tr = isAlertTriggered(alert, item.buy_offer ?? null, item.sell_offer ?? null);
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

  const sortedItems = [...visibleItems].sort((a, b) => {
    const aAlert = alertByName.get(a.name)!;
    const bAlert = alertByName.get(b.name)!;
    const aT = isAlertTriggered(aAlert, a.buy_offer ?? null, a.sell_offer ?? null);
    const bT = isAlertTriggered(bAlert, b.buy_offer ?? null, b.sell_offer ?? null);
    return (bT.buy || bT.sell ? 1 : 0) - (aT.buy || aT.sell ? 1 : 0);
  });

  if (visibleItems.length === 0) return null;

  return (
    <View style={styles.worldSection}>
      <WorldSectionHeader
        world={world}
        count={visibleItems.length}
        countLabel={visibleItems.length === 1 ? t('alert_singular') : t('alerts_plural')}
        right={right}
      />
      <View style={isGrid ? styles.grid : styles.list}>
        {sortedItems.map((item) => {
          const alert = alertByName.get(item.name)!;
          return (
            <MarketItemGridItem
              key={`${world}-${item.name}`}
              item={item}
              world={world}
              numColumns={numColumns}
              onPress={isGrid && onItemPress ? () => onItemPress(item.name, world) : undefined}
              footerSlot={
                <AlertThresholdFooter
                  alert={alert}
                  currentBuy={item.buy_offer ?? null}
                  currentSell={item.sell_offer ?? null}
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
  visibleItems,
  isLoading,
  numColumns,
  onItemPress,
}: {
  world: string;
  visibleItems: MarketItem[];
  isLoading: boolean;
  numColumns: number;
  onItemPress?: (name: string) => void;
}) {
  const { t } = useTranslation();

  if (visibleItems.length === 0) return null;

  return (
    <View style={styles.worldSection}>
      <WorldSectionHeader
        world={world}
        count={visibleItems.length}
        countLabel={visibleItems.length === 1 ? t('favorite_singular') : t('favorites_plural')}
        right={isLoading ? <Text style={styles.worldLoading}>{t('syncing')}</Text> : null}
      />
      <MarketItemGrid
        items={visibleItems}
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

  const alertWorlds = useMemo(
    () => [...new Set(watchlist.map((a) => a.world))].sort(),
    [watchlist],
  );
  const favWorlds = useMemo(
    () =>
      Object.keys(allFavorites)
        .filter((w) => (allFavorites[w] ?? []).length > 0)
        .sort(),
    [allFavorites],
  );
  const allWorlds = useMemo(
    () => [...new Set([...alertWorlds, ...favWorlds])],
    [alertWorlds, favWorlds],
  );

  const { boardByWorld, loadingByWorld } = useMarketBoards(allWorlds);

  // Per-world visible items for alerts (item present in the board AND has an alert)
  const visibleAlertItemsByWorld = useMemo(() => {
    const m = new Map<string, MarketItem[]>();
    alertWorlds.forEach((world) => {
      const board = boardByWorld.get(world);
      if (!board) {
        m.set(world, []);
        return;
      }
      const alertNames = new Set(watchlist.filter((a) => a.world === world).map((a) => a.itemName));
      m.set(
        world,
        board.items.filter((i) => alertNames.has(i.name)),
      );
    });
    return m;
  }, [alertWorlds, boardByWorld, watchlist]);

  const visibleFavItemsByWorld = useMemo(() => {
    const m = new Map<string, MarketItem[]>();
    favWorlds.forEach((world) => {
      const board = boardByWorld.get(world);
      if (!board) {
        m.set(world, []);
        return;
      }
      const favNames = new Set(allFavorites[world] ?? []);
      m.set(
        world,
        board.items.filter((i) => favNames.has(i.name)),
      );
    });
    return m;
  }, [favWorlds, boardByWorld, allFavorites]);

  const anyBoardLoading = [...loadingByWorld.values()].some(Boolean);
  const totalVisibleAlerts = [...visibleAlertItemsByWorld.values()].reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  const totalVisibleFavs = [...visibleFavItemsByWorld.values()].reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  // Fall back to configured counts while boards load so the tab badge does not
  // flicker 0 → N on first paint.
  const alertBadge =
    anyBoardLoading && totalVisibleAlerts === 0 ? watchlist.length : totalVisibleAlerts;
  const configuredFavs = favWorlds.reduce((s, w) => s + (allFavorites[w]?.length ?? 0), 0);
  const favBadge = anyBoardLoading && totalVisibleFavs === 0 ? configuredFavs : totalVisibleFavs;

  const filteredAlertWorlds = worldFilter ? [worldFilter] : alertWorlds;
  const filteredFavWorlds = favWorldFilter ? [favWorldFilter] : favWorlds;

  const alertFilters: FilterPill<string | null>[] = [
    { value: null, label: t('all_worlds'), count: alertBadge },
    ...alertWorlds.map((w) => ({
      value: w,
      label: w,
      icon: 'earth' as const,
      count: (visibleAlertItemsByWorld.get(w) ?? []).length,
    })),
  ];

  const favFilters: FilterPill<string | null>[] = [
    { value: null, label: t('all_worlds'), count: favBadge },
    ...favWorlds.map((w) => ({
      value: w,
      label: w,
      icon: 'earth' as const,
      count: (visibleFavItemsByWorld.get(w) ?? []).length,
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
            badge: alertBadge > 0 ? alertBadge : null,
          },
          {
            value: 'favorites',
            label: t('tab_favorites'),
            icon: 'star',
            badge: favBadge > 0 ? favBadge : null,
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
            {alertWorlds.length > 1 && (
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
              {filteredAlertWorlds.map((world) => (
                <WorldAlertsSection
                  key={world}
                  world={world}
                  alerts={watchlist.filter((a) => a.world === world)}
                  visibleItems={visibleAlertItemsByWorld.get(world) ?? []}
                  board={boardByWorld.get(world)}
                  isLoading={loadingByWorld.get(world) ?? false}
                  numColumns={numColumns}
                  onItemPress={isDesktop ? openItemModal : undefined}
                />
              ))}
            </ScrollView>
          </>
        )
      ) : configuredFavs === 0 ? (
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
                visibleItems={visibleFavItemsByWorld.get(world) ?? []}
                isLoading={loadingByWorld.get(world) ?? false}
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
});
