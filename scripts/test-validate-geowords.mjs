// Negative tests for validate-geowords.mjs: each broken copy of the GeoWords data must fail.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const src = path.join(process.cwd(), "data/geowords"), FILE = "section-1.json";
const base = JSON.parse(fs.readFileSync(path.join(src, FILE), "utf8"));
const run = (data, { maps, drop } = {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-geowords-"));
  for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(dir, f));
  if (drop) fs.rmSync(path.join(dir, drop)); else fs.writeFileSync(path.join(dir, FILE), JSON.stringify(data));
  const env = { ...process.env, GEOWORDS_DIR: dir };
  let mdir;
  if (maps) {
    mdir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-maps-"));
    for (const f of fs.readdirSync(path.join(process.cwd(), "data/maps"))) fs.copyFileSync(path.join(process.cwd(), "data/maps", f), path.join(mdir, f));
    fs.writeFileSync(path.join(mdir, "world-continents-oceans.json"), JSON.stringify(maps));
    Object.assign(env, { MAPS_DIR: mdir, GEOWORDS_ASSETS: "lenient" });
  }
  const r = spawnSync(process.execPath, ["scripts/validate-geowords.mjs"], { env, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true }); if (mdir) fs.rmSync(mdir, { recursive: true, force: true });
  return r.status;
};
const edit = f => { const d = structuredClone(base); f(d); return d; };
const puzzle = (d, id) => d.puzzles.find(p => p.id === id);
// A tiny continents-and-oceans map: Antarctica is the strip below y = 95, the Southern Ocean above it.
const miniMap = { items: [
  { id: "antarctica", kind: "continent", tapArea: [[[0, 95], [100, 95], [100, 100], [0, 100]]] },
  { id: "southern-ocean", kind: "ocean", tapArea: [[[0, 85], [100, 85], [100, 95], [0, 95]]], holes: [] }] };
const cases = {
  "empty package": [edit(d => { d.puzzles = []; })],
  "package file missing": [base, { drop: FILE }],
  "section final removed": [edit(d => { d.puzzles = d.puzzles.filter(p => p.id !== "section-1-final-en"); })],
  "approval removed": [edit(d => { delete puzzle(d, "section-1-unit-2-en").approval; })],
  "marker moved after approval": [edit(d => { puzzle(d, "section-1-unit-2-en").markers[0].x += 1; })],
  "map changed after approval": [edit(d => { puzzle(d, "section-1-unit-2-en").map = "./assets/other-map.webp"; })],
  "layer removed after approval": [edit(d => { puzzle(d, "section-1-unit-1-en").layers.pop(); })],
  "language changed after approval": [edit(d => { puzzle(d, "section-1-unit-2-en").language = "ru"; })],
  "Antarctica letter in the ocean": [edit(d => {}), { maps: { ...miniMap, items: miniMap.items.map(i => i.id === "antarctica" ? { ...i, tapArea: [[[0, 99], [100, 99], [100, 100], [0, 100]]] } : i) } }],
};
const failed = [];
if (run(base) !== 0) failed.push("unchanged data should pass");
if (run(base, { maps: miniMap }) !== 0) failed.push("unchanged data with a matching map should pass");
for (const [name, [data, opts]] of Object.entries(cases)) if (run(data, opts) === 0) failed.push(`${name} should fail`);
if (failed.length) { console.error("GeoWords validator tests failed:\n" + failed.map(f => "- " + f).join("\n")); process.exit(1); }
console.log(`GeoWords validator tests passed: ${Object.keys(cases).length} broken copies rejected.`);
