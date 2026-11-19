// Validates the block 4 «North America» review (data/review/b4-block.json), its block-final word (data/dictionary/b4-block.json) and the
// Challenge rules (data/challenge/b4-block.json) against the plan Svetlana agreed on 18.11.2026 with her five comments:
// every place is one of the places of sections 1-7; no Yukon or Colorado in «where does it flow» (Bering Sea not taught; the Colorado
// usually does not reach the sea); the Greater Antilles task names Puerto Rico as a US territory; one record about Cuba (section 7) and the
// Greenland record in place of the section-1 one; the block-final word ПЕРВОПРОХОДЦЫ / PATHFINDERS; Greenland never a country of a task;
// every «tap all…» task lists its full answer and its border cases; records state their criterion; texts complete in EN and RU; the Speed
// Hunt pool holds the countries and rivers of the countries map (and the five large island states) with a difficulty tier each; every
// approved item still matches its approval hash.
import fs from "node:fs";
import crypto from "node:crypto";

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const errors = [], err = m => errors.push(m);
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
const sha = v => crypto.createHash("sha256").update(pyJson(v), "utf8").digest("hex").slice(0, 16);
const bare = it => Object.fromEntries(Object.entries(it).filter(([k]) => k !== "approval"));
const ids = f => read(`data/maps/${f}`).items.map(o => o.id);
const s1 = ids("namerica-overview.json"), rivers = ids("namerica-rivers.json"), lakes = ids("namerica-lakes.json"), mountains = ids("namerica-mountains.json"), deserts = ids("namerica-deserts.json");
const mainland = ids("namerica-countries.json"), islands = ids("namerica-caribbean.json"), countries = [...mainland, ...islands];
const known = new Set([...s1, ...rivers, ...lakes, ...mountains, ...deserts, ...countries]), mouths = new Set();
if (known.size !== 99) err(`sections 1-7 should hold 99 places, found ${known.size}`);
const noCap = new Set();
const checkApproval = (name, it, content) => {
  if (!it.approval || !["draft", "approved"].includes(it.approval.status)) err(`${name}: approval status must be draft or approved`);
  if (it.approval?.status === "approved") {
    if (!(it.approval.by && it.approval.date)) err(`${name}: incomplete approval`);
    else if (sha(content) !== it.approval.contentSha256) err(`${name}: changed after approval — needs re-approval`);
  }
};
const both = (name, o, keys) => { for (const k of keys) for (const l of ["en", "ru"]) if (!o[k]?.[l]?.trim()) err(`${name}: missing ${k}.${l}`); };

const R = read("data/review/b4-block.json");
const lessonIds = R.lessons.map(l => l.id).join();
if (lessonIds !== "lesson-1-map-rivers,lesson-2-lakes-mountains-deserts,lesson-3-countries,lesson-4-relations,lesson-5-records,block-final") err(`lessons are ${lessonIds}`);
for (const l of R.lessons) if (l.tasks && l.tasks.reduce((s, t) => s + t.count, 0) !== 10) err(`${l.id} must have 10 tasks`);
const seen = new Set(), uniq = id => { if (seen.has(id)) err(`duplicate id ${id}`); seen.add(id); };
const RELS = { flowsInto: [rivers, [...s1, ...lakes, ...rivers]], flowsOutOf: [rivers, lakes], inCountry: [[...s1, ...lakes, ...mountains, ...deserts], countries] };
for (const r of R.relations) {
  uniq(r.id);
  const [subj, obj] = RELS[r.relation] || [];
  if (!subj) { err(`${r.id}: unknown relation ${r.relation}`); continue; }
  if (!subj.includes(r.subject)) err(`${r.id}: subject ${r.subject} is not allowed for ${r.relation}`);
  for (const o of [r.object].flat()) if (!obj.includes(o)) err(`${r.id}: object ${o} is not allowed for ${r.relation}`);
  if (r.relation === "capitalOn" && noCap.has(r.subject)) err(`${r.id}: no capital questions about ${r.subject}`);
  if (r.label) both(r.id, r, ["label"]); if (r.note) both(r.id, r, ["note"]);
  checkApproval(r.id, r, bare(r));
}
// Svetlana 18.11.2026: no Yukon (the Bering Sea is not taught); no Colorado (it usually does not reach the Gulf of California)
for (const id of ["na-yukon", "na-colorado"]) if (R.relations.some(r => r.subject === id && r.relation === "flowsInto") || R.trueFalse.some(p => p.subject === id && p.relation === "flowsInto")) err(`${id}: not in «where does it flow»`);
if (JSON.stringify([R.relations, R.trueFalse, R.selectAll, R.traps]).includes("na-greenland")) err("Greenland is a geographic place only, never in a relation task");
for (const r of R.relations.filter(r => r.relation === "inCountry")) if ([r.object].flat().includes("na-greenland")) err(`${r.id}: Greenland is not a country`);
for (const c of R.crosses) {
  if (!rivers.includes(c.river)) err(`crosses: unknown river ${c.river}`);
  for (const o of [...c.through, ...c.along]) if (!mainland.includes(o)) err(`crosses ${c.river}: ${o} is not a country of section 6`);
  if (c.through.some(o => c.along.includes(o))) err(`crosses ${c.river}: a country both through and along`);
}
for (const p of R.trueFalse) { uniq(p.id); if (!known.has(p.subject)) err(`${p.id}: unknown subject ${p.subject}`); both(p.id, p, ["true", "false"]); checkApproval(p.id, p, bare(p)); }
for (const t of R.selectAll) {
  uniq(t.id); both(t.id, t, ["task", "borderCases"]);
  const pool = t.map === "countries" ? mainland : t.map === "caribbean" ? islands : t.map === "rivers" ? rivers : null;
  if (!pool) err(`${t.id}: map must be countries, caribbean or rivers`);
  if (t.sec !== { countries: 27, caribbean: 28, rivers: 23 }[t.map]) err(`${t.id}: sec must be the map's section`);
  for (const id of [...t.want, ...t.neutral]) if (pool && !pool.includes(id)) err(`${t.id}: ${id} is not on the ${t.map} map`);
  if (t.want.some(id => t.neutral.includes(id))) err(`${t.id}: a place is both an answer and neutral`);
  checkApproval(t.id, t, bare(t));
}
for (const t of R.traps) {
  uniq(t.id); both(t.id, t, ["question", "explain"]);
  if (!known.has(t.country)) err(`${t.id}: unknown place ${t.country}`);
  if (!t.options.includes(t.answer)) err(`${t.id}: the options must include the answer`);
  for (const o of t.options) if (!known.has(o) && !t.labels?.[o]?.ru) err(`${t.id}: option ${o} has no label`);
  checkApproval(t.id, t, bare(t));
}
for (const r of R.records) { uniq(r.id); if (!known.has(r.object)) err(`${r.id}: unknown object ${r.object}`); both(r.id, r, ["clue", "true", "false"]); if (!r.check) err(`${r.id}: the criterion check is missing`); checkApproval(r.id, r, bare(r)); }
if (R.records.length !== 25) err(`lesson-5-records needs 25 records, found ${R.records.length}`);
// one record about Cuba (section 7) and the Greenland record in place of the section-1 one (Svetlana, 18.11.2026)
if (R.records.some(r => r.object === "na-cuba")) err("the section-1 Cuba record is replaced by Greenland");
if (R.records.filter(r => r.object === "cty-cuba").length !== 1) err("one Cuba record (section 7)");
if (!R.records.some(r => r.object === "na-greenland")) err("the Greenland record is missing");
// the Greater Antilles task names Puerto Rico as a US territory (Svetlana, 18.11.2026)
const ga = R.selectAll.find(t => t.id === "all-greater-antilles");
if (!ga || ga.want.join() !== "cty-cuba,cty-jamaica,cty-haiti,cty-dominican-republic" || !/Пуэрто-Рико/.test(ga.borderCases.ru) || !/Puerto Rico/.test(ga.borderCases.en)) err("all-greater-antilles: Cuba, Jamaica, Haiti, the Dominican Republic and the Puerto Rico note");
// no unlearned water body anywhere in the texts' ids
const all = JSON.stringify([R.relations, R.selectAll, R.traps, R.trueFalse, R.crosses]);
for (const bad of ["bering-sea", "beaufort", "gulf-of-st-lawrence", "puerto-rico"]) if (all.includes(bad)) err(`the review names ${bad}, which is not taught as a place`);

const Dct = read("data/dictionary/b4-block.json"), W = Dct.units[0].words;
if (W.ru[0].answer !== "ПЕРВОПРОХОДЦЫ" || W.en[0].answer !== "PATHFINDERS") err("the block-final word is ПЕРВОПРОХОДЦЫ / PATHFINDERS (Svetlana, 18.11.2026)");
if (/перв|проход/i.test(W.ru[0].definition)) err("the RU definition repeats a root of ПЕРВОПРОХОДЦЫ");
if (/path|find/i.test(W.en[0].definition)) err("the EN definition repeats a root of PATHFINDERS");
for (const l of ["en", "ru"]) checkApproval(`word ${l}`, W[l][0], { answer: W[l][0].answer, definition: W[l][0].definition });

const C = read("data/challenge/b4-block.json"), sh = C.speedHunt;
if (sh.durationSeconds !== 60) err("Speed Hunt must be 60 seconds");
const pool = Object.values(sh.pool).flat();
if (new Set(pool).size !== pool.length) err("Speed Hunt pool repeats a place");
if (pool.length !== sh.poolSize) err(`Speed Hunt poolSize ${sh.poolSize} but ${pool.length} places`);
for (const id of pool) if (!mainland.includes(id) && !rivers.includes(id) && !sh.islands.ids.includes(id)) err(`Speed Hunt ${id} is not a country or river of the countries map, nor a carried island state`);
if (pool.length !== mainland.length + rivers.length + sh.islands.ids.length) err("Speed Hunt holds every country and river of the countries map and the five island states");
if (sh.islands.ids.length !== 5 || sh.islands.ids.some(id => !islands.includes(id))) err("Speed Hunt carries the five large island states of the Caribbean map");
if (sh.excluded.ids.some(id => pool.includes(id)) || sh.excluded.ids.length + sh.islands.ids.length !== islands.length) err("Speed Hunt leaves out exactly the eight small states of the Lesser Antilles");
const tiered = Object.values(sh.difficulty).flatMap(t => Object.values(t).flat());
if (tiered.length !== pool.length || pool.some(id => !tiered.includes(id))) err("every Speed Hunt place has exactly one difficulty tier");
if (!sh.stars.thresholds.every((v, i, a) => !i || v > a[i - 1])) err("star thresholds must rise");
if (C.status === "approved" && !(C.approval?.status === "approved" && sha({ speedHunt: C.speedHunt, geowords: C.geowords }) === C.approval.contentSha256)) err("Challenge rules changed after approval");

const G = read("data/geowords/b4-block.json");
for (const lang of ["en", "ru"]) {
  const P = G.puzzles.find(p => p.language === lang);
  if (!P) { err(`block final ${lang} is missing`); continue; }
  if (P.answer !== W[lang][0].answer) err(`block final ${lang}: answer ${P.answer} is not the approved word`);
  if (P.markers.map(m => m.letter).join("") !== P.answer) err(`block final ${lang}: letters do not spell the answer`);
  const riv = P.markers.filter(m => rivers.includes(m.id.split("@")[0])).length;
  if (riv < Math.ceil(P.markers.length / 3)) err(`block final ${lang}: only ${riv} river letters`);
  for (const a of P.markers) for (const b of P.markers) if (a !== b && Math.hypot(a.x - b.x, (a.y - b.y) * 1600 / 2200) < 10) err(`block final ${lang}: ${a.id} and ${b.id} closer than 10`);
  if (P.approval?.status === "approved" && sha({ answer: P.answer, markers: P.markers, clues: P.clues, map: P.map, mapAspect: P.mapAspect, layers: P.layers, language: P.language, showInsets: P.showInsets }) !== P.approval.contentSha256)
    err(`block final ${lang}: changed after approval`);
}

if (errors.length) { console.error("Block 4 review validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
const n = [R.relations, R.trueFalse, R.selectAll, R.traps, R.records].flat(), a = n.filter(i => i.approval?.status === "approved").length;
console.log(`Block 4 review validation passed: ${n.length} items (${a} approved), Speed Hunt pool of ${pool.length}, block final RU + EN.`);
