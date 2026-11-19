// Builds the draft unit and section finals of block 3 section 1 «Asia on the map» (data/geowords/b3-section-1.json)
// by the same rules the app uses for Asia practice puzzles (placesFor, sec 13): letters only on objects of data/maps/asia-overview.json
// learned by the end of the unit, one letter per object, at the object's label point; no letter inside another object of the puzzle,
// and a marginal sea or an island never with the ocean it lies in; spacing hypot(dx, dy*1600/2200) >= 4.5;
// a place phrase never contains the answer; reveal order as validate-geowords.mjs.
// Section 2 «Rivers of Asia»: letters on the rivers learned by the end of the unit (data/maps/asia-rivers.json, at the river's label point)
// and on every object of section 1; the newest unit's rivers first, then the other learned rivers, section 1 when places run short.
// A river whose letter lies inside a peninsula never shares a puzzle with it (no letter inside another object of the puzzle).
// Section 3 «Lakes of Asia»: the same with the lakes of data/maps/asia-lakes.json (at the lake's label point) in place of the rivers.
// Section 4 «Mountains of Asia»: the same with the ranges, the plateau and the volcanoes of data/maps/asia-mountains.json; section 1's Ural Mountains are left out
// (the Urals are drawn on the mountains map as «as-urals»).
// Section 5 «Deserts of Asia»: the same with the deserts of data/maps/asia-deserts.json (drawn on the rivers map) and every object of section 1.
// Section 6 «Countries and capitals: East and Southeast Asia» (data/maps/asia-countries-6.json, map asia-countries.webp = the rivers map with
// borders and capital dots): letters at the centre of the countries learned by the end of the unit; on the rivers of section 2 drawn over the
// map («on the Mekong», at the river's label point); on a river inside a country it crosses («on the Mekong in Cambodia»); the objects of
// section 1 only when places run short. At least a third of the letters on rivers (Svetlana, 28.10.2026 and 31.10.2026). A country is named
// once per puzzle; a river letter «on the Mekong» never shares a puzzle with a country the river crosses; one letter per river; a country never
// with its island or peninsula; spacing 9 as in Europe sections 4 and 5.
// Section 7 «Countries and capitals: South and Central Asia» (data/maps/asia-countries-7.json, the same map): as section 6; the lakes of
// section 3 drawn on the map (Caspian, Aral, Balkhash, Issyk-Kul) join section 1 as review objects in view.
// Section 8 «Countries and capitals: West Asia and Transcaucasia» (data/maps/asia-countries-8.json, the same map): as section 7; West Asia
// has only three rivers of section 2 (Tigris, Euphrates, Jordan), so the Amu Darya, the Syr Darya and the Indus join as review rivers in view;
// the Caspian Sea (the one lake of section 3 drawn on the map here) is a review object. The Bosporus and the Suez Canal are objects again.
// Usage: node tools/build_b3_geowords.mjs [seed] [section 1|2|3|4|5|6|7|8]  — writes drafts; approved puzzles already in the file are kept as they are.
import fs from "node:fs";

const SEC = Number(process.argv[3] || 1);
const MAP = "data/maps/asia-overview.json", LAYER = { 8: "data/maps/asia-rivers.json", 7: "data/maps/asia-rivers.json", 6: "data/maps/asia-rivers.json", 2: "data/maps/asia-rivers.json", 3: "data/maps/asia-lakes.json", 4: "data/maps/asia-mountains.json", 5: "data/maps/asia-deserts.json" }[SEC];
const BASE = { 1: "./assets/asia-blank.webp", 2: "./assets/asia-rivers.webp", 3: "./assets/asia-lakes.webp", 4: "./assets/asia-mountains.webp", 5: "./assets/asia-deserts.webp", 6: "./assets/asia-countries.webp", 7: "./assets/asia-countries.webp", 8: "./assets/asia-countries.webp" }[SEC];
const DICT = `data/dictionary/b3-section-${SEC}.json`, OUT = `data/geowords/b3-section-${SEC}.json`;
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
  "as-chukotka": ["на Чукотке", "on the Chukchi Peninsula"],
  "as-japanese-islands": ["на Японских островах", "on the Japanese Islands"], "as-sakhalin": ["на Сахалине", "on Sakhalin"],
  "as-sri-lanka": ["на острове Шри-Ланка", "on the island of Sri Lanka"], "as-borneo": ["на острове Калимантан", "on the island of Borneo"],
  "as-sea-of-japan": ["в Японском море", "in the Sea of Japan"], "as-sea-of-okhotsk": ["в Охотском море", "in the Sea of Okhotsk"],
  "as-south-china-sea": ["в Южно-Китайском море", "in the South China Sea"], "as-persian-gulf": ["в Персидском заливе", "in the Persian Gulf"],
  "as-ob": ["на Оби", "on the Ob"], "as-irtysh": ["на Иртыше", "on the Irtysh"], "as-yenisei": ["на Енисее", "on the Yenisei"], "as-lena": ["на Лене", "on the Lena"],
  "as-amur": ["на Амуре", "on the Amur"], "as-kolyma": ["на Колыме", "on the Kolyma"], "as-chao-phraya": ["на Чаупхрае", "on the Chao Phraya"],
  "as-godavari": ["на Годавари", "on the Godavari"], "as-jordan": ["на Иордане", "on the Jordan"], "as-tarim": ["на Тариме", "on the Tarim"], "as-yangtze": ["на Янцзы", "on the Yangtze"], "as-huang-he": ["на Хуанхэ", "on the Huang He"],
  "as-mekong": ["на Меконге", "on the Mekong"], "as-salween": ["на Салуине", "on the Salween"], "as-irrawaddy": ["на Иравади", "on the Irrawaddy"],
  "as-brahmaputra": ["на Брахмапутре", "on the Brahmaputra"], "as-ganges": ["на Ганге", "on the Ganges"], "as-indus": ["на Инде", "on the Indus"],
  "as-tigris": ["на Тигре", "on the Tigris"], "as-euphrates": ["на Евфрате", "on the Euphrates"], "as-amu-darya": ["на Амударье", "on the Amu Darya"],
  "as-syr-darya": ["на Сырдарье", "on the Syr Darya"], "as-ili": ["на реке Или", "on the Ili"],
  "as-baikal": ["в Байкале", "in Lake Baikal"], "as-khovsgol": ["в озере Хубсугул", "in Lake Khövsgöl"], "as-taymyr": ["в озере Таймыр", "in Lake Taymyr"],
  "as-khanka": ["в озере Ханка", "in Lake Khanka"], "as-qinghai": ["в озере Кукунор", "in Qinghai Lake"], "as-caspian": ["в Каспийском море", "in the Caspian Sea"],
  "as-aral": ["в Аральском море", "in the Aral Sea"], "as-balkhash": ["в озере Балхаш", "in Lake Balkhash"], "as-issyk-kul": ["в озере Иссык-Куль", "in Issyk-Kul"],
  "as-dead-sea": ["в Мёртвом море", "in the Dead Sea"], "as-urmia": ["в озере Урмия", "in Lake Urmia"], "as-van": ["в озере Ван", "in Lake Van"],
  "as-tonle-sap": ["в озере Тонлесап", "in Tonlé Sap"],
  "as-pamirs": ["на Памире", "in the Pamirs"], "as-tian-shan": ["в горах Тянь-Шань", "in the Tian Shan"], "as-hindu-kush": ["в горах Гиндукуш", "in the Hindu Kush"],
  "as-karakoram": ["в горах Каракорум", "in the Karakoram"], "as-kunlun": ["в горах Куньлунь", "in the Kunlun Mountains"], "as-tibet": ["на Тибетском нагорье", "on the Tibetan Plateau"],
  "as-himalayas": ["в Гималаях", "in the Himalayas"], "as-altai": ["на Алтае", "in the Altai Mountains"], "as-sayan": ["в Саянах", "in the Sayan Mountains"],
  "as-sikhote-alin": ["в горах Сихотэ-Алинь", "in the Sikhote-Alin"], "as-klyuchevskaya": ["на вулкане Ключевская Сопка", "on the volcano Klyuchevskaya Sopka"],
  "as-fuji": ["на вулкане Фудзи", "on Mount Fuji"], "as-urals": ["в Уральских горах", "in the Ural Mountains"], "as-zagros": ["в горах Загрос", "in the Zagros Mountains"],
  "as-elburz": ["в горах Эльбурс", "in the Elburz Mountains"], "as-caucasus": ["в Кавказских горах", "in the Caucasus Mountains"], "as-arakan": ["в Араканских горах", "in the Arakan Mountains"],
  "as-barisan": ["в горах Барисан", "in the Barisan Mountains"], "as-krakatoa": ["на вулкане Кракатау", "on the volcano Krakatoa"],
  "as-taklamakan": ["в пустыне Такла-Макан", "in the Taklamakan Desert"], "as-ordos": ["в пустыне Ордос", "in the Ordos Desert"], "as-gobi": ["в пустыне Гоби", "in the Gobi Desert"],
  "as-kyzylkum": ["в пустыне Кызылкум", "in the Kyzylkum Desert"], "as-karakum": ["в пустыне Каракумы", "in the Karakum Desert"], "as-kavir": ["в пустыне Деште-Кевир", "in the Dasht-e Kavir"],
  "as-lut": ["в пустыне Деште-Лут", "in the Dasht-e Lut"], "as-thar": ["в пустыне Тар", "in the Thar Desert"], "as-rub-al-khali": ["в пустыне Руб-эль-Хали", "in the Rub’ al Khali"],
  "as-negev": ["в пустыне Негев", "in the Negev Desert"],
  "cty-china": ["в Китае", "in China"], "cty-mongolia": ["в Монголии", "in Mongolia"], "cty-north-korea": ["в Северной Корее", "in North Korea"],
  "cty-south-korea": ["в Южной Корее", "in South Korea"], "cty-japan": ["в Японии", "in Japan"], "cty-taiwan": ["на Тайване", "on Taiwan"],
  "cty-vietnam": ["во Вьетнаме", "in Vietnam"], "cty-laos": ["в Лаосе", "in Laos"], "cty-cambodia": ["в Камбодже", "in Cambodia"],
  "cty-thailand": ["в Таиланде", "in Thailand"], "cty-myanmar": ["в Мьянме", "in Myanmar"], "cty-malaysia": ["в Малайзии", "in Malaysia"],
  "cty-singapore": ["в Сингапуре", "in Singapore"], "cty-indonesia": ["в Индонезии", "in Indonesia"], "cty-brunei": ["в Брунее", "in Brunei"],
  "cty-philippines": ["на Филиппинах", "in the Philippines"], "cty-timor-leste": ["в Восточном Тиморе", "in Timor-Leste"],
  "cty-india": ["в Индии", "in India"], "cty-pakistan": ["в Пакистане", "in Pakistan"], "cty-bangladesh": ["в Бангладеш", "in Bangladesh"],
  "cty-sri-lanka": ["на Шри-Ланке", "in Sri Lanka"], "cty-maldives": ["на Мальдивах", "in the Maldives"], "cty-nepal": ["в Непале", "in Nepal"],
  "cty-bhutan": ["в Бутане", "in Bhutan"], "cty-afghanistan": ["в Афганистане", "in Afghanistan"], "cty-kazakhstan": ["в Казахстане", "in Kazakhstan"],
  "cty-uzbekistan": ["в Узбекистане", "in Uzbekistan"], "cty-turkmenistan": ["в Туркменистане", "in Turkmenistan"], "cty-kyrgyzstan": ["в Киргизии", "in Kyrgyzstan"],
  "cty-tajikistan": ["в Таджикистане", "in Tajikistan"],
  "cty-georgia": ["в Грузии", "in Georgia"], "cty-armenia": ["в Армении", "in Armenia"], "cty-azerbaijan": ["в Азербайджане", "in Azerbaijan"],
  "cty-iran": ["в Иране", "in Iran"], "cty-turkey": ["в Турции", "in Turkey"], "cty-cyprus": ["на Кипре", "in Cyprus"], "cty-syria": ["в Сирии", "in Syria"],
  "cty-lebanon": ["в Ливане", "in Lebanon"], "cty-israel": ["в Израиле", "in Israel"], "cty-palestine": ["в Палестине", "in Palestine"],
  "cty-jordan": ["в Иордании", "in Jordan"], "cty-iraq": ["в Ираке", "in Iraq"], "cty-saudi-arabia": ["в Саудовской Аравии", "in Saudi Arabia"],
  "cty-kuwait": ["в Кувейте", "in Kuwait"], "cty-bahrain": ["в Бахрейне", "in Bahrain"], "cty-qatar": ["в Катаре", "in Qatar"],
  "cty-uae": ["в ОАЭ", "in the UAE"], "cty-oman": ["в Омане", "in Oman"], "cty-yemen": ["в Йемене", "in Yemen"],
};
// «on the Mekong in Cambodia»: the river phrase, then the country phrase
export const placeOn = (river, country, li) => `${PLACE[river][li]} ${PLACE[country][li]}`;
// An object and the object it lies in never share a puzzle (EU_IN in app/app.js)
export const CONTAINERS = {
  "as-sea-of-japan": ["as-pacific-ocean"], "as-sea-of-okhotsk": ["as-pacific-ocean"], "as-south-china-sea": ["as-pacific-ocean"], "as-persian-gulf": ["as-indian-ocean"],
  "as-japanese-islands": ["as-pacific-ocean"], "as-sakhalin": ["as-pacific-ocean"], "as-borneo": ["as-pacific-ocean"], "as-sri-lanka": ["as-indian-ocean"],
  // section 6: a country never with its island or peninsula
  "cty-japan": ["as-japanese-islands"], "cty-north-korea": ["as-korean-peninsula"], "cty-south-korea": ["as-korean-peninsula"],
  "cty-malaysia": ["as-malay-peninsula", "as-borneo"], "cty-singapore": ["as-malay-peninsula"], "cty-brunei": ["as-borneo"], "cty-indonesia": ["as-borneo"],
  "cty-thailand": ["as-indochina", "as-malay-peninsula"], "cty-vietnam": ["as-indochina"], "cty-laos": ["as-indochina"], "cty-cambodia": ["as-indochina"], "cty-myanmar": ["as-indochina"],
  // section 7
  "cty-india": ["as-hindustan"], "cty-sri-lanka": ["as-sri-lanka"], "cty-maldives": ["as-indian-ocean"],
  // section 8
  "cty-turkey": ["as-asia-minor", "as-bosporus"], "cty-saudi-arabia": ["as-arabian-peninsula"], "cty-yemen": ["as-arabian-peninsula"], "cty-oman": ["as-arabian-peninsula"],
  "cty-uae": ["as-arabian-peninsula"], "cty-qatar": ["as-arabian-peninsula", "as-persian-gulf"], "cty-kuwait": ["as-arabian-peninsula", "as-persian-gulf"],
  "cty-bahrain": ["as-persian-gulf", "as-arabian-peninsula"],
};
const ASPECT = 1600 / 2200, SEP = SEC >= 6 ? Number(process.env.SEP || 9) : 4.5;

const map = JSON.parse(fs.readFileSync(MAP, "utf8")), rivers = SEC >= 2 ? JSON.parse(fs.readFileSync(LAYER, "utf8")).items : [], dict = JSON.parse(fs.readFileSync(DICT, "utf8"));
const tpl = JSON.parse(fs.readFileSync("data/geowords/clue-templates.json", "utf8"));
const polys = a => typeof a?.[0]?.[0] === "number" ? [a] : (a || []).flatMap(polys);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const items = Object.fromEntries([...map.items, ...(SEC >= 4 ? rivers : [])].map(o => [o.id, o]));  // sections 4 and 5: the mountains / deserts are areas too
const inside = (id, p) => { const o = items[id]; if (!o) return false; return polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl)); };
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
// section 2: the learned rivers (unit 1..3) and every object of section 1 (unit 0, used after the rivers)
const places = unit => SEC >= 2 ? [...rivers.filter(o => o.unit <= unit).map(o => ({ id: o.id, unit: o.unit, ...o.label })), ...map.items.filter(o => !(SEC === 4 && o.id === "as-ural-mountains")).map(o => ({ id: o.id, unit: 0, ...o.label }))]
  : map.items.filter(o => o.unit <= unit).map(o => ({ id: o.id, unit: o.unit, ...o.label }));

function build(word, lang, unit, final, tries = 6000) {
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length;
  const usable = places(unit).filter(p => !fold(PLACE[p.id][li]).includes(fold(word)));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    // the newest unit's objects first, so a unit final is mostly about that unit
    const pool = shuffle([...usable]).sort((a, b) => (b.unit === unit) - (a.unit === unit) || (SEC >= 2 ? (b.unit > 0) - (a.unit > 0) : 0));
    const pick = [];
    for (const p of pool) if (pick.length < n && pick.every(q => far(p, q) && !nested(p, q))) pick.push(p);
    if (pick.length < n) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT))));
    const units = new Set(pick.map(p => p.unit)).size, own = pick.filter(p => p.unit === unit).length;
    const riv = pick.filter(p => p.unit > 0).length;
    const score = gap + (final ? units * 3 : own) + (SEC >= 2 ? riv * 2 : 0);
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (process.env.DEBUG) { console.error(word, Object.entries(globalThis.__st).sort((a, b) => b[1] - a[1]).slice(0, 8), globalThis.__rv); globalThis.__st = {}; globalThis.__rv = {}; }
  if (!best) return null;
  const order = revealOrder(n);
  const markers = best.map((p, i) => ({ id: p.id, x: p.x, y: p.y, letter: letters[i] }));
  const ord = tpl.ordinals[lang], t = tpl.template[lang];
  const clues = order.map(pos => ({ markerId: markers[pos - 1].id, position: pos, text: t.replace("{ordinal}", ord[pos - 1]).replace("{place}", PLACE[markers[pos - 1].id][li]) }));
  return { markers, clues };
}

// ---- section 6: countries, rivers and «a river in a country» ----
const C6 = SEC >= 6 ? JSON.parse(fs.readFileSync(`data/maps/asia-countries-${SEC}.json`, "utf8")) : null;
// section 7: the lakes of section 3 on the map join section 1 as review objects
// section 7, unit 2 «The Himalayas and the Hindu Kush»: its region is its three countries and the two mountain systems themselves (outlines
// of data/maps/asia-mountains.json), so a letter in India or Pakistan, or on the Indus, inside the Himalayas or the Hindu Kush is in the region
const MTN7 = SEC === 7 ? JSON.parse(fs.readFileSync("data/maps/asia-mountains.json", "utf8")).items.filter(o => ["as-himalayas", "as-hindu-kush"].includes(o.id)) : [];
const inMtn7 = p => MTN7.some(o => polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)));
// section 8, unit 1 «The South Caucasus and Iran»: four countries, three of them small and close together, cannot hold half the letters of a
// 9–11 letter word. Its region also takes in the Iranian Plateau (the historical region shown in unit 1, data/maps/asia-countries-8.json
// regions), so a letter in Afghanistan or Pakistan inside the plateau counts for it, as do the Caspian Sea and the Persian Gulf, the seas of Iran
const ZONE8 = SEC === 8 ? C6.regions.filter(o => o.id === "zone-iranian-plateau") : [];
const inZone8 = p => ZONE8.some(o => polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)));
const LAKES7 = SEC >= 7 ? JSON.parse(fs.readFileSync("data/maps/asia-lakes.json", "utf8")).items.filter(o => (SEC === 8 ? ["as-caspian"] : ["as-caspian", "as-aral", "as-balkhash", "as-issyk-kul"]).includes(o.id)) : [];
// section 8: the countries of section 7 in view are review places (Afghanistan, Pakistan, Turkmenistan…); a river crosses the countries of both
const C7 = SEC === 8 ? JSON.parse(fs.readFileSync("data/maps/asia-countries-7.json", "utf8")) : { items: [], rivers: [] };
if (SEC === 8) C7.items = C7.items.filter(o => ["cty-afghanistan", "cty-pakistan", "cty-turkmenistan", "cty-uzbekistan", "cty-kazakhstan"].includes(o.id));  // the neighbours
const area6 = SEC >= 6 ? Object.fromEntries([...map.items, ...LAKES7, ...C7.items, ...C6.items].filter(o => o.tapArea).map(o => [o.id, o])) : {};
const in6m = new Map(), in6 = (id, p) => { const k = id + ' ' + p.x + ' ' + p.y; if (!in6m.has(k)) { const o = area6[id]; in6m.set(k, !!o && polys(o.tapArea).some(pl => inPoly(p.x, p.y, pl)) && !polys(o.holes).some(pl => inPoly(p.x, p.y, pl))); } return in6m.get(k); };
// Svetlana, 31.10.2026 17:45: at least half of the letters inside the region of the lesson, the rest on learned objects of Asia nearby;
// no Arctic Ocean or Chukotka. The puzzle opens zoomed in on the region of its unit (C6.frames), so letters stay 9% of the screen apart
// (SEP / zoom of the map), and a letter may stand anywhere well inside its country or anywhere on its river (C6 spots).
const REGION_OBJ = SEC === 8 ? { 1: ["as-persian-gulf"], 2: ["as-asia-minor", "as-bosporus"], 3: ["as-arabian-peninsula", "as-persian-gulf"] }
  : SEC === 7 ? { 1: ["as-hindustan", "as-sri-lanka"], 2: [], 3: [] }
  : { 1: ["as-korean-peninsula", "as-japanese-islands", "as-sea-of-japan"], 2: ["as-indochina", "as-south-china-sea"], 3: ["as-malay-peninsula", "as-borneo", "as-south-china-sea"] };
const NEVER6 = ["as-arctic-ocean", "as-chukotka", "as-bering-strait", ...(SEC === 7 ? ["as-bosporus", "as-suez-canal"] : [])];
const frame6 = unit => {
  const k = unit === "section-final" || unit === "S" ? "S" : String(unit), f = { ...C6.frames[k], ...(process.env.FRAMES ? JSON.parse(process.env.FRAMES)[k] : {}) }, hw = 50 / f.zoom;
  const cx = Math.min(100 - hw, Math.max(hw, f.x)), cy = Math.min(100 - hw, Math.max(hw, f.y)), m = 4 / f.zoom;
  return { ...f, inView: p => p.x >= cx - hw + m && p.x <= cx + hw - m && p.y >= cy - hw + m && p.y <= cy + hw - m };
};
// Svetlana, 1.11.2026 («Найди вторую букву в Индии», but no letter could be seen in India): the letter of India stood in the narrow north-east
// of the country next to Bangladesh, and the letter of Nepal at its southern border, so they read as letters of a neighbour. A letter
// in a country («in India», «on the Ganges in India») stands in the main part of the country (the part with its name label), its circle
// (16px on a phone map about 360px wide, 4.5% of the screen with a little air) wholly inside the border at the zoom of the puzzle; a country
// too small for that (Bhutan, Sri Lanka at the zoom of the section final…) takes its deepest spots.
const R_MARK = 4.5;
let DEEP = 1;  // lowered step by step for a word that cannot be laid out with every circle wholly inside
const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0; return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
const depthIn = (cid, p) => { let d = Infinity; const o = area6[cid]; for (const pl of [...polys(o.tapArea), ...polys(o.holes)]) for (let i = 0, j = pl.length - 1; i < pl.length; j = i++)
  d = Math.min(d, segD(p.x, p.y * ASPECT, pl[j][0], pl[j][1] * ASPECT, pl[i][0], pl[i][1] * ASPECT)); return d; };
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
  const add = (base, spots) => { const all = spots.filter(F.inView); if (all.length) out.push({ ...base, spots: base.country ? deepSpots(base.country, all, F.zoom) : all, allSpots: all }); };
  for (const o of C6.items) if (o.unit <= unit) add({ id: o.id, kind: "country", country: o.id, unit: o.unit, reg: [o.unit], place: PLACE[o.id] }, o.spots);
  for (const o of C7.items) add({ id: o.id, kind: "country", country: o.id, unit: 0, reg: [], place: PLACE[o.id] }, o.spots);
  // only the rivers that flow through the countries of this section (the Jordan or the Ob belong to other parts of Asia)
  for (const r of rivers) {
    const rc = C6.rivers.find(q => q.id === r.id);
    if (!rc) continue;
    const crosses = [...rc.crosses, ...(C7.rivers.find(q => q.id === r.id)?.crosses || [])];
    add({ id: r.id, kind: "river", river: r.id, crosses, unit: 0, reg: null, place: PLACE[r.id] }, rc.spots);
    for (const q of rc.points) if (learned(q.country))
      add({ id: `${r.id}@${q.country}`, kind: "river", river: r.id, country: q.country, unit: 0, reg: [uOf(q.country)], place: [0, 1].map(li => placeOn(r.id, q.country, li)) }, q.spots);
  }
  // section 1 for review: only what is in view, never the far north
  for (const o of map.items) if (!NEVER6.includes(o.id))
    add({ id: o.id, kind: "object", unit: -1, reg: Object.keys(REGION_OBJ).filter(u => REGION_OBJ[u].includes(o.id)).map(Number), place: PLACE[o.id] }, [o.label]);
  // a lake belongs to the region of the country it lies in (reg null: found from its letter, as a plain river letter)
  for (const o of LAKES7) add({ id: o.id, kind: "object", unit: -1, reg: SEC === 8 ? [1] : null, place: PLACE[o.id] }, [o.label]);
  // section 7: the same country or river again with only its spots in the Himalayas or the Hindu Kush, in the region of unit 2 (one letter per id)
  if (SEC === 7) for (const g of [...out]) if (g.kind !== "object" && !(g.reg || []).includes(2)) {
    const sp = g.spots.filter(inMtn7);
    if (sp.length) out.push({ ...g, spots: sp, reg: [...(g.reg || []), 2] });
  }
  // section 8: the same country or river again with only its spots on the Iranian Plateau, in the region of unit 1 (one letter per id)
  if (SEC === 8) for (const g of [...out]) if (g.kind !== "object" && !(g.reg || []).includes(1)) {
    const sp = g.spots.filter(inZone8);
    if (sp.length) out.push({ ...g, spots: sp, reg: [...(g.reg || []), 1] });
  }
  return out;
}
// a plain river letter («on the Mekong») is in the region of the unit whose country it stands in
const regOf = p => p.reg || p.sreg || (p.sreg = [...C6.items.filter(o => in6(o.id, p)).map(o => o.unit), ...(SEC === 7 && inMtn7(p) ? [2] : []), ...(SEC === 8 && inZone8(p) ? [1] : [])]);
const conflict6 = (a, b) => (a.river && a.river === b.river) || (a.country && a.country === b.country)
  || (a.kind === "river" && !a.country && b.kind === "country" && a.crosses.includes(b.id)) || (b.kind === "river" && !b.country && a.kind === "country" && b.crosses.includes(a.id))
  || (CONTAINERS[a.id] || []).includes(b.id) || (CONTAINERS[b.id] || []).includes(a.id)
  || (a.country && (CONTAINERS[a.country] || []).includes(b.id)) || (b.country && (CONTAINERS[b.country] || []).includes(a.id))
  || (a.kind !== "river" && in6(a.id, b)) || (b.kind !== "river" && in6(b.id, a));
function build6(word, lang, unit, final, tries = Number(process.env.TRIES || 4000)) {
  // section 8: a third of the letters on rivers, but never more than three — West Asia has only the Tigris, the Euphrates and the Jordan
  const li = lang === "ru" ? 0 : 1, letters = [...word], n = letters.length, needR = SEC === 8 ? Math.min(3, Math.ceil(n / 3)) : Math.ceil(n / 3), needReg = Math.ceil(n / 2);
  const F = frame6(final ? "S" : unit), sep = SEP / F.zoom, U = final ? [1, 2, 3] : [unit];
  const usable = places6(unit, F).filter(p => !fold(p.place[li]).includes(fold(word)));
  const inReg = p => regOf(p).some(u => U.includes(u));
  let best = null, bestScore = -Infinity;
  for (let k = 0; k < tries; k++) {
    const pick = [], ok = p => pick.every(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT) >= sep && !conflict6(p, q));
    const take = (g, want) => { if (pick.length >= n || pick.some(q => q.id === g.id)) return; for (const s of shuffle([...g.spots])) { const p = { ...g, x: s.x, y: s.y, sreg: undefined }; if ((!want || want(p)) && ok(p)) { pick.push(p); return; } } };
    // rivers up to the quota first, then the region of the unit, then the rest (countries and rivers of earlier units, section 1)
    const groups = shuffle([...usable]);
    // section 8: the region is small and crowded, so its letters go first (only spots inside it), then the rivers
    // (the countries of the section and its seas before the countries of section 7 on the Iranian Plateau, which would shut out the Amu Darya and the Indus)
    // rivers first in half of the tries: a river letter inside the region counts for both quotas
    const rf = k % 4 < 2 ? [] : groups.filter(g => g.kind === "river");
    if (SEC === 8) for (const g of [...rf, ...groups.filter(g => g.unit !== 0 || g.kind !== "country"), ...groups.filter(g => g.unit === 0 && g.kind === "country")])
      if (pick.filter(inReg).length < needReg + (k % 2)) take(g, inReg);
    for (const g of groups.filter(g => g.kind === "river")) if (pick.filter(p => p.kind === "river").length < needR) take(g);
    const regG = groups.filter(g => g.kind !== "object" && (g.reg ? g.reg.some(u => U.includes(u)) : true));
    for (const g of regG) take(g);
    for (const g of groups) take(g);
    if (process.env.DEBUG) { const rv = globalThis.__rv ||= {}; for (const q of pick) if (q.kind === "river") rv[q.id] = (rv[q.id] || 0) + 1; const st = globalThis.__st ||= {}; const key = `${pick.length}/${n} r${pick.filter(p => p.kind === "river").length}/${needR} g${pick.filter(inReg).length}/${needReg}`; st[key] = (st[key] || 0) + 1; }
    if (pick.length < n || pick.filter(p => p.kind === "river").length < needR) continue;
    const reg = pick.filter(inReg).length;
    if (reg < needReg) continue;
    const gap = Math.min(...pick.flatMap((p, i) => pick.slice(i + 1).map(q => Math.hypot(p.x - q.x, (p.y - q.y) * ASPECT)))) * F.zoom;
    const units = new Set(pick.flatMap(regOf)).size, ctry = pick.filter(p => p.kind === "country").length;
    const inCountry = pick.filter(p => p.kind === "river" && p.country).length, obj = pick.filter(p => p.kind === "object").length;
    const score = Math.min(gap, 12) + reg * 6 + ctry * 3 + inCountry * 2 - obj * 2 + (final ? units * 5 : 0);
    if (score > bestScore) { bestScore = score; best = shuffle(pick); }
  }
  if (process.env.DEBUG) { console.error(word, Object.entries(globalThis.__st).sort((a, b) => b[1] - a[1]).slice(0, 8), globalThis.__rv); globalThis.__st = {}; globalThis.__rv = {}; }
  if (!best) return null;
  const order = revealOrder(n);
  const markers = best.map((p, i) => ({ id: p.id, x: p.x, y: p.y, letter: letters[i] }));
  const ord = tpl.ordinals[lang], t = tpl.template[lang], ph = Object.fromEntries(best.map(p => [p.id, p.place[li]]));
  const clues = order.map(pos => ({ markerId: markers[pos - 1].id, position: pos, text: t.replace("{ordinal}", ord[pos - 1]).replace("{place}", ph[markers[pos - 1].id]) }));
  return { markers, clues, focus: { x: F.x, y: F.y, zoom: F.zoom }, inRegion: best.filter(inReg).length };
}

// REPAIR=1: an approved puzzle keeps its word, places, letters and clues; its letters in countries move deeper inside them. The deepest
// layout is searched together (the letters keep the spacing, the nesting rules and the region of the unit): first with every circle
// wholly inside its country, then a little less deep, down to half the circle; a country too small for that keeps its deepest spots.
const mainSpots = (cid, spots) => { const o = area6[cid], main = o?.label ? polys(o.tapArea).filter(pl => inPoly(o.label.x, o.label.y, pl)) : [];
  const m = main.length ? spots.filter(s => main.some(pl => inPoly(s.x, s.y, pl))) : []; return m.length ? m : spots; };
// a letter in a country may stand on a finer grid than the spots of the countries map (0.3% of the map width), in the part with its label
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
function repair6(p, unit, final, tiers = [1, 0.85, 0.7, 0.6, 0.5]) {
  const F = frame6(final ? "S" : unit), sep = SEP / F.zoom, U = final ? [1, 2, 3] : [unit], G = {}, Rz = R_MARK / F.zoom;
  for (const g of places6(unit, F)) G[g.id] ||= g;
  const inR = (g, s) => [...(g.reg || []), ...regOf({ x: s.x, y: s.y })].some(u => U.includes(u));
  const ratio = (g, s) => g.country ? depthIn(g.country, s) / Rz : 1;
  const fixed = [], free = [];
  // a plain river letter («on the Ganges») may slide along its river to make room
  for (const m of p.markers) { const g = G[m.id]; (g?.country || g?.kind === "river" ? free : fixed).push({ m, g: g || { id: m.id, kind: "object" } }); }
  const okPair = (a, sa, b, sb) => Math.hypot(sa.x - sb.x, (sa.y - sb.y) * ASPECT) >= sep && !conflict6({ ...a, x: sa.x, y: sa.y }, { ...b, x: sb.x, y: sb.y });
  for (const t of tiers) {
    const cands = free.map(({ m, g }) => {
      if (!g.country) return g.allSpots.filter(s => !inR(g, m) || inR(g, s)).map(s => ({ s, r: 1 })).sort((a, b) => Math.hypot(a.s.x - m.x, (a.s.y - m.y) * ASPECT) - Math.hypot(b.s.x - m.x, (b.s.y - m.y) * ASPECT)).slice(0, 30);
      const sp = (g.kind === "country" ? gridSpots(g.country, F) : mainSpots(g.country, g.allSpots)).filter(s => !inR(g, m) || inR(g, s)).map(s => ({ s, r: ratio(g, s) }));
      // "best": as deep as the other letters let it, never less deep than it was (the approved spot is the last candidate)
      if (t === "best") return [...sp.filter(c => c.r > ratio(g, m)).sort((a, b) => b.r - a.r).slice(0, 60), { s: { x: m.x, y: m.y }, r: ratio(g, m) }];
      const mx = Math.max(...sp.map(c => c.r)), need = Math.min(t, mx * (t >= 0.5 ? 0.9 : 0.75));
      // already deep enough: stays where it was approved
      if (ratio(g, m) >= need) return [{ s: { x: m.x, y: m.y }, r: ratio(g, m) }];
      return sp.filter(c => c.r >= need).sort((a, b) => Math.hypot(a.s.x - m.x, (a.s.y - m.y) * ASPECT) - Math.hypot(b.s.x - m.x, (b.s.y - m.y) * ASPECT)).slice(0, 60);
    });
    const order = free.map((_, i) => i).sort((a, b) => cands[a].length - cands[b].length), pick = [];
    let steps = 0;
    const dfs = k => {
      if (k === order.length) return true;
      if (++steps > 200000) return false;
      const i = order[k], { g } = free[i];
      for (const c of cands[i]) {
        if (!fixed.every(f => okPair(g, c.s, f.g, f.m))) continue;
        if (!order.slice(0, k).every(j => okPair(g, c.s, free[j].g, pick[j]))) continue;
        pick[i] = c.s; if (dfs(k + 1)) return true;
      }
      return false;
    };
    if (!dfs(0)) continue;
    const moved = [], markers = p.markers.map(m => { const i = free.findIndex(f => f.m === m); if (i < 0 || (pick[i].x === m.x && pick[i].y === m.y)) return m;
      moved.push(`${m.id} ${m.letter} ${ratio(free[i].g, m).toFixed(2)}→${ratio(free[i].g, pick[i]).toFixed(2)}`); return { ...m, x: pick[i].x, y: pick[i].y }; });
    if (moved.length) console.log(`${p.id} (depth ${t}): ${moved.join("; ")}`);
    return moved.length ? { ...p, markers } : p;
  }
  return null;
}

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { puzzles: [] };
const puzzles = [];
for (const u of dict.units) {
  const sectionFinal = u.id === "section-final", unit = sectionFinal ? "section-final" : Number(u.id.match(/^unit-(\d+)/)[1]);
  for (const lang of ["en", "ru"]) {
    const w = u.words[lang].find(w => w.role === "final" || w.role === "section-final");
    const id = `b3-section-${SEC}-${sectionFinal ? "final" : `unit-${unit}`}-${lang}`;
    const old = prev.puzzles.find(p => p.id === id);
    const U = sectionFinal ? dict.units.length - 1 : unit, make = deep => { for (DEEP of deep) { const b = build6(w.answer, lang, U, sectionFinal); if (b) return b; } return null; };
    if (old?.approval?.status === "approved" && old.answer === w.answer) {
      if (!process.env.REPAIR || SEC < 6) { puzzles.push(old); continue; }
      // REPAIR (1.11.2026): keep the approved places and clues when the letters can move deep enough; else lay the word out anew (a draft)
      const r = repair6(old, U, sectionFinal, [1, 0.85, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3]);
      if (r) { puzzles.push(r); continue; }
      // keep the approved clues whenever the letters can at least move deeper ("best"); lay out anew only with LAYOUT_ANEW=1
      // …unless a letter would still stand outside the main part of its country (Malaysia on Borneo, Indonesia off its label island)
      const r3 = repair6(old, U, sectionFinal, ["best"]) || old;
      const offMain = r3.markers.some(m => { const c = (m.id.split("@")[1] || m.id), o = area6[c]; return c.startsWith("cty-") && o?.label && !polys(o.tapArea).some(pl => inPoly(o.label.x, o.label.y, pl) && inPoly(m.x, m.y, pl)); });
      if (!process.env.LAYOUT_ANEW && !offMain) { console.log(`${id}: letters moved as deep as the other letters let them`); puzzles.push(r3); continue; }
      const b = make([1, 0.8, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3]);
      DEEP = 1;
      if (!b) { const r3 = repair6(old, U, sectionFinal, ["best"]); console.log(`${id}: ${w.answer} cannot be laid out with its letters half inside; letters moved as deep as they can`); puzzles.push(r3 || old); continue; }
      console.log(`${id}: laid out anew`);
      puzzles.push({ ...old, ...b, approval: { status: "draft" } });
      continue;
    }
    let b = null;
    for (DEEP of SEC >= 6 ? [1, 0.8, 0.6, 0.5, 0.4, 0.3] : [1]) if ((b = (SEC >= 6 ? build6 : build)(w.answer, lang, U, sectionFinal))) break;
    DEEP = 1;
    if (!b) { console.error(`${id}: ${w.answer} cannot be laid out on the learned objects`); process.exitCode = 1; continue; }
    puzzles.push({ id, section: dict.section, block: 3, unit, role: sectionFinal ? "section-final" : "unit-final", language: lang, answer: w.answer,
      map: BASE, mapAspect: "2200 / 1600", layers: [], showInsets: [], needsZoom: false, minSeparation: SEP, ...b,
      approval: { status: "draft" } });
  }
}
const out = SEC === 8 ? {
  section: "countries-west-asia-and-transcaucasia", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "the puzzle opens zoomed in on the region of its unit (frames of data/maps/asia-countries-8.json); letters anywhere well inside the countries learned by the end of the unit (spots), on the Tigris, the Euphrates and the Jordan («on the Euphrates in Syria»), on the Amu Darya, the Syr Darya and the Indus in view (review), and on the objects of section 1 and the Caspian Sea in view; at least half of the letters in the region of the unit (unit 1 also takes in the Iranian Plateau and the Caspian Sea), a third on rivers but no more than three",
    nesting: "a country is named once per puzzle; a river letter «on the Euphrates» never shares a puzzle with a country the river crosses; one letter per river; a country never with its peninsula or gulf; no letter inside the area of another place of the puzzle",
    depth: "a letter in a country («in India», «on the Ganges in India») stands in the main part of the country, its circle wholly inside the border at the zoom of the puzzle where the country is large enough (4.5% of the screen from the border), else as deep as it can (Svetlana, 1.11.2026); approved puzzles were moved deeper with REPAIR=1, keeping their places and clues, or laid out anew",
    spacing: "letter centres at least 9% of the screen apart: hypot(dx, dy * 1600/2200) >= 9 / the zoom of the puzzle",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 7 ? {
  section: "countries-south-and-central-asia", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "the puzzle opens zoomed in on the region of its unit (frames of data/maps/asia-countries-7.json); letters anywhere well inside the countries learned by the end of the unit (spots), on the rivers of section 2 that flow through them («on the Ganges»), on a river inside a country it crosses («on the Ganges in Bangladesh»), and on the objects of section 1 and the lakes of section 3 (Caspian, Aral, Balkhash, Issyk-Kul) in view; at least half of the letters in the region of the unit, at least a third on rivers",
    nesting: "a country is named once per puzzle; a river letter «on the Ganges» never shares a puzzle with a country the river crosses; one letter per river; a country never with its island or peninsula; no letter inside the area of another place of the puzzle (a lake letter never with the country it lies in)",
    depth: "a letter in a country («in India», «on the Ganges in India») stands in the main part of the country, its circle wholly inside the border at the zoom of the puzzle where the country is large enough (4.5% of the screen from the border), else as deep as it can (Svetlana, 1.11.2026); approved puzzles were moved deeper with REPAIR=1, keeping their places and clues, or laid out anew",
    spacing: "letter centres at least 9% of the screen apart: hypot(dx, dy * 1600/2200) >= 9 / the zoom of the puzzle",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 6 ? {
  section: "countries-east-and-southeast-asia", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters at the centre of the countries of data/maps/asia-countries-6.json learned by the end of the unit (section final: all 17), on the rivers of data/maps/asia-rivers.json drawn over the countries map («on the Mekong», at the river's label point), on a river inside a country it crosses («on the Mekong in Cambodia»), and on the objects of section 1 only when places run short; at least a third of the letters on rivers",
    nesting: "a country is named once per puzzle; a river letter «on the Mekong» never shares a puzzle with a country the river crosses; one letter per river; a country never with its island or peninsula; no letter inside the area of another place of the puzzle",
    depth: "a letter in a country («in India», «on the Ganges in India») stands in the main part of the country, its circle wholly inside the border at the zoom of the puzzle where the country is large enough (4.5% of the screen from the border), else as deep as it can (Svetlana, 1.11.2026); approved puzzles were moved deeper with REPAIR=1, keeping their places and clues, or laid out anew",
    spacing: "hypot(dx, dy * 1600/2200) >= 9 (% of map width), as in Europe sections 4 and 5",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 5 ? {
  section: "deserts-of-asia", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters on the deserts of data/maps/asia-deserts.json learned by the end of the unit (section final: all 10), at the label point (a desert's innermost point), the newest unit's first; then on the objects of data/maps/asia-overview.json (section 1); one letter per object",
    nesting: "no letter inside the area of another object of the puzzle (a desert and the peninsula it lies on); a marginal sea or an island never with the ocean it lies in",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 4 ? {
  section: "mountains-of-asia", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters on the mountains of data/maps/asia-mountains.json learned by the end of the unit (section final: all 19), at the label point (a range's innermost point, a volcano's summit), the newest unit's first; then on the objects of data/maps/asia-overview.json (section 1) except its Ural Mountains, which are drawn on this map as «as-urals»; one letter per object",
    nesting: "no letter inside the area of another object of the puzzle; a marginal sea or an island never with the ocean it lies in",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 3 ? {
  section: "lakes-of-asia", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters on the lakes of data/maps/asia-lakes.json learned by the end of the unit (section final: all 13), at the lake's label point, the newest unit's lakes first; then on the objects of data/maps/asia-overview.json (section 1); one letter per object",
    nesting: "no letter inside the area of another object of the puzzle (Lake Taymyr's letter never with the Taimyr Peninsula); a marginal sea or an island never with the ocean it lies in",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : SEC === 2 ? {
  section: "rivers-of-asia", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters on the rivers of data/maps/asia-rivers.json learned by the end of the unit (section final: all 23), at the river's label point, the newest unit's rivers first; then on the objects of data/maps/asia-overview.json (section 1); one letter per object",
    nesting: "no letter inside the area of another object of the puzzle (a river letter inside a peninsula never with that peninsula); a marginal sea or an island never with the ocean it lies in",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
} : {
  section: "asia-on-the-map", block: 3,
  rules: {
    clues: "clues in reveal order; position = slot the letter fills",
    places: "letters only on objects of data/maps/asia-overview.json learned by the end of the unit, one letter per object, at the object's label point (the finals approved 29.10.2026 were laid out on the 23 objects before the Chukchi Peninsula was added the same evening)",
    nesting: "an object never shares a puzzle with the object that contains it: the Seas of Japan and Okhotsk, the South China Sea, the Japanese Islands, Sakhalin and Borneo with the Pacific; the Persian Gulf and Sri Lanka with the Indian Ocean; no letter inside the area of another object of the puzzle",
    spacing: "hypot(dx, dy * 1600/2200) >= 4.5 (% of map width)",
    approval: "same as section-1.json: the approval covers answer, markers, clues, map, mapAspect, layers, language and showInsets",
  },
  puzzles,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`wrote ${puzzles.length} puzzles to ${OUT}`);
