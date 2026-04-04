import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { storage } from '../utils/storage';

export interface WatchAlert {
  itemName: string;
  wikiName: string;
  buyAlert: number | null;   // trigger when buy_offer <= buyAlert
  sellAlert: number | null;  // trigger when sell_offer >= sellAlert
  addedAt: string;
}

interface WatchlistContextType {
  watchlist: WatchAlert[];
  addToWatchlist: (item: Omit<WatchAlert, 'addedAt'>) => void;
  removeFromWatchlist: (itemName: string) => void;
  updateAlert: (itemName: string, buyAlert: number | null, sellAlert: number | null) => void;
  isWatched: (itemName: string) => boolean;
  getAlert: (itemName: string) => WatchAlert | undefined;
}

const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: [],
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  updateAlert: () => {},
  isWatched: () => false,
  getAlert: () => undefined,
});

const STORAGE_KEY = 'tibia_watchlist_v1';

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchAlert[]>(() => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    storage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = useCallback((item: Omit<WatchAlert, 'addedAt'>) => {
    setWatchlist((prev) => {
      const exists = prev.find((w) => w.itemName === item.itemName);
      if (exists) {
        return prev.map((w) =>
          w.itemName === item.itemName
            ? { ...w, buyAlert: item.buyAlert, sellAlert: item.sellAlert }
            : w
        );
      }
      return [...prev, { ...item, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFromWatchlist = useCallback((itemName: string) => {
    setWatchlist((prev) => prev.filter((w) => w.itemName !== itemName));
  }, []);

  const updateAlert = useCallback(
    (itemName: string, buyAlert: number | null, sellAlert: number | null) => {
      setWatchlist((prev) =>
        prev.map((w) => (w.itemName === itemName ? { ...w, buyAlert, sellAlert } : w))
      );
    },
    []
  );

  const isWatched = useCallback(
    (itemName: string) => watchlist.some((w) => w.itemName === itemName),
    [watchlist]
  );

  const getAlert = useCallback(
    (itemName: string) => watchlist.find((w) => w.itemName === itemName),
    [watchlist]
  );

  return (
    <WatchlistContext.Provider
      value={{ watchlist, addToWatchlist, removeFromWatchlist, updateAlert, isWatched, getAlert }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}

// Helper: check if alert is triggered given current prices
export function isAlertTriggered(
  alert: WatchAlert,
  buyOffer: number | null,
  sellOffer: number | null
): { buy: boolean; sell: boolean } {
  return {
    buy: alert.buyAlert != null && buyOffer != null && buyOffer <= alert.buyAlert,
    sell: alert.sellAlert != null && sellOffer != null && sellOffer >= alert.sellAlert,
  };
}
