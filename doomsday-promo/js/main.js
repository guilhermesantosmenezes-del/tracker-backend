/* =========================================================
   PARANOIA — DOOMSDAY · master GSAP timeline (30.00 s)

   0.00  flash montage — details of the drawing, logo fixed on top
   1.00  Stories 1 (back print)       paper cut over black
   4.20  ZOOM-THROUGH into the print on the back
   4.50  HERO A  three.js VERTIGO — the drawing split in depth
   8.30  doomsday white card #1       (reference beats)
   8.63  Stories 2 (front)            paper cut lands on the card
  12.00  ZOOM-THROUGH into the chest print
  12.30  HERO B  corridor — camera flies through torn cut-outs of the
                 drawing, then vertigo-snaps on the creature
  16.40  doomsday white card #2
  16.73  Stories 3 (the art itself)   collage shards + paper cut
  20.40  ZOOM-THROUGH into the creature's eye
  20.70  HERO C  abyss — reverse VERTIGO, background tears away
  25.30  doomsday in 5 type styles, 6 frames each, no logo
  26.37  logo alone until the end
  30.00  end
   ========================================================= */
(() => {
  const FPS = 30;
  const F = 1 / FPS;
  const DURATION = 30;

  const params = new URLSearchParams(location.search);
  const RENDER = params.has('render');
  if (RENDER) document.body.classList.add('render');

  /* ---------- content ---------- */
  // graded (colour-noir) versions of the original Stories — see tools/prep_assets.py
  const SHOTS = [
    { src: 'assets/graded/s1.jpg', focus: [[560, 1000, 2.0], [215, 200, 2.6]], zoomInto: [560, 1010] },
    { src: 'assets/graded/s2.jpg', focus: [[690, 690, 2.6], [560, 300, 2.0]],  zoomInto: [688, 692] },
    { src: 'assets/graded/s3.jpg', focus: [[757, 705, 2.6], [600, 1000, 2.0], [240, 580, 2.8], [520, 440, 1.8]], zoomInto: [757, 712] },
  ];

  const INTRO = [  // [shot, type, focus, frames]
    [null, 'black', null, 3],
    [2, 'crop', 0, 4],
    [0, 'whip', null, 3],
    [2, 'crop', 2, 3],
    [1, 'card', null, 4],
    [2, 'crop', 1, 4],
    [2, 'whip-v', 3, 3],
    [0, 'crop', 0, 4],
    [null, 'black', null, 2],
  ];

  const CUTS = [
    { rect: [150, 560, 930, 1330], amp: 20, from: { x: -80, y: 1500, r: 24, s: 1.2 }, land: -3,
      fly: .40, hold: .30, expand: .42, tapes: [[.1, 0, -14], [.88, 1, 9]] },
    { rect: [-60, 690, 1140, 1230], amp: 18, from: { x: -1450, y: 60, r: -9, s: 1.04 }, land: -2.5,
      fly: .36, hold: .40, expand: .46, tapes: [[.06, .5, -86], [.94, .45, 84]] },
    { rect: [210, 520, 880, 1370], amp: 22, from: { x: 40, y: -1750, r: -16, s: 1.1 }, land: 2.5,
      fly: .36, hold: .34, expand: .44, mainDelay: .26, tapes: [[.5, 0, -4]],
      shards: [
        { rect: [560, 560, 980, 900],   amp: 18, from: { x: 1000, y: -260, r: 34, s: 1.1 }, land: 8, at: 0,   fly: .30, tapes: [[.85, .05, 30]] },
        { rect: [120, 1050, 600, 1500], amp: 18, from: { x: -1000, y: 520, r: -28, s: 1.1 }, land: -7, at: .12, fly: .30, tapes: [[.15, .95, -25]] },
      ] },
  ];

  const T = {
    shots: [1.00, 8.63, 16.73],
    zoom: [4.20, 12.00, 20.40],     // zoom-through cut starts
    hero: [4.50, 12.30, 20.70],
    heroEnd: [8.30, 16.40, 25.30],
    bv: [8.30, 16.40],
    finale: 25.30,
    styleDur: 0.20,
  };

  /* ---------- DOM ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const stage = $('#stage');
  const shakeEl = $('#shake');
  const scenesEl = $('#scenes');
  const logo = $('#logo');
  const grain = $('#grain');
  const haze = $('#haze');
  const flashEl = $('#flash');
  const clock = $('#clock');
  const heroEl = $('#hero');
  const cam = DD3D.cam;

  const pieces = [];
  const SHADOW = 'drop-shadow(0 22px 26px rgba(0,0,0,.7)) drop-shadow(0 4px 4px rgba(0,0,0,.55))';

  function div(cls, parent) {
    const d = document.createElement('div');
    d.className = cls;
    if (parent) parent.appendChild(d);
    return d;
  }

  function createPiece(parent, shot, cut, seed, textures, main) {
    const el = div('piece', parent);
    const paper = div('paper', el);
    const photo = div('photo', el);
    const img = new Image();
    img.src = shot.src;
    img.alt = '';
    img.decoding = 'sync';
    img.className = 'ph';
    photo.appendChild(img);
    paper.style.backgroundImage = `url(${textures.paper})`;
    div('dirt', photo).style.backgroundImage = `url(${textures.dirt})`;
    if (main) div('shade', photo);
    const [x0, y0, x1, y1] = cut.rect;
    const tapes = (cut.tapes || []).map(([fx, fy, rot]) => {
      const t = div('tape', el);
      t.style.left = (x0 + (x1 - x0) * fx - 115) + 'px';
      t.style.top = (y0 + (y1 - y0) * fy - 33) + 'px';
      t.style.transform = `rotate(${rot}deg)`;
      return t;
    });
    const st = { x0, y0, x1, y1, amp: cut.amp, rim: 12 + cut.amp * .5 };
    const e1 = FX.makeEdge(seed), e2 = FX.makeEdge(seed + 7919);
    let last = '';
    const piece = {
      el, img, photo, tapes, st,
      render() {
        const key = `${st.x0|0},${st.y0|0},${st.x1|0},${st.y1|0},${st.amp.toFixed(1)},${st.rim.toFixed(1)}`;
        if (key === last) return;
        last = key;
        photo.style.clipPath = FX.tornPolygon(st.x0, st.y0, st.x1, st.y1, st.amp, e1, 0);
        paper.style.clipPath = FX.tornPolygon(st.x0, st.y0, st.x1, st.y1, st.amp * 1.15, e2, st.rim);
      },
    };
    gsap.set(el, { autoAlpha: 0, filter: SHADOW });
    gsap.set(tapes, { autoAlpha: 0 });
    piece.render();
    pieces.push(piece);
    return piece;
  }

  function buildShotScene(shot, i, textures) {
    const el = document.createElement('section');
    el.className = 'scene shot';
    const cut = CUTS[i];
    const shards = (cut.shards || []).map((s, k) => createPiece(el, shot, s, 1000 + i * 37 + k * 13, textures, false));
    const main = createPiece(el, shot, cut, 500 + i * 71, textures, i < 2);
    return { el, main, shards, cut, shot };
  }

  function fit(el, maxW) {
    let size = parseFloat(getComputedStyle(el).fontSize);
    let guard = 60;
    while (el.scrollWidth > maxW && guard--) { size *= 0.96; el.style.fontSize = size + 'px'; }
    return size;
  }

  /* ---------- timeline helpers ---------- */
  function shake(tl, at, dur, mag) {
    const r = FX.rng(Math.round(at * 1000) + 3);
    const n = Math.max(1, Math.round(dur / F));
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n;
      tl.set(shakeEl, { x: (r() * 2 - 1) * mag * k, y: (r() * 2 - 1) * mag * k, rotation: (r() * 2 - 1) * 0.7 * k, scale: 1.035 }, at + i * F);
    }
    tl.set(shakeEl, { x: 0, y: 0, rotation: 0, scale: 1 }, at + n * F);
  }

  /* camera shake inside the 3D scenes */
  function shake3(tl, at, dur, mag) {
    const r = FX.rng(Math.round(at * 1000) + 11);
    const n = Math.max(1, Math.round(dur / F));
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n;
      tl.set(cam, { shakeX: (r() * 2 - 1) * mag * k, shakeY: (r() * 2 - 1) * mag * k }, at + i * F);
    }
    tl.set(cam, { shakeX: 0, shakeY: 0 }, at + n * F);
  }

  function flash(tl, at, strength = 0.8, frames = 1) {
    tl.set(flashEl, { opacity: strength }, at);
    tl.set(flashEl, { opacity: 0 }, at + frames * F);
  }

  function hide(tl, els, at) { tl.set(els, { autoAlpha: 0 }, at); }

  function paperIn(tl, scene, at, prevScenes) {
    const { main, shards, cut } = scene;
    tl.set(scene.el, { autoAlpha: 1 }, at);
    const land = (p, c, t, fly) => {
      const [x0, y0, x1, y1] = c.rect;
      tl.set(p.el, { autoAlpha: 1, transformOrigin: `${(x0 + x1) / 2}px ${(y0 + y1) / 2}px` }, t);
      tl.fromTo(p.el, { x: c.from.x, y: c.from.y, rotation: c.from.r, scale: c.from.s || 1.12 },
        { x: 0, y: 0, rotation: c.land, scale: 1, duration: fly, ease: 'power4.out', immediateRender: false }, t);
      const hit = t + fly * 0.45;
      tl.set(p.tapes, { autoAlpha: 1 }, hit);
      shake(tl, hit, 0.2, 16);
    };
    shards.forEach((p, k) => land(p, cut.shards[k], at + cut.shards[k].at, cut.shards[k].fly || cut.fly));
    const mainAt = at + (cut.mainDelay || 0);
    land(main, cut, mainAt, cut.fly);
    const e = mainAt + cut.fly + cut.hold;
    tl.set(main.tapes, { autoAlpha: 0 }, e);
    tl.to(main.st, { x0: -140, y0: -140, x1: 1220, y1: 2060, amp: 0, rim: 0, duration: cut.expand, ease: 'expo.inOut' }, e);
    tl.to(main.el, { rotation: 0, duration: cut.expand, ease: 'expo.inOut' }, e);
    const full = e + cut.expand;
    tl.set(main.el, { filter: 'none' }, full);
    hide(tl, shards.map(s => s.el), full);
    if (prevScenes && prevScenes.length) hide(tl, prevScenes, full);
    return full;
  }

  /* punch-in crops + whip-pan frames while a photo holds */
  function holdMotion(tl, scene, from, to) {
    const { img, photo } = scene.main;
    const fx = scene.shot.focus;
    tl.fromTo(img, { scale: 1 }, { scale: 1.07, duration: to - from + 1, ease: 'none', immediateRender: false }, from - 0.8);
    const crop = (f, at) => tl.set(photo, { scale: f[2], transformOrigin: `${f[0]}px ${f[1]}px` }, at);
    const full = at => tl.set(photo, { scale: 1 }, at);
    const span = to - from;
    let t = from + Math.max(0.25, span * 0.2);
    fx.forEach((f, k) => {
      crop(f, t); t += (k % 2 ? 4 : 6) * F;
      full(t);    t += 3 * F;
      if (k === 0) {
        tl.set(img, { attr: { class: 'ph whip' }, x: 70 }, t); t += 2 * F;
        tl.set(img, { attr: { class: 'ph' }, x: 0 }, t); t += 2 * F;
      }
    });
    crop(fx[0], from + span * 0.82);
    full(from + span * 0.82 + 3 * F);
  }

  /* ZOOM-THROUGH CUT (photo -> 3D): dive into a point of the photo,
     accelerating, until it fills the frame; the 3D scene then opens
     from extreme close-up on the same drawing. */
  function zoomThrough(tl, scene, at, dur) {
    const [x, y] = scene.shot.zoomInto;
    const { photo, img } = scene.main;
    tl.set(photo, { scale: 1, transformOrigin: `${x}px ${y}px` }, at);
    tl.to(photo, { scale: 14, duration: dur, ease: 'expo.in' }, at);
    tl.fromTo(img, { filter: 'blur(0px)' }, { filter: 'blur(10px)', duration: dur, ease: 'expo.in', immediateRender: false }, at);
  }

  function heroOn(tl, at, sceneName, prev) {
    tl.set(heroEl, { autoAlpha: 1 }, at);
    tl.set(cam, { scene: sceneName }, at);
    tl.set(logo, { autoAlpha: 0 }, at);
    if (prev) hide(tl, prev, at);
    shake(tl, at, 0.16, 18);
  }
  function heroOff(tl, at) {
    tl.set(heroEl, { autoAlpha: 0 }, at);
    tl.set(cam, { scene: '' }, at);
  }

  /* HERO A — vertigo on the creature */
  function heroA(tl, at, end) {
    heroOn(tl, at, 'vertigo', null);
    // opens from extreme close-up (continues the zoom-through), pulls out
    tl.set(cam, { tx: 0.2, ty: 0.6, tz: 0, roll: 0, D: 0.6, frameH: 1.4 }, at);
    tl.to(cam, { D: 3.6, frameH: 14, tx: 0, ty: -0.2, duration: 0.5, ease: 'expo.out' }, at);
    // VERTIGO: dolly back while the field of view narrows — the creature
    // stays the same size, the flame tunnel and the ghost plate collapse
    tl.to(cam, { D: 24, duration: end - at - 1.0, ease: 'sine.inOut' }, at + 0.5);
    tl.to(cam, { roll: 0.05, duration: end - at - 1.0, ease: 'sine.inOut' }, at + 0.5);
    shake3(tl, at + 1.6, 0.12, 0.12);
    // zoom-through out: rush into the eye
    const eye = DD3D.toWorld(757, 705);
    tl.to(cam, { tx: eye[0], ty: eye[1], frameH: 0.25, D: 1.2, roll: 0, duration: 0.45, ease: 'expo.in' }, end - 0.45);
  }

  /* HERO B — corridor of cut-outs, then a vertigo snap */
  function heroB(tl, at, end) {
    heroOn(tl, at, 'corridor', null);
    const Z = DD3D.CORRIDOR_END;
    // fixed-fov flight: the target is the creature at the end; D shrinks
    tl.set(cam, { frameH: 0, fov: 58, tx: 0, ty: 0, tz: Z, D: 76, roll: 0 }, at);
    tl.fromTo(cam, { D: 76 }, { D: 11, duration: end - at - 1.3, ease: 'power2.inOut', immediateRender: false }, at);
    tl.fromTo(cam, { roll: -0.06 }, { roll: 0.06, duration: end - at - 1.3, ease: 'sine.inOut', immediateRender: false }, at);
    // switch to dolly-zoom mode at the same framing, then snap
    const v = end - 1.3;
    tl.set(cam, { frameH: 2 * 11 * Math.tan(THREE.MathUtils.degToRad(29)), roll: 0.06 }, v);
    tl.to(cam, { D: 3.2, roll: 0, duration: 0.9, ease: 'expo.inOut' }, v);
    shake3(tl, v + 0.45, 0.2, 0.15);
    tl.to(cam, { D: 1.2, frameH: 0.8, duration: 0.4, ease: 'expo.in' }, end - 0.4);
  }

  /* HERO C — abyss: reverse vertigo, the world tears away behind it */
  function heroC(tl, at, end) {
    heroOn(tl, at, 'abyss', null);
    const eye = DD3D.toWorld(757, 705);
    tl.set(cam, { tx: eye[0], ty: eye[1], tz: 0, D: 0.7, frameH: 0.6, roll: 0 }, at);
    tl.to(cam, { tx: 0, ty: -0.2, D: 24, frameH: 13, duration: 0.7, ease: 'expo.out' }, at);
    // VERTIGO (reverse): dolly in while the field of view widens
    tl.to(cam, { D: 3.2, duration: end - at - 1.3, ease: 'sine.inOut' }, at + 0.7);
    tl.to(cam, { roll: -0.07, duration: end - at - 1.3, ease: 'sine.inOut' }, at + 0.7);
    shake3(tl, at + 2.2, 0.15, 0.1);
    // final push into black
    tl.to(cam, { D: 0.4, frameH: 0.5, roll: 0, duration: 0.6, ease: 'expo.in' }, end - 0.6);
  }

  /* doomsday white cards — reference beats */
  function bvScene(tl, el, at, prevScenes) {
    const a = $('.bv-a', el), c = $('.bv-c', el);
    tl.set(el, { autoAlpha: 1, backgroundColor: '#ececec' }, at);
    tl.set([logo, haze], { autoAlpha: 0 }, at);
    hide(tl, prevScenes, at);
    tl.set(a, { autoAlpha: 1, scale: 1, x: 0, y: 0 }, at);
    tl.set(c, { autoAlpha: 0, x: 0 }, at);
    tl.set(el, { backgroundColor: '#ffffff' }, at + 4 * F);
    tl.set(a, { scale: 2.3, x: -645, y: -2794 }, at + 4 * F);
    tl.set(a, { autoAlpha: 0 }, at + 8 * F);
    tl.set(c, { autoAlpha: 1 }, at + 8 * F);
    tl.set(el, { backgroundColor: '#c4c4c4' }, at + 8 * F);
    tl.set(el, { backgroundColor: '#ffffff' }, at + 9 * F);
    tl.set(c, { x: -110 }, at + 11 * F);
  }

  function finaleScene(tl, at, prevScenes) {
    const el = $('#finale');
    const fws = $$('.fw', el);
    tl.set(logo, { autoAlpha: 0 }, at);
    hide(tl, prevScenes, at);
    tl.set(el, { autoAlpha: 1 }, at);
    let t = at + 2 * F;
    fws.forEach(fw => { tl.set(fws, { autoAlpha: 0 }, t); tl.set(fw, { autoAlpha: 1 }, t); t += T.styleDur; });
    tl.set(fws, { autoAlpha: 0 }, t);
    tl.set(logo, { autoAlpha: 1 }, t);
    return t;
  }

  function buildIntro() {
    const root = $('#intro');
    return INTRO.map(([si, type, fi]) => {
      const shot = div('shot ' + type, root);
      if (si === null) return shot;
      const img = new Image();
      img.src = SHOTS[si].src;
      img.alt = '';
      if (type === 'card') div('frame', shot).appendChild(img); else shot.appendChild(img);
      if (fi !== null) {
        const [x, y, z] = SHOTS[si].focus[fi];
        gsap.set(img, { scale: z, transformOrigin: `${x}px ${y}px` });
      }
      if (type === 'whip') gsap.set(img, { x: 80 });
      return shot;
    });
  }

  function introScene(tl, el, shots) {
    tl.set(el, { autoAlpha: 1 }, 0);
    let t = 0;
    INTRO.forEach(([, , , frames], k) => {
      tl.set(shots, { autoAlpha: 0 }, t);
      tl.set(shots[k], { autoAlpha: 1 }, t);
      if (k > 0 && k < INTRO.length - 1) shake(tl, t, 2 * F, 10);
      t += frames * F;
    });
  }

  /* ---------- build ---------- */
  function build(textures) {
    const S = SHOTS.map((s, i) => buildShotScene(s, i, textures));
    const bv = [$('#bv1'), $('#bv2')];
    const finaleEl = $('#finale');
    const introEl = $('#intro');
    const introShots = buildIntro();

    const order = [introEl, S[0].el, heroEl, bv[0], S[1].el, bv[1], S[2].el, finaleEl];
    order.forEach((el, z) => { el.style.zIndex = z + 1; scenesEl.appendChild(el); });
    heroEl.style.zIndex = 20;   // above the photos it cuts from
    $$('.fw span', finaleEl).forEach(sp => fit(sp, 900));
    gsap.set(bv.map(el => $('.bv-a', el)), { transformOrigin: '0 0' });

    gsap.set([...S.map(s => s.el), ...bv, finaleEl, introEl, ...introShots, heroEl], { autoAlpha: 0 });
    gsap.set(logo, { autoAlpha: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

    tl.set([logo, haze], { autoAlpha: 1 }, 0);
    introScene(tl, introEl, introShots);

    // 1 — Stories 1, zoom-through into the back print, vertigo
    const f1 = paperIn(tl, S[0], T.shots[0], [introEl]);
    holdMotion(tl, S[0], f1, T.zoom[0] - 0.15);
    zoomThrough(tl, S[0], T.zoom[0], T.hero[0] - T.zoom[0]);
    heroA(tl, T.hero[0], T.heroEnd[0]);
    hide(tl, [S[0].el], T.hero[0]);

    // white card, Stories 2, zoom-through into the chest print, corridor
    heroOff(tl, T.bv[0]);
    bvScene(tl, bv[0], T.bv[0], []);
    const f2 = paperIn(tl, S[1], T.bv[0] + 10 * F, [bv[0]]);
    tl.set([logo, haze], { autoAlpha: 1 }, f2);
    holdMotion(tl, S[1], f2, T.zoom[1] - 0.15);
    zoomThrough(tl, S[1], T.zoom[1], T.hero[1] - T.zoom[1]);
    heroB(tl, T.hero[1], T.heroEnd[1]);
    hide(tl, [S[1].el], T.hero[1]);

    // white card, Stories 3 (the art) — the protagonist, no extra logo
    heroOff(tl, T.bv[1]);
    bvScene(tl, bv[1], T.bv[1], []);
    const f3 = paperIn(tl, S[2], T.bv[1] + 10 * F, [bv[1]]);
    tl.set(haze, { autoAlpha: 1 }, f3);
    holdMotion(tl, S[2], f3, T.zoom[2] - 0.15);
    zoomThrough(tl, S[2], T.zoom[2], T.hero[2] - T.zoom[2]);
    heroC(tl, T.hero[2], T.heroEnd[2]);
    hide(tl, [S[2].el], T.hero[2]);

    // finale
    heroOff(tl, T.finale);
    finaleScene(tl, T.finale, []);

    tl.set({}, {}, DURATION);

    const grainFrames = textures.grain;
    let lastGrain = -1;
    const tick = () => {
      const t = tl.time();
      for (const p of pieces) p.render();
      if (cam.scene) DD3D.render(t);
      const g = Math.floor(t * FPS / 2) % grainFrames.length;
      if (g !== lastGrain) { lastGrain = g; grain.style.backgroundImage = `url(${grainFrames[g]})`; }
      if (clock) clock.textContent = `${t.toFixed(2).padStart(5, '0')} / ${DURATION.toFixed(2)}`;
    };
    tl.eventCallback('onUpdate', tick);
    tick();
    return tl;
  }

  function fitStage() {
    if (RENDER) { stage.style.transform = 'none'; return; }
    stage.style.transform = `scale(${Math.min(innerWidth / 1080, innerHeight / 1920)})`;
  }
  addEventListener('resize', fitStage);
  fitStage();

  async function boot() {
    await Promise.all([
      '700 100px "Courier Prime"', '700 100px "Inter"', '800 100px "Roboto Slab"', '700 100px "Caveat"',
      '800 expanded 100px "Archivo"', '100px "Sedgwick Ave Display"', '100px "Permanent Marker"',
    ].map(f => document.fonts.load(f, 'doomsday*').catch(() => null)));

    await DD3D.init($('#gl'));

    const textures = {
      paper: FX.grungePaper(31, { dark: 0.45 }),
      dirt: FX.photoDirt(19),
      grain: FX.grainFrames(6),
    };
    const tl = build(textures);
    await Promise.all($$('img').map(img => (img.decode ? img.decode().catch(() => null) : null)));
    await document.fonts.ready;

    window.PARANOIA = { tl, FPS, DURATION, seek(t) { tl.pause(); tl.seek(t, false); } };
    window.PARANOIA_READY = true;
    if (RENDER) return;

    const btn = $('#btnPlay');
    const syncBtn = () => { btn.textContent = tl.paused() || tl.progress() === 1 ? '▶ PLAY' : '❚❚ PAUSE'; };
    const toggle = () => { if (tl.progress() === 1) tl.restart(); else tl.paused(!tl.paused()); syncBtn(); };
    btn.addEventListener('click', toggle);
    stage.addEventListener('click', toggle);
    tl.eventCallback('onComplete', syncBtn);
    addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.key === 'r' || e.key === 'R') { tl.restart(); syncBtn(); }
      if (e.key === 'ArrowRight') tl.seek(Math.min(DURATION, tl.time() + 1));
      if (e.key === 'ArrowLeft') tl.seek(Math.max(0, tl.time() - 1));
    });
    const start = parseFloat(params.get('t'));
    if (!Number.isNaN(start)) { tl.seek(start); syncBtn(); return; }
    tl.play(0);
    syncBtn();
  }

  boot();
})();
