/* Curriculum foundation. Not yet wired into the published pilot.
   Reuses the existing 1+6 progression; knowledge is rebuilt from acknowledged
   lessons, never accepted from saved knownFacts/knownPlaces arrays. */
(function(root,factory){
 const core=typeof module!=='undefined'&&module.exports?require('./geowords.js'):root.GEOWORD_CORE;
 const semantic=typeof module!=='undefined'&&module.exports?require('./semantic.js'):root.GEOWORD_SEMANTIC;
 const spatial=typeof module!=='undefined'&&module.exports?require('./spatial-semantics.js'):root.GEOWORD_SPATIAL;
 const api=factory(core,semantic,spatial);root.GEOWORD_CURRICULUM=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(core,semantic,spatial){
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
  const anchors=new Map(),maps=ids(c.maps||[],'maps');
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
  for(const d of descriptors.values())if(approved(d)){
   if(!localized(d.text)||!kinds.includes(d.kind))throw Error('Invalid descriptor text or kind');refs(d.requires,facts,'descriptor fact');refs(d.requiredPlaces,places,'descriptor place');
   if(!Array.isArray(d.resolvesTo)||!d.resolvesTo.length||new Set(d.resolvesTo).size!==d.resolvesTo.length||d.resolvesTo.some(id=>!anchors.has(id)))throw Error('Invalid descriptor resolution');
   if(d.query&&(!spatial?.validateQuery(d.query)||!approved(d.query)||!sameRefs(d.query.requires,d.requires)||!sameRefs(d.query.requiredPlaces,d.requiredPlaces)))throw Error('Inconsistent spatial descriptor requirements');
  }
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
    if(step.generatedPractice){
     const cfg=step.generatedPractice,map=maps.get(cfg.mapId);
     if(!approved(map)||!/^\.\/assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(?:webp|png|jpe?g|svg)$/.test(map.asset)||!mapGeometry(map)||!/^[a-f0-9]{64}$/.test(map.sha256))throw Error('Missing approved practice map');
     refs(map.containsPlaces,places,'map visible place');
     const retained=course.steps.slice(0,course.steps.indexOf(step)+1).flatMap(s=>[...s.introducedPlaces,
      ...[...s.learnBefore,...s.unlockAfter].flatMap(id=>facts.get(id).introducesPlaces||[])]);
     if(retained.some(id=>!map.containsPlaces.includes(id)))throw Error('Practice map loses a previously introduced course object');
     refs(cfg.focusPlaceIds,places,'practice focus');
     const introduced=new Set([...step.introducedPlaces,...[...step.learnBefore,...step.unlockAfter].flatMap(id=>facts.get(id).introducesPlaces||[])]);
     if(cfg.focusPlaceIds.some(id=>!introduced.has(id)))throw Error('Practice focus must be introduced by this step');
     if(cfg.focusPlaceIds.some(id=>!map.containsPlaces.includes(id)))throw Error('Practice focus not present on map');
     if(!Array.isArray(c.authoredAnswerWords)||!c.authoredAnswerWords.length||c.authoredAnswerWords.some(w=>typeof w!=='string'||!/^\p{L}+$/u.test(w)))throw Error('Global authored answer index required');
     const forbidden=new Set([...c.authoredAnswerWords,...[...puzzles.values()].map(p=>p.answer)].filter(w=>typeof w==='string').map(w=>w.normalize('NFC').toUpperCase()));
     for(const id of step.wordIds){const e=lexicon.get(id);if(!localized(e.definition)||!e.definition.en?.trim()||Array.from(e.word).length>15||forbidden.has(e.word.normalize('NFC').toUpperCase()))throw Error('Invalid definition or authored spoiler in practice')}
    }
   }
  }
  return {courses,facts,places,lexicon,puzzles,descriptors,anchors,maps};
 }
 const sameRefs=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every(id=>b.includes(id));
 function mapGeometry(map){
  const match=typeof map?.aspect==='string'&&map.aspect.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  return match&&Number.isFinite(Number(match[1]))&&Number.isFinite(Number(match[2]))&&Number(match[1])>0&&Number(match[2])>0?{widthPx:300,heightPerWidth:Number(match[2])/Number(match[1])}:null;
 }
 const beforeNeeded=s=>s.learnBefore.length>0||s.introducedPlaces.length>0;
 const score=r=>Number(r.authoredSolved)+r.solvedWordIds.length;
 const finished=(course,state)=>course.steps.every(s=>score(state.steps[s.id])===7);
 const extra=()=>({beforeLearned:false,afterLearned:false,authoredClean:false,cleanWordIds:[],cleanCount:0,errorsByDescriptorKind:{}});
 function empty(c){
  return {schemaVersion:1,curriculumId:c.id,courses:Object.fromEntries(c.courses.map(course=>[course.id,{
   ...core.newProgress(course),steps:Object.fromEntries(course.steps.map(step=>[step.id,{authoredSolved:false,solvedWordIds:[],...extra()}]))
  }])),knownFacts:[],knownPlaces:[],generationHistory:[]};
 }
 function normalize(c,raw){
  const catalog=validate(c),state=empty(c),knownFacts=new Set(),knownPlaces=new Set();
  const previous=raw?.schemaVersion===1&&raw.curriculumId===c.id&&object(raw.courses)?raw.courses:{};
  const learn=factIds=>{for(const id of factIds){knownFacts.add(id);for(const place of catalog.facts.get(id).introducesPlaces||[])knownPlaces.add(place)}};
  for(const courseId of c.courseOrder){
   const course=catalog.courses.get(courseId),dest=state.courses[courseId];
   if(c.status!==undefined&&!approved(c)||!approved(course)||!course.requiresFacts.every(id=>knownFacts.has(id))||!course.requiresCourses.every(id=>finished(catalog.courses.get(id),state.courses[id])))continue;
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
  state.knownFacts=[...knownFacts];state.knownPlaces=[...knownPlaces];
  if(Array.isArray(raw?.generationHistory)&&raw.schemaVersion===1&&raw.curriculumId===c.id)for(const h of raw.generationHistory.slice(-20)){
   if(!object(h))continue;
   const course=catalog.courses.get(h.courseId),step=course?.steps.find(s=>s.id===h.stepId),entry=catalog.lexicon.get(h.dictionaryId);
   const r=state.courses[h.courseId]?.steps[h.stepId];
   if(!approved(course)||!step?.generatedPractice||step.generatedPractice.mapId!==h.mapId||!step.wordIds.includes(h.dictionaryId)||!approved(entry)||
    !r?.authoredSolved||!r.afterLearned||!Array.isArray(h.descriptorIds)||h.descriptorIds.length!==Array.from(entry.word).length||new Set(h.descriptorIds).size!==h.descriptorIds.length||
    h.descriptorIds.some(id=>{const d=catalog.descriptors.get(id);return !approved(d)||!d.query||!d.requires.every(f=>knownFacts.has(f))||!d.requiredPlaces.every(p=>knownPlaces.has(p))}))continue;
   state.generationHistory.push({courseId:course.id,stepId:step.id,dictionaryId:entry.id,mapId:h.mapId,descriptorIds:[...h.descriptorIds].sort()});
  }
  return state;
 }
 function availability(c,raw,courseId){
  const catalog=validate(c),state=normalize(c,raw),course=catalog.courses.get(courseId);
  if(!course)return {state,kind:'blocked',reason:'UNKNOWN_COURSE'};
  if(!approved(course))return {state,kind:'blocked',reason:'CONTENT_NOT_APPROVED'};
  if(c.status!==undefined&&!approved(c))return {state,kind:'blocked',reason:'CURRICULUM_NOT_APPROVED'};
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
  const step=course.steps.find(s=>s.id===a.stepId);
  if(a.kind==='practice'&&step.generatedPractice&&!verifyPractice(c,a.state,courseId,puzzle))return invalid;
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
  return [...catalog.descriptors.values()].filter(d=>approved(d)&&!d.query&&d.requires.every(id=>state.knownFacts.includes(id))&&d.requiredPlaces.every(id=>state.knownPlaces.includes(id))&&d.resolvesTo.filter(id=>selected.has(id)).length===1);
 }
 function practiceContext(c,a,course,step){
  const catalog=validate(c),cfg=step.generatedPractice,map=catalog.maps.get(cfg.mapId),geometry=mapGeometry(map);
  const pool=[];
  for(const place of catalog.places.values())if(approved(place)&&a.state.knownPlaces.includes(place.id))for(const anchor of place.anchors){
   const position=anchor.maps[map.id];if(!position)continue;
   const value={id:anchor.id,mapId:map.id,x:position.x,y:position.y,pointsTo:position.pointsTo??null,owner:place.id,review:position.spatialReview};
   if(!spatial.reviewValid(value,value.review,map))continue;
   if(![...value.review.physical.places,...(value.review.target?.places||[])].includes(place.id))continue;
   pool.push(value);
  }
  const descriptors=[...catalog.descriptors.values()].filter(d=>approved(d)&&d.query&&d.text.en?.trim()&&d.requires.every(id=>a.state.knownFacts.includes(id))&&d.requiredPlaces.every(id=>a.state.knownPlaces.includes(id)));
  // Explicit approved study focus. Prior global knowledge or review mode does
  // not silently turn off the >=35% requirement for this step's focus.
  const freshPlaces=cfg.focusPlaceIds;
  const freshAnchorIds=pool.filter(p=>freshPlaces.includes(p.owner)).map(p=>p.id);
  function resolve(d,selected){return spatial.resolve({query:d.query,anchors:selected,reviews:selected.map(a=>a.review),map:{...map,anchorIds:selected.map(a=>a.id)},knownFacts:a.state.knownFacts,knownPlaces:a.state.knownPlaces})}
  const cues=(anchor,selected)=>descriptors.filter(d=>{
   const result=resolve(d,selected);
   return result.status==='unique'&&result.matchedAnchorIds[0]===anchor.id&&sameRefs(d.resolvesTo.filter(id=>selected.some(a=>a.id===id)),result.matchedAnchorIds);
  });
  return {catalog,map,geometry,pool,descriptors,freshAnchorIds,freshPlaces,cues,resolve};
 }
 function generatePractice(c,raw,courseId,{variant=0,review=false,stepId}={}){
  const a=availability(c,raw,courseId),blocked=reason=>({state:a.state,kind:'blocked',reason,puzzle:null});
  if(!semantic?.generateAnchored||!spatial)return blocked('MISSING_GENERATION_ENGINE');
  if(!Number.isSafeInteger(variant)||variant<0)return blocked('INVALID_VARIANT');
  if(!review&&a.kind!=='practice')return blocked(a.reason||'PRACTICE_NOT_AVAILABLE');
  if(review&&a.kind!=='review')return blocked('REVIEW_NOT_AVAILABLE');
  if(!approved(c))return blocked('CURRICULUM_NOT_APPROVED');
  const course=c.courses.find(s=>s.id===courseId);
  const step=review?(stepId?course.steps.find(s=>s.id===stepId):course.steps.at(-1)):course.steps.find(s=>s.id===a.stepId);
  if(!step)return blocked('UNKNOWN_STEP');
  if(!step.generatedPractice)return blocked('PRACTICE_CONFIG_MISSING');
  const ctx=practiceContext(c,a,course,step),wordId=review?step.wordIds[variant%6]:a.wordIds[0],entry=ctx.catalog.lexicon.get(wordId);
  if(ctx.freshPlaces.length&&!ctx.freshAnchorIds.length)return blocked('NEW_OBJECT_ANCHORS_MISSING');
  const seed=c.id+':'+courseId+':'+step.id+':'+wordId+':'+variant;
  const avoidDescriptorSets=a.state.generationHistory.filter(h=>h.courseId===courseId&&h.stepId===step.id&&h.dictionaryId===wordId&&h.mapId===ctx.map.id).map(h=>h.descriptorIds.join('|'));
  const result=semantic.generateAnchored({word:entry.word,anchors:ctx.pool,cues:ctx.cues,geometry:ctx.geometry,seed,freshAnchorIds:ctx.freshAnchorIds,avoidDescriptorSets});
  if(!result)return blocked('NO_SAFE_UNAMBIGUOUS_LAYOUT');
  const puzzle={...result,id:'gen:curriculum:'+seed,source:'generated',review,curriculumId:c.id,courseId,stepId:step.id,stepIndex:course.steps.indexOf(step),dictionaryId:entry.id,
   map:ctx.map.asset,mapId:ctx.map.id,mapAspect:ctx.map.aspect,letterMode:'overlay',definition:entry.definition.en,
   title:review?'Review':`Word ${2+a.state.courses[courseId].steps[step.id].solvedWordIds.length}/7`,introFacts:[],nextFacts:[]};
  if(!verifyPractice(c,a.state,courseId,puzzle))return blocked('GENERATED_VERIFICATION_FAILED');
  a.state.generationHistory.push({courseId,stepId:step.id,dictionaryId:entry.id,mapId:ctx.map.id,descriptorIds:puzzle.clues.map(c=>c.descriptorId).sort()});
  return {state:normalize(c,a.state),kind:'generated',puzzle};
 }
 function verifyPractice(c,raw,courseId,puzzle){
  const a=availability(c,raw,courseId),course=c.courses.find(s=>s.id===courseId);
  if(!approved(c)||!course||!puzzle||puzzle.source!=='generated'||puzzle.courseId!==courseId||puzzle.curriculumId!==c.id||
   (puzzle.review?a.kind!=='review':a.kind!=='practice'))return false;
  const step=course.steps.find(s=>s.id===puzzle.stepId);
  if(!step?.generatedPractice||puzzle.stepIndex!==course.steps.indexOf(step)||(!puzzle.review&&a.stepId!==step.id)||
   !(puzzle.review?step.wordIds:a.wordIds).includes(puzzle.dictionaryId))return false;
  const ctx=practiceContext(c,a,course,step),entry=ctx.catalog.lexicon.get(puzzle.dictionaryId),letters=Array.from(entry.word);
  if(puzzle.answer!==entry.word||puzzle.definition!==entry.definition.en||puzzle.map!==ctx.map.asset||puzzle.mapId!==ctx.map.id||puzzle.mapAspect!==ctx.map.aspect||
   !Array.isArray(puzzle.markers)||!Array.isArray(puzzle.clues)||puzzle.markers.length!==letters.length||puzzle.clues.length!==letters.length||
   new Set(puzzle.markers.map(m=>m?.id)).size!==letters.length)return false;
  const selected=puzzle.markers.map(m=>ctx.pool.find(a=>a.id===m?.id));if(selected.some(a=>!a))return false;
  for(const [i,marker] of puzzle.markers.entries()){
   const source=selected[i],clue=puzzle.clues[i];
   if(marker.letter!==letters[i]||marker.x!==source.x||marker.y!==source.y||JSON.stringify(marker.pointsTo??null)!==JSON.stringify(source.pointsTo)||
    clue?.position!==i+1||clue.markerId!==source.id)return false;
   const d=ctx.descriptors.find(d=>d.id===clue.descriptorId);if(!d||!ctx.cues(source,selected).some(cue=>cue.id===d.id))return false;
   const label=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth'][i];
   if(clue.text!=='The '+label+' letter — '+d.text.en)return false;
   for(let j=i+1;j<selected.length;j++)if(semantic.distance(source,selected[j],ctx.geometry)<semantic.MIN_SEPARATION)return false;
  }
  if(!semantic.arrowsClear(selected,ctx.geometry))return false;
  const actual=selected.filter(a=>ctx.freshAnchorIds.includes(a.id)).length;
  const required=ctx.freshPlaces.length?Math.ceil(letters.length*.35):0;
  return puzzle.freshCount===actual&&puzzle.requiredFreshCount===required&&actual>=required&&puzzle.descriptorSignature===puzzle.clues.map(c=>c.descriptorId).sort().join('|');
 }
 return {validate,newLearner:c=>{validate(c);return empty(c)},normalize,availability,acknowledge,complete,eligibleDescriptors,generatePractice,verifyPractice};
});
