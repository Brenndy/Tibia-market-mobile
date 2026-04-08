import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { storage } from '../utils/storage';

interface WorldContextType {
  selectedWorld: string;
  setSelectedWorld: (world: string) => void;
  favorites: string[];
  toggleFavorite: (itemName: string) => void;
  isFavorite: (itemName: string) => boolean;
}

const WorldContext = createContext<WorldContextType>({
  selectedWorld: '',
  setSelectedWorld: () => {},
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

const WORLD_KEY = 'tibia_selected_world_v1';
const FAVORITES_KEY = 'tibia_favorites_v1';

export function WorldProvider({ children }: { children: ReactNode }) {
  const [selectedWorld, setSelectedWorldState] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    Promise.all([
      storage.getItem(WORLD_KEY),
      storage.getItem(FAVORITES_KEY),
    ]).then(([world, favs]) => {
      if (world) setSelectedWorldState(world);
      if (favs) {
        try { setFavorites(JSON.parse(favs)); } catch {}
      }
      setHydrated(true);
    });
  }, []);

  // Persist world selection
  useEffect(() => {
    if (!hydrated) return;
    storage.setItem(WORLD_KEY, selectedWorld);
  }, [selectedWorld, hydrated]);

  // Persist favorites
  useEffect(() => {
    if (!hydrated) return;
    storage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  const setSelectedWorld = useCallback((world: string) => {
    setSelectedWorldState(world);
  }, []);

  const toggleFavorite = useCallback((itemName: string) => {
    setFavorites((prev) =>
      prev.includes(itemName)
        ? prev.filter((f) => f !== itemName)
        : [...prev, itemName]
    );
  }, []);

  const isFavorite = useCallback(
    (itemName: string) => favorites.includes(itemName),
    [favorites]
  );

  return (
    <WorldContext.Provider
      value={{ selectedWorld, setSelectedWorld, favorites, toggleFavorite, isFavorite }}
    >
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld() {
  return useContext(WorldContext);
}
