/* Block 3 «Asia», section 1 «Asia on the map» at iPhone width: plays every lesson with right answers on the Asia base map, then the unit
   practice and the finals with the draft words and puzzles treated as approved in memory (the data files on disk are never changed).
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
const ok=v=>{if(v&&typeof v==='object'){if(v.approval?.status==='draft')v.approval={status:'approved',by:'test',date:'2026-10-29'};for(const k of Object.keys(v))ok(v[k])}return v};
const approvedCopy=f=>JSON.stringify(ok(JSON.parse(fs.readFileSync(f,'utf8'))));
const aMap=JSON.parse(fs.readFileSync('data/maps/asia-overview.json','utf8')),aFacts=JSON.parse(fs.readFileSync('data/content/b3-section-1-facts.json','utf8'));
const lab=Object.fromEntries(aMap.items.map(i=>[i.id,i.label])),unitOf=Object.fromEntries(aMap.items.map(i=>[i.id,i.unit]));
const IN={'as-sea-of-japan':'as-pacific-ocean','as-sea-of-okhotsk':'as-pacific-ocean','as-south-china-sea':'as-pacific-ocean','as-persian-gulf':'as-indian-ocean',
  'as-japanese-islands':'as-pacific-ocean','as-sakhalin':'as-pacific-ocean','as-borneo':'as-pacific-ocean','as-sri-lanka':'as-indian-ocean'};
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
  for(const lang of ['ru','en']){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/dictionary/b3-section-1.json','data/geowords/b3-section-1.json'])
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
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),aFacts.items.find(i=>i.id===q.id).fact[lang]);
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
  // without the approvals the finals wait: a draft final does not open
  {const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
    await context.addInitScript(()=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:'ru',done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))});
    const page=await context.newPage();await page.goto(base+'/app/');await page.waitForSelector('[data-step="a1-u1-l1"]');
    if(!JSON.parse(fs.readFileSync('data/geowords/b3-section-1.json','utf8')).puzzles.some(p=>p.id==='b3-section-1-unit-1-ru'&&p.approval.status==='approved')){
      await page.locator('[data-step="a1-u1-final"]').click();assert.equal(await page.locator('.sheet [data-a="go"]').count(),0,'a draft Asia final does not open')}
    await context.close()}
  console.log('PASS: Asia section 1 — lessons, practice and finals on the Asia map (RU, EN)');
}finally{await browser?.close();server.close()}
