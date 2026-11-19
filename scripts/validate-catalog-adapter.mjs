import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {adaptCatalog,createEditorialTemplate,fingerprint,loadL1Sources} from '../tools/catalog-adapter.mjs';
import {generatorFixture} from './validate-curriculum-generator.mjs';
import geography from '../tools/spatial-review-model.js';
import mapping from '../tools/review-model.js';
import curriculum from '../engine/curriculum.js';

const real=loadL1Sources(),sourceBefore=fingerprint(real),template=createEditorialTemplate(real),report=adaptCatalog(real);
assert.equal(report.ready,false);assert.equal(report.curriculum,null);
assert.equal(report.blockers.filter(b=>b.code==='GEOGRAPHY_PENDING').length,97);
assert.equal(report.blockers.filter(b=>b.code==='CLUE_REVIEW_PENDING').length,97);
assert(!report.blockers.some(b=>b.code==='CATALOG_MAPPING_MISMATCH'),'all received assignments retained');
assert(template.records.every(r=>r.status==='editorial_pending'&&r.evidence===null&&Object.values(r.decision).every(v=>v===null)));
assert.equal(template.records.filter(r=>r.key.startsWith('word:')).length,60);
assert.equal(template.records.filter(r=>r.key.startsWith('fact:')).length,23);
assert.equal(fingerprint(real),sourceBefore,'real pending sources must remain immutable');
// Merely changing statuses cannot manufacture approvals.
const fake=structuredClone(template);fake.records.forEach(r=>{r.status='approved'});
assert.equal(adaptCatalog(real,{editorial:fake}).curriculum,null);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'geowords-adapter-'));
try{
 const file=path.join(temp,'decisions.json');fs.writeFileSync(file,JSON.stringify(template));
 const cmd=spawnSync(process.execPath,['tools/catalog-adapter.mjs','--editorial',file,'--require-ready'],{encoding:'utf8'});
 assert.equal(cmd.status,1);assert.equal(JSON.parse(cmd.stdout).curriculum,null);
}finally{fs.rmSync(temp,{recursive:true,force:true})}

// Every approval from here is SYNTHETIC. No real record is filled/approved.
function fixture(){
 const {c,map,one}=generatorFixture(),courseId='oceans-continents',answer='SYNTHETIC';
 const places=c.places.slice(0,9).map(p=>({...structuredClone(p),label:{en:p.id},kind:'synthetic'}));
 const markers=places.map((p,i)=>({id:p.anchors[0].id,letter:answer[i],x:p.anchors[0].maps[map.id].x,y:p.anchors[0].maps[map.id].y}));
 const asset='./assets/synthetic-map.webp',p={id:'l1-fixture',source:'authored',status:'editorial_pending',answer,map:asset,mapAspect:map.aspect,
  markers,clues:markers.map((m,i)=>({position:i+1,text:'Synthetic authored clue '+i,answerLetter:m.letter,markerId:m.id,candidateMarkerIds:[m.id]}))};
 const descriptors=places.map((place,i)=>({id:'fixture-descriptor-'+i,sourcePredicate:{en:'Synthetic phrase '+i},kind:'name',status:'editorial_pending',
  occurrences:[{puzzleId:p.id,position:i+1,selectedAnchorId:markers[i].id}],candidateQuery:{op:'place',placeId:place.id,channel:'either',requires:['f-l1-fixture'],requiredPlaces:[place.id],status:'editorial_pending'}}));
 const anchors=markers.map((m,i)=>({...structuredClone(m),puzzleId:p.id,mapId:asset,pointsTo:null,descriptorId:descriptors[i].id}));
 const scope={puzzleId:p.id,map:{id:asset,sha256:map.sha256,anchorIds:markers.map(m=>m.id)},reviews:places.map((place,i)=>{
  const original=place.anchors[0].maps[map.id].spatialReview;
  const binding={mapId:asset,mapSha256:map.sha256,x:markers[i].x,y:markers[i].y,pointsTo:null};
  return {anchorId:markers[i].id,sourceBinding:binding,status:'editorial_pending',complete:false,physical:null,target:null,evidence:null,syntheticMembership:original.physical};
 })};
 const step={...structuredClone(one),id:'l1-fixture-step',authoredPuzzleId:p.id,status:'editorial_pending'};
 const s={draft:{id:'synthetic-adapter-only',courses:[{id:courseId,title:'Synthetic only',steps:[step]}],facts:[{id:'f-l1-fixture',status:'editorial_pending',text:{en:'Synthetic lesson'},introducesPlaces:null,caveatFactIds:[],provenance:{source:'synthetic only'}}]},
  catalog:{courseId,places:places.map(({anchors,...p})=>({...p,status:'editorial_pending',anchors:[]})),anchors,descriptors},staging:{puzzles:[p]},otherStaging:{puzzles:[]},
  assignments:{version:1,generatedFrom:'author map review',sourceQuizCount:1,assignments:{}},spatial:{puzzles:[scope]},
  lexicon:{entries:c.lexicon.slice(0,6).map(w=>({...w,status:'editorial_pending',sourceReference:'synthetic only'})),practicePlans:[{stepId:step.id,candidateWordIds:step.wordIds}]},authoredAnswers:['SYNTHETIC']};
 const editorial=createEditorialTemplate(s);
 const values={release:{courseIds:[courseId]},course:{requiresFacts:[],requiresCourses:[]},place:null,
  fact:{text:{en:'Synthetic lesson'},introducesPlaces:places.map(p=>p.id),caveatFactIds:[]},
  step:{requiresFacts:[],learnBefore:['f-l1-fixture'],unlockAfter:[],introducedPlaces:[],wordIds:step.wordIds,focusPlaceIds:places.map(p=>p.id)},
  map:{containsPlaces:places.map(p=>p.id)},puzzle:{contentReviewed:true}};
 for(const row of editorial.records){
  const [kind,id]=row.key.split(':');let decision=values[kind];
  if(kind==='place'){const p=places.find(p=>p.id===id);decision={label:p.label,kind:p.kind}}
  if(kind==='word'){const w=s.lexicon.entries.find(w=>w.id===id);decision={word:w.word,definition:w.definition}}
  if(kind==='descriptor'){const d=descriptors.find(d=>d.id===id);decision={text:d.sourcePredicate,kind:d.kind,query:d.candidateQuery}}
  if(kind==='anchor')decision={ownerPlaceId:places[markers.findIndex(m=>m.id===id)].id};
  row.status='approved';row.decision=structuredClone(decision);confirm(row);
 }
 const spatialReview=geography.create(s.spatial);
 for(const r of spatialReview.puzzles[0].reviews){r.physical=structuredClone(r.syntheticMembership);geography.confirm(spatialReview,p.id,r.anchorId)}
 const boundTemplate=createEditorialTemplate(s,{spatialReview});
 for(const row of boundTemplate.records){const old=editorial.records.find(r=>r.key===row.key);row.status='approved';row.decision=old.decision;confirm(row)}
 const mapped=mapping.create([p]);p.clues.forEach(c=>mapping.confirm(mapped,p,c));
 return {s,editorial:boundTemplate,spatialReview,assignments:mapping.exportReview([p],mapped)};
}
function confirm(r){r.evidence={reviewedBy:'SYNTHETIC TEST ONLY',sourceSha256:r.sourceSha256,decisionSha256:fingerprint(r.decision)}}
const f=fixture(),before=fingerprint(f),valid=adaptCatalog(f.s,f);
assert(valid.ready,JSON.stringify(valid.blockers));assert(valid.curriculum);assert.equal(valid.geometryCheck.generatedWords,6);
assert.equal(valid.geometryCheck.learnerProgressPersisted,false);assert.equal(fingerprint(f),before);
assert.equal(curriculum.availability(valid.curriculum,curriculum.newLearner(valid.curriculum),'oceans-continents').kind,'lesson');
const checks=[
 ['STALE_SOURCE',x=>{x.s.catalog.places[0].label.en='Changed source'}],
 ['STALE_OR_MISSING_CONFIRMATION',x=>{x.editorial.records.find(r=>r.key.startsWith('word:')).decision.definition.en='Changed definition'}],
 ['INCOMPLETE_DECISION',x=>{const r=x.editorial.records.find(r=>r.key.startsWith('step:'));r.decision.learnBefore=null;confirm(r)}],
 ['UNKNOWN_OR_DUPLICATE_RECORD',x=>{x.editorial.records.push(structuredClone(x.editorial.records[0]))}],
 ['MISSING_RECORD',x=>{x.editorial.records.pop()}],
 ['INVALID_GEOGRAPHY',x=>{x.spatialReview.puzzles[0].reviews[0].evidence.x++}],
 ['GEOGRAPHY_PENDING',x=>{geography.revoke(x.spatialReview,'l1-fixture',x.spatialReview.puzzles[0].reviews[0].anchorId)}],
 ['STALE_SOURCE',x=>{x.spatialReview.puzzles[0].reviews[0].physical.hemispheres=['north','east']}],
 ['CLUE_REVIEW_PENDING',x=>{delete x.assignments.confirmations['l1-fixture']['1']}],
 ['INVALID_APPROVED_CONTENT',x=>{const r=x.editorial.records.find(r=>r.key.startsWith('anchor:'));r.decision.ownerPlaceId='foreign';confirm(r)}],
 ['INVALID_APPROVED_CONTENT',x=>{const r=x.editorial.records.find(r=>r.key.startsWith('step:'));r.decision.learnBefore=[];r.decision.unlockAfter=['f-l1-fixture'];confirm(r)}],
 ['INVALID_APPROVED_CONTENT',x=>{const r=x.editorial.records.find(r=>r.key.startsWith('map:'));r.decision.containsPlaces.pop();confirm(r)}],
 ['INVALID_APPROVED_CONTENT',x=>{const r=x.editorial.records.find(r=>r.key.startsWith('word:'));r.decision.word='SYNTHETIC';confirm(r)}],
 ['GEOMETRY_NOT_VERIFIED',x=>{const r=x.editorial.records.find(r=>r.key.startsWith('word:'));r.decision.word='EXTRALONGWORD';confirm(r)}],
];
for(const [code,mutate] of checks){const x=structuredClone(f);mutate(x);const blocked=adaptCatalog(x.s,x);assert(!blocked.ready);assert.equal(blocked.curriculum,null);assert(blocked.blockers.some(b=>b.code===code),JSON.stringify(blocked.blockers))}
// An independently ambiguous query cannot be approved through the assigned
// answer, even with valid confirmations and geometry for every glyph.
const ambiguous=structuredClone(f),r=ambiguous.spatialReview.puzzles[0].reviews[1];r.physical.places.push(f.s.catalog.places[0].id);geography.confirm(ambiguous.spatialReview,'l1-fixture',r.anchorId);
const updated=createEditorialTemplate(ambiguous.s,{spatialReview:ambiguous.spatialReview});
for(const row of ambiguous.editorial.records){row.sourceSha256=updated.records.find(r=>r.key===row.key).sourceSha256;confirm(row)}
const resolutionFailure=adaptCatalog(ambiguous.s,ambiguous);
assert.equal(resolutionFailure.curriculum,null);assert(resolutionFailure.blockers.some(b=>b.code==='INVALID_APPROVED_CONTENT'&&b.detail.includes('неоднозначна')));
const caveat=structuredClone(f);caveat.s.draft.facts[0].caveatFactIds=['f-l1-fixture'];
const changedFact=createEditorialTemplate(caveat.s,{spatialReview:caveat.spatialReview}).records.find(r=>r.key==='fact:f-l1-fixture');
const factReview=caveat.editorial.records.find(r=>r.key==='fact:f-l1-fixture');factReview.sourceSha256=changedFact.sourceSha256;confirm(factReview);
assert(adaptCatalog(caveat.s,caveat).blockers.some(b=>b.code==='INVALID_APPROVED_CONTENT'&&b.detail.includes('оговорка')),'source caveat cannot be silently dropped');
// Same bitmap, separate glyph scopes. Scope IDs are stable and evidence is
// remapped only after validation against the exact original asset + glyph.
assert.equal(valid.curriculum.maps[0].id,'l1-fixture-map');
const anchor=valid.curriculum.places[0].anchors[0],geo=anchor.maps['l1-fixture-map'].spatialReview;
assert.equal(geo.sourceEvidence.mapId,f.s.staging.puzzles[0].map);assert.equal(geo.evidence.mapId,'l1-fixture-map');
const twice=structuredClone(f),p2=structuredClone(twice.s.staging.puzzles[0]),originalId=p2.id;
p2.id='l1-fixture-two';p2.answer='TESTWORDS';
p2.markers.forEach((m,i)=>{m.id+='-copy';m.letter=p2.answer[i]});
p2.clues.forEach((c,i)=>{c.markerId+='-copy';c.candidateMarkerIds=[c.markerId];c.answerLetter=p2.answer[i]});
twice.s.staging.puzzles.push(p2);twice.s.authoredAnswers.push(p2.answer);
const s2=structuredClone(twice.s.draft.courses[0].steps[0]);s2.id='l1-fixture-step-two';s2.authoredPuzzleId=p2.id;
twice.s.draft.courses[0].steps.push(s2);twice.s.lexicon.practicePlans.push({...structuredClone(twice.s.lexicon.practicePlans[0]),stepId:s2.id});
twice.s.catalog.anchors.push(...twice.s.catalog.anchors.map((a,i)=>({...structuredClone(a),id:a.id+'-copy',puzzleId:p2.id,letter:p2.answer[i]})));
twice.s.catalog.descriptors.forEach(d=>{d.occurrences.push({...structuredClone(d.occurrences[0]),puzzleId:p2.id,selectedAnchorId:d.occurrences[0].selectedAnchorId+'-copy'})});
for(const holder of [twice.s.spatial,twice.spatialReview]){
 const scope=structuredClone(holder.puzzles[0]);scope.puzzleId=p2.id;scope.map.anchorIds=scope.map.anchorIds.map(id=>id+'-copy');scope.reviews.forEach(r=>{r.anchorId+='-copy'});holder.puzzles.push(scope);
}
// Recreate synthetic snapshots after source change; keep the same explicit
// decisions. No compiler operation creates the confirmations.
const twoTemplate=createEditorialTemplate(twice.s,{spatialReview:twice.spatialReview});
for(const row of twoTemplate.records){
 const prior=f.editorial.records.find(r=>r.key===row.key)||f.editorial.records.find(r=>r.key===row.key.replace('l1-fixture-step-two','l1-fixture-step').replace('l1-fixture-two',originalId).replace(/-copy$/,''));
 assert(prior,row.key);row.status='approved';row.decision=structuredClone(prior.decision);confirm(row);
}
twice.editorial=twoTemplate;
const both=mapping.create(twice.s.staging.puzzles);for(const p of twice.s.staging.puzzles)for(const c of p.clues)mapping.confirm(both,p,c);
twice.assignments=mapping.exportReview(twice.s.staging.puzzles,both);
const separate=adaptCatalog(twice.s,twice);assert(separate.ready,JSON.stringify(separate.blockers));assert.equal(separate.geometryCheck.generatedWords,12);
assert.equal(new Set(separate.curriculum.maps.map(m=>m.asset)).size,1);assert.equal(new Set(separate.curriculum.maps.map(m=>m.id)).size,2);
for(const map of separate.curriculum.maps)assert.equal(separate.curriculum.places.flatMap(p=>p.anchors).filter(a=>a.maps[map.id]).length,9,'shared bitmap never pools foreign glyphs');
console.log(`PASS: real L1 remains blocked (${report.blockers.length} exact gates); synthetic adapter compiles authored + six via shared generator; stale/null/unknown/ambiguous/future/spoiler/geometry inputs fail closed. No source approvals or learner progress written.`);
