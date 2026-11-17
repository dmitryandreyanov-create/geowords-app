#!/usr/bin/env python3
"""Builds the large map of the Caribbean for block 4 section 7 «Countries of the Caribbean islands»:
assets/namerica-caribbean.webp (2200×1600), the Lesser Antilles magnifier assets/namerica-lesser-antilles.webp (1540×1120) and
data/maps/namerica-caribbean.json.

On the North America maps (2200×1600, tools/namerica_base.py) the Lesser Antilles are a few pixels each, so the section has its own map:
an exact piece of the same projection (FRAME, in % of the North America maps) drawn about 3.5 times larger, in the colours of
assets/namerica-blank.webp. Because it is an exact crop, a point (x, y) in % of the North America maps is (100·(x − FX)/SPAN,
100·(y − FY)/SPAN) here, so the objects of section 1 (the Caribbean Sea, the Gulf of Mexico, the Atlantic Ocean, Cuba, Hispaniola,
Florida, Yucatán) are carried over as they are (GeoWords use them instead of rivers, plan of block 4).

Land: the 13 island states and the mainland countries of North America in sand colour; the dependencies of other countries
(Puerto Rico, the Virgin Islands, Guadeloupe, Martinique, the Cayman Islands, Aruba, Curaçao…) pale sand, never asked; South America
grey. Thin land borders, dark coastlines, capital dots of the 13 states (and of the mainland countries of section 6 in the frame).
The US naval base at Guantánamo is drawn as part of Cuba (no line), as Natural Earth's lease is a few pixels.

The magnifier (the 🔍 mechanism of the Levant map, tools/build_asia_levant.py) is an exact piece of this map around the seven small
states of the Lesser Antilles, drawn about four times larger; tap areas and capitals in % of this map apply there unchanged.

Tap areas: Natural Earth 1:10m admin 0 countries; a small island state (SMALL) gets its islands widened by WIDEN % (never into a
neighbour's area), and the card shows it in the zoom inset (zoomInset).

usage: python3 tools/build_namerica_caribbean.py <natural-earth-dir>
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, distance_transform_edt
from shapely.geometry import box, Polygon, LineString, Point
from shapely import affinity
from shapely.ops import unary_union, polylabel
import namerica_base as B

NE = sys.argv[1]
ROOT = B.ROOT
# the frame in % of the North America maps (same span in x and y keeps the 11:8 shape)
FX, FY, SPAN = 54.85, 67.25, 28.6
W, H = B.W, B.H
TAN, PALE, GREY, SHALLOW, DEEP, COAST = (221, 181, 122), (236, 222, 196), (129, 128, 133), (225, 234, 236), (129, 166, 178), (70, 58, 50)
BORDER = (158, 120, 76)
VIEW = box(-100.0, -8.0, -45.0, 33.0)

# id, unit, Natural Earth ADMIN names, EN, RU, capital id, EN, RU, lon, lat
STATES = [
 ('cty-cuba', 1, ['Cuba', 'US Naval Base Guantanamo Bay'], 'Cuba', 'Куба', 'havana', 'Havana', 'Гавана', -82.3666, 23.1136),
 ('cty-bahamas', 1, ['The Bahamas'], 'The Bahamas', 'Багамы', 'nassau', 'Nassau', 'Нассау', -77.3504, 25.0478),
 ('cty-jamaica', 1, ['Jamaica'], 'Jamaica', 'Ямайка', 'kingston', 'Kingston', 'Кингстон', -76.7936, 17.9712),
 ('cty-haiti', 2, ['Haiti'], 'Haiti', 'Гаити', 'port-au-prince', 'Port-au-Prince', 'Порт-о-Пренс', -72.3388, 18.5944),
 ('cty-dominican-republic', 2, ['Dominican Republic'], 'Dominican Republic', 'Доминиканская Республика', 'santo-domingo', 'Santo Domingo', 'Санто-Доминго', -69.9312, 18.4861),
 ('cty-saint-kitts-and-nevis', 2, ['Saint Kitts and Nevis'], 'Saint Kitts and Nevis', 'Сент-Китс и Невис', 'basseterre', 'Basseterre', 'Бастер', -62.7177, 17.3026),
 ('cty-antigua-and-barbuda', 2, ['Antigua and Barbuda'], 'Antigua and Barbuda', 'Антигуа и Барбуда', 'saint-johns', "Saint John's", 'Сент-Джонс', -61.8456, 17.1274),
 ('cty-dominica', 2, ['Dominica'], 'Dominica', 'Доминика', 'roseau', 'Roseau', 'Розо', -61.3870, 15.3010),
 ('cty-saint-lucia', 3, ['Saint Lucia'], 'Saint Lucia', 'Сент-Люсия', 'castries', 'Castries', 'Кастри', -60.9875, 14.0101),
 ('cty-saint-vincent', 3, ['Saint Vincent and the Grenadines'], 'Saint Vincent and the Grenadines', 'Сент-Винсент и Гренадины', 'kingstown', 'Kingstown', 'Кингстаун', -61.2248, 13.1600),
 ('cty-grenada', 3, ['Grenada'], 'Grenada', 'Гренада', 'saint-georges', "Saint George's", 'Сент-Джорджес', -61.7486, 12.0561),
 ('cty-barbados', 3, ['Barbados'], 'Barbados', 'Барбадос', 'bridgetown', 'Bridgetown', 'Бриджтаун', -59.6167, 13.0969),
 ('cty-trinidad-and-tobago', 3, ['Trinidad and Tobago'], 'Trinidad and Tobago', 'Тринидад и Тобаго', 'port-of-spain', 'Port of Spain', 'Порт-оф-Спейн', -61.5190, 10.6603),
]
SMALL = {'cty-saint-kitts-and-nevis', 'cty-antigua-and-barbuda', 'cty-dominica', 'cty-saint-lucia', 'cty-saint-vincent', 'cty-grenada', 'cty-barbados'}
ZOOM = SMALL | {'cty-trinidad-and-tobago', 'cty-jamaica'}
WIDEN = 0.9   # % of the map width around a small state's islands
# mainland countries of North America (section 6) in sand colour, with their capital dots where they fall in the frame
MAINLAND = {'United States of America': None, 'Mexico': None, 'Belize': (-88.7590, 17.2510), 'Guatemala': (-90.5069, 14.6349),
            'Honduras': (-87.2068, 14.0723), 'El Salvador': (-89.2182, 13.6929), 'Nicaragua': (-86.2514, 12.1150),
            'Costa Rica': (-84.0907, 9.9281), 'Panama': (-79.5199, 8.9824)}

def pct(lon, lat):
    """lon/lat → % of this map"""
    x, y = B.pct(lon, lat)
    return 100 * (x - FX) / SPAN, 100 * (y - FY) / SPAN
def from_na(x, y):
    """% of the North America maps → % of this map"""
    return 100 * (x - FX) / SPAN, 100 * (y - FY) / SPAN

countries = {}
for props, g in B.load(NE, 'ne_10m_admin_0_countries', 'ADMIN'):
    if g.intersects(VIEW): countries.setdefault(props['ADMIN'], []).append(g.intersection(VIEW))
land = unary_union([g for _, g in B.load(NE, 'ne_10m_land') if g.intersects(VIEW)]).intersection(VIEW)
lakes = unary_union([g for p, g in B.load(NE, 'ne_10m_lakes') if g.intersects(VIEW) and p.get('scalerank', 9) <= 4])
land = land.difference(lakes)
SA = unary_union([g for a in ('Colombia', 'Venezuela', 'Guyana', 'Suriname', 'Brazil', 'Ecuador', 'Peru', 'France') for g in countries.get(a, []) if g.intersects(box(-79.5, -8, -45, 12.8))])
na = land.difference(SA.buffer(0.05).intersection(box(-79.5, -8, -45, 12.8)))
tan = unary_union([g for s in STATES for a in s[2] for g in countries[a]] + [g for a in MAINLAND for g in countries[a]]).buffer(0.02)
polys = lambda g: [p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon)]

lines = []
for p, g in B.load(NE, 'ne_10m_admin_0_boundary_lines_land'):
    if not g.intersects(VIEW) or 'Guantanamo' in (p.get('ADM0_RIGHT') or '') + (p.get('ADM0_LEFT') or ''): continue
    g = g.intersection(VIEW)
    lines += [l for l in getattr(g, 'geoms', [g]) if l.geom_type == 'LineString']

def render(to_px, OW, OH, SS, coast_w, border_w, dot_r, dots, km_px):
    """draws the map: to_px(lon, lat) → supersampled pixels; km_px: map pixels per pixel of the North America maps"""
    WS, HS = OW * SS, OH * SS
    ring = lambda c: [to_px(a, b) for a, b in c]
    def mask(g):
        im = Image.new('L', (WS, HS), 0); d = ImageDraw.Draw(im)
        for p in polys(g):
            d.polygon(ring(p.exterior.coords), fill=255)
            for h in p.interiors: d.polygon(ring(h.coords), fill=0)
        return np.asarray(im) > 127
    L = mask(land); N = mask(na) & L; T = mask(tan) & N
    rng = np.random.default_rng(7)
    def noise(sigma, amp):
        n = gaussian_filter(rng.standard_normal((HS, WS)), sigma)
        return n * amp / n.std()
    dist = distance_transform_edt(~L) / SS / km_px
    t = np.clip(dist / 60 + noise(70 * SS * 2, 0.06), 0, 1); t = t * t * (3 - 2 * t)
    img = np.array(SHALLOW)[None, None] * (1 - t[..., None]) + np.array(DEEP)[None, None] * t[..., None] + noise(6 * SS * 2, 3)[..., None]
    grain = noise(1.4 * SS, 4)[..., None] + noise(25 * SS * 2, 5)[..., None]
    img = np.where(L[..., None], np.array(GREY)[None, None] + grain, img)
    img = np.where(N[..., None], np.array(PALE)[None, None] + grain, img)
    img = np.where(T[..., None], np.array(TAN)[None, None] + grain * 1.3, img)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGB')
    bm = Image.new('L', (WS, HS), 0); bd = ImageDraw.Draw(bm)
    for l in lines: bd.line(ring(l.coords), fill=255, width=round(border_w * SS), joint='curve')
    bmask = (np.asarray(bm).astype(float) / 255) * L
    arr = np.asarray(im).astype(float)
    arr = arr * (1 - bmask[..., None]) + np.array(BORDER) * bmask[..., None]
    im = Image.fromarray(arr.astype(np.uint8))
    d = ImageDraw.Draw(im)
    for p in polys(land):
        for c in [p.exterior.coords] + [h.coords for h in p.interiors]:
            d.line(ring(c), fill=COAST, width=max(1, round(coast_w * SS)), joint='curve')
    R = dot_r * SS
    for lon, lat in dots:
        x, y = to_px(lon, lat)
        for rr, col in ((1.0, (229, 190, 137)), (0.86, (63, 34, 15)), (0.70, (255, 250, 234)), (0.47, (122, 65, 52)), (0.40, (150, 42, 35))):
            d.ellipse((x - R * rr, y - R * rr, x + R * rr, y + R * rr), fill=col)
    return im.resize((OW, OH), Image.LANCZOS)

K = 100 / SPAN                                  # pixels of this map per pixel of the North America maps (≈ 3.5)
dots = [(s[8], s[9]) for s in STATES] + [v for v in MAINLAND.values() if v and 0 < pct(*v)[0] < 100 and 0 < pct(*v)[1] < 100]
SS = 2
def main_px(lon, lat):
    x, y = pct(lon, lat)
    return x / 100 * W * SS, y / 100 * H * SS
img = render(main_px, W, H, SS, 2.6, 2.2, 12, dots, K)
img.save(ROOT / 'assets/namerica-caribbean.webp', 'WEBP', quality=88, method=6)
print('wrote assets/namerica-caribbean.webp scale', round(K, 2))

# ---- tap areas (in % of this map) ----
Kr = H / W
sq = lambda g: affinity.scale(g, 1, Kr, origin=(0, 0))
un = lambda g: affinity.scale(g, 1, 1 / Kr, origin=(0, 0))
FR = box(0, 0, 100, 100)
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]
raw = {}
for s in STATES:
    g = unary_union([x for a in s[2] for x in countries[a]])
    raw[s[0]] = B.proj(g, pct).intersection(FR)
shapes = {}
for s in STATES:
    g = raw[s[0]]
    if s[0] in SMALL:
        g = unary_union([g, un(sq(g).buffer(WIDEN, 16))])
    shapes[s[0]] = g
# a widened area never enters a neighbour: split the overlap by distance to each state's own islands
ids = [s[0] for s in STATES]
for a in ids:
    for b in ids:
        if a >= b: continue
        ov = shapes[a].intersection(shapes[b])
        if ov.is_empty or ov.area < 1e-6: continue
        # assign each part of the overlap to the nearer state (perpendicular bisector of the two outlines, sampled)
        pa, pb = raw[a], raw[b]
        xs0, ys0, xs1, ys1 = ov.bounds
        keep_a = []
        step = 0.05
        y = ys0
        while y <= ys1:
            x = xs0
            while x <= xs1:
                pt = Point(x, y)
                if ov.contains(pt) and sq(pa).distance(sq(pt)) <= sq(pb).distance(sq(pt)): keep_a.append(pt.buffer(step * 0.75, 4))
                x += step
            y += step
        ga = unary_union(keep_a).intersection(ov) if keep_a else Polygon()
        shapes[a] = shapes[a].difference(ov).union(ga).buffer(0)
        shapes[b] = shapes[b].difference(ga).buffer(0)
items = []
for i, s in enumerate(STATES, 1):
    id_, unit, admins, en, ru, cid, cen, cru, lon, lat = s
    g = shapes[id_].simplify(0.03, preserve_topology=True)
    ps = sorted([p for p in polys(g) if p.area >= 0.002], key=lambda p: -p.area)
    big = max(polys(raw[id_]), key=lambda p: p.area)
    lab = polylabel(big, tolerance=0.01)
    cx, cy = pct(lon, lat)
    it = {'id': id_, 'order': i, 'kind': 'country', 'unit': unit, 'name': {'en': en, 'ru': ru},
          'label': {'x': round(lab.x, 2), 'y': round(lab.y, 2)},
          'capital': {'id': cid, 'name': {'en': cen, 'ru': cru}, 'x': round(cx, 2), 'y': round(cy, 2)},
          'tapArea': [rnd(p.exterior.coords) for p in ps]}
    if id_ in ZOOM: it['zoomInset'] = True
    items.append(it)
    print(id_, len(ps), 'parts', it['label'], cid, (round(cx, 2), round(cy, 2)), 'area', round(sum(p.area for p in ps), 3))

# ---- the Lesser Antilles magnifier: an exact piece of this map ----
small = unary_union([raw[i] for i in SMALL])
x0, y0, x1, y1 = small.bounds
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
MS = max(x1 - x0, y1 - y0) + 3.5        # % of this map, the same in x and y (11:8)
MX, MY = round(cx - MS / 2, 2), round(cy - MS / 2, 2)
MS = round(MS, 2)
OW, OH = 1540, 1120
KM = OW / (MS / 100 * W)                # pixels of the magnifier per pixel of this map
def mag_px(lon, lat):
    x, y = pct(lon, lat)
    return (x - MX) / MS * OW * SS, (y - MY) / MS * OH * SS
mdots = [(s[8], s[9]) for s in STATES if s[0] in SMALL or (MX < pct(s[8], s[9])[0] < MX + MS and MY < pct(s[8], s[9])[1] < MY + MS)]
mag = render(mag_px, OW, OH, SS, 4, 3, 20, mdots, K * KM)
mag.save(ROOT / 'assets/namerica-lesser-antilles.webp', 'WEBP', quality=88, method=6)
print('wrote assets/namerica-lesser-antilles.webp frame', (MX, MY, MS), 'scale', round(KM, 2))

# ---- objects of section 1 carried over ----
S1 = ('na-caribbean-sea', 'na-gulf-of-mexico', 'na-atlantic-ocean', 'na-cuba', 'na-hispaniola', 'na-florida', 'na-yucatan')
review = []
for o in json.load(open(ROOT / 'data/maps/namerica-overview.json'))['items']:
    if o['id'] not in S1: continue
    def conv(poly): return [[round(a, 2), round(b, 2)] for a, b in (from_na(x, y) for x, y in poly)]
    area = [Polygon(conv(p)).buffer(0).intersection(FR) for p in o['tapArea']]
    holes = [Polygon(conv(h)).buffer(0) for h in o.get('holes', [])]
    g = unary_union(area).difference(unary_union(holes)) if holes else unary_union(area)
    g = g.simplify(0.05, preserve_topology=True)
    ps = [p for p in polys(g) if p.area > 0.05]
    lab = polylabel(max(ps, key=lambda p: p.area), tolerance=0.05)
    lx, ly = from_na(o['label']['x'], o['label']['y'])
    if not (2 < lx < 98 and 2 < ly < 98) or not g.contains(Point(lx, ly)): lx, ly = lab.x, lab.y
    r = {'id': o['id'], 'kind': o['kind'], 'name': o['name'], 'label': {'x': round(lx, 2), 'y': round(ly, 2)},
         'tapArea': [rnd(p.exterior.coords) for p in ps]}
    hs = [rnd(h.coords) for p in ps for h in p.interiors]
    if hs: r['holes'] = hs
    review.append(r)
    print(o['id'], len(ps), 'parts', r['label'])

out = {
  'map': './assets/namerica-caribbean.webp',
  'mapAspect': '11 / 8',
  'level': 'Countries of the Caribbean islands (block 4, section 7)',
  'coordinateSystem': 'label, capital, tapArea in % of this map from top-left. frame: the piece of the North America maps (namerica-*.webp) this map shows, in % of those maps; a point (x, y) there is (100·(x − frame.x)/frame.w, 100·(y − frame.y)/frame.h) here.',
  'source': 'Built by tools/build_namerica_caribbean.py from Natural Earth 1:10m (land, lakes, admin 0 countries and boundary lines) in the projection of tools/namerica_base.py; review objects from data/maps/namerica-overview.json',
  'notes': ['The 13 island states and the mainland countries are sand-coloured; dependencies of other countries are pale and never asked; South America is grey.',
            'Small island states: the islands widened by %.1f%% of the map width as the tap area (split with the neighbours by distance), a zoom inset on the card, and the magnifier 🔍 of the Lesser Antilles.' % WIDEN,
            'The US naval base at Guantánamo Bay (a lease) is inside the tap area of Cuba, no line drawn.'],
  'frame': {'x': FX, 'y': FY, 'w': SPAN, 'h': SPAN},
  'magnifier': {'map': './assets/namerica-lesser-antilles.webp', 'frame': {'x': MX, 'y': MY, 'w': MS, 'h': MS},
                'at': {'x': round(MX + MS / 2, 2), 'y': round(MY + MS / 2, 2)}, 'objects': sorted(SMALL),
                'capitals': [s[5] for s in STATES if (s[8], s[9]) in mdots]},
  'items': items,
  'review': review,
}
dst = ROOT / 'data/maps/namerica-caribbean.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst)
