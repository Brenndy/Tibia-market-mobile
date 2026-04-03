# Tibia Market Mobile

Aplikacja mobilna do przeglądania marketu Tibia, oparta na [api.tibiamarket.top](https://api.tibiamarket.top/docs).

## Funkcje

- **Market** – przeglądaj wszystkie przedmioty z filtrami i sortowaniem
- **Szczegóły przedmiotu** – historia cen, wykresy, statystyki
- **Statystyki** – rankingi najdroższych i najczęściej sprzedawanych
- **Ulubione** – zapisz śledzenie ulubionych przedmiotów
- **Wybór świata** – przełączaj między wszystkimi światami Tibia
- **Dark Theme** – mroczny motyw inspirowany Tibią

## Tech stack

- React Native + Expo (SDK 51)
- Expo Router (nawigacja)
- React Query (cache + data fetching)
- react-native-chart-kit (wykresy)
- TypeScript

## Uruchomienie

```bash
npm install
npx expo start
```

Następnie otwórz w Expo Go na telefonie lub emulatorze.

## API

Aplikacja korzysta z publicznego API: `https://api.tibiamarket.top:8001`
