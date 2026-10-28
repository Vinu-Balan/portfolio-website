// Generates public/og-image.jpg (1200x630 title-scene screenshot) and
// public/apple-touch-icon.png (180x180) from the production build in dist/.
// Usage: npm run build && npm run og
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const OG = { width: 1200, height: 630 };
const ICON_SIZE = 180;
const PORT = 4180;
const SETTLE_MS = 1200;
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

const server = await preview({ preview: { port: PORT, strictPort: true }, base: '/' });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: OG });
  await page.goto(`http://localhost:${PORT}/?mode=world&freeze=1&quality=high`);
  await page.waitForSelector('body[data-state="title"]', { timeout: 30_000 });
  await page.waitForTimeout(SETTLE_MS);
  // JPEG keeps the share image small; social previews do not need lossless PNG.
  await page.screenshot({ path: out('og-image.jpg'), type: 'jpeg', quality: 82 });
  console.log('Wrote public/og-image.jpg');
  // The 3D page keeps the GPU process busy; close it before the next capture.
  await page.close();

  // Rasterise the favicon SVG on a canvas; headless screenshots of tiny pages are unreliable.
  const svg = readFileSync(out('favicon.svg'), 'utf8');
  const iconPage = await browser.newPage();
  const dataUrl = await iconPage.evaluate(
    async ({ source, size }) => {
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      context.fillStyle = '#2a1b12';
      context.fillRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);
      return canvas.toDataURL('image/png');
    },
    { source: svg, size: ICON_SIZE },
  );
  writeFileSync(out('apple-touch-icon.png'), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('Wrote public/apple-touch-icon.png');
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
