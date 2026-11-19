// Builds the draft unit and section finals of block 4 section 4 «Mountains and Plains of North America» (data/geowords/b4-section-4.json)
// by the same rules the app uses for its practice puzzles (placesFor, sec 25): letters on the ranges, uplands, plains, Denali and the volcanoes of data/maps/namerica-mountains.json
// learned by the end of the unit first (at the object's label point), then on the objects of section 1 (data/maps/namerica-overview.json);
// one letter per object; no letter inside another object of the puzzle,
// and a sea, a gulf or an island never with the ocean or the sea it lies in (CONTAINERS = NA_IN in app/app.js); spacing hypot(dx, dy*1600/2200) >= 4.5;
// a place phrase never contains the answer; reveal order as validate-geowords.mjs.
// Usage: node tools/build_b4s4_geowords.mjs [seed]  — writes drafts; approved puzzles already in the file are kept as they are.
import fs from "node:fs";

const MAP = "data/maps/namerica-overview.json", RIV = "data/maps/namerica-mountains.json", DICT = "data/dictionary/b4-section-4.json", OUT = "data/geowords/b4-section-4.json", BASE = "./assets/namerica-mountains.webp";
let seed = Number(process.argv[2] || 2026);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Place phrases (the words that follow «Найди N-ю букву» / "Find the Nth letter"); the same as NA_PLACE in app/app.js.
const PLACE1 = {
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
const CONTAINERS = {
  "na-caribbean-sea": ["na-atlantic-ocean"], "na-gulf-of-mexico": ["na-atlantic-ocean"], "na-gulf-of-california": ["na-pacific-ocean"],
  "na-cuba": ["na-caribbean-sea", "na-atlantic-ocean"], "na-hispaniola": ["na-caribbean-sea", "na-atlantic-ocean"],
  "na-newfoundland": ["na-atlantic-ocean"], "na-baffin": ["na-arctic-archipelago", "na-arctic-ocean"], "na-arctic-archipelago": ["na-arctic-ocean"],
  "na-greenland": ["na-arctic-ocean", "na-atlantic-ocean"],
};
// Place phrases of the mountains and plains; the same as NA4_IN in app/app.js
const ON = {
  "na-rockies": ["в Скалистых горах", "in the Rocky Mountains"], "na-coast-ranges": ["в Береговых хребтах", "in the Pacific Coast Ranges"],
  "na-alaska-range": ["в Аляскинском хребте", "in the Alaska Range"], "na-denali": ["на Денали", "on Denali"], "na-cascades": ["в Каскадных горах", "in the Cascade Range"],
  "na-sierra-nevada": ["в Сьерра-Неваде", "in the Sierra Nevada"], "na-sierra-madre-occidental": ["в Западной Сьерра-Мадре", "in the Sierra Madre Occidental"],
  "na-sierra-madre-oriental": ["в Восточной Сьерра-Мадре", "in the Sierra Madre Oriental"], "na-mexican-plateau": ["на Мексиканском нагорье", "on the Mexican Plateau"],
  "na-orizaba": ["на вулкане Орисаба", "on Pico de Orizaba"], "na-popocatepetl": ["на вулкане Попокатепетль", "on Popocatépetl"], "na-appalachians": ["в Аппалачах", "in the Appalachians"],
  "na-laurentian-upland": ["на Лаврентийской возвышенности", "on the Laurentian Upland"], "na-great-plains": ["на Великих равнинах", "on the Great Plains"],
  "na-central-lowland": ["на Центральных равнинах", "on the Central Lowland"],
};
const PLACE = { ...PLACE1, ...ON };
const ASPECT = 1600 / 2200, SEP = 4.5; // = the app (sec 25)
const map = JSON.parse(fs.readFileSync(MAP, "utf8")), riv = JSON.parse(fs.readFileSync(RIV, "utf8")), dict = JSON.parse(fs.readFileSync(DICT, "utf8"));
const tpl = JSON.parse(fs.readFileSync("data/geowords/clue-templates.json", "utf8"));
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const items = Object.fromEntries([...map.items, ...riv.items].map(o => [o.id, o]));
const isRiver = id => id in ON;
const inside = (id, p) => { const o = items[id]; if (!o) return false; return polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl)); };
const nested = (a, b) => (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id) || inside(b.id, a) || inside(a.id, b);
const far = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * ASPECT) >= SEP;
const fold = s => s.toUpperCase().replace(/Ё/g, "Е").replace(/[ÁÉÍÓÚ]/g, c => "AEIOU"["ÁÉÍÓÚ".indexOf(c)]); // = fold in app/app.js
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
const places = unit => [...riv.items.filter(o => o.unit <= unit).map(o => ({ id: o.id, unit: o.unit, river: true, ...o.label })),
  ...map.items.map(o => ({ id: o.id, unit: 0, river: false, ...o.label }))];
function build(word, lang, unit, final, tries = 8000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length;
  const usable = places(unit).filter(p => !fold(PLACE[p.id][li]).includes(fold(word)));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    const pool = shuffle([...usable]).sort((a, b) => (b.river - a.river) || (final ? 0 : (b.unit === unit) - (a.unit === unit)));
    const pick = [];
    for (const p of pool) if (pick.length < n && pick.every(q => far(p, q) && !nested(p, q))) pick.push(p);
    if (pick.length < n) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT))));
    const units = new Set(pick.filter(p => p.river).map(p => p.unit)).size, own = pick.filter(p => p.river && p.unit === unit).length + pick.filter(p => p.river).length;
    const score = gap + (final ? units * 3 : own) + 20 * pick.filter(p => p.river).length; // as many learned objects as fit
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (!best) return null;
  const order = revealOrder(n);
  if (!order) return null; // 4 letters: no reveal order fits the rules
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
    const id = `b4-section-4-${sectionFinal ? "final" : `unit-${unit}`}-${lang}`;
    const old = prev.puzzles.find(p => p.id === id);
    if (old?.approval?.status === "approved" && old.answer === w.answer) { puzzles.push(old); continue; }
    const b = build(w.answer, lang, U, sectionFinal);
    if (!b) { console.error(`${id}: ${w.answer} cannot be laid out on the learned objects`); process.exitCode = 1; continue; }
    puzzles.push({ id, section: dict.section, block: 4, unit, role: sectionFinal ? "section-final" : "unit-final", language: lang, answer: w.answer,
      map: BASE, mapAspect: "2200 / 1600", layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b, approval: { status: "draft" } });
  }
}
const out = {
  section: "mountains-and-plains-of-north-america", block: 4,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters on the objects of data/maps/namerica-mountains.json learned by the end of the unit (section final: all 15), at the label point, first; a mountain-name word never on the same object; then on the objects of data/maps/namerica-overview.json (section 1); one letter per object",
    nesting: "an object never shares a puzzle with the object that contains it or the ocean an island lies in (CONTAINERS in tools/build_b4_geowords.mjs = NA_IN in app/app.js); no letter inside the area of another object of the puzzle",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width), as sections 1–2",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
