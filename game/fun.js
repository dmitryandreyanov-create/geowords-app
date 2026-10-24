/* Expedition layer: Pip the guide (watercolour style + outfits), stars, XP ranks,
   combos, passport stamps, expedition map, fact cards, Speed Hunt, daily quest,
   read-aloud clues, hints and sound. It listens to gw:* events from app.js and
   reads saved progress, but never changes puzzle progress or credit rules. */
(()=>{
const KEY="geowords_fun_v1";
const RANKS=[
  {xp:0,name:"Map Reader",icon:"🗺️",outfit:"hat"},
  {xp:150,name:"Trail Scout",icon:"🥾",outfit:"scarf"},
  {xp:400,name:"Pathfinder",icon:"🧭",outfit:"binoculars"},
  {xp:800,name:"Navigator",icon:"⛵",outfit:"backpack"},
  {xp:1400,name:"Captain",icon:"⚓",outfit:"captain"},
  {xp:2200,name:"Legendary Explorer",icon:"🏆",outfit:"crown"}
];
const OUTFITS={hat:"Explorer hat",scarf:"Trail scarf",binoculars:"Binoculars",backpack:"Backpack",captain:"Captain's cap",crown:"Golden crown"};
const SAY={
  start:["Let's explore! Read the clue and find the letter.","Ready, explorer? Where is our first letter?","Adventure time! I'll follow your lead."],
  correct:["Yes! Great map reading!","You found it!","Nice one, explorer!","Spot on!","Brilliant!"],
  combo:["You're on fire!","Unstoppable!","What a streak!"],
  wrong:["Hmm, not there. Read the clue again!","Close! Try another place.","Let's look somewhere else.","Oops! Check the map again."],
  hintOffer:["Stuck? My telescope can help!"],
  hint:["Look where my telescope is shining!"],
  finish3:["Perfect! Three stars!","Flawless expedition!"],
  finish2:["Great work! Two stars!","Nearly perfect!"],
  finish1:["You did it! Every explorer learns by trying."]
};
const QUESTS=[
  {id:"oceans",text:"Find 3 letters in oceans",goal:3,on:"correct",test:c=>/ocean/i.test(c)},
  {id:"rivers",text:"Find 3 letters next to rivers",goal:3,on:"correct",test:c=>/river|nile|amazon|mississippi|danube|ganges|yangtze|volga/i.test(c)},
  {id:"continents",text:"Find 4 letters on continents",goal:4,on:"correct",test:c=>/africa|asia|europe|america|australia|antarctica|eurasia|continent/i.test(c)},
  {id:"perfect",text:"Solve 1 word with no mistakes",goal:1,on:"perfect"},
  {id:"combo",text:"Make a combo of 5 in a row",goal:1,on:"combo5"},
  {id:"words",text:"Solve 2 words",goal:2,on:"finish"}
];
const pick=list=>list[Math.floor(Math.random()*list.length)];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const $=id=>document.getElementById(id);
const dayKey=d=>{const z=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())};
const today=()=>dayKey(new Date());
const daysBetween=(a,b)=>Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/864e5);
const readJSON=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}};

function load(){
  const base={xp:0,stars:0,stamps:{},streak:0,lastDay:"",sound:true,voice:false,outfit:"hat",cards:{},quest:null,huntBest:0,mode:"kid",freezes:1,goal:1,goalDay:"",goalN:0,goalDone:false,goalPaid:""};
  const raw=readJSON(KEY);return {...base,...(raw&&typeof raw==="object"?raw:{})};
}
let state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function rankIndex(xp){let i=0;RANKS.forEach((r,j)=>{if(xp>=r.xp)i=j});return i}
const rankFor=xp=>RANKS[rankIndex(xp)];
const nextRank=xp=>RANKS.find(r=>r.xp>xp)||null;
const unlocked=()=>RANKS.slice(0,rankIndex(state.xp)+1).map(r=>r.outfit);

/* ---------- sound (WebAudio) and voice (speech synthesis) ---------- */
let audio=null;
function tone(freq,start,dur,type="sine",gain=.12){
  if(!state.sound)return;
  try{
    audio=audio||new (window.AudioContext||window.webkitAudioContext)();
    const t=audio.currentTime+start,o=audio.createOscillator(),g=audio.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(audio.destination);o.start(t);o.stop(t+dur+.05);
  }catch{}
}
const sfx={
  correct:combo=>{const base=523+Math.min(combo,6)*40;tone(base,0,.16,"triangle");tone(base*1.5,.08,.2,"triangle")},
  wrong:()=>{tone(196,0,.18,"sine",.08);tone(165,.1,.22,"sine",.06)},
  finish:()=>[523,659,784,1047].forEach((f,i)=>tone(f,i*.11,.32,"triangle",.13)),
  rank:()=>[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.09,.4,"square",.05)),
  tick:()=>tone(1200,0,.05,"square",.03)
};
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch{}}
const canSpeak=()=>"speechSynthesis" in window&&typeof SpeechSynthesisUtterance!=="undefined";
function speak(text){
  if(!canSpeak()||!text)return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=.9;u.pitch=1.05;speechSynthesis.speak(u)}catch{}
}

/* ---------- Pip the explorer fox: watercolour SVG with outfits ---------- */
let pipSeq=0;
const ACCESSORY={
  hat:`<path d="M20 30 Q50 6 80 30 L82 34 Q50 24 18 34Z" fill="#4c8f3a"/><rect x="18" y="31" width="64" height="5" rx="2.5" fill="#3a7230"/><circle cx="66" cy="22" r="4" fill="#ffd34d" stroke="#c99a1d" stroke-width="1.2"/>`,
  scarf:`<path d="M24 78 Q50 92 76 78 L77 86 Q50 99 23 86Z" fill="#e2483d"/><path d="M62 86 L70 99 L60 99 L56 88Z" fill="#c8362d"/><path d="M30 82 L34 86 M42 86 L45 90 M56 87 L58 91" stroke="#ffd2cc" stroke-width="2"/>`,
  binoculars:`<rect x="35" y="80" width="11" height="14" rx="4" fill="#33414d"/><rect x="54" y="80" width="11" height="14" rx="4" fill="#33414d"/><rect x="44" y="83" width="12" height="6" rx="2" fill="#4b5b68"/><circle cx="40.5" cy="92" r="3" fill="#8fd3ff"/><circle cx="59.5" cy="92" r="3" fill="#8fd3ff"/><path d="M30 70 Q50 84 70 70" stroke="#6b4a2b" stroke-width="2" fill="none"/>`,
  backpack:`<path d="M27 66 Q31 84 36 96 M73 66 Q69 84 64 96" stroke="#8a5a2b" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="34" cy="86" r="3" fill="#ffd34d"/><circle cx="66" cy="86" r="3" fill="#ffd34d"/>`,
  captain:`<path d="M22 33 Q50 14 78 33 L80 37 L20 37Z" fill="#fff"/><rect x="19" y="33" width="62" height="7" rx="3" fill="#1f3b70"/><path d="M28 40 Q50 48 72 40 L70 44 Q50 52 30 44Z" fill="#14284d"/><circle cx="50" cy="28" r="5" fill="#ffd34d" stroke="#c99a1d" stroke-width="1.2"/><path d="M47 28 L53 28 M50 25 L50 31" stroke="#1f3b70" stroke-width="1.4"/>`,
  crown:`<path d="M24 34 L28 12 L39 26 L50 8 L61 26 L72 12 L76 34Z" fill="#ffcf3a" stroke="#d29b12" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="22" r="3.5" fill="#e2483d"/><circle cx="35" cy="28" r="2.6" fill="#3d9be2"/><circle cx="65" cy="28" r="2.6" fill="#4cc46a"/>`
};
function pipSVG(outfit=state.outfit){
  // Approved painted design for the base outfit. Other unlocked costumes keep
  // their existing renderer until matching illustrated outfits are approved.
  if(outfit==='hat')return '<span class="pip-art" aria-hidden="true"></span>';
  const id="pipwc"+(++pipSeq);
  const head=outfit==="hat"||outfit==="captain"||outfit==="crown";
  const acc=ACCESSORY[outfit]||ACCESSORY.hat;
  return `<svg viewBox="0 0 100 104" aria-hidden="true"><defs>
   <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="3" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -.9 .5" result="grain"/><feComposite in="grain" in2="d" operator="in" result="grainIn"/><feBlend in="d" in2="grainIn" mode="multiply"/></filter></defs>
 <ellipse cx="50" cy="98" rx="26" ry="5" fill="rgba(0,0,0,.12)"/>
 <g filter="url(#${id})">
 <path d="M22 30 L30 8 L42 26Z" fill="#ec8a40"/><path d="M78 30 L70 8 L58 26Z" fill="#ec8a40"/>
 <path d="M27 26 L31 14 L37 24Z" fill="#ffd9b8"/><path d="M73 26 L69 14 L63 24Z" fill="#ffd9b8"/>
 <ellipse cx="50" cy="52" rx="32" ry="30" fill="#f39a4f"/><ellipse cx="42" cy="40" rx="16" ry="10" fill="#f7b072" opacity=".6"/>
 <path d="M50 50 C30 52 22 66 30 78 C38 88 62 88 70 78 C78 66 70 52 50 50Z" fill="#fff4e8"/>
 ${head?"":acc}
 </g>
 <g class="pip-eyes"><ellipse cx="38" cy="50" rx="4.2" ry="5.2" fill="#2a2a35"/><ellipse cx="62" cy="50" rx="4.2" ry="5.2" fill="#2a2a35"/>
 <circle cx="39.5" cy="48" r="1.4" fill="#fff"/><circle cx="63.5" cy="48" r="1.4" fill="#fff"/></g>
 <ellipse cx="50" cy="63" rx="5" ry="3.6" fill="#2a2a35"/>
 <path d="M43 69 Q50 75 57 69" stroke="#2a2a35" stroke-width="2.4" fill="none" stroke-linecap="round"/>
 <circle cx="28" cy="62" r="4" fill="#ff9f9f" opacity=".55"/><circle cx="72" cy="62" r="4" fill="#ff9f9f" opacity=".55"/>
 ${head?`<g filter="url(#${id})">${acc}</g>`:""}
</svg>`;
}
function refreshPips(){document.querySelectorAll("[data-pip]").forEach(el=>{el.innerHTML=pipSVG()})}

/* ---------- small UI helpers ---------- */
function toast(text){
  let box=$("funToasts");
  if(!box){box=document.createElement("div");box.id="funToasts";box.className="fun-toasts";box.setAttribute("aria-live","polite");document.body.appendChild(box)}
  while(box.children.length>=3)box.firstChild.remove();
  const t=document.createElement("div");t.className="fun-toast";t.textContent=text;box.appendChild(t);
  setTimeout(()=>t.classList.add("out"),2600);setTimeout(()=>t.remove(),3100);
}
function modal(label,inner,cls=""){
  const dlg=document.createElement("div");dlg.className="fun-overlay";dlg.setAttribute("role","dialog");dlg.setAttribute("aria-modal","true");dlg.setAttribute("aria-label",label);
  dlg.innerHTML=`<div class="fun-sheet ${cls}"><div class="sheet-head"><h2>${esc(label)}</h2><button class="sheet-close" type="button" aria-label="Close">✕</button></div><div class="sheet-body">${inner}</div></div>`;
  document.body.appendChild(dlg);
  const close=()=>{dlg.dispatchEvent(new Event("fun:close"));dlg.remove()};
  dlg.querySelector(".sheet-close").addEventListener("click",close);
  dlg.addEventListener("click",e=>{if(e.target===dlg)close()});
  dlg.querySelector(".sheet-close").focus();
  return {el:dlg,body:dlg.querySelector(".sheet-body"),close};
}

/* ---------- XP, streak, daily quest ---------- */
function gainXP(n,quiet){
  const before=rankIndex(state.xp);state.xp+=n;const after=rankIndex(state.xp);
  if(after>before){
    const r=RANKS[after];
    if(!quiet)toast(`🎉 New rank: ${r.icon} ${r.name}!`);
    toast(`🎁 Pip unlocked: ${OUTFITS[r.outfit]}`);
    setTimeout(sfx.rank,300);
    return r;
  }
  return null;
}
function touchStreak(){
  const d=today();if(state.lastDay===d)return;
  const gap=state.lastDay?daysBetween(state.lastDay,d):0;
  if(gap===1)state.streak++;
  else if(gap===2&&state.freezes>0){state.freezes--;state.streak++;toast(`❄️ A streak freeze covered the missed day. ${state.streak} days in a row!`)}
  else state.streak=1;
  if(state.streak>1&&state.streak%7===0&&state.freezes<2){state.freezes++;toast("❄️ 7 days in a row: you earned a streak freeze!")}
  state.lastDay=d;save();renderBar();
}
function goalState(){
  const d=today();if(state.goalDay!==d){state.goalDay=d;state.goalN=0;state.goalDone=false}
  return {n:state.goalN,goal:state.goal,done:state.goalDone};
}
function countGoalWord(){
  goalState();state.goalN++;
  state.goalDone=state.goalN>=state.goal;
  if(state.goalDone&&state.goalPaid!==state.goalDay){state.goalPaid=state.goalDay;toast("✅ Daily goal reached! +30 XP");gainXP(30)}
}
function quest(){
  const d=today();
  if(!state.quest||state.quest.date!==d){
    let h=0;for(const c of d)h=(h*31+c.charCodeAt(0))>>>0;
    state.quest={date:d,id:QUESTS[h%QUESTS.length].id,n:0,done:false};save();
  }
  return {...QUESTS.find(q=>q.id===state.quest.id),...state.quest};
}
function questEvent(kind,clue){
  const q=quest();if(q.done||q.on!==kind)return;
  if(kind==="correct"&&!q.test(clue||""))return;
  state.quest.n=Math.min(q.goal,state.quest.n+1);
  if(state.quest.n>=q.goal){
    state.quest.done=true;state.stamps["daily:"+q.date]={word:"DAILY QUEST",stars:3,unit:q.date,t:Date.now()};
    toast("🎯 Daily quest complete! +60 XP");gainXP(60);
  }
  save();renderHomeCard();
}

/* ---------- guide in the clue card + read-aloud ---------- */
function ensureGuide(){
  const card=document.querySelector("#gameScreen .clue-card");if(!card||$("pipGuide"))return;
  const wrap=document.createElement("div");wrap.id="pipGuide";wrap.className="pip-guide";
  wrap.innerHTML=`<button class="pip-avatar" type="button" data-pip aria-label="Pip the explorer fox"></button><div class="pip-bubble" aria-live="polite"></div>`;
  card.appendChild(wrap);wrap.querySelector(".pip-avatar").innerHTML=pipSVG();
  wrap.querySelector(".pip-avatar").addEventListener("click",useHint);
  const combo=document.createElement("div");combo.id="comboChip";combo.className="combo-chip";card.appendChild(combo);
  if(canSpeak()){
    const read=document.createElement("button");read.type="button";read.id="readClue";read.className="read-btn";read.textContent="🔊 Read";
    read.setAttribute("aria-label","Read the clue aloud");
    read.addEventListener("click",()=>speak($("clueText")?.textContent));
    card.querySelector(".eyebrow")?.after(read);
  }
}
function say(text,mood){
  ensureGuide();const g=$("pipGuide");if(!g)return;
  g.querySelector(".pip-bubble").textContent=text;
  g.classList.remove("happy","sad","hint","pop");void g.offsetWidth;
  g.classList.add("pop");if(mood)g.classList.add(mood);
  const art=g.querySelector('.pip-art');
  if(art)art.dataset.pose=mood==='happy'?'celebrate':mood==='sad'?'encourage':mood==='hint'?'map':'greet';
}
const clueObserver=new MutationObserver(()=>{
  const t=$("clueText")?.textContent;
  if(state.voice&&t&&$("gameScreen")?.classList.contains("active"))speak(t);
});
if($("clueText"))clueObserver.observe($("clueText"),{childList:true,characterData:true,subtree:true});

/* ---------- per-word session ---------- */
let word={mistakes:0,clueMistakes:0,combo:0,best:0,hintUsed:false,expected:null,xp:0};
function setCombo(){
  const c=$("comboChip");if(!c)return;
  c.textContent=word.combo>=3?`Combo ×${word.combo} 🔥`:"";c.classList.toggle("on",word.combo>=3);
}
function useHint(){
  if(!word.expected||word.clueMistakes<3)return;
  const el=document.querySelector(`#markersLayer .marker-hotspot[data-marker-id="${CSS.escape(word.expected)}"]`);
  if(!el)return;
  word.hintUsed=true;el.classList.add("hint-glow");say(pick(SAY.hint),"hint");tone(880,0,.25,"sine",.07);
}
function flyLetter(letter,from,slot){
  const slots=document.querySelectorAll("#wordSlots .slot.filled");
  const to=(slot!=null&&document.querySelector(`#wordSlots .slot[data-slot="${slot}"]`))||slots[slots.length-1];
  if(!from||!to)return;
  const t=to.getBoundingClientRect(),f=document.createElement("div");
  f.className="fly-letter";f.textContent=letter;
  f.style.left=from.left+from.width/2+"px";f.style.top=from.top+from.height/2+"px";
  document.body.appendChild(f);
  requestAnimationFrame(()=>{f.style.transform=`translate(${t.left+t.width/2-(from.left+from.width/2)}px,${t.top+t.height/2-(from.top+from.height/2)}px) scale(1.3)`;f.style.opacity="0"});
  setTimeout(()=>f.remove(),650);
  to.classList.add("slot-pop");setTimeout(()=>to.classList.remove("slot-pop"),500);
}
function confetti(){
  const layer=document.createElement("div");layer.className="confetti";
  const colors=["#ff6b6b","#ffd34d","#6bc45d","#4ca9c6","#a57bff","#ff9f43"];
  for(let i=0;i<70;i++){const p=document.createElement("i");p.style.left=Math.random()*100+"%";p.style.background=colors[i%colors.length];
    p.style.animationDelay=Math.random()*.35+"s";p.style.setProperty("--dx",(Math.random()*160-80)+"px");p.style.setProperty("--rot",(Math.random()*720-360)+"deg");layer.appendChild(p)}
  document.body.appendChild(layer);setTimeout(()=>layer.remove(),2600);
}

/* ---------- fact cards (collected from the lesson screens) ---------- */
const NOT_A_FACT=/words solved|word solved|replay|progress unchanged|of 7|7\/7|70\/70|test words|next:|keep practicing|unlocked/i;
function factIcon(t){
  const rules=[[/volcan/i,"🌋"],[/desert|sahara/i,"🏜️"],[/island|greenland|madagascar/i,"🏝️"],[/mountain|everest|himalaya|andes|range|peak/i,"⛰️"],
    [/river|nile|amazon|mississippi|danube|ganges|yangtze|volga/i,"🌊"],[/sea|ocean|salin|gulf/i,"🐋"],[/equator|hemisphere|meridian|north|south|east|west/i,"🧭"],
    [/cold|antarctica|ice|polar/i,"🧊"],[/hot|warm/i,"☀️"],[/people|populous|residents|empire|history|roman|sacred/i,"🏛️"],[/continent|eurasia|asia|africa|europe|america|australia/i,"🌍"]];
  for(const [re,ic] of rules)if(re.test(t))return ic;return "📜";
}
function collectFacts(list){
  if(!list)return;
  let added=0;
  for(const li of list.querySelectorAll("li")){
    const text=li.textContent.trim();
    if(text.length<12||NOT_A_FACT.test(text))continue;
    const key=text.toLowerCase();
    if(!state.cards[key]){state.cards[key]={text,t:Date.now()};added++}
  }
  if(added){save();toast(added===1?"🃏 New fact card for your album!":`🃏 ${added} new fact cards for your album!`);renderHomeCard()}
}
for(const id of ["introFacts","nextFacts"]){
  const el=$(id);if(el)new MutationObserver(()=>setTimeout(()=>collectFacts(el),0)).observe(el,{childList:true});
}
function openCards(){
  const cards=Object.values(state.cards).sort((a,b)=>a.t-b.t);
  modal("Fact Card Album",cards.length
    ?`<p class="sheet-sub">${cards.length} cards collected. Tap 🔊 on a card to hear it.</p><div class="cards">${cards.map((c,i)=>`<div class="fact-card"><span class="fact-icon">${factIcon(c.text)}</span><p>${esc(c.text)}</p>${canSpeak()?`<button class="fact-read" type="button" data-i="${i}" aria-label="Read this fact aloud">🔊</button>`:""}</div>`).join("")}</div>`
    :`<p class="sheet-sub">Read the facts before each puzzle to start your collection!</p>`,"wide")
    .body.querySelectorAll(".fact-read").forEach(b=>b.addEventListener("click",()=>speak(cards[Number(b.dataset.i)].text)));
}

/* ---------- reading saved progress (read only) ---------- */
function progressTrails(){
  const trails=[];
  const l1=globalThis.GEOWORD_L1_PHONE,l1s=readJSON("geowords_l1_phone_trial_v1");
  if(l1?.steps){
    trails.push({name:"Level 1 · Oceans & Continents",stops:l1.steps.map((st,i)=>{
      const r=l1s?.progress?.steps?.[st.id];const n=r?Number(!!r.authoredSolved)+(r.solvedWordIds?.length||0):0;
      return {label:st.authored.answer,n,goal:7,current:(l1s?.progress?.stepIndex??0)===i}})});
  }
  const rc=globalThis.GEOWORD_COURSES?.rivers,rs=readJSON("geowords_rivers_progress_v2");
  if(rc?.steps){
    trails.push({name:"Rivers of the World",stops:rc.steps.map((st,i)=>{
      const r=rs?.steps?.[st.id];const n=r?Number(!!r.authoredSolved)+(r.solvedWordIds?.length||0):0;
      return {label:st.object?.label||st.id,n,goal:7,current:(rs?.stepIndex??0)===i}})});
  }
  const lv=globalThis.GEOWORD_LEVELS;
  if(Array.isArray(lv)){
    let cur=false;
    trails.push({name:"Level 3 · Mountains",stops:lv.map(l=>{let done=false;try{done=localStorage.getItem("geowords_completed_"+l.id)==="1"}catch{}
      const s={label:l.answer,n:done?1:0,goal:1,current:!done&&!cur};if(!done)cur=true;return s})});
  }
  return trails;
}
function openMap(){
  const trails=progressTrails();
  const html=trails.map(tr=>{
    const done=tr.stops.filter(s=>s.n>=s.goal).length;
    return `<section class="trail"><div class="trail-head"><h3>${esc(tr.name)}</h3><span>${done}/${tr.stops.length}</span></div><ol class="trail-stops">${tr.stops.map((s,i)=>{
      const st=s.n>=s.goal?"done":s.current?"here":"locked";
      return `<li class="stop ${st}"><span class="stop-dot">${st==="done"?"✓":st==="here"?`<span class="stop-pip" data-pip></span>`:i+1}</span><span class="stop-label">${st==="locked"?"?":esc(s.label)}</span>${s.goal>1&&st!=="locked"?`<span class="stop-count">${Math.min(s.n,s.goal)}/${s.goal}</span>`:""}</li>`}).join("")}</ol></section>`}).join("");
  const m=modal("Expedition Map",`<p class="sheet-sub">Every finished step lights up the trail. Pip waits where you are now.</p>${html}`,"wide");
  m.body.querySelectorAll("[data-pip]").forEach(el=>{el.innerHTML=pipSVG()});
}

/* ---------- passport + wardrobe ---------- */
function openPassport(){
  const stamps=Object.values(state.stamps).sort((a,b)=>a.t-b.t);
  const tilt=i=>((i*37)%11)-5;
  const open=unlocked();
  const wardrobe=Object.keys(OUTFITS).map(o=>{
    const ok=open.includes(o),need=RANKS.find(r=>r.outfit===o);
    return `<button class="outfit ${state.outfit===o?"on":""}" type="button" data-outfit="${o}" ${ok?"":"disabled"} aria-pressed="${state.outfit===o}"><span class="outfit-pip">${pipSVG(o)}</span><span>${ok?OUTFITS[o]:"🔒 "+need.name}</span></button>`}).join("");
  const m=modal("Explorer Passport",`<p class="sheet-sub">${rankFor(state.xp).icon} ${rankFor(state.xp).name} · ⭐ ${state.stars} ${state.stars===1?"star":"stars"} · 🔥 ${state.streak} ${state.streak===1?"day":"days"} in a row · ❄️ ${state.freezes} ${state.freezes===1?"freeze":"freezes"}</p>
   <h3 class="sheet-h3">Settings</h3>
   <div class="settings"><div class="setting"><span>Who is playing?</span><div class="seg" role="group" aria-label="Mode">${[["kid","Child"],["adult","Adult"]].map(([v,t])=>`<button type="button" data-mode="${v}" aria-pressed="${state.mode===v}" class="${state.mode===v?"on":""}">${t}</button>`).join("")}</div></div>
   <div class="setting"><span>Daily goal</span><div class="seg" role="group" aria-label="Daily goal">${[1,2,3].map(n=>`<button type="button" data-goal="${n}" aria-pressed="${state.goal===n}" class="${state.goal===n?"on":""}">${n} ${n===1?"word":"words"}</button>`).join("")}</div></div>
   <p class="setting-note">Lessons have no timer in either mode. Speed Hunt is a separate timed challenge for everyone.</p></div>
   <h3 class="sheet-h3">Pip's wardrobe</h3><div class="wardrobe">${wardrobe}</div>
   <h3 class="sheet-h3">Stamps</h3>${stamps.length?`<div class="stamps">${stamps.map((s,i)=>`<div class="stamp" style="--tilt:${tilt(i)}deg"><span class="stamp-word">${esc(s.word)}</span><span class="stamp-stars">${"★".repeat(s.stars)}${"☆".repeat(3-s.stars)}</span><span class="stamp-unit">${esc(s.unit||"")}</span></div>`).join("")}</div>`:`<p class="sheet-sub">Solve your first word to earn a stamp!</p>`}`,"wide passport-sheet");
  const seg=(attr,apply)=>m.body.querySelectorAll(`[data-${attr}]`).forEach(b=>b.addEventListener("click",()=>{
    apply(b.dataset[attr]);save();renderHomeCard();
    m.body.querySelectorAll(`[data-${attr}]`).forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-pressed",String(on))});
    tone(660,0,.1,"triangle");
  }));
  seg("mode",v=>{state.mode=v==="adult"?"adult":"kid"});
  seg("goal",v=>{state.goal=Math.min(3,Math.max(1,Number(v)||1));goalState();state.goalDone=state.goalN>=state.goal});
  m.body.querySelectorAll(".outfit").forEach(b=>b.addEventListener("click",()=>{
    state.outfit=b.dataset.outfit;save();refreshPips();
    m.body.querySelectorAll(".outfit").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",String(x===b))});
    tone(784,0,.12,"triangle");
  }));
}

/* ---------- Speed Hunt: timed review without credit ---------- */
function huntPool(){
  const pool=[];
  const lv=globalThis.GEOWORD_LEVELS;
  if(Array.isArray(lv))for(const l of lv){let done=false;try{done=localStorage.getItem("geowords_completed_"+l.id)==="1"}catch{}if(done)pool.push(l)}
  const rc=globalThis.GEOWORD_COURSES?.rivers,rs=readJSON("geowords_rivers_progress_v2"),ra=globalThis.GEOWORD_RIVERS_AUTHORED;
  if(rc?.steps&&Array.isArray(ra))for(const st of rc.steps)if(rs?.steps?.[st.id]?.authoredSolved){const p=ra.find(x=>x.id===st.authoredPuzzleId);if(p)pool.push(p)}
  const l1=globalThis.GEOWORD_L1_PHONE,l1s=readJSON("geowords_l1_phone_trial_v1");
  if(l1?.steps)for(const st of l1.steps)if(l1s?.progress?.steps?.[st.id]?.authoredSolved)pool.push(st.authored);
  return pool.filter(p=>Array.isArray(p.markers)&&Array.isArray(p.clues)&&p.map);
}
const huntText=t=>String(t).replace(/^The\s+\w+\s+letter\s+is\s+/i,"Find the letter ");
function openHunt(){
  const pool=huntPool();
  if(!pool.length){modal("Speed Hunt",`<div class="hunt-locked"><span data-pip class="hunt-pip"></span><p>Solve your first puzzle, then come back! Speed Hunt uses maps you have already explored.</p></div>`).body.querySelectorAll("[data-pip]").forEach(e=>{e.innerHTML=pipSVG()});return}
  const m=modal("Speed Hunt",`<div class="hunt-top"><span class="hunt-time" id="huntTime">60</span><span class="hunt-score">Found: <b id="huntScore">0</b></span><span class="hunt-best">Best: ${state.huntBest}</span></div>
    <p class="hunt-clue" id="huntClue">Get ready…</p><div class="hunt-map" id="huntMap"><img id="huntImg" alt="Map"><svg class="hunt-arrows" id="huntArrows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><div id="huntMarkers"></div></div>
    <button class="hunt-start primary" type="button" id="huntStart">Start: 60 seconds!</button>`,"wide hunt-sheet");
  let timer=null,left=60,score=0,running=false,puzzle=null,queue=[],target=null;
  const body=m.body;
  function loadPuzzle(){
    puzzle=pick(pool);queue=[...puzzle.clues].sort(()=>Math.random()-.5);
    body.querySelector("#huntMap").style.setProperty("--aspect",puzzle.mapAspect||"14 / 9");
    body.querySelector("#huntImg").src=puzzle.map;
    const arrows=body.querySelector("#huntArrows");arrows.innerHTML=puzzle.markers.filter(k=>k.pointsTo).map(k=>{const e=k.pointsTo,f=e.from||{x:k.x+(e.x-k.x)*.25,y:k.y+(e.y-k.y)*.25};return `<line x1="${f.x}" y1="${f.y}" x2="${e.x}" y2="${e.y}"/>`}).join("");
    const show=puzzle.letterMode==="overlay";
    body.querySelector("#huntMarkers").innerHTML=puzzle.markers.map(k=>`<button type="button" class="hunt-marker ${show?"shown":""}" data-id="${esc(k.id)}" style="left:${k.x}%;top:${k.y}%" aria-label="Letter ${esc(k.letter)}">${show?esc(k.letter):""}</button>`).join("");
    body.querySelectorAll(".hunt-marker").forEach(b=>b.addEventListener("click",()=>guess(b)));
  }
  function nextClue(){
    if(!queue.length)loadPuzzle();
    const c=queue.pop();target=c.markerId;body.querySelector("#huntClue").textContent=huntText(c.text);
    if(state.voice)speak(huntText(c.text));
  }
  function guess(b){
    if(!running)return;
    if(b.dataset.id===target){
      score++;body.querySelector("#huntScore").textContent=score;b.classList.add("hit");sfx.correct(score);buzz(12);
      setTimeout(()=>b.classList.remove("hit"),400);nextClue();
    }else{b.classList.remove("miss");void b.offsetWidth;b.classList.add("miss");setTimeout(()=>b.classList.remove("miss"),450);sfx.wrong();buzz([25,30,25])}
  }
  function end(){
    running=false;clearInterval(timer);
    const best=score>state.huntBest;if(best)state.huntBest=score;
    const xp=score*5;save();
    body.querySelector("#huntClue").textContent=score?`Time! You found ${score} letter${score===1?"":"s"}${best?" · new best!":""} +${xp} XP`:"Time! Try again: read the clue, then tap.";
    body.querySelector("#huntStart").hidden=false;body.querySelector("#huntStart").textContent="Play again";
    if(xp)gainXP(xp);renderBar();if(best&&score)confetti();sfx.finish();
  }
  body.querySelector("#huntStart").addEventListener("click",()=>{
    score=0;left=60;running=true;body.querySelector("#huntScore").textContent="0";body.querySelector("#huntTime").textContent="60";
    body.querySelector("#huntStart").hidden=true;loadPuzzle();nextClue();
    timer=setInterval(()=>{left--;body.querySelector("#huntTime").textContent=left;body.querySelector("#huntTime").classList.toggle("low",left<=10);if(left<=5&&left>0)sfx.tick();if(left<=0)end()},1000);
  });
  loadPuzzle();
  m.el.addEventListener("fun:close",()=>{clearInterval(timer);running=false;try{speechSynthesis.cancel()}catch{}});
}

/* ---------- top bar + home explorer card ---------- */
function renderBar(){
  let bar=$("funBar");
  if(!bar){
    bar=document.createElement("div");bar.id="funBar";bar.className="fun-bar";
    bar.innerHTML=`<span class="fun-chip" title="Stars"><b>⭐</b><strong id="funStars"></strong></span><span class="fun-chip" title="Days in a row"><b>🔥</b><strong id="funStreak"></strong></span><button id="funSound" class="fun-chip fun-btn" type="button"></button>${canSpeak()?`<button id="funVoice" class="fun-chip fun-btn" type="button"></button>`:""}`;
    const medal=document.querySelector(".topbar .medal");medal?.parentNode.insertBefore(bar,medal);
    $("funSound").addEventListener("click",()=>{state.sound=!state.sound;save();renderBar();if(state.sound)tone(660,0,.12)});
    $("funVoice")?.addEventListener("click",()=>{state.voice=!state.voice;save();renderBar();if(state.voice)speak("I will read the clues for you.");else try{speechSynthesis.cancel()}catch{}});
  }
  $("funStars").textContent=state.stars;$("funStreak").textContent=state.streak;$("funStreak").parentElement.title=`Days in a row · ${state.freezes} streak ${state.freezes===1?"freeze":"freezes"}`;
  $("funSound").textContent=state.sound?"🔊":"🔇";$("funSound").setAttribute("aria-label",state.sound?"Sound on":"Sound off");
  if($("funVoice")){$("funVoice").textContent="🗣️";$("funVoice").classList.toggle("off",!state.voice);$("funVoice").setAttribute("aria-label",state.voice?"Read clues aloud: on":"Read clues aloud: off")}
  renderHomeCard();
}
function renderHomeCard(){
  const home=$("homeScreen");if(!home)return;
  let card=$("explorerCard");
  if(!card){
    card=document.createElement("div");card.id="explorerCard";card.className="explorer-card";
    card.innerHTML=`<div class="explorer-top"><div class="explorer-pip" data-pip></div><div class="explorer-info"><p class="eyebrow">YOUR EXPEDITION</p><h2 id="rankName"></h2><div class="xp-track"><div id="xpFill" class="xp-fill"></div></div><div id="xpText" class="xp-text"></div></div></div>
      <div class="goal" id="goalBox"><span>🎯</span><span id="goalText"></span></div>
      <div class="quest" id="questBox"><span class="quest-icon">🧭</span><div class="quest-main"><div class="quest-title">Today's quest</div><div id="questText" class="quest-text"></div><div class="quest-track"><div id="questFill" class="quest-fill"></div></div></div></div>
      <div class="explorer-actions">
        <button type="button" id="mapBtn" class="action-btn">🗺️ <span>Expedition map</span></button>
        <button type="button" id="huntBtn" class="action-btn">⏱️ <span>Speed Hunt</span></button>
        <button type="button" id="cardsBtn" class="action-btn">🃏 <span>Fact cards · <b id="cardCount"></b></span></button>
        <button type="button" id="passportBtn" class="action-btn">📘 <span>Passport · <b id="stampCount"></b></span></button>
      </div>`;
    home.insertBefore(card,home.firstChild);
    $("passportBtn").addEventListener("click",openPassport);$("mapBtn").addEventListener("click",openMap);
    $("cardsBtn").addEventListener("click",openCards);$("huntBtn").addEventListener("click",openHunt);
    card.querySelector("[data-pip]").innerHTML=pipSVG();
  }
  const r=rankFor(state.xp),n=nextRank(state.xp);
  $("rankName").textContent=r.icon+" "+r.name;
  $("xpFill").style.width=(n?Math.round((state.xp-r.xp)/(n.xp-r.xp)*100):100)+"%";
  $("xpText").textContent=n?`${state.xp} XP · ${n.xp-state.xp} XP to ${n.name}`:`${state.xp} XP · top rank reached!`;
  $("stampCount").textContent=Object.keys(state.stamps).length;
  $("cardCount").textContent=Object.keys(state.cards).length;
  const q=quest();
  $("questText").textContent=q.done?`${q.text} · done! ✓`:`${q.text} · ${q.n}/${q.goal}`;
  $("questFill").style.width=Math.round(q.n/q.goal*100)+"%";
  $("questBox").classList.toggle("done",q.done);
  const g=goalState();
  $("goalText").textContent=g.done?`Daily goal: done! ✓`:`Daily goal: ${g.n}/${g.goal} ${g.goal===1?"word":"words"}`;
  $("goalBox").classList.toggle("done",g.done);
}

/* ---------- finish card extras ---------- */
function showFinish(stars,gained,rankUp){
  const card=document.querySelector("#finishScreen .finish-card");if(!card)return;
  card.querySelector(".fun-finish")?.remove();
  const box=document.createElement("div");box.className="fun-finish";
  box.innerHTML=`<div class="star-row">${[1,2,3].map(i=>`<span class="star ${i<=stars?"on":""}" style="animation-delay:${i*.18}s">★</span>`).join("")}</div>
   <div class="fun-gain">+${gained} XP${word.hintUsed?" · telescope used":""}${word.mistakes===0?" · perfect!":""}</div>
   ${rankUp?`<div class="rank-up">🎉 New rank: ${rankUp.icon} ${rankUp.name}!</div>`:""}
   <div class="finish-pip"><span data-pip></span><span>${pick(stars===3?SAY.finish3:stars===2?SAY.finish2:SAY.finish1)}</span></div>`;
  box.querySelector("[data-pip]").innerHTML=pipSVG();
  const medal=card.querySelector(".big-medal");medal?medal.after(box):card.prepend(box);
}

/* ---------- events from app.js ---------- */
document.addEventListener("gw:start",e=>{
  ensureGuide();refreshPips();
  word={mistakes:0,clueMistakes:0,combo:0,best:0,hintUsed:false,expected:e.detail?.expected||null,xp:0};
  setCombo();say(pick(SAY.start));
  if(state.voice)setTimeout(()=>speak($("clueText")?.textContent),250);
});
document.addEventListener("gw:correct",e=>{
  touchStreak();
  word.combo++;word.best=Math.max(word.best,word.combo);word.clueMistakes=0;word.expected=e.detail.nextExpected||null;
  const xp=10+Math.min(word.combo-1,5)*2;word.xp+=xp;gainXP(xp,true);
  sfx.correct(word.combo);buzz(15);flyLetter(e.detail.letter,e.detail.rect,e.detail.slot);setCombo();
  say(word.combo>=3&&word.combo%3===0?pick(SAY.combo):pick(SAY.correct),"happy");
  questEvent("correct",e.detail.clue);if(word.combo===5)questEvent("combo5");
  save();
});
document.addEventListener("gw:wrong",e=>{
  word.mistakes++;word.clueMistakes++;word.combo=0;word.expected=e.detail.expected;
  setCombo();sfx.wrong();buzz([30,40,30]);
  if(word.clueMistakes>=3){
    say(pick(SAY.hintOffer),"hint");
    const btn=document.createElement("button");btn.type="button";btn.className="hint-btn";btn.textContent="🔭 Use telescope";
    btn.addEventListener("click",useHint);$("pipGuide")?.querySelector(".pip-bubble").appendChild(btn);
  }else say(pick(SAY.wrong),"sad");
});
document.addEventListener("gw:finish",e=>{
  const d=e.detail||{};
  const stars=word.hintUsed?1:word.mistakes===0?3:word.mistakes<=2?2:1;
  const key=(d.mode||"game")+":"+d.answer,prev=state.stamps[key];
  const bonus=stars===3?50:stars===2?25:10,extra=prev?Math.round(bonus/2):bonus+20;
  word.xp+=extra;
  const rankUp=gainXP(extra,true);
  if(!prev){state.stars+=stars;state.stamps[key]={word:d.answer,stars,unit:d.unit||"",t:Date.now()}}
  else if(stars>prev.stars){state.stars+=stars-prev.stars;prev.stars=stars}
  questEvent("finish");if(stars===3&&word.mistakes===0)questEvent("perfect");
  countGoalWord();
  save();renderBar();
  showFinish(stars,word.xp,rankUp);
  confetti();sfx.finish();buzz([20,60,20,60,40]);
});

renderBar();
})();
