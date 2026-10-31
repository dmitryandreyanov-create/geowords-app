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
  async function makePage(lang,done={'u1-l1':true,'u1-l2':true,'u1-practice':true,'u1-final':true}){
    const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true});
    await context.addInitScript(([value,doneSteps])=>{if(sessionStorage.getItem('fixture'))return;sessionStorage.setItem('fixture','1');localStorage.setItem('geowords_expedition_v1',JSON.stringify({
      lang:value,done:doneSteps,
      introSeen:true,learned:['north','south','east','west','equator','prime-meridian'],recent:[]
    }))},[lang,done]);
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
  assert.match(await flow.page.locator('section.home').innerText(),/2026.10.31-asia-6c/);
  await flow.page.locator('[data-a="continue-unit-2"]').click();
  assert.equal(await flow.page.locator('.sheet [data-a="go"]').count(),1);
  await flow.page.locator('.sheet [data-a="go"]').click();
  await flow.page.waitForFunction(()=>window.__gwTask?.k==='introObj'&&window.__gwTask?.id==='asia');
  assert.equal(await flow.page.evaluate(()=>window.__gwTask.id),'asia');
  await flow.context.close();
  // Mandatory unit practice (Svetlana, 24.10.2026): the unit final stays locked until 6 practice GeoWords are solved.
  const gate=await makePage('ru',{'u1-l1':true,'u1-l2':true});
  await gate.page.locator('[data-step="u1-final"]').click();
  assert.equal(await gate.page.locator('.sheet [data-a="go"]').count(),0,'unit final is locked before the unit practice');
  await gate.page.locator('.sheet button').click();
  await gate.page.locator('[data-step="u1-practice"]').click();
  await gate.page.locator('.sheet [data-a="go"]').click();
  const words=new Set();
  for(let w=0;w<6;w++){
    await gate.page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);
    const p=await gate.page.evaluate(()=>window.__gwPuzzle);
    assert.equal(p.stepId,'u1-practice');assert.equal(p.seq.total,6,'six practice words');words.add(p.answer);
    assert(p.clues.every(c=>!c.text.toUpperCase().replace(/Ё/g,'Е').includes(p.answer.replace(/Ё/g,'Е'))));
    for(const c of p.clues){await gate.page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await gate.page.waitForTimeout(370)}
    if(w<5)await gate.page.locator('[data-a="nextword"]').click();
    else await gate.page.locator('.screen.done [data-a="next"]').waitFor({timeout:8000});
  }
  assert.equal(words.size,6,'six different words');
  assert.equal(await gate.page.evaluate(()=>JSON.parse(localStorage.getItem('geowords_expedition_v1')).done['u1-practice']),true);
  await gate.page.locator('.screen.done [data-a="next"]').click();
  await gate.page.waitForSelector('.gw-clue');
  assert.equal(await gate.page.evaluate(()=>window.__gwPuzzle.answer),'ЗЕНИТ','practice leads to the unit final');
  await gate.context.close();
  const en=await makePage('en');
  await en.page.locator('[data-step="u1-final"]').click();
  assert.equal(await en.page.locator('.sheet [data-a="practice"]').count(),0,
    'no English review word fits six learned places in unit 1');
  assert.match(await en.page.locator('.sheet').innerText(),/next units/i);
  await en.page.locator('.sheet [data-a="go"]').click();
  await en.page.waitForSelector('.gw-clue');
  assert.equal(await en.page.evaluate(()=>window.__gwPuzzle.answer),'ZENITH');
  await en.context.close();
  // Block 1 review (data/review/block-1.json): lessons «Land», «Water», «Connections», the block final and the Speed Hunt challenge.
  const rv=await makePage('ru');
  await rv.page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('geowords_expedition_v1'));s.unlockAll=true;localStorage.setItem('geowords_expedition_v1',JSON.stringify(s))});
  await rv.page.reload();await rv.page.waitForSelector('[data-step="b-l1"]');
  const openStep=async id=>{await rv.page.goto(base+'/app/');await rv.page.locator('[data-step="'+id+'"]').click();await rv.page.locator('.sheet [data-a="go"]').click()};
  const waitTask=async k=>rv.page.waitForFunction(k=>window.__gwTask?.k===k,k);
  const tapUntilNext=async()=>{const box=await rv.page.locator('.task .map').boundingBox();
    for(const [fx,fy] of [[.5,.5],[.3,.4],[.7,.3],[.2,.2],[.55,.75]]){await rv.page.mouse.click(box.x+box.width*fx,box.y+box.height*fy);if(await rv.page.locator('.fb .btn').count())break}};
  await openStep('b-l2');
  const plan=await rv.page.evaluate(()=>window.__gwPlan.map(q=>q.k));
  assert.equal(plan.length,10,'review lesson: about ten tasks');
  assert.equal(plan.filter(k=>/^find/.test(k)).length,4);assert.equal(plan.filter(k=>/^what/.test(k)).length,3);
  assert.deepEqual(plan.slice(7),['label','write','write']);
  for(let i=0;i<7;i++){await rv.page.waitForFunction(()=>window.__gwTask);const q=await rv.page.evaluate(()=>window.__gwTask);
    if(await rv.page.locator('.choice').count())await rv.page.locator('.choice').first().click();else await tapUntilNext();
    await rv.page.locator('.fb .btn').click()}
  await waitTask('label');
  for(const id of await rv.page.$$eval('.lchip',b=>b.map(x=>x.dataset.o))){await rv.page.locator('.lchip[data-o="'+id+'"]').click();await rv.page.locator('.mk[data-id="'+id+'"]').evaluate(e=>e.click())}
  await rv.page.locator('.fb .btn').click();await rv.page.locator('.fb.ok').waitFor();await rv.page.locator('.fb .btn').click();
  await waitTask('write');
  for(const i of (await rv.page.$$eval('.wtile[data-i]',b=>b.map(x=>+x.dataset.i))).sort((a,b)=>a-b))await rv.page.locator('.wtile[data-i="'+i+'"]').click();
  await rv.page.locator('.fb.ok').waitFor();
  await openStep('b-l3');
  const plan3=await rv.page.evaluate(()=>window.__gwPlan);
  assert.deepEqual(plan3.map(q=>q.k),['pairs','pairs','pairs','pairs','allAsia','allIndian','allAfrica','tf','tf','seaOcean']);
  assert.equal(plan3.at(-1).id,'caspian-sea','trap: the Caspian Sea belongs to no ocean');
  const noRowAligned=async()=>{const L=await rv.page.$$eval('.pbtn[data-s]',b=>b.map(x=>x.dataset.s)),R=await rv.page.$$eval('.pbtn[data-r]',b=>b.map(x=>x.dataset.r));
    assert(L.every((id,i)=>id!==R[i]),'pairs: no answer stands opposite its own pair ('+L+' | '+R+')')};
  await noRowAligned();
  for(const id of await rv.page.$$eval('.pbtn[data-s]',b=>b.map(x=>x.dataset.s))){await rv.page.locator('.pbtn[data-s="'+id+'"]').click();await rv.page.locator('.pbtn[data-r="'+id+'"]').click()}
  await rv.page.locator('.fb.ok').waitFor();
  for(let i=1;i<4;i++){await rv.page.locator('.fb .btn').click();await waitTask('pairs');
    for(const id of await rv.page.$$eval('.pbtn[data-s]',b=>b.map(x=>x.dataset.s))){await rv.page.locator('.pbtn[data-s="'+id+'"]').click();await rv.page.locator('.pbtn[data-r="'+id+'"]').click()}
    await rv.page.locator('.fb.ok').waitFor()}
  await rv.page.locator('.fb .btn').click();await waitTask('allAsia');await tapUntilNext();await rv.page.locator('.fb .btn').click();
  if(await rv.page.locator('.fb .btn').count())await rv.page.locator('.fb .btn').click();
  // the block review counts the Gulf of Oman (section 5) among the seas and bays of the Indian Ocean
  await waitTask('allIndian');
  const wl=Object.fromEntries([...JSON.parse(fs.readFileSync('data/maps/world-waters.json')).waters,...JSON.parse(fs.readFileSync('data/maps/world-straits.json')).items].map(i=>[i.id,i.label]));
  for(const id of ['red-sea','arabian-sea','bay-of-bengal','gulf-of-oman']){const box=await rv.page.locator('.task .map').boundingBox();
    await rv.page.mouse.click(box.x+box.width*wl[id].x/100,box.y+box.height*wl[id].y/100)}
  await rv.page.locator('.fb .btn').click();await rv.page.locator('.fb.ok').waitFor();
  assert.match(await rv.page.locator('.fb').innerText(),/Оманский залив/);
  // Lesson 4 «Records»: 4 true/false, 3 pairs of 3, 2 find-by-clue, 1 what-is-it-by-clue; every record once; the clue never names the place
  await openStep('b-l4');
  const plan4=await rv.page.evaluate(()=>window.__gwPlan);const recs=JSON.parse(fs.readFileSync('data/review/block-1.json')).records.items;
  const count=f=>plan4.filter(f).length;
  assert.equal(plan4.length,10);assert.equal(count(q=>q.k==='recTf'),4);assert.equal(count(q=>q.k==='recPairs'),3);
  assert.equal(count(q=>/^find/.test(q.k)&&q.clue),2);assert.equal(count(q=>q.k==='recWhat'),1);
  const used=plan4.flatMap(q=>q.recs||[q.rec||recs.find(r=>r.clue===q.clue||r.clue.ru===q.clue?.ru)?.id]);
  assert.equal(new Set(used).size,16,'16 different records in one lesson');
  for(const q of plan4.filter(q=>q.k==='recPairs'))assert.equal(new Set(q.recs.map(id=>recs.find(r=>r.id===id).object)).size,3,'one record per place in a pairs task');
  const tfSides=plan4.filter(q=>q.k==='recTf').map(q=>q.side);assert(!tfSides.some((v,i)=>i>=2&&v===tfSides[i-1]&&v===tfSides[i-2]));
  for(let i=0;i<10;i++){await rv.page.waitForFunction(()=>window.__gwTask);const q=await rv.page.evaluate(()=>window.__gwTask);
    if(q.k==='recTf'){const r=recs.find(r=>r.id===q.rec);assert.equal(await rv.page.locator('.task .card .q').innerText(),r[q.side].ru);
      await rv.page.locator('.tfrow [data-o="'+q.side+'"]').click();await rv.page.locator('.fb.ok').waitFor();
      if(q.side==='false')assert.match(await rv.page.locator('.fb').innerText(),new RegExp(r.true.ru.slice(0,12)),'after a false statement the true one is shown')}
    else if(q.k==='recPairs'){assert.equal(await rv.page.locator('.pairs.rec .pbtn[data-r]').count(),3);await noRowAligned();
      for(const id of q.recs){await rv.page.locator('.pbtn[data-s="'+id+'"]').click();await rv.page.locator('.pbtn[data-r="'+id+'"]').click()}
      await rv.page.locator('.fb.ok').waitFor()}
    else if(q.k==='recWhat'){assert.equal(await rv.page.locator('.task .card .q').innerText(),q.clue.ru);
      await rv.page.locator('.choice[data-o="'+q.id+'"]').click();await rv.page.locator('.fb.ok').waitFor();
      assert.match(await rv.page.locator('.fb').innerText(),new RegExp(q.say.ru.slice(0,12)))}
    else{assert.equal(await rv.page.locator('.task .card .q').innerText(),q.clue.ru,'find by the clue, not by the name');await tapUntilNext()}
    await rv.page.locator('.fb .btn').click()}
  await openStep('b-final');await rv.page.waitForSelector('.gw-clue');
  const bf=await rv.page.evaluate(()=>window.__gwPuzzle);
  assert.equal(bf.answer,'ПУТЕШЕСТВЕННИК');assert.equal(bf.kind,'block');
  for(const c of bf.clues){await rv.page.locator('.mk[data-id="'+c.markerId+'"]').first().evaluate(e=>e.click());await rv.page.waitForTimeout(370)}
  await rv.page.locator('.screen.done [data-a="next"]').waitFor({timeout:8000});
  assert.match(await rv.page.locator('.screen.done').innerText(),/Блок пройден/);
  await rv.page.locator('.screen.done [data-a="next"]').click();await rv.page.waitForSelector('.hunt-name');
  // Speed Hunt: a tap on the label point of a continent or ocean scores; skipping moves on without a point
  const labels=Object.fromEntries(JSON.parse(fs.readFileSync('data/maps/world-continents-oceans.json')).items.map(i=>[i.id,i.label]));
  // a point on the drawn river counts for the river, not for the continent under it
  for(const r of JSON.parse(fs.readFileSync('data/maps/world-rivers.json')).rivers){const l=r.path[0];const [x,y]=l[Math.floor(l.length/2)];labels[r.id]={x,y}}
  let scored=0;
  for(let n=0;n<80&&scored<4;n++){const id=await rv.page.evaluate(()=>window.__gwHunt.target);
    if(!labels[id]){await rv.page.locator('[data-a="skip"]').click();continue}
    const box=await rv.page.locator('.task .map').boundingBox();await rv.page.mouse.click(box.x+box.width*labels[id].x/100,box.y+box.height*labels[id].y/100);
    await rv.page.waitForFunction(id=>window.__gwHunt.target!==id,id);scored++;
    assert.equal(await rv.page.evaluate(()=>window.__gwHunt.score),scored,'a tap on '+id+' scores')}
  assert.equal(scored,4);
  // Challenge GeoWords: after the minute, 3 app-generated words from three different sections, each with its definition
  await rv.page.locator('[data-a="cw"]').click({timeout:70000});
  for(let w=0;w<3;w++){await rv.page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n&&window.__gwPuzzle.kind==='challenge',w);
    const p=await rv.page.evaluate(()=>window.__gwPuzzle);assert.equal(p.seq.total,3);
    for(const c of p.clues){await rv.page.locator('.mk[data-id="'+c.markerId+'"]').first().evaluate(e=>e.click());await rv.page.waitForTimeout(370)}
    await rv.page.locator('.screen.done').waitFor({timeout:8000});assert.match(await rv.page.locator('.screen.done .defn').innerText(),/\S/,'definition shown');
    if(w<2)await rv.page.locator('[data-a="nextword"]').click()}
  assert.match(await rv.page.locator('.screen.done').innerText(),/Challenge пройден/);
  // the Challenge sheet also opens the GeoWords part directly
  await rv.page.locator('.screen.done [data-a="home"]').click();await rv.page.locator('[data-step="b-challenge"]').click();
  await rv.page.locator('.sheet [data-a="cw"]').click();await rv.page.waitForFunction(()=>window.__gwPuzzle?.kind==='challenge'&&window.__gwPuzzle.seq?.i===0);
  // generator rules (data/geowords/challenge-block-1-sample.json): 40 rounds checked without playing them
  const tpl=JSON.parse(fs.readFileSync('data/geowords/clue-templates.json'));
  const never=[['suez-canal','bosporus'],['suez-canal','dardanelles'],['strait-of-hormuz','gulf-of-oman'],['drake-passage','strait-of-magellan'],['antarctica','southern-ocean']];
  const rounds=await rv.page.evaluate(()=>[...Array(40)].map(()=>window.__gwChallengeRound()));const cwSec={};let cwRecs=0,cwLetters=0;
  for(const round of rounds){assert.equal(round.length,3);assert.equal(new Set(round.map(p=>p.section)).size,3,'three different sections');
    for(const P of round){const n=[...P.answer].length,ids=P.markers.map(m=>m.id.replace(/-(river|mouth|source)$/,''));cwSec[P.section]=1;
      assert.equal(P.markers.length,n);assert.equal(P.clues.length,n);
      for(const c of P.clues){const ord=tpl.ordinals.ru[c.position-1];assert(c.text.startsWith('Найди '+ord+' букву '),c.text);
        assert(!c.text.toUpperCase().replace(/Ё/g,'Е').includes(P.answer.replace(/Ё/g,'Е')),'answer inside a clue: '+c.text)}
      for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){const A=P.markers[a],B=P.markers[b];
        assert(Math.hypot(A.x-B.x,(A.y-B.y)*.55)>=5.4,'letters too close: '+A.id+' '+B.id);assert(ids[a]!==ids[b],'one object twice: '+ids[a])}
      for(const [a,b] of never)assert(!(ids.includes(a)&&ids.includes(b)),'never together: '+a+' + '+b);
      if(n>=15){assert(!P.markers.some(m=>/-(mouth|source)$/.test(m.id)),'15+: rivers only «on»');
        for(const [a,b] of [['ganges','indus'],['yangtze','huang-he']])assert(!(ids.includes(a)&&ids.includes(b)))}
      if(ids.includes('mediterranean-sea'))assert(!P.clues.some(c=>/солёной/.test(c.text)),'salty Red Sea phrase next to the Mediterranean');
      cwLetters+=n;cwRecs+=P.clues.filter(c=>/самом|самой|самым|самая/.test(c.text)).length}}
  assert.equal(Object.keys(cwSec).length,6,'all five sections and the challenge-extra words come up');
  assert(cwRecs/cwLetters>.05&&cwRecs/cwLetters<.4,"some, not most, places named by a record ("+(cwRecs/cwLetters).toFixed(2)+")");
  await rv.context.close();
  // Block 2 «Europe», section 1: every lesson played through on the Europe base map with right answers (tap on the label point / pick the name)
  {const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true});
    await context.addInitScript(()=>{if(sessionStorage.getItem('fixture'))return;sessionStorage.setItem('fixture','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:'ru',done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))});
    const page=await context.newPage();await page.goto(base+'/app/');await page.waitForSelector('[data-step="e1-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),/Европа на карте/);
    const eMap=JSON.parse(fs.readFileSync('data/maps/europe-overview.json')),eFacts=JSON.parse(fs.readFileSync('data/content/b2-section-1-facts.json'));
    const lab=Object.fromEntries(eMap.items.map(i=>[i.id,i.label]));
    const tapAt=async(pt)=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['e1-u1-l1','e1-u1-l2','e1-u2-l1','e1-u2-l2','e1-u2-l3','e1-u3-l1','e1-u3-l2','e1-u3-l3','e1-u3-l4'];const kinds=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<40;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);
        if(q.k!=='introEurope'&&q.k!=='introEuRec'&&q.k!=='allPen'){
          const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-blank.webp'),'Europe base map: '+src)}
        if(q.k==='introEurope'||q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),eFacts.items.find(i=>i.id===q.id).fact.ru);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else if(q.k==='allPen'){for(const it of eMap.items.filter(i=>i.kind==='peninsula'))await tapAt(it.label);
          await page.locator('.fb .btn').click();assert.equal(await page.locator('.fb.ok').count(),1,'all peninsulas found');await page.locator('.fb .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e1-u1-l1"]')}
    for(const k of ['introEurope','introEu','introEuRec','findEu','whatEu','allPen'])assert(kinds.has(k),'task kind played: '+k);
    // nested and neighbouring objects: inside the Barents Sea counts for the Arctic Ocean; the Kola Peninsula never counts for Scandinavia
    const judged=await page.evaluate(([b,k])=>{const sz={W:360,H:262};return [window.__gwEuOk('arctic-ocean',b.x,b.y,sz),window.__gwEuOk('scandinavian-peninsula',k.x,k.y,sz),window.__gwEuHit(k.x,k.y,sz)]},[lab['barents-sea'],lab['kola-peninsula']]);
    assert.deepEqual(judged,[true,false,'kola-peninsula']);
    // land on a phone (Svetlana, 26.10.2026): a tap in the sea just off Jutland is Jutland; off the coast of Sweden it is not
    const coast=await page.evaluate(()=>{const sz={W:360,H:262};return [window.__gwEuOk('jutland',46.6,52.63,sz),window.__gwEuOk('baltic-sea',46.6,52.63,sz),window.__gwEuOk('jutland',44.0,47.3,sz)]});
    assert.deepEqual(coast,[true,true,false]);
    // unit practice: six Europe GeoWords per unit, letters only on learned Europe objects, never an object with the one containing it
    const unitOf=Object.fromEntries(eMap.items.map(i=>[i.id,i.unit]));
    const IN={'north-sea':'atlantic-ocean','baltic-sea':'atlantic-ocean','barents-sea':'arctic-ocean','great-britain':'atlantic-ocean',ireland:'atlantic-ocean',iceland:'atlantic-ocean',sicily:'mediterranean-sea'};
    for(const u of [1,2,3]){await page.locator(`[data-step="e1-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<6;w++){await page.waitForFunction(n=>window.__gwPuzzle?.seq?.i===n,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,6,'six Europe practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-blank.webp'),'practice on the Europe map');
        for(const m of p.markers){assert(unitOf[m.id]<=u,`${p.answer}: ${m.id} is learned by unit ${u}`);assert(!p.markers.some(q=>IN[m.id]===q.id),`${p.answer}: ${m.id} with its container`)}
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<5)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,6,'six different words in unit '+u);await page.waitForSelector('[data-step="e1-u1-l1"]')}
    // approved finals (Svetlana, 26.10.2026): each plays on the Europe map exactly as approved
    const eGeo=JSON.parse(fs.readFileSync('data/geowords/b2-section-1.json')).puzzles;
    for(const [step,id] of [['e1-u1-final','b2-section-1-unit-1-ru'],['e1-u2-final','b2-section-1-unit-2-ru'],['e1-u3-final','b2-section-1-unit-3-ru'],['e1-final','b2-section-1-final-ru']]){
      const want=eGeo.find(p=>p.id===id);if(want?.approval?.status!=='approved')continue;
      await page.locator(`[data-step="${step}"]`).click();await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-blank.webp'),'final on the Europe map');
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e1-u1-l1"]')}
    // a draft final waits for approval: it does not open, and the trail goes on past it
    await page.locator('[data-step="e1-u1-final"]').click();
    if(!JSON.parse(fs.readFileSync('data/geowords/b2-section-1.json')).puzzles.some(p=>p.id==='b2-section-1-unit-1-ru'&&p.approval.status==='approved')){
      assert.equal(await page.locator('.sheet [data-a="go"]').count(),0,'a draft Europe final does not open');await page.locator('.sheet button').click();
      await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('geowords_expedition_v1'));s.unlockAll=false;s.done={'e1-u1-l1':true,'e1-u1-l2':true,'e1-u1-practice':true};localStorage.setItem('geowords_expedition_v1',JSON.stringify(s))});
      await page.reload();await page.waitForSelector('[data-step="e1-u2-l1"]');
      assert.equal(await page.locator('[data-step="e1-u2-l1"]').evaluate(el=>el.classList.contains('locked')),false,'unit 2 opens past the draft unit 1 final')}
    await context.close()}
  // Block 2 section 2 «Rivers of Europe»: every lesson on the rivers map with right answers (tap on the river's label point / pick the name),
  // unit practice on learned rivers and section-1 objects, approved finals as approved, a draft final never opens
  {const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true});
    await context.addInitScript(()=>{if(sessionStorage.getItem('fixture'))return;sessionStorage.setItem('fixture','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:'ru',done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))});
    const page=await context.newPage();await page.goto(base+'/app/');await page.waitForSelector('[data-step="e2-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),/Реки Европы/);
    const rMap=JSON.parse(fs.readFileSync('data/maps/europe-rivers.json')),eMap=JSON.parse(fs.readFileSync('data/maps/europe-overview.json'));
    const rFacts=JSON.parse(fs.readFileSync('data/content/b2-section-2-facts.json')),eFacts=JSON.parse(fs.readFileSync('data/content/b2-section-1-facts.json'));
    const lab=Object.fromEntries([...eMap.items,...rMap.items].map(i=>[i.id,i.id==='ural-river'?{x:81.4,y:57.08}:i.label]));
    const tapAt=async(pt)=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['e2-u1-l1','e2-u1-l2','e2-u2-l1','e2-u2-l2','e2-u3-l1','e2-u3-l2','e2-u4-l1','e2-u4-l2','e2-u4-l3','e2-u4-l4'];const kinds=new Set(),seen=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<60;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);if(q.id)seen.add(q.id);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-rivers.webp'),'rivers map: '+src);
        if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),(rFacts.items.find(i=>i.id===q.id)||eFacts.items.find(i=>i.id===q.id)).fact.ru);
          await page.locator('.fb .btn').click()}
        else if(q.k==='tipEu'){const tip=rFacts.items.find(i=>i.id===q.id);assert.equal(id,'e2-u2-l2','the memory trick comes in «Oder and Vistula»');
          assert.equal(await page.locator('.task .tip-phrase').innerText(),tip.name.ru);assert.equal((await page.locator('.task .mk.tip').allInnerTexts()).join(''),'РЭОВ','letters on the rivers, west to east');
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e2-u1-l1"]')}
    for(const k of ['introEu','introEuRec','tipEu','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    for(const it of rMap.items)assert(seen.has(it.id),'river practised: '+it.id);
    // a tap between two rivers counts for the nearer one
    const near=await page.evaluate(([a,b])=>{window.__gwEuSec(8);const sz={W:360,H:262};return [window.__gwEuOk('tagus',a.x,a.y,sz),window.__gwEuOk('douro',a.x,a.y,sz),window.__gwEuHit(b.x,b.y,sz)]},[lab.tagus,lab.douro]);
    assert.deepEqual(near,[true,false,'douro']);
    // unit practice: up to six words, letters on rivers learned by the unit or on section-1 objects, a river never inside an object of the same puzzle
    const unitOf=Object.fromEntries([...eMap.items.map(i=>[i.id,0]),...rMap.items.map(i=>[i.id,i.unit])]);
    const rDict=JSON.parse(fs.readFileSync('data/dictionary/b2-section-2.json'));
    for(const u of [1,2,3,4]){const n=Math.min(6,rDict.units[u-1].words.ru.filter(w=>w.role==='review'&&w.approval.status==='approved').length);
      await page.locator(`[data-step="e2-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<n;w++){await page.waitForFunction(k=>window.__gwPuzzle?.seq?.i===k,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,n,'practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-rivers.webp'),'practice on the rivers map');
        for(const m of p.markers)assert(unitOf[m.id]<=u,`${p.answer}: ${m.id} is learned by unit ${u}`);
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<n-1)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,n,'different words in unit '+u);await page.waitForSelector('[data-step="e2-u1-l1"]')}
    const rGeo=JSON.parse(fs.readFileSync('data/geowords/b2-section-2.json')).puzzles;
    for(const [step,id] of [['e2-u1-final','b2-section-2-unit-1-ru'],['e2-u2-final','b2-section-2-unit-2-ru'],['e2-u3-final','b2-section-2-unit-3-ru'],['e2-u4-final','b2-section-2-unit-4-ru'],['e2-final','b2-section-2-final-ru']]){
      const want=rGeo.find(p=>p.id===id);await page.locator(`[data-step="${step}"]`).click();
      if(want?.approval?.status!=='approved'){assert.equal(await page.locator('.sheet [data-a="go"]').count(),0,'a draft final does not open: '+step);await page.locator('.sheet button').click();continue}
      await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-rivers.webp'),'final on the rivers map');
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e2-u1-l1"]')}
    await context.close()}
  // Block 2 section 3 «Mountains of Europe»: every lesson on the mountains map with right answers (tap on the range's label point / pick the name);
  // a tap on a range never counts for its neighbour; finals stay closed until approved
  {const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true});
    await context.addInitScript(()=>{if(sessionStorage.getItem('fixture'))return;sessionStorage.setItem('fixture','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:'ru',done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))});
    const page=await context.newPage();await page.goto(base+'/app/');await page.waitForSelector('[data-step="e3-u1-l1"]');
    assert.match(await page.locator('.path').innerText(),/Горы Европы/);
    const mMap=JSON.parse(fs.readFileSync('data/maps/europe-mountains.json')),eMap=JSON.parse(fs.readFileSync('data/maps/europe-overview.json'));
    const mFacts=JSON.parse(fs.readFileSync('data/content/b2-section-3-facts.json')),eFacts=JSON.parse(fs.readFileSync('data/content/b2-section-1-facts.json'));
    const lab=Object.fromEntries([...eMap.items,...mMap.items].map(i=>[i.id,i.label]));
    const tapAt=async(pt)=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
    const lessons=['e3-u1-l1','e3-u1-l2','e3-u2-l1','e3-u2-l2','e3-u3-l1','e3-u3-l2','e3-u3-l3','e3-u3-l4'];const kinds=new Set(),seen=new Set();
    for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
      for(let n=0;n<60;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
        const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);if(q.id)seen.add(q.id);
        const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-mountains.webp'),'mountains map: '+src);
        if(q.k==='introEu'||q.k==='introEuRec'){
          if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),(mFacts.items.find(i=>i.id===q.id)||eFacts.items.find(i=>i.id===q.id)).fact.ru);
          await page.locator('.fb .btn').click()}
        else if(q.k==='findEu'){await tapAt(lab[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
          assert.equal(await page.locator('.fb.ok').count(),1,'a tap on the label of '+q.id+' is right');await page.locator('.fb .btn').click()}
        else if(q.k==='whatEu'){await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
        else throw new Error('unexpected task '+q.k)}
      await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e3-u1-l1"]')}
    for(const k of ['introEu','introEuRec','findEu','whatEu'])assert(kinds.has(k),'task kind played: '+k);
    for(const it of [...mMap.items,{id:'ural-mountains'}])assert(seen.has(it.id),'range practised: '+it.id);
    const wrong=await page.evaluate(([a,d,ap])=>{window.__gwEuSec(9);const sz={W:360,H:262};
      return [window.__gwEuOk('alps',d.x,d.y,sz),window.__gwEuOk('dinaric-alps',a.x,a.y,sz),window.__gwEuOk('apennines',a.x,a.y,sz),window.__gwEuHit(ap.x,ap.y,sz)]},[lab.alps,lab['dinaric-alps'],lab.apennines]);
    assert.deepEqual(wrong,[false,false,false,'apennines']);
    // unit practice: up to six words, letters on ranges learned by the unit or on section-1 objects (never the Ural River, not drawn here),
    // a range never with the land of the same name
    const mUnit=Object.fromEntries([...eMap.items.map(i=>[i.id,0]),...mMap.items.map(i=>[i.id,i.unit])]);
    const same={'scandinavian-mountains':'scandinavian-peninsula','balkan-mountains':'balkan-peninsula',apennines:'apennine-peninsula',pyrenees:'iberian-peninsula','scottish-highlands':'great-britain'};
    const mDict=JSON.parse(fs.readFileSync('data/dictionary/b2-section-3.json'));
    for(const u of [1,2,3]){const n=Math.min(6,mDict.units[u-1].words.ru.filter(w=>w.role==='review'&&w.approval.status==='approved').length);
      await page.locator(`[data-step="e3-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();const words=new Set();
      for(let w=0;w<n;w++){await page.waitForFunction(k=>window.__gwPuzzle?.seq?.i===k,w);const p=await page.evaluate(()=>window.__gwPuzzle);
        assert.equal(p.seq.total,n,'practice words in unit '+u);words.add(p.answer);
        const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-mountains.webp'),'practice on the mountains map');
        const ids=p.markers.map(m=>m.id);
        for(const id of ids){assert(id!=='ural-river'&&mUnit[id]<=u,`${p.answer}: ${id} is learned by unit ${u}`);assert(!ids.includes(same[id]),`${p.answer}: ${id} with ${same[id]}`)}
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        if(w<n-1)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
      assert.equal(words.size,n,'different words in unit '+u);await page.waitForSelector('[data-step="e3-u1-l1"]')}
    const mGeo=JSON.parse(fs.readFileSync('data/geowords/b2-section-3.json')).puzzles;
    for(const [step,id] of [['e3-u1-final','b2-section-3-unit-1-ru'],['e3-u2-final','b2-section-3-unit-2-ru'],['e3-u3-final','b2-section-3-unit-3-ru'],['e3-final','b2-section-3-final-ru']]){
      const want=mGeo.find(p=>p.id===id);await page.locator(`[data-step="${step}"]`).click();
      if(want?.approval?.status!=='approved'){assert.equal(await page.locator('.sheet [data-a="go"]').count(),0,'a draft final does not open: '+step);await page.locator('.sheet button').click();continue}
      await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
      const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
      const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-mountains.webp'),'final on the mountains map');
      for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
      await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e3-u1-l1"]')}
    await context.close()}
  // Block 2 section 4 «Countries and capitals: west and north»: hidden until its countries are approved; then every lesson on the capitals map
  // with right answers (tap on the country's label point or on the capital dot / pick the answer); a tap on a neighbour never counts
  {const cFacts=JSON.parse(fs.readFileSync('data/content/b2-section-4-facts.json')),cMap=JSON.parse(fs.readFileSync('data/maps/europe-countries.json'));
    const approved=cFacts.items.every(i=>i.approval?.status==='approved');
    const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true});
    await context.addInitScript(()=>{if(sessionStorage.getItem('fixture'))return;sessionStorage.setItem('fixture','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:'ru',done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))});
    const page=await context.newPage();await page.goto(base+'/app/');await page.waitForSelector('[data-step="e3-u1-l1"]');
    if(!approved)assert.equal(await page.locator('[data-step="e4-u1-l1"]').count(),0,'section 4 stays hidden until its countries are approved');
    else{assert.match(await page.locator('.path').innerText(),/Страны и столицы/);
      const lab=Object.fromEntries(cMap.items.map(i=>[i.id,i.label])),cap=Object.fromEntries(cMap.items.map(i=>[i.id,i.capital]));
      const tapAt=async(pt)=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
      const lessons=['e4-u1-l1','e4-u1-l2','e4-u2-l1','e4-u2-l2','e4-u3-l1','e4-u3-l2','e4-u3-l3','e4-u3-l4'];const kinds=new Set(),seen=new Set();
      for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
        for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
          const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);if(q.id)seen.add(q.id);
          const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-countries-rivers.webp'),'countries and rivers map: '+src);
          if(q.k==='introEu'||q.k==='introEuRec'){
            if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),cFacts.items.find(i=>i.id===q.id).fact.ru);
            // the zoom inset magnifies every country but Norway and Russia (big enough on the whole map), with a frame on the map
            if(q.k==='introEu'){const big=['norway','russia'].includes(q.id);assert.equal(await page.locator('.task .zoom-inset').count(),big?0:1,'zoom inset on the card of '+q.id);
              assert.equal(await page.locator('.task .zoom-frame').count(),big?0:1,'zoom frame for '+q.id)}
            await page.locator('.fb .btn').click()}
          else if(q.k==='findEu'||q.k==='findCap'){await tapAt(q.k==='findEu'?lab[q.id]:cap[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
            assert.equal(await page.locator('.fb.ok').count(),1,q.k+': a tap on '+q.id+' is right');await page.locator('.fb .btn').click()}
          else if(['whatEu','capOf','whatCap'].includes(q.k)){await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
          else throw new Error('unexpected task '+q.k)}
        await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e4-u1-l1"]')}
      for(const k of ['introEu','introEuRec','findEu','findCap'])assert(kinds.has(k),'task kind played: '+k);
      assert(kinds.has('capOf')||kinds.has('whatCap'),'a «which capital / which country» task was played');
      for(const it of cMap.items)assert(seen.has(it.id),'country practised: '+it.id);
      const wrong=await page.evaluate(([nl,be,lu,br])=>{window.__gwEuSec(10);const sz={W:360,H:262};
        return [window.__gwEuOk('belgium',nl.x,nl.y,sz),window.__gwEuOk('netherlands',be.x,be.y,sz),window.__gwEuOk('luxembourg-country',be.x,be.y,sz),window.__gwCapHit(br.x,br.y,sz)]},
        [lab.netherlands,lab.belgium,lab['luxembourg-country'],cap.belgium]);
      assert.deepEqual(wrong,[false,false,false,'brussels']);
      // unit practice and finals: letters at least 9% of the map width apart (Svetlana, 28.10.2026), one Benelux country at most,
      // never Crimea or the Ural River, a country never with the island or peninsula of the same name
      const benelux=['netherlands','belgium','luxembourg-country'],same={'united-kingdom':'great-britain','ireland-country':'ireland','iceland-country':'iceland'};
      const checkLetters=(p,what)=>{const ids=p.markers.map(m=>m.id);
        assert(ids.filter(id=>benelux.includes(id)).length<=1,what+': one Benelux country at most');
        for(const id of ids){assert(id!=='ural-river'&&id!=='crimean-peninsula',what+': '+id);assert(!ids.includes(same[id]),what+': '+id+' with '+same[id])}
        for(const a of p.markers)for(const b of p.markers)if(a!==b)assert(Math.hypot(a.x-b.x,(a.y-b.y)*1600/2200)>=9-1e-6,what+': '+a.id+' and '+b.id+' too close')};
      const cDict=JSON.parse(fs.readFileSync('data/dictionary/b2-section-4.json'));
      // the rivers of section 2 take letters too (Svetlana, 28.10.2026)
      const rivIds=new Set(JSON.parse(fs.readFileSync('data/maps/europe-rivers.json')).items.map(i=>i.id)),rivUsed=new Set();
      for(const u of [1,2,3]){const n=Math.min(6,cDict.units[u-1].words.ru.filter(w=>w.role==='review'&&w.approval.status==='approved').length);
        await page.locator(`[data-step="e4-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();
        for(let w=0;w<n;w++){await page.waitForFunction(k=>window.__gwPuzzle?.seq?.i===k,w);const p=await page.evaluate(()=>window.__gwPuzzle);
          const src=await page.locator('.gw .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-countries-rivers.webp'),'practice on the countries and rivers map');
          checkLetters(p,'practice '+p.answer);p.markers.forEach(m=>{if(rivIds.has(m.id))rivUsed.add(m.id)});
          for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
          if(w<n-1)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
        await page.waitForSelector('[data-step="e4-u1-l1"]')}
      assert(rivUsed.size>=5,'section 4 practice puts letters on rivers: '+[...rivUsed]);
      const cGeo=JSON.parse(fs.readFileSync('data/geowords/b2-section-4.json')).puzzles;
      for(const [step,id] of [['e4-u1-final','b2-section-4-unit-1-ru'],['e4-u2-final','b2-section-4-unit-2-ru'],['e4-u3-final','b2-section-4-unit-3-ru'],['e4-final','b2-section-4-final-ru']]){
        const want=cGeo.find(p=>p.id===id);checkLetters(want,id);assert(want.markers.filter(m=>rivIds.has(m.id)).length>=Math.floor(want.markers.length/3),id+': letters on rivers');await page.locator(`[data-step="${step}"]`).click();
        if(want.approval?.status!=='approved'){assert.equal(await page.locator('.sheet [data-a="go"]').count(),0,'a draft final does not open: '+step);await page.locator('.sheet button').click();continue}
        await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
        const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e4-u1-l1"]')}}
    await context.close()}
  // Block 2 section 5 «Countries and capitals: centre, south and east»: the same lessons on the capitals map with the rivers of section 2 drawn
  // over it; Crimea and Kosovo answer no country; GeoWords letters on countries and rivers, at least a third on rivers (Svetlana, 28.10.2026)
  {const cFacts=JSON.parse(fs.readFileSync('data/content/b2-section-5-facts.json')),cMap=JSON.parse(fs.readFileSync('data/maps/europe-countries-5.json'));
    const approved=cFacts.items.every(i=>i.approval?.status==='approved');
    const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true});
    await context.addInitScript(()=>{if(sessionStorage.getItem('fixture'))return;sessionStorage.setItem('fixture','1');
      localStorage.setItem('geowords_expedition_v1',JSON.stringify({lang:'ru',done:{},unlockAll:true,introSeen:true,learned:[],recent:[]}))});
    const page=await context.newPage();await page.goto(base+'/app/');await page.waitForSelector('[data-step="e3-u1-l1"]');
    if(!approved)assert.equal(await page.locator('[data-step="e5-u1-l1"]').count(),0,'section 5 stays hidden until its countries are approved');
    else{assert.match(await page.locator('.path').innerText(),/центр, юг и восток/);assert.match(await page.locator('.path').innerText(),/Деление на разделы учебное/);
      const lab=Object.fromEntries(cMap.items.map(i=>[i.id,i.label])),cap=Object.fromEntries(cMap.items.map(i=>[i.id,i.capital]));
      const tapAt=async(pt)=>{const box=await page.locator('.task .map').boundingBox();await page.mouse.click(box.x+box.width*pt.x/100,box.y+box.height*pt.y/100)};
      const lessons=['e5-u1-l1','e5-u1-l2','e5-u2-l1','e5-u2-l2','e5-u3-l1','e5-u3-l2','e5-u3-l3','e5-u3-l4'];const kinds=new Set(),seen=new Set();
      for(const id of lessons){await page.locator(`[data-step="${id}"]`).click();await page.locator('.sheet [data-a="go"]').click();
        for(let n=0;n<80;n++){await page.waitForFunction(()=>window.__gwTask||document.querySelector('.screen.done'));if(await page.locator('.screen.done').count())break;
          const q=await page.evaluate(()=>{const t=window.__gwTask;window.__gwTask=null;return t});kinds.add(q.k);if(q.id)seen.add(q.id);
          const src=await page.locator('.task .world img').first().getAttribute('src');assert(src.endsWith('assets/europe-countries-rivers.webp'),'countries and rivers map: '+src);
          if(q.k==='introEu'||q.k==='introEuRec'){
            if(q.k==='introEu')assert.equal(await page.locator('.task .card p').first().innerText(),cFacts.items.find(i=>i.id===q.id).fact.ru);
            // the zoom inset magnifies every country but Norway and Russia (big enough on the whole map), with a frame on the map
            if(q.k==='introEu'){const big=['norway','russia'].includes(q.id);assert.equal(await page.locator('.task .zoom-inset').count(),big?0:1,'zoom inset on the card of '+q.id);
              assert.equal(await page.locator('.task .zoom-frame').count(),big?0:1,'zoom frame for '+q.id)}
            await page.locator('.fb .btn').click()}
          else if(q.k==='findEu'||q.k==='findCap'){await tapAt(q.k==='findEu'?lab[q.id]:cap[q.id]);await page.waitForSelector('.fb.ok,.fb.bad');
            assert.equal(await page.locator('.fb.ok').count(),1,q.k+': a tap on '+q.id+' is right');await page.locator('.fb .btn').click()}
          else if(['whatEu','capOf','whatCap'].includes(q.k)){await page.locator(`.choice[data-o="${q.id}"]`).click();await page.locator('.fb.ok .btn').click()}
          else throw new Error('unexpected task '+q.k)}
        await page.locator('.screen.done').waitFor();await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e5-u1-l1"]')}
      for(const k of ['introEu','introEuRec','findEu','findCap'])assert(kinds.has(k),'task kind played: '+k);
      for(const it of cMap.items)assert(seen.has(it.id),'country practised: '+it.id);
      // Crimea and Kosovo answer no country; a tap on Germany is never Poland; the Tallinn and Helsinki dots are told apart
      const crimea=cMap.neutral.find(n=>n.id==='crimea').tapArea[0],kosovo=cMap.neutral.find(n=>n.id==='kosovo').tapArea[0];
      const mid=a=>({x:a.reduce((s,q)=>s+q[0],0)/a.length,y:a.reduce((s,q)=>s+q[1],0)/a.length});
      const res=await page.evaluate(([cr,ko,de,tl])=>{window.__gwEuSec(11);const sz={W:360,H:262};
        return [window.__gwEuOk('ukraine',cr.x,cr.y,sz),window.__gwEuOk('russia',cr.x,cr.y,sz),window.__gwEuOk('serbia',ko.x,ko.y,sz),window.__gwEuHit(cr.x,cr.y,sz),
          window.__gwEuOk('poland',de.x,de.y,sz),window.__gwCapHit(tl.x,tl.y,sz)]},[mid(crimea),mid(kosovo),lab.germany,cap.estonia]);
      assert.deepEqual(res,[false,false,false,null,false,'tallinn']);
      const crosses=Object.fromEntries(cMap.rivers.map(r=>[r.id,r.crosses]));
      const checkLetters=(p,what)=>{const ms=p.markers,n=ms.length,rv=id=>id.split('@')[0],isR=id=>!!crosses[rv(id)];
        assert(ms.filter(m=>isR(m.id)).length>=Math.ceil(n/3),what+': a third of the letters on rivers');
        const named=ms.map(m=>m.id.includes('@')?m.id.split('@')[1]:isR(m.id)?null:m.id).filter(Boolean);assert.equal(new Set(named).size,named.length,what+': a country named once');
        const rivs=ms.filter(m=>isR(m.id)).map(m=>rv(m.id));assert.equal(new Set(rivs).size,rivs.length,what+': one letter per river');
        for(const m of ms)if(isR(m.id)&&!m.id.includes('@'))for(const c of crosses[m.id])assert(!ms.some(q=>q.id===c),what+': '+m.id+' with '+c);
        for(const m of ms)assert(m.id!=='ural-river'&&m.id!=='crimean-peninsula',what+': '+m.id);
        for(const a of ms)for(const b of ms)if(a!==b)assert(Math.hypot(a.x-b.x,(a.y-b.y)*1600/2200)>=9-1e-6,what+': '+a.id+' and '+b.id+' too close')};
      const cDict=JSON.parse(fs.readFileSync('data/dictionary/b2-section-5.json'));
      for(const u of [1,2,3]){const n=Math.min(6,cDict.units[u-1].words.ru.filter(w=>w.role==='review'&&w.approval.status==='approved').length);
        await page.locator(`[data-step="e5-u${u}-practice"]`).click();await page.locator('.sheet [data-a="go"]').click();
        for(let w=0;w<n;w++){await page.waitForFunction(k=>window.__gwPuzzle?.seq?.i===k,w);const p=await page.evaluate(()=>window.__gwPuzzle);
          checkLetters(p,'practice '+p.answer);
          for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
          if(w<n-1)await page.locator('[data-a="nextword"]').click();else await page.locator('.screen.done [data-a="home"]').click()}
        await page.waitForSelector('[data-step="e5-u1-l1"]')}
      const cGeo=JSON.parse(fs.readFileSync('data/geowords/b2-section-5.json')).puzzles;
      for(const p of cGeo)checkLetters(p,p.id);
      for(const [step,id] of [['e5-u1-final','b2-section-5-unit-1-ru'],['e5-u2-final','b2-section-5-unit-2-ru'],['e5-u3-final','b2-section-5-unit-3-ru'],['e5-final','b2-section-5-final-ru']]){
        const want=cGeo.find(p=>p.id===id);await page.locator(`[data-step="${step}"]`).click();
        if(want.approval?.status!=='approved'){assert.equal(await page.locator('.sheet [data-a="go"]').count(),0,'a draft final does not open: '+step);await page.locator('.sheet button').click();continue}
        await page.locator('.sheet [data-a="go"]').click();await page.waitForSelector('.gw-clue');
        const p=await page.evaluate(()=>window.__gwPuzzle);assert.equal(p.answer,want.answer);assert.deepEqual(p.clues.map(c=>c.text),want.clues.map(c=>c.text));
        for(const c of p.clues){await page.locator('.mk[data-id="'+c.markerId+'"]').evaluate(el=>el.click());await page.waitForTimeout(370)}
        await page.locator('.screen.done [data-a="home"]').click();await page.waitForSelector('[data-step="e5-u1-l1"]')}}
    await context.close()}
  console.log('PASS Expedition: real final unlocks unit 2 across reload; jump link works; RU review rotation and EN gating; unit practice gates the final; block review lessons 1–4 (records), block final, Speed Hunt and Challenge GeoWords; block 2 section 1 «Europe on the map», section 2 «Rivers of Europe» lessons, unit practice and finals; section 3 «Mountains of Europe», section 4 «Countries and capitals: west and north» and section 5 «centre, south and east» lessons, unit practice and finals');
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
