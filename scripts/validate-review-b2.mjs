// Validates the block 2 «Europe» review (data/review/b2-block.json) and its Challenge rules (data/challenge/b2-block.json):
// every place is one of the 78 places of sections 1-5 (or a sea / strait of block 1 as a river's mouth), Crimea never appears,
// true/false and record texts are complete in EN and RU, select-all answers and neutral places do not overlap, the Speed Hunt pool
// holds only countries and rivers drawn on the capitals map, and every approved item still matches its approval hash.
import fs from "node:fs";
import crypto from "node:crypto";

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const errors = [], err = m => errors.push(m);
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
const sha = v => crypto.createHash("sha256").update(pyJson(v), "utf8").digest("hex").slice(0, 16);
const bare = it => Object.fromEntries(Object.entries(it).filter(([k]) => k !== "approval"));
const ids = f => read(`data/maps/${f}`).items.map(o => o.id);
const s1 = ids("europe-overview.json"), rivers = ids("europe-rivers.json"), ranges = ids("europe-mountains.json");
const countries = [...ids("europe-countries.json"), ...ids("europe-countries-5.json")];
const known = new Set([...s1, ...rivers, ...ranges, ...countries]), mouths = new Set(["black-sea", "english-channel"]);
const checkApproval = (name, it, content) => {
  if (!it.approval || !["draft", "approved"].includes(it.approval.status)) err(`${name}: approval status must be draft or approved`);
  if (it.approval?.status === "approved") {
    if (!(it.approval.by && it.approval.date)) err(`${name}: incomplete approval`);
    else if (sha(content) !== it.approval.contentSha256) err(`${name}: changed after approval — needs re-approval`);
  }
};
const both = (name, o, keys) => { for (const k of keys) for (const l of ["en", "ru"]) if (!o[k]?.[l]?.trim()) err(`${name}: missing ${k}.${l}`); };

const R = read("data/review/b2-block.json");
const lessonIds = R.lessons.map(l => l.id).join();
if (lessonIds !== "lesson-1-nature,lesson-2-countries,lesson-3-relations,lesson-4-records,block-final") err(`lessons are ${lessonIds}`);
for (const l of R.lessons) if (l.tasks && l.tasks.reduce((s, t) => s + t.count, 0) !== 10) err(`${l.id} must have 10 tasks`);
const seen = new Set(), uniq = id => { if (seen.has(id)) err(`duplicate id ${id}`); seen.add(id); };
const RELS = { flowsInto: [rivers.concat("ural-river"), [...s1, ...mouths]], capitalOn: [countries, rivers], inCountry: [[...s1, ...ranges], countries] };
for (const r of R.relations) {
  uniq(r.id);
  const [subj, obj] = RELS[r.relation] || [];
  if (!subj) { err(`${r.id}: unknown relation ${r.relation}`); continue; }
  if (!subj.includes(r.subject)) err(`${r.id}: subject ${r.subject} is not allowed for ${r.relation}`);
  for (const o of [r.object].flat()) if (!obj.includes(o)) err(`${r.id}: object ${o} is not allowed for ${r.relation}`);
  checkApproval(r.id, r, bare(r));
}
for (const p of R.trueFalse) { uniq(p.id); if (!known.has(p.subject)) err(`${p.id}: unknown subject ${p.subject}`); both(p.id, p, ["true", "false"]); checkApproval(p.id, p, bare(p)); }
for (const t of R.selectAll) {
  uniq(t.id); both(t.id, t, ["task"]);
  const pool = t.map === "countries" ? countries : t.map === "rivers" ? rivers : null;
  if (!pool) err(`${t.id}: map must be countries or rivers`);
  for (const id of [...t.want, ...t.neutral]) if (pool && !pool.includes(id)) err(`${t.id}: ${id} is not on the ${t.map} map`);
  if (t.want.some(id => t.neutral.includes(id))) err(`${t.id}: a place is both an answer and neutral`);
  checkApproval(t.id, t, bare(t));
}
for (const t of R.traps) {
  uniq(t.id); both(t.id, t, ["question", "explain"]);
  if (!countries.includes(t.country)) err(`${t.id}: unknown country ${t.country}`);
  if (!t.options.includes(t.answer) || t.options.some(o => !known.has(o))) err(`${t.id}: options must be known places and include the answer`);
  checkApproval(t.id, t, bare(t));
}
for (const r of R.records) { uniq(r.id); if (!known.has(r.object)) err(`${r.id}: unknown object ${r.object}`); both(r.id, r, ["clue", "true", "false"]); checkApproval(r.id, r, bare(r)); }
if (R.records.length < 14) err("lesson-4-records needs at least 14 records (4 + 2×3 + 2 + 2)");
// Crimea is a peninsula only: never in a country task (Svetlana, 26.10.2026)
if (JSON.stringify([R.relations, R.selectAll, R.traps, R.trueFalse]).includes("crimea")) err("Crimea appears in a relation or country task");

const C = read("data/challenge/b2-block.json"), sh = C.speedHunt;
if (sh.durationSeconds !== 60) err("Speed Hunt must be 60 seconds");
const pool = Object.values(sh.pool).flat();
if (new Set(pool).size !== pool.length) err("Speed Hunt pool repeats a place");
if (pool.length !== sh.poolSize) err(`Speed Hunt poolSize ${sh.poolSize} but ${pool.length} places`);
for (const id of pool) if (!countries.includes(id) && !rivers.includes(id)) err(`Speed Hunt ${id} is not a country or river of the capitals map`);
if (!sh.stars.thresholds.every((v, i, a) => !i || v > a[i - 1])) err("star thresholds must rise");
if (C.status === "approved" && !(C.approval?.status === "approved" && sha({ speedHunt: C.speedHunt, geowords: C.geowords }) === C.approval.contentSha256)) err("Challenge rules changed after approval");

if (errors.length) { console.error("Block 2 review validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
const n = [R.relations, R.trueFalse, R.selectAll, R.traps, R.records].flat(), a = n.filter(i => i.approval?.status === "approved").length;
console.log(`Block 2 review validation passed: ${n.length} items (${a} approved), Speed Hunt pool of ${pool.length}.`);
