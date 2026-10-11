/* Curriculum foundation. Not yet wired into the published pilot.
   Reuses the existing 1+6 progression; knowledge is rebuilt from acknowledged
   lessons, never accepted from saved knownFacts/knownPlaces arrays. */
(function(root,factory){
 const core=typeof module!=='undefined'&&module.exports?require('./geowords.js'):root.GEOWORD_CORE;
 const api=factory(core);root.GEOWORD_CURRICULUM=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(core){
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const approved=x=>x?.status==='approved';
 const kinds=['name','directional','relational','superlative','definition','other'];
 const localized=x=>object(x)&&Object.values(x).some(t=>typeof t==='string'&&t.trim());
 const ids=(rows,label)=>{
  if(!Array.isArray(rows))throw Error('Expected '+label+' array');
  const map=new Map();for(const r of rows){if(!object(r)||typeof r.id!=='string'||!r.id||map.has(r.id))throw Error('Invalid/duplicate '+label+' ID');map.set(r.id,r)}return map;
 };
 function validate(c){
  if(c?.schemaVersion!==1||typeof c.id!=='string'||!c.id)throw Error('Invalid curriculum');
  const courses=ids(c.courses,'courses'),facts=ids(c.facts,'facts'),places=ids(c.places,'places'),lexicon=ids(c.lexicon,'lexicon'),puzzles=ids(c.puzzles,'puzzles'),descriptors=ids(c.descriptors,'descriptors');
  if(!Array.isArray(c.courseOrder)||c.courseOrder.length!==courses.size||new Set(c.courseOrder).size!==courses.size||c.courseOrder.some(id=>!courses.has(id)))throw Error('Invalid course order');
  function refs(values,map,label){if(!Array.isArray(values)||new Set(values).size!==values.length||values.some(id=>!approved(map.get(id))))throw Error('Unapproved/invalid '+label+' reference')}
  const anchors=new Map();
  for(const place of places.values())if(approved(place)){
   if(!Array.isArray(place.anchors))throw Error('Missing place anchors');
   for(const a of place.anchors){
    if(typeof a.id!=='string'||!a.id||anchors.has(a.id)||!object(a.maps)||!Object.keys(a.maps).length)throw Error('Invalid anchor');
    for(const point of Object.values(a.maps))for(const p of [point,...(point.pointsTo?[point.pointsTo,...(point.pointsTo.from?[point.pointsTo.from]:[])]:[])]){
     if(!object(p)||![p.x,p.y].every(v=>Number.isFinite(v)&&v>=0&&v<=100))throw Error('Invalid map-relative anchor coordinates');
    }
    anchors.set(a.id,place.id);
   }
  }
  for(const f of facts.values())if(approved(f)){if(!localized(f.text))throw Error('Missing fact text');refs(f.introducesPlaces||[],places,'fact place')}
  for(const d of descriptors.values())if(approved(d)){if(!localized(d.text)||!kinds.includes(d.kind))throw Error('Invalid descriptor text or kind');refs(d.requires,facts,'descriptor fact');refs(d.requiredPlaces,places,'descriptor place');if(!Array.isArray(d.resolvesTo)||!d.resolvesTo.length||new Set(d.resolvesTo).size!==d.resolvesTo.length||d.resolvesTo.some(id=>!anchors.has(id)))throw Error('Invalid descriptor resolution')}
  const stepIds=new Set();
  for(const course of courses.values()){
   if(!Array.isArray(course.steps))throw Error('Missing steps');
   for(const step of course.steps){if(typeof step.id!=='string'||!step.id||stepIds.has(step.id))throw Error('Invalid/duplicate step ID');stepIds.add(step.id)}
   if(!approved(course))continue;
   if(course.target!==7||course.advanceOn!=='solved'||!course.steps.length)throw Error('Curriculum must use authored + six solved words');
   refs(course.requiresFacts,facts,'course fact');
   if(!Array.isArray(course.requiresCourses)||course.requiresCourses.some(id=>!approved(courses.get(id))||c.courseOrder.indexOf(id)>=c.courseOrder.indexOf(course.id)))throw Error('Invalid course dependency');
   for(const step of course.steps){
    if(!approved(step))throw Error('Unapproved step');
    refs(step.requiresFacts,facts,'step fact');refs(step.learnBefore,facts,'before fact');refs(step.unlockAfter,facts,'after fact');refs(step.introducedPlaces,places,'introduced place');refs(step.wordIds,lexicon,'practice word');
    const original=puzzles.get(step.authoredPuzzleId);
    if(!approved(original)||original.courseId!==course.id||typeof original.answer!=='string'||step.wordIds.length!==6)throw Error('Incomplete authored + six practice content');
    const words=[original.answer,...step.wordIds.map(id=>lexicon.get(id).word)].map(w=>typeof w==='string'?w.normalize('NFC').toUpperCase():'');
    if(words.some(w=>!/^\p{L}+$/u.test(w))||new Set(words).size!==7)throw Error('Step requires seven different words');
   }
  }
  return {courses,facts,places,lexicon,puzzles,descriptors,anchors};
 }
 const beforeNeeded=s=>s.learnBefore.length>0||s.introducedPlaces.length>0;
 const score=r=>Number(r.authoredSolved)+r.solvedWordIds.length;
 const finished=(course,state)=>course.steps.every(s=>score(state.steps[s.id])===7);
 const extra=()=>({beforeLearned:false,afterLearned:false,authoredClean:false,cleanWordIds:[],cleanCount:0,errorsByDescriptorKind:{}});
 function empty(c){
  return {schemaVersion:1,curriculumId:c.id,courses:Object.fromEntries(c.courses.map(course=>[course.id,{
   ...core.newProgress(course),steps:Object.fromEntries(course.steps.map(step=>[step.id,{authoredSolved:false,solvedWordIds:[],...extra()}]))
  }])),knownFacts:[],knownPlaces:[]};
 }
 function normalize(c,raw){
  const catalog=validate(c),state=empty(c),knownFacts=new Set(),knownPlaces=new Set();
  const previous=raw?.schemaVersion===1&&raw.curriculumId===c.id&&object(raw.courses)?raw.courses:{};
  const learn=factIds=>{for(const id of factIds){knownFacts.add(id);for(const place of catalog.facts.get(id).introducesPlaces||[])knownPlaces.add(place)}};
  for(const courseId of c.courseOrder){
   const course=catalog.courses.get(courseId),dest=state.courses[courseId];
   if(!approved(course)||!course.requiresFacts.every(id=>knownFacts.has(id))||!course.requiresCourses.every(id=>finished(catalog.courses.get(id),state.courses[id])))continue;
   const base=core.normalizeProgress(previous[courseId],course);
   for(const step of course.steps){
    if(!step.requiresFacts.every(id=>knownFacts.has(id)))break;
    const saved=previous[courseId]?.steps?.[step.id],r=dest.steps[step.id];
    r.beforeLearned=!beforeNeeded(step)||saved?.beforeLearned===true;
    if(!r.beforeLearned)break;
    learn(step.learnBefore);step.introducedPlaces.forEach(id=>knownPlaces.add(id));
    r.authoredSolved=base.steps[step.id].authoredSolved;
    if(!r.authoredSolved)break;
    r.authoredClean=saved?.authoredClean===true;
    r.afterLearned=step.unlockAfter.length===0||saved?.afterLearned===true;
    if(r.afterLearned){learn(step.unlockAfter);r.solvedWordIds=base.steps[step.id].solvedWordIds}
    r.cleanWordIds=Array.isArray(saved?.cleanWordIds)?[...new Set(saved.cleanWordIds.filter(id=>r.solvedWordIds.includes(id)))]:[];
    r.cleanCount=Number(r.authoredClean)+r.cleanWordIds.length;
    if(object(saved?.errorsByDescriptorKind))for(const [kind,n] of Object.entries(saved.errorsByDescriptorKind)){
     if(kinds.includes(kind)&&Number.isSafeInteger(n)&&n>0)r.errorsByDescriptorKind[kind]=n;
    }
    if(score(r)<7)break;
   }
   const next=course.steps.findIndex(s=>score(dest.steps[s.id])<7);dest.stepIndex=next<0?course.steps.length-1:next;
  }
  state.knownFacts=[...knownFacts];state.knownPlaces=[...knownPlaces];return state;
 }
 function availability(c,raw,courseId){
  const catalog=validate(c),state=normalize(c,raw),course=catalog.courses.get(courseId);
  if(!course)return {state,kind:'blocked',reason:'UNKNOWN_COURSE'};
  if(!approved(course))return {state,kind:'blocked',reason:'CONTENT_NOT_APPROVED'};
  if(!course.requiresCourses.every(id=>finished(catalog.courses.get(id),state.courses[id])))return {state,kind:'blocked',reason:'PREREQUISITE_COURSE'};
  if(!course.requiresFacts.every(id=>state.knownFacts.includes(id)))return {state,kind:'blocked',reason:'UNKNOWN_FACTS'};
  if(finished(course,state.courses[courseId]))return {state,kind:'review',courseId};
  const step=course.steps[state.courses[courseId].stepIndex],r=state.courses[courseId].steps[step.id];
  if(!step.requiresFacts.every(id=>state.knownFacts.includes(id)))return {state,kind:'blocked',reason:'UNKNOWN_FACTS'};
  const base={state,courseId,stepId:step.id};
  if(!r.beforeLearned)return {...base,kind:'lesson',phase:'before',factIds:[...step.learnBefore],placeIds:[...step.introducedPlaces]};
  if(!r.authoredSolved)return {...base,kind:'authored',puzzleId:step.authoredPuzzleId};
  if(!r.afterLearned)return {...base,kind:'lesson',phase:'after',factIds:[...step.unlockAfter],placeIds:[]};
  return {...base,kind:'practice',wordIds:step.wordIds.filter(id=>!r.solvedWordIds.includes(id))};
 }
 function acknowledge(c,raw,courseId,stepId,phase){
  const a=availability(c,raw,courseId);
  if(a.kind!=='lesson'||a.stepId!==stepId||a.phase!==phase)return {state:a.state,accepted:false};
  a.state.courses[courseId].steps[stepId][phase==='before'?'beforeLearned':'afterLearned']=true;
  return {state:normalize(c,a.state),accepted:true};
 }
 function complete(c,raw,courseId,puzzle,result={}){
  const a=availability(c,raw,courseId),course=c.courses.find(x=>x.id===courseId);
  const invalid={state:a.state,credited:false,advanced:false,finished:false};
  if(!puzzle||puzzle.review||!['authored','practice'].includes(a.kind))return invalid;
  if((a.kind==='authored'&&puzzle.source!=='authored')||(a.kind==='practice'&&puzzle.source!=='generated'))return invalid;
  const marked=core.markSolved(course,a.state.courses[courseId],puzzle);
  if(!marked.credited)return invalid;
  const old=a.state.courses[courseId].steps[a.stepId],r=marked.progress.steps[a.stepId];
  Object.assign(r,{...old,authoredSolved:r.authoredSolved,solvedWordIds:[...r.solvedWordIds]});
  const errors=object(result.errorsByDescriptorKind)?result.errorsByDescriptorKind:{};
  let count=0;for(const [kind,n] of Object.entries(errors)){
   if(!kinds.includes(kind)||!Number.isSafeInteger(n)||n<0)throw Error('Invalid error count');
   count+=n;r.errorsByDescriptorKind[kind]=(r.errorsByDescriptorKind[kind]||0)+n;
  }
  if(result.clean===true&&count===0){if(puzzle.source==='authored')r.authoredClean=true;else r.cleanWordIds.push(puzzle.dictionaryId)}
  // core returns only the existing score fields. Preserve lesson/telemetry
  // fields on every other step as well, including automatic transitions.
  for(const step of course.steps)if(step.id!==a.stepId)Object.assign(marked.progress.steps[step.id],a.state.courses[courseId].steps[step.id]);
  a.state.courses[courseId]=marked.progress;
  return {state:normalize(c,a.state),credited:true,advanced:marked.advanced,finished:marked.finished,count:marked.count};
 }
 function eligibleDescriptors(c,raw,selectedAnchorIds){
  const catalog=validate(c),state=normalize(c,raw),selected=new Set(selectedAnchorIds);
  if([...selected].some(id=>!state.knownPlaces.includes(catalog.anchors.get(id))))return [];
  return [...catalog.descriptors.values()].filter(d=>approved(d)&&d.requires.every(id=>state.knownFacts.includes(id))&&d.requiredPlaces.every(id=>state.knownPlaces.includes(id))&&d.resolvesTo.filter(id=>selected.has(id)).length===1);
 }
 return {validate,newLearner:c=>{validate(c);return empty(c)},normalize,availability,acknowledge,complete,eligibleDescriptors};
});
