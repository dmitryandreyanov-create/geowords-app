#!/usr/bin/env python3
"""Draws rivers that the original artwork of assets/europe-rivers.webp lacks (the Dniester and the Guadiana) onto it,
from their lines in data/maps/europe-rivers.json, in the colour and width of the drawn rivers. Run once after
tools/build_europe_rivers.py; a river already on the image is skipped, so a second run changes nothing.

usage: python3 tools/draw_europe_rivers.py
"""
import json, pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
ADD = ['dniester', 'guadiana']
COLOR, WIDTH, SS = (34, 124, 158), 4.2, 4  # colour of the drawn rivers, stroke width in px, supersampling

dst = ROOT / 'assets/europe-rivers.webp'
im = Image.open(dst).convert('RGB'); W, H = im.size
river = lambda p: p[2] > p[0] + 60 and p[1] > p[0] + 30
items = {i['id']: i for i in json.load(open(ROOT / 'data/maps/europe-rivers.json'))['items']}
mask = Image.new('L', (W * SS, H * SS), 0); d = ImageDraw.Draw(mask); drawn = 0
for id_ in ADD:
    pts = [(x / 100 * W, y / 100 * H) for l in items[id_]['path'] for x, y in l]
    if sum(river(im.getpixel((int(x), int(y)))) for x, y in pts) > len(pts) / 2:
        print('already drawn:', id_); continue
    for l in items[id_]['path']:
        xy = [(x / 100 * W * SS, y / 100 * H * SS) for x, y in l]
        d.line(xy, fill=255, width=round(WIDTH * SS), joint='curve')
        r = WIDTH * SS / 2
        for x, y in (xy[0], xy[-1]): d.ellipse((x - r, y - r, x + r, y + r), fill=255)
    print('drawn:', id_); drawn += 1
if not drawn: raise SystemExit
mask = mask.resize((W, H), Image.LANCZOS)
im.paste(Image.new('RGB', (W, H), COLOR), (0, 0), mask)
im.save(dst, 'WEBP', quality=90, method=6)
