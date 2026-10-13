import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// Source phrases are complete authored predicates, not generated clue templates.
// Targets and dependencies are editorial proposals, never geographic approval.
const rows = [
 ['is in Australia','australia'],
 ['is in Africa','africa'],
 ['is in Eurasia','eurasia'],
 ['is in South America','south-america'],
 ['is in North America','north-america'],
 ['is in Antarctica','antarctica'],
 ['is between North and South America',null,'relational','north-america,south-america'],
 ['is between Africa and Eurasia',null,'relational','africa,eurasia'],
 ['is between Australia and Eurasia',null,'relational','australia,eurasia'],
 ['is between Asia and Australia',null,'relational','asia,australia'],
 ['is in Asia','asia'],
 ['is in the coldest continent','antarctica','superlative',null,'p08-continent-properties'],
 ['is in the hottest continent','africa','superlative',null,'p08-continent-properties'],
 ['is in the smallest continent','australia','superlative',null,'p08-continent-properties'],
 ['is in Europe','europe'],
 ['is between Africa and South America',null,'relational','africa,south-america'],
 ['is between Australia and Antarctica',null,'relational','australia,antarctica'],
 ['is in the smallest ocean','arctic-ocean','superlative',null,'p10-oceans-left'],
 ['is in the warmest ocean','indian-ocean','superlative',null,'p10-oceans-right'],
 ['is on the hottest continent','africa','superlative',null,'p08-continent-properties'],
 ['is on the Asian side of the deepest ocean','pacific-ocean','directional','asia','p10-oceans-right'],
 ['is in the coldest ocean','southern-ocean','superlative',null,'p10-oceans-left'],
 ['is on the North American side of the deepest ocean','pacific-ocean','directional','north-america','p10-oceans-right'],
 ['is in the saltiest ocean','atlantic-ocean','superlative',null,'p10-oceans-right,p10-salinity-note'],
 ['is in northern Africa','africa','directional',null,'p12-directions'],
 ['is in southern Asia','asia','directional',null,'p12-directions'],
 ['is in northern North America','north-america','directional',null,'p12-directions'],
 ['is in southern South America','south-america','directional',null,'p12-directions'],
 ['is in northern Europe','europe','directional',null,'p12-directions'],
 ['is in northern South America','south-america','directional',null,'p12-directions'],
 ['is in northern Asia','asia','directional',null,'p12-directions'],
 ['is in southern Africa','africa','directional',null,'p12-directions'],
 ['is in southern North America','north-america','directional',null,'p12-directions'],
 ['is in the Atlantic Ocean','atlantic-ocean'],
 ['is in the Indian Ocean','indian-ocean'],
 ['is in the Southern Ocean','southern-ocean'],
 ['is in the Southern and Western Hemispheres',null,'hemisphere',null,'p14-equator,p14-prime-meridian'],
 ['is in the Northern and Eastern Hemispheres',null,'hemisphere',null,'p14-equator,p14-prime-meridian'],
 ['is in the Northern and Western Hemispheres',null,'hemisphere',null,'p14-equator,p14-prime-meridian'],
 ['is in the Southern and Eastern Hemispheres',null,'hemisphere',null,'p14-equator,p14-prime-meridian'],
 ['is on the Equator',null,'boundary',null,'p14-equator'],
 ['is in the Pacific Ocean','pacific-ocean'],
 ['is on the island that was once part of Africa','madagascar','definition','africa','p16-islands-left'],
 ['is on a volcanic island','iceland','definition',null,'p16-islands-right'],
 ['is on the largest island','greenland','superlative',null,'p16-islands-left'],
 ['is on both an island and a continent','australia','definition',null,'p16-islands-right,p16-island-continent-note'],
 ['is on the most populous continent','asia','superlative',null,'p18-residents-climate-population'],
 ['is in the largest and most active ocean','pacific-ocean','superlative',null,'p18-residents-climate-population'],
 ['is on the continent with no permanent residents','antarctica','definition',null,'p18-residents-climate-population'],
 ['is on the continent with the longest river','africa','superlative','nile','p20-records-left,p20-nile-note'],
 ['is in the ocean with the deepest point on Earth','pacific-ocean','superlative',null,'p20-records-right'],
 ['is on the continent with the longest mountain range','south-america','superlative','andes','p20-records-right'],
 ['is on the continent with the highest mountain','asia','superlative','everest','p20-records-left'],
 ['is on the continent with the largest desert','antarctica','superlative',null,'p22-deserts'],
 ['is on the continent with the largest hot desert','africa','superlative',null,'p22-deserts'],
 ['is on the continent with the coldest place where people live','asia','superlative',null,'p22-coldest-settlement'],
 ['is in southern Europe','europe','directional',null,'p12-directions'],
 ['is in the northern part of the saltiest ocean','atlantic-ocean','directional',null,'p12-directions,p10-oceans-right,p10-salinity-note'],
 ['is in the southern part of the saltiest ocean','atlantic-ocean','directional',null,'p12-directions,p10-oceans-right,p10-salinity-note'],
 ['is on the continent where the Appalachian Mountains are located','north-america','definition','appalachians','p24-appalachians'],
 ['is on the continent where the Himalayas are located','asia','definition','himalayas','p24-himalayas'],
 ['is on the largest desert in the world','antarctica','superlative',null,'p22-deserts'],
 ['is on the wettest continent','south-america','superlative',null,'p18-residents-climate-population'],
];
const continents = ['africa','antarctica','asia','australia','europe','eurasia','north-america','south-america'];
const oceans = ['arctic-ocean','atlantic-ocean','indian-ocean','pacific-ocean','southern-ocean'];
const islands = ['greenland','iceland','madagascar'];
const other = ['nile','andes','everest','appalachians','himalayas'];
const fact = name => 'f-l1-'+name;
const place = name => 'place-'+name;
const split = value => value ? value.split(',') : [];

export function candidateQuery(descriptor){
 const d=descriptor;
 const query={status:'editorial_pending',channel:'either',
  requires:[...d.candidateRequiresFacts],requiredPlaces:[...new Set([d.candidateTargetPlaceId,...d.candidateRelatedPlaceIds].filter(Boolean))]};
 if(d.kind==='relational')return {...query,op:'between',placeIds:[...d.candidateRelatedPlaceIds]};
 if(d.kind==='hemisphere')return {...query,op:'hemisphere',values:[...d.sourcePredicate.en.matchAll(/Northern|Southern|Eastern|Western/g)].map(m=>({Northern:'north',Southern:'south',Eastern:'east',Western:'west'})[m[0]])};
 if(d.kind==='boundary')return {...query,op:'boundary',boundary:'equator'};
 if(d.kind==='directional'){
  if(d.sourcePredicate.en.includes(' side '))return {...query,op:'side',oceanId:d.candidateTargetPlaceId,sidePlaceId:d.candidateRelatedPlaceIds[0]};
  const direction=d.sourcePredicate.en.match(/northern|southern/)?.[0];
  if(!direction)throw Error('Unclassified directional predicate');
  return {...query,op:'region',placeId:d.candidateTargetPlaceId,direction:direction==='northern'?'north':'south'};
 }
 if(!d.candidateTargetPlaceId)throw Error('Missing proposed place target');
 return {...query,op:'place',placeId:d.candidateTargetPlaceId};
}

export function buildCatalog(staging, mapping, curriculum) {
 const descriptors = rows.map(([text,target,kind='name',related,facts],i) => {
  const refs=[...new Set([target,...split(related)].filter(Boolean))];
  const requirements=split(facts).map(fact);
  if(refs.some(id=>continents.includes(id))) requirements.push(fact('p06-continents'));
  if(refs.includes('eurasia')) requirements.push(fact('p06-eurasia'));
  if(refs.some(id=>oceans.includes(id))) requirements.push(fact('p06-oceans'));
  if(refs.includes('pacific-ocean')) requirements.push(fact('p06-pacific-map'));
  return {id:`l1-descriptor-${String(i+1).padStart(2,'0')}`,status:'editorial_pending',
   sourcePredicate:{en:text},kind,candidateTargetPlaceId:target?place(target):null,
   candidateRelatedPlaceIds:split(related).map(place),candidateRequiresFacts:[...new Set(requirements)],
   requires:null,resolvesTo:null,geographicReview:'pending',occurrences:[]};
 });
 const byText = new Map(descriptors.map(d=>[d.sourcePredicate.en,d]));
 descriptors.forEach(d=>{d.candidateQuery=candidateQuery(d)});
 const anchors=[]; const known=new Set(); const audit=[];
 const steps=curriculum.courses.find(c=>c.id==='oceans-continents').steps;
 for(const puzzle of staging.puzzles){
  const step=steps.find(s=>s.authoredPuzzleId===puzzle.id);
  step.candidateLearnBefore.forEach(id=>known.add(id));
  const used=new Set();
  for(const clue of puzzle.clues){
   const predicate=clue.text.replace(/^The \w+ letter /,'').replace(/\.$/,'');
   const descriptor=byText.get(predicate);
   if(!descriptor) throw new Error(`Unclassified source clue: ${clue.text}`);
   const markerId=mapping.assignments[puzzle.id]?.[clue.position]??clue.markerId;
   const marker=puzzle.markers.find(m=>m.id===markerId);
   if(!marker||marker.letter!==clue.answerLetter||used.has(markerId)) throw new Error(`Invalid mapping ${puzzle.id}:${clue.position}`);
   used.add(markerId);
   const occurrence={puzzleId:puzzle.id,position:clue.position,sourceText:{en:clue.text},
    selectedAnchorId:markerId,provenance:{...puzzle.provenance}};
   descriptor.occurrences.push(occurrence);
   anchors.push({id:markerId,status:'editorial_pending',puzzleId:puzzle.id,mapId:puzzle.map,
    letter:marker.letter,x:marker.x,y:marker.y,pointsTo:marker.pointsTo??null,
    sitsIn:null,pointsToPlaceId:null,candidateTargetPlaceId:descriptor.candidateTargetPlaceId,
    descriptorId:descriptor.id,mappingBasis:clue.markerId===markerId?'unique_source_symbol':'user_selected_marker',
    geographicReview:'pending'});
   audit.push({puzzleId:puzzle.id,position:clue.position,descriptorId:descriptor.id,
    candidateRequiresFacts:descriptor.candidateRequiresFacts,
    missingEarlierFactIds:descriptor.candidateRequiresFacts.filter(id=>!known.has(id)),
    status:'candidate_timing_only',geographicResolution:'not_verified'});
  }
  step.candidateUnlockAfter.forEach(id=>known.add(id));
  step.candidateOptionalAfter.forEach(id=>known.add(id));
 }
 const places=[...continents,...oceans,...islands,...other].map(id=>({
  id:place(id),status:'editorial_pending',kind:continents.includes(id)?'continent':oceans.includes(id)?'ocean':
   islands.includes(id)?'island':id==='nile'?'river':id==='everest'?'mountain':'mountain-range',
  label:{en:id.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ')},
  introducedBy:null,anchors:[]
 }));
 return {schemaVersion:1,status:'not_for_live_use',courseId:'oceans-continents',
  warning:'Source-derived editorial proposals. Marker selection is not geographic approval. No runtime descriptors, place membership or lesson timing are approved.',
  places,anchors,descriptors,audit};
}

export function serializeCatalog(catalog){return JSON.stringify(catalog,null,2)+'\n';}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
 const catalog=buildCatalog(read('data/import-staging/l1-staging.json'),read('data/import-staging/review-assignments.json'),read('data/import-staging/curriculum-draft.json'));
 const output='data/import-staging/l1-catalog-draft.json';
 if(process.argv.includes('--check')){
  if(fs.readFileSync(output,'utf8')!==serializeCatalog(catalog))throw new Error('L1 catalog differs from reproducible source build');
 }else fs.writeFileSync(output,serializeCatalog(catalog));
 console.log(`L1 draft: ${catalog.places.length} places, ${catalog.anchors.length} anchors, ${catalog.descriptors.length} source predicates; ${catalog.audit.filter(a=>a.missingEarlierFactIds.length).length} future-fact dependencies.`);
}
