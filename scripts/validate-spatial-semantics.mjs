import fs from 'node:fs';
import assert from 'node:assert/strict';
import spatial from '../engine/spatial-semantics.js';
import {buildSpatialReview,serializeSpatialReview} from '../tools/build_l1_spatial_review.mjs';
const membership=(places=[],extra={})=>({places,regions:[],sides:[],between:[],hemispheres:[],boundaries:[],...extra});
const anchors=[{id:'a',mapId:'synthetic',x:20,y:30},{id:'b',mapId:'synthetic',x:70,y:30}];
const map={id:'synthetic',sha256:'a'.repeat(64),anchorIds:['a','b']};
const review=(a,physical,target=null)=>({anchorId:a.id,status:'approved',complete:true,
 evidence:{mapId:a.mapId,mapSha256:map.sha256,x:a.x,y:a.y,pointsTo:structuredClone(a.pointsTo??null)},physical,target});
const reviews=[review(anchors[0],membership(['asia','eurasia'],{regions:[{placeId:'asia',direction:'north'}],hemispheres:['north','east']})),
 review(anchors[1],membership(['europe','eurasia'],{between:[['africa','asia']],hemispheres:['north','west']}))];
const query=(op,fields,requiredPlaces=[])=>({status:'approved',op,channel:'either',requires:['learned'],requiredPlaces,...fields});
const state={anchors,reviews,map,knownFacts:['learned'],knownPlaces:['asia','europe','eurasia','africa','indian','island','pacific']};
const resolve=q=>spatial.resolve({...state,query:q});
assert.deepEqual(resolve(query('place',{placeId:'asia'},['asia'])),{status:'unique',matchedAnchorIds:['a']});
assert.equal(resolve(query('place',{placeId:'eurasia'},['eurasia'])).status,'ambiguous','parent place overlaps two selected anchors');
assert.equal(resolve(query('place',{placeId:'africa'},['africa'])).status,'no_match');
assert.equal(resolve(query('region',{placeId:'asia',direction:'north'},['asia'])).status,'unique');
assert.equal(resolve(query('between',{placeIds:['asia','africa']},['asia','africa'])).status,'unique','between pair is order-independent');
assert.equal(resolve(query('hemisphere',{values:['north','east']})).status,'unique');
assert.equal(resolve(query('boundary',{boundary:'equator'})).status,'no_match');
assert.equal(spatial.resolve({...state,query:query('place',{placeId:'asia'},['asia']),knownFacts:[]}).reason,'unknown_knowledge');
assert.equal(spatial.resolve({...state,query:query('place',{placeId:'asia'},['asia']),knownPlaces:[]}).reason,'unknown_knowledge');
for(const change of [r=>r.splice(1,1),r=>{r[1].complete=false},r=>{r[1].physical=null},r=>{r[1].evidence.x++},r=>{r[1].evidence.mapSha256='b'.repeat(64)},r=>{r[1].status='editorial_pending'}]){
 const changed=structuredClone(reviews);change(changed);
 assert.equal(spatial.resolve({...state,query:query('place',{placeId:'asia'},['asia']),reviews:changed}).reason,'incomplete_geography','an unreviewed competitor prevents a false unique match');
}
assert.equal(spatial.resolve({...state,query:query('place',{placeId:'asia'},['asia']),anchors:anchors.slice(0,1)}).reason,'incomplete_map_scope');
assert.equal(spatial.resolve({...state,query:query('place',{placeId:'asia'},['asia']),reviews:[reviews[0],reviews[0]]}).reason,'invalid_reviews');
assert.equal(spatial.resolve({...state,query:query('place',{placeId:'asia'},['asia']),reviews:[...reviews,{...reviews[0],anchorId:'foreign'}]}).reason,'invalid_reviews');
const arrow={id:'b',mapId:'synthetic',x:70,y:30,pointsTo:{x:80,y:40,from:{x:74,y:34}}};
const arrowState={...state,anchors:[anchors[0],arrow],reviews:[review(anchors[0],membership(['indian'])),review(arrow,membership(['indian']),membership(['island']))]};
const ocean=query('place',{placeId:'indian'},['indian']);
assert.equal(spatial.resolve({...arrowState,query:ocean}).status,'ambiguous','physical ocean placement of an island callout competes');
assert.deepEqual(spatial.resolve({...arrowState,query:query('place',{placeId:'island'},['island'])}).matchedAnchorIds,['b']);
assert.equal(spatial.resolve({...arrowState,query:{...ocean,channel:'target'}}).status,'unique','target and physical are distinct explicit channels');
const stale=structuredClone(arrowState);stale.anchors[1].pointsTo.from.x++;
assert.equal(spatial.resolve({...stale,query:ocean}).reason,'incomplete_geography');
const sideState={...state,reviews:[review(anchors[0],membership(['pacific'],{sides:[{oceanId:'pacific',sidePlaceId:'asia'}]})),reviews[1]]};
assert.equal(spatial.resolve({...sideState,query:query('side',{oceanId:'pacific',sidePlaceId:'asia'},['pacific','asia'])}).status,'unique');
const equatorState={...state,reviews:[review(anchors[0],membership([],{boundaries:['equator']})),reviews[1]]};
assert.equal(spatial.resolve({...equatorState,query:query('boundary',{boundary:'equator'})}).status,'unique');
equatorState.reviews[0].physical.hemispheres=['north'];
assert.equal(spatial.resolve({...equatorState,query:query('boundary',{boundary:'equator'})}).reason,'incomplete_geography');
const irrelevant=structuredClone(state);irrelevant.anchors.forEach(a=>{a.letter='Z';a.selectedAnswer=true});
assert.deepEqual(spatial.resolve({...irrelevant,query:{...query('place',{placeId:'asia'},['asia']),selectedAnchorId:'b'}}).matchedAnchorIds,['a'],'answers and chosen letters cannot affect resolution');
assert.equal(spatial.resolve({}).reason,'invalid_query');
assert(!spatial.validateQuery(query('hemisphere',{values:['north','south']})));
assert(!spatial.validateQuery(query('place',{placeId:'asia'})));
const catalog=JSON.parse(fs.readFileSync('data/import-staging/l1-catalog-draft.json'));
const scaffold=JSON.parse(fs.readFileSync('data/import-staging/l1-spatial-review-draft.json'));
assert.equal(serializeSpatialReview(scaffold),serializeSpatialReview(buildSpatialReview(catalog)));
assert.equal(scaffold.status,'not_for_live_use');assert.equal(scaffold.puzzles.length,10);
let blocked=0;
for(const d of catalog.descriptors){assert(spatial.validateQuery(d.candidateQuery),d.id);assert.equal(d.candidateQuery.status,'editorial_pending');assert.equal(d.resolvesTo,null)}
for(const puzzle of scaffold.puzzles){
 const selected=catalog.anchors.filter(a=>a.puzzleId===puzzle.puzzleId);
 for(const r of puzzle.reviews){assert.equal(r.status,'editorial_pending');assert.equal(r.complete,false);assert.equal(r.evidence,null);assert.equal(r.physical,null);assert.equal(r.target,null)}
 for(const anchor of selected){
  const q=catalog.descriptors.find(d=>d.id===anchor.descriptorId).candidateQuery;
  const input={query:q,anchors:selected,reviews:puzzle.reviews,map:puzzle.map,knownFacts:q.requires,knownPlaces:q.requiredPlaces};
  assert.equal(spatial.resolve(input).reason,'query_not_approved');
  // Synthetic promotion of the query must still NOT approve real geography.
  assert.equal(spatial.resolve({...input,query:{...q,status:'approved'}}).reason,'incomplete_geography');blocked++;
 }
}
assert.equal(blocked,97);
if(fs.existsSync('dist'))for(const p of ['engine/spatial-semantics.js','data/import-staging/l1-spatial-review-draft.json'])assert(!fs.existsSync('dist/'+p));
console.log('PASS: independent place/region/side/between/hemisphere/boundary resolution; unknown competitors, arrow ambiguity, map scope and stale evidence. All 97 real L1 clues remain blocked.');
