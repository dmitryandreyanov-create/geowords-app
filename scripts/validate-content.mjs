// Validates teaching content in data/content/*.json: ids, EN/RU text, caveats for disputed facts,
// and that each approval still matches the exact approved text (approval.contentSha256).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir = path.join(process.cwd(), "data/content");
if (!fs.existsSync(dir)) { console.log("No data/content directory: nothing to validate."); process.exit(0); }
const errors = [];
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
// Same serialisation as Python json.dumps(..., ensure_ascii=False, sort_keys=True)
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
let count = 0;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const seen = new Set();
  for (const it of j.items || []) {
    count++;
    const id = it.id || "(no id)";
    if (seen.has(id)) errors.push(`${file}: duplicate id ${id}`); seen.add(id);
    for (const k of ["name", "fact"]) for (const lang of ["en", "ru"])
      if (!it[k]?.[lang]?.trim()) errors.push(`${file}: ${id} missing ${k}.${lang}`);
    if (it.disputed && !(it.caveat?.en?.trim() && it.caveat?.ru?.trim())) errors.push(`${file}: ${id} is disputed but has no EN/RU caveat`);
    if (it.approval?.status === "approved") {
      const payload = pyJson({ fact: it.fact, caveat: it.caveat ?? null, name: it.name });
      const sha = crypto.createHash("sha256").update(payload, "utf8").digest("hex").slice(0, 16);
      if (sha !== it.approval.contentSha256) errors.push(`${file}: ${id} text changed after approval — needs re-approval`);
    }
  }
}
if (errors.length) { console.error("Content validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
console.log(`Content validation passed: ${count} items, approvals match their text.`);
