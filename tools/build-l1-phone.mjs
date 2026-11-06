import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadL1Sources,fingerprint} from './catalog-adapter.mjs';
import semantic from '../engine/semantic.js';

// Playable source-association drafts, explicitly separate from approved Curriculum.
// No geographic membership or editorial approval is inferred here.
export function buildPhoneL1(){
 const s=loadL1Sources(),first=JSON.parse(fs.readFileSync('data/import-staging/l1-first-rehearsal.json'));
 const id='geowords-l1-phone-trial-v1',known=new Set(),course=s.draft.courses.find(c=>c.id==='oceans-continents');
 const facts=ids=>ids.map(id=>{const f=s.draft.facts.find(f=>f.id===id);if(!f)throw Error('Missing fact '+id);return f.text.en});
 const steps=course.steps.map((step,stepIndex)=>{
  step.candidateLearnBefore.forEach(f=>known.add(f));
  const source=s.staging.puzzles.find(p=>p.id===step.authoredPuzzleId),plan=s.lexicon.practicePlans.find(p=>p.stepId===step.id);
  const anchors=s.catalog.anchors.filter(a=>a.puzzleId===source.id);
  const descriptors=s.catalog.descriptors.filter(d=>d.occurrences.some(o=>o.puzzleId===source.id));
  if(descriptors.some(d=>d.candidateRequiresFacts.some(f=>!known.has(f))))throw Error('Future fact in authored '+source.id);
  const map=source.map.replace('assets/import-staging/','assets/l1-trial/');
  const authored={id:source.id,source:'authored',courseId:id,title:source.answer,unit:'L1 test · '+(stepIndex+1)+'/10',answer:source.answer,map,mapAspect:source.mapAspect,markers:source.markers,clues:source.clues.map(c=>({position:c.position,text:c.text,markerId:s.assignments.assignments[source.id]?.[c.position]||c.markerId})),definition:source.answer,introFacts:facts(step.candidateLearnBefore),nextFacts:facts(step.candidateUnlockAfter)};
  step.candidateUnlockAfter.forEach(f=>known.add(f));
  const seen=s.staging.puzzles.slice(0,stepIndex+1),seenIds=new Set(seen.map(p=>p.id));
  const available=s.catalog.anchors.filter(a=>seenIds.has(a.puzzleId));
  const cues=(a,selected)=>s.catalog.descriptors.filter(d=>d.candidateRequiresFacts.every(f=>known.has(f))&&d.occurrences.some(o=>seenIds.has(o.puzzleId)&&o.selectedAnchorId===a.id)&&selected.filter(other=>d.occurrences.some(o=>seenIds.has(o.puzzleId)&&o.selectedAnchorId===other.id)).length===1).map(d=>({id:d.id,text:d.sourcePredicate}));
  const practices=plan.candidateWordIds.map(dictionaryId=>{
   const e=s.lexicon.entries.find(e=>e.id===dictionaryId);if(!e)throw Error('Missing word '+dictionaryId);
   const frozen=stepIndex===0?first.practices.find(p=>p.dictionaryId===dictionaryId):null;
   let layout=frozen,practiceSource=source;
   // Prefer the current author's scope; if it is too small, reuse already seen
   // points on the same bitmap, then another already seen author's bitmap.
   if(!layout)for(const candidate of [source,...seen.slice().reverse()]){
    const pools=candidate.id===source.id?[anchors,available.filter(a=>a.mapId===candidate.map)]:[available.filter(a=>a.mapId===candidate.map)];
    for(const pool of pools){layout=semantic.generateAnchored({word:e.word,anchors:pool,cues,geometry:{widthPx:300,heightPerWidth:Number(candidate.mapAspect.split('/')[1])/Number(candidate.mapAspect.split('/')[0])},seed:'phone-trial:'+step.id+':'+dictionaryId,attempts:512});if(layout){practiceSource=candidate;break}}
    if(layout)break;
   }
   if(!layout)throw Error('No phone layout for '+step.id+':'+dictionaryId);
   return {...layout,id:'phone:'+step.id+':'+dictionaryId,source:'generated',courseId:id,stepIndex,dictionaryId,title:e.word,unit:'L1 test · '+(stepIndex+1)+'/10',map:practiceSource.map.replace('assets/import-staging/','assets/l1-trial/'),mapAspect:practiceSource.mapAspect,definition:e.definition.en,introFacts:[],nextFacts:[],reviewStatus:stepIndex===0?'fixed_layout_viewed_by_user':'unreviewed_source_association_draft'};
  });
  return {id:step.id,authoredPuzzleId:authored.id,wordIds:plan.candidateWordIds,authored,practices};
 });
 const payload={schemaVersion:1,id,status:'trial_only',editorialStatus:'pending',geographyApproved:false,factsApproved:false,steps,target:7};
 const mapHashes=Object.fromEntries([...new Set(s.staging.puzzles.map(p=>p.map))].map(p=>[p.replace('assets/import-staging/','assets/l1-trial/'),crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
 return {...payload,mapHashes,sourceSha256:fingerprint({...payload,mapHashes})};
}
export const output=p=>'/* L1 phone testing drafts; no editorial approvals. */\nglobalThis.GEOWORD_L1_PHONE='+JSON.stringify(p)+';\n';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const text=output(buildPhoneL1()),path='data/l1-phone.js';if(process.argv.includes('--check')){if(fs.readFileSync(path,'utf8')!==text)throw Error('Stale phone package')}else fs.writeFileSync(path,text);console.log('PASS L1 phone package: 10 original + 60 practice drafts, author fact timing, pending sources.');}
