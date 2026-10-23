// Validates app-built GeoWords puzzles in data/geowords/*.json: markers spell the answer by clue position,
// every position is used once, clue markers exist, coordinates are on the map, reveal order is not
// sequential, and each approval still matches the exact approved content.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir = path.join(process.cwd(), "data/geowords");
if (!fs.existsSync(dir)) { console.log("No data/geowords directory: nothing to validate."); process.exit(0); }
const errors = [];
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
let count = 0;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  for (const p of j.puzzles || []) {
    count++;
    const id = p.id, word = [...(p.answer || "")], n = word.length, err = m => errors.push(`${file}: ${id} ${m}`);
    const markers = Object.fromEntries((p.markers || []).map(m => [m.id, m]));
    if (Object.keys(markers).length !== n) err(`has ${Object.keys(markers).length} markers for ${n} letters`);
    for (const m of p.markers || []) if (!(m.x >= 0 && m.x <= 100 && m.y >= 0 && m.y <= 100)) err(`marker ${m.id} is off the map`);
    for (const l of p.layers || []) if (!fs.existsSync(path.join(process.cwd(), l.replace(/^\.\//, "")))) console.log(`note: ${file}: ${id} layer ${l} not in this branch yet`);
    const order = (p.clues || []).map(c => c.position);
    if ([...order].sort((a, b) => a - b).join() !== word.map((_, i) => i + 1).join()) err("clue positions must use 1..n once each");
    for (const c of p.clues || []) {
      const m = markers[c.markerId];
      if (!m) { err(`clue for missing marker ${c.markerId}`); continue; }
      if (m.letter !== word[c.position - 1]) err(`marker ${m.id} has ${m.letter}, position ${c.position} needs ${word[c.position - 1]}`);
      if (!c.text?.trim()) err(`empty clue text for position ${c.position}`);
    }
    for (let i = 1; i < order.length; i++) if (Math.abs(order[i] - order[i - 1]) === 1) err(`reveals neighbours ${order[i - 1]} and ${order[i]} in a row`);
    const firstAt = order.indexOf(1);
    if (n >= 7 ? firstAt < n - 3 : firstAt < n - 2) err("reveals the first letter too early");
    if (order.slice(0, n >= 7 ? 3 : 2).includes(n)) err("reveals the last letter too early");
    if (p.approval?.status === "approved") {
      const sha = crypto.createHash("sha256").update(pyJson({ answer: p.answer, markers: p.markers, clues: p.clues }), "utf8").digest("hex").slice(0, 16);
      if (sha !== p.approval.contentSha256) err("changed after approval — needs re-approval");
    }
  }
}
// Placement rules (Svetlana, 2026-10-23): a sea's circle sits at the centre of the sea (its label point, within 1.5% of map
// width), and no letter lies inside another object of the same puzzle (checked here for seas and straits, whose tap
// areas are in data/maps; the generator also checks continents, oceans, rivers and mountains).
const ASP = 1211 / 2200, near = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * ASP);
const readMap = (f, key) => { const p = path.join(process.cwd(), "data/maps", f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8"))[key] || [] : []; };
const seas = Object.fromEntries(readMap("world-waters.json", "waters").map(w => [w.id, w]));
const areas = Object.fromEntries([...Object.values(seas), ...readMap("world-straits.json", "items").filter(s => !s.inset)].map(o => [o.id, o.tapArea]));
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  for (const p of JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")).puzzles || []) {
    const ms = (p.markers || []).filter(m => !m.inset);
    for (const m of ms) {
      if (seas[m.id] && near(m, seas[m.id].label) > 1.5) errors.push(`${file}: ${p.id} circle for ${m.id} is not at the centre of the sea`);
      for (const o of ms) if (o !== m && areas[o.id] && polys(areas[o.id]).some(pl => inPoly(m.x, m.y, pl))) errors.push(`${file}: ${p.id} letter on ${m.id} lies inside ${o.id}`);
    }
  }
}
if (errors.length) { console.error("GeoWords validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
console.log(`GeoWords validation passed: ${count} puzzles, letters, clue order and approvals valid.`);
