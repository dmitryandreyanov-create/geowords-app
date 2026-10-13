/* Independent map-relative resolution. No answers, letters, selected marker IDs,
   ordinal parsing or lon/lat. Only explicitly reviewed geographic memberships. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.GEOWORD_SPATIAL=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const strings=v=>Array.isArray(v)&&v.every(s=>typeof s==='string'&&s.length)&&new Set(v).size===v.length;
 const directions=['north','south','east','west'];
 const pair=v=>strings(v)&&v.length===2;
 const samePair=(a,b)=>a.length===b.length&&a.every(id=>b.includes(id));
 const point=p=>object(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100;
 function samePoint(a,b){return point(a)&&point(b)&&a.x===b.x&&a.y===b.y}
 function sameArrow(a,b){
  if(a==null||b==null)return a==null&&b==null;
  return samePoint(a,b)&&((a.from==null&&b.from==null)||samePoint(a.from,b.from))&&
   ((a.shaftEnd==null&&b.shaftEnd==null)||samePoint(a.shaftEnd,b.shaftEnd))&&
   ((a.headPoints==null&&b.headPoints==null)||Array.isArray(a.headPoints)&&Array.isArray(b.headPoints)&&a.headPoints.length===3&&b.headPoints.length===3&&a.headPoints.every((p,i)=>samePoint(p,b.headPoints[i])));
 }
 function validateQuery(q){
  if(!object(q)||!['either','physical','target'].includes(q.channel)||!strings(q.requires)||!strings(q.requiredPlaces))return false;
  switch(q.op){
   case 'place':return typeof q.placeId==='string'&&q.requiredPlaces.includes(q.placeId);
   case 'region':return q.requiredPlaces.includes(q.placeId)&&directions.includes(q.direction);
   case 'side':return q.requiredPlaces.includes(q.oceanId)&&q.requiredPlaces.includes(q.sidePlaceId);
   case 'between':return pair(q.placeIds)&&q.placeIds.every(id=>q.requiredPlaces.includes(id));
   case 'hemisphere':return pair(q.values)&&q.values.every(v=>directions.includes(v))&&q.values.some(v=>['north','south'].includes(v))&&q.values.some(v=>['east','west'].includes(v));
   case 'boundary':return q.boundary==='equator';
   default:return false;
  }
 }
 function validateMembership(g){
  return object(g)&&strings(g.places)&&Array.isArray(g.regions)&&g.regions.every(r=>object(r)&&g.places.includes(r.placeId)&&directions.includes(r.direction))&&
   Array.isArray(g.sides)&&g.sides.every(s=>object(s)&&g.places.includes(s.oceanId)&&typeof s.sidePlaceId==='string')&&
   Array.isArray(g.between)&&g.between.every(pair)&&strings(g.hemispheres)&&g.hemispheres.every(v=>directions.includes(v))&&
   !(g.hemispheres.includes('north')&&g.hemispheres.includes('south'))&&!(g.hemispheres.includes('east')&&g.hemispheres.includes('west'))&&
   strings(g.boundaries)&&g.boundaries.every(v=>v==='equator')&&
   !(g.boundaries.includes('equator')&&g.hemispheres.some(v=>['north','south'].includes(v)));
 }
 function reviewValid(anchor,review,map){
  const e=review?.evidence;
  return point(anchor)&&review?.status==='approved'&&review.complete===true&&review.anchorId===anchor.id&&
   object(e)&&e.mapId===anchor.mapId&&e.mapSha256===map.sha256&&samePoint(e,anchor)&&sameArrow(e.pointsTo,anchor.pointsTo)&&
   (anchor.pointsTo==null||point(anchor.pointsTo)&&(anchor.pointsTo.from==null||point(anchor.pointsTo.from)))&&
   validateMembership(review.physical)&&
   (anchor.pointsTo==null?review.target===null:validateMembership(review.target));
 }
 function matches(q,g){
  switch(q.op){
   case 'place':return g.places.includes(q.placeId);
   case 'region':return g.regions.some(r=>r.placeId===q.placeId&&r.direction===q.direction);
   case 'side':return g.sides.some(s=>s.oceanId===q.oceanId&&s.sidePlaceId===q.sidePlaceId);
   case 'between':return g.between.some(p=>samePair(p,q.placeIds));
   case 'hemisphere':return q.values.every(v=>g.hemispheres.includes(v));
   case 'boundary':return g.boundaries.includes(q.boundary);
   default:return false;
  }
 }
 function resolve({query,anchors,reviews,map,knownFacts=[],knownPlaces=[]}={}){
  const blocked=(reason,extra={})=>({status:'blocked',reason,matchedAnchorIds:[],...extra});
  if(!validateQuery(query))return blocked('invalid_query');
  if(query.status!=='approved')return blocked('query_not_approved');
  if(!strings(knownFacts)||!strings(knownPlaces))return blocked('invalid_knowledge');
  const missingFacts=query.requires.filter(id=>!knownFacts.includes(id));
  const missingPlaces=query.requiredPlaces.filter(id=>!knownPlaces.includes(id));
  if(missingFacts.length||missingPlaces.length)return blocked('unknown_knowledge',{missingFacts,missingPlaces});
  if(!object(map)||typeof map.id!=='string'||!/^[a-f0-9]{64}$/.test(map.sha256)||!strings(map.anchorIds)||!map.anchorIds.length||!Array.isArray(anchors)||!anchors.length||
   anchors.some(a=>!object(a)||typeof a.id!=='string'||!a.id||a.mapId!==map.id)||new Set(anchors.map(a=>a.id)).size!==anchors.length||!Array.isArray(reviews))return blocked('invalid_map');
  if(!samePair(anchors.map(a=>a.id),map.anchorIds))return blocked('incomplete_map_scope');
  if(reviews.some(r=>!object(r)||typeof r.anchorId!=='string'||!map.anchorIds.includes(r.anchorId))||new Set(reviews.map(r=>r.anchorId)).size!==reviews.length)return blocked('invalid_reviews');
  const byId=new Map(reviews.map(r=>[r.anchorId,r]));
  const unresolved=anchors.filter(a=>!reviewValid(a,byId.get(a.id),map)).map(a=>a.id);
  if(unresolved.length)return blocked('incomplete_geography',{unresolvedAnchorIds:unresolved});
  const matchedAnchorIds=anchors.filter(a=>{
   const r=byId.get(a.id);
   const channels=query.channel==='physical'?[r.physical]:query.channel==='target'?[r.target??r.physical]:[r.physical,r.target].filter(Boolean);
   return channels.some(g=>matches(query,g));
  }).map(a=>a.id);
  return {status:matchedAnchorIds.length===1?'unique':matchedAnchorIds.length?'ambiguous':'no_match',matchedAnchorIds};
 }
 return {validateQuery,validateMembership,reviewValid,resolve};
});
