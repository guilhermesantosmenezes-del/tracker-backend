// render AI vector tree (from aiparse.py) with Chromium canvas
// node airender.mjs tree.json out.png --scale 0.1 [--groups 1,2,3] [--bbox x0,y0,x1,y1] [--labels] [--transparent]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/user/tracker-backend/noop.js');
const { chromium } = require('playwright');
const a = process.argv.slice(2);
const opt = (n, d) => { const i = a.indexOf('--' + n); return i >= 0 ? a[i + 1] : d; };
const tree = JSON.parse(fs.readFileSync(a[0], 'utf8'));
const groups = opt('groups') ? opt('groups').split(',').map(Number) : tree.kids.map((_, i) => i);
let bb = opt('bbox') ? opt('bbox').split(',').map(Number) : null;
if (!bb) {
  bb = [1e9, 1e9, -1e9, -1e9];
  for (const i of groups) { const b = tree.kids[i].bbox; if (!b) continue; bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
}
const scale = Number(opt('scale', 0.1));
const W = Math.ceil((bb[2] - bb[0]) * scale), H = Math.ceil((bb[3] - bb[1]) * scale);
const items = [];
const walk = (n, gi) => { if (n.type === 'p') items.push([n.d, n.fill, n.stroke, n.lw, gi]); else n.kids.forEach((k) => walk(k, gi)); };
groups.forEach((i) => walk(tree.kids[i], i));
const labels = a.includes('--labels') ? groups.map((i) => [i, tree.kids[i].bbox]).filter((x) => x[1]) : [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.setContent('<canvas id=c></canvas>');
const data = await page.evaluate(async ({ items, W, H, bb, scale, labels, transparent }) => {
  const c = document.getElementById('c'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  if (!transparent) { g.fillStyle = '#7a9a7a'; g.fillRect(0, 0, W, H); }
  g.setTransform(scale, 0, 0, -scale, -bb[0] * scale, bb[3] * scale);
  const col = (v) => `rgb(${v.map((x) => Math.round(x * 255)).join(',')})`;
  for (const [d, f, s, lw] of items) {
    const p = new Path2D(d);
    if (f) { g.fillStyle = col(f); g.fill(p, 'evenodd'); }
    if (s) { g.strokeStyle = col(s); g.lineWidth = lw; g.stroke(p); }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = 'bold 22px sans-serif';
  for (const [i, b] of labels) { const x = (b[0] - bb[0]) * scale, y = (bb[3] - b[3]) * scale; g.fillStyle = '#ff00ff'; g.fillText(String(i), x + 2, y + 20); g.strokeStyle = '#ff00ff'; g.strokeRect(x, y, (b[2] - b[0]) * scale, (b[3] - b[1]) * scale); }
  return c.toDataURL('image/png');
}, { items, W, H, bb, scale, labels, transparent: a.includes('--transparent') });
fs.writeFileSync(a[1], Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
console.log(a[1], W, H, items.length, 'paths', 'bbox', bb.map(Math.round).join(','));
