// Validates data/dictionary/*.json: unit shape (1 final + 6 review per language), single-word answers,
// no duplicate answers per language, definitions present, and that each approval still matches its text.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir = path.join(process.cwd(), "data/dictionary");
if (!fs.existsSync(dir)) { console.log("No data/dictionary directory: nothing to validate."); process.exit(0); }
const errors = [];
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
// Same serialisation as Python json.dumps(..., ensure_ascii=False, sort_keys=True)
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
const LETTERS = { en: /^[A-Z]+$/, ru: /^[А-ЯЁ]+$/ };
let count = 0;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  for (const lang of ["en", "ru"]) {
    const seen = new Set();
    for (const u of j.units || []) {
      const words = u.words?.[lang] || [];
      const finals = words.filter(w => w.role === "final").length;
      const reviews = words.filter(w => w.role === "review").length;
      const sectionFinal = words.filter(w => w.role === "section-final").length;
      if (sectionFinal ? words.length !== 1 : finals !== 1 || reviews !== 6)
        errors.push(`${file}: ${u.id} ${lang} must have 1 final + 6 review words (or one section-final)`);
      for (const w of words) {
        count++;
        if (!LETTERS[lang].test(w.answer || "")) errors.push(`${file}: ${u.id} ${lang} "${w.answer}" is not one word in capitals`);
        const key = (w.answer || "").replace(/Ё/g, "Е");
        if (seen.has(key)) errors.push(`${file}: ${lang} answer ${w.answer} is used twice`); seen.add(key);
        if (!w.definition?.trim()) errors.push(`${file}: ${w.answer} has no definition`);
        if (w.approval?.status === "approved") {
          const sha = crypto.createHash("sha256").update(pyJson({ answer: w.answer, definition: w.definition }), "utf8").digest("hex").slice(0, 16);
          if (sha !== w.approval.contentSha256) errors.push(`${file}: ${w.answer} changed after approval — needs re-approval`);
        }
      }
    }
  }
}
if (errors.length) { console.error("Dictionary validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
console.log(`Dictionary validation passed: ${count} words, approvals match their text.`);
