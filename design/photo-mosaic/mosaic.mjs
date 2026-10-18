// Builds the photography page mosaic for one set (colour, bw, ...).
//
//   npm run mosaic -- colour
//
// Reads design/photo-mosaic/<set>/order.txt (photo numbers, comma separated,
// first = wide tile) and writes public/images/photography/mosaic-<set>.jpg
// (2056px) and mosaic-<set>-1028.jpg (phones and ordinary screens).
// Layout: 3 columns, the first photo spans two, rows as needed (8 photos → 3x3).
// Photos are centre-cropped to square tiles by the browser (object-fit: cover).
// A photo can choose its crop: "08@right" keeps the right side, "03@top 1.15"
// zooms 15% towards the top. 500px photos carry a faint "500px" mark in the
// bottom-left corner: crop or zoom it out of the tile (originals have none).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const set = process.argv[2];
if (!set) { console.error('usage: npm run mosaic -- <set>   (e.g. colour)'); process.exit(1); }

const order = readFileSync(`${here}${set}/order.txt`, 'utf8').trim().split(/\s*,\s*/).map(entry => {
  const [file, crop = 'center'] = entry.split('@');
  const [, pos = crop, scale = '1'] = crop.match(/^(.*?)\s+([\d.]+)$/) ?? [];
  return { file, pos, scale };
});
const uri = f => 'data:image/jpeg;base64,' + readFileSync(`${here}${set}/${f}.jpg`).toString('base64');
const tile = ({ file, pos, scale }) =>
  `<div><img src="${uri(file)}" style="object-position: ${pos}; transform: scale(${scale}); transform-origin: ${pos}"></div>`;
const rows = Math.ceil((order.length + 1) / 3);
const out = `${here}../../public/images/photography/mosaic-${set}`;

const browser = await chromium.launch({ channel: 'chrome' });
// tile size and gap: full size, then half for the small version
for (const [size, gap, suffix] of [[680, 8, ''], [340, 4, '-1028']]) {
  const w = 3 * size + 2 * gap, h = rows * size + (rows - 1) * gap;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  // local images are embedded: setContent pages cannot load file:// URLs
  await page.setContent(`<style>
    body { margin: 0; }
    .m { width: ${w}px; height: ${h}px; display: grid; gap: ${gap}px; background: #f8f8f6;
         grid-template-columns: repeat(3, ${size}px); grid-template-rows: repeat(${rows}, ${size}px); }
    .m > div { overflow: hidden; }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .m > div:first-child { grid-column: span 2; }
  </style><div class="m">${order.map(tile).join('')}</div>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}${suffix}.jpg`, type: 'jpeg', quality: 82 });
  console.log(`mosaic-${set}${suffix}.jpg  ${w}x${h}`);
  await page.close();
}
await browser.close();
