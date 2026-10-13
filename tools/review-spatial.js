/* Optional L1 panel inside the existing editor. Never edits source maps. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),model=globalThis.GEOWORD_SPATIAL_REVIEW;
 const key='geowords-spatial-review-v1';let scaffold,catalog,state,puzzleId,selectedId,channel='physical',assignments=()=>({}),protectedLocal=false,rawSaved=null,proposals=null;
 const options={};
 function message(text){$('spatialMessage').textContent=text+(protectedLocal?' Несовместимое сохранение оставлено нетронутым; скачайте его отдельной кнопкой. Для замены импортируйте совместимый JSON.':'')}
 function saveLocal(){if(protectedLocal)return false;try{localStorage.setItem(key,JSON.stringify(state));return true}catch{return false}}
 function selected(){return state?.puzzles.find(p=>p.puzzleId===puzzleId)?.reviews.find(r=>r.anchorId===selectedId)}
 function proposal(){return proposals?.puzzles.find(p=>p.puzzleId===puzzleId)?.records.find(r=>r.anchorId===selectedId)}
 function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o)}
 function values(id){return [...$(id).selectedOptions].map(o=>o.value)}
 function membership(){return {places:values('geoPlaces'),regions:values('geoRegions').map(v=>JSON.parse(v)),sides:values('geoSides').map(v=>JSON.parse(v)),between:values('geoBetween').map(v=>JSON.parse(v)),hemispheres:values('geoHemispheres'),boundaries:$('geoEquator').checked?['equator']:[]}}
 function display(){
  const r=selected();if(!r)return;
  $('geoChannel').value=channel;$('geoChannel').options[1].disabled=!r.sourceBinding.pointsTo;
  const data=r[channel]??model.empty();
  for(const [id,field] of [['geoPlaces','places'],['geoRegions','regions'],['geoSides','sides'],['geoBetween','between'],['geoHemispheres','hemispheres']]){
   const chosen=data[field].map(v=>typeof v==='string'?v:JSON.stringify(v));
   for(const o of $(id).options)o.selected=chosen.includes(o.value);
  }
  $('geoEquator').checked=data.boundaries.includes('equator');$('geoComplete').checked=false;
  const b=r.sourceBinding,pt=b.pointsTo;
  $('geoBinding').textContent=`Буква: ${b.x}% / ${b.y}%${pt?` · конец стрелки: ${pt.x}% / ${pt.y}%`:''} · ${r.status==='approved'?'полнота географии подтверждена':'география не утверждена'}`;
  const proposed=proposal();
  $('geoProposalNotes').textContent=proposed?`Предложение по PDF стр. ${proposed.provenance.mapPdfPage}; неизвестные свойства НЕ проверены. ${proposed.notes.join(' ')}`:'Нет загруженного предложения для этой буквы.';
  $('geoApplyProposal').disabled=!proposed||(!proposed.physical&&!proposed.target)||r.physical!==null||r.target!==null||r.status==='approved';
 }
 function renderReport(){
  const rows=model.report(state,catalog,puzzleId);const host=$('geoReport');host.replaceChildren();if(!rows)return;
  const scope=state.puzzles.find(p=>p.puzzleId===puzzleId);
  const complete=scope.reviews.filter(r=>r.status==='approved').length;
  $('geoProgress').textContent=`География букв: ${complete}/${scope.reviews.length}. Черновая проверка по предложенным фактам; уроки и запросы не утверждены.`;
  for(const row of rows){
   const item=document.createElement('div');
   const labels=row.matchedAnchorIds.map(id=>{const a=catalog.anchors.find(a=>a.id===id);return `${a.letter} (${id})`});
   const expected=assignments()[puzzleId]?.[row.position];
   const text=row.status==='blocked'?`проверка заблокирована: ${row.unresolvedAnchorIds?.length??0} букв без полной географии`:row.status==='ambiguous'?`несколько букв: ${labels.join(', ')}`:row.status==='no_match'?'подходящих букв нет':`одна буква: ${labels[0]}${expected&&expected!==row.matchedAnchorIds[0]?' — НЕ совпадает с назначением':''}`;
   item.textContent=`${row.position}. ${text}`;host.appendChild(item);
  }
 }
 function update(){
  try{model.edit(state,catalog,puzzleId,selectedId,channel,membership());const saved=saveLocal();$('geoComplete').checked=false;display();renderReport();message(saved?'Черновик сохранён. Изменение снимает утверждение полноты.':'Хранилище недоступно: экспортируйте географию перед закрытием вкладки.')}
  catch(e){message(e.message)}
 }
 function render(id){
  puzzleId=id;const p=state?.puzzles.find(p=>p.puzzleId===id);
  $('spatialPanel').hidden=!p;$('spatialUnavailable').hidden=!!p;if(!p)return;
  if(!p.reviews.some(r=>r.anchorId===selectedId))selectedId=p.reviews[0].anchorId;
  const host=$('geoAnchor');host.replaceChildren();
  for(const r of p.reviews){const a=catalog.anchors.find(a=>a.id===r.anchorId);option(host,r.anchorId,`${a.letter} · ${a.id} · ${a.x}% / ${a.y}%`)}
  host.value=selectedId;if(channel==='target'&&!selected().sourceBinding.pointsTo)channel='physical';
  display();renderReport();
 }
 async function init(getAssignments){
  assignments=getAssignments;
  try{
   const data=await Promise.all(['l1-catalog-draft.json','l1-spatial-review-draft.json'].map(async name=>{const r=await fetch('../data/import-staging/'+name);if(!r.ok)throw Error(`География: ${r.status}`);return r.json()}));
   [catalog,scaffold]=data;state=model.create(scaffold);
   try{const r=await fetch('../data/import-staging/l1-spatial-proposals.json');if(!r.ok)throw Error('Нет файла предложений');const value=await r.json();if(value.status!=='not_for_live_use'||value.origin!=='visual_source_map_proposals')throw Error('Неверный статус предложений');proposals=value}catch(e){message('Предложения недоступны; ручная разметка работает: '+e.message)}
   for(const p of catalog.places)option($('geoPlaces'),p.id,p.label.en);
   const unique=(op,field)=>[...new Set(catalog.descriptors.filter(d=>d.candidateQuery.op===op).map(d=>JSON.stringify(field(d.candidateQuery))))];
   options.regions=unique('region',q=>({placeId:q.placeId,direction:q.direction}));
   options.sides=unique('side',q=>({oceanId:q.oceanId,sidePlaceId:q.sidePlaceId}));
   options.between=unique('between',q=>q.placeIds);
   const label=id=>catalog.places.find(p=>p.id===id)?.label.en??id;
   const direction={north:'север',south:'юг',east:'восток',west:'запад'};
   for(const value of options.regions){const v=JSON.parse(value);option($('geoRegions'),value,`${label(v.placeId)} · ${direction[v.direction]}`)}
   for(const value of options.sides){const v=JSON.parse(value);option($('geoSides'),value,`${label(v.oceanId)} · сторона ${label(v.sidePlaceId)}`)}
   for(const value of options.between)option($('geoBetween'),value,JSON.parse(value).map(label).join(' ↔ '));
   let saved;try{saved=localStorage.getItem(key)}catch{message('Хранилище недоступно: экспортируйте географию перед закрытием вкладки.')}
   if(saved){try{state=model.restore(scaffold,catalog,JSON.parse(saved))}catch(e){protectedLocal=true;rawSaved=saved;$('geoBackup').hidden=false;message('Сохранённая география не загружена: '+e.message)}}
   $('geoBackup').addEventListener('click',()=>{if(rawSaved===null)return;const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([rawSaved],{type:'application/json'}));link.download='geowords-spatial-incompatible-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),5000)});
   $('geoAnchor').addEventListener('change',()=>{selectedId=$('geoAnchor').value;if(!selected().sourceBinding.pointsTo)channel='physical';display()});
   $('geoChannel').addEventListener('change',()=>{channel=$('geoChannel').value;display()});
   for(const id of ['geoPlaces','geoRegions','geoSides','geoBetween','geoHemispheres','geoEquator'])$(id).addEventListener('change',update);
   $('geoApplyProposal').addEventListener('click',()=>{try{model.applyProposal(state,catalog,puzzleId,proposal());const saved=saveLocal();display();renderReport();message(saved?'Предложение перенесено только в черновик. Проверьте неизвестные свойства; утверждение не поставлено.':'Черновик заполнен, но автосохранение недоступно: экспортируйте JSON.')}catch(e){message(e.message)}});
   $('geoConfirm').addEventListener('click',()=>{
    try{
     if(!$('geoComplete').checked)throw Error('Отметьте проверку полноты обоих каналов по исходной карте');
     // Save current channel explicitly, including intentionally empty lists.
     model.edit(state,catalog,puzzleId,selectedId,channel,membership());saveLocal();model.confirm(state,puzzleId,selectedId);
     const saved=saveLocal();display();renderReport();message(saved?'Полнота географии буквы подтверждена и сохранена. Подсказки автоматически не утверждаются.':'Подтверждено, но хранилище недоступно: экспортируйте географию.')
    }catch(e){message(e.message);display();renderReport()}
   });
   $('geoRevoke').addEventListener('click',()=>{model.revoke(state,puzzleId,selectedId);const saved=saveLocal();display();renderReport();message(saved?'Утверждение снято; свойства сохранены.':'Утверждение снято; хранилище недоступно: экспортируйте географию.')});
   $('geoExport').addEventListener('click',()=>{
    const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)+'\n'],{type:'application/json'}));link.download='geowords-l1-spatial-review.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),5000);message('География экспортирована отдельно от назначений букв.');
   });
   $('geoImport').addEventListener('change',async e=>{
    try{const file=e.target.files?.[0];if(file){const future=model.restore(scaffold,catalog,JSON.parse(await file.text()));state=future;protectedLocal=false;rawSaved=null;$('geoBackup').hidden=true;const saved=saveLocal();render(puzzleId);message(saved?'География импортирована и сохранена.':'География импортирована, но хранилище недоступно: экспортируйте копию.')}}catch(err){message('Ошибка импорта географии: '+err.message)}e.target.value='';
   });
   return true;
  }catch(e){message('Панель географии недоступна: '+e.message);$('spatialUnavailable').hidden=false;return false}
 }
 globalThis.GEOWORD_SPATIAL_PANEL={init,render};
})();
