// Marks items of a content / dictionary file as approved by Svetlana with the hash the validators check.
// usage: node tools/approve.mjs <file> <date> [ids-or-answers...]   (no ids: every item / word in the file)
import fs from "node:fs";
import crypto from "node:crypto";

const [file, date, ...only] = process.argv.slice(2);
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
const sha = v => crypto.createHash("sha256").update(pyJson(v), "utf8").digest("hex").slice(0, 16);
const approval = h => ({ status: "approved", by: "Svetlana", date, contentSha256: h });
const want = k => !only.length || only.includes(k);
const j = JSON.parse(fs.readFileSync(file, "utf8"));
let n = 0;
for (const it of j.items || []) if (want(it.id)) { it.approval = approval(sha({ id: it.id, fact: it.fact, caveat: it.caveat ?? null, disputed: it.disputed, name: it.name })); n++; }
for (const u of j.units || []) for (const lang of ["en", "ru"]) for (const w of u.words?.[lang] || [])
  if (want(w.answer)) { w.approval = approval(sha({ answer: w.answer, definition: w.definition })); n++; }
fs.writeFileSync(file, JSON.stringify(j, null, 1) + "\n");
console.log(`approved ${n} in ${file}`);
