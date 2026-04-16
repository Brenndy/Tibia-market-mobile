# Contributing to Tibia Market Mobile

Thanks for your interest in contributing! This project is an Expo + React Native app with a Playwright E2E suite. Everything runs from `npm`.

## Development setup

```bash
git clone https://github.com/Brenndy/Tibia-market-mobile.git
cd Tibia-market-mobile
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_PROXY_URL to your own Vercel deployment
```

Then one of:

```bash
npm run web       # http://localhost:8081
npm run ios       # boots iOS simulator via Expo Go
npm run android   # boots Android emulator via Expo Go
```

## Branch model

- `main` — released state, always green, protected
- `develop` — next release, always green, default merge target for PRs
- feature branches: `feature/<short-name>`; bug fixes: `fix/<short-name>`

Open PRs against `develop`. `main` is updated from `develop` at release time.

## Before you open a PR

```bash
npm run typecheck      # strict TS, must be 0 errors
npm run lint           # eslint, must be 0 errors (warnings are OK but reviewed)
npm run format         # prettier auto-format
npm run test:e2e       # full Playwright suite against mocked API
```

A pre-commit hook runs `lint-staged` (eslint + prettier on changed files) and a pre-push hook runs typecheck + lint, so you will usually catch issues before push.

## UI / UX changes

Any change to UI or user-visible behavior **must** be covered by a Playwright test under `tests/`. See `tests/bugfixes.spec.ts` for the regression pattern and `CLAUDE.md` for the full testing convention (mocked fixtures, screenshot outputs, PL plural rules).

For bigger visual changes, please also run a manual cross-platform check via the `/uat-sweep` skill (see `.claude/skills/uat-sweep.md`) — web mobile+desktop, Android emulator, iOS simulator. This is how UI regressions get caught (the PL plural bug "1 aktywnych" was only observable on Android).

## Commit style

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`. Body in English; imperative mood ("add X", not "added X"). Reference issues with `#123` when relevant.

## Internationalization

The app is bilingual (EN / PL). When you add user-visible text:

1. Add the key to **both** `src/i18n/en.ts` and `src/i18n/pl.ts`.
2. For counts in Polish, use one/few/many (3 forms, not 2). See `pluralActive()` in `app/(tabs)/watchlist.tsx` for the pattern.
3. Never hardcode strings — always go through `t()`.

## Reporting bugs

Open a GitHub issue using the bug report template. Include: platform (web/iOS/Android), Expo SDK / Node version, reproduction steps, screenshots or a `tests/screenshots/` path from a failed Playwright run.

## Security

See [SECURITY.md](SECURITY.md). For security-sensitive issues, please email rather than opening a public issue.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to uphold it.
