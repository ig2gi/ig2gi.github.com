// Downloads photos from 500px photo pages into a set folder, numbered from <start>.
//
//   node design/photo-mosaic/px-get.mjs <set> <start> <500px photo url>...
//   e.g. node design/photo-mosaic/px-get.mjs colour 9 https://500px.com/photo/...
//
// 500px pages are drawn by JavaScript, so a real browser reads the image address.
// 500px serves at most 1024px; replace a file with the original to get sharper tiles.
// Prints one line per photo to paste into <set>/sources.txt.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const [set, start, ...urls] = process.argv.slice(2);
if (!set || !start || !urls.length) { console.error('usage: node px-get.mjs <set> <start> <url>...'); process.exit(1); }
mkdirSync(`${here}${set}`, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
let i = +start;
for (const url of urls) {
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
  const src = await page.evaluate(() => [...document.images]
    .find(img => img.currentSrc.includes('cdn-resize-prod-com.500px.cloud/photo/') && img.naturalWidth > 500)?.currentSrc);
  if (!src) { console.error('no photo found:', url); continue; }
  const title = (await page.title()).replace(/ \| .*$/, '');
  const name = String(i++).padStart(2, '0') + '.jpg';
  writeFileSync(`${here}${set}/${name}`, Buffer.from(await (await fetch(src)).arrayBuffer()));
  console.log(`${name} ${url}  ${title}`);
}
await browser.close();
