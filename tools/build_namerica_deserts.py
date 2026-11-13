#!/usr/bin/env python3
"""Builds data/maps/namerica-deserts.json, assets/namerica-deserts.webp and the large map of the Colorado Plateau canyons
(assets/namerica-canyons.webp, data/maps/namerica-canyons.json) for block 4 section 5 «Deserts and Canyons of North America»
(Svetlana's brief of 13.11.2026: 6 deserts and dry regions, 6 canyons).

The deserts are shaded on the North America rivers map (assets/namerica-rivers.webp, shared base tools/namerica_base.py), so the
Colorado and the Rio Grande that cross them stay in sight, as in tools/build_asia_deserts.py. Four looks, so a child sees the
difference: hot deserts (Sonora, Mojave, Chihuahua) yellow with sand dots; the coastal Vizcaíno pale sand with blue-grey fog strokes; the cold Great Basin desert grey-lilac with
small frost crosses; the Okanagan Valley, a dry valley and not a desert of its own (Svetlana), pale olive with hatching.
Canyons are round marks (a dark red disc with a light V, a cut in the land) of MARK_R px, tapped within CANYON_TAP px.

Sources: Natural Earth 1:10m geography regions for the Sonoran and Chihuahuan deserts and the Great Basin (the hydrographic
basin, the usual outline of the Great Basin Desert on small maps); the Mojave, the Vizcaíno and the Okanagan Valley are not in
Natural Earth and are drawn from lon/lat outlines below (generalised from the usual ecoregion maps). Canyon points are lon/lat.
Touching deserts keep a GAP px seam; the shape later in PRIORITY gives way.

The four Colorado Plateau canyons (Grand, Antelope, de Chelly, Black Canyon of the Gunnison) lie 13–70 px apart, so they are also
drawn on a large map: an exact piece (FRAME) of this map at about K times the scale, as the large Levant map of Asia section 8
(tools/build_asia_levant.py): a point (u, v) in % of the large map is (x + u·w/100, y + v·h/100) on this one.

usage: python3 tools/build_namerica_deserts.py <natural-earth-dir>
"""
import json, sys, math
import numpy as np
import cv2
from scipy import ndimage as nd
from shapely.geometry import box, Point, Polygon
from shapely.ops import unary_union
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import namerica_base as B

NE = sys.argv[1]
FRAME = box(0, 0, B.W, B.H)
GAP, GROW, SS = 7, 9, 4
MARK_R, CANYON_TAP = 9, 13
LOOK = {  # fill, mark colour
  'hot': ((246, 214, 120), (196, 136, 52)),
  'cold': ((206, 196, 206), (112, 104, 132)),
  'valley': ((206, 204, 140), (128, 128, 70)),
  'coast': ((240, 222, 168), (120, 150, 172)),  # a coastal fog desert: pale sand with blue-grey fog strokes (Svetlana, 13.11.2026: «прибрежная», not «жаркая»)
}
MOJAVE = [(-118.45, 35.1), (-117.9, 35.75), (-117.55, 36.2), (-117.0, 36.85), (-116.2, 36.9), (-115.3, 36.75), (-114.6, 37.05),
          (-113.75, 37.15), (-113.95, 36.5), (-114.1, 35.95), (-113.85, 35.35), (-114.25, 34.75), (-114.55, 34.3), (-115.3, 33.95),
          (-115.9, 33.8), (-116.6, 34.0), (-117.4, 34.35), (-117.9, 34.5), (-118.3, 34.75)]
VIZCAINO = [(-115.3, 28.2), (-114.6, 28.75), (-113.85, 28.6), (-113.35, 28.1), (-112.95, 27.45), (-112.85, 26.9), (-113.25, 26.6),
            (-113.75, 26.75), (-114.4, 27.15), (-115.0, 27.7)]
OKANAGAN = [(-119.72, 48.75), (-119.3, 48.75), (-119.32, 49.3), (-119.25, 49.8), (-119.1, 50.2), (-119.05, 50.45), (-119.35, 50.45),
            (-119.55, 50.0), (-119.62, 49.4)]
# id, unit, kind, look, source (NE names or a lon/lat outline or a lon/lat point), EN, RU
OBJECTS = [
 ('na-sonoran', 1, 'desert', 'hot', ['SONORAN DESERT'], 'Sonoran Desert', 'Сонора'),
 ('na-mojave', 1, 'desert', 'hot', MOJAVE, 'Mojave Desert', 'Мохаве'),
 ('na-chihuahuan', 1, 'desert', 'hot', ['CHIHUAHUAN DESERT'], 'Chihuahuan Desert', 'Чиуауа'),
 ('na-great-basin', 1, 'desert', 'cold', ['GREAT BASIN'], 'Great Basin Desert', 'Большой Бассейн'),
 ('na-vizcaino', 1, 'desert', 'coast', VIZCAINO, 'Vizcaíno Desert', 'Вискаино'),
 ('na-okanagan', 1, 'valley', 'valley', OKANAGAN, 'Okanagan Valley', 'Долина Оканаган'),
 ('na-grand-canyon', 2, 'canyon', None, (-112.12, 36.1), 'Grand Canyon', 'Большой каньон'),
 ('na-antelope-canyon', 2, 'canyon', None, (-111.37, 36.86), 'Antelope Canyon', 'Каньон Антилопы'),
 ('na-black-canyon', 2, 'canyon', None, (-107.72, 38.57), 'Black Canyon of the Gunnison', 'Чёрный каньон Ганнисона'),
 ('na-canyon-de-chelly', 3, 'canyon', None, (-109.45, 36.13), 'Canyon de Chelly', 'Каньон-де-Шей'),
 ('na-copper-canyon', 3, 'canyon', None, (-107.83, 27.5), 'Copper Canyon', 'Медный каньон'),
 ('na-fraser-canyon', 3, 'canyon', None, (-121.43, 49.85), 'Fraser Canyon', 'Каньон Фрейзер'),
]
PRIORITY = ['na-okanagan', 'na-vizcaino', 'na-mojave', 'na-sonoran', 'na-chihuahuan', 'na-great-basin']
AREAS = [o for o in OBJECTS if o[2] != 'canyon']
polys = B.load(NE, 'ne_10m_geography_regions_polys', 'NAME')
land = unary_union([g for _, g in B.load(NE, 'ne_10m_land') if g.intersects(box(-130, 20, -100, 55))]).intersection(box(-130, 20, -100, 55))

shapes = {}
for id_, unit, kind, look, src, *_ in OBJECTS:
    if kind == 'canyon':
        shapes[id_] = Point(*B.px(*src)); continue
    if isinstance(src[0], str):
        gs = [g for p, g in polys if p.get('NAME') in src]
        assert len(gs) == len(src), id_
        g = unary_union([g.buffer(0.02) for g in gs]).intersection(land)
    else:
        g = Polygon(src).intersection(land)
    shapes[id_] = B.proj(g).intersection(FRAME)
done = []
for id_ in PRIORITY:
    g = shapes[id_]
    for other in done:
        if g.distance(shapes[other]) < GAP: g = g.difference(shapes[other].buffer(GAP))
    g = g.buffer(0)
    parts = [p for p in getattr(g, 'geoms', [g]) if p.area > 60]
    shapes[id_] = unary_union(parts)
    done.append(id_)

base = Image.open(B.ROOT / 'assets/namerica-rivers.webp').convert('RGB'); W, H = base.size
im = base.copy()
_a = np.array(im).astype(int)
LAND = Image.fromarray(((_a[..., 2] < _a[..., 0] + 8) * 255).astype(np.uint8))
def mask(geoms, blur, w=W, h=H, tf=lambda x, y: (x * SS, y * SS), land_=LAND):
    m = Image.new('L', (w * SS, h * SS), 0); d = ImageDraw.Draw(m)
    for g in geoms:
        for p in getattr(g, 'geoms', [g]):
            if p.geom_type != 'Polygon' or p.area < 4: continue
            d.polygon([tf(x, y) for x, y in p.exterior.coords], fill=255)
            for r in p.interiors: d.polygon([tf(x, y) for x, y in r.coords], fill=0)
    m = m.resize((w, h), Image.LANCZOS)
    return ImageChops.multiply(m.filter(ImageFilter.GaussianBlur(blur)) if blur else m, land_)

def paint(im, land_, tf, scale, w, h, rng):
    """deserts with their texture and rim; tf maps a map pixel to a supersampled pixel of `im`"""
    for look, (fill, markc) in LOOK.items():
        ids = [o[0] for o in AREAS if o[3] == look]
        mk = mask([shapes[i] for i in ids], 1.5 * scale, w, h, tf, land_)
        im.paste(Image.new('RGB', (w, h), fill), (0, 0), mk.point(lambda v: v * 0.95))
        tex = Image.new('L', (w * SS, h * SS), 0); dt = ImageDraw.Draw(tex)
        step = {'hot': 9, 'cold': 13, 'valley': 5, 'coast': 7}[look] * max(1, scale / 3)
        for i in ids:
            g = shapes[i]
            if look == 'valley':  # hatching
                gi = g.buffer(-0.5)
                x0, y0, x1, y1 = g.bounds
                for c in np.arange(x0 - (y1 - y0), x1, step / scale):
                    from shapely.geometry import LineString
                    seg = LineString([(c, y1), (c + (y1 - y0), y0)]).intersection(gi)
                    for s in getattr(seg, 'geoms', [seg]):
                        if s.geom_type == 'LineString' and s.length > 0:
                            dt.line([tf(x, y) for x, y in s.coords], fill=255, width=round(1.1 * SS * scale))
                continue
            gi = g.buffer(-3); x0, y0, x1, y1 = g.bounds
            st = step / scale
            for y in np.arange(y0, y1, st):
                for x in np.arange(x0 + (st / 2 if int(y / st) % 2 else 0), x1, st):
                    px_, py_ = x + rng.uniform(-st / 4, st / 4), y + rng.uniform(-st / 4, st / 4)
                    if not gi.contains(Point(px_, py_)): continue
                    X, Y = tf(px_, py_)
                    if X < 0 or Y < 0 or X >= w * SS or Y >= h * SS or not land_.getpixel((int(X / SS), int(Y / SS))): continue
                    if look == 'hot':
                        r = 1.3 * SS * scale; dt.ellipse([X - r, Y - r, X + r, Y + r], fill=255)
                    elif look == 'coast':  # a short wavy fog stroke
                        r = 3.2 * SS * scale; lw = round(1.2 * SS * scale)
                        dt.line([(X - r, Y), (X - r / 2, Y - r / 3), (X, Y), (X + r / 2, Y - r / 3), (X + r, Y)], fill=255, width=lw, joint='curve')
                    else:  # a small frost cross
                        r = 2.6 * SS * scale; lw = round(1.1 * SS * scale)
                        dt.line([(X - r, Y), (X + r, Y)], fill=255, width=lw); dt.line([(X, Y - r), (X, Y + r)], fill=255, width=lw)
        im.paste(Image.new('RGB', (w, h), markc), (0, 0), tex.resize((w, h), Image.LANCZOS).point(lambda v: v * 0.8))
    rim = Image.new('L', (w * SS, h * SS), 0); dr = ImageDraw.Draw(rim)
    for id_, *_ in AREAS:
        for p in getattr(shapes[id_], 'geoms', [shapes[id_]]):
            dr.line([tf(x, y) for x, y in p.exterior.coords], fill=255, width=round(1.6 * SS * scale), joint='curve')
    im.paste(Image.new('RGB', (w, h), (150, 110, 60)), (0, 0), ImageChops.multiply(rim.resize((w, h), Image.LANCZOS), land_).point(lambda v: v * 0.7))
    # canyon marks: a dark red disc, cream ring, light V
    cm = Image.new('RGBA', (w * SS, h * SS), (0, 0, 0, 0)); dc = ImageDraw.Draw(cm)
    for id_, unit, kind, *_ in OBJECTS:
        if kind != 'canyon': continue
        X, Y = tf(shapes[id_].x, shapes[id_].y); R = MARK_R * SS * scale
        dc.ellipse([X - R * 1.18, Y - R * 1.18, X + R * 1.18, Y + R * 1.18], fill=(255, 246, 226, 255))
        dc.ellipse([X - R, Y - R, X + R, Y + R], fill=(150, 52, 30, 255))
        dc.line([(X - R * 0.55, Y - R * 0.35), (X, Y + R * 0.5), (X + R * 0.55, Y - R * 0.35)], fill=(255, 226, 170, 255), width=round(R * 0.26), joint='curve')
    cm = cm.resize((w, h), Image.LANCZOS); im.paste(cm, (0, 0), cm)
    return im

im = paint(im, LAND, lambda x, y: (x * SS, y * SS), 1, W, H, np.random.default_rng(5))
im.save(B.ROOT / 'assets/namerica-deserts.webp', 'WEBP', quality=90, method=6)

owner = np.full((H, W), -1, int)
for i, (id_, *_) in enumerate(OBJECTS):
    if id_ not in [a[0] for a in AREAS]: continue
    m = np.array(mask([shapes[id_]], 0)) > 60
    owner[m & (owner < 0)] = i
_, (iy, ix) = nd.distance_transform_edt(owner < 0, return_indices=True)
grown = owner[iy, ix]
grown[~cv2.dilate((owner >= 0).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1))).astype(bool)] = -1
canyon_px = [(shapes[o[0]].x, shapes[o[0]].y) for o in OBJECTS if o[2] == 'canyon']
pc = lambda c: [[round(100 * x / W, 2), round(100 * y / H, 2)] for x, y in c]
items = []
for i, (id_, unit, kind, look, src, en, ru) in enumerate(OBJECTS):
    if kind == 'canyon':
        p = shapes[id_]; parts = [p.buffer(CANYON_TAP, 16)]; lab = p
    else:
        cs, _ = cv2.findContours((grown == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        parts = [Polygon(c[:, 0, :]).buffer(0).simplify(1.5) for c in cs if cv2.contourArea(c) > 150]
        o8 = (owner == i).astype(np.uint8)
        for a, b in canyon_px: cv2.circle(o8, (int(a), int(b)), CANYON_TAP + 6, 0, -1)
        dt = cv2.distanceTransform(o8, cv2.DIST_L2, 5)
        y, x = np.unravel_index(dt.argmax(), dt.shape); lab = Point(x, y)
    items.append({'id': id_, 'order': i + 1, 'kind': kind, 'unit': unit, 'name': {'en': en, 'ru': ru},
                  'label': {'x': round(100 * lab.x / W, 2), 'y': round(100 * lab.y / H, 2)},
                  'tapArea': [pc(p.exterior.coords) for p in parts], **({'look': look} if look else {})})
    print(id_, kind, len(parts), 'parts', items[-1]['label'])

# ---- the large map of the Colorado Plateau canyons ----
FX, FY, SPAN = 39.1, 60.9, 6.0
OW = 1540; OH = round(OW * 8 / 11); K = OW / (SPAN / 100 * W)
x0p, y0p = FX / 100 * W, FY / 100 * H
crop = base.crop((int(x0p) - 2, int(y0p) - 2, int(x0p + SPAN / 100 * W) + 3, int(y0p + SPAN / 100 * H) + 3))
big = crop.resize((round(crop.width * K), round(crop.height * K)), Image.BICUBIC).filter(ImageFilter.GaussianBlur(K / 3))
ox, oy = (x0p - (int(x0p) - 2)) * K, (y0p - (int(y0p) - 2)) * K
big = big.crop((round(ox), round(oy), round(ox) + OW, round(oy) + OH))
# the base is soft when enlarged: lay land/sea again from Natural Earth, and the rivers of section 2 as clean lines
lv_tf = lambda x, y: ((x - x0p) * K * SS, (y - y0p) * K * SS)
_b = np.array(big).astype(int)
LAND2 = Image.fromarray(((_b[..., 2] < _b[..., 0] + 8) * 255).astype(np.uint8))
TAN = (221, 181, 122)
big = Image.new('RGB', (OW, OH), TAN)
noise = np.random.default_rng(3).normal(0, 3, (OH, OW, 1))
big = Image.fromarray(np.clip(np.array(big).astype(float) + noise, 0, 255).astype(np.uint8))
LAND2 = Image.new('L', (OW, OH), 255)
d = ImageDraw.Draw(big)
# state / country lines for orientation
from shapely.geometry import shape
for f in json.load(open(f'{NE}/ne_10m_admin_1_states_provinces_lines.geojson'))['features']:
    p = f['properties']
    if not f['geometry'] or p.get('ADM0_A3') not in ('USA', 'MEX'): continue
    g = shape(f['geometry'])
    if not g.intersects(box(-116, 33, -104, 40.5)): continue
    for l in getattr(g, 'geoms', [g]):
        pts = [lv_tf(*B.px(a, b)) for a, b in l.coords]
        d.line([(x / SS, y / SS) for x, y in pts], fill=(176, 140, 96), width=4)
big = paint(big, LAND2, lv_tf, K / 3.2, OW, OH, np.random.default_rng(6))
d = ImageDraw.Draw(big)
# rivers from Natural Earth (finer than the section 2 lines at this scale): the Colorado, the Green, the San Juan, the Gunnison…
for f in json.load(open(f'{NE}/ne_10m_rivers_lake_centerlines.geojson'))['features']:
    if not f['geometry'] or f['properties'].get('featurecla') != 'River': continue
    g = shape(f['geometry'])
    if not g.intersects(box(-115, 34, -105, 40.5)): continue
    for l in getattr(g, 'geoms', [g]):
        xy = [lv_tf(*B.px(a, b)) for a, b in l.coords]
        d.line([(x / SS, y / SS) for x, y in xy], fill=(34, 124, 158), width=9, joint='curve')
# the Gunnison, not in Natural Earth 1:10m: drawn from lon/lat through the Black Canyon to Grand Junction
GUNNISON = [(-106.93, 38.54), (-107.2, 38.47), (-107.45, 38.5), (-107.72, 38.57), (-107.95, 38.68), (-108.07, 38.75), (-108.3, 38.9), (-108.56, 39.07)]
d.line([(x / SS, y / SS) for x, y in (lv_tf(*B.px(a, b)) for a, b in GUNNISON)], fill=(34, 124, 158), width=9, joint='curve')
# redraw canyon marks on top of the rivers
cm = Image.new('RGBA', (OW * SS, OH * SS), (0, 0, 0, 0)); dc = ImageDraw.Draw(cm)
INSET = ['na-grand-canyon', 'na-antelope-canyon', 'na-black-canyon', 'na-canyon-de-chelly']
for id_ in INSET:
    X, Y = lv_tf(shapes[id_].x, shapes[id_].y); R = 30 * SS
    dc.ellipse([X - R * 1.18, Y - R * 1.18, X + R * 1.18, Y + R * 1.18], fill=(255, 246, 226, 255))
    dc.ellipse([X - R, Y - R, X + R, Y + R], fill=(150, 52, 30, 255))
    dc.line([(X - R * 0.55, Y - R * 0.35), (X, Y + R * 0.5), (X + R * 0.55, Y - R * 0.35)], fill=(255, 226, 170, 255), width=round(R * 0.26), joint='curve')
cm = cm.resize((OW, OH), Image.LANCZOS); big.paste(cm, (0, 0), cm)
big.save(B.ROOT / 'assets/namerica-canyons.webp', 'WEBP', quality=88, method=6)
for id_ in INSET:
    assert FX < 100 * shapes[id_].x / W < FX + SPAN and FY < 100 * shapes[id_].y / H < FY + SPAN, id_

out = {
  'map': './assets/namerica-deserts.webp',
  'mapAspect': '11 / 8',
  'level': 'Deserts and Canyons of North America (block 4, section 5)',
  'coordinateSystem': 'label and tapArea in % of image width/height from top-left; same for every namerica-*.webp (shared base, tools/namerica_base.py)',
  'source': 'Natural Earth 1:10m geography regions (Sonoran, Chihuahuan, Great Basin); Mojave, Vizcaíno and Okanagan outlines and canyon points from tools/build_namerica_deserts.py',
  'notes': ['Built by tools/build_namerica_deserts.py, which also draws assets/namerica-deserts.webp on assets/namerica-rivers.webp.',
            'Looks: hot deserts yellow with sand dots, the coastal Vizcaíno pale sand with fog strokes, the cold Great Basin desert grey-lilac with frost crosses, the Okanagan Valley (a dry valley, not a desert of its own) olive with hatching.',
            'Canyons are marks of %d px, tapped within %d px. Grand, Antelope, de Chelly and the Black Canyon of the Gunnison are also on the large map data/maps/namerica-canyons.json.' % (MARK_R, CANYON_TAP)],
  'items': items,
}
dst = B.ROOT / 'data/maps/namerica-deserts.json'
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')
lv = {
  'map': './assets/namerica-canyons.webp',
  'of': './assets/namerica-deserts.webp',
  'level': 'The Colorado Plateau canyons, large: North America section 5',
  'coordinateSystem': 'frame: the piece of namerica-deserts.webp this map shows, in % of that map (x, y = top left; w, h = size). A point (u, v) in % of this map is (x + u·w/100, y + v·h/100) there, so the tap areas of namerica-deserts.json apply unchanged.',
  'source': 'Built by tools/build_namerica_deserts.py',
  'frame': {'x': FX, 'y': FY, 'w': SPAN, 'h': SPAN},
  'aspect': '11 / 8',
  'magnifier': {'x': round(FX + SPAN / 2, 2), 'y': round(FY + SPAN / 2, 2)},
  'objects': INSET,
}
(B.ROOT / 'data/maps/namerica-canyons.json').write_text(json.dumps(lv, ensure_ascii=False, indent=1) + '\n')
print('wrote', dst, len(items), 'items; large map scale', round(K, 2))
