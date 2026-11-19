"""Drops the GeoWords letter spots of data/maps/asia-countries-{6,7,8}.json that lie on the grey part of the map outside Asia
(West Kazakhstan beyond the Ural River, the Indonesian half of New Guinea): see asia_base.on_asia. tools/build_asia_countries.py
applies the same rule when it builds the spots; this script fixes the stored files without Natural Earth.
Usage: python3 tools/trim_asia_spots.py"""
import json
import asia_base as B

for sec in (6, 7, 8):
    path = B.ROOT / f'data/maps/asia-countries-{sec}.json'
    m = json.load(open(path))
    for it in m['items']:
        sp = it.get('spots')
        if not sp: continue
        keep = [s for s in sp if B.on_asia(s['x'], s['y'])]
        if len(keep) != len(sp): print(sec, it['id'], len(sp), '->', len(keep))
        it['spots'] = keep
    for rv in m.get('rivers', []):
        for key in ('spots',):
            if rv.get(key): rv[key] = [s for s in rv[key] if B.on_asia(s['x'], s['y'])]
        for q in rv.get('points', []):
            if q.get('spots'): q['spots'] = [s for s in q['spots'] if B.on_asia(s['x'], s['y'])]
    path.write_text(json.dumps(m, ensure_ascii=False, separators=(',', ':')).replace('{"id"', '\n{"id"') + '\n')  # as build_asia_countries.py
