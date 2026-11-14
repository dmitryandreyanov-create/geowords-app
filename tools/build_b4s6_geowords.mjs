// Builds the draft unit and section finals of block 4 section 6 «Countries of North and Central America» (data/geowords/b4-section-6.json)
// by the rules of the Asian country sections (tools/build_b3_geowords.mjs, sections 6–8) and the app (placesFor, sec 27):
// the puzzle opens zoomed in on the region of its unit (frames of data/maps/namerica-countries.json); letters anywhere well inside the countries
// learned by the end of the unit (spots, in the main part of the country, its circle inside the border where the country is large enough);
// on the rivers of section 2 that flow through them («on the Usumacinta»); on a river inside a country it crosses («on the Usumacinta in Guatemala»);
// the objects of section 1 in view fill in. At least half of the letters in the region of the unit; a third on rivers, but never more than
// the rivers in view (unit 3 has only the San Juan). A country is named once per puzzle; a river letter «on the Yukon» never shares a puzzle with
// a country the river crosses; one letter per river; a country never with its island, peninsula, gulf or isthmus (CONTAINERS = EU_IN in app/app.js);
// no letter inside the area of another place of the puzzle; spacing 9% of the screen: hypot(dx, dy*1600/2200) >= 9 / zoom.
// Usage: node tools/build_b4s6_geowords.mjs [seed]  — writes drafts; approved puzzles already in the file are kept as they are.
import fs from "node:fs";

const MAP = "data/maps/namerica-overview.json", C6F = "data/maps/namerica-countries.json", DICT = "data/dictionary/b4-section-6.json", OUT = "data/geowords/b4-section-6.json";
const BASE = "./assets/namerica-countries.webp";
let seed = Number(process.argv[2] || 2026);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Place phrases: NA_PLACE, NA2_ON and NA6_IN in app/app.js
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
  "na-mississippi": ["на Миссисипи", "on the Mississippi"], "na-missouri": ["на Миссури", "on the Missouri"], "na-ohio": ["на Огайо", "on the Ohio"],
  "na-arkansas": ["на Арканзасе", "on the Arkansas"], "na-yukon": ["на Юконе", "on the Yukon"], "na-mackenzie": ["на Маккензи", "on the Mackenzie"],
  "na-nelson": ["на Нельсоне", "on the Nelson"], "na-st-lawrence": ["на реке Святого Лаврентия", "on the St. Lawrence"], "na-columbia": ["на Колумбии", "on the Columbia"],
  "na-colorado": ["на Колорадо", "on the Colorado"], "na-rio-grande": ["на Рио-Гранде", "on the Rio Grande"], "na-usumacinta": ["на Усумасинте", "on the Usumacinta"],
  "na-san-juan": ["на Сан-Хуане", "on the San Juan"],
  "cty-canada": ["в Канаде", "in Canada"], "cty-united-states": ["в США", "in the United States"], "cty-mexico": ["в Мексике", "in Mexico"],
  "cty-guatemala": ["в Гватемале", "in Guatemala"], "cty-belize": ["в Белизе", "in Belize"], "cty-honduras": ["в Гондурасе", "in Honduras"],
  "cty-el-salvador": ["в Сальвадоре", "in El Salvador"], "cty-nicaragua": ["в Никарагуа", "in Nicaragua"], "cty-costa-rica": ["в Коста-Рике", "in Costa Rica"],
  "cty-panama": ["в Панаме", "in Panama"],
};
const placeOn = (river, country, li) => `${PLACE[river][li]} ${PLACE[country][li]}`;
export const CONTAINERS = {
  "na-caribbean-sea": ["na-atlantic-ocean"], "na-gulf-of-mexico": ["na-atlantic-ocean"], "na-gulf-of-california": ["na-pacific-ocean"],
  "na-cuba": ["na-caribbean-sea", "na-atlantic-ocean"], "na-hispaniola": ["na-caribbean-sea", "na-atlantic-ocean"], "na-newfoundland": ["na-atlantic-ocean"],
  "na-baffin": ["na-arctic-archipelago", "na-arctic-ocean"], "na-arctic-archipelago": ["na-arctic-ocean"], "na-greenland": ["na-arctic-ocean", "na-atlantic-ocean"],
  "cty-canada": ["na-labrador", "na-arctic-archipelago", "na-baffin", "na-newfoundland", "na-boothia"], "cty-united-states": ["na-florida", "na-alaska-peninsula"],
  "cty-mexico": ["na-baja-california", "na-yucatan"], "cty-guatemala": ["na-yucatan"], "cty-belize": ["na-yucatan"],
  "cty-panama": ["na-isthmus-of-panama"], "cty-costa-rica": ["na-isthmus-of-panama"],
};
// the places of section 1 that count for the region of a unit (NA6_REG in app/app.js)
const REGION_OBJ = { 1: ["na-hudson-bay", "na-labrador", "na-arctic-archipelago", "na-baffin", "na-boothia", "na-newfoundland", "na-florida", "na-alaska-peninsula"],
  2: ["na-yucatan", "na-baja-california", "na-gulf-of-mexico", "na-gulf-of-california"], 3: ["na-isthmus-of-panama", "na-caribbean-sea"] };
const ASPECT = 1600 / 2200, SEP = 9;

const map = JSON.parse(fs.readFileSync(MAP, "utf8")), C6 = JSON.parse(fs.readFileSync(C6F, "utf8")), dict = JSON.parse(fs.readFileSync(DICT, "utf8"));
const tpl = JSON.parse(fs.readFileSync("data/geowords/clue-templates.json", "utf8"));
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const fold = s => s.toUpperCase().replace(/Ё/g, "Е");
const area6 = Object.fromEntries([...map.items, ...C6.items].filter(o => o.tapArea).map(o => [o.id, o]));
const in6m = new Map(), in6 = (id, p) => { const k = id + " " + p.x + " " + p.y; if (!in6m.has(k)) { const o = area6[id]; in6m.set(k, !!o && polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl))); } return in6m.get(k); };

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
const frame6 = unit => {
  const k = unit === "section-final" || unit === "S" ? "S" : String(unit), f = { ...C6.frames[k], ...(process.env.FRAMES ? JSON.parse(process.env.FRAMES)[k] : {}) }, hw = 50 / f.zoom;
  const cx = Math.min(100 - hw, Math.max(hw, f.x)), cy = Math.min(100 - hw, Math.max(hw, f.y)), m = 4 / f.zoom;
  return { ...f, inView: p => p.x >= cx - hw + m && p.x <= cx + hw - m && p.y >= cy - hw + m && p.y <= cy + hw - m };
};
// a letter in a country stands in the main part of the country (the part with its label), its circle wholly inside the border where it fits
const R_MARK = 4.5;
let DEEP = 1;
const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0; return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
const depthIn = (cid, p) => { let d = Infinity; const o = area6[cid]; for (const pl of [...polys(o.tapArea), ...polys(o.holes)]) for (let i = 0, j = pl.length - 1; i < pl.length; j = i++)
  d = Math.min(d, segD(p.x, p.y * ASPECT, pl[j][0], pl[j][1] * ASPECT, pl[i][0], pl[i][1] * ASPECT)); return d; };
// a finer grid than the spots of the map (0.3% of the map width) in the main part of the country, so small countries (Belize, El Salvador) get deep places
const gridM = new Map();
function gridSpots(cid, F) {
  const k = cid + F.zoom + F.x + F.y; if (gridM.has(k)) return gridM.get(k);
  const o = area6[cid], main = polys(o.tapArea).filter(pl => !o.label || inPoly(o.label.x, o.label.y, pl)), out = [];
  for (const pl of main) { const xs = pl.map(q => q[0]), ys = pl.map(q => q[1]);
    for (let x = Math.ceil(Math.min(...xs) / 0.3) * 0.3; x <= Math.max(...xs); x += 0.3) for (let y = Math.ceil(Math.min(...ys) / 0.3) * 0.3; y <= Math.max(...ys); y += 0.3) {
      const s = { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
      if (F.inView(s) && inPoly(s.x, s.y, pl) && !polys(o.holes).some(h => inPoly(s.x, s.y, h)) && depthIn(cid, s) >= 0.25) out.push(s);
    } }
  gridM.set(k, out); return out;
}
function deepSpots(cid, spots, zoom) {
  const o = area6[cid]; if (!o) return spots;
  const main = o.label ? polys(o.tapArea).filter(pl => inPoly(o.label.x, o.label.y, pl)) : [];
  const inMain = main.length ? spots.filter(s => main.some(pl => inPoly(s.x, s.y, pl))) : [];
  const sc = (inMain.length ? inMain : spots).map(s => [s, depthIn(cid, s)]), ok = sc.filter(([, d]) => d >= DEEP * R_MARK / zoom);
  if (ok.length) return ok.map(([s]) => s);
  const mx = Math.max(...sc.map(([, d]) => d));
  return sc.filter(([, d]) => d >= mx * 0.8).map(([s]) => s);
}
function places6(unit, F) {
  const out = [], learned = id => C6.items.some(o => o.id === id && o.unit <= unit), uOf = id => C6.items.find(o => o.id === id)?.unit;
  const add = (base, spots) => { const all = spots.filter(F.inView); if (all.length) out.push({ ...base, spots: base.kind === "country" ? deepSpots(base.country, [...all, ...gridSpots(base.country, F)], F.zoom) : base.country ? deepSpots(base.country, all, F.zoom) : all, allSpots: all }); };
  for (const o of C6.items) if (o.unit <= unit) add({ id: o.id, kind: "country", country: o.id, unit: o.unit, reg: [o.unit], place: PLACE[o.id] }, o.spots);
  for (const rc of C6.rivers) {
    // never a river letter inside a country of a later unit (the San Juan in Nicaragua before Nicaragua is taught)
    add({ id: rc.id, kind: "river", river: rc.id, crosses: rc.crosses, unit: 0, reg: null, place: PLACE[rc.id] }, rc.spots.filter(s => !C6.items.some(o => o.unit > unit && in6(o.id, s))));
    for (const q of rc.points) if (learned(q.country))
      add({ id: `${rc.id}@${q.country}`, kind: "river", river: rc.id, country: q.country, unit: 0, reg: [uOf(q.country)], place: [0, 1].map(li => placeOn(rc.id, q.country, li)) }, q.spots || [q]);
  }
  for (const o of map.items) add({ id: o.id, kind: "object", unit: -1, reg: Object.keys(REGION_OBJ).filter(u => REGION_OBJ[u].includes(o.id)).map(Number), place: PLACE[o.id] }, [o.label]);
  return out;
}
// a plain river letter («on the Yukon») is in the region of the unit whose country it stands in
const regOf = p => p.reg || p.sreg || (p.sreg = C6.items.filter(o => in6(o.id, p)).map(o => o.unit));
const conflict6 = (a, b) => (a.river && a.river === b.river) || (a.country && a.country === b.country)
  || (a.kind === "river" && !a.country && b.kind === "country" && a.crosses.includes(b.id)) || (b.kind === "river" && !b.country && a.kind === "country" && b.crosses.includes(a.id))
  || (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id)
  || (a.country && (CONTAINERS[a.country] || []).includes(b.id)) || (b.country && (CONTAINERS[b.country] || []).includes(a.id))
  || (a.kind !== "river" && in6(a.id, b)) || (b.kind !== "river" && in6(b.id, a));
function build6(word, lang, unit, final, tries = Number(process.env.TRIES || 4000)) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length, needReg = Math.ceil(n / 2);
  const F = frame6(final ? "S" : unit), sep = SEP / F.zoom, U = final ? [1, 2, 3] : [unit];
  const usable = places6(unit, F).filter(p => !fold(p.place[li]).includes(fold(word)));
  const needR = Math.min(Math.ceil(n / 3), new Set(usable.filter(p => p.kind === "river").map(p => p.river)).size);
  const inReg = p => regOf(p).some(u => U.includes(u));
  if (process.env.LIST) console.error(word, F, needR, usable.map(g => `${g.id}:${g.spots.length}/${g.spots.filter(s => inReg({ ...g, ...s, sreg: undefined })).length}`).join(" "));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    const pick = [], ok = p => pick.every(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT) >= sep && !conflict6(p, q));
    const take = (g, want) => { if (pick.length >= n || pick.some(q => q.id === g.id)) return; for (const s of shuffle([...g.spots])) { const p = { ...g, x: s.x, y: s.y, sreg: undefined }; if ((!want || want(p)) && ok(p)) { pick.push(p); return; } } };
    const groups = shuffle([...usable]);
    // the region of the unit first in half of the tries (Central America is small and crowded), rivers first in the other half
    // (its countries first, then the rivers, then the places of section 1: a peninsula would shut out the countries it lies in)
    const kindOrder = { country: 0, river: 1, object: 2 };
    if (k % 2) for (const g of [...groups].sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind])) if (pick.filter(inReg).length < needReg) take(g, inReg);
    for (const g of groups.filter(g => g.kind === "river")) if (pick.filter(p => p.kind === "river").length < needR) take(g);
    for (const g of groups.filter(g => g.kind !== "object" && (g.reg ? g.reg.some(u => U.includes(u)) : true))) take(g);
    for (const g of groups) take(g);
    if (process.env.DEBUG) { const st = globalThis.__st ||= {}; const key = `${pick.length}/${n} r${pick.filter(p => p.kind === "river").length}/${needR} g${pick.filter(inReg).length}/${needReg} c${pick.filter(p => p.kind === "country" && U.includes(p.unit)).length}`; st[key] = (st[key] || 0) + 1; }
    if (pick.length < n || pick.filter(p => p.kind === "river").length < needR) continue;
    const reg = pick.filter(inReg).length;
    if (reg < needReg) continue;
    // a countries puzzle names at least one country of its unit by itself («в Канаде»), and two from unit 2 on
    const own = pick.filter(p => p.kind === "country" && U.includes(p.unit)).length;
    if (own < (unit === 1 && !final ? 1 : 2)) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT)))) * F.zoom;
    const units = new Set(pick.flatMap(regOf)).size, ctry = pick.filter(p => p.kind === "country").length;
    const inCountry = pick.filter(p => p.kind === "river" && p.country).length, obj = pick.filter(p => p.kind === "object").length;
    // a final names many different countries of the section
    const named = new Set(pick.map(p => p.country).filter(Boolean)).size;
    const score = Math.min(gap, 12) + reg * 6 + ctry * 7 + inCountry * 2 - obj * 2 + named * 2 + (final ? units * 5 : 0);
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (process.env.DEBUG) { console.error(word, Object.entries(globalThis.__st || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)); globalThis.__st = {}; }
  if (!best) return null;
  const order = revealOrder(n);
  const markers = best.map((p, i) => ({ id: p.id, x: p.x, y: p.y, letter: letters[i] }));
  const ord = tpl.ordinals[lang], t = tpl.template[lang], ph = Object.fromEntries(best.map(p => [p.id, p.place[li]]));
  const clues = order.map(pos => ({ markerId: markers[pos - 1].id, position: pos, text: t.replace("{ordinal}", ord[pos - 1]).replace("{place}", ph[markers[pos - 1].id]) }));
  return { markers, clues, focus: { x: F.x, y: F.y, zoom: F.zoom }, inRegion: best.filter(inReg).length };
}

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { puzzles: [] };
const puzzles = [];
for (const u of dict.units) {
  const sectionFinal = u.id === "section-final", unit = sectionFinal ? "section-final" : Number(u.id.match(/^unit-(\d+)/)[1]);
  for (const lang of ["en", "ru"]) {
    const w = u.words[lang].find(w => w.role === "final" || w.role === "section-final");
    const id = `b4-section-6-${sectionFinal ? "final" : `unit-${unit}`}-${lang}`;
    if (process.env.ONLY && process.env.ONLY !== id) continue;
    const old = prev.puzzles.find(p => p.id === id);
    if (old?.approval?.status === "approved" && old.answer === w.answer) { puzzles.push(old); continue; }
    const U = sectionFinal ? dict.units.length - 1 : unit;
    let b = null;
    for (DEEP of [1, 0.8, 0.6, 0.5, 0.4, 0.3]) if ((b = build6(w.answer, lang, U, sectionFinal))) break;
    const deep = DEEP; DEEP = 1;
    if (!b) { console.error(`${id}: ${w.answer} cannot be laid out on the learned places`); process.exitCode = 1; continue; }
    console.log(`${id}: ${w.answer} (depth ${deep}, ${b.inRegion}/${w.answer.length} in the region) ${b.markers.map(m => m.id).join(" ")}`);
    puzzles.push({ id, section: dict.section, block: 4, unit, role: sectionFinal ? "section-final" : "unit-final", language: lang, answer: w.answer,
      map: BASE, mapAspect: "2200 / 1600", layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b, approval: { status: "draft" } });
  }
}
fs.writeFileSync(OUT, JSON.stringify({
  section: dict.section, block: 4,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "the puzzle opens zoomed in on the region of its unit (frames of data/maps/namerica-countries.json); letters anywhere well inside the countries learned by the end of the unit (spots), on the rivers of section 2 that flow through them («on the Usumacinta»), on a river inside a country it crosses («on the Usumacinta in Guatemala»), and on the objects of section 1 in view; at least half of the letters in the region of the unit, a third on rivers but never more than the rivers in view",
    nesting: "a country is named once per puzzle; a river letter «on the Yukon» never shares a puzzle with a country the river crosses; one letter per river; a country never with its island, peninsula, gulf or isthmus; no letter inside the area of another place of the puzzle",
    depth: "a letter in a country stands in the main part of the country, its circle wholly inside the border at the zoom of the puzzle where the country is large enough (4.5% of the screen from the border), else as deep as it can (Svetlana, 1.11.2026)",
    spacing: "letter centres at least 9% of the screen apart: hypot(dx, dy * 1600/2200) >= 9 / the zoom of the puzzle",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
}, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
