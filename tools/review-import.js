/* Human-only map/clue reconciliation for staged GeoWords imports.
   Does not alter live app, add facts or silently assign ambiguous markers. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const state={books:[],puzzles:[],index:0,selected:0,assignments:{},loaded:false};
const root='../';
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
const put=(parent,child)=>{parent.appendChild(child);return child};
const normalizeRef=p=>{
  if(typeof p!=='string'||!/^\.\/assets\/import-staging\/[a-z0-9-]+\.webp$/.test(p))throw Error('Unexpected map file path: '+p);
  return root+p.slice(2);
};
function initAssignments(){
  for(const p of state.puzzles){
    state.assignments[p.id]||={};
    // Preserve only one-candidate, unambiguous assignments in base data.
    for(const clue of p.clues)if(clue.markerId)state.assignments[p.id][clue.position]=clue.markerId;
  }
}
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
function stats(){
  let total=0,done=0,reviewed=0;
  for(const p of state.puzzles){
    for(const clue of p.clues){total++;
      if(assignFor(p,clue)){done++;if(clue.candidateMarkerIds.length>1)reviewed++;}
    }
  }
  return {total,done,reviewed};
}
function status(){
 const s=stats();$('globalProgress').textContent=`Сопоставлено ${s.done}/${s.total} · проверено повторов ${s.reviewed}/69`;
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
 const clue=selectedClue(),assigned=assignFor(p,clue),duplicates=duplicateAssignments(p);
 const usedIds=new Set(p.clues.filter(c=>c!==clue).map(c=>assignFor(p,c)).filter(Boolean));
 for(const marker of p.markers){
   const btn=put(host,el('button','map-button',marker.letter));
   btn.type='button';btn.style.left=marker.x+'%';btn.style.top=marker.y+'%';
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
 $('puzzleProgress').textContent=`Задание: ${done}/${p.clues.length} привязок`;
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
   put(info,el('span','state '+kind,marker?`✓ ${marker.letter} · ${marker.x}% / ${marker.y}%`:`Нужно назначить ${clue.answerLetter} · кандидатов: ${clue.candidateMarkerIds.length}`));
   b.addEventListener('click',()=>{state.selected=i;renderMap();renderClues()});
 }
}
function render(){renderList();renderMap();renderClues();status()}
function selectMarker(id){
 const p=current(),clue=selectedClue();
 if(!clue.candidateMarkerIds.includes(id))return;
 if(p.clues.some(c=>c!==clue&&assignFor(p,c)===id)){
  $('message').textContent='Эта буква уже назначена другой подсказке.';return;
 }
 state.assignments[p.id][clue.position]=id;
 const next=p.clues.findIndex((c,i)=>i!==state.selected&&!assignFor(p,c));
 if(next>=0)state.selected=next;
 render();
 $('message').textContent='Сопоставление сохранено в памяти страницы. Экспортируйте JSON перед закрытием.';
}
function exportReview(){
 for(const p of state.puzzles)if(duplicateAssignments(p).size)throw Error(`Повторно назначена буква в ${p.id}`);
 const decisions={};
 for(const p of state.puzzles){
   decisions[p.id]={};
   for(const clue of p.clues){
     const id=assignFor(p,clue);
     if(id&&clue.candidateMarkerIds.length>1)decisions[p.id][clue.position]=id;
   }
 }
 return {schemaVersion:1,source:'GeoWords-author-map-review',status:'human_review_pending',books:['l1','l2'],decisions};
}
function save(){
 const payload=exportReview();const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'});
 const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='geowords-l1-l2-reviewed-assignments.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(link.href),5000);
 $('message').textContent='JSON экспортирован. Импортируйте его позже, чтобы продолжить, или передайте для внесения в GitHub.';
}
function restore(data){
 if(data?.schemaVersion!==1||data.source!=='GeoWords-author-map-review'||!data.decisions||typeof data.decisions!=='object')throw Error('Неверный формат файла разметки');
 const future={};for(const p of state.puzzles){
   const record={};for(const clue of p.clues){if(clue.markerId)record[clue.position]=clue.markerId}
   const inputs=data.decisions[p.id]||{};
   for(const [position,markerId] of Object.entries(inputs)){
     const clue=p.clues.find(c=>String(c.position)===position);
     if(!clue||!clue.candidateMarkerIds.includes(markerId))throw Error(`Недопустимый выбор ${p.id}:${position} = ${markerId}`);
     record[clue.position]=markerId;
   }
   future[p.id]=record;
   const values=Object.values(record);if(new Set(values).size!==values.length)throw Error(`Одна буква назначена дважды: ${p.id}`);
 }
 state.assignments=future;render();$('message').textContent='Разметка импортирована и проверена.';
}
async function start(){
 try{
   const urls=['../data/import-staging/l1-staging.json','../data/import-staging/l2-staging.json'];
   const data=await Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Не удалось открыть ${url} (${r.status})`);return r.json()}));
   for(const d of data){if(d.status!=='not_for_live_use'||d.puzzles.length!==10)throw Error('Неверный статус или количество заданий в импорте')}
   state.books=data;state.puzzles=data.flatMap(d=>d.puzzles);initAssignments();
   state.selected=Math.max(0,state.puzzles[0].clues.findIndex(c=>!assignFor(state.puzzles[0],c)));
   $('workspace').hidden=false;
   $('previous').addEventListener('click',()=>{state.index=Math.max(0,state.index-1);state.selected=0;render()});
   $('next').addEventListener('click',()=>{state.index=Math.min(state.puzzles.length-1,state.index+1);state.selected=0;render()});
   $('clearSelected').addEventListener('click',()=>{
     const p=current(),clue=selectedClue();if(clue.markerId)return;
     delete state.assignments[p.id][clue.position];render();
   });
   $('save').addEventListener('click',()=>{try{save()}catch(e){$('message').textContent=e.message}});
   $('restore').addEventListener('change',async e=>{try{const file=e.target.files?.[0];if(file)restore(JSON.parse(await file.text()))}catch(err){$('message').textContent='Ошибка импорта: '+err.message}e.target.value=''});
   render();state.loaded=true;
 }catch(e){$('appError').classList.remove('hidden');$('appError').textContent='Ошибка загрузки: '+e.message}
}
start();
})();
