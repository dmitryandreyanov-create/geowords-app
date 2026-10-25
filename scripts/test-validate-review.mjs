// Negative tests for validate-review.mjs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const src = path.join(process.cwd(), "data/review/block-1.json");
const base = JSON.parse(fs.readFileSync(src, "utf8"));
const run = data => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-review-"));
  if (data) fs.writeFileSync(path.join(dir, "block-1.json"), JSON.stringify(data));
  const r = spawnSync(process.execPath, ["scripts/validate-review.mjs"], { env: { ...process.env, REVIEW_DIR: dir }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
};
const edit = f => { const d = structuredClone(base); f(d); return d; };
const rel = (d, subject, relation) => d.relations.find(r => JSON.stringify(r.subject) === JSON.stringify(subject) && r.relation === relation);
const cases = {
  "package missing": null,
  "card text edited after approval": edit(d => { d.cards[0].text.ru += " "; }),
  "card without Russian text": edit(d => { delete d.cards[0].text.ru; }),
  "lesson removed": edit(d => { d.lessons.splice(2, 1); }),
  "relation removed under a true/false pair": edit(d => { d.relations = d.relations.filter(r => !(r.subject === "volga" && r.relation === "flowsInto")); }),
  "neutral relation turned into an answer": edit(d => { const r = rel(d, "hudson-bay", "inOcean"); r.use = "yes"; }),
  "unknown object": edit(d => { d.relations[0].object = "atlantis"; }),
  "after-card without a card": edit(d => { delete rel(d, "mediterranean-sea", "inOcean").requiresCard; }),
  "true/false text changed after approval": edit(d => { d.trueFalse.pairs[0].true.ru += "!"; }),
  "true/false pair without approval": edit(d => { delete d.trueFalse.pairs[1].approval; }),
  "true/false missing a language": edit(d => { delete d.trueFalse.pairs[2].false.en; }),
};
const failed = [];
if (run(base) !== 0) failed.push("unchanged data should pass");
for (const [name, data] of Object.entries(cases)) if (run(data) === 0) failed.push(`${name} should fail`);
if (failed.length) { console.error("Review validator tests failed:\n" + failed.map(f => "- " + f).join("\n")); process.exit(1); }
console.log(`Review validator tests passed: ${Object.keys(cases).length} broken copies rejected.`);
