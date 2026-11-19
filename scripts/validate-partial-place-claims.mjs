import assert from 'node:assert/strict';
import fs from 'node:fs';
import spatial from '../engine/spatial-semantics.js';
import {inspectFirstMap} from '../tools/inspect_first_map.mjs';
import {loadL1Sources,adaptCatalog,fingerprint} from '../tools/catalog-adapter.mjs';
const s=loadL1Sources(),before=fingerprint(s),claims=JSON.parse(fs.readFileSync('data/import-staging/l1-place-claims.json')),scope=s.spatial.puzzles[0],all=s.staging.puzzles[0].markers.map(a=>({...a,mapId:scope.map.id})),anchors=all.filter(a=>claims.claims.some(c=>c.anchorId===a.id)),map={...scope.map,anchorIds:anchors.map(a=>a.id)};
const expected={'01':['place-north-america'],'03':['place-south-america'],'04':['place-antarctica'],'05':['place-australia'],'07':['place-africa'],'09':['place-asia','place-eurasia']};
assert.equal(claims.status,'not_for_live_use');assert.equal(claims.claims.length,6);
for(const c of claims.claims){assert.deepEqual(c.physicalPlaces,expected[c.anchorId.slice(-2)]);assert.equal(c.complete,false);assert.equal(c.otherFields,null);assert.deepEqual(c.sourceBinding,scope.reviews.find(r=>r.anchorId===c.anchorId).sourceBinding)}
const query=s.catalog.descriptors.find(d=>d.candidateQuery.op==='place'&&d.candidateQuery.placeId==='place-north-america').candidateQuery,args={query,anchors,claims:claims.claims,map,coveredPlaceIds:claims.coveredPlaceIds};
assert.equal(spatial.inspectPlaceClaims(args).status,'candidate_unique');assert.notEqual(spatial.inspectPlaceClaims(args).status,'unique','partial inspection is not a runtime resolver result');
assert.equal(spatial.resolve({...args,reviews:scope.reviews}).status,'blocked','runtime approvals remain required');
assert.equal(spatial.inspectPlaceClaims({...args,anchors:all,map:scope.map}).reason,'unconfirmed_place_competitors','all nine visible source anchors cannot bypass unknown competitors');
for(const mutate of [c=>c[0].sourceBinding.x++,c=>c[0].sourceBinding.mapSha256='0'.repeat(64),c=>c[0].complete=true,c=>c[0].coveredPlaceIds.pop(),c=>c.pop()]){const bad=structuredClone(claims.claims);mutate(bad);assert.equal(spatial.inspectPlaceClaims({...args,claims:bad}).status,'candidate_blocked')}
const ambiguous=structuredClone(claims.claims);ambiguous[1].physicalPlaces=['place-north-america'];assert.equal(spatial.inspectPlaceClaims({...args,claims:ambiguous}).status,'candidate_ambiguous');
assert.equal(spatial.inspectPlaceClaims({...args,query:{...query,op:'near'}}).reason,'unsupported_partial_query');
assert.equal(spatial.inspectPlaceClaims({...args,query:{...query,placeId:'place-europe',requiredPlaces:['place-europe']}}).reason,'outside_confirmed_place_scope');
const report=inspectFirstMap();assert.equal(report.words.filter(w=>w.draft).length,5);assert.equal(report.words.find(w=>w.word==='MAPPING').reason,'NOT_ENOUGH_CONFIRMED_ANCHORS');
for(const w of report.words.filter(w=>w.draft))for(const c of w.draft.clues){const d=s.catalog.descriptors.find(d=>d.id===c.descriptorId),selected=w.draft.markers.map(a=>({...a,mapId:scope.map.id})),result=spatial.inspectPlaceClaims({...args,query:d.candidateQuery,anchors:selected,map:{...scope.map,anchorIds:selected.map(a=>a.id)}});assert.equal(result.status,'candidate_unique');assert.deepEqual(result.matchedAnchorIds,[c.markerId]);assert(!['l1-01-glyph-02','l1-01-glyph-08','l1-01-glyph-06'].includes(c.markerId))}
assert.equal(adaptCatalog(s).curriculum,null);assert.equal(fingerprint(s),before);
console.log('PASS: six source-bound scoped continent claims, five independently matched candidate layouts using the shared sampler; seven-letter MAPPING blocked by six-point capacity, between/unknown/foreign/stale/ambiguous scopes blocked, no runtime approval or source mutation.');
