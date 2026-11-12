#!/usr/bin/env python3
"""Builds data/maps/namerica-rivers.json and assets/namerica-rivers.webp for block 4 section 2 «Rivers of North America»:
the river lines drawn on the North America base (assets/namerica-blank.webp, tools/namerica_base.py) in the colour and
width of the Asia and Europe rivers maps.

Source: Natural Earth 1:10m rivers and lake centerlines. Ids carry the prefix «na-»: the Mississippi and the Missouri
are separate objects in block 1. The St. Lawrence below Lake Ontario is only a short piece in Natural Earth, so its
course to the estuary at Quebec is added from known points (EXTRA).

usage: python3 tools/build_namerica_rivers.py <natural-earth-dir>
"""
import json, sys
from shapely.geometry import box, LineString
from shapely.ops import unary_union, linemerge
from shapely import affinity
from PIL import Image, ImageDraw
import namerica_base as B

NE = sys.argv[1]
FRAME = box(0, 0, 100, 100)
COLOR, WIDTH, SS = (34, 124, 158), 4.2, 4

# id, unit, Natural Earth names, lon/lat window of the feature centroids, EN, RU
RIVERS = [
 ('na-mississippi', 1, ['Mississippi'], (-96, -88, 29, 48), 'Mississippi', 'Миссисипи'),
 ('na-missouri', 1, ['Missouri'], (-115, -89, 38, 49), 'Missouri', 'Миссури'),
 ('na-ohio', 1, ['Ohio'], (-90, -78, 36, 42), 'Ohio', 'Огайо'),
 ('na-arkansas', 1, ['Arkansas'], (-107, -90, 33, 40), 'Arkansas', 'Арканзас'),
 ('na-yukon', 2, ['Yukon', 'Teslin'], (-166, -130, 59, 68), 'Yukon', 'Юкон'),
 ('na-mackenzie', 2, ['Mackenzie'], (-136, -110, 59, 70), 'Mackenzie', 'Маккензи'),
 ('na-nelson', 2, ['Nelson'], (-99, -92, 53, 58), 'Nelson', 'Нельсон'),
 ('na-st-lawrence', 2, ['St. Lawrence'], (-77, -70, 44, 48), 'St. Lawrence', 'Река Святого Лаврентия'),
 ('na-columbia', 3, ['Columbia'], (-125, -116, 45.5, 53), 'Columbia', 'Колумбия'),
 ('na-colorado', 3, ['Colorado'], (-116, -104, 30, 41), 'Colorado', 'Колорадо'),
 ('na-rio-grande', 3, ['Rio Grande'], (-108, -96, 25, 38), 'Rio Grande', 'Рио-Гранде'),
 ('na-usumacinta', 3, ['Usumacinta', 'Rio Salinas', 'Chixoy'], (-93, -89, 14.5, 19), 'Usumacinta', 'Усумасинта'),
 ('na-san-juan', 3, ['San Juan'], (-86, -83.5, 10.5, 12), 'San Juan', 'Сан-Хуан'),
]
# lon/lat: Lake Ontario outlet → Cornwall, and Cornwall → Montreal → Trois-Rivières → Quebec → the estuary
EXTRA = {'na-st-lawrence': [[(-76.35, 44.15), (-75.79, 44.5)],
                            [(-74.71, 45.01), (-74.2, 45.25), (-73.55, 45.5), (-73.1, 45.95), (-72.5, 46.35), (-71.9, 46.55),
                             (-71.2, 46.81), (-70.75, 47.05), (-70.2, 47.45)]]}
feats = B.load(NE, 'ne_10m_rivers_lake_centerlines')
def squash(g): return affinity.scale(g, 1, B.H / B.W, origin=(0, 0))
items = []
for i, (id_, unit, names, (a, b, c, d), en, ru) in enumerate(RIVERS, 1):
    gs = [g for p, g in feats if p.get('name') in names and a <= g.centroid.x <= b and c <= g.centroid.y <= d]
    gs += [LineString(l) for l in EXTRA.get(id_, [])]
    assert gs, id_
    line = B.proj(unary_union(gs), B.pct).intersection(FRAME)
    if line.geom_type == 'MultiLineString': line = linemerge(line)
    line = line.simplify(0.04)
    lines = sorted(getattr(line, 'geoms', [line]), key=lambda l: -l.length)
    lines = lines[:1] + [l for l in lines[1:] if l.length > 0.6]
    items.append({'_lines': lines, 'id': id_, 'order': i, 'kind': 'river', 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'path': [[[round(x, 2), round(y, 2)] for x, y in l.coords] for l in lines]})

for it in items:
    others = unary_union([squash(l) for o in items if o is not it for l in o['_lines']])
    longest = max(it['_lines'], key=lambda l: l.length)
    best = max((longest.interpolate(t / 100, normalized=True) for t in range(15, 86)), key=lambda q: others.distance(squash(q)))
    it['label'] = {'x': round(best.x, 2), 'y': round(best.y, 2)}

# 12.11.2026: the Missouri is labelled on its upper course (North Dakota): at its lower course its letter would sit too close to the
# Mississippi and the Arkansas for all four rivers of unit 1 to share one GeoWords puzzle
LABEL = {'na-missouri': {'x': 46.93, 'y': 53.31}}
for it in items: it['label'] = LABEL.get(it['id'], it['label'])

im = Image.open(B.ROOT / 'assets/namerica-blank.webp').convert('RGB'); W, H = im.size
mask = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(mask)
for it in items:
    for l in it['path']:
        xy = [(x / 100 * W * SS, y / 100 * H * SS) for x, y in l]
        dr.line(xy, fill=255, width=round(WIDTH * SS), joint='curve')
        r = WIDTH * SS / 2
        for x, y in (xy[0], xy[-1]): dr.ellipse((x - r, y - r, x + r, y + r), fill=255)
mask = mask.resize((W, H), Image.LANCZOS)
im.paste(Image.new('RGB', (W, H), COLOR), (0, 0), mask)
im.save(B.ROOT / 'assets/namerica-rivers.webp', 'WEBP', quality=90, method=6)

items = [{k: it[k] for k in ('id', 'order', 'kind', 'unit', 'name', 'label', 'path')} for it in items]
out = {
  'map': './assets/namerica-rivers.webp',
  'mapAspect': '11 / 8',
  'level': 'Rivers of North America (block 4, section 2)',
  'coordinateSystem': 'label and path in % of image width/height from top-left; same for every namerica-*.webp (shared base, tools/namerica_base.py)',
  'source': 'Natural Earth 1:10m rivers and lake centerlines, projected like namerica-overview.json; label = the point of the longest line farthest from the other rivers',
  'notes': ['Built by tools/build_namerica_rivers.py, which also draws the lines onto assets/namerica-rivers.webp.',
            'The Mississippi and the Missouri are learned in block 1 and reviewed here as separate «na-» objects.',
            'The St. Lawrence below Lake Ontario is drawn from known points to the estuary at Quebec (not in Natural Earth).'],
  'items': items,
}
dst = B.ROOT / 'data/maps/namerica-rivers.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
