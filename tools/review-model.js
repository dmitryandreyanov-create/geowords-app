/* Internal editorial state. A symbol match is not geographic approval. */
(function(root,factory){
 const api=factory();root.GEOWORD_REVIEW=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 function create(puzzles){
  return {assignments:Object.fromEntries(puzzles.map(p=>[p.id,Object.fromEntries(p.clues.filter(c=>c.markerId).map(c=>[c.position,c.markerId]))])),confirmations:{}};
 }
 function evidence(p,clue,markerId){
  const m=p.markers.find(m=>m.id===markerId);
  if(!m||!clue.candidateMarkerIds.includes(markerId))throw Error(`Недопустимый выбор ${p.id}:${clue.position}`);
  return {markerId,clueText:clue.text,x:m.x,y:m.y,pointsTo:m.pointsTo||null};
 }
 function same(a,b){
  if(a===b)return true;
  if(!object(a)||!object(b))return false;
  const keys=Object.keys(a);
  return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
 }
 function check(puzzles,state){
  for(const p of puzzles){
   const used=new Set();
   for(const c of p.clues){
    const id=state.assignments[p.id]?.[c.position];
    if(id){evidence(p,c,id);if(used.has(id))throw Error(`Одна буква назначена дважды: ${p.id}`);used.add(id)}
    const confirmed=state.confirmations[p.id]?.[c.position];
    if(confirmed&&(!id||!same(confirmed,evidence(p,c,id))))throw Error(`Подтверждение устарело: ${p.id}:${c.position}`);
   }
  }
 }
 function restore(puzzles,data){
  if(!object(data)||![1,2].includes(data.version)||data.generatedFrom!=='author map review'||!object(data.assignments)||data.sourceQuizCount!==puzzles.length)throw Error('Неверный формат файла разметки');
  if(data.version===2&&!object(data.confirmations))throw Error('Неверный формат подтверждений');
  const state=create(puzzles),byId=new Map(puzzles.map(p=>[p.id,p]));
  for(const [field,records] of [['assignments',data.assignments],['confirmations',data.version===2?data.confirmations:{}]]){
   for(const [id,record] of Object.entries(records)){
    const p=byId.get(id);if(!p||!object(record))throw Error('Неизвестное задание или неверная запись: '+id);
    state[field][id]||={};
    for(const [position,value] of Object.entries(record)){
     const c=p.clues.find(c=>String(c.position)===position);
     if(!c)throw Error(`Неизвестная подсказка ${id}:${position}`);
     if(field==='assignments')evidence(p,c,value);
     if(field==='confirmations'&&!object(value))throw Error(`Неверное подтверждение ${id}:${position}`);
     if(field==='assignments'&&c.candidateMarkerIds.length===1&&value!==c.markerId)throw Error(`Неверная буква ${id}:${position}`);
     state[field][id][position]=value;
    }
   }
  }
  check(puzzles,state);return state;
 }
 function assign(state,p,clue,id){
  evidence(p,clue,id);
  if(p.clues.some(c=>c!==clue&&state.assignments[p.id]?.[c.position]===id))throw Error('Эта буква уже назначена другой подсказке.');
  state.assignments[p.id][clue.position]=id;
  if(state.confirmations[p.id])delete state.confirmations[p.id][clue.position];
 }
 function confirm(state,p,clue){
  const id=state.assignments[p.id]?.[clue.position];
  if(!id)throw Error('Сначала назначьте букву.');
  state.confirmations[p.id]||={};state.confirmations[p.id][clue.position]=evidence(p,clue,id);
 }
 function clear(state,p,clue){
  if(!clue.markerId)delete state.assignments[p.id][clue.position];
  if(state.confirmations[p.id])delete state.confirmations[p.id][clue.position];
 }
 function exportReview(puzzles,state){
  check(puzzles,state);
  const assignments=Object.fromEntries(puzzles.map(p=>[p.id,Object.fromEntries(p.clues.filter(c=>c.candidateMarkerIds.length>1&&state.assignments[p.id]?.[c.position]).map(c=>[c.position,state.assignments[p.id][c.position]]))]));
  return {version:2,generatedFrom:'author map review',sourceQuizCount:puzzles.length,assignments,confirmations:JSON.parse(JSON.stringify(state.confirmations))};
 }
 function stats(puzzles,state){
  let total=0,done=0,ambiguous=0,assignedAmbiguous=0,confirmed=0;
  for(const p of puzzles)for(const c of p.clues){total++;const id=state.assignments[p.id]?.[c.position];
   if(id)done++;if(c.candidateMarkerIds.length>1){ambiguous++;if(id)assignedAmbiguous++}
   if(state.confirmations[p.id]?.[c.position])confirmed++;
  }
  return {total,done,ambiguous,assignedAmbiguous,confirmed};
 }
 return {create,restore,assign,confirm,clear,exportReview,stats,evidence};
});
