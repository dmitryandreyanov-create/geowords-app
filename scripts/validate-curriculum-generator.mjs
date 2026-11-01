import fs from 'node:fs';
import assert from 'node:assert/strict';
import engine from '../engine/curriculum.js';
import semantic from '../engine/semantic.js';
import {pathToFileURL} from 'node:url';
import {loadScript} from '../tools/build_lexicon_draft.mjs';
// Every approval below is a SYNTHETIC test approval, never a source approval.
export function generatorFixture(){
const basicIds=Array.from({length:12},(_,i)=>'fixture-place-'+i),focus='fixture-focus';
const map={id:'fixture-map',status:'approved',asset:'./assets/synthetic-map.webp',aspect:'1200 / 800',sha256:'a'.repeat(64),containsPlaces:[...basicIds,focus]};
const membership=(places,regions=[])=>({places,regions,sides:[],between:[],hemispheres:[],boundaries:[]});
const anchor=(id,x,y,owner,regions=[])=>{
 const review={anchorId:id,status:'approved',complete:true,evidence:{mapId:map.id,mapSha256:map.sha256,x,y,pointsTo:null},physical:membership([owner],regions),target:null};
 return {id,maps:{[map.id]:{x,y,spatialReview:review}}};
};
const places=basicIds.map((id,i)=>({id,status:'approved',anchors:[anchor('a'+i,8+(i%4)*20,10+Math.floor(i/4)*30,id),anchor('b'+i,16+(i%4)*20,10+Math.floor(i/4)*30,id)]}));
places.push({id:focus,status:'approved',anchors:['north','east','south'].map((direction,i)=>anchor('focus-'+direction,92,10+i*30,focus,[{placeId:focus,direction}]))});
const firstWords=['ATLAS','GLOBE','REGION','BORDER','SPHERE','MAPPING'];
const secondWords=['CLIMATE','LATITUDE','TROPICS','MAGMA','POLAR','URBAN'];
const lastWords=['BASIN','RIDGE','SLOPE','CANYON','TERRAIN','PLATEAU'];
const makeStep=(id,words,original,focusPlaceIds)=>({id,status:'approved',requiresFacts:[],learnBefore:[],unlockAfter:[],introducedPlaces:[],wordIds:words.map(w=>w.toLowerCase()),authoredPuzzleId:original,generatedPractice:{mapId:map.id,focusPlaceIds}});
const one=makeStep('fixture-one',firstWords,'fixture-original-a',basicIds),two=makeStep('fixture-two',secondWords,'fixture-original-b',[focus]),three=makeStep('fixture-three',lastWords,'fixture-original-c',[focus]);
one.learnBefore=['fixture-base'];one.introducedPlaces=basicIds;one.unlockAfter=['fixture-focus-fact'];
two.learnBefore=['fixture-focus-fact'];two.introducedPlaces=[focus];three.introducedPlaces=[focus];three.unlockAfter=['fixture-future'];
const descriptor=(id,owner,requires,query,resolvesTo)=>({id,status:'approved',kind:'name',text:{en:'Synthetic geographic phrase for '+id+'.'},requires,requiredPlaces:[owner],resolvesTo,
 query:{status:'approved',channel:'either',requires,requiredPlaces:[owner],...query}});
const c={schemaVersion:1,status:'approved',id:'generator-synthetic-only',courseOrder:['fixture-course','fixture-final'],
 courses:[{id:'fixture-course',status:'approved',title:'Synthetic A',target:7,advanceOn:'solved',requiresFacts:[],requiresCourses:[],steps:[one,two]},
 {id:'fixture-final',status:'approved',title:'Synthetic B',target:7,advanceOn:'solved',requiresFacts:['fixture-focus-fact'],requiresCourses:['fixture-course'],steps:[three]}],
 maps:[map],places,facts:[{id:'fixture-base',status:'approved',text:{en:'Synthetic base lesson.'},introducesPlaces:basicIds},
 {id:'fixture-focus-fact',status:'approved',text:{en:'Synthetic focus lesson.'},introducesPlaces:[focus]},
 {id:'fixture-future',status:'approved',text:{en:'Synthetic final lesson.'},introducesPlaces:[]}],
 puzzles:[{id:one.authoredPuzzleId,status:'approved',courseId:'fixture-course',answer:'ORIGINALA'},
 {id:two.authoredPuzzleId,status:'approved',courseId:'fixture-course',answer:'ORIGINALB'},
 {id:three.authoredPuzzleId,status:'approved',courseId:'fixture-final',answer:'ORIGINALC'}],
 authoredAnswerWords:loadScript('data/authored-answer-index.js','GEOWORD_AUTHORED_ANSWERS').map(e=>e.word),
 lexicon:[...firstWords,...secondWords,...lastWords].map(word=>({id:word.toLowerCase(),status:'approved',word,definition:{en:'Synthetic definition for '+word+'.'}})),
 descriptors:basicIds.map((id,i)=>descriptor('desc-'+i,id,['fixture-base'],{op:'place',placeId:id},['a'+i,'b'+i]))};
for(const direction of ['north','east','south'])c.descriptors.push(descriptor('focus-desc-'+direction,focus,['fixture-focus-fact'],{op:'region',placeId:focus,direction},['focus-'+direction]));
c.descriptors.push(descriptor('future-desc',basicIds[0],['fixture-future'],{op:'place',placeId:basicIds[0]},['a0','b0']));
return {c,map,one,two,three,focus};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
const {c,map,one,two,three,focus}=generatorFixture();
engine.validate(c);let state=engine.newLearner(c);
const authored=(s,courseId='fixture-course')=>({id:s.authoredPuzzleId,courseId,source:'authored'});
assert.equal(engine.generatePractice(c,state,'fixture-course').kind,'blocked');
state=engine.acknowledge(c,state,'fixture-course',one.id,'before').state;
assert.equal(engine.generatePractice(c,state,'fixture-course').kind,'blocked','authored first');
state=engine.complete(c,state,'fixture-course',authored(one)).state;
const forged={...state,knownFacts:['fixture-focus-fact','fixture-future'],knownPlaces:[focus]};
assert.equal(engine.generatePractice(c,forged,'fixture-course').kind,'blocked','after lesson cannot be forged through knowledge arrays');
state=engine.acknowledge(c,state,'fixture-course',one.id,'after').state;
const baseState=structuredClone(state),beforeFacts=[...state.knownFacts];
const sameA=engine.generatePractice(c,state,'fixture-course',{variant:2}),sameB=engine.generatePractice(c,state,'fixture-course',{variant:2});
assert.equal(sameA.kind,'generated');assert.deepEqual(sameA,sameB,'same state and seed are deterministic');
assert.deepEqual(state,baseState,'generation does not mutate the supplied state');
const noRelease=structuredClone(c);noRelease.status='not_for_live_use';
assert.equal(engine.generatePractice(noRelease,state,'fixture-course').reason,'CURRICULUM_NOT_APPROVED');
assert(!engine.verifyPractice(noRelease,state,'fixture-course',sameA.puzzle));
assert.deepEqual(engine.normalize(noRelease,state).knownFacts,[],'unreleased curriculum cannot restore learned facts');
assert.equal(engine.availability(noRelease,engine.newLearner(noRelease),'fixture-course').kind,'blocked');
assert(!engine.acknowledge(noRelease,engine.newLearner(noRelease),'fixture-course',one.id,'before').accepted);
assert(!engine.complete(noRelease,state,'fixture-course',authored(one)).credited);
const lostLessonPlace=structuredClone(c);
lostLessonPlace.courses[0].steps[1].introducedPlaces=[];
lostLessonPlace.courses[0].steps[1].learnBefore=[];
lostLessonPlace.courses[0].steps[1].generatedPractice={mapId:'second-map',focusPlaceIds:[]};
lostLessonPlace.maps.push({...structuredClone(map),id:'second-map',containsPlaces:[...map.containsPlaces].filter(id=>id!==focus)});
assert.throws(()=>engine.validate(lostLessonPlace),/loses a previously introduced/,'places introduced by lessons must accumulate too');
const fingerprints=new Set();
for(let i=0;i<20;i++){
 const result=engine.generatePractice(c,state,'fixture-course',{variant:i});assert.equal(result.kind,'generated');
 assert(!fingerprints.has(result.puzzle.descriptorSignature),'last 20 sets do not repeat');fingerprints.add(result.puzzle.descriptorSignature);
 assert(engine.verifyPractice(c,result.state,'fixture-course',result.puzzle));
 assert(!result.puzzle.clues.some(clue=>clue.descriptorId==='future-desc'));
 assert(result.puzzle.freshCount/result.puzzle.markers.length>=.35);
 state=engine.normalize(c,JSON.parse(JSON.stringify(result.state)));
 assert.deepEqual(state.knownFacts,beforeFacts,'definitions and generated clues never unlock facts');
 assert.equal(state.courses['fixture-course'].steps[one.id].solvedWordIds.length,0,'generation adds no credit');
}
assert.equal(state.generationHistory.length,20);
const corrupted=structuredClone(state);corrupted.generationHistory.push({courseId:'foreign',descriptorIds:['fake']});
assert(engine.normalize(c,corrupted).generationHistory.every(h=>h.courseId==='fixture-course'));
for(let j=0;j<6;j++){
 const result=engine.generatePractice(c,state,'fixture-course',{variant:100+j});assert.equal(result.kind,'generated');state=result.state;
 for(const mutate of [p=>p.markers[0].x++,p=>p.clues[0].text='Wrong clue',p=>p.clues[0].markerId='foreign',p=>p.definition='Changed',p=>p.requiredFreshCount=0]){
  const bad=structuredClone(result.puzzle);mutate(bad);assert(!engine.verifyPractice(c,state,'fixture-course',bad));assert(!engine.complete(c,state,'fixture-course',bad).credited);
 }
 const done=engine.complete(c,state,'fixture-course',result.puzzle,{errorsByDescriptorKind:{name:1}});
 assert(done.credited);assert.equal(done.count,j+2);assert.equal(done.advanced,j===5);state=done.state;
 assert(!engine.complete(c,state,'fixture-course',result.puzzle).credited);
}
assert.equal(engine.availability(c,state,'fixture-course').phase,'before');
state=engine.acknowledge(c,state,'fixture-course',two.id,'before').state;
state=engine.complete(c,state,'fixture-course',authored(two)).state;
for(let j=0;j<6;j++){
 const result=engine.generatePractice(c,state,'fixture-course',{variant:200+j});assert.equal(result.kind,'generated');
 assert(result.puzzle.freshCount/result.puzzle.markers.length>=.35,'already known focus still keeps its quota');
 state=result.state;state=engine.complete(c,state,'fixture-course',result.puzzle).state;
}
assert.equal(engine.availability(c,state,'fixture-final').kind,'lesson');
state=engine.acknowledge(c,state,'fixture-final',three.id,'before').state;
state=engine.complete(c,state,'fixture-final',authored(three,'fixture-final')).state;
assert.equal(engine.generatePractice(c,state,'fixture-final').kind,'blocked');state=engine.acknowledge(c,state,'fixture-final',three.id,'after').state;
for(let j=0;j<6;j++){const result=engine.generatePractice(c,state,'fixture-final',{variant:300+j});assert.equal(result.kind,'generated');state=engine.complete(c,result.state,'fixture-final',result.puzzle).state}
const scores=structuredClone(state.courses),facts=[...state.knownFacts];
const replay=engine.generatePractice(c,state,'fixture-final',{review:true,variant:400});assert.equal(replay.kind,'generated');
assert(replay.puzzle.freshCount/replay.puzzle.markers.length>=.35);assert(!engine.complete(c,replay.state,'fixture-final',replay.puzzle).credited);
assert.deepEqual(replay.state.courses,scores);assert.deepEqual(replay.state.knownFacts,facts);
assert.equal(engine.generatePractice(c,state,'fixture-final',{review:true,stepId:'foreign'}).reason,'UNKNOWN_STEP');
for(const mutate of [
 x=>x.maps[0].containsPlaces.pop(),x=>x.maps[0].asset='./assets/../private.json',x=>x.maps[0].aspect='0 / 800',
 x=>x.lexicon[0].word='LONGITUDE',x=>x.authoredAnswerWords=[],x=>x.descriptors[0].query.requires=[],
 x=>x.courses[0].steps[1].generatedPractice.focusPlaceIds=['fixture-place-0']
]){const bad=structuredClone(c);mutate(bad);assert.throws(()=>engine.validate(bad))}
const pendingOriginal=structuredClone(c);pendingOriginal.puzzles.push({id:'future-original',status:'editorial_pending',answer:'ATLAS'});assert.throws(()=>engine.validate(pendingOriginal),/spoiler/);
// Narrower map makes focus points too close: never silently reduce the quota.
const wide=structuredClone(c);wide.maps[0].aspect='1200 / 300';
let middle=engine.newLearner(wide);middle.courses['fixture-course'].steps[one.id]={...state.courses['fixture-course'].steps[one.id]};middle.courses['fixture-course'].steps[two.id]={...state.courses['fixture-course'].steps[two.id],solvedWordIds:[]};
const eight=engine.generatePractice(wide,middle,'fixture-course',{variant:1});assert.equal(eight.kind,'blocked');
const unknown=structuredClone(c);unknown.places.at(-1).anchors.forEach(a=>a.maps[map.id].spatialReview.status='editorial_pending');
assert.equal(engine.generatePractice(unknown,middle,'fixture-course').reason,'NEW_OBJECT_ANCHORS_MISSING');
assert.equal(semantic.distance({x:0,y:0},{x:0,y:20},{widthPx:300,heightPerWidth:1}),60);
assert.equal(semantic.distance({x:0,y:0},{x:0,y:20},{widthPx:300,heightPerWidth:.25}),15);
// Arrow head can hit a marker even when the shaft misses it.
const arrow={id:'arrow',x:10,y:10,pointsTo:{x:90,y:10,from:{x:15,y:10},headPoints:[{x:90,y:10},{x:80,y:35},{x:80,y:0}]}};
assert(semantic.arrowIntersectsMarker(arrow,{id:'neighbor',x:80,y:35},{widthPx:300,heightPerWidth:1}));
assert.equal(semantic.generateAnchored({word:'ALPHA',anchors:[],cues:()=>[],geometry:{widthPx:Infinity,heightPerWidth:1}}),null);
// Genuine content stays pending: no approval manufactured to get a sample.
const draft=JSON.parse(fs.readFileSync('data/import-staging/curriculum-draft.json'));
for(const course of draft.courses)assert.equal(engine.generatePractice(draft,engine.newLearner(draft),course.id).reason,'CONTENT_NOT_APPROVED');
const originalState=baseState;
for(let i=0;i<300;i++){const result=engine.generatePractice(c,originalState,'fixture-course',{variant:i});assert.equal(result.kind,'generated');assert(engine.verifyPractice(c,result.state,'fixture-course',result.puzzle))}
console.log('PASS: 300 generated synthetic layouts, 20 distinct persisted descriptor sets, two-course 1+6, global knowledge, >=35% focus in practice/review, independent verification, arrows, map aspect and pending source gates.');
}
