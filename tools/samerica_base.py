"""Shared base of the block 5 «South America» maps (assets/samerica-*.webp, 2200×1600): projection, Natural Earth
loading and the South America mask. Imported by tools/build_samerica_*.py.

Projection: Lambert azimuthal equal-area centred at 62W 18S (the continent is tall and straddles the equator, so an
azimuthal projection keeps both the Caribbean coast and Tierra del Fuego undistorted), fitted so that the continent with
the Galápagos, the Falklands, Cape Horn and the Drake Passage fits the 11:8 frame.
Panama, Trinidad and Tobago and the Caribbean islands belong to block 4 (North America) and stay grey.
"""
import json, math, pathlib
from shapely.geometry import shape, Polygon, Point, box
from shapely.ops import unary_union
import shapely

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 2200, 1600

r = math.pi / 180
L0, P0 = -62.0 * r, -18.0 * r
def laea(lon, lat):
    l, p = lon * r - L0, lat * r
    k = math.sqrt(2 / (1 + math.sin(P0) * math.sin(p) + math.cos(P0) * math.cos(p) * math.cos(l)))
    return k * math.cos(p) * math.sin(l), k * (math.cos(P0) * math.sin(p) - math.sin(P0) * math.cos(p) * math.cos(l))

# points that must be on the map (lon, lat): Galápagos west, Punta Gallinas, Trinidad, Cabo Branco, Falklands east,
# Cape Horn, the Drake Passage south of it
FIT = [(-92.2, -1.0), (-71.7, 12.8), (-60.5, 11.0), (-34.6, -7.2), (-57.5, -52.0), (-67.3, -56.0), (-66.0, -59.0),
       (-77.0, 8.5)]
_P = [laea(*p) for p in FIT]
_x0, _x1 = min(p[0] for p in _P), max(p[0] for p in _P)
_y0, _y1 = min(p[1] for p in _P), max(p[1] for p in _P)
_s = min(W * 0.92 / (_x1 - _x0), H * 0.94 / (_y1 - _y0))
_cx, _cy = (_x0 + _x1) / 2, (_y0 + _y1) / 2
def px(lon, lat):
    """lon/lat → image pixels (2200×1600)."""
    X, Y = laea(lon, lat)
    return W / 2 + (X - _cx) * _s, H / 2 - (Y - _cy) * _s
def pct(lon, lat):
    x, y = px(lon, lat)
    return 100 * x / W, 100 * y / H

VIEW = box(-125, -70, 5, 32)
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

def sa_region(land):
    """lon/lat polygon of South America: the mainland east of the Panama–Colombia border with its islands (Tierra del
    Fuego, Chiloé, the Galápagos, the Falklands, Fernando de Noronha); Trinidad and Tobago, the ABC islands and the
    rest of the Caribbean stay North American (block 4)."""
    east = Polygon(PANAMA_COLOMBIA + [(-79.5, 5.0), (-95.0, 3.0), (-95.0, -62.0), (-30.0, -62.0), (-30.0, 13.0),
                                      (-77.0, 13.0), (-77.0, 9.5)])
    caribbean = unary_union([box(-62.2, 9.95, -60.4, 11.5),      # Trinidad and Tobago
                             box(-70.2, 11.9, -67.9, 12.7),      # Aruba, Curaçao, Bonaire
                             box(-80.0, 11.6, -60.0, 20.0),      # the rest of the Caribbean north of 11.6N
                             box(-39.0, -55.5, -25.0, -53.0)])   # South Georgia (Antarctic, not taught)
    return east.difference(caribbean)
