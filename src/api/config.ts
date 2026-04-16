// Shared API config. Used by both tibiaMarket.ts and notifications.ts so the
// API host is defined in exactly one place.
//
// Configure by setting EXPO_PUBLIC_API_PROXY_URL in your .env file. Point it at
// your own Vercel deployment (see vercel.json for the required rewrites).
//
// In web production (running on the deployed Vercel app), we use a relative
// path and the Vercel rewrites handle routing. In native + web dev, we need
// the absolute proxy URL.

import { Platform } from 'react-native';

// React Native sets global.window = global, so `typeof window !== 'undefined'`
// alone is not enough. Guard both.
const IS_PRODUCTION_WEB =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.location?.hostname !== 'localhost';

/**
 * Absolute URL of the API proxy (Vercel deployment). Required in native + web
 * dev. Missing env var is a configuration error — throw loudly so forks know
 * they need to set up their own deployment rather than silently hitting ours.
 */
export function getProxyUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_PROXY_URL;
  if (envUrl && envUrl.length > 0 && !envUrl.includes('your-vercel-deployment')) {
    return envUrl;
  }
  throw new Error(
    'EXPO_PUBLIC_API_PROXY_URL is not set. Copy .env.example to .env and point ' +
      'it at your own Vercel deployment. See README for setup instructions.',
  );
}

/**
 * Base URL used by the axios instance. Relative in production web (Vercel
 * rewrites handle it), absolute elsewhere.
 */
export function getApiBaseUrl(): string {
  if (IS_PRODUCTION_WEB) return '/api/tibia';
  return `${getProxyUrl()}/api/tibia`;
}

/** Build a URL for the Vercel item-image proxy endpoint. */
export function getItemImageProxyUrl(encodedName: string): string {
  const path = `/api/item-image?name=${encodeURIComponent(encodedName)}`;
  return IS_PRODUCTION_WEB ? path : `${getProxyUrl()}${path}`;
}
