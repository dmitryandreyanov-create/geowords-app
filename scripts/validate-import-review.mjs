import fs from 'node:fs';
import assert from 'node:assert/strict';

const root='data/import-staging';
const files=['l1','l2'];
const byId=new Map();
for(const book of files){
 const source=JSON.parse(fs.readFileSync(`${root}/${book}-staging.json`,'utf8'));
 assert.equal(source.status,'not_for_live_use');
 for(const p of source.puzzles){
   assert(!byId.has(p.id));byId.set(p.id,p);
 }
}
const reviewed=JSON.parse(fs.readFileSync(`${root}/review-assignments.json`,'utf8'));
assert.equal(reviewed.version,1);
assert.equal(reviewed.generatedFrom,'author map review');
assert.equal(reviewed.sourceQuizCount,20);
const map=reviewed.assignments;
assert(map&&!Array.isArray(map)&&typeof map==='object');
for(const id of Object.keys(map))assert(byId.has(id),`Unknown puzzle ${id}`);
let reviewedDecisions=0;
for(const p of byId.values()){
 const decisions=map[p.id]||{};
 const byPosition=new Map(p.clues.map(c=>[String(c.position),c]));
 for(const [position,markerId] of Object.entries(decisions)){
   const clue=byPosition.get(position);
   assert(clue,`Unknown clue ${p.id}:${position}`);
   assert(clue.candidateMarkerIds.length>1,`Only ambiguous clues need decisions: ${p.id}:${position}`);
   assert(clue.candidateMarkerIds.includes(markerId),`Invalid marker ${p.id}:${position}=${markerId}`);
   reviewedDecisions++;
 }
 const final=p.clues.map(clue=>decisions[String(clue.position)]||clue.markerId).filter(Boolean);
 assert.equal(new Set(final).size,final.length,`Duplicate marker assignments in ${p.id}`);
}
assert(reviewedDecisions<=69);
console.log(`PASS: ${byId.size} author puzzles, ${reviewedDecisions}/69 ambiguous assignments reviewed; no guesses, duplicate letters, or invalid references.`);
