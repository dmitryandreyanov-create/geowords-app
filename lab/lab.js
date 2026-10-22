/* GeoWords map lab: manual tap-testing of the approved map content (data/maps/*.json).
   Not part of the lesson flow; every tap in quiz mode goes to a copyable log. */
(()=>{
const $=id=>document.getElementById(id);
const TOL=22, EXACT=6, LOG_KEY='geowords_lab_log_v1';
const SETS=[
  {id:'rivers',title:'Реки',file:'world-rivers.json',list:'rivers',kind:'layer'},
  {id:'mountains',title:'Горы',file:'world-mountains.json',list:'mountains',kind:'layer'},
  {id:'waters',title:'Моря и заливы',file:'world-waters.json',list:'waters',kind:'area'},
  {id:'straits',title:'Проливы и каналы',file:'world-straits.json',list:'items',kind:'area'},
  {id:'europe',title:'Европа: столицы',file:'europe-capitals.json',list:'capitals',kind:'point'},
];
const src=p=>'../'+String(p).replace(/^\.\//,'');
const ru=o=>typeof o.name==='string'?o.name:(o.name.ru||o.name.en);
const data={}, alpha={};
let set=SETS[0], mode='quiz', target=null, zoom=1, log=[];
try{log=JSON.parse(localStorage.getItem(LOG_KEY)||'[]')}catch(e){log=[]}
const saveLog=()=>{try{localStorage.setItem(LOG_KEY,JSON.stringify(log.slice(-400)))}catch(e){}};

const map=$('map'), base=$('base'), layers=$('layers'), zones=$('zones'), pins=$('pins');

function items(){
  const d=data[set.id]; if(!d)return [];
  const all=d[set.list];
  if(set.kind!=='layer')return all;
  const step=+$('step').value;
  return all.filter(i=>i.order<=step);
}

/* ---------- geometry ---------- */
const rect=el=>el.getBoundingClientRect();
function toPct(e,el){const r=rect(el);return {x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100,w:r.width,h:r.height}}
function inPoly(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>p.y)!==(yj>p.y))&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)c=!c}return c}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-t*dx,py-ay-t*dy)}
// distance in screen px from tap to an area (0 inside)
function areaDist(p,area){
  let best=Infinity;
  for(const poly of area){
    if(inPoly(p,poly))return 0;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[j],b=poly[i];
      best=Math.min(best,segDist(p.x*p.w/100,p.y*p.h/100,a[0]*p.w/100,a[1]*p.h/100,b[0]*p.w/100,b[1]*p.h/100));
    }
  }
  return best;
}
const labelDist=(p,l)=>Math.hypot((p.x-l.x)*p.w/100,(p.y-l.y)*p.h/100);
function pickArea(p,list,areaOf,labelOf){
  const tol=$('tolerance').checked?TOL:0;
  const c=list.map(i=>({i,d:areaDist(p,areaOf(i)),l:labelDist(p,labelOf(i))})).filter(c=>c.d<=tol);
  if(!c.length)return null;
  const inside=c.filter(c=>c.d===0), pool=inside.length?inside:c;
  pool.sort((a,b)=>inside.length?a.l-b.l:(a.d-b.d||a.l-b.l));
  return {item:pool[0].i,dist:Math.round(pool[0].d)};
}

/* ---------- layer alpha sampling for rivers / mountains ---------- */
const SAMPLE_W=1100;
function loadAlpha(item){
  const key=item.layer.png;
  if(alpha[key])return alpha[key];
  return alpha[key]=new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      const w=SAMPLE_W,h=Math.round(img.naturalHeight*w/img.naturalWidth);
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,w,h);
      let px=null;try{px=g.getImageData(0,0,w,h).data}catch(e){}
      res({w,h,px});
    };
    img.onerror=()=>res({w:1,h:1,px:null});
    img.src=src(key);
  });
}
async function pickLayer(p){
  const tol=$('tolerance').checked?TOL:EXACT;
  let best=null;
  for(const item of items()){
    const a=await loadAlpha(item); if(!a.px)continue;
    const sx=a.w/p.w, cx=p.x/100*a.w, cy=p.y/100*a.h, r=Math.ceil(tol*sx);
    for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(a.h-1,cy+r);y++){
      for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(a.w-1,cx+r);x++){
        if(a.px[(y*a.w+x)*4+3]<40)continue;
        const d=Math.hypot(x-cx,y-cy)/sx;
        if(d<=tol&&(!best||d<best.dist))best={item,dist:d};
      }
    }
  }
  if(best)best.dist=Math.round(best.dist);
  return best;
}
function pickPoint(p){
  const tol=$('tolerance').checked?TOL:EXACT;
  let best=null;
  for(const item of items()){const d=labelDist(p,item);if(d<=tol&&(!best||d<best.dist))best={item,dist:Math.round(d)}}
  return best;
}

/* ---------- rendering ---------- */
function setAspect(el,img){
  const apply=()=>{if(img.naturalWidth)el.style.setProperty('--aspect',`${img.naturalWidth} / ${img.naturalHeight}`)};
  img.complete?apply():img.addEventListener('load',apply,{once:true});
}
function polySvg(svg,area,id){
  return area.map(poly=>`<polygon data-id="${id}" points="${poly.map(p=>p.join(',')).join(' ')}"/>`).join('');
}
function pin(x,y,name,ring){
  return `<div class="pin" style="left:${x}%;top:${y}%"><div class="dot"></div>${ring?'<div class="ring" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)"></div>':''}<div class="tag">${name}</div></div>`;
}
function render(prev){
  const d=data[set.id];
  const baseSrc=set.id==='europe'?$('euroBase').value:d.map;
  if(base.dataset.src!==baseSrc){base.dataset.src=baseSrc;base.src=src(baseSrc);setAspect(map,base)}
  map.classList.toggle('browse',mode==='browse');
  const list=items();
  // layers
  const want=set.kind==='layer'?list:set.id==='straits'?d.items.filter(i=>i.layer):[];
  const have=new Map([...layers.children].map(el=>[el.dataset.id,el]));
  for(const [id,el] of have)if(!want.some(i=>i.id===id))el.remove();
  for(const i of want)if(!have.has(i.id)){
    const im=new Image();im.src=src(i.layer.png||i.layer.webp);im.alt='';im.dataset.id=i.id;
    if(prev!==undefined&&i.order>prev)im.className='new';
    layers.appendChild(im);
  }
  // zones and pins
  let z='',pn='';
  if(set.kind==='area'){
    for(const i of list){z+=polySvg(zones,i.tapArea,i.id);pn+=pin(i.label.x,i.label.y,ru(i),true)}
    if(set.id==='straits')for(const [id,ins] of Object.entries(d.insets))for(const m of ins.magnifier)
      pn+=`<button type="button" class="magnifier" data-inset="${id}" style="left:${m.x}%;top:${m.y}%" aria-label="Открыть врезку">🔍</button>`;
  }else if(set.kind==='point'){
    for(const i of list)pn+=pin(i.x,i.y,i.name,true);
  }else{
    for(const i of list){const b=i.bbox;pn+=`<div class="pin" style="left:${(b[0]+b[2])/2}%;top:${(b[1]+b[3])/2}%"><div class="tag">${ru(i)}</div></div>`}
  }
  zones.innerHTML=z;pins.innerHTML=pn;
  pins.querySelectorAll('.magnifier').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openInset(b.dataset.inset)}));
}
function newTarget(){
  const list=items();
  if(!list.length){target=null;return}
  let pool=list.filter(i=>i!==target);
  if(set.kind==='layer'){const latest=list.filter(i=>i.order===+$('step').value&&i!==target);if(latest.length&&Math.random()<.5)pool=latest}
  target=(pool.length?pool:list)[Math.floor(Math.random()*(pool.length||list.length))];
}
function showTask(){
  if(mode==='browse'){$('task').textContent='Нажимайте на карту — покажу, что попало под палец.';return}
  $('task').textContent=target?`Найди: ${ru(target)}`+(target.inset?' (через лупу 🔍)':''):'Нет объектов';
}
function result(ok,text){const r=$('result');r.className='result '+(ok?'ok':'bad');r.textContent=text}
function mark(container,p,ok){
  const m=document.createElement('div');m.className='tap-mark '+(ok?'ok':'bad');
  m.style.left=p.x+'%';m.style.top=p.y+'%';container.appendChild(m);setTimeout(()=>m.remove(),1500);
}
function flashTarget(){
  if(set.kind!=='layer'||!target)return;
  const el=[...layers.children].find(x=>x.dataset.id===target.id);
  if(el){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}
}

/* ---------- taps ---------- */
function record(hit,p,where){
  const ok=!!hit&&hit.item===target;
  const entry={t:new Date().toISOString().slice(11,19),set:set.title,target:target?ru(target):'—',hit:hit?ru(hit.item):'мимо',ok,dist:hit?hit.dist:null,
    where,zoom:Math.round(zoom*100),tol:$('tolerance').checked,mapW:Math.round(p.w),x:+p.x.toFixed(2),y:+p.y.toFixed(2)};
  log.push(entry);saveLog();renderLog();
  return ok;
}
async function onMapTap(e){
  if(e.target.closest('.magnifier'))return;
  const p=toPct(e,map);
  let hit=null;
  if(set.kind==='layer')hit=await pickLayer(p);
  else if(set.kind==='point')hit=pickPoint(p);
  else hit=pickArea(p,items().filter(i=>!i.inset),i=>i.tapArea,i=>i.label)||insetHint(p);
  if(mode==='browse'){
    mark(map,p,!!hit);
    result(!!hit,hit?(hit.inset?`${hit.inset} — отвечается во врезке 🔍`:`${ru(hit.item)} · ${hit.dist} px от зоны`):'Ничего не задето');
    return;
  }
  if(hit&&hit.inset){result(false,'Этот пролив отвечается во врезке — нажмите лупу 🔍');mark(map,p,false);return}
  const ok=record(hit,p,'карта');
  mark(map,p,ok);
  answer(ok,hit);
}
// taps on the world tapArea of an inset-only strait point the tester to the magnifier
function insetHint(p){
  const list=items().filter(i=>i.inset);
  const h=pickArea(p,list,i=>i.tapArea,i=>i.label);
  return h?{inset:ru(h.item),item:h.item,dist:h.dist}:null;
}
function answer(ok,hit){
  if(ok){result(true,`✓ ${ru(target)}`+(hit.dist?` (допуск ${hit.dist} px)`:''));newTarget();showTask()}
  else{result(false,hit?`✗ Это ${ru(hit.item)}`:'✗ Мимо');flashTarget()}
}

/* ---------- inset dialog ---------- */
let insetId=null;
function openInset(id){
  const ins=data.straits.insets[id];insetId=id;
  $('result').className='result';$('result').textContent='Врезка открыта — нажмите на пролив';
  const img=$('insetImg');img.src=src(ins.image);setAspect($('insetMap'),img);
  const list=data.straits.items.filter(i=>i.inset&&i.inset.id===id);
  $('insetTitle').textContent=list.map(ru).join(' · ');
  $('insetZones').innerHTML=list.map(i=>polySvg(null,i.inset.tapArea,i.id)).join('');
  $('insetPins').innerHTML=list.map(i=>pin(i.inset.label.x,i.inset.label.y,ru(i),true)).join('');
  $('insetMap').classList.toggle('show-zones',$('showZones').checked);
  $('insetMap').classList.toggle('browse',mode==='browse');
  $('insetDlg').hidden=false;$('insetClose').focus();
}
function closeInset(){$('insetDlg').hidden=true;insetId=null}
$('insetClose').addEventListener('click',closeInset);
$('insetDlg').addEventListener('click',e=>{if(e.target===$('insetDlg'))closeInset()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('insetDlg').hidden)closeInset()});
$('insetMap').addEventListener('click',e=>{
  const p=toPct(e,$('insetMap'));
  const list=data.straits.items.filter(i=>i.inset&&i.inset.id===insetId);
  const hit=pickArea(p,list,i=>i.inset.tapArea,i=>i.inset.label);
  if(mode==='browse'){mark($('insetMap'),p,!!hit);result(!!hit,hit?`${ru(hit.item)} · ${hit.dist} px от зоны`:'Ничего не задето');return}
  const ok=record(hit,p,'врезка');
  mark($('insetMap'),p,ok);
  answer(ok,hit);
  if(ok)setTimeout(closeInset,600);
});

/* ---------- log ---------- */
function renderLog(){
  const n=log.length,ok=log.filter(l=>l.ok).length;
  $('stats').textContent=n?`Нажатий: ${n} · верно: ${ok} · ошибок: ${n-ok}`:'Пока нет нажатий';
  $('log').innerHTML=log.slice(-60).reverse().map(l=>`<li class="${l.ok?'ok':'bad'}">${l.t} · ${l.set} · цель: ${l.target} → ${l.hit}${l.dist!=null?` (${l.dist} px)`:''} · ${l.where} · ${l.zoom}%</li>`).join('');
}
function report(){
  const lines=[`GeoWords map lab report · ${new Date().toISOString()}`,`UA: ${navigator.userAgent}`,`Screen: ${screen.width}×${screen.height} @${devicePixelRatio}x`,''];
  for(const l of log)lines.push([l.t,l.set,l.target,'→',l.hit,l.ok?'OK':'MISS',l.dist!=null?l.dist+'px':'',l.where,'zoom '+l.zoom+'%','tol '+(l.tol?'on':'off'),`map ${l.mapW}px`,`@${l.x},${l.y}`].join(' | '));
  return lines.join('\n');
}
$('copy').addEventListener('click',async()=>{
  const text=report(),ta=$('reportText');
  try{await navigator.clipboard.writeText(text);$('copy').textContent='Скопировано ✓'}
  catch(e){ta.hidden=false;ta.value=text;ta.select();$('copy').textContent='Выделите и скопируйте текст ниже'}
  setTimeout(()=>{$('copy').textContent='Скопировать отчёт'},2500);
});
$('clear').addEventListener('click',()=>{if(!log.length||confirm('Очистить журнал?')){log=[];saveLog();renderLog();$('reportText').hidden=true}});

/* ---------- controls ---------- */
function setZoom(z){
  zoom=Math.max(1,Math.min(3,z));
  map.style.width=zoom*100+'%';
  $('zVal').textContent=Math.round(zoom*100)+'%';
}
$('zIn').addEventListener('click',()=>setZoom(zoom+.5));
$('zOut').addEventListener('click',()=>setZoom(zoom-.5));
$('showZones').addEventListener('change',()=>map.classList.toggle('show-zones',$('showZones').checked));
function setMode(m){
  mode=m;
  $('modeQuiz').classList.toggle('on',m==='quiz');$('modeQuiz').setAttribute('aria-pressed',m==='quiz');
  $('modeBrowse').classList.toggle('on',m==='browse');$('modeBrowse').setAttribute('aria-pressed',m==='browse');
  $('result').textContent='';render();showTask();
}
$('modeQuiz').addEventListener('click',()=>setMode('quiz'));
$('modeBrowse').addEventListener('click',()=>setMode('browse'));
$('step').addEventListener('input',()=>{
  const prev=+$('step').dataset.prev||0, now=+$('step').value;
  $('step').dataset.prev=now;
  const all=data[set.id][set.list];
  $('stepVal').textContent=`${now} / ${all.length} · новый: ${ru(all.find(i=>i.order===now))}`;
  render(prev);
  if(!target||target.order>now)newTarget();
  showTask();
});
$('euroBase').addEventListener('change',()=>render());

function selectSet(s){
  set=s;target=null;
  [...$('tabs').children].forEach(b=>{const on=b.dataset.id===s.id;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  layers.innerHTML='';
  const d=data[s.id];
  $('stepRow').hidden=s.kind!=='layer';
  $('baseRow').hidden=s.id!=='europe';
  if(s.kind==='layer'){
    const n=d[s.list].length;
    $('step').max=n;$('step').value=n;$('step').dataset.prev=n;
    $('stepVal').textContent=`${n} / ${n}`;
  }
  if(s.id==='europe'){
    $('euroBase').innerHTML=[d.map,...(d.alsoValidFor||[])].map(m=>`<option value="${m}">${m.replace(/^.*europe-|\.webp$/g,'')}</option>`).join('');
  }
  $('result').textContent='';
  render();newTarget();showTask();
  try{localStorage.setItem('geowords_lab_tab',s.id)}catch(e){}
}

map.addEventListener('click',onMapTap);

Promise.all(SETS.map(s=>fetch('../data/maps/'+s.file).then(r=>{if(!r.ok)throw new Error(s.file+' '+r.status);return r.json()}).then(j=>{data[s.id]=j})))
  .then(()=>{
    $('tabs').innerHTML=SETS.map(s=>`<button type="button" data-id="${s.id}" aria-pressed="false">${s.title} <small>${data[s.id][s.list].length}</small></button>`).join('');
    [...$('tabs').children].forEach(b=>b.addEventListener('click',()=>selectSet(SETS.find(s=>s.id===b.dataset.id))));
    let start=SETS[0];try{start=SETS.find(s=>s.id===localStorage.getItem('geowords_lab_tab'))||start}catch(e){}
    selectSet(start);renderLog();
  })
  .catch(err=>{$('task').textContent='Не удалось загрузить данные карт: '+err.message});
})();
