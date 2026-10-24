// Negative tests for validate-dictionary.mjs: each broken copy of the release package must fail.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const src = path.join(process.cwd(), "data/dictionary/section-1.json");
const base = JSON.parse(fs.readFileSync(src, "utf8"));
const run = data => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-dictionary-"));
  // the other release packages stay as they are; only section 1 is broken
  for (const f of fs.readdirSync(path.dirname(src))) fs.copyFileSync(path.join(path.dirname(src), f), path.join(dir, f));
  fs.writeFileSync(path.join(dir, "section-1.json"), JSON.stringify(data));
  const r = spawnSync(process.execPath, ["scripts/validate-dictionary.mjs"], { env: { ...process.env, DICTIONARY_DIR: dir }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
};
const edit = f => { const d = structuredClone(base); f(d); return d; };
const firstWord = (d, lang) => d.units[0].words[lang][0];
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
// Re-approve an edited word, so the case fails only on the rule under test.
const reapprove = w => { w.approval.contentSha256 = crypto.createHash("sha256").update(pyJson({ answer: w.answer, definition: w.definition }), "utf8").digest("hex").slice(0, 16); };
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
  "reserve word longer than reserveMaxLetters": edit(d => { const w = d.units[0].words.en.find(x => x.role === "reserve"); w.answer = "MERIDIANS"; reapprove(w); }),
  "reserve words without reserveMaxLetters": edit(d => { delete d.units[0].reserveMaxLetters; }),
  "unknown word role": edit(d => { d.units[0].words.en.find(x => x.role === "reserve").role = "spare"; }),
  "practiceExtra word missing from later units": edit(d => { d.units[1].practiceExtra.en.push("ZEPPELIN"); }),
  "practiceExtra word too long": edit(d => { d.units[1].practiceExtra.en.push("PERMAFROST"); }),
  "answer in its own definition (EN)": edit(d => { const w = firstWord(d, "en"); w.definition = `Like a ${w.answer.toLowerCase()}s.`; reapprove(w); }),
  "answer in its own definition (RU, other case)": edit(d => { const w = firstWord(d, "ru"); w.definition = `Похоже на ${w.answer.toLowerCase().replace(/[аеиоуыэюяьй]$/, "")}ой.`; reapprove(w); }),
};
const script = "scripts/validate-dictionary.mjs";
const runRaw = setup => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-missing-"));
  setup(dir);
  const r = spawnSync(process.execPath, [script], { env: { ...process.env, DICTIONARY_DIR: dir }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
};
const failed = [];
if (runRaw(() => {}) === 0) failed.push("missing release file should fail");
if (runRaw(dir => fs.rmSync(dir, { recursive: true, force: true })) === 0) failed.push("missing directory should fail");
if (run(base) !== 0) failed.push("unchanged package should pass");
if (run(edit(d => { const w = firstWord(d, "en"); w.definition += " "; reapprove(w); })) !== 0) failed.push("re-approved edit should pass (test helper check)");
for (const [name, data] of Object.entries(cases)) if (run(data) === 0) failed.push(`${name} should fail`);
if (failed.length) { console.error("Dictionary validator tests failed:\n" + failed.map(f => "- " + f).join("\n")); process.exit(1); }
console.log(`Dictionary validator tests passed: ${Object.keys(cases).length} broken packages rejected, missing file and directory rejected.`);
