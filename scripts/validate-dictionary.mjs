// Validates data/dictionary/*.json: unit shape (1 final + at least 6 review per language; block 2 units have extra words Svetlana added 26.10.2026), single-word answers,
// no duplicate answers per language, definitions present, and that each approval still matches its text.
// Release packages listed in RELEASE are checked fail-closed: all expected units in both languages,
// one section-final unit, and a complete approval on every word.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir = process.env.DICTIONARY_DIR || path.join(process.cwd(), "data/dictionary");
// Release packages: file -> section and the exact unit ids it must contain (the last one is the section final).
const RELEASE = {
  "b2-section-1.json": {
    section: "europe-on-the-map",
    units: ["unit-1-where-europe-ends", "unit-2-peninsulas-of-europe", "unit-3-islands-and-seas", "section-final"],
  },
  "block-1.json": {
    section: "world-1",
    units: ["challenge-extra", "block-final"],
  },
  "section-5.json": {
    section: "straits-and-canals",
    units: ["unit-1-canals-and-european-straits", "unit-2-straits-of-asia-and-africa", "unit-3-straits-of-the-americas-and-polar-seas", "section-final"],
  },
  "section-4.json": {
    section: "seas-of-the-world",
    units: ["unit-1-mediterranean-black-red-caspian", "unit-2-arabian-bengal-coral", "unit-3-caribbean-gulf-of-mexico-hudson-bay-records", "section-final"],
  },
  "section-3.json": {
    section: "mountains-of-the-world",
    units: ["unit-1-himalayas-ural-cordillera-andes", "unit-2-appalachians-east-africa-great-dividing-range-atlas", "unit-3-caucasus-pyrenees-mid-atlantic-ridge-records", "section-final"],
  },
  "section-2.json": {
    section: "rivers-of-the-world",
    units: ["unit-1-nile-amazon-mississippi", "unit-2-rivers-of-asia", "unit-3-danube-volga-records", "section-final"],
  },
  "section-1.json": {
    section: "continents-and-oceans",
    units: ["unit-1-directions-hemispheres", "unit-2-continents", "unit-3-oceans", "unit-4-neighbours-records", "section-final"],
  },
};
const ROLES = new Set(["final", "review", "reserve", "section-final", "block-final", "challenge"]);
const STATUSES = new Set(["approved", "draft"]);
// Release packages are required: a missing directory or file fails.
if (!fs.existsSync(dir)) { console.error(`Dictionary validation failed:\n- missing directory ${dir}`); process.exit(1); }
const errors = [];
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
// Same serialisation as Python json.dumps(..., ensure_ascii=False, sort_keys=True)
const pyJson = v => JSON.stringify(sortKeys(v)).replace(/":/g, '": ').replace(/,"/g, ', "');
const LETTERS = { en: /^[A-Z]+$/, ru: /^[А-ЯЁ]+$/ };
// The answer must not appear in its own definition (Svetlana, 2026-10-24): Ё = Е, any letter case;
// English also catches -s/-es plurals, Russian catches case endings (the stem without its final vowel, ь or й, + up to 3 letters).
const answerInDefinition = (answer, definition, lang) => {
  const norm = s => s.toUpperCase().replace(/Ё/g, "Е");
  const a = norm(answer), text = norm(definition);
  const L = lang === "ru" ? "А-Я" : "A-Z";
  const stem = lang === "ru" ? a.replace(/[АЕИОУЫЭЮЯЬЙ]$/, "") : a;
  const tail = lang === "ru" ? `[${L}]{0,3}` : "(?:S|ES)?";
  return new RegExp(`(^|[^${L}])${stem}${tail}(?![${L}])`).test(text);
};
let count = 0;
for (const file of Object.keys(RELEASE)) if (!fs.existsSync(path.join(dir, file))) errors.push(`${file}: required release package is missing`);
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const release = RELEASE[file];
  const units = Array.isArray(j.units) ? j.units : [];
  if (!units.length) errors.push(`${file}: no units`);
  const unitIds = units.map(u => u?.id);
  if (new Set(unitIds).size !== unitIds.length) errors.push(`${file}: duplicate unit ids`);
  if (release) {
    if ((j.section ?? j.block) !== release.section) errors.push(`${file}: section must be "${release.section}"`);
    if (unitIds.join() !== release.units.join()) errors.push(`${file}: units must be ${release.units.join(", ")} (found ${unitIds.join(", ") || "none"})`);
  }
  for (const lang of ["en", "ru"]) {
    const sectionFinals = units.filter(u => (u.words?.[lang] || []).some(w => w.role === "section-final" || w.role === "block-final"));
    if (sectionFinals.length !== 1) errors.push(`${file}: ${lang} must have exactly one section-final (or block-final) unit`);
    else if (release && sectionFinals[0].id !== release.units.at(-1)) errors.push(`${file}: ${lang} section-final must be in ${release.units.at(-1)}`);
  }
  for (const lang of ["en", "ru"]) {
    const seen = new Set();
    for (const u of j.units || []) {
      const words = u.words?.[lang] || [];
      const finals = words.filter(w => w.role === "final").length;
      const reviews = words.filter(w => w.role === "review").length;
      const sectionFinal = words.filter(w => w.role === "section-final" || w.role === "block-final").length;
      const challengeOnly = (u.words?.en || []).concat(u.words?.ru || []).every(w => w.role === "challenge");
      if (challengeOnly ? false : sectionFinal ? words.length !== 1 : finals !== 1 || reviews < 6)
        errors.push(`${file}: ${u.id} ${lang} must have 1 final + at least 6 review words (or one section-final / block-final)`);
      if (!words.length && !challengeOnly) errors.push(`${file}: ${u.id} has no ${lang} words`);
      // Reserve words ("Play again" when no review word fits the learned places): only beside a unit final,
      // and never longer than the unit's reserveMaxLetters.
      // practiceExtra: short approved words of later units used in this unit's practice; each must exist and fit reserveMaxLetters.
      for (const a of u.practiceExtra?.[lang] || []) {
        const later = units.slice(units.indexOf(u) + 1).flatMap(v => v.words?.[lang] || []).find(w => w.answer === a && (w.role === "review" || w.role === "reserve"));
        if (!later) errors.push(`${file}: ${u.id} ${lang} practiceExtra ${a} is not a review or reserve word of a later unit`);
        else if (!Number.isInteger(u.reserveMaxLetters) || [...a].length > u.reserveMaxLetters) errors.push(`${file}: ${u.id} ${lang} practiceExtra ${a} is longer than reserveMaxLetters`);
      }
      const reserves = words.filter(w => w.role === "reserve");
      if (reserves.length) {
        if (finals !== 1) errors.push(`${file}: ${u.id} ${lang} reserve words need a unit with a final word`);
        if (!Number.isInteger(u.reserveMaxLetters) || u.reserveMaxLetters < 3) errors.push(`${file}: ${u.id} has reserve words but no reserveMaxLetters`);
        else for (const w of reserves) if ([...(w.answer || "")].length > u.reserveMaxLetters)
          errors.push(`${file}: ${u.id} ${lang} reserve word ${w.answer} is longer than ${u.reserveMaxLetters} letters`);
      }
      for (const w of words) {
        count++;
        if (!ROLES.has(w.role)) errors.push(`${file}: ${u.id} ${lang} ${w.answer} has unknown role "${w.role}"`);
        const a = w.approval;
        if (a && !STATUSES.has(a.status)) errors.push(`${file}: ${w.answer} unknown approval status "${a.status}"`);
        if (release && !(a?.status === "approved" && a.by && a.date && a.contentSha256))
          errors.push(`${file}: ${w.answer} is in a release package but has no complete approval (status, by, date, contentSha256)`);
        if (!LETTERS[lang].test(w.answer || "")) errors.push(`${file}: ${u.id} ${lang} "${w.answer}" is not one word in capitals`);
        const key = (w.answer || "").replace(/Ё/g, "Е");
        if (seen.has(key)) errors.push(`${file}: ${lang} answer ${w.answer} is used twice`); seen.add(key);
        if (!w.definition?.trim()) errors.push(`${file}: ${w.answer} has no definition`);
        if (answerInDefinition(w.answer, w.definition || "", lang)) errors.push(`${file}: ${w.answer} appears in its own definition`);
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
