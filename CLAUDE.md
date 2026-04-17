# CLAUDE.md — Tibia Market Mobile

Project: **TibiaTrader** (tibiatrader.com) — live Tibia market prices, margins & price alerts.
Goal: a fast, mobile-first app (web + iOS + Android) with **high-quality SEO** as the organic acquisition channel.

---

## 1. Stack

- **Expo ~54** + **expo-router** (`web.output: "static"` — SSR to static HTML)
- **React Native Web** build (`/web-build` → Vercel)
- **React Query v3** (cache + refetch) — use `useQuery` with keys per world/item
- **TypeScript** strict
- **API proxy**: `/api/tibia/*` → `api.tibiamarket.top:8001` (Vercel rewrite in `vercel.json`)
- **Analytics**: Vercel Speed Insights (Core Web Vitals)

---

## 2. Branching workflow (MANDATORY)

```
main  ←── develop  ←── feature/<name>  |  fix/<name>  |  chore/<name>
```

- **New branches always come off `develop`**, never off `main`.
- PRs always target `develop` (`gh pr create --base develop`).
- `main` is production — only `develop → main` merges land there, after CI is green.
- **After every merge, delete the feature branch** (locally + remote). Prefer `gh pr merge --delete-branch`.
- Never delete `main` or `develop`.
- Do not implement proposals without user approval — present the plan first, then code.

Naming: `feature/<name>` (new feature), `fix/<name>` (bugfix), `chore/<name>` (infra/config/docs).

---

## 3. SEO — priority #1

SEO is the main acquisition channel. **Every new page / route / visible content change must be covered by SEO.**

### 3.1 Architecture (Expo Router static SSR — watch out, this is a trap!)

During static export only `_layout.tsx` and providers render inside `renderToString`.
**Screens are suspended** (`<!--$--><!--/$-->` markers) and render client-side only after hydration.
This means **any `<Helmet>` / `<Head>` placed inside a screen does NOT end up in the static HTML** — Google and link previewers see an empty shell.

**Rule**: per-route SEO **must** live at the layout level, driven by `usePathname()`.

### 3.2 Where things live

| File                                | What                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| `src/components/SEOHead.tsx`        | `RouteSEO` — per-route `<title>`, description, canonical, hreflang en/pl/x-default,     |
|                                     | og:title/description/url/locale, BreadcrumbList JSON-LD                                 |
| `app/_layout.tsx`                   | mounts `<RouteSEO />` once (web only: `Platform.OS === 'web'`)                          |
| `app/+html.tsx`                     | **global** tags: author, robots, og:type/site_name/image+alt, twitter:card/image,       |
|                                     | icon/manifest, JSON-LD WebApplication                                                   |
| `public/sitemap.xml`                | all public routes + `hreflang` PL/EN                                                    |
| `public/robots.txt`                 | sitemap pointer + allow all                                                             |

### 3.3 Hard rules

- **Do NOT add `<title>` / `<meta name="description">` to `+html.tsx`** — Helmet prepends to `<head>`, so any duplicate in `+html.tsx` would win and break the per-route title.
- **Do NOT put `<SEOHead>` / `<Helmet>` inside screens** — it will not work in SSR.
- ALWAYS import Helmet from `expo-router/vendor/react-helmet-async/lib` (never from `expo-router/head` — it gates on `useIsFocused()`).
- For dynamic routes (`/item/[name]`) the static export produces a single template with the literal `[name]` — give it a sensible generic title; the real item name is only rendered after client hydration.
- Canonical URLs must never include the `(tabs)` group (`/(tabs)/watchlist` → canonical `/watchlist`).
- `hreflang` always paired `en` + `pl` + `x-default`, and must point at the **current** route's EN/PL URL pair (NOT at the homepage). Each subpage self-references its own language variants — do not hard-code hreflang in `+html.tsx`.

### 3.4 Checklist for a new page

1. Add an entry to `STATIC_ROUTES` in `src/components/SEOHead.tsx` (title + description).
2. Add the URL to `public/sitemap.xml` (with `hreflang`).
3. Verify the rendered HTML via `curl` / WebFetch — `<title>` must be populated server-side.
4. Title ≤ 60 chars, description 140–160 chars.
5. Every title ends with `| TibiaTrader` (except the homepage, which already contains the brand).
6. Update JSON-LD only when adding a new content type (Product, Article, FAQPage, etc.).

### 3.5 Mandatory global tags (already in `+html.tsx`)

keywords, author, robots (`index, follow, max-image-preview:large`), google-site-verification, hreflang EN/PL/x-default, og:type=website, og:site_name=TibiaTrader, og:image (1200×630), twitter:card=summary_large_image, JSON-LD `WebApplication`.

---

## 4. i18n

- **Default UI: EN.** PL available via `?lang=pl` (query param, not browser auto-detect).
- Marketing landings: EN = `https://tibiatrader.com/`, PL = `https://tibiatrader.com/?lang=pl`.
- localStorage key: `tibia_language_v1` (`'pl' | 'en'`).
- Per-screen translations kept locally (no i18next) — keep it simple.

---

## 5. UI/UX — mobile + desktop

### 5.1 Breakpoints

```ts
const DESKTOP_BREAKPOINT = 900; // px — above this: desktop layout
// width >= 1400 → 3-column grid; width >= 900 → 2 columns; < 900 → 1 column (list)
```

- Mobile default: **list view** (full-width readable cards).
- Desktop default: **grid view** + favorite-worlds sidebar.
- Mode persisted in `tibia_view_mode_v1` — the user can change it; we remember it.

### 5.2 Design tokens (source of truth: `src/theme/colors.ts`, `src/theme/typography.ts`)

**Palette** — deep midnight + Tibia gold:

- BG: `#060b14` (background), `#0c1423` (surface), `#0e1929` (card)
- Gold: `#c9a227` (primary), `#e8c76a` (hover/light)
- Text: `#f0e8d0` (primary), `#7a8ba8` (secondary), `#3d5070` (muted)
- Market: `#16c784` (buy/green), `#ea3943` (sell/red)
- Borders: `#1a2d45` (default), `#c9a22740` (gold accent)

**Typography** (StyleSheet tokens — DO NOT hardcode sizes):

- `h1` 28/700, `h2` 22/700, `h3` 18/600
- `body` 14/400, `bodySmall` 12/400, `caption` 11/400
- `label` 12/600 uppercase + letterSpacing 0.8
- `gold` 16/700 gold, `goldLarge` 20/700 gold

**Rule**: import colors and typography from `@/src/theme/*` — never paste hex values or sizes inline.

### 5.3 Readability rules

- **Touch target ≥ 44×44px** on mobile (WCAG + Apple HIG). Wrap small icons in padding.
- **Text contrast**: `textPrimary` on any background; `textSecondary` only on `card`/`surface`, never on `background` for key content.
- **Safe areas** — use `useSafeAreaInsets()` for headers/FABs (iOS notch, Android gesture bar).
- **Loading states** always via `LoadingState` (shimmer), never a bare spinner in empty space.
- **Empty states** always include a description + CTA (e.g. "Add your first alert").
- **Errors** — show what happened and what the user can do (retry button, not just "Error 500").
- **Price numbers** — always format via helpers (thousands separator + `gp`/`k`/`m` scale), never raw numbers.

### 5.4 Desktop-only patterns

- Favorite-worlds sidebar on the left (persisted in localStorage).
- Grid view: `numColumns` 2 (900–1400px) or 3 (≥1400px).
- Hover states for cards (subtle gold border glow).
- Keyboard nav in search (enter → first result).

### 5.5 Mobile-only patterns

- Bottom tabs (`(tabs)` group): Market / Watchlist / Statistics.
- Pull-to-refresh on every feed.
- Full-screen modals (not popups) for item detail.
- FAB for the primary action (e.g. "Add alert").

---

## 6. Feature delivery checklist (MANDATORY before PR)

Every PR must satisfy **all** of the following:

- [ ] Branch comes off `develop`, PR targets `develop`.
- [ ] **SEO**: new page → entry in `SEOHead.tsx` + `sitemap.xml`. Visible content change → verify title/description still fit.
- [ ] **Playwright E2E** (`tests/<feature>.spec.ts`): golden path + edge case (empty state, error). Screenshot into `tests/screenshots/`.
- [ ] **API mocks**: new endpoint → fixture JSON + entry in `tests/helpers/mock-api.ts`.
- [ ] **Typecheck** `bun run typecheck` (or `tsc --noEmit`) — zero errors.
- [ ] **Lint** `bun run lint` — zero warnings.
- [ ] **i18n**: new visible strings have EN + PL variants (key `tibia_language_v1`).
- [ ] **UI/UX**: mobile (list) + desktop (grid) verified manually or via screenshot.
- [ ] **Tokens**: colors from `colors.ts`, typography from `typography.ts` — no hardcoding.
- [ ] **localStorage**: new key → add it to section 8 of this file.
- [ ] CI green: Lint+Typecheck, Playwright E2E, Vercel preview, npm audit.
- [ ] After merge: `gh pr merge --delete-branch` (or manually `git push origin --delete <branch>`).

---

## 7. Testing — Playwright E2E (mandatory)

Every new feature or UI change **must** be covered by a Playwright test.
Tests run against the web build (`npx expo start --web --port 8081`).

### 7.1 Running

```bash
npm run test:e2e            # headless
npm run test:e2e:headed     # with browser
npm run test:e2e:ui         # Playwright UI mode
```

### 7.2 Test structure

```
tests/
  fixtures/           ← mock data (JSON) for each API endpoint
  helpers/
    mock-api.ts       ← page.route() interceptors for /api/tibia/* and tibiadata.com
    storage.ts        ← clearStorage, seedFavorites, seedWatchlist, setSelectedWorld
  market.spec.ts
  watchlist.spec.ts
  statistics.spec.ts
  item-detail.spec.ts
  world-select.spec.ts
  persistence.spec.ts
  seo.spec.ts         ← verifies per-route <title> / description / canonical
  screenshots/        ← auto-created by tests (for AI UX review)
```

### 7.3 Conventions

- `beforeEach` → `mockAllApis(page)` + `clearStorage(page)` + `setSelectedWorld(page, 'Antica')`.
- **All API calls always mocked** — never hit live endpoints in tests.
- Fixtures in `tests/fixtures/*.json` — update when API types change.
- Every test block saves a screenshot: `page.screenshot({ path: 'tests/screenshots/<name>.png' })`.
- Test **mobile + desktop** — use `page.setViewportSize({ width: 1280, height: 800 })` for desktop patterns.

### 7.4 AI UX review

Screenshots land in `tests/screenshots/`. Just hand Claude the path — it will judge contrast, layout and readability.

---

## 8. localStorage keys

- `tibia_selected_world_v1` — selected world
- `tibia_favorites_v2` — favorite items per world: `Record<world, string[]>`
- `tibia_watchlist_v2` — price alerts (`WatchAlert[]`)
- `tibia_notified_alerts_v1` — notification deduplication
- `tibia_language_v1` — UI language (`'pl' | 'en'`)
- `tibia_view_mode_v1` — list/grid view mode on desktop (`'list' | 'grid'`)
- `tibia_favorite_worlds_v1` — favorite worlds (desktop sidebar)

When adding a new key: **always** version it (`_v1`, `_v2`) and add it here.

---

## 9. API mocks (reference)

Endpoints intercepted by `tests/helpers/mock-api.ts`:

- `**/api/tibia/item_metadata**` → `fixtures/metadata.json`
- `**/api/tibia/market_values**` → `fixtures/market-values.json`
- `**/api/tibia/world_data**` → `fixtures/world-data.json`
- `**/tibiadata.com/**` → `fixtures/tibiadata-worlds.json`
- `**/api/tibia/item_history**` → `fixtures/item-history.json`
- `**/api/tibia/market_board**` → `fixtures/item-offers.json`

---

## 10. Code style — short rules

- **TypeScript strict**, no `any` unless necessary.
- **Function components + hooks**, no classes.
- **Files** `PascalCase.tsx` for components, `camelCase.ts` for utils.
- **Imports** via the `@/src/...` alias (tsconfig `paths`), never relative `../../../`.
- **React Query** — array keys with world+params: `['market_values', world]`, `['item_history', world, itemId]`.
- **Platform split** — `Platform.OS === 'web'` for web-only; dedicated `*.web.tsx` / `*.native.tsx` when logic diverges significantly.
- **Comments** — only when the "why" is non-obvious (e.g. the SSR trap). Names carry the "what".
- **Error boundaries** at the route level (every `app/**/_layout.tsx` has a boundary).
