/* =========================================================
   FX helpers — deterministic (seeded) so every play / every
   rendered frame looks exactly the same.
   ========================================================= */
const FX = (() => {
  const W = 1080, H = 1920;

  /* xorshift32 seeded RNG */
  function rng(seed) {
    let s = (seed >>> 0) || 0x9e3779b9;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* ---------- Torn paper edges ---------- */
  /* One jitter value per perimeter point, in [-1, 1]. Mixes a coarse random
     walk (big tears) with fine noise (paper fibres). */
  function makeEdge(seed, perSide = 26) {
    const r = rng(seed);
    const n = perSide * 4, out = new Array(n);
    let walk = 0;
    for (let i = 0; i < n; i++) {
      walk = walk * 0.62 + (r() * 2 - 1) * 0.75;
      const spike = r() < 0.08 ? (r() * 2 - 1) * 1.4 : 0;
      out[i] = Math.max(-1.6, Math.min(1.6, walk * 0.7 + (r() * 2 - 1) * 0.45 + spike));
    }
    return out;
  }

  /* Polygon around rect [x0,y0,x1,y1]; each side jittered perpendicular to
     itself by edge[i]*amp; `outset` pushes the outline outwards. */
  function tornPolygon(x0, y0, x1, y1, amp, edge, outset = 0) {
    const n = edge.length / 4;
    const p = [];
    const f = v => v.toFixed(1) + 'px';
    for (let i = 0; i < n; i++) { const t = i / n; p.push(f(x0 + (x1 - x0) * t) + ' ' + f(y0 - outset + edge[i] * amp)); }
    for (let i = 0; i < n; i++) { const t = i / n; p.push(f(x1 + outset + edge[n + i] * amp) + ' ' + f(y0 + (y1 - y0) * t)); }
    for (let i = 0; i < n; i++) { const t = i / n; p.push(f(x1 - (x1 - x0) * t) + ' ' + f(y1 + outset + edge[2 * n + i] * amp)); }
    for (let i = 0; i < n; i++) { const t = i / n; p.push(f(x0 - outset + edge[3 * n + i] * amp) + ' ' + f(y1 - (y1 - y0) * t)); }
    return 'polygon(' + p.join(',') + ')';
  }

  /* ---------- Canvas textures ---------- */
  function canvas(w = W, h = H) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return [c, c.getContext('2d')];
  }

  function speckle(ctx, r, count, w, h, maxR, color, alphaMax) {
    for (let i = 0; i < count; i++) {
      ctx.globalAlpha = r() * alphaMax;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, r() * maxR + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* Dirty photocopied paper: white, grime clusters, toner streaks,
     folds, scratches, darkened xerox borders. */
  function grungePaper(seed, { dark = 1 } = {}) {
    const [c, ctx] = canvas();
    const r = rng(seed);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, W, H);

    // per-pixel paper noise
    const img = ctx.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 242 - (r() * 26) * dark;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(img, 0, 0);

    // grime clusters (soft blotches)
    for (let k = 0; k < 26; k++) {
      const cx = r() * W, cy = r() * H, rad = 60 + r() * 260;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `rgba(0,0,0,${(0.05 + r() * 0.1) * dark})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    // toner splatter clusters
    for (let k = 0; k < 14; k++) {
      const cx = r() * W, cy = r() * H, spread = 40 + r() * 160;
      for (let i = 0; i < 160; i++) {
        const a = r() * Math.PI * 2, dd = Math.pow(r(), 2) * spread;
        ctx.globalAlpha = (0.25 + r() * 0.6) * dark;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * dd, cy + Math.sin(a) * dd, r() * 3.2 + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    speckle(ctx, r, 2600, W, H, 1.6, '#000', 0.55 * dark);

    // vertical toner streaks (bad copier drum)
    for (let k = 0; k < 9; k++) {
      const x = r() * W, w = 1 + r() * 7;
      ctx.globalAlpha = (0.04 + r() * 0.1) * dark;
      ctx.fillStyle = '#000';
      ctx.fillRect(x, 0, w, H);
    }
    // folds
    ctx.globalAlpha = 0.16 * dark; ctx.fillStyle = '#000';
    ctx.fillRect(0, H * (0.48 + r() * 0.04), W, 2);
    ctx.fillRect(W * (0.47 + r() * 0.06), 0, 2, H);
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff';
    ctx.fillRect(0, H * 0.5 + 3, W, 2);
    // scratches
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 40; k++) {
      ctx.globalAlpha = (0.08 + r() * 0.25) * dark;
      ctx.strokeStyle = r() < 0.5 ? '#000' : '#fff';
      ctx.beginPath();
      const x = r() * W, y = r() * H, len = 30 + r() * 220, a = r() * Math.PI;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * len * .5 + (r() - .5) * 30, y + Math.sin(a) * len * .5, x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // dark xerox border burn
    const edge = ctx.createLinearGradient(0, 0, W, 0);
    edge.addColorStop(0, `rgba(0,0,0,${0.35 * dark})`); edge.addColorStop(0.07, 'rgba(0,0,0,0)');
    edge.addColorStop(0.93, 'rgba(0,0,0,0)'); edge.addColorStop(1, `rgba(0,0,0,${0.4 * dark})`);
    ctx.fillStyle = edge; ctx.fillRect(0, 0, W, H);
    const edgeV = ctx.createLinearGradient(0, 0, 0, H);
    edgeV.addColorStop(0, `rgba(0,0,0,${0.3 * dark})`); edgeV.addColorStop(0.05, 'rgba(0,0,0,0)');
    edgeV.addColorStop(0.95, 'rgba(0,0,0,0)'); edgeV.addColorStop(1, `rgba(0,0,0,${0.35 * dark})`);
    ctx.fillStyle = edgeV; ctx.fillRect(0, 0, W, H);
    return c.toDataURL('image/jpeg', 0.86);
  }

  /* Transparent dirt layer to multiply over photos (xerox dust). */
  function photoDirt(seed) {
    const [c, ctx] = canvas();
    const r = rng(seed);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); // multiply-neutral
    speckle(ctx, r, 1800, W, H, 1.8, '#000', 0.7);
    for (let k = 0; k < 6; k++) {
      ctx.globalAlpha = 0.05 + r() * 0.08; ctx.fillStyle = '#000';
      ctx.fillRect(r() * W, 0, 1 + r() * 4, H);
    }
    ctx.globalAlpha = 1;
    return c.toDataURL('image/jpeg', 0.8);
  }

  /* Film grain frames, cycled by the timeline. */
  function grainFrames(count = 6, seed = 77) {
    const out = [];
    const w = 540, h = 960;
    for (let f = 0; f < count; f++) {
      const [c, ctx] = canvas(w, h);
      const r = rng(seed + f * 101);
      const img = ctx.createImageData(w, h), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 128 + (r() + r() + r() - 1.5) * 120;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      // dust & hair
      speckle(ctx, r, 14, w, h, 2.4, r() < .5 ? '#fff' : '#000', 0.9);
      if (r() < 0.6) {
        ctx.globalAlpha = 0.6; ctx.fillStyle = r() < 0.5 ? '#fff' : '#000';
        ctx.fillRect(r() * w, 0, 1, h);
        ctx.globalAlpha = 1;
      }
      out.push(c.toDataURL('image/jpeg', 0.7));
    }
    return out;
  }

  return { rng, makeEdge, tornPolygon, grungePaper, photoDirt, grainFrames, W, H };
})();
