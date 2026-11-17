/* =========================================================
   DOOMSDAY — three.js hero scenes, all built from Stories 3
   (the drawing) so the art is the protagonist.

   Art space -> world: 100 px = 1 unit, origin at the centre of the
   1080x1920 Stories frame. Every layer keeps its true position, so the
   layers line up into the original drawing when seen head-on, and
   split apart in depth as soon as the camera moves.

   Camera model (driven by GSAP through `cam`):
     target (tx, ty, tz)  — what we look at
     D                    — distance from camera to target
     frameH               — height of the view at the target plane.
                            frameH > 0  => fov = 2·atan(frameH / 2D)
                            (keep frameH, change D  =  VERTIGO / dolly zoom)
                            frameH = 0  => fixed fov (cam.fov)
   ========================================================= */
const DD3D = (() => {
  const W = 1080, H = 1920;
  const toWorld = (x, y) => [x / 100 - 5.4, 9.6 - y / 100];

  // design DNA
  const INK = 0x06070a;
  const EMBER = 0xe4532b;
  const BONE = '#e9dcc3';

  let renderer, camera;
  const scenes = {};
  const animated = [];  // { obj, fn(t) } for deterministic motion

  const cam = {
    scene: '',          // '' | 'vertigo' | 'corridor' | 'abyss'
    tx: 0, ty: -0.2, tz: 0,
    D: 8, frameH: 14, fov: 60, roll: 0,
    shakeX: 0, shakeY: 0,
  };

  function loadTex(url) {
    return new Promise((res, rej) => new THREE.TextureLoader().load(url, t => {
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      res(t);
    }, undefined, rej));
  }

  function plane(tex, w, h, opts = {}) {
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false,
      opacity: opts.opacity ?? 1,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      fog: opts.fog ?? true, color: opts.color ?? 0xffffff,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    if (opts.order != null) m.renderOrder = opts.order;
    return m;
  }

  /* Full-frame art layer (1080x1920 PNG with alpha) at depth z. */
  function artLayer(tex, z, opts = {}) {
    const m = plane(tex, 10.8, 19.2, opts);
    m.position.z = z;
    return m;
  }

  /* Cropped art layer, placed where it sits in the drawing. */
  function cropLayer(tex, box, z, opts = {}) {
    const [x0, y0, x1, y1] = box;
    const m = plane(tex, (x1 - x0) / 100, (y1 - y0) / 100, opts);
    const [cx, cy] = toWorld((x0 + x1) / 2, (y0 + y1) / 2);
    m.position.set(cx, cy, z);
    return m;
  }

  function radialTex(inner, outer, size = 512) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  /* Torn-paper cut-out of a region of the drawing (bone paper rim). */
  function tornPiece(img, box, seed) {
    const [x0, y0, x1, y1] = box;
    const pad = 40, w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const amp = 14;
    const path = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    const e1 = FX.makeEdge(seed), e2 = FX.makeEdge(seed + 991);
    g.save();
    path(FX.tornPoints(pad, pad, w - pad, h - pad, amp * 1.2, e2, 12));
    g.fillStyle = BONE; g.fill();
    g.restore();
    g.save();
    path(FX.tornPoints(pad, pad, w - pad, h - pad, amp, e1, 0));
    g.clip();
    g.drawImage(img, x0, y0, x1 - x0, y1 - y0, pad, pad, x1 - x0, y1 - y0);
    g.restore();
    const t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
    return { tex: t, w: w / 100, h: h / 100 };
  }

  /* Ember particles — position is a pure function of time (seekable). */
  function embers(count, seed, spread, depth, z0) {
    const r = FX.rng(seed);
    const base = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      base[i * 4] = (r() * 2 - 1) * spread;
      base[i * 4 + 1] = r() * 24 - 12;
      base[i * 4 + 2] = z0 - r() * depth;
      base[i * 4 + 3] = 0.4 + r() * 1.4;   // speed
    }
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: EMBER, size: 0.09, map: radialTex('rgba(255,190,150,1)', 'rgba(255,90,40,0)', 64),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    });
    const pts = new THREE.Points(geo, mat);
    animated.push({
      obj: pts, fn: t => {
        for (let i = 0; i < count; i++) {
          const sp = base[i * 4 + 3];
          let y = base[i * 4 + 1] + t * sp * 1.6;
          y = ((y + 12) % 24 + 24) % 24 - 12;
          pos[i * 3] = base[i * 4] + Math.sin(t * sp + i) * 0.35;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = base[i * 4 + 2];
        }
        geo.attributes.position.needsUpdate = true;
      },
    });
    return pts;
  }

  /* Background: the drawing's ghost plate, mirrored-tiled so it covers
     even the widest vertigo field of view. */
  function ghostPlate(tex, z, tiles = 7) {
    const t = tex.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    t.repeat.set(tiles, tiles);
    t.offset.set(-(tiles - 1) / 2, -(tiles - 1) / 2);
    const m = plane(t, 10.8 * tiles, 19.2 * tiles, { order: 0 });
    m.position.z = z;
    return m;
  }

  /* A tunnel of the drawing's orange flames receding in depth — the
     parallax that makes the dolly zoom read. */
  function flameTunnel(tex, rings, z0, step, spin) {
    const g = new THREE.Group();
    for (let k = 0; k < rings; k++) {
      const m = artLayer(tex, z0 - k * step, { additive: true, opacity: 0.85 - k * 0.11, order: 1 });
      const s = 1.15 + k * 0.42;
      m.scale.set(s, s, 1);
      m.rotation.z = (k % 2 ? 1 : -1) * 0.12 * k;
      g.add(m);
      animated.push({ obj: m, fn: t => { m.rotation.z = (k % 2 ? 1 : -1) * (0.12 * k + t * spin * (1 + k * 0.2)); } });
    }
    return g;
  }

  function buildVertigo(T, seed, spin) {
    const s = new THREE.Scene();
    s.background = new THREE.Color(INK);
    s.fog = new THREE.Fog(INK, 14, 70);
    s.add(ghostPlate(T.plate, -26));
    s.add(flameTunnel(T.flames, 6, -3, 4, spin));
    const glow = plane(radialTex('rgba(228,83,43,0.55)', 'rgba(228,83,43,0)'), 16, 16, { additive: true, order: 2 });
    glow.position.set(0, 0.4, -1.2);
    s.add(glow);
    s.add(embers(220, seed, 9, 30, 6));
    const flamesFront = artLayer(T.flames, -0.25, { order: 3 });
    s.add(flamesFront);
    s.add(artLayer(T.goat, 0, { order: 4 }));
    s.add(cropLayer(T.ast, [470, 1290, 580, 1380], 1.6, { order: 5 }));
    s.add(cropLayer(T.title, [140, 360, 900, 525], 1.1, { order: 5 }));
    s.add(cropLayer(T.deal, [220, 1385, 830, 1570], 0.7, { order: 5 }));
    return s;
  }

  /* Corridor of torn cut-outs of the drawing; the camera flies through. */
  const CORRIDOR = [
    { box: [600, 560, 880, 820], x: 1.6, y: 1.2, z: -2, r: 0.10 },    // head
    { box: [180, 600, 560, 1020], x: -2.4, y: 0.6, z: -9, r: -0.14 }, // wing
    { box: [140, 360, 900, 525], x: 0.2, y: 3.2, z: -15, r: 0.05 },   // title
    { box: [420, 880, 760, 1150], x: 2.0, y: -1.6, z: -21, r: -0.08 },// ribs
    { box: [160, 500, 330, 670], x: -2.6, y: 2.4, z: -26, r: 0.3 },   // flame L
    { box: [250, 1080, 560, 1440], x: -1.6, y: -2.4, z: -32, r: 0.12 },// legs
    { box: [790, 500, 960, 670], x: 2.6, y: 2.2, z: -37, r: -0.28 },  // flame R
    { box: [380, 520, 660, 650], x: 0.0, y: -0.8, z: -43, r: 0.0 },   // logo in the art
    { box: [600, 760, 900, 960], x: -1.2, y: 1.0, z: -49, r: -0.18 }, // jaw / breath
    { box: [220, 1385, 830, 1570], x: 0.6, y: -3.0, z: -54, r: 0.06 },// make a deal
  ];
  const CORRIDOR_END = -72;

  function buildCorridor(T, img) {
    const s = new THREE.Scene();
    s.background = new THREE.Color(INK);
    s.fog = new THREE.Fog(INK, 8, 60);
    const back = ghostPlate(T.plate, CORRIDOR_END - 24);
    s.add(back);
    s.add(embers(260, 909, 7, 90, 8));
    CORRIDOR.forEach((p, i) => {
      const { tex, w, h } = tornPiece(img, p.box, 300 + i * 17);
      const m = plane(tex, w * 2.1, h * 2.1, { order: 3 });
      m.position.set(p.x, p.y, p.z);
      m.rotation.z = p.r;
      s.add(m);
      animated.push({ obj: m, fn: t => { m.rotation.z = p.r + Math.sin(t * 1.3 + i) * 0.05; } });
    });
    // the creature waiting at the end of the corridor
    const end = new THREE.Group();
    end.position.z = CORRIDOR_END;
    end.add(flameTunnel(T.flames, 4, -3, 4, 0.05));
    const glow = plane(radialTex('rgba(228,83,43,0.6)', 'rgba(228,83,43,0)'), 16, 16, { additive: true, order: 2 });
    glow.position.set(0, 0.4, -1.2);
    end.add(glow);
    end.add(artLayer(T.flames, -0.25, { order: 3 }));
    end.add(artLayer(T.goat, 0, { order: 4 }));
    end.add(cropLayer(T.title, [140, 360, 900, 525], 1.1, { order: 5 }));
    s.add(end);
    return s;
  }

  async function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    camera = new THREE.PerspectiveCamera(60, W / H, 0.05, 400);

    const [goat, flames, title, deal, ast, plate] = await Promise.all([
      'assets/cutouts/goat.png', 'assets/cutouts/flames.png', 'assets/cutouts/title.png',
      'assets/cutouts/deal.png', 'assets/cutouts/ast.png', 'assets/cutouts/bgplate.jpg',
    ].map(loadTex));
    const T = { goat, flames, title, deal, ast, plate };
    const art = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'assets/graded/s3.jpg'; });

    scenes.vertigo = buildVertigo(T, 51, 0.06);
    scenes.abyss = buildVertigo(T, 77, -0.09);
    scenes.corridor = buildCorridor(T, art);
  }

  function render(t) {
    const s = scenes[cam.scene];
    if (!s) return;
    for (const a of animated) a.fn(t);
    const D = Math.max(0.05, cam.D);
    camera.fov = cam.frameH > 0 ? THREE.MathUtils.radToDeg(2 * Math.atan(cam.frameH / (2 * D))) : cam.fov;
    camera.fov = Math.min(150, Math.max(4, camera.fov));
    camera.position.set(cam.tx + cam.shakeX, cam.ty + cam.shakeY, cam.tz + D);
    camera.rotation.set(0, 0, cam.roll);
    camera.updateProjectionMatrix();
    renderer.render(s, camera);
  }

  return { init, render, cam, toWorld, CORRIDOR_END };
})();
