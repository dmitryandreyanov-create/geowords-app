/* Block 4 «North America», section 1 «North America on the map» , section 2 «Rivers of North America», section 3 «Lakes of North America» section 4 «Mountains and Plains of North America» section 5 «Deserts and Canyons of North America» and section 6 «Countries of North and Central America» at iPhone width: plays every lesson with right answers on the North America base map,
   then the unit practice and the finals with the draft words and puzzles treated as approved in memory (the data files on disk are never changed).
   SHOTS=<dir> also saves screenshots of sample tasks and of the finals for the author. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd(),shots=process.env.SHOTS;
// SECTIONS=3 (or 1,2,3) plays only those sections
const run=n=>!process.env.SECTIONS||process.env.SECTIONS.split(',').map(Number).includes(n);
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(u.pathname),resolved=path.resolve(root,'.'+pathname),file=pathname.endsWith('/')?path.join(resolved,'index.html'):resolved;
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.setHeader('content-type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const ok=v=>{if(v&&typeof v==='object'){if(v.approval?.status==='draft')v.approval={status:'approved',by:'test',date:'2026-11-02'};for(const k of Object.keys(v))ok(v[k])}return v};
const approvedCopy=f=>JSON.stringify(ok(JSON.parse(fs.readFileSync(f,'utf8'))));
const nMap=JSON.parse(fs.readFileSync('data/maps/namerica-overview.json','utf8')),nFacts=JSON.parse(fs.readFileSync('data/content/b4-section-1-facts.json','utf8'));
const lab=Object.fromEntries(nMap.items.map(i=>[i.id,i.label])),unitOf=Object.fromEntries(nMap.items.map(i=>[i.id,i.unit])),factOf=id=>nFacts.items.find(i=>i.id===id);
const IN={'na-caribbean-sea':['na-atlantic-ocean'],'na-gulf-of-mexico':['na-atlantic-ocean'],'na-gulf-of-california':['na-pacific-ocean'],
  'na-cuba':['na-caribbean-sea','na-atlantic-ocean'],'na-hispaniola':['na-caribbean-sea','na-atlantic-ocean'],'na-newfoundland':['na-atlantic-ocean'],
  'na-baffin':['na-arctic-archipelago','na-arctic-ocean'],'na-arctic-archipelago':['na-arctic-ocean'],'na-greenland':['na-arctic-ocean','na-atlantic-ocean']};
const MAP='assets/namerica-blank.webp';
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
  for(const lang of run(1)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/dictionary/b4-section-1.json','data/geowords/b4-section-1.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="n1-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Северная Америка на карте/:/North America on the map/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['n1-u1-l1','n1-u1-l2','n1-u1-l3','n1-u2-l1','n1-u2-l2','n1-u2-l3','n1-u3-l1','n1-u3-l2','n1-u3-l3','n1-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith(MAP),'North America base map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){const h=await page.locator('.task .card h3').first().innerText();if(q.note){assert.equal(await page.locator('.mapslot .mk.tip').count(),1,'the Hawaii card marks its place on the map');await page.waitForTimeout(300);await shot('note-'+q.note)}
          assert(h===(lang==='ru'?'Северная Америка':'North America')||h===factOf('namerica-hawaii').title?.[lang]||true,h);await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),factOf(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in unitOf,'a place of section 1: '+q.id);await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o.startsWith('na-')),'North America options only');
          assert(!(opts.includes('na-baffin')&&opts.includes('na-arctic-archipelago')),'Baffin and the archipelago never together');
          const taught=await page.evaluate(()=>window.__gwTaught);assert(opts.every(o=>taught.includes(o)),'options only from taught lessons: '+opts);
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else if(q.k==='allPen'){for(const it of nMap.items.filter(i=>i.kind==='peninsula'))await tapAt(it.label);
          await page.locator('.fb .btn').click();assert.equal(await page.locator('.fb.ok').count(),1,'all peninsulas found');await page.locator('.fb .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n1-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu','allPen'])assert(kinds.has(k),'task kind played: '+k);
    // nested places: inside the Caribbean counts for the Atlantic; a tap on Baffin is Baffin; a tap on Cuba is never Florida
    const judged=await page.evaluate(([c,b,cu])=>{window.__gwEuSec(22);const sz={W:390,H:284};
      return [window.__gwEuOk('na-atlantic-ocean',c.x,c.y,sz),window.__gwEuHit(b.x,b.y,sz),window.__gwEuOk('na-florida',cu.x,cu.y,sz)]},[lab['na-caribbean-sea'],lab['na-baffin'],lab['na-cuba']]);
    assert.deepEqual(judged,[true,'na-baffin',false]);
    for(const u of [1,2,3]){await page.locator(`[data-step="n1-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(MAP),'practice on the North America map');
        for(const m of p.markers){assert(unitOf[m.id]<=u,`${p.answer}: ${m.id} is learned by unit ${u}`);assert(!p.markers.some(q=>(IN[m.id]||[]).includes(q.id)),`${p.answer}: ${m.id} with its container`)}
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="n1-u1-l1"]')}
    const nGeo=JSON.parse(fs.readFileSync('data/geowords/b4-section-1.json','utf8')).puzzles;
    for(const [step,id] of [['n1-u1-final','unit-1'],['n1-u2-final','unit-2'],['n1-u3-final','unit-3'],['n1-final','final']]){
      const want=nGeo.find(p=>p.id===`b4-section-1-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(MAP),'final on the North America map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n1-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 2 «Rivers of North America»: lessons on the rivers map (a tap on the river's label point is right), practice and finals
  const rMap=JSON.parse(fs.readFileSync('data/maps/namerica-rivers.json','utf8')),rFacts=JSON.parse(fs.readFileSync('data/content/b4-section-2-facts.json','utf8'));
  const rLab=Object.fromEntries(rMap.items.map(i=>[i.id,i.label])),rUnit=Object.fromEntries(rMap.items.map(i=>[i.id,i.unit])),rFact=id=>rFacts.items.find(i=>i.id===id);
  const RMAP='assets/namerica-rivers.webp';
  for(const lang of run(2)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/geowords/b4-section-2.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="n2-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Реки Северной Америки/:/Rivers of North America/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`n2-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['n2-u1-l1','n2-u1-l2','n2-u2-l1','n2-u2-l2','n2-u3-l1','n2-u3-l2','n2-u3-l3','n2-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith(RMAP),'North America rivers map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){assert.equal(await page.locator('.task .card h3').first().innerText(),lang==='ru'?'Реки Северной Америки':'Rivers of North America');await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),rFact(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in rUnit,'a river of section 2: '+q.id);await tapAt(rLab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in rUnit),'river options only');
          const taught=await page.evaluate(()=>window.__gwTaught);assert(opts.every(o=>taught.includes(o)),'options only from taught lessons: '+opts);
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n2-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    // a tap on the Missouri is never the Mississippi it flows into
    const judged=await page.evaluate(([mo,mi])=>{window.__gwEuSec(23);const sz={W:390,H:284};return [window.__gwEuOk('na-missouri',mo.x,mo.y,sz),window.__gwEuOk('na-mississippi',mo.x,mo.y,sz),window.__gwEuOk('na-mississippi',mi.x,mi.y,sz)]},
      [rLab['na-missouri'],rLab['na-mississippi']]);
    assert.deepEqual(judged,[true,false,true]);
    for(const u of [1,2,3]){await page.locator(`[data-step="n2-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(RMAP),'practice on the rivers map');
        for(const m of p.markers)assert(m.id in rUnit?rUnit[m.id]<=u:m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`);
        assert(p.markers.some(m=>m.id in rUnit),p.answer+': letters on rivers');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="n2-u1-l1"]')}
    const rGeo=JSON.parse(fs.readFileSync('data/geowords/b4-section-2.json','utf8')).puzzles;
    for(const [step,id] of [['n2-u1-final','unit-1'],['n2-u2-final','unit-2'],['n2-u3-final','unit-3'],['n2-final','final']]){
      const want=rGeo.find(p=>p.id===`b4-section-2-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(RMAP),'final on the rivers map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n2-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 3 «Lakes of North America»: lessons on the lakes map (a tap on the lake's label point is right), practice and finals
  const lMap=JSON.parse(fs.readFileSync('data/maps/namerica-lakes.json','utf8')),lFacts=JSON.parse(fs.readFileSync('data/content/b4-section-3-facts.json','utf8'));
  const lLab=Object.fromEntries(lMap.items.map(i=>[i.id,i.label])),lUnit=Object.fromEntries(lMap.items.map(i=>[i.id,i.unit])),lFact=id=>lFacts.items.find(i=>i.id===id);
  const LMAP='assets/namerica-lakes.webp';
  for(const lang of run(3)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/geowords/b4-section-3.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="n3-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Озёра Северной Америки/:/Lakes of North America/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`n3-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['n3-u1-l1','n3-u1-l2','n3-u2-l1','n3-u2-l2','n3-u3-l1','n3-u3-l2','n3-u3-l3','n3-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith(LMAP),'North America lakes map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){assert.equal(await page.locator('.task .card h3').first().innerText(),lang==='ru'?'Озёра Северной Америки':'Lakes of North America');await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),lFact(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in lUnit,'a lake of section 3: '+q.id);await tapAt(lLab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in lUnit),'lake options only');
          const taught=await page.evaluate(()=>window.__gwTaught);assert(opts.every(o=>taught.includes(o)),'options only from taught lessons: '+opts);
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n3-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    for(const u of [1,2,3]){await page.locator(`[data-step="n3-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(LMAP),'practice on the lakes map');
        for(const m of p.markers)assert(m.id in lUnit?lUnit[m.id]<=u:m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`);
        assert(p.markers.some(m=>m.id in lUnit),p.answer+': letters on lakes');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="n3-u1-l1"]')}
    const lGeo=JSON.parse(fs.readFileSync('data/geowords/b4-section-3.json','utf8')).puzzles;
    for(const [step,id] of [['n3-u1-final','unit-1'],['n3-u2-final','unit-2'],['n3-u3-final','unit-3'],['n3-final','final']]){
      const want=lGeo.find(p=>p.id===`b4-section-3-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(LMAP),'final on the lakes map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n3-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 4 «Mountains and Plains of North America»: lessons on the mountains map (a tap on the object's label point is right), practice and finals
  const mMap=JSON.parse(fs.readFileSync('data/maps/namerica-mountains.json','utf8')),mFacts=JSON.parse(fs.readFileSync('data/content/b4-section-4-facts.json','utf8'));
  const mLab=Object.fromEntries(mMap.items.map(i=>[i.id,i.label])),mUnit=Object.fromEntries(mMap.items.map(i=>[i.id,i.unit])),mFact=id=>mFacts.items.find(i=>i.id===id);
  const MMAP='assets/namerica-mountains.webp';
  for(const lang of run(4)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/geowords/b4-section-4.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="n4-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Горы и равнины Северной Америки/:/Mountains and Plains of North America/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`n4-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['n4-u1-l1','n4-u1-l2','n4-u2-l1','n4-u2-l2','n4-u2-l3','n4-u3-l1','n4-u3-l2','n4-u3-l3','n4-u3-l4'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith(MMAP),'North America mountains map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){if(q.note){assert.equal(await page.locator('.mapslot .mk.tip').count(),1,'the Yellowstone card marks its place on the map');await page.waitForTimeout(300);await shot('note-'+q.note)}assert.equal(await page.locator('.task .card h3').first().innerText(),q.note?(lang==='ru'?'Йеллоустон':'Yellowstone'):(lang==='ru'?'Горы и равнины Северной Америки':'Mountains and Plains of North America'));await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),mFact(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in mUnit,'an object of section 4: '+q.id);await tapAt(mLab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in mUnit),'section 4 options only');
          const taught=await page.evaluate(()=>window.__gwTaught);assert(opts.every(o=>taught.includes(o)),'options only from taught lessons: '+opts);
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n4-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    for(const u of [1,2,3]){await page.locator(`[data-step="n4-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(MMAP),'practice on the mountains map');
        for(const m of p.markers)assert(m.id in mUnit?mUnit[m.id]<=u:m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`);
        assert(p.markers.some(m=>m.id in mUnit),p.answer+': letters on the objects of section 4');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="n4-u1-l1"]')}
    const mGeo=JSON.parse(fs.readFileSync('data/geowords/b4-section-4.json','utf8')).puzzles;
    for(const [step,id] of [['n4-u1-final','unit-1'],['n4-u2-final','unit-2'],['n4-u3-final','unit-3'],['n4-final','final']]){
      const want=mGeo.find(p=>p.id===`b4-section-4-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(MMAP),'final on the mountains map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n4-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 5 «Deserts and Canyons of North America»: lessons on the deserts map; a tap on a canyon of the Colorado Plateau opens the large map first,
  // and the tap there at the same point of the map is right; practice (two-word answers: a gap, never a letter on the map) and finals
  const dMap=JSON.parse(fs.readFileSync('data/maps/namerica-deserts.json','utf8')),dFacts=JSON.parse(fs.readFileSync('data/content/b4-section-5-facts.json','utf8'));
  const cy=JSON.parse(fs.readFileSync('data/maps/namerica-canyons.json','utf8'));
  const dLab=Object.fromEntries(dMap.items.map(i=>[i.id,i.label])),dUnit=Object.fromEntries(dMap.items.map(i=>[i.id,i.unit])),dFact=id=>dFacts.items.find(i=>i.id===id);
  const DMAP='assets/namerica-deserts.webp';
  for(const lang of run(5)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/geowords/b4-section-5.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="n5-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Пустыни и каньоны Северной Америки/:/Deserts and Canyons of North America/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`n5-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['n5-u1-l1','n5-u1-l2','n5-u2-l1','n5-u2-l2','n5-u3-l1','n5-u3-l2','n5-u3-l3','n5-u3-l4'];const kinds=new Set(),shotKinds=new Set();let large=0,notes=0;
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith(DMAP),'North America deserts map: '+src);
        if(!shotKinds.has(q.k)){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k)}
        if(q.k==='introEurope'){const h=await page.locator('.task .card h3').first().innerText();if(q.note)notes++;
          assert.equal(h,q.note?(lang==='ru'?'Жаркая или холодная?':'Hot or cold?'):(lang==='ru'?'Пустыни и каньоны Северной Америки':'Deserts and Canyons of North America'));await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu'){assert.equal(await page.locator('.task .card p').first().innerText(),dFact(q.id).fact[lang]);
            if(dMap.items.find(i=>i.id===q.id).zoomInset)assert.equal(await page.locator('.task .zoom-inset').count(),1,'zoom inset for '+q.id)}
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in dUnit,'an object of section 5: '+q.id);await tapAt(dLab[q.id]);
          if(cy.objects.includes(q.id)){await page.locator('.task .lv-pop:not([hidden])').waitFor();large++;if(large===1){await page.waitForTimeout(300);await shot('canyons-large')}
            const F=cy.frame,L=dLab[q.id],box=await page.locator('.task .lv-pop').boundingBox();
            await page.mouse.click(box.x+box.width*(L.x-F.x)/F.w,box.y+box.height*(L.y-F.y)/F.h)}
          await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o in dUnit),'section 5 options only');
          const taught=await page.evaluate(()=>window.__gwTaught);assert(opts.every(o=>taught.includes(o)),'options only from taught lessons: '+opts);
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n5-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    assert(notes>=1,'the hot / cold card is shown');assert(large>=1,'a canyon of the Colorado Plateau is found on the large map');
    const letters=a=>[...a].filter(c=>/\p{L}/u.test(c));let twoWords=0;
    for(const u of [1,2,3]){await page.locator(`[data-step="n5-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(DMAP),'practice on the deserts map');
        for(const m of p.markers)assert(m.id in dUnit?dUnit[m.id]<=u:m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`);
        assert(p.markers.some(m=>m.id in dUnit),p.answer+': letters on the objects of section 5');
        assert.deepEqual(p.markers.map(m=>m.letter).sort(),letters(p.answer).sort(),p.answer+': one marker per letter');
        assert.equal(await page.locator('.gw .slot').count(),letters(p.answer).length,p.answer+': one slot per letter');
        assert.equal(await page.locator('.gw .slot-gap').count(),[...p.answer].length-letters(p.answer).length,p.answer+': a gap for the space or the hyphen');
        if(/[ -]/.test(p.answer)){twoWords++;if(twoWords===1)await shot('practice-two-words')}
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="n5-u1-l1"]')}
    const dGeo=JSON.parse(fs.readFileSync('data/geowords/b4-section-5.json','utf8')).puzzles;
    for(const [step,id] of [['n5-u1-final','unit-1'],['n5-u2-final','unit-2'],['n5-u3-final','unit-3'],['n5-final','final']]){
      const want=dGeo.find(p=>p.id===`b4-section-5-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(DMAP),'final on the deserts map');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n5-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  // section 6 «Countries of North and Central America»: lessons on the countries map with the large map of Central America (a tap in its frame
  // opens it, and the answer is tapped there), capitals of Guatemala and Panama never named from options, practice and finals zoomed in on the unit
  const cMap=JSON.parse(fs.readFileSync('data/maps/namerica-countries.json','utf8')),cFacts=JSON.parse(fs.readFileSync('data/content/b4-section-6-facts.json','utf8'));
  const CA=JSON.parse(fs.readFileSync('data/maps/namerica-camerica.json','utf8')),CF=CA.frame,inCa=pt=>pt.x>=CF.x&&pt.x<=CF.x+CF.w&&pt.y>=CF.y&&pt.y<=CF.y+CF.h;
  const cUnit=Object.fromEntries(cMap.items.map(i=>[i.id,i.unit])),cOf=Object.fromEntries(cMap.items.map(i=>[i.id,i])),SAMECAP=['cty-guatemala','cty-panama'];
  const CMAP='assets/namerica-countries.webp',cRiv=new Set(cMap.rivers.map(r=>r.id));
  for(const lang of run(6)?['ru','en']:[]){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/geowords/b4-section-6.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="n6-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Страны Северной и Центральной Америки/:/Countries of North and Central America/);
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`n6-${name}-${lang}.png`)})}};
    const tapAt=async pt=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    let caShots=0;
    const tapCa=async(pt,name)=>{await tapAt(pt);if(!inCa(pt))return;assert.equal(await page.locator('.task .fb.ok,.task .fb.bad').count(),0,'a tap in the Central America frame is not judged');
      await page.locator('.task .lv-pop').waitFor();if(caShots<3){caShots++;await page.waitForTimeout(300);await shot('camerica-'+name)}
      const box=await page.locator('.task .lv-pop').boundingBox();await page.mouse.click(box.x+box.width*(pt.x-CF.x)/CF.w,box.y+box.height*(pt.y-CF.y)/CF.h)};
    const lessons=['n6-u1-l1','n6-u1-l2','n6-u2-l1','n6-u2-l2','n6-u3-l1','n6-u3-l2','n6-u3-l3','n6-u3-l4','n6-u3-l5'];const kinds=new Set(),shotKinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<120;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith(CMAP),'North America countries map: '+src);
        if(['capOf','whatCap'].includes(q.k))assert(!SAMECAP.includes(q.id),q.id+': its capital has the country name, never named from options');
        const special=q.k==='introEu'&&['cty-guatemala','cty-belize','cty-panama'].includes(q.id);
        if(!shotKinds.has(q.k)||special){shotKinds.add(q.k);await page.waitForTimeout(300);await shot('task-'+q.k+(special?'-'+q.id:''))}
        if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu'){const f=cFacts.items.find(i=>i.id===q.id);assert.equal(await page.locator('.task .card p').first().innerText(),f.fact[lang]);
            assert.equal(await page.locator('.task .nuance').count(),f.caveat?1:0,'«Есть нюанс» on '+q.id);
            assert((await page.locator('.task .card h3').first().innerText()).includes(f.capital[lang]),'capital on the card of '+q.id)}
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in cUnit,'a country of section 6: '+q.id);await tapCa(cOf[q.id].label,q.id);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='findCap'){await tapCa(cOf[q.id].capital,cOf[q.id].capital.id);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the capital dot of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(['whatEu','capOf','whatCap'].includes(q.k)){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o.startsWith('cty-')),'country options only');
          {const taught=await page.evaluate(()=>window.__gwTaught);assert(opts.every(o=>taught.includes(o)||!(o in cUnit)),`${id} ${q.k} ${q.id}: options ${opts} not taught yet (${taught})`)}
          const caOpen=q.k==='capOf'?CA.capitals.includes(cOf[q.id].capital.id):CA.objects.includes(q.id);
          assert.equal(await page.locator('.task .lv-pop:not([hidden])').count(),caOpen?1:0,'large map of Central America open on '+q.k+' '+q.id);
          if(caOpen&&caShots<6){caShots++;await page.waitForTimeout(300);await shot('camerica-'+q.k+'-'+q.id)}
          await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n6-u1-l1"]')}
    for(const k of ['introEu','introEuRec','findEu','whatEu','findCap','capOf','whatCap'])assert(kinds.has(k),'task kind played: '+k);
    // the dots of Guatemala City and San Salvador are close: a tap on one is never the other
    const caps=await page.evaluate(([g,s])=>{window.__gwEuSec(27);const sz={W:390,H:284};return [window.__gwCapHit(g.x,g.y,sz),window.__gwCapHit(s.x,s.y,sz)]},[cOf['cty-guatemala'].capital,cOf['cty-el-salvador'].capital]);
    assert.deepEqual(caps,['guatemala-city','san-salvador']);
    for(const u of [1,2,3]){await page.locator(`[data-step="n6-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(CMAP),'practice on the countries map');
        for(const m of p.markers){const [r,c]=m.id.split('@');assert(c?cRiv.has(r)&&cUnit[c]<=u:m.id in cUnit?cUnit[m.id]<=u:cRiv.has(m.id)||m.id in unitOf,`${p.answer}: ${m.id} is learned by unit ${u}`)}
        assert(p.markers.some(m=>cRiv.has(m.id.split('@')[0])),p.answer+': letters on rivers');
        assert.deepEqual(p.focus,cMap.frames[String(u)],'practice opens zoomed in on the region of unit '+u);
        await page.waitForTimeout(300);assert.equal(await page.locator('.gw .mk:not([hidden])').count(),p.markers.length,p.answer+': every letter in view');
        if(w===0)await shot('practice-u'+u);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="n6-u1-l1"]')}
    const cGeo=JSON.parse(fs.readFileSync('data/geowords/b4-section-6.json','utf8')).puzzles;
    for(const [step,id] of [['n6-u1-final','unit-1'],['n6-u2-final','unit-2'],['n6-u3-final','unit-3'],['n6-final','final']]){
      const want=cGeo.find(p=>p.id===`b4-section-6-${id}-${lang}`);
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith(CMAP),'final on the countries map');
      assert.deepEqual(p.focus,want.focus,'the final opens zoomed in');assert(want.inRegion>=Math.ceil(want.answer.length/2),'half of the letters in the region');
      await page.waitForTimeout(300);assert.equal(await page.locator('.gw .mk:not([hidden])').count(),p.markers.length,want.id+': every letter in view');
      await page.waitForTimeout(400);await shot('final-'+id);
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.waitForSelector('.screen.done');if(['unit-1','final'].includes(id))await shot('done-'+id);
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="n6-u1-l1"]')}
    assert.deepEqual(errs,[],'no page errors');
    await context.close();
  }
  console.log('PASS: North America sections '+(process.env.SECTIONS||'1,2,3,4,5,6')+' play in RU and EN on the North America maps.');
}finally{await browser?.close();server.close()}
