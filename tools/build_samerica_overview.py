#!/usr/bin/env python3
"""Builds data/maps/samerica-overview.json — tap areas and labels for block 5 section 1 «South America on the map» on
the South America base (assets/samerica-blank.webp, see tools/samerica_base.py).

Source: Natural Earth 1:10m marine polygons, land and lakes (https://github.com/nvkelso/natural-earth-vector, geojson/).
Ids carry the prefix «sa-»: the Pacific, the Drake Passage, the Strait of Magellan and others are separate objects in
blocks 1 and 4.

usage: python3 tools/build_samerica_overview.py <natural-earth-dir>
"""
import json, math, sys
from shapely.geometry import Polygon, Point, LineString, box
from shapely.ops import unary_union, polylabel
import shapely
import samerica_base as B

NE = sys.argv[1]
land = unary_union([g for _, g in B.load(NE, 'ne_10m_land')]).intersection(B.VIEW)
lakes = unary_union([g for p, g in B.load(NE, 'ne_10m_lakes') if p.get('scalerank', 9) <= 2]).intersection(B.VIEW)
land_full = land
land = land.difference(lakes)
marine = B.load(NE, 'ne_10m_geography_marine_polys')
def named(src, *names):
    return unary_union([g for p, g in src if (p.get('name') or '') in names])
def sea(*names):
    return named(marine, *names).difference(land_full)
def landAt(lon, lat):
    return next(g for g in getattr(land, 'geoms', [land]) if g.contains(Point(lon, lat)))
water = B.VIEW.difference(land_full).difference(lakes.buffer(0.05))

def circle(lon, lat, r=1.6):
    """a round tap area of r % of the map width around a small place (a cape, a strait)."""
    x, y = B.pct(lon, lat)
    return Polygon([(x + r * math.cos(a), y + r * B.W / B.H * math.sin(a)) for a in [i * math.pi / 12 for i in range(24)]])

# Pacific side: west of a line down the Andes from the Panama–Colombia border to Cape Horn, and the Drake Passage east of it
pacific_side = Polygon([(-125, 32), (-84, 32), (-83, 10.5), (-79, 9.3), (-77.5, 7.6), (-75, 0), (-70, -20), (-69, -40),
                        (-67.27, -55.98), (-67.27, -70), (-125, -70)])
caribbean = sea('Caribbean Sea', 'Golfo de Urabá', 'Golfo de Venezuela')
pacific = water.difference(pacific_side.buffer(0).symmetric_difference(pacific_side)).intersection(pacific_side).intersection(box(-125, -60, -60, 32))
atlantic = water.difference(pacific_side).intersection(box(-100, -60, 5, 32))  # the Caribbean is part of the Atlantic, as in North America
# Tierra del Fuego: Isla Grande and the islands south of the Strait of Magellan down to Cape Horn
tdf = unary_union([g for g in getattr(land, 'geoms', [land]) if g.intersects(box(-75, -56.1, -63.5, -52.6))
                   and g.representative_point().y < -52.6 and g.area > 0.002])
galapagos = land.intersection(box(-92.5, -1.6, -89.0, 0.8))
falklands = land.intersection(box(-61.6, -52.6, -57.6, -51.0))
panama = land.intersection(box(-83.0, 6.5, -77.0, 10.0)).intersection(landAt(-80.0, 8.5)).difference(B.sa_region(land))

geo = {
  'sa-pacific-ocean': pacific,
  'sa-atlantic-ocean': atlantic,
  'sa-caribbean-sea': caribbean,
  'sa-isthmus-of-panama': panama,
  'sa-tierra-del-fuego': tdf,
  'sa-galapagos': galapagos,
  'sa-falklands': falklands,
}
POINT = {'sa-cape-gallinas': (-71.67, 12.46), 'sa-cabo-branco': (-34.79, -7.15), 'sa-punta-parinas': (-81.33, -4.68),
         'sa-cape-froward': (-71.30, -53.90), 'sa-cape-horn': (-67.27, -55.98),
         'sa-strait-of-magellan': (-70.9, -53.2), 'sa-drake-passage': (-65.0, -58.0)}
RADIUS = {'sa-drake-passage': 3.2, 'sa-strait-of-magellan': 1.4, 'sa-cape-froward': 1.1, 'sa-cape-horn': 1.3}
# lines across the map: a band of 1.6 % of the map height along the line; the label sits on the line over the land (a letter there is in no ocean)
LINE = {'sa-equator': (0.0, -60.0), 'sa-tropic-of-capricorn': (-23.44, -57.0)}
labelOff = {'sa-atlantic-ocean': caribbean, 'sa-pacific-ocean': box(-125, -60, -100, 32)}

def polys(g):
    g = shapely.make_valid(B.proj(shapely.segmentize(g, 0.5), B.pct)).buffer(0).intersection(box(0, 0, 100, 100)).simplify(0.08, preserve_topology=True)
    out = sorted([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and p.area >= 0.005], key=lambda p: -p.area)
    return out[:1] + [p for p in out[1:] if p.area >= 0.02]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]

ORDER = [
 ('sa-pacific-ocean', 'ocean', 1, 'Pacific Ocean', 'Тихий океан'),
 ('sa-atlantic-ocean', 'ocean', 1, 'Atlantic Ocean', 'Атлантический океан'),
 ('sa-caribbean-sea', 'sea', 1, 'Caribbean Sea', 'Карибское море'),
 ('sa-isthmus-of-panama', 'isthmus', 1, 'Isthmus of Panama', 'Панамский перешеек'),
 ('sa-cape-gallinas', 'cape', 1, 'Punta Gallinas', 'Мыс Гальинас'),
 ('sa-cabo-branco', 'cape', 1, 'Ponta do Seixas (Cabo Branco)', 'Понта-ду-Сейшас (Кабу-Бранку)'),
 ('sa-punta-parinas', 'cape', 1, 'Punta Pariñas', 'Мыс Париньяс'),
 ('sa-cape-froward', 'cape', 1, 'Cape Froward', 'Мыс Фроуэрд'),
 ('sa-equator', 'line', 2, 'Equator', 'Экватор'),
 ('sa-tropic-of-capricorn', 'line', 2, 'Tropic of Capricorn', 'Тропик Козерога'),
 ('sa-galapagos', 'island', 2, 'Galápagos Islands', 'Галапагосские острова'),
 ('sa-falklands', 'island', 2, 'Falkland Islands (Malvinas)', 'Фолклендские (Мальвинские) острова'),
 ('sa-tierra-del-fuego', 'island', 3, 'Tierra del Fuego', 'Огненная Земля'),
 ('sa-strait-of-magellan', 'strait', 3, 'Strait of Magellan', 'Магелланов пролив'),
 ('sa-drake-passage', 'strait', 3, 'Drake Passage', 'Пролив Дрейка'),
 ('sa-cape-horn', 'cape', 3, 'Cape Horn', 'Мыс Горн'),
]
cut = unary_union([circle(*POINT[k], RADIUS.get(k, 1.6)) for k in POINT])
items = []
for i, (id_, kind, unit, en, ru) in enumerate(ORDER, 1):
    it = {'id': id_, 'order': i, 'kind': kind, 'unit': unit, 'name': {'en': en, 'ru': ru}}
    if id_ in POINT:
        c = circle(*POINT[id_], RADIUS.get(id_, 1.6))
        x, y = B.pct(*POINT[id_])
        it['label'] = {'x': round(x, 2), 'y': round(y, 2)}
        it['tapArea'] = [rnd(c.exterior.coords)]
    elif id_ in LINE:
        lat, lablon = LINE[id_]
        pts = [B.pct(lon / 2, lat) for lon in range(-250, 11)]
        band = LineString(pts).buffer(0.8 * B.W / B.H, cap_style='flat').intersection(box(0, 0, 100, 100))
        it['path'] = [rnd(pts + [pts[-1]])]
        x, y = B.pct(lablon, lat)
        it['label'] = {'x': round(x, 2), 'y': round(y, 2)}
        it['tapArea'] = [rnd(p.exterior.coords) for p in getattr(band, 'geoms', [band])]
    else:
        ps = polys(geo[id_])
        if kind in ('ocean', 'sea'):
            ps = [q for p in ps for q in getattr(p.difference(cut), 'geoms', [p.difference(cut)]) if isinstance(q, Polygon) and q.area >= 0.02]
            ps.sort(key=lambda p: -p.area)
        L = ps[0]
        if id_ in labelOff:
            L = L.difference(unary_union(polys(labelOff[id_])).buffer(2.0))
            L = max(getattr(L, 'geoms', [L]), key=lambda p: p.area)
        lab = polylabel(L, tolerance=0.05)
        it['label'] = {'x': round(lab.x, 2), 'y': round(lab.y, 2)}
        it['tapArea'] = [rnd(p.exterior.coords) for p in ps]
        holes = [rnd(h.coords) for p in ps for h in p.interiors if Polygon(h).area >= 0.15]
        if holes: it['holes'] = holes
    items.append(it)

out = {
  'map': './assets/samerica-blank.webp',
  'alsoValidFor': [],
  'mapAspect': '11 / 8',
  'level': 'South America on the map (block 5, section 1)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for every samerica-*.webp (shared base, tools/samerica_base.py)',
  'source': 'Natural Earth 1:10m marine polygons, land and lakes (simplified); label = point farthest from the edge; projection Lambert azimuthal equal-area, centre 62W 18S (tools/samerica_base.py)',
  'notes': [
    'Built by tools/build_samerica_overview.py.',
    'Ids carry the prefix «sa-»: the Pacific, the Drake Passage, the Strait of Magellan and others are separate objects in blocks 1 and 4.',
    'Capes and the two straits are too small or thin to tap: a round tap area around each, cut out of the oceans.',
    'The equator and the Tropic of Capricorn are lines: `path` draws the line, the tap area is a narrow band along it.',
    'The Atlantic includes the Caribbean Sea (also its own object). The Pacific and the Atlantic meet at Cape Horn.',
    'The Isthmus of Panama is the land of Panama (grey, North America): the link between the two continents.',
    'Tierra del Fuego is Isla Grande with the islands south of the Strait of Magellan down to Cape Horn; the Chile–Argentina border on it is a real land border.',
    'The Falkland Islands (Malvinas) are administered by the United Kingdom and claimed by Argentina: no country colour, a neutral note.',
  ],
  'items': items,
}
dst = B.ROOT / 'data/maps/samerica-overview.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
