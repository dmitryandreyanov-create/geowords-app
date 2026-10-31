#!/usr/bin/env python3
"""Builds data/maps/asia-mountains.json and assets/asia-mountains.webp for block 3 section 4 «Mountains of Asia»: brown
shading with ^ marks for the ranges, a lighter shading for the Plateau of Tibet and red cones for the three volcanoes, on the
Asia base (assets/asia-blank.webp, tools/asia_base.py) in the style of assets/europe-mountains.webp.

Source: Natural Earth 1:10m geography regions (polygons of ranges and the plateau; the Sayan Mountains are the Western and the
Eastern Sayan, the Caucasus is the Greater and the Lesser Caucasus) and elevation points (the volcanoes). Ranges of the
mountain knot touch each other in Natural Earth, so every range keeps a GAP px seam from its neighbours and the plateau is
drawn only where no range is. Tap areas are the drawn shapes widened by GROW px without overlapping; a volcano is tapped in a
circle of VOLC_R px.

usage: python3 tools/build_asia_mountains.py <natural-earth-dir>
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
SHADE, PLATEAU, MARK = (165, 115, 65), (196, 150, 96), (62, 52, 42)
GAP, GROW, VOLC_R, THIN, SS = 11, 10, 18, 4, 4

# id, unit, kind, Natural Earth names (regions polys; elevation points for volcanoes), EN, RU, review
OBJECTS = [
 ('as-pamirs', 1, 'mountain', ['PAMIRS'], 'Pamirs', 'Памир', False),
 ('as-tian-shan', 1, 'mountain', ['TIAN SHAN'], 'Tian Shan', 'Тянь-Шань', False),
 ('as-hindu-kush', 1, 'mountain', ['HINDU KUSH'], 'Hindu Kush', 'Гиндукуш', False),
 ('as-karakoram', 1, 'mountain', ['KARAKORAM RA.'], 'Karakoram', 'Каракорум', False),
 ('as-kunlun', 1, 'mountain', ['KUNLUN MOUNTAINS'], 'Kunlun Mountains', 'Куньлунь', False),
 ('as-tibet', 1, 'plateau', ['PLATEAU OF TIBET'], 'Tibetan Plateau', 'Тибетское нагорье', False),
 ('as-himalayas', 1, 'mountain', ['HIMALAYAS'], 'Himalayas', 'Гималаи', True),
 ('as-altai', 2, 'mountain', ['ALTAY MOUNTAINS'], 'Altai Mountains', 'Алтай', False),
 ('as-sayan', 2, 'mountain', ['Western Sayan Mts.', 'EASTERN SAYAN MTS.'], 'Sayan Mountains', 'Саяны', False),
 ('as-sikhote-alin', 2, 'mountain', ['SIKHOTE-ALIN’ RANGE'], 'Sikhote-Alin', 'Сихотэ-Алинь', False),
 ('as-klyuchevskaya', 2, 'volcano', ['Klyuchevskaya Sopka'], 'Klyuchevskaya Sopka', 'Ключевская Сопка', False),
 ('as-fuji', 2, 'volcano', ['Fuji'], 'Mount Fuji', 'Фудзи', False),
 ('as-urals', 2, 'mountain', ['URAL MOUNTAINS'], 'Ural Mountains', 'Уральские горы', True),
 ('as-zagros', 3, 'mountain', ['ZAGROS MOUNTAINS'], 'Zagros Mountains', 'Загрос', False),
 ('as-elburz', 3, 'mountain', ['ELBURZ MTS.'], 'Elburz Mountains', 'Эльбурс', False),
 ('as-caucasus', 3, 'mountain', ['CAUCASUS MTS.', 'Lesser Caucasus'], 'Caucasus Mountains', 'Кавказ', True),
 ('as-arakan', 3, 'mountain', ['Arakan Yoma'], 'Arakan Mountains', 'Араканские горы', False),
 ('as-barisan', 3, 'mountain', ['Barisan Mountains'], 'Barisan Mountains', 'Барисан', False),
 ('as-krakatoa', 3, 'volcano', ['Krakatau'], 'Krakatoa', 'Кракатау', False),
]
polys = B.load(NE, 'ne_10m_geography_regions_polys', 'NAME')
peaks = B.load(NE, 'ne_10m_geography_regions_elevation_points')

shapes = {}
for id_, unit, kind, names, *_ in OBJECTS:
    if kind == 'volcano':
        gs = [g for p, g in peaks if p.get('name') in names and p.get('featurecla') == 'mountain']
        assert len(gs) == 1, id_
        shapes[id_] = B.proj(gs[0])
    else:
        gs = [g for p, g in polys if p.get('NAME') in names]
        assert len(gs) == len(names), id_
        g = B.proj(unary_union([g.buffer(0.02) for g in gs])).intersection(FRAME)
        shapes[id_] = g.buffer(THIN) if kind == 'mountain' and g.area < 3000 else g  # narrow ranges get wide enough to see
# seams: a range touching an earlier range of the list gives way to it by GAP px, so the ranges of the knot read as separate systems that come
# close, not as four ridges meeting in one point (Svetlana, 30.10.2026); the plateau gives way to every range
ranges = [o[0] for o in OBJECTS if o[2] == 'mountain']
done = []
for id_ in ranges:
    g = shapes[id_]
    for other in done:
        if g.distance(shapes[other]) < GAP: g = g.difference(shapes[other].buffer(GAP))
    shapes[id_] = g.buffer(0)
    done.append(id_)
t = shapes['as-tibet'].difference(unary_union([shapes[r] for r in ranges]).buffer(GAP)).buffer(-2).buffer(2)
shapes['as-tibet'] = max(getattr(t, 'geoms', [t]), key=lambda p: p.area)  # the sliver north of the Kunlun is left out

im = Image.open(B.ROOT / 'assets/asia-blank.webp').convert('RGB'); W, H = im.size
# land of the base image (the sea and the lakes are bluish, Europe and Africa grey): shading never spills into water
_a = np.array(im).astype(int)
LAND = Image.fromarray(((_a[..., 2] < _a[..., 0] + 8) * 255).astype(np.uint8))
def mask(geoms, blur):
    m = Image.new('L', (W * SS, H * SS), 0); d = ImageDraw.Draw(m)
    for g in geoms:
        for p in getattr(g, 'geoms', [g]):
            if p.geom_type != 'Polygon' or p.area < 4: continue
            d.polygon([(x * SS, y * SS) for x, y in p.exterior.coords], fill=255)
            for r in p.interiors: d.polygon([(x * SS, y * SS) for x, y in r.coords], fill=0)
    return ImageChops.multiply(m.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur)), LAND)
im.paste(Image.new('RGB', (W, H), PLATEAU), (0, 0), mask([shapes['as-tibet']], 3).point(lambda v: v * 0.75))
im.paste(Image.new('RGB', (W, H), SHADE), (0, 0), mask([shapes[r] for r in ranges], 2.5).point(lambda v: v * 0.85))

# ^ marks inside every range on land, innermost points first, at least SPACING px apart (narrow ranges get a row along them)
marks = Image.new('L', (W * SS, H * SS), 0); dm = ImageDraw.Draw(marks)
def caret(x, y, s=9):
    dm.line([((x - s) * SS, (y + s) * SS), (x * SS, (y - s) * SS), ((x + s) * SS, (y + s) * SS)], fill=255, width=round(2.4 * SS), joint='curve')
SPACING = 28
for r in ranges:
    g = shapes[r]; x0, y0, x1, y1 = g.bounds
    cand = [(g.exterior.distance(Point(x, y)) if g.geom_type == 'Polygon' else g.boundary.distance(Point(x, y)), x, y)
            for y in np.arange(y0, y1, 4) for x in np.arange(x0, x1, 4)
            if g.contains(Point(x, y)) and LAND.getpixel((int(x), int(y)))]
    placed = []
    for d, x, y in sorted(cand, reverse=True):
        if d < 7 and placed: break
        if all(math.hypot(x - a, y - b) >= SPACING for a, b in placed): placed.append((x, y))
    for x, y in placed: caret(x, y, 9 if len(placed) > 1 else 7)
im.paste(Image.new('RGB', (W, H), MARK), (0, 0), marks.resize((W, H), Image.LANCZOS))

# volcanoes: a dark cone with a red crater glow
cone = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0)); dc = ImageDraw.Draw(cone)
for id_, unit, kind, *_ in OBJECTS:
    if kind != 'volcano': continue
    x, y = shapes[id_].x * SS, shapes[id_].y * SS; s = 14 * SS
    dc.polygon([(x - s, y + s * 0.8), (x, y - s * 0.8), (x + s, y + s * 0.8)], fill=MARK + (255,))
    dc.polygon([(x - s * 0.62, y + s * 0.5), (x, y - s * 0.45), (x + s * 0.62, y + s * 0.5)], fill=(150, 108, 70, 255))
    dc.ellipse([x - s * 0.32, y - s * 1.05, x + s * 0.32, y - s * 0.5], fill=(214, 64, 40, 255))
im.paste(cone.resize((W, H), Image.LANCZOS), (0, 0), cone.resize((W, H), Image.LANCZOS))
im.save(B.ROOT / 'assets/asia-mountains.webp', 'WEBP', quality=90, method=6)

# tap areas: every drawn shape widened by GROW px; where two widened shapes meet, a pixel goes to the nearer drawn one
owner = np.full((H, W), -1, int)
for i, (id_, unit, kind, *_) in enumerate(OBJECTS):
    if kind == 'volcano': continue
    m = np.array(mask([shapes[id_]], 0)) > 127
    owner[m & (owner < 0)] = i
_, (iy, ix) = nd.distance_transform_edt(owner < 0, return_indices=True)
grown = owner[iy, ix]
grown[~cv2.dilate((owner >= 0).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1))).astype(bool)] = -1

pc = lambda c: [[round(100 * x / W, 2), round(100 * y / H, 2)] for x, y in c]
items = []
for i, (id_, unit, kind, names, en, ru, review) in enumerate(OBJECTS):
    if kind == 'volcano':
        p = shapes[id_]; parts = [p.buffer(VOLC_R, 16)]; lab = p
    else:
        cs, _ = cv2.findContours((grown == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        parts = [Polygon(c[:, 0, :]).buffer(0).simplify(2) for c in cs if cv2.contourArea(c) > 300]
        dt = cv2.distanceTransform((owner == i).astype(np.uint8), cv2.DIST_L2, 5)
        y, x = np.unravel_index(dt.argmax(), dt.shape); lab = Point(x, y)
    items.append({'id': id_, 'order': i + 1, 'kind': kind, 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(100 * lab.x / W, 2), 'y': round(100 * lab.y / H, 2)},
                  'tapArea': [pc(p.exterior.coords) for p in parts], **({'review': True} if review else {})})
    print(id_, kind, len(parts), 'parts', items[-1]['label'])

out = {
  'map': './assets/asia-mountains.webp',
  'mapAspect': '11 / 8',
  'level': 'Mountains of Asia (block 3, section 4)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for every asia-*.webp (shared base, tools/asia_base.py)',
  'source': 'Natural Earth 1:10m geography regions (polygons) and elevation points (volcanoes), projected like asia-overview.json',
  'notes': ['Built by tools/build_asia_mountains.py, which also draws assets/asia-mountains.webp.',
            'Touching ranges of the mountain knot are kept %d px apart; the Plateau of Tibet is only where no range is.' % GAP,
            'The Sayan Mountains are the Western and the Eastern Sayan; the Caucasus is the Greater and the Lesser Caucasus.',
            'Volcanoes are points, tapped in a circle of %d px. The Himalayas, the Urals and the Caucasus are reviewed from earlier sections.' % VOLC_R],
  'items': items,
}
dst = B.ROOT / 'data/maps/asia-mountains.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
