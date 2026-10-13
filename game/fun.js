/* Expedition layer: guide character, stars, XP ranks, combos, passport stamps,
   daily streak, hints and sound. It only listens to gw:* events from app.js and
   never changes puzzle progress or credit rules. */
(()=>{
const KEY="geowords_fun_v1";
const RANKS=[
  {xp:0,name:"Map Reader",icon:"🗺️"},
  {xp:150,name:"Trail Scout",icon:"🥾"},
  {xp:400,name:"Pathfinder",icon:"🧭"},
  {xp:800,name:"Navigator",icon:"⛵"},
  {xp:1400,name:"Captain",icon:"⚓"},
  {xp:2200,name:"Legendary Explorer",icon:"🏆"}
];
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
const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const pick=list=>list[Math.floor(Math.random()*list.length)];
const $=id=>document.getElementById(id);

function load(){
  const base={xp:0,stars:0,stamps:{},streak:0,lastDay:"",sound:true};
  try{return {...base,...(JSON.parse(localStorage.getItem(KEY)||"{}")||{})}}catch{return base}
}
let state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function rankFor(xp){let r=RANKS[0];for(const x of RANKS)if(xp>=x.xp)r=x;return r}
function nextRank(xp){return RANKS.find(r=>r.xp>xp)||null}

/* ---------- sound (WebAudio, no files) ---------- */
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
  rank:()=>[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.09,.4,"square",.05))
};
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch{}}

/* ---------- guide character: Pip the explorer fox (inline SVG) ---------- */
const PIP=`<svg viewBox="0 0 100 100" aria-hidden="true">
 <ellipse cx="50" cy="92" rx="26" ry="5" fill="rgba(0,0,0,.12)"/>
 <path d="M22 30 L30 8 L42 26Z" fill="#f08a3c"/><path d="M78 30 L70 8 L58 26Z" fill="#f08a3c"/>
 <path d="M27 26 L31 14 L37 24Z" fill="#ffd9b8"/><path d="M73 26 L69 14 L63 24Z" fill="#ffd9b8"/>
 <ellipse cx="50" cy="52" rx="32" ry="30" fill="#f6994a"/>
 <path d="M50 50 C30 52 22 66 30 78 C38 88 62 88 70 78 C78 66 70 52 50 50Z" fill="#fff4e8"/>
 <g class="pip-eyes"><ellipse cx="38" cy="50" rx="4.2" ry="5.2" fill="#2a2a35"/><ellipse cx="62" cy="50" rx="4.2" ry="5.2" fill="#2a2a35"/>
 <circle cx="39.5" cy="48" r="1.4" fill="#fff"/><circle cx="63.5" cy="48" r="1.4" fill="#fff"/></g>
 <ellipse cx="50" cy="63" rx="5" ry="3.6" fill="#2a2a35"/>
 <path class="pip-mouth" d="M43 69 Q50 75 57 69" stroke="#2a2a35" stroke-width="2.4" fill="none" stroke-linecap="round"/>
 <circle cx="28" cy="62" r="4" fill="#ff9f9f" opacity=".55"/><circle cx="72" cy="62" r="4" fill="#ff9f9f" opacity=".55"/>
 <path d="M20 30 Q50 6 80 30 L82 34 Q50 24 18 34Z" fill="#4c8f3a"/><rect x="18" y="31" width="64" height="5" rx="2.5" fill="#3a7230"/>
 <circle cx="66" cy="22" r="4" fill="#ffd34d" stroke="#c99a1d" stroke-width="1.2"/>
</svg>`;

function ensureGuide(){
  if($("pipGuide"))return;
  const card=document.querySelector("#gameScreen .clue-card");if(!card)return;
  const wrap=document.createElement("div");wrap.id="pipGuide";wrap.className="pip-guide";
  wrap.innerHTML=`<button class="pip-avatar" type="button" aria-label="Pip the explorer fox">${PIP}</button><div class="pip-bubble" aria-live="polite"></div>`;
  card.appendChild(wrap);
  wrap.querySelector(".pip-avatar").addEventListener("click",useHint);
  const combo=document.createElement("div");combo.id="comboChip";combo.className="combo-chip";card.appendChild(combo);
}
function say(text,mood){
  ensureGuide();const g=$("pipGuide");if(!g)return;
  g.querySelector(".pip-bubble").textContent=text;
  g.classList.remove("happy","sad","hint","pop");void g.offsetWidth;
  g.classList.add("pop");if(mood)g.classList.add(mood);
}

/* ---------- per-word session ---------- */
let word={mistakes:0,clueMistakes:0,combo:0,hintUsed:false,expected:null,xp:0};
function setCombo(){
  const c=$("comboChip");if(!c)return;
  c.textContent=word.combo>=3?`Combo ×${word.combo} 🔥`:"";c.classList.toggle("on",word.combo>=3);
}
function addXP(n){word.xp+=n;state.xp+=n}
function touchStreak(){
  const today=new Date().toISOString().slice(0,10);
  if(state.lastDay===today)return;
  const y=new Date(Date.now()-864e5).toISOString().slice(0,10);
  state.streak=state.lastDay===y?state.streak+1:1;state.lastDay=today;save();renderBar();
}

function useHint(){
  if(!word.expected||word.clueMistakes<3)return;
  const el=document.querySelector(`.marker-hotspot[data-marker-id="${CSS.escape(word.expected)}"]`);
  if(!el)return;
  word.hintUsed=true;el.classList.add("hint-glow");say(pick(SAY.hint),"hint");tone(880,0,.25,"sine",.07);
}

/* letter flies from the map into its slot */
function flyLetter(letter,from){
  const slots=document.querySelectorAll("#wordSlots .slot.filled");const to=slots[slots.length-1];
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

/* ---------- top bar + home explorer card ---------- */
function renderBar(){
  let bar=$("funBar");
  if(!bar){
    bar=document.createElement("div");bar.id="funBar";bar.className="fun-bar";
    bar.innerHTML=`<span class="fun-chip" title="Stars"><b>⭐</b><strong id="funStars"></strong></span><span class="fun-chip" title="Days in a row"><b>🔥</b><strong id="funStreak"></strong></span><button id="funSound" class="fun-chip fun-btn" type="button" aria-label="Sound"></button>`;
    const medal=document.querySelector(".topbar .medal");medal?.parentNode.insertBefore(bar,medal);
    $("funSound").addEventListener("click",()=>{state.sound=!state.sound;save();renderBar();if(state.sound)tone(660,0,.12)});
  }
  $("funStars").textContent=state.stars;$("funStreak").textContent=state.streak;
  $("funSound").textContent=state.sound?"🔊":"🔇";
  renderHomeCard();
}
function renderHomeCard(){
  const home=$("homeScreen");if(!home)return;
  let card=$("explorerCard");
  if(!card){
    card=document.createElement("div");card.id="explorerCard";card.className="explorer-card";
    card.innerHTML=`<div class="explorer-pip">${PIP}</div><div class="explorer-info"><p class="eyebrow">YOUR EXPEDITION</p><h2 id="rankName"></h2><div class="xp-track"><div id="xpFill" class="xp-fill"></div></div><div id="xpText" class="xp-text"></div><button id="passportBtn" class="passport-btn" type="button">📘 Explorer Passport · <span id="stampCount"></span> stamps</button></div>`;
    home.insertBefore(card,home.firstChild);
    $("passportBtn").addEventListener("click",openPassport);
  }
  const r=rankFor(state.xp),n=nextRank(state.xp);
  $("rankName").textContent=r.icon+" "+r.name;
  const pct=n?Math.round((state.xp-r.xp)/(n.xp-r.xp)*100):100;
  $("xpFill").style.width=pct+"%";
  $("xpText").textContent=n?`${state.xp} XP · ${n.xp-state.xp} XP to ${n.name}`:`${state.xp} XP · top rank reached!`;
  $("stampCount").textContent=Object.keys(state.stamps).length;
}

/* ---------- passport (sticker album) ---------- */
function openPassport(){
  const stamps=Object.values(state.stamps).sort((a,b)=>a.t-b.t);
  const dlg=document.createElement("div");dlg.className="passport-overlay";dlg.setAttribute("role","dialog");dlg.setAttribute("aria-label","Explorer Passport");
  const tilt=i=>((i*37)%11)-5;
  dlg.innerHTML=`<div class="passport"><div class="passport-head"><div><p class="eyebrow">EXPLORER PASSPORT</p><h2>${rankFor(state.xp).icon} ${rankFor(state.xp).name}</h2></div><button class="passport-close" type="button" aria-label="Close">✕</button></div>
   <p class="passport-sub">${stamps.length?`Every solved word earns a stamp. ⭐ ${state.stars} stars collected.`:"Solve your first word to earn a stamp!"}</p>
   <div class="stamps">${stamps.map((s,i)=>`<div class="stamp" style="--tilt:${tilt(i)}deg"><span class="stamp-word">${esc(s.word)}</span><span class="stamp-stars">${"★".repeat(s.stars)}${"☆".repeat(3-s.stars)}</span><span class="stamp-unit">${esc(s.unit||"")}</span></div>`).join("")}</div></div>`;
  document.body.appendChild(dlg);
  const close=()=>dlg.remove();
  dlg.querySelector(".passport-close").addEventListener("click",close);
  dlg.addEventListener("click",e=>{if(e.target===dlg)close()});
}

/* ---------- finish card extras ---------- */
function showFinish(detail,stars,gained,rankUp){
  const card=document.querySelector("#finishScreen .finish-card");if(!card)return;
  card.querySelector(".fun-finish")?.remove();
  const box=document.createElement("div");box.className="fun-finish";
  box.innerHTML=`<div class="star-row">${[1,2,3].map(i=>`<span class="star ${i<=stars?"on":""}" style="animation-delay:${i*.18}s">★</span>`).join("")}</div>
   <div class="fun-gain">+${gained} XP${word.hintUsed?" · telescope used":""}${word.mistakes===0?" · perfect!":""}</div>
   ${rankUp?`<div class="rank-up">🎉 New rank: ${rankUp.icon} ${rankUp.name}!</div>`:""}
   <div class="finish-pip">${PIP}<span>${pick(stars===3?SAY.finish3:stars===2?SAY.finish2:SAY.finish1)}</span></div>`;
  const medal=card.querySelector(".big-medal");medal?medal.after(box):card.prepend(box);
}

/* ---------- events from app.js ---------- */
document.addEventListener("gw:start",e=>{
  ensureGuide();
  word={mistakes:0,clueMistakes:0,combo:0,hintUsed:false,expected:e.detail?.expected||null,xp:0};
  setCombo();say(pick(SAY.start));
});
document.addEventListener("gw:correct",e=>{
  touchStreak();
  word.combo++;word.clueMistakes=0;word.expected=e.detail.nextExpected||null;
  addXP(10+Math.min(word.combo-1,5)*2);
  sfx.correct(word.combo);buzz(15);
  flyLetter(e.detail.letter,e.detail.rect);
  setCombo();
  say(word.combo>=3&&word.combo%3===0?pick(SAY.combo):pick(SAY.correct),"happy");
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
  const before=rankFor(state.xp);
  const key=(d.mode||"game")+":"+d.answer;
  const prev=state.stamps[key];
  const bonus=stars===3?50:stars===2?25:10;
  addXP(prev?Math.round(bonus/2):bonus+20);
  if(!prev){state.stars+=stars;state.stamps[key]={word:d.answer,stars,unit:d.unit||"",t:Date.now()}}
  else if(stars>prev.stars){state.stars+=stars-prev.stars;prev.stars=stars}
  const after=rankFor(state.xp),rankUp=after.xp>before.xp?after:null;
  save();renderBar();
  showFinish(d,stars,word.xp,rankUp);
  confetti();sfx.finish();if(rankUp)setTimeout(sfx.rank,700);buzz([20,60,20,60,40]);
});

renderBar();
})();
