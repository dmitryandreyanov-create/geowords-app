#!/usr/bin/env python3
"""Adds the GeoWords places to data/maps/namerica-caribbean.json (block 4 section 7 «Countries of the Caribbean islands») and writes
the large map of the Lesser Antilles data/maps/namerica-lesser-antilles.json (the 🔍 format of data/maps/namerica-camerica.json).

Run after tools/build_namerica_caribbean.py (it rewrites the json without these fields).

- spots: where a letter of an island state may stand — the label point and a grid 0.3 % apart inside its own islands (the tap area
  of a small state is widened around its islands, so a small state gets its label point only);
- places: the other places a letter may stand on (Svetlana, 14.11.2026 «Добавить материк»): the countries of section 6 in the frame
  (their spots and tap areas from data/maps/namerica-countries.json carried over by the crop) and the objects of section 1 (the
  review objects of the map: seas and ocean a grid in open water, islands and peninsulas their label point);
- frames: the zoomed view of the GeoWords puzzles of each unit (S = section final), centre and zoom in % of the map;
- rivers: none (the islands have no rivers of section 2).

usage: python3 tools/build_namerica_caribbean_places.py
"""
import json
from pathlib import Path
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data/maps/namerica-caribbean.json'
d = json.loads(SRC.read_text())
FX, FY, SPAN = d['frame']['x'], d['frame']['y'], d['frame']['w']
K = 1600 / 2200
FR = box(0, 0, 100, 100)
conv = lambda x, y: (100 * (x - FX) / SPAN, 100 * (y - FY) / SPAN)
polys = lambda g: [p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon)]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]
def area(o): return unary_union([Polygon(p).buffer(0) for p in o['tapArea']])
def thin(pts, dd):
    out = []
    for x, y in pts:
        if all(((x - a) ** 2 + ((y - b) * K) ** 2) ** .5 >= dd for a, b in out): out.append((x, y))
    return [{'x': round(x, 2), 'y': round(y, 2)} for x, y in out]
# the distance to the border in screen units (y scaled by the aspect)
sq = lambda g: Polygon([(x, y * K) for x, y in g.exterior.coords], [[(x, y * K) for x, y in h.coords] for h in g.interiors])

SMALL = {'cty-saint-kitts-and-nevis', 'cty-antigua-and-barbuda', 'cty-dominica', 'cty-saint-lucia', 'cty-saint-vincent', 'cty-grenada', 'cty-barbados'}
land = []
for it in d['items']:
    g = area(it)
    land.append(g)
    if it['id'] in SMALL:
        it['spots'] = [dict(it['label'])]
    else:
        main = [p for p in polys(g) if p.contains(Point(it['label']['x'], it['label']['y']))] or polys(g)
        grid = []
        for p in polys(g):
            x0, y0, x1, y1 = p.bounds
            s = sq(p)
            for i in range(int(x0 / .3), int(x1 / .3) + 2):
                for j in range(int(y0 / .3), int(y1 / .3) + 2):
                    x, y = i * .3, j * .3
                    if p.contains(Point(x, y)) and s.exterior.distance(Point(x, y * K)) >= .25: grid.append((x, y, p in main))
        # the main island first (a letter stands in the main part of the country), then the others
        pts = [(it['label']['x'], it['label']['y'])] + [(x, y) for x, y, m in grid if m] + [(x, y) for x, y, m in grid if not m]
        it['spots'] = thin(pts, .6)
    print(it['id'], len(it['spots']), 'spots')

places = []
# the countries of section 6 in the frame
C6 = json.loads((ROOT / 'data/maps/namerica-countries.json').read_text())
for o in C6['items']:
    g = unary_union([Polygon([conv(x, y) for x, y in p]).buffer(0) for p in o['tapArea']]).intersection(FR)
    if g.is_empty or g.area < 0.5: continue
    g = g.simplify(0.05, preserve_topology=True)
    land.append(g)
    sp = [conv(q['x'], q['y']) for q in o['spots']]
    sp = [(x, y) for x, y in sp if 1 < x < 99 and 1 < y < 99 and g.contains(Point(x, y))]
    if not sp: continue
    places.append({'id': o['id'], 'kind': 'country', 'name': o['name'], 'tapArea': [rnd(p.exterior.coords) for p in polys(g) if p.area > 0.05],
                   'spots': thin(sp, 2.0)})
    print(o['id'], len(places[-1]['spots']), 'spots')
LAND = unary_union(land)
# the map itself shows land the tap areas leave out (Puerto Rico, the Virgin Islands and the other dependencies, South America): a letter in a
# sea keeps 2.2 % of the map from any pixel of land or coastline of assets/namerica-caribbean.webp
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation
IM = np.asarray(Image.open(ROOT / 'assets/namerica-caribbean.webp').convert('RGB').reduce(4)).astype(int)
R_, G_, B_ = IM[..., 0], IM[..., 1], IM[..., 2]
LANDPX = (R_ > B_ + 10) | ((abs(R_ - B_) < 14) & (abs(R_ - G_) < 14) & (R_ < 175)) | (R_ + G_ + B_ < 330)
PH, PW = LANDPX.shape
rr = int(2.2 / 100 * PW)
yy, xx = np.ogrid[-rr:rr + 1, -rr:rr + 1]
NEARLAND = binary_dilation(LANDPX, structure=(xx * xx + yy * yy) <= rr * rr)
def open_water(x, y):
    i, j = int(y / 100 * PH), int(x / 100 * PW)
    return 0 <= i < PH and 0 <= j < PW and not NEARLAND[i, j]
SEAS = {r['id']: area(r) for r in d['review'] if r['id'] in ('na-caribbean-sea', 'na-gulf-of-mexico')}
# the objects of section 1
for r in d['review']:
    if r['id'] == 'na-cuba': continue   # the island of Cuba is the country itself: its letters are those of the country
    g = area(r)
    if r.get('holes'): g = g.difference(unary_union([Polygon(h).buffer(0) for h in r['holes']]))
    if r['kind'] in ('ocean', 'sea', 'gulf', 'bay') or r['id'] in ('na-caribbean-sea', 'na-gulf-of-mexico', 'na-atlantic-ocean'):
        # Lake Maracaibo (Venezuela, grey) is water of the map but never a place of a letter
        water = g.difference(LAND.buffer(2.2)).difference(box(52, 76, 64, 100)).intersection(box(3, 3, 97, 97))
        # the ocean's own letters stand in the open ocean, never in its seas (its tap area of section 1 takes them in)
        if r['id'] == 'na-atlantic-ocean': water = water.difference(unary_union(list(SEAS.values())).buffer(2.5)).difference(box(0, 72, 100, 100))
        # the Caribbean Sea ends at the arc of the Lesser Antilles: east of it (Barbados) is the open ocean
        if r['id'] == 'na-caribbean-sea': water = water.difference(box(83.5, 0, 100, 66))
        sp = [(r['label']['x'], r['label']['y'])] if water.contains(Point(r['label']['x'], r['label']['y'])) else []
        sp += [(i * 1.5, j * 1.5) for i in range(67) for j in range(67) if water.contains(Point(i * 1.5, j * 1.5))]
        places.append({'id': r['id'], 'kind': 'water', 'spots': thin([q for q in sp if open_water(*q)], 4.0)})
    else:
        places.append({'id': r['id'], 'kind': 'object', 'spots': [dict(r['label'])]})
    print(r['id'], len(places[-1]['spots']), 'spots')

d['places'] = places
d['rivers'] = []
# unit 1 takes in the mainland of section 6 (its own region has five places), unit 3 Hispaniola (as far from the arc as the spacing allows)
d['frames'] = {'1': {'x': 40, 'y': 50, 'zoom': 1.2}, '2': {'x': 50, 'y': 45, 'zoom': 1.4}, '3': {'x': 66, 'y': 56, 'zoom': 1.9},
               'S': {'x': 50, 'y': 50, 'zoom': 1.0}}
d['notes'] = [n for n in d['notes'] if not n.startswith('GeoWords')] + [
    'GeoWords: spots of the island states (label point and a grid inside the main island first); places = the countries of section 6 in the frame '
    '(carried over from namerica-countries.json) and the objects of section 1 (seas and ocean: a grid in open water); frames = the zoomed view '
    'of the puzzles of each unit (S = section final); no rivers. Written by tools/build_namerica_caribbean_places.py.']
SRC.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', SRC)

m = d['magnifier']
la = {
    'map': m['map'], 'of': d['map'], 'level': 'The Lesser Antilles, large: North America section 7',
    'coordinateSystem': 'frame: the piece of namerica-caribbean.webp this map shows, in % of that map (x, y = top left; w, h = size). '
                        'A point (u, v) in % of this map is (x + u·w/100, y + v·h/100) there, so tap areas and capitals of namerica-caribbean.json apply unchanged.',
    'source': 'Built by tools/build_namerica_caribbean.py (an exact piece of the Caribbean map) and tools/build_namerica_caribbean_places.py',
    'frame': m['frame'], 'aspect': '11 / 8', 'magnifier': m['at'], 'objects': m['objects'], 'capitals': m['capitals'],
}
(ROOT / 'data/maps/namerica-lesser-antilles.json').write_text(json.dumps(la, ensure_ascii=False, indent=1) + '\n')
print('wrote data/maps/namerica-lesser-antilles.json')
