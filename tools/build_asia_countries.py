#!/usr/bin/env python3
"""Builds the Asia countries map — assets/asia-countries.webp — and data/maps/asia-countries-6.json for block 3 section 6
«Countries and capitals: East and Southeast Asia».

The map is the Asia rivers map (assets/asia-rivers.webp, every river of section 2 stays drawn: GeoWords practise a river together with
the outline of its country, Svetlana 28.10.2026) with thin land borders of Asia under the rivers and the capital dots on top. The dot is
copied from the drawn Madrid dot of assets/europe-capitals.webp, so the capitals look the same in Europe and in Asia.

Borders: Natural Earth 1:10m admin 0 boundary lines (land), clipped to the Asian side of the map (tools/asia_base.py) plus New Guinea
(the Indonesia – Papua New Guinea border). Geographic objects are shown regardless of political disputes (Svetlana, 31.10.2026): the
lines are those of Natural Earth's default (de facto) view, a secondary layer; Hong Kong and Macao are part of China's tap area.

Tap areas: Natural Earth 1:10m admin 0 countries in the projection of tools/asia_base.py, in % of the image.
Rivers: the rivers of section 2 (data/maps/asia-rivers.json) against the countries of this section — the countries each river crosses,
and for a river crossing two or more of them a point on the river well inside each one («on the Mekong in Laos»).

usage: python3 tools/build_asia_countries.py <natural-earth-dir>
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from shapely.geometry import shape, Polygon, MultiLineString, Point, box
from shapely import affinity
from shapely.ops import polylabel, unary_union
import asia_base as B

NE = sys.argv[1]
ROOT = B.ROOT
W, H = B.W, B.H
FRAME = box(0, 0, 100, 100)
BORDER, BW, SS = (158, 120, 76), 2.3, 4  # the thin land borders of europe-capitals.webp: colour, width in px; supersampling

# id, unit, Natural Earth ADMIN names, EN, RU, capital id, capital EN, capital RU, capital lon, lat
ORDER = [
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

# ---- tap areas ----
countries = {}
for props, g in B.load(NE, 'ne_10m_admin_0_countries', 'ADMIN'):
    countries.setdefault(props['ADMIN'], []).append(g)
def polys(g):
    g = B.proj(g, B.pct).intersection(FRAME).simplify(0.04, preserve_topology=True)
    out = sorted([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and p.area >= 0.0015], key=lambda p: -p.area)
    return out[:1] + [p for p in out[1:] if p.area >= 0.01]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]
items = []
for i, (id_, unit, admins, en, ru, cid, cen, cru, lon, lat) in enumerate(ORDER, 1):
    g = unary_union([x for a in admins for x in countries[a]])
    ps = polys(g)
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
    print(id_, len(ps), 'parts', items[-1]['label'], 'capital', cid, (round(cx, 2), round(cy, 2)))

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
for it in items:
    c = it['capital']
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

out = {
  'map': './assets/asia-countries.webp',
  'alsoValidFor': ['./assets/asia-blank.webp', './assets/asia-rivers.webp', './assets/asia-lakes.webp', './assets/asia-mountains.webp', './assets/asia-deserts.webp'],
  'mapAspect': '11 / 8',
  'level': 'Countries and capitals: East and Southeast Asia (block 3, section 6)',
  'coordinateSystem': 'label, capital, tapArea and river points in % of image width/height from top-left; same for every asia-*.webp (shared base, tools/asia_base.py)',
  'source': 'Natural Earth 1:10m admin 0 countries and boundary lines, projected like asia-overview.json; capitals from their lon/lat; rivers = data/maps/asia-rivers.json',
  'notes': ['Built by tools/build_asia_countries.py, which also draws assets/asia-countries.webp (borders and capital dots over the rivers map).',
            'Geographic objects are shown regardless of political disputes; disputed places get neutral names and short notes (Svetlana, 31.10.2026).',
            'Taiwan is a separate object with a note on its special international status; the dispute is not presented as resolved.',
            'Hong Kong and Macao are part of the tap area of China.',
            'Singapore (a fraction of a pixel on a phone) has a round tap spot of 1.2% around it.',
            'rivers: for each river of section 2 the countries of this section it crosses, and for a river crossing two or more of them a point on the river inside each country it crosses far enough.'],
  'items': items,
  'rivers': rv_out,
}
dst = ROOT / 'data/maps/asia-countries-6.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
