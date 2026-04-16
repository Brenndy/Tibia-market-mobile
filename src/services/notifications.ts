import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProxyUrl } from '../api/config';

const BACKGROUND_TASK = 'tibia-price-check';
const NOTIFIED_KEY = 'tibia_notified_alerts_v1';
const WATCHLIST_KEY = 'tibia_watchlist_v2';

// ─── Notification appearance ──────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

// Create the Android channel immediately at module load so it exists before
// any notification is scheduled (avoids race with permission flow).
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('price-alerts', {
    name: 'Price Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D4AF37',
    sound: 'default',
  });
}

// ─── Permission request ───────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Send a price alert notification ─────────────────────────────────────────

export async function sendPriceAlert(
  itemName: string,
  side: 'buy' | 'sell',
  currentPrice: number,
  targetPrice: number,
): Promise<void> {
  const title = side === 'buy' ? `📉 ${itemName} – buy alert` : `📈 ${itemName} – sell alert`;
  const body =
    side === 'buy'
      ? `Buy price dropped to ${formatGoldSimple(currentPrice)} gp (target ≤ ${formatGoldSimple(targetPrice)} gp)`
      : `Sell price rose to ${formatGoldSimple(currentPrice)} gp (target ≥ ${formatGoldSimple(targetPrice)} gp)`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { itemName, side },
      ...(Platform.OS === 'android' ? { channelId: 'price-alerts' } : {}),
    },
    trigger: null, // immediate
  });
}

function formatGoldSimple(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}kk`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

// ─── Track already-notified alerts to avoid duplicates ───────────────────────

async function getNotifiedSet(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
  return new Set(raw ? JSON.parse(raw) : []);
}

async function markNotified(key: string): Promise<void> {
  const set = await getNotifiedSet();
  set.add(key);
  // Keep only last 500 entries to prevent unbounded growth
  const entries = Array.from(set).slice(-500);
  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(entries));
}

async function clearNotifiedForAlert(itemName: string, world: string): Promise<void> {
  const set = await getNotifiedSet();
  const prefix = `${world}:${itemName}:`;
  const filtered = Array.from(set).filter((k) => !k.startsWith(prefix));
  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(filtered));
}

// ─── Core price check logic (shared between foreground and background) ────────

export async function checkWatchlistPrices(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(WATCHLIST_KEY);
    if (!raw) return;
    const watchlist: {
      itemName: string;
      world: string;
      buyAlert: number | null;
      sellAlert: number | null;
    }[] = JSON.parse(raw);
    if (!watchlist.length) return;

    // Group by world to minimize API calls
    const worlds = [...new Set(watchlist.map((w) => w.world))];

    for (const world of worlds) {
      const worldAlerts = watchlist.filter((w) => w.world === world);

      const proxyUrl = getProxyUrl();
      let marketData: { name: string; buy_offer: number | null; sell_offer: number | null }[] = [];
      try {
        const resp = await fetch(
          `${proxyUrl}/api/tibia/market_values?server=${encodeURIComponent(world)}&limit=10000`,
        );
        if (!resp.ok) continue;

        // We also need item metadata to map IDs to names
        const [values, metaResp] = await Promise.all([
          resp.json(),
          fetch(`${proxyUrl}/api/tibia/item_metadata`),
        ]);
        const meta: { id: number; name: string }[] = await metaResp.json();
        const metaById = new Map(meta.map((m) => [m.id, m.name]));

        marketData = (values as { id: number; buy_offer: number; sell_offer: number }[]).map(
          (v) => ({
            name: (metaById.get(v.id) ?? '').toLowerCase(),
            buy_offer: v.buy_offer < 0 ? null : v.buy_offer,
            sell_offer: v.sell_offer < 0 ? null : v.sell_offer,
          }),
        );
      } catch {
        continue;
      }

      const priceMap = new Map(marketData.map((m) => [m.name, m]));

      for (const alert of worldAlerts) {
        const item = priceMap.get(alert.itemName.toLowerCase());
        if (!item) continue;

        const notifiedSet = await getNotifiedSet();

        // Buy alert: trigger when buy_offer <= buyAlert
        if (alert.buyAlert != null && item.buy_offer != null && item.buy_offer <= alert.buyAlert) {
          const key = `${world}:${alert.itemName}:buy:${alert.buyAlert}`;
          if (!notifiedSet.has(key)) {
            await sendPriceAlert(alert.itemName, 'buy', item.buy_offer, alert.buyAlert);
            await markNotified(key);
          }
        }

        // Sell alert: trigger when sell_offer >= sellAlert
        if (
          alert.sellAlert != null &&
          item.sell_offer != null &&
          item.sell_offer >= alert.sellAlert
        ) {
          const key = `${world}:${alert.itemName}:sell:${alert.sellAlert}`;
          if (!notifiedSet.has(key)) {
            await sendPriceAlert(alert.itemName, 'sell', item.sell_offer, alert.sellAlert);
            await markNotified(key);
          }
        }
      }
    }
  } catch (e) {
    console.error('[PriceCheck] Error:', e);
  }
}

export { clearNotifiedForAlert };

// ─── Background task registration ────────────────────────────────────────────

TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    await checkWatchlistPrices();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundPriceCheck(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed)
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (e) {
    console.error('[BackgroundFetch] Registration error:', e);
  }
}
