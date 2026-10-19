const tc=require(process.argv[2]+'/topojson-client-3.1.0/package/dist/topojson-client.js');
const topo=require(process.argv[2]+'/world-atlas-2.0.2/package/land-50m.json');
const fc=tc.feature(topo,topo.objects.land);
const polys=[];
for(const f of fc.features){const g=f.geometry;const ps=g.type==='Polygon'?[g.coordinates]:g.coordinates;
 for(const p of ps){const rings=[];for(const r0 of p){
  if(r0.every(([x,y])=>y<-89.5)) continue;
  const r=[];let sh=0;r0.forEach(([x,y],i)=>{if(i){const d=x+sh-r[i-1][0];if(d>180)sh-=360;else if(d<-180)sh+=360;}r.push([x+sh,y]);});
  const a=r[0],b=r[r.length-1];if(Math.abs(b[0]-a[0])>180){r.push([b[0],-90],[a[0],-90]);console.log('wrap closed',r.length);}
  rings.push(r.map(([x,y])=>[+x.toFixed(2),+y.toFixed(2)]));}
 if(rings.length)polys.push(rings);}}
require('fs').writeFileSync(process.argv[3],'window.LAND='+JSON.stringify(polys)+';');
console.log(polys.length);
