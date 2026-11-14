/* Trial UI inside the editor. Never reads/writes live learner or approvals. */
(()=>{
 'use strict';const $=id=>document.getElementById(id),model=globalThis.GEOWORD_REHEARSAL,key='geowords-l1-first-rehearsal-v1';
 let pack,template,state,rawSaved=null,protectedLocal=false,storageWarning=false,resumeNext=false,navigate;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 function message(text){$('trialMessage').textContent=text+(protectedLocal?' Старое сохранение защищено: скачайте резервную копию, затем импортируйте совместимый пробный JSON.':'')+(storageWarning?' Автосохранение недоступно: экспортируйте пробный прогресс.':'')}
 function save(){if(protectedLocal)return;try{localStorage.setItem(key,JSON.stringify(state));storageWarning=false}catch{storageWarning=true}}
 function download(raw,name){const a=node('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
 function display(){
  if(!pack)return;const phase=model.phase(pack,state),q=model.puzzle(pack,state),host=$('trialFacts');host.replaceChildren();
  $('trialProgress').textContent=`Пробный прогресс: ${model.score(pack,state)}/7 · исправления: ${state.errors}. Не прогресс ребёнка.`;
  $('trialTitle').textContent=phase==='before'?'Перед первым авторским заданием':phase==='after'?'После CONTINENT — сведения автора для следующего задания':phase==='next'?'7/7 → HEMISPHERE':phase==='authored'?'Авторское слово · 1/7':`Практика · ${model.score(pack,state)+1}/7`;
  $('trialAcknowledge').hidden=!['before','after'].includes(phase);$('trialPuzzle').hidden=!q;
  if(['before','after'].includes(phase))for(const f of phase==='before'?pack.beforeFacts:pack.afterFacts){const p=node('p',f.text.en);p.lang='en';host.appendChild(p)}
  if(phase==='next')host.appendChild(node('p','Первый комплект завершён. Следующий авторский шаг — HEMISPHERE; переход после 7/7 выполнен. Его практический комплект ещё не подготовлен для пробного прохождения.'));
  if(!q)return;
  $('trialDefinition').textContent=q.definition||'Соберите авторское слово по географическим подсказкам.';
  $('trialMap').style.setProperty('--map-aspect',q.mapAspect);$('trialImage').src='../'+q.map.slice(2);$('trialMap').querySelectorAll('button').forEach(b=>b.remove());
  for(const m of q.markers){const b=node('button',m.letter);b.type='button';b.className='map-button';b.dataset.markerId=m.id;b.style.left=m.x+'%';b.style.top=m.y+'%';b.disabled=state.selected.includes(m.id)||state.selected.length===q.answer.length;b.setAttribute('aria-label','Буква '+m.letter);b.addEventListener('click',()=>{model.select(pack,state,m.id);save();display()});$('trialMap').appendChild(b)}
  const clues=$('trialClues');clues.replaceChildren();for(const [i,c] of q.clues.entries()){const li=node('li',c.text);li.lang='en';if(i===state.selected.length)li.setAttribute('aria-current','step');clues.appendChild(li)}
  $('trialAnswer').textContent='Выбрано: '+(state.selected.map(id=>q.markers.find(m=>m.id===id).letter).join('')||'—');$('trialUndo').disabled=!state.selected.length;$('trialClear').disabled=!state.selected.length;
 }
 function render(puzzleId){$('rehearsalPanel').hidden=!pack||!['l1-01','l1-02'].includes(puzzleId);if(pack)display();if(resumeNext){resumeNext=false;navigate(pack.nextSourcePuzzle.id)}}
 async function init(onNavigate){
  navigate=onNavigate;
  try{const r=await fetch('../data/import-staging/l1-first-rehearsal.json');if(!r.ok)throw Error('Не загружен пробный комплект');pack=await r.json();for(const q of pack.practices)if(await globalThis.GEOWORD_LEARNING_REVIEW.hash(q)!==pack.humanReview.variantSha256[q.id])throw Error('Изменилась визуально проверенная раскладка');template=model.create(pack,await globalThis.GEOWORD_LEARNING_REVIEW.hash(pack));state=structuredClone(template);
   try{const raw=localStorage.getItem(key);if(raw){try{state=model.restore(pack,template,JSON.parse(raw));resumeNext=model.phase(pack,state)==='next'}catch{protectedLocal=true;rawSaved=raw}}}catch{storageWarning=true;message('Хранилище недоступно: используйте экспорт.')}
   $('trialBackup').hidden=!protectedLocal;
   $('trialAcknowledge').addEventListener('click',()=>{model.acknowledge(pack,state);save();display();message('Учебный экран просмотрен только в пробном прохождении.')});
   $('trialUndo').addEventListener('click',()=>{state.selected.pop();save();display();message('Последняя буква убрана. Можно исправить ответ.')});
   $('trialClear').addEventListener('click',()=>{state.selected=[];save();display();message('Текущий ответ очищен; зачтённые слова сохранены.')});
   $('trialSubmit').addEventListener('click',()=>{const result=model.submit(pack,state);save();display();message(result.credited?'Слово зачтено в пробном прохождении.':result.reason==='INCOMPLETE'?'Выберите буквы для всех подсказок.':result.reason==='INCORRECT'?'Ответ не совпал с подсказками. Уберите последнюю букву или очистите ответ и исправьте его.':'Повторного зачёта нет.');if(result.advanced)navigate(pack.nextSourcePuzzle.id)});
   $('trialExport').addEventListener('click',()=>download(JSON.stringify(state,null,2)+'\n','geowords-l1-rehearsal-progress.json'));
   $('trialBackup').addEventListener('click',()=>download(rawSaved,'geowords-l1-rehearsal-incompatible-backup.json'));
   $('trialImport').addEventListener('change',async e=>{try{const f=e.target.files?.[0];if(f){const next=model.restore(pack,template,JSON.parse(await f.text()));state=next;protectedLocal=false;rawSaved=null;$('trialBackup').hidden=true;save();display();message('Импортирован только пробный прогресс.');if(model.phase(pack,state)==='next')navigate(pack.nextSourcePuzzle.id)}}catch(err){message('Ошибка импорта: '+err.message)}finally{e.target.value=''}});
   if(protectedLocal)message('Сохранение относится к другому содержимому комплекта.');return true;
  }catch(e){pack=null;message('Пробное прохождение недоступно: '+e.message);return false}
 }
 globalThis.GEOWORD_REHEARSAL_PANEL={init,render};
})();
