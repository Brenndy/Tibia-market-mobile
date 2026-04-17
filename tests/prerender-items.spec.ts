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
