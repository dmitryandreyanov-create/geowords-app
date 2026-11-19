import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import spatial from '../engine/spatial-semantics.js';
import semantic from '../engine/semantic.js';
import {loadL1Sources} from './catalog-adapter.mjs';
export function inspectFirstMap(){
 const s=loadL1Sources(),claims=JSON.parse(fs.readFileSync('data/import-staging/l1-place-claims.json')),scope=s.spatial.puzzles[0],first=s.staging.puzzles[0];
 if(claims.status!=='not_for_live_use'||claims.scope!=='l1-01-place-memberships-in-confirmed-scope'||claims.claims.length!==6)throw Error('Wrong partial claim scope');
 const anchors=first.markers.filter(a=>claims.claims.some(c=>c.anchorId===a.id)).map(a=>({...a,mapId:scope.map.id}));
 const descriptors=s.catalog.descriptors.filter(d=>d.candidateQuery.op==='place'&&d.occurrences.some(o=>o.puzzleId===first.id));
 const inspect=(d,selected)=>spatial.inspectPlaceClaims({query:d.candidateQuery,anchors:selected,claims:claims.claims,map:{...scope.map,anchorIds:selected.map(a=>a.id)},coveredPlaceIds:claims.coveredPlaceIds});
 const cues=(a,selected)=>descriptors.filter(d=>{const r=inspect(d,selected);return r.status==='candidate_unique'&&r.matchedAnchorIds[0]===a.id}).map(d=>({id:d.id,text:d.sourcePredicate}));
 const plan=s.lexicon.practicePlans[0],words=plan.candidateWordIds.map(id=>{
  const e=s.lexicon.entries.find(e=>e.id===id);
  const draft=semantic.generateAnchored({word:e.word,anchors,cues,geometry:{widthPx:300,heightPerWidth:1024/1181},seed:'partial-geography-l1-01-'+id});
  return {word:e.word,status:draft?'candidate_layout_not_for_live_use':'blocked',reason:draft?null:e.word.length>anchors.length?'NOT_ENOUGH_CONFIRMED_ANCHORS':'NO_SAFE_CANDIDATE_LAYOUT',draft};
 });
 return {status:'not_for_live_use',scope:'six_confirmed_continent_points_only',confirmedAnchorCount:anchors.length,betweenAnchorsUsed:false,factsAndVocabularyApproved:false,curriculumConnected:false,words};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(inspectFirstMap(),null,2));
