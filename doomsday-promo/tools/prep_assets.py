"""Build the graded / cut-out assets for the DOOMSDAY promo.

Sources: assets/stories/doomsday-stories-{1,2,3}.png (original Stories, untouched)
Outputs:
  assets/graded/s{1,2,3}.jpg        colour-noir grade (not B&W)
  assets/cutouts/goat.png            the drawing's creature, silhouette alpha
  assets/cutouts/flames.png          the orange tribal flames only
  assets/cutouts/title.png           'doomsday' blackletter lettering
  assets/cutouts/deal.png            'make a deal with the devil'
  assets/cutouts/bgplate.jpg         stories 3 background with the drawing removed
Run:  python3 tools/prep_assets.py   (needs Pillow + numpy)
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, 'assets', *p)
W, H = 1080, 1920

# ---------------- Design DNA (colour noir) ----------------
SHADOW = np.array([0.74, 0.86, 1.00])   # steel-blue shadows
HILITE = np.array([1.05, 0.98, 0.86])   # warm bone highlights
EMBER = np.array([1.12, 0.80, 0.66])    # keeps the art's orange-red alive


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def load(n):
    return np.asarray(Image.open(A('stories', f'doomsday-stories-{n}.png')).convert('RGB')).astype(np.float32) / 255


def grade(c, exposure=1.0, gamma=1.3, keep_sat=0.2, vignette=0.6):
    l = c @ np.array([0.299, 0.587, 0.114], np.float32)
    ember = smooth(0.10, 0.30, c[..., 0] - np.maximum(c[..., 1], c[..., 2]))
    t = smooth(0.2, 0.85, l)[..., None]
    noir = l[..., None] * (SHADOW * (1 - t) + HILITE * t)
    noir = noir * (1 - keep_sat) + c * keep_sat
    noir = np.clip((noir * exposure - 0.03) / 0.97, 0, 1) ** gamma
    em = np.clip(c * EMBER, 0, 1)
    out = noir * (1 - ember[..., None]) + em * ember[..., None]
    if vignette:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r2 = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.47) / (H * 0.6)) ** 2
        out *= np.clip(1 - vignette * r2, 0.12, 1)[..., None]
    return np.clip(out, 0, 1), ember


def save_rgb(arr, path, q=90):
    Image.fromarray((arr * 255).astype(np.uint8)).save(path, quality=q)


def save_rgba(rgb, alpha, path, box=None):
    im = Image.fromarray(np.dstack([rgb * 255, alpha * 255]).astype(np.uint8), 'RGBA')
    if box:
        im = im.crop(box)
    im.save(path, optimize=True)
    return im.size


def morph(mask, op, size, times=1):
    im = Image.fromarray((mask * 255).astype(np.uint8))
    f = ImageFilter.MaxFilter(size) if op == 'dilate' else ImageFilter.MinFilter(size)
    for _ in range(times):
        im = im.filter(f)
    return np.asarray(im).astype(np.float32) / 255


def blur(mask, r):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


os.makedirs(A('graded'), exist_ok=True)
os.makedirs(A('cutouts'), exist_ok=True)

# photos: darker, moodier exposure
for n, exp in ((1, 0.82), (2, 0.78)):
    g, _ = grade(load(n), exposure=exp, gamma=1.45, keep_sat=0.22, vignette=0.75)
    save_rgb(g, A('graded', f's{n}.jpg'))

# the art
c3 = load(3)
g3, ember3 = grade(c3, exposure=1.08, gamma=1.1, keep_sat=0.5, vignette=0.3)
save_rgb(g3, A('graded', 's3.jpg'))

L = c3 @ np.array([0.299, 0.587, 0.114], np.float32)
yy, xx = np.mgrid[0:H, 0:W]

# --- flames (orange only)
flames_a = smooth(0.08, 0.22, c3[..., 0] - np.maximum(c3[..., 1], c3[..., 2]))
print('flames', save_rgba(g3, flames_a, A('cutouts', 'flames.png')))

# --- creature: bright drawing inside the creature's area, holes closed
region = (yy > 520) & (xx > 140) & (xx < 930) & ((yy < 1380) | ((yy < 1450) & (xx < 420))) & ~((yy > 1285) & (yy < 1385) & (xx > 465) & (xx < 585))
ink = (smooth(0.11, 0.22, L) * region) * (1 - flames_a)
sil = morph(ink, 'dilate', 9, 3)          # close the linework
sil = morph(sil, 'erode', 9, 3)
sil = blur(np.maximum(sil, ink), 1.2)
print('goat', save_rgba(g3, sil, A('cutouts', 'goat.png')))

# --- asterisk (white star under the creature)
ast_region = (yy > 1290) & (yy < 1380) & (xx > 470) & (xx < 580)
ast = smooth(0.5, 0.8, L) * ast_region
print('ast', save_rgba(g3, ast, A('cutouts', 'ast.png'), box=(470, 1290, 580, 1380)))

# --- lettering
title_region = (yy > 360) & (yy < 525) & (xx > 140) & (xx < 900)
title_a = smooth(0.105, 0.135, L) * title_region * (1 - flames_a)
print('title', save_rgba(g3, title_a, A('cutouts', 'title.png'), box=(140, 360, 900, 525)))
deal_region = (yy > 1385) & (yy < 1570) & (xx > 220) & (xx < 830)
deal_a = smooth(0.105, 0.135, L) * deal_region
print('deal', save_rgba(g3, deal_a, A('cutouts', 'deal.png'), box=(220, 1385, 830, 1570)))

# --- background plate: everything above removed, darker
fg = np.clip(morph(np.maximum.reduce([sil, flames_a, title_a, deal_a, ast]), 'dilate', 13, 2), 0, 1)
fg = blur(fg, 6)
plate = g3 * (1 - fg[..., None]) + (g3 * 0.08) * fg[..., None]
save_rgb(np.clip(plate * 1.5, 0, 1), A('cutouts', 'bgplate.jpg'))
print('done')
