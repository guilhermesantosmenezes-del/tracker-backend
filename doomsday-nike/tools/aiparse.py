"""Minimal Adobe Illustrator native-format (decompressed PGF text) path extractor.

Reads the AI drawing operators (m l L c C v V y Y, f F s S b B n N, Xa XA k K g G,
u U *u *U q Q) and writes JSON: a tree of groups, each leaf a filled/stroked path with
its colour and SVG path data, in AI page coordinates (y up).
usage: python3 aiparse.py native.ai out.json
"""
import json
import sys

src, dst = sys.argv[1], sys.argv[2]

root = {'type': 'g', 'kids': [], 'bbox': None}
stack = [root]
fill = [0, 0, 0]
stroke = [0, 0, 0]
lw = 1.0
cur = []            # current path segments (strings)
cpt = (0.0, 0.0)
compound = None     # list of d strings while inside *u ... *U
bbox = None


def grow(b, x, y):
    if b is None:
        return [x, y, x, y]
    return [min(b[0], x), min(b[1], y), max(b[2], x), max(b[3], y)]


def cmyk2rgb(c, m, y, k):
    return [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)]


def node_bbox(n):
    if n.get('bbox') is not None:
        return n['bbox']
    b = None
    for k in n.get('kids', []):
        kb = node_bbox(k)
        if kb:
            b = grow(grow(b, kb[0], kb[1]), kb[2], kb[3])
    n['bbox'] = b
    return b


def emit(op):
    global cur, bbox
    if not cur:
        return
    d = ' '.join(cur)
    painted_fill = op in ('f', 'F', 'b', 'B')
    painted_stroke = op in ('s', 'S', 'b', 'B')
    if compound is not None:
        compound['d'].append(d)
        if painted_fill:
            compound['fill'] = fill[:]
        if painted_stroke:
            compound['stroke'] = stroke[:]
            compound['lw'] = lw
        compound['bbox'] = grow(grow(compound['bbox'], bbox[0], bbox[1]), bbox[2], bbox[3])
    elif painted_fill or painted_stroke:
        stack[-1]['kids'].append({
            'type': 'p', 'd': d, 'fill': fill[:] if painted_fill else None,
            'stroke': stroke[:] if painted_stroke else None, 'lw': lw, 'bbox': bbox,
        })
    cur = []
    bbox = None


skip_text = 0
with open(src, 'rb') as fh:
    for raw in fh:
        line = raw.strip()
        if not line or line.startswith(b'%'):
            continue
        t = line.split()
        op = t[-1]
        try:
            if op == b'To':
                skip_text += 1
                continue
            if op == b'TO':
                skip_text = max(0, skip_text - 1)
                continue
            if skip_text:
                continue
            if op == b'm' and len(t) == 3:
                x, y = float(t[0]), float(t[1])
                cur.append(f'M{x:.2f} {y:.2f}'); cpt = (x, y); bbox = grow(bbox, x, y)
            elif op in (b'l', b'L') and len(t) == 3:
                x, y = float(t[0]), float(t[1])
                cur.append(f'L{x:.2f} {y:.2f}'); cpt = (x, y); bbox = grow(bbox, x, y)
            elif op in (b'c', b'C') and len(t) == 7:
                v = [float(a) for a in t[:6]]
                cur.append('C' + ' '.join(f'{a:.2f}' for a in v)); cpt = (v[4], v[5])
                for i in range(0, 6, 2):
                    bbox = grow(bbox, v[i], v[i + 1])
            elif op in (b'v', b'V') and len(t) == 5:
                v = [float(a) for a in t[:4]]
                cur.append(f'C{cpt[0]:.2f} {cpt[1]:.2f} ' + ' '.join(f'{a:.2f}' for a in v)); cpt = (v[2], v[3])
                bbox = grow(grow(bbox, v[0], v[1]), v[2], v[3])
            elif op in (b'y', b'Y') and len(t) == 5:
                v = [float(a) for a in t[:4]]
                cur.append(f'C{v[0]:.2f} {v[1]:.2f} {v[2]:.2f} {v[3]:.2f} {v[2]:.2f} {v[3]:.2f}'); cpt = (v[2], v[3])
                bbox = grow(grow(bbox, v[0], v[1]), v[2], v[3])
            elif op in (b'f', b's', b'b', b'n'):
                if cur:
                    cur.append('Z')
                emit(op.decode())
            elif op in (b'F', b'S', b'B', b'N'):
                emit(op.decode())
            elif op == b'Xa' and len(t) in (4, 8):     # [c m y k] r g b Xa
                fill = [float(a) for a in t[-4:-1]]
            elif op == b'XA' and len(t) in (4, 8):
                stroke = [float(a) for a in t[-4:-1]]
            elif op == b'k' and len(t) == 5:
                fill = cmyk2rgb(*[float(a) for a in t[:4]])
            elif op == b'K' and len(t) == 5:
                stroke = cmyk2rgb(*[float(a) for a in t[:4]])
            elif op == b'g' and len(t) == 2:
                g = float(t[0]); fill = [g, g, g]
            elif op == b'G' and len(t) == 2:
                g = float(t[0]); stroke = [g, g, g]
            elif op == b'w' and len(t) == 2:
                lw = float(t[0])
            elif op in (b'u', b'q') and len(t) == 1:
                g = {'type': 'g', 'kids': [], 'bbox': None, 'clip': op == b'q'}
                stack[-1]['kids'].append(g); stack.append(g)
            elif op in (b'U', b'Q') and len(t) == 1:
                if len(stack) > 1:
                    stack.pop()
            elif op == b'*u' and len(t) == 1:
                compound = {'type': 'p', 'd': [], 'fill': None, 'stroke': None, 'lw': lw, 'bbox': None, 'compound': True}
            elif op == b'*U' and len(t) == 1:
                if compound and (compound['fill'] or compound['stroke']):
                    compound['d'] = ' '.join(compound['d'])
                    stack[-1]['kids'].append(compound)
                compound = None
        except ValueError:
            continue

node_bbox(root)


def count(n):
    return 1 if n['type'] == 'p' else sum(count(k) for k in n['kids'])


json.dump(root, open(dst, 'w'))
print('paths', count(root), 'bbox', root['bbox'])
for i, k in enumerate(root['kids'][:60]):
    print(i, k['type'], count(k), [round(v) for v in (k['bbox'] or [0, 0, 0, 0])])
