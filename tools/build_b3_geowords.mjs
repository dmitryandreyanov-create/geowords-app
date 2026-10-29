// Builds the draft unit and section finals of block 3 section 1 «Asia on the map» (data/geowords/b3-section-1.json)
// by the same rules the app uses for Asia practice puzzles (placesFor, sec 13): letters only on objects of data/maps/asia-overview.json
// learned by the end of the unit, one letter per object, at the object's label point; no letter inside another object of the puzzle,
// and a marginal sea or an island never with the ocean it lies in; spacing hypot(dx, dy*1600/2200) >= 4.5;
// a place phrase never contains the answer; reveal order as validate-geowords.mjs.
// Usage: node tools/build_b3_geowords.mjs [seed]  — writes drafts; approved puzzles already in the file are kept as they are.
import fs from "node:fs";

const MAP = "data/maps/asia-overview.json", DICT = "data/dictionary/b3-section-1.json", OUT = "data/geowords/b3-section-1.json";
let seed = Number(process.argv[2] || 2026);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Place phrases (the words that follow «Найди N-ю букву» / "Find the Nth letter"); the same as AS_PLACE in app/app.js.
export const PLACE = {
  "as-arctic-ocean": ["в Северном Ледовитом океане", "in the Arctic Ocean"], "as-pacific-ocean": ["в Тихом океане", "in the Pacific Ocean"],
  "as-indian-ocean": ["в Индийском океане", "in the Indian Ocean"], "as-ural-mountains": ["в Уральских горах", "in the Ural Mountains"],
  "as-bosporus": ["у Босфора", "at the Bosporus"], "as-suez-canal": ["у Суэцкого канала", "at the Suez Canal"], "as-bering-strait": ["в Беринговом проливе", "in the Bering Strait"],
  "as-asia-minor": ["на полуострове Малая Азия", "on the peninsula of Asia Minor"], "as-arabian-peninsula": ["на Аравийском полуострове", "on the Arabian Peninsula"],
  "as-hindustan": ["на полуострове Индостан", "on the Indian subcontinent"], "as-indochina": ["на полуострове Индокитай", "on the Indochina Peninsula"],
  "as-malay-peninsula": ["на Малаккском полуострове", "on the Malay Peninsula"], "as-korean-peninsula": ["на Корейском полуострове", "on the Korean Peninsula"],
  "as-kamchatka": ["на Камчатке", "on Kamchatka"], "as-taimyr": ["на Таймыре", "on the Taimyr Peninsula"],
  "as-japanese-islands": ["на Японских островах", "on the Japanese Islands"], "as-sakhalin": ["на Сахалине", "on Sakhalin"],
  "as-sri-lanka": ["на острове Шри-Ланка", "on the island of Sri Lanka"], "as-borneo": ["на острове Калимантан", "on the island of Borneo"],
  "as-sea-of-japan": ["в Японском море", "in the Sea of Japan"], "as-sea-of-okhotsk": ["в Охотском море", "in the Sea of Okhotsk"],
  "as-south-china-sea": ["в Южно-Китайском море", "in the South China Sea"], "as-persian-gulf": ["в Персидском заливе", "in the Persian Gulf"],
};
// An object and the object it lies in never share a puzzle (EU_IN in app/app.js)
export const CONTAINERS = {
  "as-sea-of-japan": ["as-pacific-ocean"], "as-sea-of-okhotsk": ["as-pacific-ocean"], "as-south-china-sea": ["as-pacific-ocean"], "as-persian-gulf": ["as-indian-ocean"],
  "as-japanese-islands": ["as-pacific-ocean"], "as-sakhalin": ["as-pacific-ocean"], "as-borneo": ["as-pacific-ocean"], "as-sri-lanka": ["as-indian-ocean"],
};
const ASPECT = 1600 / 2200, SEP = 4.5;

const map = JSON.parse(fs.readFileSync(MAP, "utf8")), dict = JSON.parse(fs.readFileSync(DICT, "utf8"));
const tpl = JSON.parse(fs.readFileSync("data/geowords/clue-templates.json", "utf8"));
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const items = Object.fromEntries(map.items.map(o => [o.id, o]));
const inside = (id, p) => { const o = items[id]; return polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl)); };
const nested = (a, b) => (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id) || inside(b.id, a) || inside(a.id, b);
const far = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * ASPECT) >= SEP;
const fold = s => s.toUpperCase().replace(/Ё/g, "Е");

function revealOrder(n) {
  const long = n >= 7, endN = n <= 8 ? 2 : 3;
  for (let t = 0; t < 20000; t++) {
    const o = shuffle([...Array(n)].map((_, i) => i + 1));
    if (o.some((v, i) => i && Math.abs(v - o[i - 1]) === 1)) continue;
    if (long) { if (!o.slice(-3).includes(1)) continue; const ends = [...Array(endN)].map((_, i) => n - i); if (o.slice(0, 3).some(p => ends.includes(p))) continue; }
    else { if (!o.slice(-2).includes(1)) continue; if (o.slice(0, 2).includes(n)) continue; }
    return o;
  }
  return null;
}
const places = unit => map.items.filter(o => o.unit <= unit).map(o => ({ id: o.id, unit: o.unit, ...o.label }));

function build(word, lang, unit, final, tries = 6000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length;
  const usable = places(unit).filter(p => !fold(PLACE[p.id][li]).includes(fold(word)));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    // the newest unit's objects first, so a unit final is mostly about that unit
    const pool = shuffle([...usable]).sort((a, b) => (b.unit === unit) - (a.unit === unit));
    const pick = [];
    for (const p of pool) if (pick.length < n && pick.every(q => far(p, q) && !nested(p, q))) pick.push(p);
    if (pick.length < n) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT))));
    const units = new Set(pick.map(p => p.unit)).size, own = pick.filter(p => p.unit === unit).length;
    const score = gap + (final ? units * 3 : own);
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (!best) return null;
  const order = revealOrder(n);
  const markers = best.map((p, i) => ({ id: p.id, x: p.x, y: p.y, letter: letters[i] }));
  const ord = tpl.ordinals[lang], t = tpl.template[lang];
  const clues = order.map(pos => ({ markerId: markers[pos - 1].id, position: pos, text: t.replace("{ordinal}", ord[pos - 1]).replace("{place}", PLACE[markers[pos - 1].id][li]) }));
  return { markers, clues };
}

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { puzzles: [] };
const puzzles = [];
for (const u of dict.units) {
  const sectionFinal = u.id === "section-final", unit = sectionFinal ? "section-final" : Number(u.id.match(/^unit-(\d+)/)[1]);
  for (const lang of ["en", "ru"]) {
    const w = u.words[lang].find(w => w.role === "final" || w.role === "section-final");
    const id = `b3-section-1-${sectionFinal ? "final" : `unit-${unit}`}-${lang}`;
    const old = prev.puzzles.find(p => p.id === id);
    if (old?.approval?.status === "approved" && old.answer === w.answer) { puzzles.push(old); continue; }
    const b = build(w.answer, lang, sectionFinal ? dict.units.length - 1 : unit, sectionFinal);
    if (!b) { console.error(`${id}: ${w.answer} cannot be laid out on the learned objects`); process.exitCode = 1; continue; }
    puzzles.push({ id, section: dict.section, block: 3, unit, role: sectionFinal ? "section-final" : "unit-final", language: lang, answer: w.answer,
      map: "./assets/asia-blank.webp", mapAspect: "2200 / 1600", layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b,
      approval: { status: "draft" } });
  }
}
const out = {
  section: "asia-on-the-map", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters only on objects of data/maps/asia-overview.json learned by the end of the unit (section final: all 23), one letter per object, at the object's label point",
    nesting: "an object never shares a puzzle with the object that contains it: the Seas of Japan and Okhotsk, the South China Sea, the Japanese Islands, Sakhalin and Borneo with the Pacific; the Persian Gulf and Sri Lanka with the Indian Ocean; no letter inside the area of another object of the puzzle",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
