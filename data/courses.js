/* Rivers pilot follows the first 3 authored PDF puzzles (CHANNEL, FLOODPLAIN, RAINFOREST).
   Puzzle 1 introduces Nile facts, puzzle 2 introduces Amazon facts, puzzle 3
   introduces Mississippi facts; each is followed by six distinct practice words.
   Generated-map artwork is provisional pending v0.6 authored-map calibration. */
window.GEOWORD_COURSES={
  rivers:{
    id:"rivers",title:"Rivers",target:7,
    map:"./assets/world-rivers-base.svg",mapAspect:"1200 / 680",
    mapBounds:{west:-180,east:180,south:-67,north:83},
    anchors:[
      {id:"north-america",label:"North America",lon:-111,lat:45,text:"Find the letter in North America."},
      {id:"south-america",label:"South America",lon:-65,lat:-23,text:"Find the letter in South America."},
      {id:"europe",label:"Europe",lon:15,lat:54,text:"Find the letter in Europe."},
      {id:"asia",label:"Asia",lon:90,lat:49,text:"Find the letter in Asia."},
      {id:"africa",label:"Africa",lon:15,lat:3,text:"Find the letter in Africa."},
      {id:"australia",label:"Australia",lon:135,lat:-25,text:"Find the letter in Australia."},
      {id:"atlantic-ocean",label:"Atlantic Ocean",lon:-30,lat:8,text:"Find the letter in the Atlantic Ocean."},
      {id:"south-atlantic",label:"South Atlantic Ocean",lon:-19,lat:-40,text:"Find the letter in the South Atlantic Ocean."},
      {id:"indian-ocean",label:"Indian Ocean",lon:78,lat:-29,text:"Find the letter in the Indian Ocean."},
      {id:"pacific-ocean",label:"Pacific Ocean",lon:-146,lat:7,text:"Find the letter in the Pacific Ocean."},
      {id:"south-pacific",label:"South Pacific Ocean",lon:-134,lat:-38,text:"Find the letter in the South Pacific Ocean."},
      {id:"west-pacific",label:"Western Pacific",lon:157,lat:13,text:"Find the letter in the western Pacific Ocean."},
      {id:"arctic-ocean",label:"Arctic Ocean",lon:-5,lat:74,text:"Find the letter in the Arctic Ocean."},
      {id:"northern-pacific",label:"North Pacific",lon:-169,lat:45,text:"Find the letter in the North Pacific Ocean."},
      {id:"southern-ocean",label:"Southern Ocean",lon:58,lat:-60,text:"Find the letter in the Southern Ocean."}
    ],
    steps:[
      {id:"nile",authoredPuzzleId:"rivers-authored-01",wordIds:["delta","basin","source","mouth","stream","sediment"],
       object:{id:"nile",label:"Nile River",clue:"Find the letter beside the Nile River.",
        anchor:{lon:31,lat:18},
        facts:["The Nile flows north through northeastern Africa.","It empties into the Mediterranean Sea.","Find its course on the map, then practise seven geography words."],
        path:[[31.8,-1.0],[32.6,3.7],[31.6,9.2],[32.1,14.2],[30.9,20.5],[31.8,26.2],[31.3,31.4]]}},
      {id:"amazon",authoredPuzzleId:"rivers-authored-02",wordIds:["erosion","rapids","valley","current","flood","meander"],
       object:{id:"amazon",label:"Amazon River",clue:"Find the letter beside the Amazon River.",
        anchor:{lon:-60.3,lat:-4.1},
        facts:["The Amazon flows across northern South America.","It carries an enormous volume of water to the Atlantic Ocean.","The Nile remains on your map; now you will practise with both rivers."],
        path:[[-74.7,-4.4],[-70.5,-4.3],[-66,-3.8],[-62,-3.5],[-58,-3.0],[-54,-2.3],[-50.2,-1.5]]}},
      {id:"mississippi",authoredPuzzleId:"rivers-authored-03",wordIds:["estuary","tributary","waterfall","wetland","drainage","reservoir"],
       object:{id:"mississippi",label:"Mississippi River",clue:"Find the letter beside the Mississippi River.",
        anchor:{lon:-91.4,lat:37.2},
        facts:["The Mississippi River is one of the longest rivers in North America.","It flows south through North America into the Gulf of Mexico.","The Nile and Amazon remain visible alongside the Mississippi."],
        path:[[-95,47.2],[-93.3,45],[-92.1,43],[-90.7,39],[-90.3,35],[-91.4,30.9],[-89.3,29.1]]}}
    ]
  }
};