/* Bounded human-reviewed variants, not a released Curriculum or generator. */
(function(root,factory){const api=factory(typeof module!=='undefined'&&module.exports?require('../engine/geowords.js'):root.GEOWORD_CORE);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GEOWORD_REHEARSAL=api})(typeof globalThis!=='undefined'?globalThis:this,function(core){
 'use strict';
 const copy=v=>JSON.parse(JSON.stringify(v)),ensure=(ok,message)=>{if(!ok)throw Error(message)};
 function validate(p){
  ensure(p?.schemaVersion===1&&p.status==='not_for_live_use'&&p.scope==='l1-first-step-rehearsal'&&p.course?.id===p.id,'Неверный пробный комплект');
  ensure(p.practices?.length===6&&new Set(p.practices.map(x=>x.dictionaryId)).size===6&&p.course.steps.length===2,'Нужны авторское слово и шесть разных вариантов');
  const h=p.humanReview;ensure(h?.markerLocations===true&&h.wordAssembly===true&&h.futureVariantsCovered===false&&h.ageSuitability===null&&h.factAccuracy===null&&h.independentSpatialMemberships===null&&JSON.stringify(h.coveredPracticeIds)===JSON.stringify(p.practices.map(q=>q.id)),'Нельзя расширять область человеческого подтверждения');
  for(const q of [p.authored,...p.practices]){ensure(q.courseId===p.id&&q.markers.length===q.answer.length&&q.clues.length===q.answer.length,'Неверный пробный геоворд');const used=new Set();for(const [i,c] of q.clues.entries()){const m=q.markers.find(m=>m.id===c.markerId);ensure(m&&!used.has(m.id)&&m.letter===q.answer[i]&&c.position===i+1,'Повтор или неверная буква пробного геоворда');used.add(m.id)}}
  ensure(p.course.steps[0].authoredPuzzleId===p.authored.id&&JSON.stringify(p.course.steps[0].wordIds)===JSON.stringify(p.practices.map(x=>x.dictionaryId)),'Комплект не соответствует пробному маршруту');
  ensure(p.course.steps[1].wordIds.length===0&&p.course.steps[1].authoredPuzzleId===p.nextSourcePuzzle.id,'Следующий шаг — только указатель, не утверждённая практика');return p;
 }
 function create(p,sourceSha256){validate(p);ensure(/^[a-f0-9]{64}$/.test(sourceSha256),'Нет привязки пробного сохранения');return {schemaVersion:1,scope:p.scope,status:'trial_only',sourceSha256,beforeRead:false,afterRead:false,progress:core.newProgress(p.course),selected:[],errors:0}}
 function score(p,s){return core.stepScore(s.progress,p.course.steps[0])}
 function phase(p,s){if(!s.beforeRead)return 'before';if(!s.progress.steps.first.authoredSolved)return 'authored';if(!s.afterRead)return 'after';if(score(p,s)===7)return 'next';return 'practice'}
 function puzzle(p,s){const f=phase(p,s);return f==='authored'?p.authored:f==='practice'?p.practices.find(x=>x.dictionaryId===core.nextWordId(p.course,s.progress)):null}
 function restore(p,template,raw){
  ensure(raw?.schemaVersion===1&&raw.scope===template.scope&&raw.status==='trial_only'&&raw.sourceSha256===template.sourceSha256,'Пробное сохранение устарело или относится к другому комплекту');
  const s=copy(template);ensure(typeof raw.beforeRead==='boolean'&&typeof raw.afterRead==='boolean'&&Number.isSafeInteger(raw.errors)&&raw.errors>=0,'Неверное пробное состояние');
  s.progress=core.normalizeProgress(raw.progress,p.course);ensure(JSON.stringify(s.progress)===JSON.stringify(raw.progress),'Некорректный или чужой пробный прогресс');
  ensure((raw.beforeRead||score(p,s)===0)&&(!raw.afterRead||s.progress.steps.first.authoredSolved)&&(!s.progress.steps.first.solvedWordIds.length||raw.afterRead),'Нельзя решать до учебного экрана');
  ensure(!s.progress.steps['next-placeholder'].authoredSolved&&!s.progress.steps['next-placeholder'].solvedWordIds.length,'Следующий комплект ещё не подготовлен');
  const ids=s.progress.steps.first.solvedWordIds;ensure(ids.every((id,i)=>id===p.course.steps[0].wordIds[i]),'Пробные варианты должны идти по порядку');
  s.beforeRead=raw.beforeRead;s.afterRead=raw.afterRead;s.errors=raw.errors;const q=puzzle(p,s);
  ensure(Array.isArray(raw.selected)&&new Set(raw.selected).size===raw.selected.length&&(!q?raw.selected.length===0:raw.selected.length<=q.answer.length&&raw.selected.every(id=>q.markers.some(m=>m.id===id))),'Неверный незавершённый ответ');s.selected=[...raw.selected];return s;
 }
 function acknowledge(p,s){const f=phase(p,s);ensure(f==='before'||f==='after','Учебный экран сейчас не открыт');s[f==='before'?'beforeRead':'afterRead']=true;return s}
 function select(p,s,id){const q=puzzle(p,s);ensure(q&&q.markers.some(m=>m.id===id)&&!s.selected.includes(id)&&s.selected.length<q.answer.length,'Эта буква сейчас недоступна');s.selected.push(id);return s}
 function submit(p,s){const q=puzzle(p,s);if(!q)return {credited:false,advanced:false,reason:'NO_ACTIVE_PUZZLE'};if(s.selected.length!==q.answer.length)return {credited:false,advanced:false,reason:'INCOMPLETE'};
  if(!q.clues.every((c,i)=>c.markerId===s.selected[i])){s.errors++;return {credited:false,advanced:false,reason:'INCORRECT'}}
  const result=core.markSolved(p.course,s.progress,q);if(result.credited){s.progress=result.progress;s.selected=[]}return result;
 }
 return {validate,create,restore,score,phase,puzzle,acknowledge,select,submit};
});
