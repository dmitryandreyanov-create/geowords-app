// Negative tests for validate-challenge.mjs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const src = path.join(process.cwd(), "data/challenge/block-1.json"), gw = path.join(process.cwd(), "data/geowords");
const base = JSON.parse(fs.readFileSync(src, "utf8"));
const sample = JSON.parse(fs.readFileSync(path.join(gw, "challenge-block-1-sample.json"), "utf8"));
const run = (data, sampleData = sample) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-ch-")), g = fs.mkdtempSync(path.join(os.tmpdir(), "gw-chs-"));
  if (data) fs.writeFileSync(path.join(dir, "block-1.json"), JSON.stringify(data));
  fs.writeFileSync(path.join(g, "challenge-block-1-sample.json"), JSON.stringify(sampleData));
  const r = spawnSync(process.execPath, ["scripts/validate-challenge.mjs"], { env: { ...process.env, CHALLENGE_DIR: dir, GEOWORDS_DIR: g }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(g, { recursive: true, force: true });
  return r.status;
};
const edit = f => { const d = structuredClone(base); f(d); return d; };
const cases = {
  "package missing": [null],
  "unknown object in the pool": [edit(d => { d.speedHunt.pool.rivers.push("thames"); d.speedHunt.poolSize++; })],
  "duplicate object": [edit(d => { d.speedHunt.pool.rivers.push(d.speedHunt.pool.rivers[0]); d.speedHunt.poolSize++; })],
  "wrong poolSize": [edit(d => { d.speedHunt.poolSize++; })],
  "inset strait in the pool": [edit(d => { d.speedHunt.pool["straits-and-canals"].push("bosporus"); d.speedHunt.poolSize++; })],
  "approval removed": [edit(d => { delete d.status; })],
  "oil clue in the sample": [base, (() => { const s = structuredClone(sample); s.puzzles[0].clues[0].text = "Find the first letter in the strait that carries the most oil."; return s; })()],
};
const failed = [];
if (run(base) !== 0) failed.push("unchanged data should pass");
for (const [name, args] of Object.entries(cases)) if (run(...args) === 0) failed.push(`${name} should fail`);
if (failed.length) { console.error("Challenge validator tests failed:\n" + failed.map(f => "- " + f).join("\n")); process.exit(1); }
console.log(`Challenge validator tests passed: ${Object.keys(cases).length} broken copies rejected.`);
