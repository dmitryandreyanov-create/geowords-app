// Builds the draft block-final GeoWords of block 3 «Asia» (data/geowords/b3-block.json) on the whole countries map of Asia
// (asia-countries.webp: the rivers map with borders and capital dots), by the rules of sections 6–8 over the whole block:
// letters in the 49 countries of sections 6–8, on the 23 rivers of section 2 («on the Mekong») and on a river inside a country it crosses
// («on the Mekong in Cambodia»), in the four lakes of section 3 drawn on the map (Caspian, Aral, Balkhash, Issyk-Kul) and on the objects
// of section 1 (not the Arctic Ocean, Chukotka or the Bering Strait). At least a third of the letters on rivers (Svetlana, 28.10.2026).
// A letter in a country stands in the main part of the country with its circle wholly inside the border (Svetlana, 1.11.2026: deepSpots of
// tools/build_b3_geowords.mjs, here at zoom 1, the whole map): a country too small for that takes no letter. A country is named once per
// puzzle; one letter per river; «on the Mekong» never with a country the Mekong crosses; a country (or «a river in it») never with its island
// or peninsula; no letter inside the area of another place of the puzzle; spacing 9% of the map width.
// Every part of the block shows up: countries of each of sections 6, 7 and 8, rivers, a river in a country, a lake and a section-1 place.
// RU and EN are laid out separately and each layout is checked on its own (Svetlana's point 7).
// Usage: node tools/build_b3_block_geowords.mjs [seed]  — approved puzzles already in the file are kept as they are.
import fs from "node:fs";

let seed = Number(process.argv[2] || 2031);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const S1 = read("data/maps/asia-overview.json"), RIV = read("data/maps/asia-rivers.json"), LAKES = read("data/maps/asia-lakes.json");
const C = [6, 7, 8].map(n => read(`data/maps/asia-countries-${n}.json`));
const dict = read("data/dictionary/b3-block.json"), tpl = read("data/geowords/clue-templates.json");
const OUT = "data/geowords/b3-block.json";

// place phrases and containers exactly as in the approved section GeoWords (tools/build_b3_geowords.mjs)
const src = fs.readFileSync("tools/build_b3_geowords.mjs", "utf8");
const grab = name => Function(`return ${src.slice(src.indexOf(`export const ${name} = `) + `export const ${name} = `.length, src.indexOf("};", src.indexOf(`export const ${name} = `)) + 1)}`)();
const PLACE = grab("PLACE"), CONTAINERS = grab("CONTAINERS");
// R_MARK: the letter circle is about 31 px on a phone map about 360 px wide (portrait, the whole map at zoom 1): radius 4.3% of the map width, so a circle wholly inside the border needs a depth of 4.5 (with a little air).
// SEP 10, not 9: at 9 the 46 px tap squares of two letters can overlap on the whole map
const ASPECT = 1600 / 2200, SEP = 10, R_MARK = 4.5;
const NEVER = ["as-arctic-ocean", "as-chukotka", "as-bering-strait"], LAKE_IDS = ["as-caspian", "as-aral", "as-balkhash", "as-issyk-kul"];
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const countries = C.flatMap((m, i) => m.items.map(o => ({ ...o, sec: 6 + i })));
const area = Object.fromEntries([...S1.items, ...LAKES.items.filter(o => LAKE_IDS.includes(o.id)), ...countries].filter(o => o.tapArea).map(o => [o.id, o]));
const inA = (id, p) => { const o = area[id]; return !!o && polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl)); };
const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0; return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
const depthIn = (cid, p) => { let d = Infinity; const o = area[cid]; for (const pl of [...polys(o.tapArea), ...polys(o.holes)]) for (let i = 0, j = pl.length - 1; i < pl.length; j = i++)
  d = Math.min(d, segD(p.x, p.y * ASPECT, pl[j][0], pl[j][1] * ASPECT, pl[i][0], pl[i][1] * ASPECT)); return d; };
// the spots of a country (or of a river inside it) in the main part of the country, the letter circle wholly inside the border on the whole map
function deep(cid, spots) {
  const o = area[cid], main = polys(o.tapArea).filter(pl => inPoly(o.label.x, o.label.y, pl));
  const inMain = main.length ? spots.filter(s => main.some(pl => inPoly(s.x, s.y, pl))) : spots;
  return inMain.filter(s => depthIn(cid, s) >= R_MARK);
}
const far = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * ASPECT) >= SEP;
const fold = s => s.toUpperCase().replace(/Ё/g, "Е");

function places() {
  const out = [], add = (base, spots) => { if (spots.length) out.push({ ...base, spots }); };
  for (const o of countries) add({ id: o.id, kind: "country", country: o.id, sec: o.sec, place: PLACE[o.id] }, deep(o.id, o.spots));
  const rivs = {};
  for (const m of C) for (const r of m.rivers) { const v = rivs[r.id] ||= { crosses: [], spots: [], points: [] }; v.crosses.push(...r.crosses); v.spots.push(...(r.spots || [])); v.points.push(...r.points); }
  for (const r of RIV.items) {
    const v = rivs[r.id] || { crosses: [], spots: [], points: [] };
    add({ id: r.id, kind: "river", river: r.id, crosses: [...new Set(v.crosses)], sec: 2, place: PLACE[r.id] }, v.spots.length ? v.spots : [r.label]);
    const seen = new Set();
    for (const q of v.points) { if (seen.has(q.country)) continue; seen.add(q.country);
      add({ id: `${r.id}@${q.country}`, kind: "river", river: r.id, country: q.country, sec: 2, place: [0, 1].map(li => `${PLACE[r.id][li]} ${PLACE[q.country][li]}`) }, deep(q.country, q.spots || [q])); }
  }
  for (const o of LAKES.items.filter(o => LAKE_IDS.includes(o.id))) add({ id: o.id, kind: "object", sec: 3, place: PLACE[o.id] }, [o.label]);
  for (const o of S1.items.filter(o => !NEVER.includes(o.id))) add({ id: o.id, kind: "object", sec: 1, place: PLACE[o.id] }, [o.label]);
  return out;
}
const conflict = (a, b) => (a.river && a.river === b.river) || (a.country && a.country === b.country)
  || (a.kind === "river" && !a.country && b.kind === "country" && a.crosses.includes(b.id)) || (b.kind === "river" && !b.country && a.kind === "country" && b.crosses.includes(a.id))
  || (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id)
  || (a.country && (CONTAINERS[a.country] || []).includes(b.id)) || (b.country && (CONTAINERS[b.country] || []).includes(a.id))
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
function build(word, lang, tries = 6000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length, needR = Math.ceil(n / 3);
  const usable = places().filter(p => !fold(p.place[li]).includes(fold(word)));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    const pick = [], ok = p => pick.every(q => far(p, q) && !conflict(p, q));
    const take = g => { if (pick.length >= n || pick.some(q => q.id === g.id)) return; for (const s of shuffle([...g.spots])) { const p = { ...g, x: s.x, y: s.y }; if (ok(p)) { pick.push(p); return; } } };
    for (const g of shuffle(usable.filter(p => p.kind === "river"))) if (pick.filter(p => p.kind === "river").length < needR) take(g);
    // then the countries, lakes and section-1 places; more rivers only when places run short (rivers at most half of the word)
    for (const g of shuffle(usable.filter(p => p.kind !== "river"))) take(g);
    for (const g of shuffle(usable.filter(p => p.kind === "river"))) if (pick.filter(p => p.kind === "river").length < Math.ceil(n / 2)) take(g);
    if (pick.length < n || pick.filter(p => p.kind === "river").length < needR) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT))));
    const cs = s => pick.filter(p => p.kind === "country" && p.sec === s).length, inCountry = pick.filter(p => p.kind === "river" && p.country).length;
    const lakes = pick.filter(p => p.sec === 3).length, s1 = pick.filter(p => p.sec === 1).length;
    const score = gap + Math.min(cs(6), 2) * 3 + Math.min(cs(7), 2) * 3 + Math.min(cs(8), 2) * 3 + Math.min(inCountry, 2) * 2
      + (lakes === 1 ? 4 : -3 * Math.abs(lakes - 1)) + (s1 === 1 ? 4 : -3 * Math.abs(s1 - 1));
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (!best) return null;
  const order = revealOrder(n);
  const markers = best.map((p, i) => ({ id: p.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2), letter: letters[i] }));
  const ord = tpl.ordinals[lang], t = tpl.template[lang], ph = Object.fromEntries(best.map(p => [p.id, p.place[li]]));
  const clues = order.map(pos => ({ markerId: markers[pos - 1].id, position: pos, text: t.replace("{ordinal}", ord[pos - 1]).replace("{place}", ph[markers[pos - 1].id]) }));
  return { markers, clues };
}
// each language checked on its own: every letter far enough from the others, no two letters for one country or river, a third on rivers,
// every country letter in the main part of its country with its circle inside the border, no place phrase containing the answer
function check(P) {
  const li = P.language === "ru" ? 0 : 1, all = places(), errs = [], ms = P.markers;
  const at = m => all.find(p => p.id === m.id);
  for (const m of ms) {
    const p = at(m); if (!p) { errs.push(`${m.id}: not a place`); continue; }
    if (!p.spots.some(s => Math.abs(s.x - m.x) < .01 && Math.abs(s.y - m.y) < .01)) errs.push(`${m.id}: letter not on an allowed spot`);
    if (fold(p.place[li]).includes(fold(P.answer))) errs.push(`${m.id}: the place phrase gives the answer away`);
  }
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
    const a = { ...at(ms[i]), x: ms[i].x, y: ms[i].y }, b = { ...at(ms[j]), x: ms[j].x, y: ms[j].y };
    if (!far(a, b)) errs.push(`${a.id} and ${b.id} closer than ${SEP}`);
    if (conflict(a, b)) errs.push(`${a.id} and ${b.id} conflict`);
  }
  const rivers = ms.filter(m => at(m)?.kind === "river").length;
  if (rivers < Math.ceil(ms.length / 3)) errs.push(`only ${rivers} river letters of ${ms.length}`);
  if (ms.map(m => m.letter).join("") !== P.answer) errs.push("letters do not spell the answer");
  return errs;
}
const prev = fs.existsSync(OUT) ? read(OUT) : { puzzles: [] };
const puzzles = [];
for (const lang of ["en", "ru"]) {
  const w = dict.units.find(u => u.id === "block-final").words[lang][0], id = `b3-block-final-${lang}`;
  const old = prev.puzzles.find(p => p.id === id);
  if (old?.approval?.status === "approved" && old.answer === w.answer) { puzzles.push(old); continue; }
  const b = build(w.answer, lang);
  if (!b) { console.error(`${id}: ${w.answer} cannot be laid out`); process.exitCode = 1; continue; }
  const P = { id, block: "asia-3", unit: "block-final", role: "block-final", language: lang, answer: w.answer, map: "./assets/asia-countries.webp", mapAspect: "2200 / 1600",
    layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b, approval: { status: "draft" } };
  const errs = check(P);
  if (errs.length) { console.error(`${id}:\n  ${errs.join("\n  ")}`); process.exitCode = 1; }
  else console.log(`${id}: ${w.answer} — ${P.markers.map(m => m.id).join(", ")}`);
  puzzles.push(P);
}
fs.writeFileSync(OUT, JSON.stringify({ block: "asia-3", rules: {
  clues: "clues in reveal order; position = slot the letter fills",
  places: "the whole countries map of Asia: letters in the 49 countries of sections 6–8 (in the main part of the country, the circle wholly inside the border; a country too small for that takes no letter), on the 23 rivers of section 2 («on the Mekong») and on a river inside a country it crosses («on the Mekong in Cambodia»), in the four lakes of section 3 drawn on the map, and on the objects of section 1 (not the Arctic Ocean, Chukotka or the Bering Strait); at least a third of the letters on rivers (Svetlana, 28.10.2026). Mountains and deserts are not drawn on this map",
  nesting: "as b3-section-8.json: a country named once per puzzle; one letter per river; «on the Mekong» never with a country the Mekong crosses; a country or a river in it never with its island or peninsula; no letter inside the area of another place",
  spacing: "hypot(dx, dy * 1600/2200) >= 10 (% of map width; at 9 two tap areas can overlap on the whole map)",
  languages: "RU and EN are laid out separately; each layout is checked on its own by this tool (check())",
  role: "block-final: the final GeoWords of the block 3 review (passport stamp)",
  approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets" }, puzzles }, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
