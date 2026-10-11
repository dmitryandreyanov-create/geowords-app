import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const core=require('../engine/geowords.js');
const sandbox={window:{}};
vm.createContext(sandbox);
for(const name of ['data/dictionary.js','data/courses.js','data/levels.js','data/rivers-authored.js']){
  vm.runInContext(fs.readFileSync(name,'utf8'),sandbox,{filename:name});
}
const practice=sandbox.window.GEOWORD_DICTIONARY;
const course=sandbox.window.GEOWORD_COURSES.rivers;
const authors=sandbox.window.GEOWORD_RIVERS_AUTHORED;
const oldMountains=core.fromAuthored(sandbox.window.GEOWORD_LEVELS);
const dictionary=core.buildDictionary(oldMountains,practice);

assert.equal(oldMountains.length,11,'Mountains preserved');
assert.equal(course.steps.length,3,'first three original River steps implemented');
assert.equal(course.target,7,'seven completions per step');
assert.equal(authors.length,course.steps.length);
assert.equal(dictionary.length,practice.length+oldMountains.length);

const authoredById=new Map(authors.map(p=>[p.id,p]));
assert.equal(authoredById.size,authors.length);

for(let i=0;i<course.steps.length;i++){
  const step=course.steps[i];
  const original=authoredById.get(step.authoredPuzzleId);
  assert(original,'original PDF puzzle must be imported for each step');
  assert.equal(original.source,'authored');
  assert.equal(original.courseId,course.id);
  assert.equal(original.stepIndex,i);
  assert.equal(step.wordIds.length,6,'six practice words per original');
  assert.equal(new Set(step.wordIds).size,6,'six distinct words');
  const byId=new Map(original.markers.map(m=>[m.id,m]));
  assert.equal(original.markers.length,original.answer.length);
  assert.equal(original.clues.length,original.answer.length);
  assert.equal(original.clues.map(clue=>byId.get(clue.markerId)?.letter).join(''),original.answer);
  assert(fs.existsSync(original.map.slice(2)),'original book map exists');
  for(const m of original.markers){
    assert(Number.isFinite(m.x)&&m.x>=0&&m.x<=100);
    assert(Number.isFinite(m.y)&&m.y>=0&&m.y<=100);
  }
  for(const id of step.wordIds)assert(practice.some(p=>p.id===id),'practice word missing: '+id);
}
assert.deepEqual(authors.map(p=>p.answer),['CHANNEL','FLOODPLAIN','RAINFOREST']);

let progress=core.newProgress(course);
assert.equal(progress.schemaVersion,2);
const totals=[];

for(let index=0;index<course.steps.length;index++){
  const step=course.steps[index];
  assert.equal(progress.stepIndex,index);
  assert.equal(core.stepScore(progress,step),0);
  assert.equal(core.nextAuthoredPuzzleId(course,progress),step.authoredPuzzleId);
  assert.equal(core.nextWordId(course,progress),null,'practice locked until authored completed');

  const authored=authoredById.get(step.authoredPuzzleId);
  const attemptedPractice={
    source:'generated',courseId:course.id,stepIndex:index,dictionaryId:step.wordIds[0]
  };
  assert.equal(core.markSolved(course,progress,attemptedPractice).credited,false,
    'practice before original cannot count');
  assert.equal(core.markSolved(course,progress,{...authored,id:'unknown-author-id'}).credited,false,
    'different authored puzzle cannot count');

  const first=core.markSolved(course,progress,authored);
  assert(first.credited,'original puzzle counts once');
  assert.equal(first.count,1);
  assert(!first.advanced,'first authored completion must not advance');
  progress=first.progress;
  assert.equal(core.nextAuthoredPuzzleId(course,progress),null);
  assert.equal(core.markSolved(course,progress,authored).credited,false,
    'replayed authored puzzle must not count');

  for(let practiceIndex=0;practiceIndex<6;practiceIndex++){
    const puzzle=core.generate(course,dictionary,progress,practiceIndex);
    assert(puzzle,'must generate one practice puzzle');
    assert.equal(puzzle.source,'generated');
    assert.equal(puzzle.dictionaryId,step.wordIds[practiceIndex]);
    assert.equal(puzzle.markers.length,puzzle.answer.length);
    assert.equal(puzzle.clues.length,puzzle.answer.length);
    const markers=new Map(puzzle.markers.map(m=>[m.id,m]));
    assert.equal(puzzle.clues.map(c=>markers.get(c.markerId)?.letter).join(''),puzzle.answer);
    assert(puzzle.features.some(f=>f.id===step.id),'current river layer is present');
    for(let prior=0;prior<=index;prior++){
      assert(puzzle.features.some(f=>f.id===course.steps[prior].id),
        'previous rivers remain visible');
    }

    for(let variant=0;variant<20;variant++){
      const v=core.generate(course,dictionary,progress,variant);
      assert.equal(v.answer,puzzle.answer,'same word in different placements');
      assert.equal(v.markers.length,v.answer.length);
      assert.equal(v.clues.length,v.answer.length);
    }

    const updated=core.markSolved(course,progress,puzzle);
    assert(updated.credited);
    assert.equal(updated.count,practiceIndex+2);
    assert.equal(updated.advanced,practiceIndex===5 && index<course.steps.length-1,
      'automatic transition only on seventh completion');
    assert.equal(updated.finished,practiceIndex===5 && index===course.steps.length-1);
    progress=updated.progress;
    assert.equal(core.markSolved(course,progress,puzzle).credited,false,
      'replayed generated word cannot add credit');
    if(practiceIndex<5)assert.equal(progress.stepIndex,index);
    totals.push(updated.count);
  }

  if(index<course.steps.length-1){
    assert.equal(progress.stepIndex,index+1);
    assert.equal(core.nextAuthoredPuzzleId(course,progress),
      course.steps[index+1].authoredPuzzleId,'next step always starts with authored puzzle');
  }
}

const finalStep=course.steps.at(-1);
assert.equal(core.stepScore(progress,finalStep),7);
assert.equal(core.generate(course,dictionary,progress),null,'no new counted words after 7/7');
for(let variant=0;variant<20;variant++){
  const review=core.generate(course,dictionary,progress,variant,true);
  assert(review.review);
  assert(review.title.includes('Review word'));
  assert.equal(core.markSolved(course,progress,review).credited,false,
    'unlimited review never awards points');
}
assert.equal(totals.filter(n=>n===7).length,3);
const restored=core.normalizeProgress(JSON.parse(JSON.stringify(progress)),course);
assert.equal(restored.stepIndex,2);
assert.equal(restored.steps[finalStep.id].solvedWordIds.length,6);

const migrated=core.normalizeProgress({
 version:1,courseId:'rivers',stepIndex:1,
 solved:[['delta','basin','source','mouth','stream','channel','river'],[],[]]
},course);
assert.equal(migrated.steps.nile.authoredSolved,false,'old pilot must not invent original completion');
assert.equal(migrated.steps.nile.solvedWordIds.length,6,'old earned word IDs are retained');
assert.equal(migrated.stepIndex,0,'original puzzle remains required after migration');

const renamed=core.normalizeProgress({
 schemaVersion:2,courseId:'rivers',stepIndex:0,
 steps:{nile:{authoredSolved:true,solvedWordIds:['renamed-term']}}
},course);
assert.equal(renamed.steps.nile.solvedWordIds.length,1,
 'editor renaming a term must not erase previously earned progress');

console.log('PASS: 3 original PDF puzzles + 18 generated practice words (1+6 each), automatic 7/7 advances, replay protection, v1→v2 migration, course persistence, 360 generated variants and unchanged Mountains.');
