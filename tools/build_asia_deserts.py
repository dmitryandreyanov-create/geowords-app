#!/usr/bin/env python3
"""Builds data/maps/asia-deserts.json and assets/asia-deserts.webp for block 3 section 5 «Deserts of Asia»: the 10 deserts
shaded on the Asia rivers map (assets/asia-rivers.webp, the shared base of tools/asia_base.py), so that the rivers that frame them
(the Huang He bend round the Ordos, the Amu Darya and the Syr Darya round the Kyzylkum) stay in sight.

Three looks, so a child sees that a desert is not always sand (Svetlana, 31.10.2026): sand (yellow with sand dots), stony
(grey-brown with pebbles: the Gobi, the Negev) and salt (cream with a brown net of cracks in the crust: the Dasht-e Kavir; an
earlier near-white fill read as a lake, Svetlana 31.10.2026).
Source: Natural Earth 1:10m geography regions (polygons). The Ordos is the Natural Earth polygon named
«Mu Us Desert», which covers the whole desert region inside the Huang He bend (37.2–40.9° N): the Mu Us and the Kubuqi sands
together, so it is drawn as the conventional outline of the Ordos desert region, not one sand sea (Svetlana, 31.10.2026); the Negev is small on a phone, so the app shows it in a zoom inset like the Dead Sea (Svetlana, 31.10.2026).
Touching deserts (the Gobi and the Ordos, the Karakum and the Kyzylkum) are kept GAP px apart; the later one in the list gives way.
Tap areas are the drawn shapes widened by GROW px without overlapping.

usage: python3 tools/build_asia_deserts.py <natural-earth-dir>
"""
import json, sys, math
import numpy as np
import cv2
from scipy import ndimage as nd
from shapely.geometry import box, Point, Polygon
from shapely.ops import unary_union
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import asia_base as B

NE = sys.argv[1]
FRAME = box(0, 0, B.W, B.H)
GAP, GROW, SS = 8, 10, 4
LOOK = {  # fill, mark colour
  'sand': ((246, 214, 120), (196, 136, 52)),
  'stony': ((186, 168, 150), (104, 90, 78)),
  'salt': ((236, 222, 188), (150, 118, 82)),  # cream crust with brown cracks: never white, so it is not read as water (Svetlana, 31.10.2026)
}
# id, unit, look, Natural Earth names, EN, RU
OBJECTS = [
 ('as-taklamakan', 1, 'sand', ['TAKLIMAKAN DESERT'], 'Taklamakan Desert', 'Такла-Макан'),
 ('as-ordos', 1, 'sand', ['Mu Us Desert'], 'Ordos Desert', 'Ордос'),
 ('as-gobi', 1, 'stony', ['GOBI DESERT'], 'Gobi Desert', 'Гоби'),
 ('as-kyzylkum', 2, 'sand', ['QIZILQUM DESERT'], 'Kyzylkum Desert', 'Кызылкум'),
 ('as-karakum', 2, 'sand', ['GARAGUM DESERT'], 'Karakum Desert', 'Каракумы'),
 ('as-kavir', 2, 'salt', ['Kavir Desert'], 'Dasht-e Kavir', 'Деште-Кевир'),
 ('as-lut', 2, 'sand', ['LUT DESERT'], 'Dasht-e Lut', 'Деште-Лут'),
 ('as-thar', 3, 'sand', ['THAR DESERT'], 'Thar Desert', 'Тар'),
 ('as-rub-al-khali', 3, 'sand', ['RUB’ AL KHALI'], 'Rub’ al Khali', 'Руб-эль-Хали'),
 ('as-negev', 3, 'stony', ['Negev Desert'], 'Negev Desert', 'Негев'),
]
ZOOM = {'as-negev'}
polys = B.load(NE, 'ne_10m_geography_regions_polys', 'NAME')

shapes = {}
for id_, unit, look, names, *_ in OBJECTS:
    gs = [g for p, g in polys if p.get('NAME') in names]
    assert len(gs) == len(names), id_
    shapes[id_] = B.proj(unary_union([g.buffer(0.02) for g in gs])).intersection(FRAME)
done = []
for id_, *_ in OBJECTS:
    g = shapes[id_]
    for other in done:
        if g.distance(shapes[other]) < GAP: g = g.difference(shapes[other].buffer(GAP))
    g = g.buffer(0)
    shapes[id_] = max(getattr(g, 'geoms', [g]), key=lambda p: p.area)
    done.append(id_)

im = Image.open(B.ROOT / 'assets/asia-rivers.webp').convert('RGB'); W, H = im.size
# land of the base image (sea, lakes and rivers are bluish): the shading never covers water, so rivers through a desert stay drawn
_a = np.array(im).astype(int)
LAND = Image.fromarray(((_a[..., 2] < _a[..., 0] + 8) * 255).astype(np.uint8))
def mask(geoms, blur):
    m = Image.new('L', (W * SS, H * SS), 0); d = ImageDraw.Draw(m)
    for g in geoms:
        for p in getattr(g, 'geoms', [g]):
            if p.geom_type != 'Polygon' or p.area < 4: continue
            d.polygon([(x * SS, y * SS) for x, y in p.exterior.coords], fill=255)
            for r in p.interiors: d.polygon([(x * SS, y * SS) for x, y in r.coords], fill=0)
    m = m.resize((W, H), Image.LANCZOS)
    return ImageChops.multiply(m.filter(ImageFilter.GaussianBlur(blur)) if blur else m, LAND)

rng = np.random.default_rng(5)
for look, (fill, mark) in LOOK.items():
    ids = [o[0] for o in OBJECTS if o[2] == look]
    mk = mask([shapes[i] for i in ids], 1.5)
    im.paste(Image.new('RGB', (W, H), fill), (0, 0), mk.point(lambda v: v * 0.95))
    # texture: sand dots, pebbles or salt strokes on a jittered grid inside the shapes (not too near the edge)
    tex = Image.new('L', (W * SS, H * SS), 0); dt = ImageDraw.Draw(tex)
    step = {'sand': 9, 'stony': 12, 'salt': 10}[look]
    for i in ids:
        g = shapes[i].buffer(-3); x0, y0, x1, y1 = shapes[i].bounds
        for y in np.arange(y0, y1, step):
            for x in np.arange(x0 + (step / 2 if int(y / step) % 2 else 0), x1, step):
                px_, py_ = x + rng.uniform(-2, 2), y + rng.uniform(-2, 2)
                if not g.contains(Point(px_, py_)) or not LAND.getpixel((int(px_), int(py_))): continue
                X, Y = px_ * SS, py_ * SS
                if look == 'sand': r = 1.3 * SS; dt.ellipse([X - r, Y - r, X + r, Y + r], fill=255)
                elif look == 'stony': r = 2.1 * SS; dt.ellipse([X - r, Y - r * 0.7, X + r, Y + r * 0.7], fill=255)
                else:  # a cell of the crack net: three short strokes meeting at a point, like a cracked salt crust
                    for a in (90, 210, 330):
                        r = math.radians(a + rng.uniform(-15, 15))
                        dt.line([(X, Y), (X + 5.5 * SS * math.cos(r), Y - 5.5 * SS * math.sin(r))], fill=255, width=round(1.4 * SS))
    im.paste(Image.new('RGB', (W, H), mark), (0, 0), tex.resize((W, H), Image.LANCZOS).point(lambda v: v * 0.8))
# a thin darker rim, so a desert reads as one object
rim = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(rim)
for id_, *_ in OBJECTS:
    for p in getattr(shapes[id_], 'geoms', [shapes[id_]]):
        dr.line([(x * SS, y * SS) for x, y in p.exterior.coords], fill=255, width=round(1.6 * SS), joint='curve')
im.paste(Image.new('RGB', (W, H), (150, 110, 60)), (0, 0), ImageChops.multiply(rim.resize((W, H), Image.LANCZOS), LAND).point(lambda v: v * 0.7))
im.save(B.ROOT / 'assets/asia-deserts.webp', 'WEBP', quality=90, method=6)

owner = np.full((H, W), -1, int)
for i, (id_, *_) in enumerate(OBJECTS):
    m = np.array(mask([shapes[id_]], 0)) > 60
    owner[m & (owner < 0)] = i
_, (iy, ix) = nd.distance_transform_edt(owner < 0, return_indices=True)
grown = owner[iy, ix]
grown[~cv2.dilate((owner >= 0).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1))).astype(bool)] = -1

pc = lambda c: [[round(100 * x / W, 2), round(100 * y / H, 2)] for x, y in c]
items = []
for i, (id_, unit, look, names, en, ru) in enumerate(OBJECTS):
    cs, _ = cv2.findContours((grown == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    parts = [Polygon(c[:, 0, :]).buffer(0).simplify(2) for c in cs if cv2.contourArea(c) > 300]
    dtm = cv2.distanceTransform((owner == i).astype(np.uint8), cv2.DIST_L2, 5)
    y, x = np.unravel_index(dtm.argmax(), dtm.shape); lab = Point(x, y)
    items.append({'id': id_, 'order': i + 1, 'kind': 'desert', 'look': look, 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(100 * lab.x / W, 2), 'y': round(100 * lab.y / H, 2)},
                  'tapArea': [pc(p.exterior.coords) for p in parts], **({'zoomInset': True} if id_ in ZOOM else {})})
    print(id_, look, len(parts), 'parts', round(shapes[id_].area), items[-1]['label'])

out = {
  'map': './assets/asia-deserts.webp',
  'mapAspect': '11 / 8',
  'level': 'Deserts of Asia (block 3, section 5)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for every asia-*.webp (shared base, tools/asia_base.py)',
  'source': 'Natural Earth 1:10m geography regions (polygons), projected like asia-overview.json; drawn on assets/asia-rivers.webp',
  'notes': ['Built by tools/build_asia_deserts.py, which also draws assets/asia-deserts.webp.',
            'Looks: sand, stony (Gobi, Negev), salt (Dasht-e Kavir). Touching deserts are kept %d px apart.' % GAP,
            'The Ordos is the Natural Earth polygon «Mu Us Desert», which covers the whole desert region inside the Huang He bend (the Mu Us and the Kubuqi sands): a conventional outline of a desert region, not one sand sea. The Negev is shown in a zoom inset on its card.'],
  'items': items,
}
dst = B.ROOT / 'data/maps/asia-deserts.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
