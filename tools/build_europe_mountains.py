#!/usr/bin/env python3
"""Builds data/maps/europe-mountains.json — the tap areas of block 2 section 3 «Mountains of Europe» on the shared Europe base.

The ranges are taken from the artwork itself: assets/europe-mountains.webp is europe-blank.webp plus the brown shading and the
^ marks of ten ranges, so the pixels where the two images differ are the ranges. Touching ranges (the Alps and the Dinaric Alps)
are split by the nearest of hand-placed spine lines. Each area is the drawn shading widened by GROW px (a finger is wider than
the thin Balkan band); label = the point of the area farthest from its edge. The Ural Mountains are section 1's object
(europe-overview.json) and only reviewed here.

usage: python3 tools/build_europe_mountains.py
"""
import json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage as nd
import cv2
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 2200, 1600
GROW = 10

# id, unit, EN, RU, spine (px on the 2200x1600 image) used only to tell touching ranges apart
RANGES = [
 ('pyrenees', 1, 'Pyrenees', 'Пиренеи', [(660, 1165), (760, 1225)]),
 ('alps', 1, 'Alps', 'Альпы', [(850, 1200), (840, 1165), (900, 1110), (1000, 1105), (1080, 1120)]),
 ('apennines', 1, 'Apennines', 'Апеннины', [(930, 1190), (980, 1230), (1010, 1280), (1035, 1330)]),
 ('carpathians', 2, 'Carpathians', 'Карпаты', [(1140, 1065), (1240, 1070), (1300, 1140), (1320, 1165), (1290, 1195), (1230, 1200), (1220, 1165), (1250, 1140)]),
 ('balkan-mountains', 2, 'Balkan Mountains', 'Балканские горы', [(1230, 1270), (1320, 1280)]),
 ('dinaric-alps', 2, 'Dinaric Alps', 'Динарское нагорье', [(1040, 1190), (1120, 1240), (1180, 1270)]),
 ('scandinavian-mountains', 3, 'Scandinavian Mountains', 'Скандинавские горы', [(980, 740), (1100, 560), (1250, 420)]),
 ('scottish-highlands', 3, 'Scottish Highlands', 'Шотландское нагорье', [(780, 720), (820, 700)]),
 ('caucasus', 3, 'Caucasus Mountains', 'Кавказские горы', [(1590, 1190), (1850, 1240)]),
]
URAL = [(1730, 330), (1880, 840)]  # drawn too; it belongs to section 1, so its pixels are left out here

m = np.array(Image.open(ROOT / 'assets/europe-mountains.webp').convert('RGB')).astype(int)
b = np.array(Image.open(ROOT / 'assets/europe-blank.webp').convert('RGB')).astype(int)
mask = np.abs(m - b).sum(2) > 60
mask = nd.binary_closing(nd.binary_opening(mask, iterations=2), iterations=6)
lab, n = nd.label(mask)
sizes = nd.sum(mask, lab, range(1, n + 1))
keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2000])

# every shaded pixel goes to the range with the nearest spine
spines = [LineString(s) for *_, s in RANGES] + [LineString(URAL)]
owner = np.full(keep.shape, -1, int)
# a coarse raster of distances is enough: spines are far apart compared with a pixel
step = 4
gy, gx = np.mgrid[0:H:step, 0:W:step]
dg = np.stack([np.vectorize(lambda x, y, sp=sp: sp.distance(Point(x, y)))(gx, gy) for sp in spines])
near = dg.argmin(0)
owner_full = np.kron(near, np.ones((step, step), int))[:H, :W]
owner[keep] = owner_full[keep]

def to_pct(poly):
    return [[round(x / W * 100, 2), round(y / H * 100, 2)] for x, y in poly.exterior.coords[:-1]]

# widen every range by GROW px; where two widened ranges meet, a pixel belongs to the nearer drawn one, so areas never overlap
_, (iy, ix) = nd.distance_transform_edt(owner < 0, return_indices=True)
grown = owner[iy, ix]
grown[~cv2.dilate(keep.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1))).astype(bool)] = -1

items = []
for i, (id_, unit, en, ru, _) in enumerate(RANGES):
    mk = (grown == i).astype(np.uint8)
    cs, _ = cv2.findContours(mk, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polys = [Polygon(c[:, 0, :]).buffer(0) for c in cs if cv2.contourArea(c) > 800]
    shape = unary_union(polys).simplify(3)
    parts = list(getattr(shape, 'geoms', [shape]))
    # label: the pixel farthest from the edge of the (un-widened) shading
    dt = cv2.distanceTransform((owner == i).astype(np.uint8), cv2.DIST_L2, 5)
    y, x = np.unravel_index(dt.argmax(), dt.shape)
    items.append({'id': id_, 'order': i + 1, 'kind': 'mountain', 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(x / W * 100, 2), 'y': round(y / H * 100, 2)},
                  'tapArea': [to_pct(p) for p in parts]})
    print(id_, len(parts), 'parts', items[-1]['label'])

out = {
  'map': './assets/europe-mountains.webp',
  'mapAspect': '11 / 8',
  'level': 'Mountains of Europe (block 2, section 3)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for all four europe-*.webp (shared base)',
  'source': 'the shading of assets/europe-mountains.webp (pixels that differ from europe-blank.webp), widened by %d px; label = the point of the shading farthest from its edge' % GROW,
  'notes': ['Built by tools/build_europe_mountains.py.', 'The Ural Mountains are learned in section 1 (europe-overview.json) and only reviewed here.',
            'The Caucasus is marked disputed: on this map the Europe–Asia border follows the Kuma–Manych Depression (Svetlana, 26.10.2026).'],
  'items': items,
}
dst = ROOT / 'data/maps/europe-mountains.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
