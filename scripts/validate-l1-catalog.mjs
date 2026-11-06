import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildCatalog,serializeCatalog} from '../tools/build_l1_catalog.mjs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const staging=read('data/import-staging/l1-staging.json');
const mapping=read('data/import-staging/review-assignments.json');
const curriculum=read('data/import-staging/curriculum-draft.json');
const catalog=read('data/import-staging/l1-catalog-draft.json');
assert.equal(fs.readFileSync('data/import-staging/l1-catalog-draft.json','utf8'),serializeCatalog(buildCatalog(staging,mapping,curriculum)));
assert.equal(catalog.status,'not_for_live_use');
assert.equal(catalog.places.length,21);assert.equal(catalog.anchors.length,97);assert.equal(catalog.descriptors.length,63);assert.equal(catalog.audit.length,97);
const places=new Map(catalog.places.map(p=>[p.id,p]));
const anchors=new Map(catalog.anchors.map(a=>[a.id,a]));
const descriptors=new Map(catalog.descriptors.map(d=>[d.id,d]));
const facts=new Map(curriculum.facts.map(f=>[f.id,f]));
assert.equal(places.size,21);assert.equal(anchors.size,97);assert.equal(descriptors.size,63);
for(const p of places.values()){assert.equal(p.status,'editorial_pending');assert.equal(p.introducedBy,null);assert.deepEqual(p.anchors,[])}
for(const d of descriptors.values()){
 assert.equal(d.status,'editorial_pending');assert.equal(d.requires,null);assert.equal(d.resolvesTo,null);assert.equal(d.geographicReview,'pending');assert(d.occurrences.length>0);
 for(const id of d.candidateRequiresFacts)assert(facts.has(id),`Unknown source fact ${id}`);
 for(const id of [d.candidateTargetPlaceId,...d.candidateRelatedPlaceIds].filter(Boolean))assert(places.has(id));
 for(const occurrence of d.occurrences){
  const puzzle=staging.puzzles.find(p=>p.id===occurrence.puzzleId);
  const clue=puzzle.clues.find(c=>c.position===occurrence.position);
  assert.equal(occurrence.sourceText.en,clue.text);assert.deepEqual(occurrence.provenance,puzzle.provenance);
  assert.equal(anchors.get(occurrence.selectedAnchorId).descriptorId,d.id);
 }
}
let arrows=0,manual=0;
for(const a of anchors.values()){
 const puzzle=staging.puzzles.find(p=>p.id===a.puzzleId);
 const marker=puzzle.markers.find(m=>m.id===a.id);
 assert.equal(a.status,'editorial_pending');assert.equal(a.geographicReview,'pending');
 assert.equal(a.x,marker.x);assert.equal(a.y,marker.y);assert.equal(a.letter,marker.letter);assert.equal(a.mapId,puzzle.map);
 assert(a.x>=0&&a.x<=100&&a.y>=0&&a.y<=100);
 assert.deepEqual(a.pointsTo,marker.pointsTo??null);assert.equal(a.sitsIn,null);assert.equal(a.pointsToPlaceId,null);
 if(a.pointsTo){arrows++;assert(['place-madagascar','place-iceland'].includes(a.candidateTargetPlaceId),'arrow target is a proposed island, not physical marker placement')}
 if(a.mappingBasis==='user_selected_marker')manual++;
}
assert.equal(arrows,5);assert.equal(manual,36);
assert(catalog.audit.every(a=>a.missingEarlierFactIds.length===0),'proposed source order must not use future facts');
assert(catalog.audit.every(a=>a.geographicResolution==='not_verified'),'timing is not geographic verification');
// Negative control: removing a previous bridge must expose future/missing knowledge.
const delayed=structuredClone(curriculum);
delayed.courses[0].steps[0].candidateUnlockAfter=[];
const broken=buildCatalog(staging,mapping,delayed);
assert(broken.audit.some(a=>a.puzzleId==='l1-02'&&a.missingEarlierFactIds.includes('f-l1-p08-continent-properties')));
const badMapping=structuredClone(mapping);badMapping.assignments['l1-01']['3']='unknown-marker';
assert.throws(()=>buildCatalog(staging,badMapping,curriculum),/Invalid mapping/);
const badClues=structuredClone(staging);badClues.puzzles[0].clues[0].text='The first letter is on an unknown island.';
assert.throws(()=>buildCatalog(badClues,mapping,curriculum),/Unclassified source clue/);
for(const [pattern,caveat] of [['saltiest','f-l1-p10-salinity-note'],['both an island','f-l1-p16-island-continent-note'],['longest river','f-l1-p20-nile-note']]){
 for(const d of descriptors.values())if(d.sourcePredicate.en.includes(pattern))assert(d.candidateRequiresFacts.includes(caveat),'preserve source caveat with the proposed dependency');
}
if(fs.existsSync('dist'))assert(!fs.existsSync('dist/data/import-staging/l1-catalog-draft.json'));
console.log('PASS: 21 pending places, 97 exact source anchors, 63 authored predicates, 5 preserved arrows; candidate timing and negative controls. Geography remains unverified.');
