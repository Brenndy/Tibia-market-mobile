# CLAUDE.md — Tibia Market Mobile

## Stack

Expo ~54 + expo-router, React Native web build, React Query v3, TypeScript.
API proxy: `/api/tibia/*` → `api.tibiamarket.top:8001` (via Vercel rewrite).

## Testing — Playwright E2E (obowiązkowe)

Każda nowa funkcja lub zmiana UI **musi** być pokryta testem Playwright.
Testy działają na web buildzie (`npx expo start --web --port 8081`).

### Uruchomienie

```bash
npm run test:e2e            # headless
npm run test:e2e:headed     # z przeglądarką
npm run test:e2e:ui         # Playwright UI mode
```

### Struktura testów

```
tests/
  fixtures/           ← dane mockowe (JSON) dla każdego API endpoint
  helpers/
    mock-api.ts       ← page.route() interceptory dla wszystkich /api/tibia/* i tibiadata.com
    storage.ts        ← helpers: clearStorage, seedFavorites, seedWatchlist, setSelectedWorld
  market.spec.ts
  watchlist.spec.ts
  statistics.spec.ts
  item-detail.spec.ts
  world-select.spec.ts
  persistence.spec.ts
  screenshots/        ← auto-tworzone przez testy (do analizy UX przez AI)
```

### Konwencje

- Każdy plik testów: `beforeEach` → `mockAllApis(page)` + `clearStorage(page)` + `setSelectedWorld(page, 'Antica')`
- **Wszystkie API zawsze mockowane** — nigdy live requests w testach
- Fixtures w `tests/fixtures/*.json` — aktualizuj je gdy zmieniają się typy API
- Każdy blok testów zapisuje screenshot: `page.screenshot({ path: 'tests/screenshots/<name>.png' })`
- Screenshoty można podać Claude do analizy UX (są to prawdziwe rendery z Chromium)

### Przy dodawaniu nowej funkcji

1. Jeśli jest nowy endpoint API → dodaj fixture JSON + wpis w `mock-api.ts`
2. Napisz spec w `tests/<feature>.spec.ts`
3. Upewnij się że `beforeEach` z `clearStorage` + `mockAllApis` wystarczy, lub dodaj seed data przez helpers z `storage.ts`
4. Sprawdź czy testy przechodzą: `npm run test:e2e`

### Analiza UX przez AI

Po uruchomieniu testów screenshoty lądują w `tests/screenshots/`.
Wystarczy podać ścieżkę do screenshota Claude — może ocenić kontrast, układ, czytelność.

## Mocki API

Endpointy mockowane przez `tests/helpers/mock-api.ts`:
- `**/api/tibia/item_metadata**` → `fixtures/metadata.json`
- `**/api/tibia/market_values**` → `fixtures/market-values.json`
- `**/api/tibia/world_data**` → `fixtures/world-data.json`
- `**/tibiadata.com/**` → `fixtures/tibiadata-worlds.json`
- `**/api/tibia/item_history**` → `fixtures/item-history.json`
- `**/api/tibia/market_board**` → `fixtures/item-offers.json`

## localStorage keys

- `tibia_selected_world_v1` — wybrany świat
- `tibia_favorites_v2` — ulubione itemy per świat: `Record<world, string[]>`
- `tibia_watchlist_v2` — alerty cenowe (`WatchAlert[]`)
- `tibia_notified_alerts_v1` — deduplicacja notyfikacji
- `tibia_language_v1` — język UI (`'pl' | 'en'`)
- `tibia_view_mode_v1` — tryb listy na desktop (`'list' | 'grid'`)

## Branch convention

Feature branche: `feature/<nazwa>`, bugfixy: `fix/<nazwa>`.
