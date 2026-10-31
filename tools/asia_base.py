"""Shared base of the block 3 «Asia» maps (assets/asia-*.webp, 2200×1600): projection, Natural Earth loading and the
Asia mask. Imported by tools/build_asia_*.py.

Projection: Lambert conformal conic, standard parallels 20N/60N, centre 95E 45N, fitted so that Asia from the Bosporus and
Suez to Chukotka and from Severnaya Zemlya to Java fits the 11:8 frame. Longitudes west of 100W are shifted by +360 so
Chukotka and Alaska stay whole on the right edge.
"""
import json, math, pathlib
from shapely.geometry import shape, Polygon, LineString, Point, box
from shapely.ops import unary_union
import shapely

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 2200, 1600

r = math.pi / 180
p1, p2, l0, p0 = 20 * r, 60 * r, 95 * r, 45 * r
n = math.log(math.cos(p1) / math.cos(p2)) / math.log(math.tan(math.pi / 4 + p2 / 2) / math.tan(math.pi / 4 + p1 / 2))
F = math.cos(p1) * math.tan(math.pi / 4 + p1 / 2) ** n / n
rho = lambda p: F / math.tan(math.pi / 4 + p / 2) ** n
rho0 = rho(p0)
def lcc(lon, lat):
    q, t = rho(lat * r), n * (lon * r - l0)
    return q * math.sin(t), rho0 - q * math.cos(t)

# points that must be on the map (lon, lat): Aegean coast, Suez, Aden, Java, Timor, Kamchatka, Chukotka, Severnaya Zemlya
FIT = [(25.0, 41.5), (27.0, 36.5), (31.5, 30.0), (43.0, 11.5), (79.0, 5.5), (105.0, -8.5), (125.0, -9.5), (140.0, 2.0),
       (163.0, 52.0), (191.5, 66.5), (180.0, 71.5), (100.0, 79.8), (60.0, 76.0), (45.0, 47.0)]
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

VIEW = box(-10, -30, 240, 89)
def shift(g):
    """west-hemisphere parts +360 so the map is continuous across 180."""
    from shapely import affinity
    east, west = g.intersection(box(-100, -90, 180, 90)), g.intersection(box(-180, -90, -100, 90))
    if west.is_empty: return east
    return unary_union([east, affinity.translate(west, 360)]) if not east.is_empty else affinity.translate(west, 360)
def load(ne, name, key='name'):
    out = []
    for f in json.load(open(pathlib.Path(ne) / (name + '.geojson')))['features']:
        g = shape(f['geometry'])
        if not g.is_valid: g = g.buffer(0)
        if g.geom_type.endswith('Polygon'): g = g.intersection(box(-180, -30, 180, 89))
        if not g.is_empty: out.append((f['properties'], shift(g)))
    return out
def proj(g, fn=px):
    return shapely.transform(g, lambda c: [fn(a, b) for a, b in c])

# Europe–Asia border (lon, lat): Baydaratskaya Bay, the crest of the Urals, the Ural River (added from Natural Earth),
# the Caspian, the Kuma–Manych depression, the Sea of Azov, the Black Sea, the Bosporus — the line of the Europe maps.
URAL_CREST = [(68.0, 69.4), (66.6, 68.4), (65.0, 67.2), (63.2, 66.0), (60.4, 65.0), (59.4, 63.0), (59.2, 61.0), (59.5, 59.0),
              (59.7, 57.0), (59.3, 55.5), (59.4, 54.7)]
KUMA_MANYCH = [(47.0, 44.8), (46.0, 45.0), (45.0, 45.4), (44.0, 45.9), (43.0, 46.2), (42.0, 46.5), (41.0, 46.7), (40.0, 46.9), (39.3, 47.1)]

def border(ne):
    """the Europe–Asia border line on land, in lon/lat."""
    ural = [g for p, g in load(ne, 'ne_10m_rivers_lake_centerlines') if p.get('name') == 'Ural']
    u = unary_union(ural)
    u = shapely.ops.linemerge(u) if u.geom_type == 'MultiLineString' else u
    coords = list(u.coords) if u.geom_type == 'LineString' else [c for l in u.geoms for c in l.coords]
    if coords[0][1] < coords[-1][1]: coords = coords[::-1]  # source (north) first
    return LineString(URAL_CREST + coords), LineString(KUMA_MANYCH)

def asia_region(ne):
    """lon/lat polygon of the Asian side: east of the Europe border, east of Suez and the Red Sea, west of the Bering Strait."""
    crest, km = border(ne)
    west = list(crest.coords) + [(51.9, 46.9)] + list(km.coords) + [(36.6, 45.3), (33.0, 43.5), (29.1, 41.25), (26.3, 40.1),
            (26.0, 39.0), (26.6, 38.2), (26.9, 37.0), (27.6, 36.4), (28.5, 35.5), (32.3, 31.3), (32.35, 30.5), (32.55, 29.9),
            (33.8, 27.8), (43.3, 12.6), (52.0, 10.0), (60.0, -30.0)]
    ring = [(66.0, 89.0)] + west + [(140.0, -30.0), (191.0, 50.0), (191.0, 65.5), (189.5, 89.0)]
    return Polygon(ring).buffer(0)
