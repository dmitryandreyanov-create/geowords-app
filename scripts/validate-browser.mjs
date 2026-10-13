/* Real DOM interactions; test choices are mechanical fixtures, not geographic approval. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.cwd(),puzzles=['l1','l2'].flatMap(b=>JSON.parse(fs.readFileSync(`data/import-staging/${b}-staging.json`)).puzzles);
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.css':'text/css','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),release=url.pathname.startsWith('/release/');
 const base=path.join(root,release?'dist':''),file=path.resolve(base,'.'+decodeURIComponent(release?url.pathname.slice(8):url.pathname));
 const actual=url.pathname.endsWith('/')?path.join(file,'index.html'):file;
 if(!actual.startsWith(base+path.sep)||!fs.existsSync(actual)||!fs.statSync(actual).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('content-type',mime[path.extname(actual)]||'application/octet-stream');res.end(fs.readFileSync(actual));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`,errors=[];
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']}:{})});
 const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true,acceptDownloads:true});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const open=async()=>{await page.goto(url+'/tools/review-import.html');await page.waitForSelector('#workspace:not([hidden])')};
 await open();
 assert.match(await page.locator('#globalProgress').innerText(),/география подтверждена 0\/187/);
 let arrows=0;
 for(let i=0;i<puzzles.length;i++){
  await page.locator('#puzzleList button').nth(i).click();
  const n=await page.locator('#mapArrows line').count();assert.equal(n,puzzles[i].arrowCount);arrows+=n;
  assert.equal(await page.locator('#mapArrows polygon').count(),n);
  await page.waitForFunction(()=>document.querySelector('#mapImage').complete&&document.querySelector('#mapImage').naturalWidth>0);
  assert(await page.locator('#mapImage').evaluate(img=>img.complete&&img.naturalWidth>0),'source map loads');
 }
 assert.equal(arrows,55);
 await page.locator('#puzzleList button').first().click();
 const p=puzzles[0],repeated=p.clues.find(c=>!c.markerId),unique=p.clues.find(c=>c.markerId);
 const choose=async c=>page.locator('#clues .clue').nth(c.position-1).click();
 await choose(repeated);await page.locator(`[data-marker-id="${repeated.candidateMarkerIds[0]}"]`).click();
 await choose(repeated);await page.locator('#confirmSelected').click();
 await choose(unique);await page.locator('#confirmSelected').click();
 await page.reload();await page.waitForSelector('#workspace:not([hidden])');
 assert.match(await page.locator('#globalProgress').innerText(),/география подтверждена 2\/187/);
 const downloadPromise=page.waitForEvent('download');await page.locator('#save').click();
 const download=await downloadPromise,payload=JSON.parse(fs.readFileSync(await download.path()));
 assert.equal(payload.version,2);assert.equal(payload.assignments[p.id][repeated.position],repeated.candidateMarkerIds[0]);
 await choose(unique);await page.locator('#clearSelected').click();
 assert.match(await page.locator('#globalProgress').innerText(),/география подтверждена 1\/187/);
 const upload=async data=>{await page.locator('#restore').setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.waitForFunction(()=>document.querySelector('#restore').value==='')};
 await upload(payload);assert.match(await page.locator('#globalProgress').innerText(),/география подтверждена 2\/187/);
 const before=await page.evaluate(()=>localStorage.getItem('geowords-import-review-v2'));
 const stale=structuredClone(payload);stale.confirmations[p.id][unique.position].clueText='changed';await upload(stale);
 assert.match(await page.locator('#message').innerText(),/Ошибка импорта/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('geowords-import-review-v2')),before,'failed import is atomic');
 await upload({...payload,version:1});assert.match(await page.locator('#globalProgress').innerText(),/география подтверждена 0\/187/);
 assert.match(await page.locator('#globalProgress').innerText(),/Сопоставлено 119\/187/);
 const blocked=await browser.newContext({viewport:{width:360,height:800}});
 await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('blocked')};Storage.prototype.getItem=()=>{throw Error('blocked')}});
 const blockedPage=await blocked.newPage();blockedPage.on('pageerror',e=>errors.push(e.message));
 await blockedPage.goto(url+'/tools/review-import.html');await blockedPage.waitForSelector('#workspace:not([hidden])');
 assert.match(await blockedPage.locator('#message').innerText(),/Хранилище недоступно/);
 await blockedPage.locator('#restore').setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
 await blockedPage.waitForFunction(()=>document.querySelector('#restore').value==='');
 assert.match(await blockedPage.locator('#message').innerText(),/хранилище недоступно/i);
 await blocked.close();
 // Real clicks through all 21 pilot words. Accelerate only UI delays.
 const game=await browser.newContext({viewport:{width:360,height:800},hasTouch:true});
 await game.addInitScript(()=>{const later=window.setTimeout;window.setTimeout=(fn,ms,...args)=>later(fn,ms<=1500?10:ms,...args)});
 const gp=await game.newPage();gp.on('pageerror',e=>errors.push(e.message));await gp.goto(url+'/release/');
 await gp.locator('#riversBtn').click();
 for(let step=0;step<3;step++){
  for(let word=0;word<7;word++){
   if(word===0)await gp.locator('#factsScreen.active #factsContinueBtn').click();
   await gp.locator('#gameScreen.active').waitFor();
   const puzzle=await gp.evaluate(()=>{
    const c=window.GEOWORD_COURSES.rivers,raw=JSON.parse(localStorage.getItem('geowords_rivers_progress_v2')||'null');
    const s=window.GEOWORD_CORE.normalizeProgress(raw,c),id=window.GEOWORD_CORE.nextAuthoredPuzzleId(c,s);
    return id?window.GEOWORD_RIVERS_AUTHORED.find(p=>p.id===id):window.GEOWORD_CORE.generate(c,window.GEOWORD_DICTIONARY,s);
   });
   if(step===0&&word===0){
    const wrong=puzzle.markers.find(m=>m.id!==puzzle.clues[0].markerId);
    await gp.locator(`[data-marker-id="${wrong.id}"]`).click();assert.match(await gp.locator('#feedback').innerText(),/try another/);
   }
   for(let i=0;i<puzzle.clues.length;i++){
    await gp.waitForFunction(n=>document.querySelector('#clueNumber').textContent===String(n),i+1);
    await gp.locator(`[data-marker-id="${puzzle.clues[i].markerId}"]`).click();
    if(i<puzzle.clues.length-1)await gp.waitForFunction(()=>document.querySelector('#feedback').textContent==='');
   }
   if(word<6||step===2)await gp.locator('#finishScreen.active').waitFor();
   if(word<6){
    if(step===0&&word===1){await gp.reload();await gp.locator('#riversBtn').click()}
    else await gp.locator('#nextBtn').click();
   }
  }
 }
 const completed=await gp.evaluate(()=>localStorage.getItem('geowords_rivers_progress_v2'));
 const scores=JSON.parse(completed).steps;assert(Object.values(scores).every(s=>s.authoredSolved&&s.solvedWordIds.length===6));
 await gp.locator('#nextBtn').click();await gp.locator('#gameScreen.active').waitFor();
 assert.equal(await gp.evaluate(()=>localStorage.getItem('geowords_rivers_progress_v2')),completed,'review start adds no progress');
 await gp.locator('#backBtn').click();await gp.locator('#startBtn').click();await gp.locator('#factsContinueBtn').click();
 const mountain=await gp.evaluate(()=>window.GEOWORD_LEVELS[0]);
 for(const c of mountain.clues){await gp.locator(`[data-marker-id="${c.markerId}"]`).click();await gp.waitForTimeout(30)}
 await gp.locator('#finishScreen.active').waitFor();assert.equal(await gp.locator('#finishWord').innerText(),mountain.answer);
 assert.equal(await gp.evaluate(id=>localStorage.getItem('geowords_completed_'+id),mountain.id),'1');
 for(const internal of ['tools/review-import.html','tools/review-model.js','data/import-staging/l1-staging.json','data/authored-answer-index.js','engine/curriculum.js','data/import-staging/curriculum-draft.json','data/import-staging/facts-draft.json','data/import-staging/l1-catalog-draft.json','data/import-staging/review-status.json','docs/SOURCE_FACTS_DRAFT.md','docs/L1_CATALOG_DRAFT.md','tools/build_l1_catalog.mjs']){
  assert.equal((await gp.request.get(url+'/release/'+internal)).status(),404,'internal excluded: '+internal);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS browser 360px: 55 editor arrows, real reload/export/import, all-clue confirmations, legacy migration, blocked storage, 21 Rivers words, error correction, reload during practice, Mountains and release exclusion.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
