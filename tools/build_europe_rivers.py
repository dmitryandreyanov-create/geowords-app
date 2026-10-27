#!/usr/bin/env python3
"""Builds data/maps/europe-rivers.json — the river lines of block 2 section 2 «Rivers of Europe» on the shared
Europe base (assets/europe-rivers.webp draws them). Same projection as tools/build_europe_overview.py.

Source: Natural Earth 1:10m rivers and lake centerlines (ne_10m_rivers_lake_centerlines.geojson). Every line was
checked against the drawn rivers of europe-rivers.webp (all 17 lie on the drawing; the Dniester is not drawn and is left out).

usage: python3 tools/build_europe_rivers.py <natural-earth-dir>
"""
import json, sys, pathlib
from shapely.geometry import shape
from shapely.ops import unary_union, linemerge

ROOT = pathlib.Path(__file__).resolve().parent.parent
NE = pathlib.Path(sys.argv[1])
# the projection helpers of the overview builder (everything above its map frame)
src = (ROOT / 'tools/build_europe_overview.py').read_text().split('FRAME = box')[0]
ns = {'__file__': str(ROOT / 'tools/build_europe_overview.py')}
sys.argv = [sys.argv[0], str(NE)]
exec(src, ns)
proj, box = ns['proj'], ns['box']
FRAME = box(0, 0, 100, 100)

# id, unit, Natural Earth names, lon/lat window of the feature centroids, EN, RU
RIVERS = [
 ('volga', 1, ['Volga'], (30, 50, 45, 58.5), 'Volga', 'Волга'),
 ('don', 1, ['Don'], (36, 45, 46, 54.5), 'Don', 'Дон'),
 ('dnieper', 1, ['Dnipro'], (29, 36, 46, 56), 'Dnieper', 'Днепр'),
 ('danube', 1, ['Danube', 'Donau'], (8, 30, 42, 49.5), 'Danube', 'Дунай'),
 ('rhine', 2, ['Rhein', 'Rhin', 'Rhine'], (3, 11, 46, 52.5), 'Rhine', 'Рейн'),
 ('elbe', 2, ['Elbe'], (8, 16, 49, 54.5), 'Elbe', 'Эльба'),
 ('oder', 2, ['Oder'], (13, 19, 49, 54.5), 'Oder', 'Одер'),
 ('vistula', 2, ['Vistula'], (16, 24, 49, 55), 'Vistula', 'Висла'),
 ('thames', 3, ['Thames'], (-2.5, 1, 51, 52.5), 'Thames', 'Темза'),
 ('seine', 3, ['Seine'], (0, 5, 47, 50), 'Seine', 'Сена'),
 ('loire', 3, ['Loire'], (-3, 5, 44, 48.5), 'Loire', 'Луара'),
 ('rhone', 3, ['Rhône'], (3, 9, 43, 47), 'Rhône', 'Рона'),
 ('po', 4, ['Po'], (6, 13, 44, 46), 'Po', 'По'),
 ('tagus', 4, ['Tajo', 'Tejo'], (-10, -1, 38, 41), 'Tagus', 'Тахо'),
 ('douro', 4, ['Duero'], (-9, -2, 40, 42.5), 'Douro', 'Дуэро'),
 ('ebro', 4, ['Ebro'], (-5, 1.5, 40, 43.5), 'Ebro', 'Эбро'),
 ('guadalquivir', 4, ['Guadalquivir'], (-7, -2, 36, 38.5), 'Guadalquivir', 'Гвадалквивир'),
]
feats = json.load(open(NE / 'ne_10m_rivers_lake_centerlines.geojson'))['features']
items = []
for i, (id_, unit, names, (a, b, c, d), en, ru) in enumerate(RIVERS, 1):
    gs = [shape(f['geometry']) for f in feats if f['properties'].get('name') in names]
    gs = [g for g in gs if not g.is_empty and a <= g.centroid.x <= b and c <= g.centroid.y <= d]
    line = proj(unary_union(gs)).intersection(FRAME)
    if line.geom_type == 'MultiLineString': line = linemerge(line)
    line = line.simplify(0.08)
    lines = [l for l in getattr(line, 'geoms', [line]) if l.length > 0.2]
    mid = max(lines, key=lambda l: l.length).interpolate(0.5, normalized=True)
    items.append({'id': id_, 'order': i, 'kind': 'river', 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(mid.x, 2), 'y': round(mid.y, 2)},
                  'path': [[[round(x, 2), round(y, 2)] for x, y in l.coords] for l in lines]})

out = {
  'map': './assets/europe-rivers.webp',
  'mapAspect': '11 / 8',
  'level': 'Rivers of Europe (block 2, section 2)',
  'coordinateSystem': 'label and path in % of image width/height from top-left; same for all four europe-*.webp (shared base)',
  'source': 'Natural Earth 1:10m rivers and lake centerlines, projected like europe-overview.json; label = middle of the longest line',
  'notes': ['Built by tools/build_europe_rivers.py.', 'The Ural River is learned in section 1 (europe-overview.json) and only reviewed here.',
            'The Dniester is not drawn on europe-rivers.webp and is not part of the section.'],
  'items': items,
}
dst = ROOT / 'data/maps/europe-rivers.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
