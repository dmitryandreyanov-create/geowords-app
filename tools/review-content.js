/* Phrase and vocabulary panel inside the existing editorial workspace. */
(()=>{
 'use strict';const $=id=>document.getElementById(id),model=globalThis.GEOWORD_CONTENT_REVIEW,key='geowords-l1-content-review-v1';
 let sources,template,state,descriptorId,wordId,lastPuzzleId,protectedLocal=false,rawSaved=null,busy=false;
 const record=key=>state.records.find(r=>r.key===key),values=id=>[...$(id).selectedOptions].map(o=>o.value),copy=v=>JSON.parse(JSON.stringify(v));
 const descriptor=()=>sources.catalog.descriptors.find(d=>d.id===descriptorId),word=()=>sources.lexicon.entries.find(w=>w.id===wordId);
 function message(text){$('contentMessage').textContent=text+(protectedLocal?' Несовместимое сохранение не перезаписывается; скачайте резервную копию или импортируйте совместимый JSON.':'')}
 function summary(){const count=kind=>state.records.filter(r=>r.key.startsWith(kind+':')&&r.status==='approved').length;$('contentProgress').textContent=`Фразы: ${count('descriptor')}/${sources.catalog.descriptors.length} · словарь: ${count('word')}/${model.sourceRows(sources).filter(r=>r.key.startsWith('word:')).length}. Подтверждения здесь не утверждают географию, факты или выпуск курса.`;$('contentDescriptorStatus').textContent=record('descriptor:'+descriptorId)?.status==='approved'?'Фраза и её интерпретация подтверждены':'Фраза/интерпретация pending';$('contentWordStatus').textContent=record('word:'+wordId)?.status==='approved'?'Определение и пригодность слова подтверждены':'Определение/пригодность pending'}
 function persist(text){let saved=false;if(!protectedLocal)try{localStorage.setItem(key,JSON.stringify(state));saved=true}catch{}summary();globalThis.GEOWORD_LEARNING_PANEL?.refresh();message(saved?text:text+' Автосохранение недоступно: экспортируйте JSON.')}
 function options(id,rows,selected=[]){const select=$(id);select.replaceChildren();for(const [value,label] of rows){const o=document.createElement('option');o.value=value;o.textContent=label;o.selected=selected.includes(value);select.append(o)}}
 const placeRows=()=>sources.catalog.places.map(p=>[p.id,p.label.en]);
 function clearChecks(kind){for(const name of model.checks[kind])$('contentCheck-'+kind+'-'+name).checked=false}
 function showOp(){const op=$('contentOp').value;for(const name of model.ops)$('contentQuery-'+name).hidden=name!==op&&!(name==='place'&&op==='region')}
 function showQuery(q){
  $('contentQuerySet').checked=q!==null;$('contentOp').value=q?.op||'place';$('contentChannel').value=q?.channel||'either';
  for(const field of ['requires','requiredPlaces'])for(const o of $('content-'+field).options)o.selected=(q?.[field]||[]).includes(o.value);
  for(const field of ['placeId','oceanId','sidePlaceId'])$('content-'+field).value=q?.[field]||'';
  $('contentDirection').value=q?.direction||'';for(const o of $('content-placeIds').options)o.selected=(q?.placeIds||[]).includes(o.value);
  for(const o of $('contentHemisphere').options)o.selected=(q?.values||[]).includes(o.value);
  showOp();
 }
 function query(){
  if(!$('contentQuerySet').checked)return null;
  const q={status:'editorial_pending',channel:$('contentChannel').value,requires:values('content-requires'),requiredPlaces:values('content-requiredPlaces'),op:$('contentOp').value};
  if(q.op==='place'||q.op==='region')q.placeId=$('content-placeId').value||null;
  if(q.op==='region')q.direction=$('contentDirection').value||null;
  if(q.op==='side'){q.oceanId=$('content-oceanId').value||null;q.sidePlaceId=$('content-sidePlaceId').value||null}
  if(q.op==='between')q.placeIds=values('content-placeIds');if(q.op==='hemisphere')q.values=values('contentHemisphere');if(q.op==='boundary')q.boundary='equator';return q;
 }
 function displayDescriptor(){const d=descriptor(),r=record('descriptor:'+descriptorId);if(!d||!r)return;$('contentDescriptor').value=descriptorId;$('contentSourcePhrase').textContent=d.sourcePredicate.en;
  $('contentOccurrences').textContent=d.occurrences.map(o=>`${o.puzzleId}, подсказка ${o.position}${o.provenance?.cluesPdfPage?' · PDF стр. '+o.provenance.cluesPdfPage:''}: ${o.sourceText?.en||d.sourcePredicate.en}`).join('\n');
  $('contentPhrase').value=r.decision.text?.en||'';$('contentKind').value=r.decision.kind||'';showQuery(r.decision.query);clearChecks('descriptor');summary();
 }
 function displayWord(){const w=word(),r=record('word:'+wordId);if(!w||!r)return;$('contentWord').value=wordId;$('contentSourceDefinition').textContent=w.definition.en;
  $('contentWordOrigin').textContent=w.origin==='codex_proposal_not_authored'?'Предложение Codex, не авторское определение.':`Определение из чернового пилотного словаря; авторское происхождение не подтверждено. Источник: ${w.sourceReference}`;
  const plans=sources.lexicon.practicePlans.filter(p=>p.candidateWordIds.includes(w.id));$('contentWordSteps').textContent='Предложено для шагов: '+plans.map(p=>p.stepId).join(', ')+'. Это слоты слов; геометрия заданий ещё не утверждена.';
  $('contentWordValue').value=w.word;$('contentDefinition').value=r.decision.definition?.en||'';clearChecks('word');summary();
 }
 function updateDescriptor(){try{model.edit(sources,state,'descriptor:'+descriptorId,{text:$('contentPhrase').value.trim()?{en:$('contentPhrase').value}:null,kind:$('contentKind').value||null,query:query()});clearChecks('descriptor');persist('Черновик фразы сохранён; подтверждение этой фразы снято.')}catch(e){message(e.message)}}
 function updateWord(){try{model.edit(sources,state,'word:'+wordId,{word:$('contentWordValue').value||null,definition:$('contentDefinition').value.trim()?{en:$('contentDefinition').value}:null});clearChecks('word');persist('Черновик определения сохранён; подтверждение этого слова снято.')}catch(e){message(e.message)}}
 function download(raw,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
 async function exclusive(action){if(busy)return;busy=true;$('contentControls').disabled=true;try{await action()}catch(e){message(e.message)}finally{busy=false;$('contentControls').disabled=false}}
 async function hashes(data){return Object.fromEntries(await Promise.all((data.records||[]).map(async r=>[r.key,await model.hash(r.decision)])))}
 function render(puzzleId){const step=sources?.draft.courses.find(c=>c.id==='oceans-continents').steps.find(s=>s.authoredPuzzleId===puzzleId);$('contentPanel').hidden=!step;$('contentUnavailable').hidden=!!step;if(!step)return;if(lastPuzzleId===puzzleId){summary();return}lastPuzzleId=puzzleId;
  descriptorId=sources.catalog.descriptors.find(d=>d.occurrences.some(o=>o.puzzleId===puzzleId)).id;wordId=sources.lexicon.practicePlans.find(p=>p.stepId===step.id).candidateWordIds[0];displayDescriptor();displayWord();
 }
 async function init(){try{
  const data=await Promise.all(['curriculum-draft','lexicon-draft','l1-catalog-draft'].map(async n=>{const r=await fetch('../data/import-staging/'+n+'.json');if(!r.ok)throw Error('Не удалось загрузить '+n);return r.json()}));sources={draft:data[0],lexicon:data[1],catalog:data[2],authoredAnswers:globalThis.GEOWORD_AUTHORED_ANSWERS?.map(e=>e.word)};
  if(sources.authoredAnswers?.length!==62)throw Error('Не загружен полный индекс авторских ответов');
  const sourceHashes=Object.fromEntries(await Promise.all(model.sourceRows(sources).map(async r=>[r.key,await model.hash(r.source)])));template=model.create(sources,sourceHashes);state=copy(template);descriptorId=sources.catalog.descriptors[0].id;wordId=model.sourceRows(sources).find(r=>r.key.startsWith('word:')).source.id;
  options('contentDescriptor',sources.catalog.descriptors.map(d=>[d.id,d.sourcePredicate.en]));options('contentWord',sources.lexicon.entries.filter(w=>template.records.some(r=>r.key==='word:'+w.id)).map(w=>[w.id,w.word]));
  for(const id of ['content-placeId','content-sidePlaceId'])options(id,[['','Выберите объект'],...placeRows()]);
  options('content-oceanId',[['','Выберите океан'],...sources.catalog.places.filter(p=>p.kind==='ocean').map(p=>[p.id,p.label.en])]);
  for(const id of ['content-requiredPlaces','content-placeIds'])options(id,placeRows());
  options('content-requires',sources.draft.facts.filter(f=>f.id.startsWith('f-l1-')).map(f=>[f.id,`PDF ${f.provenance.pdfPage} · ${f.id.replace(/^f-l1-p\d+-/,'').replaceAll('-',' ')}`]));
  let saved;try{saved=localStorage.getItem(key)}catch{message('Хранилище недоступно; экспортируйте черновики.')}
  if(saved)try{const data=JSON.parse(saved);state=model.restore(sources,template,data,await hashes(data))}catch(e){protectedLocal=true;rawSaved=saved;$('contentBackup').hidden=false;message('Несовместимое сохранение: '+e.message)}
  $('contentDescriptor').addEventListener('change',()=>{descriptorId=$('contentDescriptor').value;displayDescriptor()});$('contentWord').addEventListener('change',()=>{wordId=$('contentWord').value;displayWord()});
  $('contentPhrase').addEventListener('input',updateDescriptor);$('contentKind').addEventListener('change',updateDescriptor);$('contentDefinition').addEventListener('input',updateWord);
  for(const id of ['contentOp','contentChannel','content-requires','content-requiredPlaces','content-placeId','contentDirection','content-oceanId','content-sidePlaceId','content-placeIds','contentHemisphere'])$(id).addEventListener('change',()=>{$('contentQuerySet').checked=true;updateDescriptor();showOp()});
  $('contentQuerySet').addEventListener('change',updateDescriptor);
  $('contentCopyDescriptor').addEventListener('click',()=>{const r=record('descriptor:'+descriptorId),d=descriptor();if(Object.values(r.decision).some(v=>v!==null)){message('Заполненная работа не заменяется предложением.');return}model.edit(sources,state,r.key,{text:copy(d.sourcePredicate),kind:model.kinds.includes(d.kind)?d.kind:'other',query:copy(d.candidateQuery)});displayDescriptor();persist('Исходная фраза и предложенная интерпретация перенесены только в черновик. География не утверждается.')});
  $('contentCopyWord').addEventListener('click',()=>{const r=record('word:'+wordId),w=word();if(Object.values(r.decision).some(v=>v!==null)){message('Заполненная работа не заменяется предложением.');return}model.edit(sources,state,r.key,{word:w.word,definition:copy(w.definition)});displayWord();persist('Исходное определение перенесено в черновик. Проверьте смысл, возрастную пригодность и возможность догадаться.')});
  for(const [kind,suffix] of [['descriptor','Descriptor'],['word','Word']]){
   $('contentConfirm'+suffix).addEventListener('click',()=>exclusive(async()=>{const key=kind+':'+(kind==='descriptor'?descriptorId:wordId),r=record(key),sha=await model.hash(r.decision),checked=Object.fromEntries(model.checks[kind].map(c=>[c,$('contentCheck-'+kind+'-'+c).checked]));model.confirm(sources,state,key,$('contentReviewer').value,sha,checked);persist('Подтверждено только выбранное редакторское решение. Факты, география и выпуск остаются отдельными проверками.')}));
   $('contentRevoke'+suffix).addEventListener('click',()=>{model.revoke(state,kind+':'+(kind==='descriptor'?descriptorId:wordId));clearChecks(kind);persist('Подтверждение снято; черновик сохранён.')});
  }
  $('contentExport').addEventListener('click',()=>{download(JSON.stringify(state,null,2)+'\n','geowords-l1-content-review.json');message('Подсказки и словарь экспортированы отдельно от фактов, порядка и географии.')});$('contentBackup').addEventListener('click',()=>{if(rawSaved!==null)download(rawSaved,'geowords-content-incompatible-backup.json')});
  $('contentImport').addEventListener('change',e=>exclusive(async()=>{try{const file=e.target.files?.[0];if(file){const data=JSON.parse(await file.text()),future=model.restore(sources,template,data,await hashes(data));state=future;protectedLocal=false;rawSaved=null;$('contentBackup').hidden=true;displayDescriptor();displayWord();persist('Подсказки и словарь импортированы.')}}catch(err){message('Ошибка импорта содержания: '+err.message)}finally{e.target.value=''}}));return true;
 }catch(e){sources=undefined;message('Панель содержания недоступна: '+e.message);$('contentUnavailable').textContent='Панель содержания недоступна: '+e.message;return false}}
 globalThis.GEOWORD_CONTENT_PANEL={init,render,getState:()=>state};
})();
