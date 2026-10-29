#!/usr/bin/env python3
"""Builds data/maps/asia-overview.json — tap areas and labels for block 3 section 1 «Asia on the map» on the Asia base
(assets/asia-blank.webp, see tools/asia_base.py).

Source: Natural Earth 1:10m marine polygons, regions polygons, land and lakes (https://github.com/nvkelso/natural-earth-vector,
geojson/). Ids carry the prefix «as-»: the same places (the Arctic Ocean, the Urals, the Bosporus) are separate objects in
blocks 1 and 2.

usage: python3 tools/build_asia_overview.py <natural-earth-dir>
"""
import json, math, sys
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union, polylabel
import shapely
import asia_base as B

NE = sys.argv[1]
land = unary_union([g for _, g in B.load(NE, 'ne_10m_land')]).intersection(B.VIEW)
lakes = unary_union([g for p, g in B.load(NE, 'ne_10m_lakes') if p.get('scalerank', 9) <= 2]).intersection(B.VIEW)
land = land.difference(lakes)
marine = B.load(NE, 'ne_10m_geography_marine_polys')
regions = B.load(NE, 'ne_10m_geography_regions_polys', 'NAME')
def named(src, *names, key='name'):
    return unary_union([g for p, g in src if (p.get(key) or p.get('NAME') or '') in names])
def landAt(lon, lat):
    return next(g for g in getattr(land, 'geoms', [land]) if g.contains(Point(lon, lat)))
water = box(20, -16, 200, 86).difference(land)

# Indian Ocean: south of Asia, west of the Malay Peninsula and Sumatra, south of the Sunda islands; with the Red Sea and the Persian Gulf
indian_box = Polygon([(20, -30), (20, 30.2), (34.6, 30.2), (40, 32), (98.5, 32), (98.5, 8), (100.3, 6.2), (103.4, 1.3), (105.8, -6.0),
                      (110, -7.6), (115.5, -8.8), (125, -10.0), (130, -12), (130, -30)])
indian = water.intersection(indian_box)
arctic = water.intersection(box(40, 66.0, 200, 86))
pacific = water.intersection(box(99, -16, 200, 66.0)).difference(indian_box)
# the open Pacific for the label: away from the marginal seas
seas = named(marine, 'Sea of Japan', 'Sea of Okhotsk', 'South China Sea', 'Philippine Sea', 'East China Sea', 'Yellow Sea', 'Bering Sea', 'Celebes Sea', 'Sulu Sea')

def circle(lon, lat, r=1.6):
    """a round tap area of r % of the map width around a small place (a strait, a canal)."""
    x, y = B.pct(lon, lat)
    return Polygon([(x + r * math.cos(a), y + r * B.W / B.H * math.sin(a)) for a in [i * math.pi / 12 for i in range(24)]])

asia_land = land.intersection(B.asia_region(NE))
geo = {
  'as-arctic-ocean': arctic,
  'as-pacific-ocean': pacific,
  'as-indian-ocean': indian,
  'as-ural-mountains': named(regions, 'URAL MOUNTAINS', key='NAME').buffer(0.2).intersection(land),
  'as-asia-minor': named(regions, 'ANATOLIA', key='NAME').buffer(0.4).intersection(asia_land).intersection(box(25, 35.8, 41.0, 42.2)),
  'as-arabian-peninsula': named(regions, 'ARABIAN PENINSULA', key='NAME').buffer(0.4).intersection(landAt(45, 23)),
  'as-hindustan': named(regions, 'INDIA', key='NAME').buffer(0.3).intersection(landAt(78, 20)),
  'as-indochina': named(regions, 'INDOCHINA PENINSULA', key='NAME').buffer(0.3).intersection(landAt(103, 15)).difference(named(regions, 'MALAY PENINSULA', key='NAME').buffer(0.3)),
  'as-malay-peninsula': named(regions, 'MALAY PENINSULA', key='NAME').buffer(0.3).intersection(landAt(102, 4)),
  'as-korean-peninsula': named(regions, 'KOREA', key='NAME').buffer(0.3).intersection(landAt(127.5, 37)),
  'as-kamchatka': named(regions, 'KAMCHATKA PENINSULA', key='NAME').buffer(0.3).intersection(landAt(159, 55)),
  # Natural Earth's TAYMYR PENINSULA covers only the Byrranga Mountains: the mainland north of the Yenisei Gulf – Khatanga Gulf line
  'as-taimyr': landAt(100, 74).intersection(Polygon([(80, 72.0), (87, 71.2), (106, 72.4), (114, 73.8), (114, 79), (80, 79)])),
  'as-japanese-islands': unary_union([landAt(138.5, 36.0), landAt(143.0, 43.5), landAt(131.0, 32.5), landAt(133.5, 33.7)]),
  'as-sakhalin': landAt(142.8, 50.5),
  'as-sri-lanka': landAt(80.7, 7.8),
  'as-borneo': landAt(114.0, 1.0),
  'as-sea-of-japan': named(marine, 'Sea of Japan'),
  'as-sea-of-okhotsk': named(marine, 'Sea of Okhotsk'),
  'as-south-china-sea': named(marine, 'South China Sea'),
  'as-persian-gulf': named(marine, 'Persian Gulf'),
}
POINT = {'as-bosporus': (29.05, 41.1), 'as-suez-canal': (32.35, 30.6), 'as-bering-strait': (190.6, 65.9)}
soft = {'as-south-china-sea': named(marine, 'Gulf of Thailand', 'Gulf of Tonkin')}
labelOff = {'as-pacific-ocean': seas, 'as-indian-ocean': named(marine, 'Persian Gulf', 'Red Sea', 'Gulf of Aden', 'Gulf of Oman')}

def polys(g):
    g = shapely.make_valid(B.proj(shapely.segmentize(g, 1.0), B.pct)).buffer(0).intersection(box(0, 0, 100, 100)).simplify(0.12, preserve_topology=True)
    out = sorted([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and p.area >= 0.02], key=lambda p: -p.area)
    return out[:1] + [p for p in out[1:] if p.area >= 0.15]
rnd = lambda c: [[round(x, 2), round(y, 2)] for x, y in list(c)[:-1]]

ORDER = [
 ('as-arctic-ocean', 'ocean', 1, 'Arctic Ocean', 'Северный Ледовитый океан'),
 ('as-pacific-ocean', 'ocean', 1, 'Pacific Ocean', 'Тихий океан'),
 ('as-indian-ocean', 'ocean', 1, 'Indian Ocean', 'Индийский океан'),
 ('as-ural-mountains', 'mountain', 1, 'Ural Mountains', 'Уральские горы'),
 ('as-bosporus', 'strait', 1, 'Bosporus', 'Босфор'),
 ('as-suez-canal', 'strait', 1, 'Suez Canal', 'Суэцкий канал'),
 ('as-bering-strait', 'strait', 1, 'Bering Strait', 'Берингов пролив'),
 ('as-asia-minor', 'peninsula', 2, 'Asia Minor', 'Малая Азия'),
 ('as-arabian-peninsula', 'peninsula', 2, 'Arabian Peninsula', 'Аравийский полуостров'),
 ('as-hindustan', 'peninsula', 2, 'Indian subcontinent', 'Индостан'),
 ('as-indochina', 'peninsula', 2, 'Indochina', 'Индокитай'),
 ('as-malay-peninsula', 'peninsula', 2, 'Malay Peninsula', 'Малаккский полуостров'),
 ('as-korean-peninsula', 'peninsula', 2, 'Korean Peninsula', 'Корейский полуостров'),
 ('as-kamchatka', 'peninsula', 2, 'Kamchatka', 'Камчатка'),
 ('as-taimyr', 'peninsula', 2, 'Taimyr Peninsula', 'Таймыр'),
 ('as-japanese-islands', 'island', 3, 'Japanese Islands', 'Японские острова'),
 ('as-sakhalin', 'island', 3, 'Sakhalin', 'Сахалин'),
 ('as-sri-lanka', 'island', 3, 'Sri Lanka', 'Шри-Ланка'),
 ('as-borneo', 'island', 3, 'Borneo', 'Калимантан'),
 ('as-sea-of-japan', 'sea', 3, 'Sea of Japan', 'Японское море'),
 ('as-sea-of-okhotsk', 'sea', 3, 'Sea of Okhotsk', 'Охотское море'),
 ('as-south-china-sea', 'sea', 3, 'South China Sea', 'Южно-Китайское море'),
 ('as-persian-gulf', 'sea', 3, 'Persian Gulf', 'Персидский залив'),
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
            # a strait is the border between oceans, not a part of one: its round tap area is cut out of the ocean
            cut = unary_union([circle(*POINT[k]) for k in POINT])
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
        if id_ in soft: it['softArea'] = [rnd(p.exterior.coords) for p in polys(soft[id_])]
    items.append(it)

out = {
  'map': './assets/asia-blank.webp',
  'alsoValidFor': [],
  'mapAspect': '11 / 8',
  'level': 'Asia on the map (block 3, section 1)',
  'coordinateSystem': 'label, tapArea and softArea in % of image width/height from top-left; same for every asia-*.webp (shared base, tools/asia_base.py)',
  'source': 'Natural Earth 1:10m marine and regions polygons, land and lakes (simplified); label = point farthest from the edge; projection Lambert conformal conic 20N/60N, centre 95E (tools/asia_base.py)',
  'notes': [
    'Built by tools/build_asia_overview.py.',
    'Ids carry the prefix «as-»: the Arctic Ocean, the Urals, the Bosporus and the Suez Canal are separate objects in blocks 1 and 2.',
    'The Bosporus, the Suez Canal and the Bering Strait are too narrow to tap: a round tap area around the strait.',
    'The Indian Ocean includes the Red Sea and the Persian Gulf (the gulf is also its own object); the seas of the Malay Archipelago count for the Pacific.',
    'softArea: a tap there counts for this object but is never drawn (the Gulf of Thailand and the Gulf of Tonkin for the South China Sea).',
  ],
  'items': items,
}
dst = B.ROOT / 'data/maps/asia-overview.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
