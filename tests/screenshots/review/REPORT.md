# Tibia Market Mobile — Raport testów manualnych (web)

**Data:** 2026-04-15
**Zakres:** Expo web build, Chromium via Playwright
**Viewporty:** mobile 390x844, desktop 1440x900
**Świat testowy:** Antica (mobile), Astera (desktop)
**Stan API:** live (nie mockowane) — niektóre zapytania trafiały w 429 Too Many Requests

Screenshoty: `tests/screenshots/review/01-*` do `40-*`.

---

## TL;DR

Aplikacja jest **wizualnie bardzo dobra** — ciemny motyw, gold accent, ikonografia MaterialCommunityIcons, shimmer/skeleton loading, medal rankings, FAB, skalowanie grid/list view. Ale ma kilka **realnych bugów funkcjonalnych** (watchlist silent-fail, duplikaty kluczy, stale loading po 429) i **UX niedociągnięć** na desktopie (list view zbyt rozstrzelony, FAB pokazuje się pod modalem).

---

## Bugi funkcjonalne (priorytet wysoki)

### 1. ❗ Silent failure: zapisywanie alertu z pustymi polami robi nic
**Screenshot:** `07-mobile-alert-modal.png`, `08-mobile-after-alert.png`, `10-mobile-watchlist.png`
**Repro:** Item detail → dzwonek → "Obserwuj" bez wpisywania wartości.
**Co się dzieje:** Modal zamyka się, ikona w headerze świeci się złotym kolorem, ale w localStorage `tibia_watchlist_v2` pozostaje `[]`.
**Root cause** (`src/components/WatchAlertModal.tsx:60–77` + `app/item/[name].tsx:758–764`):
- Inputy mają tylko `placeholder={formatGold(currentBuy)}` — użytkownik widzi "50.0k" w polu i myśli że to wartość domyślna.
- `parseGold('')` zwraca `null`. Gdy buy i sell są null, handler traktuje to jako "usuń z watchlisty".
- Brak walidacji, brak toasta typu "wpisz przynajmniej jedną wartość", brak disabled buttona.

**Rekomendacja:**
- Pre-filluj `value` aktualną ceną (np. buy*0.9, sell*1.1) LUB
- Disable "Obserwuj" gdy oba pola puste LUB
- Pokaż inline error + zachowaj modal otwarty.

### 2. ❗ Duplicate key warning na sortowaniu po marży
**Screenshot:** `17-mobile-sorted-marza.png` (item: "silver rune emblem")
**Console:** `Encountered two children with the same key — .$silver rune emblem` (x4)
**Root cause:** API zwraca zduplikowane itemy albo lista używa `item.name` jako key bez uniqueness check. Może powodować znikanie/dublowanie wierszy.
**Rekomendacja:** użyj `${item.name}-${item.world}` lub dedupe fixtures po stronie klienta.

### 3. ❗ Watchlist po 429 utyka w "Loading..."
**Screenshot:** `37-desktop-watchlist-populated.jpg`
**Repro:** Szybka nawigacja → trafiamy w rate limit → kartka pokazuje "Loading…" + "••••" placeholdery → stan nigdy się nie odświeża.
**Rekomendacja:** ErrorState w karcie watchlisty z opcją "Spróbuj ponownie"; respect-after w backoff; wyświetlić cached price.

### 4. ⚠️ Etykieta "alert" reusowana dla liczby ulubionych
**Screenshot:** `11-mobile-favorites.png`, `40-desktop-favorites-tab.jpg`
**Plik:** `app/(tabs)/watchlist.tsx:283`
```tsx
{favoriteNames.length} {favoriteNames.length === 1 ? t('alert_singular') : t('alerts_plural')}
```
Wyświetla "Antica 1 alert" pod tabem Ulubione — gdzie nie ma żadnego alertu, to są favorytki.
**Rekomendacja:** Dodaj klucze `favorite_singular` / `favorites_plural` i użyj ich tutaj.

### 5. ⚠️ "105 select world" — zbugowany string na ekranie wyboru świata
**Screenshot:** `19-mobile-world-select.png`
Nagłówek licznika wyświetla dosłownie `105 select world` — prawdopodobnie konkatenacja `count + headerTitle`. Powinno być "105 światów" / "105 worlds".

### 6. ⚠️ Text node errors w konsoli przy otwarciu modala alertu
```
Unexpected text node: . A text node cannot be a child of a <View>.
```
Kilka powtórzeń po otwarciu `WatchAlertModal`. Nie łamie funkcji, ale powinno być naprawione (zwykle to gołe string/spacje pomiędzy `<Text>` children).

### 7. ⚠️ Brak filtru ekstremalnych outlierów
**Screenshot:** `17-mobile-sorted-marza.png`, `20-mobile-astera.png`
Sort po marży pokazuje przedmioty z marżą `449900%`, `750900%`, `2897%` itp. To prawie na pewno spamowe/żartobliwe offers ("Golden Helmet sell 10000kk"). Pasek marży jest wtedy maksymalnie wypełniony i nic nie mówi.
**Rekomendacja:** cap wyświetlanej marży na np. 200%; opcjonalnie filtr "Hide outliers" aktywny domyślnie.

### 8. ⚠️ CLAUDE.md mówi `tibia_favorites_v1`, kod używa `v2`
**Plik:** `CLAUDE.md` sekcja "localStorage keys"
Rzeczywisty klucz: `tibia_favorites_v2` (scopowane per świat). Doc drift.

---

## UI/UX — uwagi (priorytet średni)

### UX-1. Desktop list view: ogromne puste przestrzenie
**Screenshot:** `33-desktop-list-view.jpg`
Karta zajmuje pełną szerokość (~1400px) z buy/sell/vol rozciągniętymi po całej szerokości. Dla desktopa lepiej:
- Max-width ~1100px i centrowanie, lub
- Gęstsze kolumny (zmniejszyć gapy między metrykami), lub
- Dodać dodatkowe kolumny (marża%, oferty count, trend 7d).

To samo dotyczy kart na watchliście (`37-desktop-watchlist-populated.jpg`) i rankingów w Statistics.

### UX-2. FAB "do góry" pokazuje się nad modalem
**Screenshot:** `35-desktop-modal-bottom.jpg`
Po otwarciu modalu szczegółów itema scroll wewnątrz modalu triggeruje FAB z tła (prawy dolny róg). Powinien być ukrywany gdy modal jest otwarty.

### UX-3. Autocomplete szukania "przebija" przez karty
**Screenshot:** `03-mobile-search-demon.png`
Lista sugestii pod searchbarem ma lekko przezroczyste/miękkie tło — widać pod nią fragmenty kart "Tibia Coins". Powinno być solid background (colors.surface + drop shadow).

### UX-4. Bell w karcie listy nie reaguje na założony alert
**Screenshot:** `09-mobile-back-list.png` (po dodaniu alertu)
Na stronie szczegółów dzwonek robi się złoty, ale w liście + na karcie w widoku grid pozostaje szary outline. (To może wynikać z buga #1 — gdy alert się nie zapisze, bell jest prawidłowo szary. Ale jeśli alert IS zapisany, to oba miejsca powinny być spójne.)

### UX-5. Bottom tab bar na desktopie
Na 1440px widoku tab bar jest wycentrowany dolny (3 ikony: market, alerts, stats). Standardem dla desktopa byłby sidebar albo górny tab bar. Ale to świadomy wybór ("mobile-first") — warto rozważyć przy następnej iteracji.

### UX-6. Dzisiaj/miesięczne stats pokazują "0" dla itema bez ruchu
**Screenshot:** `06-mobile-item-detail-scrolled.png`
Dla Black Pit Demon wszystkie statystyki są 0 szt. / 0 avg. To poprawne ale layout wciąż wygląda "pusty". Można pokazać "— brak danych z ostatnich 30 dni" zamiast rzędu zer.

### UX-7. Chart dla sparse danych ma widoczny "gap + spike"
**Screenshot:** `06-mobile-item-detail-scrolled.png`
Wykres cena sprzedaży robi flat line ~0 przez 3 tygodnie a potem spike do 10.83kk. To dla rzadkich itemów normalne, ale wygląda jak błąd. Można:
- domyślnie scroll do ostatnich 7 dni,
- użyć scatter plot gdy data points < 5 (desktop już to robi dla scatter w modalu — `35-desktop-modal-bottom.jpg`, warto ujednolicić).

### UX-8. Favorites tab pokazuje itemy z INNEGO świata niż aktualny
**Screenshot:** `40-desktop-favorites-tab.jpg` (jestem na Astera, widzę Black Pit Demon z Antica)
To może być zamierzone (pokazywać wszystkie ulubione), ale powinno być wyraźnie zlabelowane: header "Antica" jest mały i łatwo go przeoczyć. Rozważ filtr world lub grupowanie bardziej wyraźne (np. badge przed itemem).

### UX-9. Loader animated z useNativeDriver warning
Console warning: `useNativeDriver is not supported because the native animated module is missing`. Na web to oczekiwane — dlatego commit 6372391 już ustawia `useNativeDriver:false` na GoldSpinner. Ale gdzieś indziej pewnie jeszcze został — warto znaleźć i wyczyścić.

### UX-10. Card hover state brak (desktop)
Na desktopie karty grid/list nie mają hover effectu (cursor: pointer, ale brak podkreślenia / elevation change). Drobny polerka UX.

---

## Pozytywy (to działa dobrze)

- **Wizualny branding** jest spójny — gold+dark, dobre kontrasty, czytelny Inter/system font.
- **Grid view na desktopie** (`32-desktop-home.jpg`) — 3-kolumnowy layout z wyraźnymi Good deal/Great deal badgeami to świetne UX.
- **Margin bar** z procentowym fillem to świetny microvisualizer w skanowaniu okazji.
- **Item detail page** (`05-mobile-item-detail.png`) jest bogate i czytelne — metadata, offers list, chart z toggle price/volume, month/today stats.
- **Filter panel** (`12-13-mobile-filters.png`) — kompletny, dobrze zorganizowany (Profesja/Kategoria/Cena min-max/min wolumen/min marża).
- **Statistics tab** (`21-22-23-mobile-statistics.png`) — medal rankings 1-2-3 z gold/silver/bronze, horizontal scroll kategorii, czyste.
- **World select** (`19-mobile-world-select.png`) — świetne informacje: last update, PvP type, selected checkmark.
- **i18n PL/EN** działa poprawnie (ex. 1 string bug "105 select world").
- **Persistence**: po reload stan się zachowuje (world, language, view mode, favorites).
- **Modal detail na desktopie** (`34-desktop-item-modal.jpg`) — trzyma się viewportu, ma scroll wewnątrz, spójny layout z mobile.
- **Multi-chip search** (`04-mobile-search-result-click.png`) — wybieranie wielu itemów z autocomplete jako chipów to smart UX.
- **FAB scroll-to-top** — pojawia się po scrollu, działa.

---

## Rekomendowana kolejność fixów

1. **Alert save silent fail** (#1) — użytkownik klika Obserwuj i myśli że działa; to blokuje core feature.
2. **Duplicate React keys** (#2) — ciche ryzyko znikających/dublowanych wierszy.
3. **Watchlist "Loading..." forever** (#3) — problem widoczny w codziennej nawigacji.
4. **i18n bugs** (#4, #5) — łatwe, tylko edycja stringów.
5. **Outlier cap** (#7) — drobny ale mocno poprawia usability.
6. **Desktop list view gęstość** (UX-1) — istotne dla user experience.
7. **FAB pod modalem** (UX-2) — polerka.
8. Reszta UX-*.

---

## Nieprzetestowane (do osobnego przejścia)

- **Android native** — dodane jako task #6 (do zrobienia później, wymaga buildu i symulatora/urządzenia).
- **iOS native** — analogicznie.
- Notification permissions flow (działa tylko na native).
- Background fetch (`registerBackgroundPriceCheck`) — tylko native.
- Deep linking / share URLs.
- Offline mode / AsyncStorage conflicts.
- Haptic feedback na mobile.
- Gesture handlers (swipe back na iOS).
- Responsive tablet (768px).
