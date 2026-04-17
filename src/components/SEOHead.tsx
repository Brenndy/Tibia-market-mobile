// Route-driven SEO tags for web. Rendered at the layout level (not inside
// screens) because expo-router static SSR produces a shell HTML with
// suspended screen content — only _layout, providers and usePathname()
// execute during renderToString, so per-route <title>/<meta> tags must live
// there. We read the current pathname and emit Helmet tags based on a
// centralized route metadata map. See renderStaticContent.js — HelmetProvider
// is already wired by expo-router; Helmet children hook into the same context.
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { Helmet } from 'expo-router/vendor/react-helmet-async/lib';
import { toTitleCase } from '@/src/api/tibiaMarket';

type RouteMeta = { title: string; description: string };
type Locale = 'en' | 'pl';

const SITE_URL = 'https://tibiatrader.com';

const HOMEPAGE_META: Record<Locale, RouteMeta> = {
  en: {
    title: 'TibiaTrader — Live Tibia market prices, margins & price alerts',
    description:
      'Browse the Tibia in-game market: live buy/sell prices across every world, flip margins, price alerts and volume history. Free, fast, mobile-friendly.',
  },
  pl: {
    title: 'TibiaTrader — Ceny przedmiotów Tibii, marże i alerty cenowe',
    description:
      'Przeglądaj rynek Tibii: aktualne ceny kupna i sprzedaży na każdym świecie, marże flipów, alerty cenowe i historia wolumenów. Darmowe, szybkie, mobile-friendly.',
  },
};

const WATCHLIST_META: Record<Locale, RouteMeta> = {
  en: {
    title: 'Watchlist — Tibia price alerts | TibiaTrader',
    description:
      'Set buy and sell price alerts for Tibia items. Get notified when prices hit your target on any world — free, fast, mobile-friendly.',
  },
  pl: {
    title: 'Obserwowane — Alerty cenowe Tibii | TibiaTrader',
    description:
      'Ustaw alerty cen kupna i sprzedaży dla przedmiotów w Tibii. Otrzymaj powiadomienie, gdy cena osiągnie Twój próg na dowolnym świecie.',
  },
};

const STATISTICS_META: Record<Locale, RouteMeta> = {
  en: {
    title: 'Market Statistics — Tibia trading insights | TibiaTrader',
    description:
      'Tibia market stats: top movers, most-traded items, biggest margins and monthly volume across every world. Live data, updated hourly.',
  },
  pl: {
    title: 'Statystyki rynku — Analiza handlu w Tibii | TibiaTrader',
    description:
      'Statystyki rynku Tibii: największe wzrosty i spadki, najczęściej handlowane przedmioty, największe marże i wolumen miesięczny. Aktualizacja co godzinę.',
  },
};

const WORLD_SELECT_META: Record<Locale, RouteMeta> = {
  en: {
    title: 'Select Tibia World — TibiaTrader',
    description:
      'Pick your Tibia world to see live market prices, margins and trends. Every Open PvP, Optional PvP and Hardcore world supported.',
  },
  pl: {
    title: 'Wybierz świat Tibii — TibiaTrader',
    description:
      'Wybierz swój świat Tibii, aby zobaczyć aktualne ceny, marże i trendy rynkowe. Wszystkie światy Open PvP, Optional PvP i Hardcore.',
  },
};

const ITEM_TEMPLATE_META: Record<Locale, RouteMeta> = {
  en: {
    title: 'Tibia item prices, margins & history | TibiaTrader',
    description:
      'Look up any Tibia item: live buy and sell offers, flip margin, monthly volume and 90-day price history across every world.',
  },
  pl: {
    title: 'Ceny, marże i historia przedmiotów Tibii | TibiaTrader',
    description:
      'Sprawdź dowolny przedmiot Tibii: aktualne oferty kupna i sprzedaży, marżę flipa, wolumen miesięczny i 90-dniową historię cen na każdym świecie.',
  },
};

const STATIC_ROUTES: Record<string, Record<Locale, RouteMeta>> = {
  '/': HOMEPAGE_META,
  '/(tabs)': HOMEPAGE_META,
  '/watchlist': WATCHLIST_META,
  '/(tabs)/watchlist': WATCHLIST_META,
  '/statistics': STATISTICS_META,
  '/(tabs)/statistics': STATISTICS_META,
  '/world-select': WORLD_SELECT_META,
};

function itemMeta(itemTitle: string): Record<Locale, RouteMeta> {
  return {
    en: {
      title: `${itemTitle} — live Tibia price, margin & history | TibiaTrader`,
      description: `Live ${itemTitle} market price on Tibia: buy and sell offers, flip margin, monthly volume and 90-day price history across every world.`,
    },
    pl: {
      title: `${itemTitle} — cena, marża i historia w Tibii | TibiaTrader`,
      description: `Aktualna cena ${itemTitle} na rynku Tibii: oferty kupna i sprzedaży, marża flipa, wolumen miesięczny i 90-dniowa historia cen na każdym świecie.`,
    },
  };
}

function metaForPath(
  pathname: string | null,
  locale: Locale,
): { meta: RouteMeta; canonical: string } {
  const path = pathname || '/';
  // /item/<name> is the dynamic route; decode the URL segment into a readable
  // title. For the literal "[name]" template rendered during static export,
  // emit a generic catalog title — real item pages get their real name
  // injected client-side after hydration.
  const itemMatch = path.match(/^\/item\/([^/?#]+)/);
  if (itemMatch) {
    const rawName = decodeURIComponent(itemMatch[1]);
    const isTemplate = rawName === '[name]';
    const byLocale = isTemplate ? ITEM_TEMPLATE_META : itemMeta(toTitleCase(rawName));
    // usePathname returns the decoded form (spaces, not %20). Re-encode the
    // item segment so the canonical URL is a valid absolute URL Google can crawl.
    const canonicalPath = isTemplate ? path : `/item/${encodeURIComponent(rawName)}`;
    return { meta: byLocale[locale], canonical: `${SITE_URL}${canonicalPath}` };
  }
  const normalized = path.replace(/\?.*$/, '').replace(/#.*$/, '');
  const byLocale = STATIC_ROUTES[normalized] ?? HOMEPAGE_META;
  // Strip the (tabs) group from the canonical URL — it's an Expo Router
  // routing artifact, not a real path segment users should see.
  const canonicalPath = normalized.replace('/(tabs)', '') || '/';
  return { meta: byLocale[locale], canonical: `${SITE_URL}${canonicalPath}` };
}

function resolveLocale(langParam: string | string[] | undefined): Locale {
  // ?lang=pl is the only Polish signal. During SSR the hook returns {} so we
  // default to EN — matches the app's hard-EN default, no browser autodetect.
  const value = Array.isArray(langParam) ? langParam[0] : langParam;
  return value === 'pl' ? 'pl' : 'en';
}

type Crumb = { name: string; url: string };

const CRUMB_LABELS: Record<string, Record<Locale, string>> = {
  home: { en: 'Home', pl: 'Strona główna' },
  watchlist: { en: 'Watchlist', pl: 'Obserwowane' },
  statistics: { en: 'Statistics', pl: 'Statystyki' },
  worldSelect: { en: 'Select World', pl: 'Wybierz świat' },
  market: { en: 'Market', pl: 'Rynek' },
};

// Build the breadcrumb trail for the current route. Homepage returns an empty
// list — BreadcrumbList with a single "Home" entry is useless to Google and
// rejected by Rich Results Test.
function breadcrumbsForPath(pathname: string | null, locale: Locale): Crumb[] {
  const path = pathname || '/';
  const normalized = path.replace(/\?.*$/, '').replace(/#.*$/, '').replace('/(tabs)', '') || '/';
  const home: Crumb = { name: CRUMB_LABELS.home[locale], url: `${SITE_URL}/` };

  const itemMatch = path.match(/^\/item\/([^/?#]+)/);
  if (itemMatch) {
    const rawName = decodeURIComponent(itemMatch[1]);
    if (rawName === '[name]') return [];
    return [
      home,
      { name: CRUMB_LABELS.market[locale], url: `${SITE_URL}/` },
      { name: toTitleCase(rawName), url: `${SITE_URL}/item/${encodeURIComponent(rawName)}` },
    ];
  }
  if (normalized === '/watchlist') {
    return [home, { name: CRUMB_LABELS.watchlist[locale], url: `${SITE_URL}/watchlist` }];
  }
  if (normalized === '/statistics') {
    return [home, { name: CRUMB_LABELS.statistics[locale], url: `${SITE_URL}/statistics` }];
  }
  if (normalized === '/world-select') {
    return [home, { name: CRUMB_LABELS.worldSelect[locale], url: `${SITE_URL}/world-select` }];
  }
  return [];
}

function breadcrumbJsonLd(crumbs: Crumb[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  });
}

export default function RouteSEO() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ lang?: string }>();
  const locale = resolveLocale(params.lang);
  const { meta, canonical } = metaForPath(pathname, locale);
  // When ?lang=pl is present, append it to canonical + og:url so the bilingual
  // URL is the self-referencing canonical (prevents Google from treating the
  // PL landing as a duplicate of the EN root).
  const canonicalWithLang = locale === 'pl' ? `${canonical}?lang=pl` : canonical;
  const hrefEn = canonical;
  const hrefPl = `${canonical}?lang=pl`;
  const ogLocale = locale === 'pl' ? 'pl_PL' : 'en_US';
  const crumbs = breadcrumbsForPath(pathname, locale);
  return (
    <Helmet>
      <html lang={locale} />
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonicalWithLang} />
      <link rel="alternate" hrefLang="en" href={hrefEn} />
      <link rel="alternate" hrefLang="pl" href={hrefPl} />
      <link rel="alternate" hrefLang="x-default" href={hrefEn} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonicalWithLang} />
      <meta property="og:locale" content={ogLocale} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {crumbs.length > 0 && <script type="application/ld+json">{breadcrumbJsonLd(crumbs)}</script>}
    </Helmet>
  );
}
