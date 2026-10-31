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
  "section-2-records.json": {
    section: "rivers-of-the-world",
    ids: ["nile-longest", "amazon-most-water", "volga-longest-europe", "yangtze-longest-asia", "danube-most-countries", "huang-he-muddiest"],
  },
  "section-2-facts.json": {
    section: "rivers-of-the-world",
    ids: ["nile", "amazon", "mississippi", "yangtze", "huang-he", "ganges", "indus", "danube", "volga"],
  },
  "section-3-records.json": {
    section: "mountains-of-the-world",
    ids: ["everest-highest", "andes-longest-continental", "mid-ocean-ridge-longest", "kilimanjaro-highest-africa", "aconcagua-highest-south-america", "elbrus-highest-europe"],
  },
  "section-3-facts.json": {
    section: "mountains-of-the-world",
    ids: ["himalayas", "ural", "cordillera", "andes", "appalachians", "east-africa", "great-dividing-range", "atlas", "caucasus", "pyrenees", "mid-atlantic-ridge"],
  },
  "section-4-records.json": {
    section: "seas-of-the-world",
    ids: ["red-sea-saltiest", "bay-of-bengal-largest-bay", "caspian-largest-inland", "coral-sea-largest-reef"],
  },
  "section-4-facts.json": {
    section: "seas-of-the-world",
    ids: ["mediterranean-sea", "black-sea", "red-sea", "caspian-sea", "arabian-sea", "bay-of-bengal", "coral-sea", "caribbean-sea", "gulf-of-mexico", "hudson-bay"],
  },
  "section-5-records.json": {
    section: "straits-and-canals",
    ids: ["gibraltar-narrowest-europe-africa", "bering-narrowest-asia-america"],
  },
  "section-5-facts.json": {
    section: "straits-and-canals",
    ids: ["suez-canal", "panama-canal", "strait-of-gibraltar", "english-channel", "bosporus", "dardanelles", "bab-el-mandeb", "strait-of-hormuz", "gulf-of-oman", "strait-of-malacca", "mozambique-channel", "bering-strait", "drake-passage", "strait-of-magellan"],
  },
  "b2-section-1-facts.json": {
    section: "europe-on-the-map",
    ids: ["europe-intro", "atlantic-ocean", "arctic-ocean", "mediterranean-sea", "ural-mountains", "ural-river", "caspian-sea",
      "scandinavian-peninsula", "kola-peninsula", "jutland", "iberian-peninsula", "apennine-peninsula", "balkan-peninsula", "crimean-peninsula",
      "great-britain", "ireland", "iceland", "sicily", "baltic-sea", "north-sea", "barents-sea"],
  },
  "b2-section-2-facts.json": {
    section: "rivers-of-europe",
    ids: ["volga", "don", "dnieper", "dniester", "danube", "rhine", "elbe", "oder", "vistula", "thames", "seine", "loire", "rhone",
      "po", "tiber", "tagus", "douro", "guadiana", "ebro", "guadalquivir", "tip-rhine-elbe-oder-vistula"],
  },
  "b2-section-2-records.json": {
    section: "rivers-of-europe",
    ids: ["volga-largest-delta", "loire-longest-france", "tagus-longest-iberia"],
  },
  "b2-section-4-facts.json": {
    section: "countries-west-and-north",
    ids: ["united-kingdom", "ireland-country", "france", "netherlands", "belgium", "luxembourg-country", "spain", "portugal", "norway", "sweden", "denmark", "finland", "iceland-country"],
  },
  "b2-section-4-records.json": {
    section: "countries-west-and-north",
    ids: ["reykjavik-northernmost-capital", "lisbon-westernmost-mainland-capital", "france-largest-eu"],
  },
  "b2-section-5-facts.json": {
    section: "countries-centre-south-and-east",
    ids: ["germany", "switzerland", "austria", "czechia", "poland", "hungary", "italy", "greece", "serbia", "romania", "estonia", "latvia", "lithuania", "belarus", "ukraine", "russia"],
  },
  "b2-section-5-records.json": {
    section: "countries-centre-south-and-east",
    ids: ["russia-largest-country", "vatican-smallest-country", "germany-most-populous-eu"],
  },
  "b2-section-3-facts.json": {
    section: "mountains-of-europe",
    ids: ["pyrenees", "alps", "apennines", "carpathians", "balkan-mountains", "dinaric-alps", "scandinavian-mountains", "scottish-highlands", "caucasus"],
  },
  "b2-section-3-records.json": {
    section: "mountains-of-europe",
    ids: ["alps-highest-in-europe", "galdhopiggen-highest-northern-europe", "aneto-highest-pyrenees"],
  },
  "b2-section-1-records.json": {
    section: "europe-on-the-map",
    ids: ["scandinavian-largest-peninsula", "great-britain-largest-island", "sicily-largest-mediterranean-island"],
  },
  "b3-section-1-facts.json": {
    section: "asia-on-the-map",
    ids: ["asia-intro", "as-arctic-ocean", "as-pacific-ocean", "as-indian-ocean", "as-ural-mountains", "as-bosporus", "as-suez-canal", "as-bering-strait", "as-asia-minor", "as-arabian-peninsula", "as-hindustan", "as-indochina", "as-malay-peninsula", "as-korean-peninsula", "as-kamchatka", "as-taimyr", "as-chukotka", "as-japanese-islands", "as-sakhalin", "as-sri-lanka", "as-borneo", "as-sea-of-japan", "as-sea-of-okhotsk", "as-south-china-sea", "as-persian-gulf"],
  },
  "b3-section-1-records.json": {
    section: "asia-on-the-map",
    ids: ["arabian-largest-peninsula", "borneo-largest-island-asia", "chelyuskin-northernmost"],
  },
  "b3-section-2-facts.json": {
    section: "rivers-of-asia",
    ids: ["asia-rivers-intro", "as-ob", "as-irtysh", "as-yenisei", "as-lena", "as-amur", "as-kolyma", "as-yangtze", "as-huang-he", "as-mekong", "as-chao-phraya", "as-salween", "as-irrawaddy", "as-brahmaputra", "as-ganges", "as-indus", "as-godavari", "as-tigris", "as-euphrates", "as-jordan", "as-amu-darya", "as-syr-darya", "as-ili", "as-tarim"],
  },
  "b3-section-6-facts.json": {
    section: "countries-east-and-southeast-asia",
    ids: ["cty-china", "cty-mongolia", "cty-north-korea", "cty-south-korea", "cty-japan", "cty-taiwan", "cty-vietnam", "cty-laos", "cty-cambodia", "cty-thailand", "cty-myanmar", "cty-malaysia", "cty-singapore", "cty-indonesia", "cty-brunei", "cty-philippines", "cty-timor-leste"],
  },
  "b3-section-6-records.json": {
    section: "countries-east-and-southeast-asia",
    ids: ["indonesia-largest-island-country", "ulaanbaatar-coldest-capital", "great-wall-longest-fortification"],
  },
  "b3-section-5-facts.json": {
    section: "deserts-of-asia",
    ids: ["asia-deserts-intro", "as-taklamakan", "as-ordos", "as-gobi", "as-kyzylkum", "as-karakum", "as-kavir", "as-lut", "as-thar", "as-rub-al-khali", "as-negev"],
  },
  "b3-section-5-records.json": {
    section: "deserts-of-asia",
    ids: ["rub-al-khali-largest-sand-sea", "lut-hottest-surface", "thar-most-populated-desert"],
  },
  "b3-section-4-facts.json": {
    section: "mountains-of-asia",
    ids: ["asia-mountains-intro", "as-pamirs", "as-tian-shan", "as-hindu-kush", "as-karakoram", "as-kunlun", "as-tibet", "as-himalayas", "as-altai", "as-sayan", "as-sikhote-alin", "as-klyuchevskaya", "as-fuji", "as-urals", "as-zagros", "as-elburz", "as-caucasus", "as-arakan", "as-barisan", "as-krakatoa"],
  },
  "b3-section-4-records.json": {
    section: "mountains-of-asia",
    ids: ["tibet-highest-plateau", "himalaya-karakoram-eight-thousanders", "klyuchevskaya-highest-active-volcano", "krakatoa-loudest-sound"],
  },
  "b3-section-3-facts.json": {
    section: "lakes-of-asia",
    ids: ["asia-lakes-intro", "as-baikal", "as-khovsgol", "as-taymyr", "as-khanka", "as-qinghai", "as-caspian", "as-aral", "as-balkhash", "as-issyk-kul", "as-dead-sea", "as-urmia", "as-van", "as-tonle-sap"],
  },
  "b3-section-3-records.json": {
    section: "lakes-of-asia",
    ids: ["baikal-deepest-oldest", "dead-sea-lowest-land", "caspian-largest-lake"],
  },
  "b3-section-2-records.json": {
    section: "rivers-of-asia",
    ids: ["yangtze-longest-asia", "irtysh-long-tributary", "yenisei-most-water-russia"],
  },
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
