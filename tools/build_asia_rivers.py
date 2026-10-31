#!/usr/bin/env python3
"""Builds data/maps/asia-rivers.json and assets/asia-rivers.webp for block 3 section 2 «Rivers of Asia»: the river lines
drawn on the Asia base (assets/asia-blank.webp, tools/asia_base.py) in the colour and width of the Europe rivers map.

Source: Natural Earth 1:10m rivers and lake centerlines. Ids carry the prefix «as-»: the Yangtze, the Huang He, the
Ganges and the Indus are separate objects in block 1.

usage: python3 tools/build_asia_rivers.py <natural-earth-dir>
"""
import json, sys
from shapely.geometry import box
from shapely.ops import unary_union, linemerge
from shapely import affinity
from PIL import Image, ImageDraw
import asia_base as B

NE = sys.argv[1]
FRAME = box(0, 0, 100, 100)
COLOR, WIDTH, SS = (34, 124, 158), 4.2, 4  # the rivers of assets/europe-rivers.webp: colour, stroke width in px, supersampling

# id, unit, Natural Earth names, lon/lat window of the feature centroids, EN, RU
RIVERS = [
 ('as-ob', 1, ['Ob'], (60, 90, 50, 70), 'Ob', 'Обь'),
 ('as-irtysh', 1, ['Irtysh', 'Ertis', 'Ertix'], (60, 92, 44, 62), 'Irtysh', 'Иртыш'),
 ('as-yenisei', 1, ['Yenisey', 'Verkhniy Yenisey'], (84, 100, 50, 73), 'Yenisei', 'Енисей'),
 ('as-lena', 1, ['Lena'], (100, 135, 52, 74), 'Lena', 'Лена'),
 ('as-amur', 1, ['Amur', 'Heilong Jiang'], (118, 142, 45, 54), 'Amur', 'Амур'),
 ('as-kolyma', 1, ['Kolyma'], (140, 165, 60, 70), 'Kolyma', 'Колыма'),
 ('as-yangtze', 2, ['Yangtze', 'Chang Jiang', 'Jinsha', 'Tongtian'], (90, 123, 25, 36), 'Yangtze', 'Янцзы'),
 ('as-huang-he', 2, ['Huang'], (95, 120, 33, 42), 'Huang He', 'Хуанхэ'),
 ('as-mekong', 2, ['Mekong', 'Lancang'], (95, 108, 8, 34), 'Mekong', 'Меконг'),
 ('as-chao-phraya', 2, ['Chao Phraya', 'Ping'], (98, 102, 12, 20), 'Chao Phraya', 'Чаупхрая'),
 ('as-salween', 2, ['Salween', 'Nu'], (90, 101, 15, 33), 'Salween', 'Салуин'),
 ('as-irrawaddy', 2, ['Ayeyarwady', 'Irrawaddy Delta'], (93, 99, 15, 28), 'Irrawaddy', 'Иравади'),
 ('as-brahmaputra', 2, ['Brahmaputra', 'Yarlung', 'Dihang'], (82, 97, 22, 32), 'Brahmaputra', 'Брахмапутра'),
 ('as-ganges', 2, ['Ganges'], (77, 92, 21, 31), 'Ganges', 'Ганг'),
 ('as-indus', 2, ['Indus'], (66, 82, 23, 36), 'Indus', 'Инд'),
 ('as-godavari', 2, ['Godävari'], (73, 83, 16, 21), 'Godavari', 'Годавари'),
 ('as-tigris', 3, ['Tigris', 'Dicle'], (38, 49, 30, 39), 'Tigris', 'Тигр'),
 ('as-euphrates', 3, ['Euphrates', 'Firat', 'Shatt al Arab'], (37, 49, 29, 40), 'Euphrates', 'Евфрат'),
 ('as-jordan', 3, ['Jordan'], (35, 36.5, 31, 33.5), 'Jordan', 'Иордан'),
 ('as-amu-darya', 3, ['Amu  Darya', 'Panj'], (58, 75, 35, 45), 'Amu Darya', 'Амударья'),
 ('as-syr-darya', 3, ['Syr  Darya', 'Naryn'], (60, 77, 39, 47), 'Syr Darya', 'Сырдарья'),
 ('as-ili', 3, ['Ile'], (74, 84, 42, 47), 'Ili', 'Или'),
 ('as-tarim', 3, ['Tarim'], (78, 92, 38, 43), 'Tarim', 'Тарим'),
]
feats = B.load(NE, 'ne_10m_rivers_lake_centerlines')
def squash(g): return affinity.scale(g, 1, B.H / B.W, origin=(0, 0))
items = []
for i, (id_, unit, names, (a, b, c, d), en, ru) in enumerate(RIVERS, 1):
    gs = [g for p, g in feats if p.get('name') in names and a <= g.centroid.x <= b and c <= g.centroid.y <= d]
    assert gs, id_
    line = B.proj(unary_union(gs), B.pct).intersection(FRAME)
    if line.geom_type == 'MultiLineString': line = linemerge(line)
    line = line.simplify(0.06)
    # one line per river course: the small distributaries of the Ganges and Irrawaddy deltas would draw a tangle on a phone
    lines = sorted(getattr(line, 'geoms', [line]), key=lambda l: -l.length)
    lines = lines[:1] + [l for l in lines[1:] if l.length > 1.2]
    items.append({'_lines': lines, 'id': id_, 'order': i, 'kind': 'river', 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'path': [[[round(x, 2), round(y, 2)] for x, y in l.coords] for l in lines]})

# label: the point of the river's longest line (15–85% of its length) farthest from every other river, in screen proportions
for it in items:
    others = unary_union([squash(l) for o in items if o is not it for l in o['_lines']])
    longest = max(it['_lines'], key=lambda l: l.length)
    best = max((longest.interpolate(t / 100, normalized=True) for t in range(15, 86)), key=lambda q: others.distance(squash(q)))
    it['label'] = {'x': round(best.x, 2), 'y': round(best.y, 2)}

im = Image.open(B.ROOT / 'assets/asia-blank.webp').convert('RGB'); W, H = im.size
mask = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(mask)
for it in items:
    for l in it['path']:
        xy = [(x / 100 * W * SS, y / 100 * H * SS) for x, y in l]
        dr.line(xy, fill=255, width=round(WIDTH * SS), joint='curve')
        r = WIDTH * SS / 2
        for x, y in (xy[0], xy[-1]): dr.ellipse((x - r, y - r, x + r, y + r), fill=255)
mask = mask.resize((W, H), Image.LANCZOS)
im.paste(Image.new('RGB', (W, H), COLOR), (0, 0), mask)
im.save(B.ROOT / 'assets/asia-rivers.webp', 'WEBP', quality=90, method=6)

items = [{k: it[k] for k in ('id', 'order', 'kind', 'unit', 'name', 'label', 'path')} for it in items]
out = {
  'map': './assets/asia-rivers.webp',
  'mapAspect': '11 / 8',
  'level': 'Rivers of Asia (block 3, section 2)',
  'coordinateSystem': 'label and path in % of image width/height from top-left; same for every asia-*.webp (shared base, tools/asia_base.py)',
  'source': 'Natural Earth 1:10m rivers and lake centerlines, projected like asia-overview.json; label = the point of the longest line farthest from the other rivers',
  'notes': ['Built by tools/build_asia_rivers.py, which also draws the lines onto assets/asia-rivers.webp.',
            'The Yangtze, the Huang He, the Ganges and the Indus are learned in block 1 and reviewed here as separate «as-» objects.',
            'The Shatt al-Arab is drawn with the Euphrates: the Tigris and the Euphrates meet in it.'],
  'items': items,
}
dst = B.ROOT / 'data/maps/asia-rivers.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
