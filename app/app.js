/* GeoWords «Экспедиция» — section 1 «Continents and oceans» and section 2 «Rivers of the world» (draft lessons): units, lessons, unit-final GeoWords,
   review GeoWords built by the approved rules, and the section final with a passport stamp.
   Content comes only from approved data in /data (facts, records, relations, dictionary, GeoWords
   puzzles, clue templates, the continents/oceans map). Progress is kept on this device (localStorage). */
(()=>{
const A='../';
const KEY='geowords_expedition_v1';
const BUILD='2026.10.28-rivers';
const IMG={
  welcome:A+'assets/graphics/game/scene-welcome.webp',intro:A+'assets/graphics/game/intro-continents-oceans.webp',
  hello:A+'assets/pip/game/pip-hello.webp',yes:A+'assets/pip/game/pip-yes.webp',cheer:A+'assets/pip/game/pip-cheer.webp',
  map:A+'assets/pip/game/pip-map.webp',spy:A+'assets/pip/game/pip-spyglass.webp',left:A+'assets/pip/game/pip-point-left.webp',
  right:A+'assets/pip/game/pip-point-right.webp',oops:A+'assets/pip/game/pip-oops.webp',wonder:A+'assets/pip/game/pip-wonder.webp',
  faceHappy:A+'assets/pip/game/pip-face-happy.webp',faceOops:A+'assets/pip/game/pip-face-oops.webp',faceWow:A+'assets/pip/game/pip-face-wow.webp',
  streak:A+'assets/graphics/game/icon-streak.webp',nuance:A+'assets/graphics/game/icon-nuance.webp',
  medal:A+'assets/graphics/game/medal-unit.webp',medalSection:A+'assets/graphics/game/medal-section.webp',boat:A+'assets/graphics/game/path-pip-boat.webp',
  stamp:A+'assets/graphics/game/stamp-continents.webp',stamp2:A+'assets/graphics/game/stamp-rivers.webp',stamp3:A+'assets/graphics/game/stamp-mountains.webp',stamp4:A+'assets/graphics/game/stamp-seas.webp',stamp5:A+'assets/graphics/game/stamp-straits.webp',stampBlock:A+'assets/graphics/game/stamp-block-world.webp',euBase:A+'assets/europe-blank.webp',euRivers:A+'assets/europe-rivers.webp',euMountains:A+'assets/europe-mountains.webp',euCapitals:A+'assets/europe-capitals.webp',euCountriesRivers:A+'assets/europe-countries-rivers.webp',euCard:A+'assets/graphics/game/rank-1-map.webp',stampChallenge:A+'assets/graphics/game/stamp-challenge.webp',base:A+'assets/world-base.webp',
  layer:id=>A+'assets/layers/'+id+'.webp'
};

/* ---------- UI strings (content itself comes from data) ---------- */
const T={
 ru:{tag:'Экспедиция по карте мира с лисёнком Пипом',lead:'Короткие уроки по карте и слово-загадка в конце каждого юнита.',words:'На каком языке слова?',
  go:'В путь',soon:'Скоро',notReady:'Этот юнит ещё готовится. Пока открыт юнит 1.',nextLesson:'Следующий урок',nextFinal:'К итогу юнита',section:'Раздел 1',sectionName:'Материки и океаны',unit:'Юнит',lessonN:n=>'Урок '+n,final:'Итог юнита: GeoWords',
  locked:'Сначала пройди предыдущий шаг',start:'Начать',later:'Позже',again:'Пройти урок ещё раз',finalAgain:'Итоговое слово ещё раз',practice:'Пройти ещё раз — новое слово',
  practiceNone:'Новые слова для повторения откроются в следующих юнитах: для длинных слов пока не хватает выученных мест на карте.',
  intro:'Знакомство',tip:'Лайфхак',find:'Найди на карте',what:'Что это?',hemi:'Полушария',line:'Линии на карте',washed:'Кто кого омывает',record:'Рекорд',
  tap:n=>`Нажми на <b>${n}</b>`,whatDir:'Какая это сторона света?',whatCont:'Какой это континент?',whatOcean:'Какой это океан?',
  washedQ:n=>`Нажми на все океаны, которые омывают <b>${n}</b>`,washedHint:'Отметь океаны и нажми «Проверить».',checkAns:'Проверить',
  next:'Дальше',check:'Понятно',right:'Верно!',wrongIs:n=>`Это ${n}.`,miss:'Мимо. Вот где это.',tryLine:'Мимо линии. Вот она.',hemiWrong:'Это другое полушарие. Вот нужное.',
  neutral:'Это место не относят ни к одному океану. Попробуй ещё раз.',washedOk:'Все океаны найдены!',washedBad:'Не совсем. Вот правильные океаны.',
  nuance:'Есть нюанс',lessonDone:'Урок пройден!',xp:'Очки',acc:'Точность',time:'Время',home:'На карту пути',
  practiceStep:'Практика: 6 слов GeoWords',practiceDesc:'Шесть слов-загадок подряд на пройденных местах карты. После них открывается итог юнита.',nextWord:(i,n)=>`Следующее слово · ${i} из ${n}`,practiceAll:'Практика пройдена!',nextPractice:'К практике',practiceAgain:'Пройти практику ещё раз',wordOf:(i,n)=>`Слово ${i} из ${n}`,
  unitDone:'Юнит пройден!',sectionDone:'Раздел пройден!',stampGot:'Штамп в паспорт путешественника',practiceDone:'Слово собрано!',wordDef:'Слово-загадка',mistakes:'Ошибок',
  quitT:'Выйти из урока?',quitP:'Прогресс этого урока не сохранится.',quit:'Выйти',stay:'Продолжить',
  settings:'Настройки',lang:'Слова',reset:'Сбросить прогресс',unlock:'Открыть все шаги (для теста)',
  rotate:'↻ Поверни телефон — карта станет вдвое больше',zoomHint:'Буквы стоят близко — разведи два пальца, чтобы увеличить карту.',
  pipStart:'Капитан, прокладываем маршрут! Ищи букву по подсказке.',pipOk:l=>`Есть «${l}»! Отмечаю точку на маршруте.`,pipBad:'Не та точка. Прочитай подсказку ещё раз.',pipHint:'Сверимся с картой — нужная буква мигает.',
  practiceTag:'Повторение · собрано по правилам',sectionFinal:'Итог раздела: GeoWords',sectionN:n=>'Раздел '+n,draft:'черновик уроков',
  whatRiver:'Какая это река?',riverCont:n=>`По какому континенту течёт <b>${n}</b>?`,riverMouth:n=>`Куда впадает <b>${n}</b>?`,mouth:'Куда впадает',onCont:'Континент',
  allAsia:'Нажми на все реки Азии',allHint:'Отметь реки и нажми «Проверить».',allOk:'Все реки Азии найдены!',allBad:'Не совсем. Вот реки Азии.',riversIntro:'Перед этим разделом тебе нужно знать',
  whatStrait:'Что это за пролив или канал?',connectsQ:n=>`Что соединяет <b>${n}</b>?`,separatesQ:n=>`Что разделяет <b>${n}</b>?`,connectsT:'Что соединяет',separatesT:'Что разделяет',
  openMag:'Он маленький — открой лупу 🔍 на карте',magHint:'Маленькие проливы — под лупой 🔍',
  whatSea:'Что это за море или залив?',seaOcean:n=>`<b>${n}</b> — часть какого океана?`,seaNone:'Ни какого: это внутренний водоём',
  allIndian:'Нажми на все моря и заливы Индийского океана',allIndianHint:'Отметь моря и заливы и нажми «Проверить».',allIndianOk:'Все моря и заливы Индийского океана найдены!',allIndianBad:'Не совсем. Вот моря и заливы Индийского океана.',
  whatMtn:'Какие это горы?',mtnCont:n=>`Выбери континент, где <b>${n}</b>`,mtnBorder:n=>`<b>${n}</b> — на границе каких частей света?`,mtnOcean:n=>`<b>${n}</b> — на дне какого океана?`,
  allAfrica:'Нажми на все горы Африки',allAfricaOk:'Все горы Африки найдены!',allAfricaBad:'Не совсем. Вот горы Африки.',and:' и ',ocean:'Океан',border:'Граница',
  units:[['Стороны света','Север, юг, запад, восток, экватор'],['Континенты','7 континентов'],['Океаны','5 океанов'],['Соседи и рекорды','Кто кого омывает, рекорды, полушария']],
  tester:'Тестовая сборка: прогресс хранится только на этом устройстве.',
  blockN:'Блок 1 · Мир',blockName:'Повторение блока',blockFinal:'Итог блока: GeoWords',blockDone:'Блок пройден!',nextBlockFinal:'К итогу блока',
  challenge:'Challenge',huntTag:'Challenge · Speed Hunt',cwTag:'Challenge · GeoWords',huntDesc:'Две части. Speed Hunt: за 60 секунд найди на карте как можно больше объектов блока, ошибка стоит только времени. Потом 3 слова GeoWords с буквами на объектах всего блока.',toCw:'К словам GeoWords',cwDirect:'Сразу к словам GeoWords',cwAll:'Challenge пройден!',toChallenge:'К Challenge',
  huntFind:'Найди:',huntSkip:'Пропустить',huntScore:'Найдено',huntBest:'Рекорд',huntDone:'Время вышло!',huntAgain:'Ещё раз',huntSec:s=>s+' с',
  label:'Подпиши карту',labelQ:'Выбери название, потом нажми на его точку на карте',write:'Напиши название',writeQ:'Как называется этот объект?',
  labelBad:'Не совсем. Вот как правильно:',pairs:'Пары',pairsQ:'Соедини пары',tf:'Правда или нет',tfYes:'Правда',tfNo:'Неправда',tfRight:'Правильно так:',pairsOk:'Все пары найдены!',
  pairsT:{flowsInto:'Река и куда она впадает',inOcean:'Море и его океан',onContinent:'Объект и его континент',separates:'Пролив и что он разделяет'},
  recFind:'Найди его на карте.',recWhatQ:'Что это? Выбери название.',recPairsT:'Место и его рекорд',lessonDesc:'Около 10 заданий, 3–4 минуты.',finalDesc:'Найди буквы на карте по подсказкам и собери слово.',
  block2:'Блок 2 · Европа',euName:'Европа на карте',euSec:'Блок 2 · Раздел 1',euSoon:'Итоговые GeoWords этого раздела откроются после утверждения. Пока их можно пропустить.',eu2Name:'Реки Европы',eu2Sec:'Блок 2 · Раздел 2',eu3Name:'Горы Европы',eu3Sec:'Блок 2 · Раздел 3',eu4Name:'Страны и столицы: запад и север',eu4Sec:'Блок 2 · Раздел 4',tapCap:n=>`Нажми на столицу <b>${n}</b>`,capOfQ:n=>`${n} — столица какой страны?`,whatCapQ:'Какая столица у этой страны?',capIs:(c,n)=>`${c} — столица: ${n}.`,
  allPen:'Нажми на все полуострова',allPenHint:'Отметь полуострова и нажми «Проверить».',allPenOk:'Все полуострова найдены!',allPenBad:'Не совсем. Вот полуострова Европы.'},
 en:{tag:'An expedition across the world map with Pip the fox',lead:'Short map lessons and a word puzzle at the end of every unit.',words:'Which language for the words?',
  go:'Let’s go',soon:'Soon',notReady:'This unit is still being prepared. Unit 1 is open for now.',nextLesson:'Next lesson',nextFinal:'To the unit final',section:'Section 1',sectionName:'Continents and oceans',unit:'Unit',lessonN:n=>'Lesson '+n,final:'Unit final: GeoWords',
  locked:'Finish the previous step first',start:'Start',later:'Later',again:'Play the lesson again',finalAgain:'Final word again',practice:'Play again — new word',
  practiceNone:'New review words open in the next units: long words need more places you have learned on the map.',
  intro:'New',tip:'Memory trick',find:'Find on the map',what:'What is it?',hemi:'Hemispheres',line:'Lines on the map',washed:'Neighbours',record:'Record',
  tap:n=>`Tap <b>${n}</b>`,whatDir:'Which direction is this?',whatCont:'Which continent is this?',whatOcean:'Which ocean is this?',
  washedQ:n=>`Tap every ocean that washes <b>${n}</b>`,washedHint:'Mark the oceans, then tap “Check”.',checkAns:'Check',
  next:'Next',check:'Got it',right:'Correct!',wrongIs:n=>`That is ${n}.`,miss:'Missed. Here it is.',tryLine:'Not on the line. Here it is.',hemiWrong:'That is the other hemisphere. Here is the right one.',
  neutral:'This place belongs to no ocean. Try again.',washedOk:'All oceans found!',washedBad:'Not quite. Here are the right oceans.',
  nuance:'There is a nuance',lessonDone:'Lesson complete!',xp:'Points',acc:'Accuracy',time:'Time',home:'Back to the trail',
  practiceStep:'Practice: 6 GeoWords',practiceDesc:'Six mystery words in a row on the places you have learned. Then the unit final opens.',nextWord:(i,n)=>`Next word · ${i} of ${n}`,practiceAll:'Practice complete!',nextPractice:'To the practice',practiceAgain:'Play the practice again',wordOf:(i,n)=>`Word ${i} of ${n}`,
  unitDone:'Unit complete!',sectionDone:'Section complete!',stampGot:'A stamp in your explorer passport',practiceDone:'Word solved!',wordDef:'Mystery word',mistakes:'Mistakes',
  quitT:'Leave the lesson?',quitP:'Progress in this lesson will be lost.',quit:'Leave',stay:'Keep going',
  settings:'Settings',lang:'Words',reset:'Reset progress',unlock:'Unlock every step (testing)',
  rotate:'↻ Turn your phone — the map gets twice as big',zoomHint:'The letters are close together — spread two fingers to zoom in.',
  pipStart:'Captain, let’s plot our route! Read the clue and find the letter.',pipOk:l=>`Got “${l}”! Marking it on our route.`,pipBad:'Not that spot. Read the clue again.',pipHint:'Let’s check the map — the right letter is blinking.',
  practiceTag:'Review · built by the rules',sectionFinal:'Section final: GeoWords',sectionN:n=>'Section '+n,draft:'draft lessons',
  whatRiver:'Which river is this?',riverCont:n=>`On which continent does <b>${n}</b> flow?`,riverMouth:n=>`Where does <b>${n}</b> flow into?`,mouth:'River mouth',onCont:'Continent',
  allAsia:'Tap every river of Asia',allHint:'Mark the rivers, then tap “Check”.',allOk:'All the rivers of Asia found!',allBad:'Not quite. Here are the rivers of Asia.',riversIntro:'Before this section you need to know',
  whatStrait:'Which strait or canal is this?',connectsQ:n=>`What does <b>${n}</b> connect?`,separatesQ:n=>`What does <b>${n}</b> separate?`,connectsT:'What it connects',separatesT:'What it separates',
  openMag:'It is tiny — open the magnifier 🔍 on the map',magHint:'Tiny straits are under the magnifier 🔍',
  whatSea:'Which sea or bay is this?',seaOcean:n=>`Which ocean is <b>${n}</b> part of?`,seaNone:'None: it is an inland body of water',
  allIndian:'Tap every sea and bay of the Indian Ocean',allIndianHint:'Mark the seas and bays, then tap “Check”.',allIndianOk:'All the seas and bays of the Indian Ocean found!',allIndianBad:'Not quite. Here are the seas and bays of the Indian Ocean.',
  whatMtn:'Which mountains are these?',mtnCont:n=>`Choose the continent of <b>${n}</b>`,mtnBorder:n=>`Which two continents meet along <b>${n}</b>?`,mtnOcean:n=>`On the floor of which ocean is <b>${n}</b>?`,
  allAfrica:'Tap all the mountains of Africa',allAfricaOk:'All the mountains of Africa found!',allAfricaBad:'Not quite. Here are the mountains of Africa.',and:' and ',ocean:'Ocean',border:'Border',
  units:[['Cardinal directions','North, south, west, east, the Equator'],['Continents','7 continents'],['Oceans','5 oceans'],['Neighbours and records','Which oceans wash which continent, records, hemispheres']],
  tester:'Test build: progress is stored only on this device.',
  blockN:'Block 1 · The world',blockName:'Block review',blockFinal:'Block final: GeoWords',blockDone:'Block complete!',nextBlockFinal:'To the block final',
  challenge:'Challenge',huntTag:'Challenge · Speed Hunt',cwTag:'Challenge · GeoWords',huntDesc:'Two parts. Speed Hunt: in 60 seconds find as many places of the block as you can; a mistake only costs time. Then 3 GeoWords with letters on places from the whole block.',toCw:'To the GeoWords',cwDirect:'Straight to the GeoWords',cwAll:'Challenge complete!',toChallenge:'To the Challenge',
  huntFind:'Find:',huntSkip:'Skip',huntScore:'Found',huntBest:'Best',huntDone:'Time is up!',huntAgain:'Play again',huntSec:s=>s+' s',
  label:'Label the map',labelQ:'Choose a name, then tap its point on the map',write:'Write the name',writeQ:'What is this place called?',
  labelBad:'Not quite. Here is the right way:',pairs:'Pairs',pairsQ:'Match the pairs',tf:'True or false',tfYes:'True',tfNo:'False',tfRight:'The right statement:',pairsOk:'All pairs matched!',
  pairsT:{flowsInto:'A river and where it flows',inOcean:'A sea and its ocean',onContinent:'A place and its continent',separates:'A strait and what it separates'},
  recFind:'Find it on the map.',recWhatQ:'What is it? Pick the name.',recPairsT:'A place and its record',lessonDesc:'About 10 tasks, 3–4 minutes.',finalDesc:'Find the letters on the map from the clues and build the word.',
  block2:'Block 2 · Europe',euName:'Europe on the map',euSec:'Block 2 · Section 1',euSoon:'The final GeoWords of this section open once they are approved. Until then the trail goes on past them.',eu2Name:'Rivers of Europe',eu2Sec:'Block 2 · Section 2',eu3Name:'Mountains of Europe',eu3Sec:'Block 2 · Section 3',eu4Name:'Countries and capitals: west and north',eu4Sec:'Block 2 · Section 4',tapCap:n=>`Tap the capital <b>${n}</b>`,capOfQ:n=>`${n} is the capital of which country?`,whatCapQ:'What is the capital of this country?',capIs:(c,n)=>`The capital of ${c} is ${n}.`,
  allPen:'Tap every peninsula',allPenHint:'Mark the peninsulas, then tap “Check”.',allPenOk:'All the peninsulas found!',allPenBad:'Not quite. Here are the peninsulas of Europe.'}
};
// Accusative forms for «Нажми на …» (grammar of the question, not content).
const ACC_RU={north:'север',south:'юг',east:'восток',west:'запад',equator:'экватор','prime-meridian':'нулевой меридиан',
  n:'Северное полушарие',s:'Южное полушарие',e:'Восточное полушарие',w:'Западное полушарие',
  asia:'Азию',africa:'Африку','north-america':'Северную Америку','south-america':'Южную Америку',antarctica:'Антарктиду',europe:'Европу',australia:'Австралию',
  'pacific-ocean':'Тихий океан','atlantic-ocean':'Атлантический океан','indian-ocean':'Индийский океан','arctic-ocean':'Северный Ледовитый океан','southern-ocean':'Южный океан',
  'english-channel':'пролив Ла-Манш',
  'mediterranean-sea':'Средиземное море','black-sea':'Чёрное море','red-sea':'Красное море','caspian-sea':'Каспийское море','arabian-sea':'Аравийское море','bay-of-bengal':'Бенгальский залив',
  'coral-sea':'Коралловое море','caribbean-sea':'Карибское море','gulf-of-mexico':'Мексиканский залив','hudson-bay':'Гудзонов залив',
  himalayas:'Гималаи',ural:'Уральские горы',cordillera:'Североамериканские Кордильеры',andes:'Анды',appalachians:'Аппалачи','east-africa':'горы Восточной Африки',
  'great-dividing-range':'Большой Водораздельный хребет',atlas:'Атласские горы',caucasus:'Кавказские горы',pyrenees:'Пиренеи','mid-atlantic-ridge':'Срединно-Атлантический хребет',
  nile:'Нил',amazon:'Амазонку',mississippi:'Миссисипи',yangtze:'Янцзы','huang-he':'Хуанхэ',ganges:'Ганг',indus:'Инд',danube:'Дунай',volga:'Волгу',don:'Дон',dnieper:'Днепр',dniester:'Днестр',rhine:'Рейн',elbe:'Эльбу',oder:'Одер',vistula:'Вислу',thames:'Темзу',seine:'Сену',loire:'Луару',rhone:'Рону',po:'реку По',tiber:'Тибр',tagus:'Тахо',douro:'Дуэро',guadiana:'Гвадиану',ebro:'Эбро',guadalquivir:'Гвадалквивир',
  'ural-mountains':'Уральские горы','ural-river':'реку Урал','scandinavian-peninsula':'Скандинавский полуостров','kola-peninsula':'Кольский полуостров',jutland:'Ютландию',
  'iberian-peninsula':'Пиренейский полуостров','apennine-peninsula':'Апеннинский полуостров','balkan-peninsula':'Балканский полуостров','crimean-peninsula':'Крымский полуостров',
  'great-britain':'Великобританию',ireland:'Ирландию',iceland:'Исландию',sicily:'Сицилию','baltic-sea':'Балтийское море','north-sea':'Северное море','barents-sea':'Баренцево море',
  'united-kingdom':'Великобританию','ireland-country':'Ирландию',france:'Францию',belgium:'Бельгию',spain:'Испанию',portugal:'Португалию',norway:'Норвегию',sweden:'Швецию',
  denmark:'Данию',finland:'Финляндию','iceland-country':'Исландию'};
// a name inside a sentence («Это река Урал.») where the card title differs
const IN_SENT_RU={'ural-river':'река Урал'};
const ACC_EN={north:'north',south:'south',east:'east',west:'west',equator:'the Equator','prime-meridian':'the Prime Meridian','pacific-ocean':'the Pacific Ocean','atlantic-ocean':'the Atlantic Ocean','indian-ocean':'the Indian Ocean','arctic-ocean':'the Arctic Ocean','southern-ocean':'the Southern Ocean',
  n:'the Northern Hemisphere',s:'the Southern Hemisphere',e:'the Eastern Hemisphere',w:'the Western Hemisphere',
  'suez-canal':'the Suez Canal','panama-canal':'the Panama Canal','strait-of-gibraltar':'the Strait of Gibraltar','english-channel':'the English Channel',bosporus:'the Bosporus',dardanelles:'the Dardanelles',
  'bab-el-mandeb':'the Bab-el-Mandeb Strait','strait-of-hormuz':'the Strait of Hormuz','gulf-of-oman':'the Gulf of Oman','strait-of-malacca':'the Strait of Malacca','mozambique-channel':'the Mozambique Channel',
  'bering-strait':'the Bering Strait','drake-passage':'the Drake Passage','strait-of-magellan':'the Strait of Magellan',
  'mediterranean-sea':'the Mediterranean Sea','black-sea':'the Black Sea','red-sea':'the Red Sea','caspian-sea':'the Caspian Sea','arabian-sea':'the Arabian Sea','bay-of-bengal':'the Bay of Bengal',
  'coral-sea':'the Coral Sea','caribbean-sea':'the Caribbean Sea','gulf-of-mexico':'the Gulf of Mexico','hudson-bay':'Hudson Bay',
  himalayas:'the Himalayas',ural:'the Ural Mountains',cordillera:'the North American Cordillera',andes:'the Andes',appalachians:'the Appalachian Mountains','east-africa':'the mountains of East Africa',
  'great-dividing-range':'the Great Dividing Range',atlas:'the Atlas Mountains',caucasus:'the Caucasus Mountains',pyrenees:'the Pyrenees','mid-atlantic-ridge':'the Mid-Atlantic Ridge',
  nile:'the Nile',amazon:'the Amazon',mississippi:'the Mississippi',yangtze:'the Yangtze','huang-he':'the Huang He',ganges:'the Ganges',indus:'the Indus',danube:'the Danube',volga:'the Volga',don:'the Don',dnieper:'the Dnieper',dniester:'the Dniester',rhine:'the Rhine',elbe:'the Elbe',oder:'the Oder',vistula:'the Vistula',thames:'the Thames',seine:'the Seine',loire:'the Loire',rhone:'the Rhône',po:'the Po',tiber:'the Tiber',tagus:'the Tagus',douro:'the Douro',guadiana:'the Guadiana',ebro:'the Ebro',guadalquivir:'the Guadalquivir',
  'ural-mountains':'the Ural Mountains','ural-river':'the Ural River','scandinavian-peninsula':'the Scandinavian Peninsula','kola-peninsula':'the Kola Peninsula',jutland:'Jutland',
  'iberian-peninsula':'the Iberian Peninsula','apennine-peninsula':'the Apennine Peninsula','balkan-peninsula':'the Balkan Peninsula','crimean-peninsula':'the Crimean Peninsula',
  'great-britain':'Great Britain',ireland:'Ireland',iceland:'Iceland',sicily:'Sicily','baltic-sea':'the Baltic Sea','north-sea':'the North Sea','barents-sea':'the Barents Sea',
  alps:'the Alps',apennines:'the Apennines',carpathians:'the Carpathians','balkan-mountains':'the Balkan Mountains','dinaric-alps':'the Dinaric Alps',
  'scandinavian-mountains':'the Scandinavian Mountains','scottish-highlands':'the Scottish Highlands','united-kingdom':'the United Kingdom',netherlands:'the Netherlands'};

/* ---------- state ---------- */
const blank={lang:null,done:{},xp:0,streak:0,lastDay:'',unlockAll:false,introSeen:false,learned:[],recent:[],weak:{},hunt:0};
let S=load();
function load(){try{return Object.assign({},blank,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return {...blank}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const L=()=>S.lang||'ru';const t=()=>T[L()];
function bumpStreak(){const d=new Date(),k=x=>x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate(),day=k(d);
  if(S.lastDay===day)return;S.streak=S.lastDay===k(new Date(d-864e5))?S.streak+1:1;S.lastDay=day}
function learn(id){if(!S.learned.includes(id)){S.learned.push(id);save()}}

/* ---------- data ---------- */
let D=null;
async function loadData(){
  const get=p=>fetch(A+p).then(r=>{if(!r.ok)throw new Error(p+' '+r.status);return r.json()});
  const [facts,records,relations,geo,dict,map,tpl]=await Promise.all(['data/content/section-1-facts.json','data/content/section-1-records.json',
    'data/content/section-1-relations.json','data/geowords/section-1.json','data/dictionary/section-1.json','data/maps/world-continents-oceans.json',
    'data/geowords/clue-templates.json'].map(get));
  const fact=id=>facts.items.find(i=>i.id===id);const place=id=>tpl.objects.find(o=>o.id===id);const line=id=>map.lines.find(l=>l.id===id);
  const sentence=(id,word)=>lang=>fact(id).fact[lang].split(/(?<=\.)\s+/).find(s=>s.includes(word[lang]))||fact(id).fact[lang];
  const objs={};
  for(const it of map.items){const f=fact(it.id);objs[it.id]={id:it.id,kind:it.kind,name:it.name,x:it.label.x,y:it.label.y,tapArea:it.tapArea,holes:it.holes||[],
    layer:it.layer?(it.layer.webp||it.layer.png).split('/').pop().replace('.webp',''):null,fact:f&&(lang=>f.fact[lang]),disputed:f&&f.disputed,caveat:f&&f.caveat,
    unit:it.kind==='continent'?2:3,place:place(it.id)}}
  D={facts,records:records.items.filter(r=>!r.disputed&&r.category!=='changing'),relations,geo,dict,map,tpl,objs,
    dirs:['north','south','east','west'].map(id=>({id,name:fact(id).name,fact:lang=>fact(id).fact[lang],x:place(id).x,y:place(id).y})),
    lines:{equator:{id:'equator',name:line('equator').name,layer:'world-line-equator',fact:sentence('north',{ru:'Экватор',en:'Equator'}),y:place('equator').y},
           'prime-meridian':{id:'prime-meridian',name:line('prime-meridian').name,layer:'world-line-prime-meridian',fact:sentence('east',{ru:'Нулевой меридиан',en:'Prime Meridian'}),x:place('prime-meridian').x}},
    hemis:map.hemispheres};
  // Section 2 «Rivers of the world»: approved facts, records, dictionary, GeoWords, river geometry; mouths from the block review relations.
  const [f2,r2,g2,d2,rmap,rev,f4]=await Promise.all(['data/content/section-2-facts.json','data/content/section-2-records.json','data/geowords/section-2.json',
    'data/dictionary/section-2.json','data/maps/world-rivers.json','data/review/block-1.json','data/content/section-4-facts.json'].map(get));
  const rel=(id,r)=>{const x=rev.relations.find(q=>q.subject===id&&q.relation===r&&q.use==='yes');return x&&x.object};
  const rivers={};for(const it of rmap.rivers){const f=f2.items.find(i=>i.id===it.id);
    rivers[it.id]={id:it.id,kind:'river',name:it.name,unit:f.unit,x:it.label.x,y:it.label.y,path:it.path,mouthPt:it.mouth||null,sourcePt:it.source||null,layer:it.layer.png.split('/').pop().replace('.webp',''),
      fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat,continent:rel(it.id,'onContinent'),mouth:rel(it.id,'flowsInto')}}
  const waterName=id=>(objs[id]&&objs[id].name)||(f4.items.find(i=>i.id===id)||{}).name;
  D.s2={facts:f2,records:r2.items.filter(r=>!r.disputed&&r.category!=='changing'),geo:g2,dict:d2,rivers,waterName,intro:f2.intro};
  // Section 3 «Mountains of the world»: approved facts, records, dictionary, GeoWords, range outlines; continent / ocean / border from the block review relations.
  const [f3,r3,g3,d3,mmap]=await Promise.all(['data/content/section-3-facts.json','data/content/section-3-records.json','data/geowords/section-3.json',
    'data/dictionary/section-3.json','data/maps/world-mountains.json'].map(get));
  const relAny=(id,r)=>{const x=rev.relations.find(q=>q.subject===id&&q.relation===r&&q.use!=='no');return x&&x.object};
  const mtns={};for(const it of mmap.mountains){const f=f3.items.find(i=>i.id===it.id);
    mtns[it.id]={id:it.id,kind:'mountain',name:it.name,unit:f.unit,x:it.label.x,y:it.label.y,tapArea:it.tapArea,holes:[],layer:it.layer.png.split('/').pop().replace('.webp',''),
      fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat,continent:rel(it.id,'onContinent'),ocean:rel(it.id,'onOceanFloor'),border:relAny(it.id,'onBorderOf')}}
  // Section 4 «Seas of the world»: approved facts, records, dictionary, GeoWords, sea outlines; the ocean from the block review relations.
  const [r4,g4,d4,wmap]=await Promise.all(['data/content/section-4-records.json','data/geowords/section-4.json',
    'data/dictionary/section-4.json','data/maps/world-waters.json'].map(get));
  const seas={};for(const it of wmap.waters){const f=f4.items.find(i=>i.id===it.id);const io=rev.relations.find(q=>q.subject===it.id&&q.relation==='inOcean');
    seas[it.id]={id:it.id,kind:'sea',name:it.name,unit:f.unit,x:it.label.x,y:it.label.y,tapArea:it.tapArea,holes:[],
      fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat,ocean:io&&io.object,oceanUse:io&&io.use,card:io&&io.requiresCard}}
  const card=rev.cards.find(c=>c.id==='card-map-convention-med-black-atlantic'&&c.approval?.status==='approved');
  // Section 5 «Straits and canals»: approved facts, records, dictionary, GeoWords, strait outlines and the two magnifier insets.
  const [f5,r5,g5,d5,smap]=await Promise.all(['data/content/section-5-facts.json','data/content/section-5-records.json','data/geowords/section-5.json',
    'data/dictionary/section-5.json','data/maps/world-straits.json'].map(get));
  const straits={};for(const it of smap.items){const f=f5.items.find(i=>i.id===it.id);
    straits[it.id]={id:it.id,kind:it.kind,name:it.name,unit:f.unit,x:it.label.x,y:it.label.y,tapArea:it.tapArea,holes:[],inset:it.inset||null,
      layer:it.layer?it.layer.png.split('/').pop().replace('.webp',''):null,fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat,
      connects:rel(it.id,'connects'),separates:rel(it.id,'separates'),ocean:rel(it.id,'inOcean')}}
  const insets={};for(const [id,v] of Object.entries(smap.insets))insets[id]={id,image:A+v.image.replace(/^\.\//,''),magnifier:v.magnifier,aspect:id==='bering'?1012/502:1012/476};
  D.s5={facts:f5,records:r5.items.filter(r=>!r.disputed&&r.category!=='changing'),geo:g5,dict:d5,straits,insets,intro:null};
  D.s4={card,facts:f4,records:r4.items.filter(r=>!r.disputed&&r.category!=='changing'),geo:g4,dict:d4,seas,intro:null};
  D.s3={facts:f3,records:r3.items.filter(r=>!r.disputed&&r.category!=='changing'),geo:g3,dict:d3,mtns,intro:f3.intro};
  // Block 1 review: approved review unit (lessons, relations, true/false pairs), the block-final GeoWords and its dictionary, the Challenge rules.
  const [gb,db,ch,cs]=await Promise.all(['data/geowords/block-1.json','data/dictionary/block-1.json','data/challenge/block-1.json','data/geowords/challenge-block-1-sample.json'].map(get));
  D.b={rev,geo:gb,dict:db,challenge:ch,cw:cs.puzzles.filter(p=>p.approval?.status==='approved')};
  // Block 2 «Europe», section 1 «Europe on the map» (approved by Svetlana 26.10.2026): facts, records and outlines on the Europe base map.
  const [ef,er,emap,ed,eg]=await Promise.all(['data/content/b2-section-1-facts.json','data/content/b2-section-1-records.json','data/maps/europe-overview.json',
    'data/dictionary/b2-section-1.json','data/geowords/b2-section-1.json'].map(get));
  const eu={};for(const it of emap.items){const f=ef.items.find(i=>i.id===it.id);if(f?.approval?.status!=='approved')continue;
    eu[it.id]={id:it.id,kind:it.kind,name:it.name,unit:it.unit,x:it.label.x,y:it.label.y,tapArea:it.tapArea||[],holes:it.holes||[],soft:it.softArea||[],path:it.path||null,
      fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat}}
  for(const o of Object.values(eu))o.area=o.tapArea.reduce((a,p)=>a+Math.abs(p.reduce((s,q,i)=>{const r=p[(i+1)%p.length];return s+q[0]*r[1]-r[0]*q[1]},0))/2,0);
  D.s7={facts:ef,records:er.items.filter(r=>r.approval?.status==='approved'&&!r.disputed&&r.category!=='changing'),eu,
    intro:ef.items.find(i=>i.id==='europe-intro'&&i.approval?.status==='approved'),dict:ed,geo:eg};
  // Block 2 section 2 «Rivers of Europe» (approved by Svetlana 27.10.2026): river lines on the Europe rivers map; the Ural River is section 1's.
  const [e2f,e2r,e2m,e2d,e2g]=await Promise.all(['data/content/b2-section-2-facts.json','data/content/b2-section-2-records.json','data/maps/europe-rivers.json',
    'data/dictionary/b2-section-2.json','data/geowords/b2-section-2.json'].map(get));
  const ev={};for(const it of e2m.items){const f=e2f.items.find(i=>i.id===it.id);if(f?.approval?.status!=='approved')continue;
    ev[it.id]={id:it.id,kind:'river',name:it.name,unit:it.unit,x:it.label.x,y:it.label.y,tapArea:[],holes:[],soft:[],path:it.path,area:0,
      fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat}}
  D.s8={facts:e2f,records:e2r.items.filter(r=>r.approval?.status==='approved'&&!r.disputed&&r.category!=='changing'),eu:ev,intro:null,dict:e2d,geo:e2g};
  // Block 2 section 3 «Mountains of Europe»: tap areas of the ranges drawn on the Europe mountains map; the Ural Mountains are section 1's.
  const [e3f,e3r,e3m,e3d,e3g]=await Promise.all(['data/content/b2-section-3-facts.json','data/content/b2-section-3-records.json','data/maps/europe-mountains.json',
    'data/dictionary/b2-section-3.json','data/geowords/b2-section-3.json'].map(get));
  const em={};for(const it of e3m.items){const f=e3f.items.find(i=>i.id===it.id);if(f?.approval?.status!=='approved')continue;
    em[it.id]={id:it.id,kind:'mountain',name:it.name,unit:it.unit,x:it.label.x,y:it.label.y,tapArea:it.tapArea,holes:[],soft:[],path:null,
      fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat}}
  for(const o of Object.values(em))o.area=o.tapArea.reduce((a,p)=>a+Math.abs(p.reduce((s,q,i)=>{const r=p[(i+1)%p.length];return s+q[0]*r[1]-r[0]*q[1]},0))/2,0);
  D.s9={facts:e3f,records:e3r.items.filter(r=>r.approval?.status==='approved'&&!r.disputed&&r.category!=='changing'),eu:em,intro:null,dict:e3d,geo:e3g};
  // Block 2 section 4 «Countries and capitals: west and north»: country outlines and the capital dots drawn on the Europe capitals map.
  const [e4f,e4r,e4m,e4d,e4g,e4c]=await Promise.all(['data/content/b2-section-4-facts.json','data/content/b2-section-4-records.json','data/maps/europe-countries.json',
    'data/dictionary/b2-section-4.json','data/geowords/b2-section-4.json','data/maps/europe-capitals.json'].map(get));
  const ec={};for(const it of e4m.items){const f=e4f.items.find(i=>i.id===it.id);if(f?.approval?.status!=='approved')continue;
    ec[it.id]={id:it.id,kind:'country',name:it.name,unit:it.unit,x:it.label.x,y:it.label.y,tapArea:it.tapArea,holes:[],soft:[],path:null,
      capital:{id:it.capital.id,name:f.capital,x:it.capital.x,y:it.capital.y},fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat}}
  for(const o of Object.values(ec))o.area=o.tapArea.reduce((a,p)=>a+Math.abs(p.reduce((s,q,i)=>{const r=p[(i+1)%p.length];return s+q[0]*r[1]-r[0]*q[1]},0))/2,0);
  // every dot drawn on the map answers a capital tap, also the dots of section 5
  D.s10={facts:e4f,records:e4r.items.filter(r=>r.approval?.status==='approved'&&!r.disputed&&r.category!=='changing'),eu:ec,intro:null,dict:e4d,geo:e4g,dots:e4c.capitals};
}
const dir=id=>D.dirs.find(d=>d.id===id);
const O=id=>D.objs[id];
const nm=id=>(D.s7&&D.s7.eu[id]?D.s7.eu[id].name:D.s8&&D.s8.eu[id]?D.s8.eu[id].name:D.s9&&D.s9.eu[id]?D.s9.eu[id].name:D.s10&&D.s10.eu[id]?D.s10.eu[id].name:D.s5&&D.s5.straits[id]?D.s5.straits[id].name:D.s4&&D.s4.seas[id]?D.s4.seas[id].name:D.s3&&D.s3.mtns[id]?D.s3.mtns[id].name:D.s2&&D.s2.rivers[id]?D.s2.rivers[id].name:O(id)?O(id).name:dir(id)?dir(id).name:D.lines[id]?D.lines[id].name:D.hemis[id].name)[L()];
const acc=id=>L()==='ru'?(ACC_RU[id]||nm(id)):(ACC_EN[id]||nm(id));
// a name inside a sentence («That is the Atlantic Ocean.»): English takes the article, Russian the plain name
const nameIn=id=>L()==='ru'?(IN_SENT_RU[id]||nm(id)):(ACC_EN[id]||nm(id));
const CONT=['asia','africa','north-america','south-america','antarctica','europe','australia'];
const RIVERS=['nile','amazon','mississippi','yangtze','huang-he','ganges','indus','danube','volga'];
const R=id=>D.s2.rivers[id];
const riverPath=r=>r.path.map(l=>'M'+l.map(q=>q[0]+' '+q[1]).join('L')).join('');
// distance in screen px from a tap (in % of the map) to the drawn river
function riverPx(r,x,y,W,H){let best=Infinity;for(const l of r.path)for(let i=1;i<l.length;i++){const ax=l[i-1][0]*W/100,ay=l[i-1][1]*H/100,bx=l[i][0]*W/100,by=l[i][1]*H/100,px=x*W/100,py=y*H/100;
  const dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy;let u=q?((px-ax)*dx+(py-ay)*dy)/q:0;u=Math.max(0,Math.min(1,u));best=Math.min(best,Math.hypot(px-ax-u*dx,py-ay-u*dy))}return best}
const nearestRiver=(x,y,sz,max)=>{let hit=null,d=max;for(const id of RIVERS){const v=riverPx(R(id),x,y,sz.W,sz.H);if(v<=d){d=v;hit=id}}return hit};
const riverLayers=()=>[...CONT.map(id=>O(id).layer),...RIVERS.map(id=>R(id).layer)];
const STRAITS=['suez-canal','panama-canal','strait-of-gibraltar','english-channel','bosporus','dardanelles','bab-el-mandeb','strait-of-hormuz','gulf-of-oman',
  'strait-of-malacca','mozambique-channel','bering-strait','drake-passage','strait-of-magellan'];
const ST=id=>D.s5.straits[id];
const straitLayers=()=>[...CONT.map(id=>O(id).layer),'world-canal-suez-canal','world-canal-panama-canal'];
const straitInsets=()=>Object.keys(D.s5.insets);
// world taps never answer an inset-only strait; `max` is the screen tolerance around a strait outline
// tapRule of world-straits.json: when several straits match (the Hormuz circle covers the whole Gulf of Oman), the nearest label on screen wins
function nearestStrait(x,y,sz,max){const lab=o=>Math.hypot((o.x-x)/100*sz.W,(o.y-y)/100*sz.H);
  const hits=STRAITS.map(ST).filter(o=>!o.inset&&(inside(o,x,y)||edgePx(o,x,y,sz.W,sz.H)<=max));
  return hits.length?hits.sort((a,b)=>lab(a)-lab(b))[0].id:null}
function nearInsetOnly(x,y,sz){return STRAITS.some(id=>ST(id).inset&&(inside(ST(id),x,y)||edgePx(ST(id),x,y,sz.W,sz.H)<=30))}
const SEAS=['mediterranean-sea','black-sea','red-sea','caspian-sea','arabian-sea','bay-of-bengal','coral-sea','caribbean-sea','gulf-of-mexico','hudson-bay'];
const W=id=>D.s4.seas[id];
const seaLayers=()=>CONT.map(id=>O(id).layer);
function nearestSea(x,y,sz,max){for(const id of SEAS)if(inside(W(id),x,y))return id;let hit=null,d=max;for(const id of SEAS){const v=edgePx(W(id),x,y,sz.W,sz.H);if(v<=d){d=v;hit=id}}return hit}
const MTNS=['himalayas','ural','cordillera','andes','appalachians','east-africa','great-dividing-range','atlas','caucasus','pyrenees','mid-atlantic-ridge'];
const M=id=>D.s3.mtns[id];
const mtnLayers=()=>[...CONT.map(id=>O(id).layer),...MTNS.map(id=>M(id).layer)];
// the range under the tap, else the nearest outline within `max` screen px
function nearestMtn(x,y,sz,max){for(const id of MTNS)if(inside(M(id),x,y))return id;let hit=null,d=max;for(const id of MTNS){const v=edgePx(M(id),x,y,sz.W,sz.H);if(v<=d){d=v;hit=id}}return hit}
const OCEANS=['pacific-ocean','atlantic-ocean','indian-ocean','arctic-ocean','southern-ocean'];

/* ---------- course: units, lessons (order of new objects), finals ---------- */
const U1L1=()=>[{k:'intro',dir:'north'},{k:'intro',dir:'south'},{k:'introLine',line:'equator'},
  {k:'find',dir:'north'},{k:'what',dir:'south',from:['north','south']},{k:'line',line:'equator'},{k:'find',dir:'south'},
  {k:'hemi',h:'n'},{k:'what',dir:'north',from:['north','south']},{k:'hemi',h:'s'}];
const U1L2=()=>[{k:'intro',dir:'west'},{k:'intro',dir:'east'},{k:'introLine',line:'prime-meridian'},
  {k:'find',dir:'west'},{k:'what',dir:'east',from:['north','south','east','west']},{k:'line',line:'prime-meridian'},{k:'find',dir:'east'},
  {k:'hemi',h:'e'},{k:'what',dir:'west',from:['north','south','east','west']},{k:'find',dir:'north'},{k:'line',line:'equator'},{k:'hemi',h:'w'}];
const objLesson=(news,review,kind)=>()=>{const pool=kind==='ocean'?OCEANS:CONT;const all=[...review,...news];const q=[];
  news.forEach(id=>q.push({k:'introObj',id}));
  news.forEach((id,i)=>{q.push({k:'findObj',id});q.push({k:'whatObj',id:news[(i+1)%news.length],from:pick(all.length>=3?all:pool,news[(i+1)%news.length],4)})});
  shuffle(review).slice(0,3).forEach(id=>q.push(Math.random()<.5?{k:'findObj',id}:{k:'whatObj',id,from:pick(all,id,4)}));
  return q};
const recordLesson=()=>{const q=[];for(const r of D.records){q.push({k:'introRec',rec:r.id});q.push({k:'findObj',id:r.object,rec:r.id})}return q};
const washedLesson=()=>shuffle([...CONT]).map(id=>({k:'washed',id}));
const mixLesson=()=>[{k:'line',line:'equator'},{k:'hemi',h:'n'},{k:'hemi',h:'s'},{k:'line',line:'prime-meridian'},{k:'hemi',h:'e'},{k:'hemi',h:'w'},
  ...shuffle([...CONT,...OCEANS]).slice(0,5).map(id=>Math.random()<.5?{k:'findObj',id}:{k:'whatObj',id,from:pick(O(id).kind==='ocean'?OCEANS:CONT,id,4)})];
const COURSE=[
 {n:1,lessons:[{id:'u1-l1',title:{ru:'Север, юг и экватор',en:'North, south and the Equator'},plan:U1L1},{id:'u1-l2',title:{ru:'Запад, восток и нулевой меридиан',en:'West, east and the Prime Meridian'},plan:U1L2}]},
 {n:2,lessons:[{id:'u2-l1',title:{ru:'Азия, Африка, Европа',en:'Asia, Africa, Europe'},plan:objLesson(['asia','africa','europe'],[],'continent')},
   {id:'u2-l2',title:{ru:'Две Америки',en:'The two Americas'},plan:objLesson(['north-america','south-america'],['asia','africa','europe'],'continent')},
   {id:'u2-l3',title:{ru:'Австралия и Антарктида',en:'Australia and Antarctica'},plan:objLesson(['australia','antarctica'],['asia','africa','europe','north-america','south-america'],'continent')}]},
 {n:3,lessons:[{id:'u3-l1',title:{ru:'Тихий, Атлантический, Индийский',en:'Pacific, Atlantic, Indian'},plan:objLesson(['pacific-ocean','atlantic-ocean','indian-ocean'],[],'ocean')},
   {id:'u3-l2',title:{ru:'Северный Ледовитый и Южный',en:'Arctic and Southern'},plan:objLesson(['arctic-ocean','southern-ocean'],['pacific-ocean','atlantic-ocean','indian-ocean'],'ocean')}]},
 {n:4,lessons:[{id:'u4-l1',title:{ru:'Кто кого омывает',en:'Which oceans wash each continent'},plan:washedLesson},
   {id:'u4-l2',title:{ru:'Рекорды',en:'Records'},plan:recordLesson},
   {id:'u4-l3',title:{ru:'Экватор и полушария',en:'The Equator and hemispheres'},plan:mixLesson}]}
];
// Section 2 «Rivers of the world» — lesson plan from the roadmap (draft for Svetlana's approval, 24.10.2026).
const rv=k=>id=>({k,id});
const pickKind=a=>a[Math.floor(Math.random()*a.length)];
const some=(ids,n)=>shuffle([...ids]).slice(0,n);
const R2={
 'u1-l1':()=>[rv('introRiver')('nile'),rv('introRiver')('amazon'),rv('findRiver')('nile'),rv('whatRiver')('amazon'),rv('riverCont')('nile'),
   rv('findRiver')('amazon'),rv('riverCont')('amazon'),rv('whatRiver')('nile'),{k:'findObj',id:'africa'},{k:'findObj',id:'south-america'}],
 'u1-l2':()=>[rv('introRiver')('mississippi'),rv('findRiver')('mississippi'),rv('whatRiver')('mississippi'),rv('riverCont')('mississippi'),
   rv('riverMouth')('nile'),rv('riverMouth')('amazon'),rv('riverMouth')('mississippi'),rv('findRiver')('nile'),rv('findRiver')('amazon'),rv('whatRiver')(some(['nile','amazon','mississippi'],1)[0])],
 'u2-l1':()=>[rv('introRiver')('yangtze'),rv('introRiver')('huang-he'),rv('findRiver')('yangtze'),rv('whatRiver')('huang-he'),rv('riverMouth')('yangtze'),
   rv('findRiver')('huang-he'),rv('riverMouth')('huang-he'),rv('whatRiver')('yangtze'),...some(['nile','amazon','mississippi'],2).map(rv('findRiver'))],
 'u2-l2':()=>[rv('introRiver')('ganges'),rv('introRiver')('indus'),rv('findRiver')('ganges'),rv('whatRiver')('indus'),rv('riverMouth')('ganges'),
   rv('findRiver')('indus'),rv('riverMouth')('indus'),rv('whatRiver')('ganges'),...some(['yangtze','huang-he'],2).map(rv('findRiver'))],
 'u2-l3':()=>[{k:'allAsia'},...shuffle(['yangtze','huang-he','ganges','indus'].map(rv('findRiver'))),...some(['yangtze','huang-he','ganges','indus'],2).map(rv('riverMouth')),
   ...some(['yangtze','huang-he','ganges','indus'],2).map(rv('whatRiver'))],
 'u3-l1':()=>[rv('introRiver')('danube'),rv('introRiver')('volga'),rv('findRiver')('danube'),rv('whatRiver')('volga'),rv('riverCont')('danube'),
   rv('findRiver')('volga'),rv('riverMouth')('danube'),rv('riverMouth')('volga'),...some(['nile','amazon','mississippi','yangtze','huang-he','ganges','indus'],2).map(rv('findRiver'))],
 'u3-l2':()=>D.s2.records.flatMap(r=>[{k:'introRiverRec',rec:r.id},{k:'findRiver',id:r.object,rec:r.id}]),
 // the section review asks about every river once (Svetlana, 25.10.2026: every learned object is practised)
 'u3-l3':()=>shuffle(RIVERS.map(id=>({k:pickKind(['findRiver','findRiver','whatRiver','riverCont','riverMouth']),id})))
};
const COURSE2=[
 {n:1,lessons:[{id:'s2-u1-l1',title:{ru:'Нил и Амазонка',en:'The Nile and the Amazon'},plan:R2['u1-l1']},{id:'s2-u1-l2',title:{ru:'Миссисипи и устья рек',en:'The Mississippi and river mouths'},plan:R2['u1-l2']}]},
 {n:2,lessons:[{id:'s2-u2-l1',title:{ru:'Янцзы и Хуанхэ',en:'The Yangtze and the Huang He'},plan:R2['u2-l1']},{id:'s2-u2-l2',title:{ru:'Ганг и Инд',en:'The Ganges and the Indus'},plan:R2['u2-l2']},
   {id:'s2-u2-l3',title:{ru:'Все реки Азии',en:'All the rivers of Asia'},plan:R2['u2-l3']}]},
 {n:3,lessons:[{id:'s2-u3-l1',title:{ru:'Дунай и Волга',en:'The Danube and the Volga'},plan:R2['u3-l1']},{id:'s2-u3-l2',title:{ru:'Рекорды рек',en:'River records'},plan:R2['u3-l2']},
   {id:'s2-u3-l3',title:{ru:'Все реки раздела',en:'All the rivers of the section'},plan:R2['u3-l3']}]}
];
// Section 3 «Mountains of the world» — lesson plan from the roadmap (draft for Svetlana's approval, 25.10.2026).
const mt=k=>id=>({k,id});
const R3={
 'u1-l1':()=>[mt('introMtn')('himalayas'),mt('introMtn')('ural'),mt('findMtn')('himalayas'),mt('whatMtn')('ural'),mt('mtnCont')('himalayas'),
   mt('findMtn')('ural'),mt('mtnBorder')('ural'),mt('whatMtn')('himalayas'),...some(RIVERS,2).map(rv('findRiver'))],
 'u1-l2':()=>[mt('introMtn')('cordillera'),mt('introMtn')('andes'),mt('findMtn')('cordillera'),mt('whatMtn')('andes'),mt('mtnCont')('cordillera'),
   mt('findMtn')('andes'),mt('mtnCont')('andes'),mt('whatMtn')('cordillera'),...some(['himalayas','ural'],2).map(mt('findMtn'))],
 'u2-l1':()=>[mt('introMtn')('appalachians'),mt('introMtn')('atlas'),mt('findMtn')('appalachians'),mt('whatMtn')('atlas'),mt('mtnCont')('appalachians'),
   mt('findMtn')('atlas'),mt('mtnCont')('atlas'),mt('whatMtn')('appalachians'),...some(['himalayas','ural','cordillera','andes'],2).map(mt('findMtn'))],
 'u2-l2':()=>[mt('introMtn')('east-africa'),mt('introMtn')('great-dividing-range'),mt('findMtn')('east-africa'),mt('whatMtn')('great-dividing-range'),
   mt('mtnCont')('east-africa'),mt('findMtn')('great-dividing-range'),mt('mtnCont')('great-dividing-range'),{k:'allAfrica'},mt('whatMtn')('east-africa'),...some(['appalachians','atlas'],1).map(mt('findMtn'))],
 'u3-l1':()=>[mt('introMtn')('caucasus'),mt('introMtn')('pyrenees'),mt('findMtn')('caucasus'),mt('whatMtn')('pyrenees'),mt('findMtn')('pyrenees'),
   mt('mtnCont')('pyrenees'),mt('whatMtn')('caucasus'),...some(['himalayas','ural','cordillera','andes','appalachians','east-africa','great-dividing-range','atlas'],3).map(mt('findMtn'))],
 'u3-l2':()=>[mt('introMtn')('mid-atlantic-ridge'),mt('findMtn')('mid-atlantic-ridge'),mt('mtnOcean')('mid-atlantic-ridge'),
   ...D.s3.records.flatMap(r=>[{k:'introMtnRec',rec:r.id},{k:'findMtn',id:r.object,rec:r.id}])],
 'u3-l3':()=>shuffle(MTNS.map(id=>({k:pickKind(['findMtn','findMtn','whatMtn',...(M(id).continent?['mtnCont']:[]),...(M(id).ocean?['mtnOcean']:[]),...(M(id).border?['mtnBorder']:[])]),id})))
};
const COURSE3=[
 {n:1,lessons:[{id:'s3-u1-l1',title:{ru:'Гималаи и Урал',en:'The Himalayas and the Urals'},plan:R3['u1-l1']},{id:'s3-u1-l2',title:{ru:'Кордильеры и Анды',en:'The Cordillera and the Andes'},plan:R3['u1-l2']}]},
 {n:2,lessons:[{id:'s3-u2-l1',title:{ru:'Аппалачи и Атлас',en:'The Appalachians and the Atlas'},plan:R3['u2-l1']},{id:'s3-u2-l2',title:{ru:'Восточная Африка и Австралия',en:'East Africa and Australia'},plan:R3['u2-l2']}]},
 {n:3,lessons:[{id:'s3-u3-l1',title:{ru:'Кавказ и Пиренеи',en:'The Caucasus and the Pyrenees'},plan:R3['u3-l1']},{id:'s3-u3-l2',title:{ru:'Хребет на дне океана и рекорды',en:'A ridge on the ocean floor and records'},plan:R3['u3-l2']},
   {id:'s3-u3-l3',title:{ru:'Все горы раздела',en:'All the mountains of the section'},plan:R3['u3-l3']}]}
];
// Section 4 «Seas of the world» — lesson plan from the roadmap (draft, 25.10.2026). The Mediterranean / Black Sea → Atlantic question comes right
// after the approved convention card (Svetlana, 25.10.2026); Hudson Bay's ocean is disputed and never asked.
const se=k=>id=>({k,id});
const R4={
 'u1-l1':()=>[se('introSea')('mediterranean-sea'),se('introSea')('black-sea'),se('findSea')('mediterranean-sea'),se('whatSea')('black-sea'),
   se('findSea')('black-sea'),se('whatSea')('mediterranean-sea'),{k:'seaCard'},se('seaOcean')('mediterranean-sea'),se('seaOcean')('black-sea'),mt('findMtn')(some(MTNS,1)[0])],
 'u1-l2':()=>[se('introSea')('red-sea'),se('introSea')('caspian-sea'),se('findSea')('red-sea'),se('whatSea')('caspian-sea'),se('seaOcean')('red-sea'),
   se('findSea')('caspian-sea'),se('seaOcean')('caspian-sea'),se('whatSea')('red-sea'),...some(['mediterranean-sea','black-sea'],2).map(se('findSea'))],
 'u2-l1':()=>[se('introSea')('arabian-sea'),se('introSea')('bay-of-bengal'),se('findSea')('arabian-sea'),se('whatSea')('bay-of-bengal'),se('seaOcean')('arabian-sea'),
   se('findSea')('bay-of-bengal'),se('seaOcean')('bay-of-bengal'),se('whatSea')('arabian-sea'),...some(['mediterranean-sea','black-sea','red-sea','caspian-sea'],2).map(se('findSea'))],
 'u2-l2':()=>[se('introSea')('coral-sea'),se('findSea')('coral-sea'),se('whatSea')('coral-sea'),se('seaOcean')('coral-sea'),{k:'allIndian'},
   ...some(['arabian-sea','bay-of-bengal','red-sea'],2).map(se('seaOcean')),...some(['mediterranean-sea','black-sea','red-sea','caspian-sea','arabian-sea','bay-of-bengal'],3).map(se('findSea'))],
 'u3-l1':()=>[se('introSea')('caribbean-sea'),se('introSea')('gulf-of-mexico'),se('findSea')('caribbean-sea'),se('whatSea')('gulf-of-mexico'),se('seaOcean')('caribbean-sea'),
   se('findSea')('gulf-of-mexico'),se('seaOcean')('gulf-of-mexico'),se('whatSea')('caribbean-sea'),...some(['red-sea','arabian-sea','bay-of-bengal','coral-sea'],2).map(se('findSea'))],
 'u3-l2':()=>[se('introSea')('hudson-bay'),se('findSea')('hudson-bay'),se('whatSea')('hudson-bay'),
   ...D.s4.records.flatMap(r=>[{k:'introSeaRec',rec:r.id},{k:'findSea',id:r.object,rec:r.id}])],
 'u3-l3':()=>shuffle(SEAS.map(id=>({k:pickKind(['findSea','findSea','whatSea',...(W(id).oceanUse==='yes'||(W(id).oceanUse==='after-card'&&S.learned.includes(W(id).card))?['seaOcean']:[])]),id})))
};
const COURSE4=[
 {n:1,lessons:[{id:'s4-u1-l1',title:{ru:'Средиземное и Чёрное',en:'The Mediterranean and the Black Sea'},plan:R4['u1-l1']},{id:'s4-u1-l2',title:{ru:'Красное и Каспийское',en:'The Red Sea and the Caspian'},plan:R4['u1-l2']}]},
 {n:2,lessons:[{id:'s4-u2-l1',title:{ru:'Аравийское море и Бенгальский залив',en:'The Arabian Sea and the Bay of Bengal'},plan:R4['u2-l1']},{id:'s4-u2-l2',title:{ru:'Коралловое море',en:'The Coral Sea'},plan:R4['u2-l2']}]},
 {n:3,lessons:[{id:'s4-u3-l1',title:{ru:'Карибское море и Мексиканский залив',en:'The Caribbean and the Gulf of Mexico'},plan:R4['u3-l1']},{id:'s4-u3-l2',title:{ru:'Гудзонов залив и рекорды',en:'Hudson Bay and records'},plan:R4['u3-l2']},
   {id:'s4-u3-l3',title:{ru:'Все моря раздела',en:'All the seas of the section'},plan:R4['u3-l3']}]}
];
// Section 5 «Straits and canals» — lesson plan from the roadmap (draft, 25.10.2026). The Bosporus, the Dardanelles and the Bering Strait are
// answered under the magnifier 🔍; Hormuz has no approved «connects» relation, so only find / name questions are asked for it.
const sk=k=>id=>({k,id});
const R5={
 'u1-l1':()=>[sk('introStrait')('suez-canal'),sk('introStrait')('panama-canal'),sk('findStrait')('suez-canal'),sk('whatStrait')('panama-canal'),sk('connects')('suez-canal'),
   sk('findStrait')('panama-canal'),sk('connects')('panama-canal'),sk('separates')('suez-canal'),sk('whatStrait')('suez-canal'),{k:'findSea',id:'red-sea'}],
 'u1-l2':()=>[sk('introStrait')('strait-of-gibraltar'),sk('introStrait')('english-channel'),sk('findStrait')('strait-of-gibraltar'),sk('whatStrait')('english-channel'),
   sk('connects')('strait-of-gibraltar'),sk('separates')('strait-of-gibraltar'),sk('findStrait')('english-channel'),{k:'seaOcean',id:'mediterranean-sea'},...some(['suez-canal','panama-canal'],2).map(sk('findStrait'))],
 'u1-l3':()=>[sk('introStrait')('bosporus'),sk('introStrait')('dardanelles'),sk('findStrait')('bosporus'),sk('whatStrait')('dardanelles'),sk('separates')('bosporus'),
   sk('findStrait')('dardanelles'),sk('separates')('dardanelles'),sk('whatStrait')('bosporus'),...some(['suez-canal','panama-canal','strait-of-gibraltar','english-channel'],2).map(sk('findStrait'))],
 'u2-l1':()=>[sk('introStrait')('bab-el-mandeb'),sk('introStrait')('strait-of-hormuz'),sk('introStrait')('gulf-of-oman'),sk('findStrait')('bab-el-mandeb'),sk('whatStrait')('strait-of-hormuz'),
   sk('connects')('bab-el-mandeb'),sk('findStrait')('strait-of-hormuz'),sk('findStrait')('gulf-of-oman'),sk('separates')('bab-el-mandeb'),sk('whatStrait')('gulf-of-oman')],
 'u2-l2':()=>[sk('introStrait')('strait-of-malacca'),sk('introStrait')('mozambique-channel'),sk('findStrait')('strait-of-malacca'),sk('whatStrait')('mozambique-channel'),
   sk('connects')('strait-of-malacca'),sk('findStrait')('mozambique-channel'),sk('whatStrait')('strait-of-malacca'),...some(['bab-el-mandeb','strait-of-hormuz','gulf-of-oman'],3).map(sk('findStrait'))],
 'u3-l1':()=>[sk('introStrait')('bering-strait'),sk('introStrait')('drake-passage'),sk('introStrait')('strait-of-magellan'),sk('findStrait')('bering-strait'),sk('separates')('bering-strait'),
   sk('findStrait')('drake-passage'),sk('separates')('drake-passage'),sk('findStrait')('strait-of-magellan'),sk('connects')('strait-of-magellan'),sk('whatStrait')('drake-passage')],
 'u3-l2':()=>[...D.s5.records.flatMap(r=>[{k:'introStraitRec',rec:r.id},{k:'findStrait',id:r.object,rec:r.id}]),sk('connects')('bering-strait'),
   ...some(STRAITS.filter(id=>ST(id).connects&&id!=='bering-strait'),5).map(sk('connects'))],
 'u3-l3':()=>shuffle(STRAITS.map(id=>({k:pickKind(['findStrait','findStrait','whatStrait',...(ST(id).connects?['connects']:[]),...(ST(id).separates?['separates']:[])]),id})))
};
const COURSE5=[
 {n:1,lessons:[{id:'s5-u1-l1',title:{ru:'Суэцкий и Панамский каналы',en:'The Suez and Panama Canals'},plan:R5['u1-l1']},{id:'s5-u1-l2',title:{ru:'Гибралтар и Ла-Манш',en:'Gibraltar and the English Channel'},plan:R5['u1-l2']},
   {id:'s5-u1-l3',title:{ru:'Босфор и Дарданеллы',en:'The Bosporus and the Dardanelles'},plan:R5['u1-l3']}]},
 {n:2,lessons:[{id:'s5-u2-l1',title:{ru:'Баб-эль-Мандеб, Ормуз и Оманский залив',en:'Bab-el-Mandeb, Hormuz and the Gulf of Oman'},plan:R5['u2-l1']},{id:'s5-u2-l2',title:{ru:'Малаккский и Мозамбикский проливы',en:'The Malacca Strait and the Mozambique Channel'},plan:R5['u2-l2']}]},
 {n:3,lessons:[{id:'s5-u3-l1',title:{ru:'Берингов, Дрейка, Магелланов',en:'Bering, Drake and Magellan'},plan:R5['u3-l1']},{id:'s5-u3-l2',title:{ru:'Рекорды и что соединяют проливы',en:'Records and what straits connect'},plan:R5['u3-l2']},
   {id:'s5-u3-l3',title:{ru:'Все проливы раздела',en:'All the straits of the section'},plan:R5['u3-l3']}]}
];
// Units with content approved by the author. Units 2-4 are built from approved data but their lessons are not approved yet.
// Unit 1 is approved; units 2-4 and the section final are drafts the author reviews in the app (24.10.2026).
const READY_UNITS=[1,2,3,4,'S'];
const STEPS=[];
COURSE.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`u${u.n}-practice`,kind:'practice',unit:u.n});STEPS.push({id:`u${u.n}-final`,kind:'final',unit:u.n})});
STEPS.push({id:'s1-final',kind:'section',unit:'S'});
COURSE2.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:2,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`s2-u${u.n}-practice`,sec:2,kind:'practice',unit:u.n});STEPS.push({id:`s2-u${u.n}-final`,sec:2,kind:'final',unit:u.n})});
STEPS.push({id:'s2-final',sec:2,kind:'section',unit:'S'});
COURSE3.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:3,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`s3-u${u.n}-practice`,sec:3,kind:'practice',unit:u.n});STEPS.push({id:`s3-u${u.n}-final`,sec:3,kind:'final',unit:u.n})});
STEPS.push({id:'s3-final',sec:3,kind:'section',unit:'S'});
COURSE4.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:4,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`s4-u${u.n}-practice`,sec:4,kind:'practice',unit:u.n});STEPS.push({id:`s4-u${u.n}-final`,sec:4,kind:'final',unit:u.n})});
STEPS.push({id:'s4-final',sec:4,kind:'section',unit:'S'});
COURSE5.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:5,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`s5-u${u.n}-practice`,sec:5,kind:'practice',unit:u.n});STEPS.push({id:`s5-u${u.n}-final`,sec:5,kind:'final',unit:u.n})});
STEPS.push({id:'s5-final',sec:5,kind:'section',unit:'S'});
// Block 1 review (data/review/block-1.json, approved 23.10.2026): no new objects; about 60% of the asked objects are the child's weakest
// (S.weak counts mistakes per object). Lessons «Land», «Water», «Connections», «Records»; then the block-final GeoWords and the Challenge (Speed Hunt).
const kindOf=id=>CONT.includes(id)?'continent':OCEANS.includes(id)?'ocean':RIVERS.includes(id)?'river':MTNS.includes(id)?'mountain':SEAS.includes(id)?'sea':'strait';
const anyObj=id=>({continent:O,ocean:O,river:R,mountain:M,sea:W,strait:ST})[kindOf(id)](id);
function weakPick(pool,n){const w=id=>S.weak[id]||0;const weak=shuffle(pool.filter(id=>w(id)>0)).sort((a,b)=>w(b)-w(a)).slice(0,Math.round(n*.6));
  return shuffle([...weak,...shuffle(pool.filter(id=>!weak.includes(id))).slice(0,n-weak.length)])}
const findTask=id=>({k:{continent:'findObj',ocean:'findObj',river:'findRiver',mountain:'findMtn',sea:'findSea',strait:'findStrait'}[kindOf(id)],id});
const whatTask=id=>{const k=kindOf(id);return k==='continent'||k==='ocean'?{k:'whatObj',id,from:pick(k==='ocean'?OCEANS:CONT,id,4)}:{k:{river:'whatRiver',mountain:'whatMtn',sea:'whatSea',strait:'whatStrait'}[k],id}};
// names a child can build from letter tiles: one or two words, at most 12 letters (spaces and hyphens are given)
const writable=id=>{const n=anyObj(id).name[L()];return n.split(/\s+/).length<=2&&n.replace(/[\s-]/g,'').length<=12&&!(anyObj(id).inset)};
const reviewObjLesson=groups=>()=>{const pool=groups.flatMap(([,ids])=>ids);
  const f=weakPick(pool,4),w=weakPick(pool.filter(id=>!f.includes(id)),3);
  return [...shuffle([...f.map(findTask),...w.map(whatTask)]),{k:'label',kinds:groups.map(([k])=>k)},...weakPick(pool.filter(writable),2).map(id=>({k:'write',id}))]};
// true / false: one statement of a pair per lesson; never more than two identical answers in a row
function tfTasks(n){const ok=p=>{const r=D.b.rev.relations.find(q=>q.subject===p.subject&&q.relation===p.relation);return p.approval?.status==='approved'&&(!r||r.use==='yes'||(r.use==='after-card'&&S.learned.includes(r.requiresCard)))};
  const ps=shuffle(D.b.rev.trueFalse.pairs.filter(ok)).slice(0,n);let sides;
  do sides=ps.map(()=>Math.random()<.5?'true':'false');while(sides.some((v,i)=>i>=2&&v===sides[i-1]&&v===sides[i-2]));
  return ps.map((p,i)=>({k:'tf',pair:p.id,side:sides[i]}))}
const reviewRelLesson=()=>[...['flowsInto','inOcean','onContinent','separates'].map(rel=>({k:'pairs',rel})),
  {k:'allAsia',all:true},{k:'allIndian',all:true},{k:'allAfrica',all:true},...tfTasks(2),{k:'seaOcean',id:'caspian-sea'}];
// Lesson 4 «Records» (records.items, approved 26.10.2026): 4 true/false, 3 pairs of 3 (place ↔ nameless clue), 2 «find it by the clue»,
// 1 «what is it by the clue». Each record at most once per lesson; records about the child's weakest places come first.
function recordsLesson(){const w=r=>S.weak[r.object]||0;
  const order=shuffle(D.b.rev.records.items.filter(r=>r.approval?.status==='approved')).sort((a,b)=>w(b)-w(a));
  const tf=order.splice(0,4),find=order.splice(0,2),what=order.splice(0,1),groups=[];
  for(let g=0;g<3;g++){const grp=[];for(const r of [...order])if(grp.length<3&&!grp.some(p=>p.object===r.object)){grp.push(r);order.splice(order.indexOf(r),1)}groups.push(grp)}
  const rec=r=>({id:r.object,clue:r.clue,say:r.true});
  const plan=shuffle([...tf.map(r=>({k:'recTf',rec:r.id,id:r.object})),...groups.map(g=>({k:'recPairs',recs:g.map(r=>r.id)})),
    ...find.map(r=>({...findTask(r.object),...rec(r)})),...what.map(r=>({k:'recWhat',rec:r.id,...rec(r)}))]);
  // sides in lesson order: never three identical answers in a row
  let sides;do sides=tf.map(()=>Math.random()<.5?'true':'false');while(sides.some((v,i)=>i>=2&&v===sides[i-1]&&v===sides[i-2]));
  plan.filter(q=>q.k==='recTf').forEach((q,i)=>q.side=sides[i]);return plan}
const COURSE_B=[{id:'b-l1',title:{ru:'Суша',en:'Land'},plan:reviewObjLesson([['continent',CONT],['mountain',MTNS],['river',RIVERS]])},
  {id:'b-l2',title:{ru:'Вода',en:'Water'},plan:reviewObjLesson([['ocean',OCEANS],['sea',SEAS],['strait',STRAITS]])},
  {id:'b-l3',title:{ru:'Связи',en:'Connections'},plan:reviewRelLesson},
  {id:'b-l4',title:{ru:'Рекорды',en:'Records'},plan:recordsLesson}];
COURSE_B.forEach((l,i)=>STEPS.push({id:l.id,sec:6,kind:'lesson',unit:'B',n:i+1,title:l.title,plan:l.plan}));
STEPS.push({id:'b-final',sec:6,kind:'block',unit:'B'});
STEPS.push({id:'b-challenge',sec:6,kind:'challenge',unit:'B'});
// Block 2 «Europe», section 1 «Europe on the map» (content approved by Svetlana 26.10.2026). Lessons only for now: the unit / section GeoWords
// come once their words are approved. All objects sit on the Europe base map; the Ural River and the Ural Mountains are always drawn on it.
const EU_IDS=['atlantic-ocean','arctic-ocean','mediterranean-sea','ural-mountains','ural-river','caspian-sea','scandinavian-peninsula','kola-peninsula','jutland',
  'iberian-peninsula','apennine-peninsula','balkan-peninsula','crimean-peninsula','great-britain','ireland','iceland','sicily','baltic-sea','north-sea','barents-sea'];
// the Europe section being played (7: Europe on the map, 8: Rivers of Europe, 9: Mountains of Europe, 10: Countries and capitals: west and north); set when a lesson, practice or final starts
let EUSEC=7;
const E=id=>D.s7.eu[id]||D.s8.eu[id]||D.s9.eu[id]||D.s10.eu[id];
const EU8_IDS=['volga','don','dnieper','dniester','danube','rhine','elbe','oder','vistula','thames','seine','loire','rhone','po','tiber','tagus','douro','guadiana','ebro','guadalquivir'];
// section 2 judges a tap against its rivers and the Ural River (drawn on the rivers map too)
const EU9_IDS=['pyrenees','alps','apennines','carpathians','balkan-mountains','dinaric-alps','scandinavian-mountains','scottish-highlands','caucasus'];
// section 3 judges a tap against its ranges and the Ural Mountains (drawn on the mountains map too)
const EU10_IDS=['united-kingdom','ireland-country','france','netherlands','belgium','luxembourg-country','spain','portugal','norway','sweden','denmark','finland','iceland-country'];
// section 4 judges a tap against its countries only
const EU=()=>EUSEC===10?EU10_IDS.filter(id=>E(id)):EUSEC===9?[...EU9_IDS,'ural-mountains'].filter(id=>E(id)):EUSEC===8?[...EU8_IDS,'ural-river'].filter(id=>E(id)):EU_IDS.filter(id=>D.s7.eu[id]);
const EUD=()=>D['s'+EUSEC];
const eu=k=>id=>({k,id});
const R7={
 'u1-l1':()=>[{k:'introEurope'},...['atlantic-ocean','arctic-ocean','mediterranean-sea'].map(eu('introEu')),eu('findEu')('atlantic-ocean'),eu('whatEu')('arctic-ocean'),
   eu('findEu')('mediterranean-sea'),eu('whatEu')('atlantic-ocean'),eu('findEu')('arctic-ocean'),eu('whatEu')('mediterranean-sea')],
 'u1-l2':()=>[...['ural-mountains','ural-river','caspian-sea'].map(eu('introEu')),eu('findEu')('ural-mountains'),eu('whatEu')('ural-river'),eu('findEu')('caspian-sea'),
   eu('findEu')('ural-river'),eu('whatEu')('ural-mountains'),eu('whatEu')('caspian-sea'),...some(['atlantic-ocean','arctic-ocean','mediterranean-sea'],2).map(eu('findEu'))],
 'u2-l1':()=>[...['scandinavian-peninsula','kola-peninsula','jutland'].map(eu('introEu')),eu('findEu')('scandinavian-peninsula'),eu('whatEu')('kola-peninsula'),
   eu('findEu')('jutland'),eu('whatEu')('scandinavian-peninsula'),eu('findEu')('kola-peninsula'),eu('whatEu')('jutland'),...some(['ural-mountains','ural-river','caspian-sea'],1).map(eu('findEu'))],
 'u2-l2':()=>[...['iberian-peninsula','apennine-peninsula','balkan-peninsula','crimean-peninsula'].map(eu('introEu')),eu('findEu')('iberian-peninsula'),eu('whatEu')('apennine-peninsula'),
   eu('findEu')('balkan-peninsula'),eu('findEu')('crimean-peninsula'),eu('whatEu')('iberian-peninsula'),eu('findEu')('apennine-peninsula'),eu('whatEu')('balkan-peninsula')],
 'u2-l3':()=>[{k:'allPen'},...shuffle(EU_IDS.filter(id=>E(id).kind==='peninsula').map(eu('findEu'))),...some(EU_IDS.filter(id=>E(id).kind==='peninsula'),2).map(eu('whatEu'))],
 'u3-l1':()=>[...['great-britain','ireland','iceland','sicily'].map(eu('introEu')),eu('findEu')('great-britain'),eu('whatEu')('ireland'),eu('findEu')('iceland'),
   eu('findEu')('sicily'),eu('whatEu')('great-britain'),eu('findEu')('ireland'),...some(EU_IDS.filter(id=>E(id).unit<3),1).map(eu('findEu'))],
 'u3-l2':()=>[...['baltic-sea','north-sea','barents-sea'].map(eu('introEu')),eu('findEu')('baltic-sea'),eu('whatEu')('north-sea'),eu('findEu')('barents-sea'),
   eu('findEu')('north-sea'),eu('whatEu')('barents-sea'),eu('whatEu')('baltic-sea'),...some(['great-britain','ireland','iceland','sicily'],2).map(eu('findEu'))],
 'u3-l3':()=>[...D.s7.records.flatMap(r=>[{k:'introEuRec',rec:r.id},{k:'findEu',id:r.object,rec:r.id}]),...some(EU_IDS.filter(id=>!D.s7.records.some(r=>r.object===id)),4).map(eu('findEu'))],
 // the section review asks about every object once (Svetlana, 25.10.2026: every learned object is practised)
 'u3-l4':()=>shuffle(EU().map(id=>({k:pickKind(['findEu','findEu','whatEu']),id})))
};
const COURSE7=[
 {n:1,lessons:[{id:'e1-u1-l1',title:{ru:'Океаны и море вокруг Европы',en:'The oceans and the sea around Europe'},plan:R7['u1-l1']},{id:'e1-u1-l2',title:{ru:'Урал и Каспий',en:'The Urals and the Caspian'},plan:R7['u1-l2']}]},
 {n:2,lessons:[{id:'e1-u2-l1',title:{ru:'Скандинавия, Кольский и Ютландия',en:'Scandinavia, Kola and Jutland'},plan:R7['u2-l1']},
   {id:'e1-u2-l2',title:{ru:'Пиренейский, Апеннинский, Балканский, Крымский',en:'Iberian, Apennine, Balkan, Crimean'},plan:R7['u2-l2']},{id:'e1-u2-l3',title:{ru:'Все полуострова',en:'All the peninsulas'},plan:R7['u2-l3']}]},
 {n:3,lessons:[{id:'e1-u3-l1',title:{ru:'Острова',en:'Islands'},plan:R7['u3-l1']},{id:'e1-u3-l2',title:{ru:'Балтийское, Северное, Баренцево',en:'The Baltic, North and Barents Seas'},plan:R7['u3-l2']},
   {id:'e1-u3-l3',title:{ru:'Рекорды',en:'Records'},plan:R7['u3-l3']},{id:'e1-u3-l4',title:{ru:'Все объекты раздела',en:'All the places of the section'},plan:R7['u3-l4']}]}
];
COURSE7.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:7,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`e1-u${u.n}-practice`,sec:7,kind:'practice',unit:u.n});STEPS.push({id:`e1-u${u.n}-final`,sec:7,kind:'final',unit:u.n})});
STEPS.push({id:'e1-final',sec:7,kind:'section',unit:'S'});
// Block 2 section 2 «Rivers of Europe» (plan, facts and words approved by Svetlana 27.10.2026): 20 rivers in 4 units, the Ural River reviewed.
const U8=n=>EU8_IDS.filter(id=>E(id)&&E(id).unit===n);
// a memory-trick card (kind "tip" in the facts) follows the introductions once all its rivers are known
const riv=(ids,rev,tip)=>()=>[...ids.map(eu('introEu')),...(tip?[{k:'tipEu',id:tip}]:[]),...shuffle(ids.flatMap(id=>[eu('findEu')(id),eu('whatEu')(id)])),...rev()];
const R8={
 'u1-l1':riv(['volga','don'],()=>[]),
 'u1-l2':riv(['dnieper','dniester','danube'],()=>[eu('findEu')('ural-river'),...some(['volga','don'],1).map(eu('findEu'))]),
 'u2-l1':riv(['rhine','elbe'],()=>some(U8(1),2).map(eu('findEu'))),
 'u2-l2':riv(['oder','vistula'],()=>some(['rhine','elbe'],2).map(eu('whatEu')),'tip-rhine-elbe-oder-vistula'),
 'u3-l1':riv(['thames','seine'],()=>some(U8(2),2).map(eu('findEu'))),
 'u3-l2':riv(['loire','rhone'],()=>some(['thames','seine'],2).map(eu('whatEu'))),
 'u4-l1':riv(['po','tiber','ebro'],()=>some(U8(3),1).map(eu('findEu'))),
 'u4-l2':riv(['tagus','douro','guadiana','guadalquivir'],()=>[]),
 'u4-l3':()=>[...D.s8.records.flatMap(r=>[{k:'introEuRec',rec:r.id},{k:'findEu',id:r.object,rec:r.id}]),...some(EU8_IDS.filter(id=>E(id)&&!D.s8.records.some(r=>r.object===id)),4).map(eu('findEu'))],
 'u4-l4':()=>shuffle(EU().map(id=>({k:pickKind(['findEu','findEu','whatEu']),id})))
};
const COURSE8=[
 {n:1,lessons:[{id:'e2-u1-l1',title:{ru:'Волга и Дон',en:'The Volga and the Don'},plan:R8['u1-l1']},{id:'e2-u1-l2',title:{ru:'Днепр, Днестр и Дунай',en:'The Dnieper, the Dniester and the Danube'},plan:R8['u1-l2']}]},
 {n:2,lessons:[{id:'e2-u2-l1',title:{ru:'Рейн и Эльба',en:'The Rhine and the Elbe'},plan:R8['u2-l1']},{id:'e2-u2-l2',title:{ru:'Одер и Висла',en:'The Oder and the Vistula'},plan:R8['u2-l2']}]},
 {n:3,lessons:[{id:'e2-u3-l1',title:{ru:'Темза и Сена',en:'The Thames and the Seine'},plan:R8['u3-l1']},{id:'e2-u3-l2',title:{ru:'Луара и Рона',en:'The Loire and the Rhône'},plan:R8['u3-l2']}]},
 {n:4,lessons:[{id:'e2-u4-l1',title:{ru:'По, Тибр и Эбро',en:'The Po, the Tiber and the Ebro'},plan:R8['u4-l1']},
   {id:'e2-u4-l2',title:{ru:'Тахо, Дуэро, Гвадиана и Гвадалквивир',en:'The Tagus, Douro, Guadiana and Guadalquivir'},plan:R8['u4-l2']},
   {id:'e2-u4-l3',title:{ru:'Рекорды',en:'Records'},plan:R8['u4-l3']},{id:'e2-u4-l4',title:{ru:'Все реки раздела',en:'All the rivers of the section'},plan:R8['u4-l4']}]}
];
COURSE8.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:8,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`e2-u${u.n}-practice`,sec:8,kind:'practice',unit:u.n});STEPS.push({id:`e2-u${u.n}-final`,sec:8,kind:'final',unit:u.n})});
STEPS.push({id:'e2-final',sec:8,kind:'section',unit:'S'});
// Block 2 section 3 «Mountains of Europe»: 9 ranges in 3 units, the Ural Mountains reviewed; the Caucasus is disputed (Svetlana, 26.10.2026).
const U9=n=>EU9_IDS.filter(id=>E(id)&&E(id).unit===n);
const R9={
 'u1-l1':riv(['pyrenees','alps'],()=>[]),
 'u1-l2':riv(['apennines'],()=>[...['pyrenees','alps'].map(eu('findEu')),...some(['pyrenees','alps'],1).map(eu('whatEu'))]),
 'u2-l1':riv(['carpathians','balkan-mountains'],()=>some(U9(1),2).map(eu('findEu'))),
 'u2-l2':riv(['dinaric-alps'],()=>[...['carpathians','balkan-mountains'].map(eu('findEu')),...some(U9(1),1).map(eu('whatEu'))]),
 'u3-l1':riv(['scandinavian-mountains','scottish-highlands'],()=>[eu('findEu')('ural-mountains'),...some(U9(2),1).map(eu('findEu'))]),
 'u3-l2':riv(['caucasus'],()=>[...some(['scandinavian-mountains','scottish-highlands'],2).map(eu('whatEu')),...some([...U9(1),...U9(2)],2).map(eu('findEu'))]),
 'u3-l3':()=>[...D.s9.records.flatMap(r=>[{k:'introEuRec',rec:r.id},{k:'findEu',id:r.object,rec:r.id}]),...some(EU9_IDS.filter(id=>E(id)&&!D.s9.records.some(r=>r.object===id)),4).map(eu('findEu'))],
 'u3-l4':()=>shuffle(EU().map(id=>({k:pickKind(['findEu','findEu','whatEu']),id})))
};
const COURSE9=[
 {n:1,lessons:[{id:'e3-u1-l1',title:{ru:'Пиренеи и Альпы',en:'The Pyrenees and the Alps'},plan:R9['u1-l1']},{id:'e3-u1-l2',title:{ru:'Апеннины',en:'The Apennines'},plan:R9['u1-l2']}]},
 {n:2,lessons:[{id:'e3-u2-l1',title:{ru:'Карпаты и Балканские горы',en:'The Carpathians and the Balkan Mountains'},plan:R9['u2-l1']},{id:'e3-u2-l2',title:{ru:'Динарское нагорье',en:'The Dinaric Alps'},plan:R9['u2-l2']}]},
 {n:3,lessons:[{id:'e3-u3-l1',title:{ru:'Скандинавские горы, Шотландское нагорье и Урал',en:'The Scandinavian Mountains, the Scottish Highlands and the Urals'},plan:R9['u3-l1']},
   {id:'e3-u3-l2',title:{ru:'Кавказ',en:'The Caucasus'},plan:R9['u3-l2']},
   {id:'e3-u3-l3',title:{ru:'Рекорды',en:'Records'},plan:R9['u3-l3']},{id:'e3-u3-l4',title:{ru:'Все горы раздела',en:'All the mountains of the section'},plan:R9['u3-l4']}]}
];
COURSE9.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:9,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`e3-u${u.n}-practice`,sec:9,kind:'practice',unit:u.n});STEPS.push({id:`e3-u${u.n}-final`,sec:9,kind:'final',unit:u.n})});
STEPS.push({id:'e3-final',sec:9,kind:'section',unit:'S'});
// Block 2 section 4 «Countries and capitals: west and north»: 13 countries in 3 units on the capitals map; Crimea never appears (Svetlana, 26.10.2026).
// Each country: its card (country, capital, fact), then «find the country», «find the capital» and one of «capital of which country?» / «which capital?».
const U10=n=>EU10_IDS.filter(id=>E(id)&&E(id).unit===n);
const cty=(ids,rev)=>()=>[...ids.map(eu('introEu')),...shuffle(ids.flatMap(id=>[eu('findEu')(id),eu('findCap')(id),eu(pickKind(['capOf','whatCap']))(id)])),...rev()];
const R10={
 'u1-l1':cty(['united-kingdom','ireland-country'],()=>[]),
 'u1-l2':cty(['france'],()=>[...['united-kingdom','ireland-country'].map(eu('findCap')),...some(['united-kingdom','ireland-country'],1).map(eu('capOf'))]),
 'u2-l1':cty(['netherlands','belgium','luxembourg-country'],()=>some(U10(1),2).map(eu('findEu'))),
 'u2-l2':cty(['spain','portugal'],()=>[...some(['netherlands','belgium','luxembourg-country'],2).map(eu('findCap')),...some(U10(1),1).map(eu('capOf'))]),
 'u3-l1':cty(['norway','sweden','denmark'],()=>some([...U10(1),...U10(2)],2).map(eu('findEu'))),
 'u3-l2':cty(['finland','iceland-country'],()=>[...some(['norway','sweden','denmark'],2).map(eu('findCap')),...some([...U10(1),...U10(2)],2).map(eu('whatCap'))]),
 'u3-l3':()=>[...D.s10.records.flatMap(r=>[{k:'introEuRec',rec:r.id},{k:'findEu',id:r.object,rec:r.id}]),...some(EU10_IDS.filter(id=>E(id)&&!D.s10.records.some(r=>r.object===id)),4).map(eu('findCap'))],
 'u3-l4':()=>shuffle(EU().map(id=>({k:pickKind(['findEu','findCap','capOf','whatCap']),id})))
};
const COURSE10=[
 {n:1,lessons:[{id:'e4-u1-l1',title:{ru:'Великобритания и Ирландия',en:'The United Kingdom and Ireland'},plan:R10['u1-l1']},{id:'e4-u1-l2',title:{ru:'Франция',en:'France'},plan:R10['u1-l2']}]},
 {n:2,lessons:[{id:'e4-u2-l1',title:{ru:'Нидерланды, Бельгия и Люксембург',en:'The Netherlands, Belgium and Luxembourg'},plan:R10['u2-l1']},{id:'e4-u2-l2',title:{ru:'Испания и Португалия',en:'Spain and Portugal'},plan:R10['u2-l2']}]},
 {n:3,lessons:[{id:'e4-u3-l1',title:{ru:'Норвегия, Швеция и Дания',en:'Norway, Sweden and Denmark'},plan:R10['u3-l1']},
   {id:'e4-u3-l2',title:{ru:'Финляндия и Исландия',en:'Finland and Iceland'},plan:R10['u3-l2']},
   {id:'e4-u3-l3',title:{ru:'Рекорды',en:'Records'},plan:R10['u3-l3']},{id:'e4-u3-l4',title:{ru:'Все страны раздела',en:'All the countries of the section'},plan:R10['u3-l4']}]}
];
COURSE10.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:10,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));
  STEPS.push({id:`e4-u${u.n}-practice`,sec:10,kind:'practice',unit:u.n});STEPS.push({id:`e4-u${u.n}-final`,sec:10,kind:'final',unit:u.n})});
STEPS.push({id:'e4-final',sec:10,kind:'section',unit:'S'});
// Section 2 lessons are a draft: playable for review (after section 1, or with «Unlock every step»).
const READY_S2=[1,2,3,'S'];
const stepOf=id=>STEPS.find(s=>s.id===id);
const READY_S3=[1,2,3,'S'];
const READY_S4=[1,2,3,'S'];
const READY_S5=[1,2,3,'S'];
// Europe finals open once Svetlana has approved the puzzle in the chosen language
const euFinal=s=>SD(s).geo.puzzles.find(p=>p.language===L()&&p.approval?.status==='approved'&&(s.kind==='section'?p.role==='section-final':p.role==='unit-final'&&p.unit===s.unit));
const ready=s=>s.sec===6?true:s.sec===7?(s.kind==='final'||s.kind==='section'?!!euFinal(s):true):s.sec===8?ready8(s):s.sec===9?ready9(s):s.sec===10?ready10(s):s.sec===5?READY_S5.includes(s.unit):s.sec===4?READY_S4.includes(s.unit):s.sec===3?READY_S3.includes(s.unit):s.sec===2?READY_S2.includes(s.unit):READY_UNITS.includes(s.unit);
const SD=st=>D['s'+st.sec];
// section 2 of Europe: a lesson once its rivers are approved, practice once the unit has approved words, finals once Svetlana approved the puzzle
const ready8=s=>s.kind==='final'||s.kind==='section'?!!euFinal(s):s.kind==='practice'?D.s8.dict.units[s.unit-1].words[L()].some(w=>w.role==='review'&&w.approval?.status==='approved'):EU8_IDS.every(id=>D.s8.eu[id]);
// section 3 of Europe: the same, with its ranges
const ready9=s=>s.kind==='final'||s.kind==='section'?!!euFinal(s):s.kind==='practice'?D.s9.dict.units[s.unit-1].words[L()].some(w=>w.role==='review'&&w.approval?.status==='approved'):EU9_IDS.every(id=>D.s9.eu[id]);
// section 4 of Europe: the same, with its countries
const ready10=s=>s.kind==='final'||s.kind==='section'?!!euFinal(s):s.kind==='practice'?D.s10.dict.units[s.unit-1].words[L()].some(w=>w.role==='review'&&w.approval?.status==='approved'):EU10_IDS.every(id=>D.s10.eu[id]);
// a step waiting for approval (a Europe final) is skipped: the trail goes on past it
function unlocked(id){const st=stepOf(id);if(!ready(st))return false;if(S.unlockAll||S.done[id])return true;let i=STEPS.findIndex(s=>s.id===id)-1;while(i>=0&&!ready(STEPS[i]))i--;return i<0||!!S.done[STEPS[i].id]}
const nextStep=id=>{let i=STEPS.findIndex(s=>s.id===id)+1;while(STEPS[i]&&!ready(STEPS[i]))i++;const n=STEPS[i];return n&&unlocked(n.id)?n:null};
const titleOf=s=>s.kind==='lesson'?t().lessonN(s.n)+' · '+s.title[L()]:s.kind==='practice'?t().practiceStep:s.kind==='final'?t().final:s.kind==='block'?t().blockFinal:s.kind==='challenge'?t().challenge:t().sectionFinal;

/* ---------- small helpers ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pick(pool,must,n){return shuffle([must,...shuffle(pool.filter(x=>x!==must)).slice(0,n-1)])}
const app=document.getElementById('app');
const h=html=>{app.innerHTML=html;window.scrollTo(0,0)};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function sheet(inner){const b=document.createElement('div');b.className='sheet-back';b.innerHTML=`<div class="sheet" role="dialog" aria-modal="true">${inner}</div>`;
  b.addEventListener('click',e=>{if(e.target===b)b.remove()});document.body.appendChild(b);return b}
const inPoly=(x,y,p)=>{let c=false;for(let i=0,k=p.length-1;i<p.length;k=i++){const [xi,yi]=p[i],[xk,yk]=p[k];if((yi>y)!==(yk>y)&&x<(xk-xi)*(y-yi)/(yk-yi)+xi)c=!c}return c};
const inside=(o,x,y)=>o.tapArea.some(p=>inPoly(x,y,p))&&!o.holes.some(p=>inPoly(x,y,p));
function edgePx(o,x,y,W,H){let best=Infinity;for(const p of o.tapArea)for(let i=0,k=p.length-1;i<p.length;k=i++){const ax=p[k][0]*W/100,ay=p[k][1]*H/100,bx=p[i][0]*W/100,by=p[i][1]*H/100,px=x*W/100,py=y*H/100;
  const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let u=l?((px-ax)*dx+(py-ay)*dy)/l:0;u=Math.max(0,Math.min(1,u));best=Math.min(best,Math.hypot(px-ax-u*dx,py-ay-u*dy))}return best}
const areaPath=o=>[...o.tapArea,...o.holes].map(p=>'M'+p.map(q=>q[0]+' '+q[1]).join('L')+'Z').join('');
const learnedLayers=()=>CONT.filter(id=>S.learned.includes(id)).map(id=>O(id).layer);

/* ---------- block 2 section 1: Europe on the map ---------- */
// distance in screen px from a tap to an object: 0 inside its outline (or within 8 px of the drawn river), else to its edge / line
function euDist(o,x,y,sz){if(o.path)return Math.max(0,riverPx(o,x,y,sz.W,sz.H)-8);return inside(o,x,y)?0:edgePx(o,x,y,sz.W,sz.H)}
const inSoft=(o,x,y)=>o.soft.some(p=>inPoly(x,y,p));
// the object a tap answers: the river under the finger, else the smallest outline around the tap (the Barents Sea inside the Arctic Ocean),
// else the nearest outline within 22 px
function euHit(x,y,sz,pool=EU()){const os=pool.map(E);
  const riv=os.filter(o=>o.path&&euDist(o,x,y,sz)===0).sort((a,b)=>riverPx(a,x,y,sz.W,sz.H)-riverPx(b,x,y,sz.W,sz.H))[0];if(riv)return riv.id;
  const inn=os.filter(o=>!o.path&&inside(o,x,y)).sort((a,b)=>a.area-b.area);if(inn.length)return inn[0].id;
  let hit=null,d=22;for(const o of os){const v=euDist(o,x,y,sz);if(v<=d){d=v;hit=o.id}}return hit}
// right: inside the asked object (or its soft area: the Norwegian Sea for the Atlantic), or within 22 px of it when the tap is not inside
// another object of the section — objects that contain the asked one (the Arctic Ocean around the Barents Sea) do not count against it.
// For land (a peninsula, an island, the Urals) the sea around it never counts against it: a finger that lands just off the coast of
// Jutland is a tap on Jutland, unless other land is nearer (Svetlana, 26.10.2026: a tap on Jutland was judged «the Baltic Sea»).
const EU_LAND=['peninsula','island','mountain','country'];
// Rivers of Europe: the nearest drawn river answers a tap (within 30 px), so a tap on the Tagus never counts for the Douro next to it
function euOk(id,x,y,sz){const o=E(id);if(EUSEC===8&&o.path){const r=riverPx(o,x,y,sz.W,sz.H);return r<=30&&!EU().some(k=>k!==id&&riverPx(E(k),x,y,sz.W,sz.H)<r)}
  const d=euDist(o,x,y,sz);if(d===0||inSoft(o,x,y))return true;if(d>22)return false;
  const land=EU_LAND.includes(o.kind);
  // a river (section 2: every object is a river) is right when no other river is nearer to the tap
  return !EU().some(k=>{if(k===id)return false;const q=E(k),v=euDist(q,x,y,sz);
    if(land&&!EU_LAND.includes(q.kind))return false;
    return land||o.path?v<d:v===0&&!(q.tapArea.length&&inside(q,o.x,o.y))})}
// answer options of the same family: unit 1 (oceans, sea, the Urals and the Caspian), peninsulas, islands, the seas and oceans of the section
const euFamily=id=>{const o=E(id);if(EUSEC>=8)return EU().filter(k=>E(k).unit<=o.unit);return EU().filter(k=>o.unit===1?E(k).unit===1:o.kind==='peninsula'||o.kind==='island'?E(k).kind===o.kind:['sea','ocean'].includes(E(k).kind))};
const showEu=(m,o,cls)=>o.path?m.line(riverPath(o),cls.replace('hl-shape','hl-river')):m.shape(o,cls);
// a ring around a capital dot drawn on the map (round on screen: the map is 2200×1600)
const capRing=(c,r=1.3)=>({id:'cap-'+c.id,tapArea:[Array.from({length:20},(_,i)=>[c.x+r*Math.cos(i*Math.PI/10),c.y+r*2200/1600*Math.sin(i*Math.PI/10)])],holes:[]});
// the drawn dot a tap lands on: the nearest within 24 px (every dot of the map counts, also those of section 5)
function capHit(x,y,sz){let hit=null,d=24;for(const c of D.s10.dots){const v=Math.hypot((c.x-x)/100*sz.W,(c.y-y)/100*sz.H);if(v<=d){d=v;hit=c.id}}return hit}
const capOwner=cid=>EU10_IDS.map(E).find(o=>o&&o.capital.id===cid);
function euMap(host,opts){const m=mapWidget(host,{...opts,base:EUSEC===10?IMG.euCountriesRivers:EUSEC===9?IMG.euMountains:EUSEC===8?IMG.euRivers:IMG.euBase,aspect:'2200/1600'});
  // section 1 draws the Ural River and Mountains on the blank map; the rivers map of section 2 has every river drawn already
  const statics=()=>{if(EUSEC!==7)return;m.shape(E('ural-mountains'),'eu-mtn');m.line(riverPath(E('ural-river')),'eu-river')};statics();
  const clear=m.clearShapes;m.clearShapes=()=>{clear();statics()};return m}

/* ---------- map widget: base + layers + highlight shapes, markers in screen space, pinch/zoom ---------- */
function mapWidget(host,{layers=[],markers=[],onTap,onMarker,trail=false,zoom=true,insets=[],onInsetTap,base=IMG.base,aspect=null,focus=null}){
  host.innerHTML=`<div class="mapbox"><div class="map"${aspect?` style="aspect-ratio:${aspect}"`:''}><div class="world"><img src="${base}" alt="" draggable="false">${layers.map(l=>`<img src="${IMG.layer(l)}" alt="" draggable="false">`).join('')}
   <svg class="shapes" viewBox="0 0 100 100" preserveAspectRatio="none"></svg></div></div>
   ${trail?'<svg class="trailsvg" preserveAspectRatio="none"><polyline points=""/></svg>':''}<div class="marks"></div></div>
   ${zoom?`<div class="zoom"><button type="button" data-z="-" aria-label="−">−</button><button type="button" data-z="+" aria-label="+">+</button></div>`:''}`;
  const box=host.querySelector('.mapbox'),mapEl=host.querySelector('.map'),world=host.querySelector('.world'),marks=host.querySelector('.marks'),shapes=host.querySelector('.shapes');
  const poly=host.querySelector('.trailsvg polyline');let sc=1,tx=0,ty=0,route=[];const btn={};
  // magnifier insets (Bosporus / Dardanelles, Bering): a 🔍 at each magnifier point opens the inset over the map; inset markers live there
  const pops={};
  const openInset=id=>{for(const k in pops)pops[k].hidden=k!==id;return pops[id]};
  for(const id of insets){const I=D.s5.insets[id];
    for(const g of I.magnifier){const b=document.createElement('button');b.type='button';b.className='mk mag';b.innerHTML='<span>🔍</span>';b.setAttribute('aria-label','🔍');
      b.addEventListener('click',e=>{e.stopPropagation();openInset(id)});marks.appendChild(b);btn['mag-'+id+'-'+g.x]={el:b,m:{x:g.x,y:g.y}}}
    const pop=document.createElement('div');pop.className='inset-pop';pop.hidden=true;pop.style.aspectRatio=String(I.aspect);
    pop.innerHTML=`<img src="${I.image}" alt="" draggable="false"><svg class="shapes" viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div class="imarks"></div><button type="button" class="inset-x" aria-label="✕">✕</button>`;
    pop.querySelector('.inset-x').addEventListener('click',e=>{e.stopPropagation();pop.hidden=true});
    pop.addEventListener('click',e=>{if(e.target.closest('.inset-x')||e.target.closest('.mk'))return;e.stopPropagation();if(!onInsetTap)return;const r=pop.getBoundingClientRect(),bb=box.getBoundingClientRect();
      onInsetTap(id,(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100,e.clientX-bb.left,e.clientY-bb.top,{W:r.width,H:r.height})});
    pop.addEventListener('pointerdown',e=>e.stopPropagation());box.appendChild(pop);pops[id]=pop}
  for(const m of markers.filter(m=>m.inset)){const pop=pops[m.inset];if(!pop)continue;const b=document.createElement('button');b.type='button';b.className='mk'+(m.cls?' '+m.cls:'');b.dataset.id=m.id;
    b.innerHTML=`<span>${esc(m.label||'')}</span>`;b.setAttribute('aria-label',m.aria||m.label||m.id);b.style.left=m.x+'%';b.style.top=m.y+'%';
    b.addEventListener('click',e=>{e.stopPropagation();onMarker&&onMarker(m.id,b)});pop.querySelector('.imarks').appendChild(b);btn[m.id]={el:b,m,inset:true}}
  markers=markers.filter(m=>!m.inset);
  for(const m of markers){const b=document.createElement('button');b.type='button';b.className='mk'+(m.cls?' '+m.cls:'');b.dataset.id=m.id;
    b.innerHTML=`<span>${esc(m.label||'')}</span>`;b.setAttribute('aria-label',m.aria||m.label||m.id);marks.appendChild(b);btn[m.id]={el:b,m}}
  const W=()=>mapEl.clientWidth,H=()=>mapEl.clientHeight;const toScreen=(x,y)=>[tx+x/100*W()*sc,ty+y/100*H()*sc];
  function place(){for(const {el,m,inset} of Object.values(btn)){if(inset)continue;const [x,y]=toScreen(m.x,m.y);el.style.left=x+'px';el.style.top=y+'px';el.hidden=x<-8||y<-8||x>W()+8||y>H()+8}
    if(poly){poly.parentNode.setAttribute('viewBox',`0 0 ${W()} ${H()}`);poly.setAttribute('points',route.filter(id=>!btn[id].inset).map(id=>toScreen(btn[id].m.x,btn[id].m.y).join(',')).join(' '))}}
  function apply(){sc=Math.min(4,Math.max(1,sc));tx=Math.min(0,Math.max(W()-W()*sc,tx));ty=Math.min(0,Math.max(H()-H()*sc,ty));world.style.transform=`translate(${tx}px,${ty}px) scale(${sc})`;place()}
  function zoomAt(f,cx,cy){const n=Math.min(4,Math.max(1,sc*f));tx=cx-(cx-tx)*n/sc;ty=cy-(cy-ty)*n/sc;sc=n;apply()}
  host.querySelector('.zoom')?.addEventListener('click',e=>{const z=e.target.closest('button');if(z)zoomAt(z.dataset.z==='+'?1.6:1/1.6,W()/2,H()/2)});
  box.addEventListener('wheel',e=>{if(!zoom)return;e.preventDefault();const r=mapEl.getBoundingClientRect();zoomAt(e.deltaY<0?1.2:1/1.2,e.clientX-r.left,e.clientY-r.top)},{passive:false});
  const pts=new Map();let drag=null,pinch=null,moved=false;
  box.addEventListener('pointerdown',e=>{if(e.target.closest('.zoom'))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;
    if(pts.size===1)drag={x:e.clientX,y:e.clientY,tx,ty};
    if(pts.size===2&&zoom){const [a,b]=[...pts.values()],r=mapEl.getBoundingClientRect();pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:sc,cx:(a.x+b.x)/2-r.left,cy:(a.y+b.y)/2-r.top,tx,ty};drag=null}});
  box.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&pts.size===2){const [a,b]=[...pts.values()],n=Math.min(4,Math.max(1,pinch.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));tx=pinch.cx-(pinch.cx-pinch.tx)*n/pinch.s;ty=pinch.cy-(pinch.cy-pinch.ty)*n/pinch.s;sc=n;moved=true;apply()}
    else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>8)moved=true;if(moved&&sc>1){tx=drag.tx+dx;ty=drag.ty+dy;apply()}}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size)drag=null};
  box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);
  marks.addEventListener('click',e=>{const b=e.target.closest('.mk');if(!b||moved)return;onMarker&&onMarker(b.dataset.id,b)});
  mapEl.addEventListener('click',e=>{if(moved||e.target.closest('.zoom')||!onTap)return;const r=mapEl.getBoundingClientRect();
    const px=(e.clientX-r.left-tx)/sc/W()*100,py=(e.clientY-r.top-ty)/sc/H()*100;onTap(px,py,e.clientX-r.left,e.clientY-r.top,{W:W()*sc,H:H()*sc})});
  // focus {x,y,zoom}: the map opens zoomed in on that point (percent of the map)
  new ResizeObserver(()=>{if(focus){sc=focus.zoom;tx=W()/2-focus.x/100*W()*sc;ty=H()/2-focus.y/100*H()*sc}apply()}).observe(mapEl);
  return {btn,
    addLayer(id){const i=document.createElement('img');i.src=IMG.layer(id);i.alt='';i.className='hl';world.insertBefore(i,shapes);return i},
    shape(o,cls){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',areaPath(o));p.setAttribute('class',cls||'hl-shape');p.dataset.id=o.id;shapes.appendChild(p);return p},
    line(d,cls){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('class',cls||'hl-river');shapes.appendChild(p);return p},
    openInset,
    insetShape(id,polys,cls){const sv=pops[id]&&pops[id].querySelector('svg');if(!sv)return;const p=document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d',polys.map(q=>'M'+q.map(v=>v[0]+' '+v[1]).join('L')+'Z').join(''));p.setAttribute('class',cls||'hl-shape');sv.appendChild(p);return p},
    clearShapes(){shapes.innerHTML='';for(const k in pops)pops[k].querySelector('svg').innerHTML=''},
    dot(sx,sy,ok){const d=document.createElement('div');d.className='tapdot '+(ok?'ok':'bad');d.style.left=sx+'px';d.style.top=sy+'px';mapEl.appendChild(d);setTimeout(()=>d.remove(),1300)},
    route(id){route.push(id);place()}};
}

/* ---------- screens ---------- */
function welcome(){
  const pick0=S.lang||'ru';
  h(`<section class="screen welcome"><div class="hero" style="background-image:url('${IMG.welcome}')" role="img" aria-label="Пип у карты мира"></div>
   <div class="body"><p class="eyebrow">GeoWords</p><h1>${T[pick0].tag}</h1><p class="lead">${T[pick0].lead}</p><p><b>${T[pick0].words}</b></p>
   <div class="langs"><button type="button" class="lang" data-l="ru" aria-pressed="${pick0==='ru'}"><b>Русские</b><span>ЗЕНИТ, МЕРИДИАН…</span></button>
   <button type="button" class="lang" data-l="en" aria-pressed="${pick0==='en'}"><b>English</b><span>ZENITH, MERIDIAN…</span></button></div></div>
   <div class="go"><button type="button" class="btn" id="go">${T[pick0].go}</button></div></section>`);
  let chosen=pick0;
  app.querySelectorAll('.lang').forEach(b=>b.addEventListener('click',()=>{chosen=b.dataset.l;app.querySelectorAll('.lang').forEach(x=>x.setAttribute('aria-pressed',x===b));
    app.querySelector('h1').textContent=T[chosen].tag;app.querySelector('.lead').textContent=T[chosen].lead;app.querySelector('.body p b').textContent=T[chosen].words;app.querySelector('#go').textContent=T[chosen].go}));
  app.querySelector('#go').addEventListener('click',()=>{S.lang=chosen;save();home()});
}

function home(){
  const x=t(),S1=STEPS.filter(s=>!s.sec),doneCount=S1.filter(s=>S.done[s.id]).length;
  const cur=STEPS.find(s=>!S.done[s.id]&&unlocked(s.id));
  const zig=[50,70,34,62,40,66];let k=0;
  const stopHtml=s=>{const done=!!S.done[s.id],open=unlocked(s.id),isCur=cur&&cur.id===s.id,pos=zig[k++%zig.length];
    const cls=['stop',s.kind==='practice'?'practice':s.kind!=='lesson'?'final':'',done?'done':'',!open?'locked':'',isCur?'current':''].join(' ');
    const disc=s.kind==='lesson'?(done?'':s.n):s.kind==='practice'?(done?'':`<span class="abc">${L()==='ru'?'АБВ':'ABC'}</span>`):`<img src="${s.kind==='challenge'?IMG.stampChallenge:s.kind==='section'||s.kind==='block'?IMG.medalSection:IMG.medal}" alt="">`;
    return `<div class="stop-row"><button type="button" class="${cls}" data-step="${s.id}" style="left:${pos}%" aria-label="${esc(titleOf(s))}"><span class="disc">${disc}</span></button>
      ${isCur?`<img class="boat" src="${IMG.boat}" alt="" style="left:calc(${pos}% ${pos>50?'- 128px':'+ 46px'})">`:''}
      <span class="stop-label" style="left:${pos}%"><span>${esc(titleOf(s))}</span></span></div>`};
  const body=COURSE.map(u=>`<div class="unit-head"><span class="eyebrow">${x.unit} ${u.n}${u.n===1?'':' · '+x.draft}</span><h3>${x.units[u.n-1][0]}</h3><p>${x.units[u.n-1][1]}</p></div>`+
     STEPS.filter(s=>!s.sec&&s.unit===u.n).map(stopHtml).join('')).join('')+`<div class="unit-head"><span class="eyebrow">${x.section}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('s1-final'))+
     `<div class="section-card s2"><img src="${IMG.stamp2}" alt=""><div class="t"><span class="eyebrow">${x.sectionN(2)} · ${x.draft}</span><h2>${L()==='ru'?'Реки мира':'Rivers of the world'}</h2></div></div>`+
     COURSE2.map(u=>`<div class="unit-head"><span class="eyebrow">${x.sectionN(2)} · ${x.unit} ${u.n}</span><h3>${esc(D.s2.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===2&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.sectionN(2)}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('s2-final'))+
     `<div class="section-card s2"><img src="${IMG.stamp3}" alt=""><div class="t"><span class="eyebrow">${x.sectionN(3)} · ${x.draft}</span><h2>${L()==='ru'?'Горы мира':'Mountains of the world'}</h2></div></div>`+
     COURSE3.map(u=>`<div class="unit-head"><span class="eyebrow">${x.sectionN(3)} · ${x.unit} ${u.n}</span><h3>${esc(D.s3.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===3&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.sectionN(3)}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('s3-final'))+
     `<div class="section-card s2"><img src="${IMG.stamp4}" alt=""><div class="t"><span class="eyebrow">${x.sectionN(4)} · ${x.draft}</span><h2>${L()==='ru'?'Моря мира':'Seas of the world'}</h2></div></div>`+
     COURSE4.map(u=>`<div class="unit-head"><span class="eyebrow">${x.sectionN(4)} · ${x.unit} ${u.n}</span><h3>${esc(D.s4.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===4&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.sectionN(4)}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('s4-final'))+
     `<div class="section-card s2"><img src="${IMG.stamp5}" alt=""><div class="t"><span class="eyebrow">${x.sectionN(5)} · ${x.draft}</span><h2>${L()==='ru'?'Проливы и каналы':'Straits and canals'}</h2></div></div>`+
     COURSE5.map(u=>`<div class="unit-head"><span class="eyebrow">${x.sectionN(5)} · ${x.unit} ${u.n}</span><h3>${esc(D.s5.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===5&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.sectionN(5)}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('s5-final'))+
     `<div class="section-card s2"><img src="${IMG.stampBlock}" alt=""><div class="t"><span class="eyebrow">${x.blockN} · ${x.draft}</span><h2>${x.blockName}</h2></div></div>`+
     STEPS.filter(s=>s.sec===6&&s.kind==='lesson').map(stopHtml).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.blockN}</span><h3>${x.blockFinal}</h3></div>`+stopHtml(stepOf('b-final'))+
     `<div class="unit-head"><span class="eyebrow">${x.blockN}</span><h3>${x.challenge}</h3></div>`+stopHtml(stepOf('b-challenge'))+
     `<div class="section-card s2"><img src="${IMG.euCard}" alt=""><div class="t"><span class="eyebrow">${x.euSec}</span><h2>${x.euName}</h2></div></div>`+
     COURSE7.map(u=>`<div class="unit-head"><span class="eyebrow">${x.block2} · ${x.unit} ${u.n}</span><h3>${esc(D.s7.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===7&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.euSec}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('e1-final'))+
     (STEPS.some(s=>s.sec===7&&!ready(s))?`<p class="rotate-hint">${x.euSoon}</p>`:'')+
     `<div class="section-card s2"><img src="${IMG.stamp2}" alt=""><div class="t"><span class="eyebrow">${x.eu2Sec}</span><h2>${x.eu2Name}</h2></div></div>`+
     COURSE8.map(u=>`<div class="unit-head"><span class="eyebrow">${x.eu2Sec} · ${x.unit} ${u.n}</span><h3>${esc(D.s8.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===8&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.eu2Sec}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('e2-final'))+
     (STEPS.some(s=>s.sec===8&&!ready(s))?`<p class="rotate-hint">${x.euSoon}</p>`:'')+
     `<div class="section-card s2"><img src="${IMG.stamp3}" alt=""><div class="t"><span class="eyebrow">${x.eu3Sec}</span><h2>${x.eu3Name}</h2></div></div>`+
     COURSE9.map(u=>`<div class="unit-head"><span class="eyebrow">${x.eu3Sec} · ${x.unit} ${u.n}</span><h3>${esc(D.s9.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===9&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.eu3Sec}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('e3-final'))+
     (STEPS.some(s=>s.sec===9&&!ready(s))?`<p class="rotate-hint">${x.euSoon}</p>`:'')+
     // section 4 shows on the trail once its countries are approved
     (STEPS.some(s=>s.sec===10&&ready(s))?`<div class="section-card s2"><img src="${IMG.euCard}" alt=""><div class="t"><span class="eyebrow">${x.eu4Sec}</span><h2>${x.eu4Name}</h2></div></div>`+
     COURSE10.map(u=>`<div class="unit-head"><span class="eyebrow">${x.eu4Sec} · ${x.unit} ${u.n}</span><h3>${esc(D.s10.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===10&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.eu4Sec}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('e4-final'))+
     (STEPS.some(s=>s.sec===10&&!ready(s))?`<p class="rotate-hint">${x.euSoon}</p>`:''):'');
  const jump= S.done['u1-final']&&!S.done['u2-l1']&&unlocked('u2-l1') ?
    `<button type="button" class="btn" data-a="continue-unit-2">${x.unit} 2 · ${x.units[1][0]} →</button>` : '';
  h(`<section class="screen home">
   <div class="topbar"><span class="chip"><img src="${IMG.streak}" alt="">${S.streak}</span><span class="chip"><span class="star">★</span>${S.xp}</span><span class="grow"></span>
    <button type="button" class="iconbtn" id="gear" aria-label="${x.settings}">⚙</button></div>
   <div class="section-card"><img src="${IMG.stamp}" alt=""><div class="t"><span class="eyebrow">${x.section}</span><h2>${x.sectionName}</h2>
     <div class="bar"><i style="width:${Math.round(doneCount/S1.length*100)}%"></i></div></div></div>
   ${jump}<div class="path"><svg class="trail" preserveAspectRatio="none"></svg>${body}</div>
   <p class="rotate-hint">${x.tester} · ${BUILD}</p></section>`);
  drawTrail();
  app.querySelectorAll('.stop[data-step]').forEach(b=>b.addEventListener('click',()=>openStep(b.dataset.step)));
  app.querySelector('#gear').addEventListener('click',settings);
  app.querySelector('[data-a=continue-unit-2]')?.addEventListener('click',()=>openStep('u2-l1'));
  const c=app.querySelector('.stop.current');if(c)c.scrollIntoView({block:'center'});
}
function drawTrail(){const path=app.querySelector('.path');if(!path)return;const svg=path.querySelector('svg.trail');const r=path.getBoundingClientRect();
  const pts=[...path.querySelectorAll('.stop')].map(s=>{const b=s.getBoundingClientRect();return [b.left+b.width/2-r.left,b.top+b.height/2-r.top]});
  svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);svg.innerHTML=`<path d="${pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(0)+' '+p[1].toFixed(0)).join(' ')}"/>`}

function practiceUnitFor(st){return Math.max(...READY_UNITS.filter(u=>u<=(st.unit==='S'?4:st.unit)))}
function canReview(st){return eligibleReviewWords(practiceUnitFor(st)).length>0}
function startPractice(st){
  const x=t(),p=practicePuzzle(practiceUnitFor(st));
  if(p)return geowords(p);
  const m=sheet(`<h3>${x.practice}</h3><p>${x.practiceNone}</p><button type="button" class="btn sand">OK</button>`);
  m.querySelector('button').onclick=()=>m.remove();
}
function openStep(id){
  const x=t(),st=stepOf(id);
  if(!unlocked(id)){const s=sheet(`<h3>${esc(titleOf(st))}</h3><p>${ready(st)?x.locked:x.notReady}</p><button type="button" class="btn sand">OK</button>`);s.querySelector('button').onclick=()=>s.remove();return}
  const es=st.sec===10?x.eu4Sec:st.sec===9?x.eu3Sec:st.sec===8?x.eu2Sec:x.euSec;
  const head=st.sec===6?x.blockN+' · '+x.blockName:st.sec>=7?(st.unit==='S'?es:`${es} · ${x.unit} ${st.unit} · ${SD(st).dict.units[st.unit-1].title[L()]}`):st.sec?(st.unit==='S'?x.sectionN(st.sec):`${x.sectionN(st.sec)} · ${x.unit} ${st.unit} · ${SD(st).dict.units[st.unit-1].title[L()]}`):st.unit==='S'?x.section:`${x.unit} ${st.unit} · ${x.units[st.unit-1][0]}`;
  const desc=st.kind==='lesson'?x.lessonDesc:st.kind==='practice'?x.practiceDesc:st.kind==='challenge'?x.huntDesc:x.finalDesc;
  let buttons;
  if(st.kind!=='lesson'&&st.kind!=='practice'&&S.done[id]&&!st.sec){
    const hasNew=canReview(st);
    buttons=(hasNew?`<button type="button" class="btn" data-a="practice">${x.practice}</button>`:
      `<p class="rotate-hint">${x.practiceNone}</p>`)+
      `<div class="row"><button type="button" class="btn ghost" data-a="no">${x.later}</button><button type="button" class="btn ${hasNew?'ghost':''}" data-a="go">${x.finalAgain}</button></div>`;
  }else buttons=`<div class="row"><button type="button" class="btn ghost" data-a="no">${x.later}</button><button type="button" class="btn" data-a="go">${S.done[id]?(st.kind==='practice'?x.practiceAgain:x.again):x.start}</button></div>`;
  // Challenge: the GeoWords part can also be opened without the Speed Hunt minute (Svetlana could not find it, 26.10.2026)
  if(st.kind==='challenge')buttons+=`<button type="button" class="btn ghost" data-a="cw">${x.cwDirect}</button>`;
  const s=sheet(`<span class="eyebrow" style="color:#a0742b">${esc(head)}</span><h3>${esc(titleOf(st))}</h3><p>${desc}</p>${buttons}`);
  s.querySelector('[data-a=no]').onclick=()=>s.remove();
  s.querySelector('[data-a=go]').onclick=()=>{s.remove();if(st.kind==='practice')runPractice(st);else if(st.kind==='challenge')speedHunt(st);else if(st.kind==='block')geowords(blockPuzzle(st));else if(st.kind!=='lesson')geowords(finalPuzzle(st));else if(!S.introSeen&&id==='u1-l1')unitIntro(()=>lesson(st));else startLesson(st)};
  const pr=s.querySelector('[data-a=practice]');if(pr)pr.onclick=()=>{s.remove();startPractice(st)};
  const cw=s.querySelector('[data-a=cw]');if(cw)cw.onclick=()=>{s.remove();challengeWords(st)};
}

function settings(){
  const x=t();
  const s=sheet(`<h3>${x.settings}</h3>
   <div class="opt"><span>${x.lang}</span><div class="seg"><button type="button" data-l="ru" aria-pressed="${L()==='ru'}">RU</button><button type="button" data-l="en" aria-pressed="${L()==='en'}">EN</button></div></div>
   <div class="opt"><span>${x.unlock}</span><div class="seg"><button type="button" data-u="1" aria-pressed="${S.unlockAll}">ON</button><button type="button" data-u="0" aria-pressed="${!S.unlockAll}">OFF</button></div></div>
   <button type="button" class="btn ghost" data-a="reset">${x.reset}</button><button type="button" class="btn sand" data-a="close">OK</button>`);
  s.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{S.lang=b.dataset.l;save();s.remove();home()});
  s.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{S.unlockAll=b.dataset.u==='1';save();s.remove();home()});
  s.querySelector('[data-a=reset]').onclick=()=>{const lang=S.lang;S={...blank,lang,learned:[],recent:[]};save();s.remove();home()};
  s.querySelector('[data-a=close]').onclick=()=>s.remove();
}

function unitIntro(next){
  const x=t();
  h(`<section class="screen lesson"><div class="task"><span class="kind">${x.unit} 1 · ${x.units[0][0]}</span>
   <img src="${IMG.intro}" alt="" style="width:100%;border-radius:16px;box-shadow:0 10px 24px rgba(0,0,0,.4)">
   <div class="card"><div class="intro-pip"><img src="${IMG.map}" alt=""><p>${D.dirs.map(d=>`<b>${esc(d.name[L()])}</b>`).join(' · ')}<br>${esc(D.lines.equator.name[L()])} · ${esc(D.lines['prime-meridian'].name[L()])}</p></div></div></div>
   <div class="fb idle"><button type="button" class="btn">${x.start}</button></div></section>`);
  app.querySelector('.fb .btn').onclick=()=>{S.introSeen=true;save();next()};
}

// The rivers intro card (source · channel · mouth) opens the first rivers lesson every time, however the lesson is started.
function startLesson(st){if(st.id==='s2-u1-l1')riversIntro(()=>lesson(st));else if(st.id==='s3-u1-l1')riversIntro(()=>lesson(st),3);else lesson(st)}
function riversIntro(next,sec=2){
  const x=t(),lang=L(),I=D['s'+sec].intro;
  h(`<section class="screen lesson"><div class="task"><span class="kind">${x.sectionN(sec)} · ${x.riversIntro}</span>
   <img src="${A+I.image[lang].replace(/^\.\//,'')}" alt="" style="width:100%;border-radius:16px;box-shadow:0 10px 24px rgba(0,0,0,.4)">
   <div class="card"><div class="intro-pip"><img src="${IMG.map}" alt=""><p>${I.terms.map(q=>`<b>${esc(q[lang])}</b>`).join(' · ')}</p></div></div></div>
   <div class="fb idle"><button type="button" class="btn">${x.start}</button></div></section>`);
  app.querySelector('.fb .btn').onclick=()=>{S.introSeen2=true;save();next()};
}
function nextBtns(id){const n=nextStep(id),x=t();
  return (n?`<button type="button" class="btn" data-a="next">${n.kind==='lesson'?x.nextLesson:n.kind==='practice'?x.nextPractice:n.kind==='block'?x.nextBlockFinal:n.kind==='challenge'?x.toChallenge:x.nextFinal}</button>`:'')+`<button type="button" class="btn ${n?'ghost':''}" data-a="home">${x.home}</button>`}
function wireNext(id){const n=nextStep(id);app.querySelector('[data-a=home]').onclick=home;
  const b=app.querySelector('[data-a=next]');if(b)b.onclick=()=>n.kind==='lesson'?startLesson(n):n.kind==='practice'?runPractice(n):n.kind==='challenge'?speedHunt(n):n.kind==='block'?geowords(blockPuzzle(n)):geowords(finalPuzzle(n))}
/* ---------- lesson engine ---------- */
function lesson(step){
  if(step.sec>=7)EUSEC=step.sec;
  const x=t(),lang=L(),id=step.id;const queue=step.plan().map(q=>({...q}));window.__gwPlan=queue.map(q=>({...q}));const total=queue.length;let done=0,wrong=0;const t0=Date.now();
  function exitAsk(){const s=sheet(`<h3>${x.quitT}</h3><p>${x.quitP}</p><div class="row"><button type="button" class="btn ghost" data-a="q">${x.quit}</button><button type="button" class="btn" data-a="s">${x.stay}</button></div>`);
    s.querySelector('[data-a=q]').onclick=()=>{s.remove();home()};s.querySelector('[data-a=s]').onclick=()=>s.remove()}
  function frame(kind,body){h(`<section class="screen lesson"><div class="l-top"><button type="button" class="l-x" aria-label="${x.quit}">✕</button><div class="l-bar"><i style="width:${done/total*100}%"></i></div></div>
     <div class="task"><span class="kind">${kind}</span>${body}</div><div class="fb idle"></div></section>`);app.querySelector('.l-x').onclick=exitAsk}
  let cur=null;const tapQ=q=>q.clue?`<div class="card"><p class="q" style="margin:0">${esc(q.clue[lang])}</p></div><p class="rotate-hint" style="margin:0">${x.recFind}</p>`:`<p class="q">${x.tap(acc(q.id))}</p>`;
  function feedback(ok,title,text,face,onNext){if(ok&&cur&&cur.say)text=cur.say[lang];const fb=app.querySelector('.fb');fb.className='fb '+(ok?'ok':'bad');
    fb.innerHTML=`<div class="msg"><img src="${face}" alt=""><div><b>${esc(title)}</b>${text?`<p>${esc(text)}</p>`:''}</div></div><button type="button" class="btn">${x.next}</button>`;
    const b=fb.querySelector('.btn');b.focus({preventScroll:true});b.onclick=onNext}
  function gotIt(after){const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn">${x.check}</button>`;fb.querySelector('.btn').onclick=()=>{after&&after();done++;next()}}
  function answered(task,ok){if(task.id){S.weak[task.id]=Math.max(0,(S.weak[task.id]||0)+(ok?-1:1));if(!S.weak[task.id])delete S.weak[task.id]}
    if(ok)done++;else{wrong++;queue.push({...task,retry:true})}app.querySelector('.l-bar i').style.width=(done/total*100)+'%'}
  function next(){const task=queue.shift();if(!task)return finish();render(task)}
  const nuanceBtn=o=>o&&o.disputed&&o.caveat?`<button type="button" class="nuance"><img src="${IMG.nuance}" alt="">${x.nuance}</button>`:'';
  function wireNuance(o){const b=app.querySelector('.nuance');if(b)b.onclick=()=>{const s=sheet(`<div class="intro-pip"><img src="${IMG.wonder}" alt=""><h3>${x.nuance}</h3></div><p>${esc(o.caveat[lang])}</p><button type="button" class="btn sand">OK</button>`);s.querySelector('button').onclick=()=>s.remove()}}
  function render(q){
    window.__gwTask=q;cur=q;// read by the automated play-through test
    if(q.k==='intro'){const d=dir(q.dir);frame(x.intro,`<div class="card"><div class="intro-pip"><img src="${q.dir==='west'?IMG.left:q.dir==='east'?IMG.right:IMG.hello}" alt=""><h3>${esc(d.name[lang])}</h3></div><p>${esc(d.fact(lang))}</p></div><div class="mapslot"></div>`);
      mapWidget(app.querySelector('.mapslot'),{markers:[{id:d.id,x:d.x,y:d.y,cls:'dir pulse',label:{north:'↑',south:'↓',east:'→',west:'←'}[d.id]}],zoom:false});return gotIt(()=>learn(q.dir))}
    if(q.k==='introLine'){const ln=D.lines[q.line];frame(x.intro,`<div class="card"><div class="intro-pip"><img src="${IMG.map}" alt=""><h3>${esc(ln.name[lang])}</h3></div><p>${esc(ln.fact(lang))}</p></div><div class="mapslot"></div>`);
      mapWidget(app.querySelector('.mapslot'),{layers:[ln.layer],zoom:false});return gotIt(()=>learn(q.line))}
    if(q.k==='introObj'||q.k==='introRec'){const r=q.rec&&D.records.find(r=>r.id===q.rec);const o=O(r?r.object:q.id);
      const text=r?r.fact[lang]:o.fact(lang);
      frame(r?x.record:x.intro,`<div class="card"><div class="intro-pip"><img src="${r?IMG.wonder:IMG.map}" alt=""><h3>${esc(o.name[lang])}</h3></div><p>${esc(text)}</p>${r?'':nuanceBtn(o)}</div><div class="mapslot"></div>`);
      const layers=[...new Set([...learnedLayers(),...(o.layer?[o.layer]:[])])];const m=mapWidget(app.querySelector('.mapslot'),{layers,zoom:false});m.shape(o,'hl-shape pulse');if(!r)wireNuance(o);
      return gotIt(()=>learn(o.id))}
    if(q.k==='find'){const target=dir(q.dir);frame(x.find,`<p class="q">${x.tap(acc(q.dir))}</p><div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{markers:D.dirs.map(d=>({id:d.id,x:d.x,y:d.y,cls:'dir',label:'',aria:d.name[lang]})),
        onMarker:(id,el)=>{if(locked)return;locked=true;const ok=id===q.dir;el.classList.add(ok?'good':'bad');if(!ok)m.btn[q.dir].el.classList.add('good','pulse');
          answered(q,ok);feedback(ok,ok?x.right:x.wrongIs(dir(id).name[lang]),ok?target.fact(lang):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='what'){const target=dir(q.dir);const opts=shuffle([...q.from]);
      frame(x.what,`<p class="q">${x.whatDir}</p><div class="mapslot"></div><div class="choices">${opts.map(o=>`<button type="button" class="choice" data-o="${o}">${esc(dir(o).name[lang])}</button>`).join('')}</div>`);
      mapWidget(app.querySelector('.mapslot'),{markers:[{id:target.id,x:target.x,y:target.y,cls:'dir pulse',label:'?'}],zoom:false});
      return choices(q,q.dir,()=>dir(q.dir).name[lang],()=>target.fact(lang))}
    if(q.k==='line'){const ln=D.lines[q.line];frame(x.line,`<p class="q">${x.tap(acc(q.line))}</p><div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:[...learnedLayers(),'world-line-equator','world-line-prime-meridian'],onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const dist=q.line==='equator'?Math.abs(py-ln.y)/100*sz.H:Math.abs(px-ln.x)/100*sz.W;const ok=dist<=24;
        locked=true;m.dot(sx,sy,ok);if(!ok)m.addLayer(ln.layer);answered(q,ok);feedback(ok,ok?x.right:x.tryLine,ok?ln.fact(lang):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='hemi'){frame(x.hemi,`<p class="q">${x.tap(acc(q.h))}</p><div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:[...learnedLayers(),'world-line-equator','world-line-prime-meridian','world-line-antimeridian'],onTap:(px,py,sx,sy)=>{if(locked)return;locked=true;
        const eq=D.lines.equator.y,pm=D.lines['prime-meridian'].x,am=96.67;const ok={n:py<eq,s:py>eq,e:px>pm&&px<am,w:px<pm||px>am}[q.h];
        m.dot(sx,sy,ok);m.addLayer('world-hemisphere-'+q.h);answered(q,ok);feedback(ok,ok?x.right:x.hemiWrong,ok?D.hemis[q.h].name[lang]:'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    // ---- block 2 section 1: Europe on the map (Europe base; the Ural River and Mountains always drawn; a tap is judged against every object of the section) ----
    if(q.k==='introEurope'){const I=D.s7.intro;if(!I){done++;return next()}
      frame(x.intro,`<div class="card"><div class="intro-pip"><img src="${IMG.hello}" alt=""><h3>${esc(I.name[lang])}</h3></div><p>${esc(I.fact[lang])}</p></div><div class="mapslot"></div>`);
      euMap(app.querySelector('.mapslot'),{zoom:false});return gotIt(()=>learn(I.id))}
    if(q.k==='introEu'||q.k==='introEuRec'){const rec=q.rec&&EUD().records.find(r=>r.id===q.rec);const o=E(rec?rec.object:q.id);
      frame(rec?x.record:x.intro,`<div class="card"><div class="intro-pip"><img src="${rec?IMG.wonder:IMG.map}" alt=""><h3>${esc(o.name[lang])}${o.capital&&!rec?` <small>· ${esc(o.capital.name[lang])}</small>`:''}</h3></div><p>${esc(rec?rec.fact[lang]:o.fact(lang))}</p>${rec?'':nuanceBtn(o)}</div><div class="mapslot"></div>`);
      const m=euMap(app.querySelector('.mapslot'),{zoom:false});showEu(m,o,'hl-shape pulse');if(o.capital)m.shape(capRing(o.capital),'hl-shape good');if(!rec)wireNuance(o);
      return gotIt(()=>learn(o.id))}
    if(q.k==='tipEu'){const I=D.s8.facts.items.find(i=>i.id===q.id&&i.approval?.status==='approved');const rs=I?I.rivers.map(E).filter(Boolean):[];if(rs.length!==(I?.rivers.length??-1)){done++;return next()}
      // the first letter of every word stands out: the phrase's letters are the rivers' first letters, west to east
      frame(x.tip,`<div class="card"><div class="intro-pip"><img src="${IMG.yes}" alt=""><h3 class="tip-phrase">${I.name[lang].split(' ').map(w=>`<b>${esc(w[0])}</b>${esc(w.slice(1))}`).join(' ')}</h3></div><p>${esc(I.fact[lang])}</p></div><div class="mapslot"></div>`);
      const m=euMap(app.querySelector('.mapslot'),{zoom:false,focus:I.map.focus,markers:I.map.letters.map(l=>({id:l.id,x:l.x,y:l.y,cls:'tip',label:E(l.id).name[lang][0],aria:E(l.id).name[lang]}))});rs.forEach(o=>showEu(m,o,'hl-shape'));
      return gotIt(()=>learn(I.id))}
    if(q.k==='findEu'){const o=E(q.id);const rec=q.rec&&EUD().records.find(r=>r.id===q.rec);frame(rec||q.clue?x.record:x.find,`${tapQ(q)}<div class="mapslot"></div>`);
      let locked=false;const m=euMap(app.querySelector('.mapslot'),{onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const ok=euOk(q.id,px,py,sz),hit=ok?q.id:euHit(px,py,sz);locked=true;m.dot(sx,sy,ok);showEu(m,o,ok?'hl-shape good':'hl-shape pulse');
        if(hit&&!ok)showEu(m,E(hit),'hl-shape bad');answered(q,ok);
        feedback(ok,ok?x.right:(hit?x.wrongIs(nameIn(hit)):x.miss),ok?(rec?'':(o.disputed?'':o.fact(lang))):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='whatEu'){const o=E(q.id);const opts=pick(euFamily(q.id),q.id,4);
      frame(x.what,`<p class="q">${x.recWhatQ}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(E(c).name[lang])}</button>`).join('')}</div>`);
      const m=euMap(app.querySelector('.mapslot'),{zoom:false});showEu(m,o,'hl-shape pulse');
      return choices(q,q.id,()=>o.name[lang],()=>o.disputed?'':o.fact(lang))}
    // ---- block 2 section 4: capitals (the dots are drawn on the capitals map; a tap is judged against the nearest dot) ----
    if(q.k==='findCap'){const o=E(q.id),c=o.capital;frame(x.find,`<p class="q">${x.tapCap(esc(c.name[lang]))}</p><div class="mapslot"></div>`);
      let locked=false;const m=euMap(app.querySelector('.mapslot'),{onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const hit=capHit(px,py,sz),ok=hit===c.id;locked=true;m.dot(sx,sy,ok);m.shape(capRing(c),ok?'hl-shape good':'hl-shape pulse');
        const wrongC=hit&&!ok&&capOwner(hit);if(wrongC)m.shape(capRing(wrongC.capital),'hl-shape bad');answered(q,ok);
        feedback(ok,ok?x.right:(wrongC?x.wrongIs(wrongC.capital.name[lang]):x.miss),ok?x.capIs(o.name[lang],c.name[lang]):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='capOf'){const o=E(q.id),opts=pick(euFamily(q.id),q.id,4);
      frame(x.what,`<p class="q">${x.capOfQ(esc(o.capital.name[lang]))}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(E(c).name[lang])}</button>`).join('')}</div>`);
      const m=euMap(app.querySelector('.mapslot'),{zoom:false});m.shape(capRing(o.capital),'hl-shape pulse');
      return choices(q,q.id,()=>o.name[lang],()=>x.capIs(o.name[lang],o.capital.name[lang]))}
    if(q.k==='whatCap'){const o=E(q.id),opts=pick(euFamily(q.id),q.id,4);
      frame(x.what,`<p class="q">${x.whatCapQ}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(E(c).capital.name[lang])}</button>`).join('')}</div>`);
      const m=euMap(app.querySelector('.mapslot'),{zoom:false});showEu(m,o,'hl-shape pulse');
      return choices(q,q.id,()=>o.capital.name[lang],()=>x.capIs(o.name[lang],o.capital.name[lang]))}
    if(q.k==='allPen'){const want=EU().filter(id=>E(id).kind==='peninsula'),tappable=EU().filter(id=>['peninsula','island'].includes(E(id).kind));const sel=new Set();
      frame(x.find,`<p class="q">${x.allPen}</p><div class="mapslot"></div><p class="rotate-hint">${x.allPenHint}</p>`);
      const m=euMap(app.querySelector('.mapslot'),{onTap:(px,py,sx,sy,sz)=>{const hit=euHit(px,py,sz,tappable);if(!hit)return;
        if(sel.has(hit))sel.delete(hit);else sel.add(hit);redraw()}});
      function redraw(){m.clearShapes();sel.forEach(id=>showEu(m,E(id),'hl-shape sel'));const b=app.querySelector('.fb .btn');if(b)b.disabled=!sel.size}
      const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn" disabled>${x.checkAns}</button>`;redraw();
      fb.querySelector('.btn').onclick=()=>{const ok=want.every(id=>sel.has(id))&&[...sel].every(id=>want.includes(id));
        m.clearShapes();want.forEach(id=>showEu(m,E(id),'hl-shape good'));answered(q,ok);
        feedback(ok,ok?x.allPenOk:x.allPenBad,want.map(id=>E(id).name[lang]).join(', '),ok?IMG.faceHappy:IMG.faceOops,next)};return}
    // ---- section 2: rivers (all nine rivers are drawn; the asked one is highlighted along its course) ----
    if(q.k==='introRiver'||q.k==='introRiverRec'){const rec=q.rec&&D.s2.records.find(r=>r.id===q.rec);const r=R(rec?rec.object:q.id);
      frame(rec?x.record:x.intro,`<div class="card"><div class="intro-pip"><img src="${rec?IMG.wonder:IMG.map}" alt=""><h3>${esc(r.name[lang])}</h3></div><p>${esc(rec?rec.fact[lang]:r.fact(lang))}</p>${rec?'':nuanceBtn(r)}</div><div class="mapslot"></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:riverLayers(),zoom:false});m.line(riverPath(r),'hl-river pulse');if(!rec)wireNuance(r);
      return gotIt(()=>learn(r.id))}
    if(q.k==='findRiver'){const r=R(q.id);const rec=q.rec&&D.s2.records.find(x=>x.id===q.rec);frame(rec||q.clue?x.record:x.find,`${tapQ(q)}<div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:riverLayers(),onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const hit=nearestRiver(px,py,sz,22);const ok=hit===q.id;locked=true;m.dot(sx,sy,ok);m.line(riverPath(r),ok?'hl-river good':'hl-river pulse');
        if(hit&&!ok)m.line(riverPath(R(hit)),'hl-river bad');answered(q,ok);
        feedback(ok,ok?x.right:(hit?x.wrongIs(nameIn(hit)):x.miss),ok?(rec?'':r.fact(lang)):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='whatRiver'){const r=R(q.id);const opts=pick(RIVERS,q.id,4);
      frame(x.what,`<p class="q">${x.whatRiver}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(R(c).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:riverLayers(),zoom:false});m.line(riverPath(r),'hl-river pulse');
      return choices(q,q.id,()=>r.name[lang],()=>r.fact(lang))}
    if(q.k==='riverCont'){const r=R(q.id);const opts=pick(CONT,r.continent,4);
      frame(x.onCont,`<p class="q">${x.riverCont(esc(r.name[lang]))}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(O(c).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:riverLayers(),zoom:false});m.line(riverPath(r),'hl-river pulse');
      return choices(q,r.continent,()=>O(r.continent).name[lang],()=>'')}
    if(q.k==='riverMouth'){const r=R(q.id);const all=[...new Set(RIVERS.map(id=>R(id).mouth))];const opts=pick(all,r.mouth,4);
      frame(x.mouth,`<p class="q">${x.riverMouth(esc(r.name[lang]))}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(D.s2.waterName(c)[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:riverLayers(),zoom:false});m.line(riverPath(r),'hl-river pulse');
      return choices(q,r.mouth,()=>D.s2.waterName(r.mouth)[lang],()=>'')}
    if(q.k==='allAsia'){const want=RIVERS.filter(id=>R(id).continent==='asia');const sel=new Set();
      frame(x.find,`<p class="q">${x.allAsia}</p><div class="mapslot"></div><p class="rotate-hint">${x.allHint}</p>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:riverLayers(),onTap:(px,py,sx,sy,sz)=>{const hit=nearestRiver(px,py,sz,26);if(!hit)return;
        if(sel.has(hit))sel.delete(hit);else sel.add(hit);redraw()}});
      function redraw(){m.clearShapes();sel.forEach(id=>m.line(riverPath(R(id)),'hl-river sel'));const b=app.querySelector('.fb .btn');if(b)b.disabled=!sel.size}
      const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn" disabled>${x.checkAns}</button>`;redraw();
      fb.querySelector('.btn').onclick=()=>{const ok=want.every(id=>sel.has(id))&&[...sel].every(id=>want.includes(id));
        m.clearShapes();want.forEach(id=>m.line(riverPath(R(id)),'hl-river good'));answered(q,ok);
        feedback(ok,ok?x.allOk:x.allBad,want.map(id=>R(id).name[lang]).join(', '),ok?IMG.faceHappy:IMG.faceOops,next)};return}
    // ---- section 5: straits and canals (tiny ones under the magnifier 🔍) ----
    const sOpts=(right,pool,label)=>{const key=v=>[v].flat().join('+');const seen=new Set([key(right)]);const out=[right];
      for(const v of shuffle([...pool]))if(out.length<4&&!seen.has(key(v))){seen.add(key(v));out.push(v)}return {opts:shuffle(out),key,label}};
    const showStrait=(m,o,cls)=>{if(o.inset){m.openInset(o.inset.id);m.insetShape(o.inset.id,o.inset.tapArea,cls)}else{m.shape(o,cls);if(o.layer)m.addLayer(o.layer)}};
    if(q.k==='introStrait'||q.k==='introStraitRec'){const rec=q.rec&&D.s5.records.find(r=>r.id===q.rec);const o=ST(rec?rec.object:q.id);
      frame(rec?x.record:x.intro,`<div class="card"><div class="intro-pip"><img src="${rec?IMG.wonder:IMG.map}" alt=""><h3>${esc(o.name[lang])}</h3></div><p>${esc(rec?rec.fact[lang]:o.fact(lang))}</p>${rec?'':nuanceBtn(o)}</div><div class="mapslot"></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:straitLayers(),zoom:false,insets:o.inset?[o.inset.id]:[]});showStrait(m,o,'hl-shape pulse');if(!rec)wireNuance(o);
      return gotIt(()=>learn(o.id))}
    if(q.k==='findStrait'){const o=ST(q.id);const rec=q.rec&&D.s5.records.find(r=>r.id===q.rec);
      frame(rec||q.clue?x.record:x.find,`${tapQ(q)}<div class="mapslot"></div>${o.inset?`<p class="rotate-hint">${x.magHint}</p>`:''}`);
      let locked=false;const done_=(ok,hit,sx,sy)=>{locked=true;m.dot(sx,sy,ok);showStrait(m,o,ok?'hl-shape good':'hl-shape pulse');if(hit&&!ok)showStrait(m,ST(hit),'hl-shape bad');answered(q,ok);
        feedback(ok,ok?x.right:(hit?x.wrongIs(nameIn(hit)):x.miss),ok?(rec?'':o.fact(lang)):'',ok?IMG.faceHappy:IMG.faceOops,next)};
      const m=mapWidget(app.querySelector('.mapslot'),{layers:straitLayers(),insets:o.inset?[o.inset.id]:[],
        onTap:(px,py,sx,sy,sz)=>{if(locked)return;const hit=nearestStrait(px,py,sz,22);
          if(!hit&&nearInsetOnly(px,py,sz)){const fb=app.querySelector('.fb');fb.className='fb bad';fb.innerHTML=`<div class="msg"><img src="${IMG.spy}" alt=""><div><p>${esc(x.openMag)}</p></div></div>`;return}
          done_(hit===q.id,hit,sx,sy)},
        onInsetTap:(ins,px,py,sx,sy,sz)=>{if(locked)return;const list=STRAITS.filter(id=>ST(id).inset&&ST(id).inset.id===ins);
          const hit=list.find(id=>ST(id).inset.tapArea.some(pl=>inPoly(px,py,pl)))||null;done_(hit===q.id,hit,sx,sy)}});return}
    if(q.k==='whatStrait'){const o=ST(q.id);const opts=pick(STRAITS,q.id,4);
      frame(x.what,`<p class="q">${x.whatStrait}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(ST(c).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:straitLayers(),zoom:false,insets:o.inset?[o.inset.id]:[]});showStrait(m,o,'hl-shape pulse');
      return choices(q,q.id,()=>o.name[lang],()=>o.fact(lang))}
    if(q.k==='connects'||q.k==='separates'){const o=ST(q.id);const right=o[q.k];const nameOf=v=>v.map(id=>(O(id)||W(id)).name[lang]).join(x.and);
      const pool=STRAITS.map(id=>ST(id)[q.k]).filter(Boolean);const {opts,key}=sOpts(right,pool);
      frame(q.k==='connects'?x.connectsT:x.separatesT,`<p class="q">${(q.k==='connects'?x.connectsQ:x.separatesQ)(esc(o.name[lang]))}</p><div class="mapslot"></div><div class="choices">${opts.map(v=>`<button type="button" class="choice" data-o="${key(v)}">${esc(nameOf(v))}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:straitLayers(),zoom:false,insets:o.inset?[o.inset.id]:[]});showStrait(m,o,'hl-shape pulse');
      return choices(q,key(right),()=>nameOf(right),()=>'')}
    // ---- block review: label the map, write the name, pairs, true / false (data/review/block-1.json) ----
    const kindLayers=k=>({continent:CONT.map(id=>O(id).layer),ocean:CONT.map(id=>O(id).layer),river:riverLayers(),mountain:mtnLayers(),sea:seaLayers(),strait:straitLayers()})[k];
    const showAny=(m,id,cls)=>{const k=kindOf(id),o=anyObj(id);if(k==='river')m.line(riverPath(o),cls.replace('hl-shape','hl-river'));else if(k==='strait')showStrait(m,o,cls);else m.shape(o,cls)};
    if(q.k==='label'){const far=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*.55)>=10;let kind,items;
      for(const k of shuffle([...q.kinds])){const ids=({continent:CONT,ocean:OCEANS,river:RIVERS,mountain:MTNS,sea:SEAS,strait:STRAITS})[k].filter(id=>!anyObj(id).inset);
        for(let tries=0;tries<40&&!items;tries++){const pick_=[];for(const id of shuffle([...ids]))if(pick_.length<4&&pick_.every(p=>far(anyObj(p),anyObj(id))))pick_.push(id);if(pick_.length===4){kind=k;items=pick_}}
        if(items)break}
      if(!items){done++;return next()}
      const names=shuffle([...items]);const placed={};let sel=null;
      frame(x.label,`<p class="q">${x.labelQ}</p><div class="mapslot"></div><div class="lchips">${names.map((id,i)=>`<button type="button" class="choice lchip" data-o="${id}"><span class="n">${i+1}</span>${esc(anyObj(id).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:kindLayers(kind),markers:items.map(id=>({id,x:anyObj(id).x,y:anyObj(id).y,label:'?',aria:'?'})),
        onMarker:(id,el)=>{if(checked)return;if(!sel){if(placed[id]){delete placed[id];redraw()}return}for(const k in placed)if(placed[k]===sel)delete placed[k];placed[id]=sel;sel=null;redraw()}});
      let checked=false;const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn" disabled>${x.checkAns}</button>`;
      function redraw(){for(const id of items){const b=m.btn[id].el;b.querySelector('span').textContent=placed[id]?names.indexOf(placed[id])+1:'?';b.classList.toggle('set',!!placed[id])}
        app.querySelectorAll('.lchip').forEach(c=>{c.classList.toggle('sel',c.dataset.o===sel);c.classList.toggle('used',Object.values(placed).includes(c.dataset.o))});
        fb.querySelector('.btn').disabled=Object.keys(placed).length<items.length}
      app.querySelectorAll('.lchip').forEach(c=>c.onclick=()=>{if(checked)return;sel=sel===c.dataset.o?null:c.dataset.o;redraw()});
      fb.querySelector('.btn').onclick=()=>{checked=true;const ok=items.every(id=>placed[id]===id);
        for(const id of items){const b=m.btn[id].el;b.classList.remove('set');b.classList.add(placed[id]===id?'good':'bad');b.querySelector('span').textContent=names.indexOf(id)+1}
        app.querySelectorAll('.lchip').forEach(c=>c.disabled=true);answered(q,ok);
        feedback(ok,ok?x.right:x.labelBad,ok?'':names.map((id,i)=>(i+1)+' — '+anyObj(id).name[lang]).join(', '),ok?IMG.faceHappy:IMG.faceOops,next)};
      return}
    if(q.k==='write'){const o=anyObj(q.id),name=o.name[lang],chars=[...name],sep=c=>/[\s-]/.test(c);const letters=chars.filter(c=>!sep(c));const typed=[];
      frame(x.write,`<p class="q">${x.writeQ}</p><div class="mapslot"></div><div class="wslots">${name.split(/(\s+)/).filter(Boolean).map(w=>/^\s+$/.test(w)?'':`<span class="wword">${[...w].map(c=>c==='-'?'<span class="wgap">-</span>':'<span class="wslot"></span>').join('')}</span>`).join('')}</div>
        <div class="wtiles">${shuffle(letters.map((c,i)=>({c:c.toUpperCase(),i}))).map(t=>`<button type="button" class="wtile" data-i="${t.i}">${esc(t.c)}</button>`).join('')}<button type="button" class="wtile back" aria-label="⌫">⌫</button></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:kindLayers(kindOf(q.id)),zoom:false,insets:o.inset?[o.inset.id]:[]});showAny(m,q.id,'hl-shape pulse');
      const slots=[...app.querySelectorAll('.wslot')];
      const draw=()=>slots.forEach((s_,i)=>s_.textContent=typed[i]?typed[i].c:'');
      app.querySelectorAll('.wtile[data-i]').forEach(b=>b.onclick=()=>{if(typed.length>=letters.length)return;typed.push({c:b.textContent,b});b.disabled=true;draw();
        if(typed.length===letters.length){const ok=fold(typed.map(t=>t.c).join(''))===fold(letters.join(''));app.querySelectorAll('.wtile').forEach(t=>t.disabled=true);
          slots.forEach((s_,i)=>{s_.textContent=letters[i].toUpperCase();s_.classList.add(ok?'good':'bad')});answered(q,ok);
          feedback(ok,ok?x.right:x.wrongIs(name),ok?(o.disputed?'':o.fact(lang)):'',ok?IMG.faceHappy:IMG.faceOops,next)}});
      app.querySelector('.wtile.back').onclick=()=>{const t_=typed.pop();if(t_){t_.b.disabled=false;draw()}};
      return}
    // rows: {s: id, left, right, key}; a right-hand button matches when its row has the same key (two rivers may flow into one sea)
    // the right column never puts an answer opposite its own pair (Svetlana, 26.10.2026: otherwise there is nothing to think about)
    const pairsUI=(hint,rows,cls)=>{const left=shuffle([...rows]);let right,tries=0;do right=shuffle([...rows]);while(tries++<200&&right.some((r,i)=>r.key===left[i].key));const keyOf=s=>rows.find(r=>r.s===s).key;let sel=null,mistakes=0,matched=0;
      frame(x.pairs,`<p class="q">${x.pairsQ}</p><p class="rotate-hint" style="margin:0">${hint}</p><div class="pairs ${cls}"><div class="pcol">${left.map(r=>`<button type="button" class="choice pbtn" data-s="${r.s}">${esc(r.left)}</button>`).join('')}</div>
        <div class="pcol">${right.map(r=>`<button type="button" class="choice pbtn" data-r="${r.s}">${esc(r.right)}</button>`).join('')}</div></div>`);
      app.querySelectorAll('.pbtn').forEach(b=>b.onclick=()=>{if(b.disabled)return;
        if(b.dataset.s){app.querySelectorAll('.pbtn[data-s]').forEach(c=>c.classList.toggle('sel',c===b&&!b.classList.contains('sel')));sel=b.classList.contains('sel')?b.dataset.s:null;return}
        if(!sel)return;const subj=sel,lb=app.querySelector(`.pbtn[data-s="${subj}"]`),ok=keyOf(subj)===keyOf(b.dataset.r);
        if(ok){lb.classList.remove('sel');[lb,b].forEach(c=>{c.classList.add('right');c.disabled=true});sel=null;matched++;
          if(matched===rows.length){answered(q,mistakes===0);feedback(mistakes===0,x.pairsOk,'',mistakes===0?IMG.faceHappy:IMG.faceOops,next)}}
        else{mistakes++;b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),500)}})};
    if(q.k==='pairs'){const rels=D.b.rev.relations.filter(r=>r.relation===q.rel&&typeof r.subject==='string'&&r.object&&(r.use==='yes'||(r.use==='after-card'&&S.learned.includes(r.requiresCard))));
      const key=v=>[v].flat().join('+'),nameOf=v=>[v].flat().map(id=>anyObj(id)?anyObj(id).name[lang]:D.s2.waterName(id)[lang]).join(x.and);
      const chosen=[];for(const r of shuffle(rels))if(chosen.length<4&&!chosen.some(c=>key(c.object)===key(r.object)))chosen.push(r);
      pairsUI(x.pairsT[q.rel],chosen.map(r=>({s:r.subject,left:nameOf(r.subject),right:nameOf(r.object),key:key(r.object)})),'');return}
    // ---- lesson 4 «Records»: approved record texts only (records.items); the map never gives the answer away ----
    const recOf=id=>D.b.rev.records.items.find(r=>r.id===id);
    if(q.k==='recPairs'){pairsUI(x.recPairsT,q.recs.map(recOf).map(r=>({s:r.id,left:anyObj(r.object).name[lang],right:r.clue[lang],key:r.object})),'rec');return}
    if(q.k==='recTf'){const r=recOf(q.rec),truth=q.side==='true';
      frame(x.tf,`<div class="card"><div class="intro-pip"><img src="${IMG.wonder}" alt=""><h3>${x.record}</h3></div><p class="q" style="margin:0">${esc(r[q.side][lang])}</p></div><div class="choices tfrow"><button type="button" class="choice" data-o="true">${x.tfYes}</button><button type="button" class="choice" data-o="false">${x.tfNo}</button></div>`);
      app.querySelectorAll('.tfrow .choice').forEach(b=>b.onclick=()=>{const ok=(b.dataset.o==='true')===truth;app.querySelectorAll('.tfrow .choice').forEach(c=>{c.disabled=true;if((c.dataset.o==='true')===truth)c.classList.add('right')});
        if(!ok)b.classList.add('wrong');answered(q,ok);feedback(ok,ok?x.right:x.tfRight,truth&&ok?'':r.true[lang],ok?IMG.faceHappy:IMG.faceOops,next)});
      return}
    if(q.k==='recWhat'){const k=kindOf(q.id),opts=pick({continent:CONT,ocean:OCEANS,river:RIVERS,mountain:MTNS,sea:SEAS,strait:STRAITS}[k],q.id,4);
      frame(x.what,`<div class="card"><div class="intro-pip"><img src="${IMG.wonder}" alt=""><h3>${x.record}</h3></div><p class="q" style="margin:0">${esc(q.clue[lang])}</p></div><p class="rotate-hint" style="margin:0">${x.recWhatQ}</p><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(anyObj(c).name[lang])}</button>`).join('')}</div>`);
      return choices(q,q.id,()=>anyObj(q.id).name[lang],()=>q.say[lang])}
    if(q.k==='tf'){const p=D.b.rev.trueFalse.pairs.find(v=>v.id===q.pair),truth=q.side==='true',subj=[p.subject].flat()[0];
      frame(x.tf,`<div class="card"><p class="q" style="margin:0">${esc(p[q.side][lang])}</p></div><div class="mapslot"></div><div class="choices tfrow"><button type="button" class="choice" data-o="true">${x.tfYes}</button><button type="button" class="choice" data-o="false">${x.tfNo}</button></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:kindLayers(kindOf(subj)),zoom:false,insets:anyObj(subj).inset?[anyObj(subj).inset.id]:[]});showAny(m,subj,'hl-shape pulse');
      app.querySelectorAll('.tfrow .choice').forEach(b=>b.onclick=()=>{const ok=(b.dataset.o==='true')===truth;app.querySelectorAll('.tfrow .choice').forEach(c=>{c.disabled=true;if((c.dataset.o==='true')===truth)c.classList.add('right')});
        if(!ok)b.classList.add('wrong');answered({...q,id:subj},ok);feedback(ok,ok?x.right:x.tfRight,truth?'':p.true[lang],ok?IMG.faceHappy:IMG.faceOops,next)});
      return}
    // ---- section 4: seas (outlined when asked; the base map shows land and water) ----
    if(q.k==='introSea'||q.k==='introSeaRec'){const rec=q.rec&&D.s4.records.find(r=>r.id===q.rec);const o=W(rec?rec.object:q.id);
      frame(rec?x.record:x.intro,`<div class="card"><div class="intro-pip"><img src="${rec?IMG.wonder:IMG.map}" alt=""><h3>${esc(o.name[lang])}</h3></div><p>${esc(rec?rec.fact[lang]:o.fact(lang))}</p>${rec?'':nuanceBtn(o)}</div><div class="mapslot"></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:seaLayers(),zoom:false});m.shape(o,'hl-shape pulse');if(!rec)wireNuance(o);
      return gotIt(()=>learn(o.id))}
    if(q.k==='findSea'){const o=W(q.id);const rec=q.rec&&D.s4.records.find(r=>r.id===q.rec);frame(rec||q.clue?x.record:x.find,`${tapQ(q)}<div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:seaLayers(),onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const hit=nearestSea(px,py,sz,22);const ok=hit===q.id;locked=true;m.dot(sx,sy,ok);m.shape(o,ok?'hl-shape good':'hl-shape pulse');
        if(hit&&!ok)m.shape(W(hit),'hl-shape bad');answered(q,ok);
        feedback(ok,ok?x.right:(hit?x.wrongIs(nameIn(hit)):x.miss),ok?(rec?'':(o.disputed?'':o.fact(lang))):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='whatSea'){const o=W(q.id);const opts=pick(SEAS,q.id,4);
      frame(x.what,`<p class="q">${x.whatSea}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(W(c).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:seaLayers(),zoom:false});m.shape(o,'hl-shape pulse');
      return choices(q,q.id,()=>o.name[lang],()=>o.disputed?'':o.fact(lang))}
    if(q.k==='seaCard'){const c=D.s4.card;if(!c){done++;return next()}
      frame(x.intro,`<div class="card"><div class="intro-pip"><img src="${IMG.map}" alt=""><h3>${esc(W('mediterranean-sea').name[lang])} · ${esc(W('black-sea').name[lang])}</h3></div><p>${esc(c.text[lang])}</p></div><div class="mapslot"></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:seaLayers(),zoom:false});m.shape(O('atlantic-ocean'),'hl-shape sel');m.shape(W('mediterranean-sea'),'hl-shape pulse');m.shape(W('black-sea'),'hl-shape pulse');
      return gotIt(()=>learn(c.id))}
    if(q.k==='seaOcean'){const o=W(q.id);const right=o.ocean||'none';const opts=right==='none'?[...pick(OCEANS,'indian-ocean',3),'none']:pick(OCEANS,right,4);
      const label=c=>c==='none'?x.seaNone:O(c).name[lang];
      frame(x.ocean,`<p class="q">${x.seaOcean(esc(o.name[lang]))}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(label(c))}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:seaLayers(),zoom:false});m.shape(o,'hl-shape pulse');
      return choices(q,right,()=>label(right),()=>'')}
    // in the block review the Gulf of Oman (section 5) counts too (Svetlana, 26.10.2026); a tap inside its small outline picks it over the Arabian Sea
    if(q.k==='allIndian'){const gulfs=q.all?['gulf-of-oman']:[],want=[...SEAS.filter(id=>W(id).ocean==='indian-ocean'&&(q.all||W(id).unit<=2)),...gulfs];const sel=new Set();
      frame(x.find,`<p class="q">${x.allIndian}</p><div class="mapslot"></div><p class="rotate-hint">${x.allIndianHint}</p>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:seaLayers(),onTap:(px,py,sx,sy,sz)=>{
        const hit=gulfs.find(id=>inside(ST(id),px,py))||nearestSea(px,py,sz,26)||gulfs.find(id=>edgePx(ST(id),px,py,sz.W,sz.H)<=22);if(!hit)return;
        if(sel.has(hit))sel.delete(hit);else sel.add(hit);redraw()}});
      function redraw(){m.clearShapes();sel.forEach(id=>m.shape(anyObj(id),'hl-shape sel'));const b=app.querySelector('.fb .btn');if(b)b.disabled=!sel.size}
      const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn" disabled>${x.checkAns}</button>`;redraw();
      fb.querySelector('.btn').onclick=()=>{const ok=want.every(id=>sel.has(id))&&[...sel].every(id=>want.includes(id));
        m.clearShapes();want.forEach(id=>m.shape(anyObj(id),'hl-shape good'));answered(q,ok);
        feedback(ok,ok?x.allIndianOk:x.allIndianBad,want.map(id=>anyObj(id).name[lang]).join(', '),ok?IMG.faceHappy:IMG.faceOops,next)};return}
    // ---- section 3: mountains (all ranges drawn; the asked one is outlined) ----
    if(q.k==='introMtn'||q.k==='introMtnRec'){const rec=q.rec&&D.s3.records.find(r=>r.id===q.rec);const o=M(rec?rec.object:q.id);
      frame(rec?x.record:x.intro,`<div class="card"><div class="intro-pip"><img src="${rec?IMG.wonder:IMG.map}" alt=""><h3>${esc(o.name[lang])}</h3></div><p>${esc(rec?rec.fact[lang]:o.fact(lang))}</p>${rec?'':nuanceBtn(o)}</div><div class="mapslot"></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:mtnLayers(),zoom:false});m.shape(o,'hl-shape pulse');if(!rec)wireNuance(o);
      return gotIt(()=>learn(o.id))}
    if(q.k==='findMtn'){const o=M(q.id);const rec=q.rec&&D.s3.records.find(r=>r.id===q.rec);frame(rec||q.clue?x.record:x.find,`${tapQ(q)}<div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:mtnLayers(),onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const hit=nearestMtn(px,py,sz,22);const ok=hit===q.id;locked=true;m.dot(sx,sy,ok);m.shape(o,ok?'hl-shape good':'hl-shape pulse');
        if(hit&&!ok)m.shape(M(hit),'hl-shape bad');answered(q,ok);
        feedback(ok,ok?x.right:(hit?x.wrongIs(nameIn(hit)):x.miss),ok?(rec?'':(o.disputed?'':o.fact(lang))):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='whatMtn'){const o=M(q.id);const opts=pick(MTNS,q.id,4);
      frame(x.what,`<p class="q">${x.whatMtn}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(M(c).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:mtnLayers(),zoom:false});m.shape(o,'hl-shape pulse');
      return choices(q,q.id,()=>o.name[lang],()=>o.disputed?'':o.fact(lang))}
    if(q.k==='mtnCont'){const o=M(q.id);const opts=pick(CONT,o.continent,4);
      frame(x.onCont,`<p class="q">${x.mtnCont(esc(o.name[lang]))}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(O(c).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:mtnLayers(),zoom:false});m.shape(o,'hl-shape pulse');
      return choices(q,o.continent,()=>O(o.continent).name[lang],()=>'')}
    if(q.k==='mtnBorder'){const o=M(q.id);const pairs=[o.border,['asia','africa'],['europe','africa'],['north-america','south-america']];const key=p=>p.join('+');
      const nameOf=p=>p.map(c=>O(c).name[lang]).join(x.and);
      frame(x.border,`<p class="q">${x.mtnBorder(esc(o.name[lang]))}</p><div class="mapslot"></div><div class="choices">${shuffle([...pairs]).map(p=>`<button type="button" class="choice" data-o="${key(p)}">${esc(nameOf(p))}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:mtnLayers(),zoom:false});m.shape(o,'hl-shape pulse');
      return choices(q,key(o.border),()=>nameOf(o.border),()=>'')}
    if(q.k==='mtnOcean'){const o=M(q.id);const opts=pick(OCEANS,o.ocean,4);
      frame(x.ocean,`<p class="q">${x.mtnOcean(esc(o.name[lang]))}</p><div class="mapslot"></div><div class="choices">${opts.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(O(c).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:mtnLayers(),zoom:false});m.shape(o,'hl-shape pulse');
      return choices(q,o.ocean,()=>O(o.ocean).name[lang],()=>'')}
    if(q.k==='allAfrica'){const want=MTNS.filter(id=>M(id).continent==='africa');const sel=new Set();
      frame(x.find,`<p class="q">${x.allAfrica}</p><div class="mapslot"></div><p class="rotate-hint">${x.allHint.replace(/реки|rivers/,L()==='ru'?'горы':'mountains')}</p>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:mtnLayers(),onTap:(px,py,sx,sy,sz)=>{const hit=nearestMtn(px,py,sz,26);if(!hit)return;
        if(sel.has(hit))sel.delete(hit);else sel.add(hit);redraw()}});
      function redraw(){m.clearShapes();sel.forEach(id=>m.shape(M(id),'hl-shape sel'));const b=app.querySelector('.fb .btn');if(b)b.disabled=!sel.size}
      const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn" disabled>${x.checkAns}</button>`;redraw();
      fb.querySelector('.btn').onclick=()=>{const ok=want.every(id=>sel.has(id))&&[...sel].every(id=>want.includes(id));
        m.clearShapes();want.forEach(id=>m.shape(M(id),'hl-shape good'));answered(q,ok);
        feedback(ok,ok?x.allAfricaOk:x.allAfricaBad,want.map(id=>M(id).name[lang]).join(', '),ok?IMG.faceHappy:IMG.faceOops,next)};return}
    if(q.k==='findObj'){const o=O(q.id);const r=q.rec&&D.records.find(r=>r.id===q.rec);frame(r||q.clue?x.record:x.find,`${tapQ(q)}<div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:learnedLayers(),onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const hit=[...CONT,...OCEANS].map(O).find(c=>inside(c,px,py));
        // a tap on the coast counts for the asked continent / ocean even if it lands just across the shoreline (finger size, coarse outlines)
        let ok=hit?hit.id===o.id||(hit.kind!==o.kind&&edgePx(o,px,py,sz.W,sz.H)<=22):edgePx(o,px,py,sz.W,sz.H)<=22;
        if(!ok&&!hit&&o.kind==='ocean'&&!CONT.some(c=>inside(O(c),px,py))){m.dot(sx,sy,false);const fb=app.querySelector('.fb');fb.className='fb bad';
          fb.innerHTML=`<div class="msg"><img src="${IMG.faceOops}" alt=""><div><p>${esc(x.neutral)}</p></div></div>`;return}
        locked=true;m.dot(sx,sy,ok);m.shape(o,ok?'hl-shape':'hl-shape pulse');answered(q,ok);
        feedback(ok,ok?x.right:(hit?x.wrongIs(nameIn(hit.id)):x.miss),ok?(r?r.fact[lang]:(o.disputed?'':o.fact(lang))):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='whatObj'){const o=O(q.id);frame(x.what,`<p class="q">${o.kind==='ocean'?x.whatOcean:x.whatCont}</p><div class="mapslot"></div>
      <div class="choices">${q.from.map(c=>`<button type="button" class="choice" data-o="${c}">${esc(O(c).name[lang])}</button>`).join('')}</div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:learnedLayers(),zoom:false});m.shape(o,'hl-shape pulse');
      return choices(q,q.id,()=>o.name[lang],()=>o.disputed?'':o.fact(lang))}
    if(q.k==='washed'){const c=O(q.id);const want=D.relations.washedBy[q.id];const neutral=Object.keys(D.relations.neutral[q.id]||{});const sel=new Set();
      frame(x.washed,`<p class="q">${x.washedQ(acc(q.id))}</p><div class="mapslot"></div><p class="rotate-hint">${x.washedHint}</p>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:learnedLayers(),zoom:false,onTap:(px,py)=>{const hit=OCEANS.map(O).find(oc=>inside(oc,px,py));if(!hit)return;
        if(sel.has(hit.id))sel.delete(hit.id);else sel.add(hit.id);redraw()}});
      function redraw(){m.clearShapes();m.shape(c,'hl-shape cont');sel.forEach(id=>m.shape(O(id),'hl-shape sel'));const b=app.querySelector('.fb .btn');if(b)b.disabled=!sel.size}
      redraw();const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn" disabled>${x.checkAns}</button>`;
      fb.querySelector('.btn').onclick=()=>{const counted=[...sel].filter(id=>!neutral.includes(id));const ok=want.every(id=>sel.has(id))&&counted.every(id=>want.includes(id));
        m.clearShapes();m.shape(c,'hl-shape cont');want.forEach(id=>m.shape(O(id),'hl-shape good'));answered(q,ok);
        feedback(ok,ok?x.washedOk:x.washedBad,want.map(id=>O(id).name[lang]).join(', '),ok?IMG.faceHappy:IMG.faceOops,next)};return}
  }
  function choices(q,right,rightName,factText){app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const ok=b.dataset.o===right;
    app.querySelectorAll('.choice').forEach(c=>{c.disabled=true;if(c.dataset.o===right)c.classList.add('right')});if(!ok)b.classList.add('wrong');
    answered(q,ok);feedback(ok,ok?x.right:x.wrongIs(rightName()),ok?'':factText(),ok?IMG.faceHappy:IMG.faceOops,next)})}
  function finish(){const sec=Math.round((Date.now()-t0)/1000);const xp=10+Math.max(0,5-wrong);S.done[id]=true;S.xp+=xp;bumpStreak();save();
    h(`<section class="screen done"><img class="pip" src="${IMG.cheer}" alt=""><h2>${x.lessonDone}</h2>
     <div class="tiles"><div class="tile"><small>${x.xp}</small><b>+${xp}</b></div><div class="tile"><small>${x.acc}</small><b>${Math.round(total/(total+wrong)*100)}%</b></div><div class="tile"><small>${x.time}</small><b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b></div></div>
     ${nextBtns(id)}</section>`);wireNext(id)}
  next();
}

/* ---------- GeoWords: approved finals and review puzzles built by the approved rules ---------- */
function finalPuzzle(st){if(st.sec>=7)EUSEC=st.sec;const role=st.kind==='section'?'section-final':'unit-final';const G=st.sec?SD(st).geo:D.geo,DI=st.sec?SD(st).dict:D.dict;
  const P=G.puzzles.find(p=>p.role===role&&p.language===L()&&p.approval?.status==='approved'&&(role==='section-final'||p.unit===st.unit));
  const unitIdx=st.kind==='section'?DI.units.length-1:st.unit-1;
  const w=DI.units[unitIdx].words[L()].find(w=>w.role===role||w.role==='final');
  return {kind:st.kind,stepId:st.id,answer:P.answer,markers:P.markers,clues:P.clues.map(c=>({markerId:c.markerId,position:c.position,text:c.text})),
    layers:(P.layers||[]).map(p=>p.split('/').pop().replace('.webp','')),definition:w?w.definition:'',needsZoom:!!P.needsZoom,insets:P.showInsets||[],eu:st.sec>=7,stamp:st.sec===10?IMG.euCard:st.sec===9?IMG.stamp3:st.sec===8?IMG.stamp2:st.sec===7?IMG.euCard:st.sec===5?IMG.stamp5:st.sec===4?IMG.stamp4:st.sec===3?IMG.stamp3:st.sec===2?IMG.stamp2:IMG.stamp}}
// Block final (data/geowords/block-1.json): one approved puzzle per language, letters on objects of all five sections; passport stamp.
function blockPuzzle(st){const P=D.b.geo.puzzles.find(p=>p.role==='block-final'&&p.language===L()&&p.approval?.status==='approved');
  const w=D.b.dict.units.find(u=>u.id==='block-final').words[L()].find(w=>w.role==='block-final');
  return {kind:'block',stepId:st.id,answer:P.answer,markers:P.markers,clues:P.clues.map(c=>({markerId:c.markerId,position:c.position,text:c.text})),
    layers:(P.layers||[]).map(p=>p.split('/').pop().replace('.webp','')),definition:w?w.definition:'',needsZoom:!!P.needsZoom,insets:P.showInsets||[],stamp:IMG.stampBlock}}
// Reveal order (docs/app-mechanics.md, rule 5): neighbours never one after another; first letter late; last letters not early.
function revealOrder(n){const long=n>=7,endN=n<=8?2:3;
  for(let tries=0;tries<20000;tries++){const o=shuffle([...Array(n)].map((_,i)=>i+1));let ok=true;
    for(let i=1;i<n&&ok;i++)if(Math.abs(o[i]-o[i-1])===1)ok=false;
    if(!ok)continue;
    if(long){if(!o.slice(-3).includes(1))continue;const ends=[...Array(endN)].map((_,i)=>n-i);if(o.slice(0,3).some(p=>ends.includes(p)))continue}
    else{if(!o.slice(-2).includes(1))continue;if(o.slice(0,2).includes(n))continue}
    return o}
  return null}
// Places a child already knows after finishing `unit` (clue-templates rules): bare directions only in unit 1, whole continents, oceans from unit 3, records from unit 4.
function knownPlaces(unit){const tpl=D.tpl.objects;
  if(unit===1)return tpl.filter(o=>o.learnedInUnit===1).map(o=>({id:o.id,x:o.x,y:o.y,place:o.place}));
  const out=[];for(const id of [...CONT,...(unit>=3?OCEANS:[])]){const o=O(id),tp=tpl.find(p=>p.id===id);
    const phrase=unit>=4&&tp.record&&tp.record.learnedInUnit<=unit&&Math.random()<.5?tp.record:tp.place;
    out.push({id,x:o.x,y:o.y,place:phrase})}// marker on the approved map label of the object
  return out}
function eligibleReviewWords(unit,places=knownPlaces(unit)){
  const lang=L(),words=[],fold=s=>s.toUpperCase().replace(/Ё/g,'Е');
  for(let u=0;u<Math.min(unit,4);u++)for(const w of D.dict.units[u].words[lang])
    if(w.role==='review'&&w.approval?.status==='approved')words.push(w);
  return words.filter(w=>{const n=[...w.answer].length;return n<=places.length&&
    places.filter(p=>!fold(p.place[lang]).includes(fold(w.answer))).length>=n});
}
function practicePuzzle(unit){
  const lang=L(),places=knownPlaces(unit),words=eligibleReviewWords(unit,places);
  if(!words.length)return null;
  const fresh=words.filter(w=>!S.recent.includes(w.answer));
  const other=words.filter(w=>w.answer!==S.recent[0]);
  const pool=fresh.length?fresh:other.length?other:words;
  const w=pool[Math.floor(Math.random()*pool.length)];const letters=[...w.answer],n=letters.length;
  const order=revealOrder(n);if(!order)return null;
  const fold=s=>s.toUpperCase().replace(/Ё/g,'Е');
  const usable=places.filter(p=>!fold(p.place[lang]).includes(fold(w.answer)));
  const chosen=shuffle(usable).slice(0,n);// one letter per known object
  const markers=chosen.map((p,i)=>({id:p.id,x:p.x,y:p.y,letter:letters[i],place:p.place[lang]}));
  const ord=D.tpl.ordinals[lang],tmpl=D.tpl.template[lang];
  const clues=order.map(pos=>{const m=markers[pos-1];return {markerId:m.id,position:pos,text:tmpl.replace('{ordinal}',ord[pos-1]).replace('{place}',m.place)}});
  S.recent=[w.answer,...S.recent.filter(a=>a!==w.answer)].slice(0,3);save();
  return {kind:'practice',answer:w.answer,markers,clues,definition:w.definition,needsZoom:false,
    layers:unit===1?['world-line-equator','world-line-prime-meridian']:[...CONT.map(id=>O(id).layer),'world-line-equator']}}

/* ---------- mandatory unit practice: 6 GeoWords on learned places (Svetlana, 24.10.2026) ---------- */
const fold=s=>s.toUpperCase().replace(/Ё/g,'Е');
const ON_RU={nile:'на Ниле',amazon:'на Амазонке',mississippi:'на Миссисипи',yangtze:'на Янцзы','huang-he':'на Хуанхэ',ganges:'на Ганге',indus:'на Инде',danube:'на Дунае',volga:'на Волге'};
const ON_EN={nile:'on the Nile',amazon:'on the Amazon',mississippi:'on the Mississippi',yangtze:'on the Yangtze','huang-he':'on the Yellow River',ganges:'on the Ganges',indus:'on the Indus',danube:'on the Danube',volga:'on the Volga'};
// place phrases exactly as in the approved section-3 GeoWords clues
const IN_RU={himalayas:'в Гималаях',ural:'на Урале',cordillera:'в Кордильерах',andes:'в Андах',appalachians:'в Аппалачах','east-africa':'в горах Восточной Африки','great-dividing-range':'на Большом Водораздельном хребте',
  atlas:'в Атласских горах',caucasus:'на Кавказе',pyrenees:'в Пиренеях','mid-atlantic-ridge':'на Срединно-Атлантическом хребте'};
const IN_EN={himalayas:'in the Himalayas',ural:'in the Urals',cordillera:'in the North American Cordillera',andes:'in the Andes',appalachians:'in the Appalachians','east-africa':'in the mountains of East Africa',
  'great-dividing-range':'in the Great Dividing Range',atlas:'in the Atlas',caucasus:'in the Caucasus',pyrenees:'in the Pyrenees','mid-atlantic-ridge':'on the Mid-Atlantic Ridge'};
const STR_RU={'suez-canal':'в Суэцком канале','panama-canal':'в Панамском канале','strait-of-gibraltar':'в Гибралтарском проливе','english-channel':'в проливе Ла-Манш',
  'bab-el-mandeb':'в Баб-эль-Мандебском проливе','strait-of-hormuz':'в Ормузском проливе','gulf-of-oman':'в Оманском заливе','strait-of-malacca':'в Малаккском проливе',
  'mozambique-channel':'в Мозамбикском проливе','drake-passage':'в проливе Дрейка','strait-of-magellan':'в Магеллановом проливе'};
const STR_EN={'suez-canal':'in the Suez Canal','panama-canal':'in the Panama Canal','strait-of-gibraltar':'in the Strait of Gibraltar','english-channel':'in the English Channel',
  'bab-el-mandeb':'in the Bab-el-Mandeb','strait-of-hormuz':'in the Strait of Hormuz','gulf-of-oman':'in the Gulf of Oman','strait-of-malacca':'in the Strait of Malacca',
  'mozambique-channel':'in the Mozambique Channel','drake-passage':'in the Drake Passage','strait-of-magellan':'in the Strait of Magellan'};
const SEA_RU={'mediterranean-sea':'в Средиземном море','black-sea':'в Чёрном море','red-sea':'в Красном море','caspian-sea':'в Каспийском море','arabian-sea':'в Аравийском море',
  'bay-of-bengal':'в Бенгальском заливе','coral-sea':'в Коралловом море','caribbean-sea':'в Карибском море','gulf-of-mexico':'в Мексиканском заливе','hudson-bay':'в Гудзоновом заливе'};
const SEA_EN={'mediterranean-sea':'in the Mediterranean Sea','black-sea':'in the Black Sea','red-sea':'in the Red Sea','caspian-sea':'in the Caspian Sea','arabian-sea':'in the Arabian Sea',
  'bay-of-bengal':'in the Bay of Bengal','coral-sea':'in the Coral Sea','caribbean-sea':'in the Caribbean Sea','gulf-of-mexico':'in the Gulf of Mexico','hudson-bay':'in Hudson Bay'};
// Practice places from section 2 on: the current section's learned objects first, then everything from earlier sections (rivers, mountains,
// seas, straits); continents and oceans only fill in when a long word needs more places (Svetlana, 25.10.2026: practise rivers and mountains, not continents).
const placeOf={2:id=>({id:id+'-river',x:R(id).x,y:R(id).y,place:{ru:ON_RU[id],en:ON_EN[id]}}),3:id=>({id,x:M(id).x,y:M(id).y,place:{ru:IN_RU[id],en:IN_EN[id]}}),
  4:id=>({id,x:W(id).x,y:W(id).y,place:{ru:SEA_RU[id],en:SEA_EN[id]}}),5:id=>({id,x:ST(id).x,y:ST(id).y,place:{ru:STR_RU[id],en:STR_EN[id]}})};
const secIds={2:()=>RIVERS.map(id=>[id,R(id).unit]),3:()=>MTNS.map(id=>[id,M(id).unit]),4:()=>SEAS.map(id=>[id,W(id).unit]),5:()=>STRAITS.filter(id=>!ST(id).inset).map(id=>[id,ST(id).unit])};
// River ends (Svetlana, 25.10.2026): «at the mouth» always comes with «at the source» of the same river (the Nile and the Amazon: mouth only),
// never with «on» that river. A river is one group: at most its «on» letter, or its mouth (+ source).
const MOUTH_RU={nile:'в устье Нила',amazon:'в устье Амазонки',mississippi:'в устье Миссисипи',yangtze:'в устье Янцзы','huang-he':'в устье Хуанхэ',ganges:'в устье Ганга',indus:'в устье Инда',danube:'в устье Дуная',volga:'в устье Волги'};
const SOURCE_RU={mississippi:'в истоке Миссисипи',yangtze:'в истоке Янцзы','huang-he':'в истоке Хуанхэ',ganges:'в истоке Ганга',indus:'в истоке Инда',danube:'в истоке Дуная',volga:'в истоке Волги'};
const riverEnds=(id,pri)=>{const r=R(id),out=[];if(!r.mouthPt)return out;
  const mouth={id:id+'-mouth',group:id,x:r.mouthPt.x,y:r.mouthPt.y,place:{ru:MOUTH_RU[id],en:'at the mouth of '+ON_EN[id].replace(/^on /,'')},pri};
  if(r.sourcePt){const source={id:id+'-source',group:id,x:r.sourcePt.x,y:r.sourcePt.y,place:{ru:SOURCE_RU[id],en:'at the source of '+ON_EN[id].replace(/^on /,'')},pri};
    mouth.pair=source;source.pair=mouth;out.push(mouth,source)}else out.push(mouth);
  return out};
// Block 2 «Europe» (data/geowords/b2-section-1.json rules): letters only on the learned objects of the Europe map, at the label point
// (the Ural River: on its line); an object never shares a puzzle with the one that contains it (Svetlana, 26.10.2026: the Mediterranean
// and the Atlantic are separate areas on this map and may share a puzzle).
const EU_PLACE={'atlantic-ocean':['в Атлантическом океане','in the Atlantic Ocean'],'arctic-ocean':['в Северном Ледовитом океане','in the Arctic Ocean'],
  'mediterranean-sea':['в Средиземном море','in the Mediterranean Sea'],'ural-mountains':['в Уральских горах','in the Ural Mountains'],'ural-river':['на реке Урал','on the Ural River'],
  'caspian-sea':['в Каспийском море','in the Caspian Sea'],'scandinavian-peninsula':['на Скандинавском полуострове','on the Scandinavian Peninsula'],
  'kola-peninsula':['на Кольском полуострове','on the Kola Peninsula'],jutland:['на полуострове Ютландия','on the Jutland Peninsula'],
  'iberian-peninsula':['на Пиренейском полуострове','on the Iberian Peninsula'],'apennine-peninsula':['на Апеннинском полуострове','on the Apennine Peninsula'],
  'balkan-peninsula':['на Балканском полуострове','on the Balkan Peninsula'],'crimean-peninsula':['на Крымском полуострове','on the Crimean Peninsula'],
  'great-britain':['на острове Великобритания','on the island of Great Britain'],ireland:['на острове Ирландия','on the island of Ireland'],
  iceland:['на острове Исландия','on the island of Iceland'],sicily:['на острове Сицилия','on the island of Sicily'],'baltic-sea':['в Балтийском море','in the Baltic Sea'],
  'north-sea':['в Северном море','in the North Sea'],'barents-sea':['в Баренцевом море','in the Barents Sea']};
const EU_IN={'north-sea':['atlantic-ocean'],'baltic-sea':['atlantic-ocean'],'barents-sea':['arctic-ocean'],'great-britain':['atlantic-ocean'],ireland:['atlantic-ocean'],
  iceland:['atlantic-ocean'],sicily:['mediterranean-sea'],
  // a range and the land of the same name (Svetlana, 28.10.2026: points of different objects never coincide)
  'scandinavian-mountains':['scandinavian-peninsula'],'balkan-mountains':['balkan-peninsula'],apennines:['apennine-peninsula'],pyrenees:['iberian-peninsula'],
  'scottish-highlands':['great-britain'],
  // a country and the island, peninsula or range that lies in it or bears its name (Svetlana, 28.10.2026)
  'united-kingdom':['great-britain'],'ireland-country':['ireland'],'iceland-country':['iceland'],norway:['scandinavian-peninsula'],sweden:['scandinavian-peninsula'],
  denmark:['jutland'],spain:['iberian-peninsula'],portugal:['iberian-peninsula']};
const EU10_IN={'united-kingdom':['в Великобритании','in the United Kingdom'],'ireland-country':['в Ирландии','in Ireland'],france:['во Франции','in France'],
  netherlands:['в Нидерландах','in the Netherlands'],belgium:['в Бельгии','in Belgium'],'luxembourg-country':['в Люксембурге','in Luxembourg'],spain:['в Испании','in Spain'],
  portugal:['в Португалии','in Portugal'],norway:['в Норвегии','in Norway'],sweden:['в Швеции','in Sweden'],denmark:['в Дании','in Denmark'],finland:['в Финляндии','in Finland'],
  'iceland-country':['в Исландии','in Iceland']};
const BENELUX=['netherlands','belgium','luxembourg-country'];
const EU_PT={'ural-river':{x:81.4,y:57.08}};
const EU9_IN={pyrenees:['в Пиренеях','in the Pyrenees'],alps:['в Альпах','in the Alps'],apennines:['в Апеннинах','in the Apennines'],carpathians:['в Карпатах','in the Carpathians'],
  'balkan-mountains':['в Балканских горах','in the Balkan Mountains'],'dinaric-alps':['на Динарском нагорье','in the Dinaric Alps'],
  'scandinavian-mountains':['в Скандинавских горах','in the Scandinavian Mountains'],'scottish-highlands':['на Шотландском нагорье','in the Scottish Highlands'],caucasus:['на Кавказе','in the Caucasus']};
const euNested=(a,b)=>(EU_IN[a.id]||[]).includes(b.id)||(EU_IN[b.id]||[]).includes(a.id)||inside(E(b.id),a.x,a.y)||inside(E(a.id),b.x,b.y);
const EU8_ON={volga:['на Волге','on the Volga'],don:['на Дону','on the Don'],dnieper:['на Днепре','on the Dnieper'],dniester:['на Днестре','on the Dniester'],
  danube:['на Дунае','on the Danube'],rhine:['на Рейне','on the Rhine'],elbe:['на Эльбе','on the Elbe'],oder:['на Одере','on the Oder'],vistula:['на Висле','on the Vistula'],
  thames:['на Темзе','on the Thames'],seine:['на Сене','on the Seine'],loire:['на Луаре','on the Loire'],rhone:['на Роне','on the Rhône'],po:['на реке По','on the Po'],
  tiber:['на Тибре','on the Tiber'],tagus:['на Тахо','on the Tagus'],douro:['на Дуэро','on the Douro'],guadiana:['на Гвадиане','on the Guadiana'],ebro:['на Эбро','on the Ebro'],
  guadalquivir:['на Гвадалквивире','on the Guadalquivir']};
// Rivers of Europe: letters on the learned rivers (at the middle of the river's longest line) first, then on every object of section 1
const EU8_PT=id=>EU_PT[id]||{x:E(id).x,y:E(id).y};
function placesFor(st){
  if(!st.sec)return knownPlaces(st.unit);
  if(st.sec===8){EUSEC=8;const u=st.unit==='S'?4:st.unit;
    return [...EU8_IDS.filter(id=>E(id)&&E(id).unit<=u).map(id=>({id,...EU8_PT(id),place:{ru:EU8_ON[id][0],en:EU8_ON[id][1]},pri:0,eu:true})),
      ...EU_IDS.filter(id=>D.s7.eu[id]).map(id=>({id,...EU8_PT(id),place:{ru:EU_PLACE[id][0],en:EU_PLACE[id][1]},pri:1,eu:true}))]}
  // Mountains of Europe: letters on the learned ranges (at the point of the range farthest from its edge) first, then on the objects of section 1
  // (rivers, the Ural River too, are not drawn on the mountains map); a range and the peninsula or island of the same name never share a puzzle (EU_IN)
  if(st.sec===9){EUSEC=9;const u=st.unit==='S'?3:st.unit;
    return [...EU9_IDS.filter(id=>E(id)&&E(id).unit<=u).map(id=>({id,x:E(id).x,y:E(id).y,place:{ru:EU9_IN[id][0],en:EU9_IN[id][1]},pri:0,eu:true})),
      ...EU_IDS.filter(id=>D.s7.eu[id]&&id!=='ural-river').map(id=>({id,x:E(id).x,y:E(id).y,place:{ru:EU_PLACE[id][0],en:EU_PLACE[id][1]},pri:1,eu:true}))]}
  // Countries and capitals: letters at the centre of the learned countries (never on a capital dot) first, then on the objects of section 1
  // (the Ural River is not drawn on the capitals map; Crimea never appears in country tasks); at most one Benelux country per puzzle (one group); spacing 9% (buildPuzzle).
  // The rivers of section 2 are drawn on this map and take letters too, as often as the countries (Svetlana, 28.10.2026: GeoWords must practise the rivers);
  // a river whose letter lies inside a country never shares a puzzle with it (euNested)
  if(st.sec===10){EUSEC=10;const u=st.unit==='S'?3:st.unit;
    return [...EU10_IDS.filter(id=>E(id)&&E(id).unit<=u).map(id=>({id,x:E(id).x,y:E(id).y,place:{ru:EU10_IN[id][0],en:EU10_IN[id][1]},pri:0,eu:true,...(BENELUX.includes(id)?{group:'benelux'}:{})})),
      ...EU8_IDS.filter(id=>D.s8.eu[id]).map(id=>({id,...EU8_PT(id),place:{ru:EU8_ON[id][0],en:EU8_ON[id][1]},pri:0,eu:true,river:true})),
      ...EU_IDS.filter(id=>D.s7.eu[id]&&id!=='ural-river'&&id!=='crimean-peninsula').map(id=>({id,x:E(id).x,y:E(id).y,place:{ru:EU_PLACE[id][0],en:EU_PLACE[id][1]},pri:1,eu:true}))]}
  if(st.sec===7){EUSEC=7;return EU().filter(id=>E(id).unit<=st.unit).map(id=>({id,...(EU_PT[id]||{x:E(id).x,y:E(id).y}),place:{ru:EU_PLACE[id][0],en:EU_PLACE[id][1]},pri:0,eu:true}))}
  const out=secIds[st.sec]().filter(([,u])=>u<=st.unit).map(([id])=>({...placeOf[st.sec](id),pri:0}));
  for(let k=2;k<st.sec;k++)for(const [id] of secIds[k]())out.push({...placeOf[k](id),pri:1});
  for(const p of [...out])if(p.id.endsWith('-river')){p.group=p.id.slice(0,-6);out.push(...riverEnds(p.group,p.pri))}
  const tpl=D.tpl.objects;for(const id of [...CONT,...OCEANS]){const o=O(id),tp=tpl.find(p=>p.id===id);out.push({id,x:o.x,y:o.y,place:tp.place,pri:2})}
  return out}
const layersFor=st=>st.sec>=7?[]:st.sec?[...CONT.map(id=>O(id).layer),...RIVERS.map(id=>R(id).layer),...(st.sec>=3?MTNS.map(id=>M(id).layer):[]),...(st.sec===5?['world-canal-suez-canal','world-canal-panama-canal']:[])]:st.unit===1?['world-line-equator','world-line-prime-meridian']:[...CONT.map(id=>O(id).layer),'world-line-equator'];
// Six words: this unit's review words first, then earlier units', then the short reserve words — only words that fit the learned places.
function practiceWords(st){const lang=L(),places=placesFor(st);
  const DI=st.sec?SD(st).dict:D.dict,ok=w=>w.approval?.status==='approved'&&[...w.answer].length<=places.filter(p=>!fold(p.place[lang]).includes(fold(w.answer))).length;
  const byLen=a=>a.sort((x,y)=>[...y.answer].length-[...x.answer].length);
  const all=DI.units.flatMap(u=>u.words[lang]),U=DI.units[st.unit-1];
  // this unit's own review words and reserve words, then its approved practiceExtra (short words of later units), then earlier units (longest first)
  const groups=[shuffle(U.words[lang].filter(w=>w.role==='review'&&ok(w))),shuffle(U.words[lang].filter(w=>w.role==='reserve'&&ok(w))),
    (U.practiceExtra?.[lang]||[]).map(a=>all.find(w=>w.answer===a)).filter(w=>w&&ok(w))];
  for(let u=st.unit-2;u>=0;u--)groups.push(byLen(shuffle(DI.units[u].words[lang].filter(w=>w.role==='review'&&ok(w)))));
  // block 1 words fill in for block 1 sections only (the Europe map has none of their places)
  if(st.sec&&st.sec<7)for(let u=3;u>=0;u--)groups.push(shuffle(D.dict.units[u].words[lang].filter(w=>w.role==='review'&&ok(w))));
  if(!(st.sec>=7))groups.push(shuffle(D.dict.units[0].words[lang].filter(w=>w.role==='reserve'&&ok(w))));
  const out=[];for(const g of groups)for(const w of g)if(!out.some(o=>o.answer===w.answer))out.push(w);// all candidates in order; runPractice keeps the first six that build
  return out}
// Never put a letter on an object and on the object that contains it in one puzzle: a range or a river and its continent,
// the Mid-Atlantic Ridge and the Atlantic, the Urals / Caucasus and Europe or Asia ("in the Atlantic" would fit two letters).
function containers(id){
  if(D.s5&&D.s5.straits[id]){const o=ST(id);return [o.ocean,...(o.connects||[]),...(o.separates||[])].filter(Boolean)}
  if(D.s4&&D.s4.seas[id]){const o=W(id);return id==='hudson-bay'?['arctic-ocean','atlantic-ocean']:[o.ocean].filter(Boolean)}
  if(D.s3&&D.s3.mtns[id]){const o=M(id);return [o.continent,o.ocean,...(o.border||[]),...(id==='caucasus'?['europe','asia']:[])].filter(Boolean)}
  const m=/-(river|mouth|source)$/.exec(id),r=m&&D.s2&&D.s2.rivers[id.slice(0,-m[0].length)];return r?[r.continent,...(m[1]==='mouth'?[r.mouth]:[])].filter(Boolean):[]}
// a letter that falls inside another object of the same puzzle (a river end on a continent, a mouth in a sea…) would fit two clues
const areaOf=id=>(D.s5&&D.s5.straits[id]&&!ST(id).inset&&ST(id))||(D.s4&&D.s4.seas[id])||(D.s3&&D.s3.mtns[id])||(O(id)&&O(id).tapArea&&O(id))||null;
const inArea=(p,q)=>{const o=areaOf(q.id);return !!(o&&q.id!==p.id&&inside(o,p.x,p.y))};
const nested=(a,b)=>containers(a.id).includes(b.id)||containers(b.id).includes(a.id)||inArea(a,b)||inArea(b,a);
function buildPuzzle(w,places,layers,usage={}){const lang=L(),letters=[...w.answer],n=letters.length;const order=revealOrder(n);if(!order)return null;
  const usable=places.filter(p=>!fold(p.place[lang]).includes(fold(w.answer)));
  const eu=places.some(p=>p.eu),far=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*(eu?1600/2200:.55))>=(eu&&EUSEC===10?9:4.5);let chosen=null;// spacing 9 for small countries: a letter marker is ~9% of the map wide on a phone (Svetlana, 28.10.2026)
  // current section first, then earlier sections, continents / oceans last (places without pri — section 1 — are all equal)
  // continents / oceans last; otherwise the places used least so far in this practice first, so every learned object turns up across the six words
  const order_=()=>shuffle([...usable]).sort((a,b)=>((a.pri===2)-(b.pri===2))||((usage[a.group||a.id]||0)-(usage[b.group||b.id]||0))||((a.pri||0)-(b.pri||0)));
  // a river group gives one «on» letter or its mouth (+ its source, always together); ends of a river are taken as a pair
  const okWith=(p,pick,sep)=>pick.every(q=>(!sep||far(p,q))&&!(eu?euNested:nested)(p,q)&&!(p.group&&q.group===p.group));
  const greedy=sep=>{const pick=[];for(const p of order_()){if(pick.length>=n||pick.includes(p))continue;
      if(p.pair){if(pick.length+2>n||!usable.includes(p.pair)||!okWith(p,pick,sep)||!okWith(p.pair,pick,sep)||(sep&&!far(p,p.pair)))continue;pick.push(p,p.pair)}
      else if(okWith(p,pick,sep))pick.push(p)}
    return pick.length===n?pick:null};
  for(let k=0;k<80&&!chosen;k++)chosen=greedy(true);
  if(!(eu&&EUSEC===10))for(let k=0;k<300&&!chosen;k++)chosen=greedy(false);// countries: never closer than the spacing rule
  if(!chosen)return null;
  const markers=chosen.map((p,i)=>({id:p.id,x:p.x,y:p.y,letter:letters[i],place:p.place[lang]}));
  const ord=D.tpl.ordinals[lang],tmpl=D.tpl.template[lang];
  const clues=order.map(pos=>{const m=markers[pos-1];return {markerId:m.id,position:pos,text:tmpl.replace('{ordinal}',ord[pos-1]).replace('{place}',m.place)}});
  return {kind:'practice',answer:w.answer,markers,clues,definition:w.definition,needsZoom:false,layers,eu}}
function runPractice(st){const places=placesFor(st),layers=layersFor(st),puzzles=[];
  // build the six puzzles first: a word that cannot be laid out by the rules is replaced by the next candidate, so there are always six when possible
  const usage={};for(const w of practiceWords(st)){if(puzzles.length===6)break;const P=buildPuzzle(w,places,layers,usage);if(P){puzzles.push(P);for(const k of P.markers){const key=k.id.replace(/-(river|mouth|source)$/,'');usage[key]=(usage[key]||0)+1}}}
  if(!puzzles.length){S.done[st.id]=true;save();return home()}
  let i=0;const go=()=>{const P=puzzles[i];P.stepId=st.id;P.seq={i,total:puzzles.length,next:()=>{i++;go()}};geowords(P)};
  go()}

function geowords(P){
  window.__gwPuzzle=P;// read by the automated play-through test
  const x=t();let step=0,wrong=0,here=0;const t0=Date.now();
  const tag=P.seq?(P.kind==='challenge'?x.cwTag:x.practiceStep)+' · '+x.wordOf(P.seq.i+1,P.seq.total):P.kind==='practice'?x.practiceTag:P.kind==='section'?x.sectionFinal:P.kind==='block'?x.blockFinal:x.final;
  h(`<section class="screen lesson gw"><div class="l-top"><button type="button" class="l-x" aria-label="${x.quit}">✕</button><div class="l-bar"><i></i></div></div>
   <div class="gw-head"><span class="kind">${esc(tag)}</span><p class="gw-clue" aria-live="polite"></p></div><div class="mapslot"></div><p class="rotate-hint">${P.needsZoom?x.zoomHint:x.rotate}</p>
   <div class="slots">${[...P.answer].map(()=>'<div class="slot"></div>').join('')}</div>
   <div class="gw-pip"><img src="${IMG.hello}" alt=""><p class="bubble">${x.pipStart}</p></div></section>`);
  app.querySelector('.l-x').onclick=()=>{const s=sheet(`<h3>${x.quitT}</h3><div class="row"><button type="button" class="btn ghost" data-a="q">${x.quit}</button><button type="button" class="btn" data-a="s">${x.stay}</button></div>`);
    s.querySelector('[data-a=q]').onclick=()=>{s.remove();home()};s.querySelector('[data-a=s]').onclick=()=>s.remove()};
  const slots=[...app.querySelectorAll('.slot')];
  const m=(P.eu?euMap:mapWidget)(app.querySelector('.mapslot'),{layers:P.layers,trail:true,insets:P.insets||[],markers:P.markers.map(k=>({id:k.id,x:k.x,y:k.y,label:k.letter,inset:k.inset})),onMarker:choose});
  if(P.eu)app.querySelector('.gw .mapbox').style.aspectRatio='2200/1600';
  const pip=(img,txt)=>{app.querySelector('.gw-pip img').src=img;app.querySelector('.bubble').textContent=txt};
  function clue(){const c=P.clues[step];app.querySelector('.gw-clue').innerHTML=esc(c.text).replace(/(\S+ букву|the \S+ letter)/,'<b>$1</b>');
    if(P.markers.find(k=>k.id===c.markerId)?.inset)pip(IMG.spy,x.magHint);
    app.querySelector('.l-bar i').style.width=(step/P.clues.length*100)+'%'}
  function choose(id,el){if(step>=P.clues.length||el.classList.contains('done'))return;const c=P.clues[step];
    if(id!==c.markerId){wrong++;here++;el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');
      if(here>=3){m.btn[c.markerId].el.classList.add('pulse');pip(IMG.spy,x.pipHint)}else pip(IMG.left,x.pipBad);return}
    here=0;el.classList.remove('pulse');el.classList.add('done');m.route(id);if(m.btn[id]&&m.btn[id].inset)setTimeout(()=>m.openInset(null),600);const k=P.markers.find(q=>q.id===id);const s=slots[c.position-1];s.textContent=k.letter;s.classList.add('new');
    pip(IMG.yes,x.pipOk(k.letter));step++;
    if(step===P.clues.length){app.querySelector('.l-bar i').style.width='100%';setTimeout(finish,800)}else setTimeout(clue,350)}
  function finish(){const sec=Math.round((Date.now()-t0)/1000);const xp=(P.kind==='practice'?10:20)+Math.max(0,6-wrong);
    const last=!P.seq||P.seq.i+1>=P.seq.total;
    if(P.stepId&&last)S.done[P.stepId]=true;S.xp+=xp;bumpStreak();save();
    const section=P.kind==='section'||P.kind==='block';
    if(P.seq){const {i,total}=P.seq;
      h(`<section class="screen done"><img class="medal" src="${IMG.faceWow}" alt=""><p class="eyebrow">${x.wordOf(i+1,total)}</p><h2>${last?(P.kind==='challenge'?x.cwAll:x.practiceAll):x.practiceDone}</h2>
       <p class="eyebrow">${x.wordDef}</p><p class="word-big" style="--n:${[...P.answer].length}">${esc(P.answer)}</p><p class="defn">${esc(P.definition)}</p>
       <div class="tiles"><div class="tile"><small>${x.xp}</small><b>+${xp}</b></div><div class="tile"><small>${x.mistakes}</small><b>${wrong}</b></div><div class="tile"><small>${x.time}</small><b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b></div></div>
       ${last?nextBtns(P.stepId):`<button type="button" class="btn" data-a="nextword">${x.nextWord(i+2,total)}</button><button type="button" class="btn ghost" data-a="home">${x.home}</button>`}</section>`);
      if(last)wireNext(P.stepId);else{app.querySelector('[data-a=home]').onclick=home;app.querySelector('[data-a=nextword]').onclick=()=>P.seq.next()}
      return}
    h(`<section class="screen done">${section?`<img class="medal" src="${P.stamp||IMG.stamp}" alt="" style="transform:rotate(-10deg)"><p class="eyebrow">${x.stampGot}</p>`:`<img class="medal" src="${P.kind==='practice'?IMG.faceWow:IMG.medal}" alt="">`}
     <h2>${P.kind==='practice'?x.practiceDone:P.kind==='block'?x.blockDone:section?x.sectionDone:x.unitDone}</h2>
     <p class="eyebrow">${x.wordDef}</p><p class="word-big" style="--n:${[...P.answer].length}">${esc(P.answer)}</p><p class="defn">${esc(P.definition)}</p>
     <div class="tiles"><div class="tile"><small>${x.xp}</small><b>+${xp}</b></div><div class="tile"><small>${x.mistakes}</small><b>${wrong}</b></div><div class="tile"><small>${x.time}</small><b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b></div></div>
     ${section?`<img src="${IMG.medalSection}" alt="" style="width:110px">`:`<img src="${IMG.cheer}" alt="" style="width:120px">`}${P.stepId&&P.kind==='final'&&!stepOf(P.stepId).sec&&canReview(stepOf(P.stepId))?`<button type="button" class="btn ghost" data-a="practice">${x.practice}</button>`:''}${P.stepId?nextBtns(P.stepId):`<button type="button" class="btn" data-a="home">${x.home}</button>`}</section>`);
    if(P.stepId){wireNext(P.stepId);const b=app.querySelector('[data-a=practice]');if(b)b.onclick=()=>startPractice(stepOf(P.stepId))}else app.querySelector('[data-a=home]').onclick=home}
  clue();
}

/* ---------- Challenge GeoWords: 3 app-generated words (rules: data/geowords/challenge-block-1-sample.json, approved 23–25.10.2026) ----------
   Words: approved review words of sections 1–5 and the challenge-extra words, each once; three words from three different sections.
   Places: about half of the letters on the word's own section (a third for 15+ letters), the rest on other sections of the block;
   about 30% of the places named by an approved record phrase, taken word for word from approved GeoWords clues (changing records never appear there).
   If a word cannot be laid out by the rules, the next one is tried; if fewer than three build, the approved sample puzzles fill in. */
function defOf(answer){const lang=L();for(const d of [D.dict,D.s2.dict,D.s3.dict,D.s4.dict,D.s5.dict,D.b.dict])for(const u of d.units||[]){const w=(u.words[lang]||[]).find(w=>w.answer===answer);if(w)return w.definition}return ''}
const CW_SECTIONS=['continents-oceans','rivers','mountains','seas','straits'];
function challengeCandidates(){const lang=L(),out=[];
  [D.dict,D.s2.dict,D.s3.dict,D.s4.dict,D.s5.dict].forEach((d,k)=>{for(const u of d.units)for(const w of u.words[lang]||[])
    if(w.role==='review'&&w.approval?.status==='approved'&&!out.some(o=>o.answer===w.answer))out.push({...w,section:CW_SECTIONS[k]})});
  for(const w of D.b.dict.units.find(u=>u.id==='challenge-extra').words[lang]||[])if(w.approval?.status==='approved'&&!out.some(o=>o.answer===w.answer))out.push({...w,section:'extra'});
  return out}
// record phrases: every place phrase of an approved clue that is not the object's plain name phrase
function recordPhrases(){if(D.b.recPh)return D.b.recPh;const bank={};
  for(const P of [D.s2.geo,D.s3.geo,D.s4.geo,D.s5.geo,D.b.geo,{puzzles:D.b.cw}].flatMap(g=>g.puzzles))if(P.approval?.status==='approved')for(const c of P.clues){
    const m=/^Найди \S+ букву (.*)\.$/.exec(c.text)||/^Find the \S+ letter (.*)\.$/.exec(c.text);if(!m)continue;
    const b=bank[c.markerId]||(bank[c.markerId]={ru:new Set(),en:new Set()});b[P.language].add(m[1])}
  return D.b.recPh=bank}
const CW_NEVER=[['suez-canal','bosporus'],['suez-canal','dardanelles'],['strait-of-hormuz','gulf-of-oman'],['drake-passage','strait-of-magellan'],['antarctica','southern-ocean']];
const CW_NEVER_LONG=[['ganges','indus'],['yangtze','huang-he']];
function challengePlaces(){const lang=L(),bank=recordPhrases(),out=[];
  const secOf={2:'rivers',3:'mountains',4:'seas',5:'straits'};
  for(let k=2;k<=5;k++)for(const [id] of secIds[k]())out.push({...placeOf[k](id),sec:secOf[k]});
  for(const p of [...out])if(p.id.endsWith('-river')){p.group=p.id.slice(0,-6);out.push(...riverEnds(p.group,0).map(e=>({...e,sec:'rivers'})))}
  for(const id of [...CONT,...OCEANS]){const o=O(id),tp=D.tpl.objects.find(q=>q.id===id);out.push({id,x:o.x,y:o.y,place:tp.place,rec:tp.record?.place||tp.record||null,sec:'continents-oceans'})}
  for(const p of out){if(p.rec&&!p.rec[lang])p.rec=null;if(p.rec)continue;
    const alt=[...(bank[p.id]?.[lang]||[])].filter(t=>t!==p.place[lang]);if(alt.length)p.rec={[lang]:alt[Math.floor(Math.random()*alt.length)]}}
  return out}
function buildChallenge(w,places){const lang=L(),letters=[...w.answer],n=letters.length,long=n>=15;const order=revealOrder(n);if(!order)return null;
  const has=t=>fold(t).includes(fold(w.answer));
  const usable=places.filter(p=>!has(p.place[lang])&&!(long&&/-(mouth|source)$/.test(p.id)));
  const quota=w.section==='extra'?0:Math.round(n/(long?3:2));
  const key=p=>p.group||p.id,fixed=p=>p.sec==='seas'||p.sec==='straits';
  const never=[...CW_NEVER,...(long?CW_NEVER_LONG:[])];
  const far=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*.55)>=5.4;
  const okWith=(p,pick)=>pick.every(q=>far(p,q)&&!nested(p,q)&&!(p.group&&q.group===p.group)&&!never.some(([a,b])=>(key(p)===a&&key(q)===b)||(key(p)===b&&key(q)===a)))
    &&!(long&&fixed(p)&&pick.filter(fixed).length>=3);
  const add=(p,pick)=>{if(p.pair){if(pick.length+2>n||!usable.includes(p.pair)||!okWith(p,pick)||!okWith(p.pair,[...pick,p])||!far(p,p.pair))return false;pick.push(p,p.pair);return true}
    if(okWith(p,pick)){pick.push(p);return true}return false};
  let chosen=null;
  for(let k=0;k<200&&!chosen;k++){const pick=[],own=shuffle(usable.filter(p=>p.sec===w.section)),other=shuffle(usable.filter(p=>p.sec!==w.section));
    for(const p of own)if(pick.length<quota&&!pick.includes(p))add(p,pick);
    for(const p of other)if(pick.length<n&&!pick.includes(p))add(p,pick);
    if(pick.length===n)chosen=pick}
  if(!chosen)return null;
  // about 30% record phrases; the Red Sea «unusually salty» phrase never next to the Mediterranean
  const med=chosen.some(p=>p.id==='mediterranean-sea');
  const markers=chosen.map((p,i)=>{const rec=p.rec&&p.rec[lang]&&!has(p.rec[lang])&&!(med&&p.id==='red-sea')&&Math.random()<.3;
    return {id:p.id,x:p.x,y:p.y,letter:letters[i],place:rec?p.rec[lang]:p.place[lang]}});
  const ord=D.tpl.ordinals[lang],tmpl=D.tpl.template[lang];if(ord.length<n)return null;
  const clues=order.map(pos=>{const m=markers[pos-1];return {markerId:m.id,position:pos,text:tmpl.replace('{ordinal}',ord[pos-1]).replace('{place}',m.place)}});
  return {kind:'challenge',section:w.section,answer:w.answer,markers,clues,definition:w.definition,needsZoom:true,insets:[],
    layers:[...CONT.map(id=>O(id).layer),...RIVERS.map(id=>R(id).layer),...MTNS.map(id=>M(id).layer),'world-canal-suez-canal','world-canal-panama-canal']}}
function challengeRound(){const recent=S.recentCw||[],places=challengePlaces(),puzzles=[];
  const words=shuffle(challengeCandidates());const ordered=[...words.filter(w=>!recent.includes(w.answer)),...words.filter(w=>recent.includes(w.answer))];
  // sections drawn evenly (the few challenge-extra words would almost never come up if words were drawn one by one)
  for(const sec of shuffle([...CW_SECTIONS,'extra']))for(const w of ordered.filter(w=>w.section===sec)){if(puzzles.length===3||puzzles.some(p=>p.section===sec))break;const P=buildChallenge(w,places);if(P)puzzles.push(P)}
  // fallback: approved sample puzzles, played exactly as approved
  for(const P of shuffle(D.b.cw.filter(p=>p.language===L())))if(puzzles.length<3&&!puzzles.some(q=>q.section===P.section||q.answer===P.answer))
    puzzles.push({kind:'challenge',section:P.section,answer:P.answer,markers:P.markers,clues:P.clues.map(c=>({markerId:c.markerId,position:c.position,text:c.text})),
      layers:(P.layers||[]).map(p=>p.split('/').pop().replace('.webp','')),definition:defOf(P.answer),needsZoom:!!P.needsZoom,insets:P.showInsets||[]});
  S.recentCw=puzzles.map(p=>p.answer);save();return puzzles}
window.__gwChallengeRound=()=>challengeRound();// read by the automated rules test
window.__gwEuSec=n=>{EUSEC=n};window.__gwEuOk=(id,x,y,sz)=>euOk(id,x,y,sz);window.__gwEuHit=(x,y,sz)=>euHit(x,y,sz);window.__gwCapHit=(x,y,sz)=>capHit(x,y,sz);// read by the automated Europe test
function challengeWords(st){const puzzles=challengeRound();puzzles.forEach(P=>P.stepId=st.id);
  let i=0;const go=()=>{const P=puzzles[i];P.seq={i,total:puzzles.length,next:()=>{i++;go()}};geowords(P)};go()}

/* ---------- Challenge: Speed Hunt (data/challenge/block-1.json, approved 23.10.2026) ---------- */
// 60 s; random order without repeats; a tap counts inside the object or within 22 CSS px of it when no other pool object is closer;
// a mistake lights the right place for 0.5 s and sends the object to the weak list; skipping is allowed; score + personal best + provisional stars.
// a river counts as «inside» within 8 px of its line, so a tap on the drawn river is not lost to the continent under it
function huntPx(id,px,py,sz){if(kindOf(id)==='river')return Math.max(0,riverPx(R(id),px,py,sz.W,sz.H)-8);const o=anyObj(id);return inside(o,px,py)?0:edgePx(o,px,py,sz.W,sz.H)}
function speedHunt(st){
  const x=t(),lang=L(),cfg=D.b.challenge.speedHunt,all=Object.values(cfg.pool).flat().filter(id=>!cfg.excluded.ids.includes(id));
  const order=shuffle([...all]);let i=0,score=0,over=false,busy=false;const end=Date.now()+cfg.durationSeconds*1000;
  h(`<section class="screen lesson hunt"><div class="l-top"><button type="button" class="l-x" aria-label="${x.quit}">✕</button><div class="l-bar"><i style="width:100%"></i></div><b class="hunt-sec"></b></div>
   <div class="task"><span class="kind">${x.huntTag}</span><p class="q">${x.huntFind} <b class="hunt-name"></b></p><div class="mapslot"></div>
   <div class="row hunt-row"><span class="chip"><span class="star">★</span><b class="hunt-score">0</b></span><button type="button" class="btn ghost" data-a="skip">${x.huntSkip}</button></div></div></section>`);
  const layers=[...CONT.map(id=>O(id).layer),...RIVERS.map(id=>R(id).layer),...MTNS.map(id=>M(id).layer),'world-canal-suez-canal','world-canal-panama-canal'];
  const show=()=>{if(i>=order.length)return finish();window.__gwHunt={target:order[i],score};app.querySelector('.hunt-name').textContent=anyObj(order[i]).name[lang]};
  const m=mapWidget(app.querySelector('.mapslot'),{layers,onTap:(px,py,sx,sy,sz)=>{if(over||busy)return;const id=order[i],d=huntPx(id,px,py,sz);
    const ok=d<=22&&!all.some(o=>o!==id&&huntPx(o,px,py,sz)<d);m.dot(sx,sy,ok);
    if(ok){score++;app.querySelector('.hunt-score').textContent=score;S.weak[id]=Math.max(0,(S.weak[id]||0)-1);i++;return show()}
    S.weak[id]=(S.weak[id]||0)+1;busy=true;const k=kindOf(id);if(k==='river')m.line(riverPath(R(id)),'hl-river good');else m.shape(anyObj(id),'hl-shape good');
    setTimeout(()=>{busy=false;m.clearShapes();i++;if(!over)show()},500)}});
  app.querySelector('[data-a=skip]').onclick=()=>{if(over||busy)return;i++;show()};
  const bar=app.querySelector('.l-bar i'),secEl=app.querySelector('.hunt-sec');
  const tick=setInterval(()=>{if(!document.body.contains(bar)){clearInterval(tick);return}const left=Math.max(0,end-Date.now());
    bar.style.width=(left/cfg.durationSeconds/10)+'%';secEl.textContent=x.huntSec(Math.ceil(left/1000));if(!left)finish()},200);
  app.querySelector('.l-x').onclick=()=>{const s=sheet(`<h3>${x.quitT}</h3><div class="row"><button type="button" class="btn ghost" data-a="q">${x.quit}</button><button type="button" class="btn" data-a="s">${x.stay}</button></div>`);
    s.querySelector('[data-a=q]').onclick=()=>{s.remove();over=true;clearInterval(tick);save();home()};s.querySelector('[data-a=s]').onclick=()=>s.remove()};
  function finish(){if(over)return;over=true;clearInterval(tick);const best=Math.max(S.hunt||0,score),rec=score>(S.hunt||0)&&score>0;S.hunt=best;
    const stars=cfg.stars.thresholds.filter(v=>score>=v).length,xp=10+score;S.done[st.id]=true;S.xp+=xp;bumpStreak();save();
    document.querySelectorAll('.sheet-back').forEach(b=>b.remove());window.__gwHunt={target:null,score,done:true};
    h(`<section class="screen done"><img class="medal" src="${IMG.stampChallenge}" alt="" style="transform:rotate(-8deg)"><h2>${x.huntDone}</h2>
     <p class="hunt-stars" aria-label="${stars}/3">${'★'.repeat(stars)}<span>${'★'.repeat(3-stars)}</span></p>
     <div class="tiles"><div class="tile"><small>${x.huntScore}</small><b>${score}</b></div><div class="tile"><small>${x.huntBest}</small><b>${best}${rec?' ✦':''}</b></div><div class="tile"><small>${x.xp}</small><b>+${xp}</b></div></div>
     ${D.b.cw.length?`<button type="button" class="btn" data-a="cw">${x.toCw}</button>`:''}<button type="button" class="btn ghost" data-a="again">${x.huntAgain}</button><button type="button" class="btn ghost" data-a="home">${x.home}</button></section>`);
    app.querySelector('[data-a=again]').onclick=()=>speedHunt(st);app.querySelector('[data-a=home]').onclick=home;const cw=app.querySelector('[data-a=cw]');if(cw)cw.onclick=()=>challengeWords(st)}
  show();
}

/* ---------- boot ---------- */
loadData().then(()=>{S.lang?home():welcome()}).catch(e=>{app.innerHTML=`<div class="loading">Не удалось загрузить данные: ${esc(e.message)}</div>`});
window.addEventListener('resize',()=>drawTrail());
})();
