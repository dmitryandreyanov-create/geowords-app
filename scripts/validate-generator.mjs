import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const core=require('../engine/geowords.js');
const sandbox={window:{}};
vm.createContext(sandbox);
for(const name of ['data/dictionary.js','data/courses.js'])vm.runInContext(fs.readFileSync(name,'utf8'),sandbox,{filename:name});
const words=sandbox.window.GEOWORD_DICTIONARY;
const course=sandbox.window.GEOWORD_COURSES.rivers;
assert.equal(course.steps.length,3);
assert.equal(course.target,7);
assert.equal(new Set(words.map(w=>w.id)).size,words.length);
assert.equal(new Set(words.map(w=>w.word)).size,words.length);
vm.runInContext(fs.readFileSync('data/levels.js','utf8'),sandbox,{filename:'data/levels.js'});
const authored=core.fromAuthored(sandbox.window.GEOWORD_LEVELS);
const combined=core.buildDictionary(authored,words);
assert.equal(authored.length,11,'authored Mountains preserved');
assert.equal(combined.length,authored.length+words.length,'all authored and generated words indexed');
assert(authored.every(item=>item.source==='authored'));
assert(authored.every(item=>combined.some(word=>word.word===item.answer&&word.source==='authored')));

const dictionaryIds=new Set(words.map(w=>w.id));
for(const step of course.steps){
 assert.equal(step.wordIds.length,7);
 assert.equal(new Set(step.wordIds).size,7);
 for(const id of step.wordIds)assert(dictionaryIds.has(id));
}
let progress=core.newProgress(course);
for(let i=0;i<21;i++){
 const p=core.generate(course,words,progress);
 assert(p,'puzzle generated');
 for(let variant=0;variant<20;variant++){
   const v=core.generate(course,combined,progress,variant);
   assert.equal(v.answer,p.answer,'variant must retain the same word');
   assert(v.features.length===progress.stepIndex+1,'new river layers remain cumulative');
 }
 assert.equal(p.source,'generated');
 assert.equal(p.clues.length,p.answer.length);
 assert.equal(p.markers.length,p.answer.length);
 const byId=new Map(p.markers.map(m=>[m.id,m]));
 assert.equal(p.clues.map(c=>byId.get(c.markerId)?.letter).join(''),p.answer);
 assert(p.markers.some(m=>m.id===course.steps[progress.stepIndex].id),'new object included');
 for(const step of course.steps.slice(0,progress.stepIndex+1))assert(p.markers.some(m=>m.id===step.id),'previous objects retained');
 for(let a=0;a<p.markers.length;a++)for(let b=a+1;b<p.markers.length;b++){
  const x=p.markers[a],y=p.markers[b];
  assert(Math.hypot((x.x-y.x)*3.22,(x.y-y.y)*1.81)>=33.9,'anchors separated');
 }
 const old=progress.stepIndex;
 const result=core.markSolved(course,progress,p);
 assert(result.credited);
 const replay=core.markSolved(course,result.progress,p);
 assert(!replay.credited,'replayed puzzle does not count');
 assert.equal(result.advanced,(i%7===6)&&old<2);
 progress=result.progress;
 assert.equal(progress.solved.reduce((acc,v)=>acc+v.length,0),i+1);
}
assert.equal(core.generate(course,words,progress),null);
for(let variant=0;variant<20;variant++){
 const review=core.generate(course,combined,progress,variant,true);
 assert(review.review,'practice replay mode');
 assert(review.title.includes('Review word'),'no incorrect 8/7 label');
 assert.equal(core.markSolved(course,progress,review).credited,false,'review cannot increase course progress');
}
assert.equal(core.normalizeProgress({version:1,courseId:'rivers',stepIndex:900,solved:[['bogus'],['bogus'],['bogus']]},course).stepIndex,0);
console.log('Generator PASS: 11 authored + 21 generated words, 3 cumulative river steps, 420 variants, unlimited review, repeat protection, marker geometry.');