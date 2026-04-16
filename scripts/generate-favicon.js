// Renders scripts/generate-favicon.html to multiple PNG sizes used as:
//   - public/favicon.png (512x512, referenced by manifest.json)
//   - public/apple-touch-icon.png (192x192)
//   - assets/favicon.png (overrides Expo default 32x32 tab icon)
//   - assets/icon.png (1024x1024 app icon for iOS/Android builds)
//   - assets/adaptive-icon.png (1024x1024 Android foreground)
// Run with: node scripts/generate-favicon.js

const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

const OUTPUTS = [
  { file: 'assets/favicon.png', size: 48 },
  { file: 'assets/icon.png', size: 1024 },
  { file: 'assets/adaptive-icon.png', size: 1024 },
  { file: 'public/favicon.png', size: 512 },
  { file: 'public/apple-touch-icon.png', size: 192 },
];

async function main() {
  const htmlPath = path.resolve(__dirname, 'generate-favicon.html');
  const browser = await chromium.launch();

  for (const out of OUTPUTS) {
    const context = await browser.newContext({
      viewport: { width: 512, height: 512 },
      // Scale up to the target size by using deviceScaleFactor (crisp antialiasing)
      deviceScaleFactor: out.size / 512,
    });
    const page = await context.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const outPath = path.resolve(ROOT, out.file);
    await page.screenshot({ path: outPath, omitBackground: true, type: 'png' });
    await context.close();
    console.log(`✅ ${out.file} — ${out.size}x${out.size}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
