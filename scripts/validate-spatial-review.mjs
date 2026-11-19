import fs from 'node:fs';
import assert from 'node:assert/strict';
import model from '../tools/spatial-review-model.js';
const read=p=>JSON.parse(fs.readFileSync('data/import-staging/'+p));
const scaffold=read('l1-spatial-review-draft.json'),catalog=read('l1-catalog-draft.json');
const state=model.create(scaffold),p=state.puzzles[0],r=p.reviews[0];
assert.equal(model.report(state,catalog,p.puzzleId).filter(r=>r.status==='blocked').length,9);
assert.throws(()=>model.confirm(state,p.puzzleId,r.anchorId),/Заполните/);
model.edit(state,catalog,p.puzzleId,r.anchorId,'physical',{...model.empty(),places:['place-north-america']});
model.confirm(state,p.puzzleId,r.anchorId);assert.equal(r.status,'approved');
assert.deepEqual(model.restore(scaffold,catalog,state),state,'roundtrip retains geometric evidence');
model.edit(state,catalog,p.puzzleId,r.anchorId,'physical',{...model.empty(),places:['place-africa']});
assert.equal(r.status,'editorial_pending');assert.equal(r.complete,false);assert.equal(r.evidence,null);
model.confirm(state,p.puzzleId,r.anchorId);model.revoke(state,p.puzzleId,r.anchorId);assert.deepEqual(r.physical.places,['place-africa']);
assert.throws(()=>model.edit(state,catalog,p.puzzleId,r.anchorId,'physical',{...model.empty(),places:['unknown']}),/Неизвестный/);
assert.throws(()=>model.edit(state,catalog,p.puzzleId,r.anchorId,'target',model.empty()),/нет стрелки/);
const arrowPuzzle=state.puzzles.find(p=>p.reviews.some(r=>r.sourceBinding.pointsTo)),arrow=arrowPuzzle.reviews.find(r=>r.sourceBinding.pointsTo);
model.edit(state,catalog,arrowPuzzle.puzzleId,arrow.anchorId,'physical',{...model.empty(),places:['place-indian-ocean']});
assert.throws(()=>model.confirm(state,arrowPuzzle.puzzleId,arrow.anchorId),/Заполните/);
model.edit(state,catalog,arrowPuzzle.puzzleId,arrow.anchorId,'target',{...model.empty(),places:['place-madagascar']});
model.confirm(state,arrowPuzzle.puzzleId,arrow.anchorId);
assert.deepEqual(model.restore(scaffold,catalog,state),state);
const before=JSON.stringify(state);
for(const change of [s=>s.puzzles[0].map.sha256='b'.repeat(64),s=>s.puzzles[0].reviews[0].sourceBinding.x++,s=>s.puzzles[0].reviews[0].anchorId='unknown',s=>s.puzzles[0].reviews[1]=s.puzzles[0].reviews[0],s=>s.puzzles.pop(),s=>s.puzzles[0].reviews[0].physical.places=['unknown']]){
 const bad=structuredClone(state);change(bad);assert.throws(()=>model.restore(scaffold,catalog,bad));assert.equal(JSON.stringify(state),before,'bad imports are atomic');
}
const stale=structuredClone(state),a=stale.puzzles.find(p=>p.puzzleId===arrowPuzzle.puzzleId).reviews.find(r=>r.anchorId===arrow.anchorId);a.evidence.pointsTo.x++;
assert.throws(()=>model.restore(scaffold,catalog,stale),/устаревшее/);
assert.throws(()=>model.restore(scaffold,catalog,{version:1,assignments:{}}),/формат/);
// Explicit synthetic exhaustive memberships produce an independent mismatch.
for(const entry of p.reviews){model.edit(state,catalog,p.puzzleId,entry.anchorId,'physical',model.empty());model.confirm(state,p.puzzleId,entry.anchorId)}
const other=p.reviews[1];model.edit(state,catalog,p.puzzleId,other.anchorId,'physical',{...model.empty(),places:['place-australia']});model.confirm(state,p.puzzleId,other.anchorId);
const report=model.report(state,catalog,p.puzzleId);
assert.equal(report[0].status,'unique');assert.deepEqual(report[0].matchedAnchorIds,[other.anchorId]);assert(report.every(r=>r.preview));
assert.equal(catalog.descriptors[0].candidateQuery.status,'editorial_pending');
assert.equal(catalog.anchors.find(a=>a.puzzleId===p.puzzleId&&a.descriptorId===report[0].descriptorId).id,'l1-01-glyph-05','source answer untouched despite synthetic mismatch');
assert(scaffold.puzzles.every(p=>p.reviews.every(r=>r.physical===null&&r.evidence===null)));
console.log('PASS: separate spatial roundtrip, edits revoke approval, both arrow channels required, stale/foreign/duplicate imports rejected atomically, independent preview without source promotion.');
