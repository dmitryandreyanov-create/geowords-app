// Validates map content in data/maps/*.json against the image assets it references.
// Checks references, image sizes and transparency, layer alignment, ids and order,
// names, coordinate ranges, label-inside-tap-area and (for Lambert maps) that
// x/y agree with lon/lat. Tap areas smaller than a finger are reported as notes:
// the app must add a screen-space touch tolerance for them.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dir = process.env.MAPS_DIR || path.join(root, "data/maps");
const MAP_WIDTH_PX = 300;   // narrowest phone map width the app supports
const MIN_TAP_PX = 44;      // recommended minimum touch target
const errors = [], notes = [], smallTaps = new Map();
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

if (!fs.existsSync(dir)) {
  console.log("No data/maps directory: nothing to validate.");
  process.exit(0);
}
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort();
if (!files.length) {
  console.log("No map data files: nothing to validate.");
  process.exit(0);
}

// --- WebP header: dimensions and alpha without decoding the image ---
const webpCache = new Map();
function webpInfo(rel) {
  if (webpCache.has(rel)) return webpCache.get(rel);
  const b = fs.readFileSync(path.join(root, rel));
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") throw Error("not a WebP file");
  const chunk = b.toString("ascii", 12, 16);
  let info;
  if (chunk === "VP8X") {
    info = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alpha: (b[20] & 0x10) !== 0 };
  } else if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    info = { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff), alpha: ((bits >> 28) & 1) === 1 };
  } else if (chunk === "VP8 ") {
    info = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alpha: false };
  } else throw Error("unknown WebP chunk " + chunk);
  webpCache.set(rel, info);
  return info;
}
function svgViewBox(rel) {
  const m = fs.readFileSync(path.join(root, rel), "utf8").match(/viewBox\s*=\s*"([\d.\s-]+)"/);
  if (!m) throw Error("no viewBox");
  const [, , w, h] = m[1].trim().split(/\s+/).map(Number);
  return { w, h };
}
const asset = p => typeof p === "string" ? p.replace(/^\.\//, "") : null;
function exists(file, ref, what) {
  const rel = asset(ref);
  if (!rel) { fail(file, `${what}: missing path`); return null; }
  if (!fs.existsSync(path.join(root, rel))) { fail(file, `${what}: missing file ${rel}`); return null; }
  return rel;
}
const pct = v => Number.isFinite(v) && v >= 0 && v <= 100;
const OVERLAP_TOL = 0.2; // % of map width
function pointInPoly(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function checkTap(file, id, label, tapArea, aspect, where, holes) {
  if (!label || !pct(label.x) || !pct(label.y)) { fail(file, `${id}: ${where} label outside 0..100`); return; }
  if (!Array.isArray(tapArea) || !tapArea.length) { fail(file, `${id}: ${where} tapArea missing`); return; }
  for (const poly of tapArea) {
    if (!Array.isArray(poly) || poly.length < 3 || !poly.every(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])))
      { fail(file, `${id}: ${where} tapArea has an invalid polygon`); return; }
    const out = Math.max(...poly.flatMap(([x, y]) => [-x, x - 100, -y, y - 100]));
    if (out > 10) { fail(file, `${id}: ${where} tapArea reaches ${out.toFixed(1)}% beyond the image`); return; }
    if (out > 0) notes.push(`${file}: ${id} ${where} tapArea extends ${out.toFixed(1)}% past the image edge (clip it)`);
  }
  if (!tapArea.some(poly => pointInPoly(label, poly))) fail(file, `${id}: ${where} label is not inside its tapArea`);
  // Holes (islands cut out of an ocean): each lies inside the area, the label is not in one.
  for (const hole of holes || []) {
    if (!Array.isArray(hole) || hole.length < 3) { fail(file, `${id}: ${where} invalid hole`); continue; }
    if (!tapArea.some(poly => pointInPoly({ x: hole[0][0], y: hole[0][1] }, poly))) fail(file, `${id}: ${where} hole lies outside its tapArea`);
  }
  if ((holes || []).some(h => pointInPoly(label, h))) fail(file, `${id}: ${where} label is inside a hole`);
  if (where === "map") {
    // Largest single polygon: an area split by the map edge is not one big target.
    const dims = tapArea.map(poly => {
      const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
      return [(Math.max(...xs) - Math.min(...xs)) / 100 * MAP_WIDTH_PX, (Math.max(...ys) - Math.min(...ys)) / 100 * MAP_WIDTH_PX / aspect];
    }).sort((a, b) => Math.min(b[0], b[1]) - Math.min(a[0], a[1]));
    const [wPx, hPx] = dims[0];
    if (Math.min(wPx, hPx) < MIN_TAP_PX) {
      if (!smallTaps.has(file)) smallTaps.set(file, []);
      smallTaps.get(file).push(`${id} ${Math.round(wPx)}×${Math.round(hPx)}`);
    }
  }
}

// Lambert conformal conic, used to cross-check x/y against lon/lat.
function lambert(source) {
  const m = /std parallels\s*(\d+(?:\.\d+)?)N\/(\d+(?:\.\d+)?)N,\s*cent(?:re|er)\s*(-?\d+(?:\.\d+)?)E\s*(-?\d+(?:\.\d+)?)N/i.exec(source || "");
  if (!m) return null;
  const r = Math.PI / 180, [p1, p2, l0, p0] = m.slice(1).map(Number).map(v => v * r);
  const n = Math.log(Math.cos(p1) / Math.cos(p2)) / Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
  const F = Math.cos(p1) * Math.pow(Math.tan(Math.PI / 4 + p1 / 2), n) / n;
  const rho = p => F / Math.pow(Math.tan(Math.PI / 4 + p / 2), n), rho0 = rho(p0);
  return (lon, lat) => { const q = rho(lat * r), t = n * (lon * r - l0); return [q * Math.sin(t), rho0 - q * Math.cos(t)]; };
}
function linearFit(xs, ys) {
  const n = xs.length, sx = xs.reduce((a, b) => a + b, 0), sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, b) => a + b * b, 0), sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
  const k = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return [k, (sy - k * sx) / n];
}

let itemCount = 0;
for (const file of files) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")); }
  catch (e) { fail(file, "invalid JSON: " + e.message); continue; }

  const baseRel = exists(file, j.map, "base map");
  let base = null;
  if (baseRel) { try { base = webpInfo(baseRel); } catch (e) { fail(file, `base map: ${e.message}`); } }
  for (const alt of j.alsoValidFor || []) {
    const rel = exists(file, alt, "alsoValidFor");
    if (rel && base) {
      const a = webpInfo(rel);
      if (a.w !== base.w || a.h !== base.h) fail(file, `alsoValidFor ${rel} is ${a.w}×${a.h}, base is ${base.w}×${base.h}`);
    }
  }
  const aspect = base ? base.w / base.h : 2;
  if (base && j.mapAspect) {
    const [a, b] = String(j.mapAspect).split("/").map(Number);
    if (!(Math.abs(a / b - aspect) < 0.002)) fail(file, `mapAspect ${j.mapAspect} does not match image ${base.w}×${base.h}`);
  }
  if (base && Array.isArray(j.size)) {
    if (Math.abs(j.size[0] / j.size[1] - aspect) > 0.002) fail(file, `size ${j.size.join("×")} has a different aspect than the base map`);
  }

  const key = Object.keys(j).find(k => Array.isArray(j[k]) && j[k].length && j[k][0] && typeof j[k][0] === "object" && "id" in j[k][0]);
  if (!key) { fail(file, "no list of objects with ids"); continue; }
  const items = j[key];
  itemCount += items.length;

  const ids = new Set();
  for (const it of items) {
    if (!it.id || typeof it.id !== "string") fail(file, "object without id");
    else if (ids.has(it.id)) fail(file, `duplicate id ${it.id}`);
    else ids.add(it.id);
  }
  if (items.some(it => "order" in it)) {
    const orders = items.map(it => it.order).sort((a, b) => a - b);
    if (!orders.every((o, i) => o === i + 1)) fail(file, `order must run 1..${items.length} without gaps, got ${orders.join(",")}`);
  }

  for (const it of items) {
    const id = it.id || "?";
    if (typeof it.name === "object") {
      for (const lang of ["en", "ru"]) if (typeof it.name?.[lang] !== "string" || !it.name[lang].trim()) fail(file, `${id}: name.${lang} missing`);
    } else if (typeof it.name !== "string" || !it.name.trim()) fail(file, `${id}: name missing`);

    if (it.bbox) {
      const [x0, y0, x1, y1] = it.bbox;
      if (![x0, y0, x1, y1].every(pct) || x0 >= x1 || y0 >= y1) fail(file, `${id}: bbox invalid ${JSON.stringify(it.bbox)}`);
    }
    if (it.layer) {
      for (const kind of ["png", "webp"]) {
        if (!it.layer[kind]) continue;
        const rel = exists(file, it.layer[kind], `${id} layer`);
        if (rel && base) {
          try {
            const l = webpInfo(rel);
            if (l.w !== base.w || l.h !== base.h) fail(file, `${id}: layer ${l.w}×${l.h} is not aligned with base ${base.w}×${base.h}`);
            if (!l.alpha) fail(file, `${id}: layer has no transparency`);
          } catch (e) { fail(file, `${id} layer: ${e.message}`); }
        }
      }
      if (it.layer.svg) {
        const rel = exists(file, it.layer.svg, `${id} svg layer`);
        if (rel) {
          try { const v = svgViewBox(rel); if (Math.abs(v.w / v.h - aspect) > 0.002) fail(file, `${id}: svg viewBox ${v.w}×${v.h} does not match the base aspect`); }
          catch (e) { fail(file, `${id} svg: ${e.message}`); }
        }
      }
    }
    if (typeof it.layer === "string") exists(file, it.layer, `${id} layer`);

    if ("x" in it || "y" in it) { if (!pct(it.x) || !pct(it.y)) fail(file, `${id}: x/y outside 0..100`); }
    if (it.tapArea) checkTap(file, id, it.label, it.tapArea, aspect, "map", it.holes);
    if (it.inset) {
      const inset = j.insets?.[it.inset.id];
      if (!inset) fail(file, `${id}: unknown inset ${it.inset.id}`);
      const rel = exists(file, it.inset.image || inset?.image, `${id} inset image`);
      let ia = 2;
      if (rel) { try { const im = webpInfo(rel); ia = im.w / im.h; } catch (e) { fail(file, `${id} inset: ${e.message}`); } }
      checkTap(file, id, it.inset.label, it.inset.tapArea, ia, "inset");
    }
  }
  for (const [name, inset] of Object.entries(j.insets || {})) {
    exists(file, inset.image, `inset ${name}`);
    for (const m of inset.magnifier || []) if (!pct(m.x) || !pct(m.y)) fail(file, `inset ${name}: magnifier point outside the map`);
  }

  // Continents and oceans never share a tap area: a point inside a continent must not count for an ocean.
  // Grid every 0.5%; points closer than OVERLAP_TOL to a polygon edge are coastline simplification and are skipped.
  const conts = items.filter(it => it.kind === "continent" && it.tapArea), oceans = items.filter(it => it.kind === "ocean" && it.tapArea);
  if (conts.length && oceans.length) {
    const inArea = (it, pt) => it.tapArea.some(p => pointInPoly(pt, p)) && !(it.holes || []).some(h => pointInPoly(pt, h));
    const edgeDist = (polys, pt) => Math.min(...polys.flatMap(p => p.map((a, i) => {
      const b = p[(i + 1) % p.length], ax = b[0] - a[0], ay = (b[1] - a[1]) / aspect, px = pt.x - a[0], py = (pt.y - a[1]) / aspect;
      const t = Math.max(0, Math.min(1, (px * ax + py * ay) / ((ax * ax + ay * ay) || 1e-12)));
      return Math.hypot(px - ax * t, py - ay * t);
    })));
    const bad = new Map();
    for (let x = 0.25; x < 100; x += 0.5) for (let y = 0.25; y < 100; y += 0.5) {
      const pt = { x, y }, c = conts.find(it => inArea(it, pt)); if (!c) continue;
      const o = oceans.find(it => inArea(it, pt)); if (!o) continue;
      if (edgeDist([...c.tapArea, ...o.tapArea, ...(o.holes || [])], pt) > OVERLAP_TOL) bad.set(`${c.id}/${o.id}`, (bad.get(`${c.id}/${o.id}`) || 0) + 1);
    }
    for (const [pair, n] of bad) fail(file, `${pair}: continent and ocean tap areas overlap (${n} grid points)`);
  }

  // Lambert maps with lon/lat: x/y must follow one linear transform of the projection.
  const proj = lambert(j.source);
  const geo = items.filter(it => Number.isFinite(it.lon) && Number.isFinite(it.lat) && pct(it.x) && pct(it.y));
  if (proj && geo.length >= 3) {
    const P = geo.map(it => proj(it.lon, it.lat));
    const fx = linearFit(P.map(p => p[0]), geo.map(it => it.x)), fy = linearFit(P.map(p => p[1]), geo.map(it => it.y));
    for (const [i, it] of geo.entries()) {
      const dx = fx[0] * P[i][0] + fx[1] - it.x, dy = fy[0] * P[i][1] + fy[1] - it.y;
      if (Math.hypot(dx, dy) > 0.25) fail(file, `${it.id}: x/y is ${Math.hypot(dx, dy).toFixed(2)}% away from its lon/lat on this projection`);
    }
  }
}

for (const [file, list] of smallTaps)
  notes.push(`${file}: ${list.length} tap areas under ${MIN_TAP_PX}px on a ${MAP_WIDTH_PX}px map, the app must add screen-space touch tolerance: ${list.join(", ")}`);
for (const n of notes) console.log("note: " + n);
if (errors.length) {
  console.error(`Map data validation failed (${errors.length}):`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log(`PASS: ${files.length} map files, ${itemCount} objects; assets, layers, ids, names, coordinates and tap areas valid${notes.length ? ` (${notes.length} notes above)` : ""}.`);
