/* Pilot curriculum content. Maps are author's original 1587x1057 artwork;
   the generated clues use explicitly calibrated 0..100 anchors. */
window.GEOWORD_COURSES={
 rivers:{
  id:"rivers",title:"Rivers",target:7,advanceOn:"solved",
  wordAliases:{},
  semantic:window.GEOWORD_RIVERS_SEMANTICS,
  steps:[
   {id:"nile",authoredPuzzleId:"rivers-authored-01",
    practiceMap:"./assets/rivers-authored-2.webp",
    wordIds:["hydrology","aquifer","alluvium","riparian","sediment","watershed"],
    object:{id:"nile",label:"Nile River"}},
   {id:"amazon",authoredPuzzleId:"rivers-authored-02",
    practiceMap:"./assets/rivers-authored-3.webp",
    wordIds:["humidity","evaporation","alluvial","ecology","tropical","inundation"],
    object:{id:"amazon",label:"Amazon River"}},
   {id:"mississippi",authoredPuzzleId:"rivers-authored-03",
    practiceMap:"./assets/rivers-practice-step-3.webp",
    wordIds:["confluence","navigable","deposition","topography","sedimentary","tributary"],
    object:{id:"mississippi",label:"Mississippi River"}}
  ]
 }
};
