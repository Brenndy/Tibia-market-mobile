import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { WatchAlertModal } from '@/src/components/WatchAlertModal';
import { ItemDetailModal } from '@/src/components/ItemDetailModal';
import { MarketItemGrid } from '@/src/components/MarketItemGrid';
import { WorldSectionHeader } from '@/src/components/WorldSectionHeader';
import { EmptyState } from '@/src/components/EmptyState';
import { TabSwitcher } from '@/src/components/TabSwitcher';
import { FilterPillBar, FilterPill } from '@/src/components/FilterPillBar';
import { Pill } from '@/src/components/ui/Pill';
import { ItemImageBox } from '@/src/components/ui/ItemImageBox';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { StatBlock } from '@/src/components/ui/StatBlock';
import { colors } from '@/src/theme/colors';
import { formatGold, toTitleCase, MarketItem } from '@/src/api/tibiaMarket';
import { pluralKey } from '@/src/utils/plural';
import AsyncStorage from '@react-native-async-storage/async-storage';

const pluralActive = (n: number) =>
  pluralKey(n, { one: 'active_label_one', few: 'active_label_few', many: 'active_label_many' });

// Maps current vs threshold to a 0..1 fill showing how close the alert is.
// Full = triggered. 0 = price is more than 20% away from threshold.
function alertProgress(
  currentBuy: number | null,
  currentSell: number | null,
  alert: WatchAlert,
): { buy: number; sell: number; anyTriggered: boolean } {
  const WINDOW = 0.2;
  let buy = 0;
  let sell = 0;
  let anyTriggered = false;
  if (alert.buyAlert != null && currentBuy != null && currentBuy > 0) {
    const cond = getBuyCondition(alert);
    const triggered =
      cond === 'below' ? currentBuy <= alert.buyAlert : currentBuy >= alert.buyAlert;
    if (triggered) {
      buy = 1;
      anyTriggered = true;
    } else {
      const dist =
        cond === 'below'
          ? (currentBuy - alert.buyAlert) / alert.buyAlert
          : (alert.buyAlert - currentBuy) / alert.buyAlert;
      buy = Math.max(0, 1 - dist / WINDOW);
    }
  }
  if (alert.sellAlert != null && currentSell != null && currentSell > 0) {
    const cond = getSellCondition(alert);
    const triggered =
      cond === 'above' ? currentSell >= alert.sellAlert : currentSell <= alert.sellAlert;
    if (triggered) {
      sell = 1;
      anyTriggered = true;
    } else {
      const dist =
        cond === 'above'
          ? (alert.sellAlert - currentSell) / alert.sellAlert
          : (currentSell - alert.sellAlert) / alert.sellAlert;
      sell = Math.max(0, 1 - dist / WINDOW);
    }
  }
  return { buy, sell, anyTriggered };
}

// ─── WatchCard ────────────────────────────────────────────────────────────────

function WatchCard({
  alert,
  marketItem,
  onEdit,
  onOpenModal,
}: {
  alert: WatchAlert;
  marketItem: MarketItem | undefined;
  onEdit: (alert: WatchAlert) => void;
  onOpenModal?: (name: string, world: string) => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  const buyOffer = marketItem?.buy_offer ?? null;
  const sellOffer = marketItem?.sell_offer ?? null;
  const triggered = isAlertTriggered(alert, buyOffer, sellOffer);
  const anyTriggered = triggered.buy || triggered.sell;
  const progress = alertProgress(buyOffer, sellOffer, alert);

  const handlePress = () => {
    if (onOpenModal) {
      onOpenModal(alert.itemName, alert.world);
    } else {
      router.push({
        pathname: '/item/[name]',
        params: { name: alert.itemName, world: alert.world },
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, anyTriggered && styles.cardTriggered]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {anyTriggered && (
        <LinearGradient colors={[colors.goldDim, 'transparent']} style={styles.triggeredBg} />
      )}

      <View style={styles.cardHeader}>
        <ItemImageBox wikiName={alert.wikiName} size={38} boxSize={42} />
        <View style={styles.nameCol}>
          <Text style={styles.itemName} numberOfLines={1}>
            {toTitleCase(alert.itemName)}
          </Text>
          {anyTriggered ? (
            <Pill
              label={t('opportunity')}
              tone="gold"
              icon="bell-ring"
              style={styles.opportunityPill}
            />
          ) : marketItem == null ? (
            <Text style={styles.loadingText}>{t('loading_ellipsis')}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          testID="edit-alert"
          style={styles.editBtn}
          onPress={() => onEdit(alert)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.priceRow}>
        <StatBlock
          label={t('buy')}
          value={marketItem ? formatGold(buyOffer) : '…'}
          valueColor={colors.buy}
          subtext={
            alert.buyAlert != null ? (
              <View style={styles.threshRow}>
                <MaterialCommunityIcons
                  name={triggered.buy ? 'bell-ring' : 'bell-outline'}
                  size={11}
                  color={triggered.buy ? colors.buy : colors.textMuted}
                />
                <Text style={[styles.thresh, triggered.buy && { color: colors.buy }]}>
                  {getBuyCondition(alert) === 'below' ? '≤' : '≥'} {formatGold(alert.buyAlert)}
                </Text>
              </View>
            ) : (
              <Text style={styles.noAlert}>{t('no_alert_set')}</Text>
            )
          }
        />
        <View style={styles.divV} />
        <StatBlock
          label={t('sell')}
          value={marketItem ? formatGold(sellOffer) : '…'}
          valueColor={colors.sell}
          subtext={
            alert.sellAlert != null ? (
              <View style={styles.threshRow}>
                <MaterialCommunityIcons
                  name={triggered.sell ? 'bell-ring' : 'bell-outline'}
                  size={11}
                  color={triggered.sell ? colors.sell : colors.textMuted}
                />
                <Text style={[styles.thresh, triggered.sell && { color: colors.sell }]}>
                  {getSellCondition(alert) === 'below' ? '≤' : '≥'} {formatGold(alert.sellAlert)}
                </Text>
              </View>
            ) : (
              <Text style={styles.noAlert}>{t('no_alert_set')}</Text>
            )
          }
        />
        <View style={styles.divV} />
        <StatBlock
          label={t('volume_monthly')}
          value={marketItem?.month_sold?.toLocaleString() ?? (marketItem ? '—' : '…')}
          subtext={t('units')}
        />
      </View>

      {(alert.buyAlert != null || alert.sellAlert != null) && marketItem && (
        <View style={styles.progressRow}>
          {alert.buyAlert != null && (
            <ProgressBar progress={progress.buy} color={triggered.buy ? colors.gold : colors.buy} />
          )}
          {alert.sellAlert != null && (
            <ProgressBar
              progress={progress.sell}
              color={triggered.sell ? colors.gold : colors.sell}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── WorldAlertsSection ───────────────────────────────────────────────────────

const NOTIFIED_KEY = 'tibia_notified_alerts_v1';

function WorldAlertsSection({
  world,
  alerts,
  onEdit,
  numColumns,
  onItemPress,
}: {
  world: string;
  alerts: WatchAlert[];
  onEdit: (alert: WatchAlert) => void;
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

  return (
    <View style={styles.worldSection}>
      <WorldSectionHeader
        world={world}
        count={alerts.length}
        countLabel={alerts.length === 1 ? t('alert_singular') : t('alerts_plural')}
        right={right}
      />
      <View style={isGrid ? styles.grid : styles.list}>
        {[...alerts]
          .sort((a, b) => {
            const aItem = getItem(a.itemName);
            const bItem = getItem(b.itemName);
            const aT = isAlertTriggered(a, aItem?.buy_offer ?? null, aItem?.sell_offer ?? null);
            const bT = isAlertTriggered(b, bItem?.buy_offer ?? null, bItem?.sell_offer ?? null);
            return (bT.buy || bT.sell ? 1 : 0) - (aT.buy || aT.sell ? 1 : 0);
          })
          .map((alert) => (
            <View
              key={`${alert.world}-${alert.itemName}`}
              style={isGrid ? { flexBasis: `${100 / numColumns}%`, padding: 6 } : undefined}
            >
              <WatchCard
                alert={alert}
                marketItem={getItem(alert.itemName)}
                onEdit={onEdit}
                onOpenModal={isGrid ? onItemPress : undefined}
              />
            </View>
          ))}
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
  const { watchlist, removeFromWatchlist, updateAlert } = useWatchlist();
  const { allFavorites } = useWorld();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [editingAlert, setEditingAlert] = useState<WatchAlert | null>(null);
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
                  onEdit={setEditingAlert}
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

      {editingAlert && (
        <WatchAlertModal
          visible={!!editingAlert}
          itemName={editingAlert.itemName}
          wikiName={editingAlert.wikiName}
          world={editingAlert.world}
          currentBuy={null}
          currentSell={null}
          initialBuyAlert={editingAlert.buyAlert}
          initialSellAlert={editingAlert.sellAlert}
          initialBuyAlertCondition={editingAlert.buyAlertCondition}
          initialSellAlertCondition={editingAlert.sellAlertCondition}
          isEditing={true}
          onSave={(buy, sell, buyCond, sellCond) => {
            if (buy == null && sell == null) {
              removeFromWatchlist(editingAlert.itemName, editingAlert.world);
            } else {
              updateAlert(editingAlert.itemName, editingAlert.world, buy, sell, buyCond, sellCond);
            }
          }}
          onRemove={() => removeFromWatchlist(editingAlert.itemName, editingAlert.world)}
          onClose={() => setEditingAlert(null)}
        />
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

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardTriggered: { borderColor: colors.gold },
  triggeredBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  nameCol: { flex: 1, gap: 4 },
  itemName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  opportunityPill: { alignSelf: 'flex-start' },
  loadingText: { color: colors.textMuted, fontSize: 11 },
  editBtn: { padding: 4 },

  priceRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.divider },
  threshRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  thresh: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  noAlert: { color: colors.textMuted, fontSize: 10, fontStyle: 'italic' },
  divV: { width: 1, backgroundColor: colors.border, marginVertical: 8 },

  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
