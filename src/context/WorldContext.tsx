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
  favorites: string[]; // favorites for the currently selected world
  allFavorites: Record<string, string[]>;
  toggleFavorite: (itemName: string, world: string) => void;
  isFavorite: (itemName: string, world: string) => boolean;
}

const WorldContext = createContext<WorldContextType>({
  selectedWorld: 'Antica',
  setSelectedWorld: () => {},
  favorites: [],
  allFavorites: {},
  toggleFavorite: () => {},
  isFavorite: () => false,
});

const WORLD_KEY = 'tibia_selected_world_v1';
// v2 uses per-world structure: Record<string, string[]>
const FAVORITES_KEY = 'tibia_favorites_v2';

export function WorldProvider({ children }: { children: ReactNode }) {
  const [selectedWorld, setSelectedWorldState] = useState('Antica');
  const [allFavorites, setAllFavorites] = useState<Record<string, string[]>>({});
  const [hydrated, setHydrated] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    Promise.all([storage.getItem(WORLD_KEY), storage.getItem(FAVORITES_KEY)]).then(
      ([world, favs]) => {
        if (world) setSelectedWorldState(world);
        if (favs) {
          try {
            setAllFavorites(JSON.parse(favs));
          } catch {}
        }
        setHydrated(true);
      },
    );
  }, []);

  // Persist world selection
  useEffect(() => {
    if (!hydrated) return;
    storage.setItem(WORLD_KEY, selectedWorld);
  }, [selectedWorld, hydrated]);

  // Persist all favorites
  useEffect(() => {
    if (!hydrated) return;
    storage.setItem(FAVORITES_KEY, JSON.stringify(allFavorites));
  }, [allFavorites, hydrated]);

  const setSelectedWorld = useCallback((world: string) => {
    setSelectedWorldState(world);
  }, []);

  const toggleFavorite = useCallback((itemName: string, world: string) => {
    setAllFavorites((prev) => {
      const worldFavs = prev[world] ?? [];
      const updated = worldFavs.includes(itemName)
        ? worldFavs.filter((f) => f !== itemName)
        : [...worldFavs, itemName];
      return { ...prev, [world]: updated };
    });
  }, []);

  const isFavorite = useCallback(
    (itemName: string, world: string) => (allFavorites[world] ?? []).includes(itemName),
    [allFavorites],
  );

  // Expose only the selected world's favorites for convenience
  const favorites = allFavorites[selectedWorld] ?? [];

  return (
    <WorldContext.Provider
      value={{
        selectedWorld,
        setSelectedWorld,
        favorites,
        allFavorites,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld() {
  return useContext(WorldContext);
}
