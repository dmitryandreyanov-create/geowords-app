import crypto from 'node:crypto';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import curriculum from '../engine/curriculum.js';
import spatial from '../engine/spatial-semantics.js';
import geography from './spatial-review-model.js';
import mapping from './review-model.js';
import learning from './learning-review-model.js';
import {buildCatalog} from './build_l1_catalog.mjs';
import {buildSpatialReview} from './build_l1_spatial_review.mjs';
import {loadScript} from './build_lexicon_draft.mjs';

// Editorial compiler, not a second generator. Nothing from candidates is
// approved by this module; decisions and geography are separate inputs.
const clone=structuredClone;
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const fingerprint=v=>crypto.createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const same=(a,b)=>fingerprint(a)===fingerprint(b);
const strings=v=>Array.isArray(v)&&v.every(x=>typeof x==='string'&&x)&&new Set(v).size===v.length;
const text=v=>v&&typeof v.en==='string'&&v.en.trim();
const ensure=(ok,message)=>{if(!ok)throw Error(message)};
const membershipPlaces=g=>[...g.places,...g.regions.map(r=>r.placeId),...g.sides.flatMap(s=>[s.oceanId,s.sidePlaceId]),...g.between.flat()];

export function loadL1Sources(){
 const read=name=>JSON.parse(fs.readFileSync('data/import-staging/'+name+'.json','utf8'));
 const sources={draft:read('curriculum-draft'),catalog:read('l1-catalog-draft'),staging:read('l1-staging'),
  otherStaging:read('l2-staging'),assignments:read('review-assignments'),spatial:read('l1-spatial-review-draft'),lexicon:read('lexicon-draft'),
  authoredAnswers:loadScript('data/authored-answer-index.js','GEOWORD_AUTHORED_ANSWERS').map(e=>e.word)};
 ensure(same(buildCatalog(sources.staging,sources.assignments,sources.draft),sources.catalog),'Каталог не соответствует исходникам/назначениям');
 ensure(same(buildSpatialReview(sources.catalog),sources.spatial),'География не соответствует исходным картам');
 return sources;
}

// Scope deliberately limited to L1. Other course drafts are not promoted or
// silently compiled; this package can be composed with reviewed L2 later.
function inventory(s,spatialReview=geography.create(s.spatial)){
 const course=s.draft.courses.find(c=>c.id===s.catalog.courseId);
 ensure(course&&course.steps.length===s.staging.puzzles.length,'Неверный scope курса');
 const facts=s.draft.facts.filter(f=>f.id.startsWith('f-l1-'));
 const plans=s.lexicon.practicePlans.filter(p=>course.steps.some(step=>step.id===p.stepId));
 const wordIds=new Set(plans.flatMap(p=>p.candidateWordIds));
 const rows=[];
 const learningSources=new Map(learning.sourceRows(s).map(r=>[r.key,r.source]));
 const add=(section,id,source,fields)=>rows.push({key:section+':'+id,section,id,sourceSha256:fingerprint(source),fields});
 add('release',s.draft.id,{id:s.draft.id,courseId:course.id,authoredAnswers:s.authoredAnswers},{courseIds:null});
 add('course',course.id,course,{requiresFacts:null,requiresCourses:null});
 s.catalog.places.forEach(p=>add('place',p.id,p,{label:null,kind:null}));
 facts.forEach(f=>add('fact',f.id,learningSources.get('fact:'+f.id),{text:null,introducesPlaces:null,caveatFactIds:null}));
 s.catalog.descriptors.forEach(d=>add('descriptor',d.id,d,{text:null,kind:null,query:null}));
 s.lexicon.entries.filter(e=>wordIds.has(e.id)).forEach(e=>add('word',e.id,e,{word:null,definition:null}));
 course.steps.forEach(step=>{
  const p=s.staging.puzzles.find(p=>p.id===step.authoredPuzzleId),scope=s.spatial.puzzles.find(p=>p.puzzleId===step.authoredPuzzleId);
  ensure(p&&scope,'Не найдено исходное задание');
  add('step',step.id,learningSources.get('step:'+step.id),{requiresFacts:null,learnBefore:null,unlockAfter:null,introducedPlaces:null,wordIds:null,focusPlaceIds:null});
  add('map',p.id,{map:scope.map,asset:p.map,aspect:p.mapAspect},{containsPlaces:null});
  add('puzzle',p.id,{p,assignments:s.assignments.assignments[p.id]||{}},{contentReviewed:null});
 });
 s.catalog.anchors.forEach(a=>add('anchor',a.id,{source:a,
  geographicReview:spatialReview.puzzles.find(p=>p.puzzleId===a.puzzleId)?.reviews.find(r=>r.anchorId===a.id)}, {ownerPlaceId:null}));
 ensure(new Set(rows.map(r=>r.key)).size===rows.length,'Повтор редакторского ID');
 return {course,facts,rows};
}

export function createEditorialTemplate(s,{spatialReview=geography.create(s.spatial)}={}){
 const reviewed=geography.restore(s.spatial,s.catalog,spatialReview);
 const {course,rows}=inventory(s,reviewed);
 return {schemaVersion:1,courseId:course.id,status:'not_for_live_use',
  warning:'Отдельные редакторские решения. null не означает отсутствие фактов. Кандидаты не скопированы в утверждённые поля. SHA связывают подтверждение с источником и решением; это не цифровая подпись автора.',
  records:rows.map(r=>({key:r.key,sourceSha256:r.sourceSha256,status:'editorial_pending',decision:clone(r.fields),evidence:null}))};
}

export function adaptCatalog(s,{editorial,spatialReview=geography.create(s.spatial),assignments=s.assignments,learningReview}={}){
 const {course,facts}=inventory(s),blockers=[],decisions=new Map();
 const block=(code,key,detail)=>blockers.push({code,key,detail});
 const result=()=>({schemaVersion:1,courseId:course.id,ready:blockers.length===0,blockers,curriculum:null});
 let geo,mapped;
 try{geo=geography.restore(s.spatial,s.catalog,spatialReview)}catch(e){block('INVALID_GEOGRAPHY','geography',e.message)}
 try{mapped=mapping.restore([...s.staging.puzzles,...s.otherStaging.puzzles],assignments)}catch(e){block('INVALID_ASSIGNMENTS','assignments',e.message)}
 const rows=inventory(s,geo||geography.create(s.spatial)).rows;
 editorial??=createEditorialTemplate(s,{spatialReview:geo||geography.create(s.spatial)});
 if(learningReview){
  try{
   const hashes=Object.fromEntries(learning.sourceRows(s).map(r=>[r.key,fingerprint(r.source)]));
   const decisionHashes=Object.fromEntries((learningReview.records||[]).map(r=>[r.key,fingerprint(r.decision)]));
   const checked=learning.restore(s,learning.create(s,hashes),learningReview,decisionHashes);
   editorial=clone(editorial);
   for(const row of checked.records){const dest=editorial.records.find(r=>r.key===row.key);ensure(dest,'Нет записи в общем manifest');ensure(dest.status!=='approved'||same(dest,row),'Конфликт с утверждённым общим manifest: '+row.key);Object.assign(dest,row)}
  }catch(e){block('INVALID_LEARNING_REVIEW','learning',e.message);return result()}
 }
 if(editorial?.schemaVersion!==1||editorial.courseId!==course.id||!Array.isArray(editorial.records)){
  block('INVALID_EDITORIAL','editorial','Неверный формат редакторских решений');return result();
 }
 const expected=new Map(rows.map(r=>[r.key,r])),seen=new Set();
 for(const record of editorial.records){
  const row=expected.get(record?.key);
  if(!row||seen.has(record.key)){block('UNKNOWN_OR_DUPLICATE_RECORD',record?.key||'editorial','Неизвестная или повторная запись');continue}
  seen.add(record.key);
  if(record.sourceSha256!==row.sourceSha256){block('STALE_SOURCE',row.key,'Источник изменился после проверки');continue}
  if(record.status!=='approved'){block('EDITORIAL_PENDING',row.key,'Нет явного редакторского утверждения');continue}
  if(!record.decision||Object.keys(row.fields).some(k=>record.decision[k]===null||record.decision[k]===undefined)){
   block('INCOMPLETE_DECISION',row.key,'null — ещё не проверено; нужен явный выбор, в том числе []');continue;
  }
  const e=record.evidence;
  if(!e||typeof e.reviewedBy!=='string'||!e.reviewedBy.trim()||e.sourceSha256!==row.sourceSha256||e.decisionSha256!==fingerprint(record.decision)){
   block('STALE_OR_MISSING_CONFIRMATION',row.key,'Подтверждение не связано с текущим источником и решением');continue;
  }
  decisions.set(row.key,clone(record.decision));
 }
 rows.filter(r=>!seen.has(r.key)).forEach(r=>block('MISSING_RECORD',r.key,'Нет редакторского решения'));
 if(geo)for(const p of geo.puzzles)for(const r of p.reviews)if(r.status!=='approved')block('GEOGRAPHY_PENDING',r.anchorId,'Положение буквы/цель стрелки не проверены');
 if(mapped)for(const p of s.staging.puzzles)for(const clue of p.clues){
  const id=mapped.assignments[p.id]?.[clue.position];
  const original=s.catalog.anchors.find(a=>a.puzzleId===p.id&&a.descriptorId===s.catalog.descriptors.find(d=>d.occurrences.some(o=>o.puzzleId===p.id&&o.position===clue.position))?.id&&a.id===id);
  if(!id||!original)block('CATALOG_MAPPING_MISMATCH',p.id+':'+clue.position,'Назначение изменилось; требуется пересобрать каталог');
  if(!mapped.confirmations[p.id]?.[clue.position])block('CLUE_REVIEW_PENDING',p.id+':'+clue.position,'Назначение получено, содержательная проверка ещё не подтверждена');
 }
 if(blockers.length)return result();
 const get=(section,id)=>decisions.get(section+':'+id);
 let compiled;
 try{
  ensure(same(get('release',s.draft.id).courseIds,[course.id]),'Пакет должен явно выпускать только L1');
  const places=s.catalog.places.map(p=>{const d=get('place',p.id);ensure(text(d.label)&&typeof d.kind==='string'&&d.kind,'Нет названия/типа места '+p.id);return {id:p.id,status:'approved',label:d.label,kind:d.kind,anchors:[]}});
  const placeMap=new Map(places.map(p=>[p.id,p]));
  const requirePlaces=(ids,label)=>ensure(strings(ids)&&ids.every(id=>placeMap.has(id)),'Неверные места: '+label);
  const compiledFacts=facts.map(f=>{
   const d=get('fact',f.id);ensure(text(d.text),'Нет текста факта '+f.id);requirePlaces(d.introducesPlaces,f.id);
   ensure(strings(d.caveatFactIds)&&(f.caveatFactIds||[]).every(id=>d.caveatFactIds.includes(id))&&d.caveatFactIds.every(id=>facts.some(f=>f.id===id)),'Утеряна/неверна оговорка '+f.id);
   return {id:f.id,status:'approved',...d,sourceText:clone(f.text),provenance:clone(f.provenance)};
  });
  const factMap=new Map(compiledFacts.map(f=>[f.id,f]));
  const requireFacts=(ids,label)=>ensure(strings(ids)&&ids.every(id=>factMap.has(id)),'Неверные факты: '+label);
  const maps=s.staging.puzzles.map(p=>{
   const scope=geo.puzzles.find(scope=>scope.puzzleId===p.id),d=get('map',p.id);requirePlaces(d.containsPlaces,p.id);
   // A clean bitmap can serve many quizzes. Their geographic glyph scopes
   // must remain distinct: do not pool all 97 glyphs onto the same asset.
   return {id:p.id+'-map',status:'approved',asset:p.map,aspect:p.mapAspect,sha256:scope.map.sha256,containsPlaces:d.containsPlaces,sourceMapId:scope.map.id};
  });
  const sourceAnchors=new Map();
  for(const a of s.catalog.anchors){
   const scope=geo.puzzles.find(p=>p.puzzleId===a.puzzleId),review=scope.reviews.find(r=>r.anchorId===a.id),owner=get('anchor',a.id).ownerPlaceId;
   ensure(placeMap.has(owner)&&[...review.physical.places,...(review.target?.places||[])].includes(owner),'Владелец якоря не подтверждён географией '+a.id);
   const map=maps.find(m=>m.id===a.puzzleId+'-map');
   const geoPlaces=[...membershipPlaces(review.physical),...(review.target?membershipPlaces(review.target):[])];
   ensure(geoPlaces.every(id=>map.containsPlaces.includes(id)),'География ссылается на отсутствующий на карте объект '+a.id);
   const projected=clone(review);projected.sourceEvidence=clone(review.evidence);projected.evidence.mapId=map.id;
   const anchor={id:a.id,mapId:map.id,x:a.x,y:a.y,pointsTo:clone(a.pointsTo),review:projected};
   ensure(spatial.reviewValid(anchor,projected,map),'Неверная проекция географии '+a.id);
   sourceAnchors.set(a.id,anchor);
   placeMap.get(owner).anchors.push({id:a.id,maps:{[map.id]:{x:a.x,y:a.y,pointsTo:clone(a.pointsTo),spatialReview:projected}}});
  }
  const descriptors=s.catalog.descriptors.map(source=>{
   const d=get('descriptor',source.id),q=d.query;
   ensure(text(d.text)&&spatial.validateQuery(q),'Неверный дескриптор '+source.id);
   requireFacts(q.requires,source.id);requirePlaces(q.requiredPlaces,source.id);
   const query={...clone(q),status:'approved'},resolvesTo=[];
   for(const map of maps){
    const anchors=[...sourceAnchors.values()].filter(a=>a.mapId===map.id);
    const resolution=spatial.resolve({query,anchors,reviews:anchors.map(a=>a.review),map:{...map,anchorIds:anchors.map(a=>a.id)},knownFacts:q.requires,knownPlaces:q.requiredPlaces});
    ensure(resolution.status!=='blocked','Не проверена география дескриптора '+source.id);resolvesTo.push(...resolution.matchedAnchorIds);
   }
   ensure(resolvesTo.length,'Дескриптор не описывает ни один якорь '+source.id);
   return {id:source.id,status:'approved',kind:d.kind,text:d.text,requires:q.requires,requiredPlaces:q.requiredPlaces,query,resolvesTo,sourcePredicate:clone(source.sourcePredicate)};
  });
  const words=rows.filter(r=>r.section==='word').map(r=>{
   const source=s.lexicon.entries.find(e=>e.id===r.id);
   return {id:r.id,status:'approved',...get('word',r.id),origin:source.origin,sourceReference:source.sourceReference,sourceDefinition:clone(source.definition)};
  });
  const steps=course.steps.map(step=>{const d=get('step',step.id);requireFacts(d.requiresFacts,step.id);requireFacts(d.learnBefore,step.id);requireFacts(d.unlockAfter,step.id);requirePlaces(d.introducedPlaces,step.id);requirePlaces(d.focusPlaceIds,step.id);
   ensure(strings(d.wordIds),'Неверный словарь шага '+step.id);
   return {id:step.id,status:'approved',authoredPuzzleId:step.authoredPuzzleId,requiresFacts:d.requiresFacts,learnBefore:d.learnBefore,unlockAfter:d.unlockAfter,introducedPlaces:d.introducedPlaces,wordIds:d.wordIds,
    generatedPractice:{mapId:step.authoredPuzzleId+'-map',focusPlaceIds:d.focusPlaceIds}};
  });
  const puzzles=s.staging.puzzles.map(p=>{
   ensure(get('puzzle',p.id).contentReviewed===true,'Не проверено авторское задание '+p.id);
   return {...clone(p),status:'approved',courseId:course.id,mapId:p.id+'-map',
    clues:p.clues.map(c=>({...clone(c),markerId:mapped.assignments[p.id][c.position]}))};
  });
  const courseDecision=get('course',course.id);requireFacts(courseDecision.requiresFacts,course.id);
  ensure(same(courseDecision.requiresCourses,[]),'L1 не может ссылаться на невыпущенные курсы');
  compiled={schemaVersion:1,id:s.draft.id+'-l1',status:'approved',courseOrder:[course.id],courses:[{id:course.id,title:course.title,status:'approved',target:7,advanceOn:'solved',...courseDecision,steps}],places,facts:compiledFacts,lexicon:words,descriptors,puzzles,maps,authoredAnswerWords:clone(s.authoredAnswers)};
  curriculum.validate(compiled);
  // Independent authored resolution with actual lesson timing, never answer
  // inference. Preview candidate knowledge is not accepted here.
  const knownFacts=new Set(courseDecision.requiresFacts),knownPlaces=new Set();
  const learn=ids=>{ids.forEach(id=>{knownFacts.add(id);factMap.get(id).introducesPlaces.forEach(id=>knownPlaces.add(id))});for(const id of knownFacts)ensure(factMap.get(id).caveatFactIds.every(c=>knownFacts.has(c)),'Оговорка ещё не изучена: '+id)};
  learn(courseDecision.requiresFacts);
  for(const step of steps){
   ensure(step.requiresFacts.every(id=>knownFacts.has(id)),'Будущий prerequisite шага '+step.id);
   learn(step.learnBefore);step.introducedPlaces.forEach(id=>knownPlaces.add(id));
   const p=puzzles.find(p=>p.id===step.authoredPuzzleId),map=maps.find(m=>m.id===p.mapId),anchors=p.markers.map(m=>sourceAnchors.get(m.id));
   for(const clue of p.clues){
    const source=s.catalog.descriptors.find(d=>d.occurrences.some(o=>o.puzzleId===p.id&&o.position===clue.position)),d=descriptors.find(d=>d.id===source.id);
    const resolution=spatial.resolve({query:d.query,anchors,reviews:anchors.map(a=>a.review),map:{...map,anchorIds:anchors.map(a=>a.id)},knownFacts:[...knownFacts],knownPlaces:[...knownPlaces]});
    ensure(resolution.status==='unique'&&resolution.matchedAnchorIds[0]===clue.markerId,'Авторская подсказка неоднозначна/использует неизвестный факт '+p.id+':'+clue.position);
   }
   learn(step.unlockAfter);
  }
 }catch(e){block('INVALID_APPROVED_CONTENT','curriculum',e.message);return result()}
 // Six words must really fit, using the shared generator and real progression.
 // This is bounded geometric evidence, not an editorial approval or promise
 // of infinite variants. All dry-run progress is discarded.
 try{
  let state=curriculum.newLearner(compiled);let generated=0;
  for(const step of compiled.courses[0].steps){
   if(curriculum.availability(compiled,state,course.id).kind==='lesson')state=curriculum.acknowledge(compiled,state,course.id,step.id,'before').state;
   const authored=compiled.puzzles.find(p=>p.id===step.authoredPuzzleId),done=curriculum.complete(compiled,state,course.id,authored);
   ensure(done.credited,'Не зачтено авторское слово '+step.id);state=done.state;
   if(curriculum.availability(compiled,state,course.id).kind==='lesson')state=curriculum.acknowledge(compiled,state,course.id,step.id,'after').state;
   for(let i=0;i<6;i++){
    const practice=curriculum.generatePractice(compiled,state,course.id,{variant:i});
    ensure(practice.kind==='generated','Нет безопасной практики '+step.id+': '+practice.reason);
    const solved=curriculum.complete(compiled,practice.state,course.id,practice.puzzle);ensure(solved.credited,'Практика не прошла перепроверку');state=solved.state;generated++;
   }
  }
  return {...result(),curriculum:compiled,geometryCheck:{status:'verified_bounded',generatedWords:generated,learnerProgressPersisted:false}};
 }catch(e){block('GEOMETRY_NOT_VERIFIED','practice',e.message);return result()}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const s=loadL1Sources(),args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);if(i<0)return undefined;ensure(args[i+1]&&!args[i+1].startsWith('--'),'Нет пути для '+name);return args[i+1]};
 const read=path=>path?JSON.parse(fs.readFileSync(path,'utf8')):undefined;
 const spatialReview=read(option('--spatial'));
 const result=args.includes('--template')?createEditorialTemplate(s,{spatialReview}):adaptCatalog(s,{editorial:read(option('--editorial')),spatialReview,assignments:read(option('--assignments')),learningReview:read(option('--learning'))});
 console.log(JSON.stringify(result,null,2));
 if(args.includes('--require-ready')&&!result.ready)process.exitCode=1;
}
