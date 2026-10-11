/* Semantic map-anchored generator. Only uses points calibrated to an author's
   image; no lon/lat projections and no runtime text synthesis beyond ordinals. */
(function(root,factory){
 const api=factory();root.GEOWORD_SEMANTIC=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 function shuffle(items,seed){const array=[...items];let s=hash(seed)||1;for(let i=array.length-1;i>0;i--){s^=s<<13;s^=s>>>17;s^=s<<5;const j=Math.floor(((s>>>0)/4294967296)*(i+1));[array[i],array[j]]=[array[j],array[i]]}return array}
 const ORDINALS=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth'];
 const MIN_MAP_WIDTH=300, MAP_ASPECT=1057/1587, MIN_SEPARATION=29;
 function distance(a,b){return Math.hypot((a.x-b.x)*MIN_MAP_WIDTH/100,(a.y-b.y)*MIN_MAP_WIDTH*MAP_ASPECT/100)}
 // Regions denote the geographic object reached by an arrow; sitsIn records
 // where the *letter* physically lies. An ocean clue must not also describe
 // a river letter drawn in that ocean, even if the river target is on land.
 function matchesRegion(anchor,region){
   return (anchor.regions||[]).includes(region)||(anchor.sitsIn||[]).includes(region);
 }
 // Use the same arrow shaft geometry as the map renderer. Guard against
 // a callout passing through another letter's touch target at 300 CSS px.
 const ARROW_MARKER_CLEARANCE=14;
 function arrowSegment(anchor){
   if(!anchor.pointsTo)return null;
   const end=anchor.pointsTo;
   const from=end.from||{x:anchor.x+(end.x-anchor.x)*.25,y:anchor.y+(end.y-anchor.y)*.25};
   return [from,end];
 }
 function pointSegmentDistance(point,a,b){
   const px=point.x*MIN_MAP_WIDTH/100,py=point.y*MIN_MAP_WIDTH*MAP_ASPECT/100;
   const ax=a.x*MIN_MAP_WIDTH/100,ay=a.y*MIN_MAP_WIDTH*MAP_ASPECT/100;
   const bx=b.x*MIN_MAP_WIDTH/100,by=b.y*MIN_MAP_WIDTH*MAP_ASPECT/100;
   const dx=bx-ax,dy=by-ay;
   const t=dx*dx+dy*dy?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))):0;
   return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
 }
 function arrowIntersectsMarker(arrowOwner,marker){
   const segment=arrowSegment(arrowOwner);
   return !!segment&&pointSegmentDistance(marker,segment[0],segment[1])<ARROW_MARKER_CLEARANCE;
 }
 function arrowsClear(selected){
   return selected.every(a=>selected.every(b=>a===b||!arrowIntersectsMarker(a,b)));
 }
 function eligibleCues(anchor,selected){
   return (anchor.cues||[]).filter(cue=>selected.filter(other=>matchesRegion(other,cue[1])).length===1);
 }
 function resolvable(selected){return selected.every(a=>eligibleCues(a,selected).length>0)}
 function add(selected,anchor){
   if(!anchor||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y)||anchor.x<0||anchor.x>100||anchor.y<0||anchor.y>100)return false;
   if(selected.some(other=>other.id===anchor.id||distance(other,anchor)<MIN_SEPARATION))return false;
   if(!resolvable([...selected,anchor])||!arrowsClear([...selected,anchor]))return false;
   selected.push(anchor);return true;
 }
 function generate(course,entry,stepIndex,variant,review,progress){
   const cfg=course.semantic,step=course.steps[stepIndex],word=entry.word;
   if(!cfg||!step||typeof word!=='string'||!/^\p{L}+$/u.test(word)||word.length>ORDINALS.length)return null;
   const newAnchors=cfg.rivers[step.id]||[];
   const previous=course.steps.slice(0,stepIndex).map(p=>cfg.rivers[p.id]||[]);
   const quota=Math.min(newAnchors.length,Math.max(1,Math.round(word.length*.43)));
   if(quota/word.length<.35)return null; // minimum 35% markers on new object
   const minCount=quota+previous.length;
   if(minCount>word.length)return null; // skip short word, never create undefined letters
   const seed=step.id+':'+entry.id+':'+variant;
   for(let attempt=0;attempt<12;attempt++){
     const chosen=[];
     const fresh=shuffle(newAnchors,seed+':new:'+attempt);
     for(const anchor of fresh){if(chosen.length>=quota)break;add(chosen,anchor)}
     if(chosen.length!==quota)continue;
     for(const older of previous){
       const picked=shuffle(older,seed+':old:'+attempt).some(a=>add(chosen,a));
       if(!picked)break;
     }
     if(chosen.length<minCount)continue;
     const others=shuffle(cfg.base,seed+':base:'+attempt);
     for(const anchor of others){if(chosen.length===word.length)break;add(chosen,anchor)}
     if(chosen.length!==word.length)continue;
     const ordered=shuffle(chosen,seed+':order');
     const markers=[],clues=[];
     ordered.forEach((anchor,i)=>{
       const cueOptions=shuffle(eligibleCues(anchor,chosen),seed+':cue:'+anchor.id);
       const cue=cueOptions[0];
       markers.push({id:anchor.id,x:anchor.x,y:anchor.y,letter:word[i],label:anchor.id,
         ...(anchor.pointsTo?{pointsTo:anchor.pointsTo}:{})});
       clues.push({position:i+1,markerId:anchor.id,descriptorId:anchor.id+':'+anchor.cues.indexOf(cue),
         resolvesTo:cue[1],text:'The '+ORDINALS[i]+' letter is '+cue[0]+'.'});
     });
     if(markers.length!==word.length||clues.length!==word.length)return null;
     if(!verify({markers,clues,answer:word},cfg))continue;
     return {
       source:'generated',review,courseId:course.id,stepIndex,dictionaryId:entry.id,
       id:'gen:'+course.id+':'+step.id+':'+entry.id+':'+variant,
       title:step.object.label+(review?' · Review':' · Word '+(1+progress.steps[step.id].solvedWordIds.length+1)+'/7'),
       series:'World Geography Series',level:'Practice',unit:course.title,
       answer:word,map:step.practiceMap,mapAspect:'1587 / 1057',letterMode:'overlay',
       introFacts:[],nextFacts:[],markers,clues,definition:entry.definition,
     };
   }
   return null;
 }
 function verify(puzzle,cfg){
   if(!puzzle||puzzle.answer.length!==puzzle.markers.length||puzzle.clues.length!==puzzle.markers.length)return false;
   const ids=new Set(puzzle.markers.map(m=>m.id));if(ids.size!==puzzle.markers.length)return false;
   const all=[...cfg.base,...Object.values(cfg.rivers).flat()];
   const byId=new Map(all.map(a=>[a.id,a]));
   const selected=puzzle.markers.map(m=>byId.get(m.id));if(selected.some(a=>!a))return false;
   for(let i=0;i<puzzle.clues.length;i++){
     const cue=puzzle.clues[i],marker=puzzle.markers[i];
     if(cue.position!==i+1||cue.markerId!==marker.id||marker.letter!==puzzle.answer[i])return false;
     if(selected.filter(a=>matchesRegion(a,cue.resolvesTo)).length!==1)return false;
     if(!Number.isFinite(marker.x)||!Number.isFinite(marker.y)||marker.x<0||marker.x>100||marker.y<0||marker.y>100)return false;
     for(let j=i+1;j<selected.length;j++)if(distance(selected[i],selected[j])<MIN_SEPARATION)return false;
   }
   if(!arrowsClear(selected))return false;
   return true;
 }
 return {generate,verify,distance,MIN_MAP_WIDTH,MIN_SEPARATION,matchesRegion,arrowIntersectsMarker,arrowsClear};
});
