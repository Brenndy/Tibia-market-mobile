# Tibia Market Mobile

A cross-platform mobile app for browsing the Tibia in-game market — prices, margins, alerts, and statistics. Built with Expo and React Native, powered by [api.tibiamarket.top](https://api.tibiamarket.top/docs).

## Features

- **Market browser** — browse all items with live buy/sell prices, monthly volume, and margin
- **Smart presets** — one-tap filters for Hot, Flips, Cheap, and Expensive items
- **Advanced filters** — filter by category, price range, volume, margin, vocation, NPC availability
- **Price alerts** — watch items and get notified when prices hit your targets
- **Price history charts** — smooth bezier charts with buy/sell spread visualization
- **Statistics** — top 15 most traded, purchased, and expensive items with podium ranking
- **Favorites** — star items for quick access
- **Multi-world support** — switch between any Tibia game world
- **Bilingual** — English and Polish UI (auto-detected from device language)
- **Dark theme** — crafted for comfortable trading sessions

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 + [expo-router](https://expo.github.io/router) |
| UI | React Native 0.81, react-native-svg, expo-linear-gradient |
| State | react-query v3, React Context |
| Notifications | expo-notifications + expo-background-fetch |
| API | [tibiamarket.top](https://api.tibiamarket.top/docs) via Vercel proxy |

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go app on your device (for quick testing)

### Setup

```bash
git clone https://github.com/Brenndy/tibia-market-mobile
cd tibia-market-mobile
npm install
```

Copy the environment template and configure your Vercel proxy URL:

```bash
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_PROXY_URL to your Vercel deployment
```

> **Why a proxy?** The tibiamarket.top API applies rate limits by IP. The Vercel proxy routes requests through a stable server IP, avoiding rate-limit issues during development and for native users.

### Run

```bash
# Start dev server (scan QR with Expo Go)
npm start

# Web
npm run web

# Android
npm run android

# iOS
npm run ios
```

## Deploying Your Own Proxy

The app expects a Vercel deployment with a `/api/tibia/[...path]` rewrite that forwards requests to `api.tibiamarket.top`. You can fork and deploy using the `vercel.json` rewrites included in this repo.

After deploying, set your URL in `.env`:

```
EXPO_PUBLIC_API_PROXY_URL=https://your-deployment.vercel.app
```

## Project Structure

```
app/                     # Expo Router screens
  (tabs)/                # Tab navigation (market, watchlist, statistics)
  item/[name].tsx        # Item detail screen
  world-select.tsx       # World picker modal
src/
  api/tibiaMarket.ts     # API client & data types
  components/            # Shared UI components
  context/               # React Context providers (World, Watchlist, Language)
  hooks/                 # react-query hooks
  i18n/                  # Translations (en, pl)
  services/              # Push notifications service
  theme/                 # Colors & design tokens
  data/                  # Static data (item list, vocations)
```

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a pull request

## License

[MIT](LICENSE)
