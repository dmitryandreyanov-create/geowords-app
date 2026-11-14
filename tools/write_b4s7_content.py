#!/usr/bin/env python3
"""Writes the approved texts of block 4 section 7 «Countries of the Caribbean islands» (doc https://claude.ai/artifact/UvTLiLUDpJE8FQWAqszTJD,
«Утверждаю» Svetlana 14.11.2026 03:40 UTC, rev 33): data/content/b4-section-7-facts.json, b4-section-7-records.json, data/dictionary/b4-section-7.json.
Approval hashes are added by: node tools/approve.mjs <file> 2026-11-14
"""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
DOC = 'https://claude.ai/artifact/UvTLiLUDpJE8FQWAqszTJD'
SRC = {'doc': DOC, 'note': 'block 4 section 7 plan, approved by Svetlana 14.11.2026 («Утверждаю», rev 33)'}
UNITS = [{'n': 1, 'title': {'ru': 'Куба, Ямайка, Багамы', 'en': 'Cuba, Jamaica and the Bahamas'}},
         {'n': 2, 'title': {'ru': 'Остров Гаити и север Малых Антил', 'en': 'Hispaniola and the northern Lesser Antilles'}},
         {'n': 3, 'title': {'ru': 'Юг Малых Антил', 'en': 'The southern Lesser Antilles'}}]
# id, unit, RU, EN, capital RU, EN, fact RU, EN
C = [
 ('cty-cuba', 1, 'Куба', 'Cuba', 'Гавана', 'Havana',
  'Куба — крупнейший остров Карибского бассейна, площадью около 104 тыс. км². Исторический центр Гаваны и её укрепления включены в список Всемирного наследия ЮНЕСКО.',
  'Cuba is the largest island in the Caribbean, covering about 104,000 km². Old Havana and its fortifications are a UNESCO World Heritage Site.'),
 ('cty-bahamas', 1, 'Багамы', 'The Bahamas', 'Нассау', 'Nassau',
  'Багамы — это около 700 островов и более 2000 рифов и отмелей в Атлантическом океане. Именно здесь, на острове Сан-Сальвадор, в 1492 году высадился Колумб.',
  'The Bahamas are about 700 islands and more than 2,000 cays in the Atlantic Ocean. Columbus first landed here, on San Salvador, in 1492.'),
 ('cty-jamaica', 1, 'Ямайка', 'Jamaica', 'Кингстон', 'Kingston',
  'Имя Ямайки пришло из языка коренных жителей и значит «земля лесов и вод». На склонах её Голубых гор (до 2256 м) растёт один из самых известных сортов кофе.',
  "Jamaica's name comes from the language of its first people and means “land of wood and water”. One of the world's best-known coffees grows on the slopes of its Blue Mountains (up to 2,256 m)."),
 ('cty-haiti', 2, 'Гаити', 'Haiti', 'Порт-о-Пренс', 'Port-au-Prince',
  'Гаити занимает западную треть острова Гаити. В 1804 году, после восстания рабов, она стала первой независимой страной Латинской Америки.',
  'Haiti covers the western third of the island of Hispaniola. In 1804, after a revolt of the enslaved, it became the first independent country of Latin America.'),
 ('cty-dominican-republic', 2, 'Доминиканская Республика', 'Dominican Republic', 'Санто-Доминго', 'Santo Domingo',
  'Санто-Доминго был основан испанцами в 1496 году и перенесён на нынешнее место в 1502 году. Его исторический центр — один из старейших сохранившихся европейских колониальных городских центров Америки.',
  'Santo Domingo was founded by the Spanish in 1496 and moved to its present site in 1502. Its historic centre is one of the oldest surviving European colonial urban centres in the Americas.'),
 ('cty-saint-kitts-and-nevis', 2, 'Сент-Китс и Невис', 'Saint Kitts and Nevis', 'Бастер', 'Basseterre',
  'Самая маленькая страна Америки: два вулканических острова общей площадью около 260 км². На Невисе родился Александр Гамильтон, один из отцов-основателей США.',
  'The smallest country of the Americas: two volcanic islands with about 260 km² in all. Alexander Hamilton, one of the founding fathers of the United States, was born on Nevis.'),
 ('cty-antigua-and-barbuda', 2, 'Антигуа и Барбуда', 'Antigua and Barbuda', 'Сент-Джонс', "Saint John's",
  'На Барбуде, в лагуне Кодрингтон, гнездится одна из крупнейших в мире колоний фрегатов — морских птиц, у самцов которых раздувается красный горловой мешок.',
  'Codrington Lagoon on Barbuda has one of the largest colonies of frigatebirds in the world; the males puff up a red throat pouch.'),
 ('cty-dominica', 2, 'Доминика', 'Dominica', 'Розо', 'Roseau',
  'Доминику зовут «Островом природы»: она покрыта горами и дождевым лесом. Здесь есть Кипящее озеро — одно из самых больших горячих озёр мира, вода в нём бурлит от тепла магмы.',
  'Dominica is called the Nature Island: it is covered in mountains and rainforest. Its Boiling Lake is one of the largest hot lakes in the world, its water bubbling from the heat of magma.'),
 ('cty-saint-lucia', 3, 'Сент-Люсия', 'Saint Lucia', 'Кастри', 'Castries',
  'На Сент-Люсии живёт меньше 200 тыс. человек, но у неё два нобелевских лауреата: экономист Артур Льюис (1979) и поэт Дерек Уолкотт (1992).',
  'Saint Lucia has fewer than 200,000 people but two Nobel laureates: the economist Arthur Lewis (1979) and the poet Derek Walcott (1992).'),
 ('cty-saint-vincent', 3, 'Сент-Винсент и Гренадины', 'Saint Vincent and the Grenadines', 'Кингстаун', 'Kingstown',
  'Ботанический сад Кингстауна (1765) — самый старый в Западном полушарии. В 1793 году капитан Блай привёз сюда с Таити саженцы хлебного дерева.',
  'The botanic garden of Kingstown (1765) is the oldest in the Western Hemisphere. In 1793 Captain Bligh brought breadfruit seedlings here from Tahiti.'),
 ('cty-grenada', 3, 'Гренада', 'Grenada', 'Сент-Джорджес', "Saint George's",
  'У берегов Гренады в 2006 году открылся один из первых в мире подводных парков скульптур: фигуры людей на дне постепенно зарастают кораллами.',
  "In 2006 one of the world's first underwater sculpture parks opened off Grenada: human figures on the seabed are slowly overgrown by coral."),
 ('cty-barbados', 3, 'Барбадос', 'Barbados', 'Бриджтаун', 'Bridgetown',
  'Барбадос расположен восточнее основной дуги Малых Антильских островов. В отличие от многих соседних островов вулканического происхождения, значительная часть его поверхности сложена коралловыми известняками.',
  'Barbados lies east of the main arc of the Lesser Antilles. Unlike many neighbouring islands of volcanic origin, much of its surface consists of coral limestone.'),
 ('cty-trinidad-and-tobago', 3, 'Тринидад и Тобаго', 'Trinidad and Tobago', 'Порт-оф-Спейн', 'Port of Spain',
  'Тринидад лежит всего в 11 км от берега Венесуэлы. В болоте Карони на закате слетаются на ночёвку тысячи алых ибисов — одной из двух национальных птиц страны.',
  "Trinidad lies only 11 km from the coast of Venezuela. At sunset thousands of scarlet ibises, one of the country's two national birds, fly in to roost in the Caroni Swamp."),
]
items = [{'id': c[0], 'order': i, 'kind': 'country', 'unit': c[1], 'name': {'en': c[3], 'ru': c[2]}, 'capital': {'en': c[5], 'ru': c[4]},
          'fact': {'ru': c[6], 'en': c[7]}, 'source': SRC, 'disputed': False} for i, c in enumerate(C, 1)]
facts = {'section': 'countries-of-the-caribbean-islands', 'block': 4,
  'use': 'introduction cards, one fact per country and its capital; ids match data/maps/namerica-caribbean.json',
  'decisions': [
   'Svetlana 13.11.2026 22:43 («Согласна») and 14.11.2026 03:40 («Утверждаю», doc rev 33): the 13 independent island states of the Caribbean with capitals in three units — Cuba, Jamaica and the Bahamas / Hispaniola and the northern Lesser Antilles / the southern Lesser Antilles.',
   'The islands are small on the North America maps, so the section has a large map of the Caribbean of its own (data/maps/namerica-caribbean.json), with a magnifier of the Lesser Antilles (data/maps/namerica-lesser-antilles.json). Dependencies of other countries (Puerto Rico, Guadeloupe, Martinique…) are pale and never asked.',
   'Dominica and the Dominican Republic are different countries; the Dominica card says so.'],
  'approvalRule': 'approval.contentSha256 = first 16 hex of sha256 over {id, name, fact, caveat, disputed} (JSON, sorted keys, UTF-8). If any of these change, the approval no longer matches and the card must be re-approved before it is shown.',
  'units': UNITS, 'items': items}
R = [
 ('cuba-largest', 'cty-cuba', 'Куба — крупнейший остров Карибского бассейна.', 'Cuba is the largest island in the Caribbean region.', {'value': 104000, 'unit': 'km2'}),
 ('pico-duarte', 'cty-dominican-republic', 'Пико-Дуарте (3098 м) в Доминиканской Республике — высочайшая вершина островов Карибского бассейна.', 'Pico Duarte (3,098 m) in the Dominican Republic is the highest peak of the Caribbean islands.', {'value': 3098, 'unit': 'm'}),
 ('saint-kitts-smallest', 'cty-saint-kitts-and-nevis', 'Сент-Китс и Невис — самая маленькая страна Америки и по площади, и по населению.', 'Saint Kitts and Nevis is the smallest country of the Americas both in area and in population.', {'value': 261, 'unit': 'km2'}),
 ('pitch-lake', 'cty-trinidad-and-tobago', 'На Тринидаде лежит Асфальтовое озеро (Питч-Лейк) — крупнейшее в мире природное скопление асфальта.', 'Pitch Lake on Trinidad is the largest natural deposit of asphalt in the world.', None),
]
nm = {c[0]: {'en': c[3], 'ru': c[2]} for c in C}
recs = []
for i, (rid, obj, ru, en, fig) in enumerate(R, 1):
    r = {'id': rid, 'order': i, 'object': obj, 'kind': 'record', 'unit': 3, 'name': nm[obj], 'fact': {'ru': ru, 'en': en}}
    if fig: r['figure'] = fig
    r.update({'source': SRC, 'disputed': False, 'category': 'stable'})
    recs.append(r)
records = {'section': 'countries-of-the-caribbean-islands', 'block': 4,
  'use': 'unit 3 records: record cards and «find it» tasks', 'approvalRule': facts['approvalRule'], 'items': recs}
# words: (answer RU, def RU, answer EN, def EN, role, note RU, note EN, display EN)
W = {
 'unit-1-cuba-jamaica-bahamas': [
  ('РАСТАФАРИ', 'Религиозное движение, возникшее на Ямайке в 1930-х годах; его последователи почитают эфиопского императора Хайле Селассие I и часто носят дреды.', 'RASTAFARI', 'A religious movement that arose in Jamaica in the 1930s; its followers revere the Ethiopian Emperor Haile Selassie I and often wear dreadlocks.', 'final'),
  ('ЛУКАЙЦЫ', 'Коренной аравакоязычный народ Багамских островов, родственный таино. С представителями этого народа встретился Колумб во время своего первого путешествия в 1492 году.', 'LUCAYANS', 'An Arawakan-speaking Indigenous people of the Bahamas, closely related to the Taíno. Columbus encountered them during his first voyage in 1492.', 'review'),
  ('ДЖАНКАНУ', 'Уличное шествие Багам в костюмах из цветной бумаги, с барабанами, колокольчиками и свистками; проходит 26 декабря и 1 января.', 'JUNKANOO', 'A street parade of the Bahamas with costumes of coloured paper, goatskin drums, cowbells and whistles, held on 26 December and 1 January.', 'review'),
  ('МАРОНЫ', 'Беглые рабы и их потомки, создавшие свободные общины в горах Ямайки; в 1739 году британцы признали их свободу договором.', 'MAROONS', 'Escaped enslaved Africans and their descendants who built free communities in the mountains of Jamaica; in 1739 the British recognised their freedom by treaty.', 'review'),
  ('РЕГГЕЙ', 'Музыкальный стиль, родившийся на Ямайке в конце 1960-х годов; самый известный исполнитель — Боб Марли. С 2018 года в списке нематериального наследия ЮНЕСКО.', 'REGGAE', 'A music style born in Jamaica in the late 1960s; its best-known performer is Bob Marley. On UNESCO\'s intangible heritage list since 2018.', 'review'),
  ('САНТЕРИЯ', 'Кубинская религия, соединившая верования народа йоруба из Западной Африки с почитанием католических святых.', 'SANTERIA', 'A Cuban religion that blends the beliefs of the Yoruba people of West Africa with the worship of Catholic saints.', 'review', None, None, 'SANTERÍA'),
  ('ГУАЯБЕРА', 'Лёгкая мужская рубашка навыпуск с четырьмя карманами и вертикальными складками, традиционная одежда Кубы.', 'GUAYABERA', "A light men's shirt worn untucked, with four pockets and vertical pleats, a traditional garment of Cuba.", 'review'),
  ('ТАИНО', 'Коренной народ Больших Антильских островов, говоривший на аравакском языке. Через испанский язык в европейские языки вошли слова «гамак», «ураган» и «барбекю».', 'TAINO', 'An Arawakan-speaking Indigenous people of the Greater Antilles. Words such as hammock, hurricane and barbecue entered European languages through Spanish.', 'review', None, None, 'TAÍNO'),
 ],
 'unit-2-hispaniola-northern-lesser-antilles': [
  ('СУДОВЕРФЬ', 'Место, где строят и чинят корабли. Британская военно-морская база XVIII века в гавани Инглиш-Харбор на Антигуа, где в 1784–1787 годах служил молодой Горацио Нельсон, включена в список Всемирного наследия ЮНЕСКО.', 'DOCKYARD', 'A place where ships are built and repaired. The 18th-century British naval base at English Harbour, Antigua, where young Horatio Nelson served in 1784–87, is a UNESCO World Heritage Site.', 'final', 'Верфь Нельсона на Антигуа.', "Nelson's Dockyard on Antigua."),
  ('КРЕОЛЬСКИЙ', 'Один из двух официальных языков Гаити. Сформировался на французской лексической основе под влиянием западноафриканских языков.', 'CREOLE', 'One of Haiti’s two official languages, developed primarily from French vocabulary with influences from West African languages.', 'review', 'Гаитянский креольский язык.', 'Haitian Creole.'),
  ('ЦИТАДЕЛЬ', 'Огромная крепость на вершине горы на севере Гаити, построенная после обретения независимости для защиты от возвращения французов; объект ЮНЕСКО.', 'CITADELLE', 'A huge mountaintop fortress in northern Haiti, built after independence to defend the country against a French return; a UNESCO site.', 'review', 'Цитадель Лаферьер.', 'Citadelle Laferrière.'),
  ('МЕРЕНГЕ', 'Быстрый парный танец и музыка Доминиканской Республики; с 2016 года в списке нематериального наследия ЮНЕСКО.', 'MERENGUE', "A fast couple dance and music of the Dominican Republic; on UNESCO's intangible heritage list since 2016.", 'review'),
  ('БАЧАТА', 'Романтичная музыка и танец под гитару, родившиеся в бедных кварталах Доминиканской Республики; с 2019 года в списке ЮНЕСКО.', 'BACHATA', "Romantic guitar music and dance born in the poor neighbourhoods of the Dominican Republic; on UNESCO's list since 2019.", 'review'),
  ('БРИМСТОУН', 'Часть названия исторической британской крепости на острове Сент-Китс, известной как «Гибралтар Вест-Индии». Крепость включена в список Всемирного наследия ЮНЕСКО.', 'BRIMSTONE', 'Part of the name of a historic British fortress on Saint Kitts, known as the Gibraltar of the West Indies and listed as a UNESCO World Heritage Site.', 'review', 'Крепость Бримстоун-Хилл.', 'Brimstone Hill Fortress.'),
  ('КАЛИНАГО', 'Коренной народ Малых Антильских островов (раньше их называли карибами); на Доминике у них есть своя территория площадью около 15 км².', 'KALINAGO', 'The native people of the Lesser Antilles (once called the Island Caribs); on Dominica they have their own territory of about 15 km².', 'review'),
  ('КВАДРИЛЬ', 'Старинный европейский танец для четырёх пар, который на Доминике и Сент-Люсии танцуют в национальных костюмах под местный оркестр.', 'QUADRILLE', 'An old European dance for four couples, danced on Dominica and Saint Lucia in national dress to a local band.', 'review'),
 ],
 'unit-3-southern-lesser-antilles': [
  ('МУСКАТНИК', 'Тропическое дерево, семена которого используют как пряность. Гренада — один из известных производителей этой пряности, она изображена на флаге страны.', 'NUTMEG', 'A spice obtained from the seed of a tropical evergreen tree. Grenada is a major producer, and the spice is depicted on its national flag.', 'final', 'Его семена — мускатный орех.', None),
  ('ПИТОНЫ', 'Собственное географическое название двух крутых вулканических вершин на острове Сент-Люсия. Они входят в объект Всемирного наследия ЮНЕСКО.', 'PITONS', 'The proper name of two steep volcanic peaks on Saint Lucia, protected as part of a UNESCO World Heritage Site.', 'review', 'Гро-Питон и Пти-Питон — горы, а не змеи.', 'Gros Piton and Petit Piton.'),
  ('СУФРИЕР', 'Действующий вулкан на севере острова Сент-Винсент, высшая точка страны (около 1230 м); последнее большое извержение было в 2021 году.', 'SOUFRIERE', "An active volcano in the north of Saint Vincent and the country's highest point (about 1,230 m); its last big eruption was in 2021.", 'review', None, None, 'SOUFRIÈRE'),
  ('МАРАНТА', 'Тропическое растение, из корневищ которого делают тонкий крахмал; долгое время Сент-Винсент был крупнейшим в мире его производителем.', 'ARROWROOT', 'A tropical plant whose rootstocks give a fine starch; for a long time Saint Vincent was its largest producer in the world.', 'review'),
  ('СПАЙСМАС', 'Главный ежегодный праздник Гренады в августе, с костюмами, музыкой и уличными шествиями.', 'SPICEMAS', "Grenada's main yearly festival in August, with costumes, music and street parades.", 'review'),
  ('ГАРНИЗОН', 'Войска, стоявшие в крепости или городе; британский военный городок с фортами и плацем у Бриджтауна — объект ЮНЕСКО, там в 1751 году жил юный Джордж Вашингтон.', 'GARRISON', 'Troops stationed in a fort or town; the British military quarter with forts and a parade ground near Bridgetown is a UNESCO site, and young George Washington stayed there in 1751.', 'review'),
  ('КАЛИПСО', 'Песенный жанр Тринидада с острыми, часто насмешливыми текстами о жизни и политике.', 'CALYPSO', 'A song style of Trinidad with sharp, often mocking lyrics about life and politics.', 'review'),
  ('СТИЛПЭН', 'Музыкальный инструмент из металлической бочки из-под нефти, придуманный на Тринидаде в 1930–1940-х годах; национальный инструмент страны.', 'STEELPAN', "A musical instrument made from an oil drum, invented in Trinidad in the 1930s–40s; the country's national instrument.", 'review'),
 ],
 'section-final': [
  ('КАРНАВАЛ', 'Праздник с костюмированными шествиями и музыкой перед Великим постом; самый большой в Карибском бассейне проходит на Тринидаде.', 'CARNIVAL', 'A festival of costumed parades and music before Lent; the biggest in the Caribbean is held in Trinidad.', 'section-final'),
 ],
}
TITLES = {'unit-1-cuba-jamaica-bahamas': UNITS[0]['title'], 'unit-2-hispaniola-northern-lesser-antilles': UNITS[1]['title'],
          'unit-3-southern-lesser-antilles': UNITS[2]['title'], 'section-final': {'ru': 'Итог раздела', 'en': 'Section final'}}
units = []
for uid, ws in W.items():
    ru, en = [], []
    for w in ws:
        a, d, ae, de, role = w[:5]; nru = w[5] if len(w) > 5 else None; nen = w[6] if len(w) > 6 else None; disp = w[7] if len(w) > 7 else None
        r = {'answer': a, 'role': role, 'definition': d}
        if nru: r['note'] = nru
        e = {'answer': ae, 'role': role, 'definition': de}
        if nen: e['note'] = nen
        if disp: e['display'] = disp
        ru.append(r); en.append(e)
    units.append({'id': uid, 'title': TITLES[uid], 'words': {'ru': ru, 'en': en}})
dictionary = {'section': 'countries-of-the-caribbean-islands', 'block': 4, 'status': 'approved',
  'source': "25 words RU + EN from Svetlana's list (13.11.2026) with agreed replacements: Плантация → Гарнизон/Garrison (Plantation in Asia section 6), Гренадины → Маранта/Arrowroot (part of a country name); EN one-word answers CREOLE, CITADELLE, SOUFRIERE, NUTMEG, DOCKYARD, BRIMSTONE; after her review 14.11.2026: Адмиралтейство → Судоверфь/Dockyard",
  'rules': {'structure': "3 units x (1 final + review words) + section final; practice draws 6 of each unit's review words",
            'languages': 'RU and EN words name the same thing (Svetlana, 13.11.2026); МУСКАТНИК is the tree and NUTMEG the spice from its seed, the definitions say so (Svetlana, 14.11.2026)',
            'length': 'every word at least 6 letters; exception ТАИНО/TAINO (5 letters, Svetlana 13.11.2026)',
            'approval': 'approval.contentSha256 = first 16 hex of sha256 over {answer, definition}',
            'definitions': 'a definition never contains its answer word, nor a word of the same root (Svetlana, 2026-10-24): Gros Piton, nutmeg, Brimstone Hill stand in the note after the answer',
            'notes': 'note: a card shown after the word is solved; not covered by the approval hash',
            'display': 'display: how the word is written on the card after it is solved (Santería, Taíno, Soufrière); the grid keeps plain letters; not covered by the approval hash'},
  'approvedBy': 'Svetlana', 'approvedDate': '2026-11-14', 'units': units}
for path, obj in (('data/content/b4-section-7-facts.json', facts), ('data/content/b4-section-7-records.json', records), ('data/dictionary/b4-section-7.json', dictionary)):
    (ROOT / path).write_text(json.dumps(obj, ensure_ascii=False, indent=1) + '\n'); print('wrote', path)
