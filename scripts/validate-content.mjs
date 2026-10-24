// Validates teaching content in data/content/*.json: ids, EN/RU text, caveats for disputed facts,
// and that each approval still matches the exact approved text (approval.contentSha256).
// Release packages listed in RELEASE are checked fail-closed: the expected set of cards must be
// present and every card must carry a complete approval.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir = process.env.CONTENT_DIR || path.join(process.cwd(), "data/content");
// Release packages: file -> section and the exact card ids it must contain.
const RELEASE = {
  "section-1-facts.json": {
    section: "continents-and-oceans",
    ids: ["north", "south", "east", "west",
      "asia", "africa", "north-america", "south-america", "antarctica", "europe", "australia",
      "pacific-ocean", "atlantic-ocean", "indian-ocean", "arctic-ocean", "southern-ocean"],
  },
};
const STATUSES = new Set(["approved", "draft"]);
// Release packages are required: a missing directory or file fails.
if (!fs.existsSync(dir)) { console.error(`Content validation failed:\n- missing directory ${dir}`); process.exit(1); }
const errors = [];
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
// Same serialisation as Python json.dumps(..., ensure_ascii=False, sort_keys=True)
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
let count = 0;
for (const file of Object.keys(RELEASE)) if (!fs.existsSync(path.join(dir, file))) errors.push(`${file}: required release package is missing`);
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const seen = new Set();
  const release = RELEASE[file];
  if (release) {
    if (j.section !== release.section) errors.push(`${file}: section must be "${release.section}"`);
    const ids = (Array.isArray(j.items) ? j.items : []).map(it => it?.id);
    for (const id of release.ids) if (!ids.includes(id)) errors.push(`${file}: missing card ${id}`);
    for (const id of ids) if (!release.ids.includes(id)) errors.push(`${file}: unexpected card ${id}`);
  }
  if (release && (!Array.isArray(j.items) || !j.items.length)) errors.push(`${file}: no items`);
  for (const it of j.items || []) {
    count++;
    const id = it.id || "(no id)";
    if (seen.has(id)) errors.push(`${file}: duplicate id ${id}`); seen.add(id);
    for (const k of ["name", "fact"]) for (const lang of ["en", "ru"])
      if (!it[k]?.[lang]?.trim()) errors.push(`${file}: ${id} missing ${k}.${lang}`);
    if (it.disputed && !(it.caveat?.en?.trim() && it.caveat?.ru?.trim())) errors.push(`${file}: ${id} is disputed but has no EN/RU caveat`);
    if (typeof it.disputed !== "boolean") errors.push(`${file}: ${id} disputed must be true or false`);
    // Record categories (Svetlana, 2026-10-24): changing records carry a year and are never used in GeoWords clues.
    if ("category" in it) {
      if (!["stable", "conditional", "changing"].includes(it.category)) errors.push(`${file}: ${id} unknown record category "${it.category}"`);
      if (it.category === "changing" && !(it.asOf && it.clueUse === false)) errors.push(`${file}: ${id} is a changing record: needs asOf and clueUse: false`);
    }
    const a = it.approval;
    if (a && !STATUSES.has(a.status)) errors.push(`${file}: ${id} unknown approval status "${a.status}"`);
    if (release && !(a?.status === "approved" && a.by && a.date && a.contentSha256))
      errors.push(`${file}: ${id} is in a release package but has no complete approval (status, by, date, contentSha256)`);
    if (it.approval?.status === "approved") {
      const payload = pyJson({ id: it.id, fact: it.fact, caveat: it.caveat ?? null, disputed: it.disputed, name: it.name });
      const sha = crypto.createHash("sha256").update(payload, "utf8").digest("hex").slice(0, 16);
      if (sha !== it.approval.contentSha256) errors.push(`${file}: ${id} text or disputed mark changed after approval — needs re-approval`);
    }
  }
}
// Relations (washedBy / neutral): every id must be a known continent or ocean; neutral never doubles as an answer.
const facts = path.join(dir, "section-1-facts.json"), relFile = path.join(dir, "section-1-relations.json");
if (fs.existsSync(facts) && fs.existsSync(relFile)) {
  const kinds = Object.fromEntries(JSON.parse(fs.readFileSync(facts, "utf8")).items.map(it => [it.id, it.kind]));
  const rel = JSON.parse(fs.readFileSync(relFile, "utf8"));
  for (const [c, oceans] of Object.entries(rel.washedBy || {})) {
    if (kinds[c] !== "continent") errors.push(`section-1-relations.json: ${c} is not a continent`);
    for (const o of oceans) if (kinds[o] !== "ocean") errors.push(`section-1-relations.json: ${c} -> ${o} is not an ocean`);
    for (const o of Object.keys(rel.neutral?.[c] || {}))
      if (oceans.includes(o) || kinds[o] !== "ocean") errors.push(`section-1-relations.json: neutral ${c} -> ${o} must be an ocean that is not an answer`);
  }
  if (Object.keys(rel.washedBy || {}).length !== Object.values(kinds).filter(k => k === "continent").length)
    errors.push("section-1-relations.json: washedBy must list every continent");
}
if (errors.length) { console.error("Content validation failed:\n" + errors.map(e => "- " + e).join("\n")); process.exit(1); }
console.log(`Content validation passed: ${count} items, approvals match their text.`);
