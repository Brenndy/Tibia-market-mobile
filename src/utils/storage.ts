import { Platform } from 'react-native';

// Simple cross-platform storage: localStorage on web, in-memory fallback on native
const memStore: Record<string, string> = {};

export const storage = {
  getItem(key: string): string | null {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memStore[key] ?? null;
  },
  setItem(key: string, value: string): void {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      memStore[key] = value;
    }
  },
};
