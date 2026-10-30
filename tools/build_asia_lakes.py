#!/usr/bin/env python3
"""Builds data/maps/asia-lakes.json and assets/asia-lakes.webp for block 3 section 3 «Lakes of Asia»: the 13 lakes filled in
lake blue with a dark shore on the Asia base (assets/asia-blank.webp, tools/asia_base.py).

Source: Natural Earth 1:10m lakes (the Caspian from the 1:10m marine polygons). The Dead Sea is about 1 px on a phone, so it is
drawn and tapped as a round blob of DEAD_R px around the lake; the app magnifies it in a zoom inset (Svetlana, 30.10.2026).

usage: python3 tools/build_asia_lakes.py <natural-earth-dir>
"""
import json, sys
from shapely.geometry import box, Point
from shapely.ops import unary_union
from PIL import Image, ImageDraw
import asia_base as B

NE = sys.argv[1]
FRAME = box(0, 0, B.W, B.H)
FILL, SHORE, SS = (96, 160, 192), (70, 58, 50), 4  # lake blue, the coast colour of asia-blank.webp, supersampling
DEAD_R = 7  # px on the 2200×1600 map

# id, unit, Natural Earth names (lakes; marine for the Caspian), EN, RU
LAKES = [
 ('as-baikal', 1, ['Lake Baikal'], 'Lake Baikal', 'Байкал'),
 ('as-khovsgol', 1, ['Khövsgöl Nuur'], 'Lake Khövsgöl', 'Хубсугул'),
 ('as-taymyr', 1, ['Lake Taymyr'], 'Lake Taymyr', 'Таймыр'),
 ('as-khanka', 1, ['Lake Khanka'], 'Lake Khanka', 'Ханка'),
 ('as-qinghai', 1, ['Qinghai Hu'], 'Qinghai Lake', 'Кукунор'),
 ('as-caspian', 2, ['Caspian Sea'], 'Caspian Sea', 'Каспийское море'),
 ('as-aral', 2, ['North Aral Sea', 'South Aral Sea'], 'Aral Sea', 'Аральское море'),
 ('as-balkhash', 2, ['Lake Balkhash'], 'Lake Balkhash', 'Балхаш'),
 ('as-issyk-kul', 2, ['Issyk-Kul'], 'Issyk-Kul', 'Иссык-Куль'),
 ('as-dead-sea', 3, ['Dead Sea'], 'Dead Sea', 'Мёртвое море'),
 ('as-urmia', 3, ['Lake Urmia'], 'Lake Urmia', 'Урмия'),
 ('as-van', 3, ['Lake Van'], 'Lake Van', 'Ван'),
 ('as-tonle-sap', 3, ['Tonlé Sap'], 'Tonlé Sap', 'Тонлесап'),
]
lakes = B.load(NE, 'ne_10m_lakes')
marine = B.load(NE, 'ne_10m_geography_marine_polys')
items = []
for i, (id_, unit, names, en, ru) in enumerate(LAKES, 1):
    src = marine if id_ == 'as-caspian' else lakes
    gs = [g for p, g in src if p.get('name') in names]
    assert gs, id_
    g = B.proj(unary_union(gs)).intersection(FRAME)
    if id_ == 'as-dead-sea': g = Point(g.centroid.x, g.centroid.y).buffer(DEAD_R, 24)
    g = g.simplify(0.8)
    lab = g.representative_point() if id_ in ('as-aral', 'as-balkhash') else g.centroid
    if not g.contains(lab): lab = g.representative_point()
    polys = [p for p in getattr(g, 'geoms', [g]) if p.area > 2]
    pc = lambda c: [[round(100 * x / B.W, 2), round(100 * y / B.H, 2)] for x, y in c]
    items.append({'_g': polys, 'id': id_, 'order': i, 'kind': 'lake', 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(100 * lab.x / B.W, 2), 'y': round(100 * lab.y / B.H, 2)},
                  'tapArea': [pc(p.exterior.coords) for p in polys], **({'zoomInset': True} if id_ == 'as-dead-sea' else {})})

im = Image.open(B.ROOT / 'assets/asia-blank.webp').convert('RGB'); W, H = im.size
fill, shore = Image.new('L', (W * SS, H * SS), 0), Image.new('L', (W * SS, H * SS), 0)
df, ds = ImageDraw.Draw(fill), ImageDraw.Draw(shore)
for it in items:
    for p in it['_g']:
        xy = [(x * SS, y * SS) for x, y in p.exterior.coords]
        df.polygon(xy, fill=255); ds.line(xy, fill=255, width=round(2.2 * SS), joint='curve')
fill, shore = fill.resize((W, H), Image.LANCZOS), shore.resize((W, H), Image.LANCZOS)
im.paste(Image.new('RGB', (W, H), FILL), (0, 0), fill)
im.paste(Image.new('RGB', (W, H), SHORE), (0, 0), shore)
im.save(B.ROOT / 'assets/asia-lakes.webp', 'WEBP', quality=90, method=6)

items = [{k: it[k] for k in ('id', 'order', 'kind', 'unit', 'name', 'label', 'tapArea', 'zoomInset') if k in it} for it in items]
out = {
  'map': './assets/asia-lakes.webp',
  'mapAspect': '11 / 8',
  'level': 'Lakes of Asia (block 3, section 3)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for every asia-*.webp (shared base, tools/asia_base.py)',
  'source': 'Natural Earth 1:10m lakes (the Caspian: 1:10m marine polygons), projected like asia-overview.json',
  'notes': ['Built by tools/build_asia_lakes.py, which also fills the lakes on assets/asia-lakes.webp.',
            'The Aral Sea is one object of two parts (the North and the South Aral Sea).',
            'The Dead Sea is drawn and tapped as a round blob of %d px around the lake; the app shows it in a zoom inset.' % DEAD_R],
  'items': items,
}
dst = B.ROOT / 'data/maps/asia-lakes.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
print('wrote', dst, len(items), 'items')
