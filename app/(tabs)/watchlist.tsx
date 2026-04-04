import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useWatchlist, isAlertTriggered, WatchAlert } from '@/src/context/WatchlistContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { useWorld } from '@/src/context/WorldContext';
import { WatchAlertModal } from '@/src/components/WatchAlertModal';
import { ItemImage } from '@/src/components/ItemImage';
import { colors } from '@/src/theme/colors';
import { formatGold } from '@/src/api/tibiaMarket';
import { MarketItem } from '@/src/api/tibiaMarket';

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
  const { selectedWorld } = useWorld();

  const buyOffer = marketItem?.buy_offer ?? null;
  const sellOffer = marketItem?.sell_offer ?? null;
  const triggered = isAlertTriggered(alert, buyOffer, sellOffer);
  const anyTriggered = triggered.buy || triggered.sell;

  return (
    <TouchableOpacity
      style={[styles.card, anyTriggered && styles.cardTriggered]}
      onPress={() =>
        router.push({ pathname: '/item/[name]', params: { name: alert.itemName, world: selectedWorld } })
      }
      activeOpacity={0.8}
    >
      {anyTriggered && (
        <LinearGradient
          colors={[colors.goldDim, 'transparent']}
          style={styles.triggeredBg}
        />
      )}

      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.imgWrap}>
          <ItemImage wikiName={alert.wikiName} size={38} />
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.itemName} numberOfLines={1}>{alert.itemName}</Text>
          {anyTriggered && (
            <View style={styles.alertBadge}>
              <MaterialCommunityIcons name="bell-ring" size={10} color={colors.gold} />
              <Text style={styles.alertBadgeText}>OKAZJA</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(alert)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Prices */}
      <View style={styles.priceRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>KUPNO</Text>
          <Text style={[styles.priceVal, { color: colors.buy }]}>{formatGold(buyOffer)}</Text>
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
        </View>

        <View style={styles.divV} />

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>SPRZEDAŻ</Text>
          <Text style={[styles.priceVal, { color: colors.sell }]}>{formatGold(sellOffer)}</Text>
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
        </View>

        <View style={styles.divV} />

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>OBRÓT/M.</Text>
          <Text style={styles.priceVal}>
            {marketItem?.month_sold?.toLocaleString() ?? '—'}
          </Text>
          <Text style={styles.volUnit}>szt.</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function WatchlistScreen() {
  const { watchlist, addToWatchlist, removeFromWatchlist, updateAlert } = useWatchlist();
  const { selectedWorld } = useWorld();
  const router = useRouter();
  const [editingAlert, setEditingAlert] = useState<WatchAlert | null>(null);

  const { data } = useMarketBoard(selectedWorld, { rows: 2000 });

  const getMarketItem = (name: string) =>
    data?.items.find((i) => i.name === name);

  const triggeredCount = watchlist.filter((a) => {
    const item = getMarketItem(a.itemName);
    const t = isAlertTriggered(a, item?.buy_offer ?? null, item?.sell_offer ?? null);
    return t.buy || t.sell;
  }).length;

  if (watchlist.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="bell-sleep-outline" size={72} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Brak obserwowanych</Text>
        <Text style={styles.emptyDesc}>
          Wejdź w przedmiot i kliknij dzwonek żeby ustawić alerty cenowe.
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/')}>
          <MaterialCommunityIcons name="store" size={16} color={colors.background} />
          <Text style={styles.emptyBtnText}>Przejdź do marketu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {watchlist.length} obserwowanych · {selectedWorld}
        </Text>
        {triggeredCount > 0 && (
          <View style={styles.triggeredPill}>
            <MaterialCommunityIcons name="bell-ring" size={12} color={colors.background} />
            <Text style={styles.triggeredPillText}>{triggeredCount} alert{triggeredCount > 1 ? 'y' : ''}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={[...watchlist].sort((a, b) => {
          // Triggered first
          const aItem = getMarketItem(a.itemName);
          const bItem = getMarketItem(b.itemName);
          const aT = isAlertTriggered(a, aItem?.buy_offer ?? null, aItem?.sell_offer ?? null);
          const bT = isAlertTriggered(b, bItem?.buy_offer ?? null, bItem?.sell_offer ?? null);
          const aActive = aT.buy || aT.sell ? 1 : 0;
          const bActive = bT.buy || bT.sell ? 1 : 0;
          return bActive - aActive;
        })}
        keyExtractor={(item) => item.itemName}
        renderItem={({ item }) => (
          <WatchCard
            alert={item}
            marketItem={getMarketItem(item.itemName)}
            onEdit={setEditingAlert}
          />
        )}
        contentContainerStyle={styles.list}
      />

      {editingAlert && (
        <WatchAlertModal
          visible={!!editingAlert}
          itemName={editingAlert.itemName}
          wikiName={editingAlert.wikiName}
          currentBuy={getMarketItem(editingAlert.itemName)?.buy_offer ?? null}
          currentSell={getMarketItem(editingAlert.itemName)?.sell_offer ?? null}
          initialBuyAlert={editingAlert.buyAlert}
          initialSellAlert={editingAlert.sellAlert}
          isEditing={true}
          onSave={(buy, sell) => updateAlert(editingAlert.itemName, buy, sell)}
          onRemove={() => removeFromWatchlist(editingAlert.itemName)}
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
  triggeredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  triggeredPillText: { color: colors.background, fontSize: 11, fontWeight: '700' },
  list: { padding: 12, gap: 10, paddingBottom: 30 },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardTriggered: {
    borderColor: colors.gold,
  },
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
  editBtn: { padding: 4 },

  priceRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  priceBlock: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  priceLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  priceVal: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  threshRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  thresh: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
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
