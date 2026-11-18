# Writes the draft block 3 «Asia» review (data/review/b3-block.json), its block-final word (data/dictionary/b3-block.json) and the
# Challenge rules (data/challenge/b3-block.json) from the plan approved by Svetlana on 1.11.2026 with her ten corrections (22:42):
# five lessons; no new places (only the 138 places of sections 1-8, and the Arabian Sea and the Bay of Bengal of block 1 as river mouths);
# rivers flow into the water bodies the child has learned (no Andaman Sea, East China Sea or Gulf of Thailand); the Amu Darya and the
# Syr Darya carry a note on the Aral Sea; English says Borneo; tasks on the Indian subcontinent say India covers most of it; every
# «tap all…» task lists its full answer and its border cases in advance; the records state their criterion and avoid disputable absolutes.
# Items already approved in the files are kept as they are (an item changes only by re-approval).
# Usage: python3 tools/build_b3_block_review.py
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

# ---- relations ----
rel = []
def R(kind, subject, obj, **kw):
    rel.append({"id": f"{kind}-{subject.replace('as-', '').replace('cty-', '')}", "relation": kind, "subject": subject, "object": obj, **kw})

# river -> where it flows (only water bodies the child has learned)
for r in ["as-ob", "as-yenisei", "as-lena", "as-kolyma"]: R("flowsInto", r, "as-arctic-ocean")
R("flowsInto", "as-irtysh", "as-ob")
R("flowsInto", "as-amur", "as-sea-of-okhotsk")
R("flowsInto", "as-mekong", "as-south-china-sea")
R("flowsInto", "as-ganges", "bay-of-bengal")
R("flowsInto", "as-brahmaputra", "bay-of-bengal")
R("flowsInto", "as-godavari", "bay-of-bengal")
R("flowsInto", "as-indus", "arabian-sea")
R("flowsInto", "as-tigris", "as-persian-gulf", note=T("Тигр и Евфрат сливаются в одну реку, Шатт-эль-Араб, и она впадает в Персидский залив.",
    "The Tigris and the Euphrates join into one river, the Shatt al-Arab, which flows into the Persian Gulf."))
R("flowsInto", "as-euphrates", "as-persian-gulf", note=T("Тигр и Евфрат сливаются в одну реку, Шатт-эль-Араб, и она впадает в Персидский залив.",
    "The Tigris and the Euphrates join into one river, the Shatt al-Arab, which flows into the Persian Gulf."))
ARAL = T("Амударья и Сырдарья веками впадали в Аральское море. С середины XX века их воду забирают на орошение полей: Амударья теперь почти не доходит до моря, а Сырдарья питает его северную часть, которая понемногу восстанавливается.",
         "For centuries the Amu Darya and the Syr Darya flowed into the Aral Sea. Since the middle of the 20th century their water has been taken to irrigate fields: the Amu Darya now hardly reaches the sea, and the Syr Darya feeds its northern part, which is slowly recovering.")
R("flowsInto", "as-amu-darya", "as-aral", note=ARAL, label=T("Аральское море (раньше)", "the Aral Sea (in the past)"))
R("flowsInto", "as-syr-darya", "as-aral", note=ARAL)
R("flowsInto", "as-ili", "as-balkhash")
R("flowsInto", "as-jordan", "as-dead-sea")

# capital -> its river or lake (the capital stands for its country)
R("capitalOn", "cty-iraq", "as-tigris")
R("capitalOn", "cty-thailand", "as-chao-phraya")
R("capitalOn", "cty-laos", "as-mekong")
R("capitalOn", "cty-cambodia", "as-mekong")
R("capitalOn", "cty-azerbaijan", "as-caspian")

# place -> the country it lies in (only places that lie in one country, or wholly in the listed ones)
MOST = lambda ru, en: T(ru, en)
R("inCountry", "as-fuji", "cty-japan")
R("inCountry", "as-krakatoa", "cty-indonesia")
R("inCountry", "as-elburz", "cty-iran")
R("inCountry", "as-arakan", "cty-myanmar")
R("inCountry", "as-taklamakan", "cty-china")
R("inCountry", "as-karakum", "cty-turkmenistan")
R("inCountry", "as-lut", "cty-iran")
R("inCountry", "as-gobi", ["cty-mongolia", "cty-china"])
R("inCountry", "as-thar", ["cty-india", "cty-pakistan"])
R("inCountry", "as-issyk-kul", "cty-kyrgyzstan")
R("inCountry", "as-balkhash", "cty-kazakhstan")
R("inCountry", "as-tonle-sap", "cty-cambodia")
R("inCountry", "as-van", "cty-turkey")
R("inCountry", "as-urmia", "cty-iran")
R("inCountry", "as-khovsgol", "cty-mongolia")
R("inCountry", "as-qinghai", "cty-china")
R("inCountry", "as-korean-peninsula", ["cty-north-korea", "cty-south-korea"])
R("inCountry", "as-asia-minor", "cty-turkey")
R("inCountry", "as-hindustan", "cty-india", label=T("Индия — бо́льшая часть полуострова", "India — most of the subcontinent"),
  note=T("Индия занимает бо́льшую часть полуострова Индостан.", "India covers most of the Indian subcontinent."))
R("inCountry", "as-borneo", ["cty-indonesia", "cty-malaysia", "cty-brunei"])

# river -> the countries it flows through (for pairs only «through»; «along» is a border stretch: never a pair, never a wrong answer)
CROSSES = {
    "as-irtysh": (["cty-china", "cty-kazakhstan"], []),
    "as-yangtze": (["cty-china"], []), "as-huang-he": (["cty-china"], []), "as-tarim": (["cty-china"], []),
    "as-ili": (["cty-china", "cty-kazakhstan"], []),
    "as-mekong": (["cty-china", "cty-laos", "cty-cambodia", "cty-vietnam"], ["cty-myanmar", "cty-thailand"]),
    "as-chao-phraya": (["cty-thailand"], []), "as-salween": (["cty-china", "cty-myanmar"], ["cty-thailand"]),
    "as-irrawaddy": (["cty-myanmar"], []),
    "as-brahmaputra": (["cty-china", "cty-india", "cty-bangladesh"], []), "as-ganges": (["cty-india", "cty-bangladesh"], []),
    "as-indus": (["cty-china", "cty-india", "cty-pakistan"], []), "as-godavari": (["cty-india"], []),
    "as-amu-darya": (["cty-turkmenistan", "cty-uzbekistan"], ["cty-tajikistan", "cty-afghanistan"]),
    "as-syr-darya": (["cty-kyrgyzstan", "cty-uzbekistan", "cty-tajikistan", "cty-kazakhstan"], []),
    "as-tigris": (["cty-turkey", "cty-iraq"], ["cty-syria"]), "as-euphrates": (["cty-turkey", "cty-syria", "cty-iraq"], []),
}

# ---- true / false (new texts; one statement of a pair per lesson) ----
tf = []
def TF(i, subject, relation, t_ru, t_en, f_ru, f_en):
    tf.append({"id": f"tf-a{i:02d}", "subject": subject, "relation": relation, "true": T(t_ru, t_en), "false": T(f_ru, f_en)})
TF(1, "as-mekong", "flowsInto", "Меконг впадает в Южно-Китайское море.", "The Mekong flows into the South China Sea.", "Меконг впадает в Персидский залив.", "The Mekong flows into the Persian Gulf.")
TF(2, "as-ganges", "flowsInto", "Ганг впадает в Бенгальский залив.", "The Ganges flows into the Bay of Bengal.", "Ганг впадает в Аравийское море.", "The Ganges flows into the Arabian Sea.")
TF(3, "as-indus", "flowsInto", "Инд впадает в Аравийское море.", "The Indus flows into the Arabian Sea.", "Инд впадает в Бенгальский залив.", "The Indus flows into the Bay of Bengal.")
TF(4, "as-lena", "flowsInto", "Лена впадает в Северный Ледовитый океан.", "The Lena flows into the Arctic Ocean.", "Лена впадает в Тихий океан.", "The Lena flows into the Pacific Ocean.")
TF(5, "as-amu-darya", "flowsInto", "Амударья веками впадала в Аральское море, а теперь из-за орошения полей почти не доходит до него.",
   "For centuries the Amu Darya flowed into the Aral Sea; now, because its water irrigates fields, it hardly reaches the sea.",
   "Амударья впадает в Персидский залив.", "The Amu Darya flows into the Persian Gulf.")
TF(6, "as-ili", "flowsInto", "Река Или впадает в озеро Балхаш.", "The Ili flows into Lake Balkhash.", "Река Или впадает в Аральское море.", "The Ili flows into the Aral Sea.")
TF(7, "as-jordan", "flowsInto", "Иордан впадает в Мёртвое море.", "The Jordan flows into the Dead Sea.", "Иордан впадает в Персидский залив.", "The Jordan flows into the Persian Gulf.")
TF(8, "as-euphrates", "crosses", "Евфрат течёт через Турцию, Сирию и Ирак.", "The Euphrates flows through Turkey, Syria and Iraq.", "Евфрат течёт через Иран.", "The Euphrates flows through Iran.")
TF(9, "cty-iraq", "capitalOn", "Багдад стоит на Тигре.", "Baghdad stands on the Tigris.", "Багдад стоит на Инде.", "Baghdad stands on the Indus.")
TF(10, "cty-thailand", "capitalOn", "Бангкок стоит на реке Чаупхрая.", "Bangkok stands on the Chao Phraya.", "Бангкок стоит на Меконге.", "Bangkok stands on the Mekong.")
TF(11, "as-fuji", "inCountry", "Вулкан Фудзи находится в Японии.", "Mount Fuji is in Japan.", "Вулкан Фудзи находится в Индонезии.", "Mount Fuji is in Indonesia.")
TF(12, "as-issyk-kul", "inCountry", "Озеро Иссык-Куль находится в Киргизии.", "Lake Issyk-Kul is in Kyrgyzstan.", "Озеро Иссык-Куль находится в Монголии.", "Lake Issyk-Kul is in Mongolia.")
TF(13, "as-karakum", "inCountry", "Пустыня Каракумы занимает бо́льшую часть Туркменистана.", "The Karakum Desert covers most of Turkmenistan.", "Пустыня Каракумы лежит в Саудовской Аравии.", "The Karakum Desert lies in Saudi Arabia.")
TF(14, "as-hindustan", "inCountry", "Индия занимает бо́льшую часть полуострова Индостан.", "India covers most of the Indian subcontinent.", "Весь полуостров Индостан занимает Пакистан.", "Pakistan covers the whole of the Indian subcontinent.")
TF(15, "as-borneo", "inCountry", "Остров Калимантан поделён между тремя странами: Индонезией, Малайзией и Брунеем.", "The island of Borneo is shared by three countries: Indonesia, Malaysia and Brunei.",
   "Весь остров Калимантан принадлежит Малайзии.", "The whole island of Borneo belongs to Malaysia.")

# ---- «tap all…»: the full answer and the border cases fixed in advance ----
SEL = [
    {"id": "all-mekong-countries", "map": "countries", "want": ["cty-china", "cty-myanmar", "cty-laos", "cty-thailand", "cty-cambodia", "cty-vietnam"], "neutral": [],
     "task": T("Нажми на все страны, через которые течёт Меконг", "Tap every country the Mekong flows through"),
     "borderCases": T("Мьянма и Таиланд считаются: Меконг течёт по их границе с Лаосом, а карточка раздела называет шесть стран.",
                      "Myanmar and Thailand count: the Mekong runs along their border with Laos, and the section card names six countries.")},
    {"id": "all-syr-darya-countries", "map": "countries", "want": ["cty-kyrgyzstan", "cty-uzbekistan", "cty-tajikistan", "cty-kazakhstan"], "neutral": [],
     "task": T("Нажми на все страны, через которые течёт Сырдарья", "Tap every country the Syr Darya flows through"),
     "borderCases": T("Пограничных случаев нет: Сырдарья (с её истоком Нарыном) течёт через все четыре страны.",
                      "No border cases: the Syr Darya (with the Naryn, its source) flows through all four countries.")},
    {"id": "all-euphrates-countries", "map": "countries", "want": ["cty-turkey", "cty-syria", "cty-iraq"], "neutral": [],
     "task": T("Нажми на все страны, через которые течёт Евфрат", "Tap every country the Euphrates flows through"),
     "borderCases": T("Пограничных случаев нет.", "No border cases.")},
    {"id": "all-borneo-countries", "map": "countries", "want": ["cty-indonesia", "cty-malaysia", "cty-brunei"], "neutral": [],
     "task": T("Нажми на все страны, которые лежат на острове Калимантан", "Tap every country on the island of Borneo"),
     "borderCases": T("Пограничных случаев нет: остров поделён между тремя странами.", "No border cases: the island is shared by three countries.")},
    {"id": "all-arabian-countries", "map": "countries", "want": ["cty-saudi-arabia", "cty-yemen", "cty-oman", "cty-uae", "cty-qatar", "cty-kuwait"],
     "neutral": ["cty-bahrain", "cty-jordan", "cty-iraq"],
     "task": T("Нажми на все страны Аравийского полуострова", "Tap every country on the Arabian Peninsula"),
     "borderCases": T("Бахрейн — остров в Персидском заливе у берега полуострова, а северную границу полуострова проводят по-разному, так что Иордания и Ирак иногда попадают на его край. Нажатие на эти три страны не считается ошибкой, но и не нужно для ответа.",
                      "Bahrain is an island in the Persian Gulf off the peninsula, and the northern edge of the peninsula is drawn in different ways, so Jordan and Iraq sometimes fall on it. A tap on these three is not a mistake, but they are not needed for the answer.")},
    {"id": "all-arctic-rivers", "map": "rivers", "want": ["as-ob", "as-yenisei", "as-lena", "as-kolyma"], "neutral": ["as-irtysh"],
     "task": T("Нажми на все реки, которые впадают в Северный Ледовитый океан", "Tap every river that flows into the Arctic Ocean"),
     "borderCases": T("Иртыш не считается ошибкой: он впадает в Обь, а с ней — в океан.", "The Irtysh is not a mistake: it flows into the Ob, and with it into the ocean.")},
]

# ---- traps ----
TRAPS = [
    {"id": "trap-turkey-capital", "country": "cty-turkey", "answer": "cap-ankara", "options": ["cap-ankara", "cap-istanbul", "cap-tehran", "cap-baghdad"],
     "labels": {"cap-ankara": T("Анкара", "Ankara"), "cap-istanbul": T("Стамбул", "Istanbul"), "cap-tehran": T("Тегеран", "Tehran"), "cap-baghdad": T("Багдад", "Baghdad")},
     "question": T("Какой город — столица Турции?", "Which city is the capital of Turkey?"),
     "explain": T("Столица Турции — Анкара. Стамбул — самый большой город страны, он стоит на обоих берегах Босфора.",
                  "The capital of Turkey is Ankara. Istanbul is the country's largest city; it stands on both banks of the Bosporus.")},
    {"id": "trap-myanmar-capital", "country": "cty-myanmar", "answer": "cap-naypyidaw", "options": ["cap-naypyidaw", "cap-yangon", "cap-bangkok", "cap-hanoi"],
     "labels": {"cap-naypyidaw": T("Нейпьидо", "Naypyidaw"), "cap-yangon": T("Янгон", "Yangon"), "cap-bangkok": T("Бангкок", "Bangkok"), "cap-hanoi": T("Ханой", "Hanoi")},
     "question": T("Какой город — столица Мьянмы?", "Which city is the capital of Myanmar?"),
     "explain": T("Столица Мьянмы — Нейпьидо, её построили в 2000-х годах. Янгон — прежняя столица и самый большой город страны.",
                  "The capital of Myanmar is Naypyidaw, built in the 2000s. Yangon is the former capital and the country's largest city.")},
    {"id": "trap-caspian-lake", "country": "as-caspian", "answer": "lake", "options": ["lake", "sea"],
     "labels": {"lake": T("Озеро", "A lake"), "sea": T("Море", "A sea")},
     "question": T("Каспийское море — это море или озеро?", "Is the Caspian Sea a sea or a lake?"),
     "explain": T("Его называют морем, но это озеро: оно не соединяется с Мировым океаном. Это самое большое по площади озеро на Земле.",
                  "It is called a sea, but it is a lake: it is not connected to the World Ocean. It is the largest lake on Earth by area.")},
]

# ---- 25 records: nameless clue, true and false statements; criterion stated ----
REC = []
def RC(rid, obj, sec, clue, true, false, check, changed=False):
    REC.append({"id": rid, "object": obj, "section": sec, "clue": T(*clue), "true": T(*true), "false": T(*false), "check": check, **({"changedFromSection": True} if changed else {})})
RC("arabian-largest-peninsula", "as-arabian-peninsula", 1, ("Самый большой полуостров мира по площади", "The largest peninsula in the world by area"),
   ("Аравийский полуостров — самый большой полуостров мира по площади.", "The Arabian Peninsula is the largest peninsula in the world by area."),
   ("Индокитай — самый большой полуостров мира по площади.", "Indochina is the largest peninsula in the world by area."),
   "criterion: area (about 3 million km²); «by area» added", True)
RC("borneo-largest-island-asia", "as-borneo", 1, ("Самый большой остров Азии", "The largest island in Asia"),
   ("Калимантан — самый большой остров Азии.", "Borneo is the largest island in Asia."),
   ("Сахалин — самый большой остров Азии.", "Sakhalin is the largest island in Asia."),
   "criterion: area (about 743,000 km²); New Guinea is larger but belongs to Oceania")
RC("chelyuskin-northernmost", "as-taimyr", 1, ("Полуостров, на котором лежит самая северная точка материка Евразия", "The peninsula with the northernmost point of mainland Eurasia"),
   ("Мыс Челюскин на Таймыре — самая северная точка материка Евразия.", "Cape Chelyuskin on the Taimyr Peninsula is the northernmost point of mainland Eurasia."),
   ("Самая северная точка материка Евразия лежит на Чукотке.", "The northernmost point of mainland Eurasia is on the Chukchi Peninsula."),
   "criterion: mainland only (islands not counted); 77°43′ N")
RC("yangtze-longest-asia", "as-yangtze", 2, ("Самая длинная река Азии", "The longest river in Asia"),
   ("Янцзы — самая длинная река Азии, около 6300 км.", "The Yangtze is the longest river in Asia, about 6,300 km."),
   ("Хуанхэ — самая длинная река Азии.", "The Huang He is the longest river in Asia."),
   "criterion: length; Huang He about 5,460 km")
RC("irtysh-long-tributary", "as-irtysh", 2, ("Один из самых длинных притоков в мире: больше 4200 км", "One of the longest tributaries in the world, over 4,200 km"),
   ("Иртыш — один из самых длинных притоков в мире: больше 4200 км. Он впадает в Обь.", "The Irtysh is one of the longest tributaries in the world, over 4,200 km. It flows into the Ob."),
   ("Иртыш — приток Енисея.", "The Irtysh is a tributary of the Yenisei."),
   "criterion: length (4,248 km); «one of» kept on purpose; «it flows into the Ob» added", True)
RC("yenisei-most-water-russia", "as-yenisei", 2, ("Самая полноводная река России", "The river of Russia with the largest average flow"),
   ("Енисей — самая полноводная река России: у него самый большой средний расход воды.", "The Yenisei has the largest average flow of any river in Russia."),
   ("Самая полноводная река России — Лена.", "The Lena has the largest average flow of any river in Russia."),
   "criterion: average discharge (about 19,600 m³/s; the Lena about 17,000)")
RC("baikal-deepest-oldest", "as-baikal", 3, ("Самое глубокое озеро мира", "The deepest lake in the world"),
   ("Байкал — самое глубокое озеро мира: 1642 м. Это и одно из самых древних озёр: ему около 25 миллионов лет.",
    "Lake Baikal is the deepest lake in the world: 1,642 m. It is also one of the oldest lakes, about 25 million years old."),
   ("Иссык-Куль — самое глубокое озеро мира.", "Issyk-Kul is the deepest lake in the world."),
   "«the oldest» → «one of the oldest»: the age of the oldest lakes is estimated differently", True)
RC("dead-sea-lowest-land", "as-dead-sea", 3, ("Самое низкое место на суше", "The lowest place on land"),
   ("Берег Мёртвого моря — самое низкое место на суше: больше 430 м ниже уровня океана, и уровень продолжает понижаться.",
    "The shore of the Dead Sea is the lowest place on land: more than 430 m below the level of the ocean, and the level keeps falling."),
   ("Самое низкое место на суше — берег Каспийского моря.", "The lowest place on land is the shore of the Caspian Sea."),
   "«about 430 m» → «more than 430 m, and falling»: the level drops about 1 m a year (about −438 m in 2023)", True)
RC("caspian-largest-lake", "as-caspian", 3, ("Самое большое озеро мира по площади", "The largest lake in the world by area"),
   ("Каспийское море — самое большое озеро мира по площади.", "The Caspian Sea is the largest lake in the world by area."),
   ("Балхаш — самое большое озеро мира по площади.", "Lake Balkhash is the largest lake in the world by area."),
   "criterion: area (about 371,000 km²); «by area» added", True)
RC("tibet-highest-plateau", "as-tibet", 4, ("Самое высокое и самое большое нагорье мира", "The highest and the largest plateau in the world"),
   ("Тибетское нагорье — самое высокое и самое большое нагорье мира: его средняя высота больше 4000 м.", "The Tibetan Plateau is the highest and the largest plateau in the world: its average height is over 4,000 m."),
   ("Средняя высота Тибетского нагорья — около 1000 м.", "The average height of the Tibetan Plateau is about 1,000 m."),
   "criteria: average height and area (about 2.5 million km²)")
RC("himalaya-karakoram-eight-thousanders", "as-karakoram", 4, ("Горы, где стоят четыре из четырнадцати вершин Земли выше 8000 м", "The mountains with four of the fourteen peaks on Earth higher than 8,000 m"),
   ("Все 14 вершин Земли выше 8000 м стоят в Гималаях и Каракоруме: обычно десять относят к Гималаям, а четыре — к Каракоруму.",
    "All 14 peaks on Earth higher than 8,000 m are in the Himalayas and the Karakoram: ten are usually counted in the Himalayas and four in the Karakoram."),
   ("Вершины выше 8000 м есть на Памире.", "There are peaks higher than 8,000 m in the Pamirs."),
   "the split 10/4 is the usual one («usually» kept); the highest peak of the Pamirs is about 7,500 m")
RC("klyuchevskaya-highest-active-volcano", "as-klyuchevskaya", 4, ("Самый высокий действующий вулкан Евразии", "The highest active volcano in Eurasia"),
   ("Ключевская Сопка — самый высокий действующий вулкан Евразии: около 4750 м, после извержений высота меняется.",
    "Klyuchevskaya Sopka is the highest active volcano in Eurasia: about 4,750 m, and its height changes after eruptions."),
   ("Самый высокий действующий вулкан Евразии — Фудзи.", "The highest active volcano in Eurasia is Mount Fuji."),
   "criterion: height of an active volcano; Fuji 3,776 m")
RC("krakatoa-loudest-sound", "as-krakatoa", 4, ("Вулкан, грохот извержения которого в 1883 году слышали за 4800 км", "The volcano whose 1883 eruption was heard 4,800 km away"),
   ("Грохот извержения Кракатау в 1883 году слышали за 4800 км — это один из самых громких звуков в истории.",
    "The blast of the 1883 eruption of Krakatoa was heard 4,800 km away, one of the loudest sounds in history."),
   ("Грохот извержения Кракатау в 1883 году слышали только на соседних островах.", "The blast of Krakatoa in 1883 was heard only on the nearby islands."),
   "«one of» kept: loudness of historical sounds cannot be compared exactly")
RC("rub-al-khali-largest-sand-sea", "as-rub-al-khali", 5, ("Крупнейший сплошной массив песков на Земле", "The largest continuous body of sand on Earth"),
   ("Руб-эль-Хали — крупнейший сплошной массив песков на Земле: больше 600 000 км² почти сплошных дюн.",
    "The Rub’ al Khali is the largest continuous body of sand on Earth: more than 600,000 km² of almost unbroken dunes."),
   ("Крупнейший сплошной массив песков на Земле — пустыня Гоби.", "The largest continuous body of sand on Earth is the Gobi Desert."),
   "criterion: continuous sand area (sand sea), not desert area; the Gobi is mostly stony")
RC("lut-hottest-surface", "as-lut", 5, ("Пустыня, где спутники зафиксировали одну из самых высоких температур поверхности на Земле", "The desert where satellites recorded one of the highest surface temperatures on Earth"),
   ("Спутники зафиксировали в пустыне Деште-Лут температуру поверхности земли около 80 °C — одну из самых высоких на планете.",
    "Satellites have recorded land surface temperatures of about 80°C in the Dasht-e Lut, one of the highest on Earth."),
   ("Деште-Лут — самая холодная пустыня Азии.", "The Dasht-e Lut is the coldest desert in Asia."),
   "«above 80°C» → «about 80°C»: 70.7°C (MODIS, 2005) and 80.8°C (one study, 2018); surface, not air temperature", True)
RC("thar-most-populated-desert", "as-thar", 5, ("Пустыня, которую считают самой густонаселённой в мире", "The desert considered the most densely populated in the world"),
   ("Тар считается самой густонаселённой пустыней мира.", "The Thar is considered the most densely populated desert in the world."),
   ("Самой густонаселённой пустыней мира считают Руб-эль-Хали.", "The Rub’ al Khali is considered the most densely populated desert in the world."),
   "«considered» kept: population density depends on where the desert's edge is drawn")
RC("indonesia-largest-island-country", "cty-indonesia", 6, ("Самое большое островное государство мира по площади", "The largest island country in the world by area"),
   ("Индонезия — самое большое островное государство мира по площади: около 17 тысяч островов.", "Indonesia is the largest island country in the world by area, with about 17,000 islands."),
   ("Самое большое островное государство мира — Япония.", "The largest island country in the world is Japan."),
   "criterion: area (about 1.9 million km²); «by area» added; the count of islands varies, «about» kept", True)
RC("ulaanbaatar-coldest-capital", "cty-mongolia", 6, ("Страна, столицу которой считают самой холодной в мире", "The country whose capital is considered the coldest in the world"),
   ("Улан-Батор считается самой холодной столицей мира по среднегодовой температуре.", "Ulaanbaatar is widely regarded as the world’s coldest national capital by average annual temperature."),
   ("Самой холодной столицей мира считают Пекин.", "Beijing is considered the coldest capital in the world."),
   "criterion: average annual temperature; «considered» kept (Astana is close)")
RC("great-wall-longest-fortification", "cty-china", 6, ("Страна, где стоит самая протяжённая система оборонительных укреплений в мире", "The country with the world’s longest system of defensive fortifications"),
   ("Великая Китайская стена — самая протяжённая система оборонительных укреплений в мире. Её общая длина превышает 20 тысяч километров.",
    "The Great Wall of China is the world’s longest system of defensive fortifications, stretching over 20,000 kilometres in total."),
   ("Великая Китайская стена — одна непрерывная стена длиной около 1000 км.", "The Great Wall of China is one unbroken wall about 1,000 km long."),
   "criterion: total length of all its parts (21,196 km, survey of 2012)")
RC("kazakhstan-largest-landlocked", "cty-kazakhstan", 7, ("Самая большая страна мира без выхода к Мировому океану", "The largest landlocked country in the world"),
   ("Казахстан — самая большая в мире страна без выхода к Мировому океану: более 2,7 млн км².", "Kazakhstan is the largest landlocked country in the world, with more than 2.7 million km²."),
   ("Самая большая страна мира без выхода к Мировому океану — Монголия.", "The largest landlocked country in the world is Mongolia."),
   "criterion: area; the Caspian is a lake, so its shore is not a way to the ocean")
RC("maldives-lowest-country", "cty-maldives", 7, ("Самая низменная страна мира", "The lowest-lying country in the world"),
   ("Мальдивы — самая низменная страна мира: в среднем острова поднимаются над морем всего примерно на полтора метра.",
    "The Maldives are the lowest-lying country in the world: on average the islands rise only about 1.5 m above the sea."),
   ("Самая низменная страна мира — Бангладеш.", "The lowest-lying country in the world is Bangladesh."),
   "criterion changed to average height (about 1.5 m): the highest point is given as 2.4 m traditionally but higher by newer surveys", True)
RC("uzbekistan-doubly-landlocked", "cty-uzbekistan", 7, ("Страна, все соседи которой тоже не имеют выхода к Мировому океану", "The country whose neighbours are all landlocked too"),
   ("Узбекистан — одна из двух стран мира, все соседи которых тоже не имеют выхода к Мировому океану. Вторая такая страна — Лихтенштейн.",
    "Uzbekistan is one of only two countries whose neighbours are all landlocked too. The other is Liechtenstein."),
   ("Все соседи Казахстана тоже не имеют выхода к Мировому океану.", "All the neighbours of Kazakhstan are landlocked too."),
   "criterion: doubly landlocked; the Caspian counts as a lake (Kazakhstan and Turkmenistan have no way to the ocean)", True)
RC("baku-lowest-capital", "cty-azerbaijan", 8, ("Страна, столица которой — самая низко расположенная столица мира", "The country with the lowest-lying capital in the world"),
   ("Баку — самая низко расположенная столица мира: около 28 м ниже уровня океана.", "Baku is the lowest-lying capital in the world, about 28 m below sea level."),
   ("Баку стоит выше 1000 м над уровнем моря.", "Baku stands more than 1,000 m above sea level."),
   "criterion: height of the capital above sea level (−28 m)")
RC("saudi-arabia-largest-without-rivers", "cty-saudi-arabia", 8, ("Самая большая страна мира без постоянных рек", "The largest country in the world without permanent rivers"),
   ("Саудовская Аравия — самая большая страна мира без естественных постоянных рек: более 2 млн км².", "Saudi Arabia is the largest country in the world without natural permanent rivers, with more than 2 million km²."),
   ("Через Саудовскую Аравию течёт Евфрат.", "The Euphrates flows through Saudi Arabia."),
   "criterion: area among countries with no natural permanent river (only seasonal wadis)")
RC("bahrain-smallest-west-asia", "cty-bahrain", 8, ("Самая маленькая страна Западной Азии по площади", "The smallest country of West Asia by area"),
   ("Бахрейн — самая маленькая страна Западной Азии по площади: около 790 км².", "Bahrain is the smallest country of West Asia by area, about 790 km²."),
   ("Самая маленькая страна Западной Азии — Катар.", "The smallest country of West Asia is Qatar."),
   "criterion: area; «by area» added; the area grows a little with land reclamation", True)

rv_path, dict_path, ch_path = "data/review/b3-block.json", "data/dictionary/b3-block.json", "data/challenge/b3-block.json"
old = load(rv_path, {})
review = {
    "block": "asia-3", "unit": "block-review", "status": "draft",
    "rules": {
        "noNewObjects": "only the 138 places of block 3 sections 1-8 (and the Arabian Sea and the Bay of Bengal of block 1 as river mouths); each task opens the map the place was taught on (section 1: Asia base map; rivers, lakes, mountains, deserts maps; countries and capitals on the countries map)",
        "lesson": "about 10 tasks, 3-5 minutes; places are spread over the sections of the lesson",
        "adaptive": "no mistakes yet: the places asked longest ago (or never) come first, taken in turn from each section; a few mistakes: up to 60% of the places are the child's weakest, the rest as with no mistakes; repeated mistakes: a wrong answer comes back once at the end of the lesson, and a second mistake shows the answer and moves on (the place stays weak for the next lesson); a place is asked at most once per lesson (a country and its capital count as one place), and a weak place's weight is capped at 3 so one place never fills a lesson",
        "neutral": "no capital questions about Taiwan, Israel or Palestine (their cards keep the approved notes); Kashmir, Northern Cyprus, Abkhazia and South Ossetia are never an answer in a «tap all…» task; Russia is not a country of the course, so no relation ties a place to Russia",
        "mouths": "a river is tied only to a water body the child has learned: no Andaman Sea (Irrawaddy, Salween), East China Sea (Yangtze), Bohai (Huang He) or Gulf of Thailand (Chao Phraya); the Amu Darya and the Syr Darya carry the Aral Sea note",
        "crosses": "river → country pairs use «through» only; «along» (a border stretch) is never a pair and never a wrong answer",
        "approval": "each relation, true/false pair, select-all task, trap and record: approval.contentSha256 = first 16 hex of sha256 over the item without its approval (tools/approve.mjs); an item shows only when approved",
    },
    "lessons": [
        {"id": "lesson-1-map-rivers", "title": T("Азия на карте и реки", "Asia on the map and rivers"), "objects": ["section-1", "rivers"],
         "tasks": [{"type": "find-on-map", "count": 4}, {"type": "what-is-it", "count": 3}, {"type": "label-map", "count": 1, "labels": 4}, {"type": "write-name", "count": 2}]},
        {"id": "lesson-2-lakes-mountains-deserts", "title": T("Озёра, горы и пустыни", "Lakes, mountains and deserts"), "objects": ["lakes", "mountains", "deserts"],
         "tasks": [{"type": "find-on-map", "count": 4}, {"type": "what-is-it", "count": 3}, {"type": "label-map", "count": 1, "labels": 4}, {"type": "write-name", "count": 2}]},
        {"id": "lesson-3-countries", "title": T("Страны и столицы", "Countries and capitals"), "objects": ["countries-east", "countries-south-central", "countries-west"],
         "tasks": [{"type": "find-country", "count": 3}, {"type": "find-capital", "count": 2}, {"type": "which-country", "count": 2}, {"type": "pairs-country-capital", "count": 1}, {"type": "write-capital", "count": 2}]},
        {"id": "lesson-4-relations", "title": T("Связи", "Connections"), "objects": ["relations"],
         "tasks": [{"type": "pairs", "count": 4, "kinds": ["flowsInto", "capitalOn", "crosses", "inCountry"]}, {"type": "select-all", "count": 3}, {"type": "true-false", "count": 2}, {"type": "trap", "count": 1}]},
        {"id": "lesson-5-records", "title": T("Рекорды", "Records"), "objects": ["records"],
         "tasks": [{"type": "true-false", "count": 4}, {"type": "pairs", "count": 2}, {"type": "find-by-record", "count": 2}, {"type": "what-is-it-by-record", "count": 2}],
         "note": "25 records: 4 + 2x3 + 2 + 2 = 14 different records per lesson"},
        {"id": "block-final", "title": T("Итог блока", "Block final"), "geowords": ["b3-block-final-en", "b3-block-final-ru"], "reward": "passport stamp"},
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
    oldd = {"block": "asia-3", "status": "draft", "rules": {
        "structure": "one block-final word per language for the block 3 «Asia» review; Challenge GeoWords reuse the approved review words of block 3 sections 1-8",
        "approval": "approval.contentSha256 = first 16 hex of sha256 over {answer, definition}",
        "definitions": "a definition never contains its answer word, nor a word of the same root (no «много», «образ», «diverse»)"},
        "units": [{"id": "block-final", "title": T("Итог блока", "Block final"), "words": {
            "en": [w("DIVERSITY", "A great variety of things that are not alike, side by side: landscapes, peoples, languages and customs. Asia is a striking example, from taiga and rainforest to deserts and the highest mountains on Earth.")],
            "ru": [w("МНОГООБРАЗИЕ", "Огромное число разных, непохожих друг на друга видов, форм и явлений рядом: природных зон, народов, языков, обычаев. Азия — яркий пример: тайга и тропические леса, пустыни и высочайшие горы Земли.")]}}]}
    json.dump(oldd, open(dict_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1); open(dict_path, "a").write("\n")

oldc = load(ch_path, {})
if oldc.get("status") != "approved":
    E_, M_, H_ = "easy", "medium", "hard"
    tiers = {
        "countries": {
            E_: ["cty-china", "cty-mongolia", "cty-japan", "cty-vietnam", "cty-thailand", "cty-myanmar", "cty-malaysia", "cty-indonesia", "cty-philippines",
                 "cty-india", "cty-pakistan", "cty-afghanistan", "cty-kazakhstan", "cty-uzbekistan", "cty-turkmenistan", "cty-iran", "cty-turkey", "cty-iraq",
                 "cty-saudi-arabia", "cty-oman", "cty-yemen"],
            M_: ["cty-north-korea", "cty-south-korea", "cty-laos", "cty-cambodia", "cty-bangladesh", "cty-sri-lanka", "cty-nepal", "cty-kyrgyzstan",
                 "cty-tajikistan", "cty-syria", "cty-jordan", "cty-azerbaijan", "cty-georgia", "cty-uae"],
            H_: ["cty-taiwan", "cty-singapore", "cty-brunei", "cty-timor-leste", "cty-maldives", "cty-bhutan", "cty-armenia", "cty-cyprus", "cty-lebanon",
                 "cty-israel", "cty-palestine", "cty-kuwait", "cty-bahrain", "cty-qatar"]},
        "rivers": {
            E_: ["as-yangtze", "as-huang-he", "as-ob", "as-yenisei", "as-lena", "as-amur", "as-mekong", "as-ganges", "as-indus", "as-tigris", "as-euphrates"],
            M_: ["as-irtysh", "as-kolyma", "as-brahmaputra", "as-amu-darya", "as-syr-darya", "as-irrawaddy"],
            H_: ["as-chao-phraya", "as-salween", "as-godavari", "as-jordan", "as-ili", "as-tarim"]}}
    pool = {"countries": [i for t in (E_, M_, H_) for i in tiers["countries"][t]], "rivers": [i for t in (E_, M_, H_) for i in tiers["rivers"][t]]}
    ch = {"block": "asia-3", "status": "draft",
          "challenge": {"parts": ["speed-hunt", "geowords"],
                        "geowords": "three app-generated words per round from the approved review words of block 3 sections 1-8, three words from three different sections; letters on the countries map of Asia with its rivers"},
          "speedHunt": {
              "durationSeconds": 60, "map": "./assets/asia-countries.webp",
              "prompt": {"en": "Find:", "ru": "Найди:", "object": "the country or river name as on the cards; no capitals, records or facts"},
              "order": "difficulty alternates easy, medium, easy, hard… (random inside a tier, no object repeats within a round); after a tier runs out the others go on in turn",
              "difficulty": tiers,
              "correct": "+1 and the next object at once",
              "wrong": "the right place lights up for 0.5 s; no penalty except time; the object goes into the weak list",
              "skip": "allowed",
              "hit": "a river counts within 8 CSS px of its drawn line; a country counts inside its outline or within 22 CSS px of it; the small countries (the hard tier) within 36 CSS px — an enlarged tap area that lies only over the sea, never over a neighbour: a tap inside another country's outline answers that country (only a tap within 2 px of the asked country's own border line still counts for it), and the nearest object of the pool wins, so two enlarged areas never overlap",
              "excluded": {"ids": [], "why": "mountains, lakes, deserts and section-1 places are on other maps (no time to switch maps in 60 s); no capitals: their dots are too small on the map of Asia for a timed game"},
              "score": "objects found in the round + personal best",
              "stars": {"thresholds": [10, 15, 20], "provisional": True, "note": "the same as Europe; tune after testing with children"},
              "pool": pool, "poolSize": len(pool["countries"]) + len(pool["rivers"])},
          "geowords": {
              "words": "approved review words (role review) of data/dictionary/b3-section-1..8.json, each word once; three different sections per round; recently played words last",
              "places": "the whole countries map of Asia: the 49 countries (a letter in the main part of the country, its circle wholly inside the border; on the whole map of Asia only the largest countries can hold the circle, the others take no letter), the 23 rivers («on the Mekong») and a river inside a country it crosses («on the Mekong in Cambodia»), the four lakes drawn on the map (Caspian, Aral, Balkhash, Issyk-Kul) and the section-1 objects (not the Arctic Ocean, Chukotka or the Bering Strait); at least a third of the letters on rivers, then the lakes, seas, islands, peninsulas and countries first, so a word is never rivers only; a country named once; spacing 10% of map width (at 9 two letters' tap areas can overlap on the whole map)",
              "fallback": "a word that cannot be laid out is replaced by the next word of another section"}}
    json.dump(ch, open(ch_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1); open(ch_path, "a").write("\n")
print("relations", len(rel), "tf", len(tf), "selectAll", len(SEL), "traps", len(TRAPS), "records", len(REC))
