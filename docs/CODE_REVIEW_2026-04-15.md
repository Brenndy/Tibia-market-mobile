# Code Review — 2026-04-15

Pre-open-source review of the entire codebase. Known tech debt already logged in internal memory (`known_bugs_2026-04-15.md` "Do naprawienia" section) is excluded below.

## CRITICAL

### C1. SSRF in `api/item-image.js`
**File**: `api/item-image.js:10-14`

The Vercel serverless function takes a user-controlled `name` query parameter and interpolates it into a Fandom wiki API URL without validation. Worse, line 33 (`const imgResp = await fetch(imageUrl)`) blindly fetches whatever URL the Fandom API returns.

**Fix**:
1. Validate `name` against `/^[\w\s\-'().]{1,100}$/`.
2. Whitelist the outbound image host (`https://static.wikia.nocookie.net/`).

### C2. Open proxy in `vercel.json`
**File**: `vercel.json:6`

`{ "source": "/api/tibia/:path*", "destination": "https://api.tibiamarket.top:8001/:path*" }` passes any path through to the external API. Anyone on the internet can use the Vercel deployment as an unauthenticated proxy.

**Fix**: Replace the wildcard with explicit per-endpoint rewrites (`item_metadata`, `market_values`, `world_data`, `item_history`, `market_board`).

### C3. Metadata cache never invalidates
**File**: `src/api/tibiaMarket.ts:177-189`

`metaByName` / `metaById` are module-level singletons with no TTL. New items added to the game will never appear until the app restarts; long-open web tabs drift indefinitely.

**Fix**: Add a 1-hour TTL and refetch when stale.

### C4. Hardcoded prod Vercel URL as fallback
**Files**: `src/api/tibiaMarket.ts:16`, `src/services/notifications.ts:119`

`process.env.EXPO_PUBLIC_API_PROXY_URL ?? 'https://tibia-market-mobile.vercel.app'` silently routes all traffic through the author's deployment if a fork forgets to set the env var.

**Fix**: Throw when env var missing, or use a placeholder like `'https://your-deployment.vercel.app'`.

## HIGH

### H1. `as any` casts in sort logic
**File**: `src/api/tibiaMarket.ts:333,348,356-357` — replace with a typed `getNumericField(item, field)` accessor.

### H2. `WatchAlertModal` hint uses `Number()` instead of `parseGold()`
**File**: `src/components/WatchAlertModal.tsx:147-148,184` — inputs like `100k` become `NaN` via `Number()`, making hints disappear. Use `parsedBuy` / `parsedSell` locals.

### H3. Watchlist bypasses the `storage` abstraction
**Files**: `app/(tabs)/watchlist.tsx:22,196`, `src/services/notifications.ts` — use `storage.getItem` from `src/utils/storage.ts` for cross-platform parity.

### H4. `src/data/itemList.ts` — 319 KB inlined static array
Kills initial bundle size. Options: lazy-load via dynamic `import()`, convert to JSON + codesplit, or derive autocomplete from `getMetadata()` (already fetched) and delete the file.

### H5. `timeAgo` not localized
**File**: `src/utils/timeAgo.ts` — hardcoded English. Pass `t` or language, return translation keys.

### H6. `QueryClient` at module scope
**File**: `app/_layout.tsx:12-20` — move inside the component via `useState(() => new QueryClient())` so SSR / static rendering doesn't share state across requests.

### H7. No validation on `world` before API calls
**File**: `src/api/tibiaMarket.ts:204,367,407` — `world` comes from localStorage (tamperable). Validate against the fetched world list or at minimum `/^[A-Za-z\s]+$/`.

### H8. `react-native-chart-kit` unused dependency
**File**: `package.json:46` — never imported (custom SVG chart used instead). `npm uninstall react-native-chart-kit`.

## MEDIUM

- **M1.** `app/item/[name].tsx` is 1048 lines — extract `CustomLineChart`, `OfferRow`, `StatRow` into `src/components/`.
- **M2.** Polish comments in production code (`src/api/tibiaMarket.ts:6-8`) — English-only for lib code; PL OK in tests per CLAUDE.md.
- **M3.** `react-query` v3 is EOL — migrate to `@tanstack/react-query` v5+ (`cacheTime` → `gcTime`).
- **M4.** `SkeletonCard.tsx:7-8` uses a module-level `Animated.Value` singleton; `sweepStarted` never resets so the loop runs forever once started.
- **M5.** `@shopify/flash-list` unused — `npm uninstall @shopify/flash-list`.

## LOW

- **L1.** `formatGold` (`src/api/tibiaMarket.ts:479`) checks `value === undefined` but type is `number | null` — redundant.
- **L2.** `ErrorState` uses `t('load_more')` for retry text — add a dedicated `retry` key.
- **L3.** Inline styles in `app/(tabs)/_layout.tsx` and `app/item/[name].tsx` — move to `StyleSheet.create`.
- **L4.** `PVP_LABELS` / `PVP_COLORS` in `world-select.tsx` not localized.

## Top 5 before open-source release

1. **Fix SSRF** (C1) — internet-facing and exploitable today.
2. **Restrict Vercel rewrites** (C2) — close the open proxy.
3. **Remove hardcoded prod URL fallback** (C4) — forks shouldn't silently hit your infra.
4. **Uninstall unused deps** (H8, M5) — `react-native-chart-kit`, `@shopify/flash-list`.
5. **Add metadata cache TTL** (C3) — 1-hour window prevents staleness.
