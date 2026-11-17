// Builds the draft unit and section finals of block 4 section 7 «Countries of the Caribbean islands» (data/geowords/b4-section-7.json)
// by the rules of the country sections (tools/build_b4s6_geowords.mjs) on the Caribbean map (data/maps/namerica-caribbean.json) and the app
// (placesFor, sec 28): the puzzle opens zoomed in on the region of its unit (frames); letters in the island states learned by the end of the
// unit (spots, in the main island), in the countries of section 6 in view, in the seas and the ocean (a grid in open water) and on the
// objects of section 1 (Florida, Yucatán, Cuba, Hispaniola) — Svetlana, 14.11.2026 «Добавить материк». No rivers.
// At least half of the letters in the region of the unit: its island states and the seas around them (REGION_OBJ; unit 2 at most four,
// REG_MAX); a letter outside the region stands well inside the view (6 % of the screen from its edge). A place is named once per puzzle; a country never with its island or peninsula, a sea never with its
// ocean (CONTAINERS = EU_IN in app/app.js); no letter inside the area of another place of the puzzle (the seas excepted: their letters keep
// 2.2 % from any land); spacing 9 % of the screen: hypot(dx, dy*1600/2200) >= 9 / zoom.
// Usage: node tools/build_b4s7_geowords.mjs [seed]  — writes drafts; approved puzzles already in the file are kept as they are.
import fs from "node:fs";

const MAP = "data/maps/namerica-caribbean.json", DICT = "data/dictionary/b4-section-7.json", OUT = "data/geowords/b4-section-7.json";
const BASE = "./assets/namerica-caribbean.webp";
let seed = Number(process.argv[2] || 2026);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Place phrases: NA_PLACE, NA6_IN and NA7_IN in app/app.js
export const PLACE = {
  "na-atlantic-ocean": ["в Атлантическом океане", "in the Atlantic Ocean"], "na-caribbean-sea": ["в Карибском море", "in the Caribbean Sea"],
  "na-gulf-of-mexico": ["в Мексиканском заливе", "in the Gulf of Mexico"], "na-florida": ["на полуострове Флорида", "on the Florida peninsula"],
  "na-yucatan": ["на полуострове Юкатан", "on the Yucatán Peninsula"], "na-hispaniola": ["на острове Гаити", "on the island of Hispaniola"],
  "cty-canada": ["в Канаде", "in Canada"], "cty-united-states": ["в США", "in the United States"], "cty-mexico": ["в Мексике", "in Mexico"],
  "cty-guatemala": ["в Гватемале", "in Guatemala"], "cty-belize": ["в Белизе", "in Belize"], "cty-honduras": ["в Гондурасе", "in Honduras"],
  "cty-el-salvador": ["в Сальвадоре", "in El Salvador"], "cty-nicaragua": ["в Никарагуа", "in Nicaragua"], "cty-costa-rica": ["в Коста-Рике", "in Costa Rica"],
  "cty-panama": ["в Панаме", "in Panama"],
  "cty-cuba": ["на Кубе", "in Cuba"], "cty-bahamas": ["на Багамах", "in the Bahamas"], "cty-jamaica": ["на Ямайке", "in Jamaica"],
  "cty-haiti": ["в Гаити", "in Haiti"], "cty-dominican-republic": ["в Доминиканской Республике", "in the Dominican Republic"],
  "cty-saint-kitts-and-nevis": ["в Сент-Китсе и Невисе", "in Saint Kitts and Nevis"], "cty-antigua-and-barbuda": ["в Антигуа и Барбуде", "in Antigua and Barbuda"],
  "cty-dominica": ["на Доминике", "in Dominica"], "cty-saint-lucia": ["на Сент-Люсии", "in Saint Lucia"],
  "cty-saint-vincent": ["в Сент-Винсенте и Гренадинах", "in Saint Vincent and the Grenadines"], "cty-grenada": ["на Гренаде", "in Grenada"],
  "cty-barbados": ["на Барбадосе", "in Barbados"], "cty-trinidad-and-tobago": ["в Тринидаде и Тобаго", "in Trinidad and Tobago"],
};
export const CONTAINERS = {
  "na-caribbean-sea": ["na-atlantic-ocean"], "na-gulf-of-mexico": ["na-atlantic-ocean"],
  "na-cuba": ["na-caribbean-sea", "na-atlantic-ocean"], "na-hispaniola": ["na-caribbean-sea", "na-atlantic-ocean"],
  "cty-united-states": ["na-florida"], "cty-mexico": ["na-yucatan"], "cty-guatemala": ["na-yucatan"], "cty-belize": ["na-yucatan"],
  "cty-cuba": ["na-cuba"], "cty-haiti": ["na-hispaniola"], "cty-dominican-republic": ["na-hispaniola"],
};
// the places of section 1 that count for the region of a unit (NA7_REG in app/app.js): the seas around its islands
export const REGION_OBJ = { 1: ["na-caribbean-sea", "na-gulf-of-mexico", "na-atlantic-ocean"], 2: ["na-caribbean-sea", "na-atlantic-ocean", "na-hispaniola"],
  3: ["na-caribbean-sea", "na-atlantic-ocean"] };
// a letter outside the region keeps 6 % of the screen from the edge of the view (section 6: 8 %): the mainland of section 6 lies at the edge of
// this map, and the marker (4.5 % of the screen) still stands wholly inside the view
// unit 2: four places of its region can hold letters at once (Haiti, the Dominican Republic, one of the three small states, one sea: Saint Kitts,
// Antigua and Dominica are closer than the spacing), so a word of nine letters has four of them in the region, never fewer
export const REG_MAX = { 2: 4 };
const ASPECT = 1600 / 2200, SEP = 9, EDGE = Number(process.env.EDGE || 6);

const map = JSON.parse(fs.readFileSync(MAP, "utf8")), dict = JSON.parse(fs.readFileSync(DICT, "utf8"));
const tpl = JSON.parse(fs.readFileSync("data/geowords/clue-templates.json", "utf8"));
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const fold = s => s.toUpperCase().replace(/Ё/g, "Е");
const objs = Object.fromEntries([...map.items, ...map.places.filter(p => p.kind !== "water"), ...map.review.filter(o => !["na-caribbean-sea", "na-gulf-of-mexico", "na-atlantic-ocean"].includes(o.id))].map(o => [o.id, { ...(map.review.find(r => r.id === o.id) || {}), ...o }]));
const inArea = (id, p) => { const o = objs[id]; return !!o?.tapArea && o.tapArea.some(pl => inPoly(p.x, p.y, pl)) && !(o.holes || []).some(pl => inPoly(p.x, p.y, pl)); };

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
const frame7 = unit => {
  const k = unit === "S" ? "S" : String(unit), f = { ...map.frames[k], ...(process.env.FRAMES ? JSON.parse(process.env.FRAMES)[k] : {}) }, hw = 50 / f.zoom;
  const cx = Math.min(100 - hw, Math.max(hw, f.x)), cy = Math.min(100 - hw, Math.max(hw, f.y)), m = 4 / f.zoom, e = EDGE / f.zoom;
  return { ...f, inView: p => p.x >= cx - hw + m && p.x <= cx + hw - m && p.y >= cy - hw + m && p.y <= cy + hw - m,
    inner: p => p.x >= cx - hw + e && p.x <= cx + hw - e && p.y >= cy - hw + e && p.y <= cy + hw - e };
};
// a letter in an island state stands in its main part, as deep inside the border as the country allows (Svetlana, 1.11.2026); the spots of
// the countries of section 6 are already well inside them (tools/build_namerica_countries.py)
const R_MARK = 4.5;
const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0; return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
const depthIn = (id, p) => { let d = Infinity; for (const pl of objs[id].tapArea) for (let i = 0, j = pl.length - 1; i < pl.length; j = i++)
  d = Math.min(d, segD(p.x, p.y * ASPECT, pl[j][0], pl[j][1] * ASPECT, pl[i][0], pl[i][1] * ASPECT)); return d; };
function deepSpots(id, spots, zoom) {
  if (spots.length < 2 || !objs[id]?.tapArea) return spots;
  const sc = spots.map(s => [s, depthIn(id, s)]), ok = sc.filter(([, d]) => d >= R_MARK / zoom);
  if (ok.length) return ok.map(([s]) => s);
  const mx = Math.max(...sc.map(([, d]) => d));
  return sc.filter(([, d]) => d >= mx * 0.6).map(([s]) => s);
}
function places7(unit, F) {
  const out = [], add = (base, spots) => { const all = spots.filter(F.inView); if (all.length) out.push({ ...base, spots: base.own ? deepSpots(base.id, all, F.zoom) : all }); };
  for (const o of map.items) if (o.unit <= unit) add({ id: o.id, kind: "country", own: true, unit: o.unit, reg: [o.unit], place: PLACE[o.id] }, o.spots);
  for (const o of map.places) add({ id: o.id, kind: o.kind, unit: 0, reg: Object.keys(REGION_OBJ).filter(u => REGION_OBJ[u].includes(o.id)).map(Number), place: PLACE[o.id] }, o.spots);
  return out;
}
const conflict7 = (a, b) => a.id === b.id || (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id)
  || (a.kind !== "water" && inArea(a.id, b)) || (b.kind !== "water" && inArea(b.id, a));
function build7(word, lang, unit, final, tries = Number(process.env.TRIES || 4000)) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length, needReg = Math.min(Math.ceil(n / 2), final ? 99 : REG_MAX[unit] || 99);
  const F = frame7(final ? "S" : unit), sep = SEP / F.zoom, U = final ? [1, 2, 3] : [unit];
  const usable = places7(unit, F).filter(p => !fold(p.place[li]).includes(fold(word)));
  const inReg = p => p.reg.some(u => U.includes(u));
  if (process.env.LIST) console.error(word, F, usable.map(g => `${g.id}:${g.spots.length}`).join(" "));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    const pick = [], ok = p => pick.every(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT) >= sep && !conflict7(p, q));
    const take = (g, want) => { if (pick.length >= n || pick.some(q => q.id === g.id)) return; for (const s of shuffle([...g.spots])) { const p = { ...g, x: s.x, y: s.y }; if ((!want || want(p)) && (F.inner(p) || inReg(p)) && ok(p)) { pick.push(p); return; } } };
    const groups = shuffle([...usable]).filter(() => k % 4 !== 3 || rnd() > 0.25);
    // the island states of the unit first (the small ones are crowded), then the rest of the region, then everything else
    for (const g of groups.filter(g => g.own && inReg(g))) if (pick.filter(inReg).length < needReg || k % 2) take(g);
    for (const g of groups.filter(inReg)) if (pick.filter(inReg).length < needReg) take(g);
    for (const g of groups.filter(g => g.kind === "country")) take(g);
    for (const g of groups) take(g);
    if (pick.length < n) continue;
    const reg = pick.filter(inReg).length;
    if (reg < needReg) continue;
    const own = pick.filter(p => p.own && U.includes(p.unit)).length;
    if (own < 2) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT)))) * F.zoom;
    const islands = pick.filter(p => p.own).length, water = pick.filter(p => p.kind === "water").length, obj = pick.filter(p => p.kind === "object").length;
    const units = new Set(pick.filter(p => p.own).map(p => p.unit)).size;
    const score = Math.min(gap, 12) + reg * 4 + own * 8 + islands * 4 - water * 2 - obj * 2 + (final ? units * 6 : 0);
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
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
    const id = `b4-section-7-${sectionFinal ? "final" : `unit-${unit}`}-${lang}`;
    if (process.env.ONLY && process.env.ONLY !== id) continue;
    const old = prev.puzzles.find(p => p.id === id);
    if (old?.approval?.status === "approved" && old.answer === w.answer) { puzzles.push(old); continue; }
    const b = build7(w.answer, lang, sectionFinal ? 3 : unit, sectionFinal);
    if (!b) { console.error(`${id}: ${w.answer} cannot be laid out on the learned places`); process.exitCode = 1; continue; }
    console.log(`${id}: ${w.answer} (${b.inRegion}/${w.answer.length} in the region) ${b.markers.map(m => m.id).join(" ")}`);
    puzzles.push({ id, section: dict.section, block: 4, unit, role: sectionFinal ? "section-final" : "unit-final", language: lang, answer: w.answer,
      map: BASE, mapAspect: "2200 / 1600", layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b, approval: { status: "draft" } });
  }
}
fs.writeFileSync(OUT, JSON.stringify({
  section: dict.section, block: 4,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "the puzzle opens zoomed in on the region of its unit (frames of data/maps/namerica-caribbean.json); letters in the island states learned by the end of the unit (spots, main island first), in the countries of section 6 in view, in the seas and the ocean (open water) and on Florida, Yucatán and Hispaniola (Svetlana, 14.11.2026); at least half of the letters in the region of the unit (its island states and the seas around them); a letter outside the region stands well inside the view",
    nesting: "a place is named once per puzzle; a country never with its island or peninsula; a sea never with its ocean; no letter inside the area of another place of the puzzle",
    depth: "a letter in a country stands in its main part, as deep inside the border as the country allows (Svetlana, 1.11.2026)",
    spacing: "letter centres at least 9% of the screen apart: hypot(dx, dy * 1600/2200) >= 9 / the zoom of the puzzle",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
}, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
