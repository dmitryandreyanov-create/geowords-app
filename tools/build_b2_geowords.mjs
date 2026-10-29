// Builds the draft unit and section finals of block 2 section 1 «Europe on the map» (data/geowords/b2-section-1.json)
// by the same rules the app uses for Europe practice puzzles: letters only on learned objects of the Europe map, one letter
// per object, circles at the object's label point (the Ural River: on its line), no letter inside another object of the
// puzzle or on an object nested in another (a sea in its ocean, an island in its sea), spacing hypot(dx, dy*1600/2200) >= 4.5,
// a place phrase never contains the answer, reveal order as validate-geowords.mjs.
// Section 2 «Rivers of Europe»: letters on the rivers learned by the end of the unit (data/maps/europe-rivers.json, at the middle of the
// river's longest line) and on every object of section 1; the newest unit's rivers first. A river's label inside a peninsula never shares
// a puzzle with that peninsula.
// Section 3 «Mountains of Europe»: letters on the ranges learned by the end of the unit (data/maps/europe-mountains.json, at the point of the
// range farthest from its edge) and on the objects of section 1 except the Ural River (rivers are not drawn on the mountains map); a range
// never shares a puzzle with the land of the same name (the Scandinavian Mountains and Peninsula…).
// Section 4 «Countries and capitals: west and north»: letters at the centre of the countries learned by the end of the unit
// (data/maps/europe-countries.json, never on a capital dot) and on the objects of section 1 except the Ural River and the Crimean
// Peninsula (Crimea never appears in country tasks, Svetlana 26.10.2026); spacing 9 (a letter
// marker is ~9% of the map wide on a phone), at most one of the Netherlands, Belgium and Luxembourg; a country never with its island or peninsula.
// Rivers too (Svetlana, 28.10.2026: «в вопросах с буквами должна быть практика про реки»): the map is europe-countries-rivers.webp (the capitals
// map with the rivers of section 2 drawn on it), letters on the 20 rivers of data/maps/europe-rivers.json as well; the countries of the unit and
// the rivers come first, about half of the letters on rivers, the section-1 objects only when they are needed. A river whose letter lies inside a country never shares a puzzle with it.
// Section 5 «Countries and capitals: centre, south and east» (data/maps/europe-countries-5.json): letters at the centre of the countries
// of section 5 learned by the end of the unit and of section 4; on the rivers of section 2, drawn over the capitals map («on the Danube»,
// at the middle of the river's longest line); and on a river inside a country it crosses («on the Danube in Hungary»); the objects of
// section 1 only when places run short. At least a third of the letters on rivers (Svetlana, 28.10.2026: rivers are not practised enough).
// A country is named once per puzzle; a river letter «on the Danube» never shares a puzzle with a country the river crosses; one letter
// per river; spacing 9 as in section 4.
// Usage: node tools/build_b2_geowords.mjs [seed] [section 1|2|3|4|5]  — writes drafts; approved puzzles already in the file are kept as they are.
import fs from "node:fs";

const SEC = Number(process.argv[3] || 1);
const MAP = "data/maps/europe-overview.json", EU_RIVERS = "data/maps/europe-rivers.json", RIVERS = SEC === 5 ? "data/maps/europe-rivers.json" : SEC === 4 ? "data/maps/europe-countries.json" : SEC === 3 ? "data/maps/europe-mountains.json" : "data/maps/europe-rivers.json";
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
  pyrenees: ["в Пиренеях", "in the Pyrenees"], alps: ["в Альпах", "in the Alps"], apennines: ["в Апеннинах", "in the Apennines"], carpathians: ["в Карпатах", "in the Carpathians"],
  "balkan-mountains": ["в Балканских горах", "in the Balkan Mountains"], "dinaric-alps": ["на Динарском нагорье", "in the Dinaric Alps"],
  "scandinavian-mountains": ["в Скандинавских горах", "in the Scandinavian Mountains"], "scottish-highlands": ["на Шотландском нагорье", "in the Scottish Highlands"], caucasus: ["на Кавказе", "in the Caucasus"],
  "united-kingdom": ["в Великобритании", "in the United Kingdom"], "ireland-country": ["в Ирландии", "in Ireland"], france: ["во Франции", "in France"],
  netherlands: ["в Нидерландах", "in the Netherlands"], belgium: ["в Бельгии", "in Belgium"], "luxembourg-country": ["в Люксембурге", "in Luxembourg"], spain: ["в Испании", "in Spain"],
  portugal: ["в Португалии", "in Portugal"], norway: ["в Норвегии", "in Norway"], sweden: ["в Швеции", "in Sweden"], denmark: ["в Дании", "in Denmark"], finland: ["в Финляндии", "in Finland"],
  "iceland-country": ["в Исландии", "in Iceland"],
  douro: ["на Дуэро", "on the Douro"], guadiana: ["на Гвадиане", "on the Guadiana"], ebro: ["на Эбро", "on the Ebro"], guadalquivir: ["на Гвадалквивире", "on the Guadalquivir"],
  germany: ["в Германии", "in Germany"], switzerland: ["в Швейцарии", "in Switzerland"], austria: ["в Австрии", "in Austria"], czechia: ["в Чехии", "in Czechia"],
  poland: ["в Польше", "in Poland"], hungary: ["в Венгрии", "in Hungary"], italy: ["в Италии", "in Italy"], greece: ["в Греции", "in Greece"], serbia: ["в Сербии", "in Serbia"],
  romania: ["в Румынии", "in Romania"], estonia: ["в Эстонии", "in Estonia"], latvia: ["в Латвии", "in Latvia"], lithuania: ["в Литве", "in Lithuania"],
  belarus: ["в Беларуси", "in Belarus"], ukraine: ["в Украине", "in Ukraine"], russia: ["в России", "in Russia"],
};
// «on the Danube in Hungary»: the river phrase, then the country phrase
export const placeOn = (river, country, li) => `${PLACE[river][li]} ${PLACE[country][li]}`;
// An object and the object that contains it never share a puzzle ("in the Atlantic" would fit both letters).
export const CONTAINERS = {
  "north-sea": ["atlantic-ocean"], "baltic-sea": ["atlantic-ocean"], "barents-sea": ["arctic-ocean"],
  "great-britain": ["atlantic-ocean"], "ireland": ["atlantic-ocean"], "iceland": ["atlantic-ocean"], "sicily": ["mediterranean-sea"],
  "scandinavian-mountains": ["scandinavian-peninsula"], "balkan-mountains": ["balkan-peninsula"], apennines: ["apennine-peninsula"], pyrenees: ["iberian-peninsula"],
  "scottish-highlands": ["great-britain"],
  "united-kingdom": ["great-britain"], "ireland-country": ["ireland"], "iceland-country": ["iceland"], norway: ["scandinavian-peninsula"], sweden: ["scandinavian-peninsula"],
  denmark: ["jutland"], spain: ["iberian-peninsula"], portugal: ["iberian-peninsula"],
  italy: ["apennine-peninsula", "sicily"], greece: ["balkan-peninsula"], serbia: ["balkan-peninsula"], russia: ["kola-peninsula", "ural-mountains"],
};
const BENELUX = ["netherlands", "belgium", "luxembourg-country"];
const RIVER_POINT = { "ural-river": { x: 81.4, y: 57.08 } };// on the drawn line, next to its label
const ASPECT = 1600 / 2200, SEP = SEC >= 4 ? 9 : 4.5;

const map = JSON.parse(fs.readFileSync(MAP, "utf8")), rivers = JSON.parse(fs.readFileSync(RIVERS, "utf8")), dict = JSON.parse(fs.readFileSync(DICT, "utf8"));
const tpl = JSON.parse(fs.readFileSync("data/geowords/clue-templates.json", "utf8"));
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const euRivers = SEC === 4 ? JSON.parse(fs.readFileSync(EU_RIVERS, "utf8")).items : [];
const items = Object.fromEntries([...map.items, ...(SEC >= 2 ? rivers.items : []), ...euRivers].map(o => [o.id, o]));
const inside = (id, p) => { const o = items[id]; return !!o.tapArea && polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl)); };
const nested = (a, b) => (BENELUX.includes(a.id) && BENELUX.includes(b.id)) || (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id) || inside(b.id, a) || inside(a.id, b);
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
  : [...rivers.items.filter(o => o.unit <= unit).map(o => ({ id: o.id, unit: o.unit, ...o.label })),
     ...euRivers.map(o => ({ id: o.id, unit: 0, river: true, ...o.label })),
     ...map.items.filter(o => (SEC < 3 || o.id !== "ural-river") && (SEC < 4 || o.id !== "crimean-peninsula")).map(o => ({ id: o.id, unit: 0, ...(RIVER_POINT[o.id] || o.label) }))];

// section 4: the unit's countries and the rivers first (mixed), then the other learned countries, then the section-1 objects
const rank = (p, unit) => (p.unit === unit || p.river ? 0 : p.unit > 0 ? 1 : 2) + rnd() * 1.5;
function build(word, lang, unit, final, tries = SEC === 4 ? 10000 : 4000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length;
  const usable = places(unit).filter(p => !fold(PLACE[p.id][li]).includes(fold(word)));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    // the newest unit's objects first, so a unit final is mostly about that unit
    const pool = SEC === 4 ? usable.map(p => [rank(p, unit), p]).sort((a, b) => a[0] - b[0]).map(e => e[1])
      : shuffle([...usable]).sort((a, b) => (b.unit === unit) - (a.unit === unit) || (SEC >= 2 ? (b.unit > 0) - (a.unit > 0) : 0));
    const pick = [];
    for (const p of pool) if (pick.length < n && pick.every(q => far(p, q) && !nested(p, q))) pick.push(p);
    if (pick.length < n) continue;
    // spread: the smallest gap between two circles, plus a bonus for using every unit in the section final
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT))));
    const units = new Set(pick.map(p => p.unit).filter(u => u > 0)).size, own = pick.filter(p => p.unit === unit).length, riv = pick.filter(p => p.unit > 0).length;
    const rv = pick.filter(p => p.river).length, s1 = pick.filter(p => p.unit === 0 && !p.river).length;
    const score = SEC === 4 ? gap * 0.3 - Math.abs(rv - Math.round(n / 2)) * 2 - s1 * 3 + (final ? units * 3 : own * 2) : gap + (final ? units * 3 + (SEC >= 2 ? riv : 0) : own);
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (!best) return null;
  const order = revealOrder(n);
  const markers = best.map((p, i) => ({ id: p.id, x: p.x, y: p.y, letter: letters[i] }));
  const ord = tpl.ordinals[lang], t = tpl.template[lang];
  const clues = order.map(pos => ({ markerId: markers[pos - 1].id, position: pos, text: t.replace("{ordinal}", ord[pos - 1]).replace("{place}", PLACE[markers[pos - 1].id][li]) }));
  return { markers, clues };
}

// ---- section 5: countries, rivers and «a river in a country» ----
const C5 = SEC === 5 ? JSON.parse(fs.readFileSync("data/maps/europe-countries-5.json", "utf8")) : null;
const C4 = SEC === 5 ? JSON.parse(fs.readFileSync("data/maps/europe-countries.json", "utf8")) : null;
const area5 = SEC === 5 ? Object.fromEntries([...map.items, ...C4.items, ...C5.items].filter(o => o.tapArea).map(o => [o.id, o])) : {};
const in5 = (id, p) => { const o = area5[id]; return !!o && polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl)); };
function places5(unit) {
  const out = [], learned = id => C4.items.some(o => o.id === id) || C5.items.some(o => o.id === id && o.unit <= unit);
  for (const o of C5.items) if (o.unit <= unit) out.push({ id: o.id, kind: "country", country: o.id, unit: o.unit, x: o.label.x, y: o.label.y, place: PLACE[o.id] });
  for (const o of C4.items) out.push({ id: o.id, kind: "country", country: o.id, unit: 0, x: o.label.x, y: o.label.y, place: PLACE[o.id] });
  for (const r of rivers.items) {
    const rc = C5.rivers.find(q => q.id === r.id);
    out.push({ id: r.id, kind: "river", river: r.id, crosses: rc.crosses, unit: 0, x: r.label.x, y: r.label.y, place: PLACE[r.id] });
    for (const q of rc.points) if (learned(q.country))
      out.push({ id: `${r.id}@${q.country}`, kind: "river", river: r.id, country: q.country, unit: 0, x: q.x, y: q.y, place: [0, 1].map(li => placeOn(r.id, q.country, li)) });
  }
  for (const o of map.items) if (o.id !== "ural-river" && o.id !== "crimean-peninsula") out.push({ id: o.id, kind: "object", unit: -1, x: o.label.x, y: o.label.y, place: PLACE[o.id] });
  return out;
}
const conflict5 = (a, b) => (a.river && a.river === b.river) || (a.country && a.country === b.country)
  || (a.kind === "river" && !a.country && b.kind === "country" && a.crosses.includes(b.id)) || (b.kind === "river" && !b.country && a.kind === "country" && b.crosses.includes(a.id))
  || (BENELUX.includes(a.country) && BENELUX.includes(b.country))
  || (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id)
  || (a.kind !== "river" && in5(a.id, b)) || (b.kind !== "river" && in5(b.id, a));
function build5(word, lang, unit, final, tries = 6000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length, needR = Math.ceil(n / 3);
  const usable = places5(unit).filter(p => !fold(p.place[li]).includes(fold(word)));
  let best = null, bestScore = -1;
  for (let k = 0; k < tries; k++) {
    // rivers up to the quota first, then this unit's countries, other countries and rivers, and the section 1 objects last
    const rank = p => p.unit === -1 ? 3 : p.kind === "country" && p.unit === unit ? 0 : 1;
    const pool = shuffle([...usable]).sort((a, b) => rank(a) - rank(b));
    const pick = [], ok = p => pick.every(q => far(p, q) && !conflict5(p, q));
    for (const p of shuffle(usable.filter(p => p.kind === "river"))) if (pick.length < needR && ok(p)) pick.push(p);
    for (const p of pool) if (pick.length < n && !pick.includes(p) && ok(p)) pick.push(p);
    if (pick.length < n || pick.filter(p => p.kind === "river").length < needR) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT))));
    // a unit final is mostly about the unit's countries (their centre or a river in them); section 4 countries and section 1 objects fill in
    const unitOf = c => C5.items.find(o => o.id === c)?.unit || 0;
    const own = pick.filter(p => p.country && unitOf(p.country) === unit).length, units = new Set(pick.map(p => p.country && unitOf(p.country)).filter(Boolean)).size;
    const inCountry = pick.filter(p => p.kind === "river" && p.country).length, filler = pick.filter(p => p.unit === -1).length, sec4 = pick.filter(p => p.country && !unitOf(p.country)).length;
    const score = gap + (final ? units * 4 + pick.filter(p => p.country && unitOf(p.country)).length * 2 : own * 4) + inCountry * 1.5 - sec4 * 1.5 - filler * 3;
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (!best) return null;
  const order = revealOrder(n);
  const markers = best.map((p, i) => ({ id: p.id, x: p.x, y: p.y, letter: letters[i] }));
  const ord = tpl.ordinals[lang], t = tpl.template[lang], ph = Object.fromEntries(best.map(p => [p.id, p.place[li]]));
  const clues = order.map(pos => ({ markerId: markers[pos - 1].id, position: pos, text: t.replace("{ordinal}", ord[pos - 1]).replace("{place}", ph[markers[pos - 1].id]) }));
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
    const b = (SEC === 5 ? build5 : build)(w.answer, lang, sectionFinal ? dict.units.length - 1 : unit, sectionFinal);
    if (!b) { console.error(`${id}: ${w.answer} cannot be laid out on the learned objects`); process.exitCode = 1; continue; }
    puzzles.push({ id, section: dict.section, block: 2, unit, role: sectionFinal ? "section-final" : "unit-final", language: lang, answer: w.answer,
      map: SEC === 5 ? "./assets/europe-capitals.webp" : SEC === 4 ? "./assets/europe-countries-rivers.webp" : SEC === 3 ? "./assets/europe-mountains.webp" : SEC === 2 ? "./assets/europe-rivers.webp" : "./assets/europe-blank.webp", mapAspect: "2200 / 1600", layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b,
      approval: { status: "draft" } });
  }
}
const out = SEC === 5 ? {
  section: dict.section, block: 2,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters at the centre of the countries of data/maps/europe-countries-5.json learned by the end of the unit (section final: all 16) and of section 4; on the rivers of section 2 drawn over the capitals map (at the middle of the river's longest line, «on the Danube»); on a river inside a country it crosses (data/maps/europe-countries-5.json rivers[].points, «on the Danube in Hungary»); the objects of data/maps/europe-overview.json (not the Ural River or the Crimean Peninsula) only when places run short; at least a third of the letters on rivers (Svetlana, 28.10.2026)",
    nesting: "a country is named once per puzzle (its centre or a river in it); one letter per river; a river letter «on the Danube» never shares a puzzle with a country the river crosses; a country never with its island or peninsula (Italy / the Apennine Peninsula, Sicily; Greece and Serbia / the Balkan Peninsula; Russia / the Kola Peninsula, the Ural Mountains; and section 4's); no letter inside the area of another place of the puzzle; at most one of the Netherlands, Belgium and Luxembourg",
    spacing: "hypot(dx, dy * 1600/2200) >= 9 (% of map width), as in section 4",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 4 ? {
  section: dict.section, block: 2,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters at the centre of the countries of data/maps/europe-countries.json learned by the end of the unit (section final: all 13), never on a capital dot, and on the 20 rivers of data/maps/europe-rivers.json (at the middle of the river's longest line; Svetlana 28.10.2026: GeoWords must practise the rivers) first, mixed; then the other countries; the objects of data/maps/europe-overview.json only when needed, except the Ural River and the Crimean Peninsula (never in country tasks, Svetlana 26.10.2026). Map: europe-countries-rivers.webp = the capitals map with the rivers of section 2",
    nesting: "as section 1, and a river whose letter lies inside a country never shares a puzzle with it; a country never shares a puzzle with its island or peninsula (the United Kingdom / Great Britain, Ireland, Iceland, Norway and Sweden / the Scandinavian Peninsula, Denmark / Jutland, Spain and Portugal / the Iberian Peninsula); at most one of the Netherlands, Belgium and Luxembourg (Svetlana, 28.10.2026)",
    spacing: "hypot(dx, dy * 1600/2200) >= 9 (% of map width): a letter marker is ~9% of the map wide on a phone (Svetlana, 28.10.2026)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 3 ? {
  section: dict.section, block: 2,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters on the ranges of data/maps/europe-mountains.json learned by the end of the unit (section final: all 9), at the point of the range farthest from its edge, first; then on the objects of data/maps/europe-overview.json except the Ural River (not drawn on the mountains map)",
    nesting: "as section 1, and a range never shares a puzzle with the land of the same name: the Scandinavian Mountains / Peninsula, the Balkan Mountains / Peninsula, the Apennines / Apennine Peninsula, the Pyrenees / Iberian Peninsula, the Scottish Highlands / Great Britain",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 2 ? {
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
