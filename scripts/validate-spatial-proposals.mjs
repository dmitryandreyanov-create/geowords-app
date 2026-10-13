import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildProposals,serializeProposals} from '../tools/build_l1_spatial_proposals.mjs';
import model from '../tools/spatial-review-model.js';
const read=name=>JSON.parse(fs.readFileSync('data/import-staging/'+name));
const scaffold=read('l1-spatial-review-draft.json'),staging=read('l1-staging.json'),catalog=read('l1-catalog-draft.json'),observations=read('l1-spatial-observations.json'),proposals=read('l1-spatial-proposals.json');
const source=read('facts-draft.json').sources.find(s=>s.bookId==='l1');
assert.equal(serializeProposals(proposals),serializeProposals(buildProposals(observations,scaffold,staging,source)));
assert.equal(observations.status,'not_for_live_use');assert.equal(proposals.status,'not_for_live_use');
const records=proposals.puzzles.flatMap(p=>p.records);assert.equal(records.length,97);assert.equal(new Set(records.map(r=>r.anchorId)).size,97);
assert.equal(records.filter(r=>r.notes.length).length,29);assert.equal(records.filter(r=>r.target).length,5);
const state=model.create(scaffold);let applied=0;
for(const p of proposals.puzzles)for(const r of p.records){
 assert.equal(r.status,'editorial_pending');assert.equal(r.complete,false);assert(!Object.hasOwn(r,'evidence'));
 assert(r.notes.every(n=>typeof n==='string'&&n.length));assert.equal(r.provenance.sourceGlyphId,r.anchorId);
 assert.equal(r.provenance.mapPdfPage,staging.puzzles.find(s=>s.id===p.puzzleId).provenance.mapPdfPage);
 if(r.physical||r.target){
  model.applyProposal(state,catalog,p.puzzleId,r);applied++;
  const stored=state.puzzles.find(s=>s.puzzleId===p.puzzleId).reviews.find(s=>s.anchorId===r.anchorId);
  assert.equal(stored.status,'editorial_pending');assert.equal(stored.complete,false);assert.equal(stored.evidence,null);
  assert.throws(()=>model.applyProposal(state,catalog,p.puzzleId,r),/уже есть/);
 }
}
assert.equal(applied,93);assert.deepEqual(model.restore(scaffold,catalog,state),state);
assert(state.puzzles.flatMap(p=>p.reviews).every(r=>r.status!=='approved'));
assert(state.puzzles.every(p=>model.report(state,catalog,p.puzzleId).every(r=>r.status==='blocked')));
const fresh=model.create(scaffold),first=proposals.puzzles[0].records[0],bad=structuredClone(first);bad.sourceBinding.x++;
assert.throws(()=>model.applyProposal(fresh,catalog,'l1-01',bad),/устаревшее/);
assert.equal(fresh.puzzles[0].reviews.find(r=>r.anchorId===first.anchorId).physical,null);
// Independence from source clue mappings: builder only consumes markers/provenance.
const changed=structuredClone(staging);changed.puzzles.forEach(p=>{p.clues=[];p.answer='NO-ANSWER'});
assert.equal(serializeProposals(buildProposals(observations,scaffold,changed,source)),serializeProposals(proposals));
const equator=records.find(r=>r.anchorId==='l1-05-glyph-05');assert.deepEqual(equator.physical.boundaries,['equator']);assert(!equator.physical.hemispheres.some(v=>['north','south'].includes(v)));
console.log('PASS: 97 source-bound visual proposals, 29 review notes, 5 tentative island targets, no answer dependence; 93 fillable drafts, zero geographic approvals, no overwriting user work.');
