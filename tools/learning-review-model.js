/* Explicit L1 editorial decisions. No live content or learner state. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GEOWORD_LEARNING_REVIEW=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const clone=v=>JSON.parse(JSON.stringify(v));
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const strings=v=>Array.isArray(v)&&v.every(x=>typeof x==='string'&&x)&&new Set(v).size===v.length;
 const ensure=(ok,message)=>{if(!ok)throw Error(message)};
 const fields={fact:{text:null,introducesPlaces:null,caveatFactIds:null},step:{requiresFacts:null,learnBefore:null,unlockAfter:null,introducedPlaces:null,wordIds:null,focusPlaceIds:null}};
 function sourceRows(s){
  const course=s.draft.courses.find(c=>c.id==='oceans-continents');ensure(course,'Нет курса L1');
  return [...s.draft.facts.filter(f=>f.id.startsWith('f-l1-')).map(f=>({key:'fact:'+f.id,source:f,fields:fields.fact})),
   ...course.steps.map(step=>({key:'step:'+step.id,source:{step,plan:s.lexicon.practicePlans.find(p=>p.stepId===step.id)},fields:fields.step}))];
 }
 function create(s,sourceHashes){return {schemaVersion:1,courseId:'oceans-continents',scope:'l1-learning-review',status:'not_for_live_use',records:sourceRows(s).map(r=>{ensure(/^[a-f0-9]{64}$/.test(sourceHashes[r.key]),'Нет привязки к источнику');return {key:r.key,sourceSha256:sourceHashes[r.key],status:'editorial_pending',decision:clone(r.fields),evidence:null}})}}
 function validateDecision(s,key,d,complete=false){
  const [kind,id]=key.split(':'),shape=fields[kind];ensure(shape&&d&&typeof d==='object'&&!Array.isArray(d)&&Object.keys(d).length===Object.keys(shape).length&&Object.keys(shape).every(k=>Object.hasOwn(d,k)),'Неверные поля решения');
  const facts=new Set(s.draft.facts.filter(f=>f.id.startsWith('f-l1-')).map(f=>f.id)),places=new Set(s.catalog.places.map(p=>p.id)),allowedWords=new Set(wordChoices(s).map(e=>e.id)),words=new Map(s.lexicon.entries.filter(e=>allowedWords.has(e.id)).map(e=>[e.id,e]));
  for(const [field,value] of Object.entries(d)){
   if(value===null){ensure(!complete,'Заполните и явно проверьте все поля; null — ещё не проверено');continue}
   if(field==='text'){ensure(value&&Object.keys(value).length===1&&typeof value.en==='string'&&value.en.trim(),'Нужен непустой английский текст факта');continue}
   ensure(strings(value),'Неверный или повторный ID: '+field);
   const refs=['requiresFacts','learnBefore','unlockAfter','caveatFactIds'].includes(field)?facts:field==='wordIds'?words:places;
   ensure(value.every(v=>refs.has(v)),'Неизвестная ссылка: '+field);
  }
  if(kind==='fact'&&complete){const f=s.draft.facts.find(f=>f.id===id);ensure(f&&f.caveatFactIds.every(c=>d.caveatFactIds.includes(c)),'Сохраните исходные оговорки факта')}
  if(kind==='step'&&complete){
   const step=s.draft.courses.find(c=>c.id==='oceans-continents').steps.find(step=>step.id===id),original=s.draft.puzzles.find(p=>p.id===step?.authoredPuzzleId);
   ensure(step&&original&&d.wordIds.length===6,'Нужны ровно шесть разных практических слов');
   ensure(d.wordIds.every(id=>words.get(id).word.toUpperCase()!==original.answer.toUpperCase()),'Практика не должна повторять авторское слово');
  }
 }
 function wordChoices(s){const steps=new Set(s.draft.courses.find(c=>c.id==='oceans-continents').steps.map(s=>s.id)),allowed=new Set(s.lexicon.practicePlans.filter(p=>steps.has(p.stepId)).flatMap(p=>p.candidateWordIds));return s.lexicon.entries.filter(e=>allowed.has(e.id))}
 function restore(s,template,data,decisionHashes){
  ensure(data?.schemaVersion===1&&data.courseId===template.courseId&&data.scope==='l1-learning-review'&&data.status==='not_for_live_use'&&Array.isArray(data.records)&&data.records.length===template.records.length,'Неверный формат проверки обучения L1');
  const result=clone(template),seen=new Set();
  for(const r of data.records){
   const dest=result.records.find(t=>t.key===r?.key);ensure(dest&&!seen.has(r.key)&&r.sourceSha256===dest.sourceSha256,'Неизвестная, повторная или устаревшая запись');seen.add(r.key);
   ensure(['editorial_pending','approved'].includes(r.status),'Неверный статус решения');validateDecision(s,r.key,r.decision,r.status==='approved');
   if(r.status==='approved')ensure(r.evidence&&typeof r.evidence.reviewedBy==='string'&&r.evidence.reviewedBy.trim()&&r.evidence.sourceSha256===r.sourceSha256&&/^[a-f0-9]{64}$/.test(r.evidence.decisionSha256)&&r.evidence.decisionSha256===decisionHashes[r.key],'Устаревшее или неполное подтверждение решения');
   else ensure(r.evidence===null,'Черновик не может содержать подтверждение');
   Object.assign(dest,clone(r));
  }
  return result;
 }
 function invalidateFollowing(state,key){
  const steps=state.records.filter(r=>r.key.startsWith('step:')),index=steps.findIndex(r=>r.key===key);
  for(const r of key.startsWith('fact:')?steps:steps.slice(index+1)){r.status='editorial_pending';r.evidence=null}
 }
 function edit(s,state,key,decision){validateDecision(s,key,decision);const r=state.records.find(r=>r.key===key);ensure(r,'Неизвестное решение');if(JSON.stringify(canonical(r.decision))!==JSON.stringify(canonical(decision)))invalidateFollowing(state,key);r.decision=clone(decision);r.status='editorial_pending';r.evidence=null}
 function confirm(s,state,key,reviewedBy,decisionSha256){
  const r=state.records.find(r=>r.key===key);ensure(r,'Неизвестное решение');validateDecision(s,key,r.decision,true);
  ensure(typeof reviewedBy==='string'&&reviewedBy.trim()&&/^[a-f0-9]{64}$/.test(decisionSha256),'Укажите, кто проверил решение');
  r.status='approved';r.evidence={reviewedBy:reviewedBy.trim(),sourceSha256:r.sourceSha256,decisionSha256};
 }
 function revoke(state,key){const r=state.records.find(r=>r.key===key);ensure(r,'Неизвестное решение');invalidateFollowing(state,key);r.status='editorial_pending';r.evidence=null}
 function report(s,state,{contentReview}={}){
  const knownFacts=new Set(),knownPlaces=new Set(),rows=[];
  const record=key=>state.records.find(r=>r.key===key);
  for(const step of s.draft.courses.find(c=>c.id==='oceans-continents').steps){
   const r=record('step:'+step.id),issues=[],before=[...knownFacts],beforePlaces=[...knownPlaces];
   if(r.status!=='approved'){rows.push({stepId:step.id,preview:true,dependencyStatus:'candidate_dependencies_not_approved',status:'blocked',issues:[{code:'STEP_PENDING'}],knownBefore:before});continue}
   const d=r.decision;
   for(const id of d.requiresFacts)if(!knownFacts.has(id))issues.push({code:'UNKNOWN_PREREQUISITE',factId:id});
   const learn=ids=>{for(const id of ids){const f=record('fact:'+id);if(f?.status!=='approved')issues.push({code:'FACT_PENDING',factId:id});else{knownFacts.add(id);f.decision.introducesPlaces.forEach(id=>knownPlaces.add(id))}}
    for(const id of knownFacts)for(const caveat of record('fact:'+id).decision.caveatFactIds)if(!knownFacts.has(caveat))issues.push({code:'CAVEAT_NOT_LEARNED',factId:id,caveatId:caveat})};
   learn(d.learnBefore);d.introducedPlaces.forEach(id=>knownPlaces.add(id));
   const authoredFacts=[...knownFacts];
   let reviewed=0,total=0;
   for(const desc of s.catalog.descriptors)if(desc.occurrences.some(o=>o.puzzleId===step.authoredPuzzleId)){
    total++;const content=contentReview?.records.find(r=>r.key==='descriptor:'+desc.id),query=content?.status==='approved'?content.decision.query:desc.candidateQuery;
    if(content?.status==='approved')reviewed++;
    for(const id of query.requires)if(!knownFacts.has(id))issues.push({code:'CLUE_FACT_NOT_LEARNED',descriptorId:desc.id,factId:id});
    for(const id of query.requiredPlaces)if(!knownPlaces.has(id))issues.push({code:'CLUE_PLACE_NOT_LEARNED',descriptorId:desc.id,placeId:id});
   }
   learn(d.unlockAfter);
   rows.push({stepId:step.id,preview:true,dependencyStatus:reviewed===total?'reviewed_dependencies':reviewed?'mixed_reviewed_and_candidate_dependencies':'candidate_dependencies_not_approved',status:issues.length?'blocked':'candidate_timing_ok',issues,knownBefore:before,knownAtAuthored:authoredFacts,knownAtPractice:[...knownFacts]});
   // An invalid earlier step must not provide invented knowledge to later rows.
   if(issues.length){knownFacts.clear();before.forEach(id=>knownFacts.add(id));knownPlaces.clear();beforePlaces.forEach(id=>knownPlaces.add(id))}
  }
  return rows;
 }
 async function hash(value){const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(value))));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
 return {sourceRows,create,wordChoices,validateDecision,restore,edit,confirm,revoke,report,hash};
});
