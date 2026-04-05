import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useWatchlist, isAlertTriggered, WatchAlert } from '@/src/context/WatchlistContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { useTranslation } from '@/src/context/LanguageContext';
import { WatchAlertModal } from '@/src/components/WatchAlertModal';
import { ItemImage } from '@/src/components/ItemImage';
import { colors } from '@/src/theme/colors';
import { formatGold, toTitleCase, MarketItem } from '@/src/api/tibiaMarket';

// ─── WatchCard ────────────────────────────────────────────────────────────────

function WatchCard({
  alert,
  marketItem,
  onEdit,
}: {
  alert: WatchAlert;
  marketItem: MarketItem | undefined;
  onEdit: (alert: WatchAlert) => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  const buyOffer = marketItem?.buy_offer ?? null;
  const sellOffer = marketItem?.sell_offer ?? null;
  const triggered = isAlertTriggered(alert, buyOffer, sellOffer);
  const anyTriggered = triggered.buy || triggered.sell;

  return (
    <TouchableOpacity
      style={[styles.card, anyTriggered && styles.cardTriggered]}
      onPress={() =>
        router.push({
          pathname: '/item/[name]',
          params: { name: alert.itemName, world: alert.world },
        })
      }
      activeOpacity={0.8}
    >
      {anyTriggered && (
        <LinearGradient
          colors={[colors.goldDim, 'transparent']}
          style={styles.triggeredBg}
        />
      )}

      <View style={styles.cardHeader}>
        <View style={styles.imgWrap}>
          <ItemImage wikiName={alert.wikiName} size={38} />
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.itemName} numberOfLines={1}>
            {toTitleCase(alert.itemName)}
          </Text>
          {anyTriggered ? (
            <View style={styles.alertBadge}>
              <MaterialCommunityIcons name="bell-ring" size={10} color={colors.gold} />
              <Text style={styles.alertBadgeText}>{t('opportunity')}</Text>
            </View>
          ) : marketItem == null ? (
            <Text style={styles.loadingText}>{t('loading_ellipsis')}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(alert)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.priceRow}>
        {/* Buy side */}
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>{t('buy')}</Text>
          <Text style={[styles.priceVal, { color: colors.buy }]}>
            {marketItem ? formatGold(buyOffer) : '…'}
          </Text>
          {alert.buyAlert != null && (
            <View style={styles.threshRow}>
              <MaterialCommunityIcons
                name={triggered.buy ? 'bell-ring' : 'bell-outline'}
                size={11}
                color={triggered.buy ? colors.buy : colors.textMuted}
              />
              <Text style={[styles.thresh, triggered.buy && { color: colors.buy }]}>
                ≤ {formatGold(alert.buyAlert)}
              </Text>
            </View>
          )}
          {alert.buyAlert == null && (
            <Text style={styles.noAlert}>{t('no_alert_set')}</Text>
          )}
        </View>

        <View style={styles.divV} />

        {/* Sell side */}
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>{t('sell')}</Text>
          <Text style={[styles.priceVal, { color: colors.sell }]}>
            {marketItem ? formatGold(sellOffer) : '…'}
          </Text>
          {alert.sellAlert != null && (
            <View style={styles.threshRow}>
              <MaterialCommunityIcons
                name={triggered.sell ? 'bell-ring' : 'bell-outline'}
                size={11}
                color={triggered.sell ? colors.sell : colors.textMuted}
              />
              <Text style={[styles.thresh, triggered.sell && { color: colors.sell }]}>
                ≥ {formatGold(alert.sellAlert)}
              </Text>
            </View>
          )}
          {alert.sellAlert == null && (
            <Text style={styles.noAlert}>{t('no_alert_set')}</Text>
          )}
        </View>

        <View style={styles.divV} />

        {/* Volume */}
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>{t('volume_monthly')}</Text>
          <Text style={styles.priceVal}>
            {marketItem?.month_sold?.toLocaleString() ?? (marketItem ? '—' : '…')}
          </Text>
          <Text style={styles.volUnit}>{t('units')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── WorldAlertsSection ───────────────────────────────────────────────────────

function WorldAlertsSection({
  world,
  alerts,
  onEdit,
}: {
  world: string;
  alerts: WatchAlert[];
  onEdit: (alert: WatchAlert) => void;
}) {
  const { data, isLoading } = useMarketBoard(world);

  const getItem = (name: string) => data?.items.find((i) => i.name === name);

  const triggeredCount = alerts.filter((a) => {
    const item = getItem(a.itemName);
    const tr = isAlertTriggered(a, item?.buy_offer ?? null, item?.sell_offer ?? null);
    return tr.buy || tr.sell;
  }).length;

  return (
    <View style={styles.worldSection}>
      <View style={styles.worldHeader}>
        <View style={styles.worldHeaderLeft}>
          <MaterialCommunityIcons name="earth" size={14} color={colors.gold} />
          <Text style={styles.worldHeaderName}>{world}</Text>
          <Text style={styles.worldHeaderCount}>
            {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
          </Text>
        </View>
        {isLoading ? (
          <Text style={styles.worldLoading}>sync…</Text>
        ) : triggeredCount > 0 ? (
          <View style={styles.triggeredPill}>
            <MaterialCommunityIcons name="bell-ring" size={11} color={colors.background} />
            <Text style={styles.triggeredPillText}>{triggeredCount} active</Text>
          </View>
        ) : (
          <View style={styles.okPill}>
            <MaterialCommunityIcons name="check-circle-outline" size={11} color={colors.buy} />
            <Text style={styles.okPillText}>OK</Text>
          </View>
        )}
      </View>

      {[...alerts]
        .sort((a, b) => {
          const aItem = getItem(a.itemName);
          const bItem = getItem(b.itemName);
          const aT = isAlertTriggered(a, aItem?.buy_offer ?? null, aItem?.sell_offer ?? null);
          const bT = isAlertTriggered(b, bItem?.buy_offer ?? null, bItem?.sell_offer ?? null);
          return (bT.buy || bT.sell ? 1 : 0) - (aT.buy || aT.sell ? 1 : 0);
        })
        .map((alert) => (
          <WatchCard
            key={`${alert.world}-${alert.itemName}`}
            alert={alert}
            marketItem={getItem(alert.itemName)}
            onEdit={onEdit}
          />
        ))}
    </View>
  );
}

// ─── WatchlistScreen ──────────────────────────────────────────────────────────

export default function WatchlistScreen() {
  const { watchlist, addToWatchlist, removeFromWatchlist, updateAlert } = useWatchlist();
  const { t } = useTranslation();
  const router = useRouter();
  const [editingAlert, setEditingAlert] = useState<WatchAlert | null>(null);
  const [worldFilter, setWorldFilter] = useState<string | null>(null);

  // Unique worlds in watchlist (sorted alphabetically)
  const worlds = [...new Set(watchlist.map((a) => a.world))].sort();

  const filteredAlerts = worldFilter
    ? watchlist.filter((a) => a.world === worldFilter)
    : watchlist;

  const filteredWorlds = worldFilter ? [worldFilter] : worlds;

  // Total triggered count (approximate — based on last fetched data per section)
  const totalAlerts = watchlist.length;

  if (watchlist.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="bell-sleep-outline" size={72} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{t('no_alerts_title')}</Text>
        <Text style={styles.emptyDesc}>{t('no_alerts_desc')}</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/')}>
          <MaterialCommunityIcons name="store" size={16} color={colors.background} />
          <Text style={styles.emptyBtnText}>{t('go_to_market')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {totalAlerts} {t('tab_alerts').toLowerCase()} · {worlds.length} {worlds.length === 1 ? 'serwer' : 'serwery'}
        </Text>
      </View>

      {/* World filter tabs */}
      {worlds.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          <TouchableOpacity
            style={[styles.filterTab, worldFilter === null && styles.filterTabActive]}
            onPress={() => setWorldFilter(null)}
          >
            <Text style={[styles.filterTabText, worldFilter === null && styles.filterTabTextActive]}>
              {t('all_worlds')} ({watchlist.length})
            </Text>
          </TouchableOpacity>
          {worlds.map((w) => {
            const count = watchlist.filter((a) => a.world === w).length;
            return (
              <TouchableOpacity
                key={w}
                style={[styles.filterTab, worldFilter === w && styles.filterTabActive]}
                onPress={() => setWorldFilter(w)}
              >
                <MaterialCommunityIcons
                  name="earth"
                  size={11}
                  color={worldFilter === w ? colors.gold : colors.textMuted}
                />
                <Text style={[styles.filterTabText, worldFilter === w && styles.filterTabTextActive]}>
                  {w} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filteredWorlds.map((world) => (
          <WorldAlertsSection
            key={world}
            world={world}
            alerts={filteredAlerts.filter((a) => a.world === world)}
            onEdit={setEditingAlert}
          />
        ))}
      </ScrollView>

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
          isEditing={true}
          onSave={(buy, sell) => {
            if (buy == null && sell == null) {
              removeFromWatchlist(editingAlert.itemName, editingAlert.world);
            } else {
              updateAlert(editingAlert.itemName, editingAlert.world, buy, sell);
            }
          }}
          onRemove={() => removeFromWatchlist(editingAlert.itemName, editingAlert.world)}
          onClose={() => setEditingAlert(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsText: { color: colors.textMuted, fontSize: 11 },

  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  filterTabActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  filterTabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: colors.gold,
  },

  content: { padding: 12, gap: 16, paddingBottom: 32 },

  worldSection: { gap: 8 },
  worldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  worldHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  worldHeaderName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  worldHeaderCount: {
    color: colors.textMuted,
    fontSize: 11,
  },
  worldLoading: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  triggeredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  triggeredPillText: { color: colors.background, fontSize: 11, fontWeight: '700' },
  okPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.buyDim,
    borderWidth: 1,
    borderColor: colors.buyBorder,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  okPillText: { color: colors.buy, fontSize: 11, fontWeight: '600' },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardTriggered: { borderColor: colors.gold },
  triggeredBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  imgWrap: {
    width: 42,
    height: 42,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: { flex: 1, gap: 4 },
  itemName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  alertBadgeText: { color: colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  loadingText: { color: colors.textMuted, fontSize: 11 },
  editBtn: { padding: 4 },

  priceRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  priceBlock: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  priceLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  priceVal: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  threshRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  thresh: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  noAlert: { color: colors.textMuted, fontSize: 10, fontStyle: 'italic' },
  volUnit: { color: colors.textMuted, fontSize: 10 },
  divV: { width: 1, backgroundColor: colors.border, marginVertical: 8 },

  empty: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  emptyDesc: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: colors.background, fontWeight: '700', fontSize: 15 },
});
