#!/usr/bin/env python3
"""Builds assets/namerica-blank.webp — the shared base of the block 4 «North America» maps, in the style of assets/europe-blank.webp:
North America in sand colour, other land grey, water light at the coast and darker in the open sea, dark brown coastlines and a
dashed line where Asia meets Europe and Africa on land.

Source: Natural Earth 1:10m land, lakes and rivers (https://github.com/nvkelso/natural-earth-vector, geojson/).
usage: python3 tools/build_asia_blank.py <natural-earth-dir>
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import distance_transform_edt, gaussian_filter
from shapely.geometry import Polygon, MultiPolygon, Point
from shapely.ops import unary_union
import namerica_base as B

NE = sys.argv[1]
S = 2  # supersampling
W, H = B.W * S, B.H * S
TAN, GREY, SHALLOW, DEEP, COAST = (221, 181, 122), (129, 128, 133), (225, 234, 236), (129, 166, 178), (70, 58, 50)

land = unary_union([g for _, g in B.load(NE, 'ne_10m_land')]).intersection(B.VIEW)
lakes = unary_union([g for p, g in B.load(NE, 'ne_10m_lakes') if p.get('scalerank', 9) <= 2]).intersection(B.VIEW)
land = land.difference(lakes)
asia = land.intersection(B.na_region(land))  # the North American land (name kept from the Asia script)

def polys(g):
    return [p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon)]
def ring(c):
    return [(x * S, y * S) for x, y in (B.px(a, b) for a, b in c)]

def mask(g):
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    for p in polys(g):
        d.polygon(ring(p.exterior.coords), fill=255)
        for h in p.interiors: d.polygon(ring(h.coords), fill=0)
    return np.asarray(im) > 127

L = mask(land)
A = mask(asia) & L
# the shelf (light water) follows the big coasts only: the specks of the Pacific islands would whiten the open ocean
big = unary_union([p for p in polys(land) if p.area >= 1.0])
rng = np.random.default_rng(7)
def noise(sigma, amp):
    return gaussian_filter(rng.standard_normal((H, W)), sigma) * amp / gaussian_filter(rng.standard_normal((H, W)), sigma).std()

# water: light near the coast, deeper away from it, with soft blotches like the Europe maps
dist = distance_transform_edt(~mask(big)) / S
t = np.clip(dist / 150 + noise(70 * S, 0.06), 0, 1)
t = t * t * (3 - 2 * t)
water = np.array(SHALLOW)[None, None] * (1 - t[..., None]) + np.array(DEEP)[None, None] * t[..., None]
img = water + noise(6 * S, 3)[..., None]
grain = noise(1.2 * S, 4)[..., None] + noise(25 * S, 5)[..., None]
img = np.where(L[..., None], np.array(GREY)[None, None] + grain, img)
img = np.where(A[..., None], np.array(TAN)[None, None] + grain * 1.3, img)
im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

d = ImageDraw.Draw(im)
for p in polys(land):
    if p.area < 0.02: continue
    for c in [p.exterior.coords] + [h.coords for h in p.interiors]:
        d.line(ring(c), fill=COAST, width=3 * S, joint='curve')

# dashed border of North America on land: Panama–Colombia
from shapely.geometry import LineString
for line in (LineString(B.PANAMA_COLOMBIA),):
    on = line.intersection(land.buffer(0.05))
    for seg in getattr(on, 'geoms', [on]):
        if seg.is_empty or seg.geom_type != 'LineString': continue
        segP = LineString([(x * S, y * S) for x, y in (B.px(a, b) for a, b in seg.coords)])
        step, dash = 18 * S, 10 * S
        pos = 0.0
        while pos < segP.length:
            a, b = segP.interpolate(pos), segP.interpolate(min(pos + dash, segP.length))
            d.line([(a.x, a.y), (b.x, b.y)], fill=COAST, width=3 * S)
            pos += step

im = im.resize((B.W, B.H), Image.LANCZOS)
out = B.ROOT / 'assets/namerica-blank.webp'
im.save(out, quality=90)
print('wrote', out)
