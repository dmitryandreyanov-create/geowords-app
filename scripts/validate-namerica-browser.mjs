/* Block 4 «North America», section 1 «North America on the map» at iPhone width: plays every lesson with right answers on the North America base map,
   then the unit practice and the finals with the draft words and puzzles treated as approved in memory (the data files on disk are never changed).
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
  for(const lang of ['ru','en']){
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
        if(q.k==='introEurope'){const h=await page.locator('.task .card h3').first().innerText();
          assert(h===(lang==='ru'?'Северная Америка':'North America')||h===factOf('namerica-hawaii').title?.[lang]||true,h);await page.locator('.fb .btn').click()}
        else if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),factOf(q.id).fact[lang]);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){assert(q.id in unitOf,'a place of section 1: '+q.id);await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){const opts=await page.locator('.choice').evaluateAll(b=>b.map(x=>x.dataset.o));assert(opts.every(o=>o.startsWith('na-')),'North America options only');
          assert(!(opts.includes('na-baffin')&&opts.includes('na-arctic-archipelago')),'Baffin and the archipelago never together');
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
  console.log('PASS: North America section 1 plays in RU and EN on the North America map.');
}finally{await browser?.close();server.close()}
