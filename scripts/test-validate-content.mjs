// Negative tests for validate-content.mjs: each broken copy of the release package must fail.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const src = path.join(process.cwd(), "data/content/section-1-facts.json");
const base = JSON.parse(fs.readFileSync(src, "utf8"));
const run = data => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-content-"));
  fs.writeFileSync(path.join(dir, "section-1-facts.json"), JSON.stringify(data));
  const r = spawnSync(process.execPath, ["scripts/validate-content.mjs"], { env: { ...process.env, CONTENT_DIR: dir }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
};
const edit = f => { const d = structuredClone(base); f(d); return d; };
const card = (d, id) => d.items.find(i => i.id === id);
const cases = {
  "empty package": edit(d => { d.items = []; }),
  "card removed": edit(d => { d.items = d.items.filter(i => i.id !== "africa"); }),
  "card id changed": edit(d => { card(d, "africa").id = "afrika"; }),
  "approval removed and text changed": edit(d => { const c = card(d, "asia"); delete c.approval; c.fact.ru += "!"; }),
  "unknown approval status": edit(d => { card(d, "asia").approval.status = "ok"; }),
  "text changed after approval": edit(d => { card(d, "asia").fact.ru += "!"; }),
  "disputed missing": edit(d => { delete card(d, "europe").disputed; }),
  "disputed without caveat": edit(d => { delete card(d, "europe").caveat; }),
  "wrong section": edit(d => { d.section = "rivers"; }),
  "changing record without a year": edit(d => { card(d, "asia").category = "changing"; }),
  "unknown record category": edit(d => { card(d, "asia").category = "maybe"; }),
  "disputed mark removed, old approval kept": edit(d => { card(d, "atlantic-ocean").disputed = false; }),
};
const script = "scripts/validate-content.mjs";
const runRaw = setup => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-missing-"));
  setup(dir);
  const r = spawnSync(process.execPath, [script], { env: { ...process.env, CONTENT_DIR: dir }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
};
const failed = [];
if (runRaw(() => {}) === 0) failed.push("missing release file should fail");
if (runRaw(dir => fs.rmSync(dir, { recursive: true, force: true })) === 0) failed.push("missing directory should fail");
if (run(base) !== 0) failed.push("unchanged package should pass");
for (const [name, data] of Object.entries(cases)) if (run(data) === 0) failed.push(`${name} should fail`);
if (failed.length) { console.error("Content validator tests failed:\n" + failed.map(f => "- " + f).join("\n")); process.exit(1); }
console.log(`Content validator tests passed: ${Object.keys(cases).length} broken packages rejected, missing file and directory rejected.`);
