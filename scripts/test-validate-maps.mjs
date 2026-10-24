// Negative tests for validate-maps.mjs on the continents and oceans map: broken copies must fail.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const srcDir = path.join(process.cwd(), "data/maps"), FILE = "world-continents-oceans.json";
const base = JSON.parse(fs.readFileSync(path.join(srcDir, FILE), "utf8"));
const run = data => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-maps-"));
  fs.copyFileSync(path.join(srcDir, FILE), path.join(dir, FILE));
  fs.writeFileSync(path.join(dir, FILE), JSON.stringify(data));
  const r = spawnSync(process.execPath, ["scripts/validate-maps.mjs"], { env: { ...process.env, MAPS_DIR: dir }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
};
const edit = f => { const d = structuredClone(base); f(d); return d; };
const item = (d, id) => d.items.find(i => i.id === id);
const cases = {
  "islands not cut out of the oceans": edit(d => { for (const it of d.items) delete it.holes; }),
  "hole outside its ocean": edit(d => { item(d, "pacific-ocean").holes.push([[46, 46], [47, 46], [47, 47]]); }),
};
const failed = [];
if (run(base) !== 0) failed.push("unchanged map should pass");
for (const [name, data] of Object.entries(cases)) if (run(data) === 0) failed.push(`${name} should fail`);
if (failed.length) { console.error("Map validator tests failed:\n" + failed.map(f => "- " + f).join("\n")); process.exit(1); }
console.log(`Map validator tests passed: ${Object.keys(cases).length} broken maps rejected.`);
