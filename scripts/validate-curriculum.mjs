import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const engine=createRequire(import.meta.url)('../engine/curriculum.js');
// Approved below means approved TEST FIXTURE, never real pedagogical content.
const step=(id,i)=>({id,status:'approved',requiresFacts:[],learnBefore:[],introducedPlaces:[],unlockAfter:[],authoredPuzzleId:'original-'+id,wordIds:Array.from({length:6},(_,j)=>'word-'+i+'-'+j)});
const first=step('step-a',0),second=step('step-b',1),third=step('step-c',2);
first.learnBefore=['fact-base'];first.introducedPlaces=['place-base'];first.unlockAfter=['fact-river'];
second.unlockAfter=['fact-directions'];
const c={schemaVersion:1,id:'test-fixture',courseOrder:['course-a','course-b'],
 courses:[{id:'course-a',status:'approved',target:7,advanceOn:'solved',requiresFacts:[],requiresCourses:[],steps:[first,second]},
 {id:'course-b',status:'approved',target:7,advanceOn:'solved',requiresFacts:['fact-directions'],requiresCourses:['course-a'],steps:[third]}],
 places:[{id:'place-base',status:'approved',anchors:[]},{id:'place-river',status:'approved',anchors:[{id:'anchor-a',maps:{'fixture-map':{x:20,y:30}}},{id:'anchor-b',maps:{'fixture-map':{x:60,y:50}}}]}],
 facts:[{id:'fact-base',status:'approved',text:{en:'Fixture A'},introducesPlaces:[]},
 {id:'fact-river',status:'approved',text:{en:'Fixture B'},introducesPlaces:['place-river']},
 {id:'fact-directions',status:'approved',text:{en:'Fixture C'},introducesPlaces:[]}],
 puzzles:[first,second,third].map((s,i)=>({id:s.authoredPuzzleId,status:'approved',courseId:i<2?'course-a':'course-b',answer:'ORIGINAL'+String.fromCharCode(65+i)})),
 lexicon:[first,second,third].flatMap((s,i)=>s.wordIds.map((id,j)=>({id,status:'approved',word:'PRACTICE'+String.fromCharCode(65+i)+String.fromCharCode(65+j)}))),
 descriptors:[{id:'direction',status:'approved',kind:'directional',text:{en:'Fixture complete phrase'},requires:['fact-directions'],requiredPlaces:['place-river'],resolvesTo:['anchor-a','anchor-b']}]};
engine.validate(c);
let state=engine.newLearner(c);
const original=(courseId,s)=>({id:s.authoredPuzzleId,courseId,source:'authored'});
const practice=(courseId,s,i,j)=>({courseId,source:'generated',stepIndex:i,dictionaryId:s.wordIds[j]});
assert.equal(engine.availability(c,state,'course-a').phase,'before');
assert.equal(engine.availability(c,state,'course-b').reason,'PREREQUISITE_COURSE');
assert.equal(engine.complete(c,state,'course-a',original('course-a',first)).credited,false);
assert.equal(engine.acknowledge(c,state,'course-a',first.id,'after').accepted,false);
assert.deepEqual(engine.normalize(c,{...state,knownFacts:['fact-directions'],knownPlaces:['place-river']}).knownFacts,[]);
state=engine.acknowledge(c,state,'course-a',first.id,'before').state;
assert.deepEqual(state.knownFacts,['fact-base']);assert.deepEqual(state.knownPlaces,['place-base']);
assert.equal(engine.complete(c,state,'course-a',practice('course-a',first,0,0)).credited,false);
state=engine.complete(c,state,'course-a',original('course-a',first),{clean:true}).state;
assert.equal(engine.availability(c,state,'course-a').phase,'after');
assert(!state.knownFacts.includes('fact-river'),'completing word never silently acknowledges facts');
assert.equal(engine.complete(c,state,'course-a',practice('course-a',first,0,0)).credited,false);
state=engine.acknowledge(c,state,'course-a',first.id,'after').state;
assert(state.knownPlaces.includes('place-river'));
assert.equal(engine.eligibleDescriptors(c,state,['anchor-a']).length,0,'unknown fact blocks descriptor');
assert.equal(engine.eligibleDescriptors(c,state,['foreign-anchor']).length,0,'foreign anchor is never selected');
for(let j=0;j<6;j++){
 const puzzle=practice('course-a',first,0,j);
 const result=engine.complete(c,state,'course-a',puzzle,j===0?{clean:true,errorsByDescriptorKind:{directional:2}}:{clean:true});
 assert(result.credited,'errors do not cancel solved words');assert.equal(result.count,j+2);assert.equal(result.advanced,j===5);
 state=result.state;assert.equal(engine.complete(c,state,'course-a',puzzle).credited,false);
}
assert.equal(state.courses['course-a'].steps[first.id].cleanCount,6);
assert.equal(state.courses['course-a'].steps[first.id].errorsByDescriptorKind.directional,2);
assert.equal(engine.availability(c,state,'course-a').puzzleId,second.authoredPuzzleId);
assert.deepEqual(engine.normalize(c,JSON.parse(JSON.stringify(state))),state,'persist lesson, score and knowledge at transition');
state=engine.complete(c,state,'course-a',original('course-a',second)).state;
state=engine.acknowledge(c,state,'course-a',second.id,'after').state;
assert.equal(engine.eligibleDescriptors(c,state,['anchor-a']).length,1);
assert.equal(engine.eligibleDescriptors(c,state,['anchor-a','anchor-b']).length,0,'semantic ambiguity rejected');
for(let j=0;j<6;j++)state=engine.complete(c,state,'course-a',practice('course-a',second,1,j)).state;
assert.equal(engine.availability(c,state,'course-b').kind,'authored');
state=engine.complete(c,state,'course-b',original('course-b',third)).state;
for(let j=0;j<6;j++)state=engine.complete(c,state,'course-b',practice('course-b',third,0,j)).state;
assert.equal(engine.availability(c,state,'course-b').kind,'review');
const review=engine.complete(c,state,'course-b',{...practice('course-b',third,0,0),review:true});assert.equal(review.credited,false);assert.deepEqual(review.state,state);
assert.deepEqual(state.knownFacts,['fact-base','fact-river','fact-directions']);assert.deepEqual(state.knownPlaces,['place-base','place-river']);
const forged=structuredClone(state);forged.courses['course-a'].steps[first.id].beforeLearned=false;
const cleaned=engine.normalize(c,forged);assert.deepEqual(cleaned.knownFacts,[]);assert(!cleaned.courses['course-b'].steps[third.id].authoredSolved,'future course claims do not bypass dependency');
const unknown=structuredClone(state);unknown.courses['course-a'].steps[first.id].solvedWordIds=['fake','original-step-a'];
const safe=engine.normalize(c,unknown);assert.equal(safe.courses['course-a'].stepIndex,0);assert(!safe.courses['course-a'].steps[second.id].authoredSolved);
for(const mutate of [
 x=>{x.courses[0].advanceOn='clean'},
 x=>{x.courses[0].steps[0].wordIds[5]=first.wordIds[0]},
 x=>{x.lexicon[0].word=x.puzzles[0].answer},
 x=>{x.courses[0].steps[0].learnBefore=['fake']},
 x=>{x.courses[0].requiresCourses=['course-b']},
 x=>{x.descriptors[0].requires=['unreviewed']},
 x=>{x.descriptors[0].resolvesTo=['foreign-anchor']},
 x=>{x.places[1].anchors[0].maps['fixture-map'].x=101},
 x=>{x.courses[0].steps[0].status='editorial_pending'}
]){const bad=structuredClone(c);mutate(bad);assert.throws(()=>engine.validate(bad))}
const draft=JSON.parse(fs.readFileSync('data/import-staging/curriculum-draft.json'));
engine.validate(draft);assert.equal(draft.courses.length,6);assert.equal(draft.courses[0].steps.length,10);assert.equal(draft.courses[1].steps.length,10);
assert.deepEqual(draft.courseOrder,['oceans-continents','rivers','mountains','world-waters','straits-canals','final-challenge']);
for(const course of draft.courses)assert.equal(engine.availability(draft,engine.newLearner(draft),course.id).reason,'CONTENT_NOT_APPROVED');
assert.equal(draft.facts.length,0,'raw facts were not promoted to approved lessons');
console.log('PASS: global knowledge, explicit before/after lessons, authored + six with errors allowed, automatic transitions, replay, persistence, fact-gated unique descriptors and 20 non-live L1/L2 draft steps.');
