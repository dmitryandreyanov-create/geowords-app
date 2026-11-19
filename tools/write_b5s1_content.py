#!/usr/bin/env python3
"""Writes the approved content of block 5 section 1 «South America on the map»: data/content/b5-section-1-facts.json,
data/content/b5-section-1-records.json and data/dictionary/b5-section-1.json (texts approved by Svetlana 19.11.2026 in
https://claude.ai/artifact/J3bJdWxxr2D15UphSdrtsd). Approval hashes are added by tools/approve.mjs."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
DOC = 'https://claude.ai/artifact/J3bJdWxxr2D15UphSdrtsd'
SRC = {'doc': DOC, 'note': 'block 5 section 1 texts, approved 19.11.2026'}
UNITS = [{'n': 1, 'title': {'ru': 'Океаны и крайние точки', 'en': 'Oceans and the farthest points'}},
         {'n': 2, 'title': {'ru': 'Экватор, тропик и острова', 'en': 'The equator, the tropic and islands'}},
         {'n': 3, 'title': {'ru': 'Юг материка', 'en': 'The far south'}}]

F = [  # id, kind, unit, en name, ru name, ru fact, en fact, disputed
 ('samerica-intro', 'intro', 0, 'South America', 'Южная Америка',
  'Южная Америка — четвёртый по площади материк Земли. С Северной Америкой её соединяет узкий Панамский перешеек, а большая часть материка лежит южнее экватора.',
  'South America is the fourth-largest continent on Earth. The narrow Isthmus of Panama joins it to North America, and most of the continent lies south of the equator.', False),
 ('sa-pacific-ocean', 'ocean', 1, 'Pacific Ocean', 'Тихий океан',
  'Тихий океан омывает западный берег материка. Вдоль этого берега от края до края тянутся горы Анды.',
  'The Pacific Ocean washes the west coast of the continent. The Andes mountains run along this whole coast from end to end.', False),
 ('sa-atlantic-ocean', 'ocean', 1, 'Atlantic Ocean', 'Атлантический океан',
  'Атлантический океан омывает материк с востока и севера. В него впадает Амазонка — самая полноводная река мира.',
  'The Atlantic Ocean washes the continent from the east and the north. The Amazon, the river with the most water in the world, flows into it.', False),
 ('sa-caribbean-sea', 'sea', 1, 'Caribbean Sea', 'Карибское море',
  'Карибское море омывает северный берег Южной Америки. Колумб увидел этот материк во время плавания 1498 года и вошёл в залив Пария у берегов нынешней Венесуэлы.',
  'The Caribbean Sea washes the north coast of South America. Columbus saw this continent on his voyage of 1498 and sailed into the Gulf of Paria off the coast of today’s Venezuela.', False),
 ('sa-isthmus-of-panama', 'isthmus', 1, 'Isthmus of Panama', 'Панамский перешеек',
  'Панамский перешеек соединяет Южную и Северную Америку. Материки принято разделять по границе Панамы и Колумбии.',
  'The Isthmus of Panama joins South and North America. The two continents are usually divided at the border of Panama and Colombia.', False),
 ('sa-cape-gallinas', 'cape', 1, 'Punta Gallinas', 'Мыс Гальинас',
  'Мыс Гальинас на полуострове Гуахира — самая северная точка Южной Америки. Вокруг почти пустыня, здесь живёт народ вайюу.',
  'Punta Gallinas on the Guajira Peninsula is the northernmost point of South America. The land around it is almost a desert; the Wayuu people live here.', False),
 ('sa-cabo-branco', 'cape', 1, 'Ponta do Seixas (Cabo Branco)', 'Понта-ду-Сейшас (Кабу-Бранку)',
  'Понта-ду-Сейшас, рядом с мысом Кабу-Бранку в Бразилии, — самая восточная точка материка. Отсюда до Африки около 3000 км — ближе, чем до западного берега самой Южной Америки.',
  'Ponta do Seixas, next to Cabo Branco in Brazil, is the easternmost point of the continent. From here Africa is about 3,000 km away — closer than the west coast of South America itself.', False),
 ('sa-punta-parinas', 'cape', 1, 'Punta Pariñas', 'Мыс Париньяс',
  'Мыс Париньяс в Перу — самая западная точка материка. Рядом с ним ещё в XIX веке начали добывать нефть.',
  'Punta Pariñas in Peru is the westernmost point of the continent. Oil was already being drilled near it in the 19th century.', False),
 ('sa-cape-froward', 'cape', 1, 'Cape Froward', 'Мыс Фроуэрд',
  'Мыс Фроуэрд в Чили — самая южная точка самого материка, без островов. Он стоит на берегу Магелланова пролива.',
  'Cape Froward in Chile is the southernmost point of the mainland itself, without the islands. It stands on the shore of the Strait of Magellan.', False),
 ('sa-equator', 'line', 2, 'Equator', 'Экватор',
  'Экватор пересекает север материка и проходит рядом с устьем Амазонки. Одна страна даже названа в его честь: Эквадор по-испански значит «экватор».',
  'The equator crosses the north of the continent and passes close to the mouth of the Amazon. One country is even named after it: Ecuador is Spanish for “equator”.', False),
 ('sa-tropic-of-capricorn', 'line', 2, 'Tropic of Capricorn', 'Тропик Козерога',
  'Тропик Козерога — самая южная линия, где Солнце бывает прямо над головой. В день декабрьского солнцестояния, 21–22 декабря, Солнце в полдень стоит здесь прямо над головой.',
  'The Tropic of Capricorn is the southernmost line where the Sun can be straight overhead. On the December solstice, 21–22 December, the noon Sun stands right overhead here.', False),
 ('sa-galapagos', 'island', 2, 'Galápagos Islands', 'Галапагосские острова',
  'Галапагосские острова принадлежат Эквадору и лежат примерно в 1000 км от берега. Их назвали по гигантским черепахам («галапаго»), а в 1835 году здесь побывал Чарльз Дарвин.',
  'The Galápagos Islands belong to Ecuador and lie about 1,000 km off the coast. They are named after their giant tortoises (“galápago”), and Charles Darwin visited them in 1835.', False),
 ('sa-falklands', 'island', 2, 'Falkland Islands (Malvinas)', 'Фолклендские (Мальвинские) острова',
  'Фолклендские (Мальвинские) острова лежат в Атлантическом океане восточнее Огненной Земли. Они управляются Великобританией; Аргентина и Великобритания спорят о суверенитете над островами.',
  'The Falkland Islands (Malvinas) lie in the Atlantic Ocean east of Tierra del Fuego. They are administered by the United Kingdom; Argentina and the United Kingdom dispute sovereignty over the islands.', True),
 ('sa-tierra-del-fuego', 'island', 3, 'Tierra del Fuego', 'Огненная Земля',
  'Огненная Земля — архипелаг на юге материка, его делят Чили и Аргентина. В 1520 году Магеллан назвал этот край Землёй Огней, увидев костры на южном берегу пролива.',
  'Tierra del Fuego is an archipelago at the south of the continent, shared by Chile and Argentina. In 1520 Magellan named it the Land of Fires after seeing fires on the southern shore of the strait.', False),
 ('sa-strait-of-magellan', 'strait', 3, 'Strait of Magellan', 'Магелланов пролив',
  'Магелланов пролив отделяет Огненную Землю от материка и соединяет два океана. В 1520 году его первым из европейцев прошёл Фернан Магеллан.',
  'The Strait of Magellan separates Tierra del Fuego from the mainland and links two oceans. In 1520 Ferdinand Magellan was the first European to sail through it.', False),
 ('sa-drake-passage', 'strait', 3, 'Drake Passage', 'Пролив Дрейка',
  'Пролив Дрейка лежит между Южной Америкой и Антарктидой. Ширина пролива около 820–850 км. Здесь часто бывают сильные ветра и высокие волны.',
  'The Drake Passage lies between South America and Antarctica. It is about 820–850 km wide. Strong winds and high waves are frequent here.', False),
 ('sa-cape-horn', 'cape', 3, 'Cape Horn', 'Мыс Горн',
  'Мыс Горн — знаменитая южная оконечность архипелага Огненная Земля. Его обогнули голландские моряки в 1616 году и назвали в честь города Хорн.',
  'Cape Horn is the famous southern tip of the Tierra del Fuego archipelago. Dutch sailors rounded it in 1616 and named it after the town of Hoorn.', False),
]
facts = {'section': 'south-america-on-the-map', 'block': 5,
  'use': 'introduction cards (exercise type 0), one fact per object; samerica-intro opens the section; ids match data/maps/samerica-overview.json',
  'decisions': ['Block 5 «South America» has 7 sections (plan approved by Svetlana 18.11.2026, https://claude.ai/artifact/Hbh3SH9HUP7WFMhBFVE8mn).',
                'Section 1 lessons regrouped 8 + 4 + 4 so that the 6-letter GeoWords fit (Svetlana, 19.11.2026).',
                'The Falkland Islands (Malvinas): administered by the United Kingdom, sovereignty disputed with Argentina; grey, neutral note, no record (Svetlana, 18–19.11.2026).',
                'Cape Horn and the Drake Passage carry no records (Svetlana, 19.11.2026): islands lie south of Cape Horn, the Drake width is approximate.'],
  'approvalRule': 'approval.contentSha256 = first 16 hex of sha256 over {id, name, fact, caveat, disputed} (JSON, sorted keys, UTF-8). If any of these change, the approval no longer matches and the card must be re-approved before it is shown.',
  'units': UNITS,
  'items': [{'id': i, 'order': n, 'kind': k, 'unit': u, 'name': {'en': en, 'ru': ru}, 'fact': {'en': fen, 'ru': fru}, 'source': SRC, 'disputed': d}
            for n, (i, k, u, en, ru, fru, fen, d) in enumerate(F)]}
for it in facts['items']:  # the disputed card repeats its approved neutral sentence as the caveat
    if it['id'] == 'sa-falklands':
        it['caveat'] = {'ru': 'Аргентина и Великобритания спорят о суверенитете над островами.', 'en': 'Argentina and the United Kingdom dispute sovereignty over the islands.'}

R = [  # id, object, unit, ru name, en name, ru fact, en fact, figure
 ('samerica-fourth-continent', None, 1, 'Южная Америка', 'South America',
  'Южная Америка — четвёртый по площади материк Земли после Евразии, Африки и Северной Америки.', 'South America is the fourth-largest continent on Earth, after Eurasia, Africa and North America.', {'value': 17800000, 'unit': 'km²'}),
 ('gallinas-northernmost', 'sa-cape-gallinas', 1, 'Мыс Гальинас', 'Punta Gallinas',
  'Мыс Гальинас — самая северная точка материка (12°27′ с. ш.).', 'Punta Gallinas is the northernmost point of the continent (12°27′ N).', {'value': 12.45, 'unit': '°N'}),
 ('seixas-easternmost', 'sa-cabo-branco', 1, 'Понта-ду-Сейшас', 'Ponta do Seixas',
  'Понта-ду-Сейшас, рядом с мысом Кабу-Бранку, — самая восточная точка материка (34°47′ з. д.).', 'Ponta do Seixas, next to Cabo Branco, is the easternmost point of the continent (34°47′ W).', {'value': 34.79, 'unit': '°W'}),
 ('parinas-westernmost', 'sa-punta-parinas', 1, 'Мыс Париньяс', 'Punta Pariñas',
  'Мыс Париньяс — самая западная точка материка (81°20′ з. д.).', 'Punta Pariñas is the westernmost point of the continent (81°20′ W).', {'value': 81.33, 'unit': '°W'}),
 ('froward-southernmost', 'sa-cape-froward', 1, 'Мыс Фроуэрд', 'Cape Froward',
  'Мыс Фроуэрд — самая южная точка материковой части (53°54′ ю. ш.).', 'Cape Froward is the southernmost point of the mainland (53°54′ S).', {'value': 53.9, 'unit': '°S'}),
 ('galapagos-tortoises', 'sa-galapagos', 2, 'Галапагосские черепахи', 'Galápagos tortoises',
  'Галапагосские гигантские черепахи — одни из крупнейших сухопутных черепах мира: в природе могут весить до 300 кг.', 'Galápagos giant tortoises are among the largest land tortoises in the world: in the wild they can weigh up to 300 kg.', {'value': 300, 'unit': 'kg'}),
]
records = {'section': 'south-america-on-the-map', 'block': 5, 'use': 'records lesson of unit 3: record cards and «find it» tasks (object null = card only)',
  'approvalRule': facts['approvalRule'],
  'items': [{'id': i, 'order': n + 1, 'object': o, 'kind': 'record', 'unit': u, 'name': {'en': en, 'ru': ru}, 'fact': {'en': fen, 'ru': fru}, 'figure': fig,
             'source': SRC, 'disputed': False, 'category': 'stable'} for n, (i, o, u, ru, en, fru, fen, fig) in enumerate(R)]}

W = {  # unit: [(ru, en, ru definition, en definition)], first = unit final
 1: [('ГУАРАНИ', 'GUARANI', 'Народ, чей язык — один из официальных в Парагвае; оттуда пришло слово «ягуар».', 'A people whose language is one of the official languages of Paraguay; the word “jaguar” comes from it.'),
     ('ПАРАМО', 'PARAMO', 'Высокогорные луга Анд выше границы леса, где растут пушистые фрайлехоны.', 'High meadows of the Andes above the tree line, where fuzzy frailejones grow.'),
     ('ЛЬЯНОС', 'LLANOS', 'Огромные тропические равнины в бассейне Ориноко, которые в сезон дождей заливает водой.', 'Huge tropical plains in the Orinoco basin that flood in the rainy season.'),
     ('ПАМПАСЫ', 'PAMPAS', 'Равнинные травянистые степи Аргентины и Уругвая, родина гаучо.', 'Flat grassy plains of Argentina and Uruguay, the home of the gauchos.'),
     ('СЕРРАДО', 'CERRADO', 'Бразильская саванна с низкими кривыми деревьями и высокой травой.', 'The Brazilian savanna with low twisted trees and tall grass.'),
     ('ГВИАНА', 'GUIANA', 'Историческая область на северо-востоке материка между реками Ориноко и Амазонкой.', 'A historical region in the northeast of the continent between the Orinoco and the Amazon.'),
     ('АЙМАРА', 'AYMARA', 'Народ, живущий у озера Титикака в Боливии и Перу.', 'A people living around Lake Titicaca in Bolivia and Peru.'),
     ('МАПУЧЕ', 'MAPUCHE', 'Народ юга Чили и Аргентины, который веками отстаивал свои земли от инков и испанцев.', 'A people of southern Chile and Argentina who defended their lands from the Incas and the Spanish for centuries.')],
 2: [('АЛЬТИПЛАНО', 'ALTIPLANO', 'Высокое плоскогорье в Андах, где лежат озеро Титикака и солончак Уюни.', 'A high plateau in the Andes with Lake Titicaca and the Uyuni salt flat.'),
     ('АМАЗОНИЯ', 'AMAZONIA', 'Огромная область тропических лесов в бассейне самой полноводной реки мира.', 'A huge region of rainforest in the basin of the river with the most water in the world.'),
     ('ПАТАГОНИЯ', 'PATAGONIA', 'Ветреная область на юге материка, в Аргентине и Чили.', 'A windy region in the south of the continent, in Argentina and Chile.'),
     ('ТИКУНА', 'TICUNA', 'Один из самых многочисленных народов тропических лесов; живёт у границы Бразилии, Колумбии и Перу.', 'One of the largest peoples of the rainforest; they live where Brazil, Colombia and Peru meet.'),
     ('МУИСКА', 'MUISCA', 'Народ гор Колумбии; их обряд с золотом на озере породил легенду об Эльдорадо.', 'A people of the Colombian mountains; their gold ceremony on a lake gave rise to the legend of El Dorado.'),
     ('ЯНОМАМИ', 'YANOMAMI', 'Народ тропических лесов на границе Бразилии и Венесуэлы; живёт в больших круглых общих домах.', 'A rainforest people on the border of Brazil and Venezuela who live in large round shared houses.'),
     ('СЕЛЬКНАМ', 'SELKNAM', 'Коренной народ Огненной Земли, охотники на гуанако.', 'The native people of Tierra del Fuego, hunters of guanacos.'),
     ('ТУПИНАМБА', 'TUPINAMBA', 'Народ атлантического побережья Бразилии, с которым первыми встретились португальцы в XVI веке.', 'A people of the Atlantic coast of Brazil, the first the Portuguese met in the 16th century.')],
 3: [('ТИУАНАКО', 'TIWANAKU', 'Древний город у озера Титикака, столица культуры, расцветшей задолго до инков.', 'An ancient city near Lake Titicaca, the capital of a culture that flourished long before the Incas.'),
     ('ПАРАКАС', 'PARACAS', 'Древняя культура южного побережья Перу, известная яркими тканями.', 'An ancient culture of the south coast of Peru, known for its bright textiles.'),
     ('МОЧИКА', 'MOCHICA', 'Культура северного побережья Перу, мастера глиняных сосудов с портретами людей.', 'A culture of the north coast of Peru, makers of clay vessels with portraits of people.'),
     ('ВАЛЬДИВИЯ', 'VALDIVIA', 'Одна из древнейших культур Америки на побережье Эквадора; её глиняной посуде около 5000 лет.', 'One of the oldest cultures of the Americas, on the coast of Ecuador; its pottery is about 5,000 years old.'),
     ('КАЛИМА', 'CALIMA', 'Древняя культура Колумбии, известная золотыми украшениями.', 'An ancient culture of Colombia known for its gold jewellery.'),
     ('МАНТЕНЬО', 'MANTENO', 'Культура побережья Эквадора, мореходы на плотах из бальсы.', 'A culture of the coast of Ecuador, seafarers on balsa-wood rafts.'),
     ('ЧАНКАЙ', 'CHANCAY', 'Культура центрального побережья Перу, известная глиняными фигурками и тканями.', 'A culture of the central coast of Peru, known for its clay figurines and textiles.')],
}
FINAL = ('КУПИСНИКЕ', 'CUPISNIQUE', 'Древняя культура северного побережья Перу, чтившая ягуара.', 'An ancient culture of the north coast of Peru that honoured the jaguar.')
# ТАУАНТИНСУЙУ / TAHUANTINSUYU (12 / 13 letters) does not fit on the 16 places of section 1 (11 at most): kept for the block final (Svetlana, 19.11.2026)
uid = {1: 'unit-1-oceans-and-farthest-points', 2: 'unit-2-equator-tropic-islands', 3: 'unit-3-far-south'}
units = []
for n in (1, 2, 3):
    units.append({'id': uid[n], 'title': UNITS[n - 1]['title'],
                  'words': {lang: [{'answer': w[li], 'role': 'final' if k == 0 else 'review', 'definition': w[2 + li]} for k, w in enumerate(W[n])]
                            for li, lang in ((0, 'ru'), (1, 'en'))}})
units.append({'id': 'section-final', 'title': {'ru': 'Итог раздела', 'en': 'Section final'},
              'words': {'ru': [{'answer': FINAL[0], 'role': 'section-final', 'definition': FINAL[2]}], 'en': [{'answer': FINAL[1], 'role': 'section-final', 'definition': FINAL[3]}]}})
dictionary = {'section': 'south-america-on-the-map', 'block': 5, 'status': 'approved',
  'source': '25 words RU + 25 EN chosen by Svetlana (19.11.2026); definitions by Claude, approved 19.11.2026 in ' + DOC,
  'rules': {'structure': '3 units x (1 final + review words) + section final; practice draws 6 of each unit\'s review words',
            'languages': 'EN words are the same terms without diacritics or apostrophes (SELKNAM, TUPINAMBA, PARAMO, MANTENO)',
            'length': 'letters only on learned objects of the South America map, one per object: unit 1 (8 objects) holds words of up to 7 letters',
            'approval': 'approval.contentSha256 = first 16 hex of sha256 over {answer, definition}',
            'definitions': 'a definition never contains its answer word, nor a word of the same root (Svetlana, 2026-10-24)'},
  'units': units}
for name, obj in (('data/content/b5-section-1-facts.json', facts), ('data/content/b5-section-1-records.json', records), ('data/dictionary/b5-section-1.json', dictionary)):
    (ROOT / name).write_text(json.dumps(obj, ensure_ascii=False, indent=1) + '\n')
    print('wrote', name)
