import assert from 'node:assert/strict';
import model from '../tools/content-review-model.js';
import learning from '../tools/learning-review-model.js';
import {loadL1Sources,fingerprint,adaptCatalog,createEditorialTemplate} from '../tools/catalog-adapter.mjs';
const s=loadL1Sources(),before=fingerprint(s),rows=model.sourceRows(s),hashes=Object.fromEntries(rows.map(r=>[r.key,fingerprint(r.source)])),template=model.create(s,hashes),state=structuredClone(template);
assert.equal(rows.filter(r=>r.key.startsWith('descriptor:')).length,63);assert.equal(rows.filter(r=>r.key.startsWith('word:')).length,60);
for(const row of rows)assert.equal(await model.hash(row.source),hashes[row.key]);
assert(state.records.every(r=>r.status==='editorial_pending'&&Object.values(r.decision).every(v=>v===null)));
const get=key=>state.records.find(r=>r.key===key),digest=data=>Object.fromEntries(data.records.map(r=>[r.key,fingerprint(r.decision)])),checked=kind=>Object.fromEntries(model.checks[kind].map(k=>[k,true]));
assert.deepEqual(model.restore(s,template,state,digest(state)),state);
const dk='descriptor:'+s.catalog.descriptors[0].id,wk='word:atlas',source=s.catalog.descriptors[0];
assert.throws(()=>model.confirm(s,state,dk,'SYNTHETIC TEST',fingerprint(get(dk).decision),checked('descriptor')),/null/);
model.edit(s,state,dk,{text:{en:'Synthetic phrase check, not real content approval.'},kind:'name',query:structuredClone(source.candidateQuery)});
assert.throws(()=>model.confirm(s,state,dk,'SYNTHETIC TEST',fingerprint(get(dk).decision),{}),/все содержательные/);
model.confirm(s,state,dk,'SYNTHETIC TEST ONLY',fingerprint(get(dk).decision),checked('descriptor'));
model.edit(s,state,wk,{word:'ATLAS',definition:{en:'Synthetic definition test only.'}});model.confirm(s,state,wk,'SYNTHETIC TEST ONLY',fingerprint(get(wk).decision),checked('word'));
assert.deepEqual(model.restore(s,template,state,digest(state)),state);
const approved=structuredClone(state);
for(const mutate of [d=>{d.records.find(r=>r.key===wk).decision.definition.en='Changed'},d=>{delete d.records.find(r=>r.key===wk).evidence.checks.ageSuitable},d=>{d.records[0].sourceSha256='a'.repeat(64)},d=>{d.records[1]=d.records[0]},d=>{d.records.pop()},d=>{d.scope='other'}]){const d=structuredClone(state);mutate(d);assert.throws(()=>model.restore(s,template,d,digest(d)));assert.deepEqual(state,approved)}
model.edit(s,state,wk,{...get(wk).decision,definition:{en:'Edited mechanical test'}});assert.equal(get(wk).status,'editorial_pending');assert.equal(get(wk).evidence,null);
assert.throws(()=>model.edit(s,state,wk,{word:'LONGITUDE',definition:{en:'Spoiler test'}}),/переименовывать/);
const spoiler=structuredClone(s);spoiler.authoredAnswers.push('ATLAS');assert.throws(()=>model.edit(spoiler,state,wk,{word:'ATLAS',definition:{en:'Spoiler test'}}),/авторским ответом/);
const invalid={text:{en:'Synthetic'},kind:'name',query:{...source.candidateQuery,requires:['foreign']}};assert.throws(()=>model.edit(s,state,dk,invalid),/зависимости/);
assert.throws(()=>model.edit(s,state,dk,{...invalid,query:{...source.candidateQuery,markerId:'chosen-answer'}}),/назначенный ответ/);
for(const op of ['place','region','side','between','hemisphere','boundary']){
 const src=s.catalog.descriptors.find(d=>d.candidateQuery.op===op),key='descriptor:'+src.id;
 model.edit(s,state,key,{text:structuredClone(src.sourcePredicate),kind:model.kinds.includes(src.kind)?src.kind:'other',query:structuredClone(src.candidateQuery)});
 model.confirm(s,state,key,'SYNTHETIC TEST ONLY',fingerprint(get(key).decision),checked('descriptor'));
}
const partial=adaptCatalog(s,{contentReview:state});assert.equal(partial.curriculum,null);assert(!partial.ready);assert(partial.blockers.some(b=>b.code==='GEOGRAPHY_PENDING'));assert(partial.blockers.some(b=>b.key.startsWith('fact:')&&b.code==='EDITORIAL_PENDING'));
const lessonTemplate=learning.create(s,Object.fromEntries(learning.sourceRows(s).map(r=>[r.key,fingerprint(r.source)]))),stepKey='step:l1-01-step',stepDecision={requiresFacts:[],learnBefore:[],unlockAfter:[],introducedPlaces:[],focusPlaceIds:[],wordIds:s.lexicon.practicePlans[0].candidateWordIds};
learning.edit(s,lessonTemplate,stepKey,stepDecision);learning.confirm(s,lessonTemplate,stepKey,'SYNTHETIC TEST ONLY',fingerprint(stepDecision));
const changedDependencies=structuredClone(state),r=changedDependencies.records.find(r=>r.key===dk),changedDecision=structuredClone(r.decision);changedDecision.query.requires=['f-l1-p24-himalayas'];model.edit(s,changedDependencies,dk,changedDecision);model.confirm(s,changedDependencies,dk,'SYNTHETIC TEST ONLY',fingerprint(changedDecision),checked('descriptor'));
const timeline=learning.report(s,lessonTemplate,{contentReview:changedDependencies});assert.equal(timeline[0].dependencyStatus,'mixed_reviewed_and_candidate_dependencies');assert(timeline[0].issues.some(i=>i.factId==='f-l1-p24-himalayas'),'lesson preview uses reviewed query dependencies instead of stale proposals');
const ledger=createEditorialTemplate(s);Object.assign(ledger.records.find(r=>r.key===dk),approved.records.find(r=>r.key===dk));assert(adaptCatalog(s,{editorial:ledger,contentReview:state}).blockers.some(b=>b.code==='INVALID_CONTENT_REVIEW'),'conflicting approved manifest is not overwritten');
model.revoke(state,dk);assert.equal(get(dk).evidence,null);assert.equal(fingerprint(s),before);
console.log('PASS: 63 phrases + 60 vocabulary records, all six structured query types, explicit semantic/pedagogical checks, SHA agreement, atomic stale/foreign import, stable word IDs, authored spoilers and adapter merge without geography/fact/release approval.');
