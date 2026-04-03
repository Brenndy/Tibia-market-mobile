import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';

interface WorldContextType {
  selectedWorld: string;
  setSelectedWorld: (world: string) => void;
  favorites: string[];
  toggleFavorite: (itemName: string) => void;
  isFavorite: (itemName: string) => boolean;
}

const WorldContext = createContext<WorldContextType>({
  selectedWorld: 'Antica',
  setSelectedWorld: () => {},
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

export function WorldProvider({ children }: { children: ReactNode }) {
  const [selectedWorld, setSelectedWorld] = useState('Antica');
  const [favorites, setFavorites] = useState<string[]>([]);

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
