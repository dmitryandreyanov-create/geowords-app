#!/usr/bin/env python3
"""Adds capital dots to assets/europe-capitals.webp by copying the drawn Madrid dot, and records them in data/maps/europe-capitals.json
(marked "added", so they are not used to fit the projection). The position comes from the projection fitted to the drawn capitals,
the same fit as tools/build_europe_countries.py. Block 2 section 5 (Svetlana, 28.10.2026): Tallinn, Riga, Vilnius.

usage: python3 tools/add_capital_dots.py id:Name:lon:lat [...]
"""
import json, math, sys, pathlib
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
CAPS = ROOT / 'data/maps/europe-capitals.json'
IMG = ROOT / 'assets/europe-capitals.webp'
caps = json.load(open(CAPS))
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

im = Image.open(IMG).convert('RGBA'); W, H = im.size
mad = next(c for c in drawn if c['id'] == 'madrid')
R = 13  # the drawn dot (ring and red centre) is about 21 px across
mx, my = round(mad['x'] / 100 * W), round(mad['y'] / 100 * H)
patch = im.crop((mx - R, my - R, mx + R, my + R))
mask = Image.new('L', patch.size, 0); ImageDraw.Draw(mask).ellipse((1, 1, 2 * R - 1, 2 * R - 1), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(0.8))
for arg in sys.argv[1:]:
    id_, name, lon, lat = arg.split(':'); lon, lat = float(lon), float(lat)
    X, Y = lcc(lon, lat); x, y = round(kx * X + bx, 2), round(ky * Y + by, 2)
    im.paste(patch, (round(x / 100 * W) - R, round(y / 100 * H) - R), mask)
    caps['capitals'] = [c for c in caps['capitals'] if c['id'] != id_] + [{'id': id_, 'name': name, 'lon': lon, 'lat': lat, 'x': x, 'y': y,
        'added': '2026-10-28, block 2 section 5: dot copied from the Madrid dot onto europe-capitals.webp; not used to fit the projection'}]
    print(id_, x, y)
im.convert('RGB').save(IMG, 'WEBP', quality=90, method=6)
CAPS.write_text(json.dumps(caps, ensure_ascii=False, indent=2) + '\n')
