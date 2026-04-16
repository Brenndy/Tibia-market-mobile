// Route-driven SEO tags for web. Rendered at the layout level (not inside
// screens) because expo-router static SSR produces a shell HTML with
// suspended screen content — only _layout, providers and usePathname()
// execute during renderToString, so per-route <title>/<meta> tags must live
// there. We read the current pathname and emit Helmet tags based on a
// centralized route metadata map. See renderStaticContent.js — HelmetProvider
// is already wired by expo-router; Helmet children hook into the same context.
import { usePathname } from 'expo-router';
import { Helmet } from 'expo-router/vendor/react-helmet-async/lib';
import { toTitleCase } from '@/src/api/tibiaMarket';

type RouteMeta = { title: string; description: string };

const SITE_URL = 'https://tibiatrader.com';

const HOMEPAGE_META: RouteMeta = {
  title: 'TibiaTrader — Live Tibia market prices, margins & price alerts',
  description:
    'Browse the Tibia in-game market: live buy/sell prices across every world, flip margins, price alerts and volume history. Free, fast, mobile-friendly.',
};

const STATIC_ROUTES: Record<string, RouteMeta> = {
  '/': HOMEPAGE_META,
  '/(tabs)': HOMEPAGE_META,
  '/watchlist': {
    title: 'Watchlist — Tibia price alerts | TibiaTrader',
    description:
      'Set buy and sell price alerts for Tibia items. Get notified when prices hit your target on any world — free, fast, mobile-friendly.',
  },
  '/(tabs)/watchlist': {
    title: 'Watchlist — Tibia price alerts | TibiaTrader',
    description:
      'Set buy and sell price alerts for Tibia items. Get notified when prices hit your target on any world — free, fast, mobile-friendly.',
  },
  '/statistics': {
    title: 'Market Statistics — Tibia trading insights | TibiaTrader',
    description:
      'Tibia market stats: top movers, most-traded items, biggest margins and monthly volume across every world. Live data, updated hourly.',
  },
  '/(tabs)/statistics': {
    title: 'Market Statistics — Tibia trading insights | TibiaTrader',
    description:
      'Tibia market stats: top movers, most-traded items, biggest margins and monthly volume across every world. Live data, updated hourly.',
  },
  '/world-select': {
    title: 'Select Tibia World — TibiaTrader',
    description:
      'Pick your Tibia world to see live market prices, margins and trends. Every Open PvP, Optional PvP and Hardcore world supported.',
  },
};

function metaForPath(pathname: string | null): { meta: RouteMeta; canonical: string } {
  const path = pathname || '/';
  // /item/<name> is the dynamic route; decode the URL segment into a readable
  // title. For the literal "[name]" template rendered during static export,
  // emit a generic catalog title — real item pages get their real name
  // injected client-side after hydration.
  const itemMatch = path.match(/^\/item\/([^/?#]+)/);
  if (itemMatch) {
    const rawName = decodeURIComponent(itemMatch[1]);
    const isTemplate = rawName === '[name]';
    const itemTitle = isTemplate ? 'Items' : toTitleCase(rawName);
    return {
      meta: isTemplate
        ? {
            title: 'Tibia item prices, margins & history | TibiaTrader',
            description:
              'Look up any Tibia item: live buy and sell offers, flip margin, monthly volume and 90-day price history across every world.',
          }
        : {
            title: `${itemTitle} — live Tibia price, margin & history | TibiaTrader`,
            description: `Live ${itemTitle} market price on Tibia: buy and sell offers, flip margin, monthly volume and 90-day price history across every world.`,
          },
      canonical: `${SITE_URL}${path}`,
    };
  }
  const normalized = path.replace(/\?.*$/, '').replace(/#.*$/, '');
  const meta = STATIC_ROUTES[normalized] ?? HOMEPAGE_META;
  // Strip the (tabs) group from the canonical URL — it's an Expo Router
  // routing artifact, not a real path segment users should see.
  const canonicalPath = normalized.replace('/(tabs)', '') || '/';
  return { meta, canonical: `${SITE_URL}${canonicalPath}` };
}

export default function RouteSEO() {
  const pathname = usePathname();
  const { meta, canonical } = metaForPath(pathname);
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
}
