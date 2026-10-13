/* Spatial decisions are separate from clue-to-letter decisions. */
(function(root,factory){
 const spatial=typeof module!=='undefined'&&module.exports?require('../engine/spatial-semantics.js'):root.GEOWORD_SPATIAL;
 const api=factory(spatial);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.GEOWORD_SPATIAL_REVIEW=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(spatial){
 const clone=v=>JSON.parse(JSON.stringify(v));
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
 const normalize=g=>({places:[...g.places],regions:g.regions.map(r=>({placeId:r.placeId,direction:r.direction})),sides:g.sides.map(s=>({oceanId:s.oceanId,sidePlaceId:s.sidePlaceId})),between:g.between.map(p=>[...p]),hemispheres:[...g.hemispheres],boundaries:[...g.boundaries]});
 const empty=()=>({places:[],regions:[],sides:[],between:[],hemispheres:[],boundaries:[]});
 function create(scaffold){return {version:1,status:'not_for_live_use',generatedFrom:'spatial author review',puzzles:clone(scaffold.puzzles)}}
 const anchor=r=>({id:r.anchorId,mapId:r.sourceBinding.mapId,x:r.sourceBinding.x,y:r.sourceBinding.y,pointsTo:r.sourceBinding.pointsTo});
 function checkMembership(g,catalog){
  if(!spatial.validateMembership(g))throw Error('Неверные или противоречивые географические свойства');
  const places=new Set(catalog.places.map(p=>p.id));
  const refs=[...g.places,...g.regions.map(r=>r.placeId),...g.sides.flatMap(s=>[s.oceanId,s.sidePlaceId]),...g.between.flat()];
  if(refs.some(id=>!places.has(id)))throw Error('Неизвестный географический объект');
 }
 function restore(scaffold,catalog,data){
  if(data?.version!==1||data.status!=='not_for_live_use'||data.generatedFrom!=='spatial author review'||!Array.isArray(data.puzzles)||data.puzzles.length!==scaffold.puzzles.length)throw Error('Неверный формат географической разметки');
  const result=create(scaffold),used=new Set();
  for(const p of data.puzzles){
   const target=result.puzzles.find(v=>v.puzzleId===p.puzzleId);
   if(!target||used.has(p.puzzleId)||!same(p.map,target.map)||!Array.isArray(p.reviews)||p.reviews.length!==target.reviews.length)throw Error('Неизвестная или устаревшая карта');
   used.add(p.puzzleId);const ids=new Set();
   for(const r of p.reviews){
    const original=target.reviews.find(v=>v.anchorId===r.anchorId);
    if(!original||ids.has(r.anchorId)||!same(r.sourceBinding,original.sourceBinding))throw Error('Неизвестная буква или устаревшая геометрия');
    ids.add(r.anchorId);
    if(!['approved','editorial_pending'].includes(r.status)||typeof r.complete!=='boolean')throw Error('Неверный статус географии');
    if(r.physical!==null)checkMembership(r.physical,catalog);
    if(r.target!==null){if(!original.sourceBinding.pointsTo)throw Error('У буквы нет стрелки');checkMembership(r.target,catalog)}
    if(r.status==='approved'){
     if(!spatial.reviewValid(anchor(original),r,target.map))throw Error('Неполное или устаревшее подтверждение географии');
    }else if(r.complete||r.evidence!==null)throw Error('Черновик не может содержать утверждение');
    Object.assign(original,{status:r.status,complete:r.complete,evidence:clone(r.evidence),physical:r.physical===null?null:normalize(r.physical),target:r.target===null?null:normalize(r.target)});
   }
  }
  return result;
 }
 function edit(state,catalog,puzzleId,anchorId,channel,values){
  if(!['physical','target'].includes(channel))throw Error('Неверный канал географии');
  const r=state.puzzles.find(p=>p.puzzleId===puzzleId)?.reviews.find(r=>r.anchorId===anchorId);
  if(!r)throw Error('Неизвестная буква');
  if(channel==='target'&&!r.sourceBinding.pointsTo)throw Error('У буквы нет стрелки');
  checkMembership(values,catalog);r[channel]=normalize(values);
  r.status='editorial_pending';r.complete=false;r.evidence=null;
 }
 function confirm(state,puzzleId,anchorId){
  const p=state.puzzles.find(p=>p.puzzleId===puzzleId),r=p?.reviews.find(r=>r.anchorId===anchorId);
  if(!r)throw Error('Неизвестная буква');
  const proposed={...r,status:'approved',complete:true,evidence:clone(r.sourceBinding)};
  if(!spatial.reviewValid(anchor(r),proposed,p.map))throw Error('Заполните положение буквы и конец стрелки, если она есть');
  Object.assign(r,proposed);
 }
 function revoke(state,puzzleId,anchorId){
  const r=state.puzzles.find(p=>p.puzzleId===puzzleId)?.reviews.find(r=>r.anchorId===anchorId);
  if(!r)throw Error('Неизвестная буква');r.status='editorial_pending';r.complete=false;r.evidence=null;
 }
 function report(state,catalog,puzzleId){
  const p=state.puzzles.find(p=>p.puzzleId===puzzleId);if(!p)return null;
  const anchors=catalog.anchors.filter(a=>a.puzzleId===puzzleId);
  return anchors.map(a=>{
   const descriptor=catalog.descriptors.find(d=>d.id===a.descriptorId),q=descriptor.candidateQuery;
   // Explicit editorial preview: proposed facts are not learner knowledge.
   const result=spatial.resolve({query:{...q,status:'approved'},anchors,reviews:p.reviews,map:p.map,knownFacts:q.requires,knownPlaces:q.requiredPlaces});
   const occurrence=descriptor.occurrences.find(o=>o.puzzleId===puzzleId&&o.selectedAnchorId===a.id);
   return {position:occurrence.position,descriptorId:descriptor.id,preview:true,...result};
  }).sort((a,b)=>a.position-b.position);
 }
 return {create,restore,empty,edit,confirm,revoke,report};
});
