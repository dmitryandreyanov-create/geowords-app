/* Unified GeoWords model: authored puzzles and generated practice have one schema.
   This module is pure: no DOM, localStorage, APIs or network dependencies. */
(function(root,make){
  const api=make();
  root.GEOWORD_CORE=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  
  function fromAuthored(levels){
    if(!Array.isArray(levels))throw new Error("Authored levels must be an array");
    return levels.map(level=>({...level,source:"authored",courseId:"mountains"}));
  }
  function buildDictionary(authored,practice){
    const entries=[...(practice||[])];
    const existing=new Set(entries.map(item=>item.id));
    for(const level of authored){
      const id="authored:"+level.id;
      if(existing.has(id))throw new Error("Duplicate dictionary id: "+id);
      existing.add(id);
      entries.push({id,word:level.answer,definition:level.definition,source:"authored",unit:level.unit});
    }
    return entries;
  }
  function project(lon,lat,bounds){
    return {x:100*(lon-bounds.west)/(bounds.east-bounds.west),
      y:100*(bounds.north-lat)/(bounds.north-bounds.south)};
  }
  function hash(value){
    let h=2166136261;
    for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  }
  function shuffle(input,seed){
    const a=[...input];let s=hash(seed)||1;
    function random(){s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}
    for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }
  // One authored puzzle plus six distinct generated words per curriculum step.
  const TOTAL=7;
  function practiceIds(step){return step?.wordIds||[]}
  function record(state,step){return state.steps[step.id]}
  function stepScore(state,step){const r=record(state,step);return Number(r.authoredSolved)+r.solvedWordIds.length}
  function newProgress(course){
    return {
      schemaVersion:2,courseId:course.id,stepIndex:0,
      steps:Object.fromEntries(course.steps.map(step=>[step.id,{authoredSolved:false,solvedWordIds:[]}])),
    };
  }
  function normalizeProgress(raw,course){
    const state=newProgress(course);
    if(!raw||raw.courseId!==course.id)return state;
    const v2=raw.schemaVersion===2&&raw.steps&&typeof raw.steps==="object";
    const v1=raw.version===1&&Array.isArray(raw.solved);
    if(!v2&&!v1)return state;
    course.steps.forEach((step,i)=>{
      const dest=record(state,step);
      const prev=v2?raw.steps[step.id]:null;
      if(v2)dest.authoredSolved=prev?.authoredSolved===true;
      // Keep earned word IDs even if the editor renames or reorders the dictionary.
      // Migration from unreleased v1 never invents a completed authored puzzle.
      const ids=v2?prev?.solvedWordIds:raw.solved[i];
      if(Array.isArray(ids)){
        const permitted=new Set(practiceIds(step));
        const aliases=course.wordAliases||{};
        dest.solvedWordIds=[...new Set(ids
          .filter(id=>typeof id==="string")
          .map(id=>aliases[id]||id)
          .filter(id=>permitted.has(id)))].slice(0,TOTAL-1);
      }
    });
    const next=course.steps.findIndex(step=>stepScore(state,step)<TOTAL);
    state.stepIndex=next<0?course.steps.length-1:next;
    return state;
  }
  function nextAuthoredPuzzleId(course,progress){
    const state=normalizeProgress(progress,course),step=course.steps[state.stepIndex];
    return record(state,step).authoredSolved?null:step.authoredPuzzleId;
  }
  function nextWordId(course,progress){
    const state=normalizeProgress(progress,course),step=course.steps[state.stepIndex];
    if(!record(state,step).authoredSolved)return null;
    const credited=new Set(record(state,step).solvedWordIds);
    if(credited.size>=TOTAL-1)return null;
    return practiceIds(step).find(id=>!credited.has(id))||null;
  }
  function markSolved(course,progress,puzzle){
    const state=normalizeProgress(progress,course),stepIndex=state.stepIndex;
    const step=course.steps[stepIndex],r=record(state,step);
    const invalid={progress:state,credited:false,advanced:false,finished:false,count:stepScore(state,step)};
    if(!puzzle||puzzle.courseId!==course.id||puzzle.review)return invalid;
    if(puzzle.source==="authored"){
      if(r.authoredSolved||puzzle.id!==step.authoredPuzzleId)return invalid;
      r.authoredSolved=true;
    }else if(puzzle.source==="generated"){
      if(!r.authoredSolved||puzzle.stepIndex!==stepIndex||
         !practiceIds(step).includes(puzzle.dictionaryId)||
         r.solvedWordIds.length>=TOTAL-1||
         r.solvedWordIds.includes(puzzle.dictionaryId))return invalid;
      r.solvedWordIds.push(puzzle.dictionaryId);
    }else return invalid;
    const count=stepScore(state,step),complete=count===TOTAL;
    const advanced=complete&&stepIndex<course.steps.length-1;
    const finished=complete&&!advanced;
    if(advanced)state.stepIndex=stepIndex+1;
    return {progress:state,credited:true,advanced,finished,count,source:puzzle.source};
  }
  function generate(course,lexicon,progress,variant=0,review=false){
    const state=normalizeProgress(progress,course);
    const stepIndex=state.stepIndex;
    let wordId=nextWordId(course,state);
    if(!wordId&&review){
      const available=practiceIds(course.steps[stepIndex]);
      wordId=available[Math.abs(variant)%available.length];
    }
    if(!wordId)return null;
    if(course.semantic){
      if(!review&&!nextWordId(course,state))return null;
      const backend=(typeof module!=="undefined"&&module.exports)
        ?require("./semantic.js"):globalThis.GEOWORD_SEMANTIC;
      if(!backend||typeof backend.generate!=="function")throw new Error("Semantic generator unavailable");
      const step=course.steps[stepIndex],completed=new Set(state.steps[step.id].solvedWordIds);
      const candidates=review?practiceIds(step):practiceIds(step).filter(id=>!completed.has(id));
      for(const id of shuffle(candidates,course.id+":"+step.id+":"+variant+":"+completed.size)){
        const entry=lexicon.find(item=>item.id===id);
        if(!entry)continue;
        const puzzle=backend.generate(course,entry,stepIndex,variant,review,state);
        if(puzzle)return puzzle;
      }
      return null;
    }
    const entry=lexicon.find(item=>item.id===wordId);
    if(!entry||typeof entry.word!=="string"||!/^[A-Z]+$/.test(entry.word)||!entry.definition)
      throw new Error("Missing reviewed dictionary entry: "+wordId);
    const active=course.steps.slice(0,stepIndex+1),bounds=course.mapBounds;
    const required=active.map(step=>({id:step.object.id,label:step.object.label,
      text:step.object.clue,lon:step.object.anchor.lon,lat:step.object.anchor.lat}));
    const chosen=[];
    function add(anchor){
      const xy=project(anchor.lon,anchor.lat,bounds);
      if(![xy.x,xy.y].every(v=>Number.isFinite(v)&&v>=0&&v<=100))
        throw new Error("Anchor outside map: "+anchor.id);
      chosen.push({...anchor,x:xy.x,y:xy.y});
    }
    required.forEach(add);
    const pool=shuffle(course.anchors,course.id+":"+stepIndex+":"+wordId+":"+variant);
    const distance=(a,b)=>Math.hypot((a.x-b.x)*3.22,(a.y-b.y)*1.81);
    for(const anchor of pool){
      if(chosen.length>=entry.word.length)break;
      const xy=project(anchor.lon,anchor.lat,bounds);
      if(chosen.some(c=>distance(c,xy)<34))continue;
      add(anchor);
    }
    if(chosen.length<entry.word.length)
      throw new Error("Not enough non-overlapping anchors for "+entry.word);
    const placed=shuffle(chosen,wordId+":letter-order:"+variant);
    const markers=placed.map((anchor,i)=>({id:anchor.id,x:Number(anchor.x.toFixed(2)),
      y:Number(anchor.y.toFixed(2)),letter:entry.word[i],label:anchor.label}));
    const clues=placed.map(anchor=>({markerId:anchor.id,text:anchor.text}));
    return {
      source:"generated",courseId:course.id,stepIndex,dictionaryId:wordId,review,
      id:"generated:"+course.id+":"+active.at(-1).id+":"+wordId+":"+variant,
      title:active.at(-1).object.label+(review?" · Review word":" · Word "+(stepScore(state,course.steps[stepIndex])+1)+"/"+TOTAL),
      series:"World Geography Series",level:"Practice",unit:course.title,
      answer:entry.word,map:course.map,mapAspect:course.mapAspect,
      introFacts:active.at(-1).object.facts,markers,clues,definition:entry.definition,
      nextFacts:[],features:active.map(step=>step.object)
    };
  }
  return {fromAuthored,buildDictionary,newProgress,normalizeProgress,nextAuthoredPuzzleId,nextWordId,markSolved,generate,project,stepScore};
});
