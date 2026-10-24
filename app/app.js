/* GeoWords «Экспедиция» — section 1 «Continents and oceans» and section 2 «Rivers of the world» (draft lessons): units, lessons, unit-final GeoWords,
   review GeoWords built by the approved rules, and the section final with a passport stamp.
   Content comes only from approved data in /data (facts, records, relations, dictionary, GeoWords
   puzzles, clue templates, the continents/oceans map). Progress is kept on this device (localStorage). */
(()=>{
const A='../';
const KEY='geowords_expedition_v1';
const IMG={
  welcome:A+'assets/graphics/game/scene-welcome.webp',intro:A+'assets/graphics/game/intro-continents-oceans.webp',
  hello:A+'assets/pip/game/pip-hello.webp',yes:A+'assets/pip/game/pip-yes.webp',cheer:A+'assets/pip/game/pip-cheer.webp',
  map:A+'assets/pip/game/pip-map.webp',spy:A+'assets/pip/game/pip-spyglass.webp',left:A+'assets/pip/game/pip-point-left.webp',
  right:A+'assets/pip/game/pip-point-right.webp',oops:A+'assets/pip/game/pip-oops.webp',wonder:A+'assets/pip/game/pip-wonder.webp',
  faceHappy:A+'assets/pip/game/pip-face-happy.webp',faceOops:A+'assets/pip/game/pip-face-oops.webp',faceWow:A+'assets/pip/game/pip-face-wow.webp',
  streak:A+'assets/graphics/game/icon-streak.webp',nuance:A+'assets/graphics/game/icon-nuance.webp',
  medal:A+'assets/graphics/game/medal-unit.webp',medalSection:A+'assets/graphics/game/medal-section.webp',boat:A+'assets/graphics/game/path-pip-boat.webp',
  stamp:A+'assets/graphics/game/stamp-continents.webp',stamp2:A+'assets/graphics/game/stamp-rivers.webp',base:A+'assets/world-base.webp',
  layer:id=>A+'assets/layers/'+id+'.webp'
};

/* ---------- UI strings (content itself comes from data) ---------- */
const T={
 ru:{tag:'Экспедиция по карте мира с лисёнком Пипом',lead:'Короткие уроки по карте и слово-загадка в конце каждого юнита.',words:'На каком языке слова?',
  go:'В путь',soon:'Скоро',notReady:'Этот юнит ещё готовится. Пока открыт юнит 1.',nextLesson:'Следующий урок',nextFinal:'К итогу юнита',section:'Раздел 1',sectionName:'Материки и океаны',unit:'Юнит',lessonN:n=>'Урок '+n,final:'Итог юнита: GeoWords',
  locked:'Сначала пройди предыдущий шаг',start:'Начать',later:'Позже',again:'Пройти урок ещё раз',finalAgain:'Итоговое слово ещё раз',practice:'Новое слово для повторения',
  practiceNone:'Новые слова для повторения откроются в следующих юнитах: для длинных слов пока не хватает выученных мест на карте.',
  intro:'Знакомство',find:'Найди на карте',what:'Что это?',hemi:'Полушария',line:'Линии на карте',washed:'Кто кого омывает',record:'Рекорд',
  tap:n=>`Нажми на <b>${n}</b>`,whatDir:'Какая это сторона света?',whatCont:'Какой это континент?',whatOcean:'Какой это океан?',
  washedQ:n=>`Нажми на все океаны, которые омывают <b>${n}</b>`,washedHint:'Отметь океаны и нажми «Проверить».',checkAns:'Проверить',
  next:'Дальше',check:'Понятно',right:'Верно!',wrongIs:n=>`Это ${n}.`,miss:'Мимо. Вот где это.',tryLine:'Мимо линии. Вот она.',hemiWrong:'Это другое полушарие. Вот нужное.',
  neutral:'Это место не относят ни к одному океану. Попробуй ещё раз.',washedOk:'Все океаны найдены!',washedBad:'Не совсем. Вот правильные океаны.',
  nuance:'Есть нюанс',lessonDone:'Урок пройден!',xp:'Очки',acc:'Точность',time:'Время',home:'На карту пути',
  unitDone:'Юнит пройден!',sectionDone:'Раздел пройден!',stampGot:'Штамп в паспорт путешественника',practiceDone:'Слово собрано!',wordDef:'Слово-загадка',mistakes:'Ошибок',
  quitT:'Выйти из урока?',quitP:'Прогресс этого урока не сохранится.',quit:'Выйти',stay:'Продолжить',
  settings:'Настройки',lang:'Слова',reset:'Сбросить прогресс',unlock:'Открыть все шаги (для теста)',
  rotate:'↻ Поверни телефон — карта станет вдвое больше',zoomHint:'Буквы стоят близко — разведи два пальца, чтобы увеличить карту.',
  pipStart:'Капитан, прокладываем маршрут! Ищи букву по подсказке.',pipOk:l=>`Есть «${l}»! Отмечаю точку на маршруте.`,pipBad:'Не та точка. Прочитай подсказку ещё раз.',pipHint:'Сверимся с картой — нужная буква мигает.',
  practiceTag:'Повторение · собрано по правилам',sectionFinal:'Итог раздела: GeoWords',sectionN:n=>'Раздел '+n,draft:'черновик уроков',
  whatRiver:'Какая это река?',riverCont:n=>`По какому континенту течёт <b>${n}</b>?`,riverMouth:n=>`Куда впадает <b>${n}</b>?`,mouth:'Куда впадает',onCont:'Континент',
  allAsia:'Нажми на все реки Азии',allHint:'Отметь реки и нажми «Проверить».',allOk:'Все реки Азии найдены!',allBad:'Не совсем. Вот реки Азии.',riversIntro:'Перед этим разделом тебе нужно знать',
  units:[['Стороны света','Север, юг, запад, восток, экватор'],['Континенты','7 континентов'],['Океаны','5 океанов'],['Соседи и рекорды','Кто кого омывает, рекорды, полушария']],
  tester:'Тестовая сборка: прогресс хранится только на этом устройстве.',lessonDesc:'Около 10 заданий, 3–4 минуты.',finalDesc:'Найди буквы на карте по подсказкам и собери слово.'},
 en:{tag:'An expedition across the world map with Pip the fox',lead:'Short map lessons and a word puzzle at the end of every unit.',words:'Which language for the words?',
  go:'Let’s go',soon:'Soon',notReady:'This unit is still being prepared. Unit 1 is open for now.',nextLesson:'Next lesson',nextFinal:'To the unit final',section:'Section 1',sectionName:'Continents and oceans',unit:'Unit',lessonN:n=>'Lesson '+n,final:'Unit final: GeoWords',
  locked:'Finish the previous step first',start:'Start',later:'Later',again:'Play the lesson again',finalAgain:'Final word again',practice:'New review word',
  practiceNone:'New review words open in the next units: long words need more places you have learned on the map.',
  intro:'New',find:'Find on the map',what:'What is it?',hemi:'Hemispheres',line:'Lines on the map',washed:'Neighbours',record:'Record',
  tap:n=>`Tap <b>${n}</b>`,whatDir:'Which direction is this?',whatCont:'Which continent is this?',whatOcean:'Which ocean is this?',
  washedQ:n=>`Tap every ocean that washes <b>${n}</b>`,washedHint:'Mark the oceans, then tap “Check”.',checkAns:'Check',
  next:'Next',check:'Got it',right:'Correct!',wrongIs:n=>`That is ${n}.`,miss:'Missed. Here it is.',tryLine:'Not on the line. Here it is.',hemiWrong:'That is the other hemisphere. Here is the right one.',
  neutral:'This place belongs to no ocean. Try again.',washedOk:'All oceans found!',washedBad:'Not quite. Here are the right oceans.',
  nuance:'There is a nuance',lessonDone:'Lesson complete!',xp:'Points',acc:'Accuracy',time:'Time',home:'Back to the trail',
  unitDone:'Unit complete!',sectionDone:'Section complete!',stampGot:'A stamp in your explorer passport',practiceDone:'Word solved!',wordDef:'Mystery word',mistakes:'Mistakes',
  quitT:'Leave the lesson?',quitP:'Progress in this lesson will be lost.',quit:'Leave',stay:'Keep going',
  settings:'Settings',lang:'Words',reset:'Reset progress',unlock:'Unlock every step (testing)',
  rotate:'↻ Turn your phone — the map gets twice as big',zoomHint:'The letters are close together — spread two fingers to zoom in.',
  pipStart:'Captain, let’s plot our route! Read the clue and find the letter.',pipOk:l=>`Got “${l}”! Marking it on our route.`,pipBad:'Not that spot. Read the clue again.',pipHint:'Let’s check the map — the right letter is blinking.',
  practiceTag:'Review · built by the rules',sectionFinal:'Section final: GeoWords',sectionN:n=>'Section '+n,draft:'draft lessons',
  whatRiver:'Which river is this?',riverCont:n=>`On which continent does <b>${n}</b> flow?`,riverMouth:n=>`Where does <b>${n}</b> flow into?`,mouth:'River mouth',onCont:'Continent',
  allAsia:'Tap every river of Asia',allHint:'Mark the rivers, then tap “Check”.',allOk:'All the rivers of Asia found!',allBad:'Not quite. Here are the rivers of Asia.',riversIntro:'Before this section you need to know',
  units:[['Cardinal directions','North, south, west, east, the Equator'],['Continents','7 continents'],['Oceans','5 oceans'],['Neighbours and records','Which oceans wash which continent, records, hemispheres']],
  tester:'Test build: progress is stored only on this device.',lessonDesc:'About 10 tasks, 3–4 minutes.',finalDesc:'Find the letters on the map from the clues and build the word.'}
};
// Accusative forms for «Нажми на …» (grammar of the question, not content).
const ACC_RU={north:'север',south:'юг',east:'восток',west:'запад',equator:'экватор','prime-meridian':'нулевой меридиан',
  n:'Северное полушарие',s:'Южное полушарие',e:'Восточное полушарие',w:'Западное полушарие',
  asia:'Азию',africa:'Африку','north-america':'Северную Америку','south-america':'Южную Америку',antarctica:'Антарктиду',europe:'Европу',australia:'Австралию',
  'pacific-ocean':'Тихий океан','atlantic-ocean':'Атлантический океан','indian-ocean':'Индийский океан','arctic-ocean':'Северный Ледовитый океан','southern-ocean':'Южный океан',
  nile:'Нил',amazon:'Амазонку',mississippi:'Миссисипи',yangtze:'Янцзы','huang-he':'Хуанхэ',ganges:'Ганг',indus:'Инд',danube:'Дунай',volga:'Волгу'};
const ACC_EN={north:'north',south:'south',east:'east',west:'west',equator:'the Equator','prime-meridian':'the Prime Meridian',n:'the Northern Hemisphere',s:'the Southern Hemisphere',e:'the Eastern Hemisphere',w:'the Western Hemisphere',
  nile:'the Nile',amazon:'the Amazon',mississippi:'the Mississippi',yangtze:'the Yangtze','huang-he':'the Huang He',ganges:'the Ganges',indus:'the Indus',danube:'the Danube',volga:'the Volga'};

/* ---------- state ---------- */
const blank={lang:null,done:{},xp:0,streak:0,lastDay:'',unlockAll:false,introSeen:false,learned:[],recent:[]};
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
    rivers[it.id]={id:it.id,kind:'river',name:it.name,unit:f.unit,x:it.label.x,y:it.label.y,path:it.path,layer:it.layer.png.split('/').pop().replace('.webp',''),
      fact:lang=>f.fact[lang],disputed:f.disputed,caveat:f.caveat,continent:rel(it.id,'onContinent'),mouth:rel(it.id,'flowsInto')}}
  const waterName=id=>(objs[id]&&objs[id].name)||(f4.items.find(i=>i.id===id)||{}).name;
  D.s2={facts:f2,records:r2.items.filter(r=>!r.disputed&&r.category!=='changing'),geo:g2,dict:d2,rivers,waterName,intro:f2.intro};
}
const dir=id=>D.dirs.find(d=>d.id===id);
const O=id=>D.objs[id];
const nm=id=>(D.s2&&D.s2.rivers[id]?D.s2.rivers[id].name:O(id)?O(id).name:dir(id)?dir(id).name:D.lines[id]?D.lines[id].name:D.hemis[id].name)[L()];
const acc=id=>L()==='ru'?ACC_RU[id]:(ACC_EN[id]||nm(id));
const CONT=['asia','africa','north-america','south-america','antarctica','europe','australia'];
const RIVERS=['nile','amazon','mississippi','yangtze','huang-he','ganges','indus','danube','volga'];
const R=id=>D.s2.rivers[id];
const riverPath=r=>r.path.map(l=>'M'+l.map(q=>q[0]+' '+q[1]).join('L')).join('');
// distance in screen px from a tap (in % of the map) to the drawn river
function riverPx(r,x,y,W,H){let best=Infinity;for(const l of r.path)for(let i=1;i<l.length;i++){const ax=l[i-1][0]*W/100,ay=l[i-1][1]*H/100,bx=l[i][0]*W/100,by=l[i][1]*H/100,px=x*W/100,py=y*H/100;
  const dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy;let u=q?((px-ax)*dx+(py-ay)*dy)/q:0;u=Math.max(0,Math.min(1,u));best=Math.min(best,Math.hypot(px-ax-u*dx,py-ay-u*dy))}return best}
const nearestRiver=(x,y,sz,max)=>{let hit=null,d=max;for(const id of RIVERS){const v=riverPx(R(id),x,y,sz.W,sz.H);if(v<=d){d=v;hit=id}}return hit};
const riverLayers=()=>[...CONT.map(id=>O(id).layer),...RIVERS.map(id=>R(id).layer)];
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
 'u3-l3':()=>shuffle([...some(RIVERS,4).map(rv('findRiver')),...some(RIVERS,3).map(rv('whatRiver')),rv('riverCont')(some(RIVERS,1)[0]),...some(RIVERS,2).map(rv('riverMouth'))])
};
const COURSE2=[
 {n:1,lessons:[{id:'s2-u1-l1',title:{ru:'Нил и Амазонка',en:'The Nile and the Amazon'},plan:R2['u1-l1']},{id:'s2-u1-l2',title:{ru:'Миссисипи и устья рек',en:'The Mississippi and river mouths'},plan:R2['u1-l2']}]},
 {n:2,lessons:[{id:'s2-u2-l1',title:{ru:'Янцзы и Хуанхэ',en:'The Yangtze and the Huang He'},plan:R2['u2-l1']},{id:'s2-u2-l2',title:{ru:'Ганг и Инд',en:'The Ganges and the Indus'},plan:R2['u2-l2']},
   {id:'s2-u2-l3',title:{ru:'Все реки Азии',en:'All the rivers of Asia'},plan:R2['u2-l3']}]},
 {n:3,lessons:[{id:'s2-u3-l1',title:{ru:'Дунай и Волга',en:'The Danube and the Volga'},plan:R2['u3-l1']},{id:'s2-u3-l2',title:{ru:'Рекорды рек',en:'River records'},plan:R2['u3-l2']},
   {id:'s2-u3-l3',title:{ru:'Все реки раздела',en:'All the rivers of the section'},plan:R2['u3-l3']}]}
];
// Units with content approved by the author. Units 2-4 are built from approved data but their lessons are not approved yet.
// Unit 1 is approved; units 2-4 and the section final are drafts the author reviews in the app (24.10.2026).
const READY_UNITS=[1,2,3,4,'S'];
const STEPS=[];
COURSE.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));STEPS.push({id:`u${u.n}-final`,kind:'final',unit:u.n})});
STEPS.push({id:'s1-final',kind:'section',unit:'S'});
COURSE2.forEach(u=>{u.lessons.forEach((l,i)=>STEPS.push({id:l.id,sec:2,kind:'lesson',unit:u.n,n:i+1,title:l.title,plan:l.plan}));STEPS.push({id:`s2-u${u.n}-final`,sec:2,kind:'final',unit:u.n})});
STEPS.push({id:'s2-final',sec:2,kind:'section',unit:'S'});
// Section 2 lessons are a draft: playable for review (after section 1, or with «Unlock every step»).
const READY_S2=[1,2,3,'S'];
const stepOf=id=>STEPS.find(s=>s.id===id);
const ready=s=>s.sec===2?READY_S2.includes(s.unit):READY_UNITS.includes(s.unit);
function unlocked(id){const st=stepOf(id);if(!ready(st))return false;if(S.unlockAll)return true;const i=STEPS.findIndex(s=>s.id===id);return i===0||!!S.done[STEPS[i-1].id]}
const nextStep=id=>{const i=STEPS.findIndex(s=>s.id===id);const n=STEPS[i+1];return n&&unlocked(n.id)?n:null};
const titleOf=s=>s.kind==='lesson'?t().lessonN(s.n)+' · '+s.title[L()]:s.kind==='final'?t().final:t().sectionFinal;

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

/* ---------- map widget: base + layers + highlight shapes, markers in screen space, pinch/zoom ---------- */
function mapWidget(host,{layers=[],markers=[],onTap,onMarker,trail=false,zoom=true}){
  host.innerHTML=`<div class="mapbox"><div class="map"><div class="world"><img src="${IMG.base}" alt="" draggable="false">${layers.map(l=>`<img src="${IMG.layer(l)}" alt="" draggable="false">`).join('')}
   <svg class="shapes" viewBox="0 0 100 100" preserveAspectRatio="none"></svg></div></div>
   ${trail?'<svg class="trailsvg" preserveAspectRatio="none"><polyline points=""/></svg>':''}<div class="marks"></div></div>
   ${zoom?`<div class="zoom"><button type="button" data-z="-" aria-label="−">−</button><button type="button" data-z="+" aria-label="+">+</button></div>`:''}`;
  const box=host.querySelector('.mapbox'),mapEl=host.querySelector('.map'),world=host.querySelector('.world'),marks=host.querySelector('.marks'),shapes=host.querySelector('.shapes');
  const poly=host.querySelector('.trailsvg polyline');let sc=1,tx=0,ty=0,route=[];const btn={};
  for(const m of markers){const b=document.createElement('button');b.type='button';b.className='mk'+(m.cls?' '+m.cls:'');b.dataset.id=m.id;
    b.innerHTML=`<span>${esc(m.label||'')}</span>`;b.setAttribute('aria-label',m.aria||m.label||m.id);marks.appendChild(b);btn[m.id]={el:b,m}}
  const W=()=>mapEl.clientWidth,H=()=>mapEl.clientHeight;const toScreen=(x,y)=>[tx+x/100*W()*sc,ty+y/100*H()*sc];
  function place(){for(const {el,m} of Object.values(btn)){const [x,y]=toScreen(m.x,m.y);el.style.left=x+'px';el.style.top=y+'px';el.hidden=x<-8||y<-8||x>W()+8||y>H()+8}
    if(poly){poly.parentNode.setAttribute('viewBox',`0 0 ${W()} ${H()}`);poly.setAttribute('points',route.map(id=>toScreen(btn[id].m.x,btn[id].m.y).join(',')).join(' '))}}
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
  new ResizeObserver(()=>apply()).observe(mapEl);
  return {btn,
    addLayer(id){const i=document.createElement('img');i.src=IMG.layer(id);i.alt='';i.className='hl';world.insertBefore(i,shapes);return i},
    shape(o,cls){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',areaPath(o));p.setAttribute('class',cls||'hl-shape');p.dataset.id=o.id;shapes.appendChild(p);return p},
    line(d,cls){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('class',cls||'hl-river');shapes.appendChild(p);return p},
    clearShapes(){shapes.innerHTML=''},
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
    const cls=['stop',s.kind!=='lesson'?'final':'',done?'done':'',!open?'locked':'',isCur?'current':''].join(' ');
    const disc=s.kind==='lesson'?(done?'':s.n):`<img src="${s.kind==='section'?IMG.medalSection:IMG.medal}" alt="">`;
    return `<div class="stop-row"><button type="button" class="${cls}" data-step="${s.id}" style="left:${pos}%" aria-label="${esc(titleOf(s))}"><span class="disc">${disc}</span></button>
      ${isCur?`<img class="boat" src="${IMG.boat}" alt="" style="left:calc(${pos}% ${pos>50?'- 128px':'+ 46px'})">`:''}
      <span class="stop-label" style="left:${pos}%"><span>${esc(titleOf(s))}</span></span></div>`};
  const body=COURSE.map(u=>`<div class="unit-head"><span class="eyebrow">${x.unit} ${u.n}${u.n===1?'':' · '+x.draft}</span><h3>${x.units[u.n-1][0]}</h3><p>${x.units[u.n-1][1]}</p></div>`+
     STEPS.filter(s=>!s.sec&&s.unit===u.n).map(stopHtml).join('')).join('')+`<div class="unit-head"><span class="eyebrow">${x.section}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('s1-final'))+
     `<div class="section-card s2"><img src="${IMG.stamp2}" alt=""><div class="t"><span class="eyebrow">${x.sectionN(2)} · ${x.draft}</span><h2>${L()==='ru'?'Реки мира':'Rivers of the world'}</h2></div></div>`+
     COURSE2.map(u=>`<div class="unit-head"><span class="eyebrow">${x.sectionN(2)} · ${x.unit} ${u.n}</span><h3>${esc(D.s2.dict.units[u.n-1].title[L()])}</h3></div>`+STEPS.filter(s=>s.sec===2&&s.unit===u.n).map(stopHtml).join('')).join('')+
     `<div class="unit-head"><span class="eyebrow">${x.sectionN(2)}</span><h3>${x.sectionFinal}</h3></div>`+stopHtml(stepOf('s2-final'));
  h(`<section class="screen home">
   <div class="topbar"><span class="chip"><img src="${IMG.streak}" alt="">${S.streak}</span><span class="chip"><span class="star">★</span>${S.xp}</span><span class="grow"></span>
    <button type="button" class="iconbtn" id="gear" aria-label="${x.settings}">⚙</button></div>
   <div class="section-card"><img src="${IMG.stamp}" alt=""><div class="t"><span class="eyebrow">${x.section}</span><h2>${x.sectionName}</h2>
     <div class="bar"><i style="width:${Math.round(doneCount/S1.length*100)}%"></i></div></div></div>
   <div class="path"><svg class="trail" preserveAspectRatio="none"></svg>${body}</div>
   <p class="rotate-hint">${x.tester}</p></section>`);
  drawTrail();
  app.querySelectorAll('.stop[data-step]').forEach(b=>b.addEventListener('click',()=>openStep(b.dataset.step)));
  app.querySelector('#gear').addEventListener('click',settings);
  const c=app.querySelector('.stop.current');if(c)c.scrollIntoView({block:'center'});
}
function drawTrail(){const path=app.querySelector('.path');if(!path)return;const svg=path.querySelector('svg.trail');const r=path.getBoundingClientRect();
  const pts=[...path.querySelectorAll('.stop')].map(s=>{const b=s.getBoundingClientRect();return [b.left+b.width/2-r.left,b.top+b.height/2-r.top]});
  svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);svg.innerHTML=`<path d="${pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(0)+' '+p[1].toFixed(0)).join(' ')}"/>`}

function openStep(id){
  const x=t(),st=stepOf(id);
  if(!unlocked(id)){const s=sheet(`<h3>${esc(titleOf(st))}</h3><p>${ready(st)?x.locked:x.notReady}</p><button type="button" class="btn sand">OK</button>`);s.querySelector('button').onclick=()=>s.remove();return}
  const head=st.sec===2?(st.unit==='S'?x.sectionN(2):`${x.sectionN(2)} · ${x.unit} ${st.unit} · ${D.s2.dict.units[st.unit-1].title[L()]}`):st.unit==='S'?x.section:`${x.unit} ${st.unit} · ${x.units[st.unit-1][0]}`;
  const desc=st.kind==='lesson'?x.lessonDesc:x.finalDesc;
  let buttons;
  if(st.kind!=='lesson'&&S.done[id]&&!st.sec)buttons=`<button type="button" class="btn" data-a="practice">${x.practice}</button><div class="row"><button type="button" class="btn ghost" data-a="no">${x.later}</button><button type="button" class="btn ghost" data-a="go">${x.finalAgain}</button></div>`;
  else buttons=`<div class="row"><button type="button" class="btn ghost" data-a="no">${x.later}</button><button type="button" class="btn" data-a="go">${S.done[id]?x.again:x.start}</button></div>`;
  const s=sheet(`<span class="eyebrow" style="color:#a0742b">${esc(head)}</span><h3>${esc(titleOf(st))}</h3><p>${desc}</p>${buttons}`);
  s.querySelector('[data-a=no]').onclick=()=>s.remove();
  s.querySelector('[data-a=go]').onclick=()=>{s.remove();if(st.kind!=='lesson')geowords(finalPuzzle(st));else if(!S.introSeen&&id==='u1-l1')unitIntro(()=>lesson(st));else if(!S.introSeen2&&id==='s2-u1-l1')riversIntro(()=>lesson(st));else lesson(st)};
  const pr=s.querySelector('[data-a=practice]');if(pr)pr.onclick=()=>{const p=practicePuzzle(Math.max(...READY_UNITS.filter(u=>u<=(st.unit==='S'?4:st.unit))));s.remove();
    if(p)geowords(p);else{const m=sheet(`<h3>${x.practice}</h3><p>${x.practiceNone}</p><button type="button" class="btn sand">OK</button>`);m.querySelector('button').onclick=()=>m.remove()}};
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

function riversIntro(next){
  const x=t(),lang=L(),I=D.s2.intro;
  h(`<section class="screen lesson"><div class="task"><span class="kind">${x.sectionN(2)} · ${x.riversIntro}</span>
   <img src="${A+I.image[lang].replace(/^\.\//,'')}" alt="" style="width:100%;border-radius:16px;box-shadow:0 10px 24px rgba(0,0,0,.4)">
   <div class="card"><div class="intro-pip"><img src="${IMG.map}" alt=""><p>${I.terms.map(q=>`<b>${esc(q[lang])}</b>`).join(' · ')}</p></div></div></div>
   <div class="fb idle"><button type="button" class="btn">${x.start}</button></div></section>`);
  app.querySelector('.fb .btn').onclick=()=>{S.introSeen2=true;save();next()};
}
function nextBtns(id){const n=nextStep(id),x=t();
  return (n?`<button type="button" class="btn" data-a="next">${n.kind==='lesson'?x.nextLesson:x.nextFinal}</button>`:'')+`<button type="button" class="btn ${n?'ghost':''}" data-a="home">${x.home}</button>`}
function wireNext(id){const n=nextStep(id);app.querySelector('[data-a=home]').onclick=home;
  const b=app.querySelector('[data-a=next]');if(b)b.onclick=()=>n.kind==='lesson'?lesson(n):geowords(finalPuzzle(n))}
/* ---------- lesson engine ---------- */
function lesson(step){
  const x=t(),lang=L(),id=step.id;const queue=step.plan().map(q=>({...q}));const total=queue.length;let done=0,wrong=0;const t0=Date.now();
  function exitAsk(){const s=sheet(`<h3>${x.quitT}</h3><p>${x.quitP}</p><div class="row"><button type="button" class="btn ghost" data-a="q">${x.quit}</button><button type="button" class="btn" data-a="s">${x.stay}</button></div>`);
    s.querySelector('[data-a=q]').onclick=()=>{s.remove();home()};s.querySelector('[data-a=s]').onclick=()=>s.remove()}
  function frame(kind,body){h(`<section class="screen lesson"><div class="l-top"><button type="button" class="l-x" aria-label="${x.quit}">✕</button><div class="l-bar"><i style="width:${done/total*100}%"></i></div></div>
     <div class="task"><span class="kind">${kind}</span>${body}</div><div class="fb idle"></div></section>`);app.querySelector('.l-x').onclick=exitAsk}
  function feedback(ok,title,text,face,onNext){const fb=app.querySelector('.fb');fb.className='fb '+(ok?'ok':'bad');
    fb.innerHTML=`<div class="msg"><img src="${face}" alt=""><div><b>${esc(title)}</b>${text?`<p>${esc(text)}</p>`:''}</div></div><button type="button" class="btn">${x.next}</button>`;
    const b=fb.querySelector('.btn');b.focus({preventScroll:true});b.onclick=onNext}
  function gotIt(after){const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn">${x.check}</button>`;fb.querySelector('.btn').onclick=()=>{after&&after();done++;next()}}
  function answered(task,ok){if(ok)done++;else{wrong++;queue.push({...task,retry:true})}app.querySelector('.l-bar i').style.width=(done/total*100)+'%'}
  function next(){const task=queue.shift();if(!task)return finish();render(task)}
  const nuanceBtn=o=>o&&o.disputed&&o.caveat?`<button type="button" class="nuance"><img src="${IMG.nuance}" alt="">${x.nuance}</button>`:'';
  function wireNuance(o){const b=app.querySelector('.nuance');if(b)b.onclick=()=>{const s=sheet(`<div class="intro-pip"><img src="${IMG.wonder}" alt=""><h3>${x.nuance}</h3></div><p>${esc(o.caveat[lang])}</p><button type="button" class="btn sand">OK</button>`);s.querySelector('button').onclick=()=>s.remove()}}
  function render(q){
    window.__gwTask=q;// read by the automated play-through test
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
    // ---- section 2: rivers (all nine rivers are drawn; the asked one is highlighted along its course) ----
    if(q.k==='introRiver'||q.k==='introRiverRec'){const rec=q.rec&&D.s2.records.find(r=>r.id===q.rec);const r=R(rec?rec.object:q.id);
      frame(rec?x.record:x.intro,`<div class="card"><div class="intro-pip"><img src="${rec?IMG.wonder:IMG.map}" alt=""><h3>${esc(r.name[lang])}</h3></div><p>${esc(rec?rec.fact[lang]:r.fact(lang))}</p>${rec?'':nuanceBtn(r)}</div><div class="mapslot"></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{layers:riverLayers(),zoom:false});m.line(riverPath(r),'hl-river pulse');if(!rec)wireNuance(r);
      return gotIt(()=>learn(r.id))}
    if(q.k==='findRiver'){const r=R(q.id);const rec=q.rec&&D.s2.records.find(x=>x.id===q.rec);frame(rec?x.record:x.find,`<p class="q">${x.tap(acc(q.id))}</p><div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:riverLayers(),onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const hit=nearestRiver(px,py,sz,22);const ok=hit===q.id;locked=true;m.dot(sx,sy,ok);m.line(riverPath(r),ok?'hl-river good':'hl-river pulse');
        if(hit&&!ok)m.line(riverPath(R(hit)),'hl-river bad');answered(q,ok);
        feedback(ok,ok?x.right:(hit?x.wrongIs(R(hit).name[lang]):x.miss),ok?(rec?'':r.fact(lang)):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
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
    if(q.k==='findObj'){const o=O(q.id);const r=q.rec&&D.records.find(r=>r.id===q.rec);frame(r?x.record:x.find,`<p class="q">${x.tap(acc(q.id))}</p><div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:learnedLayers(),onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const hit=[...CONT,...OCEANS].map(O).find(c=>inside(c,px,py));
        let ok=hit?hit.id===o.id:edgePx(o,px,py,sz.W,sz.H)<=22;
        if(!ok&&!hit&&o.kind==='ocean'&&!CONT.some(c=>inside(O(c),px,py))){m.dot(sx,sy,false);const fb=app.querySelector('.fb');fb.className='fb bad';
          fb.innerHTML=`<div class="msg"><img src="${IMG.faceOops}" alt=""><div><p>${esc(x.neutral)}</p></div></div>`;return}
        locked=true;m.dot(sx,sy,ok);m.shape(o,ok?'hl-shape':'hl-shape pulse');answered(q,ok);
        feedback(ok,ok?x.right:(hit?x.wrongIs(hit.name[lang]):x.miss),ok?(r?r.fact[lang]:(o.disputed?'':o.fact(lang))):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
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
function finalPuzzle(st){const role=st.kind==='section'?'section-final':'unit-final';const G=st.sec===2?D.s2.geo:D.geo,DI=st.sec===2?D.s2.dict:D.dict;
  const P=G.puzzles.find(p=>p.role===role&&p.language===L()&&p.approval?.status==='approved'&&(role==='section-final'||p.unit===st.unit));
  const unitIdx=st.kind==='section'?DI.units.length-1:st.unit-1;
  const w=DI.units[unitIdx].words[L()].find(w=>w.role===role||w.role==='final');
  return {kind:st.kind,stepId:st.id,answer:P.answer,markers:P.markers,clues:P.clues.map(c=>({markerId:c.markerId,position:c.position,text:c.text})),
    layers:(P.layers||[]).map(p=>p.split('/').pop().replace('.webp','')),definition:w?w.definition:'',needsZoom:!!P.needsZoom,stamp:st.sec===2?IMG.stamp2:IMG.stamp}}
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
function practicePuzzle(unit){const lang=L();const words=[];
  for(let u=0;u<Math.min(unit,4);u++)for(const w of D.dict.units[u].words[lang])if(w.role==='review')words.push(w);
  const places=knownPlaces(unit);const fold=s=>s.toUpperCase().replace(/Ё/g,'Е');
  const fit=words.filter(w=>[...w.answer].length<=places.length&&!S.recent.includes(w.answer));
  const pool=fit.length?fit:words.filter(w=>[...w.answer].length<=places.length);if(!pool.length)return null;
  const w=pool[Math.floor(Math.random()*pool.length)];const letters=[...w.answer];const n=letters.length;
  const order=revealOrder(n);if(!order)return null;
  const usable=places.filter(p=>!fold(p.place[lang]).includes(fold(w.answer)));if(usable.length<n)return null;
  const chosen=shuffle(usable).slice(0,n);// one letter per object
  const markers=chosen.map((p,i)=>({id:p.id,x:p.x,y:p.y,letter:letters[i],place:p.place[lang]}));
  const ord=D.tpl.ordinals[lang],tmpl=D.tpl.template[lang];
  const clues=order.map(pos=>{const m=markers[pos-1];return {markerId:m.id,position:pos,text:tmpl.replace('{ordinal}',ord[pos-1]).replace('{place}',m.place)}});
  S.recent=[w.answer,...S.recent.filter(a=>a!==w.answer)].slice(0,3);save();
  return {kind:'practice',answer:w.answer,markers,clues,definition:w.definition,needsZoom:false,
    layers:unit===1?['world-line-equator','world-line-prime-meridian']:[...CONT.map(id=>O(id).layer),'world-line-equator']}}

function geowords(P){
  window.__gwPuzzle=P;// read by the automated play-through test
  const x=t();let step=0,wrong=0,here=0;const t0=Date.now();
  const tag=P.kind==='practice'?x.practiceTag:P.kind==='section'?x.sectionFinal:x.final;
  h(`<section class="screen lesson gw"><div class="l-top"><button type="button" class="l-x" aria-label="${x.quit}">✕</button><div class="l-bar"><i></i></div></div>
   <div class="gw-head"><span class="kind">${esc(tag)}</span><p class="gw-clue" aria-live="polite"></p></div><div class="mapslot"></div><p class="rotate-hint">${P.needsZoom?x.zoomHint:x.rotate}</p>
   <div class="slots">${[...P.answer].map(()=>'<div class="slot"></div>').join('')}</div>
   <div class="gw-pip"><img src="${IMG.hello}" alt=""><p class="bubble">${x.pipStart}</p></div></section>`);
  app.querySelector('.l-x').onclick=()=>{const s=sheet(`<h3>${x.quitT}</h3><div class="row"><button type="button" class="btn ghost" data-a="q">${x.quit}</button><button type="button" class="btn" data-a="s">${x.stay}</button></div>`);
    s.querySelector('[data-a=q]').onclick=()=>{s.remove();home()};s.querySelector('[data-a=s]').onclick=()=>s.remove()};
  const slots=[...app.querySelectorAll('.slot')];
  const m=mapWidget(app.querySelector('.mapslot'),{layers:P.layers,trail:true,markers:P.markers.map(k=>({id:k.id,x:k.x,y:k.y,label:k.letter})),onMarker:choose});
  const pip=(img,txt)=>{app.querySelector('.gw-pip img').src=img;app.querySelector('.bubble').textContent=txt};
  function clue(){const c=P.clues[step];app.querySelector('.gw-clue').innerHTML=esc(c.text).replace(/(\S+ букву|the \S+ letter)/,'<b>$1</b>');
    app.querySelector('.l-bar i').style.width=(step/P.clues.length*100)+'%'}
  function choose(id,el){if(step>=P.clues.length||el.classList.contains('done'))return;const c=P.clues[step];
    if(id!==c.markerId){wrong++;here++;el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');
      if(here>=3){m.btn[c.markerId].el.classList.add('pulse');pip(IMG.spy,x.pipHint)}else pip(IMG.left,x.pipBad);return}
    here=0;el.classList.remove('pulse');el.classList.add('done');m.route(id);const k=P.markers.find(q=>q.id===id);const s=slots[c.position-1];s.textContent=k.letter;s.classList.add('new');
    pip(IMG.yes,x.pipOk(k.letter));step++;
    if(step===P.clues.length){app.querySelector('.l-bar i').style.width='100%';setTimeout(finish,800)}else setTimeout(clue,350)}
  function finish(){const sec=Math.round((Date.now()-t0)/1000);const xp=(P.kind==='practice'?10:20)+Math.max(0,6-wrong);
    if(P.stepId)S.done[P.stepId]=true;S.xp+=xp;bumpStreak();save();
    const section=P.kind==='section';
    h(`<section class="screen done">${section?`<img class="medal" src="${P.stamp||IMG.stamp}" alt="" style="transform:rotate(-10deg)"><p class="eyebrow">${x.stampGot}</p>`:`<img class="medal" src="${P.kind==='practice'?IMG.faceWow:IMG.medal}" alt="">`}
     <h2>${P.kind==='practice'?x.practiceDone:section?x.sectionDone:x.unitDone}</h2>
     <p class="eyebrow">${x.wordDef}</p><p class="word-big">${esc(P.answer)}</p><p class="defn">${esc(P.definition)}</p>
     <div class="tiles"><div class="tile"><small>${x.xp}</small><b>+${xp}</b></div><div class="tile"><small>${x.mistakes}</small><b>${wrong}</b></div><div class="tile"><small>${x.time}</small><b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b></div></div>
     ${section?`<img src="${IMG.medalSection}" alt="" style="width:110px">`:`<img src="${IMG.cheer}" alt="" style="width:120px">`}${P.stepId?nextBtns(P.stepId):`<button type="button" class="btn" data-a="home">${x.home}</button>`}</section>`);
    if(P.stepId)wireNext(P.stepId);else app.querySelector('[data-a=home]').onclick=home}
  clue();
}

/* ---------- boot ---------- */
loadData().then(()=>{S.lang?home():welcome()}).catch(e=>{app.innerHTML=`<div class="loading">Не удалось загрузить данные: ${esc(e.message)}</div>`});
window.addEventListener('resize',()=>drawTrail());
})();
