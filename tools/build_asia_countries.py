#!/usr/bin/env python3
"""Builds the Asia countries map — assets/asia-countries.webp — and data/maps/asia-countries-<section>.json for block 3 section 6
«Countries and capitals: East and Southeast Asia» and section 7 «Countries and capitals: South and Central Asia».
The map carries the capital dots of every section listed in SECTIONS; the json is written for the section given.

The map is the Asia rivers map (assets/asia-rivers.webp, every river of section 2 stays drawn: GeoWords practise a river together with
the outline of its country, Svetlana 28.10.2026) with thin land borders of Asia under the rivers and the capital dots on top. The dot is
copied from the drawn Madrid dot of assets/europe-capitals.webp, so the capitals look the same in Europe and in Asia.

Borders: Natural Earth 1:10m admin 0 boundary lines (land), clipped to the Asian side of the map (tools/asia_base.py) plus New Guinea
(the Indonesia – Papua New Guinea border). Geographic objects are shown regardless of political disputes (Svetlana, 31.10.2026): the
lines are those of Natural Earth's default (de facto) view, a secondary layer; Hong Kong and Macao are part of China's tap area.

Tap areas: Natural Earth 1:10m admin 0 countries in the projection of tools/asia_base.py, in % of the image.
Rivers: the rivers of section 2 (data/maps/asia-rivers.json) against the countries of this section — the countries each river crosses,
and for a river crossing two or more of them a point on the river well inside each one («on the Mekong in Laos»).

usage: python3 tools/build_asia_countries.py <natural-earth-dir> [section, default 6]
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from shapely.geometry import shape, Polygon, MultiLineString, Point, box
from shapely import affinity
from shapely.ops import polylabel, unary_union
import asia_base as B

NE = sys.argv[1]
SEC = int(sys.argv[2]) if len(sys.argv) > 2 else 6
ROOT = B.ROOT
W, H = B.W, B.H
FRAME = box(0, 0, 100, 100)
BORDER, BW, SS = (158, 120, 76), 2.3, 4  # the thin land borders of europe-capitals.webp: colour, width in px; supersampling

# id, unit, Natural Earth ADMIN names, EN, RU, capital id, capital EN, capital RU, capital lon, lat
ORDER6 = [
 ('cty-china', 1, ['China', 'Hong Kong S.A.R.', 'Macao S.A.R'], 'China', 'Китай', 'beijing', 'Beijing', 'Пекин', 116.4074, 39.9042),
 ('cty-mongolia', 1, ['Mongolia'], 'Mongolia', 'Монголия', 'ulaanbaatar', 'Ulaanbaatar', 'Улан-Батор', 106.9057, 47.8864),
 ('cty-north-korea', 1, ['North Korea'], 'North Korea', 'Северная Корея', 'pyongyang', 'Pyongyang', 'Пхеньян', 125.7625, 39.0392),
 ('cty-south-korea', 1, ['South Korea'], 'South Korea', 'Южная Корея', 'seoul', 'Seoul', 'Сеул', 126.9780, 37.5665),
 ('cty-japan', 1, ['Japan'], 'Japan', 'Япония', 'tokyo', 'Tokyo', 'Токио', 139.6917, 35.6895),
 ('cty-taiwan', 1, ['Taiwan'], 'Taiwan', 'Тайвань', 'taipei', 'Taipei', 'Тайбэй', 121.5654, 25.0330),
 ('cty-vietnam', 2, ['Vietnam'], 'Vietnam', 'Вьетнам', 'hanoi', 'Hanoi', 'Ханой', 105.8342, 21.0278),
 ('cty-laos', 2, ['Laos'], 'Laos', 'Лаос', 'vientiane', 'Vientiane', 'Вьентьян', 102.6331, 17.9757),
 ('cty-cambodia', 2, ['Cambodia'], 'Cambodia', 'Камбоджа', 'phnom-penh', 'Phnom Penh', 'Пномпень', 104.9282, 11.5564),
 ('cty-thailand', 2, ['Thailand'], 'Thailand', 'Таиланд', 'bangkok', 'Bangkok', 'Бангкок', 100.5018, 13.7563),
 ('cty-myanmar', 2, ['Myanmar'], 'Myanmar', 'Мьянма', 'naypyidaw', 'Naypyidaw', 'Нейпьидо', 96.1297, 19.7633),
 ('cty-malaysia', 3, ['Malaysia'], 'Malaysia', 'Малайзия', 'kuala-lumpur', 'Kuala Lumpur', 'Куала-Лумпур', 101.6869, 3.1390),
 ('cty-singapore', 3, ['Singapore'], 'Singapore', 'Сингапур', 'singapore', 'Singapore', 'Сингапур', 103.8198, 1.3521),
 ('cty-indonesia', 3, ['Indonesia'], 'Indonesia', 'Индонезия', 'jakarta', 'Jakarta', 'Джакарта', 106.8456, -6.2088),
 ('cty-brunei', 3, ['Brunei'], 'Brunei', 'Бруней', 'bandar-seri-begawan', 'Bandar Seri Begawan', 'Бандар-Сери-Бегаван', 114.9398, 4.9031),
 ('cty-philippines', 3, ['Philippines'], 'Philippines', 'Филиппины', 'manila', 'Manila', 'Манила', 120.9842, 14.5995),
 ('cty-timor-leste', 3, ['East Timor'], 'Timor-Leste', 'Восточный Тимор', 'dili', 'Dili', 'Дили', 125.5603, -8.5569),
]
# section 7 (Svetlana, 31.10.2026 19:02): Kashmir follows Natural Earth's default (de facto) view; the Siachen Glacier, a separate
# disputed unit in Natural Earth, belongs to no tap area. Sri Lanka: the capital dot is Sri Jayawardenepura Kotte (next to Colombo).
ORDER7 = [
 ('cty-india', 1, ['India'], 'India', 'Индия', 'new-delhi', 'New Delhi', 'Нью-Дели', 77.2090, 28.6139),
 ('cty-pakistan', 1, ['Pakistan'], 'Pakistan', 'Пакистан', 'islamabad', 'Islamabad', 'Исламабад', 73.0479, 33.6844),
 ('cty-bangladesh', 1, ['Bangladesh'], 'Bangladesh', 'Бангладеш', 'dhaka', 'Dhaka', 'Дакка', 90.4125, 23.8103),
 ('cty-sri-lanka', 1, ['Sri Lanka'], 'Sri Lanka', 'Шри-Ланка', 'sri-jayawardenepura-kotte', 'Sri Jayawardenepura Kotte', 'Шри-Джаяварденепура-Котте', 79.9070, 6.8868),
 ('cty-maldives', 1, ['Maldives'], 'Maldives', 'Мальдивы', 'male', 'Malé', 'Мале', 73.5093, 4.1755),
 ('cty-nepal', 2, ['Nepal'], 'Nepal', 'Непал', 'kathmandu', 'Kathmandu', 'Катманду', 85.3240, 27.7172),
 ('cty-bhutan', 2, ['Bhutan'], 'Bhutan', 'Бутан', 'thimphu', 'Thimphu', 'Тхимпху', 89.6386, 27.4728),
 ('cty-afghanistan', 2, ['Afghanistan'], 'Afghanistan', 'Афганистан', 'kabul', 'Kabul', 'Кабул', 69.2075, 34.5553),
 ('cty-kazakhstan', 3, ['Kazakhstan'], 'Kazakhstan', 'Казахстан', 'astana', 'Astana', 'Астана', 71.4704, 51.1605),
 ('cty-uzbekistan', 3, ['Uzbekistan'], 'Uzbekistan', 'Узбекистан', 'tashkent', 'Tashkent', 'Ташкент', 69.2401, 41.2995),
 ('cty-turkmenistan', 3, ['Turkmenistan'], 'Turkmenistan', 'Туркменистан', 'ashgabat', 'Ashgabat', 'Ашхабад', 58.3833, 37.9601),
 ('cty-kyrgyzstan', 3, ['Kyrgyzstan'], 'Kyrgyzstan', 'Киргизия', 'bishkek', 'Bishkek', 'Бишкек', 74.5698, 42.8746),
 ('cty-tajikistan', 3, ['Tajikistan'], 'Tajikistan', 'Таджикистан', 'dushanbe', 'Dushanbe', 'Душанбе', 68.7870, 38.5598),
]
SECTIONS = {6: ORDER6, 7: ORDER7}

# ---- tap areas ----
countries = {}
for props, g in B.load(NE, 'ne_10m_admin_0_countries', 'ADMIN'):
    countries.setdefault(props['ADMIN'], []).append(g)
def polys(g):
    g = B.proj(g, B.pct).intersection(FRAME).simplify(0.04, preserve_topology=True)
    out = sorted([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and p.area >= 0.0015], key=lambda p: -p.area)
    return out[:1] + [p for p in out[1:] if p.area >= 0.01]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]
def build(order):
  items = []
  for i, (id_, unit, admins, en, ru, cid, cen, cru, lon, lat) in enumerate(order, 1):
    g = unary_union([x for a in admins for x in countries[a]])
    ps = polys(g)
    if not ps:
        # the Maldives: atolls far smaller than a pixel; the tap area is the outline of the whole island chain, widened
        raw = B.proj(g, B.pct)
        ps = [affinity.scale(raw.convex_hull.buffer(0.35, 16), 1, 1).simplify(0.04)]
    lab = polylabel(ps[0], tolerance=0.02)
    if sum(p.area for p in ps) < 0.1:
        # Singapore is a fraction of a pixel on a phone: its tap area is a small round spot around it (a tap there that also lies in
        # Malaysia answers the smaller country, euHit), and the card magnifies it in the zoom inset
        spot = affinity.scale(Point(lab.x, lab.y).buffer(1.2, 24), 1, W / H)
        ps = [unary_union([*ps, spot])]
    cx, cy = B.pct(lon, lat)
    items.append({'id': id_, 'order': i, 'kind': 'country', 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(lab.x, 2), 'y': round(lab.y, 2)},
                  'capital': {'id': cid, 'name': {'en': cen, 'ru': cru}, 'x': round(cx, 2), 'y': round(cy, 2)},
                  'tapArea': [rnd(p.exterior.coords) for p in ps]})
    print(id_, len(ps), 'parts', items[-1]['label'], 'capital', cid, (round(cx, 2), round(cy, 2)), 'area', round(sum(p.area for p in ps), 3))
  return items
items = build(SECTIONS[SEC])
dots = [it['capital'] for o in SECTIONS.values() for it in (items if o is SECTIONS[SEC] else build(o))]

# ---- the map ----
blank = np.asarray(Image.open(ROOT / 'assets/asia-blank.webp').convert('RGB')).astype(int)
rivers = np.asarray(Image.open(ROOT / 'assets/asia-rivers.webp').convert('RGB')).astype(int)
ralpha = np.clip((np.abs(rivers - blank).sum(2) - 20) / 80, 0, 1) * (rivers[:, :, 2] - rivers[:, :, 0] > 25)

region = B.asia_region(NE).union(box(128, -11, 152, 0))  # Asia and New Guinea
mask = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(mask)
for props, g in B.load(NE, 'ne_10m_admin_0_boundary_lines_land'):
    g = g.intersection(region)
    if g.is_empty: continue
    g = B.proj(g)
    for l in getattr(g, 'geoms', [g]):
        if l.geom_type != 'LineString' or l.length < 1: continue
        xy = [(x * SS, y * SS) for x, y in l.simplify(0.4).coords]
        dr.line(xy, fill=255, width=round(BW * SS), joint='curve')
mask = np.asarray(mask.resize((W, H), Image.LANCZOS)).astype(float) / 255
# borders only on land: the land of the blank map is light brown or grey, never the blue of the sea
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
for c in dots:
    im.paste(patch, (round(c['x'] / 100 * W) - R, round(c['y'] / 100 * H) - R), dmask)
im.convert('RGB').save(ROOT / 'assets/asia-countries.webp', 'WEBP', quality=90, method=6)
print('wrote assets/asia-countries.webp')

# ---- rivers against the countries ----
shapes = {it['id']: unary_union([Polygon(p).buffer(0) for p in it['tapArea']]) for it in items}
rv_out = []
for rv in json.load(open(ROOT / 'data/maps/asia-rivers.json'))['items']:
    line = MultiLineString([[tuple(q) for q in seg] for seg in rv['path'] if len(seg) > 1])
    cross = [(cid, line.intersection(g)) for cid, g in shapes.items()]
    cross = [(cid, part) for cid, part in cross if part.length > 0.3]
    if not cross: continue
    points = []
    if len(cross) >= 2:
        for cid, part in cross:
            inner = line.intersection(shapes[cid].buffer(-0.4))
            pieces = sorted(getattr(inner, 'geoms', [inner]), key=lambda g: -g.length)
            if not pieces or pieces[0].is_empty or pieces[0].length < 1.2: continue
            pt = pieces[0].interpolate(0.5, normalized=True)
            points.append({'country': cid, 'x': round(pt.x, 2), 'y': round(pt.y, 2), 'length': round(pieces[0].length, 1)})
    rv_out.append({'id': rv['id'], 'crosses': [cid for cid, _ in cross], 'points': points})
    print(rv['id'], [cid for cid, _ in cross], [(q['country'], q['length']) for q in points])

# ---- letter spots for GeoWords (Svetlana, 31.10.2026 17:45: at least half of the letters inside the region of the lesson) ----
# A GeoWords puzzle of this section opens zoomed in on the region of its unit (FRAMES: centre and zoom in % of the map), so the
# countries are large enough for letters 9% of the screen apart. A letter may stand anywhere well inside its country (spots: the
# label point and a grid of points at least 0.25% inside the border, thinned to 1% apart), and anywhere on a river (spots along the
# river; «on the Mekong in Laos»: along the part of the river at least 0.4% inside that country). Distances are measured with y scaled
# by H / W, as on the screen.
FRAMES = {6: {'1': {'x': 57, 'y': 50, 'zoom': 2.2}, '2': {'x': 55, 'y': 70, 'zoom': 3.2}, '3': {'x': 69, 'y': 80, 'zoom': 2.4}, 'S': {'x': 60, 'y': 64, 'zoom': 1.6}},
          7: {'1': {'x': 40, 'y': 64, 'zoom': 2.6}, '2': {'x': 40, 'y': 54, 'zoom': 3}, '3': {'x': 37, 'y': 40, 'zoom': 2.6}, 'S': {'x': 38, 'y': 55, 'zoom': 1.8}}}[SEC]
K = H / W
sq = lambda g: affinity.scale(g, 1, K, origin=(0, 0))      # to screen-like units
un = lambda g: affinity.scale(g, 1, 1 / K, origin=(0, 0))
def thin(pts, d):
    out = []
    for x, y in pts:
        if all(((x - a) ** 2 + ((y - b) * K) ** 2) ** .5 >= d for a, b in out): out.append((x, y))
    return [{'x': round(x, 2), 'y': round(y, 2)} for x, y in out]
for it in items:
    inner = un(sq(shapes[it['id']]).buffer(-0.25))
    grid = [(x / 10, y / 10) for x in range(0, 1000, 4) for y in range(0, 1000, 4) if inner.contains(Point(x / 10, y / 10))]
    it['spots'] = thin([(it['label']['x'], it['label']['y'])] + grid, 1.0)
def along(line, step=1.2):
    pts = []
    for seg in getattr(line, 'geoms', [line]):
        if seg.geom_type != 'LineString' or seg.length < 0.05: continue
        s = sq(seg); n = max(1, int(s.length / step))
        pts += [(q.x, q.y / K) for q in (s.interpolate(i / n, normalized=True) for i in range(n + 1))]
    return pts
for rv, ro in zip([r for r in json.load(open(ROOT / 'data/maps/asia-rivers.json'))['items'] if any(o['id'] == r['id'] for o in rv_out)], rv_out):
    assert rv['id'] == ro['id']
    line = MultiLineString([[tuple(q) for q in seg] for seg in rv['path'] if len(seg) > 1])
    ro['spots'] = thin([(rv['label']['x'], rv['label']['y'])] + along(line), 1.4)
    ro['points'] = []
    for cid in ro['crosses']:
        inner = line.intersection(un(sq(shapes[cid]).buffer(-0.4)))
        pts = along(inner)
        if len(pts) < 2: continue
        mid = max(getattr(inner, 'geoms', [inner]), key=lambda g: g.length).interpolate(0.5, normalized=True)
        ro['points'].append({'country': cid, 'x': round(mid.x, 2), 'y': round(mid.y, 2), 'spots': thin([(mid.x, mid.y)] + pts, 1.4)})

out = {
  'map': './assets/asia-countries.webp',
  'alsoValidFor': ['./assets/asia-blank.webp', './assets/asia-rivers.webp', './assets/asia-lakes.webp', './assets/asia-mountains.webp', './assets/asia-deserts.webp'],
  'mapAspect': '11 / 8',
  'level': {6: 'Countries and capitals: East and Southeast Asia (block 3, section 6)', 7: 'Countries and capitals: South and Central Asia (block 3, section 7)'}[SEC],
  'coordinateSystem': 'label, capital, tapArea and river points in % of image width/height from top-left; same for every asia-*.webp (shared base, tools/asia_base.py)',
  'source': 'Natural Earth 1:10m admin 0 countries and boundary lines, projected like asia-overview.json; capitals from their lon/lat; rivers = data/maps/asia-rivers.json',
}
NOTES6 = {'notes': ['Built by tools/build_asia_countries.py, which also draws assets/asia-countries.webp (borders and capital dots over the rivers map).',
            'Geographic objects are shown regardless of political disputes; disputed places get neutral names and short notes (Svetlana, 31.10.2026).',
            'Taiwan is a separate object with a note on its special international status; the dispute is not presented as resolved.',
            'Hong Kong and Macao are part of the tap area of China.',
            'Singapore (a fraction of a pixel on a phone) has a round tap spot of 1.2% around it.',
            'rivers: for each river of section 2 the countries of this section it crosses, and a point on the river inside each country it crosses far enough («on the Mekong in Laos»).',
            'spots: where a GeoWords letter of a country or river may stand; frames: the zoomed view of the GeoWords puzzles of each unit (S = section final).']}
COMMON = ['rivers: for each river of section 2 the countries of this section it crosses, and a point on the river inside each country it crosses far enough («on the Ganges in Bangladesh»).',
          'spots: where a GeoWords letter of a country or river may stand; frames: the zoomed view of the GeoWords puzzles of each unit (S = section final).']
NOTES = {6: NOTES6['notes'], 7: [
  'Built by tools/build_asia_countries.py <ne> 7; assets/asia-countries.webp carries the capital dots of sections 6 and 7.',
  'Geographic objects are shown regardless of political disputes; disputed places get neutral names and short notes (Svetlana, 31.10.2026).',
  'Kashmir: the lines of Natural Earth\'s default (de facto) view; the Siachen Glacier (a separate disputed unit there) is in no tap area. The cards of India and Pakistan carry a neutral note.',
  'Sri Lanka: the capital dot is Sri Jayawardenepura Kotte, the legislative capital, next to Colombo.',
  'The Maldives (atolls far below a pixel) have the outline of the whole island chain, widened, as their tap area.'] + COMMON}
out = {**out, 'notes': NOTES[SEC],
  'frames': FRAMES,
  'items': items,
  'rivers': rv_out,
}
dst = ROOT / f'data/maps/asia-countries-{SEC}.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
