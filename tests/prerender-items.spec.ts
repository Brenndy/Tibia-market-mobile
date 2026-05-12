import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { POPULAR_ITEMS } from '../src/data/popularItems';

// Guardrail: the hardcoded list in src/data/popularItems.ts is consumed by
// generateStaticParams (app/item/[name].tsx) AND by public/sitemap.xml. They
// must stay in sync — if someone edits one without the other, Google will
// either miss pre-rendered items or try to crawl ones that don't exist.

test.describe('SEO — pre-rendered item pages', () => {
  test('every item in POPULAR_ITEMS is listed in sitemap.xml', () => {
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    const xml = fs.readFileSync(sitemapPath, 'utf8');
    for (const name of POPULAR_ITEMS) {
      const encoded = encodeURIComponent(name);
      expect(xml, `sitemap.xml missing /item/${encoded}`).toContain(`/item/${encoded}`);
    }
  });
});

// Guardrail against Soft 404s: Googlebot crawls a static export shell with
// suspended screen content. Without body text it flags the page as Soft 404
// ("Page not found" verdict despite HTTP 200). SEOContent.tsx injects a
// visually-hidden semantic stub at the layout level — this spec verifies the
// stub survives the static export for every route we care about.
test.describe('SEO — SSR body content (Soft 404 guard)', () => {
  const distDir = path.join(__dirname, '..', 'dist');
  const readIfExported = (rel: string): string | null => {
    const full = path.join(distDir, rel);
    return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
  };

  const hasSeoStub = (html: string): boolean => html.includes('<section data-seo="body"');
  const hasH1 = (html: string, needle: RegExp): boolean => {
    const stub = html.match(/<section data-seo="body"[\s\S]*?<\/section>\s*<\/section>/);
    const scope = stub?.[0] ?? html;
    const h1 = scope.match(/<h1>([\s\S]*?)<\/h1>/);
    if (!h1) return false;
    return needle.test(h1[1].replace(/<!--.*?-->/g, ''));
  };

  test('homepage SSR HTML contains brand h1 and internal nav', () => {
    const html = readIfExported('index.html');
    test.skip(html === null, 'dist/ not built — run `npx expo export -p web` first');
    expect(hasSeoStub(html!)).toBe(true);
    expect(hasH1(html!, /TibiaTrader/i)).toBe(true);
    expect(html!).toContain('href="https://tibiatrader.com/watchlist"');
    expect(html!).toContain('href="https://tibiatrader.com/statistics"');
  });

  test('watchlist SSR HTML contains Watchlist h1', () => {
    const html = readIfExported('watchlist.html');
    test.skip(html === null, 'dist/ not built');
    expect(hasSeoStub(html!)).toBe(true);
    expect(hasH1(html!, /alert|watchlist|price/i)).toBe(true);
  });

  test('statistics SSR HTML contains Statistics h1', () => {
    const html = readIfExported('statistics.html');
    test.skip(html === null, 'dist/ not built');
    expect(hasSeoStub(html!)).toBe(true);
    expect(hasH1(html!, /statistic|market/i)).toBe(true);
  });

  test('pre-rendered item page SSR HTML contains item-name h1', () => {
    const html = readIfExported('item/magic plate armor.html');
    test.skip(html === null, 'dist/ not built');
    expect(hasSeoStub(html!)).toBe(true);
    expect(hasH1(html!, /Magic Plate Armor/i)).toBe(true);
    // Should link to the full market and at least 10 other popular items
    // (internal crawl graph boost for the 25-item set).
    const linkCount = (html!.match(/href="https:\/\/tibiatrader\.com\/item\//g) ?? []).length;
    expect(linkCount).toBeGreaterThan(10);
  });

  test('pre-rendered item page with metadata renders rich SEO body', () => {
    // Guards against regression of the rich content added in PR #55. Without
    // this, every item page collapsed to "URL is unknown to Google" because
    // the SEO body was a one-liner + identical "Popular items" list (thin
    // content). The new body weaves in category + NPC offers + related-by-
    // category links, which gives Google a reason to index each page.
    const html = readIfExported('item/demon armor.html');
    test.skip(html === null, 'dist/ not built');
    // Category sentence ("Demon Armor is an armor in Tibia.")
    expect(html).toMatch(/is an? armor in Tibia/);
    // NPC offer line ("H.L. in Outlaw Camp buys it for 195 gp.")
    expect(html).toContain('NPCs that buy this item');
    expect(html).toMatch(/in Outlaw Camp buys it for/);
    // Related-category section + at least 5 same-category links
    expect(html).toContain('Related armors on TibiaTrader');
    expect(html).toContain('href="https://tibiatrader.com/item/crown%20armor"');
    expect(html).toContain('href="https://tibiatrader.com/item/golden%20armor"');
    // TibiaWiki outbound link
    expect(html).toContain('https://tibia.fandom.com/wiki/Demon_Armor');
  });

  test('every pre-rendered item page has a unique h1 matching the item name', () => {
    const missing = POPULAR_ITEMS.filter((name) => {
      const html = readIfExported(`item/${name}.html`);
      if (html === null) return false;
      return !hasH1(html, new RegExp(name.replace(/\s/g, '\\s*'), 'i'));
    });
    const anyBuilt = POPULAR_ITEMS.some((n) => readIfExported(`item/${n}.html`) !== null);
    test.skip(!anyBuilt, 'dist/ not built');
    expect(missing, `items missing matching h1: ${missing.join(', ')}`).toEqual([]);
  });
});
