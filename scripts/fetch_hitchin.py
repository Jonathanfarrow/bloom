"""Download real map data for Hitchin town centre and write src/data/hitchin.json.

Sources (both open data, no API key needed):
  - Overture Maps (https://overturemaps.org), which includes OpenStreetMap data
    (© OpenStreetMap contributors, ODbL): buildings, streets, railways, water,
    parks and land use, bridges, named places.
  - AWS Terrain Tiles (Terrarium, https://registry.opendata.aws/terrain-tiles/)
    for ground elevation.

Usage:
    pip install pyarrow fsspec aiohttp requests shapely pillow
    python scripts/fetch_hitchin.py

Coordinates in the output are metres from Market Place, x east, z south,
rounded to 10 cm.
"""
import io, json, math, re, sys, concurrent.futures as cf
import requests, fsspec, pyarrow.parquet as pq
from shapely import wkb
from shapely.geometry import box, Polygon, MultiPolygon, LineString, MultiLineString, Point
from shapely.ops import substring
from PIL import Image

RELEASE = "2026-08-19.0"
BASE = "https://overturemaps-us-west-2.s3.amazonaws.com"
# Market Place, Hitchin
LAT0, LON0 = 51.94745, -0.27877
HALF_W, HALF_H = 1300, 1150  # metres either side of the origin
KX = 111320 * math.cos(math.radians(LAT0))
KZ = 110574
BBOX = (LON0 - HALF_W / KX, LAT0 - HALF_H / KZ, LON0 + HALF_W / KX, LAT0 + HALF_H / KZ)
CLIP = box(*BBOX)
fs = fsspec.filesystem("https")


def xz(lon, lat):
    return [round((lon - LON0) * KX, 1), round(-(lat - LAT0) * KZ, 1)]


def ls(prefix):
    keys, token = [], None
    while True:
        u = f"{BASE}/?list-type=2&prefix={prefix}" + (f"&continuation-token={requests.utils.quote(token)}" if token else "")
        t = requests.get(u, timeout=60).text
        keys += re.findall(r"<Key>([^<]+\.parquet)</Key>", t)
        m = re.search(r"<NextContinuationToken>([^<]+)</NextContinuationToken>", t)
        if not m:
            return keys
        token = m.group(1)


def overlaps(b):
    return not (b[2] < BBOX[0] or b[0] > BBOX[2] or b[3] < BBOX[1] or b[1] > BBOX[3])


def rowgroups_in_bbox(key):
    f = pq.ParquetFile(fs.open(f"{BASE}/{key}", block_size=2**18))
    md = f.metadata
    names = [md.schema.column(i).path for i in range(md.num_columns)]
    idx = {n: names.index(f"bbox.{n}") for n in ("xmin", "xmax", "ymin", "ymax")}
    hits = []
    for rg in range(md.num_row_groups):
        r = md.row_group(rg)
        st = {n: r.column(i).statistics for n, i in idx.items()}
        if any(s is None or not s.has_min_max for s in st.values()):
            hits.append(rg); continue
        if overlaps((st["xmin"].min, st["ymin"].min, st["xmax"].max, st["ymax"].max)):
            hits.append(rg)
    return key, hits


def fetch(theme, typ, columns):
    keys = ls(f"release/{RELEASE}/theme={theme}/type={typ}/")
    print(f"{theme}/{typ}: scanning {len(keys)} files", file=sys.stderr)
    with cf.ThreadPoolExecutor(24) as ex:
        found = [(k, h) for k, h in ex.map(rowgroups_in_bbox, keys) if h]
    rows = []
    for key, rgs in found:
        f = pq.ParquetFile(fs.open(f"{BASE}/{key}", block_size=2**22))
        for rg in rgs:
            t = f.read_row_group(rg, columns=columns + ["bbox", "geometry"]).to_pylist()
            for row in t:
                b = row["bbox"]
                if overlaps((b["xmin"], b["ymin"], b["xmax"], b["ymax"])):
                    rows.append(row)
    print(f"  {len(rows)} features", file=sys.stderr)
    return rows


def rings(geom, tol=0.4):
    """Outer rings of a (multi)polygon, clipped, in local metres."""
    g = geom.intersection(CLIP)
    polys = [g] if isinstance(g, Polygon) else list(getattr(g, "geoms", []))
    out = []
    for p in polys:
        if not isinstance(p, Polygon) or p.is_empty:
            continue
        pts = [xz(x, y) for x, y in p.exterior.coords[:-1]]
        simp = Polygon(pts).simplify(tol)
        if simp.is_empty or simp.area < 4:
            continue
        out.append([[round(x, 1), round(z, 1)] for x, z in simp.exterior.coords[:-1]])
    return out


def lines(geom):
    g = geom.intersection(CLIP)
    ls_ = [g] if isinstance(g, LineString) else list(getattr(g, "geoms", []))
    out = []
    for l in ls_:
        if isinstance(l, LineString) and not l.is_empty and l.length > 0:
            pts = LineString([xz(x, y) for x, y in l.coords]).simplify(0.5)
            out.append([[round(x, 1), round(z, 1)] for x, z in pts.coords])
    return out


def name(row):
    n = row.get("names")
    return n and n.get("primary")


def main():
    data = {"origin": {"lat": LAT0, "lon": LON0}, "extent": [HALF_W, HALF_H]}

    # Buildings
    bl = []
    for r in fetch("buildings", "building", ["names", "height", "num_floors", "class", "subtype", "roof_shape", "is_underground"]):
        if r.get("is_underground"):
            continue
        for ring in rings(wkb.loads(r["geometry"])):
            b = {"p": ring}
            poly = Polygon(ring)
            mrr = poly.minimum_rotated_rectangle
            if poly.area < 450 and mrr.area > 0 and poly.area / mrr.area > 0.86:
                c = list(mrr.exterior.coords)[:4]
                e1 = math.dist(c[0], c[1]); e2 = math.dist(c[1], c[2])
                a = math.atan2(c[1][1] - c[0][1], c[1][0] - c[0][0]) if e1 >= e2 else math.atan2(c[2][1] - c[1][1], c[2][0] - c[1][0])
                b["rr"] = [round(mrr.centroid.x, 1), round(mrr.centroid.y, 1), round(max(e1, e2), 1), round(min(e1, e2), 1), round(a, 3)]
            if r.get("height"): b["h"] = round(r["height"], 1)
            if r.get("num_floors"): b["f"] = r["num_floors"]
            c = r.get("class") or r.get("subtype")
            if c: b["c"] = c
            if r.get("roof_shape"): b["r"] = r["roof_shape"]
            if name(r): b["n"] = name(r)
            bl.append(b)
    data["buildings"] = bl

    # Streets, paths and railways
    segs = []
    for r in fetch("transportation", "segment", ["names", "subtype", "class", "road_flags", "subclass"]):
        geom = wkb.loads(r["geometry"])
        spans = {"bridge": [], "tunnel": []}
        for f in r.get("road_flags") or []:
            for v in f.get("values") or []:
                k = {"is_bridge": "bridge", "is_tunnel": "tunnel"}.get(v)
                if k:
                    spans[k].append(tuple(f.get("between") or (0.0, 1.0)))
        # cut the line at every span boundary, then tag each piece
        cuts = sorted({0.0, 1.0, *[c for v in spans.values() for sp in v for c in sp]})
        for a, b in zip(cuts, cuts[1:]):
            if b - a < 1e-6:
                continue
            piece = substring(geom, a, b, normalized=True)
            mid = (a + b) / 2
            tag = {k: 1 for k, v in spans.items() if any(s0 <= mid <= s1 for s0, s1 in v)}
            for l in lines(piece):
                s = {"p": l, "t": r.get("subtype"), "c": r.get("class"), **tag}
                if name(r): s["n"] = name(r)
                if r.get("subclass"): s["sc"] = r["subclass"]
                segs.append(s)
    data["segments"] = segs

    # Water: rivers (lines) and ponds/river areas (polygons)
    water = {"areas": [], "lines": []}
    for r in fetch("base", "water", ["names", "subtype", "class", "is_intermittent"]):
        g = wkb.loads(r["geometry"])
        if g.geom_type in ("Polygon", "MultiPolygon"):
            for ring in rings(g, 0.6):
                water["areas"].append({"p": ring, "c": r.get("class"), **({"n": name(r)} if name(r) else {})})
        elif g.geom_type in ("LineString", "MultiLineString"):
            for l in lines(g):
                water["lines"].append({"p": l, "c": r.get("class"), **({"n": name(r)} if name(r) else {})})
    data["water"] = water

    # Parks, grass, churchyards, woods, allotments, car parks…
    land, trees = [], []
    for typ in ("land_use", "land"):
        for r in fetch("base", typ, ["names", "subtype", "class"]):
            g = wkb.loads(r["geometry"])
            if r.get("class") == "tree" and g.geom_type == "Point" and CLIP.contains(g):
                trees.append(xz(g.x, g.y)); continue
            if r.get("class") == "tree_row" and g.geom_type == "LineString":
                for l in lines(g):
                    ls2 = LineString(l)
                    for k in range(0, int(ls2.length) + 1, 9):
                        p = ls2.interpolate(k); trees.append([round(p.x, 1), round(p.y, 1)])
                continue
            if g.geom_type not in ("Polygon", "MultiPolygon"):
                continue
            for ring in rings(g, 0.8):
                land.append({"p": ring, "t": r.get("subtype"), "c": r.get("class"), **({"n": name(r)} if name(r) else {})})
    data["land"] = land
    data["trees"] = trees

    # Bridges, lamp posts, benches etc. (only keep a few useful classes)
    infra = []
    for r in fetch("base", "infrastructure", ["names", "subtype", "class"]):
        g = wkb.loads(r["geometry"])
        c = r.get("class")
        if g.geom_type in ("Polygon", "MultiPolygon") and r.get("subtype") in ("bridge", "pedestrian", "recreation", "barrier"):
            for ring in rings(g, 0.3):
                infra.append({"p": ring, "t": r.get("subtype"), "c": c})
        elif g.geom_type in ("LineString", "MultiLineString") and r.get("subtype") in ("bridge", "barrier"):
            for l in lines(g):
                infra.append({"l": l, "t": r.get("subtype"), "c": c})
    data["infrastructure"] = infra

    # Named places for labels
    places = []
    for r in fetch("places", "place", ["names", "categories", "confidence"]):
        if (r.get("confidence") or 0) < 0.6 or not name(r):
            continue
        g = wkb.loads(r["geometry"])
        cat = (r.get("categories") or {}).get("primary")
        places.append({"n": name(r), "c": cat, "at": xz(g.x, g.y)})
    data["places"] = places

    data["terrain"] = terrain()
    with open("src/data/hitchin.json", "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print("wrote src/data/hitchin.json", {k: len(v) if isinstance(v, list) else "" for k, v in data.items()}, file=sys.stderr)


def terrain(z=15, step=20):
    """Height grid (metres above Market Place) from Terrarium tiles."""
    n = 2 ** z
    tile = lambda lon, lat: ((lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    cache = {}
    def sample(lon, lat):
        tx, ty = tile(lon, lat)
        key = (int(tx), int(ty))
        if key not in cache:
            u = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{key[0]}/{key[1]}.png"
            cache[key] = Image.open(io.BytesIO(requests.get(u, timeout=60).content)).convert("RGB")
        img = cache[key]
        px, py = (tx - key[0]) * 256, (ty - key[1]) * 256
        x0, y0 = min(int(px), 254), min(int(py), 254)
        fx, fy = px - x0, py - y0
        def h(x, y):
            r, g, b = img.getpixel((x, y))
            return r * 256 + g + b / 256 - 32768
        return (h(x0, y0) * (1 - fx) * (1 - fy) + h(x0 + 1, y0) * fx * (1 - fy) + h(x0, y0 + 1) * (1 - fx) * fy + h(x0 + 1, y0 + 1) * fx * fy)
    nx, nz = int(2 * HALF_W / step) + 1, int(2 * HALF_H / step) + 1
    base = sample(LON0, LAT0)
    grid = []
    for j in range(nz):
        zz = -HALF_H + j * step
        for i in range(nx):
            xx = -HALF_W + i * step
            grid.append(round(sample(LON0 + xx / KX, LAT0 - zz / KZ) - base, 1))
    return {"step": step, "nx": nx, "nz": nz, "x0": -HALF_W, "z0": -HALF_H, "h": grid, "base": round(base, 1)}


if __name__ == "__main__":
    main()
