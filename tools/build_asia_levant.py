#!/usr/bin/env python3
"""Builds the large map of the Levant — assets/asia-levant.webp — and data/maps/asia-levant.json for block 3 section 8
«Countries and capitals: West Asia and Transcaucasia» (Svetlana, 02.11.2026: «Для стран Леванта нужна отдельная крупная карта или врезка»).

On the Asia countries map (assets/asia-countries.webp, 2200×1600) Damascus, Beirut, Jerusalem, Amman and Nicosia are 9–30 px apart
while a capital dot is 26 px wide: the dots cover each other and a tap on Damascus answers Beirut. This map is the same piece of the
same projection (tools/asia_base.py) drawn again at about ten times the scale, in the colours of assets/asia-blank.webp and
assets/asia-countries.webp, with capital dots far enough apart to tap. Because it is an exact crop, a point of this map is a point of
the countries map: x = frame.x + u * frame.w / 100, y = frame.y + v * frame.h / 100 (u, v in % of this map), so the tap areas and
capitals of data/maps/asia-countries-8.json are used as they are.

Drawn: sea (light near the coast), Asian land in sand colour, other land grey, the Dead Sea and the Sea of Galilee, dark brown
coastlines, the land borders (lines of control and unrecognised lines dashed, the Golan Heights hatched — as on the countries map),
the rivers of section 2 (data/maps/asia-rivers.json: the Jordan, the Euphrates) and the capital dots of section 8 in this frame
(Jerusalem and East Jerusalem: one dot).

usage: python3 tools/build_asia_levant.py <natural-earth-dir>
"""
import json, sys
import numpy as np
import shapely.ops
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, distance_transform_edt
from shapely.geometry import box, Polygon
from shapely.ops import unary_union
import asia_base as B

NE = sys.argv[1]
ROOT = B.ROOT
# the frame in % of the countries map: the same span in x and y keeps the 11:8 shape of the map box
FX, FY, SPAN = 16.6, 35.9, 6.6
OW = 1540; OH = round(OW * 8 / 11)
K = OW / (SPAN / 100 * B.W)                      # pixels of this map per pixel of the countries map (≈ 10.6)
SS = 2                                            # supersampling
TAN, GREY, SHALLOW, DEEP, COAST = (221, 181, 122), (129, 128, 133), (225, 234, 236), (129, 166, 178), (70, 58, 50)
BORDER, RIVER = (158, 120, 76), (34, 124, 158)
# widths in pixels of this map; it is shown about 390 px wide on a phone, so 4 px here ≈ 1 px on the screen
COAST_W, BORDER_W, RIVER_W, DOT_R = 9, 7, 10, 36

def to_px(lon, lat):
    x, y = B.px(lon, lat)
    return (x - FX / 100 * B.W) * K * SS, (y - FY / 100 * B.H) * K * SS
def pct_px(x, y):
    """% of the countries map → supersampled pixels of this map"""
    return (x - FX) / SPAN * OW * SS, (y - FY) / SPAN * OH * SS
def lonlat_box():
    """lon/lat box around the frame (generous)"""
    return box(24.0, 22.0, 50.0, 42.0)

VIEW = lonlat_box()
land = unary_union([g for _, g in B.load(NE, 'ne_10m_land') if g.intersects(VIEW)]).intersection(VIEW)
LAKES = ('Dead Sea', 'Sea of Galilee', 'Lake Tiberias', 'Lake Kinneret')
lakes = unary_union([g for p, g in B.load(NE, 'ne_10m_lakes') if g.intersects(VIEW) and (p.get('scalerank', 9) <= 2 or p.get('name') in LAKES)])
land = land.difference(lakes)
asia = land.intersection(B.asia_region(NE))
polys = lambda g: [p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon)]
ring = lambda c: [to_px(a, b) for a, b in c]
WS, HS = OW * SS, OH * SS
def mask(g):
    im = Image.new('L', (WS, HS), 0); d = ImageDraw.Draw(im)
    for p in polys(g):
        d.polygon(ring(p.exterior.coords), fill=255)
        for h in p.interiors: d.polygon(ring(h.coords), fill=0)
    return np.asarray(im) > 127

L, A = mask(land), mask(asia)
rng = np.random.default_rng(7)
def noise(sigma, amp):
    n = gaussian_filter(rng.standard_normal((HS, WS)), sigma)
    return n * amp / n.std()
# water: light at the coast, deeper away from it (the same 150 px of the countries map), soft blotches; land: grain as on the blank map
dist = distance_transform_edt(~L) / SS / K
t = np.clip(dist / 150 + noise(70 * SS * 3, 0.06), 0, 1); t = t * t * (3 - 2 * t)
img = np.array(SHALLOW)[None, None] * (1 - t[..., None]) + np.array(DEEP)[None, None] * t[..., None] + noise(6 * SS * 3, 3)[..., None]
grain = noise(1.6 * SS, 4)[..., None] + noise(25 * SS * 3, 5)[..., None]
img = np.where(L[..., None], np.array(GREY)[None, None] + grain, img)
img = np.where(A[..., None], np.array(TAN)[None, None] + grain * 1.3, img)
im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')

# ---- land borders (as tools/build_asia_countries.py draws them for section 8) ----
countries = {}
for props, g in B.load(NE, 'ne_10m_admin_0_countries', 'ADMIN'):
    if g.intersects(VIEW): countries.setdefault(props['ADMIN'], []).append(g)
CY = {'Cyprus', 'Northern Cyprus', 'Cyprus No Mans Area', 'Dhekelia Sovereign Base Area', 'Akrotiri Sovereign Base Area', 'Cyprus U.N. Buffer Zone'}
DASHED = ('Disputed (please verify)', 'Line of control (please verify)', 'Unrecognized')
dis = {p['BRK_NAME']: g for p, g in B.load(NE, 'ne_10m_admin_0_disputed_areas', 'BRK_NAME')}
lines = [(p, g, p.get('FEATURECLA') in DASHED) for p, g in B.load(NE, 'ne_10m_admin_0_boundary_lines_land') if g.intersects(VIEW)]
HATCH = unary_union([dis['Golan Heights'], dis['Shebaa Farms']])
lines.append(({}, dis['Golan Heights'].boundary, True))
bm = Image.new('L', (WS, HS), 0); bd = ImageDraw.Draw(bm)
def dashes(l, on, off):
    out, t = [], 0.0
    while t < l.length:
        seg = shapely.ops.substring(l, t, min(t + on, l.length))
        if seg.length > 0: out.append(seg)
        t += on + off
    return out
from shapely.geometry import LineString
for props, g, dashed in lines:
    if props.get('FEATURECLA') == 'Overlay limit' or ({props.get('ADM0_LEFT'), props.get('ADM0_RIGHT')} <= CY and not dashed): continue
    g = g.intersection(VIEW)
    for l in getattr(g, 'geoms', [g]):
        if l.geom_type != 'LineString': continue
        lp = LineString(ring(l.coords))
        for piece in (dashes(lp, 26 * SS, 18 * SS) if dashed else [lp]):
            bd.line(list(piece.coords), fill=255, width=round((BORDER_W * 0.8 if dashed else BORDER_W) * SS), joint='curve')
# hatching of the Golan Heights and the Shebaa Farms
hm = Image.new('L', (WS, HS), 0); hd = ImageDraw.Draw(hm)
for q in polys(HATCH): hd.polygon(ring(q.exterior.coords), fill=255)
st = Image.new('L', (WS, HS), 0); sd = ImageDraw.Draw(st)
for c in range(-HS, WS + HS, 13 * SS): sd.line([(c, HS), (c + HS, 0)], fill=255, width=round(3 * SS))
bd.bitmap((0, 0), Image.fromarray(np.minimum(np.asarray(hm), np.asarray(st))), fill=255)
bmask = (np.asarray(bm).astype(float) / 255) * L
arr = np.asarray(im).astype(float)
arr[..., :3] = arr[..., :3] * (1 - bmask[..., None]) + np.array(BORDER) * bmask[..., None]
im = Image.fromarray(arr.astype(np.uint8))

d = ImageDraw.Draw(im)
# ---- coastlines and lake shores ----
for p in polys(land):
    for c in [p.exterior.coords] + [h.coords for h in p.interiors]:
        d.line(ring(c), fill=COAST, width=COAST_W * SS, joint='curve')
# ---- rivers of section 2 in the frame (the same lines as the rivers map, so they meet the countries as there) ----
for rv in json.load(open(ROOT / 'data/maps/asia-rivers.json'))['items']:
    for seg in rv['path']:
        xy = [pct_px(x, y) for x, y in seg]
        if not any(-50 < x < WS + 50 and -50 < y < HS + 50 for x, y in xy): continue
        d.line(xy, fill=RIVER, width=RIVER_W * SS, joint='curve')
        r = RIVER_W * SS / 2
        for x, y in (xy[0], xy[-1]): d.ellipse((x - r, y - r, x + r, y + r), fill=RIVER)

# ---- capital dots: the dot of the countries map (red centre, cream and dark rings, sand halo), drawn large ----
sec8 = json.load(open(ROOT / 'data/maps/asia-countries-8.json'))
dots, seen = [], []
for it in sec8['items']:
    c = it['capital']
    if not (FX < c['x'] < FX + SPAN and FY < c['y'] < FY + SPAN): continue
    if any(abs(c['x'] - a) < 0.3 and abs(c['y'] - b) < 0.3 for a, b in seen): continue
    seen.append((c['x'], c['y'])); dots.append(c)
R = DOT_R * SS
for c in dots:
    x, y = pct_px(c['x'], c['y'])
    for rr, col in ((1.0, (229, 190, 137, 170)), (0.86, (63, 34, 15, 255)), (0.70, (255, 250, 234, 255)), (0.47, (122, 65, 52, 255)), (0.40, (150, 42, 35, 255))):
        d.ellipse((x - R * rr, y - R * rr, x + R * rr, y + R * rr), fill=col)
im = im.convert('RGB').resize((OW, OH), Image.LANCZOS)
im.save(ROOT / 'assets/asia-levant.webp', 'WEBP', quality=88, method=6)
print('wrote assets/asia-levant.webp', im.size, 'scale', round(K, 2), 'dots', [c['id'] for c in dots])

# the 🔍 badge sits in the middle of the frame; it lets taps through, and any tap inside the frame opens this map
out = {
  'map': './assets/asia-levant.webp',
  'of': './assets/asia-countries.webp',
  'level': 'The Levant, large: Asia section 8 (Svetlana, 02.11.2026)',
  'coordinateSystem': 'frame: the piece of asia-countries.webp this map shows, in % of that map (x, y = top left; w, h = size). A point (u, v) in % of this map is (x + u·w/100, y + v·h/100) there, so tap areas and capitals of asia-countries-8.json apply unchanged.',
  'source': 'Built by tools/build_asia_levant.py from Natural Earth 1:10m (land, lakes, admin 0 boundary lines, disputed areas) and data/maps/asia-rivers.json',
  'frame': {'x': FX, 'y': FY, 'w': SPAN, 'h': SPAN},
  'aspect': '11 / 8',
  'magnifier': {'x': round(FX + SPAN / 2, 2), 'y': round(FY + SPAN / 2, 2)},
  'objects': ['cty-cyprus', 'cty-syria', 'cty-lebanon', 'cty-israel', 'cty-palestine', 'cty-jordan'],
  'capitals': [c['id'] for c in dots],
}
(ROOT / 'data/maps/asia-levant.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print('wrote data/maps/asia-levant.json')
