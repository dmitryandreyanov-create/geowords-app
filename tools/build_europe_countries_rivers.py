#!/usr/bin/env python3
"""Builds assets/europe-countries-rivers.webp — the map of block 2 section 4 «Countries and capitals: west and north»: the capitals map
(country borders and capital dots) with the rivers of section 2 drawn on it (Svetlana, 28.10.2026: GeoWords must practise the rivers, and a
river together with the outline of its country is the key point). All europe-*.webp share one base, so the river pixels are taken from
europe-rivers.webp where it differs from europe-blank.webp and is blue, and laid over europe-capitals.webp; the capital dots stay on top.

usage: python3 tools/build_europe_countries_rivers.py
"""
import json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / 'assets'
load = lambda n: np.asarray(Image.open(A / f'europe-{n}.webp').convert('RGB')).astype(int)
blank, rivers, caps = load('blank'), load('rivers'), load('capitals')
diff = np.abs(rivers - blank).sum(2)
alpha = np.clip((diff - 20) / 80, 0, 1) * (rivers[:, :, 2] - rivers[:, :, 0] > 25)
H, W = alpha.shape
yy, xx = np.mgrid[0:H, 0:W]
for c in json.load(open(ROOT / 'data/maps/europe-capitals.json'))['capitals']:
    alpha[(xx - c['x'] * W / 100) ** 2 + (yy - c['y'] * H / 100) ** 2 <= 16 ** 2] = 0
out = (caps * (1 - alpha[..., None]) + rivers * alpha[..., None]).astype(np.uint8)
Image.fromarray(out).save(A / 'europe-countries-rivers.webp', quality=90)
print('wrote', A / 'europe-countries-rivers.webp')
