import assert from 'node:assert/strict';
import {loadL1Sources,loadL2Sources,fingerprint,adaptCatalog} from '../tools/catalog-adapter.mjs';
import learning from '../tools/learning-review-model.js';
import content from '../tools/content-review-model.js';
import geo from '../tools/spatial-review-model.js';
import spatial from '../engine/spatial-semantics.js';
import curriculum from '../engine/curriculum.js';
import {generatorFixture} from './validate-curriculum-generator.mjs';
import {buildL2Plans} from '../tools/build_l2_catalog.mjs';
import {loadScript} from '../tools/build_lexicon_draft.mjs';
import fs from 'node:fs';
const s=loadL2Sources(),before=fingerprint(s),one=loadL1Sources();
assert.equal(s.catalog.anchors.length,90);assert.equal(s.catalog.descriptors.length,45);assert.equal(s.spatial.puzzles.length,10);
assert.equal(s.catalog.anchors.filter(a=>a.pointsTo).length,50);
assert(s.catalog.anchors.every(a=>a.sitsIn===null&&a.pointsToPlaceId===null&&a.geographicReview==='pending'));
assert.equal(learning.wordChoices(s).length,60);
const pilot=loadScript('data/courses.js','GEOWORD_COURSES').rivers,globalLexicon=JSON.parse(fs.readFileSync('data/import-staging/lexicon-draft.json')),l1Ids=new Set(globalLexicon.practicePlans.flatMap(p=>p.candidateWordIds));
assert.deepEqual(s.lexicon.entries,globalLexicon.entries,'no new or silently redefined global vocabulary');
assert.equal(new Set(s.lexicon.practicePlans.flatMap(p=>p.candidateWordIds)).size,60);
assert.equal(s.lexicon.practicePlans.flatMap(p=>p.candidateL1RepeatedWordIds).length,43,'42 selected L1 words plus pilot HABITAT are explicitly flagged');
for(const [i,p] of s.lexicon.practicePlans.entries()){
 assert.equal(p.status,'editorial_pending');assert.equal(p.target,7);assert.equal(p.practiceCount,6);assert.equal(p.authoredFirst,true);assert.equal(p.candidateWordIds.length,6);
 if(i<3)assert.deepEqual(p.candidateWordIds,pilot.steps[i].wordIds,'preserve the existing pilot order');
 assert.deepEqual(p.candidateL1RepeatedWordIds,p.candidateWordIds.filter(id=>l1Ids.has(id)));assert.equal(p.crossCourseReuseStatus,'editorial_pending');
 const m=p.candidatePracticeMap,scope=s.spatial.puzzles.find(scope=>scope.puzzleId===m.sourcePuzzleId),source=s.staging.puzzles.find(source=>source.id===m.sourcePuzzleId);
 assert.equal(m.status,'editorial_pending');assert.equal(m.focusStatus,'editorial_pending');assert.equal(m.geographicResolution,'not_verified');assert.equal(m.mapSha256,scope.map.sha256);assert.equal(m.asset,source.map);assert.deepEqual(m.anchorIds,scope.map.anchorIds);assert.deepEqual(m.provenance,source.provenance);
 assert(m.candidateFocusPlaceIds.every(id=>s.catalog.places.some(place=>place.id===id)));assert(p.candidateWordIds.every(id=>s.lexicon.entries.find(e=>e.id===id).word.length<=m.anchorIds.length));assert.deepEqual(p.generatedPuzzles,[]);
 assert.deepEqual(s.draft.courses.find(c=>c.id==='rivers').steps[i].wordIds,[],'real runtime word IDs stay untouched');
}
assert.equal(s.lexicon.practicePlans[0].candidatePracticeMap.sourcePuzzleId,'l2-02','CHANNEL map is not silently reused for Nile practice');
assert.equal(s.lexicon.practicePlans[7].candidatePracticeMap.asset,s.lexicon.practicePlans[8].candidatePracticeMap.asset);assert.notDeepEqual(s.lexicon.practicePlans[7].candidatePracticeMap.anchorIds,s.lexicon.practicePlans[8].candidatePracticeMap.anchorIds,'same bitmap does not merge different glyph scopes');
const badLexicon=structuredClone(globalLexicon);badLexicon.entries.find(e=>e.id==='slope').word='PERMAFROST';assert.throws(()=>buildL2Plans(s.draft,pilot,badLexicon,s.staging,s.spatial),/over-capacity/);
assert(s.catalog.audit.every(a=>a.missingEarlierLocalFactIds.length===0));assert(s.catalog.audit.some(a=>a.externalPrerequisiteFactIds.length));
const template=model=>model.create(s,Object.fromEntries(model.sourceRows(s).map(r=>[r.key,fingerprint(r.source)]))),learn=template(learning),phrases=template(content),geography=geo.create(s.spatial);
assert.equal(learn.records.length,28);assert.equal(phrases.records.length,105);assert.equal(learn.scope,'l2-learning-review');assert.equal(phrases.scope,'l2-content-review');
const changedMap=structuredClone(s);changedMap.lexicon.practicePlans[0].candidatePracticeMap.sourcePuzzleId='l2-01';const stale=learning.create(changedMap,Object.fromEntries(learning.sourceRows(changedMap).map(r=>[r.key,fingerprint(r.source)])));assert.throws(()=>learning.restore(s,learn,stale,{}),'a map proposal change invalidates source-bound learning decisions');
const digest=data=>Object.fromEntries(data.records.map(r=>[r.key,fingerprint(r.decision)]));
assert.deepEqual(learning.restore(s,learn,learn,digest(learn)),learn);assert.deepEqual(content.restore(s,phrases,phrases,digest(phrases)),phrases);
assert.throws(()=>learning.restore(s,learn,learning.create(one,Object.fromEntries(learning.sourceRows(one).map(r=>[r.key,fingerprint(r.source)]))),{}));
assert.throws(()=>geo.restore(s.spatial,s.catalog,geo.create(one.spatial)));
// Explicit synthetic editorial decisions, never written to source content.
const factKey='fact:f-l2-p07-nile-mediterranean',stepKey='step:l2-01-step';
learning.edit(s,learn,factKey,{text:{en:'SYNTHETIC mechanical test only'},introducesPlaces:['place-nile','place-mediterranean-sea'],caveatFactIds:['f-l2-p07-nile-note']});
learning.confirm(s,learn,factKey,'SYNTHETIC TEST ONLY',fingerprint(learn.records.find(r=>r.key===factKey).decision));
const stepDecision={requiresFacts:[],learnBefore:[],unlockAfter:['f-l2-p07-nile-mediterranean','f-l2-p07-nile-note'],introducedPlaces:[],focusPlaceIds:[],wordIds:s.lexicon.practicePlans[0].candidateWordIds};
learning.edit(s,learn,stepKey,stepDecision);learning.confirm(s,learn,stepKey,'SYNTHETIC TEST ONLY',fingerprint(stepDecision));
assert(learning.report(s,learn)[0].issues.some(i=>i.code==='PREREQUISITE_COURSE_PENDING'),'L1 knowledge is not automatically assumed');
assert(learning.report(s,learn)[0].issues.some(i=>i.code==='CLUE_FACT_NOT_LEARNED'&&i.factId.startsWith('f-l1-')));
const d=s.catalog.descriptors.find(d=>d.candidateQuery.op==='near'),decision={text:structuredClone(d.sourcePredicate),kind:'relational',query:structuredClone(d.candidateQuery)},dk='descriptor:'+d.id;
content.edit(s,phrases,dk,decision);content.confirm(s,phrases,dk,'SYNTHETIC TEST ONLY',fingerprint(decision),{meaning:true,independentPhrase:true,dependencies:true});
const blocked=adaptCatalog(s,{learningReview:learn,contentReview:phrases});assert.equal(blocked.curriculum,null);assert(blocked.blockers.some(b=>b.code==='L2_COMPOSITE_RUNTIME_PENDING'));assert(!blocked.blockers.some(b=>['INVALID_LEARNING_REVIEW','INVALID_CONTENT_REVIEW'].includes(b.code)));
assert.equal(blocked.blockers.filter(b=>b.code==='L2_PRACTICE_MAP_REVIEW_PENDING').length,10);assert.equal(blocked.blockers.filter(b=>b.code==='L2_CROSS_COURSE_REUSE_PENDING').length,8);
for(const scope of geography.puzzles)assert(geo.report(geography,s.catalog,scope.puzzleId).every(r=>r.status==='blocked'),'real L2 geography stays unknown');
// Proximity is independent from on-object membership. Unknown proximity of a
// competitor blocks even when all old geometric confirmations are valid.
const scope=geography.puzzles[1],anchor=s.catalog.anchors.find(a=>a.puzzleId===scope.puzzleId&&a.pointsTo),r=scope.reviews.find(r=>r.anchorId===anchor.id);
const membership={...geo.empty(),places:['place-africa']};geo.edit(geography,s.catalog,scope.puzzleId,anchor.id,'physical',membership);geo.edit(geography,s.catalog,scope.puzzleId,anchor.id,'target',{...geo.empty(),places:['place-nile']});assert.throws(()=>geo.confirm(geography,scope.puzzleId,anchor.id),/близость/);
geo.edit(geography,s.catalog,scope.puzzleId,anchor.id,'physical',{...membership,nearPlaces:['place-nile']});geo.edit(geography,s.catalog,scope.puzzleId,anchor.id,'target',{...geo.empty(),places:['place-nile'],nearPlaces:[]});geo.confirm(geography,scope.puzzleId,anchor.id);
const restored=geo.restore(s.spatial,s.catalog,geography);assert.deepEqual(restored.puzzles[1].reviews.find(r=>r.anchorId===anchor.id).physical.nearPlaces,['place-nile']);
const map={id:'synthetic',sha256:'a'.repeat(64),anchorIds:['a','b']},anchors=[{id:'a',mapId:map.id,x:10,y:10,pointsTo:null},{id:'b',mapId:map.id,x:70,y:70,pointsTo:null}],reviews=anchors.map(a=>({anchorId:a.id,status:'approved',complete:true,evidence:{mapId:map.id,mapSha256:map.sha256,x:a.x,y:a.y,pointsTo:null},physical:{...geo.empty(),nearPlaces:a.id==='a'?['river']:[]},target:null}));
const query={status:'approved',op:'near',channel:'either',placeId:'river',requiredPlaces:['river'],requires:[]},resolve=()=>spatial.resolve({query,anchors,reviews,map,knownFacts:[],knownPlaces:['river']});
assert.equal(resolve().status,'unique');assert.deepEqual(reviews[0].physical.places,[],'near does not manufacture on-object membership');delete reviews[1].physical.nearPlaces;assert.equal(resolve().reason,'incomplete_proximity');reviews[1].physical.nearPlaces=['river'];assert.equal(resolve().status,'ambiguous');
// Shared generator can use reviewed near-owned anchors; no second L2 generator.
const {c,one:step}=generatorFixture();for(const p of c.places)for(const a of p.anchors){const g=a.maps['fixture-map'].spatialReview.physical;g.nearPlaces=p.id==='fixture-focus'?[]:[p.id];if(p.id!=='fixture-focus')g.places=[]}
for(const d of c.descriptors)if(d.query.op==='place')d.query.op='near';let learner=curriculum.newLearner(c);learner=curriculum.acknowledge(c,learner,'fixture-course',step.id,'before').state;learner=curriculum.complete(c,learner,'fixture-course',{id:step.authoredPuzzleId,courseId:'fixture-course',source:'authored'}).state;learner=curriculum.acknowledge(c,learner,'fixture-course',step.id,'after').state;
const generated=curriculum.generatePractice(c,learner,'fixture-course');assert.equal(generated.kind,'generated');assert(curriculum.verifyPractice(c,generated.state,'fixture-course',generated.puzzle));
assert.equal(fingerprint(s),before);console.log('PASS: L2 90 anchors/50 arrows/45 phrases, 18 facts + 10 steps, 60 candidate slots/10 source-bound map proposals/43 explicit L1 repeats, source capacity only, separate book imports, no assumed L1 knowledge, fail-closed proximity and shared synthetic generation; real L2 cannot release.');
