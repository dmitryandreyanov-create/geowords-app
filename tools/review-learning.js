/* Human-only lesson panel in the existing import editor. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),model=globalThis.GEOWORD_LEARNING_REVIEW;
 const sessions={};let key='geowords-l1-learning-review-v1',activeBook,pendingPuzzle;
 let sources,template,state,stepId,factId,lastPuzzleId,protectedLocal=false,rawSaved=null,busy=false;
 const stepFields=[['requiresFacts','Факты, изученные раньше'],['learnBefore','Изучить ДО авторского слова'],['unlockAfter','Изучить ПОСЛЕ авторского слова, до практики'],['introducedPlaces','Объекты вводного экрана'],['wordIds','Шесть практических слов'],['focusPlaceIds','Фокус практики (не обязательно новый объект)']];
 const fact=()=>sources.draft.facts.find(f=>f.id===factId),step=()=>sources.draft.courses.find(c=>c.id===model.config(sources).courseId).steps.find(s=>s.id===stepId);
 const record=id=>state.records.find(r=>r.key===id),selected=select=>[...select.selectedOptions].map(o=>o.value);
 const option=(host,value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;host.appendChild(o)};
 function message(text){$('learningMessage').textContent=text+(protectedLocal?' Несовместимое сохранение не перезаписывается; скачайте резервную копию. Для замены импортируйте совместимый JSON.':'')}
 function saveLocal(){if(protectedLocal)return false;try{localStorage.setItem(key,JSON.stringify(state));return true}catch{return false}}
 function persist(text){const saved=saveLocal();summary();message(saved?text:text+' Автосохранение недоступно: экспортируйте JSON перед закрытием.')}
 function download(data,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
 function choices(select,rows,values){select.replaceChildren();for(const [id,label] of rows)option(select,id,label);for(const o of select.options)o.selected=(values||[]).includes(o.value)}
 const factRows=list=>list.map(f=>[f.id,`${f.id.startsWith('f-l1-')?'L1':'L2'} · PDF ${f.provenance.pdfPage} · ${f.id.replace(/^f-l[12]-p\d+-/,'').replaceAll('-',' ')}`]);
 const factChoices=()=>factRows(model.referenceFacts(sources));
 const placeChoices=()=>sources.catalog.places.map(p=>[p.id,p.label.en]);
 function summary(){
  $('learningProgress').textContent=`Текст/объекты/оговорки: ${state.records.filter(r=>r.key.startsWith('fact:')&&r.status==='approved').length}/${model.ownFacts(sources).length} · порядок шагов: ${state.records.filter(r=>r.key.startsWith('step:')&&r.status==='approved').length}/10. Это редакторские решения, не выпуск уровня.`;
  const rows=model.report(sources,state,{contentReview:globalThis.GEOWORD_CONTENT_PANEL?.getState(model.config(sources).courseId)}),host=$('learningReport');host.replaceChildren();
  const label={STEP_PENDING:'Порядок ещё не проверен',PREREQUISITE_COURSE_PENDING:'Входные знания L1 не подтверждены; они не объявляются изученными',UNKNOWN_PREREQUISITE:'Ранее не изучен prerequisite',FACT_PENDING:'Факт не утверждён (включая внешние знания L1)',CAVEAT_NOT_LEARNED:'Оговорка ещё не изучена',CLUE_FACT_NOT_LEARNED:'Для авторской подсказки факт ещё не изучен',CLUE_PLACE_NOT_LEARNED:'Для авторской подсказки объект ещё не введён'};
  for(const row of rows){const div=document.createElement('div'),basis=row.dependencyStatus==='reviewed_dependencies'?'зависимости фраз проверены':row.dependencyStatus==='mixed_reviewed_and_candidate_dependencies'?'часть зависимостей проверена, часть предложена':'зависимости фраз ещё предложены';div.textContent=`${row.stepId}: ${row.status==='candidate_timing_ok'?'порядок согласован по указанным зависимостям; география не утверждена':row.issues.map(i=>`${label[i.code]}${i.factId?' · '+i.factId:''}${i.placeId?' · '+i.placeId:''}${i.caveatId?' · '+i.caveatId:''}`).join('; ')} · ${basis}`;host.appendChild(div)}
  $('learningFactStatus').textContent=record('fact:'+factId)?.status==='approved'?'Решение по факту подтверждено':'Решение по факту pending';
  $('learningStepStatus').textContent=record('step:'+stepId)?.status==='approved'?'Порядок этого шага подтверждён':'Порядок шага pending';
 }
 function displayFact(){
  const f=fact(),r=record('fact:'+factId);if(!f||!r)return;
  $('learningFact').value=factId;
  const block=sources.facts.sourceBlocks.find(b=>b.id===f.sourceBlockId);
  $('learningSource').textContent=block?.text.en??f.text.en;
  $('learningProvenance').textContent=`${f.provenance.source} · PDF стр. ${f.provenance.pdfPage} · область ${f.provenance.region.join(', ')} · исходный блок ${f.sourceBlockId}`;
  const caveats=f.caveatFactIds.map(id=>sources.draft.facts.find(f=>f.id===id));
  $('learningCaveatSource').textContent=caveats.length?caveats.map(f=>`${f.id}: ${f.text.en}`).join('\n\n'):'У исходного блока нет связанных оговорок; это не проверка достоверности.';
  $('learningText').value=r.decision.text?.en||'';
  for(const field of ['introducesPlaces','caveatFactIds']){
   choices($('learningFact-'+field),field==='introducesPlaces'?placeChoices():factChoices(),r.decision[field]);
   $('learningFactKnown-'+field).checked=r.decision[field]!==null;
  }
  $('learningFactChecked').checked=false;summary();
 }
 function displayStep(){
  const s=step(),r=record('step:'+stepId);if(!s||!r)return;$('learningStep').value=stepId;
  const plan=sources.lexicon.practicePlans.find(p=>p.stepId===s.id);
  $('learningCandidates').textContent=`Предложено ДО: ${s.candidateLearnBefore.join(', ')||'пусто'}\nПредложено ПОСЛЕ: ${s.candidateUnlockAfter.join(', ')||'пусто'}\nДополнительные блоки: ${s.candidateOptionalAfter.join(', ')||'пусто'}\nСлова-кандидаты: ${plan.candidateWordIds?.join(', ')||'план ещё не подготовлен; шесть слов не выбраны'}. Это предложения, не готовые задания.`;
  for(const [field] of stepFields){
   const rows=field==='wordIds'?model.wordChoices(sources).map(e=>[e.id,e.word]):['introducedPlaces','focusPlaceIds'].includes(field)?placeChoices():factChoices();
   choices($('learningStep-'+field),rows,r.decision[field]);$('learningStepKnown-'+field).checked=r.decision[field]!==null;
  }
  $('learningStepChecked').checked=false;summary();
 }
 function updateFact(){
  const decision={text:$('learningText').value.trim()?{en:$('learningText').value}:null};
  for(const field of ['introducesPlaces','caveatFactIds'])decision[field]=$('learningFactKnown-'+field).checked?selected($('learningFact-'+field)):null;
  try{model.edit(sources,state,'fact:'+factId,decision);$('learningFactChecked').checked=false;persist('Черновик факта сохранён. Изменение снимает подтверждение факта и порядка обучения.')}catch(e){message(e.message)}
 }
 function updateStep(){
  const decision=Object.fromEntries(stepFields.map(([field])=>[field,$('learningStepKnown-'+field).checked?selected($('learningStep-'+field)):null]));
  if(decision.wordIds){const prior=record('step:'+stepId).decision.wordIds||[];decision.wordIds=[...prior.filter(id=>decision.wordIds.includes(id)),...decision.wordIds.filter(id=>!prior.includes(id))]}
  try{model.edit(sources,state,'step:'+stepId,decision);$('learningStepChecked').checked=false;persist('Черновик порядка сохранён. Изменение снимает подтверждение этого и следующих шагов.')}catch(e){message(e.message)}
 }
 async function exclusive(action){if(busy)return;busy=true;$('learningControls').disabled=true;try{await action()}catch(e){message(e.message)}finally{busy=false;$('learningControls').disabled=false;if(pendingPuzzle){const id=pendingPuzzle;pendingPuzzle=null;render(id)}}}
 async function hashes(data){return Object.fromEntries(await Promise.all((data.records||[]).map(async r=>[r.key,await model.hash(r.decision)])))}
 function render(puzzleId){
  if(busy){pendingPuzzle=puzzleId;return}const book=puzzleId.slice(0,2);if(sessions[book]&&book!==activeBook)activate(book);
  const found=sources?.draft.courses.find(c=>c.id===model.config(sources).courseId).steps.find(s=>s.authoredPuzzleId===puzzleId);
  $('learningPanel').hidden=!found;$('learningUnavailable').hidden=!!found;if(!found)return;
  if(lastPuzzleId===puzzleId){summary();return}lastPuzzleId=puzzleId;
  stepId=found.id;const first=[...found.candidateLearnBefore,...found.candidateUnlockAfter,...found.candidateOptionalAfter][0];
  if(first)factId=first;displayFact();displayStep();
 }
 function activate(book){
  if(activeBook)Object.assign(sessions[activeBook],{sources,template,state,stepId,factId,protectedLocal,rawSaved});
  activeBook=book;({sources,template,state,stepId,factId,protectedLocal,rawSaved}=sessions[book]);key='geowords-'+book+'-learning-review-v1';lastPuzzleId=null;
  $('learningTitle').textContent='Факты и порядок обучения · '+book.toUpperCase();$('learningBackup').hidden=!protectedLocal;
  choices($('learningFact'),factRows(model.ownFacts(sources)),[]);choices($('learningStep'),sources.draft.courses.find(c=>c.id===model.config(sources).courseId).steps.map(s=>[s.id,s.id+' · '+sources.draft.puzzles.find(p=>p.id===s.authoredPuzzleId).answer]),[]);
  message(protectedLocal?'Сохранённые решения несовместимы; доступна резервная копия.':'');
 }
 async function init(){
  try{
   const names=['curriculum-draft','lexicon-draft','l1-catalog-draft','facts-draft','l2-catalog-draft','l2-practice-plans-draft'];
   const data=await Promise.all(names.map(async n=>{const r=await fetch('../data/import-staging/'+n+'.json');if(!r.ok)throw Error('Не удалось загрузить '+n);return r.json()}));
   for(const book of ['l1','l2']){
    const src={draft:data[0],lexicon:book==='l1'?data[1]:{...data[1],practicePlans:data[5].practicePlans},catalog:book==='l1'?data[2]:data[4],facts:data[3]};
    const sourceHashes=Object.fromEntries(await Promise.all(model.sourceRows(src).map(async r=>[r.key,await model.hash(r.source)]))),tpl=model.create(src,sourceHashes);
    const session={sources:src,template:tpl,state:JSON.parse(JSON.stringify(tpl)),stepId:src.draft.courses.find(c=>c.id===model.config(src).courseId).steps[0].id,factId:model.ownFacts(src)[0].id,protectedLocal:false,rawSaved:null};
    let saved;try{saved=localStorage.getItem('geowords-'+book+'-learning-review-v1')}catch{message('Хранилище недоступно: экспортируйте проверку обучения перед закрытием.')}
    if(saved)try{const json=JSON.parse(saved);session.state=model.restore(src,tpl,json,await hashes(json))}catch{session.protectedLocal=true;session.rawSaved=saved}
    sessions[book]=session;
   }
   const dynamic=$('learningStepFields');
   for(const [field,label] of stepFields){const box=document.createElement('div'),title=document.createElement('label'),select=document.createElement('select'),checkLabel=document.createElement('label'),check=document.createElement('input');
    select.id='learningStep-'+field;select.multiple=true;select.size=field==='wordIds'?6:4;title.textContent=label;title.htmlFor=select.id;
    check.id='learningStepKnown-'+field;check.type='checkbox';checkLabel.append(check,document.createTextNode(' Список проверен (пустой = ничего не вводится)'));box.append(title,select,checkLabel);dynamic.append(box);
    select.addEventListener('change',()=>{check.checked=true;updateStep()});check.addEventListener('change',updateStep);
   }
   activate('l1');
   $('learningFact').addEventListener('change',()=>{factId=$('learningFact').value;displayFact()});
   $('learningStep').addEventListener('change',()=>{stepId=$('learningStep').value;displayStep()});
   $('learningText').addEventListener('input',updateFact);
   for(const field of ['introducesPlaces','caveatFactIds']){
    $('learningFact-'+field).addEventListener('change',()=>{$('learningFactKnown-'+field).checked=true;updateFact()});$('learningFactKnown-'+field).addEventListener('change',updateFact);
   }
   $('learningCopyFact').addEventListener('click',()=>{
    const r=record('fact:'+factId),f=fact();if(r.status==='approved'||Object.values(r.decision).some(v=>v!==null)){message('У факта уже есть работа; предложение её не заменяет.');return}
    model.edit(sources,state,r.key,{text:JSON.parse(JSON.stringify(f.text)),introducesPlaces:null,caveatFactIds:[...f.caveatFactIds]});displayFact();persist('Исходный текст и оговорки перенесены в черновик. Объекты и содержание нужно проверить.');
   });
   $('learningCopyStep').addEventListener('click',()=>{
    const r=record('step:'+stepId),s=step();if(r.status==='approved'||Object.values(r.decision).some(v=>v!==null)){message('У шага уже есть работа; предложение её не заменяет.');return}
    const d=JSON.parse(JSON.stringify(r.decision));d.learnBefore=[...s.candidateLearnBefore];d.unlockAfter=[...s.candidateUnlockAfter];const words=sources.lexicon.practicePlans.find(p=>p.stepId===s.id).candidateWordIds;d.wordIds=words?[...words]:null;
    model.edit(sources,state,r.key,d);displayStep();persist('Предложенный порядок и слова перенесены в черновик. Остальные списки остаются неизвестными.');
   });
   for(const kind of ['Fact','Step']){
    $('learningConfirm'+kind).addEventListener('click',()=>exclusive(async()=>{
     if(!$('learning'+kind+'Checked').checked)throw Error('Отметьте содержательную проверку решения');
     const id=kind==='Fact'?'fact:'+factId:'step:'+stepId,r=record(id),sha=await model.hash(r.decision);
     model.confirm(sources,state,id,$('learningReviewer').value,sha);persist('Редакторское решение подтверждено. Другие проверки и выпуск уровня не утверждаются.');
    }));
    $('learningRevoke'+kind).addEventListener('click',()=>{model.revoke(state,kind==='Fact'?'fact:'+factId:'step:'+stepId);persist('Подтверждение снято; черновик сохранён.');$('learning'+kind+'Checked').checked=false});
   }
   $('learningExport').addEventListener('click',()=>{download(JSON.stringify(state,null,2)+'\n','geowords-'+activeBook+'-learning-review.json');message('Экспортированы решения текущей книги. Назначения букв и география хранятся отдельно.')});
   $('learningBackup').addEventListener('click',()=>{if(rawSaved!==null)download(rawSaved,'geowords-learning-incompatible-backup.json')});
   $('learningImport').addEventListener('change',e=>exclusive(async()=>{
    try{const file=e.target.files?.[0];if(file){const data=JSON.parse(await file.text()),future=model.restore(sources,template,data,await hashes(data));state=future;protectedLocal=false;rawSaved=null;$('learningBackup').hidden=true;displayFact();displayStep();persist('Решения импортированы и сохранены.')}}catch(err){message('Ошибка импорта обучения: '+err.message)}finally{e.target.value=''}
   }));
   return true;
  }catch(e){sources=undefined;message('Панель обучения недоступна: '+e.message);return false}
 }
 globalThis.GEOWORD_LEARNING_PANEL={init,render,refresh:()=>{if(state&&sources)summary()}};
})();
