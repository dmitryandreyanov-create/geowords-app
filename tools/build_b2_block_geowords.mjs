// Builds the draft block-final GeoWords of block 2 «Europe» (data/geowords/b2-block.json) on the capitals map with the rivers of
// section 2 (europe-countries-rivers.webp), by the section 5 rules over the whole block: letters at the centre of the 29 countries of
// sections 4 and 5, on the 20 rivers («on the Danube») and on a river inside a country it crosses («on the Danube in Hungary»);
// the objects of section 1 (not the Ural River or the Crimean Peninsula) only when places run short. At least a third of the letters
// on rivers (Svetlana, 28.10.2026); a country named once per puzzle; one letter per river; «on the Danube» never with a country the
// Danube crosses; a country never with its island or peninsula; at most one of the Netherlands, Belgium and Luxembourg; spacing 9.
// The mountains are not drawn on this map, so the block final has no letters on them.
// Usage: node tools/build_b2_block_geowords.mjs [seed]  — approved puzzles already in the file are kept as they are.
import fs from "node:fs";

let seed = Number(process.argv[2] || 2029);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const map = read("data/maps/europe-overview.json"), rivers = read("data/maps/europe-rivers.json"), C4 = read("data/maps/europe-countries.json"), C5 = read("data/maps/europe-countries-5.json");
const dict = read("data/dictionary/b2-block.json"), tpl = read("data/geowords/clue-templates.json");
const OUT = "data/geowords/b2-block.json";

// place phrases exactly as in the approved section GeoWords (tools/build_b2_geowords.mjs)
const src = fs.readFileSync("tools/build_b2_geowords.mjs", "utf8");
const PLACE = Function(`return ${src.slice(src.indexOf("export const PLACE = ") + 20, src.indexOf("};", src.indexOf("export const PLACE = ")) + 1)}`)();
const CONTAINERS = Function(`return ${src.slice(src.indexOf("export const CONTAINERS = ") + 26, src.indexOf("};", src.indexOf("export const CONTAINERS = ")) + 1)}`)();
const BENELUX = ["netherlands", "belgium", "luxembourg-country"], ASPECT = 1600 / 2200, SEP = 9;
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const area = Object.fromEntries([...map.items, ...C4.items, ...C5.items].filter(o => o.tapArea).map(o => [o.id, o]));
const inA = (id, p) => { const o = area[id]; return !!o && polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl)); };
const far = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * ASPECT) >= SEP;
const fold = s => s.toUpperCase().replace(/Ё/g, "Е");

function places() {
  const out = [];
  for (const o of [...C4.items, ...C5.items]) out.push({ id: o.id, kind: "country", country: o.id, sec: C4.items.includes(o) ? 4 : 5, x: o.label.x, y: o.label.y, place: PLACE[o.id] });
  for (const r of rivers.items) {
    const rc = C5.rivers.find(q => q.id === r.id);
    out.push({ id: r.id, kind: "river", river: r.id, crosses: rc.crosses, x: r.label.x, y: r.label.y, place: PLACE[r.id] });
    for (const q of rc.points) out.push({ id: `${r.id}@${q.country}`, kind: "river", river: r.id, country: q.country, x: q.x, y: q.y, place: [0, 1].map(li => `${PLACE[r.id][li]} ${PLACE[q.country][li]}`) });
  }
  for (const o of map.items) if (o.id !== "ural-river" && o.id !== "crimean-peninsula") out.push({ id: o.id, kind: "object", sec: 1, x: o.label.x, y: o.label.y, place: PLACE[o.id] });
  return out;
}
const conflict = (a, b) => (a.river && a.river === b.river) || (a.country && a.country === b.country)
  || (a.kind === "river" && !a.country && b.kind === "country" && a.crosses.includes(b.id)) || (b.kind === "river" && !b.country && a.kind === "country" && b.crosses.includes(a.id))
  || (BENELUX.includes(a.country) && BENELUX.includes(b.country))
  || (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id)
  || (a.kind !== "river" && inA(a.id, b)) || (b.kind !== "river" && inA(b.id, a));
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
// the whole block: countries of both sections, rivers, a river in a country, and one section-1 object (a peninsula, island or sea)
function build(word, lang, tries = 20000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length, needR = Math.ceil(n / 3);
  const usable = places().filter(p => !fold(p.place[li]).includes(fold(word)));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    const pick = [], ok = p => pick.every(q => far(p, q) && !conflict(p, q));
    for (const p of shuffle(usable.filter(p => p.kind === "river"))) if (pick.length < needR && ok(p)) pick.push(p);
    for (const p of shuffle([...usable])) if (pick.length < n && !pick.includes(p) && ok(p)) pick.push(p);
    if (pick.length < n || pick.filter(p => p.kind === "river").length < needR) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT))));
    const s4 = pick.filter(p => p.kind === "country" && p.sec === 4).length, s5 = pick.filter(p => p.kind === "country" && p.sec === 5).length;
    const objs = pick.filter(p => p.kind === "object").length, inCountry = pick.filter(p => p.kind === "river" && p.country).length;
    // every section of the block shows up: both country sections, rivers (a river in a country too) and one section-1 place
    const score = gap + Math.min(s4, 3) * 2 + Math.min(s5, 3) * 2 + Math.min(inCountry, 2) * 2 + (objs === 1 ? 4 : -3 * Math.abs(objs - 1));
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (!best) return null;
  const order = revealOrder(n);
  const markers = best.map((p, i) => ({ id: p.id, x: p.x, y: p.y, letter: letters[i] }));
  const ord = tpl.ordinals[lang], t = tpl.template[lang], ph = Object.fromEntries(best.map(p => [p.id, p.place[li]]));
  const clues = order.map(pos => ({ markerId: markers[pos - 1].id, position: pos, text: t.replace("{ordinal}", ord[pos - 1]).replace("{place}", ph[markers[pos - 1].id]) }));
  return { markers, clues };
}
const prev = fs.existsSync(OUT) ? read(OUT) : { puzzles: [] };
const puzzles = [];
for (const lang of ["en", "ru"]) {
  const w = dict.units.find(u => u.id === "block-final").words[lang][0], id = `b2-block-final-${lang}`;
  const old = prev.puzzles.find(p => p.id === id);
  if (old?.approval?.status === "approved" && old.answer === w.answer) { puzzles.push(old); continue; }
  const b = build(w.answer, lang);
  if (!b) { console.error(`${id}: ${w.answer} cannot be laid out`); process.exitCode = 1; continue; }
  puzzles.push({ id, block: "europe-2", unit: "block-final", role: "block-final", language: lang, answer: w.answer, map: "./assets/europe-countries-rivers.webp", mapAspect: "2200 / 1600",
    layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b, approval: { status: "draft" } });
}
fs.writeFileSync(OUT, JSON.stringify({ block: "europe-2", rules: {
  clues: "clues in reveal order; position = slot the letter fills",
  places: "letters at the centre of the 29 countries of sections 4 and 5 (data/maps/europe-countries.json, europe-countries-5.json), on the 20 rivers of section 2 drawn over the capitals map («on the Danube», at the middle of the river's longest line) and on a river inside a country it crosses («on the Danube in Hungary»); the objects of data/maps/europe-overview.json (not the Ural River or the Crimean Peninsula) only when places run short; at least a third of the letters on rivers (Svetlana, 28.10.2026). The mountains are not drawn on this map",
  nesting: "as b2-section-5.json: a country named once per puzzle; one letter per river; a river letter «on the Danube» never shares a puzzle with a country the river crosses; a country never with its island or peninsula; no letter inside the area of another place; at most one of the Netherlands, Belgium and Luxembourg",
  spacing: "hypot(dx, dy * 1600/2200) >= 9 (% of map width)",
  role: "block-final: the final GeoWords of the block 2 review (passport stamp)",
  approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets" }, puzzles }, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
