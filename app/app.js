/* GeoWords «Экспедиция» — first playable build: section 1, unit 1 (cardinal directions and hemispheres).
   Content comes only from approved data in /data (facts, dictionary, GeoWords puzzles, map lines and
   clue-template places). Progress is kept on this device (localStorage). */
(()=>{
const A='../';
const KEY='geowords_expedition_v1';
const IMG={
  welcome:A+'assets/graphics/game/scene-welcome.webp',intro:A+'assets/graphics/game/intro-continents-oceans.webp',
  hello:A+'assets/pip/game/pip-hello.webp',yes:A+'assets/pip/game/pip-yes.webp',cheer:A+'assets/pip/game/pip-cheer.webp',
  map:A+'assets/pip/game/pip-map.webp',spy:A+'assets/pip/game/pip-spyglass.webp',left:A+'assets/pip/game/pip-point-left.webp',
  right:A+'assets/pip/game/pip-point-right.webp',oops:A+'assets/pip/game/pip-oops.webp',wonder:A+'assets/pip/game/pip-wonder.webp',
  faceHappy:A+'assets/pip/game/pip-face-happy.webp',faceOops:A+'assets/pip/game/pip-face-oops.webp',faceWow:A+'assets/pip/game/pip-face-wow.webp',
  streak:A+'assets/graphics/game/icon-streak.webp',medal:A+'assets/graphics/game/medal-unit.webp',boat:A+'assets/graphics/game/path-pip-boat.webp',
  stamp:A+'assets/graphics/game/stamp-continents.webp',base:A+'assets/world-base.webp',
  layer:id=>A+'assets/layers/'+id+'.webp'
};
const MAP_ASPECT=2200/1211;

/* ---------- UI strings (content itself comes from data) ---------- */
const T={
 ru:{tag:'Экспедиция по карте мира с лисёнком Пипом',lead:'Короткие уроки по карте и слово-загадка в конце каждого юнита.',words:'На каком языке слова?',
  go:'В путь',section:'Раздел 1',sectionName:'Материки и океаны',unit:'Юнит',lessonN:n=>'Урок '+n,final:'Итог юнита: GeoWords',soon:'Скоро',
  locked:'Сначала пройди предыдущий шаг',start:'Начать',later:'Позже',again:'Пройти ещё раз',
  intro:'Знакомство',find:'Найди на карте',what:'Что это?',hemi:'Полушария',line:'Линии на карте',
  tapDir:n=>`Нажми на <b>${n}</b>`,whatDir:'Какая это сторона света?',tapLine:n=>`Нажми на <b>${n}</b>`,tapHemi:n=>`Нажми на <b>${n}</b>`,
  next:'Дальше',check:'Понятно',right:'Верно!',wrongIs:n=>`Это ${n}.`,tryLine:'Мимо линии. Вот она.',hemiWrong:'Это другое полушарие. Вот нужное.',
  lessonDone:'Урок пройден!',xp:'Очки',acc:'Точность',time:'Время',home:'На карту пути',
  unitDone:'Юнит пройден!',wordDef:'Слово-загадка',route:'Найдено букв',mistakes:'Ошибок',
  quitT:'Выйти из урока?',quitP:'Прогресс этого урока не сохранится.',quit:'Выйти',stay:'Продолжить',
  settings:'Настройки',lang:'Слова',reset:'Сбросить прогресс',unlock:'Открыть все уроки (для теста)',resetDone:'Прогресс сброшен',
  rotate:'↻ Поверни телефон — карта станет вдвое больше',pipStart:'Капитан, прокладываем маршрут! Ищи букву по подсказке.',
  pipOk:l=>`Есть «${l}»! Отмечаю точку на маршруте.`,pipBad:'Не та точка. Прочитай подсказку ещё раз.',pipHint:'Сверимся с картой — нужная буква мигает.',
  units:[['Стороны света','Север, юг, запад, восток, экватор'],['Континенты','7 континентов'],['Океаны','5 океанов'],['Соседи и рекорды','Кто кого омывает, самые-самые']],
  l1:'Север, юг и экватор',l2:'Запад, восток и нулевой меридиан',sectionFinal:'Итог раздела',tester:'Тестовая сборка: прогресс хранится только на этом устройстве.'},
 en:{tag:'An expedition across the world map with Pip the fox',lead:'Short map lessons and a word puzzle at the end of every unit.',words:'Which language for the words?',
  go:'Let’s go',section:'Section 1',sectionName:'Continents and oceans',unit:'Unit',lessonN:n=>'Lesson '+n,final:'Unit final: GeoWords',soon:'Soon',
  locked:'Finish the previous step first',start:'Start',later:'Later',again:'Play again',
  intro:'New',find:'Find on the map',what:'What is it?',hemi:'Hemispheres',line:'Lines on the map',
  tapDir:n=>`Tap <b>${n}</b>`,whatDir:'Which direction is this?',tapLine:n=>`Tap the <b>${n}</b>`,tapHemi:n=>`Tap the <b>${n}</b>`,
  next:'Next',check:'Got it',right:'Correct!',wrongIs:n=>`That is ${n}.`,tryLine:'Not on the line. Here it is.',hemiWrong:'That is the other hemisphere. Here is the right one.',
  lessonDone:'Lesson complete!',xp:'Points',acc:'Accuracy',time:'Time',home:'Back to the trail',
  unitDone:'Unit complete!',wordDef:'Mystery word',route:'Letters found',mistakes:'Mistakes',
  quitT:'Leave the lesson?',quitP:'Progress in this lesson will be lost.',quit:'Leave',stay:'Keep going',
  settings:'Settings',lang:'Words',reset:'Reset progress',unlock:'Unlock all lessons (testing)',resetDone:'Progress reset',
  rotate:'↻ Turn your phone — the map gets twice as big',pipStart:'Captain, let’s plot our route! Read the clue and find the letter.',
  pipOk:l=>`Got “${l}”! Marking it on our route.`,pipBad:'Not that spot. Read the clue again.',pipHint:'Let’s check the map — the right letter is blinking.',
  units:[['Cardinal directions','North, south, west, east, the Equator'],['Continents','7 continents'],['Oceans','5 oceans'],['Neighbours and records','Who borders whom, the biggest and smallest']],
  l1:'North, south and the Equator',l2:'West, east and the Prime Meridian',sectionFinal:'Section final',tester:'Test build: progress is stored only on this device.'}
};

/* ---------- state ---------- */
const blank={lang:null,done:{},xp:0,streak:0,lastDay:'',unlockAll:false,introSeen:false};
let S=load();
function load(){try{return Object.assign({},blank,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return {...blank}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const t=()=>T[S.lang||'ru'];
const L=()=>S.lang||'ru';
function bumpStreak(){const d=new Date(),day=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  if(S.lastDay===day)return;const y=new Date(d-864e5),yd=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();
  S.streak=S.lastDay===yd?S.streak+1:1;S.lastDay=day}

/* ---------- data ---------- */
let D=null;
async function loadData(){
  const get=p=>fetch(A+p).then(r=>{if(!r.ok)throw new Error(p+' '+r.status);return r.json()});
  const [facts,geo,dict,map,tpl]=await Promise.all([get('data/content/section-1-facts.json'),get('data/geowords/section-1.json'),
    get('data/dictionary/section-1.json'),get('data/maps/world-continents-oceans.json'),get('data/geowords/clue-templates.json')]);
  const fact=id=>facts.items.find(i=>i.id===id);
  const place=id=>tpl.objects.find(o=>o.id===id);
  const line=id=>map.lines.find(l=>l.id===id);
  const sentence=(id,word)=>lang=>fact(id).fact[lang].split(/(?<=\.)\s+/).find(s=>s.includes(word[lang]))||fact(id).fact[lang];
  D={facts,geo,dict,map,
    dirs:['north','south','east','west'].map(id=>({id,name:fact(id).name,fact:lang=>fact(id).fact[lang],x:place(id).x,y:place(id).y})),
    lines:{equator:{id:'equator',name:line('equator').name,layer:'world-line-equator',fact:sentence('north',{ru:'Экватор',en:'Equator'}),y:place('equator').y},
           'prime-meridian':{id:'prime-meridian',name:line('prime-meridian').name,layer:'world-line-prime-meridian',fact:sentence('east',{ru:'Нулевой меридиан',en:'Prime Meridian'}),x:place('prime-meridian').x}},
    hemis:map.hemispheres};
}
const dir=id=>D.dirs.find(d=>d.id===id);
const inCase={ru:{north:'север',south:'юг',east:'восток',west:'запад'},en:{north:'north',south:'south',east:'east',west:'west'}};
const lnameAcc=id=>L()==='ru'?{equator:'экватор','prime-meridian':'нулевой меридиан'}[id]:D.lines[id].name.en;
const hnameAcc=h=>L()==='ru'?{n:'Северное полушарие',s:'Южное полушарие',e:'Восточное полушарие',w:'Западное полушарие'}[h]:D.hemis[h].name.en;

/* ---------- lessons of unit 1 (objects taught in this order) ---------- */
const LESSONS={
 'u1-l1':()=>[{k:'intro',dir:'north'},{k:'intro',dir:'south'},{k:'introLine',line:'equator'},
   {k:'find',dir:'north'},{k:'what',dir:'south',from:['north','south']},{k:'line',line:'equator'},{k:'find',dir:'south'},
   {k:'hemi',h:'n'},{k:'what',dir:'north',from:['north','south']},{k:'hemi',h:'s'}],
 'u1-l2':()=>[{k:'intro',dir:'west'},{k:'intro',dir:'east'},{k:'introLine',line:'prime-meridian'},
   {k:'find',dir:'west'},{k:'what',dir:'east',from:['north','south','east','west']},{k:'line',line:'prime-meridian'},{k:'find',dir:'east'},
   {k:'hemi',h:'e'},{k:'what',dir:'west',from:['north','south','east','west']},{k:'find',dir:'north'},{k:'line',line:'equator'},{k:'hemi',h:'w'}]
};
const STEPS=[{id:'u1-l1',kind:'lesson',n:1},{id:'u1-l2',kind:'lesson',n:2},{id:'u1-final',kind:'final'}];
function unlocked(id){if(S.unlockAll)return true;const i=STEPS.findIndex(s=>s.id===id);return i===0||!!S.done[STEPS[i-1].id]}

/* ---------- helpers ---------- */
const app=document.getElementById('app');
const h=(html)=>{app.innerHTML=html;window.scrollTo(0,0)};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function sheet(inner){const b=document.createElement('div');b.className='sheet-back';b.innerHTML=`<div class="sheet" role="dialog" aria-modal="true">${inner}</div>`;
  b.addEventListener('click',e=>{if(e.target===b)b.remove()});document.body.appendChild(b);return b}

/* ---------- map widget: base + layers, markers in screen space, pinch/zoom ---------- */
function mapWidget(host,{layers=[],markers=[],onTap,onMarker,trail=false,zoom=true}){
  host.innerHTML=`<div class="mapbox"><div class="map"><div class="world"><img src="${IMG.base}" alt="" draggable="false">${layers.map(l=>`<img src="${IMG.layer(l)}" alt="" draggable="false">`).join('')}</div>
   ${zoom?`<div class="zoom"><button type="button" data-z="-" aria-label="−">−</button><button type="button" data-z="+" aria-label="+">+</button></div>`:''}</div>
   ${trail?'<svg class="trailsvg" preserveAspectRatio="none"><polyline points=""/></svg>':''}<div class="marks"></div></div>`;
  const box=host.querySelector('.mapbox'),mapEl=host.querySelector('.map'),world=host.querySelector('.world'),marks=host.querySelector('.marks');
  const poly=host.querySelector('.trailsvg polyline');let sc=1,tx=0,ty=0,route=[];
  const btn={};
  for(const m of markers){const b=document.createElement('button');b.type='button';b.className='mk'+(m.cls?' '+m.cls:'');b.dataset.id=m.id;
    b.innerHTML=`<span>${esc(m.label||'')}</span>`;b.setAttribute('aria-label',m.aria||m.label||m.id);marks.appendChild(b);btn[m.id]={el:b,m}}
  const W=()=>mapEl.clientWidth,H=()=>mapEl.clientHeight;
  const toScreen=(x,y)=>[tx+x/100*W()*sc,ty+y/100*H()*sc];
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
  return {btn,addLayer(id){const i=document.createElement('img');i.src=IMG.layer(id);i.alt='';i.className='hl';world.appendChild(i);return i},
    dot(sx,sy,ok){const d=document.createElement('div');d.className='tapdot '+(ok?'ok':'bad');d.style.left=sx+'px';d.style.top=sy+'px';mapEl.appendChild(d);setTimeout(()=>d.remove(),1300)},
    route(id){route.push(id);place()},place:apply};
}

/* ---------- screens ---------- */
function welcome(){
  const pick=S.lang||'ru';
  h(`<section class="screen welcome"><div class="hero" style="background-image:url('${IMG.welcome}')" role="img" aria-label="Пип у карты мира"></div>
   <div class="body"><p class="eyebrow">GeoWords</p><h1>${T[pick].tag}</h1><p class="lead">${T[pick].lead}</p>
   <p><b>${T[pick].words}</b></p>
   <div class="langs"><button type="button" class="lang" data-l="ru" aria-pressed="${pick==='ru'}"><b>Русские</b><span>ЗЕНИТ, МЕРИДИАН…</span></button>
   <button type="button" class="lang" data-l="en" aria-pressed="${pick==='en'}"><b>English</b><span>ZENITH, MERIDIAN…</span></button></div></div>
   <div class="go"><button type="button" class="btn" id="go">${T[pick].go}</button></div></section>`);
  let chosen=pick;
  app.querySelectorAll('.lang').forEach(b=>b.addEventListener('click',()=>{chosen=b.dataset.l;app.querySelectorAll('.lang').forEach(x=>x.setAttribute('aria-pressed',x===b));
    app.querySelector('h1').textContent=T[chosen].tag;app.querySelector('.lead').textContent=T[chosen].lead;app.querySelector('.body p b').textContent=T[chosen].words;app.querySelector('#go').textContent=T[chosen].go}));
  app.querySelector('#go').addEventListener('click',()=>{S.lang=chosen;save();home()});
}

function home(){
  const x=t(),doneCount=STEPS.filter(s=>S.done[s.id]).length;
  const cur=STEPS.find(s=>!S.done[s.id]&&unlocked(s.id));
  const pos=[50,72,38];// stop x% for unit 1
  const rows=STEPS.map((s,i)=>{const done=!!S.done[s.id],open=unlocked(s.id),isCur=cur&&cur.id===s.id;
    const cls=['stop',s.kind==='final'?'final':'',done?'done':'',!open?'locked':'',isCur?'current':''].join(' ');
    const label=s.kind==='final'?x.final:x.lessonN(s.n)+' · '+(s.n===1?x.l1:x.l2);
    const disc=s.kind==='final'?`<img src="${IMG.medal}" alt="">`:(done?'':s.n);
    return `<div class="stop-row"><button type="button" class="${cls}" data-step="${s.id}" style="left:${pos[i]}%" aria-label="${esc(label)}"><span class="disc">${disc}</span></button>
      ${isCur?`<img class="boat" src="${IMG.boat}" alt="" style="left:calc(${pos[i]}% ${pos[i]>50?'- 128px':'+ 46px'})">`:''}
      <span class="stop-label" style="left:${pos[i]}%"><span>${esc(label)}</span></span></div>`}).join('');
  const lockedUnits=x.units.slice(1).map((u,i)=>`<div class="unit-head"><span class="eyebrow">${x.unit} ${i+2} · ${x.soon}</span><h3>${u[0]}</h3><p>${u[1]}</p></div>
     <div class="stop-row"><button type="button" class="stop locked" data-locked style="left:${i%2?40:60}%" aria-label="${esc(u[0])}"><span class="disc">🔒</span></button></div>`).join('');
  h(`<section class="screen home">
   <div class="topbar"><span class="chip"><img src="${IMG.streak}" alt="">${S.streak}</span><span class="chip"><span class="star">★</span>${S.xp}</span><span class="grow"></span>
    <button type="button" class="iconbtn" id="gear" aria-label="${x.settings}">⚙</button></div>
   <div class="section-card"><img src="${IMG.stamp}" alt=""><div class="t"><span class="eyebrow">${x.section}</span><h2>${x.sectionName}</h2>
     <div class="bar"><i style="width:${Math.round(doneCount/STEPS.length*25)}%"></i></div></div></div>
   <div class="path"><svg class="trail" preserveAspectRatio="none"></svg>
     <div class="unit-head"><span class="eyebrow">${x.unit} 1</span><h3>${x.units[0][0]}</h3><p>${x.units[0][1]}</p></div>
     ${rows}${lockedUnits}
     <div class="unit-head"><span class="eyebrow">${x.soon}</span><h3>${x.sectionFinal}</h3></div></div>
   <p class="rotate-hint">${x.tester}</p></section>`);
  drawTrail();
  app.querySelectorAll('.stop[data-step]').forEach(b=>b.addEventListener('click',()=>openStep(b.dataset.step)));
  app.querySelectorAll('.stop[data-locked]').forEach(b=>b.addEventListener('click',()=>{const s=sheet(`<h3>${x.soon}</h3><p>${x.locked}</p><button type="button" class="btn sand">OK</button>`);s.querySelector('button').onclick=()=>s.remove()}));
  app.querySelector('#gear').addEventListener('click',settings);
}
function drawTrail(){const path=app.querySelector('.path'),svg=path.querySelector('svg.trail');const r=path.getBoundingClientRect();
  const pts=[...path.querySelectorAll('.stop')].map(s=>{const b=s.getBoundingClientRect();return [b.left+b.width/2-r.left,b.top+b.height/2-r.top]});
  svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);
  svg.innerHTML=`<path d="${pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(0)+' '+p[1].toFixed(0)).join(' ')}"/>`}

function openStep(id){
  const x=t(),st=STEPS.find(s=>s.id===id);
  if(!unlocked(id)){const s=sheet(`<h3>${x.soon}</h3><p>${x.locked}</p><button type="button" class="btn sand">OK</button>`);s.querySelector('button').onclick=()=>s.remove();return}
  const title=st.kind==='final'?x.final:x.lessonN(st.n)+' · '+(st.n===1?x.l1:x.l2);
  const desc=st.kind==='final'?(L()==='ru'?'Найди буквы на карте по подсказкам и собери слово.':'Find the letters on the map from the clues and build the word.')
    :(L()==='ru'?'Около 10 заданий, 3–4 минуты.':'About 10 tasks, 3–4 minutes.');
  const s=sheet(`<span class="eyebrow" style="color:#a0742b">${x.unit} 1 · ${x.units[0][0]}</span><h3>${esc(title)}</h3><p>${desc}</p>
    <div class="row"><button type="button" class="btn ghost" data-a="no">${x.later}</button><button type="button" class="btn" data-a="go">${S.done[id]?x.again:x.start}</button></div>`);
  s.querySelector('[data-a=no]').onclick=()=>s.remove();
  s.querySelector('[data-a=go]').onclick=()=>{s.remove();if(st.kind==='final')geowords();else if(!S.introSeen&&id==='u1-l1')unitIntro(()=>lesson(id));else lesson(id)};
}

function settings(){
  const x=t();
  const s=sheet(`<h3>${x.settings}</h3>
   <div class="opt"><span>${x.lang}</span><div class="seg"><button type="button" data-l="ru" aria-pressed="${L()==='ru'}">RU</button><button type="button" data-l="en" aria-pressed="${L()==='en'}">EN</button></div></div>
   <div class="opt"><span>${x.unlock}</span><div class="seg"><button type="button" data-u="1" aria-pressed="${S.unlockAll}">ON</button><button type="button" data-u="0" aria-pressed="${!S.unlockAll}">OFF</button></div></div>
   <button type="button" class="btn ghost" data-a="reset">${x.reset}</button><button type="button" class="btn sand" data-a="close">OK</button>`);
  s.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{S.lang=b.dataset.l;save();s.remove();home()});
  s.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{S.unlockAll=b.dataset.u==='1';save();s.remove();home()});
  s.querySelector('[data-a=reset]').onclick=()=>{const lang=S.lang;S={...blank,lang};save();s.remove();home()};
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

/* ---------- lesson engine ---------- */
function lesson(id){
  const x=t(),lang=L();const queue=LESSONS[id]().map(q=>({...q}));const total=queue.length;let done=0,wrong=0;const t0=Date.now();
  function exitAsk(){const s=sheet(`<h3>${x.quitT}</h3><p>${x.quitP}</p><div class="row"><button type="button" class="btn ghost" data-a="q">${x.quit}</button><button type="button" class="btn" data-a="s">${x.stay}</button></div>`);
    s.querySelector('[data-a=q]').onclick=()=>{s.remove();home()};s.querySelector('[data-a=s]').onclick=()=>s.remove()}
  function frame(kind,body){h(`<section class="screen lesson"><div class="l-top"><button type="button" class="l-x" aria-label="${x.quit}">✕</button><div class="l-bar"><i style="width:${done/total*100}%"></i></div></div>
     <div class="task"><span class="kind">${kind}</span>${body}</div><div class="fb idle"></div></section>`);app.querySelector('.l-x').onclick=exitAsk}
  function feedback(ok,title,text,face,onNext){const fb=app.querySelector('.fb');fb.className='fb '+(ok?'ok':'bad');
    fb.innerHTML=`<div class="msg"><img src="${face}" alt=""><div><b>${esc(title)}</b>${text?`<p>${esc(text)}</p>`:''}</div></div><button type="button" class="btn">${x.next}</button>`;
    const b=fb.querySelector('.btn');b.focus({preventScroll:true});b.onclick=onNext}
  function answered(task,ok){if(ok){done++}else{wrong++;queue.push({...task,retry:true})}
    app.querySelector('.l-bar i').style.width=(done/total*100)+'%'}
  function next(){const task=queue.shift();if(!task)return finish();render(task)}
  function render(q){
    if(q.k==='intro'){const d=dir(q.dir);frame(x.intro,`<div class="card"><div class="intro-pip"><img src="${q.dir==='west'?IMG.left:q.dir==='east'?IMG.right:IMG.hello}" alt=""><h3>${esc(d.name[lang])}</h3></div><p>${esc(d.fact(lang))}</p></div><div class="mapslot"></div>`);
      const m=mapWidget(app.querySelector('.mapslot'),{markers:[{id:d.id,x:d.x,y:d.y,cls:'dir pulse',label:{north:'↑',south:'↓',east:'→',west:'←'}[d.id]}],zoom:false});
      const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn">${x.check}</button>`;fb.querySelector('.btn').onclick=()=>{done++;next()};return}
    if(q.k==='introLine'){const ln=D.lines[q.line];frame(x.intro,`<div class="card"><div class="intro-pip"><img src="${IMG.map}" alt=""><h3>${esc(ln.name[lang])}</h3></div><p>${esc(ln.fact(lang))}</p></div><div class="mapslot"></div>`);
      mapWidget(app.querySelector('.mapslot'),{layers:[ln.layer],zoom:false});
      const fb=app.querySelector('.fb');fb.innerHTML=`<button type="button" class="btn">${x.check}</button>`;fb.querySelector('.btn').onclick=()=>{done++;next()};return}
    if(q.k==='find'){const target=dir(q.dir);frame(x.find,`<p class="q">${x.tapDir(inCase[lang][q.dir])}</p><div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{markers:D.dirs.map(d=>({id:d.id,x:d.x,y:d.y,cls:'dir',label:'',aria:d.name[lang]})),
        onMarker:(id,el)=>{if(locked)return;locked=true;const ok=id===q.dir;el.classList.add(ok?'good':'bad');if(!ok)m.btn[q.dir].el.classList.add('good','pulse');
          answered(q,ok);feedback(ok,ok?x.right:x.wrongIs(dir(id).name[lang]),ok?target.fact(lang):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='what'){const target=dir(q.dir);const opts=[...q.from].sort(()=>Math.random()-.5);
      frame(x.what,`<p class="q">${x.whatDir}</p><div class="mapslot"></div><div class="choices">${opts.map(o=>`<button type="button" class="choice" data-o="${o}">${esc(dir(o).name[lang])}</button>`).join('')}</div>`);
      mapWidget(app.querySelector('.mapslot'),{markers:[{id:target.id,x:target.x,y:target.y,cls:'dir pulse',label:'?'}],zoom:false});
      app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const ok=b.dataset.o===q.dir;app.querySelectorAll('.choice').forEach(c=>{c.disabled=true;if(c.dataset.o===q.dir)c.classList.add('right')});if(!ok)b.classList.add('wrong');
        answered(q,ok);feedback(ok,ok?x.right:x.wrongIs(dir(q.dir).name[lang]),ok?'':target.fact(lang),ok?IMG.faceHappy:IMG.faceOops,next)});return}
    if(q.k==='line'){const ln=D.lines[q.line];frame(x.line,`<p class="q">${x.tapLine(lnameAcc(q.line))}</p><div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:['world-line-equator','world-line-prime-meridian'],onTap:(px,py,sx,sy,sz)=>{if(locked)return;
        const dist=q.line==='equator'?Math.abs(py-ln.y)/100*sz.H:Math.abs(px-ln.x)/100*sz.W;const ok=dist<=24;
        // the other line counts as a wrong answer even when tapped exactly
        locked=true;m.dot(sx,sy,ok);if(!ok)m.addLayer(ln.layer);answered(q,ok);feedback(ok,ok?x.right:x.tryLine,ok?ln.fact(lang):'',ok?IMG.faceHappy:IMG.faceOops,next)}});return}
    if(q.k==='hemi'){frame(x.hemi,`<p class="q">${x.tapHemi(hnameAcc(q.h))}</p><div class="mapslot"></div>`);
      let locked=false;const m=mapWidget(app.querySelector('.mapslot'),{layers:['world-line-equator','world-line-prime-meridian','world-line-antimeridian'],onTap:(px,py,sx,sy)=>{if(locked)return;locked=true;
        const eq=D.lines.equator.y,pm=D.lines['prime-meridian'].x,am=96.67;
        const inH={n:py<eq,s:py>eq,e:px>pm&&px<am,w:px<pm||px>am}[q.h];m.dot(sx,sy,inH);m.addLayer('world-hemisphere-'+q.h);
        answered(q,inH);feedback(inH,inH?x.right:x.hemiWrong,inH?D.hemis[q.h].name[lang]:'',inH?IMG.faceHappy:IMG.faceOops,next)}});return}
  }
  function finish(){const sec=Math.round((Date.now()-t0)/1000);const xp=10+Math.max(0,5-wrong);S.done[id]=true;S.xp+=xp;bumpStreak();save();
    h(`<section class="screen done"><img class="pip" src="${IMG.cheer}" alt=""><h2>${x.lessonDone}</h2>
     <div class="tiles"><div class="tile"><small>${x.xp}</small><b>+${xp}</b></div><div class="tile"><small>${x.acc}</small><b>${Math.round(total/(total+wrong)*100)}%</b></div><div class="tile"><small>${x.time}</small><b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b></div></div>
     <button type="button" class="btn">${x.home}</button></section>`);app.querySelector('.btn').onclick=home}
  next();
}

/* ---------- GeoWords unit final ---------- */
function geowords(){
  const x=t(),lang=L();const P=D.geo.puzzles.find(p=>p.unit===1&&p.language===lang&&p.approval?.status==='approved');
  const word=D.dict.units[0].words[lang].find(w=>w.role==='final');
  let step=0,wrong=0,here=0;const t0=Date.now();
  h(`<section class="screen lesson gw"><div class="l-top"><button type="button" class="l-x" aria-label="${x.quit}">✕</button><div class="l-bar"><i></i></div></div>
   <p class="gw-clue" aria-live="polite"></p><div class="mapslot"></div><p class="rotate-hint">${x.rotate}</p>
   <div class="slots">${[...P.answer].map(()=>'<div class="slot"></div>').join('')}</div>
   <div class="gw-pip"><img src="${IMG.hello}" alt=""><p class="bubble">${x.pipStart}</p></div></section>`);
  app.querySelector('.l-x').onclick=()=>{const s=sheet(`<h3>${x.quitT}</h3><div class="row"><button type="button" class="btn ghost" data-a="q">${x.quit}</button><button type="button" class="btn" data-a="s">${x.stay}</button></div>`);
    s.querySelector('[data-a=q]').onclick=()=>{s.remove();home()};s.querySelector('[data-a=s]').onclick=()=>s.remove()};
  const layers=(P.layers||[]).map(p=>p.split('/').pop().replace('.webp',''));
  const slots=[...app.querySelectorAll('.slot')];
  const m=mapWidget(app.querySelector('.mapslot'),{layers,trail:true,markers:P.markers.map(k=>({id:k.id,x:k.x,y:k.y,label:k.letter})),onMarker:choose});
  const pip=(img,txt)=>{app.querySelector('.gw-pip img').src=img;app.querySelector('.bubble').textContent=txt};
  function clue(){const c=P.clues[step];app.querySelector('.gw-clue').innerHTML=esc(c.text).replace(/(\S+ букву|the \S+ letter)/,'<b>$1</b>');
    app.querySelector('.l-bar i').style.width=(step/P.clues.length*100)+'%'}
  function choose(id,el){if(step>=P.clues.length||el.classList.contains('done'))return;const c=P.clues[step];
    if(id!==c.markerId){wrong++;here++;el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');
      if(here>=3){m.btn[c.markerId].el.classList.add('pulse');pip(IMG.spy,x.pipHint)}else pip(IMG.left,x.pipBad);return}
    here=0;el.classList.remove('pulse');el.classList.add('done');m.route(id);const k=P.markers.find(q=>q.id===id);const s=slots[c.position-1];s.textContent=k.letter;s.classList.add('new');
    pip(IMG.yes,x.pipOk(k.letter));step++;
    if(step===P.clues.length){app.querySelector('.l-bar i').style.width='100%';setTimeout(finish,800)}else setTimeout(clue,350)}
  function finish(){const sec=Math.round((Date.now()-t0)/1000);const xp=20+Math.max(0,6-wrong);S.done['u1-final']=true;S.xp+=xp;bumpStreak();save();
    h(`<section class="screen done"><img class="medal" src="${IMG.medal}" alt=""><h2>${x.unitDone}</h2>
     <p class="eyebrow">${x.wordDef}</p><p class="word-big">${esc(P.answer)}</p><p class="defn">${esc(word.definition)}</p>
     <div class="tiles"><div class="tile"><small>${x.xp}</small><b>+${xp}</b></div><div class="tile"><small>${x.mistakes}</small><b>${wrong}</b></div><div class="tile"><small>${x.time}</small><b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b></div></div>
     <img src="${IMG.cheer}" alt="" style="width:120px"><button type="button" class="btn">${x.home}</button></section>`);app.querySelector('.btn').onclick=home}
  clue();
}

/* ---------- boot ---------- */
loadData().then(()=>{S.lang?home():welcome()}).catch(e=>{app.innerHTML=`<div class="loading">Не удалось загрузить данные: ${esc(e.message)}</div>`});
window.addEventListener('resize',()=>{if(app.querySelector('.path'))drawTrail()});
})();
