// Builds the draft unit and section finals of block 2 section 1 «Europe on the map» (data/geowords/b2-section-1.json)
// by the same rules the app uses for Europe practice puzzles: letters only on learned objects of the Europe map, one letter
// per object, circles at the object's label point (the Ural River: on its line), no letter inside another object of the
// puzzle or on an object nested in another (a sea in its ocean, an island in its sea), spacing hypot(dx, dy*1600/2200) >= 4.5,
// a place phrase never contains the answer, reveal order as validate-geowords.mjs.
// Section 2 «Rivers of Europe»: letters on the rivers learned by the end of the unit (data/maps/europe-rivers.json, at the middle of the
// river's longest line) and on every object of section 1; the newest unit's rivers first. A river's label inside a peninsula never shares
// a puzzle with that peninsula.
// Usage: node tools/build_b2_geowords.mjs [seed] [section 1|2]  — writes drafts; approved puzzles already in the file are kept as they are.
import fs from "node:fs";

const SEC = Number(process.argv[3] || 1);
const MAP = "data/maps/europe-overview.json", RIVERS = "data/maps/europe-rivers.json";
const DICT = `data/dictionary/b2-section-${SEC}.json`, OUT = `data/geowords/b2-section-${SEC}.json`;
let seed = Number(process.argv[2] || 2026);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Place phrases (the words that follow «Найди N-ю букву» / "Find the Nth letter").
export const PLACE = {
  "atlantic-ocean": ["в Атлантическом океане", "in the Atlantic Ocean"],
  "arctic-ocean": ["в Северном Ледовитом океане", "in the Arctic Ocean"],
  "mediterranean-sea": ["в Средиземном море", "in the Mediterranean Sea"],
  "ural-mountains": ["в Уральских горах", "in the Ural Mountains"],
  "ural-river": ["на реке Урал", "on the Ural River"],
  "caspian-sea": ["в Каспийском море", "in the Caspian Sea"],
  "scandinavian-peninsula": ["на Скандинавском полуострове", "on the Scandinavian Peninsula"],
  "kola-peninsula": ["на Кольском полуострове", "on the Kola Peninsula"],
  "jutland": ["на полуострове Ютландия", "on the Jutland Peninsula"],
  "iberian-peninsula": ["на Пиренейском полуострове", "on the Iberian Peninsula"],
  "apennine-peninsula": ["на Апеннинском полуострове", "on the Apennine Peninsula"],
  "balkan-peninsula": ["на Балканском полуострове", "on the Balkan Peninsula"],
  "crimean-peninsula": ["на Крымском полуострове", "on the Crimean Peninsula"],
  "great-britain": ["на острове Великобритания", "on the island of Great Britain"],
  "ireland": ["на острове Ирландия", "on the island of Ireland"],
  "iceland": ["на острове Исландия", "on the island of Iceland"],
  "sicily": ["на острове Сицилия", "on the island of Sicily"],
  "baltic-sea": ["в Балтийском море", "in the Baltic Sea"],
  "north-sea": ["в Северном море", "in the North Sea"],
  "barents-sea": ["в Баренцевом море", "in the Barents Sea"],
  volga: ["на Волге", "on the Volga"], don: ["на Дону", "on the Don"], dnieper: ["на Днепре", "on the Dnieper"], dniester: ["на Днестре", "on the Dniester"],
  danube: ["на Дунае", "on the Danube"], rhine: ["на Рейне", "on the Rhine"], elbe: ["на Эльбе", "on the Elbe"], oder: ["на Одере", "on the Oder"],
  vistula: ["на Висле", "on the Vistula"], thames: ["на Темзе", "on the Thames"], seine: ["на Сене", "on the Seine"], loire: ["на Луаре", "on the Loire"],
  rhone: ["на Роне", "on the Rhône"], po: ["на реке По", "on the Po"], tiber: ["на Тибре", "on the Tiber"], tagus: ["на Тахо", "on the Tagus"],
  douro: ["на Дуэро", "on the Douro"], guadiana: ["на Гвадиане", "on the Guadiana"], ebro: ["на Эбро", "on the Ebro"], guadalquivir: ["на Гвадалквивире", "on the Guadalquivir"],
};
// An object and the object that contains it never share a puzzle ("in the Atlantic" would fit both letters).
export const CONTAINERS = {
  "north-sea": ["atlantic-ocean"], "baltic-sea": ["atlantic-ocean"], "barents-sea": ["arctic-ocean"],
  "great-britain": ["atlantic-ocean"], "ireland": ["atlantic-ocean"], "iceland": ["atlantic-ocean"], "sicily": ["mediterranean-sea"],
};
const RIVER_POINT = { "ural-river": { x: 81.4, y: 57.08 } };// on the drawn line, next to its label
const ASPECT = 1600 / 2200, SEP = 4.5;

const map = JSON.parse(fs.readFileSync(MAP, "utf8")), rivers = JSON.parse(fs.readFileSync(RIVERS, "utf8")), dict = JSON.parse(fs.readFileSync(DICT, "utf8"));
const tpl = JSON.parse(fs.readFileSync("data/geowords/clue-templates.json", "utf8"));
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const items = Object.fromEntries([...map.items, ...(SEC === 2 ? rivers.items : [])].map(o => [o.id, o]));
const inside = (id, p) => { const o = items[id]; return !!o.tapArea && polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl)); };
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
// section 2: the section-1 objects count as unit 0 (always known), the rivers by their own unit
const places = unit => SEC === 1 ? map.items.filter(o => o.unit <= unit).map(o => ({ id: o.id, unit: o.unit, ...(RIVER_POINT[o.id] || o.label) }))
  : [...rivers.items.filter(o => o.unit <= unit).map(o => ({ id: o.id, unit: o.unit, ...o.label })), ...map.items.map(o => ({ id: o.id, unit: 0, ...(RIVER_POINT[o.id] || o.label) }))];

function build(word, lang, unit, final, tries = 4000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length;
  const usable = places(unit).filter(p => !fold(PLACE[p.id][li]).includes(fold(word)));
  let best = null, bestScore = -1;
  for (let k = 0; k < tries; k++) {
    // the newest unit's objects first, so a unit final is mostly about that unit
    const pool = shuffle([...usable]).sort((a, b) => (b.unit === unit) - (a.unit === unit) || (SEC === 2 ? (b.unit > 0) - (a.unit > 0) : 0));
    const pick = [];
    for (const p of pool) if (pick.length < n && pick.every(q => far(p, q) && !nested(p, q))) pick.push(p);
    if (pick.length < n) continue;
    // spread: the smallest gap between two circles, plus a bonus for using every unit in the section final
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT))));
    const units = new Set(pick.map(p => p.unit).filter(u => u > 0)).size, own = pick.filter(p => p.unit === unit).length, riv = pick.filter(p => p.unit > 0).length;
    const score = gap + (final ? units * 3 + (SEC === 2 ? riv : 0) : own);
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
    const id = `b2-section-${SEC}-${sectionFinal ? "final" : `unit-${unit}`}-${lang}`;
    const old = prev.puzzles.find(p => p.id === id);
    if (old?.approval?.status === "approved" && old.answer === w.answer) { puzzles.push(old); continue; }
    const b = build(w.answer, lang, sectionFinal ? dict.units.length - 1 : unit, sectionFinal);
    if (!b) { console.error(`${id}: ${w.answer} cannot be laid out on the learned objects`); process.exitCode = 1; continue; }
    puzzles.push({ id, section: dict.section, block: 2, unit, role: sectionFinal ? "section-final" : "unit-final", language: lang, answer: w.answer,
      map: SEC === 2 ? "./assets/europe-rivers.webp" : "./assets/europe-blank.webp", mapAspect: "2200 / 1600", layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b,
      approval: { status: "draft" } });
  }
}
const out = SEC === 2 ? {
  section: dict.section, block: 2,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters on the rivers of data/maps/europe-rivers.json learned by the end of the unit (section final: all 20), at the middle of the river's longest line, and on every object of data/maps/europe-overview.json (the Ural River: a point on its line); the newest unit's rivers first",
    nesting: "as section 1, and a river whose letter lies inside a peninsula or a sea never shares a puzzle with it",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : {
  section: "europe-on-the-map", block: 2,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters only on objects of data/maps/europe-overview.json learned by the end of the unit (section final: all 20), one letter per object, at the object's label point (the Ural River: a point on its line)",
    nesting: "an object never shares a puzzle with the object that contains it: the North and Baltic Seas, Great Britain, Ireland and Iceland with the Atlantic; the Barents Sea with the Arctic Ocean; Sicily with the Mediterranean. The Mediterranean and the Atlantic are separate areas on the Europe map and may share a puzzle",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
