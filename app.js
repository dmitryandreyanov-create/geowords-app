(()=>{
const core=window.GEOWORD_CORE,authored=window.GEOWORD_LEVELS||[];
const levels=core?core.fromAuthored(authored):authored,$=id=>document.getElementById(id);
const riversCourse=window.GEOWORD_COURSES?.rivers||null;
const riversAuthored=window.GEOWORD_RIVERS_AUTHORED||[];
const dictionary=core?core.buildDictionary(levels,window.GEOWORD_DICTIONARY||[]):[];
const riversKey="geowords_rivers_progress_v2";
let playMode="authored",riversProgress=null;
const screens=["homeScreen","factsScreen","gameScreen","finishScreen"];
const memoryStore=new Map();
const pendingTimers=new Set();
let levelIndex=0,level=levels[0];
let clueIndex=0,solvedMarkerIds=new Set(),solvedLetters=[],scale=1,tx=0,ty=0,pointers=new Map(),dragStart=null,pinchStart=null;
let inputLocked=false,suppressClicksUntil=0;

function safeGet(key){
  try{
    const value=window.localStorage.getItem(key);
    if(value!==null)return value;
  }catch{}
  return memoryStore.has(key)?memoryStore.get(key):null;
}
function safeSet(key,value){
  const normalized=String(value);
  memoryStore.set(key,normalized);
  try{window.localStorage.setItem(key,normalized)}catch{}
}
function later(fn,ms){
  const id=setTimeout(()=>{pendingTimers.delete(id);fn()},ms);
  pendingTimers.add(id);
  return id;
}
function clearPendingTimers(){
  pendingTimers.forEach(id=>clearTimeout(id));
  pendingTimers.clear();
}
function loadRiversProgress(){
  if(!core||!riversCourse)return null;
  let raw=null;
  try{
    raw=JSON.parse(safeGet(riversKey)||safeGet("geowords_rivers_progress_v1")||"null");
  }catch{}
  return core.normalizeProgress(raw,riversCourse);
}
function saveRiversProgress(progress){safeSet(riversKey,JSON.stringify(progress))}
function currentRiversStep(state){return riversCourse.steps[state.stepIndex]}
function riversComplete(state){
  return state.stepIndex===riversCourse.steps.length-1 &&
    core.stepScore(state,currentRiversStep(state))===riversCourse.target;
}
function renderRiversHome(){
  if(!$("riversBtn"))return;
  if(!core||!riversCourse||riversAuthored.length<riversCourse.steps.length){
    $("riversBtn").disabled=true;
    $("riversProgress").textContent="Rivers learning content is unavailable.";
    return;
  }
  const state=loadRiversProgress(),step=currentRiversStep(state);
  const done=riversComplete(state);
  const count=core.stepScore(state,step);
  const needsOriginal=!state.steps[step.id].authoredSolved;
  const nextOriginal=riversAuthored.find(p=>p.id===step.authoredPuzzleId);
  $("riversProgress").textContent=done
    ?"Three Rivers learning steps complete · Keep practicing!"
    :needsOriginal
      ?"Next original: "+(nextOriginal?.answer||"GeoWord")+" · 0/7"
      :"Practice "+step.object.label+" · "+count+"/7 words";
  $("riversBtn").textContent=done?"Review Rivers":"Explore Rivers";
}
function startRivers(forceIntro=false){
  if(!core||!riversCourse)return;
  playMode="rivers";
  riversProgress=loadRiversProgress();
  const authoredId=core.nextAuthoredPuzzleId(riversCourse,riversProgress);
  const finished=riversComplete(riversProgress);
  let next=null;
  if(authoredId){
    next=riversAuthored.find(p=>p.id===authoredId)||null;
  }else{
    const variant=finished?Number(safeGet("geowords_rivers_review_variant")||"0"):0;
    next=core.generate(riversCourse,dictionary,riversProgress,variant,finished);
    if(finished&&next)safeSet("geowords_rivers_review_variant",String(variant+1));
  }
  if(!next){
    $("riversProgress").textContent="This step is missing an authored puzzle or practice word.";
    renderHome();show("homeScreen");return;
  }
  level=next;
  if(forceIntro||(authoredId&&level.introFacts?.length)){
    prepareLesson();show("factsScreen");
  }else{
    resetGame();show("gameScreen");
  }
}
function completionKey(item){return "geowords_completed_"+item.id}
function isComplete(item){return safeGet(completionKey(item))==="1"}
function completedCount(){return levels.filter(isComplete).length}
function firstIncompleteIndex(){
  const idx=levels.findIndex(item=>!isComplete(item));
  return idx<0?0:idx;
}
function show(id){
  if(id!=="gameScreen"){
    clearPendingTimers();
    inputLocked=false;
  }
  screens.forEach(s=>$(s).classList.toggle("active",s===id));
  window.scrollTo({top:0,behavior:"instant"});
}
function renderMedals(){$("medalCount").textContent=completedCount()}
function renderHome(){
  const done=completedCount();
  levelIndex=firstIncompleteIndex();
  level=levels[levelIndex];
  $("startBtn").textContent=done===levels.length?"Play "+levels[0].title+" again":"Continue with "+level.title;
  $("homeProgress").textContent=done+" of "+levels.length+" available puzzles complete";
  renderMedals();
  renderRiversHome();
}
function renderList(id,items){
  const ul=$(id);ul.innerHTML="";
  (items||[]).forEach(item=>{const li=document.createElement("li");li.textContent=item;ul.appendChild(li)});
}
function selectLevel(index){
  levelIndex=Math.max(0,Math.min(levels.length-1,index));
  level=levels[levelIndex];
  prepareLesson();
}
function prepareLesson(){
  renderList("introFacts",level.introFacts);
  $("factsTitle").textContent="Before "+level.title+"…";
}
function resetGame(){
  clearPendingTimers();
  inputLocked=false;
  suppressClicksUntil=0;
  clueIndex=0;solvedMarkerIds=new Set();solvedLetters=[];scale=1;tx=0;ty=0;
  pointers.clear();dragStart=null;pinchStart=null;
  $("levelTitle").textContent=level.title+" · "+level.unit;
  $("mapImage").src=level.map;
  $("mapImage").alt=level.title+" map";
  $("mapViewport").style.setProperty("--map-aspect",level.mapAspect||"14 / 9");
  renderFeatures();renderMarkerArrows();renderHotspots();renderWord();renderClue();renderProgress();applyTransform();
}
function readableLocation(id){
  return id.split("-").map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(" ");
}
function renderFeatures(){
  const svg=$("geoFeatures"),labels=$("geoLabels");
  if(!svg||!labels)return;
  svg.replaceChildren();labels.replaceChildren();
  if(level.source!=="generated")return;
  for(const feature of level.features||[]){
    const points=feature.path.map(([lon,lat])=>core.project(lon,lat,riversCourse.mapBounds));
    const d=points.map((point,i)=>(i?"L":"M")+point.x.toFixed(2)+" "+point.y.toFixed(2)).join(" ");
    for(const [style,stroke,width] of [["outline","#fffdf1","1.9"],["river","#1682b4","1.0"]]){
      const p=document.createElementNS("http://www.w3.org/2000/svg","path");
      p.setAttribute("d",d);p.setAttribute("class","river-line-"+style);
      p.setAttribute("fill","none");p.setAttribute("stroke",stroke);
      p.setAttribute("stroke-width",width);
      p.setAttribute("stroke-linecap","round");p.setAttribute("stroke-linejoin","round");
      svg.appendChild(p);
    }
    const point=core.project(feature.anchor.lon,feature.anchor.lat,riversCourse.mapBounds);
    const label=document.createElement("div");
    label.className="river-map-label";
    label.textContent=feature.label;
    label.style.left=point.x+"%";label.style.top=point.y+"%";
    labels.appendChild(label);
  }
}
function renderMarkerArrows(){
  const svg=$("markerArrows");
  if(!svg)return;
  svg.replaceChildren();
  for(const marker of level.markers||[]){
    if(!marker.pointsTo)continue;
    const end=marker.pointsTo;
    const from=end.from||{
      x:marker.x+(end.x-marker.x)*0.25,
      y:marker.y+(end.y-marker.y)*0.25
    };
    const dx=end.x-from.x,dy=end.y-from.y;
    const dist=Math.hypot(dx*1.5,dy);
    if(!Number.isFinite(dist)||dist<0.1)continue;
    const ns="http://www.w3.org/2000/svg";
    const line=document.createElementNS(ns,"line");
    line.setAttribute("x1",from.x);line.setAttribute("y1",from.y);
    line.setAttribute("x2",end.x);line.setAttribute("y2",end.y);
    svg.appendChild(line);
    const angle=Math.atan2(dy,dx*1.5);
    const ux=Math.cos(angle)*1.0/1.5,uy=Math.sin(angle)*1.0;
    const vx=-uy*.62/1.5,vy=ux*.62*1.5;
    const pts=[
      [end.x,end.y],
      [end.x-ux+vx,end.y-uy+vy],
      [end.x-ux-vx,end.y-uy-vy]
    ];
    const tip=document.createElementNS(ns,"polygon");
    tip.setAttribute("points",pts.map(pair=>pair.map(v=>v.toFixed(2)).join(",")).join(" "));
    svg.appendChild(tip);
  }
}
function renderHotspots(){
  const layer=$("markersLayer");layer.innerHTML="";
  level.markers.forEach(m=>{
    const b=document.createElement("button");
    b.className="marker-hotspot"+((level.source==="generated"||level.letterMode==="overlay")?" generated":"")+(solvedMarkerIds.has(m.id)?" done":"");
    if(level.source==="generated"||level.letterMode==="overlay")b.textContent=m.letter;
    b.style.left=m.x+"%";b.style.top=m.y+"%";
    b.dataset.markerId=m.id;
    b.setAttribute("aria-label","Letter "+m.letter+" — "+readableLocation(m.id));
    layer.appendChild(b);
  });
}
function renderWord(){
  const wrap=$("wordSlots");wrap.innerHTML="";
  wrap.style.setProperty("--letter-count",level.answer.length);
  wrap.dataset.long=level.answer.length>=9?"1":"0";
  level.answer.split("").forEach((_,i)=>{
    const d=document.createElement("div");d.className="slot";
    if(i<solvedLetters.length){d.textContent=solvedLetters[i];d.classList.add("filled")}
    wrap.appendChild(d);
  });
}
function renderClue(){
  const clue=level.clues[clueIndex];
  $("clueNumber").textContent=Math.min(clueIndex+1,level.clues.length);
  $("clueText").textContent=clue?clue.text:"";
  $("feedback").textContent="";$("feedback").className="feedback";
}
function renderProgress(){
  $("progressText").textContent=solvedLetters.length+" / "+level.clues.length;
  $("progressBar").style.width=(solvedLetters.length/level.clues.length*100)+"%";
}
function chooseMarker(marker,el){
  if(inputLocked||clueIndex>=level.clues.length)return;
  const expected=level.clues[clueIndex].markerId,feedback=$("feedback");
  if(marker.id!==expected){
    if(el){el.classList.remove("wrong");void el.offsetWidth;el.classList.add("wrong")}
    feedback.textContent="Not this one — try another letter.";feedback.className="feedback bad";return;
  }

  inputLocked=true;
  if(!solvedMarkerIds.has(marker.id)){solvedMarkerIds.add(marker.id);solvedLetters.push(marker.letter)}
  feedback.textContent="Yes! You found "+marker.letter+".";feedback.className="feedback ok";
  renderHotspots();renderWord();renderProgress();

  if(solvedLetters.length===level.clues.length){
    later(finish,550);
    return;
  }

  clueIndex+=1;
  later(()=>{renderClue();inputLocked=false},420);
}
function finish(){
  if($("finishScreen").classList.contains("active"))return;
  if(playMode==="rivers"){
    const result=core.markSolved(riversCourse,riversProgress,level);
    riversProgress=result.progress;
    if(result.credited)saveRiversProgress(riversProgress);
    $("finishWord").textContent=level.answer;
    $("definition").textContent=level.definition;
    $("replayBtn").textContent="Play this word again";
    $("homeBtn").textContent="Back to home";
    $("nextBtn").hidden=Boolean(result.advanced);
    $("nextBtn").textContent=riversComplete(riversProgress)?"Practice another word":"Next geography word";
    $("nextFactsLabel").textContent=result.advanced?"NEXT RIVER UNLOCKED":result.finished?"THREE RIVERS COMPLETE":"RIVERS PROGRESS";
    const nextObject=riversCourse.steps[riversProgress.stepIndex].object.label;
    const message=result.advanced
      ?"7/7 words solved! Next: "+nextObject+"."
      :result.finished?"7/7 words solved! You can repeat practice without adding credit."
      :result.credited?result.count+" of 7 words solved at this step."
      :"Replay complete. Your progress stays unchanged.";
    renderList("nextFacts",[message,...(level.nextFacts||[])]);
    show("finishScreen");
    if(result.advanced)later(()=>startRivers(true),1400);
    return;
  }
  safeSet(completionKey(level),"1");
  renderMedals();
  $("finishWord").textContent=level.answer;
  $("definition").textContent=level.definition;
  renderList("nextFacts",level.nextFacts);
  $("replayBtn").textContent="Play "+level.title+" again";
  $("homeBtn").textContent="Back to Mountains";
  const hasNext=levelIndex+1<levels.length;
  $("nextBtn").hidden=!hasNext;
  $("nextBtn").textContent=hasNext?"Continue to "+levels[levelIndex+1].title:"";
  $("nextFactsLabel").textContent=level.finishFactsLabel||(hasNext?"FOR THE NEXT QUIZ YOU NEED TO KNOW":"KEEP THESE FACTS FOR THE NEXT CHALLENGE");
  show("finishScreen");
}
function clampTransform(){
  const vp=$("mapViewport"),w=vp.clientWidth,h=vp.clientHeight;
  const maxX=Math.max(0,w*scale-w),maxY=Math.max(0,h*scale-h);
  tx=Math.min(0,Math.max(-maxX,tx));ty=Math.min(0,Math.max(-maxY,ty));
}
function applyTransform(){
  clampTransform();
  $("mapCanvas").style.transform="translate("+tx+"px,"+ty+"px) scale("+scale+")";
  $("resetZoom").textContent=Math.round(scale*100)+"%";
}
function setScale(next,cx,cy){
  next=Math.max(1,Math.min(3,next));
  const vp=$("mapViewport");
  cx=cx??vp.clientWidth/2;cy=cy??vp.clientHeight/2;
  const worldX=(cx-tx)/scale,worldY=(cy-ty)/scale;
  scale=next;tx=cx-worldX*scale;ty=cy-worldY*scale;applyTransform();
}
function markerElement(id){
  return [...$("markersLayer").querySelectorAll(".marker-hotspot")].find(el=>el.dataset.markerId===id)||null;
}
function nearestMarkerAt(clientX,clientY){
  const vp=$("mapViewport"),rect=vp.getBoundingClientRect();
  const localX=(clientX-rect.left-tx)/scale;
  const localY=(clientY-rect.top-ty)/scale;
  let best=null,bestDistance=Infinity;

  level.markers.forEach(marker=>{
    const mx=vp.clientWidth*marker.x/100;
    const my=vp.clientHeight*marker.y/100;
    const distance=Math.hypot((localX-mx)*scale,(localY-my)*scale);
    if(distance<bestDistance){bestDistance=distance;best=marker}
  });

  return bestDistance<=34?best:null;
}
function tryCapture(pointerId){
  try{
    if(!$("mapViewport").hasPointerCapture(pointerId))$("mapViewport").setPointerCapture(pointerId);
  }catch{}
}
function releaseCapture(pointerId){
  try{
    if($("mapViewport").hasPointerCapture(pointerId))$("mapViewport").releasePointerCapture(pointerId);
  }catch{}
}

const vp=$("mapViewport");
vp.addEventListener("pointerdown",e=>{
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1){
    dragStart={pointerId:e.pointerId,x:e.clientX,y:e.clientY,tx,ty,active:false};
  }
  if(pointers.size===2){
    const p=[...pointers.values()];
    pinchStart={dist:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),scale};
    dragStart=null;
    suppressClicksUntil=performance.now()+400;
    pointers.forEach((_,id)=>tryCapture(id));
  }
});
vp.addEventListener("pointermove",e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

  if(pointers.size===1&&dragStart){
    const distance=Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y);
    if(distance>5&&!dragStart.active){
      dragStart.active=true;
      suppressClicksUntil=performance.now()+400;
      if(scale>1)tryCapture(e.pointerId);
    }
    if(dragStart.active&&scale>1){
      tx=dragStart.tx+(e.clientX-dragStart.x);
      ty=dragStart.ty+(e.clientY-dragStart.y);
      applyTransform();
    }
  }

  if(pointers.size===2&&pinchStart){
    const p=[...pointers.values()],dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
    const rect=vp.getBoundingClientRect(),cx=(p[0].x+p[1].x)/2-rect.left,cy=(p[0].y+p[1].y)/2-rect.top;
    suppressClicksUntil=performance.now()+400;
    setScale(pinchStart.scale*(dist/pinchStart.dist),cx,cy);
  }
});
const pointerEnd=e=>{
  const wasPinching=pointers.size>1;
  if(wasPinching||dragStart?.active)suppressClicksUntil=performance.now()+400;
  pointers.delete(e.pointerId);
  releaseCapture(e.pointerId);
  if(pointers.size<2)pinchStart=null;

  if(wasPinching&&pointers.size===1){
    const [id,p]=[...pointers.entries()][0];
    dragStart={pointerId:id,x:p.x,y:p.y,tx,ty,active:false};
  }else if(pointers.size===0){
    dragStart=null;
  }
};
vp.addEventListener("pointerup",pointerEnd);
vp.addEventListener("pointercancel",pointerEnd);

vp.addEventListener("click",e=>{
  if(performance.now()<suppressClicksUntil)return;

  const hotspot=e.target.closest?.(".marker-hotspot");
  if(e.detail===0&&e.clientX===0&&e.clientY===0&&hotspot){
    const marker=level.markers.find(m=>m.id===hotspot.dataset.markerId);
    if(marker)chooseMarker(marker,hotspot);
    return;
  }

  const marker=nearestMarkerAt(e.clientX,e.clientY);
  if(marker)chooseMarker(marker,markerElement(marker.id));
});

$("zoomIn").addEventListener("click",()=>setScale(scale+.25));
$("zoomOut").addEventListener("click",()=>setScale(scale-.25));
$("resetZoom").addEventListener("click",()=>{scale=1;tx=0;ty=0;applyTransform()});
$("startBtn").addEventListener("click",()=>{playMode="authored";selectLevel(firstIncompleteIndex());show("factsScreen")});
$("riversBtn")?.addEventListener("click",()=>startRivers());
$("factsContinueBtn").addEventListener("click",()=>{resetGame();show("gameScreen")});
$("backBtn").addEventListener("click",()=>{clearPendingTimers();inputLocked=false;renderHome();show("homeScreen")});
$("replayBtn").addEventListener("click",()=>{resetGame();show("gameScreen")});
$("nextBtn").addEventListener("click",()=>{
  if(playMode==="rivers"){startRivers();return}
  selectLevel(levelIndex+1);show("factsScreen");
});
$("homeBtn").addEventListener("click",()=>{renderHome();show("homeScreen")});

renderHome();
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").then(reg=>reg.update()).catch(()=>{});
}
})();