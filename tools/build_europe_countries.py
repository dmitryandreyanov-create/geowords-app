#!/usr/bin/env python3
"""Builds data/maps/europe-countries.json — tap areas, labels and capitals of block 2 section 4 «Countries and capitals:
west and north» — and data/maps/europe-countries-5.json for section 5 «Countries and capitals: centre, south and east», on the
shared Europe base (assets/europe-*.webp, drawn with the capitals on europe-capitals.webp).

Source: Natural Earth 1:50m admin 0 countries (https://github.com/nvkelso/natural-earth-vector, geojson/). Pass the folder that
holds ne_50m_admin_0_countries.geojson. The projection is the one of europe-capitals.json (Lambert conformal conic, std
parallels 45N/65N, centre 24E 54N), fitted to its capitals the same way tools/build_europe_overview.py does. Capitals come from
europe-capitals.json (the drawn dots); a capital missing there is projected from its lon/lat. Crimea is never part of these
tasks (Svetlana, 26.10.2026): Natural Earth draws it in Russia, so section 5 cuts it out of Russia and it belongs to no tap area.
Kosovo is a separate polygon in Natural Earth and is not part of Serbia's tap area (plan of section 5, approved 28.10.2026).

Section 5 also writes the rivers of section 2 (data/maps/europe-rivers.json) against the countries of sections 4 and 5: the
countries each river crosses, and for a river that crosses two or more of them a point on the river inside each country it
crosses far enough, for GeoWords clues «on the Danube in Hungary» (Svetlana, 28.10.2026).

usage: python3 tools/build_europe_countries.py <natural-earth-dir> [4|5]
"""
import json, math, sys, pathlib
import shapely
from shapely.geometry import shape, Polygon, box, MultiLineString
from shapely.ops import polylabel, unary_union

ROOT = pathlib.Path(__file__).resolve().parent.parent
NE = pathlib.Path(sys.argv[1])
SEC = int(sys.argv[2]) if len(sys.argv) > 2 else 4
caps = json.load(open(ROOT / 'data/maps/europe-capitals.json'))
drawn = [c for c in caps['capitals'] if not c.get('added')]

r = math.pi / 180
p1, p2, l0, p0 = 45 * r, 65 * r, 24 * r, 54 * r
n = math.log(math.cos(p1) / math.cos(p2)) / math.log(math.tan(math.pi / 4 + p2 / 2) / math.tan(math.pi / 4 + p1 / 2))
F = math.cos(p1) * math.tan(math.pi / 4 + p1 / 2) ** n / n
rho = lambda p: F / math.tan(math.pi / 4 + p / 2) ** n
rho0 = rho(p0)
def lcc(lon, lat):
    q, t = rho(lat * r), n * (lon * r - l0)
    return q * math.sin(t), rho0 - q * math.cos(t)
def fit(xs, ys):
    N = len(xs); sx, sy = sum(xs), sum(ys); sxx = sum(a * a for a in xs); sxy = sum(a * b for a, b in zip(xs, ys))
    k = (N * sxy - sx * sy) / (N * sxx - sx * sx); return k, (sy - k * sx) / N
P = [lcc(c['lon'], c['lat']) for c in drawn]
kx, bx = fit([p[0] for p in P], [c['x'] for c in drawn])
ky, by = fit([p[1] for p in P], [c['y'] for c in drawn])
def img(lon, lat):
    X, Y = lcc(lon, lat); return kx * X + bx, ky * Y + by
def proj(g):
    return shapely.transform(g, lambda c: [img(a, b) for a, b in c])

FRAME = box(0, 0, 100, 100)
VIEW = box(-25, 34, 60, 82)  # leaves out the Canaries, Madeira and the Azores (not on the map)
ne = {f['properties']['ADMIN']: shape(f['geometry']) for f in json.load(open(NE / 'ne_50m_admin_0_countries.geojson'))['features']}
# Crimea (with the Arabat Spit) lies in this box; west of 36.65E it holds no other Russian land (the Taman Peninsula starts east of the Kerch Strait)
CRIMEA = box(32.3, 44.2, 36.65, 46.3)
crimea = ne['Russia'].intersection(CRIMEA)
ne['Russia'] = ne['Russia'].difference(CRIMEA)

def polys(g):
    g = proj(g.intersection(VIEW)).intersection(FRAME).simplify(0.12, preserve_topology=True)
    out = sorted([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and p.area >= 0.02], key=lambda p: -p.area)
    return out[:1] + [p for p in out[1:] if p.area >= 0.15]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]

# id, unit, Natural Earth ADMIN, EN, RU, capital id, capital EN, capital RU
ORDER4 = [
 ('united-kingdom', 1, 'United Kingdom', 'United Kingdom', 'Великобритания', 'london', 'London', 'Лондон'),
 ('ireland-country', 1, 'Ireland', 'Ireland', 'Ирландия', 'dublin', 'Dublin', 'Дублин'),
 ('france', 1, 'France', 'France', 'Франция', 'paris', 'Paris', 'Париж'),
 ('netherlands', 2, 'Netherlands', 'Netherlands', 'Нидерланды', 'amsterdam', 'Amsterdam', 'Амстердам'),
 ('belgium', 2, 'Belgium', 'Belgium', 'Бельгия', 'brussels', 'Brussels', 'Брюссель'),
 ('luxembourg-country', 2, 'Luxembourg', 'Luxembourg', 'Люксембург', 'luxembourg', 'Luxembourg', 'Люксембург'),
 ('spain', 2, 'Spain', 'Spain', 'Испания', 'madrid', 'Madrid', 'Мадрид'),
 ('portugal', 2, 'Portugal', 'Portugal', 'Португалия', 'lisbon', 'Lisbon', 'Лиссабон'),
 ('norway', 3, 'Norway', 'Norway', 'Норвегия', 'oslo', 'Oslo', 'Осло'),
 ('sweden', 3, 'Sweden', 'Sweden', 'Швеция', 'stockholm', 'Stockholm', 'Стокгольм'),
 ('denmark', 3, 'Denmark', 'Denmark', 'Дания', 'copenhagen', 'Copenhagen', 'Копенгаген'),
 ('finland', 3, 'Finland', 'Finland', 'Финляндия', 'helsinki', 'Helsinki', 'Хельсинки'),
 ('iceland-country', 3, 'Iceland', 'Iceland', 'Исландия', 'reykjavik', 'Reykjavik', 'Рейкьявик'),
]
ORDER5 = [
 ('germany', 1, 'Germany', 'Germany', 'Германия', 'berlin', 'Berlin', 'Берлин'),
 ('switzerland', 1, 'Switzerland', 'Switzerland', 'Швейцария', 'bern', 'Bern', 'Берн'),
 ('austria', 1, 'Austria', 'Austria', 'Австрия', 'vienna', 'Vienna', 'Вена'),
 ('czechia', 1, 'Czechia', 'Czechia', 'Чехия', 'prague', 'Prague', 'Прага'),
 ('poland', 1, 'Poland', 'Poland', 'Польша', 'warsaw', 'Warsaw', 'Варшава'),
 ('hungary', 1, 'Hungary', 'Hungary', 'Венгрия', 'budapest', 'Budapest', 'Будапешт'),
 ('italy', 2, 'Italy', 'Italy', 'Италия', 'rome', 'Rome', 'Рим'),
 ('greece', 2, 'Greece', 'Greece', 'Греция', 'athens', 'Athens', 'Афины'),
 ('serbia', 2, 'Republic of Serbia', 'Serbia', 'Сербия', 'belgrade', 'Belgrade', 'Белград'),
 ('romania', 2, 'Romania', 'Romania', 'Румыния', 'bucharest', 'Bucharest', 'Бухарест'),
 ('estonia', 3, 'Estonia', 'Estonia', 'Эстония', 'tallinn', 'Tallinn', 'Таллин'),
 ('latvia', 3, 'Latvia', 'Latvia', 'Латвия', 'riga', 'Riga', 'Рига'),
 ('lithuania', 3, 'Lithuania', 'Lithuania', 'Литва', 'vilnius', 'Vilnius', 'Вильнюс'),
 ('belarus', 3, 'Belarus', 'Belarus', 'Беларусь', 'minsk', 'Minsk', 'Минск'),
 ('ukraine', 3, 'Ukraine', 'Ukraine', 'Украина', 'kyiv', 'Kyiv', 'Киев'),
 ('russia', 3, 'Russia', 'Russia', 'Россия', 'moscow', 'Moscow', 'Москва'),
]
ORDER = ORDER5 if SEC == 5 else ORDER4
capOf = {c['id']: c for c in caps['capitals']}
items = []
for i, (id_, unit, admin, en, ru, cid, cen, cru) in enumerate(ORDER, 1):
    ps = polys(ne[admin])
    lab = polylabel(ps[0], tolerance=0.05)
    c = capOf[cid]
    items.append({'id': id_, 'order': i, 'kind': 'country', 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(lab.x, 2), 'y': round(lab.y, 2)},
                  'capital': {'id': cid, 'name': {'en': cen, 'ru': cru}, 'x': c['x'], 'y': c['y']},
                  'tapArea': [rnd(p.exterior.coords) for p in ps]})
    print(id_, len(ps), 'parts', items[-1]['label'], 'capital', cid, (c['x'], c['y']))

if SEC == 4:
    out = {
      'map': './assets/europe-capitals.webp',
      'alsoValidFor': ['./assets/europe-blank.webp', './assets/europe-rivers.webp', './assets/europe-mountains.webp'],
      'mapAspect': '11 / 8',
      'level': 'Countries and capitals: west and north (block 2, section 4)',
      'coordinateSystem': 'label, capital and tapArea in % of image width/height from top-left; same for all four europe-*.webp (shared base)',
      'source': 'Natural Earth 1:50m admin 0 countries, projected like europe-capitals.json; capitals = the drawn dots of europe-capitals.webp',
      'notes': ['Built by tools/build_europe_countries.py.',
                'Country ids differ from the section 1 islands (ireland, iceland, great-britain): a country and the island of the same name never share a puzzle.',
                'Crimea never appears in country or capital tasks (Svetlana, 26.10.2026).'],
      'items': items,
    }
    dst = ROOT / 'data/maps/europe-countries.json'
else:
    # the rivers of section 2 against the countries of sections 4 and 5 (tap areas as built here)
    shapes = {it['id']: unary_union([Polygon(p) for p in it['tapArea']]) for it in items}
    for it in json.load(open(ROOT / 'data/maps/europe-countries.json'))['items']:
        shapes[it['id']] = unary_union([Polygon(p) for p in it['tapArea']])
    rivers = []
    for rv in json.load(open(ROOT / 'data/maps/europe-rivers.json'))['items']:
        if not rv.get('path'):
            continue
        line = MultiLineString([[tuple(q) for q in seg] for seg in rv['path'] if len(seg) > 1])
        cross = [(cid, line.intersection(g)) for cid, g in shapes.items()]
        cross = [(cid, part) for cid, part in cross if part.length > 0.3]
        points = []
        if len(cross) >= 2:
            for cid, part in cross:
                # the middle of the longest piece of the river well inside the country (0.5% from its border; a border river such as the Danube between Romania and Bulgaria gets no point), if that piece is long enough to find
                inner = line.intersection(shapes[cid].buffer(-0.5))
                pieces = sorted(getattr(inner, 'geoms', [inner]), key=lambda g: -g.length)
                if not pieces or pieces[0].is_empty or pieces[0].length < 1.5:
                    continue
                pt = pieces[0].interpolate(0.5, normalized=True)
                points.append({'country': cid, 'x': round(pt.x, 2), 'y': round(pt.y, 2), 'length': round(pieces[0].length, 1)})
        rivers.append({'id': rv['id'], 'crosses': [cid for cid, _ in cross], 'points': points})
        print(rv['id'], [cid for cid, _ in cross], [(q['country'], q['length']) for q in points])
    out = {
      'map': './assets/europe-capitals.webp',
      'alsoValidFor': ['./assets/europe-blank.webp', './assets/europe-rivers.webp', './assets/europe-mountains.webp'],
      'mapAspect': '11 / 8',
      'level': 'Countries and capitals: centre, south and east (block 2, section 5)',
      'coordinateSystem': 'label, capital, tapArea and river points in % of image width/height from top-left; same for all four europe-*.webp (shared base)',
      'source': 'Natural Earth 1:50m admin 0 countries, projected like europe-capitals.json; capitals = the drawn dots of europe-capitals.webp (Tallinn, Riga and Vilnius added 28.10.2026); rivers = data/maps/europe-rivers.json',
      'notes': ['Built by tools/build_europe_countries.py <natural-earth-dir> 5.',
                'Crimea never appears in country or capital tasks (Svetlana, 26.10.2026): Natural Earth draws it in Russia; it is cut out of Russia here and belongs to no tap area.',
                'Kosovo is a separate polygon in Natural Earth and is not part of Serbia here (section 5 plan, approved 28.10.2026).',
                'rivers: for each river of section 2 the countries of sections 4 and 5 it crosses, and for a river crossing two or more of them a point on the river inside each country it crosses far enough («on the Danube in Hungary», Svetlana 28.10.2026).'],
      'items': items,
      # land that answers no country: a tap there is never right, also when it lies next to the asked country
      'neutral': [{'id': 'crimea', 'tapArea': [rnd(p.exterior.coords) for p in polys(crimea)]}, {'id': 'kosovo', 'tapArea': [rnd(p.exterior.coords) for p in polys(ne['Kosovo'])]}],
      'rivers': rivers,
    }
    dst = ROOT / 'data/maps/europe-countries-5.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
