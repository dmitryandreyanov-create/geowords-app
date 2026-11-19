/* Block 5 «South America», section 1 «South America on the map» at iPhone width: plays every lesson with right answers on the South America base map
   (a tap in the frame of the far south opens the large map first, and the answer is tapped there), then the unit practice and the finals
   with the draft words and puzzles treated as approved in memory (the data files on disk are never changed).
   SHOTS=<dir> also saves screenshots of sample tasks and of the finals for the author. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd(),shots=process.env.SHOTS;
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(u.pathname),resolved=path.resolve(root,'.'+pathname),file=pathname.endsWith('/')?path.join(resolved,'index.html'):resolved;
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.setHeader('content-type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const ok=v=>{if(v&&typeof v==='object'){if(v.approval?.status==='draft')v.approval={status:'approved',by:'test',date:'2026-11-19'};for(const k of Object.keys(v))ok(v[k])}return v};
const approvedCopy=f=>JSON.stringify(ok(JSON.parse(fs.readFileSync(f,'utf8'))));
const sMap=JSON.parse(fs.readFileSync('data/maps/samerica-overview.json','utf8')),sFacts=JSON.parse(fs.readFileSync('data/content/b5-section-1-facts.json','utf8'));
const SO=JSON.parse(fs.readFileSync('data/maps/samerica-south.json','utf8')),SF=SO.frame,inSo=pt=>pt.x>=SF.x&&pt.x<=SF.x+SF.w&&pt.y>=SF.y&&pt.y<=SF.y+SF.h;
const lab=Object.fromEntries(sMap.items.map(i=>[i.id,i.label])),unitOf=Object.fromEntries(sMap.items.map(i=>[i.id,i.unit])),factOf=id=>sFacts.items.find(i=>i.id===id);
const IN={'sa-caribbean-sea':['sa-atlantic-ocean'],'sa-galapagos':['sa-pacific-ocean'],'sa-falklands':['sa-atlantic-ocean'],'sa-strait-of-magellan':['sa-tierra-del-fuego']};
const MAP='assets/samerica-blank.webp';
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
  for(const lang of ['ru','en']){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/dictionary/b5-section-1.json','data/geowords/b5-section-1.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="sa1-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Южная Америка на карте/:/South America on the map/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    let soShots=0;
    const tapSo=async(pt,name)=>{await tapAt(pt);if(!inSo(pt))return;assert.equal(await page.locator('.task .fb.ok,.task .fb.bad').count(),0,'a tap in the far south frame is not judged');
      await page.locator('.task .lv-pop').waitFor();if(soShots<3){soShots++;await page.waitForTimeout(300);await shot('south-'+name)}
      const box=await page.locator('.task .lv-pop').boundingBox();await page.mouse.click(box.x+box.width*(pt.x-SF.x)/SF.w,box.y+box.height*(pt.y-SF.y)/SF.h)};
    const lessons=['sa1-u1-l1','sa1-u1-l2','sa1-u1-l3','sa1-u2-l1','sa1-u2-l2','sa1-u3-l1','sa1-u3-l2','sa1-u3-l3','sa1-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith(MAP),'South America base map: '+src);
        const special=q.k==='introEu'&&['sa-falklands','sa-cape-horn','sa-equator'].includes(q.id);
        if(!shotKinds.has(q.k)||special){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k+(special?'-'+q.id:''))}
        if(q.k==='introEurope'){await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu'){const f=factOf(q.id);assert.equal(await page.locator('.task .card p').first().innerText(),f.fact[lang]);
            assert.equal(await page.locator('.task .nuance').count(),f.caveat?1:0,'«Есть нюанс» on '+q.id)}
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in unitOf,'a place of section 1: '+q.id);await tapSo(lab[q.id],q.id);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,id+': a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o.startsWith('sa-')),'South America options only');
          const taught=await page.evaluate(()=>window.__gwTaught);assert(opts.every(o=>taught.includes(o)),`${id}: options only from taught lessons: ${opts}`);
          assert.equal(await page.locator('.task .lv-pop:not([hidden])').count(),SO.objects.includes(q.id)?1:0,'large map of the far south open on '+q.id);
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="sa1-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    // nested places: a tap in the Caribbean counts for the Atlantic; a tap on the Galápagos is the Galápagos
    const judged=await page.evaluate(([c,g])=>{window.__gwEuSec(30);const sz={W:390,H:284};
      return [window.__gwEuOk('sa-atlantic-ocean',c.x,c.y,sz),window.__gwEuHit(g.x,g.y,sz)]},[lab['sa-caribbean-sea'],lab['sa-galapagos']]);
    assert.deepEqual(judged,[true,'sa-galapagos']);
    for(const u of [1,2,3]){await page.locator(`[data-step="sa1-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(MAP),'practice on the South America map');
        for(const m of p.markers){assert(unitOf[m.id]<=u,`${p.answer}: ${m.id} is learned by unit ${u}`);assert(!p.markers.some(q=>(IN[m.id]||[]).includes(q.id)),`${p.answer}: ${m.id} with its container`)}
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="sa1-u1-l1"]')}
    const sGeo=JSON.parse(fs.readFileSync('data/geowords/b5-section-1.json','utf8')).puzzles;
    for(const [step,id] of [['sa1-u1-final','unit-1'],['sa1-u2-final','unit-2'],['sa1-u3-final','unit-3'],['sa1-final','final']]){
      const want=sGeo.find(p=>p.id===`b5-section-1-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(MAP),'final on the South America map');
      await page.waitForTimeout(300);assert.equal(await page.locator('.gw .mk:not([hidden])').count(),p.markers.length,want.id+': every letter in view');
      for(const c of want.clues)assert.equal(want.markers.find(m=>m.id===c.markerId).letter,[...want.answer][c.position-1],want.id+': clue '+c.position);
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.waitForSelector('.screen.done');await shot('done-'+id);
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="sa1-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  console.log('PASS: South America section 1 plays in RU and EN on the South America map.');
}finally{await browser?.close();server.close()}
