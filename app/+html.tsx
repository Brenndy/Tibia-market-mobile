import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Custom HTML document for web builds. Sets meta tags, Open Graph,
// Twitter cards, JSON-LD schema and PWA manifest for SEO.
// Expo Router renders this as the <html> root on web only; native ignores it.

export default function Root({ children }: PropsWithChildren) {
  const siteUrl = 'https://tibiatrader.com';
  const ogImageAlt =
    'TibiaTrader — live Tibia market prices, margins and price alerts on web and mobile';
  const ogImage = `${siteUrl}/og-image.png`;
  // Per-route <title>, <meta name="description">, canonical and og:title/
  // description/url are injected by RouteSEO (src/components/SEOHead.tsx)
  // which runs inside _layout.tsx and reads usePathname(). This document
  // intentionally omits those fields so Helmet output wins on every route.

  const defaultDescription =
    'Live Tibia market prices across every world. Spot flip margins, set price alerts, track volume history — free, fast, mobile-friendly.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TibiaTrader',
    alternateName: 'Tibia Trader',
    url: siteUrl,
    description: defaultDescription,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    about: {
      '@type': 'VideoGame',
      name: 'Tibia',
      url: 'https://www.tibia.com/',
      publisher: { '@type': 'Organization', name: 'CipSoft' },
    },
    author: { '@type': 'Person', name: 'Brenndy' },
    inLanguage: ['en', 'pl'],
  };

  // Content below is 100% static compile-time constants (no user input,
  // no request data). dangerouslySetInnerHTML is safe here — it's the
  // standard Expo Router pattern for inline JSON-LD and critical CSS.
  const jsonLdHtml = JSON.stringify(jsonLd);
  const backgroundCss =
    'html, body { background-color: #0a0e1a; }' +
    '@media (prefers-color-scheme: dark) { html, body { background-color: #0a0e1a; } }';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0e1a" />

        <link rel="preconnect" href="https://static.tibia.com" />
        <link rel="dns-prefetch" href="https://static.tibia.com" />
        <link rel="preconnect" href="https://api.tibiadata.com" />
        <link rel="dns-prefetch" href="https://api.tibiadata.com" />

        <meta
          name="keywords"
          content="tibia, tibia market, tibia prices, tibia trading, tibia flip, tibia margin, tibia watchlist, tibia alerts, tibia item prices, tibia gold, mmorpg trading"
        />
        <meta name="author" content="Brenndy" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta
          name="google-site-verification"
          content="mj9399_G5dxBGNUMluwHzCC6qVxofwHXGfZuoq2Ajes"
        />
        <link rel="alternate" hrefLang="en" href={siteUrl} />
        <link rel="alternate" hrefLang="pl" href={`${siteUrl}/?lang=pl`} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TibiaTrader" />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={ogImageAlt} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="pl_PL" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={ogImageAlt} />

        <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TibiaTrader" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml }} />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: backgroundCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
