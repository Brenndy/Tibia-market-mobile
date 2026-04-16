import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Custom HTML document for web builds. Sets meta tags, Open Graph,
// Twitter cards, JSON-LD schema and PWA manifest for SEO.
// Expo Router renders this as the <html> root on web only; native ignores it.

export default function Root({ children }: PropsWithChildren) {
  const siteUrl = 'https://tibiatrader.com';
  const title = 'TibiaTrader — Live Tibia market prices, margins & price alerts';
  const description =
    'TibiaTrader is the fastest way to browse the Tibia in-game market. Live buy/sell prices across every world, spot flip margins, set price alerts, and track volume history.';
  const ogImage = `${siteUrl}/og-image.png`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TibiaTrader',
    alternateName: 'Tibia Trader',
    url: siteUrl,
    description,
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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="theme-color" content="#0a0e1a" />

        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="tibia, tibia market, tibia prices, tibia trading, tibia flip, tibia margin, tibia watchlist, tibia alerts, tibia item prices, tibia gold, mmorpg trading"
        />
        <meta name="author" content="Brenndy" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={siteUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TibiaTrader" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="pl_PL" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
