// Negative tests for validate-dictionary.mjs: each broken copy of the release package must fail.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const src = path.join(process.cwd(), "data/dictionary/section-1.json");
const base = JSON.parse(fs.readFileSync(src, "utf8"));
const run = data => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-dictionary-"));
  fs.writeFileSync(path.join(dir, "section-1.json"), JSON.stringify(data));
  const r = spawnSync(process.execPath, ["scripts/validate-dictionary.mjs"], { env: { ...process.env, DICTIONARY_DIR: dir }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
};
const edit = f => { const d = structuredClone(base); f(d); return d; };
const firstWord = (d, lang) => d.units[0].words[lang][0];
const cases = {
  "no units": edit(d => { d.units = []; }),
  "unit removed": edit(d => { d.units.splice(1, 1); }),
  "unit id duplicated": edit(d => { d.units[1].id = d.units[0].id; }),
  "language removed from a unit": edit(d => { delete d.units[2].words.ru; }),
  "section final removed": edit(d => { d.units.pop(); }),
  "approval removed and definition changed": edit(d => { const w = firstWord(d, "en"); delete w.approval; w.definition += "!"; }),
  "unknown approval status": edit(d => { firstWord(d, "ru").approval.status = "ok"; }),
  "definition changed after approval": edit(d => { firstWord(d, "ru").definition += "!"; }),
  "wrong section": edit(d => { d.section = "rivers"; }),
};
const failed = [];
if (run(base) !== 0) failed.push("unchanged package should pass");
for (const [name, data] of Object.entries(cases)) if (run(data) === 0) failed.push(`${name} should fail`);
if (failed.length) { console.error("Dictionary validator tests failed:\n" + failed.map(f => "- " + f).join("\n")); process.exit(1); }
console.log(`Dictionary validator tests passed: ${Object.keys(cases).length} broken packages rejected.`);
