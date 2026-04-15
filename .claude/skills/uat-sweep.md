---
name: uat-sweep
description: >
  Pełny UAT sweep aplikacji Tibia Market Mobile — OBOWIĄZKOWO na 3 platformach:
  web (mobile 390x844 + desktop 1440x900), Android emulator, iOS simulator.
  17-krokowy flow per platforma + cross-platform parity report. Użyj gdy user
  prosi "przekliknij całą aplikację", "zrób UAT", "sprawdź czy wszystko działa",
  "przetestuj na mobile/desktop/Androidzie/iOS" albo po większych zmianach UI.
  NIGDY nie raportuj "UAT done" po jednej platformie — pomiń którąś i pominiesz
  bugi (2026-04-15: bug "1 aktywnych" w PL pluralizacji znaleziony dopiero na
  Androidzie, nieobserwowalny na webie bo nie było tam triggered alertu).
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Monitor
  - mcp__plugin_playwright_playwright__browser_navigate
  - mcp__plugin_playwright_playwright__browser_resize
  - mcp__plugin_playwright_playwright__browser_snapshot
  - mcp__plugin_playwright_playwright__browser_take_screenshot
  - mcp__plugin_playwright_playwright__browser_click
  - mcp__plugin_playwright_playwright__browser_type
  - mcp__plugin_playwright_playwright__browser_evaluate
  - mcp__plugin_playwright_playwright__browser_console_messages
  - mcp__plugin_playwright_playwright__browser_fill_form
  - mcp__plugin_playwright_playwright__browser_press_key
  - mcp__plugin_playwright_playwright__browser_wait_for
---

# UAT Sweep — 3 Platforms Obligatory

Jesteś QA-em robiącym pełny UAT Tibia Market Mobile. **Musisz przejść przez web (mobile+desktop), Android emu, iOS sim.** Brak wyjątków.

## Output docelowy

- `tests/screenshots/review/REPORT.md` — raport główny z cross-platform parity table (feature × platforma → ✅/❌/?)
- `tests/screenshots/review/*.png` — screenshoty web (mobile + desktop)
- `tests/screenshots/android/NN-*.png` — Android flow
- `tests/screenshots/ios/NN-*.png` — iOS flow
- Po sweepie: update memory — `known_bugs_<data>.md` + `ios_android_parity_<data>.md`

## Setup — 3 dev serwery równolegle (różne porty, nie kolidują)

```bash
# Web (Playwright target)
npm run web > /tmp/expo-web.log 2>&1 &
# → http://localhost:8081

# Android
~/Library/Android/sdk/emulator/emulator -avd Pixel_6 &
npx expo start --port 19001 > /tmp/expo-android.log 2>&1 &
# → exp://10.0.2.2:19001

# iOS
xcrun simctl boot "iPhone 17"; open -a Simulator
npx expo start --ios --port 8083 > /tmp/expo-ios.log 2>&1 &
# → exp://<LAN_IP>:8083 (Expo CLI auto-installs Expo Go)
```

Użyj `Monitor` z grep na `Bundled|Error` żeby wiedzieć że Metro gotowe przed rozpoczęciem testów.

## 17-krokowy flow (obowiązkowy — ten sam na każdej platformie)

1. **Home (market list)** — ładowanie, skeleton, listing karta
2. **Scroll + FAB** — scroll-to-top FAB (desktop nie ma)
3. **Search** — autocomplete dropdown, wybór itemu → chip filter, multi-chip
4. **Click item card** — mobile → nav `/item/[name]`, desktop → modal
5. **Item detail** — margin, buy/sell, active offers, price history (7d/14d/30d/90d + Price/Volume), monthly/today stats, NPC section
6. **Bell (alert)** — modal, DISABLED state gdy puste (Fix #1), save z wypełnionymi polami, sprawdź storage (`tibia_watchlist_v2`)
7. **Star (favorite)** — toggle, sprawdź `tibia_favorites_v2`
8. **Back → list** — bell/star reflectują stan
9. **Filter panel** — profesja, kategoria, cena min-max, min obrót, min marża → Zastosuj → Wyczyść
10. **Sort picker** — bottom sheet z opcjami
11. **Language toggle PL ↔ EN** — sprawdź WSZYSTKIE plurale (1/2/5 — polski ma 3 formy!)
12. **World select** — "N światów" (Fix #3b regression)
13. **Switch world** → dane się odświeżyły
14. **Watchlist tab (Alerty)** — grupowanie per świat, triggered "N aktywny/aktywne/aktywnych" (Fix #4), edycja
15. **Favorites subtab** — per świat (Fix #3a label)
16. **Statistics tab** — 4 kategorie, medal rankings 1-3, toggle
17. **Desktop only:** grid ↔ list view, modal detail, 3-col grid na 1400px+

## Platformowe narzędzia

### Web — Playwright MCP
- `browser_resize` 390x844 (mobile) / 1440x900 (desktop) PRZED `browser_navigate`
- `browser_snapshot` po każdej interakcji
- `browser_take_screenshot` → `tests/screenshots/review/NN-<viewport>-<opis>.png`
- `browser_console_messages level:error` po każdym kroku (łapie silent fails)
- `browser_evaluate` dla storage checks
- Ikony Material to unicode (`\u{F009C}`) → szukaj `getByText('\uF009C')`

### Android — adb + screencap
```bash
ADB=~/Library/Android/sdk/platform-tools/adb
$ADB shell input tap <x> <y>               # Pixel 6 = 1080x2400 actual pixels
$ADB shell input text "demon"
$ADB shell input keyevent KEYCODE_BACK
$ADB shell screencap -p /sdcard/s.png && $ADB pull /sdcard/s.png tests/screenshots/android/NN.png
$ADB shell am force-stop host.exp.exponent # restart Expo Go gdy modal stuck
```

### iOS — xcrun simctl (preferuj deep-link zamiast tap)
```bash
xcrun simctl io booted screenshot tests/screenshots/ios/NN.png       # 1206x2622 output
xcrun simctl openurl booted "exp://192.168.0.83:8083/--/watchlist"   # niezawodna nawigacja
xcrun simctl openurl booted "exp://192.168.0.83:8083/--/item/demon%20legs?world=Antica"
xcrun simctl terminate booted host.exp.Exponent                      # gdy dev menu stuck
```

Item names w URL = exact API match (lowercase z spacjami): "tibia coins" nie "tibia coin".

## Checklist po każdej interakcji

- ❗ Console errors / warnings
- ❗ Storage po modyfikacji (`tibia_watchlist_v2`, `tibia_favorites_v2`, `tibia_selected_world_v1`, `tibia_view_mode_v1`, `tibia_language_v1`)
- ⚠️ Rate limit (429) → czy UI ma retry/error state?
- ⚠️ Outliery w sort marża
- ⚠️ Duplicate React keys (Fix #2 regression)
- 🎨 Spójność bell/star między detail/list/grid/modal
- 🎨 FAB visible state zależnie od modalu
- 🎨 Autocomplete dropdown opacity
- 🔤 **Polska pluralizacja** — dla każdego licznika na UI sprawdź 1 / 2 / 5 wariant (3 formy: one/few/many)
- 📐 Safe-area / Dynamic Island / notch respect (iOS)
- 🌐 Language toggle przełącza CAŁE UI (żaden hardcoded string)

## Platform-specific pitfalls

- **Android**: `adb input tap` bywa niedeterministyczny na RN Modals → gdy tap nie wywołuje akcji, force-stop Expo Go + openurl
- **Android**: Push notifications disabled w Expo Go SDK 48+ (toast start — normal, nie bug)
- **iOS**: Cmd+D otwiera dev menu (stuck? → terminate + openurl)
- **iOS**: Symulator domyślnie NIE ma Expo Go — pierwsze `expo start --ios` auto-installuje (~30s)
- **iOS**: Dynamic Island zajmuje górne ~120px — sprawdź safe-area insets

## Po sweepie — obowiązkowo

1. Napisz `tests/screenshots/review/REPORT.md` z:
   - Parity table (17 kroków × 4 platformy = web-mobile, web-desktop, Android, iOS)
   - Lista bugów severity 1-3 z screenshot path
   - Status fixes (w sesji / do zrobienia)
2. Update memory:
   - `known_bugs_YYYY-MM-DD.md` — dodaj nowe bugi
   - `ios_android_parity_YYYY-MM-DD.md` — wyniki native sweep
3. Jeśli znalezione bugi łatwe do naprawienia w tej samej sesji — **napraw + pokryj regression testem w `tests/bugfixes.spec.ts`** + `npm run test:e2e` musi być green przed commit.

## Pełna procedura + historia

Szczegółowa referencja: memory file `uat_sweep_process.md` (procedura) + `ios_android_parity_2026-04-15.md` (precedens cross-platform sweep z tej bazy). Przed rozpoczęciem odczytaj te 2 pliki z memory żeby załadować kontekst wcześniejszych znalezisk.
