/* Optional: export the live HTML/GSAP animation to an MP4 (1080x1920, 30 fps).
   The video is captured frame by frame from the same GSAP timeline.

   Requirements: Node 18+, `npm i playwright` (Chromium), ffmpeg in PATH.

   Usage:
     node tools/render.mjs                    -> out/paranoia-bad-vibes.mp4
     node tools/render.mjs --frames 0,90,300  -> PNG stills in out/frames/
     node tools/render.mjs --from 6 --to 9    -> only that range
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// CommonJS require honours NODE_PATH / global installs, ESM import does not
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.otf': 'font/otf', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}/index.html?render=1`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(url);
await page.waitForFunction(() => window.PARANOIA_READY === true, null, { timeout: 60000 });
const { FPS, DURATION } = await page.evaluate(() => ({ FPS: window.PARANOIA.FPS, DURATION: window.PARANOIA.DURATION }));

const shot = async (frame) => {
  await page.evaluate(t => window.PARANOIA.seek(t), frame / FPS);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.screenshot({ type: 'png' });
};

fs.mkdirSync(OUT, { recursive: true });

if (args.frames) {
  const dir = path.join(OUT, 'frames');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of String(args.frames).split(',').map(Number)) {
    fs.writeFileSync(path.join(dir, `f${String(f).padStart(4, '0')}.png`), await shot(f));
    console.log('frame', f);
  }
} else {
  const from = Math.round((Number(args.from) || 0) * FPS);
  const to = Math.round((Number(args.to) || DURATION) * FPS);
  const file = path.join(OUT, args.out || 'paranoia-bad-vibes.mp4');
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file],
  { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let f = from; f < to; f++) {
    const buf = await shot(f);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 30 === 0) process.stdout.write(`\r${(f / FPS).toFixed(1)}s / ${(to / FPS).toFixed(1)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('\n->', file);
}

await browser.close();
server.close();
