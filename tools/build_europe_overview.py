#!/usr/bin/env python3
"""Builds data/maps/europe-overview.json — tap areas, labels and the Ural River line for block 2
section 1 «Europe on the map» on the shared Europe base (assets/europe-*.webp).

Source: Natural Earth 1:10m marine polygons, regions polygons, rivers and 1:50m land
(https://github.com/nvkelso/natural-earth-vector, geojson/). Pass the folder that holds
ne_10m_geography_marine_polys, ne_10m_geography_regions_polys, ne_10m_rivers_lake_centerlines
and ne_50m_land (.geojson). The projection is the one of europe-capitals.json (Lambert conformal
conic, std parallels 45N/65N, centre 24E 54N), fitted to its 24 capitals the same way
scripts/validate-maps.mjs checks it.

usage: python3 tools/build_europe_overview.py <natural-earth-dir>
"""
import json, math, sys, pathlib
import shapely
from shapely.geometry import shape, Polygon, MultiPolygon, LineString, MultiLineString, Point, box
from shapely.ops import unary_union, polylabel

ROOT = pathlib.Path(__file__).resolve().parent.parent
NE = pathlib.Path(sys.argv[1])
caps = json.load(open(ROOT / 'data/maps/europe-capitals.json'))

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
P = [lcc(c['lon'], c['lat']) for c in caps['capitals']]
kx, bx = fit([p[0] for p in P], [c['x'] for c in caps['capitals']])
ky, by = fit([p[1] for p in P], [c['y'] for c in caps['capitals']])
def img(lon, lat, z=None):
    X, Y = lcc(lon, lat); return kx * X + bx, ky * Y + by
def proj(g):
    return shapely.transform(g, lambda c: [img(a, b) for a, b in c])

FRAME = box(0, 0, 100, 100)
VIEW = box(-60, 25, 90, 85)  # lon/lat window around the map (keeps the conic projection well-behaved)
def load(name, key='name'):
    return [(f['properties'].get(key) or '', shape(f['geometry'])) for f in json.load(open(NE / (name + '.geojson')))['features']]
marine, regions = load('ne_10m_geography_marine_polys'), load('ne_10m_geography_regions_polys', 'NAME')
land = unary_union([g for _, g in load('ne_50m_land')]).intersection(VIEW)
def named(src, *names): return unary_union([g for nm, g in src if nm in names]).intersection(VIEW)
def where(src, lon0, lon1, lat0, lat1, skip=()):
    return unary_union([g for nm, g in src if nm not in skip and lon0 <= g.representative_point().x <= lon1 and lat0 <= g.representative_point().y <= lat1]).intersection(VIEW)
def landAt(lon, lat):
    return next(g for g in getattr(land, 'geoms', [land]) if g.contains(Point(lon, lat)))
SPLIT = ('Sea of Marmara', 'Black Sea', 'Sea of Azov', 'Bosporus', 'Dardanelles', 'Red Sea', 'Gulf of Suez', 'Gulf of Aqaba', 'Suez Canal')

geo = {
  'atlantic-ocean': named(marine, 'North Atlantic Ocean', 'Bay of Biscay', 'Irish Sea', 'English Channel', 'Celtic Sea', 'Bristol Channel', "St. George's Channel"),
  # the Norwegian and Greenland Seas belong to the Arctic Ocean in Russian school geography and in IHO S-23 (1953)
  'arctic-ocean': named(marine, 'Arctic Ocean', 'Norwegian Sea', 'Greenland Sea', 'Barents Sea', 'Kara Sea', 'White Sea', 'Pechora Sea'),
  'mediterranean-sea': where(marine, -5.6, 36.5, 30, 46.5, SPLIT + ('Bay of Biscay', 'North Atlantic Ocean')),
  'ural-mountains': named(regions, 'URAL MOUNTAINS'),
  'caspian-sea': named(marine, 'Caspian Sea'),
  'scandinavian-peninsula': named(regions, 'SCANDINAVIA').buffer(0.3).intersection(land).difference(named(regions, 'KOLA PENINSULA').buffer(0.3)),
  'kola-peninsula': named(regions, 'KOLA PENINSULA').buffer(0.3).intersection(land),
  'jutland': named(regions, 'JUTLAND').buffer(0.3).intersection(landAt(9.5, 56.2)),
  'iberian-peninsula': named(regions, 'PENÍNSULA IBÉRICA').buffer(0.5).intersection(landAt(-3.7, 40.4)),
  # no Natural Earth polygon for the Apennine Peninsula: mainland Italy south of the Po plain (La Spezia – Rimini line)
  'apennine-peninsula': landAt(12.5, 41.9).intersection(Polygon([(9.85, 44.05), (12.4, 44.2), (18.1, 40.9), (18.9, 39.9), (16.4, 37.7), (15.0, 37.9), (11.5, 40.5), (9.4, 43.9)])),
  'balkan-peninsula': named(regions, 'BALKAN PEN.').buffer(0.3).intersection(landAt(21.0, 42.0)),
  'crimean-peninsula': named(regions, 'CRIMEA').buffer(0.3).intersection(landAt(34.1, 44.9)),
  'great-britain': landAt(-0.13, 51.5),
  'ireland': landAt(-6.26, 53.35),
  'iceland': landAt(-21.9, 64.15),
  'sicily': landAt(13.36, 38.12),
  'baltic-sea': where(marine, 9.5, 31, 53, 66.5, ('Kattegat', 'Skagerrak', 'White Sea')),
  'north-sea': named(marine, 'North Sea'),
  'barents-sea': named(marine, 'Barents Sea', 'Pechora Sea'),
}
# other books give the Norwegian and Greenland Seas to the Atlantic, and the North Sea is part of the Atlantic: a tap there also counts for it
soft = {'atlantic-ocean': named(marine, 'Norwegian Sea', 'Greenland Sea', 'North Sea', 'Skagerrak'),
        'north-sea': named(marine, 'Skagerrak')}
# a label stays clear of an object drawn inside this one (the Arctic label is not on the Barents Sea)
labelOff = {'arctic-ocean': 'barents-sea'}
rivers = [g for nm, g in load('ne_10m_rivers_lake_centerlines') if nm == 'Ural']

def polys(g):
    g = proj(g).intersection(FRAME).simplify(0.18, preserve_topology=True)
    out = sorted([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and p.area >= 0.05], key=lambda p: -p.area)
    return out[:1] + [p for p in out[1:] if p.area >= 0.3]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]

ORDER = [
 ('atlantic-ocean', 'ocean', 1, 'Atlantic Ocean', 'Атлантический океан'),
 ('arctic-ocean', 'ocean', 1, 'Arctic Ocean', 'Северный Ледовитый океан'),
 ('mediterranean-sea', 'sea', 1, 'Mediterranean Sea', 'Средиземное море'),
 ('ural-mountains', 'mountain', 1, 'Ural Mountains', 'Уральские горы'),
 ('ural-river', 'river', 1, 'Ural River', 'Река Урал'),
 ('caspian-sea', 'sea', 1, 'Caspian Sea', 'Каспийское море'),
 ('scandinavian-peninsula', 'peninsula', 2, 'Scandinavian Peninsula', 'Скандинавский полуостров'),
 ('kola-peninsula', 'peninsula', 2, 'Kola Peninsula', 'Кольский полуостров'),
 ('jutland', 'peninsula', 2, 'Jutland', 'Ютландия'),
 ('iberian-peninsula', 'peninsula', 2, 'Iberian Peninsula', 'Пиренейский полуостров'),
 ('apennine-peninsula', 'peninsula', 2, 'Apennine Peninsula', 'Апеннинский полуостров'),
 ('balkan-peninsula', 'peninsula', 2, 'Balkan Peninsula', 'Балканский полуостров'),
 ('crimean-peninsula', 'peninsula', 2, 'Crimean Peninsula', 'Крымский полуостров'),
 ('great-britain', 'island', 3, 'Great Britain', 'Великобритания'),
 ('ireland', 'island', 3, 'Ireland', 'Ирландия'),
 ('iceland', 'island', 3, 'Iceland', 'Исландия'),
 ('sicily', 'island', 3, 'Sicily', 'Сицилия'),
 ('baltic-sea', 'sea', 3, 'Baltic Sea', 'Балтийское море'),
 ('north-sea', 'sea', 3, 'North Sea', 'Северное море'),
 ('barents-sea', 'sea', 3, 'Barents Sea', 'Баренцево море'),
]
items = []
for i, (id_, kind, unit, en, ru) in enumerate(ORDER, 1):
    it = {'id': id_, 'order': i, 'kind': kind, 'unit': unit, 'name': {'en': en, 'ru': ru}}
    if kind == 'river':
        line = proj(unary_union(rivers)).intersection(FRAME).simplify(0.1)
        lines = [l for l in getattr(line, 'geoms', [line])]
        it['path'] = [[[round(x, 2), round(y, 2)] for x, y in l.coords] for l in lines]
        mid = max(lines, key=lambda l: l.length).interpolate(0.5, normalized=True)
        it['label'] = {'x': round(mid.x, 2), 'y': round(mid.y, 2)}
    else:
        ps = polys(geo[id_])
        L = ps[0]
        if id_ in labelOff:
            L = L.difference(unary_union(polys(geo[labelOff[id_]])).buffer(1.5))
            L = max(getattr(L, 'geoms', [L]), key=lambda p: p.area)
        lab = polylabel(L, tolerance=0.05)
        it['label'] = {'x': round(lab.x, 2), 'y': round(lab.y, 2)}
        it['tapArea'] = [rnd(p.exterior.coords) for p in ps]
        holes = [rnd(h.coords) for p in ps for h in p.interiors if Polygon(h).area >= 0.3]
        if holes: it['holes'] = holes
        if id_ in soft: it['softArea'] = [rnd(p.exterior.coords) for p in polys(soft[id_])]
    items.append(it)

out = {
  'map': './assets/europe-blank.webp',
  'alsoValidFor': ['./assets/europe-capitals.webp', './assets/europe-countries-rivers.webp', './assets/europe-rivers.webp', './assets/europe-mountains.webp'],
  'mapAspect': '11 / 8',
  'level': 'Europe on the map (block 2, section 1)',
  'coordinateSystem': 'label, tapArea, softArea and path in % of image width/height from top-left; same for all four europe-*.webp (shared base)',
  'source': caps['source'] + '; tap areas from Natural Earth 1:10m marine and regions polygons and 1:50m land (simplified), the Ural River from 1:10m rivers; label = point farthest from the edge',
  'notes': [
    'Built by tools/build_europe_overview.py; projection fitted to the 24 capitals of europe-capitals.json.',
    'softArea: a tap there counts for this object but is never drawn and never answers another object (the Norwegian and Greenland Seas count for both oceans).',
    'apennine-peninsula: Natural Earth has no polygon; mainland Italy south of a La Spezia – Rimini line.',
    'The southern Europe–Asia border (Caucasus / Kuma–Manych) is not named in this section (Svetlana, 26.10.2026).'
  ],
  'items': items,
}
dst = ROOT / 'data/maps/europe-overview.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
