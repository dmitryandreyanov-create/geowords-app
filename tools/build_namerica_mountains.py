#!/usr/bin/env python3
"""Builds data/maps/namerica-mountains.json and assets/namerica-mountains.webp for block 4 section 4 «Mountains and Plains
of North America»: brown shading with ^ marks for the ranges, a lighter shading for the uplands (the Mexican Plateau, the
Laurentian Upland), a soft green for the plains, a snowy peak for Denali and red cones for the volcanoes Orizaba and
Popocatépetl, on the North America base (assets/namerica-blank.webp, tools/namerica_base.py), in the style of
tools/build_asia_mountains.py.

Source: Natural Earth 1:10m geography regions (polygons: ranges, plateaus, plains; the Laurentian Upland is the Canadian
Shield, the Coast Ranges are the Canadian Coast Mountains and the US Coast Ranges) and elevation points (Denali, the
volcanoes). Touching shapes keep a GAP px seam: a range gives way to an earlier range, an upland to every range, a plain to
every range, upland and earlier plain. Tap areas are the drawn shapes widened by GROW px without overlapping; a peak or a
volcano is tapped in a circle of POINT_R (VOLC_R) px (it may lie inside a range: the app takes the smaller area first).

usage: python3 tools/build_namerica_mountains.py <natural-earth-dir>
"""
import json, sys, math
import numpy as np
import cv2
from scipy import ndimage as nd
from shapely.geometry import box, Point, Polygon
from shapely.ops import unary_union
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import namerica_base as B

NE = sys.argv[1]
FRAME = box(0, 0, B.W, B.H)
SHADE, UPLAND, PLAIN, MARK = (165, 115, 65), (190, 138, 84), (150, 178, 96), (62, 52, 42)
GAP, GROW, POINT_R, VOLC_R, THIN, SS = 9, 10, 16, 10, 4, 4

# id, unit, kind, Natural Earth names (regions polys; elevation points for a peak or a volcano), EN, RU, review
OBJECTS = [
 ('na-rockies', 1, 'mountain', ['ROCKY MOUNTAINS'], 'Rocky Mountains', 'Скалистые горы', True),
 ('na-alaska-range', 1, 'mountain', ['ALASKA RANGE'], 'Alaska Range', 'Аляскинский хребет', False),
 ('na-denali', 1, 'peak', ['Denali'], 'Denali', 'Денали', False),
 ('na-coast-ranges', 1, 'mountain', ['COAST MOUNTAINS', 'COAST RANGES'], 'Pacific Coast Ranges', 'Береговые хребты', False),
 ('na-cascades', 2, 'mountain', ['CASCADE RANGE'], 'Cascade Range', 'Каскадные горы', False),
 ('na-sierra-nevada', 2, 'mountain', ['SIERRA NEVADA'], 'Sierra Nevada', 'Сьерра-Невада', False),
 ('na-sierra-madre-occidental', 2, 'mountain', ['SIERRA MADRE OCCIDENTAL'], 'Sierra Madre Occidental', 'Западная Сьерра-Мадре', False),
 ('na-sierra-madre-oriental', 2, 'mountain', ['SIERRA MADRE ORIENTAL'], 'Sierra Madre Oriental', 'Восточная Сьерра-Мадре', False),
 ('na-mexican-plateau', 2, 'plateau', ['ALTI-PLANICIE MEXICANA'], 'Mexican Plateau', 'Мексиканское нагорье', False),
 ('na-orizaba', 2, 'volcano', ['Pico de Orizaba'], 'Pico de Orizaba', 'Орисаба', False),
 ('na-popocatepetl', 2, 'volcano', ['Volcán Popocatépetl'], 'Popocatépetl', 'Попокатепетль', False),
 ('na-appalachians', 3, 'mountain', ['APPALACHIAN MTS.'], 'Appalachian Mountains', 'Аппалачи', True),
 ('na-laurentian-upland', 3, 'plateau', ['CANADIAN SHIELD'], 'Laurentian Upland', 'Лаврентийская возвышенность', False),
 ('na-great-plains', 3, 'plain', ['GREAT PLAINS'], 'Great Plains', 'Великие равнины', False),
 ('na-central-lowland', 3, 'plain', ['CENTRAL LOWLAND'], 'Central Lowland', 'Центральные равнины', False),
]
POINTS = ('peak', 'volcano')
polys = B.load(NE, 'ne_10m_geography_regions_polys', 'NAME')
peaks = B.load(NE, 'ne_10m_geography_regions_elevation_points')

shapes = {}
for id_, unit, kind, names, *_ in OBJECTS:
    if kind in POINTS:
        gs = [g for p, g in peaks if p.get('name') in names and p.get('featurecla') == 'mountain']
        assert len(gs) == 1, id_
        shapes[id_] = B.proj(gs[0])
    else:
        gs = [g for p, g in polys if p.get('NAME') in names and g.area > 1]  # the Canadian Shield has a tiny second part
        assert len(gs) == len(names), (id_, len(gs))
        g = B.proj(unary_union([g.buffer(0.02) for g in gs])).intersection(FRAME)
        shapes[id_] = g.buffer(THIN) if kind == 'mountain' and g.area < 3000 else g
# seams, in the order of drawing priority: ranges (earlier first), then uplands, then plains
order = [o[0] for o in OBJECTS if o[2] == 'mountain'] + [o[0] for o in OBJECTS if o[2] == 'plateau'] + [o[0] for o in OBJECTS if o[2] == 'plain']
done = []
for id_ in order:
    g = shapes[id_]
    for other in done:
        if g.distance(shapes[other]) < GAP: g = g.difference(shapes[other].buffer(GAP))
    g = g.buffer(-2).buffer(2)
    parts = [p for p in getattr(g, 'geoms', [g]) if p.area > 400]
    shapes[id_] = unary_union(parts)  # slivers left by the seams are dropped
    done.append(id_)
kind_of = {o[0]: o[2] for o in OBJECTS}
ranges = [i for i in order if kind_of[i] == 'mountain']

im = Image.open(B.ROOT / 'assets/namerica-blank.webp').convert('RGB'); W, H = im.size
# land of the base image (the sea and the lakes are bluish): shading never spills into water
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
im.paste(Image.new('RGB', (W, H), PLAIN), (0, 0), mask([shapes[i] for i in order if kind_of[i] == 'plain'], 3).point(lambda v: v * 0.6))
im.paste(Image.new('RGB', (W, H), UPLAND), (0, 0), mask([shapes[i] for i in order if kind_of[i] == 'plateau'], 3).point(lambda v: v * 0.8))
im.paste(Image.new('RGB', (W, H), SHADE), (0, 0), mask([shapes[r] for r in ranges], 2.5).point(lambda v: v * 0.85))

# ^ marks inside every range on land, innermost points first, at least SPACING px apart (narrow ranges get a row along them)
marks = Image.new('L', (W * SS, H * SS), 0); dm = ImageDraw.Draw(marks)
def caret(x, y, s=9):
    dm.line([((x - s) * SS, (y + s) * SS), (x * SS, (y - s) * SS), ((x + s) * SS, (y + s) * SS)], fill=255, width=round(2.4 * SS), joint='curve')
SPACING = 28
point_px = [(shapes[i].x, shapes[i].y) for i in shapes if kind_of[i] in POINTS]
for r in ranges:
    g = shapes[r]; x0, y0, x1, y1 = g.bounds
    cand = [(g.boundary.distance(Point(x, y)), x, y)
            for y in np.arange(y0, y1, 4) for x in np.arange(x0, x1, 4)
            if g.contains(Point(x, y)) and LAND.getpixel((int(x), int(y))) and all(math.hypot(x - a, y - b) > 26 for a, b in point_px)]
    placed = []
    for d, x, y in sorted(cand, reverse=True):
        if d < 7 and placed: break
        if all(math.hypot(x - a, y - b) >= SPACING for a, b in placed): placed.append((x, y))
    for x, y in placed: caret(x, y, 9 if len(placed) > 1 else 7)
im.paste(Image.new('RGB', (W, H), MARK), (0, 0), marks.resize((W, H), Image.LANCZOS))

# Denali: a dark peak with a white snow cap; volcanoes: a dark cone with a red crater glow
cone = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0)); dc = ImageDraw.Draw(cone)
for id_, unit, kind, *_ in OBJECTS:
    if kind not in POINTS: continue
    x, y = shapes[id_].x * SS, shapes[id_].y * SS; s = (13 if kind == 'peak' else 9) * SS  # Orizaba and Popocatépetl are only 23 px apart
    dc.polygon([(x - s, y + s * 0.8), (x, y - s * 0.8), (x + s, y + s * 0.8)], fill=MARK + (255,))
    if kind == 'peak':
        dc.polygon([(x - s * 0.42, y - s * 0.12), (x, y - s * 0.8), (x + s * 0.42, y - s * 0.12), (x + s * 0.14, y - s * 0.26), (x, y - s * 0.08), (x - s * 0.14, y - s * 0.26)], fill=(250, 250, 250, 255))
    else:
        dc.polygon([(x - s * 0.62, y + s * 0.5), (x, y - s * 0.45), (x + s * 0.62, y + s * 0.5)], fill=(150, 108, 70, 255))
        dc.ellipse([x - s * 0.32, y - s * 1.05, x + s * 0.32, y - s * 0.5], fill=(214, 64, 40, 255))
im.paste(cone.resize((W, H), Image.LANCZOS), (0, 0), cone.resize((W, H), Image.LANCZOS))
im.save(B.ROOT / 'assets/namerica-mountains.webp', 'WEBP', quality=90, method=6)

# tap areas: every drawn shape widened by GROW px; where two widened shapes meet, a pixel goes to the nearer drawn one
owner = np.full((H, W), -1, int)
for i, (id_, unit, kind, *_) in enumerate(OBJECTS):
    if kind in POINTS: continue
    m = np.array(mask([shapes[id_]], 0)) > 127
    owner[m & (owner < 0)] = i
_, (iy, ix) = nd.distance_transform_edt(owner < 0, return_indices=True)
grown = owner[iy, ix]
grown[~cv2.dilate((owner >= 0).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1))).astype(bool)] = -1

pc = lambda c: [[round(100 * x / W, 2), round(100 * y / H, 2)] for x, y in c]
items = []
for i, (id_, unit, kind, names, en, ru, review) in enumerate(OBJECTS):
    if kind in POINTS:
        p = shapes[id_]; parts = [p.buffer(POINT_R if kind == 'peak' else VOLC_R, 16)]; lab = p
    else:
        cs, _ = cv2.findContours((grown == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        parts = [Polygon(c[:, 0, :]).buffer(0).simplify(2) for c in cs if cv2.contourArea(c) > 300]
        o8 = (owner == i).astype(np.uint8)  # the label is never on a peak or a volcano inside the shape
        for a, b in point_px: cv2.circle(o8, (int(a), int(b)), POINT_R + 8, 0, -1)
        dt = cv2.distanceTransform(o8, cv2.DIST_L2, 5)
        y, x = np.unravel_index(dt.argmax(), dt.shape); lab = Point(x, y)
    items.append({'id': id_, 'order': i + 1, 'kind': kind, 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(100 * lab.x / W, 2), 'y': round(100 * lab.y / H, 2)},
                  'tapArea': [pc(p.exterior.coords) for p in parts], **({'review': True} if review else {}), **({'zoomInset': True} if kind == 'volcano' else {})})
    print(id_, kind, len(parts), 'parts', items[-1]['label'])

out = {
  'map': './assets/namerica-mountains.webp',
  'mapAspect': '11 / 8',
  'level': 'Mountains and Plains of North America (block 4, section 4)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for every namerica-*.webp (shared base, tools/namerica_base.py)',
  'source': 'Natural Earth 1:10m geography regions (polygons) and elevation points (Denali, the volcanoes), projected like namerica-overview.json',
  'notes': ['Built by tools/build_namerica_mountains.py, which also draws assets/namerica-mountains.webp.',
            'Touching shapes are kept %d px apart: ranges first, then the uplands, then the plains.' % GAP,
            'The Laurentian Upland is the Natural Earth «Canadian Shield»; the Pacific Coast Ranges are the Coast Mountains of Canada and the Coast Ranges of the US.',
            'Denali is tapped in a circle of %d px; Orizaba and Popocatépetl lie only 23 px apart, so they are tapped in circles of %d px and the app shows them in a zoom inset. The Rocky Mountains and the Appalachians are reviewed from block 1.' % (POINT_R, VOLC_R)],
  'items': items,
}
dst = B.ROOT / 'data/maps/namerica-mountains.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
