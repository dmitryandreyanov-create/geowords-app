#!/usr/bin/env python3
"""Builds data/maps/namerica-overview.json — tap areas and labels for block 4 section 1 «North America on the map» on
the North America base (assets/namerica-blank.webp, see tools/namerica_base.py).

Source: Natural Earth 1:10m marine polygons, regions polygons, land and lakes (https://github.com/nvkelso/natural-earth-vector,
geojson/). Ids carry the prefix «na-»: the same places (the Arctic Ocean, Greenland, the Bering Strait) are separate objects in
blocks 1 and 3.

usage: python3 tools/build_namerica_overview.py <natural-earth-dir>
"""
import json, math, sys
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union, polylabel
import shapely
import namerica_base as B

NE = sys.argv[1]
land = unary_union([g for _, g in B.load(NE, 'ne_10m_land')]).intersection(B.VIEW)
lakes = unary_union([g for p, g in B.load(NE, 'ne_10m_lakes') if p.get('scalerank', 9) <= 2]).intersection(B.VIEW)
land_full = land
land = land.difference(lakes)
marine = B.load(NE, 'ne_10m_geography_marine_polys')
regions = B.load(NE, 'ne_10m_geography_regions_polys', 'NAME')
def named(src, *names):
    return unary_union([g for p, g in src if (p.get('name') or p.get('NAME') or '') in names])
def sea(*names):
    return named(marine, *names).difference(land_full)
def landAt(lon, lat):
    return next(g for g in getattr(land, 'geoms', [land]) if g.contains(Point(lon, lat)))
na_land = land.intersection(B.na_region(land))
water = box(-180, 0, -5, 86).difference(land_full).difference(lakes.buffer(0.05))

def circle(lon, lat, r=1.6):
    """a round tap area of r % of the map width around a small place (a strait)."""
    x, y = B.pct(lon, lat)
    return Polygon([(x + r * math.cos(a), y + r * B.W / B.H * math.sin(a)) for a in [i * math.pi / 12 for i in range(24)]])

# Pacific side: west of a line that runs inland from the Bering Strait down the continent to the Panama–Colombia border
pacific_side = Polygon([(-180, 0), (-180, 65.8), (-168.6, 65.8), (-150, 64), (-125, 60), (-118, 50), (-110, 35), (-100, 25), (-92, 16), (-84, 11),
                        (-79, 9.3), (-77.5, 7.6), (-76, 0)])
hudson = sea( 'Hudson Bay', 'Hudson Strait', 'Foxe Basin', 'Ungava Bay').buffer(0.3)
pacific = water.intersection(pacific_side).intersection(box(-180, 0, -60, 65.8))
arctic = water.intersection(box(-180, 66.0, -12, 86)).difference(pacific_side).difference(hudson)
atlantic = water.intersection(box(-100, 0, -5, 66.0)).difference(pacific_side).difference(hudson)
# the Canadian Arctic Archipelago: every island north of the mainland between the Beaufort Sea and Greenland
mainland = landAt(-100, 55)
greenland = landAt(-40, 72)
archipelago = unary_union([g for g in getattr(na_land, 'geoms', [na_land])
                           if g.representative_point().y > 65.5 and -125 < g.representative_point().x < -60
                           and not g.intersects(mainland) and not g.intersects(greenland) and g.area > 0.02])
# Labrador: the mainland east of Hudson Bay and James Bay, north of the St Lawrence
labrador = mainland.intersection(Polygon([(-82, 64), (-79.0, 51.2), (-71.2, 46.85), (-70.0, 47.6), (-69.2, 48.3), (-68.0, 48.9), (-66.0, 49.6),
                                          (-64.0, 50.0), (-55, 50.5), (-55, 64)]))
geo = {
  'na-arctic-ocean': arctic,
  'na-pacific-ocean': pacific,
  'na-atlantic-ocean': atlantic,
  'na-isthmus-of-panama': na_land.intersection(box(-83.0, 6.5, -77.0, 10.0)).intersection(landAt(-80.0, 8.5)),
  'na-caribbean-sea': sea('Caribbean Sea', 'Gulf of Honduras'),
  'na-gulf-of-mexico': sea('Gulf of Mexico', 'Bahía de Campeche'),
  'na-alaska-peninsula': named(regions, 'ALASKA PENINSULA').buffer(0.3).intersection(land),
  'na-labrador': labrador,
  'na-boothia': named(regions, 'Boothia Peninsula').buffer(0.3).intersection(mainland),
  'na-florida': named(regions, 'FLORIDA').buffer(0.3).intersection(mainland),
  'na-baja-california': named(regions, 'BAJA CALIFORNIA').buffer(0.3).intersection(mainland),
  'na-yucatan': named(regions, 'PEN. DE YUCATÁN').buffer(0.3).intersection(mainland),
  'na-greenland': greenland,
  'na-arctic-archipelago': archipelago,
  'na-baffin': landAt(-70, 70),
  'na-newfoundland': landAt(-56, 48.5),
  'na-cuba': landAt(-79, 22),
  'na-hispaniola': landAt(-71, 19),
  'na-hudson-bay': sea('Hudson Bay', 'James Bay'),
  'na-gulf-of-california': sea('Golfo de California'),
}
POINT = {'na-bering-strait': (-168.8, 65.8), 'na-denmark-strait': (-27.0, 66.6)}
labelSkip = {'na-arctic-archipelago': landAt(-70, 70)}  # the label of the archipelago stays off Baffin Island
labelOff = {'na-atlantic-ocean': named(marine, 'Caribbean Sea', 'Gulf of Mexico', 'Gulf of Saint Lawrence', 'Labrador Sea'),
            'na-pacific-ocean': named(marine, 'Golfo de California', 'Gulf of Alaska', 'Bering Sea'),
            'na-arctic-ocean': named(marine, 'Baffin Bay')}

def polys(g):
    g = shapely.make_valid(B.proj(shapely.segmentize(g, 1.0), B.pct)).buffer(0).intersection(box(0, 0, 100, 100)).simplify(0.12, preserve_topology=True)
    out = sorted([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and p.area >= 0.02], key=lambda p: -p.area)
    return out[:1] + [p for p in out[1:] if p.area >= 0.15]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]

ORDER = [
 ('na-arctic-ocean', 'ocean', 1, 'Arctic Ocean', 'Северный Ледовитый океан'),
 ('na-pacific-ocean', 'ocean', 1, 'Pacific Ocean', 'Тихий океан'),
 ('na-atlantic-ocean', 'ocean', 1, 'Atlantic Ocean', 'Атлантический океан'),
 ('na-bering-strait', 'strait', 1, 'Bering Strait', 'Берингов пролив'),
 ('na-denmark-strait', 'strait', 1, 'Denmark Strait', 'Датский пролив'),
 ('na-isthmus-of-panama', 'isthmus', 1, 'Isthmus of Panama', 'Панамский перешеек'),
 ('na-caribbean-sea', 'sea', 1, 'Caribbean Sea', 'Карибское море'),
 ('na-gulf-of-mexico', 'sea', 1, 'Gulf of Mexico', 'Мексиканский залив'),
 ('na-alaska-peninsula', 'peninsula', 2, 'Alaska Peninsula', 'Полуостров Аляска'),
 ('na-labrador', 'peninsula', 2, 'Labrador Peninsula', 'Лабрадор'),
 ('na-boothia', 'peninsula', 2, 'Boothia Peninsula', 'Бутия'),
 ('na-florida', 'peninsula', 2, 'Florida', 'Флорида'),
 ('na-baja-california', 'peninsula', 2, 'Baja California', 'Полуостров Калифорния'),
 ('na-yucatan', 'peninsula', 2, 'Yucatán Peninsula', 'Юкатан'),
 ('na-greenland', 'island', 3, 'Greenland', 'Гренландия'),
 ('na-arctic-archipelago', 'island', 3, 'Canadian Arctic Archipelago', 'Канадский Арктический архипелаг'),
 ('na-baffin', 'island', 3, 'Baffin Island', 'Баффинова Земля'),
 ('na-newfoundland', 'island', 3, 'Newfoundland', 'Ньюфаундленд'),
 ('na-cuba', 'island', 3, 'Cuba', 'Куба'),
 ('na-hispaniola', 'island', 3, 'Hispaniola', 'Гаити (остров)'),
 ('na-hudson-bay', 'sea', 3, 'Hudson Bay', 'Гудзонов залив'),
 ('na-gulf-of-california', 'sea', 3, 'Gulf of California', 'Калифорнийский залив'),
]
items = []
for i, (id_, kind, unit, en, ru) in enumerate(ORDER, 1):
    it = {'id': id_, 'order': i, 'kind': kind, 'unit': unit, 'name': {'en': en, 'ru': ru}}
    if id_ in POINT:
        c = circle(*POINT[id_])
        x, y = B.pct(*POINT[id_])
        it['label'] = {'x': round(x, 2), 'y': round(y, 2)}
        it['tapArea'] = [rnd(c.exterior.coords)]
    else:
        ps = polys(geo[id_])
        if kind == 'ocean':
            cut = unary_union([circle(*POINT[k]) for k in POINT])
            ps = [q for p in ps for q in getattr(p.difference(cut), 'geoms', [p.difference(cut)]) if isinstance(q, Polygon) and q.area >= 0.02]
            ps.sort(key=lambda p: -p.area)
        L = ps[0]
        if id_ in labelSkip:
            L = max([p for p in ps if not p.intersects(polys(labelSkip[id_])[0].buffer(-0.3))], key=lambda p: p.area)
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
  'map': './assets/namerica-blank.webp',
  'alsoValidFor': [],
  'mapAspect': '11 / 8',
  'level': 'North America on the map (block 4, section 1)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for every namerica-*.webp (shared base, tools/namerica_base.py)',
  'source': 'Natural Earth 1:10m marine and regions polygons, land and lakes (simplified); label = point farthest from the edge; projection Lambert conformal conic 20N/60N, centre 96W (tools/namerica_base.py)',
  'notes': [
    'Built by tools/build_namerica_overview.py.',
    'Ids carry the prefix «na-»: the Arctic Ocean, Greenland, the Bering Strait and others are separate objects in blocks 1 and 3.',
    'The Bering Strait and the Denmark Strait are drawn too thin to tap: a round tap area around each, cut out of the oceans.',
    'The Atlantic includes the Gulf of Mexico and the Caribbean Sea (each also its own object); Hudson Bay with James Bay, Hudson Strait, Foxe Basin and Ungava Bay belong to no ocean here.',
    'The Canadian Arctic Archipelago includes Baffin Island (also its own object): a tap on Baffin Island is right for both.',
    'The Isthmus of Panama is the land of Panama west of the Panama–Colombia border.',
  ],
  'items': items,
}
dst = B.ROOT / 'data/maps/namerica-overview.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
