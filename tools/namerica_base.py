"""Shared base of the block 4 «North America» maps (assets/namerica-*.webp, 2200×1600): projection, Natural Earth
loading and the North America mask. Imported by tools/build_namerica_*.py.

Projection: Lambert conformal conic, standard parallels 20N/60N, centre 96W 45N (the usual North America conic), fitted
so that the continent from the Bering Strait and the eastern Aleutians to Greenland and from Ellesmere Island to Panama
and Trinidad fits the 11:8 frame. Hawaii is Oceania and stays grey; Iceland is Europe; Chukotka is Asia.
"""
import json, math, pathlib
from shapely.geometry import shape, Polygon, LineString, Point, box
from shapely.ops import unary_union
import shapely

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 2200, 1600

r = math.pi / 180
p1, p2, l0, p0 = 20 * r, 60 * r, -96 * r, 45 * r
n = math.log(math.cos(p1) / math.cos(p2)) / math.log(math.tan(math.pi / 4 + p2 / 2) / math.tan(math.pi / 4 + p1 / 2))
F = math.cos(p1) * math.tan(math.pi / 4 + p1 / 2) ** n / n
rho = lambda p: F / math.tan(math.pi / 4 + p / 2) ** n
rho0 = rho(p0)
def lcc(lon, lat):
    q, t = rho(lat * r), n * (lon * r - l0)
    return q * math.sin(t), rho0 - q * math.cos(t)

# points that must be on the map (lon, lat): Bering Strait, Unalaska, Baja tip, Panama, Trinidad, Barbados, Newfoundland,
# east and north Greenland, Ellesmere, Prince Patrick Island
FIT = [(-171.0, 66.5), (-168.5, 53.0), (-109.5, 22.5), (-92.0, 14.0), (-78.0, 7.0), (-61.0, 10.0), (-59.0, 13.0),
       (-52.5, 47.5), (-20.0, 70.0), (-18.0, 77.0), (-33.0, 83.7), (-75.0, 83.2), (-120.0, 77.0)]
_P = [lcc(*p) for p in FIT]
_x0, _x1 = min(p[0] for p in _P), max(p[0] for p in _P)
_y0, _y1 = min(p[1] for p in _P), max(p[1] for p in _P)
_s = min(W * 0.94 / (_x1 - _x0), H * 0.94 / (_y1 - _y0))
_cx, _cy = (_x0 + _x1) / 2, (_y0 + _y1) / 2
def px(lon, lat):
    """lon/lat → image pixels (2200×1600)."""
    X, Y = lcc(lon, lat)
    return W / 2 + (X - _cx) * _s, H / 2 - (Y - _cy) * _s
def pct(lon, lat):
    x, y = px(lon, lat)
    return 100 * x / W, 100 * y / H

VIEW = box(-180, -40, 40, 89)
def load(ne, name, key='name'):
    out = []
    for f in json.load(open(pathlib.Path(ne) / (name + '.geojson')))['features']:
        g = shape(f['geometry'])
        if not g.is_valid: g = g.buffer(0)
        g = g.intersection(VIEW)
        if not g.is_empty: out.append((f['properties'], g))
    return out
def proj(g, fn=px):
    return shapely.transform(g, lambda c: [fn(a, b) for a, b in c])

# North America – South America border (lon, lat): the Panama–Colombia border from the Caribbean to the Pacific
PANAMA_COLOMBIA = [(-77.36, 8.68), (-77.2, 8.0), (-77.75, 7.5), (-77.89, 7.21)]

def na_region(land):
    """lon/lat polygon of the North American side. `land` is the Natural Earth land: the South American mainland is
    cut off at the Panama–Colombia border; Trinidad and the Caribbean islands stay North American."""
    east = Polygon(PANAMA_COLOMBIA + [(-79.5, 5.0), (-82.0, -60.0), (-20.0, -60.0), (-20.0, 20.0), (-77.0, 20.0), (-77.0, 9.5)])
    mainland = [g for g in getattr(land, 'geoms', [land]) if g.intersects(Point(-60.0, -10.0))]
    sa = unary_union([g.intersection(east) for g in mainland] + [box(-65.5, 10.5, -63.5, 11.3), box(-180, -60, 0, 5.0)])
    iceland = box(-25.5, 62.5, -12.0, 67.5)
    hawaii = box(-161.0, 18.0, -154.0, 23.0)
    chukotka = Polygon([(-180, 62.0), (-171.3, 62.0), (-169.4, 65.5), (-169.0, 66.5), (-168.95, 70), (-180, 72)])
    return box(-180, -60.0, -10.0, 89.0).difference(unary_union([sa, iceland, hawaii, chukotka]))
