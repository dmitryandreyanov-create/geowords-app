/* Rivers pilot: one new named river per learning step; previously introduced
   rivers remain visible. Coordinates use lon/lat and an equirectangular map. */
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
      {id:"greenland",label:"Greenland",lon:-41,lat:70,text:"Find the letter on Greenland."},
      {id:"madagascar",label:"Madagascar",lon:48,lat:-20,text:"Find the letter on Madagascar."},
      {id:"southern-africa",label:"Southern Africa",lon:21,lat:-28,text:"Find the letter in southern Africa."},
      {id:"central-asia",label:"Central Asia",lon:66,lat:42,text:"Find the letter in central Asia."},
      {id:"east-asia",label:"Eastern Asia",lon:127,lat:47,text:"Find the letter in eastern Asia."},
      {id:"northern-pacific",label:"North Pacific",lon:-169,lat:45,text:"Find the letter in the North Pacific Ocean."},
      {id:"southern-ocean",label:"Southern Ocean",lon:58,lat:-60,text:"Find the letter in the Southern Ocean."}
    ],
    steps:[
      {id:"nile",wordIds:["river","delta","basin","source","mouth","stream","channel"],
       object:{id:"nile",label:"Nile River",clue:"Find the letter beside the Nile River.",
        anchor:{lon:31,lat:18},
        facts:["The Nile flows north through northeastern Africa.","It empties into the Mediterranean Sea.","Find its course on the map, then practise seven geography words."],
        path:[[31.8,-1.0],[32.6,3.7],[31.6,9.2],[32.1,14.2],[30.9,20.5],[31.8,26.2],[31.3,31.4]]}},
      {id:"amazon",wordIds:["erosion","rapids","valley","current","flood","meander","sediment"],
       object:{id:"amazon",label:"Amazon River",clue:"Find the letter beside the Amazon River.",
        anchor:{lon:-60.3,lat:-4.1},
        facts:["The Amazon flows across northern South America.","It carries an enormous volume of water to the Atlantic Ocean.","The Nile remains on your map; now you will practise with both rivers."],
        path:[[-74.7,-4.4],[-70.5,-4.3],[-66,-3.8],[-62,-3.5],[-58,-3.0],[-54,-2.3],[-50.2,-1.5]]}},
      {id:"yangtze",wordIds:["estuary","bank","tributary","waterfall","wetland","drainage","reservoir"],
       object:{id:"yangtze",label:"Yangtze River",clue:"Find the letter beside the Yangtze River.",
        anchor:{lon:112,lat:30.2},
        facts:["The Yangtze flows across China from west to east.","It empties into the East China Sea.","All three rivers remain on the map for this step."],
        path:[[91.9,33.6],[98,32.2],[102.5,29],[108.2,29.6],[113,30.3],[117.9,30.6],[121.9,31.4]]}}
    ]
  }
};