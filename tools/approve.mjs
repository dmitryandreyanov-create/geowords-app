// Marks items of a content / dictionary / GeoWords file as approved by Svetlana with the hash the validators check.
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
// GeoWords puzzles: the approval covers what the child sees (validate-geowords.mjs)
for (const p of j.puzzles || []) if (want(p.id)) { p.approval = approval(sha({ answer: p.answer, markers: p.markers, clues: p.clues, map: p.map, mapAspect: p.mapAspect,
  layers: p.layers, language: p.language, showInsets: p.showInsets })); n++; }
for (const u of j.units || []) for (const lang of ["en", "ru"]) for (const w of u.words?.[lang] || [])
  if (want(w.answer)) { w.approval = approval(sha({ answer: w.answer, definition: w.definition })); n++; }
// Block review (data/review/b2-block.json): each relation, true/false pair, select-all task, trap and record — the hash covers the item without its approval
const bare = it => Object.fromEntries(Object.entries(it).filter(([k]) => k !== "approval"));
for (const key of ["relations", "trueFalse", "selectAll", "traps", "records"]) if (Array.isArray(j[key]) && ["europe-2", "asia-3"].includes(j.block))
  for (const it of j[key]) if (want(it.id)) { it.approval = approval(sha(bare(it))); n++; }
// Challenge rules (data/challenge/b2-block.json): the hash covers the Speed Hunt rules and the GeoWords rules
if (j.speedHunt && ["europe-2", "asia-3"].includes(j.block) && want("challenge")) { j.approval = approval(sha({ speedHunt: j.speedHunt, geowords: j.geowords })); j.status = "approved"; n++; }
// Block 3 review: the lessons open once every item of the review is approved (status, read by ready21 in app/app.js)
if (j.block === "asia-3" && j.unit === "block-review" && ["relations", "trueFalse", "selectAll", "traps", "records"].every(k => j[k].every(it => it.approval?.status === "approved"))) j.status = "approved";
fs.writeFileSync(file, JSON.stringify(j, null, 1) + "\n");
console.log(`approved ${n} in ${file}`);
