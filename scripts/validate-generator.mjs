import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const core=require('../engine/geowords.js');
const semantic=require('../engine/semantic.js');
const ctx={window:{}};
vm.createContext(ctx);
for(const name of ['data/levels.js','data/dictionary.js','data/rivers-semantics.js','data/courses.js','data/rivers-authored.js']){
  vm.runInContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
}
const course=ctx.window.GEOWORD_COURSES.rivers;
const authored=ctx.window.GEOWORD_RIVERS_AUTHORED;
const curated=core.fromAuthored(ctx.window.GEOWORD_LEVELS);
const dictionary=core.buildDictionary(curated,ctx.window.GEOWORD_DICTIONARY);
const byWord=new Map(dictionary.map(entry=>[entry.id,entry]));
const authoredById=new Map(authored.map(item=>[item.id,item]));
assert.equal(course.target,7);
assert.equal(curated.length,11);
assert.equal(course.steps.length,3);
assert.equal(authored.length,3);
assert.equal(course.semantic.base.length>=20,true);
assert.deepEqual(Array.from(authored,x=>x.answer),['CHANNEL','FLOODPLAIN','RAINFOREST']);
assert.equal(course.semantic.practiceMaps.length,3);
assert.equal(new Set(dictionary.map(row=>row.id)).size,dictionary.length);
assert.equal(new Set(course.steps.flatMap(s=>s.wordIds)).size,18,'18 unique practice terms');
assert.equal(authored[1].markers.filter(m=>m.pointsTo).length,2,'PDF arrow layer page 8');
assert.equal(authored[2].markers.filter(m=>m.pointsTo).length,3,'PDF arrow layer page 10');
for(let i=0;i<3;i++){
 const step=course.steps[i],original=authoredById.get(step.authoredPuzzleId);
 assert(original&&original.source==='authored');
 assert.equal(original.courseId,course.id);
 assert.equal(original.stepIndex,i);
 assert.equal(step.wordIds.length,6);
 assert(fs.existsSync(original.map.replace(/^\.\//,'')));
 assert(fs.existsSync(step.practiceMap.replace(/^\.\//,'')));
 assert.equal(original.clues.length,original.answer.length);
 assert.equal(original.markers.length,original.answer.length);
 const markers=new Map(original.markers.map(m=>[m.id,m]));
 assert.equal(original.clues.map(c=>markers.get(c.markerId)?.letter).join(''),original.answer);
 assert.equal(new Set([original.answer,...step.wordIds.map(id=>byWord.get(id)?.word)]).size,7,'seven distinct answers');
 for(const wordId of step.wordIds){
  const entry=byWord.get(wordId);
  assert(entry&&entry.word.length>=5&&entry.guessability!=='easy','no easy/spoiler term in practice: '+wordId);
 }
}
for(const river of Object.values(course.semantic.rivers)){
 const select=river.map(item=>({...item}));
 for(const a of select){
  assert(a.pointsTo,'all river anchors have pointer target');
  assert((a.cues||[]).some(c=>select.filter(p=>p.regions.includes(c[1])).length===1),'same-river anchor must have distinguishing descriptor: '+a.id);
 }
}
let progress=core.newProgress(course);
assert.equal(progress.schemaVersion,2);
for(let i=0;i<3;i++){
 const step=course.steps[i],original=authoredById.get(step.authoredPuzzleId);
 assert.equal(progress.stepIndex,i);
 assert.equal(core.stepScore(progress,step),0);
 assert.equal(core.nextWordId(course,progress),null,'no practice before workbook');
 const before=core.markSolved(course,progress,{source:'generated',courseId:course.id,stepIndex:i,dictionaryId:step.wordIds[0]});
 assert.equal(before.credited,false);
 const first=core.markSolved(course,progress,original);
 assert(first.credited&&first.count===1&&!first.advanced);
 progress=first.progress;
 assert.equal(core.markSolved(course,progress,original).credited,false,'original repeat blocked');
 const seen=new Set([original.answer]);
 for(let j=0;j<6;j++){
  const puzzle=core.generate(course,dictionary,progress,j);
  assert(puzzle,'valid practice puzzle at step '+i+' word '+j);
  assert.equal(puzzle.source,'generated');
  assert.equal(puzzle.map,step.practiceMap,'the author map is reused for practice');
  assert(semantic.verify(puzzle,course.semantic),'descriptors and geometry resolve uniquely');
  assert(!seen.has(puzzle.answer),'no word repeated at step '+i);
  seen.add(puzzle.answer);
  const current=course.semantic.rivers[step.id];
  const count=puzzle.markers.filter(m=>current.some(a=>a.id===m.id)).length;
  assert(count/puzzle.answer.length>=.35,'at least 35% of letters practise the newest river');
  assert.equal(puzzle.markers.length,puzzle.answer.length);
  assert.equal(puzzle.clues.length,puzzle.answer.length);
  for(let v=0;v<30;v++){
   const variant=core.generate(course,dictionary,progress,v);
   assert(variant&&semantic.verify(variant,course.semantic),'semantic variant resolves uniquely');
  }
  const result=core.markSolved(course,progress,puzzle);
  assert(result.credited);
  assert.equal(result.count,j+2);
  assert.equal(result.advanced,(j===5&&i<2));
  assert.equal(result.finished,(j===5&&i===2));
  progress=result.progress;
  assert.equal(core.markSolved(course,progress,puzzle).credited,false,'no replay credit');
 }
 assert.equal(seen.size,7);
 if(i<2)assert.equal(progress.stepIndex,i+1);
}
assert.equal(core.stepScore(progress,course.steps.at(-1)),7);
assert.equal(core.generate(course,dictionary,progress),null);
for(let variant=0;variant<500;variant++){
 const puzzle=core.generate(course,dictionary,progress,variant,true);
 assert(puzzle&&puzzle.review&&semantic.verify(puzzle,course.semantic));
 assert.equal(core.markSolved(course,progress,puzzle).credited,false);
}
const validProgress=core.normalizeProgress(JSON.parse(JSON.stringify(progress)),course);
assert.equal(validProgress.stepIndex,2,'valid state persisted');
for(const input of [
 {version:1,courseId:'rivers',solved:[['channel','river','delta','basin','source','mouth'],[],[]]},
 {schemaVersion:2,courseId:'rivers',steps:{nile:{authoredSolved:true,solvedWordIds:['fake','totally-unknown','channel','RIVER','other','meander']}}}
]){
 const state=core.normalizeProgress(input,course);
 assert.equal(state.stepIndex,0,'forged or stale terms do not skip original/practice step');
 assert(state.steps.nile.solvedWordIds.every(id=>course.steps[0].wordIds.includes(id)));
}
const fake=core.normalizeProgress({schemaVersion:2,courseId:'rivers',steps:{nile:{authoredSolved:true,solvedWordIds:['aquifer']}}},course);
assert.equal(fake.steps.nile.solvedWordIds.length,1,'valid saved word persists');
const longCourse={...course,steps:[...course.steps,...['extra4','extra5','extra6'].map(id=>({id,wordIds:['bank','aquifer'],object:{label:id},practiceMap:course.steps[2].practiceMap,authoredPuzzleId:'none'}))]};
assert.equal(semantic.generate(longCourse,{id:'bank',word:'BANK',definition:'x'},5,0,false,core.newProgress(longCourse)),null,
 'short word cannot make extra undefined markers after many objects');
// Stress each step's authored-map generator on 10,000 deterministic variants.
let checked=0;
for(let i=0;i<3;i++){
 const step=course.steps[i];
 const progressForStep=core.newProgress(course);
 for(let k=0;k<i;k++){
  progressForStep.steps[course.steps[k].id].authoredSolved=true;
  progressForStep.steps[course.steps[k].id].solvedWordIds=[...course.steps[k].wordIds];
 }
 progressForStep.steps[step.id].authoredSolved=true;
 for(let v=0;v<10000;v++){
  const wordId=step.wordIds[v%step.wordIds.length];
  const entry=byWord.get(wordId);
  const puzzle=semantic.generate(course,entry,i,v,false,progressForStep);
  assert(puzzle&&semantic.verify(puzzle,course.semantic),`ambiguous or invalid semantic variant ${i}:${v}`);
  checked++;
 }
}
console.log('PASS: 3 PDF originals, 18 advanced unique practice answers, authored cumulative maps, 5 PDF arrows, rule 1+6, forged progress rejected, '+checked+' unambiguous generated samples, finished review and preserved Mountains.');
