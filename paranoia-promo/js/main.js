/* =========================================================
   PARANOIA — BAD VIBES · master GSAP timeline (30.00 s)

   0.00  flash montage: 8 hard cuts in 1 s, logo fixed on top
   1.00  S1 Fears Grow Old        (paper cut over black)
   4.50  S2 Cold Alone Alive      (paper cut over S1)
   8.00  bad vibeeees #1          (white card, reference beats: hand lettering, zoom, brush)
   8.33  S3 Evil Walks Beside Me  (paper strip lands on the white card)
  12.00  S4 Blinding Faith        (collage shards + paper cut)
  15.67  bad vibeeees #2          (white card)
  16.00  S5 Reign in Hell         (corner paper cut lands on the white card)
  20.40  S6 NMA                   (vertical paper strip)
  25.00  bad vibes finale         (typewriter / normal / slab / handwritten / extended, no logo)
  27.57  logo alone on black until the end
  30.00  end
   ========================================================= */
(() => {
  const FPS = 30;
  const F = 1 / FPS;
  const DURATION = 30;

  const params = new URLSearchParams(location.search);
  const RENDER = params.has('render');
  if (RENDER) document.body.classList.add('render');

  /* ---------- Content ---------- */
  /* focus: punch-in crops used by the fast cuts — [x, y, zoom] in image px
     (first = the print on the shirt, second = a detail / the sticker). */
  const SHIRTS = [
    { src: 'assets/stories/01-fears-grow-old.png',       label: 'FEARS GROW OLD WITH THE HEART', focus: [[545, 960, 1.9], [210, 380, 2.4]] },
    { src: 'assets/stories/02-cold-alone-alive.png',     label: 'COLD ALONE ALIVE',              focus: [[570, 990, 2.3], [880, 230, 2.4]] },
    { src: 'assets/stories/03-evil-walks-beside-me.png', label: 'EVIL WALKS BESIDE ME',          focus: [[490, 1010, 2.4], [470, 1260, 1.8]] },
    { src: 'assets/stories/04-blinding-faith.png',       label: 'BLINDING FAITH',                focus: [[340, 1080, 1.8], [275, 375, 2.2]] },
    { src: 'assets/stories/05-reign-in-hell.png',        label: 'REIGN IN HELL',                 focus: [[565, 930, 1.9], [190, 210, 2.6]] },
    { src: 'assets/stories/06-nma.png',                  label: 'NEGATIVE MENTAL ATTITUDE',      focus: [[540, 1010, 1.7], [255, 280, 2.4]] },
  ];

  /* Opening montage — modelled on the reference edit: one hard cut every
     3–4 frames, crops / whip-pans / a small card, logo never moves.
     [shirt index, type, focus index or null, frames] */
  const INTRO = [
    [null, 'black', null, 3],
    [5, 'crop', 0, 4],
    [0, 'whip', null, 3],
    [2, 'crop', 0, 4],
    [1, 'card', null, 4],
    [4, 'full', null, 3],
    [3, 'whip-v', 0, 3],
    [0, 'crop', 0, 4],
    [null, 'black', null, 2],
  ];

  /* ---------- Paper-cut choreography, one per shirt ----------
     rect   : the torn piece (stage px) that lands first
     from   : where the piece flies in from (x, y, rotation, scale)
     land   : rotation once it is "glued"
     fly / hold / expand : seconds
     tapes  : [fx, fy, rotation] — masking tape, relative to rect
     shards : extra smaller cut-outs of the same photo landing first */
  const CUTS = [
    { rect: [150, 560, 930, 1330], amp: 20, from: { x: -80, y: 1500, r: 24, s: 1.2 }, land: -3,
      fly: .40, hold: .30, expand: .42, tapes: [[.1, 0, -14], [.88, 1, 9]] },
    { rect: [110, 420, 965, 1430], amp: 26, from: { x: 1350, y: -160, r: -22, s: 1.15 }, land: 4,
      fly: .38, hold: .34, expand: .44, tapes: [[.5, 0, 3], [.04, .82, -78]] },
    { rect: [-60, 690, 1140, 1230], amp: 18, from: { x: -1450, y: 60, r: -9, s: 1.04 }, land: -2.5,
      fly: .36, hold: .40, expand: .46, tapes: [[.06, .5, -86], [.94, .45, 84]] },
    { rect: [210, 520, 880, 1370], amp: 22, from: { x: 40, y: -1750, r: -16, s: 1.1 }, land: 2.5,
      fly: .36, hold: .34, expand: .44, mainDelay: .26, tapes: [[.5, 0, -4]],
      shards: [
        { rect: [30, 170, 560, 760],    amp: 18, from: { x: -1000, y: -260, r: -34, s: 1.1 }, land: -8, at: 0,   fly: .30, tapes: [[.15, .05, -30]] },
        { rect: [520, 1140, 1055, 1770], amp: 18, from: { x: 1000, y: 520, r: 28, s: 1.1 },   land: 7,  at: .12, fly: .30, tapes: [[.85, .95, 25]] },
      ] },
    { rect: [290, 110, 1035, 990], amp: 24, from: { x: 1000, y: -1000, r: 38, s: 1.15 }, land: 6,
      fly: .40, hold: .34, expand: .46, tapes: [[.0, .1, -40], [.96, .9, -38]] },
    { rect: [300, -70, 790, 1990], amp: 16, from: { x: 30, y: -2150, r: 7, s: 1.02 }, land: -1.6,
      fly: .36, hold: .36, expand: .44, tapes: [[.5, .08, 2], [.5, .92, -3]] },
  ];

  const T = {
    shirts: [1.00, 4.75, 8.83, 12.80, 17.08, 21.70],
    bv: [8.50, 16.75],   // white cards; the next shirt starts landing 10 frames in
    finale: 26.30,
    styleDur: 0.20,      // each bad vibes type style (6 frames, fast like the reference)
  };

  /* ---------- DOM ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const stage = $('#stage');
  const shakeEl = $('#shake');
  const scenesEl = $('#scenes');
  const logo = $('#logo');
  const grain = $('#grain');
  const flashEl = $('#flash');
  const clock = $('#clock');

  const pieces = [];           // every torn piece, re-rendered on each tick
  const SHADOW = 'drop-shadow(0 22px 26px rgba(0,0,0,.65)) drop-shadow(0 4px 4px rgba(0,0,0,.5))';

  function div(cls, parent) {
    const d = document.createElement('div');
    d.className = cls;
    if (parent) parent.appendChild(d);
    return d;
  }

  /* A torn piece of paper holding a full-frame photo. The photo is clipped
     by a jagged polygon; a slightly bigger polygon of white paper behind it
     gives the torn white rim. */
  function createPiece(parent, shirt, cut, seed, textures, withExtras) {
    const el = div('piece', parent);
    const paper = div('paper', el);
    const photo = div('photo', el);
    const img = new Image();
    img.src = shirt.src;
    img.alt = shirt.label;
    img.decoding = 'sync';
    img.className = 'ph';
    photo.appendChild(img);
    paper.style.backgroundImage = `url(${textures.paper})`;
    const dirt = div('dirt', photo);
    dirt.style.backgroundImage = `url(${textures.dirt})`;
    if (withExtras) {
      div('shade', photo);
      const label = div('label', photo);
      label.innerHTML = `<b>${withExtras.index}</b>${shirt.label}`;
    }
    const [x0, y0, x1, y1] = cut.rect;
    const tapes = (cut.tapes || []).map(([fx, fy, rot]) => {
      const t = div('tape', el);
      const cx = x0 + (x1 - x0) * fx, cy = y0 + (y1 - y0) * fy;
      t.style.left = (cx - 115) + 'px';
      t.style.top = (cy - 33) + 'px';
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

  function buildShirtScene(shirt, i, textures) {
    const el = document.createElement('section');
    el.className = 'scene shirt';
    const cut = CUTS[i];
    const shards = (cut.shards || []).map((s, k) =>
      createPiece(el, shirt, s, 1000 + i * 37 + k * 13, textures, null));
    const main = createPiece(el, shirt, cut, 500 + i * 71, textures, { index: String(i + 1).padStart(2, '0') });
    return { el, main, shards, cut };
  }

  /* Shrink a text node until it fits the given width. */
  function fit(el, maxW) {
    let size = parseFloat(getComputedStyle(el).fontSize);
    let guard = 60;
    while (el.scrollWidth > maxW && guard--) {
      size *= 0.96;
      el.style.fontSize = size + 'px';
    }
    return size;
  }

  /* ---------- Timeline helpers ---------- */
  function shake(tl, at, dur, mag) {
    const r = FX.rng(Math.round(at * 1000) + 3);
    const n = Math.max(1, Math.round(dur / F));
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n;
      tl.set(shakeEl, {
        x: (r() * 2 - 1) * mag * k,
        y: (r() * 2 - 1) * mag * k,
        rotation: (r() * 2 - 1) * 0.7 * k,
        scale: 1.035,
      }, at + i * F);
    }
    tl.set(shakeEl, { x: 0, y: 0, rotation: 0, scale: 1 }, at + n * F);
  }

  function flash(tl, at, strength = 0.8, frames = 1) {
    tl.set(flashEl, { opacity: strength }, at);
    tl.set(flashEl, { opacity: 0 }, at + frames * F);
  }

  function hide(tl, els, at) { tl.set(els, { autoAlpha: 0 }, at); }

  /* Paper-cut entrance. Returns the time the new scene covers the frame. */
  function paperIn(tl, scene, at, prevScenes) {
    const { main, shards, cut } = scene;
    tl.set(scene.el, { autoAlpha: 1 }, at);

    const land = (p, c, t, fly) => {
      const [x0, y0, x1, y1] = c.rect;
      tl.set(p.el, { autoAlpha: 1, transformOrigin: `${(x0 + x1) / 2}px ${(y0 + y1) / 2}px` }, t);
      tl.fromTo(p.el,
        { x: c.from.x, y: c.from.y, rotation: c.from.r, scale: c.from.s || 1.12 },
        { x: 0, y: 0, rotation: c.land, scale: 1, duration: fly, ease: 'power4.out', immediateRender: false },
        t);
      const hit = t + fly * 0.45;
      tl.set(p.tapes, { autoAlpha: 1 }, hit);
      shake(tl, hit, 0.2, 16);
      // no white flash: white is reserved for the BAD VIBEEEES cards
    };

    shards.forEach((p, k) => land(p, cut.shards[k], at + cut.shards[k].at, cut.shards[k].fly || cut.fly));
    const mainAt = at + (cut.mainDelay || 0);
    land(main, cut, mainAt, cut.fly);

    // the piece takes over the whole frame
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

  /* Life on a shirt while it holds: slow push-in, plus the reference's
     fast-cut vocabulary — dry punch-in crops on the print and the sticker,
     a 2-frame whip-pan, then back to the full frame. */
  function holdMotion(tl, scene, shirt, from, to) {
    const { img, photo } = scene.main;
    tl.fromTo(img, { scale: 1 }, { scale: 1.075, duration: to - from + 1.2, ease: 'none', immediateRender: false }, from - 0.9);
    const [a, b] = shirt.focus;
    const crop = (f, at) => tl.set(photo, { scale: f[2], transformOrigin: `${f[0]}px ${f[1]}px` }, at);
    const full = at => tl.set(photo, { scale: 1 }, at);
    const span = to - from;
    let t = from + Math.max(0.3, span * 0.26);
    crop(a, t); t += 6 * F;
    full(t);    t += 4 * F;
    crop(b, t); t += 5 * F;
    full(t);    t += 3 * F;
    tl.set(img, { attr: { class: 'ph whip' }, x: 70 }, t); t += 2 * F;
    tl.set(img, { attr: { class: 'ph' }, x: 0 }, t);
    // longer holds get a second burst
    if (span > 2.6) {
      let u = from + span * 0.58;
      crop(b, u); u += 4 * F;
      full(u);    u += 3 * F;
      tl.set(img, { attr: { class: 'ph whip' }, x: -70 }, u); u += 2 * F;
      tl.set(img, { attr: { class: 'ph' }, x: 0 }, u);
      crop(a, u + 2 * F);
      full(u + 6 * F);
    }
    // late punch, right before the next cut
    const p = from + span * 0.8;
    crop(a, p);
    full(p + 3 * F);
  }

  /* 1-second flash montage opening the video. */
  function buildIntro(textures) {
    const root = $('#intro');
    return INTRO.map(([si, type, fi]) => {
      const shot = div('shot ' + type, root);
      if (si === null) return shot;
      const img = new Image();
      img.src = SHIRTS[si].src;
      img.alt = '';
      if (type === 'card') { div('frame', shot).appendChild(img); }
      else shot.appendChild(img);
      if (fi !== null) {
        const [x, y, z] = SHIRTS[si].focus[fi];
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
    return t;
  }

  /* BAD VIBEEEES white cards — same beats as the reference edit:
       4 f  thin hand lettering, staggered lines, on light grey
       4 f  hard zoom into the same lettering, cut by the top edge, white
       1 f  giant brush lettering overflowing every edge, on grey
       2 f  same on white
       …    same, jumped sideways — the next shirt lands on top of it */
  function bvScene(tl, el, at, prevScenes) {
    const a = $('.bv-a', el), c = $('.bv-c', el);
    tl.set(el, { autoAlpha: 1, backgroundColor: '#ececec' }, at);
    tl.set(logo, { autoAlpha: 0 }, at);
    hide(tl, prevScenes, at);
    tl.set(a, { autoAlpha: 1, scale: 1, x: 0, y: 0 }, at);
    tl.set(c, { autoAlpha: 0, x: 0 }, at);
    // zoom: second line lands at the very top, sliced
    tl.set(el, { backgroundColor: '#ffffff' }, at + 4 * F);
    tl.set(a, { scale: 2.3, x: -645, y: -2794 }, at + 4 * F);
    // brush card
    tl.set(a, { autoAlpha: 0 }, at + 8 * F);
    tl.set(c, { autoAlpha: 1 }, at + 8 * F);
    tl.set(el, { backgroundColor: '#c4c4c4' }, at + 8 * F);
    tl.set(el, { backgroundColor: '#ffffff' }, at + 9 * F);
    tl.set(c, { x: -110 }, at + 11 * F);
  }

  /* Finale, modelled on the reference: the same words swapped through
     five type identities with dry cuts, no logo. When the last one goes,
     the logo appears alone and the video ends. */
  function finaleScene(tl, at, prevScenes) {
    const el = $('#finale');
    const fws = $$('.fw', el);
    tl.set(logo, { autoAlpha: 0 }, at);
    hide(tl, prevScenes, at);
    tl.set(el, { autoAlpha: 1 }, at);
    let t = at + 2 * F;                        // 2 black frames
    fws.forEach(fw => {
      tl.set(fws, { autoAlpha: 0 }, t);
      tl.set(fw, { autoAlpha: 1 }, t);
      t += T.styleDur;
    });
    tl.set(fws, { autoAlpha: 0 }, t);
    tl.set(logo, { autoAlpha: 1 }, t);         // logo alone on black until the end
    return t;
  }

  /* ---------- Build everything ---------- */
  function build(textures) {
    const shirtScenes = SHIRTS.map((s, i) => buildShirtScene(s, i, textures));
    const bv = [$('#bv1'), $('#bv2')];
    const finaleEl = $('#finale');
    const introEl = $('#intro');
    const introShots = buildIntro(textures);

    // single stacking order for everything that cuts/overlaps
    const order = [introEl, shirtScenes[0].el, shirtScenes[1].el, bv[0], shirtScenes[2].el, shirtScenes[3].el, bv[1],
      shirtScenes[4].el, shirtScenes[5].el, finaleEl];
    order.forEach((el, z) => { el.style.zIndex = z + 1; scenesEl.appendChild(el); });

    $$('.fw span', finaleEl).forEach(sp => fit(sp, 900));
    gsap.set(bv.map(el => $('.bv-a', el)), { transformOrigin: '0 0' });

    gsap.set([...shirtScenes.map(s => s.el), ...bv, finaleEl, introEl, ...introShots], { autoAlpha: 0 });
    gsap.set(logo, { autoAlpha: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    const S = shirtScenes;

    // 0.00 — flash montage, logo fixed on top
    tl.set(logo, { autoAlpha: 1 }, 0);
    introScene(tl, introEl, introShots);

    // block 1
    const f1 = paperIn(tl, S[0], T.shirts[0], [introEl]);
    const f2 = paperIn(tl, S[1], T.shirts[1], [S[0].el]);
    holdMotion(tl, S[0], SHIRTS[0], f1, T.shirts[1] + 1.1);
    holdMotion(tl, S[1], SHIRTS[1], f2, T.bv[0]);
    bvScene(tl, bv[0], T.bv[0], [S[1].el]);

    // block 2 — paper lands on the white card
    const f3 = paperIn(tl, S[2], T.shirts[2], [bv[0]]);
    tl.set(logo, { autoAlpha: 1 }, f3);
    const f4 = paperIn(tl, S[3], T.shirts[3], [S[2].el]);
    holdMotion(tl, S[2], SHIRTS[2], f3, T.shirts[3] + 1.2);
    holdMotion(tl, S[3], SHIRTS[3], f4, T.bv[1]);
    bvScene(tl, bv[1], T.bv[1], [S[3].el]);

    // block 3
    const f5 = paperIn(tl, S[4], T.shirts[4], [bv[1]]);
    tl.set(logo, { autoAlpha: 1 }, f5);
    const f6 = paperIn(tl, S[5], T.shirts[5], [S[4].el]);
    holdMotion(tl, S[4], SHIRTS[4], f5, T.shirts[5] + 1.1);
    holdMotion(tl, S[5], SHIRTS[5], f6, T.finale);

    // finale
    finaleScene(tl, T.finale, [S[5].el]);

    tl.set({}, {}, DURATION);   // lock length to exactly 30 s

    // per-tick: torn polygons, grain, clock
    const grainFrames = textures.grain;
    let lastGrain = -1;
    const tick = () => {
      for (const p of pieces) p.render();
      const g = Math.floor(tl.time() * FPS / 2) % grainFrames.length;
      if (g !== lastGrain) { lastGrain = g; grain.style.backgroundImage = `url(${grainFrames[g]})`; }
      if (clock) clock.textContent = `${tl.time().toFixed(2).padStart(5, '0')} / ${DURATION.toFixed(2)}`;
    };
    tl.eventCallback('onUpdate', tick);
    tick();
    return tl;
  }

  /* ---------- Stage scaling ---------- */
  function fitStage() {
    if (RENDER) { stage.style.transform = 'none'; return; }
    const s = Math.min(innerWidth / 1080, innerHeight / 1920);
    stage.style.transform = `scale(${s})`;
  }
  addEventListener('resize', fitStage);
  fitStage();

  /* ---------- Boot ---------- */
  async function boot() {
    const fontsToLoad = [
      '700 100px "Courier Prime"', '700 100px "Inter"', '800 100px "Roboto Slab"',
      '700 100px "Caveat"', '800 expanded 100px "Archivo"',
      '100px "Sedgwick Ave Display"', '100px "Permanent Marker"',
    ];
    await Promise.all(fontsToLoad.map(f => document.fonts.load(f, 'BADVIBES0123').catch(() => null)));

    const textures = {
      paper: FX.grungePaper(31, { dark: 0.55 }),
      dirt: FX.photoDirt(19),
      grain: FX.grainFrames(6),
    };

    const tl = build(textures);

    // make sure every photo is decoded before the first frame
    await Promise.all($$('img').map(img => (img.decode ? img.decode().catch(() => null) : null)));
    await document.fonts.ready;

    window.PARANOIA = {
      tl, FPS, DURATION,
      seek(t) { tl.pause(); tl.seek(t, false); },
    };
    window.PARANOIA_READY = true;

    if (RENDER) return;

    // ---- playback controls ----
    const btn = $('#btnPlay');
    const syncBtn = () => { btn.textContent = tl.paused() || tl.progress() === 1 ? '▶ PLAY' : '❚❚ PAUSE'; };
    const toggle = () => {
      if (tl.progress() === 1) tl.restart();
      else tl.paused(!tl.paused());
      syncBtn();
    };
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
