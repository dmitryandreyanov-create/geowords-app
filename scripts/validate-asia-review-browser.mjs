/* Block 3 «Asia» review at iPhone width: plays the five review lessons, the block final and the Challenge with every draft text
   treated as approved in memory (the data files on disk are never changed), checks the adaptive rules (a second mistake moves on),
   the Speed Hunt order and tap areas, and the Challenge GeoWords rules over many rounds.
   SHOTS=<dir> also saves screenshots of the block final and sample tasks for the author. */
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
const approvedCopy=f=>{const j=ok(JSON.parse(fs.readFileSync(f,'utf8')));if(j.speedHunt||j.unit==='block-review'){j.status='approved';j.approval={status:'approved'}}return JSON.stringify(j)};
const R=JSON.parse(fs.readFileSync('data/review/b3-block.json','utf8')),RIV=new Set(JSON.parse(fs.readFileSync('data/maps/asia-rivers.json','utf8')).items.map(o=>o.id)),CH=JSON.parse(fs.readFileSync('data/challenge/b3-block.json','utf8'));
const HARD=new Set(CH.speedHunt.difficulty.countries.hard),TIER=Object.fromEntries(['easy','medium','hard'].flatMap(k=>[...CH.speedHunt.difficulty.countries[k],...CH.speedHunt.difficulty.rivers[k]].map(id=>[id,k])));
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
  for(const lang of ['ru','en']){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
    for(const f of ['data/review/b3-block.json','data/dictionary/b3-block.json','data/geowords/b3-block.json','data/challenge/b3-block.json'])
      await context.route('**/'+f+'*',r=>r.fulfill({contentType:'application/json',body:approvedCopy(f)}));
    await context.addInitScript(l=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:l,done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))},lang);
    const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base+'/app/');await page.waitForSelector('[data-step="ab-l1"]');
    assert.match(await page.locator('.path').innerText(),lang==='ru'?/Повторение блока/:/Block review/);
    const tapMap=async(x,y)=>{const b=await page.locator('.mapslot .map').first().boundingBox();await page.mouse.click(b.x+x/100*b.width,b.y+y/100*b.height)};
    const shot=async name=>{if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`${name}-${lang}.png`)})}};
    const seenKinds=new Set();
    // answers every task right, from the task the app exposes
    async function answer(){const q=await page.evaluate(()=>window.__gwTask);seenKinds.add(q.k);
      if(['findEu','findCap'].includes(q.k)){const o=await page.evaluate(id=>window.__gwE(id),q.id);const p=q.k==='findCap'?o.capital:o;await tapMap(p.x,p.y);return q}
      if(['whatEu','recWhat'].includes(q.k)){await page.locator(`.choice[data-o="${q.id}"]`).click();return q}
      if(q.k==='trapEu'){await page.locator(`.choice[data-o="${R.traps.find(t=>t.id===q.trap).answer}"]`).click();return q}
      if(['tfEu','recTf'].includes(q.k)){await page.locator(`.tfrow .choice[data-o="${q.side==='true'}"]`).click();return q}
      if(q.k==='writeEu'){const n=await page.locator('.wtile[data-i]').count();for(let i=0;i<n;i++)await page.locator(`.wtile[data-i="${i}"]`).click();return q}
      if(q.k==='labelEu'){for(const c of await page.locator('.lchip').all()){const id=await c.getAttribute('data-o');await c.click();await page.locator(`.mk[data-id="${id}"]`).click()}
        await page.locator('.fb .btn').click();return q}
      if(['pairsCap','pairsEu','recPairs'].includes(q.k)){if(!(await page.locator('.pbtn').count()))return q;
        for(const b of await page.locator('.pbtn[data-s]').all()){const s=await b.getAttribute('data-s');await b.click();await page.locator(`.pbtn[data-r="${s}"]`).click()}return q}
      if(q.k==='allEu'){const T=R.selectAll.find(t=>t.id===q.sel);for(const id of T.want){const o=await page.evaluate(id=>window.__gwE(id),id);await tapMap(o.x,o.y)}
        await page.locator('.fb .btn').click();return q}
      throw new Error('unknown task '+q.k)}
    for(const id of ['ab-l1','ab-l2','ab-l3','ab-l4','ab-l5']){
      await page.evaluate(()=>{window.__gwTask=null});await page.locator(`[data-step="${id}"]`).scrollIntoViewIfNeeded();await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      const plan=await page.evaluate(()=>window.__gwPlan);assert.equal(plan.length,10,`${id} has 10 tasks`);
      for(let k=0;k<30;k++){if(await page.locator('.screen.done').count())break;await page.waitForFunction(()=>window.__gwTask);
        const q=await answer();if(shots&&k<3)await shot(`${id}-task-${k+1}-${q.k}`);
        const fb=page.locator('.fb.ok,.fb.bad');await fb.waitFor({timeout:5000}).catch(()=>{});
        if(await page.locator('.fb.bad').count())throw new Error(`${id}: ${q.k} ${q.id||q.sel||q.rel||''} answered right but judged wrong`);
        await page.evaluate(()=>{window.__gwTask=null});await page.locator('.fb .btn').click()}
      assert.equal(await page.locator('.screen.done').count(),1,`${id} finishes with every task right`);
      await page.locator('[data-a="home"]').click();await page.waitForSelector('[data-step="ab-l1"]')}
    for(const k of ['findEu','whatEu','labelEu','writeEu','findCap','pairsCap','pairsEu','allEu','tfEu','trapEu','recTf','recPairs','recWhat'])assert(seenKinds.has(k),`task ${k} was played`);
    // adaptive (Svetlana's point 5): a place at most once per lesson plan; with no mistakes the places asked longest ago come first
    for(let r=0;r<20;r++){const plans=await page.evaluate(()=>window.__gwAbPlans());
      for(const [id,plan] of Object.entries(plans)){const ids=plan.map(q=>q.id).filter(Boolean);assert.equal(new Set(ids).size,ids.length,`${id}: a place twice in one lesson`)}}
    // repeated mistakes: a wrong answer comes back once; a second mistake shows the answer and the lesson moves on
    {await page.locator('[data-step="ab-l1"]').scrollIntoViewIfNeeded();await page.locator('[data-step="ab-l1"]').click();await page.locator('.sheet [data-a="go"]').click();
      let missed=null,seenMissed=0;
      for(let k=0;k<30;k++){if(await page.locator('.screen.done').count())break;await page.waitForFunction(()=>window.__gwTask);
        const q=await page.evaluate(()=>window.__gwTask);
        if(!missed&&q.k==='whatEu')missed=q.id;
        if(missed&&q.id===missed&&q.k==='whatEu'){seenMissed++;await page.locator(`.choice:not([data-o="${q.id}"])`).first().click()}else await answer();
        await page.locator('.fb.ok,.fb.bad').waitFor({timeout:5000}).catch(()=>{});await page.evaluate(()=>{window.__gwTask=null});await page.locator('.fb .btn').click()}
      assert.equal(seenMissed,2,'a twice-missed place is asked twice, not more');assert.equal(await page.locator('.screen.done').count(),1,'the lesson finishes after a second mistake');
      assert((await page.evaluate(id=>JSON.parse(localStorage.getItem('geowords_expedition_v1')).weak[id],missed))>=2,'the missed place stays weak');
      await page.locator('[data-a="home"]').click();await page.waitForSelector('[data-step="ab-l1"]');
      const plan=await page.evaluate(()=>window.__gwAbPlans()['ab-l1']);assert(plan.some(q=>q.id===missed),'the weak place comes back in the next lesson')}
    // Speed Hunt tap areas (point 4): a small country counts up to 36 px away over the sea, never over a neighbour, and never steals another small country's tap
    {const hits=await page.evaluate(()=>{const out={};for(const id of ['cty-kuwait','cty-qatar','cty-lebanon','cty-israel','cty-palestine','cty-singapore','cty-brunei','cty-cyprus','cty-bahrain','cty-maldives','cty-taiwan','cty-timor-leste']){
        const o=window.__gwE(id);let far=0,bad=[];for(let dx=-14;dx<=14;dx+=.7)for(let dy=-18;dy<=18;dy+=.9){const r=window.__gwHuntAs(id,o.x+dx,o.y+dy,360);
          if(r.ok&&r.d>2&&r.inOther)bad.push([dx,dy]);if(r.ok&&r.d>22)far++}
        out[id]={far,bad:bad.length}}return out});
      if(process.env.DEBUG)console.log(JSON.stringify(hits));for(const [id,v] of Object.entries(hits)){assert.equal(v.bad,0,`${id}: its enlarged area lies over a neighbour`)}
      assert(Object.values(hits).some(v=>v.far>0),'the enlarged areas work somewhere over the sea');
      const big=await page.evaluate(()=>{const o=window.__gwE('cty-iraq');let far=0;for(let dx=-14;dx<=14;dx+=1)for(let dy=-18;dy<=18;dy+=1){const r=window.__gwHuntAs('cty-iraq',o.x+dx,o.y+dy,360);if(r.ok&&r.d>22)far++}return far});
      assert.equal(big,0,'a large country keeps the 22 px rule')}
    // block final: the approved-in-memory draft, letters found in clue order
    await page.locator('[data-step="ab-final"]').scrollIntoViewIfNeeded();await page.locator('[data-step="ab-final"]').click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
    const P=await page.evaluate(()=>window.__gwPuzzle);assert.equal(P.answer,lang==='ru'?'МНОГООБРАЗИЕ':'DIVERSITY');await shot('block-final');
    for(const c of P.clues){await page.locator(`.mk[data-id="${c.markerId}"]`).click();await page.waitForTimeout(380)}
    await page.waitForSelector('.screen.done');assert.match(await page.locator('.screen.done').innerText(),new RegExp(P.answer));await shot('block-final-done');
    await page.locator('[data-a="home"]').click();await page.waitForSelector('[data-step="ab-challenge"]');
    // Speed Hunt: five right taps count five
    await page.locator('[data-step="ab-challenge"]').scrollIntoViewIfNeeded();await page.locator('[data-step="ab-challenge"]').click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.hunt-name');
    await shot('speed-hunt');
    const tiers=[],missed=[];for(let i=0;i<8;i++){const id=await page.evaluate(()=>window.__gwHunt.target),before=await page.evaluate(()=>window.__gwHunt.score);tiers.push(TIER[id]);const o=await page.evaluate(id=>window.__gwE(id),id);await tapMap(o.x,o.y);
      await page.waitForFunction(id=>window.__gwHunt.target!==id,id,{timeout:3000}).catch(()=>{});if(await page.evaluate(()=>window.__gwHunt.score)!==before+1)missed.push(id+' '+JSON.stringify(await page.evaluate(()=>window.__gwHuntLast)))}
    assert.deepEqual(missed,[],'Speed Hunt counts right taps');
    assert.deepEqual(tiers,['easy','medium','easy','hard','easy','medium','easy','hard'],'Speed Hunt alternates difficulty');
    // Challenge GeoWords: three words from three sections, a third of the letters on rivers, a country once, spacing 9, a country letter deep inside
    const deepOk=new Set(await page.evaluate(()=>window.__gwAsWholePlaces().map(p=>p.id+' '+p.x+' '+p.y)));
    for(let r=0;r<25;r++){const ps=await page.evaluate(()=>window.__gwAsChallengeRound());
      assert.equal(ps.length,3,'three Challenge words');assert.equal(new Set(ps.map(p=>p.section)).size,3,'three different sections');
      for(const p of ps){const n=[...p.answer].length;assert.equal(p.markers.length,n);
        const rivers=p.markers.filter(m=>RIV.has(m.id.split('@')[0])).length;
        assert(rivers>=Math.ceil(n/3),`${p.answer}: ${rivers} river letters of ${n}`);assert(n-rivers>=Math.floor(n/3),`${p.answer}: ${rivers} river letters of ${n} — a word is never rivers only`);for(const m of p.markers)assert(deepOk.has(m.id+' '+m.x+' '+m.y),`${p.answer}: ${m.id} not on an allowed spot`);
        for(const a of p.markers)for(const b of p.markers)if(a!==b)assert(Math.hypot(a.x-b.x,(a.y-b.y)*1600/2200)>=10,`${p.answer}: ${a.id} and ${b.id} too close`);
        const named=p.markers.map(m=>m.id.split('@')[1]||m.id).filter(id=>!RIV.has(id));assert.equal(new Set(named).size,named.length,`${p.answer}: a country named twice`)}}
    await page.locator('.l-x').click();await page.locator('.sheet [data-a="q"]').click();
    await page.locator('[data-step="ab-challenge"]').click();await page.locator('.sheet [data-a="cw"]').click();await page.waitForSelector('.gw-clue');await shot('challenge-word');
    assert.deepEqual(errs,[],'no page errors');
    console.log(`${lang}: review lessons, block final, Speed Hunt and Challenge GeoWords pass (${[...seenKinds].join(', ')})`);
    await context.close();
  }
}finally{await browser?.close();server.close()}
