/* Source-bound phrase/lexicon decisions, independent of geometry and lessons. */
(function(root,factory){const learning=typeof module!=='undefined'&&module.exports?require('./learning-review-model.js'):root.GEOWORD_LEARNING_REVIEW;const spatial=typeof module!=='undefined'&&module.exports?require('../engine/spatial-semantics.js'):root.GEOWORD_SPATIAL;const api=factory(learning,spatial);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GEOWORD_CONTENT_REVIEW=api})(typeof globalThis!=='undefined'?globalThis:this,function(learning,spatial){
 const clone=v=>JSON.parse(JSON.stringify(v)),ensure=(ok,message)=>{if(!ok)throw Error(message)},strings=v=>Array.isArray(v)&&v.every(x=>typeof x==='string'&&x)&&new Set(v).size===v.length;
 const fields={descriptor:{text:null,kind:null,query:null},word:{word:null,definition:null}};
 const checks={descriptor:['meaning','independentPhrase','dependencies'],word:['meaning','ageSuitable','guessability']};
 const kinds=['name','directional','relational','superlative','definition','other'],ops=['place','region','side','between','hemisphere','boundary'];
 function sourceRows(s){return [...s.catalog.descriptors.map(d=>({key:'descriptor:'+d.id,source:d,fields:fields.descriptor})),...learning.wordChoices(s).map(w=>({key:'word:'+w.id,source:w,fields:fields.word}))]}
 function create(s,hashes){return {schemaVersion:1,courseId:'oceans-continents',scope:'l1-content-review',status:'not_for_live_use',records:sourceRows(s).map(r=>{ensure(/^[a-f0-9]{64}$/.test(hashes[r.key]),'Нет привязки к источнику');return {key:r.key,sourceSha256:hashes[r.key],status:'editorial_pending',decision:clone(r.fields),evidence:null}})}}
 function validateDecision(s,key,d,complete=false){
  const [kind,id]=key.split(':'),shape=fields[kind];ensure(shape&&d&&typeof d==='object'&&!Array.isArray(d)&&Object.keys(d).length===Object.keys(shape).length&&Object.keys(shape).every(k=>Object.hasOwn(d,k)),'Неверные поля редакторского решения');
  ensure(sourceRows(s).some(r=>r.key===key),'Неизвестная запись');
  const localized=v=>v&&Object.keys(v).length===1&&typeof v.en==='string'&&v.en.trim();
  for(const [field,value] of Object.entries(d)){
   if(value===null){ensure(!complete,'Заполните все поля; null — ещё не проверено');continue}
   if(['text','definition'].includes(field))ensure(localized(value),'Нужна непустая английская формулировка');
   if(field==='kind')ensure(kinds.includes(value),'Неизвестный тип фразы');
   if(field==='word'){
    const source=learning.wordChoices(s).find(w=>w.id===id);ensure(value===source.word,'Нельзя переименовывать слово под прежним ID; выберите другое слово в порядке шага');
    ensure(/^\p{L}+$/u.test(value)&&Array.from(value).length<=15,'Слово не подходит общему генератору');
    ensure(Array.isArray(s.authoredAnswers)&&s.authoredAnswers.length&& !s.authoredAnswers.some(w=>w.normalize('NFC').toUpperCase()===value.normalize('NFC').toUpperCase()),'Практическое слово совпадает с авторским ответом или индекс ответов отсутствует');
   }
   if(field==='query'){
    ensure(value&&typeof value==='object'&&!Array.isArray(value)&&ops.includes(value.op)&&['physical','target','either'].includes(value.channel),'Неизвестная интерпретация/канал');
    const facts=new Set(s.draft.facts.filter(f=>f.id.startsWith('f-l1-')).map(f=>f.id)),places=new Set(s.catalog.places.map(p=>p.id));
    ensure(strings(value.requires)&&value.requires.every(id=>facts.has(id))&&strings(value.requiredPlaces)&&value.requiredPlaces.every(id=>places.has(id)),'Неизвестные или повторные зависимости');
    for(const field of ['placeId','oceanId','sidePlaceId'])if(value[field]!=null)ensure(places.has(value[field]),'Неизвестный объект интерпретации');
    if(value.placeIds!=null)ensure(strings(value.placeIds)&&value.placeIds.every(id=>places.has(id)),'Неизвестная пара объектов');
    ensure(!Object.hasOwn(value,'resolvesTo')&&!Object.hasOwn(value,'markerId')&&!Object.hasOwn(value,'answer'),'Интерпретация не может содержать назначенный ответ');
    ensure(value.status==='editorial_pending','Статус запроса задаётся только общим адаптером после всех проверок');
    if(complete)ensure(spatial.validateQuery(value),'Неполная интерпретация: проверьте объекты, направление и необходимые знания');
   }
  }
 }
 function edit(s,state,key,decision){validateDecision(s,key,decision);const r=state.records.find(r=>r.key===key);ensure(r,'Неизвестная запись');r.decision=clone(decision);r.status='editorial_pending';r.evidence=null}
 function confirm(s,state,key,reviewedBy,sha,verified){const r=state.records.find(r=>r.key===key);ensure(r,'Неизвестная запись');validateDecision(s,key,r.decision,true);const kind=key.split(':')[0];ensure(checks[kind].every(k=>verified?.[k]===true),'Отметьте все содержательные проверки');ensure(typeof reviewedBy==='string'&&reviewedBy.trim()&&/^[a-f0-9]{64}$/.test(sha),'Укажите проверяющего');r.status='approved';r.evidence={reviewedBy:reviewedBy.trim(),sourceSha256:r.sourceSha256,decisionSha256:sha,checks:Object.fromEntries(checks[kind].map(k=>[k,true]))}}
 function revoke(state,key){const r=state.records.find(r=>r.key===key);ensure(r,'Неизвестная запись');r.status='editorial_pending';r.evidence=null}
 function restore(s,template,data,hashes){
  ensure(data?.schemaVersion===1&&data.courseId===template.courseId&&data.scope==='l1-content-review'&&data.status==='not_for_live_use'&&Array.isArray(data.records)&&data.records.length===template.records.length,'Неверный формат проверки подсказок/словаря L1');
  const future=clone(template),seen=new Set();
  for(const r of data.records){const dest=future.records.find(t=>t.key===r?.key);ensure(dest&&!seen.has(r.key)&&dest.sourceSha256===r.sourceSha256,'Неизвестная, повторная или устаревшая запись');seen.add(r.key);ensure(['approved','editorial_pending'].includes(r.status),'Неверный статус');validateDecision(s,r.key,r.decision,r.status==='approved');
   if(r.status==='approved'){const e=r.evidence;ensure(e&&typeof e.reviewedBy==='string'&&e.reviewedBy.trim()&&e.sourceSha256===r.sourceSha256&&/^[a-f0-9]{64}$/.test(e.decisionSha256)&&e.decisionSha256===hashes[r.key]&&checks[r.key.split(':')[0]].every(k=>e.checks?.[k]===true),'Устаревшее или неполное подтверждение')}
   else ensure(r.evidence===null,'Черновик не может содержать подтверждение');Object.assign(dest,clone(r));
  }return future;
 }
 return {sourceRows,create,validateDecision,edit,confirm,revoke,restore,checks,kinds,ops,hash:learning.hash};
});
