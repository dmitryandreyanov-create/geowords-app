import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {buildSpatialReview} from './build_l1_spatial_review.mjs';
import {loadScript} from './build_lexicon_draft.mjs';
const clone=structuredClone;
const f=id=>'f-l2-'+id,l1=id=>'f-l1-'+id;
const riverFacts={nile:['p07-nile-mediterranean','p07-nile-note'],amazon:['p09-amazon-volume','p09-amazon-location'],mississippi:['p11-mississippi-gulf'],yangtze:['p13-yangtze'],ganges:['p15-ganges'],danube:['p17-danube'],volga:['p19-volga','p19-volga-kama-note']};
const records=[
 ['is in Africa','africa',[l1('p06-continents')]],['is in Antarctica','antarctica',[l1('p06-continents')]],
 ['is in Northern Asia','asia',[l1('p06-continents'),l1('p12-directions')],'region','north'],['is in Northern Europe','europe',[l1('p06-continents'),l1('p12-directions')],'region','north'],
 ...['Arctic','Atlantic','Indian','Pacific','Southern'].map(name=>['is in the '+name+' Ocean',name.toLowerCase()+'-ocean',[l1('p06-oceans')]]),
 ['is in the Mediterranean Sea','mediterranean-sea',riverFacts.nile.map(f)],['is in the Caspian Sea, where the Volga River empties','caspian-sea',riverFacts.volga.map(f)],
 ['is in the northern part of the Atlantic Ocean','atlantic-ocean',[l1('p06-oceans'),l1('p12-directions')],'region','north'],['is in the southern part of the Atlantic Ocean','atlantic-ocean',[l1('p06-oceans'),l1('p12-directions')],'region','south'],
 ...['is in the smallest ocean','is in the world’s smallest ocean'].map(t=>[t,'arctic-ocean',[l1('p10-oceans-left'),l1('p10-salinity-note')]]),
 ...['is in the warmest ocean','is in the world’s warmest ocean'].map(t=>[t,'indian-ocean',[l1('p10-oceans-right'),l1('p10-salinity-note')]]),
 ['is in the coldest ocean','southern-ocean',[l1('p10-oceans-left'),l1('p10-salinity-note')]],['is in the saltiest ocean','atlantic-ocean',[l1('p10-oceans-right'),l1('p10-salinity-note')]],
 ['is in the largest ocean','pacific-ocean',[l1('p18-residents-climate-population')]],
 ...['is in the largest desert in the world','is on the continent with the world’s largest desert'].map(t=>[t,'antarctica',[l1('p22-deserts')]]),
 ...['Australia','North America','South America'].map(t=>['is on '+t,t.toLowerCase().replaceAll(' ','-'),[l1('p06-continents')]]),
 ['is on the smallest continent','australia',[l1('p08-continent-properties')]],
 ...['is on Greenland','is on the island of Greenland','is on the largest island'].map(t=>[t,'greenland',[l1('p16-islands-left')]]),
 ['is on the island of Madagascar','madagascar',[l1('p16-islands-left')]],
 ...Object.keys(riverFacts).map(name=>['is next to the '+name[0].toUpperCase()+name.slice(1)+' River',name,riverFacts[name].map(f),'near']),
 ...['is next to the longest river in the world','is next to the world’s longest river'].map(t=>[t,'nile',riverFacts.nile.map(f),'near']),
 ['is next to the river that carries more water than any other river in the world','amazon',riverFacts.amazon.map(f),'near'],
 ['is next to one of the longest rivers in North America','mississippi',riverFacts.mississippi.map(f),'near'],['is next to the longest river in Asia','yangtze',riverFacts.yangtze.map(f),'near'],
 ['is next to one of the most important rivers in India','ganges',riverFacts.ganges.map(f),'near'],['is next to the second-longest river in Europe','danube',riverFacts.danube.map(f),'near'],['is next to the longest river in Europe','volga',riverFacts.volga.map(f),'near'],
];
export function buildL2Catalog(staging,mapping,draft,l1Catalog){
 const lookup=new Map(records.map(r=>[r[0],r])),descriptors=[],byText=new Map(),anchors=[],audit=[],known=new Set();
 const course=draft.courses.find(c=>c.id==='rivers'),facts=new Set(draft.facts.map(f=>f.id));
 for(const puzzle of staging.puzzles){
  const step=course.steps.find(s=>s.authoredPuzzleId===puzzle.id);step.candidateLearnBefore.forEach(id=>known.add(id));const used=new Set();
  for(const clue of puzzle.clues){
   const text=clue.text.replace(/^The \w+ letter /,'').replace(/\.$/,'');const row=lookup.get(text);if(!row)throw Error('Unclassified L2 phrase: '+text);
   let d=byText.get(text);if(!d){const [,name,requires,op='place',direction]=row,placeId='place-'+name;
    if(requires.some(id=>!facts.has(id)))throw Error('Unknown L2 fact proposal');
    d={id:'l2-descriptor-'+String(descriptors.length+1).padStart(2,'0'),status:'editorial_pending',sourcePredicate:{en:text},kind:op==='region'?'directional':op==='near'?'relational':'name',candidateTargetPlaceId:placeId,candidateRelatedPlaceIds:[],candidateRequiresFacts:[...new Set(requires)],requires:null,resolvesTo:null,geographicReview:'pending',occurrences:[],candidateQuery:{status:'editorial_pending',channel:'either',requires:[...new Set(requires)],requiredPlaces:[placeId],op,placeId,...(direction?{direction}:{})}};descriptors.push(d);byText.set(text,d);
   }
   const markerId=mapping.assignments[puzzle.id]?.[clue.position]??clue.markerId,marker=puzzle.markers.find(m=>m.id===markerId);
   if(!marker||used.has(markerId)||marker.letter!==clue.answerLetter)throw Error('Invalid L2 assignment '+puzzle.id+':'+clue.position);used.add(markerId);
   d.occurrences.push({puzzleId:puzzle.id,position:clue.position,sourceText:{en:clue.text},selectedAnchorId:markerId,provenance:clone(puzzle.provenance)});
   anchors.push({id:markerId,status:'editorial_pending',puzzleId:puzzle.id,mapId:puzzle.map,letter:marker.letter,x:marker.x,y:marker.y,pointsTo:clone(marker.pointsTo??null),sitsIn:null,pointsToPlaceId:null,candidateTargetPlaceId:d.candidateTargetPlaceId,descriptorId:d.id,mappingBasis:clue.markerId===markerId?'unique_source_symbol':'user_selected_marker',geographicReview:'pending'});
   audit.push({puzzleId:puzzle.id,position:clue.position,descriptorId:d.id,status:'candidate_timing_only',externalPrerequisiteFactIds:d.candidateRequiresFacts.filter(id=>id.startsWith('f-l1-')),missingEarlierLocalFactIds:d.candidateRequiresFacts.filter(id=>id.startsWith('f-l2-')&&!known.has(id)),geographicResolution:'not_verified'});
  }
  step.candidateUnlockAfter.forEach(id=>known.add(id)); // optional is NOT silently learned
 }
 const extras=[['amazon','river'],['mississippi','river'],['yangtze','river'],['ganges','river'],['danube','river'],['volga','river'],['mediterranean-sea','sea'],['caspian-sea','lake'],['gulf-of-mexico','gulf'],['china','country'],['india','country'],['russia','country']];
 const places=[...clone(l1Catalog.places),...extras.map(([id,kind])=>({id:'place-'+id,status:'editorial_pending',kind,label:{en:id.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')},introducedBy:null,anchors:[]}))];
 return {schemaVersion:1,status:'not_for_live_use',bookId:'l2',courseId:'rivers',requiresCourses:['oceans-continents'],warning:'Source proposals only. L1 knowledge is not assumed learned. Near a river is distinct from on a river; all geography, lesson timing and word distribution remain pending.',places,anchors,descriptors,audit};
}
// Explicit proposals, not an algorithm assigning words by the author answer.
// Existing global definitions are reused; their age/meaning checks remain open.
const laterWords=[
 ['watershed','catchment','confluence','headwater','basin','distance'],
 ['aridity','drought','oasis','climate','tropics','islet'],
 ['settlement','migration','urban','rural','density','region'],
 ['border','mapping','atlas','globe','compass','bearing'],
 ['terrain','canyon','plateau','ridge','ridgeline','summit'],
 ['temperate','polar','slope','salinity','seawater','current'],
 ['latitude','meridian','parallel','grid','position','reference'],
];
const practiceScopes=['l2-02','l2-03','l2-04','l2-05','l2-06','l2-07','l2-08','l2-09','l2-10','l2-10'];
const focus=[['nile'],['amazon'],['mississippi'],['yangtze'],['ganges'],['danube'],['volga'],['nile','amazon','mississippi','yangtze','ganges','danube','volga'],['nile','amazon','mississippi','yangtze','ganges','danube','volga'],['nile','amazon','mississippi','yangtze','ganges','danube','volga']];
export function buildL2Plans(draft,pilot,lexicon,staging,spatial){
 const entries=new Map(lexicon.entries.map(e=>[e.id,e])),l1Words=new Set(lexicon.practicePlans.flatMap(p=>p.candidateWordIds)),used=new Set();
 const plans=draft.courses.find(c=>c.id==='rivers').steps.map((s,i)=>{
  const words=i<3?[...pilot.steps[i].wordIds]:[...laterWords[i-3]],puzzle=staging.puzzles.find(p=>p.id===practiceScopes[i]),scope=spatial.puzzles.find(p=>p.puzzleId===puzzle?.id);
  if(!scope||words.length!==6||new Set(words).size!==6)throw Error('Invalid explicit L2 practice proposal');
  for(const id of words){const e=entries.get(id);if(!e||used.has(id)||e.word.length>scope.map.anchorIds.length)throw Error('Unknown/repeated/over-capacity L2 word '+id);used.add(id)}
  return {stepId:s.id,status:'editorial_pending',authoredFirst:true,target:7,practiceCount:6,candidateWordIds:words,
   wordProposalOrigin:i<3?'existing_pilot_plan':'codex_global_lexicon_selection_not_authored',
   candidateL1RepeatedWordIds:words.filter(id=>l1Words.has(id)),crossCourseReuseStatus:'editorial_pending',
   candidatePracticeMap:{status:'editorial_pending',sourcePuzzleId:puzzle.id,asset:puzzle.map,aspect:puzzle.mapAspect,mapSha256:scope.map.sha256,anchorIds:[...scope.map.anchorIds],provenance:clone(puzzle.provenance),candidateFocusPlaceIds:focus[i].map(id=>'place-'+id),focusStatus:'editorial_pending',capacityStatus:'word_length_within_source_anchor_count_only',geographicResolution:'not_verified'},
   geometryStatus:'not_verified',teachingOrderStatus:'editorial_pending',generatedPuzzles:[]};
 });
 return {schemaVersion:1,status:'not_for_live_use',courseId:'rivers',warning:'Sixty candidate slots using existing global definitions, not generated puzzles. Cross-course reuse, explicit source map/focus, geography, age suitability and teaching order require review. No facts are learned by these proposals.',practicePlans:plans};
}
export function buildL2Sources(){const read=name=>JSON.parse(fs.readFileSync('data/import-staging/'+name+'.json')),draft=read('curriculum-draft'),catalog=buildL2Catalog(read('l2-staging'),read('review-assignments'),draft,read('l1-catalog-draft')),spatial=buildSpatialReview(catalog);spatial.warning='L2 blank scopes, all proximity and arrow channels unreviewed.';spatial.puzzles.forEach(p=>p.requiresNearReview=true);
 const pilot=loadScript('data/courses.js','GEOWORD_COURSES').rivers;return {catalog,spatial,plans:buildL2Plans(draft,pilot,read('lexicon-draft'),read('l2-staging'),spatial)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const s=buildL2Sources();for(const [name,data] of [['l2-catalog-draft',s.catalog],['l2-spatial-review-draft',s.spatial],['l2-practice-plans-draft',s.plans]]){const path='data/import-staging/'+name+'.json',content=JSON.stringify(data,null,2)+'\n';if(process.argv.includes('--check')){if(fs.readFileSync(path,'utf8')!==content)throw Error('Stale L2 source '+name)}else{if(fs.existsSync(path)&&fs.readFileSync(path,'utf8')!==content)throw Error('Refusing to overwrite an existing L2 source; inspect changes explicitly');fs.writeFileSync(path,content)}}console.log(`L2 pending: ${s.catalog.anchors.length} anchors, ${s.catalog.descriptors.length} phrases, ${s.spatial.puzzles.length} scopes; sixty candidate slots and ten explicit map proposals, no generated puzzles.`)}
