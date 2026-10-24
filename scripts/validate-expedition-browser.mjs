/* Expedition regression at iPhone width; local fixtures never change editorial approvals. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd();
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(u.pathname);
  const resolved=path.resolve(root,'.'+pathname);
  const file=pathname.endsWith('/')?path.join(resolved,'index.html'):resolved;
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'};
  res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{
    executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,
    args:['--no-sandbox','--disable-dev-shm-usage']
  }:{})});
  const base='http://127.0.0.1:'+server.address().port;
  async function makePage(lang){
    const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true});
    await context.addInitScript(value=>localStorage.setItem('geowords_expedition_v1',JSON.stringify({
      lang:value,done:{'u1-l1':true,'u1-l2':true,'u1-final':true},
      introSeen:true,learned:['north','south','east','west','equator','prime-meridian'],recent:[]
    })),lang);
    const page=await context.newPage();
    await page.goto(base+'/app/');
    await page.waitForSelector('[data-step="u1-final"]');
    return {page,context};
  }
  const ru=await makePage('ru');
  // Units 2–4 are open as drafts for the author's review (PR #43) and are labelled so on the trail.
  assert.match(await ru.page.locator('.path').innerText(),/черновик уроков/i);
  await ru.page.locator('[data-step="u2-l1"]').click();
  assert.equal(await ru.page.locator('.sheet [data-a="go"]').count(),1,'unit 2 opens after the unit 1 final');
  await ru.page.locator('.sheet [data-a="no"]').click();
  await ru.page.locator('[data-step="u1-final"]').click();
  assert.equal(await ru.page.locator('.sheet [data-a="practice"]').count(),1,
    'approved short RU review words are available after unit 1');
  const seen=[];
  for(let i=0;i<3;i++){
    await ru.page.locator('.sheet [data-a="practice"]').click();
    await ru.page.waitForSelector('.gw-clue');
    const p=await ru.page.evaluate(()=>window.__gwPuzzle);
    assert(['ШИРОТА','АЗИМУТ'].includes(p.answer),'review uses approved short vocabulary');
    assert.equal(p.kind,'practice');
    assert.equal(new Set(p.markers.map(m=>m.id)).size,[...p.answer].length);
    assert.equal(new Set(p.clues.map(c=>c.position)).size,[...p.answer].length);
    assert(p.clues.every(c=>!c.text.toUpperCase().includes(p.answer)));
    if(seen.length)assert.notEqual(p.answer,seen.at(-1),'repeat must select another word when possible');
    seen.push(p.answer);
    await ru.page.locator('.l-x').click();
    await ru.page.locator('.sheet [data-a="q"]').click();
    await ru.page.locator('[data-step="u1-final"]').click();
  }
  await ru.page.locator('.sheet [data-a="go"]').click();
  await ru.page.waitForSelector('.gw-clue');
  assert.equal(await ru.page.evaluate(()=>window.__gwPuzzle.answer),'ЗЕНИТ',
    'explicit final replay still uses the approved authored puzzle');
  await ru.context.close();
  // Actual final completion (not a prefilled done flag) must unlock the first lesson of unit 2.
  const flow=await makePage('ru');
  await flow.page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('geowords_expedition_v1'));
    delete s.done['u1-final'];
    localStorage.setItem('geowords_expedition_v1',JSON.stringify(s));
  });
  await flow.page.reload();
  await flow.page.locator('[data-step="u1-final"]').click();
  await flow.page.locator('.sheet [data-a="go"]').click();
  await flow.page.waitForSelector('.gw-clue');
  const final=await flow.page.evaluate(()=>window.__gwPuzzle);
  assert.equal(final.answer,'ЗЕНИТ');
  assert.equal(final.stepId,'u1-final');
  for(let i=0;i<final.clues.length;i++){
    const c=final.clues[i];
    await flow.page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());
    await flow.page.waitForFunction(count=>document.querySelectorAll('.mk.done').length>=count,i+1);
    if(i<final.clues.length-1)await flow.page.waitForTimeout(370);
  }
  await flow.page.locator('.screen.done [data-a="next"]').waitFor({timeout:8000});
  assert.equal(await flow.page.evaluate(()=>JSON.parse(localStorage.getItem('geowords_expedition_v1')).done['u1-final']),true);
  await flow.page.reload();
  await flow.page.locator('[data-a="continue-unit-2"]').waitFor();
  assert.match(await flow.page.locator('section.home').innerText(),/2026.10.24-u2-b/);
  await flow.page.locator('[data-a="continue-unit-2"]').click();
  assert.equal(await flow.page.locator('.sheet [data-a="go"]').count(),1);
  await flow.page.locator('.sheet [data-a="go"]').click();
  await flow.page.waitForFunction(()=>window.__gwTask?.k==='introObj'&&window.__gwTask?.id==='asia');
  assert.equal(await flow.page.evaluate(()=>window.__gwTask.id),'asia');
  await flow.context.close();
  const en=await makePage('en');
  await en.page.locator('[data-step="u1-final"]').click();
  assert.equal(await en.page.locator('.sheet [data-a="practice"]').count(),0,
    'no English review word fits six learned places in unit 1');
  assert.match(await en.page.locator('.sheet').innerText(),/next units/i);
  await en.page.locator('.sheet [data-a="go"]').click();
  await en.page.waitForSelector('.gw-clue');
  assert.equal(await en.page.evaluate(()=>window.__gwPuzzle.answer),'ZENITH');
  await en.context.close();
  console.log('PASS Expedition: real final unlocks unit 2 across reload; jump link works; RU review rotation and EN gating');
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
