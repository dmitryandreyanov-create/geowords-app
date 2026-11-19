import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildPhoneL1,output} from '../tools/build-l1-phone.mjs';
import {loadL1Sources,adaptCatalog} from '../tools/catalog-adapter.mjs';
import model from '../engine/l1-phone.js';
import core from '../engine/geowords.js';
const p=buildPhoneL1(),context={};vm.runInNewContext(fs.readFileSync('data/l1-phone.js','utf8'),context);
assert.equal(fs.readFileSync('data/l1-phone.js','utf8'),output(p));assert.equal(p.steps.length,10);assert.equal(p.status,'trial_only');assert.equal(p.editorialStatus,'pending');assert.equal(adaptCatalog(loadL1Sources()).curriculum,null);
let state=model.create(p),count=0;
for(const [i,step] of p.steps.entries()){
 assert.equal(step.practices.length,6);assert.equal(new Set(step.wordIds).size,6);
 for(const q of [step.authored,...step.practices]){
  let c=model.current(p,state);while(['before','after'].includes(c.phase)){model.acknowledge(p,state);c=model.current(p,state)}
  assert.equal(c.puzzle.id,q.id);assert.equal(state.progress.stepIndex,i);assert.equal(new Set(q.clues.map(c=>c.markerId)).size,q.answer.length);
  for(const [j,clue] of q.clues.entries())assert.equal(q.markers.find(m=>m.id===clue.markerId).letter,q.answer[j]);
  const ids=q.clues.map(c=>c.markerId),wrong=[...ids];wrong.reverse();assert.equal(model.solve(p,state,q,wrong).credited,false);
  model.partial(p,state,q,ids.slice(0,2));state=model.restore(p,JSON.parse(JSON.stringify(state)));assert.deepEqual(state.partial.markerIds,ids.slice(0,2));
  const r=model.solve(p,state,q,ids);assert(r.credited);count++;assert.equal(r.advanced,q===step.practices.at(-1)&&i<9);assert.equal(model.solve(p,state,q,ids).credited,false);
  state=model.restore(p,JSON.parse(JSON.stringify(state)));
 }
}
assert.equal(count,70);assert.equal(model.current(p,state).phase,'complete');assert.equal(core.stepScore(state.progress,p.steps.at(-1)),7);
const stale=structuredClone(state);stale.sourceSha256='0'.repeat(64);assert.throws(()=>model.restore(p,stale));
console.log('PASS L1 phone: all 70 words, shared 1+6 credit/auto advance, fact screens, correction, partial reload, no repeated credit, stale save rejected, editorial sources remain pending.');
