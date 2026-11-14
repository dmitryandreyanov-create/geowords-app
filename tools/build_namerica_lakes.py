#!/usr/bin/env python3
"""Builds data/maps/namerica-lakes.json and assets/namerica-lakes.webp for block 4 section 3 «Lakes of North America»:
the 13 lakes filled in lake blue with a dark shore, and Niagara Falls as a small white mark, on the North America base
(assets/namerica-blank.webp, tools/namerica_base.py), the same way as tools/build_asia_lakes.py.

Source: Natural Earth 1:10m lakes. Lake Tahoe and Lake Chapala are only a few px on the map, so they are drawn and tapped as
round blobs of SMALL_R px around the lake (like the Dead Sea in Asia); the app magnifies them in a zoom inset.
Niagara Falls (a waterfall, not a lake: kind «waterfall») is a white round mark of FALLS_R px at the falls, tapped within
FALLS_TAP px, also with a zoom inset.

usage: python3 tools/build_namerica_lakes.py <natural-earth-dir>
"""
import json, sys
from shapely.geometry import box, Point
from shapely.ops import unary_union
from PIL import Image, ImageDraw
import namerica_base as B

NE = sys.argv[1]
FRAME = box(0, 0, B.W, B.H)
FILL, SHORE, SS = (96, 160, 192), (70, 58, 50), 4
SMALL_R, FALLS_R, FALLS_TAP = 7, 4.5, 6.5
FALLS = (-79.07, 43.08)  # Niagara Falls, lon/lat

# id, unit, Natural Earth names, EN, RU
LAKES = [
 ('na-superior', 1, ['Lake Superior'], 'Lake Superior', 'Верхнее'),
 ('na-michigan', 1, ['Lake Michigan'], 'Lake Michigan', 'Мичиган'),
 ('na-huron', 1, ['Lake Huron'], 'Lake Huron', 'Гурон'),
 ('na-erie', 1, ['Lake Erie'], 'Lake Erie', 'Эри'),
 ('na-ontario', 1, ['Lake Ontario'], 'Lake Ontario', 'Онтарио'),
 ('na-niagara-falls', 1, None, 'Niagara Falls', 'Ниагарский водопад'),
 ('na-great-bear', 2, ['Great Bear Lake'], 'Great Bear Lake', 'Большое Медвежье озеро'),
 ('na-great-slave', 2, ['Great Slave Lake'], 'Great Slave Lake', 'Большое Невольничье озеро'),
 ('na-winnipeg', 2, ['Lake Winnipeg'], 'Lake Winnipeg', 'Виннипег'),
 ('na-athabasca', 2, ['Lake Athabasca'], 'Lake Athabasca', 'Атабаска'),
 ('na-great-salt', 3, ['Great Salt Lake'], 'Great Salt Lake', 'Большое Солёное озеро'),
 ('na-tahoe', 3, ['Lake Tahoe'], 'Lake Tahoe', 'Тахо'),
 ('na-chapala', 3, ['Lago de Chapala'], 'Lake Chapala', 'Чапала'),
 ('na-nicaragua', 3, ['Lago de Nicaragua'], 'Lake Nicaragua', 'Никарагуа'),
]
SMALL = {'na-tahoe', 'na-chapala'}
lakes = B.load(NE, 'ne_10m_lakes')
items = []
for i, (id_, unit, names, en, ru) in enumerate(LAKES, 1):
    if names is None:
        x, y = B.px(*FALLS); g = Point(x, y).buffer(FALLS_TAP, 24); mark = Point(x, y).buffer(FALLS_R, 24); kind = 'waterfall'
    else:
        gs = [g for p, g in lakes if p.get('name') in names]
        assert gs, id_
        g = B.proj(unary_union(gs)).intersection(FRAME); kind = 'lake'
        if id_ in SMALL: g = Point(g.centroid.x, g.centroid.y).buffer(SMALL_R, 24)
    g = g.simplify(0.8)
    lab = g.centroid if g.contains(g.centroid) else g.representative_point()
    polys = [p for p in getattr(g, 'geoms', [g]) if p.area > 2]
    pc = lambda c: [[round(100 * x / B.W, 2), round(100 * y / B.H, 2)] for x, y in c]
    items.append({'_g': polys, '_mark': mark if kind == 'waterfall' else None, 'id': id_, 'order': i, 'kind': kind, 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(100 * lab.x / B.W, 2), 'y': round(100 * lab.y / B.H, 2)},
                  'tapArea': [pc(p.exterior.coords) for p in polys],
                  **({'zoomInset': True} if id_ in SMALL or kind == 'waterfall' else {})})

im = Image.open(B.ROOT / 'assets/namerica-blank.webp').convert('RGB'); W, H = im.size
L = lambda: Image.new('L', (W * SS, H * SS), 0)
fill, shore, falls, ring = L(), L(), L(), L()
df, ds, dw, dr = ImageDraw.Draw(fill), ImageDraw.Draw(shore), ImageDraw.Draw(falls), ImageDraw.Draw(ring)
for it in items:
    for p in it['_g']:
        xy = [(x * SS, y * SS) for x, y in p.exterior.coords]
        if it['kind'] == 'waterfall':
            xy = [(x * SS, y * SS) for x, y in it['_mark'].exterior.coords]
            dw.polygon(xy, fill=255); dr.line(xy, fill=255, width=round(1.6 * SS), joint='curve')
        else:
            df.polygon(xy, fill=255); ds.line(xy, fill=255, width=round(2.2 * SS), joint='curve')
fill, shore, falls, ring = (m.resize((W, H), Image.LANCZOS) for m in (fill, shore, falls, ring))
im.paste(Image.new('RGB', (W, H), FILL), (0, 0), fill)
im.paste(Image.new('RGB', (W, H), SHORE), (0, 0), shore)
im.paste(Image.new('RGB', (W, H), (255, 255, 255)), (0, 0), falls)  # the falls mark lies over the lake shores
im.paste(Image.new('RGB', (W, H), SHORE), (0, 0), ring)
im.save(B.ROOT / 'assets/namerica-lakes.webp', 'WEBP', quality=90, method=6)

# 13.11.2026: the Great Lakes lie close together; these label points (inside the lakes) keep Superior, Michigan and Ontario at least
# 4.5% of the map apart, so three of the Great Lakes can share one GeoWords puzzle (at the centroids only one or two could)
LABEL = {'na-superior': {'x': 54.93, 'y': 52.31}, 'na-michigan': {'x': 55.37, 'y': 58.96}, 'na-ontario': {'x': 60.59, 'y': 56.28}}
for it in items:
    if it['id'] in LABEL:
        q = LABEL[it['id']]; assert any(p.contains(Point(q['x'] * B.W / 100, q['y'] * B.H / 100)) for p in it['_g']), it['id']
        it['label'] = q
items = [{k: it[k] for k in ('id', 'order', 'kind', 'unit', 'name', 'label', 'tapArea', 'zoomInset') if k in it} for it in items]
out = {
  'map': './assets/namerica-lakes.webp',
  'mapAspect': '11 / 8',
  'level': 'Lakes of North America (block 4, section 3)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for every namerica-*.webp (shared base, tools/namerica_base.py)',
  'source': 'Natural Earth 1:10m lakes, projected like namerica-overview.json',
  'notes': ['Built by tools/build_namerica_lakes.py, which also fills the lakes on assets/namerica-lakes.webp.',
            'Lake Superior is learned in block 1 and reviewed here as the «na-» object.',
            'Lake Tahoe and Lake Chapala are drawn and tapped as round blobs of %d px; Niagara Falls is a white round mark of %s px (tapped within %s px). The app shows all three in a zoom inset.' % (SMALL_R, FALLS_R, FALLS_TAP)],
  'items': items,
}
dst = B.ROOT / 'data/maps/namerica-lakes.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
