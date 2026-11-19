# Writes the draft block 4 «North America» review (data/review/b4-block.json), its block-final word (data/dictionary/b4-block.json) and the
# Challenge rules (data/challenge/b4-block.json) from the plan Svetlana agreed on 18.11.2026 («Согласна», doc
# https://claude.ai/artifact/KoY2KuqADZg3noVSTY64by) with her five comments (22:35): no Yukon in «where does it flow» (the Bering Sea is not
# taught); the Greater Antilles task answers Cuba, Jamaica, Haiti and the Dominican Republic and says Puerto Rico is a US territory; repeats of
# a mistake come on top of the 10 tasks; one record about Cuba (section 7), the section-1 one replaced by Greenland, the largest island;
# the block-final word ПЕРВОПРОХОДЦЫ / PATHFINDERS. Five lessons as in Asia; no new places (the 76 places of sections 1-5 and the 23 countries
# of sections 6-7). Items already approved in the files are kept as they are (an item changes only by re-approval).
# Usage: python3 tools/build_b4_block_review.py
import json, os

def load(p, empty):
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else empty

def keep(old, new):
    """approved items stay untouched; drafts are rewritten"""
    o = {i["id"]: i for i in old}
    out = []
    for it in new:
        prev = o.get(it["id"])
        out.append(prev if prev and prev.get("approval", {}).get("status") == "approved" else {**it, "approval": {"status": "draft"}})
    return out

T = lambda ru, en: {"ru": ru, "en": en}
US, CA, MX, GT, BZ, HN, SV, NI, CR, PA = ("cty-united-states", "cty-canada", "cty-mexico", "cty-guatemala", "cty-belize", "cty-honduras",
                                          "cty-el-salvador", "cty-nicaragua", "cty-costa-rica", "cty-panama")
CU, JM, HT, DO = "cty-cuba", "cty-jamaica", "cty-haiti", "cty-dominican-republic"

# ---- relations ----
rel = []
def R(kind, subject, obj, **kw):
    rel.append({"id": f"{kind}-{subject.replace('na-', '').replace('cty-', '')}", "relation": kind, "subject": subject, "object": obj, **kw})

# river -> where it flows (only water bodies taught on the cards; no Yukon: it flows into the Bering Sea, not taught — Svetlana 18.11;
# no Colorado: by its card it usually does not reach the Gulf of California)
for r in ["na-mississippi", "na-rio-grande", "na-usumacinta"]: R("flowsInto", r, "na-gulf-of-mexico")
for r in ["na-missouri", "na-ohio", "na-arkansas"]: R("flowsInto", r, "na-mississippi")
R("flowsInto", "na-mackenzie", "na-arctic-ocean")
R("flowsInto", "na-nelson", "na-hudson-bay")
R("flowsInto", "na-st-lawrence", "na-atlantic-ocean")
R("flowsInto", "na-columbia", "na-pacific-ocean")
R("flowsInto", "na-san-juan", "na-caribbean-sea")

# river -> the lake it flows out of (in place of «capital → river»: the rivers of the capitals were not taught)
R("flowsOutOf", "na-mackenzie", "na-great-slave")
R("flowsOutOf", "na-nelson", "na-winnipeg")
R("flowsOutOf", "na-st-lawrence", "na-ontario", note=T("Река Святого Лаврентия вытекает из озера Онтарио и выносит в океан воду всех Великих озёр.",
    "The St. Lawrence flows out of Lake Ontario and carries the water of all the Great Lakes to the ocean."))
R("flowsOutOf", "na-san-juan", "na-nicaragua")

# place -> the country it lies in (only places that lie in one country, or wholly in the listed ones)
for p in ["na-great-bear", "na-great-slave", "na-winnipeg", "na-athabasca", "na-labrador", "na-baffin", "na-newfoundland", "na-okanagan", "na-fraser-canyon"]:
    R("inCountry", p, CA)
for p in ["na-michigan", "na-great-salt", "na-tahoe", "na-denali", "na-mojave", "na-great-basin", "na-grand-canyon", "na-florida", "na-alaska-peninsula"]:
    R("inCountry", p, US)
for p in ["na-chapala", "na-orizaba", "na-popocatepetl", "na-mexican-plateau", "na-vizcaino", "na-copper-canyon", "na-baja-california"]:
    R("inCountry", p, MX)
R("inCountry", "na-nicaragua", NI)
for p in ["na-superior", "na-huron", "na-erie", "na-ontario"]: R("inCountry", p, [CA, US])
R("inCountry", "na-sonoran", [US, MX])
R("inCountry", "na-chihuahuan", [MX, US])
R("inCountry", "na-yucatan", [MX, GT, BZ], label=T("Мексика, Гватемала и Белиз", "Mexico, Guatemala and Belize"))
R("inCountry", "na-hispaniola", [HT, DO])

# river -> the countries it flows through (for pairs only «through»; «along» is a border stretch: never a pair, never a wrong answer)
CROSSES = {
    "na-mississippi": ([US], []), "na-missouri": ([US], []), "na-ohio": ([US], []), "na-arkansas": ([US], []),
    "na-yukon": ([CA, US], []), "na-columbia": ([CA, US], []), "na-colorado": ([US, MX], []),
    "na-mackenzie": ([CA], []), "na-nelson": ([CA], []), "na-st-lawrence": ([CA], [US]),
    "na-rio-grande": ([US], [MX]), "na-usumacinta": ([MX], [GT]), "na-san-juan": ([NI], [CR]),
}

# ---- true / false (new texts; one statement of a pair per lesson) ----
tf = []
def TF(i, subject, relation, t_ru, t_en, f_ru, f_en):
    tf.append({"id": f"tf-n{i:02d}", "subject": subject, "relation": relation, "true": T(t_ru, t_en), "false": T(f_ru, f_en)})
TF(1, "na-mississippi", "flowsInto", "Миссисипи впадает в Мексиканский залив.", "The Mississippi flows into the Gulf of Mexico.", "Миссисипи впадает в Гудзонов залив.", "The Mississippi flows into Hudson Bay.")
TF(2, "na-nelson", "flowsInto", "Река Нельсон впадает в Гудзонов залив.", "The Nelson flows into Hudson Bay.", "Река Нельсон впадает в Тихий океан.", "The Nelson flows into the Pacific Ocean.")
TF(3, "na-mackenzie", "flowsInto", "Маккензи впадает в Северный Ледовитый океан.", "The Mackenzie flows into the Arctic Ocean.", "Маккензи впадает в Мексиканский залив.", "The Mackenzie flows into the Gulf of Mexico.")
TF(4, "na-columbia", "flowsInto", "Колумбия впадает в Тихий океан.", "The Columbia flows into the Pacific Ocean.", "Колумбия впадает в Атлантический океан.", "The Columbia flows into the Atlantic Ocean.")
TF(5, "na-st-lawrence", "flowsInto", "Река Святого Лаврентия выносит воду Великих озёр в Атлантический океан.", "The St. Lawrence carries the water of the Great Lakes to the Atlantic Ocean.",
   "Река Святого Лаврентия выносит воду Великих озёр в Тихий океан.", "The St. Lawrence carries the water of the Great Lakes to the Pacific Ocean.")
TF(6, "na-missouri", "flowsInto", "Миссури — приток Миссисипи.", "The Missouri is a tributary of the Mississippi.", "Миссури — приток реки Святого Лаврентия.", "The Missouri is a tributary of the St. Lawrence.")
TF(7, "na-san-juan", "flowsOutOf", "Река Сан-Хуан вытекает из озера Никарагуа и впадает в Карибское море.", "The San Juan flows out of Lake Nicaragua into the Caribbean Sea.",
   "Река Сан-Хуан впадает в Тихий океан.", "The San Juan flows into the Pacific Ocean.")
TF(8, "na-rio-grande", "crosses", "Рио-Гранде течёт по границе США и Мексики.", "The Rio Grande runs along the border of the United States and Mexico.",
   "Рио-Гранде течёт по границе США и Канады.", "The Rio Grande runs along the border of the United States and Canada.")
TF(9, "na-michigan", "inCountry", "Озеро Мичиган целиком лежит в США.", "Lake Michigan lies wholly in the United States.",
   "Озеро Мичиган лежит на границе США и Канады.", "Lake Michigan lies on the border of the United States and Canada.")
TF(10, "na-great-bear", "inCountry", "Большое Медвежье озеро лежит в Канаде.", "Great Bear Lake is in Canada.", "Большое Медвежье озеро лежит в Мексике.", "Great Bear Lake is in Mexico.")
TF(11, "na-chapala", "inCountry", "Озеро Чапала находится в Мексике.", "Lake Chapala is in Mexico.", "Озеро Чапала находится в Канаде.", "Lake Chapala is in Canada.")
TF(12, "na-denali", "inCountry", "Гора Денали находится на Аляске, в США.", "Denali is in Alaska, in the United States.", "Гора Денали находится в Мексике.", "Denali is in Mexico.")
TF(13, "na-popocatepetl", "inCountry", "Вулкан Попокатепетль находится в Мексике.", "Popocatépetl is in Mexico.", "Вулкан Попокатепетль находится в Канаде.", "Popocatépetl is in Canada.")
TF(14, "na-yucatan", "inCountry", "Полуостров Юкатан поделён между тремя странами: Мексикой, Гватемалой и Белизом.", "The Yucatán Peninsula is shared by three countries: Mexico, Guatemala and Belize.",
   "Весь полуостров Юкатан принадлежит Гватемале.", "The whole Yucatán Peninsula belongs to Guatemala.")
TF(15, "na-hispaniola", "inCountry", "Остров Гаити поделён между двумя странами: Гаити и Доминиканской Республикой.", "The island of Hispaniola is shared by two countries: Haiti and the Dominican Republic.",
   "Весь остров Гаити занимает Куба.", "Cuba covers the whole island of Hispaniola.")
TF(16, "na-copper-canyon", "inCountry", "Медный каньон находится в Мексике.", "The Copper Canyon is in Mexico.", "Медный каньон находится в Канаде.", "The Copper Canyon is in Canada.")

# ---- «tap all…»: the full answer and the border cases fixed in advance; sec = the map it is asked on ----
SEL = [
    {"id": "all-yucatan-countries", "map": "countries", "sec": 27, "want": [MX, GT, BZ], "neutral": [],
     "task": T("Нажми на все страны, которые лежат на полуострове Юкатан", "Tap every country on the Yucatán Peninsula"),
     "borderCases": T("Гватемала считается: на полуостров заходит её северная часть, Петен.", "Guatemala counts: its northern part, the Petén, lies on the peninsula.")},
    {"id": "all-pacific-caribbean", "map": "countries", "sec": 27, "want": [MX, GT, HN, NI, CR, PA], "neutral": [],
     "task": T("Нажми на все страны, которые омывают и Тихий океан, и Карибское море", "Tap every country with coasts on both the Pacific Ocean and the Caribbean Sea"),
     "borderCases": T("Мексика считается: восточный берег Юкатана омывает Карибское море. Гондурас выходит к Тихому океану заливом Фонсека. Сальвадор выходит только к Тихому океану, Белиз — только к Карибскому морю, у США нет берега Карибского моря.",
                      "Mexico counts: the eastern coast of the Yucatán is on the Caribbean Sea. Honduras reaches the Pacific through the Gulf of Fonseca. El Salvador has only a Pacific coast, Belize only a Caribbean one, and the United States has no coast on the Caribbean Sea.")},
    {"id": "all-greater-antilles", "map": "caribbean", "sec": 28, "want": [CU, JM, HT, DO], "neutral": [],
     "task": T("Нажми на все страны Больших Антильских островов", "Tap every country of the Greater Antilles"),
     "borderCases": T("Пуэрто-Рико — тоже Большой Антильский остров, но это территория США, а не отдельная страна. Багамы лежат в Атлантическом океане, к Антильским островам их не относят.",
                      "Puerto Rico is a Greater Antilles island too, but it is a territory of the United States, not a separate country. The Bahamas lie in the Atlantic Ocean and are not counted among the Antilles.")},
    {"id": "all-gulf-rivers", "map": "rivers", "sec": 23, "want": ["na-mississippi", "na-rio-grande", "na-usumacinta"], "neutral": ["na-missouri", "na-ohio", "na-arkansas"],
     "task": T("Нажми на все реки, которые впадают в Мексиканский залив", "Tap every river that flows into the Gulf of Mexico"),
     "borderCases": T("Миссури, Огайо и Арканзас не считаются ошибкой: они впадают в Миссисипи, а с ней — в залив.",
                      "The Missouri, the Ohio and the Arkansas are not a mistake: they flow into the Mississippi, and with it into the Gulf.")},
]

# ---- traps ----
TRAPS = [
    {"id": "trap-us-capital", "country": US, "answer": "cap-washington", "options": ["cap-washington", "cap-new-york", "cap-ottawa", "cap-mexico-city"],
     "labels": {"cap-washington": T("Вашингтон", "Washington"), "cap-new-york": T("Нью-Йорк", "New York"), "cap-ottawa": T("Оттава", "Ottawa"), "cap-mexico-city": T("Мехико", "Mexico City")},
     "question": T("Какой город — столица США?", "Which city is the capital of the United States?"),
     "explain": T("Столица США — Вашингтон. Нью-Йорк — самый большой город страны.", "The capital of the United States is Washington. New York is the country's largest city.")},
    {"id": "trap-canada-capital", "country": CA, "answer": "cap-ottawa", "options": ["cap-ottawa", "cap-toronto", "cap-washington", "cap-havana"],
     "labels": {"cap-ottawa": T("Оттава", "Ottawa"), "cap-toronto": T("Торонто", "Toronto"), "cap-washington": T("Вашингтон", "Washington"), "cap-havana": T("Гавана", "Havana")},
     "question": T("Какой город — столица Канады?", "Which city is the capital of Canada?"),
     "explain": T("Столица Канады — Оттава. Торонто — самый большой город страны.", "The capital of Canada is Ottawa. Toronto is the country's largest city.")},
]

# ---- 25 records: nameless clue, true (the approved section text) and false statements ----
REC = []
def RC(rid, obj, sec, clue, true, false, check, new=False):
    REC.append({"id": rid, "object": obj, "section": sec, "clue": T(*clue), "true": T(*true), "false": T(*false), "check": check, **({"newInReview": True} if new else {})})
RC("labrador-largest-peninsula", "na-labrador", 1, ("Обычно считается крупнейшим полуостровом Северной Америки", "Usually considered the largest peninsula of North America"),
   ("Лабрадор обычно считается крупнейшим полуостровом Северной Америки.", "Labrador is usually considered the largest peninsula of North America."),
   ("Флорида обычно считается крупнейшим полуостровом Северной Америки.", "Florida is usually considered the largest peninsula of North America."),
   "true text = approved section-1 record; Florida about 150,000 km² vs Labrador about 1.4 million km²")
RC("greenland-largest-island", "na-greenland", 1, ("Самый большой остров мира", "The largest island in the world"),
   ("Гренландия — самый большой остров мира (Австралию считают материком).", "Greenland is the largest island in the world (Australia counts as a continent)."),
   ("Самый большой остров мира — Баффинова Земля.", "The largest island in the world is Baffin Island."),
   "NEW, replaces the section-1 Cuba record (Svetlana 18.11: one Cuba record only); Greenland about 2.17 million km², Baffin about 507,000 km² (5th)", True)
RC("murchison-northernmost", "na-boothia", 1, ("Полуостров, на котором лежит самая северная точка материковой части Северной Америки", "The peninsula with the northernmost point of mainland North America"),
   ("Мыс Мёрчисон — самая северная точка материковой части Северной Америки.", "Murchison Promontory is the northernmost point of mainland North America."),
   ("Самая северная точка материковой части Северной Америки лежит на Аляске.", "The northernmost point of mainland North America is in Alaska."),
   "true text = approved section-1 record; Murchison Promontory is on the Boothia Peninsula (71°58′ N); Point Barrow in Alaska is 71°23′ N")
RC("mississippi-longest-system", "na-mississippi", 2, ("Вместе со своим самым длинным притоком образует самую длинную речную систему Северной Америки", "Together with its longest tributary it forms the longest river system of North America"),
   ("Миссисипи и Миссури вместе образуют самую длинную речную систему Северной Америки: больше 6 000 км.", "Together the Mississippi and the Missouri form the longest river system in North America: more than 6,000 km."),
   ("Самая длинная речная система Северной Америки — Юкон.", "The longest river system in North America is the Yukon."),
   "true text = approved section-2 record; the Yukon is about 3,190 km")
RC("mackenzie-longest-canada", "na-mackenzie", 2, ("Вместе с притоками и верховьями образует самую длинную речную систему Канады", "Together with its tributaries and headwaters it forms the longest river system in Canada"),
   ("Маккензи вместе с притоками и верховьями образует самую длинную речную систему Канады.", "The Mackenzie, together with its tributaries and headwaters, forms the longest river system in Canada."),
   ("Самая длинная речная система Канады — река Нельсон.", "The longest river system in Canada is the Nelson."),
   "true text = approved section-2 record; Mackenzie system about 4,240 km, Nelson–Saskatchewan about 2,575 km")
RC("columbia-most-water-pacific", "na-columbia", 2, ("Самая полноводная из рек Северной Америки, впадающих в Тихий океан", "The North American river with the highest average discharge into the Pacific Ocean"),
   ("Колумбия имеет самый большой средний расход воды среди рек Северной Америки, впадающих в Тихий океан.", "The Columbia has the highest average discharge of any North American river flowing into the Pacific Ocean."),
   ("Самая полноводная из рек Северной Америки, впадающих в Тихий океан, — Колорадо.", "The North American river with the highest discharge into the Pacific is the Colorado."),
   "true text = approved section-2 record; the Colorado usually does not reach the sea (its card)")
RC("superior-largest-freshwater", "na-superior", 3, ("Обычно считается самым большим по площади пресным озером мира", "Usually considered the largest freshwater lake in the world by area"),
   ("Верхнее обычно считается самым большим по площади пресным озером мира.", "Lake Superior is usually considered the largest freshwater lake in the world by area."),
   ("Самым большим по площади пресным озером мира считают озеро Мичиган.", "Lake Michigan is considered the largest freshwater lake in the world by area."),
   "true text = approved section-3 record; Superior about 82,100 km², Michigan about 58,000 km²")
RC("great-slave-deepest", "na-great-slave", 3, ("Самое глубокое озеро Северной Америки, около 614 м", "The deepest lake in North America, about 614 m"),
   ("Большое Невольничье — самое глубокое озеро Северной Америки, около 614 м.", "Great Slave Lake is the deepest lake in North America, about 614 m."),
   ("Самое глубокое озеро Северной Америки — Большое Солёное озеро.", "The deepest lake in North America is the Great Salt Lake."),
   "true text = approved section-3 record; the Great Salt Lake is shallow (about 10 m)")
RC("great-bear-largest-in-canada", "na-great-bear", 3, ("Самое большое озеро, целиком лежащее в Канаде", "The largest lake lying entirely in Canada"),
   ("Большое Медвежье — самое большое озеро, целиком лежащее в Канаде.", "Great Bear Lake is the largest lake lying entirely in Canada."),
   ("Самое большое озеро, целиком лежащее в Канаде, — Виннипег.", "The largest lake lying entirely in Canada is Lake Winnipeg."),
   "true text = approved section-3 record; Great Bear about 31,000 km², Winnipeg about 24,500 km²")
RC("denali-highest", "na-denali", 4, ("Высочайшая вершина Северной Америки, 6190 м", "The highest peak of North America, 6,190 m"),
   ("Денали — высочайшая вершина Северной Америки, 6190 м.", "Denali is the highest peak of North America, 6,190 m."),
   ("Высочайшая вершина Северной Америки — Орисаба.", "The highest peak of North America is Pico de Orizaba."),
   "true text = approved section-4 record; Orizaba 5,636 m")
RC("orizaba-highest-volcano", "na-orizaba", 4, ("Самый высокий вулкан Северной Америки, 5636 м", "The highest volcano of North America, 5,636 m"),
   ("Орисаба — самый высокий вулкан Северной Америки, 5636 м.", "Pico de Orizaba is the highest volcano of North America, 5,636 m."),
   ("Самый высокий вулкан Северной Америки — Попокатепетль.", "The highest volcano of North America is Popocatépetl."),
   "true text = approved section-4 record; Popocatépetl about 5,400 m")
RC("canadian-shield-oldest-rocks", "na-laurentian-upland", 4, ("Здесь найдены одни из самых древних горных пород Земли, около 4 млрд лет", "Some of the oldest rocks on Earth, about 4 billion years old, were found here"),
   ("На Канадском щите найдены одни из самых древних горных пород Земли: их возраст около 4 млрд лет.", "Some of the oldest rocks on Earth, about 4 billion years old, have been found on the Canadian Shield."),
   ("Самым древним породам Канадского щита около 4 миллионов лет.", "The oldest rocks of the Canadian Shield are about 4 million years old."),
   "true text = approved section-4 record (Acasta gneiss about 4.0 billion years); the false one is a thousand times younger")
RC("death-valley-lowest", "na-mojave", 5, ("Пустыня, где в Долине Смерти лежит самая низкая точка Северной Америки", "The desert where Death Valley holds the lowest point in North America"),
   ("Бэдуотер в Долине Смерти (Мохаве) — самая низкая точка Северной Америки: около 86 м ниже уровня моря.", "Badwater Basin in Death Valley (the Mojave) is the lowest point in North America, about 86 m below sea level."),
   ("Самая низкая точка Северной Америки лежит в пустыне Чиуауа.", "The lowest point in North America is in the Chihuahuan Desert."),
   "true text = approved section-5 record")
RC("bristlecone-oldest-trees", "na-great-basin", 5, ("Пустыня, в горах которой растут одни из древнейших известных деревьев Земли", "The desert whose mountains hold some of the oldest known trees on Earth"),
   ("В горах Большого Бассейна растут остистые сосны — одни из древнейших известных деревьев Земли: возраст одного дерева больше 4800 лет (считается возраст отдельного ствола, а не корневой системы).",
    "Bristlecone pines grow in the mountains of the Great Basin; they are among the oldest known trees on Earth, one of them more than 4,800 years old (the age of a single trunk, not of a root system)."),
   ("Остистые сосны Большого Бассейна живут не дольше 100 лет.", "The bristlecone pines of the Great Basin live no longer than 100 years."),
   "true text = approved section-5 record")
RC("white-sands-gypsum", "na-chihuahuan", 5, ("Пустыня, где лежит самое большое в мире поле дюн из гипса", "The desert with the largest gypsum dune field in the world"),
   ("Уайт-Сэндс в пустыне Чиуауа (Нью-Мексико) — самое большое в мире поле дюн из гипса: белые дюны занимают примерно 712 км² (275 кв. миль; данные Службы национальных парков США).",
    "White Sands in the Chihuahuan Desert (New Mexico) is the largest gypsum dune field in the world: its white dunes cover about 712 km² (275 square miles; figure of the US National Park Service)."),
   ("Самое большое в мире поле дюн из гипса лежит в пустыне Мохаве.", "The largest gypsum dune field in the world is in the Mojave Desert."),
   "true text = approved section-5 record")
RC("canada-largest-country", "cty-canada", 6, ("Самая большая страна Северной Америки", "The largest country of North America"),
   ("Канада — самая большая страна Северной Америки, около 10 млн км².", "Canada is the largest country of North America, about 10 million km²."),
   ("Самая большая страна Северной Америки — США.", "The largest country of North America is the United States."),
   "true text = approved section-6 record; the US about 9.8 million km²")
RC("canada-longest-coastline", "cty-canada", 6, ("Страна с самой длинной береговой линией в мире", "The country with the longest coastline in the world"),
   ("У Канады самая длинная береговая линия в мире.", "Canada has the longest coastline in the world."),
   ("Самая длинная береговая линия в мире — у Мексики.", "Mexico has the longest coastline in the world."),
   "true text = approved section-6 record")
RC("canada-us-longest-border", "cty-united-states", 6, ("Страна, граница которой с Канадой — самая длинная граница между двумя государствами", "The country whose border with Canada is the longest border between two countries"),
   ("Граница Канады и США — самая длинная международная граница между двумя государствами, около 8 900 км, включая участок между Канадой и Аляской.",
    "The Canada–United States border is the world’s longest international border between two countries, measuring about 8,900 km, including the Alaska–Canada section."),
   ("Самая длинная граница между двумя государствами — граница США и Мексики.", "The longest border between two countries is the one between the United States and Mexico."),
   "true text = approved section-6 record; the US–Mexico border is about 3,150 km")
RC("mexico-city-metropolis", "cty-mexico", 6, ("Страна, столица которой — одна из крупнейших городских агломераций Северной Америки, больше 20 млн человек", "The country whose capital is one of the largest metropolitan areas in North America, over 20 million people"),
   ("Мехико — одна из крупнейших городских агломераций Северной Америки. В ней проживает более 20 миллионов человек.", "Mexico City is one of the largest metropolitan areas in North America, with a population of more than 20 million people."),
   ("В агломерации Мехико живёт около 2 миллионов человек.", "About 2 million people live in the Mexico City metropolitan area."),
   "true text = approved section-6 record")
RC("nicaragua-largest-central", "cty-nicaragua", 6, ("Самая большая страна Центральной Америки", "The largest country of Central America"),
   ("Никарагуа — самая большая страна Центральной Америки, около 130 тысяч км².", "Nicaragua is the largest country of Central America, about 130,000 km²."),
   ("Самая большая страна Центральной Америки — Панама.", "The largest country of Central America is Panama."),
   "true text = approved section-6 record; Panama about 75,000 km²")
RC("el-salvador-smallest-central", "cty-el-salvador", 6, ("Самая маленькая страна Центральной Америки", "The smallest country of Central America"),
   ("Сальвадор — самая маленькая страна Центральной Америки, около 21 тысячи км².", "El Salvador is the smallest country of Central America, about 21,000 km²."),
   ("Самая маленькая страна Центральной Америки — Белиз.", "The smallest country of Central America is Belize."),
   "true text = approved section-6 record; Belize about 23,000 km²")
RC("cuba-largest-caribbean-island", "cty-cuba", 7, ("Страна на крупнейшем острове Карибского бассейна", "The country on the largest island in the Caribbean"),
   ("Куба — крупнейший остров Карибского бассейна.", "Cuba is the largest island in the Caribbean region."),
   ("Крупнейший остров Карибского бассейна — Ямайка.", "The largest island in the Caribbean region is Jamaica."),
   "true text = approved section-7 record (the one Cuba record kept, Svetlana 18.11)")
RC("pico-duarte-highest", "cty-dominican-republic", 7, ("Страна, где стоит высочайшая вершина островов Карибского бассейна, 3098 м", "The country with the highest peak of the Caribbean islands, 3,098 m"),
   ("Пико-Дуарте (3098 м) в Доминиканской Республике — высочайшая вершина островов Карибского бассейна.", "Pico Duarte (3,098 m) in the Dominican Republic is the highest peak of the Caribbean islands."),
   ("Высочайшая вершина островов Карибского бассейна стоит на Ямайке.", "The highest peak of the Caribbean islands is in Jamaica."),
   "true text = approved section-7 record; Blue Mountain Peak in Jamaica 2,256 m")
RC("saint-kitts-smallest", "cty-saint-kitts-and-nevis", 7, ("Самая маленькая страна Америки и по площади, и по населению", "The smallest country of the Americas both in area and in population"),
   ("Сент-Китс и Невис — самая маленькая страна Америки и по площади, и по населению.", "Saint Kitts and Nevis is the smallest country of the Americas both in area and in population."),
   ("Самая маленькая страна Америки — Барбадос.", "The smallest country of the Americas is Barbados."),
   "true text = approved section-7 record; Barbados about 430 km², Saint Kitts and Nevis about 260 km²")
RC("pitch-lake-asphalt", "cty-trinidad-and-tobago", 7, ("Страна, где лежит крупнейшее в мире природное скопление асфальта", "The country with the largest natural deposit of asphalt in the world"),
   ("На Тринидаде лежит Асфальтовое озеро (Питч-Лейк) — крупнейшее в мире природное скопление асфальта.", "Pitch Lake on Trinidad is the largest natural deposit of asphalt in the world."),
   ("Асфальтовое озеро Питч-Лейк лежит на Кубе.", "Pitch Lake lies in Cuba."),
   "true text = approved section-7 record")

rv_path, dict_path, ch_path = "data/review/b4-block.json", "data/dictionary/b4-block.json", "data/challenge/b4-block.json"
old = load(rv_path, {})
review = {
    "block": "namerica-4", "unit": "block-review", "status": "draft",
    "rules": {
        "noNewObjects": "only the places of block 4: 22 of section 1, 13 rivers, 14 lakes (with Niagara Falls), 15 mountains and plains, 12 deserts and canyons, 23 countries of sections 6-7; each task opens the map the place was taught on (section 1: the North America base map; rivers, lakes, mountains, deserts maps; the 10 countries of section 6 on the countries map with the large map of Central America; the 13 island states on the Caribbean map with the large map of the Lesser Antilles)",
        "lesson": "10 tasks, 3-5 minutes; places are spread over the sections of the lesson; repeats of a mistake come on top of the 10 tasks (at most 20)",
        "adaptive": "no mistakes yet: the places asked longest ago (or never) come first, taken in turn from each section; a few mistakes: up to 60% of the places are the child's weakest (most mistakes first), the rest as with no mistakes; repeated mistakes: a wrong answer comes back once at the end of the lesson, and a second mistake shows the answer and moves on (the place stays weak for the next lesson); a place is asked at most once per lesson (a country and its capital count as one place), and a weak place's weight is capped at 3 so one place never fills a lesson",
        "neutral": "Greenland and the dependencies of other countries are geographic places only: never a country in a task; Puerto Rico is named only in the note of the Greater Antilles task",
        "mouths": "a river is tied only to a water body taught on its card: no Yukon (the Bering Sea is not taught, Svetlana 18.11.2026) and no Colorado (by its card it usually does not reach the Gulf of California); the Missouri, the Ohio and the Arkansas flow into the Mississippi",
        "crosses": "river → country pairs use «through» only; «along» (a border stretch: the Rio Grande for Mexico, the Usumacinta for Guatemala, the San Juan for Costa Rica, the St. Lawrence for the United States) is never a pair and never a wrong answer",
        "approval": "each relation, true/false pair, select-all task, trap and record: approval.contentSha256 = first 16 hex of sha256 over the item without its approval (tools/approve.mjs); an item shows only when approved",
    },
    "lessons": [
        {"id": "lesson-1-map-rivers", "title": T("Северная Америка на карте и реки", "North America on the map and rivers"), "objects": ["section-1", "rivers"],
         "tasks": [{"type": "find-on-map", "count": 4}, {"type": "what-is-it", "count": 3}, {"type": "label-map", "count": 1, "labels": 4}, {"type": "write-name", "count": 2}]},
        {"id": "lesson-2-lakes-mountains-deserts", "title": T("Озёра, горы, пустыни и каньоны", "Lakes, mountains, deserts and canyons"), "objects": ["lakes", "mountains", "deserts"],
         "tasks": [{"type": "find-on-map", "count": 4}, {"type": "what-is-it", "count": 3}, {"type": "label-map", "count": 1, "labels": 4}, {"type": "write-name", "count": 2}]},
        {"id": "lesson-3-countries", "title": T("Страны и столицы", "Countries and capitals"), "objects": ["countries-north-central", "countries-caribbean"],
         "tasks": [{"type": "find-country", "count": 3}, {"type": "find-capital", "count": 2}, {"type": "which-country", "count": 2}, {"type": "pairs-country-capital", "count": 1}, {"type": "write-capital", "count": 2}]},
        {"id": "lesson-4-relations", "title": T("Связи", "Connections"), "objects": ["relations"],
         "tasks": [{"type": "pairs", "count": 4, "kinds": ["flowsInto", "flowsOutOf", "crosses", "inCountry"]}, {"type": "select-all", "count": 3}, {"type": "true-false", "count": 2}, {"type": "trap", "count": 1}]},
        {"id": "lesson-5-records", "title": T("Рекорды", "Records"), "objects": ["records"],
         "tasks": [{"type": "true-false", "count": 4}, {"type": "pairs", "count": 2}, {"type": "find-by-record", "count": 2}, {"type": "what-is-it-by-record", "count": 2}],
         "note": "25 records: 4 + 2x3 + 2 + 2 = 14 different records per lesson"},
        {"id": "block-final", "title": T("Итог блока", "Block final"), "geowords": ["b4-block-final-en", "b4-block-final-ru"], "reward": "passport stamp"},
    ],
    "crosses": [{"river": r, "through": th, "along": al} for r, (th, al) in CROSSES.items()],
    "relations": keep(old.get("relations", []), rel),
    "trueFalse": keep(old.get("trueFalse", []), tf),
    "selectAll": keep(old.get("selectAll", []), SEL),
    "traps": keep(old.get("traps", []), TRAPS),
    "records": keep(old.get("records", []), REC),
}
json.dump(review, open(rv_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1); open(rv_path, "a").write("\n")

oldd = load(dict_path, {})
if not oldd:
    w = lambda a, d: {"answer": a, "role": "block-final", "definition": d, "approval": {"status": "draft"}}
    oldd = {"block": "namerica-4", "status": "draft", "rules": {
        "structure": "one block-final word per language for the block 4 «North America» review (Svetlana 18.11.2026: ПЕРВОПРОХОДЦЫ / PATHFINDERS); Challenge GeoWords reuse the approved review words of block 4 sections 1-7",
        "approval": "approval.contentSha256 = first 16 hex of sha256 over {answer, definition}",
        "definitions": "a definition never contains its answer word, nor a word of the same root (no «первый», «проход», «path», «find»)"},
        "units": [{"id": "block-final", "title": T("Итог блока", "Block final"), "words": {
            "en": [w("PATHFINDERS", "People who go first into lands unknown to them and open the way for others. In North America they were Jacques Cartier on the St. Lawrence, La Salle on the Mississippi, Alexander Mackenzie, and Lewis and Clark on the way to the Pacific.")],
            "ru": [w("ПЕРВОПРОХОДЦЫ", "Люди, которые раньше других отправляются в неизвестные им земли и открывают туда путь. В Северной Америке это Жак Картье на реке Святого Лаврентия, Ласалль на Миссисипи, Александр Маккензи, Льюис и Кларк на пути к Тихому океану.")]}}]}
    json.dump(oldd, open(dict_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1); open(dict_path, "a").write("\n")

oldc = load(ch_path, {})
if oldc.get("status") != "approved":
    E_, M_, H_ = "easy", "medium", "hard"
    tiers = {
        "countries": {E_: [CA, US, MX, CU], M_: [GT, HN, NI, PA, HT, DO], H_: [BZ, SV, CR, JM, "cty-bahamas"]},
        "rivers": {E_: ["na-mississippi", "na-missouri", "na-yukon", "na-mackenzie", "na-st-lawrence", "na-rio-grande", "na-colorado"],
                   M_: ["na-ohio", "na-columbia", "na-nelson", "na-arkansas"],
                   H_: ["na-usumacinta", "na-san-juan"]}}
    pool = {"countries": [i for t in (E_, M_, H_) for i in tiers["countries"][t]], "rivers": [i for t in (E_, M_, H_) for i in tiers["rivers"][t]]}
    ch = {"block": "namerica-4", "status": "draft",
          "challenge": {"parts": ["speed-hunt", "geowords"],
                        "geowords": "three app-generated words per round from the approved review words of block 4 sections 1-7, three words from three different sections; letters on the countries map of North America with its rivers"},
          "speedHunt": {
              "durationSeconds": 60, "map": "./assets/namerica-countries.webp",
              "prompt": {"en": "Find:", "ru": "Найди:", "object": "the country or river name as on the cards; no capitals, records or facts"},
              "order": "difficulty alternates easy, medium, easy, hard… (random inside a tier, no object repeats within a round); after a tier runs out the others go on in turn",
              "difficulty": tiers,
              "islands": {"ids": [CU, JM, HT, DO, "cty-bahamas"], "from": "data/maps/namerica-caribbean.json", "how": "their tap areas are carried onto the countries map through the frame of the Caribbean map (the same base, tools/namerica_base.py)"},
              "correct": "+1 and the next object at once",
              "wrong": "the right place lights up for 0.5 s; no penalty except time; the object goes into the weak list",
              "skip": "allowed",
              "hit": "a river counts within 8 CSS px of its drawn line; a country counts inside its outline or within 22 CSS px of it; the small countries (the hard tier) within 36 CSS px — an enlarged tap area that lies only over the sea, never over a neighbour: a tap inside another country's outline answers that country (only a tap within 2 px of the asked country's own border line still counts for it), and the nearest object of the pool wins, so two enlarged areas never overlap",
              "excluded": {"ids": ["cty-saint-kitts-and-nevis", "cty-antigua-and-barbuda", "cty-dominica", "cty-saint-lucia", "cty-saint-vincent", "cty-grenada", "cty-barbados", "cty-trinidad-and-tobago"],
                           "why": "the eight small states of the Lesser Antilles cannot be seen on the map of the whole continent, even enlarged (Svetlana 18.11.2026: they are reviewed in lesson 3); lakes, mountains, deserts and section-1 places are on other maps; no capitals"},
              "score": "objects found in the round + personal best",
              "stars": {"thresholds": [10, 15, 20], "provisional": True, "note": "the same as Europe and Asia; tune after testing with children"},
              "pool": pool, "poolSize": len(pool["countries"]) + len(pool["rivers"])},
          "geowords": {
              "words": "approved review words (role review) of data/dictionary/b4-section-1..7.json, each word once; three different sections per round; recently played words last",
              "places": "the countries map of North America (namerica-countries.webp): the 10 countries of section 6 (a letter in the main part of the country, its circle wholly inside the border; a country too small for that takes no letter), the 13 rivers («on the Mississippi») and a river inside a country it crosses, and the section-1 objects (seas, gulfs, peninsulas, islands, oceans); at least a third of the letters on rivers, then the other places first, so a word is never rivers only; a country named once; spacing 10% of map width",
              "fallback": "a word that cannot be laid out is replaced by the next word of another section"}}
    json.dump(ch, open(ch_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1); open(ch_path, "a").write("\n")
print("relations", len(rel), "tf", len(tf), "selectAll", len(SEL), "traps", len(TRAPS), "records", len(REC))
