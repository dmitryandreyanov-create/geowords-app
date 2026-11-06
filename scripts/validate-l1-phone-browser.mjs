import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {buildPhoneL1} from '../tools/build-l1-phone.mjs';
const root=path.resolve('dist'),p=buildPhoneL1(),errors=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true,acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.address().port;await page.goto(url);await page.clock.install();await page.locator('#l1Btn').click();
 await page.locator('#factsContinueBtn').click();
 for(const [i,step] of p.steps.entries())for(const [j,q] of [step.authored,...step.practices].entries()){
  assert(await page.locator('#gameScreen').evaluate(e=>e.classList.contains('active')));assert.equal(await page.locator('#levelTitle').innerText(),q.title+' · '+q.unit);
  await page.waitForFunction(()=>document.querySelector('#mapImage').complete&&document.querySelector('#mapImage').naturalWidth>0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'phone overflow');
  let from=0;
  if(i===0&&j===0){
   await page.locator(`[data-marker-id="${q.clues[1].markerId}"]`).click();assert.match(await page.locator('#feedback').innerText(),/try another/);
   await page.locator(`[data-marker-id="${q.clues[0].markerId}"]`).click();await page.clock.runFor(500);
   await page.reload();await page.locator('#l1Btn').click();assert.equal(await page.locator('#progressText').innerText(),'1 / 9');from=1;
   await page.locator('#zoomIn').click();assert.equal(await page.locator('#resetZoom').innerText(),'125%');await page.locator('#resetZoom').click();
  }
  for(const clue of q.clues.slice(from)){await page.locator(`[data-marker-id="${clue.markerId}"]`).click();await page.clock.runFor(600)}
  assert(await page.locator('#finishScreen').evaluate(e=>e.classList.contains('active')));assert.equal(await page.locator('#finishWord').innerText(),q.answer);
  if(i===0&&j===1){const saved=await page.evaluate(()=>localStorage.getItem('geowords_l1_phone_trial_v1'));await page.locator('#replayBtn').click();for(const clue of q.clues){await page.locator(`[data-marker-id="${clue.markerId}"]`).click();await page.clock.runFor(600)}assert.equal(await page.evaluate(()=>localStorage.getItem('geowords_l1_phone_trial_v1')),saved)}
  if(j===6){await page.clock.runFor(1500);if(i===0){await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await page.locator('#l1Btn').click();await page.waitForFunction(()=>document.querySelector('#mapImage').complete&&document.querySelector('#mapImage').naturalWidth>0);await context.setOffline(false)}}
  else await page.locator('#nextBtn').click();
 }
 assert.equal(await page.locator('#finishWord').innerText(),'LEVEL 1 COMPLETE');await page.locator('#homeBtn').click();assert.match(await page.locator('#l1Progress').innerText(),/70\/70/);
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('geowords_completed_')||k.startsWith('geowords_rivers_progress')).length),0,'trial never credits other games');
 assert.deepEqual(errors,[]);console.log('PASS phone PWA 360px: all 70 words, original-first 1+6, correction, partial reload, replay without credit, zoom, automatic next steps and offline reload.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
