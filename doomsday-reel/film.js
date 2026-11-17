// PARANOIA — doomsday · Nike-style launch reel. Pure function of time: window.seek(t) paints frame t.
// Timing is in beats (u) on beats.json (128 bpm); docs/shotlist.md is the approved plan.
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';

const { W, H, E, prog, lerp, springU, SPRING, fill, zoomAbout, clamp } = M;
const THREE = G.THREE;

// ------------------------------------------------------------------ design DNA
const C = { paper: '#ffffff', ink: '#0b0b0c', ember: '#e4532b', grey: '#d9d6d0' };
const DISPLAY = 'Display', UI = 'UI';
const logZoom = (p, a, b) => a * (b / a) ** p;              // constant-rate dolly
const F30 = 1 / 30;

// art-space points (px in the 1080x1920 Stories)
const P = {
  s1print: [560, 1010], s1sticker: [215, 200],
  s2chest: [688, 692], s2face: [560, 300],
  eye: [757, 705], ribs: [600, 1000], flames: [240, 580], title: [520, 440], wing: [350, 800],
};

// ------------------------------------------------------------------ hits (picture + sound)
const HITS = [
  [0, 'hook: doomsday slams', 'impact'],
  [0.5, 'goat lands', 'thud', { pitch: 70, to: 45 }],
  ...Array.from({ length: 12 }, (_, i) => [2 + i * 0.5, `montage cut ${i + 1}`, i % 3 === 2 ? 'thud' : 'click']),
  [7.25, 'riser into the drop', 'riser', { len: 1.6 }],
  [8, 'drop: stories 1', 'impact'],
  [10, 'punch: print', 'click'], [12, 'punch: print close', 'click'], [13, 'punch: sticker', 'click'],
  [15.9, 'zoom-through the print', 'whoosh', { len: 0.6, from: 400, to: 3000 }],
  [16, 'vertigo opens', 'sub', { len: 1.2 }],
  [18, 'type plane swap', 'tick'], [20, 'type plane swap', 'tick'], [22, 'type plane swap', 'tick'], [24, 'type plane swap', 'tick'],
  [27.9, 'into the eye', 'whoosh', { len: 0.5, from: 600, to: 4000 }],
  [28, 'white card', 'click'], [28.28, 'card zoom', 'click'], [28.57, 'brush', 'thud', { pitch: 90, to: 50 }],
  [30, 'stories 2', 'impact'],
  [32, 'punch: chest', 'click'], [34, 'punch: face', 'click'], [35, 'ember wipe', 'whoosh', { len: 0.4, from: 2400, to: 600 }],
  [37.9, 'zoom-through the chest', 'whoosh', { len: 0.6, from: 400, to: 3000 }],
  [38, 'fly-through', 'sub', { len: 1 }],
  ...[39, 40, 41, 42, 43].map((b) => [b, 'tile passes', 'whoosh', { len: 0.25, from: 1800, to: 500 }]),
  [44.5, 'vertigo snap', 'impact'],
  [46, 'white card 2', 'click'], [46.28, 'card zoom', 'click'], [46.57, 'brush', 'thud', { pitch: 90, to: 50 }],
  [48, 'the art', 'impact'],
  [50, 'panel 1', 'click'], [51, 'panel 2', 'click'], [52, 'panel 3', 'click'],
  [53.9, 'into the eye', 'whoosh', { len: 0.6, from: 400, to: 3600 }],
  [54, 'reverse vertigo', 'sub', { len: 1.4 }],
  [58, 'face 1', 'tick'], [58.5, 'face 2', 'tick'], [59, 'face 3', 'tick'], [59.5, 'face 4', 'tick'], [60, 'face 5', 'tick'],
  [60.5, 'logo', 'impact'],
];

// ------------------------------------------------------------------ 2-D helpers
// full-frame Stories image, zoomed about an art-space point
function frame(ctx, im, s = 1, [px, py] = [W / 2, H / 2], dx = 0) {
  ctx.save();
  ctx.translate(dx, 0);
  zoomAbout(ctx, s, px, py);
  ctx.drawImage(im, 0, 0, W, H);
  ctx.restore();
}
// the fixed PARANOIA logo, centred, never animated
function logo(ctx, IMG, w = 600) {
  const h = (w * IMG.logo.height) / IMG.logo.width;
  ctx.drawImage(IMG.logo, (W - w) / 2, (H - h) / 2, w, h);
}
// font string with the width axis inside it (setting ctx.font resets ctx.fontStretch)
const fontS = (size, weight, family, stretch = 'normal') => `${Math.round(weight)} ${stretch} ${Math.round(size)}px ${family}`;
function setFont(ctx, size, weight, family, stretch = 'normal') {
  ctx.font = fontS(size, weight, family, stretch);
}
function fitText(ctx, str, weight, family, stretch, maxW, max) {
  setFont(ctx, 100, weight, family, stretch);
  return Math.min(max, (100 * maxW) / ctx.measureText(str).width);
}
// small UI label, bottom-left inside the 9:16 safe area
function label(ctx, str, color = C.paper, bg = C.ink) {
  setFont(ctx, 46, 700, UI);
  const w = ctx.measureText(str).width;
  ctx.fillStyle = bg; ctx.fillRect(72, H - 530, w + 44, 74);
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(str, 94, H - 493);
  ctx.textBaseline = 'alphabetic';
}
// a word that slams in per glyph (130% -> 100%, snappy spring), centred at (cx, base)
function slam(ctx, u, u0, str, cx, base, size, color, stretch = 'expanded', weight = 900, stagger = 0.04) {
  const f = fontS(size, weight, DISPLAY, stretch);
  ctx.font = f;
  const total = ctx.measureText(str).width;
  let x = cx - total / 2;
  [...str].forEach((ch, i) => {
    const w = ctx.measureText(ch).width;
    const k = springU(u, u0 + i * stagger, SPRING.snappy);
    if (k > 0) {
      const s = lerp(1.3, 1, k);
      M.glyph(ctx, ch, x + w / 2, base, f, color, s, s);
    }
    x += w;
  });
}

// ------------------------------------------------------------------ S1 hook  (u 0-2)
function hook(ctx, u, IMG) {
  fill(ctx, C.paper);
  const push = logZoom(prog(u, 0, 2), 1, 1.04);
  ctx.save(); zoomAbout(ctx, push, W / 2, H / 2);
  // Nike-style: the word is bigger than the frame and bleeds off both edges
  const size = fitText(ctx, 'dooms', 900, DISPLAY, 'ultra-condensed', 1020, 760) * 1.22;
  slam(ctx, u, -0.2, 'dooms', W / 2, 900, size, C.ink, 'ultra-condensed');
  slam(ctx, u, 0.05, 'day', W / 2, 900 + size * 0.84, size * 1.25, C.ember, 'ultra-condensed');
  // the creature lands IN FRONT of the type
  const k = springU(u, 0.25, SPRING.bouncy);
  if (k > 0) {
    ctx.save();
    ctx.translate(0, (1 - k) * 700);
    zoomAbout(ctx, 1.12, W / 2, 1000);
    ctx.drawImage(IMG.flames, 0, 0, W, H);
    ctx.drawImage(IMG.goat, 0, 0, W, H);
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ S2 flash montage  (u 2-8)
const MONTAGE = [
  { im: 's3', at: P.eye, z: 3.2 },
  { im: 's1', at: P.s1print, z: 2.2 },
  { word: 'make', bg: C.ember, fg: C.paper },
  { im: 's3', at: P.ribs, z: 2.6 },
  { im: 's2', at: P.s2face, z: 2.0 },
  { im: 's3', at: P.flames, z: 3.0 },
  { word: 'a deal', bg: C.ember, fg: C.paper },
  { im: 's3', at: P.wing, z: 2.2 },
  { whip: ['s1', 's2'] },
  { im: 's3', at: P.title, z: 1.7 },
  { sticker: true },
  { word: 'with the devil', bg: C.ink, fg: C.ember },
];
function montage(ctx, u, IMG) {
  const i = clamp(Math.floor((u - 2) / 0.5), 0, MONTAGE.length - 1);
  const p = (u - 2 - i * 0.5) / 0.5;
  const s = MONTAGE[i];
  if (s.word) {
    fill(ctx, s.bg);
    const size = fitText(ctx, s.word, 900, DISPLAY, 'expanded', 960, 330);
    slam(ctx, u, 2 + i * 0.5 - 0.05, s.word, W / 2, H / 2 + size * 0.35, size, s.fg, 'expanded', 900, 0.02);
  } else if (s.whip) {
    // whip: both shots on screen, A slides out as B slides in
    const k = E.inOutCubic(p);
    frame(ctx, IMG[s.whip[0]], 1.05, [W / 2, H / 2], -k * W);
    frame(ctx, IMG[s.whip[1]], 1.05, [W / 2, H / 2], (1 - k) * W);
  } else if (s.sticker) {
    fill(ctx, C.paper);
    const k = springU(u, 2 + i * 0.5, SPRING.bouncy);
    ctx.save(); zoomAbout(ctx, lerp(0.9, 1.45, k), W / 2, 980);
    ctx.drawImage(IMG.flames, 0, 0, W, H); ctx.drawImage(IMG.goat, 0, 0, W, H);
    ctx.restore();
  } else {
    fill(ctx, C.ink);
    frame(ctx, IMG[s.im], s.z * logZoom(p, 1, 1.06), s.at);
  }
}

// ------------------------------------------------------------------ photo holds (S3 / S6)
// punch-ins: [[u0, u1, point, zoom], ...]; zoom-through into `into` over [z0, z1]
function photo(ctx, u, IMG, im, u0, punches, into, z0, z1, labelText) {
  fill(ctx, C.ink);
  const enter = springU(u, u0, SPRING.snappy);
  let s = logZoom(prog(u, u0, z0), 1.06, 1.0) * lerp(1.08, 1, enter);
  let at = [W / 2, H / 2];
  for (const [a, b, pt, z] of punches) if (u >= a && u < b) { s = z; at = pt; }
  if (u >= z0) {
    const p = prog(u, z0, z1);
    s = logZoom(p ** 2.4, 1, 18);
    at = into;
  }
  frame(ctx, IMG[im], s, at);
  if (u < z0) {
    if (labelText) label(ctx, labelText);
    logo(ctx, IMG);
  }
}

// ember split wipe across the bottom half of S2 (beat 35)
function emberWipe(ctx, u) {
  const k = E.outQuint(prog(u, 35, 35.5)), out = E.inCubic(prog(u, 36.4, 37));
  if (k <= 0 || out >= 1) return;
  const x = lerp(-W, 0, k) + out * W;
  ctx.fillStyle = C.ember; ctx.fillRect(x, H * 0.62, W, H * 0.16);
  setFont(ctx, 120, 900, DISPLAY, 'expanded');
  ctx.fillStyle = C.paper; ctx.textBaseline = 'middle';
  ctx.fillText('bad vibeeees', x + 60, H * 0.70);
  ctx.textBaseline = 'alphabetic';
}

// ------------------------------------------------------------------ white cards (reference beats)
function whiteCard(ctx, t, t0, lines) {
  const dt = t - t0;
  if (dt < 4 * F30) {                                  // A: thin hand lettering, staggered, grey paper
    fill(ctx, '#ececec');
    handLettering(ctx, lines);
  } else if (dt < 8 * F30) {                           // B: hard zoom, sliced by the top edge
    fill(ctx, '#ffffff');
    ctx.save(); ctx.translate(-645, -2794); ctx.scale(2.3, 2.3); handLettering(ctx, lines); ctx.restore();
  } else {                                             // C: giant brush bleeding off every edge
    fill(ctx, dt < 9 * F30 ? '#c4c4c4' : '#ffffff');
    const dx = dt >= 11 * F30 ? -110 : 0;
    ctx.save();
    ctx.translate(-110 + dx, -210);
    setFont(ctx, 720, 400, 'Brush');
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round'; ctx.lineWidth = 24;
    [['dooms', C.ink], ['day', C.ink]].forEach(([w, col], i) => {
      ctx.save(); ctx.translate(0, i * 561); ctx.scale(0.7, 1);
      ctx.strokeStyle = col; ctx.fillStyle = col;
      ctx.strokeText(w, 0, 0); ctx.fillText(w, 0, 0);
      if (i === 1) {
        const wd = ctx.measureText(w).width;
        ctx.fillStyle = C.ember; ctx.strokeStyle = C.ember;
        ctx.strokeText('*', wd, 0); ctx.fillText('*', wd, 0);
      }
      ctx.restore();
    });
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }
}
function handLettering(ctx, lines) {
  ctx.fillStyle = '#111'; ctx.textBaseline = 'top';
  setFont(ctx, 160, 400, 'Letter'); ctx.fillText(lines[0], 470, 880); ctx.fillText(lines[1], 300, 1180);
  setFont(ctx, 120, 400, 'Letter'); ctx.fillText(lines[2], 200, 1460);
  ctx.textBaseline = 'alphabetic';
}

// ------------------------------------------------------------------ S9 the art, hero  (u 48-54)
const PANELS = [[P.eye, 2.6], [P.ribs, 2.2], [P.flames, 2.8]];
function artHero(ctx, u, IMG) {
  fill(ctx, C.ink);
  if (u < 50 || u >= 53) {
    const k = springU(u, 48, SPRING.snappy);
    let s = lerp(1.15, 1, k) * logZoom(prog(u, 48, 50), 1, 1.05), at = [W / 2, H / 2];
    if (u >= 53) { s = logZoom(prog(u, 53, 54) ** 2.4, 1, 20); at = P.eye; }
    frame(ctx, IMG.s3, s, at);
    return;
  }
  // three horizontal bands, one per beat, whipping in from alternating sides
  const bh = H / 3;
  ctx.save(); ctx.globalAlpha = 0.35; frame(ctx, IMG.s3, 1.05); ctx.restore();
  PANELS.forEach(([pt, z], i) => {
    const a = 50 + i;
    if (u < a) return;
    const k = E.outQuint(prog(u, a, a + 0.22));
    const dx = (i % 2 ? 1 : -1) * (1 - k) * W;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, i * bh, W, bh); ctx.clip();
    ctx.translate(dx, i * bh + bh / 2 - pt[1]);
    zoomAbout(ctx, z, pt[0], pt[1]);
    ctx.drawImage(IMG.s3, 0, 0, W, H);
    ctx.restore();
    ctx.fillStyle = C.ember; ctx.fillRect(0, (i + 1) * bh - 4, W, 8);
  });
}

// ------------------------------------------------------------------ finale  (u 58-60.5) + end card
const FACES = [
  ['Typewriter', 700, 'normal', C.ink], [UI, 700, 'normal', C.ink], ['Slab', 800, 'normal', C.ember],
  ['Hand', 700, 'normal', C.ink], [DISPLAY, 800, 'expanded', C.ink],
];
function finale(ctx, u) {
  fill(ctx, C.paper);
  const i = clamp(Math.floor((u - 58) / 0.5), 0, 4);
  const [fam, wt, st, col] = FACES[i];
  const size = fitText(ctx, 'doomsday', wt, fam, st, 900, 260);
  setFont(ctx, size, wt, fam, st);
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('doomsday', W / 2, H / 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function endCard(ctx, u, IMG) {
  fill(ctx, C.ember);
  const k = springU(u, 60.5, SPRING.snappy);
  const w = 640 * lerp(1.15, 1, k);
  logo(ctx, IMG, w);
}

// ------------------------------------------------------------------ 3-D sets
const S = {};
function texFromImage(im) {
  const t = new THREE.Texture(im);
  t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}
function flat(map, w, h, opts = {}) {
  const mat = new THREE.MeshBasicMaterial({ map, color: opts.color ?? 0xffffff, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.renderOrder = opts.order ?? 0;
  return m;
}
function solid(color) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), toneMapped: false, side: THREE.DoubleSide }); }
// a rectangular frame (corridor rib) — the perspective lines that make a dolly zoom read
function rib(w, h, t, mat) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, -h / 2);
  const hole = new THREE.Path(); hole.moveTo(-w / 2 + t, -h / 2 + t); hole.lineTo(-w / 2 + t, h / 2 - t); hole.lineTo(w / 2 - t, h / 2 - t); hole.lineTo(w / 2 - t, -h / 2 + t); hole.lineTo(-w / 2 + t, -h / 2 + t);
  s.holes.push(hole);
  return new THREE.Mesh(new THREE.ShapeGeometry(s), mat);
}
function wordTexture(str, color, stretch = 'expanded') {
  const tex = G.canvasTexture(2400, 560);  // word fills the height; width follows
  tex.draw((c, w, h) => {
    c.font = fontS(400, 900, DISPLAY, stretch);
    const s = Math.min(1.3, (w * 0.96) / c.measureText(str).width);
    c.font = fontS(400 * s, 900, DISPLAY, stretch);
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(str, w / 2, h / 2);
  });
  return tex;
}
function tinted(im, color) {                 // the art's flames as a flat colour silhouette
  const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
  const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
  c.globalCompositeOperation = 'source-in'; c.fillStyle = color; c.fillRect(0, 0, cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// subject distance where the goat fills ~70% of the frame at fov 40
const FOV0 = 40, D0 = 18.3;
const WORDS = ['doomsday', 'make a deal', 'with the devil'];
function vertigoSet(IMG, { ribColor, wordColor, flameTex }) {
  const scene = new THREE.Scene(), camera = G.camera(FOV0, 0.05, 500);
  // a clean corridor of thin frames: the perspective lines that make the dolly zoom read
  for (let k = 0; k < 9; k++) {
    const m = rib(13.5, 24, 0.12, solid(ribColor));
    m.position.z = -3 - k * 5.5;
    scene.add(m);
  }
  // one giant word behind the creature, swapped every 2 beats
  const words = WORDS.map((w) => {
    const plane = flat(wordTexture(w, wordColor, 'ultra-condensed'), 1, 1, { order: 1 });
    const z = -12, height = 15;
    plane.scale.set(height * (2400 / 560), height, 1);
    plane.position.set(0, 0.6, z);
    scene.add(plane);
    return plane;
  });
  const flames = flat(flameTex, 10.8, 19.2, { order: 3 }); flames.position.z = -0.3; scene.add(flames);
  const goat = flat(texFromImage(IMG.goat), 10.8, 19.2, { order: 4 }); scene.add(goat);
  return {
    scene, camera,
    update(t, u, o) {
      const d = o.d;
      camera.fov = o.fov ?? G.dollyFov(FOV0, D0, d);
      camera.updateProjectionMatrix();
      G.lookFrom(camera, [o.tx ?? 0, o.ty ?? 0.2, d], [o.tx ?? 0, o.ty ?? 0.2, 0], o.roll ?? 0);
      words.forEach((m, i) => { m.visible = i === (o.word ?? 0); });
    },
  };
}

// fly-through: hard-edged crops of the art as product tiles on white
const TILES = [
  { box: [600, 560, 900, 840], x: 2.2, y: 1.6, z: -4 },     // head
  { box: [180, 600, 560, 1020], x: -2.6, y: 0.4, z: -12 },  // wing
  { box: [150, 370, 900, 520], x: 0.4, y: 3.6, z: -20 },    // lettering
  { box: [430, 880, 760, 1150], x: 2.4, y: -2.2, z: -27 },  // ribs
  { box: [170, 500, 330, 680], x: -2.8, y: 2.8, z: -33 },   // flame
  { box: [250, 1080, 560, 1440], x: -1.8, y: -2.6, z: -39 },// legs
  { box: [380, 520, 660, 650], x: 0.2, y: -0.6, z: -45 },   // logo in the art
  { box: [220, 1390, 830, 1570], x: 0.8, y: -3.4, z: -50 }, // make a deal
];
const FLY_END = -64;
function flySet(IMG) {
  const scene = new THREE.Scene(), camera = G.camera(52, 0.05, 500);
  TILES.forEach((p, i) => {
    const [x0, y0, x1, y1] = p.box, w = x1 - x0, h = y1 - y0;
    const cv = document.createElement('canvas'); cv.width = w + 24; cv.height = h + 24;
    const c = cv.getContext('2d');
    c.fillStyle = i % 3 === 1 ? C.ember : C.ink; c.fillRect(0, 0, cv.width, cv.height);
    c.drawImage(IMG.s3, x0, y0, w, h, 12, 12, w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = flat(t, (cv.width / 100) * 2.2, (cv.height / 100) * 2.2, { order: 2 });
    m.position.set(p.x, p.y, p.z); m.userData = { r0: (i % 2 ? 1 : -1) * 0.12, i };
    scene.add(m);
  });
  const end = new THREE.Group(); end.position.z = FLY_END;
  for (let k = 0; k < 7; k++) {
    const m = rib(13.5, 24, 0.12, solid(C.ember)); m.position.z = -3 - k * 5.5; end.add(m);
  }
  const fl = flat(texFromImage(IMG.flames), 10.8, 19.2, { order: 3 }); fl.position.z = -0.3; end.add(fl);
  end.add(flat(texFromImage(IMG.goat), 10.8, 19.2, { order: 4 }));
  scene.add(end);
  return {
    scene, camera,
    update(t, u, o) {
      scene.children.forEach((m) => { if (m.userData && m.userData.r0 !== undefined) m.rotation.z = m.userData.r0 + Math.sin(t * 1.2 + m.userData.i) * 0.04; });
      camera.fov = o.fov ?? G.dollyFov(52, o.d0 ?? 14, o.d);
      camera.updateProjectionMatrix();
      G.lookFrom(camera, [0, 0.2, FLY_END + o.d], [0, 0.2, FLY_END], o.roll ?? 0);
    },
  };
}

// ------------------------------------------------------------------ 3-D shots
function vertigoShot(ctx, u, t) {                          // u 16-28
  fill(ctx, C.paper);
  let d, fov, tx = 0, ty = 0.2;
  if (u < 17) { d = logZoom(E.outQuint(prog(u, 16, 17)), 2.2, 6); fov = G.dollyFov(FOV0, D0, 6); tx = lerp(0.3, 0, prog(u, 16, 17)); }
  else if (u < 26.5) d = logZoom(E.inOutSine(prog(u, 17, 26.5)), 6, 44);
  else {
    const p = E.inExpo(prog(u, 26.5, 28));
    const eye = [(P.eye[0] - 540) / 100, (960 - P.eye[1]) / 100];
    d = logZoom(p, 44, 0.4); fov = G.dollyFov(FOV0, D0, 44);
    tx = lerp(0, eye[0], E.outCubic(prog(u, 26.5, 27.6))); ty = lerp(0.2, eye[1], E.outCubic(prog(u, 26.5, 27.6)));
  }
  const word = clamp(Math.floor((u - 16) / 2), 0, 5) % 3;   // a type change every 2 beats
  G.renderSet(ctx, S.vertigo, t, u, { d, fov, tx, ty, roll: 0.05 * Math.sin(prog(u, 17, 26.5) * Math.PI), word });
}
function flyShot(ctx, u, t) {                              // u 38-46
  fill(ctx, C.paper);
  let d, fov;
  if (u < 44.5) { d = lerp(70, 14, E.inOutCubic(prog(u, 38, 44.5))); fov = 52; }
  else d = logZoom(E.inOutCubic(prog(u, 44.5, 46)), 14, 4.2);
  G.renderSet(ctx, S.fly, t, u, { d, fov, d0: 14, roll: 0.04 * Math.sin(u) });
}
function abyssShot(ctx, u, t) {                            // u 54-58: reverse vertigo on ember
  fill(ctx, C.ember);
  let d, fov, tx = 0, ty = 0.2;
  if (u < 54.6) {
    const p = E.outQuint(prog(u, 54, 54.6));
    const eye = [(P.eye[0] - 540) / 100, (960 - P.eye[1]) / 100];
    d = logZoom(p, 1.2, 44); fov = G.dollyFov(FOV0, D0, 44); tx = lerp(eye[0], 0, p); ty = lerp(eye[1], 0.2, p);
  } else d = logZoom(E.inOutSine(prog(u, 54.6, 58)), 44, 5);
  G.renderSet(ctx, S.abyss, t, u, { d, fov, tx, ty, roll: -0.06 * prog(u, 54.6, 58), word: clamp(Math.floor((u - 54) / 1.5), 0, 2) });
}

// ------------------------------------------------------------------ film
M.film({
  fonts: [M.font(100, 900, DISPLAY), M.font(40, 700, UI), M.font(100, 700, 'Typewriter'), M.font(100, 800, 'Slab'),
    M.font(100, 700, 'Hand'), M.font(100, 400, 'Letter'), M.font(100, 400, 'Brush')],
  images: {
    s1: 'assets/graded/s1.jpg', s2: 'assets/graded/s2.jpg', s3: 'assets/graded/s3.jpg',
    goat: 'assets/cutouts/goat.png', flames: 'assets/cutouts/flames.png', logo: 'assets/logo.png',
  },
  hits: HITS,
  samples: (t) => {
    const u = M.U(t);
    return (u >= 16 && u < 28) || (u >= 38 && u < 46) || (u >= 54 && u < 58) ? 4 : 10;
  },
  async init(ctx, IMG) {
    await G.initGL();
    const fl = texFromImage(IMG.flames);
    S.vertigo = vertigoSet(IMG, { ribColor: C.ember, wordColor: C.ink, flameTex: fl });
    S.abyss = vertigoSet(IMG, { ribColor: C.paper, wordColor: C.paper, flameTex: tinted(IMG.flames, C.paper) });
    S.fly = flySet(IMG);
  },
  draw(ctx, u, t, IMG) {
    if (u < 2) hook(ctx, u, IMG);
    else if (u < 8) montage(ctx, u, IMG);
    else if (u < 16) photo(ctx, u, IMG, 's1', 8, [[10, 10.5, P.s1print, 2.0], [12, 12.5, P.s1print, 2.6], [13, 13.5, P.s1sticker, 2.4]], P.s1print, 15, 16, 'doomsday · make a deal with the devil');
    else if (u < 28) vertigoShot(ctx, u, t);
    else if (u < 30) whiteCard(ctx, t, M.TS(28), ['dooms', 'day', 'make a deal.']);
    else if (u < 38) { photo(ctx, u, IMG, 's2', 30, [[32, 32.5, P.s2chest, 2.6], [34, 34.5, P.s2face, 2.0]], P.s2chest, 37, 38, 'paranoia · bad vibeeees'); if (u < 37) emberWipe(ctx, u); }
    else if (u < 46) flyShot(ctx, u, t);
    else if (u < 48) whiteCard(ctx, t, M.TS(46), ['dooms', 'day', 'with the devil.']);
    else if (u < 54) artHero(ctx, u, IMG);
    else if (u < 58) abyssShot(ctx, u, t);
    else if (u < 60.5) finale(ctx, u);
    else endCard(ctx, u, IMG);
  },
});
