// PARANOIA — doomsday (Nike-style rebuild). Pure function of time: window.seek(t) paints frame t.
// Plan: docs/shotlist.md. Timing in beats (u) on beats.json (96 bpm grid; the film is silent).
// The art comes from the vectors inside doomsday.ai (tools/aiparse.py + airender.mjs).
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';

const { W, H, E, prog, lerp, springU, SPRING, fill, zoomAbout, clamp } = M;
const THREE = G.THREE;

const C = { paper: '#ffffff', ink: '#0b0b0c', ember: '#ff5a1f', studio: '#e7e5e0', mist: '#c6c2ba' };
const DISPLAY = 'Display';
const F30 = 1 / 30;
const logZoom = (p, a, b) => a * (b / a) ** p;
const fontS = (size, weight, family, stretch = 'normal') => `${Math.round(weight)} ${stretch} ${Math.round(size)}px ${family}`;

// ------------------------------------------------------------------ helpers
// a full-frame Stories photo, zoomed about an image point
function photo(ctx, im, s, [px, py] = [W / 2, H / 2]) {
  ctx.save(); zoomAbout(ctx, s, px, py); ctx.drawImage(im, 0, 0, W, H); ctx.restore();
}
// a vector render (any size): point (fx, fy) of the image (0..1) placed at the frame centre,
// image height = h * zoom
function vec(ctx, im, fx, fy, h, zoom = 1, cx = W / 2, cy = H / 2) {
  const s = (h * zoom) / im.height;
  ctx.drawImage(im, cx - fx * im.width * s, cy - fy * im.height * s, im.width * s, im.height * s);
}
function words(ctx, str, cx, base, size, color, weight = 800, stretch = 'condensed') {
  ctx.font = fontS(size, weight, DISPLAY, stretch);
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(str, cx, base); ctx.textAlign = 'left';
}

// ------------------------------------------------------------------ 1 manifesto (u 0-4)
function manifesto(ctx, u) {
  fill(ctx, C.paper);
  const size = 250, y0 = 760;
  if (u >= 0) words(ctx, 'make', W / 2, y0, size, C.ink);
  if (u >= 1) words(ctx, 'a deal', W / 2, y0 + size * 0.95, size, C.ink);
  if (u >= 2) words(ctx, 'with the devil.', W / 2, y0 + size * 1.9, size * 0.78, C.ember);
}

// ------------------------------------------------------------------ 2-4 Stories 1 (u 4-15)
const S1 = { print: [560, 1010], wing: [430, 900], sticker: [215, 200] };
function back(ctx, u, IMG) {
  fill(ctx, C.ink);
  if (u < 10) {
    photo(ctx, IMG.s1, logZoom(prog(u, 4, 10), 1, 1.08));
    // "doomsday" revealed upward from its baseline at beat 6
    const k = E.outExpo(prog(u, 6, 6.4));
    if (k > 0) {
      ctx.font = fontS(100, 800, DISPLAY, 'condensed');
      const size = (100 * 960) / ctx.measureText('doomsday').width, base = H - 470;
      ctx.save(); ctx.beginPath(); ctx.rect(0, base - size * 0.8 * k, W, size * 0.8 + 40); ctx.clip();
      words(ctx, 'doomsday', W / 2, base + (1 - k) * 60, size, C.paper, 800, 'condensed');
      ctx.restore();
    }
  } else if (u < 13) {
    const i = Math.floor(u - 10), p = u - 10 - i;
    const [pt, z] = [[S1.print, 2.4], [S1.wing, 3.0], [S1.sticker, 2.6]][i];
    photo(ctx, IMG.s1, z * logZoom(p, 1, 1.06), pt);
  } else {
    const p = prog(u, 13, 15);
    photo(ctx, IMG.s1, logZoom(p ** 2.4, 1, 22), S1.print);
  }
}

// ------------------------------------------------------------------ 5 vertigo (three.js)
const S = {};
const FOV0 = 40, FRAME_H = 15;
function wordTexture(str, color) {
  const tex = G.canvasTexture(2400, 520);
  tex.draw((c, w, h) => {
    c.font = fontS(420, 800, DISPLAY, 'condensed');
    const s = (w * 0.98) / c.measureText(str).width;
    c.font = fontS(420 * s, 800, DISPLAY, 'condensed');
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(str, w / 2, h / 2);
  });
  return tex;
}
function plane(map, w, h, order) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }));
  m.renderOrder = order;
  return m;
}
function vertigoSet(IMG) {
  const scene = new THREE.Scene(), camera = G.camera(FOV0, 0.05, 600);
  const word = wordTexture('doomsday', C.mist);
  // six planes of type in depth, alternating above / below the creature: during the dolly zoom
  // the far ones swell out from behind it, the near ones barely move — the vertigo you can see
  for (let k = 0; k < 6; k++) {
    const z = -4 - k * 7, y = (k % 2 ? -1 : 1) * (5.6 + k * 0.9);
    const w = 9 + k * 4.2;
    const m = plane(word, w, w * (520 / 2400), k);
    m.position.set(0, y, z);
    scene.add(m);
  }
  const t = new THREE.Texture(IMG.goat); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  const gh = 10.5, goat = plane(t, gh * (IMG.goat.width / IMG.goat.height), gh, 10);
  scene.add(goat);
  return {
    scene, camera,
    update(tt, u, o) {
      camera.fov = o.fov ?? G.dollyFov(FOV0, FRAME_H / (2 * Math.tan((FOV0 * Math.PI) / 360)), o.d);
      camera.updateProjectionMatrix();
      G.lookFrom(camera, [o.tx, o.ty, o.d], [o.tx, o.ty, 0], 0);
    },
  };
}
const D0 = FRAME_H / (2 * Math.tan((FOV0 * Math.PI) / 360));   // distance where the frame is FRAME_H tall
function vertigo(ctx, u, t) {
  fill(ctx, C.studio);
  let d, fov, tx = 0, ty = 0;
  const ribs = [0.4, -0.6];                                       // world point on the goat's ribs
  if (u < 16) {                                                   // continues the zoom-through: pull out
    const p = E.outQuint(prog(u, 15, 16));
    d = logZoom(p, 1.2, 6); fov = G.dollyFov(FOV0, D0, 6);
    tx = lerp(ribs[0], 0, p); ty = lerp(ribs[1], 0, p);
  } else {
    d = logZoom(E.inOutSine(prog(u, 16, 23.6)), 6, 42);           // VERTIGO: goat holds, type collapses
  }
  G.renderSet(ctx, S.vertigo, t, u, { d, fov, tx, ty });
}

// ------------------------------------------------------------------ 6 Stories 2 (u 24-30)
const S2 = { chest: [688, 692], face: [560, 300] };
function front(ctx, u, IMG) {
  fill(ctx, C.ink);
  if (u >= 28 && u < 29) photo(ctx, IMG.s2, 2.8 * logZoom(u - 28, 1, 1.06), S2.chest);
  else if (u >= 29) photo(ctx, IMG.s2, 1.8 * logZoom(u - 29, 1, 1.05), S2.face);
  else photo(ctx, IMG.s2, logZoom(prog(u, 24, 28), 1, 1.07));
}

// ------------------------------------------------------------------ 7 white card (reference beats)
function whiteCard(ctx, t, t0) {
  const dt = t - t0;
  const hand = () => {
    ctx.fillStyle = '#111'; ctx.textBaseline = 'top';
    ctx.font = M.font(160, 400, 'Letter'); ctx.fillText('dooms', 470, 880); ctx.fillText('day', 300, 1180);
    ctx.font = M.font(120, 400, 'Letter'); ctx.fillText('make a deal.', 200, 1460);
    ctx.textBaseline = 'alphabetic';
  };
  if (dt < 4 * F30) { fill(ctx, '#ececec'); hand(); return; }
  if (dt < 8 * F30) { fill(ctx, '#ffffff'); ctx.save(); ctx.translate(-645, -2794); ctx.scale(2.3, 2.3); hand(); ctx.restore(); return; }
  fill(ctx, dt < 9 * F30 ? '#c4c4c4' : '#ffffff');
  ctx.save();
  ctx.translate(dt >= 11 * F30 ? -220 : -110, -210);
  ctx.font = M.font(720, 400, 'Brush'); ctx.textBaseline = 'top'; ctx.lineJoin = 'round'; ctx.lineWidth = 24;
  ['dooms', 'day'].forEach((w, i) => {
    ctx.save(); ctx.translate(0, i * 561); ctx.scale(0.7, 1);
    ctx.fillStyle = ctx.strokeStyle = C.ink; ctx.strokeText(w, 0, 0); ctx.fillText(w, 0, 0);
    if (i === 1) { const x = ctx.measureText(w).width; ctx.fillStyle = ctx.strokeStyle = C.ember; ctx.strokeText('*', x, 0); ctx.fillText('*', x, 0); }
    ctx.restore();
  });
  ctx.restore(); ctx.textBaseline = 'alphabetic';
}

// ------------------------------------------------------------------ 8 the print, hero (u 31.5-40)
const DETAILS = [
  [0.74, 0.22, 3.2],   // head
  [0.50, 0.50, 2.6],   // ribs + arrows
  [0.16, 0.74, 3.0],   // ember flames
  [0.47, 0.93, 4.0],   // asterisk
  [0.38, 0.06, 3.4],   // logo
];
function printHero(ctx, u, IMG) {
  fill(ctx, C.ink);
  if (u < 35) {
    const k = springU(u, 31.5, SPRING.gentle);
    vec(ctx, IMG.print, 0.5, 0.5, 1500, lerp(0.94, 1, k) * logZoom(prog(u, 31.5, 35), 1, 1.06));
    return;
  }
  const i = clamp(Math.floor(u - 35), 0, 4), p = u - 35 - i;
  const [fx, fy, z] = DETAILS[i];
  vec(ctx, IMG.print, fx, fy, 1500, z * logZoom(p, 1, 1.07));
}

// ------------------------------------------------------------------ 9 five faces + 10 end card
const FACES = [['Typewriter', 700, 'normal', C.ink], ['UI', 700, 'normal', C.ink], ['Slab', 800, 'normal', C.ember],
  ['Hand', 700, 'normal', C.ink], [DISPLAY, 800, 'expanded', C.ink]];
function faces(ctx, u) {
  fill(ctx, C.paper);
  const [fam, wt, st, col] = FACES[clamp(Math.floor((u - 40) / 0.4), 0, 4)];
  ctx.font = fontS(100, wt, fam, st);
  const size = Math.min(260, (100 * 880) / ctx.measureText('doomsday').width);
  ctx.font = fontS(size, wt, fam, st);
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('doomsday', W / 2, H / 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function endCard(ctx, u, IMG) {
  fill(ctx, C.ink);
  const w = 560 * logZoom(prog(u, 42, 48), 1, 1.02);
  const h = (w * IMG.logo.height) / IMG.logo.width;
  ctx.drawImage(IMG.logo, (W - w) / 2, (H - h) / 2, w, h);
}

// ------------------------------------------------------------------ film
M.film({
  fonts: [fontS(100, 800, DISPLAY, 'condensed'), M.font(40, 700, 'UI'), M.font(100, 700, 'Typewriter'), M.font(100, 800, 'Slab'),
    M.font(100, 700, 'Hand'), M.font(100, 400, 'Letter'), M.font(100, 400, 'Brush')],
  images: {
    s1: 'assets/s1.jpg', s2: 'assets/s2.jpg', logo: 'assets/logo.png',
    goat: 'assets/vector/goat_full.png', print: 'assets/vector/print_full.png',
  },
  hits: [],
  samples: (t) => { const u = M.U(t); return u >= 15 && u < 24 ? 4 : 8; },
  async init(ctx, IMG) {
    await G.initGL();
    S.vertigo = vertigoSet(IMG);
  },
  draw(ctx, u, t, IMG) {
    if (u < 4) manifesto(ctx, u);
    else if (u < 15) back(ctx, u, IMG);
    else if (u < 24) vertigo(ctx, u, t);
    else if (u < 30) front(ctx, u, IMG);
    else if (u < 31.5) whiteCard(ctx, t, M.TS(30));
    else if (u < 40) printHero(ctx, u, IMG);
    else if (u < 42) faces(ctx, u);
    else endCard(ctx, u, IMG);
  },
});
