import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const semantic=require('../engine/semantic.js');
const sandbox={window:{}};
vm.createContext(sandbox);
for(const file of ['data/authored-answer-index.js','data/rivers-semantics.js','data/dictionary.js','data/courses.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const {GEOWORD_AUTHORED_ANSWERS:authored,GEOWORD_DICTIONARY:lexicon,GEOWORD_COURSES:courses}=sandbox.window;
const course=courses.rivers, cfg=course.semantic;
const errors=[];
const fail=msg=>{errors.push(msg);};
assert.equal(authored.length,62,'61 numbered author puzzles plus Mountains bonus');
assert.equal(course.steps.length,3);
assert.equal(lexicon.length,18);
assert.equal(new Set(authored.map(x=>x.id)).size,62);
assert.equal(new Set(lexicon.map(x=>x.id)).size,18);
assert.equal(new Set(lexicon.map(x=>x.word)).size,18);
const official=authored.map(x=>x.word.toUpperCase());
const words=new Map(lexicon.map(x=>[x.id,x]));
for(const row of lexicon){
  assert(/^[A-Z]+$/.test(row.word));
  assert(row.word.length>=5&&row.word.length<=8,'3 river points can train at least 35% of letters: '+row.word);
  assert.notEqual(row.guessability,'easy');
  for(const authWord of official){
    assert(!(authWord.includes(row.word)||row.word.includes(authWord)),`spoiler against authored word: ${row.word}/${authWord}`);
  }
}
for(let i=0;i<lexicon.length;i++)for(let j=i+1;j<lexicon.length;j++){
  const a=lexicon[i],b=lexicon[j];
  assert(!(a.word.includes(b.word)||b.word.includes(a.word)),`overlapping practice words: ${a.word}/${b.word}`);
  assert(a.conceptFamily!==b.conceptFamily,`same-family practice words: ${a.id}/${b.id}`);
}
assert.equal(new Set(course.steps.flatMap(x=>x.wordIds)).size,18);
for(const step of course.steps){
  assert.equal(step.wordIds.length,6);
  assert.equal(cfg.rivers[step.id].length,3,'precisely three visually distinguishable river anchors');
  for(const a of cfg.rivers[step.id]){
    assert(a.pointsTo,'river letter must point at the intended geographic location: '+a.id);
    assert(a.cues.length>0);
    for(const other of cfg.rivers[step.id])if(other!==a){
      assert(a.cues.some(cue=>!semantic.matchesRegion(other,cue[1])),`cues must distinguish ${a.id} from ${other.id}`);
    }
  }
  for(const id of step.wordIds)assert(words.has(id),'unknown dictionary entry '+id);
}
const missMiddle=cfg.rivers.mississippi.find(a=>a.id==='mississippi-middle');
const northAmerica=cfg.base.find(a=>a.id==='north-america');
assert(semantic.arrowIntersectsMarker(missMiddle,northAmerica),
  'fixture: Mississippi arrow crosses an existing land marker');
assert(!semantic.arrowsClear([missMiddle,northAmerica]),
  'arrow shaft must not cross a selectable neighboring marker');
const missMouth=cfg.rivers.mississippi.find(a=>a.id==='mississippi-south');
assert.equal(missMouth.pointsTo.x,18.6,'arrow tip aligned to author map');
assert.equal(missMouth.pointsTo.y,34.5,'arrow tip aligned to river mouth');
const baseById=new Map(cfg.base.map(a=>[a.id,a]));
const riverById=new Map(Object.values(cfg.rivers).flat().map(a=>[a.id,a]));
assert(semantic.matchesRegion(riverById.get('amazon-west'),'pacific-ocean'));
assert(semantic.matchesRegion(riverById.get('amazon-mouth'),'atlantic-ocean'));
assert(semantic.matchesRegion(riverById.get('nile-north'),'atlantic-ocean'));
assert(!semantic.matchesRegion(baseById.get('pacific-central'),'amazon-west'));
// This must be rejected: even though the Amazon river is in South America,
// the letter linked to it can physically sit in the Pacific Ocean.
let ambiguous=[riverById.get('amazon-west'),baseById.get('pacific-central')];
assert(ambiguous.filter(a=>semantic.matchesRegion(a,'pacific-ocean')).length===2);
let total=0,riverLetters=0;
const previous = id=>({steps:Object.fromEntries(course.steps.map(st=>[st.id,{solvedWordIds:[]}]))});
for(let stepIndex=0;stepIndex<3;stepIndex++){
  const step=course.steps[stepIndex];
  const progress=previous();
  for(const wordId of step.wordIds){
    const entry=words.get(wordId);
    for(let variant=0;variant<1667;variant++){
      const puzzle=semantic.generate(course,entry,stepIndex,variant,false,progress);
      if(!puzzle){fail(`Null generated for ${step.id}/${entry.word}/variant ${variant}`);continue;}
      assert(semantic.verify(puzzle,cfg),`semantic invariant failed for ${puzzle.id}`);
      assert.equal(puzzle.answer,puzzle.markers.map(m=>m.letter).join(''));
      assert.equal(puzzle.clues.length,puzzle.answer.length);
      assert.equal(puzzle.map,step.practiceMap);
      const count=puzzle.markers.filter(m=>cfg.rivers[step.id].some(r=>r.id===m.id)).length;
      assert(count/puzzle.answer.length>=0.35);
      riverLetters+=count;total++;
    }
  }
}
if(errors.length)throw Error(errors.slice(0,12).join('\n'));
console.log(`PASS F1-F4: ${total} generated variants, ${riverLetters} newest-river letters, 18 non-spoiler words, 62 original answers, arrows, and physical-letter semantics.`);
