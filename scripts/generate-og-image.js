// Renders scripts/generate-og-image.html to a 1200x630 PNG in public/og-image.png
// using Playwright's headless Chromium. Run with: node scripts/generate-og-image.js

const path = require('path');
const { chromium } = require('playwright');

async function main() {
  const htmlPath = path.resolve(__dirname, 'generate-og-image.html');
  const outPath = path.resolve(__dirname, '..', 'public', 'og-image.png');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // Retina-crisp
  });
  const page = await context.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200); // let fonts render
  await page.screenshot({ path: outPath, omitBackground: false, type: 'png' });
  await browser.close();

  console.log(`✅ og-image.png written to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
