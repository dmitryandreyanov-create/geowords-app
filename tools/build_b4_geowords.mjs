// Builds the draft unit and section finals of block 4 section 1 «North America on the map» (data/geowords/b4-section-1.json)
// by the same rules the app uses for its practice puzzles (placesFor, sec 22): letters only on objects of data/maps/namerica-overview.json
// learned by the end of the unit, one letter per object, at the object's label point; no letter inside another object of the puzzle,
// and a sea, a gulf or an island never with the ocean or the sea it lies in (CONTAINERS = NA_IN in app/app.js); spacing hypot(dx, dy*1600/2200) >= 4.5;
// a place phrase never contains the answer; reveal order as validate-geowords.mjs.
// Usage: node tools/build_b4_geowords.mjs [seed]  — writes drafts; approved puzzles already in the file are kept as they are.
import fs from "node:fs";

const MAP = "data/maps/namerica-overview.json", DICT = "data/dictionary/b4-section-1.json", OUT = "data/geowords/b4-section-1.json", BASE = "./assets/namerica-blank.webp";
let seed = Number(process.argv[2] || 2026);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Place phrases (the words that follow «Найди N-ю букву» / "Find the Nth letter"); the same as NA_PLACE in app/app.js.
export const PLACE = {
  "na-arctic-ocean": ["в Северном Ледовитом океане", "in the Arctic Ocean"], "na-pacific-ocean": ["в Тихом океане", "in the Pacific Ocean"],
  "na-atlantic-ocean": ["в Атлантическом океане", "in the Atlantic Ocean"], "na-bering-strait": ["в Беринговом проливе", "in the Bering Strait"],
  "na-denmark-strait": ["в Датском проливе", "in the Denmark Strait"], "na-isthmus-of-panama": ["на Панамском перешейке", "on the Isthmus of Panama"],
  "na-caribbean-sea": ["в Карибском море", "in the Caribbean Sea"], "na-gulf-of-mexico": ["в Мексиканском заливе", "in the Gulf of Mexico"],
  "na-alaska-peninsula": ["на полуострове Аляска", "on the Alaska Peninsula"], "na-labrador": ["на полуострове Лабрадор", "on the Labrador Peninsula"],
  "na-boothia": ["на полуострове Бутия", "on the Boothia Peninsula"], "na-florida": ["на полуострове Флорида", "on the Florida peninsula"],
  "na-baja-california": ["на полуострове Калифорния", "on the Baja California peninsula"], "na-yucatan": ["на полуострове Юкатан", "on the Yucatán Peninsula"],
  "na-greenland": ["в Гренландии", "in Greenland"], "na-arctic-archipelago": ["в Канадском Арктическом архипелаге", "in the Canadian Arctic Archipelago"],
  "na-baffin": ["на Баффиновой Земле", "on Baffin Island"], "na-newfoundland": ["на острове Ньюфаундленд", "on the island of Newfoundland"],
  "na-cuba": ["на Кубе", "on Cuba"], "na-hispaniola": ["на острове Гаити", "on the island of Hispaniola"],
  "na-hudson-bay": ["в Гудзоновом заливе", "in Hudson Bay"], "na-gulf-of-california": ["в Калифорнийском заливе", "in the Gulf of California"],
};
// An object and the object it lies in never share a puzzle («in the Atlantic» would fit both letters)
export const CONTAINERS = {
  "na-caribbean-sea": ["na-atlantic-ocean"], "na-gulf-of-mexico": ["na-atlantic-ocean"], "na-gulf-of-california": ["na-pacific-ocean"],
  "na-cuba": ["na-caribbean-sea", "na-atlantic-ocean"], "na-hispaniola": ["na-caribbean-sea", "na-atlantic-ocean"],
  "na-newfoundland": ["na-atlantic-ocean"], "na-baffin": ["na-arctic-archipelago", "na-arctic-ocean"], "na-arctic-archipelago": ["na-arctic-ocean"],
  "na-greenland": ["na-arctic-ocean", "na-atlantic-ocean"],
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
function build(word, lang, unit, final, tries = 8000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length;
  const usable = places(unit).filter(p => !fold(PLACE[p.id][li]).includes(fold(word)));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
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
// every review word must fit too: practice lays it out on the same places
for (const u of dict.units) {
  const sectionFinal = u.id === "section-final", unit = sectionFinal ? "section-final" : Number(u.id.match(/^unit-(\d+)/)[1]), U = sectionFinal ? 3 : unit;
  for (const lang of ["en", "ru"]) {
    for (const w of u.words[lang]) if (w.role === "review" && !build(w.answer, lang, U, false, 400)) { console.error(`${lang} ${w.answer}: no layout in unit ${U}`); process.exitCode = 1; }
    const w = u.words[lang].find(w => w.role === "final" || w.role === "section-final");
    const id = `b4-section-1-${sectionFinal ? "final" : `unit-${unit}`}-${lang}`;
    const old = prev.puzzles.find(p => p.id === id);
    if (old?.approval?.status === "approved" && old.answer === w.answer) { puzzles.push(old); continue; }
    const b = build(w.answer, lang, U, sectionFinal);
    if (!b) { console.error(`${id}: ${w.answer} cannot be laid out on the learned objects`); process.exitCode = 1; continue; }
    puzzles.push({ id, section: dict.section, block: 4, unit, role: sectionFinal ? "section-final" : "unit-final", language: lang, answer: w.answer,
      map: BASE, mapAspect: "2200 / 1600", layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b, approval: { status: "draft" } });
  }
}
const out = {
  section: "north-america-on-the-map", block: 4,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters only on objects of data/maps/namerica-overview.json learned by the end of the unit, one letter per object, at the object's label point",
    nesting: "an object never shares a puzzle with the object that contains it or the ocean an island lies in (CONTAINERS in tools/build_b4_geowords.mjs = NA_IN in app/app.js); no letter inside the area of another object of the puzzle",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
