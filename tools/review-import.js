/* Human-only map/clue reconciliation for staged GeoWords imports.
   Does not alter live app, add facts or silently assign ambiguous markers. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const model=globalThis.GEOWORD_REVIEW;
const state={books:[],puzzles:[],index:0,selected:0,assignments:{},confirmations:{},loaded:false};
const root='../';
const STORAGE_KEY='geowords-import-review-v2';
let storageWarning=false;
function saveLocal(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(exportReview()));storageWarning=false;return true}
  catch{storageWarning=true;return false}
}
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
const put=(parent,child)=>{parent.appendChild(child);return child};
const normalizeRef=p=>{
  if(typeof p!=='string'||!/^\.\/assets\/import-staging\/[a-z0-9-]+\.webp$/.test(p))throw Error('Unexpected map file path: '+p);
  return root+p.slice(2);
};
function initAssignments(){Object.assign(state,model.create(state.puzzles))}
function current(){return state.puzzles[state.index]}
function selectedClue(){return current()?.clues[state.selected]}
function assignFor(p,clue){return state.assignments[p.id]?.[clue.position]??null}
function duplicateAssignments(p){
  const used=new Map(),duplicates=new Set();
  for(const clue of p.clues){
    const id=assignFor(p,clue);if(!id)continue;
    if(used.has(id)){duplicates.add(id)}else used.set(id,clue.position);
  }
  return duplicates;
}
function status(){
 const s=model.stats(state.puzzles,state);
 $('globalProgress').textContent=`Сопоставлено ${s.done}/${s.total} · повторов ${s.assignedAmbiguous}/${s.ambiguous} · география подтверждена ${s.confirmed}/${s.total}`;
}
function renderList(){
 const host=$('puzzleList');host.replaceChildren();
 for(const [i,p] of state.puzzles.entries()){
   const n=p.clues.filter(c=>assignFor(p,c)).length;
   const b=put(host,el('button'));
   b.type='button';b.setAttribute('aria-current',i===state.index?'true':'false');
   put(b,el('strong','',`${p.id.toUpperCase()} · ${p.answer}`));
   put(b,el('small','',`${n}/${p.clues.length} · PDF стр. ${p.provenance.mapPdfPage}`));
   b.addEventListener('click',()=>{state.index=i;state.selected=Math.max(0,p.clues.findIndex(c=>!assignFor(p,c)));render()});
 }
}
function renderMap(){
 const p=current(),host=$('map');host.querySelectorAll('button').forEach(b=>b.remove());
 host.style.setProperty('--map-aspect',(p.mapAspect||'1587 / 1057'));
 $('mapImage').src=normalizeRef(p.map);$('mapImage').alt=`${p.id}, чистая авторская карта`;
 $('puzzleTitle').textContent=`${p.id.toUpperCase()} · ${p.answer}`;
 $('mapSource').textContent=`Источник: ${p.provenance.source} · карта PDF стр. ${p.provenance.mapPdfPage} · подсказки стр. ${p.provenance.cluesPdfPage}`;
 $('facts').textContent=p.factsExtract||'Нет извлечённого текста фактов';
 const arrows=$('mapArrows');arrows.replaceChildren();
 for(const marker of p.markers){
   const target=marker.pointsTo;if(!target)continue;
   const from=target.from||{x:marker.x,y:marker.y};
   const shaftEnd=target.shaftEnd||target;
   const line=document.createElementNS('http://www.w3.org/2000/svg','line');
   for(const [key,value] of Object.entries({x1:from.x,y1:from.y,x2:shaftEnd.x,y2:shaftEnd.y}))line.setAttribute(key,String(value));
   arrows.appendChild(line);
   const dx=target.x-from.x,dy=target.y-from.y,len=Math.hypot(dx,dy)||1;
   const x=dx/len,y=dy/len;
   const pts=target.headPoints?target.headPoints.map(p=>[p.x,p.y]):[[target.x,target.y],[target.x-1.2*x-.55*y,target.y-1.2*y+.55*x],[target.x-1.2*x+.55*y,target.y-1.2*y-.55*x]];
   const head=document.createElementNS('http://www.w3.org/2000/svg','polygon');
   head.setAttribute('points',pts.map(a=>a.map(v=>v.toFixed(2)).join(',')).join(' '));arrows.appendChild(head);
 }
 const clue=selectedClue(),assigned=assignFor(p,clue),duplicates=duplicateAssignments(p);
 const usedIds=new Set(p.clues.filter(c=>c!==clue).map(c=>assignFor(p,c)).filter(Boolean));
 for(const marker of p.markers){
   const btn=put(host,el('button','map-button',marker.letter));
   btn.type='button';btn.dataset.markerId=marker.id;btn.style.left=marker.x+'%';btn.style.top=marker.y+'%';
   const eligible=clue.candidateMarkerIds.includes(marker.id);
   btn.classList.toggle('eligible',eligible);
   btn.classList.toggle('used',usedIds.has(marker.id));
   btn.classList.toggle('current',assigned===marker.id);
   btn.classList.toggle('conflict',duplicates.has(marker.id));
   btn.title=`${marker.letter} · x=${marker.x}%, y=${marker.y}%`;
   btn.setAttribute('aria-label',`Буква ${marker.letter}, координаты ${marker.x}% / ${marker.y}%`);
   btn.disabled=!eligible||usedIds.has(marker.id);
   btn.addEventListener('click',()=>selectMarker(marker.id));
 }
 const done=p.clues.filter(c=>assignFor(p,c)).length;
 const confirmed=p.clues.filter(c=>state.confirmations[p.id]?.[c.position]).length;
 $('puzzleProgress').textContent=`Задание: ${done}/${p.clues.length} привязок · география ${confirmed}/${p.clues.length}`;
 $('confirmSelected').disabled=!assigned;
 $('confirmSelected').textContent=state.confirmations[p.id]?.[clue.position]?'География подтверждена ✓':'Подтвердить географию';
 $('puzzleErrors').textContent=duplicates.size?`Конфликт: ${duplicates.size} повторных назначений`:'';
}
function renderClues(){
 const p=current(),host=$('clues');host.replaceChildren();
 $('clueHeader').textContent=`${p.answer.length} букв · выберите пункт для проверки`;
 const duplicate=duplicateAssignments(p);
 for(const [i,clue] of p.clues.entries()){
   const markerId=assignFor(p,clue);
   const marker=p.markers.find(m=>m.id===markerId);
   const b=put(host,el('button','clue'));b.type='button';b.setAttribute('aria-current',state.selected===i?'true':'false');
   put(b,el('span','num',String(clue.position)));
   const info=put(b,el('span'));
   put(info,el('span','text',clue.text));
   const kind=duplicate.has(markerId)?'conflict':markerId?'ok':'unresolved';
   put(info,el('span','state '+kind,marker?`${state.confirmations[p.id]?.[clue.position]?'География подтверждена':'Назначено, требуется проверка'} · ${marker.letter} · ${marker.x}% / ${marker.y}%`:`Нужно назначить ${clue.answerLetter} · кандидатов: ${clue.candidateMarkerIds.length}`));
   b.addEventListener('click',()=>{state.selected=i;renderMap();renderClues()});
 }
}
function render(){renderList();renderMap();renderClues();status();globalThis.GEOWORD_SPATIAL_PANEL?.render(current().id);globalThis.GEOWORD_LEARNING_PANEL?.render(current().id);globalThis.GEOWORD_CONTENT_PANEL?.render(current().id)}
function selectMarker(id){
 const p=current(),clue=selectedClue();
 if(!clue.candidateMarkerIds.includes(id))return;
 if(p.clues.some(c=>c!==clue&&assignFor(p,c)===id)){
  $('message').textContent='Эта буква уже назначена другой подсказке.';return;
 }
 model.assign(state,p,clue,id);
 const saved=saveLocal();
 const next=p.clues.findIndex((c,i)=>i!==state.selected&&!assignFor(p,c));
 if(next>=0)state.selected=next;
 render();
 $('message').textContent=saved?'Сохранено автоматически в браузере. Экспортируйте JSON для резервной копии.':'Хранилище недоступно: экспортируйте JSON перед закрытием вкладки.';
}
function exportReview(){return model.exportReview(state.puzzles,state)}
function save(){
 const payload=exportReview();const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'});
 const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='geowords-l1-l2-reviewed-assignments.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(link.href),5000);
 $('message').textContent='JSON экспортирован. Импортируйте его позже, чтобы продолжить, или передайте для внесения в GitHub.';
}
function restore(data){
 const future=model.restore(state.puzzles,data);
 Object.assign(state,future);
 const saved=saveLocal();render();
 $('message').textContent=saved?'Разметка импортирована и сохранена. Старый формат не подтверждает географию автоматически.':'Разметка импортирована, но хранилище недоступно: экспортируйте JSON перед закрытием вкладки.';
}
async function start(){
 try{
   const urls=['../data/import-staging/l1-staging.json','../data/import-staging/l2-staging.json'];
   const data=await Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Не удалось открыть ${url} (${r.status})`);return r.json()}));
   for(const d of data){if(d.status!=='not_for_live_use'||d.puzzles.length!==10)throw Error('Неверный статус или количество заданий в импорте')}
   state.books=data;state.puzzles=data.flatMap(d=>d.puzzles);initAssignments();
   // The supplied user export is the baseline, not a fresh blank assignment task.
   const baseline=await fetch('../data/import-staging/review-assignments.json');
   if(!baseline.ok)throw Error('Не удалось загрузить уже полученные назначения');
   Object.assign(state,model.restore(state.puzzles,await baseline.json()));
   let saved=null;try{saved=localStorage.getItem(STORAGE_KEY)}catch{storageWarning=true}
   if(saved){
     try{const choices=JSON.parse(saved);restore(choices)}
     catch(e){$('message').textContent='Локальные данные несовместимы. Экспортируйте копию перед дальнейшей работой: '+e.message}
   }
   state.selected=Math.max(0,state.puzzles[0].clues.findIndex(c=>!assignFor(state.puzzles[0],c)));
   $('previous').addEventListener('click',()=>{state.index=Math.max(0,state.index-1);state.selected=0;render()});
   $('next').addEventListener('click',()=>{state.index=Math.min(state.puzzles.length-1,state.index+1);state.selected=0;render()});
   $('clearSelected').addEventListener('click',()=>{
     const p=current(),clue=selectedClue();model.clear(state,p,clue);const saved=saveLocal();render();
     $('message').textContent=saved?'Выбор или подтверждение сброшены и сохранены.':'Хранилище недоступно: экспортируйте JSON перед закрытием вкладки.';
   });
   $('confirmSelected').addEventListener('click',()=>{
     try{model.confirm(state,current(),selectedClue());const saved=saveLocal();render();$('message').textContent=saved?'География этой подсказки подтверждена и сохранена.':'Хранилище недоступно: экспортируйте JSON перед закрытием вкладки.'}catch(e){$('message').textContent=e.message}
   });
   $('save').addEventListener('click',()=>{try{save()}catch(e){$('message').textContent=e.message}});
   $('restore').addEventListener('change',async e=>{try{const file=e.target.files?.[0];if(file)restore(JSON.parse(await file.text()))}catch(err){$('message').textContent='Ошибка импорта: '+err.message}e.target.value=''});
   await globalThis.GEOWORD_SPATIAL_PANEL?.init(()=>state.assignments);
   await globalThis.GEOWORD_LEARNING_PANEL?.init();
   await globalThis.GEOWORD_CONTENT_PANEL?.init();
   $('workspace').hidden=false;render();state.loaded=true;
   if(storageWarning)$('message').textContent='Хранилище недоступно: экспортируйте JSON перед закрытием вкладки.';
 }catch(e){$('appError').classList.remove('hidden');$('appError').textContent='Ошибка загрузки: '+e.message}
}
start();
})();
