import fs from 'node:fs';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
const read=name=>JSON.parse(fs.readFileSync('data/import-staging/'+name,'utf8'));
export function loadScript(file,key){const context={window:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{timeout:1000});return JSON.parse(JSON.stringify(context.window[key]))}
export function buildLexicon(proposal,existing,authored){
 if(proposal.status!=='not_for_live_use'||proposal.origin!=='codex_vocabulary_proposal_not_authored')throw Error('Invalid proposal status');
 const forbidden=new Set(authored.map(a=>a.word.toUpperCase()));
 const entries=new Map(existing.map(w=>[w.id,{id:w.id,status:'editorial_pending',word:w.word,definition:{en:w.definition},conceptFamily:w.conceptFamily,guessabilityProposal:w.guessability,
  origin:'existing_pilot_draft',sourceReference:'data/dictionary.js',introducedFacts:null}]));
 const stepIds=new Set(),chosen=new Set();
 const practicePlans=proposal.steps.map(step=>{
  if(stepIds.has(step.stepId)||step.words.length!==6)throw Error('Each proposed step needs six words');stepIds.add(step.stepId);
  const candidateWordIds=step.words.map(([word,definition])=>{
   if(!/^[A-Z]{4,15}$/.test(word))throw Error('Invalid proposed word');
   if(forbidden.has(word))throw Error('Authored answer is forbidden in practice: '+word);
   if(chosen.has(word))throw Error('Repeated word in L1 proposal: '+word);chosen.add(word);
   const id=word.toLowerCase(),prior=entries.get(id);
   if(prior){if(definition!==null||prior.word!==word)throw Error('Existing lexicon word must be referenced without redefining it: '+word)}
   else{
    if(typeof definition!=='string'||!definition.trim())throw Error('Missing draft definition');
    entries.set(id,{id,status:'editorial_pending',word,definition:{en:definition},conceptFamily:id,guessabilityProposal:null,origin:'codex_proposal_not_authored',sourceReference:'data/import-staging/l1-practice-vocabulary-proposals.json',introducedFacts:null});
   }
   return id;
  });
  return {stepId:step.stepId,status:'editorial_pending',authoredFirst:true,target:7,practiceCount:6,candidateWordIds,
   themeProposal:step.themeProposal,geometryStatus:'not_verified',teachingOrderStatus:'editorial_pending',generatedPuzzles:[]};
 });
 return {schemaVersion:1,status:'not_for_live_use',warning:'Global lexicon draft: existing Rivers vocabulary plus proposed L1 additions. No teaching facts are unlocked by these definitions. Plans are not generated puzzles.',entries:[...entries.values()],practicePlans};
}
export const serializeLexicon=data=>JSON.stringify(data,null,2)+'\n';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=buildLexicon(read('l1-practice-vocabulary-proposals.json'),loadScript('data/dictionary.js','GEOWORD_DICTIONARY'),loadScript('data/authored-answer-index.js','GEOWORD_AUTHORED_ANSWERS'));
 const file='data/import-staging/lexicon-draft.json',content=serializeLexicon(result);
 if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==content)throw Error('Lexicon differs from source proposals')}
 else fs.writeFileSync(file,content);
 console.log(`Lexicon draft: ${result.entries.length} pending words, ${result.practicePlans.length} L1 plans, ${result.practicePlans.reduce((n,p)=>n+p.candidateWordIds.length,0)} distinct practice slots.`);
}
