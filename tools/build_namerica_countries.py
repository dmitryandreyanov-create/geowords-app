#!/usr/bin/env python3
"""Builds the North America countries map — assets/namerica-countries.webp — and data/maps/namerica-countries.json for block 4
section 6 «Countries of North and Central America» (Svetlana, 13.11.2026): Canada, the United States, Mexico and the seven
countries of Central America.

The map is the North America rivers map (assets/namerica-rivers.webp: the rivers of section 2 stay drawn, GeoWords practise a river
together with the outline of its country, Svetlana 28.10.2026) with thin land borders under the rivers and the capital dots on top,
drawn exactly as on the Asia countries map (tools/build_asia_countries.py): the same border colour and width, the dot copied from
the Madrid dot of assets/europe-capitals.webp.

Borders: Natural Earth 1:10m admin 0 boundary lines (land), only on the North American side (tools/namerica_base.py na_region).
Tap areas: Natural Earth 1:10m admin 0 countries in the projection of tools/namerica_base.py, in % of the image; the United States
without Hawaii (Oceania, grey on the map), Costa Rica without Cocos Island (outside the frame).
Rivers: the rivers of section 2 (data/maps/namerica-rivers.json) against the countries of this section — the countries each river
crosses, and for a river crossing two or more of them a point on the river well inside each one («on the Rio Grande in Mexico»).
Central America is small on this map; the large map of Central America (tools/build_namerica_camerica.py) is an exact piece of it.

usage: python3 tools/build_namerica_countries.py <natural-earth-dir>
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from shapely.geometry import Polygon, MultiLineString, Point, box
from shapely import affinity
from shapely.ops import polylabel, unary_union
import namerica_base as B

NE = sys.argv[1]
ROOT = B.ROOT
W, H = B.W, B.H
FRAME = box(0, 0, 100, 100)
BORDER, BW, SS = (158, 120, 76), 2.3, 4

# id, unit, Natural Earth ADMIN names, EN, RU, capital id, capital EN, capital RU, capital lon, lat
ORDER = [
 ('cty-canada', 1, ['Canada'], 'Canada', 'Канада', 'ottawa', 'Ottawa', 'Оттава', -75.6972, 45.4215),
 ('cty-united-states', 1, ['United States of America'], 'United States', 'США', 'washington', 'Washington, D.C.', 'Вашингтон', -77.0369, 38.9072),
 ('cty-mexico', 2, ['Mexico'], 'Mexico', 'Мексика', 'mexico-city', 'Mexico City', 'Мехико', -99.1332, 19.4326),
 ('cty-guatemala', 2, ['Guatemala'], 'Guatemala', 'Гватемала', 'guatemala-city', 'Guatemala City', 'Гватемала', -90.5069, 14.6349),
 ('cty-belize', 2, ['Belize'], 'Belize', 'Белиз', 'belmopan', 'Belmopan', 'Бельмопан', -88.7590, 17.2510),
 ('cty-honduras', 3, ['Honduras'], 'Honduras', 'Гондурас', 'tegucigalpa', 'Tegucigalpa', 'Тегусигальпа', -87.1921, 14.0723),
 ('cty-el-salvador', 3, ['El Salvador'], 'El Salvador', 'Сальвадор', 'san-salvador', 'San Salvador', 'Сан-Сальвадор', -89.2182, 13.6929),
 ('cty-nicaragua', 3, ['Nicaragua'], 'Nicaragua', 'Никарагуа', 'managua', 'Managua', 'Манагуа', -86.2362, 12.1150),
 ('cty-costa-rica', 3, ['Costa Rica'], 'Costa Rica', 'Коста-Рика', 'san-jose', 'San José', 'Сан-Хосе', -84.0907, 9.9281),
 ('cty-panama', 3, ['Panama'], 'Panama', 'Панама', 'panama-city', 'Panama City', 'Панама', -79.5199, 8.9824),
]
HAWAII = box(-161.0, 18.0, -154.0, 23.0)
COCOS = box(-87.5, 5.0, -86.5, 6.0)

# ---- tap areas ----
countries = {}
for props, g in B.load(NE, 'ne_10m_admin_0_countries', 'ADMIN'):
    countries.setdefault(props['ADMIN'], []).append(g)
def polys(g):
    g = B.proj(g, B.pct).intersection(FRAME).simplify(0.03, preserve_topology=True)
    out = sorted([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and p.area >= 0.0015], key=lambda p: -p.area)
    return out[:1] + [p for p in out[1:] if p.area >= 0.01]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]
items = []
for i, (id_, unit, admins, en, ru, cid, cen, cru, lon, lat) in enumerate(ORDER, 1):
    g = unary_union([x for a in admins for x in countries[a]]).difference(HAWAII).difference(COCOS)
    ps = polys(g)
    lab = polylabel(ps[0], tolerance=0.02)
    cx, cy = B.pct(lon, lat)
    items.append({'id': id_, 'order': i, 'kind': 'country', 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(lab.x, 2), 'y': round(lab.y, 2)},
                  'capital': {'id': cid, 'name': {'en': cen, 'ru': cru}, 'x': round(cx, 2), 'y': round(cy, 2)},
                  'tapArea': [rnd(p.exterior.coords) for p in ps]})
    print(id_, len(ps), 'parts', items[-1]['label'], 'capital', cid, (round(cx, 2), round(cy, 2)), 'area', round(sum(p.area for p in ps), 3))

# ---- the map ----
blank = np.asarray(Image.open(ROOT / 'assets/namerica-blank.webp').convert('RGB')).astype(int)
rivers = np.asarray(Image.open(ROOT / 'assets/namerica-rivers.webp').convert('RGB')).astype(int)
ralpha = np.clip((np.abs(rivers - blank).sum(2) - 20) / 80, 0, 1) * (rivers[:, :, 2] - rivers[:, :, 0] > 25)
land_ne = unary_union([g for _, g in B.load(NE, 'ne_10m_land')])
region = B.na_region(land_ne)
mask = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(mask)
import shapely.ops
def dashes(l, on=7, off=5):
    """the pieces of a projected line (in px) drawn as dashes"""
    out, t = [], 0.0
    while t < l.length:
        seg = shapely.ops.substring(l, t, min(t + on, l.length))
        if seg.length > 0: out.append(seg)
        t += on + off
    return out
# Belize – Guatemala (Svetlana, 13.11.2026: keep the territorial dispute neutral): Guatemala claims part of Belize, the case is before
# the International Court of Justice; Natural Earth marks this border «Indefinite» / «Disputed», and it is drawn dashed
DISPUTED = lambda p: {p.get('ADM0_LEFT'), p.get('ADM0_RIGHT')} == {'Belize', 'Guatemala'}
for props, g in B.load(NE, 'ne_10m_admin_0_boundary_lines_land'):
    if props.get('FEATURECLA') in ('Overlay limit', 'Lease limit'): continue
    g = g.intersection(region)
    if g.is_empty: continue
    g = B.proj(g)
    for l in getattr(g, 'geoms', [g]):
        if l.geom_type != 'LineString' or l.length < (0.3 if DISPUTED(props) else 1): continue
        for piece in (dashes(l.simplify(0.2)) if DISPUTED(props) else [l.simplify(0.4)]):
            dr.line([(x * SS, y * SS) for x, y in piece.coords], fill=255, width=round((BW * 0.8 if DISPUTED(props) else BW) * SS), joint='curve')
mask = np.asarray(mask.resize((W, H), Image.LANCZOS)).astype(float) / 255
land = ~((blank[:, :, 2] > blank[:, :, 0] + 8))
mask = mask * land
img = blank * (1 - mask[..., None]) + np.array(BORDER) * mask[..., None]
img = img * (1 - ralpha[..., None]) + rivers * ralpha[..., None]
im = Image.fromarray(img.astype(np.uint8)).convert('RGBA')

eu = Image.open(ROOT / 'assets/europe-capitals.webp').convert('RGBA'); EW, EH = eu.size
mad = next(c for c in json.load(open(ROOT / 'data/maps/europe-capitals.json'))['capitals'] if c['id'] == 'madrid')
R = 13
mx, my = round(mad['x'] / 100 * EW), round(mad['y'] / 100 * EH)
patch = eu.crop((mx - R, my - R, mx + R, my + R))
dmask = Image.new('L', patch.size, 0); ImageDraw.Draw(dmask).ellipse((1, 1, 2 * R - 1, 2 * R - 1), fill=255)
dmask = dmask.filter(ImageFilter.GaussianBlur(0.8))
for it in items:
    c = it['capital']
    im.paste(patch, (round(c['x'] / 100 * W) - R, round(c['y'] / 100 * H) - R), dmask)
im.convert('RGB').save(ROOT / 'assets/namerica-countries.webp', 'WEBP', quality=90, method=6)
print('wrote assets/namerica-countries.webp')

# ---- rivers against the countries ----
K = H / W
sq = lambda g: affinity.scale(g, 1, K, origin=(0, 0))
un = lambda g: affinity.scale(g, 1, 1 / K, origin=(0, 0))
def thin(pts, d):
    out = []
    for x, y in pts:
        if all(((x - a) ** 2 + ((y - b) * K) ** 2) ** .5 >= d for a, b in out): out.append((x, y))
    return [{'x': round(x, 2), 'y': round(y, 2)} for x, y in out]
def along(line, step=1.2):
    pts = []
    for seg in getattr(line, 'geoms', [line]):
        if seg.geom_type != 'LineString' or seg.length < 0.05: continue
        s = sq(seg); n = max(1, int(s.length / step))
        pts += [(q.x, q.y / K) for q in (s.interpolate(i / n, normalized=True) for i in range(n + 1))]
    return pts
shapes = {it['id']: unary_union([Polygon(p).buffer(0) for p in it['tapArea']]) for it in items}
rv_out = []
for rv in json.load(open(ROOT / 'data/maps/namerica-rivers.json'))['items']:
    line = MultiLineString([[tuple(q) for q in seg] for seg in rv['path'] if len(seg) > 1])
    # a river along a border (the Rio Grande, the San Juan) still crosses both countries if enough of it lies inside each
    cross = [(cid, line.intersection(g.buffer(-0.05))) for cid, g in shapes.items()]
    cross = [(cid, part) for cid, part in cross if part.length > 0.3]
    if not cross: continue
    ro = {'id': rv['id'], 'crosses': [cid for cid, _ in cross], 'spots': thin([(rv['label']['x'], rv['label']['y'])] + along(line), 1.4), 'points': []}
    for cid, _ in cross:
        inner = line.intersection(un(sq(shapes[cid]).buffer(-0.25)))
        pts = along(inner, 0.6)
        if len(pts) < 2: continue
        mid = max(getattr(inner, 'geoms', [inner]), key=lambda g: g.length).interpolate(0.5, normalized=True)
        ro['points'].append({'country': cid, 'x': round(mid.x, 2), 'y': round(mid.y, 2), 'spots': thin([(mid.x, mid.y)] + pts, 0.7)})
    rv_out.append(ro)
    print(rv['id'], ro['crosses'], [(q['country'], len(q['spots'])) for q in ro['points']])

# ---- letter spots for GeoWords: anywhere well inside a country (the label point and a grid 0.25% inside the border) ----
for it in items:
    inner = un(sq(shapes[it['id']]).buffer(-0.2))
    grid = [(x / 10, y / 10) for x in range(0, 1000, 3) for y in range(0, 1000, 3) if inner.contains(Point(x / 10, y / 10))]
    it['spots'] = thin([(it['label']['x'], it['label']['y'])] + grid, 1.0 if it['unit'] == 1 else 0.6)
    print(it['id'], len(it['spots']), 'spots')
# the zoomed view of the GeoWords puzzles of each unit (S = section final): centre and zoom in % of the map
FRAMES = {'1': {'x': 50, 'y': 46, 'zoom': 1.2}, '2': {'x': 47, 'y': 80, 'zoom': 3.3}, '3': {'x': 60, 'y': 90, 'zoom': 4}, 'S': {'x': 50, 'y': 55, 'zoom': 1.1}}

out = {
  'map': './assets/namerica-countries.webp',
  'alsoValidFor': ['./assets/namerica-blank.webp', './assets/namerica-rivers.webp', './assets/namerica-lakes.webp', './assets/namerica-mountains.webp'],
  'mapAspect': '11 / 8',
  'level': 'Countries of North and Central America (block 4, section 6)',
  'coordinateSystem': 'label, capital, tapArea, spots and river points in % of image width/height from top-left; same for every namerica-*.webp (shared base, tools/namerica_base.py)',
  'source': 'Natural Earth 1:10m admin 0 countries and boundary lines (v5.1.2, commit ca96624), projected like namerica-overview.json; capitals from their lon/lat; rivers = data/maps/namerica-rivers.json',
  'notes': ['Built by tools/build_namerica_countries.py, which also draws assets/namerica-countries.webp (borders and capital dots over the rivers map).',
            'Belize – Guatemala: the border is drawn dashed (Guatemala claims part of Belize; the case is before the International Court of Justice), the dispute is not presented as resolved.',
            'The United States: the tap area is the 48 states and Alaska; Hawaii is Oceania and stays grey. Costa Rica without Cocos Island (outside the frame).',
            'Central America is small on this map: the large map of Central America (data/maps/namerica-camerica.json) is an exact piece of it.',
            'rivers: for each river of section 2 the countries of this section it crosses, and a point on the river inside each country it crosses far enough («on the Rio Grande in Mexico»).',
            'spots: where a GeoWords letter of a country or river may stand; frames: the zoomed view of the GeoWords puzzles of each unit (S = section final).'],
  'frames': FRAMES,
  'items': items,
  'rivers': rv_out,
}
dst = ROOT / 'data/maps/namerica-countries.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
