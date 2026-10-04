(()=>{
const levels=window.GEOWORD_LEVELS||[],$=id=>document.getElementById(id);
const screens=["homeScreen","factsScreen","gameScreen","finishScreen"];
let levelIndex=0,level=levels[0];
let clueIndex=0,solvedMarkerIds=new Set(),solvedLetters=[],scale=1,tx=0,ty=0,pointers=new Map(),dragStart=null,pinchStart=null;

function completionKey(item){return "geowords_completed_"+item.id}
function isComplete(item){return localStorage.getItem(completionKey(item))==="1"}
function completedCount(){return levels.filter(isComplete).length}
function firstIncompleteIndex(){
  const idx=levels.findIndex(item=>!isComplete(item));
  return idx<0?0:idx;
}
function show(id){
  screens.forEach(s=>$(s).classList.toggle("active",s===id));
  window.scrollTo({top:0,behavior:"instant"});
}
function renderMedals(){$("medalCount").textContent=completedCount()}
function renderHome(){
  const done=completedCount();
  levelIndex=firstIncompleteIndex();
  level=levels[levelIndex];
  $("startBtn").textContent=done===levels.length?"Play Puzzle 1 again":"Continue with "+level.title;
  $("homeProgress").textContent=done+" of "+levels.length+" available puzzles complete";
  renderMedals();
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
  clueIndex=0;solvedMarkerIds=new Set();solvedLetters=[];scale=1;tx=0;ty=0;
  $("levelTitle").textContent=level.title+" · "+level.unit;
  $("mapImage").src=level.map;
  $("mapImage").alt=level.title+" map";
  $("mapViewport").style.setProperty("--map-aspect",level.mapAspect||"14 / 9");
  renderHotspots();renderWord();renderClue();renderProgress();applyTransform();
}
function renderHotspots(){
  const layer=$("markersLayer");layer.innerHTML="";
  level.markers.forEach(m=>{
    const b=document.createElement("button");
    b.className="marker-hotspot"+(solvedMarkerIds.has(m.id)?" done":"");
    b.style.left=m.x+"%";b.style.top=m.y+"%";
    b.setAttribute("aria-label","Letter "+m.letter);
    b.addEventListener("click",e=>{e.stopPropagation();chooseMarker(m,b)});
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
  if(clueIndex>=level.clues.length)return;
  const expected=level.clues[clueIndex].markerId,feedback=$("feedback");
  if(marker.id!==expected){
    el.classList.remove("wrong");void el.offsetWidth;el.classList.add("wrong");
    feedback.textContent="Not this one — try another letter.";feedback.className="feedback bad";return;
  }
  if(!solvedMarkerIds.has(marker.id)){solvedMarkerIds.add(marker.id);solvedLetters.push(marker.letter)}
  feedback.textContent="Yes! You found "+marker.letter+".";feedback.className="feedback ok";
  renderHotspots();renderWord();renderProgress();
  if(solvedLetters.length===level.clues.length){setTimeout(finish,550);return}
  clueIndex+=1;setTimeout(renderClue,420);
}
function finish(){
  localStorage.setItem(completionKey(level),"1");
  renderMedals();
  $("finishWord").textContent=level.answer;
  $("definition").textContent=level.definition;
  renderList("nextFacts",level.nextFacts);
  $("replayBtn").textContent="Play "+level.title+" again";
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
const vp=$("mapViewport");
vp.addEventListener("pointerdown",e=>{
  vp.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1)dragStart={x:e.clientX,y:e.clientY,tx,ty};
  if(pointers.size===2){
    const p=[...pointers.values()];
    pinchStart={dist:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),scale};dragStart=null;
  }
});
vp.addEventListener("pointermove",e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1&&dragStart&&scale>1){
    tx=dragStart.tx+(e.clientX-dragStart.x);ty=dragStart.ty+(e.clientY-dragStart.y);applyTransform();
  }
  if(pointers.size===2&&pinchStart){
    const p=[...pointers.values()],dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
    const rect=vp.getBoundingClientRect(),cx=(p[0].x+p[1].x)/2-rect.left,cy=(p[0].y+p[1].y)/2-rect.top;
    setScale(pinchStart.scale*(dist/pinchStart.dist),cx,cy);
  }
});
const pointerEnd=e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinchStart=null;if(pointers.size===0)dragStart=null};
vp.addEventListener("pointerup",pointerEnd);vp.addEventListener("pointercancel",pointerEnd);

$("zoomIn").addEventListener("click",()=>setScale(scale+.25));
$("zoomOut").addEventListener("click",()=>setScale(scale-.25));
$("resetZoom").addEventListener("click",()=>{scale=1;tx=0;ty=0;applyTransform()});
$("startBtn").addEventListener("click",()=>{selectLevel(firstIncompleteIndex());show("factsScreen")});
$("factsContinueBtn").addEventListener("click",()=>{resetGame();show("gameScreen")});
$("backBtn").addEventListener("click",()=>{renderHome();show("homeScreen")});
$("replayBtn").addEventListener("click",()=>{resetGame();show("gameScreen")});
$("nextBtn").addEventListener("click",()=>{selectLevel(levelIndex+1);show("factsScreen")});
$("homeBtn").addEventListener("click",()=>{renderHome();show("homeScreen")});

renderHome();
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").then(reg=>reg.update()).catch(()=>{});
}
})();