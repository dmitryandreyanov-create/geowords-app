import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const model=createRequire(import.meta.url)('../tools/review-model.js');
const inputs=['l1','l2'].map(b=>`data/import-staging/${b}-staging.json`);
const puzzles=inputs.flatMap(f=>JSON.parse(fs.readFileSync(f)).puzzles);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'geowords-mapping-'));
const review=path.join(dir,'review.json'),out=path.join(dir,'mapped.json'),combined=path.join(dir,'combined.json');
function apply(data,flags=[],sources=inputs){
 fs.writeFileSync(review,JSON.stringify(data));
 return spawnSync('python3',['tools/apply_author_mapping.py','--staging',...sources,'--review',review,'--out',out,...flags],{encoding:'utf8'});
}
try{
 // Keep incomplete-input regression separate from the real received mapping.
 const legacy={version:1,generatedFrom:'author map review',sourceQuizCount:puzzles.length,assignments:{}};
 assert.equal(apply(legacy).status,0);
 let data=JSON.parse(fs.readFileSync(out));assert.equal(data.books.length,20);assert.equal(data.unassigned,69);assert.equal(data.unreviewed,187);
 assert.notEqual(apply(legacy,['--require-complete']).status,0);
 assert.notEqual(apply(legacy,['--require-reviewed']).status,0);
 fs.writeFileSync(combined,JSON.stringify({status:'not_for_live_use',books:puzzles}));
 assert.equal(apply(legacy,[],[combined]).status,0,'combined source format also works');
 assert.notEqual(apply(legacy,[],[...inputs,inputs[0]]).status,0,'duplicate source IDs rejected');
 // Mechanical bijection for CLI tests only; never save these fixture choices to source data.
 const state=model.create(puzzles);
 for(const p of puzzles){
  const used=new Set(Object.values(state.assignments[p.id]));
  for(const c of p.clues)if(!c.markerId){const id=c.candidateMarkerIds.find(id=>!used.has(id));model.assign(state,p,c,id);used.add(id)}
 }
 const mapped=model.exportReview(puzzles,state);
 assert.equal(apply(mapped,['--require-complete']).status,0);
 assert.notEqual(apply(mapped,['--require-reviewed']).status,0,'mapped is not geographically confirmed');
 for(const p of puzzles)for(const c of p.clues)model.confirm(state,p,c);
 const approved=model.exportReview(puzzles,state);
 const result=apply(approved,['--require-complete','--require-reviewed']);assert.equal(result.status,0,result.stderr);
 data=JSON.parse(fs.readFileSync(out));assert.equal(data.unassigned,0);assert.equal(data.unreviewed,0);
 assert.equal(data.status,'source_geographically_reviewed_facts_pending','geographic review never makes facts or curriculum live');
 for(const mutate of [
  x=>{x.assignments[puzzles[0].id]['999']='unknown'},
  x=>{x.confirmations[puzzles[0].id][1].x+=1},
  x=>{x.assignments.unknown={}},
  x=>{x.confirmations[puzzles[0].id][1].clueText='changed'},
  x=>{x.confirmations[puzzles[0].id][1]=null},
  x=>{x.assignments[puzzles[0].id]=[]}
 ]){const invalid=structuredClone(approved);mutate(invalid);assert.notEqual(apply(invalid).status,0)}
 const received=JSON.parse(fs.readFileSync('data/import-staging/review-assignments.json'));
 const actual=model.stats(puzzles,model.restore(puzzles,received));
 const applied=apply(received);assert.equal(applied.status,0,applied.stderr);
 const output=JSON.parse(fs.readFileSync(out));
 assert.equal(output.unassigned,actual.total-actual.done);
 assert.equal(output.unreviewed,actual.total-actual.confirmed);
 if(actual.done===actual.total)assert.equal(apply(received,['--require-complete']).status,0);
 if(actual.confirmed<actual.total)assert.notEqual(apply(received,['--require-reviewed']).status,0,'received legacy mapping must not manufacture approval');
 console.log('PASS: separate/combined files, incomplete fixtures, v1/v2 migration, actual editorial mapping and no manufactured geographic approvals.');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
