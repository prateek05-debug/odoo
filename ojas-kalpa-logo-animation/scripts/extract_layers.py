"""Split the flat Ojas Kalpa logo into transparent, individually animatable layers.

The source is a single RGB image on a white background. We:
  1. un-mix white ("colour to alpha") so every pixel gets a true alpha + colour,
  2. find connected shapes (rays, leaves, letters, ...) on a confident mask,
  3. hand every faint pixel (soft edges, glow) to its nearest shape,
  4. name each shape by where it sits, and write one cropped PNG per layer
     plus layers.json with its position in the original 1672x941 "logo space".

Usage: python3 -I scripts/extract_layers.py assets/source-logo.webp public/layers
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = rgb.shape

# 1. colour-to-alpha against white
alpha = (255 - rgb).max(axis=2) / 255
alpha = np.clip((alpha - 0.025) / 0.975, 0, 1)
safe = np.maximum(alpha, 1e-4)[..., None]
colour = np.clip((rgb - 255 * (1 - alpha[..., None])) / safe, 0, 255)

# 2. confident shapes
lab, n = ndi.label(alpha > 0.25, structure=np.ones((3, 3)))
sizes = ndi.sum(np.ones_like(alpha), lab, index=np.arange(1, n + 1))
for i, s in enumerate(sizes, 1):
    if s < 30:
        lab[lab == i] = 0

# 3. every visible pixel joins its nearest shape
_, (iy, ix) = ndi.distance_transform_edt(lab == 0, return_indices=True)
owner = lab[iy, ix]
owner[alpha <= 0.004] = 0


def info(i):
    ys, xs = np.nonzero(lab == i)
    px = rgb[ys, xs]
    green = px[:, 1].mean() > px[:, 0].mean() * 0.9
    return dict(cx=xs.mean(), cy=ys.mean(), x0=xs.min(), x1=xs.max(), y0=ys.min(), y1=ys.max(),
                area=len(xs), green=green)


comps = {i: info(i) for i in np.unique(lab) if i}

# Specular highlights inside letters/leaves are near-white, so colour-to-alpha would punch
# see-through specks into them. Make each shape's interior solid again (small holes only,
# so letter counters like O / A / P stay open) and keep its original colour there.
for i, sl in enumerate(ndi.find_objects(lab), 1):
    if sl is None:
        continue
    sl = tuple(slice(max(0, s.start - 4), s.stop + 4) for s in sl)
    shape = ndi.binary_closing(lab[sl] == i, iterations=1)
    holes, nh = ndi.label(ndi.binary_fill_holes(shape) & ~shape)
    if nh:
        area = ndi.sum(np.ones_like(holes), holes, index=np.arange(1, nh + 1))
        shape |= np.isin(holes, 1 + np.nonzero(area <= 150)[0])
    inner = ndi.binary_erosion(shape, iterations=1)
    alpha[sl][inner] = 1
    colour[sl][inner] = rgb[sl][inner]
HEAD_C = None
groups = {}  # name -> list of component ids


def add(name, i):
    groups.setdefault(name, []).append(i)


# head = round gold blob in the emblem centre; body = biggest gold shape there
emblem_gold = [i for i, c in comps.items() if c['cx'] < 600 and not c['green']]
body = max((i for i in emblem_gold if 260 < comps[i]['cx'] < 420), key=lambda i: comps[i]['area'])
head = min((i for i in emblem_gold if 300 < comps[i]['cx'] < 380 and 320 < comps[i]['cy'] < 390),
           key=lambda i: abs(comps[i]['cy'] - 353))
hx, hy = comps[head]['cx'], comps[head]['cy']
add('figure-body', body)
add('figure-head', head)

rays = []
for i in emblem_gold:
    c = comps[i]
    if i in (body, head):
        continue
    if c['cy'] < 370:
        rays.append(i)
    else:
        add('swirl-left' if c['cx'] < hx else 'swirl-right', i)
rays.sort(key=lambda i: math.atan2(comps[i]['cy'] - hy, comps[i]['cx'] - hx))
for k, i in enumerate(rays):
    add(f'ray-{k:02d}', i)

leaves = [i for i, c in comps.items() if c['cx'] < 600 and c['green']]
for i in leaves:
    c = comps[i]
    side = 'left' if c['cx'] < hx else 'right'
    tier = 'lower' if c['cy'] > 520 else ('outer' if abs(c['cx'] - hx) > 160 else 'upper')
    add(f'leaf-{side}-{tier}', i)

# wordmark: one layer per glyph (K and A touch, so they are split below)
letters = sorted((i for i, c in comps.items() if c['cx'] >= 600 and c['cy'] < 505), key=lambda i: comps[i]['cx'])
word_names = ['O', 'J', 'A1', 'S', 'KA', 'L', 'P', 'A3']
for name, i in zip(word_names, letters):
    add(f'letter-{name}', i)

for i, c in comps.items():
    if c['cx'] < 600 or c['cy'] < 505:
        continue
    if c['cy'] < 615:
        if c['cx'] < 795:
            add('ornament-left', i)
        elif c['cx'] > 1424:
            add('ornament-right', i)
        elif c['cx'] < 1050:
            add('tagline-word1', i)
        else:
            add('tagline-word2', i)
    else:
        add('flourish-bud' if abs(c['cx'] - 1093) < 32 else
            ('flourish-left' if c['cx'] < 1093 else 'flourish-right'), i)

# split the touching "KA" at the thinnest column between the two glyphs
ka = groups.pop('letter-KA')
ka_mask = np.isin(owner, ka)
cols = ka_mask[:, 1180:1290].sum(axis=0)
cut = 1180 + int(np.argmin(cols))

layers = []


def write(name, mask, kind):
    ys, xs = np.nonzero(mask & (alpha > 0.004))
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    a = np.where(mask, alpha, 0)[y0:y1, x0:x1]
    rgba = np.dstack([colour[y0:y1, x0:x1], a * 255]).round().astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(os.path.join(out, f'{name}.png'), optimize=True)
    layers.append(dict(name=name, kind=kind, x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0)))


xx = np.arange(W)[None, :]
write('letter-K', ka_mask & (xx < cut), 'letter')
write('letter-A2', ka_mask & (xx >= cut), 'letter')
for name, ids in sorted(groups.items()):
    write(name, np.isin(owner, ids), name.split('-')[0])

# full-logo and emblem-only masters (used for light sweeps / reference)
write('master-full', owner > 0, 'master')
emblem_ids = [i for i, c in comps.items() if c['cx'] < 600]
write('master-emblem', np.isin(owner, emblem_ids), 'master')

meta = dict(width=W, height=H, head=dict(x=float(hx), y=float(hy)),
            emblemBase=dict(x=float(hx), y=600.0), layers=layers)
with open(os.path.join(out, 'layers.json'), 'w') as f:
    json.dump(meta, f, indent=1)
print(len(layers), 'layers ->', out, '| KA cut at x =', cut)
