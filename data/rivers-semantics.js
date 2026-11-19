/* Map-anchored geography cues, based on original Level 2 Rivers maps.
   All x/y are percentages of the exact 1587×1057 author map.
   Each descriptor has a target region; all matching selected anchors are
   examined before the clue is allowed. No lon/lat projection is used.
   Names and wording here are editorial candidates until approved by author. */
window.GEOWORD_RIVERS_SEMANTICS={
 mapId:'rivers-author-map-v1',
 practiceMaps:[
  './assets/rivers-authored-2.webp', // after CHANNEL, Nile appears
  './assets/rivers-authored-3.webp', // after FLOODPLAIN, Amazon appears
  './assets/rivers-practice-step-3.webp' // after RAINFOREST, Mississippi appears
 ],
 prerequisites:[
  'There are seven continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.',
  'There are five oceans: the Pacific, Atlantic, Indian, Southern, and Arctic Oceans.',
  'Eurasia contains Europe and Asia. The smallest continent is Australia and the hottest is Africa.',
  'The smallest ocean is the Arctic Ocean; the coldest is the Southern Ocean; the warmest is the Indian Ocean.',
  'The Pacific Ocean is the largest and deepest ocean; the Atlantic has the highest average salinity of the five oceans.',
  'We describe places with north, south, east and west, including northern and southern parts of continents and oceans.'
 ],
 base:[
  {id:'greenland',x:40.4,y:10.2,regions:['greenland','north-america'],cues:[['on Greenland','greenland'],['on the island northeast of North America','greenland']]},
  {id:'north-america',x:22.5,y:28,regions:['north-america'],cues:[['in North America','north-america'],['on the continent north of South America','north-america']]},
  {id:'north-america-north',x:21.3,y:15,regions:['north-america','north-america-north'],cues:[['in northern North America','north-america-north']]},
  {id:'north-america-south',x:24,y:39,regions:['north-america','north-america-south'],cues:[['in southern North America','north-america-south']]},
  {id:'south-america',x:29,y:60,regions:['south-america'],cues:[['in South America','south-america'],['on the continent south of North America','south-america']]},
  {id:'south-america-south',x:28,y:75,regions:['south-america','south-america-south'],cues:[['in southern South America','south-america-south']]},
  {id:'europe',x:44,y:26,regions:['europe','eurasia'],cues:[['in Europe','europe'],['in the western part of Eurasia','europe']]},
  {id:'asia',x:68,y:29,regions:['asia','eurasia'],cues:[['in Asia','asia'],['on the largest continent','asia']]},
  {id:'asia-north',x:70,y:12,regions:['asia','asia-north','eurasia'],cues:[['in northern Asia','asia-north']]},
  {id:'asia-south',x:68,y:41,regions:['asia','asia-south','eurasia'],cues:[['in southern Asia','asia-south']]},
  {id:'africa',x:43.7,y:49,regions:['africa'],cues:[['in Africa','africa'],['on the hottest continent','africa']]},
  {id:'africa-south',x:50,y:66,regions:['africa','africa-south'],cues:[['in southern Africa','africa-south']]},
  {id:'australia',x:80,y:67,regions:['australia'],cues:[['in Australia','australia'],['on the smallest continent','australia']]},
  {id:'antarctica',x:62,y:92,regions:['antarctica'],cues:[['in Antarctica','antarctica'],['on the coldest continent','antarctica']]},
  {id:'arctic-ocean',x:54,y:6.8,regions:['arctic-ocean'],cues:[['in the Arctic Ocean','arctic-ocean'],['in the smallest ocean','arctic-ocean']]},
  {id:'southern-ocean',x:59,y:83,regions:['southern-ocean'],cues:[['in the Southern Ocean','southern-ocean'],['in the coldest ocean','southern-ocean']]},
  {id:'indian-ocean',x:65,y:57,regions:['indian-ocean'],cues:[['in the Indian Ocean','indian-ocean'],['in the warmest ocean','indian-ocean']]},
  {id:'atlantic-north',x:35,y:28,regions:['atlantic-ocean','atlantic-north'],cues:[['in the northern Atlantic Ocean','atlantic-north']]},
  {id:'atlantic-south',x:36,y:68,regions:['atlantic-ocean','atlantic-south'],cues:[['in the southern Atlantic Ocean','atlantic-south']]},
  {id:'atlantic-central',x:36,y:46,regions:['atlantic-ocean'],cues:[['in the Atlantic Ocean','atlantic-ocean'],['in the ocean between the Americas and Africa','atlantic-ocean']]},
  {id:'pacific-north',x:10,y:26,regions:['pacific-ocean','pacific-north'],cues:[['in the northern Pacific Ocean','pacific-north']]},
  {id:'pacific-west',x:89,y:37,regions:['pacific-ocean','pacific-west'],cues:[['in the western Pacific Ocean','pacific-west']]},
  {id:'pacific-south',x:11,y:68,regions:['pacific-ocean','pacific-south'],cues:[['in the southern Pacific Ocean','pacific-south']]},
  {id:'pacific-central',x:6,y:49,regions:['pacific-ocean'],cues:[['in the Pacific Ocean','pacific-ocean'],['in the largest ocean','pacific-ocean']]},
  {id:'mediterranean',x:52,y:33,regions:['mediterranean'],cues:[['in the Mediterranean Sea','mediterranean'],['in the sea between Africa and Europe','mediterranean']]}
 ],
 rivers:{
  nile:[
   {id:'nile-north',x:41,y:36,pointsTo:{x:49.1,y:37.6},sitsIn:['atlantic-ocean','atlantic-north'],regions:['africa','nile','nile-north'],cues:[['near the Nile delta by the Mediterranean Sea','nile-north']]},
   {id:'nile-middle',x:56,y:42,pointsTo:{x:49.5,y:43.6},sitsIn:['asia','eurasia'],regions:['africa','nile','nile-middle'],cues:[['beside the middle stretch of the Nile shown on the map','nile-middle']]},
   {id:'nile-south',x:41,y:59,pointsTo:{x:49.5,y:50},sitsIn:['atlantic-ocean','atlantic-south'],regions:['africa','nile','nile-south'],cues:[['by the southern end of the Nile shown on the map','nile-south']]}
  ],
  amazon:[
   {id:'amazon-west',x:17,y:48,pointsTo:{x:21.5,y:54.5},sitsIn:['pacific-ocean','pacific-central'],regions:['south-america','amazon','amazon-west'],cues:[['near the western end of the Amazon shown on the map','amazon-west']]},
   {id:'amazon-middle',x:17,y:65,pointsTo:{x:24.9,y:54.3},sitsIn:['pacific-ocean','pacific-south'],regions:['south-america','amazon','amazon-middle'],cues:[['beside the central section of the Amazon on the map','amazon-middle']]},
   {id:'amazon-mouth',x:38,y:67,pointsTo:{x:28.15,y:54.0},sitsIn:['atlantic-ocean','atlantic-south'],regions:['south-america','amazon','amazon-mouth'],cues:[['where the Amazon reaches the Atlantic coast','amazon-mouth']]}
  ],
  mississippi:[
   {id:'mississippi-north',x:11,y:18,pointsTo:{x:20,y:24},sitsIn:['pacific-ocean','pacific-north'],regions:['north-america','mississippi','mississippi-north'],cues:[['near the northern end of the Mississippi shown on the map','mississippi-north']]},
   {id:'mississippi-middle',x:32,y:18,pointsTo:{x:20,y:31},sitsIn:['atlantic-ocean','atlantic-north'],regions:['north-america','mississippi','mississippi-middle'],cues:[['near the middle section of the Mississippi on the map','mississippi-middle']]},
   {id:'mississippi-south',x:11,y:42,pointsTo:{x:18.6,y:34.5},sitsIn:['pacific-ocean','pacific-central'],regions:['north-america','mississippi','mississippi-south'],cues:[['near the southern end of the Mississippi toward the Gulf of Mexico','mississippi-south']]}
  ]
 }
};
