// Validates the block 3 «Asia» review (data/review/b3-block.json), its block-final word (data/dictionary/b3-block.json) and the Challenge
// rules (data/challenge/b3-block.json) against Svetlana's corrections of 1.11.2026:
// every place is one of the 138 places of sections 1-8 (the Arabian Sea and the Bay of Bengal of block 1 only as river mouths), no Andaman Sea or
// other unlearned water body; no relation with Russia; no capital question about Taiwan, Israel or Palestine; the Amu Darya and the Syr Darya carry
// the Aral Sea note; English says Borneo; tasks on the Indian subcontinent say «most of»; every «tap all…» task lists its full answer and its
// border cases; records state their criterion; texts are complete in EN and RU; the Speed Hunt pool holds the countries and rivers of the
// countries map with a difficulty tier each; every approved item still matches its approval hash.
import fs from "node:fs";
import crypto from "node:crypto";

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const errors = [], err = m => errors.push(m);
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
const sha = v => crypto.createHash("sha256").update(pyJson(v), "utf8").digest("hex").slice(0, 16);
const bare = it => Object.fromEntries(Object.entries(it).filter(([k]) => k !== "approval"));
const ids = f => read(`data/maps/${f}`).items.map(o => o.id);
const s1 = ids("asia-overview.json"), rivers = ids("asia-rivers.json"), lakes = ids("asia-lakes.json"), mountains = ids("asia-mountains.json"), deserts = ids("asia-deserts.json");
const countries = [6, 7, 8].flatMap(n => ids(`asia-countries-${n}.json`));
const known = new Set([...s1, ...rivers, ...lakes, ...mountains, ...deserts, ...countries]), mouths = new Set(["arabian-sea", "bay-of-bengal"]);
if (known.size !== 138) err(`sections 1-8 should hold 138 places, found ${known.size}`);
const noCap = new Set(["cty-taiwan", "cty-israel", "cty-palestine"]);
const checkApproval = (name, it, content) => {
  if (!it.approval || !["draft", "approved"].includes(it.approval.status)) err(`${name}: approval status must be draft or approved`);
  if (it.approval?.status === "approved") {
    if (!(it.approval.by && it.approval.date)) err(`${name}: incomplete approval`);
    else if (sha(content) !== it.approval.contentSha256) err(`${name}: changed after approval — needs re-approval`);
  }
};
const both = (name, o, keys) => { for (const k of keys) for (const l of ["en", "ru"]) if (!o[k]?.[l]?.trim()) err(`${name}: missing ${k}.${l}`); };

const R = read("data/review/b3-block.json");
const lessonIds = R.lessons.map(l => l.id).join();
if (lessonIds !== "lesson-1-map-rivers,lesson-2-lakes-mountains-deserts,lesson-3-countries,lesson-4-relations,lesson-5-records,block-final") err(`lessons are ${lessonIds}`);
for (const l of R.lessons) if (l.tasks && l.tasks.reduce((s, t) => s + t.count, 0) !== 10) err(`${l.id} must have 10 tasks`);
const seen = new Set(), uniq = id => { if (seen.has(id)) err(`duplicate id ${id}`); seen.add(id); };
const RELS = { flowsInto: [rivers, [...s1, ...lakes, ...rivers, ...mouths]], capitalOn: [countries, [...rivers, ...lakes]], inCountry: [[...s1, ...lakes, ...mountains, ...deserts], countries] };
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
for (const id of ["as-amu-darya", "as-syr-darya"]) { const r = R.relations.find(r => r.subject === id && r.relation === "flowsInto"); if (!r?.note?.ru?.includes("Араль")) err(`${id}: the Aral Sea note is missing`); }
const hind = R.relations.find(r => r.subject === "as-hindustan");
if (hind && !/бо́льшая часть|большая часть/.test(hind.label?.ru || "")) err("as-hindustan: say that India covers most of the subcontinent");
for (const c of R.crosses) {
  if (!rivers.includes(c.river)) err(`crosses: unknown river ${c.river}`);
  for (const o of [...c.through, ...c.along]) if (!countries.includes(o)) err(`crosses ${c.river}: ${o} is not a country of sections 6-8`);
  if (c.through.some(o => c.along.includes(o))) err(`crosses ${c.river}: a country both through and along`);
}
for (const p of R.trueFalse) { uniq(p.id); if (!known.has(p.subject)) err(`${p.id}: unknown subject ${p.subject}`); both(p.id, p, ["true", "false"]); checkApproval(p.id, p, bare(p)); }
for (const t of R.selectAll) {
  uniq(t.id); both(t.id, t, ["task", "borderCases"]);
  const pool = t.map === "countries" ? countries : t.map === "rivers" ? rivers : null;
  if (!pool) err(`${t.id}: map must be countries or rivers`);
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
if (R.records.length !== 25) err(`lesson-5-records needs the 25 records of sections 1-8, found ${R.records.length}`);
// no unlearned places anywhere in the texts' ids, and never Russia
const all = JSON.stringify([R.relations, R.selectAll, R.traps, R.trueFalse, R.crosses]);
for (const bad of ["andaman", "russia", "east-china-sea", "bohai", "gulf-of-thailand"]) if (all.includes(bad)) err(`the review names ${bad}, which is not taught as a place`);
// English says Borneo (Svetlana, 1.11.2026)
if (/Kalimantan/i.test(JSON.stringify(R).replace(/"ru":\s*"[^"]*"/g, ""))) err("English texts must say Borneo, not Kalimantan");

const Dct = read("data/dictionary/b3-block.json"), W = Dct.units[0].words;
if (W.ru[0].answer !== "МНОГООБРАЗИЕ" || W.en[0].answer !== "DIVERSITY") err("the block-final word is МНОГООБРАЗИЕ / DIVERSITY (Svetlana, 1.11.2026)");
if (/много|образ/i.test(W.ru[0].definition)) err("the RU definition repeats a root of МНОГООБРАЗИЕ");
if (/divers/i.test(W.en[0].definition)) err("the EN definition repeats the root of DIVERSITY");
for (const l of ["en", "ru"]) checkApproval(`word ${l}`, W[l][0], { answer: W[l][0].answer, definition: W[l][0].definition });

const C = read("data/challenge/b3-block.json"), sh = C.speedHunt;
if (sh.durationSeconds !== 60) err("Speed Hunt must be 60 seconds");
const pool = Object.values(sh.pool).flat();
if (new Set(pool).size !== pool.length) err("Speed Hunt pool repeats a place");
if (pool.length !== sh.poolSize) err(`Speed Hunt poolSize ${sh.poolSize} but ${pool.length} places`);
for (const id of pool) if (!countries.includes(id) && !rivers.includes(id)) err(`Speed Hunt ${id} is not a country or river of the countries map`);
if (pool.length !== countries.length + rivers.length) err("Speed Hunt holds every country and river of the countries map");
const tiered = Object.values(sh.difficulty).flatMap(t => Object.values(t).flat());
if (tiered.length !== pool.length || pool.some(id => !tiered.includes(id))) err("every Speed Hunt place has exactly one difficulty tier");
if (!sh.stars.thresholds.every((v, i, a) => !i || v > a[i - 1])) err("star thresholds must rise");
if (C.status === "approved" && !(C.approval?.status === "approved" && sha({ speedHunt: C.speedHunt, geowords: C.geowords }) === C.approval.contentSha256)) err("Challenge rules changed after approval");

const G = read("data/geowords/b3-block.json");
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

if (errors.length) { console.error("Block 3 review validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
const n = [R.relations, R.trueFalse, R.selectAll, R.traps, R.records].flat(), a = n.filter(i => i.approval?.status === "approved").length;
console.log(`Block 3 review validation passed: ${n.length} items (${a} approved), Speed Hunt pool of ${pool.length}, block final RU + EN.`);
