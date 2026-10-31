import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import model from '../tools/rehearsal-model.js';
import semantic from '../engine/semantic.js';
import {fingerprint,adaptCatalog,loadL1Sources} from '../tools/catalog-adapter.mjs';
const read=n=>JSON.parse(fs.readFileSync('data/import-staging/'+n+'.json')),p=read('l1-first-rehearsal'),src=loadL1Sources(),sha=fingerprint(p),template=model.create(p,sha),s=structuredClone(template);
const sourceBytes=Object.fromEntries(Object.keys(p.sourceHashes).map(path=>[path,fs.readFileSync(path)]));for(const [path,bytes] of Object.entries(sourceBytes))assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),p.sourceHashes[path]);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.authored.map)).digest('hex'),p.mapSha256);
assert.equal(p.status,'not_for_live_use');assert.equal(p.humanReview.futureVariantsCovered,false);assert.equal(p.humanReview.ageSuitability,null);assert.equal(p.humanReview.factAccuracy,null);assert.equal(p.humanReview.independentSpatialMemberships,null);
assert.deepEqual(p.practices.map(x=>x.answer),['ATLAS','GLOBE','MAPPING','REGION','BORDER','SPHERE']);
const origin=src.staging.puzzles[0],cueMap=new Map(p.authored.clues.map(c=>[c.markerId,{id:'source-l1-01-clue-'+c.position,text:{en:c.text.replace(/^The \w+ letter /,'').replace(/\.$/,'')}}]));
for(const q of p.practices){assert.equal(fingerprint(q),p.humanReview.variantSha256[q.id],'frozen visually checked variants cannot silently regenerate');const generated=semantic.generateAnchored({word:q.answer,anchors:origin.markers,cues:a=>[cueMap.get(a.id)],geometry:{widthPx:300,heightPerWidth:1024/1181},seed:'review-only-l1-01-'+q.dictionaryId});assert.deepEqual(q.markers,generated.markers);assert.deepEqual(q.clues,generated.clues);assert(q.markers.every(m=>!m.pointsTo));assert.equal(q.geographicResolution,'not_verified')}
assert.equal(model.phase(p,s),'before');assert.equal(model.submit(p,s).credited,false);model.acknowledge(p,s);assert.equal(model.phase(p,s),'authored');
assert.equal(model.submit(p,s).reason,'INCOMPLETE');assert.equal(model.score(p,s),0);
let q=model.puzzle(p,s);model.select(p,s,q.clues[1].markerId);q.clues.filter(c=>c.markerId!==s.selected[0]).forEach(c=>model.select(p,s,c.markerId));assert.equal(model.submit(p,s).reason,'INCORRECT');assert.equal(model.score(p,s),0);assert.equal(s.errors,1);s.selected=[];
q.clues.forEach(c=>model.select(p,s,c.markerId));assert(model.submit(p,s).credited);assert.equal(model.score(p,s),1);assert.equal(model.phase(p,s),'after');assert.equal(model.submit(p,s).credited,false);model.acknowledge(p,s);
q=model.puzzle(p,s);model.select(p,s,q.clues[0].markerId);assert.deepEqual(model.restore(p,template,s),s,'partial marker IDs and teaching screens survive reload');s.selected=[];
for(let i=0;i<6;i++){q=model.puzzle(p,s);assert.equal(q.dictionaryId,p.practices[i].dictionaryId);q.clues.forEach(c=>model.select(p,s,c.markerId));const r=model.submit(p,s);assert(r.credited);assert.equal(r.advanced,i===5);assert.equal(model.score(p,s),i+2)}
assert.equal(model.phase(p,s),'next');assert.equal(s.progress.stepIndex,1);assert.equal(model.puzzle(p,s),null);assert.equal(model.submit(p,s).credited,false);assert.deepEqual(model.restore(p,template,s),s);
for(const mutate of [r=>r.sourceSha256='0'.repeat(64),r=>r.scope='live',r=>r.beforeRead=false,r=>r.progress.steps.first.solvedWordIds.push('foreign'),r=>r.progress.steps['next-placeholder'].authoredSolved=true,r=>r.selected=['l1-01-glyph-01']]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>model.restore(p,template,bad))}
assert.equal(adaptCatalog(src).curriculum,null,'human review of six finite layouts is not a release approval');for(const [path,bytes] of Object.entries(sourceBytes))assert.deepEqual(fs.readFileSync(path),bytes);
console.log('PASS: frozen six human-checked layouts, source SHA, author learning screens, shared 1+6 credit, correctable errors, partial/reload, no duplicate credit, 7/7 next placeholder, stale/foreign recovery validation; live sources still pending.');
