import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),model=require('../tools/review-model.js');
const puzzles=['l1','l2'].flatMap(b=>JSON.parse(fs.readFileSync(`data/import-staging/${b}-staging.json`)).puzzles);
// Empty legacy fixture is independent of real editorial progress.
const old={version:1,generatedFrom:'author map review',sourceQuizCount:puzzles.length,assignments:{}};
let state=model.restore(puzzles,old);
assert.deepEqual(model.stats(puzzles,state),{total:187,done:118,ambiguous:69,assignedAmbiguous:0,confirmed:0});
const p=puzzles[0],unique=p.clues.find(c=>c.markerId),repeated=p.clues.find(c=>!c.markerId);
model.confirm(state,p,unique);
model.assign(state,p,repeated,repeated.candidateMarkerIds[0]);
model.confirm(state,p,repeated);
const saved=model.exportReview(puzzles,state);
state=model.restore(puzzles,JSON.parse(JSON.stringify(saved)));
assert.equal(model.stats(puzzles,state).confirmed,2);
model.assign(state,p,repeated,repeated.candidateMarkerIds[1]);
assert.equal(model.stats(puzzles,state).confirmed,1,'changing a choice revokes approval');
model.clear(state,p,unique);
assert.equal(state.assignments[p.id][unique.position],unique.markerId,'reset keeps unique symbol match');
assert.equal(model.stats(puzzles,state).confirmed,0);
for(const change of [
 d=>{d.assignments[p.id]=[]},
 d=>{d.confirmations[p.id][unique.position]=null},
 d=>{d.confirmations[p.id][unique.position].clueText='changed'},
 d=>{d.confirmations[p.id][unique.position].x+=1},
 d=>{d.assignments.unknown={}},
 d=>{d.confirmations[p.id]['999']={}},
 d=>{d.assignments[p.id][repeated.position]='foreign-marker'}
]){
 const bad=structuredClone(saved);change(bad);assert.throws(()=>model.restore(puzzles,bad));
}
const nextRepeated=p.clues.find(c=>c!==repeated&&c.candidateMarkerIds.includes(repeated.candidateMarkerIds[0]));
assert.throws(()=>model.assign(model.restore(puzzles,saved),p,nextRepeated,repeated.candidateMarkerIds[0]));
console.log('PASS: v1 migration, geographic-review tracking for all 187 clues, v2 persistence, reset/change invalidation, stale evidence and duplicate rejection.');
