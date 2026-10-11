/* Unified GeoWords model: authored puzzles and generated practice have one schema.
   This module is pure: no DOM, localStorage, APIs or network dependencies. */
(function(root,make){
  const api=make();
  root.GEOWORD_CORE=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const TARGET=7;
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
  function wordsForStep(course,index){return course.steps[index]?.wordIds||[]}
  function newProgress(course){
    return {version:1,courseId:course.id,stepIndex:0,solved:course.steps.map(()=>[])};
  }
  function normalizeProgress(raw,course){
    const state=newProgress(course);
    if(!raw||raw.version!==1||raw.courseId!==course.id||!Array.isArray(raw.solved))return state;
    for(let i=0;i<course.steps.length;i++){
      const valid=new Set(wordsForStep(course,i));
      const entries=Array.isArray(raw.solved[i])?raw.solved[i]:[];
      state.solved[i]=[...new Set(entries.filter(id=>typeof id==="string"&&valid.has(id)))].slice(0,course.target||TARGET);
    }
    const next=state.solved.findIndex(items=>items.length<(course.target||TARGET));
    state.stepIndex=next===-1?course.steps.length-1:next;
    return state;
  }
  function nextWordId(course,progress){
    const state=normalizeProgress(progress,course);
    const solved=new Set(state.solved[state.stepIndex]);
    return wordsForStep(course,state.stepIndex).find(id=>!solved.has(id))||null;
  }
  function markSolved(course,progress,puzzle){
    const state=normalizeProgress(progress,course),step=state.stepIndex;
    if(puzzle.source!=="generated"||puzzle.review||puzzle.courseId!==course.id||puzzle.stepIndex!==step)
      return {progress:state,credited:false,advanced:false};
    if(puzzle.dictionaryId!==nextWordId(course,state))
      return {progress:state,credited:false,advanced:false};
    state.solved[step].push(puzzle.dictionaryId);
    const threshold=course.target||TARGET;
    const advanced=state.solved[step].length>=threshold&&step<course.steps.length-1;
    if(advanced)state.stepIndex++;
    return {progress:state,credited:true,advanced,
      finished:!advanced&&state.solved[step].length>=threshold};
  }
  function generate(course,lexicon,progress,variant=0,review=false){
    const state=normalizeProgress(progress,course);
    const stepIndex=state.stepIndex;
    let wordId=nextWordId(course,state);
    if(!wordId&&review){
      const available=wordsForStep(course,stepIndex);
      wordId=available[Math.abs(variant)%available.length];
    }
    if(!wordId)return null;
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
      title:active.at(-1).object.label+(review?" · Review word":" · Word "+(state.solved[stepIndex].length+1)+"/"+(course.target||TARGET)),
      series:"World Geography Series",level:"Practice",unit:course.title,
      answer:entry.word,map:course.map,mapAspect:course.mapAspect,
      introFacts:active.at(-1).object.facts,markers,clues,definition:entry.definition,
      nextFacts:[],features:active.map(step=>step.object)
    };
  }
  return {fromAuthored,buildDictionary,newProgress,normalizeProgress,nextWordId,markSolved,generate,project};
});
