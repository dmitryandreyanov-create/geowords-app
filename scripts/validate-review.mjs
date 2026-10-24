// Validates the block review unit (data/review/*.json): exact lesson plan, relations that point at known
// objects with an allowed "use", after-card relations tied to a card id, and true/false pairs that match a
// usable relation and still carry a valid approval. Relations marked "no" are never an answer.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir = process.env.REVIEW_DIR || path.join(process.cwd(), "data/review");
const mapsDir = process.env.MAPS_DIR || path.join(process.cwd(), "data/maps");
const RELEASE = { "block-1.json": ["lesson-1-land", "lesson-2-water", "lesson-3-relations", "lesson-4-records", "block-final"] };
const RELATIONS = new Set(["onContinent", "flowsInto", "onOceanFloor", "onBorderOf", "inOcean", "connects", "separates"]);
const USES = new Set(["yes", "after-card", "only-border-question", "no"]);
const errors = [];
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
const known = new Set(["asia", "africa", "north-america", "south-america", "antarctica", "europe", "australia",
  "pacific-ocean", "atlantic-ocean", "indian-ocean", "arctic-ocean", "southern-ocean"]);
for (const [f, key] of [["world-rivers.json", "rivers"], ["world-mountains.json", "mountains"], ["world-waters.json", "waters"], ["world-straits.json", "items"]]) {
  const p = path.join(mapsDir, f);
  if (!fs.existsSync(p)) { errors.push(`missing map ${f}`); continue; }
  for (const it of JSON.parse(fs.readFileSync(p, "utf8"))[key] || []) known.add(it.id);
}
if (!fs.existsSync(dir)) errors.push(`missing directory ${dir}`);
for (const [file, lessons] of Object.entries(RELEASE)) {
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) { errors.push(`${file}: required release package is missing`); continue; }
  const j = JSON.parse(fs.readFileSync(fp, "utf8")), err = m => errors.push(`${file}: ${m}`);
  if (!(j.status === "approved" && j.approvedBy && j.approvedDate)) err("no complete approval");
  const ids = (j.lessons || []).map(l => l.id);
  if (ids.join() !== lessons.join()) err(`lessons must be ${lessons.join(", ")} (found ${ids.join(", ") || "none"})`);
  for (const l of j.lessons || []) if (l.tasks && l.tasks.reduce((s, t) => s + (t.count || 0), 0) !== 10) err(`${l.id} must have 10 tasks`);
  const cards = new Set((j.cards || []).map(c => c.id));
  const ok = new Set();
  for (const r of j.relations || []) {
    const name = `${r.relation} ${JSON.stringify(r.subject)}`;
    if (!RELATIONS.has(r.relation)) err(`unknown relation ${r.relation}`);
    if (!USES.has(r.use)) err(`${name}: unknown use ${r.use}`);
    for (const id of [r.subject, r.object].flat()) if (id !== null && id !== undefined && !known.has(id)) err(`${name}: unknown object ${id}`);
    if (r.object === null && r.use !== "no" && !(r.relation === "inOcean" && r.subject === "caspian-sea")) err(`${name}: an empty answer is allowed only for the Caspian (in no ocean)`);
    if (r.use === "after-card" && !cards.has(r.requiresCard)) err(`${name}: after-card relation needs a known requiresCard id`);
    if (r.use !== "no") for (const s of [r.subject].flat()) ok.add(`${s}|${r.relation}`);
  }
  for (const p of j.trueFalse?.pairs || []) {
    if (!ok.has(`${p.subject}|${p.relation}`)) err(`${p.id}: ${p.subject} ${p.relation} is not a usable relation`);
    for (const side of ["true", "false"]) for (const lang of ["en", "ru"]) if (!p[side]?.[lang]?.trim()) err(`${p.id}: missing ${side}.${lang}`);
    const sha = crypto.createHash("sha256").update(pyJson({ id: p.id, subject: p.subject, relation: p.relation, true: p.true, false: p.false }), "utf8").digest("hex").slice(0, 16);
    if (!(p.approval?.status === "approved" && p.approval.by && p.approval.date)) err(`${p.id}: no complete approval`);
    else if (sha !== p.approval.contentSha256) err(`${p.id}: changed after approval — needs re-approval`);
  }
  if (!(j.trueFalse?.pairs || []).length) err("no true/false pairs");
}
if (errors.length) { console.error("Review unit validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
console.log("Review unit validation passed: lessons, relations and true/false approvals valid.");
