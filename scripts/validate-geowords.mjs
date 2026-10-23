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
if (errors.length) { console.error("GeoWords validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
console.log(`GeoWords validation passed: ${count} puzzles, letters, clue order and approvals valid.`);
