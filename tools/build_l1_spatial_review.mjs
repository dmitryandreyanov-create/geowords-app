import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

export function buildSpatialReview(catalog){
 const puzzles=[...new Set(catalog.anchors.map(a=>a.puzzleId))].map(puzzleId=>{
  const anchors=catalog.anchors.filter(a=>a.puzzleId===puzzleId);
  const mapId=anchors[0].mapId;
  const sha256=crypto.createHash('sha256').update(fs.readFileSync(mapId)).digest('hex');
  return {puzzleId,map:{id:mapId,sha256,anchorIds:anchors.map(a=>a.id)},
   reviews:anchors.map(a=>({anchorId:a.id,status:'editorial_pending',complete:false,
    sourceBinding:{mapId,mapSha256:sha256,x:a.x,y:a.y,pointsTo:a.pointsTo},
    evidence:null,physical:null,target:null}))};
 });
 return {schemaVersion:1,status:'not_for_live_use',warning:'Blank geographic review scaffold, not inferred from selected clue answers. No spatial memberships are approved.',puzzles};
}
export const serializeSpatialReview=value=>JSON.stringify(value,null,2)+'\n';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const catalog=JSON.parse(fs.readFileSync('data/import-staging/l1-catalog-draft.json','utf8'));
 const output='data/import-staging/l1-spatial-review-draft.json';
 const content=serializeSpatialReview(buildSpatialReview(catalog));
 if(process.argv.includes('--check')){
  if(fs.readFileSync(output,'utf8')!==content)throw Error('Spatial review scaffold differs from source maps');
 }else{
  // Never regenerate over reviewer decisions. This file is a blank scaffold;
  // future decisions belong in a separate reviewed export.
  if(fs.existsSync(output)){
   const existing=JSON.parse(fs.readFileSync(output,'utf8'));
   if(existing.puzzles.some(p=>p.reviews.some(r=>r.status!=='editorial_pending'||r.complete||r.evidence||r.physical||r.target)))throw Error('Refusing to overwrite geographic decisions');
  }
  fs.writeFileSync(output,content);
 }
 console.log('L1 spatial scaffold: 10 source map scopes, 97 pending memberships, no geographic guesses.');
}
