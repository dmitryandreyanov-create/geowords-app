import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const read=name=>JSON.parse(fs.readFileSync('data/import-staging/'+name,'utf8'));
const empty=()=>({places:[],regions:[],sides:[],between:[],hemispheres:[],boundaries:[]});
const notes={
 'coast':'Круг находится у берега/края суши. Проверить принадлежность центра и допустимость региональной интерпретации.',
 'isthmus':'Маркер у соединения Америк. Возможна принадлежность North America одновременно с «между»; проверить конкуренцию с материковой подсказкой.',
 'island-water':'Маркер в островной зоне между Азией и Австралией. Границы материков/океанов здесь не нарисованы; базовую принадлежность не считать доказанной.',
 'land-junction':'Маркер в зоне соединения Африки и Евразии. Объект центра не установлен; проверить широкие материковые подсказки.',
 'ocean-boundary':'На схематичной карте нет границы Южного океана. Предлагаемое название бассейна требует редакторской проверки.',
 'asian-coast':'Круг закрывает азиатское побережье. Положение центра на суше/воде не утверждено; нельзя просто перенести смысл региональной подсказки в sitsIn.',
 'american-coast':'Круг у Мексики/Центральной Америки перекрывает сушу и воду. Базовую принадлежность центра оставляем неизвестной.',
 'european-coast':'Круг у южноевропейского берега перекрывает сушу и море. Объект центра оставлен неизвестным.',
 'hemisphere-only':'По линиям исходной карты предложены только полушария; материк/океан не определён.',
 'equator-glyph-offset':'Линия экватора проходит через исходный круг, но центр извлечённого текстового bbox немного смещён. Не выбирать полушарие по жёсткому порогу y.',
 'arrow-coast':'Стрелка направлена к острову; вершина исходного наконечника может быть у берега/рядом с островом. Название цели — предложение, не утверждение точки суши.'
};
export function buildProposals(observations,scaffold,staging,source,relations=null){
 const place=code=>{const id=observations.codes[code];if(!id)throw Error('Unknown visual place code '+code);return 'place-'+id};
 const decisions=new Map();
 if(relations){
  if(relations.schemaVersion!==1||relations.status!=='not_for_live_use'||relations.origin!=='user_decisions_in_chat'||relations.scope!=='l1-01-confirmed-between-usage'||!Array.isArray(relations.decisions)||relations.decisions.length!==3)throw Error('Invalid partial relation decisions');
  const known=new Set(Object.values(observations.codes).map(id=>'place-'+id));
  for(const d of relations.decisions){const scope=scaffold.puzzles.find(p=>p.puzzleId===d.puzzleId),r=scope?.reviews.find(r=>r.anchorId===d.anchorId);
   if(!r||d.puzzleId!=='l1-01'||!['l1-01-glyph-02','l1-01-glyph-08','l1-01-glyph-06'].includes(d.anchorId)||decisions.has(d.anchorId)||JSON.stringify(r.sourceBinding)!==JSON.stringify(d.sourceBinding)||d.status!=='relation_confirmed'||d.clueUsage!=='between_only'||d.physicalPlaces!==null||d.complete!==false||d.futureVariantsApproved!==false||!d.reviewedBy||!Array.isArray(d.between)||d.between.length!==1||!Array.isArray(d.between[0])||d.between[0].length!==2||d.between[0][0]===d.between[0][1]||d.between[0].some(id=>!known.has(id)))throw Error('Stale/unknown/overbroad relation decision');
   decisions.set(d.anchorId,d);
  }
 }
 return {schemaVersion:1,status:'not_for_live_use',origin:'visual_source_map_proposals',source,
  warning:'Partial visual proposals only. Unknown properties are represented by empty draft lists, not complete negative assertions. No geographic approvals.',
  puzzles:scaffold.puzzles.map(scope=>{
   const puzzle=staging.puzzles.find(p=>p.id===scope.puzzleId),rows=observations.puzzles[scope.puzzleId];
   if(rows.length!==puzzle.markers.length)throw Error('Incomplete visual observations '+scope.puzzleId);
   const seen=new Set();
   const records=rows.map(([suffix,code,direction,between,side,note,hemispheres,boundary,targetCode])=>{
    const id=scope.puzzleId+'-glyph-'+suffix,original=scope.reviews.find(r=>r.anchorId===id);
    if(!original||seen.has(id))throw Error('Unknown/duplicate visual glyph '+id);seen.add(id);
    const physical=empty(),target=targetCode?empty():null;
    if(code){physical.places.push(place(code));if(['AS','EU'].includes(code))physical.places.push(place('EA'))}
    if(direction){if(!code)throw Error('Region without object');physical.regions.push({placeId:place(code),direction})}
    if(between)physical.between=between.split(',').map(pair=>pair.split('-').map(place));
    if(side)physical.sides.push({oceanId:place(code),sidePlaceId:place(side)});
    if(hemispheres)physical.hemispheres=hemispheres.split(',');if(boundary)physical.boundaries=[boundary];
    if(targetCode){if(!original.sourceBinding.pointsTo)throw Error('Target without arrow');target.places.push(place(targetCode))}
    const decision=decisions.get(id);
    if(decision){for(const field of Object.keys(physical))physical[field]=[];physical.between=structuredClone(decision.between)}
    const hasPhysical=Object.values(physical).some(a=>a.length);
    return {anchorId:id,status:'editorial_pending',complete:false,sourceBinding:original.sourceBinding,
     physical:hasPhysical?physical:null,target,
     proposedFields:{physical:Object.keys(physical).filter(k=>physical[k].length),target:target?['places']:[]},
     ...(decision?{confirmedRelation:{usage:decision.clueUsage,between:structuredClone(decision.between),physicalPlaces:null,complete:false,source:'data/import-staging/l1-relation-decisions.json'}}:{}),
     notes:decision?['Пользователь подтвердил только «между» и использование этой точки только для такой подсказки. Принадлежность континенту остаётся неизвестной; пустой черновой список НЕ означает отсутствие принадлежности. Полная география не утверждена.']:note?[notes[note]]:[],provenance:{source:source.source,mapPdfPage:puzzle.provenance.mapPdfPage,method:decision?'user_confirmed_relation_on_source_map':'visual_source_map',sourceGlyphId:id}};
   });
   return {puzzleId:scope.puzzleId,map:scope.map,records};
  })};
}
export const serializeProposals=data=>JSON.stringify(data,null,2)+'\n';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const source=read('facts-draft.json').sources.find(s=>s.bookId==='l1');
 const result=buildProposals(read('l1-spatial-observations.json'),read('l1-spatial-review-draft.json'),read('l1-staging.json'),source,read('l1-relation-decisions.json'));
 const output='data/import-staging/l1-spatial-proposals.json',content=serializeProposals(result);
 if(process.argv.includes('--check')){if(fs.readFileSync(output,'utf8')!==content)throw Error('Visual proposals differ from observations/bindings')}
 else fs.writeFileSync(output,content);
 console.log(`L1 visual proposals: ${result.puzzles.flatMap(p=>p.records).length} pending glyphs; ${result.puzzles.flatMap(p=>p.records).filter(r=>r.notes.length).length} explicit review notes.`);
}
