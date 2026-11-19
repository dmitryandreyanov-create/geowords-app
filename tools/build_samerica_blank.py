#!/usr/bin/env python3
"""Builds assets/samerica-blank.webp — the shared base of the block 5 «South America» maps, in the style of
assets/namerica-blank.webp: South America in sand colour, other land grey, water light at the coast and darker in the open
sea, dark brown coastlines, a dashed line on the Panama–Colombia border and the equator and the Tropic of Capricorn as thin
lines. Also the magnifier of the south of the continent assets/samerica-south.webp (1540×1120): an exact piece of the
base drawn at a larger scale, and its data data/maps/samerica-south.json (the 🔍 format of data/maps/namerica-lesser-antilles.json).

Source: Natural Earth 1:10m land and lakes (https://github.com/nvkelso/natural-earth-vector, geojson/).
usage: python3 tools/build_samerica_blank.py <natural-earth-dir>
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, gaussian_filter
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union
import samerica_base as B

NE = sys.argv[1]
TAN, GREY, SHALLOW, DEEP, COAST, LINE = (221, 181, 122), (129, 128, 133), (225, 234, 236), (129, 166, 178), (70, 58, 50), (52, 84, 112)

land = unary_union([g for _, g in B.load(NE, 'ne_10m_land')]).intersection(B.VIEW)
lakes = unary_union([g for p, g in B.load(NE, 'ne_10m_lakes') if p.get('scalerank', 9) <= 2]).intersection(B.VIEW)
land = land.difference(lakes)
sa = land.intersection(B.sa_region(land))
big = unary_union([p for p in getattr(land, 'geoms', [land]) if p.area >= 1.0])

def polys(g):
    return [p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon)]

def render(pxfn, OW, OH, S, K=1.0, minArea=0.02):
    """the map drawn with pxfn (lon, lat → pixels of the OW×OH output), supersampled S times; K scales the coast
    width, the shelf width and the noise to the output scale."""
    W, H = OW * S, OH * S
    ring = lambda c: [(x * S, y * S) for x, y in (pxfn(a, b) for a, b in c)]
    def mask(g):
        im = Image.new('L', (W, H), 0)
        d = ImageDraw.Draw(im)
        for p in polys(g):
            d.polygon(ring(p.exterior.coords), fill=255)
            for h in p.interiors: d.polygon(ring(h.coords), fill=0)
        return np.asarray(im) > 127
    L = mask(land)
    A = mask(sa) & L
    rng = np.random.default_rng(7)
    def noise(sigma, amp):
        return gaussian_filter(rng.standard_normal((H, W)), sigma) * amp / gaussian_filter(rng.standard_normal((H, W)), sigma).std()
    dist = distance_transform_edt(~mask(big)) / S / K
    t = np.clip(dist / 150 + noise(70 * S * K, 0.06), 0, 1)
    t = t * t * (3 - 2 * t)
    water = np.array(SHALLOW)[None, None] * (1 - t[..., None]) + np.array(DEEP)[None, None] * t[..., None]
    img = water + noise(6 * S, 3)[..., None]
    grain = noise(1.2 * S, 4)[..., None] + noise(25 * S * K, 5)[..., None]
    img = np.where(L[..., None], np.array(GREY)[None, None] + grain, img)
    img = np.where(A[..., None], np.array(TAN)[None, None] + grain * 1.3, img)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for p in polys(land):
        if p.area < minArea: continue
        for c in [p.exterior.coords] + [h.coords for h in p.interiors]:
            d.line(ring(c), fill=COAST, width=3 * S, joint='curve')
    def dashed(line, color, dash, step):
        pos = 0.0
        while pos < line.length:
            a = [line.interpolate(min(q, line.length)) for q in np.arange(pos, pos + dash, S / 2)]
            if len(a) > 1: d.line([(q.x, q.y) for q in a], fill=color, width=3 * S if color == COAST else 2 * S)
            pos += step
    on = LineString(B.PANAMA_COLOMBIA).intersection(land.buffer(0.05))
    for seg in getattr(on, 'geoms', [on]):
        if seg.is_empty or seg.geom_type != 'LineString': continue
        dashed(LineString(ring(seg.coords)), COAST, 10 * S, 18 * S)
    for lat in (0.0, -23.44):
        dashed(LineString(ring([(lon / 4, lat) for lon in range(-500, 21)])), LINE, 14 * S, 22 * S)
    return im.resize((OW, OH), Image.LANCZOS)

render(B.px, B.W, B.H, 2).save(B.ROOT / 'assets/samerica-blank.webp', quality=90)
print('wrote assets/samerica-blank.webp')

# ---- the magnifier of the south: Tierra del Fuego, the Strait of Magellan, Cape Froward and Cape Horn ----
from shapely.geometry import box
x0, y0, x1, y1 = B.proj(land.intersection(box(-74.5, -56.2, -63.5, -52.3)), B.pct).bounds
MS = round(max(x1 - x0, y1 - y0) + 1.6, 2)      # % of the map, the same in x and y (11:8)
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
MX, MY = round(cx - MS / 2, 2), round(cy - MS / 2, 2)
OW, OH = 1540, 1120
KM = OW / (MS / 100 * B.W)
def mag_px(lon, lat):
    x, y = B.pct(lon, lat)
    return (x - MX) / MS * OW, (y - MY) / MS * OH
render(mag_px, OW, OH, 2, K=KM, minArea=0.0005).save(B.ROOT / 'assets/samerica-south.webp', 'WEBP', quality=88, method=6)
print('wrote assets/samerica-south.webp frame', (MX, MY, MS), 'scale', round(KM, 2))
mx, my = B.pct(-60.5, -55.6)
south = {
  'map': './assets/samerica-south.webp',
  'of': './assets/samerica-blank.webp',
  'level': 'The south of South America, large: South America section 1',
  'coordinateSystem': 'frame: the piece of samerica-blank.webp this map shows, in % of that map (x, y = top left; w, h = size). A point (u, v) in % of this map is (x + u·w/100, y + v·h/100) there, so tap areas of samerica-overview.json apply unchanged.',
  'source': 'Built by tools/build_samerica_blank.py (an exact piece of the South America base drawn at %.1f× scale)' % KM,
  'frame': {'x': MX, 'y': MY, 'w': MS, 'h': MS},
  'aspect': '11 / 8',
  'magnifier': {'x': round(mx, 2), 'y': round(my, 2)},
  'objects': ['sa-cape-froward', 'sa-tierra-del-fuego', 'sa-strait-of-magellan', 'sa-cape-horn'],
}
(B.ROOT / 'data/maps/samerica-south.json').write_text(json.dumps(south, ensure_ascii=False, indent=1) + '\n')
print('wrote data/maps/samerica-south.json')
