/* Block 3 «Asia», sections 1 «Asia on the map», 2 «Rivers of Asia», 3 «Lakes of Asia», 4 «Mountains of Asia», 5 «Deserts of Asia» and 6 «Countries and capitals: East and Southeast Asia» at iPhone width: plays every lesson with right answers on the Asia base map
   (section 2: on the Asia rivers map, section 3: on the Asia lakes map, section 4: on the Asia mountains map, section 5: on the Asia deserts map), then the unit practice and the finals with the draft facts, words and puzzles treated as approved in memory
   (the data files on disk are never changed).
   SHOTS=<dir> also saves screenshots of sample tasks and of the finals for the author. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd(),shots=process.env.SHOTS;
// SECTIONS=6 (or 1,2,…) plays only those sections
const run=n=>!process.env.SECTIONS||process.env.SECTIONS.split(',').map(Number).includes(n);
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(u.pathname),resolved=path.resolve(root,'.'+pathname),file=pathname.endsWith('/')?path.join(resolved,'index.html'):resolved;
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.setHeader('content-type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const ok=v=>{if(v&&typeof v==='object'){if(v.approval?.status==='draft')v.approval={status:'approved',by:'test',date:'2026-10-29'};for(const k of Object.keys(v))ok(v[k])}return v};
const approvedCopy=f=>JSON.stringify(ok(JSON.parse(fs.readFileSync(f,'utf8'))));
const aMap=JSON.parse(fs.readFileSync('data/maps/asia-overview.json','utf8')),aFacts=JSON.parse(fs.readFileSync('data/content/b3-section-1-facts.json','utf8'));
const rMap=JSON.parse(fs.readFileSync('data/maps/asia-rivers.json','utf8')),rFacts=JSON.parse(fs.readFileSync('data/content/b3-section-2-facts.json','utf8'));
const lMap=JSON.parse(fs.readFileSync('data/maps/asia-lakes.json','utf8')),lFacts=JSON.parse(fs.readFileSync('data/content/b3-section-3-facts.json','utf8'));
const mMap=JSON.parse(fs.readFileSync('data/maps/asia-mountains.json','utf8')),mFacts=JSON.parse(fs.readFileSync('data/content/b3-section-4-facts.json','utf8'));
const dMap=JSON.parse(fs.readFileSync('data/maps/asia-deserts.json','utf8')),dFacts=JSON.parse(fs.readFileSync('data/content/b3-section-5-facts.json','utf8'));
const lab=Object.fromEntries([...aMap.items,...rMap.items,...lMap.items,...mMap.items,...dMap.items].map(i=>[i.id,i.label])),unitOf=Object.fromEntries(aMap.items.map(i=>[i.id,i.unit]));
const rUnit=Object.fromEntries(rMap.items.map(i=>[i.id,i.unit])),factOf=id=>[...aFacts.items,...rFacts.items,...lFacts.items,...mFacts.items,...dFacts.items].find(i=>i.id===id);
const lUnit=Object.fromEntries(lMap.items.map(i=>[i.id,i.unit]));
const mUnit=Object.fromEntries(mMap.items.map(i=>[i.id,i.unit]));
const dUnit=Object.fromEntries(dMap.items.map(i=>[i.id,i.unit]));
const cMap=JSON.parse(fs.readFileSync('data/maps/asia-countries-6.json','utf8')),cFacts=JSON.parse(fs.readFileSync('data/content/b3-section-6-facts.json','utf8'));
const cUnit=Object.fromEntries(cMap.items.map(i=>[i.id,i.unit])),cOf=Object.fromEntries(cMap.items.map(i=>[i.id,i]));
const IN={'as-sea-of-japan':'as-pacific-ocean','as-sea-of-okhotsk':'as-pacific-ocean','as-south-china-sea':'as-pacific-ocean','as-persian-gulf':'as-indian-ocean',
  'as-japanese-islands':'as-pacific-ocean','as-sakhalin':'as-pacific-ocean','as-borneo':'as-pacific-ocean','as-sri-lanka':'as-indian-ocean'};
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
  for(const lang of run(1)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/dictionary/b3-section-1.json','data/geowords/b3-section-1.json','data/content/b3-section-2-facts.json','data/content/b3-section-2-records.json',
      'data/dictionary/b3-section-2.json','data/geowords/b3-section-2.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="a1-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Азия на карте/:/Asia on the map/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['a1-u1-l1','a1-u1-l2','a1-u2-l1','a1-u2-l2','a1-u2-l3','a1-u3-l1','a1-u3-l2','a1-u3-l3','a1-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<60;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-blank.webp'),'Asia base map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){assert.equal(await page.locator('.task .card h3').first().innerText(),lang==='ru'?'Азия':'Asia');await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),factOf(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o.startsWith('as-')),'Asia options only');
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else if(q.k==='allPen'){for(const it of aMap.items.filter(i=>i.kind==='peninsula'))await tapAt(it.label);
          await page.locator('.fb .btn').click();assert.equal(await page.locator('.fb.ok').count(),1,'all peninsulas found');await page.locator('.fb .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a1-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu','allPen'])assert(kinds.has(k),'task kind played: '+k);
    // nested places: inside the Sea of Japan counts for the Pacific; Sakhalin never for Kamchatka; a tap on the Bering Strait is the strait
    const judged=await page.evaluate(([j,s,b])=>{window.__gwEuSec(13);const sz={W:390,H:284};
      return [window.__gwEuOk('as-pacific-ocean',j.x,j.y,sz),window.__gwEuOk('as-kamchatka',s.x,s.y,sz),window.__gwEuHit(b.x,b.y,sz)]},[lab['as-sea-of-japan'],lab['as-sakhalin'],lab['as-bering-strait']]);
    assert.deepEqual(judged,[true,false,'as-bering-strait']);
    // unit practice: six GeoWords per unit on the Asia map, letters only on learned objects, never an object with the one containing it
    for(const u of [1,2,3]){await page.locator(`[data-step="a1-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six Asia practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-blank.webp'),'practice on the Asia map');
        for(const m of p.markers){assert(unitOf[m.id]<=u,`${p.answer}: ${m.id} is learned by unit ${u}`);assert(!p.markers.some(q=>IN[m.id]===q.id),`${p.answer}: ${m.id} with its container`)}
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="a1-u1-l1"]')}
    // finals: each plays on the Asia map exactly as drafted
    const aGeo=JSON.parse(fs.readFileSync('data/geowords/b3-section-1.json','utf8')).puzzles;
    for(const [step,id] of [['a1-u1-final','unit-1'],['a1-u2-final','unit-2'],['a1-u3-final','unit-3'],['a1-final','final']]){
      const want=aGeo.find(p=>p.id===`b3-section-1-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-blank.webp'),'final on the Asia map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a1-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 2 «Rivers of Asia»: lessons on the rivers map (a tap on the river's label point is right), practice and finals
  for(const lang of run(2)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/content/b3-section-2-facts.json','data/content/b3-section-2-records.json','data/dictionary/b3-section-2.json','data/geowords/b3-section-2.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="a2-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Реки Азии/:/Rivers of Asia/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`a2-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['a2-u1-l1','a2-u1-l2','a2-u1-l3','a2-u2-l1','a2-u2-l2','a2-u2-l3','a2-u3-l1','a2-u3-l2','a2-u3-l3','a2-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-rivers.webp'),'Asia rivers map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){assert.equal(await page.locator('.task .card h3').first().innerText(),lang==='ru'?'Реки Азии':'Rivers of Asia');await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),factOf(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in rUnit,'a river of section 2: '+q.id);await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in rUnit),'river options only');
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a2-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    // a tap on the Tigris is never the Euphrates next to it
    const judged=await page.evaluate(([t,e])=>{window.__gwEuSec(14);const sz={W:390,H:284};return [window.__gwEuOk('as-tigris',t.x,t.y,sz),window.__gwEuOk('as-euphrates',t.x,t.y,sz),window.__gwEuOk('as-euphrates',e.x,e.y,sz)]},
      [lab['as-tigris'],lab['as-euphrates']]);
    assert.deepEqual(judged,[true,false,true]);
    for(const u of [1,2,3]){await page.locator(`[data-step="a2-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-rivers.webp'),'practice on the rivers map');
        for(const m of p.markers)assert(m.id in rUnit?rUnit[m.id]<=u:m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`);
        assert(p.markers.some(m=>m.id in rUnit),p.answer+': letters on rivers');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="a2-u1-l1"]')}
    const rGeo=JSON.parse(fs.readFileSync('data/geowords/b3-section-2.json','utf8')).puzzles;
    for(const [step,id] of [['a2-u1-final','unit-1'],['a2-u2-final','unit-2'],['a2-u3-final','unit-3'],['a2-final','final']]){
      const want=rGeo.find(p=>p.id===`b3-section-2-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-rivers.webp'),'final on the rivers map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a2-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 3 «Lakes of Asia»: lessons on the lakes map (a tap on the lake's label point is right; the Dead Sea card has a zoom inset), practice and finals
  for(const lang of run(3)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/content/b3-section-3-facts.json','data/content/b3-section-3-records.json','data/dictionary/b3-section-3.json','data/geowords/b3-section-3.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="a3-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Озёра Азии/:/Lakes of Asia/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`a3-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['a3-u1-l1','a3-u1-l2','a3-u2-l1','a3-u2-l2','a3-u3-l1','a3-u3-l2','a3-u3-l3','a3-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-lakes.webp'),'Asia lakes map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){assert.equal(await page.locator('.task .card h3').first().innerText(),lang==='ru'?'Озёра Азии':'Lakes of Asia');await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),factOf(q.id).fact[lang]);
          if(q.k==='introEu')assert.equal(await page.locator('.task .zoom-inset').count(),q.id==='as-dead-sea'?1:0,'zoom inset on the Dead Sea card only: '+q.id);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in lUnit,'a lake of section 3: '+q.id);await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in lUnit),'lake options only');
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a3-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    // a tap on Lake Urmia is never Lake Van next to it
    const judged=await page.evaluate(([t,e])=>{window.__gwEuSec(15);const sz={W:390,H:284};return [window.__gwEuOk('as-urmia',t.x,t.y,sz),window.__gwEuOk('as-van',t.x,t.y,sz),window.__gwEuOk('as-van',e.x,e.y,sz)]},
      [lab['as-urmia'],lab['as-van']]);
    assert.deepEqual(judged,[true,false,true]);
    for(const u of [1,2,3]){await page.locator(`[data-step="a3-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-lakes.webp'),'practice on the lakes map');
        for(const m of p.markers)assert(m.id in lUnit?lUnit[m.id]<=u:m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`);
        assert(p.markers.some(m=>m.id in lUnit),p.answer+': letters on lakes');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="a3-u1-l1"]')}
    const lGeo=JSON.parse(fs.readFileSync('data/geowords/b3-section-3.json','utf8')).puzzles;
    for(const [step,id] of [['a3-u1-final','unit-1'],['a3-u2-final','unit-2'],['a3-u3-final','unit-3'],['a3-final','final']]){
      const want=lGeo.find(p=>p.id===`b3-section-3-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-lakes.webp'),'final on the lakes map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a3-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 4 «Mountains of Asia»: lessons on the mountains map (a tap on the label point of a range, the plateau or a volcano is right), practice and finals
  for(const lang of run(4)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/content/b3-section-4-facts.json','data/content/b3-section-4-records.json','data/dictionary/b3-section-4.json','data/geowords/b3-section-4.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="a4-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Горы Азии/:/Mountains of Asia/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`a4-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['a4-u1-l1','a4-u1-l2','a4-u1-l3','a4-u2-l1','a4-u2-l2','a4-u3-l1','a4-u3-l2','a4-u3-l3','a4-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-mountains.webp'),'Asia mountains map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){assert.equal(await page.locator('.task .card h3').first().innerText(),lang==='ru'?'Горы Азии':'Mountains of Asia');await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),factOf(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in mUnit,'a mountain of section 4: '+q.id);await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in mUnit),'mountain options only');
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a4-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    // the ranges of the mountain knot touch on the map: a tap on the Pamirs is never the Hindu Kush or the Karakoram next to it
    const judged=await page.evaluate(([t,e])=>{window.__gwEuSec(16);const sz={W:390,H:284};return [window.__gwEuOk('as-pamirs',t.x,t.y,sz),window.__gwEuOk('as-hindu-kush',t.x,t.y,sz),window.__gwEuOk('as-hindu-kush',e.x,e.y,sz)]},
      [lab['as-pamirs'],lab['as-hindu-kush']]);
    assert.deepEqual(judged,[true,false,true]);
    for(const u of [1,2,3]){await page.locator(`[data-step="a4-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-mountains.webp'),'practice on the mountains map');
        for(const m of p.markers)assert(m.id in mUnit?mUnit[m.id]<=u:m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`);
        assert(p.markers.some(m=>m.id in mUnit),p.answer+': letters on mountains');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="a4-u1-l1"]')}
    const mGeo=JSON.parse(fs.readFileSync('data/geowords/b3-section-4.json','utf8')).puzzles;
    for(const [step,id] of [['a4-u1-final','unit-1'],['a4-u2-final','unit-2'],['a4-u3-final','unit-3'],['a4-final','final']]){
      const want=mGeo.find(p=>p.id===`b3-section-4-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-mountains.webp'),'final on the mountains map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a4-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 5 «Deserts of Asia»: lessons on the deserts map (a tap on the label point of a desert is right), practice and finals
  for(const lang of run(5)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/content/b3-section-5-facts.json','data/content/b3-section-5-records.json','data/dictionary/b3-section-5.json','data/geowords/b3-section-5.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="a5-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Пустыни Азии/:/Deserts of Asia/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`a5-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['a5-u1-l1','a5-u1-l2','a5-u2-l1','a5-u2-l2','a5-u3-l1','a5-u3-l2','a5-u3-l3','a5-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(/assets\/asia-deserts\.webp(\?v=\d+)?$/.test(src),'Asia deserts map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){assert.equal(await page.locator('.task .card h3').first().innerText(),lang==='ru'?'Пустыни Азии':'Deserts of Asia');await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),factOf(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in dUnit,'a desert of section 5: '+q.id);await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in dUnit),'desert options only');
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a5-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    // the Gobi and the Ordos touch on the map: a tap on one is never the other
    const judged=await page.evaluate(([t,e])=>{window.__gwEuSec(17);const sz={W:390,H:284};return [window.__gwEuOk('as-gobi',t.x,t.y,sz),window.__gwEuOk('as-ordos',t.x,t.y,sz),window.__gwEuOk('as-ordos',e.x,e.y,sz)]},
      [lab['as-gobi'],lab['as-ordos']]);
    assert.deepEqual(judged,[true,false,true]);
    for(const u of [1,2,3]){await page.locator(`[data-step="a5-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(/assets\/asia-deserts\.webp(\?v=\d+)?$/.test(src),'practice on the deserts map');
        for(const m of p.markers)assert(m.id in dUnit?dUnit[m.id]<=u:m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`);
        assert(p.markers.some(m=>m.id in dUnit),p.answer+': letters on deserts');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="a5-u1-l1"]')}
    const dGeo=JSON.parse(fs.readFileSync('data/geowords/b3-section-5.json','utf8')).puzzles;
    for(const [step,id] of [['a5-u1-final','unit-1'],['a5-u2-final','unit-2'],['a5-u3-final','unit-3'],['a5-final','final']]){
      const want=dGeo.find(p=>p.id===`b3-section-5-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(/assets\/asia-deserts\.webp(\?v=\d+)?$/.test(src),'final on the deserts map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a5-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 6 «Countries and capitals: East and Southeast Asia»: lessons on the countries map (a tap on a country's label point or on its capital dot is right),
  // Taiwan never in a capital question, practice with at least a third of the letters on rivers, and the finals
  for(const lang of run(6)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/content/b3-section-6-facts.json','data/content/b3-section-6-records.json','data/dictionary/b3-section-6.json','data/geowords/b3-section-6.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="a6-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Восточная и Юго-Восточная Азия/:/East and Southeast Asia/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`a6-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['a6-u1-l1','a6-u1-l2','a6-u1-l3','a6-u2-l1','a6-u2-l2','a6-u3-l1','a6-u3-l2','a6-u3-l3','a6-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<120;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-countries.webp'),'Asia countries map: '+src);
        if(['findCap','capOf','whatCap'].includes(q.k))assert.notEqual(q.id,'cty-taiwan','Taiwan is never in a capital question');
        if(!shotKinds.has(q.k)||q.id==='cty-taiwan'&&q.k==='introEu'){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k+(q.id==='cty-taiwan'?'-taiwan':''))}
        if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu'){const f=cFacts.items.find(i=>i.id===q.id);assert.equal(await page.locator('.task .card p').first().innerText(),f.fact[lang]);
            assert.equal(await page.locator('.task .nuance').count(),f.caveat?1:0,'«Есть нюанс» on '+q.id);
            // the zoom inset only on Singapore, Brunei and Timor-Leste (Svetlana, 31.10.2026 17:45)
            assert.equal(await page.locator('.task .zoom-inset').count(),['cty-singapore','cty-brunei','cty-timor-leste'].includes(q.id)?1:0,'zoom inset on '+q.id)}
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in cUnit,'a country of section 6: '+q.id);await tapAt(cOf[q.id].label);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='findCap'){await tapAt(cOf[q.id].capital);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the capital dot of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(['whatEu','capOf','whatCap'].includes(q.k)){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in cUnit),'country options only');
          if(q.k!=='whatEu')assert(!opts.includes('cty-taiwan'),'Taiwan is never an option of a capital question');
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a6-u1-l1"]')}
    for(const k of ['introEu','introEuRec','findEu','whatEu','findCap','capOf','whatCap'])assert(kinds.has(k),'task kind played: '+k);
    // the capital dots of Seoul and Pyongyang are close: a tap on one is never the other
    const caps=await page.evaluate(([s,p])=>{window.__gwEuSec(18);const sz={W:390,H:284};return [window.__gwCapHit(s.x,s.y,sz),window.__gwCapHit(p.x,p.y,sz)]},[cOf['cty-south-korea'].capital,cOf['cty-north-korea'].capital]);
    assert.deepEqual(caps,['seoul','pyongyang']);
    const rivIds=new Set(cMap.rivers.map(r=>r.id));
    for(const u of [1,2,3]){await page.locator(`[data-step="a6-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-countries.webp'),'practice on the countries map');
        for(const m of p.markers){const [r,c]=m.id.split('@');assert(c?rivIds.has(r)&&cUnit[c]<=u:m.id in cUnit?cUnit[m.id]<=u:rivIds.has(m.id)||m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`)}
        assert(p.markers.filter(m=>rivIds.has(m.id.split('@')[0])).length>=Math.ceil(p.answer.length/3),p.answer+': a third of the letters on rivers');
        assert.deepEqual(p.focus,cMap.frames[String(u)],'practice opens zoomed in on the region of unit '+u);
        assert(!p.markers.some(m=>['as-arctic-ocean','as-chukotka','as-bering-strait'].includes(m.id)),p.answer+': no letter in the far north');
        await page.waitForTimeout(300);assert.equal(await page.locator('.gw .mk:not([hidden])').count(),p.markers.length,p.answer+': every letter in view');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="a6-u1-l1"]')}
    const cGeo=JSON.parse(fs.readFileSync('data/geowords/b3-section-6.json','utf8')).puzzles;
    for(const [step,id] of [['a6-u1-final','unit-1'],['a6-u2-final','unit-2'],['a6-u3-final','unit-3'],['a6-final','final']]){
      const want=cGeo.find(p=>p.id===`b3-section-6-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/asia-countries.webp'),'final on the countries map');
      assert.deepEqual(p.focus,want.focus,'the final opens zoomed in');assert(want.inRegion>=Math.ceil(want.answer.length/2),'half of the letters in the region');
      await page.waitForTimeout(300);assert.equal(await page.locator('.gw .mk:not([hidden])').count(),p.markers.length,want.id+': every letter in view');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="a6-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // without the approvals the finals wait: a draft final does not open
  {const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
    await context.addInitScript(()=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:'ru',done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))});
    const page=await context.newPage();await page.goto(base+'/app/');await page.waitForSelector('[data-step="a1-u1-l1"]');
    if(!JSON.parse(fs.readFileSync('data/geowords/b3-section-1.json','utf8')).puzzles.some(p=>p.id==='b3-section-1-unit-1-ru'&&p.approval.status==='approved')){
      await page.locator('[data-step="a1-u1-final"]').click();assert.equal(await page.locator('.sheet [data-a="go"]').count(),0,'a draft Asia final does not open')}
    await context.close()}
  // without the approved river facts section 2 stays off the trail
  if(JSON.parse(fs.readFileSync('data/content/b3-section-2-facts.json','utf8')).items.some(i=>i.approval.status!=='approved')){
    const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="a1-u1-l1"]');assert.equal(await page.locator('[data-step="a2-u1-l1"]').count(),0,'draft rivers stay hidden');await context.close()}
  console.log('PASS: Asia sections 1–6 — lessons, practice and finals on the Asia maps (RU, EN)');
}finally{await browser?.close();server.close()}
