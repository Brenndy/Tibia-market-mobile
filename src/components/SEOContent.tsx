// SSR-only semantic body content to fix Soft 404 verdicts on item pages.
//
// Problem: Expo Router static export suspends screen content during
// renderToString (see CLAUDE.md §3.1), so Googlebot gets a shell HTML with
// meta tags but an empty <body> — a classic Soft 404 trigger. RouteSEO
// already injects per-route <title>/<meta>, but crawlers also want a
// non-empty body with headings, paragraphs and internal links.
//
// This component emits exactly that: a visually-hidden <section> with a
// per-route <h1>, description, and internal link list. It's rendered at
// the layout level (same constraint as RouteSEO) so it survives SSR. The
// clip-rect visually-hidden pattern keeps it crawlable + screen-reader-
// accessible but invisible to sighted users — once the SPA hydrates and
// renders the real screen, this stub sits harmlessly in the DOM.
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { POPULAR_ITEMS } from '@/src/data/popularItems';
import { toTitleCase } from '@/src/api/tibiaMarket';

type Locale = 'en' | 'pl';

const SITE_URL = 'https://tibiatrader.com';

// Standard "visually hidden" pattern — off-screen via clip-rect but present
// in the accessibility tree and the raw HTML Googlebot parses.
const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function resolveLocale(lang: string | string[] | undefined): Locale {
  const value = Array.isArray(lang) ? lang[0] : lang;
  return value === 'pl' ? 'pl' : 'en';
}

function itemHref(name: string): string {
  return `${SITE_URL}/item/${encodeURIComponent(name)}`;
}

function PopularItemsList({ locale, exclude }: { locale: Locale; exclude?: string }) {
  const heading = locale === 'pl' ? 'Popularne przedmioty' : 'Popular items';
  return (
    <section>
      <h2>{heading}</h2>
      <ul>
        {POPULAR_ITEMS.filter((n) => n !== exclude).map((name) => (
          <li key={name}>
            <a href={itemHref(name)}>{toTitleCase(name)}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HomeContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>TibiaTrader — rynek Tibii w czasie rzeczywistym</h1>
        <p>
          Darmowy tracker cen rynkowych Tibii. Aktualne ceny kupna i sprzedaży na każdym świecie,
          marże flipów, alerty cenowe i historia wolumenów. Bez rejestracji, mobile-friendly.
        </p>
        <nav>
          <ul>
            <li>
              <a href={`${SITE_URL}/watchlist`}>Obserwowane i alerty cenowe</a>
            </li>
            <li>
              <a href={`${SITE_URL}/statistics`}>Statystyki rynku</a>
            </li>
            <li>
              <a href={`${SITE_URL}/world-select`}>Wybierz świat Tibii</a>
            </li>
          </ul>
        </nav>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  return (
    <>
      <h1>TibiaTrader — live Tibia market prices</h1>
      <p>
        Free Tibia market tracker. Live buy and sell offers across every world, flip margins,
        price alerts and 90-day volume history. No signup required, mobile-friendly.
      </p>
      <nav>
        <ul>
          <li>
            <a href={`${SITE_URL}/watchlist`}>Watchlist and price alerts</a>
          </li>
          <li>
            <a href={`${SITE_URL}/statistics`}>Market statistics</a>
          </li>
          <li>
            <a href={`${SITE_URL}/world-select`}>Select your Tibia world</a>
          </li>
        </ul>
      </nav>
      <PopularItemsList locale={locale} />
    </>
  );
}

function WatchlistContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>Alerty cenowe Tibii</h1>
        <p>
          Ustaw alerty cen kupna i sprzedaży dla dowolnego przedmiotu w Tibii. Otrzymasz
          powiadomienie, gdy cena osiągnie Twój próg na wybranym świecie. Bezpłatnie, bez
          rejestracji.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Wróć do rynku</a>
        </p>
      </>
    );
  }
  return (
    <>
      <h1>Tibia price alerts</h1>
      <p>
        Set buy and sell price alerts for any Tibia item. Get notified when the price hits your
        target on the world of your choice. Free, no signup.
      </p>
      <p>
        <a href={`${SITE_URL}/`}>Back to the market</a>
      </p>
    </>
  );
}

function StatisticsContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>Statystyki rynku Tibii</h1>
        <p>
          Największe wzrosty i spadki cen, najczęściej handlowane przedmioty, największe marże
          flipów i miesięczny wolumen. Aktualizacja co godzinę, dane dla każdego świata.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Przejdź do rynku</a>
        </p>
      </>
    );
  }
  return (
    <>
      <h1>Tibia market statistics</h1>
      <p>
        Top movers, most-traded items, biggest flip margins and monthly volume across every Tibia
        world. Updated hourly.
      </p>
      <p>
        <a href={`${SITE_URL}/`}>Browse the market</a>
      </p>
    </>
  );
}

function WorldSelectContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>Wybierz świat Tibii</h1>
        <p>
          Wybierz swój świat, aby zobaczyć aktualne ceny rynkowe, marże i trendy. Obsługujemy
          wszystkie światy Open PvP, Optional PvP i Hardcore.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Wróć do rynku</a>
        </p>
      </>
    );
  }
  return (
    <>
      <h1>Select your Tibia world</h1>
      <p>
        Pick your Tibia world to see live market prices, margins and trends. Every Open PvP,
        Optional PvP and Hardcore world supported.
      </p>
      <p>
        <a href={`${SITE_URL}/`}>Back to the market</a>
      </p>
    </>
  );
}

function ItemContent({ name, locale }: { name: string; locale: Locale }) {
  const title = toTitleCase(name);
  if (locale === 'pl') {
    return (
      <>
        <h1>{title} — cena rynkowa w Tibii</h1>
        <p>
          Aktualna cena {title} na rynku Tibii: oferty kupna i sprzedaży, marża flipa, miesięczny
          wolumen i 90-dniowa historia cen na każdym świecie. Dane aktualizowane co godzinę.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Wróć do pełnego rynku</a>
        </p>
        <PopularItemsList locale={locale} exclude={name} />
      </>
    );
  }
  return (
    <>
      <h1>{title} — live Tibia market price</h1>
      <p>
        Live {title} market data on Tibia: buy and sell offers, flip margin, monthly volume and
        90-day price history across every world. Hourly updates.
      </p>
      <p>
        <a href={`${SITE_URL}/`}>Back to the full market</a>
      </p>
      <PopularItemsList locale={locale} exclude={name} />
    </>
  );
}

function ItemTemplateContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>Ceny przedmiotów Tibii</h1>
        <p>
          Wyszukaj dowolny przedmiot, aby zobaczyć aktualne oferty kupna i sprzedaży, marżę flipa
          i historię cen na każdym świecie.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  return (
    <>
      <h1>Tibia item prices</h1>
      <p>
        Look up any Tibia item to see live buy and sell offers, flip margin and price history
        across every world.
      </p>
      <PopularItemsList locale={locale} />
    </>
  );
}

function contentForPath(pathname: string | null, locale: Locale): React.ReactNode {
  const path = pathname || '/';
  const itemMatch = path.match(/^\/item\/([^/?#]+)/);
  if (itemMatch) {
    const raw = decodeURIComponent(itemMatch[1]);
    if (raw === '[name]') return <ItemTemplateContent locale={locale} />;
    return <ItemContent name={raw} locale={locale} />;
  }
  const normalized = path.replace(/\?.*$/, '').replace(/#.*$/, '').replace('/(tabs)', '') || '/';
  if (normalized === '/') return <HomeContent locale={locale} />;
  if (normalized === '/watchlist') return <WatchlistContent locale={locale} />;
  if (normalized === '/statistics') return <StatisticsContent locale={locale} />;
  if (normalized === '/world-select') return <WorldSelectContent locale={locale} />;
  return null;
}

export default function SEOContent() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ lang?: string }>();
  const locale = resolveLocale(params.lang);
  const content = contentForPath(pathname, locale);
  if (!content) return null;
  return (
    <section data-seo="body" style={visuallyHidden}>
      {content}
    </section>
  );
}
