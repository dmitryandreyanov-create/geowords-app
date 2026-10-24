// Validates data/challenge/*.json (block Challenge: Speed Hunt rules) and the Challenge GeoWords sample:
// Speed Hunt pool ids exist on the maps and are unique, poolSize matches, inset straits are excluded,
// star thresholds rise, and the sample never uses a changing record (oil, cargo, sediment) as a clue.
import fs from "node:fs";
import path from "node:path";

const dir = process.env.CHALLENGE_DIR || path.join(process.cwd(), "data/challenge");
const mapsDir = process.env.MAPS_DIR || path.join(process.cwd(), "data/maps");
const gwDir = process.env.GEOWORDS_DIR || path.join(process.cwd(), "data/geowords");
const RELEASE = ["block-1.json"];
const errors = [];
const readMap = (f, key) => { const p = path.join(mapsDir, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8"))[key] || [] : null; };
const known = new Set(["asia", "africa", "north-america", "south-america", "antarctica", "europe", "australia",
  "pacific-ocean", "atlantic-ocean", "indian-ocean", "arctic-ocean", "southern-ocean"]);
for (const [f, key] of [["world-rivers.json", "rivers"], ["world-mountains.json", "mountains"], ["world-waters.json", "waters"], ["world-straits.json", "items"]]) {
  const items = readMap(f, key);
  if (!items) errors.push(`missing map ${f}`); else for (const it of items) known.add(it.id);
}
const insetIds = new Set((readMap("world-straits.json", "items") || []).filter(s => s.inset).map(s => s.id));
if (!fs.existsSync(dir)) errors.push(`missing directory ${dir}`);
for (const file of RELEASE) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) { errors.push(`${file}: required release package is missing`); continue; }
  const j = JSON.parse(fs.readFileSync(p, "utf8")), sh = j.speedHunt, err = m => errors.push(`${file}: ${m}`);
  if (!(j.status === "approved" && j.approvedBy && j.approvedDate)) err("no complete approval");
  if (!sh) { err("no speedHunt rules"); continue; }
  if (sh.durationSeconds !== 60) err("Speed Hunt round must be 60 seconds");
  const pool = Object.values(sh.pool || {}).flat();
  if (!pool.length) err("empty Speed Hunt pool");
  if (new Set(pool).size !== pool.length) err("an object appears twice in the Speed Hunt pool");
  if (sh.poolSize !== pool.length) err(`poolSize ${sh.poolSize} but the pool has ${pool.length} objects`);
  for (const id of pool) if (!known.has(id)) err(`unknown object ${id} in the Speed Hunt pool`);
  for (const id of pool) if (insetIds.has(id)) err(`${id} is answered in an inset and must not be in Speed Hunt`);
  for (const id of insetIds) if (!(sh.excluded?.ids || []).includes(id)) err(`inset object ${id} must be listed in excluded`);
  const t = sh.stars?.thresholds || [];
  if (t.length !== 3 || !(t[0] < t[1] && t[1] < t[2])) err("three rising star thresholds expected");
}
const sample = path.join(gwDir, "challenge-block-1-sample.json");
if (fs.existsSync(sample)) {
  for (const p of JSON.parse(fs.readFileSync(sample, "utf8")).puzzles || [])
    for (const c of p.clues || []) if (/\boil\b|нефт|sediment|наносов|cargo|грузооборот/i.test(c.text))
      errors.push(`challenge sample: ${p.id} uses a changing record as a clue: "${c.text}"`);
}
if (errors.length) { console.error("Challenge validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
console.log("Challenge validation passed: Speed Hunt pool and sample clues valid.");
