import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildLexicon,loadScript,serializeLexicon} from '../tools/build_lexicon_draft.mjs';
const read=name=>JSON.parse(fs.readFileSync('data/import-staging/'+name));
const proposed=read('l1-practice-vocabulary-proposals.json'),draft=read('lexicon-draft.json');
const existing=loadScript('data/dictionary.js','GEOWORD_DICTIONARY'),authored=loadScript('data/authored-answer-index.js','GEOWORD_AUTHORED_ANSWERS');
assert.equal(serializeLexicon(draft),serializeLexicon(buildLexicon(proposed,existing,authored)));
assert.equal(draft.status,'not_for_live_use');assert.equal(draft.entries.length,77);assert.equal(draft.practicePlans.length,10);
const entries=new Map(draft.entries.map(e=>[e.id,e])),forbidden=new Set(authored.map(a=>a.word));
assert.equal(entries.size,77);
for(const e of entries.values()){
 assert.equal(e.status,'editorial_pending');assert.equal(e.introducedFacts,null);
 assert(!forbidden.has(e.word),'do not spoil any of the 62 authored answers');
 assert.match(e.word,/^[A-Z]{4,15}$/);assert.equal(typeof e.definition.en,'string');assert(e.definition.en.length>0);
 if(e.origin==='existing_pilot_draft')assert.equal(e.definition.en,existing.find(w=>w.id===e.id).definition);
 else{assert.equal(e.origin,'codex_proposal_not_authored');assert.equal(e.guessabilityProposal,null)}
}
assert.equal(draft.entries.filter(e=>e.origin==='existing_pilot_draft').length,18);
assert.equal(draft.entries.filter(e=>e.origin==='codex_proposal_not_authored').length,59);
const curriculum=read('curriculum-draft.json'),course=curriculum.courses.find(c=>c.id==='oceans-continents');
const chosen=[];
for(const p of draft.practicePlans){
 const step=course.steps.find(s=>s.id===p.stepId);assert(step);
 assert.equal(p.status,'editorial_pending');assert.equal(p.target,7);assert.equal(p.practiceCount,6);assert.equal(p.authoredFirst,true);
 assert.equal(p.candidateWordIds.length,6);assert.equal(new Set(p.candidateWordIds).size,6);
 assert.equal(p.geometryStatus,'not_verified');assert.equal(p.teachingOrderStatus,'editorial_pending');assert.deepEqual(p.generatedPuzzles,[]);
 for(const id of p.candidateWordIds){assert(entries.has(id));chosen.push(id)}
 assert.deepEqual(step.wordIds,[],'candidate plan must not change runtime words');assert.equal(step.introducedPlaces,null);assert.equal(step.learnBefore,null);
}
assert.equal(new Set(chosen).size,60);assert.deepEqual(curriculum.lexicon,[],'new draft must not silently approve the curriculum lexicon');
for(const mutate of [p=>{p.steps[0].words[0][0]='CONTINENT'},p=>{p.steps[1].words[0]=p.steps[0].words[0]},p=>{p.steps[0].words.pop()},p=>{p.steps[6].words[5][1]='A new conflicting definition.'}]){
 const bad=structuredClone(proposed);mutate(bad);assert.throws(()=>buildLexicon(bad,existing,authored));
}
if(fs.existsSync('dist'))for(const file of ['data/import-staging/lexicon-draft.json','data/import-staging/l1-practice-vocabulary-proposals.json','docs/L1_PRACTICE_DRAFT.md','tools/build_lexicon_draft.mjs'])assert(!fs.existsSync('dist/'+file),'draft excluded from Pages');
console.log('PASS: 77 pending global lexicon entries, 60 distinct L1 candidate words, 18 pilot definitions unchanged; 1+6, 62-answer exclusion, no generated puzzles or unlocked facts.');
