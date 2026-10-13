/* Real DOM interactions; test choices are mechanical fixtures, not geographic approval. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {generatorFixture} from './validate-curriculum-generator.mjs';
import {adaptCatalog,loadL1Sources} from '../tools/catalog-adapter.mjs';
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
 // Mechanical incomplete fixture, not the user's complete baseline.
 await context.addInitScript(()=>{if(!localStorage.getItem('geowords-import-review-v2'))localStorage.setItem('geowords-import-review-v2',JSON.stringify({version:1,generatedFrom:'author map review',sourceQuizCount:20,assignments:{}}))});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const open=async()=>{await page.goto(url+'/tools/review-import.html');await page.waitForSelector('#workspace:not([hidden])');await page.waitForSelector('#geoAnchor option',{state:'attached'})};
 await open();
 assert.match(await page.locator('#globalProgress').innerText(),/география подтверждена 0\/187/);
 let arrows=0;
 for(let i=0;i<puzzles.length;i++){
  await page.locator('#puzzleList button').nth(i).click();
  const n=await page.locator('#mapArrows line').count();assert.equal(n,puzzles[i].arrowCount);arrows+=n;
  assert.equal(await page.locator('#mapArrows polygon').count(),n);
  const sourceArrows=puzzles[i].markers.filter(m=>m.pointsTo);
  for(let j=0;j<sourceArrows.length;j++){
   const t=sourceArrows[j].pointsTo,polygon=await page.locator('#mapArrows polygon').nth(j).getAttribute('points');
   assert.equal(polygon,t.headPoints.map(p=>[p.x,p.y].map(v=>v.toFixed(2)).join(',')).join(' '),'renderer preserves source head polygon');
   assert.equal(Number(await page.locator('#mapArrows line').nth(j).getAttribute('x2')),t.shaftEnd.x);
   assert.equal(Number(await page.locator('#mapArrows line').nth(j).getAttribute('y2')),t.shaftEnd.y);
  }
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
 await blockedPage.waitForSelector('#geoAnchor option',{state:'attached'});
 await blockedPage.locator('#geoPlaces').selectOption(['place-north-america']);
 assert.match(await blockedPage.locator('#spatialMessage').innerText(),/Хранилище недоступно/);
 await blockedPage.locator('#learningText').fill('Memory-only fixture');assert.match(await blockedPage.locator('#learningMessage').innerText(),/Автосохранение недоступно/);
 await blockedPage.locator('#contentDefinition').fill('Memory-only vocabulary fixture');assert.match(await blockedPage.locator('#contentMessage').innerText(),/Автосохранение недоступно/);
 await blocked.close();
 // Independent spatial panel in the same editor; decisions below are synthetic.
 const spatialContext=await browser.newContext({viewport:{width:360,height:800},hasTouch:true,acceptDownloads:true});
 const sp=await spatialContext.newPage();sp.on('pageerror',e=>errors.push(e.message));
 await sp.goto(url+'/tools/review-import.html');await sp.waitForSelector('#geoAnchor option',{state:'attached'});
 assert.match(await sp.locator('#globalProgress').innerText(),/Сопоставлено 187\/187/,'fresh editor retains the 69 user decisions');
 assert(await sp.locator('#geoBackup').isHidden(),'recovery button only appears for incompatible saved work');
 await sp.locator('#geoApplyProposal').click();
 assert.deepEqual(await sp.locator('#geoPlaces').evaluate(s=>[...s.selectedOptions].map(o=>o.value)),['place-australia']);
 assert.match(await sp.locator('#geoProgress').innerText(),/0\/9/,'proposal does not approve geography');
 assert(await sp.locator('#geoApplyProposal').isDisabled(),'proposal cannot replace existing draft');
 await sp.reload();await sp.waitForSelector('#geoAnchor option',{state:'attached'});
 assert.deepEqual(await sp.locator('#geoPlaces').evaluate(s=>[...s.selectedOptions].map(o=>o.value)),['place-australia']);
 assert.match(await sp.locator('#geoReport').innerText(),/заблокирована/);
 await sp.locator('#geoPlaces').selectOption(['place-north-america']);await sp.locator('#geoComplete').check();await sp.locator('#geoConfirm').click();
 assert.match(await sp.locator('#geoProgress').innerText(),/1\/9/);
 assert.match(await sp.locator('#globalProgress').innerText(),/география подтверждена 0\/187/,'spatial approval does not create clue approval');
 await sp.reload();await sp.waitForSelector('#geoAnchor option',{state:'attached'});assert.match(await sp.locator('#geoProgress').innerText(),/1\/9/);
 const spatialDownload=sp.waitForEvent('download');await sp.locator('#geoExport').click();
 const exported=await spatialDownload,geoPayload=JSON.parse(fs.readFileSync(await exported.path()));
 assert.equal(geoPayload.generatedFrom,'spatial author review');assert.equal(geoPayload.puzzles[0].reviews[0].status,'approved');
 await sp.locator('#geoPlaces').selectOption(['place-africa']);assert.match(await sp.locator('#geoProgress').innerText(),/0\/9/);
 const geoUpload=async data=>{await sp.locator('#geoImport').setInputFiles({name:'geo.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await sp.waitForFunction(()=>document.querySelector('#geoImport').value==='')};
 await geoUpload(geoPayload);assert.match(await sp.locator('#geoProgress').innerText(),/1\/9/);
 const geoBefore=await sp.evaluate(()=>localStorage.getItem('geowords-spatial-review-v1'));
 const geoStale=structuredClone(geoPayload);geoStale.puzzles[0].reviews[0].sourceBinding.x++;await geoUpload(geoStale);
 assert.match(await sp.locator('#spatialMessage').innerText(),/Ошибка импорта/);assert.equal(await sp.evaluate(()=>localStorage.getItem('geowords-spatial-review-v1')),geoBefore);
 await geoUpload(payload);assert.match(await sp.locator('#spatialMessage').innerText(),/Ошибка импорта/);
 await sp.locator('#restore').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...payload,version:1}))});await sp.waitForFunction(()=>document.querySelector('#restore').value==='');
 assert.equal(await sp.evaluate(()=>localStorage.getItem('geowords-spatial-review-v1')),geoBefore,'legacy assignments do not erase spatial review');
 await sp.locator('#puzzleList button').nth(5).click();await sp.locator('#geoAnchor').selectOption('l1-06-glyph-02');
 await sp.locator('#geoPlaces').selectOption(['place-indian-ocean']);await sp.locator('#geoComplete').check();await sp.locator('#geoConfirm').click();
 assert.match(await sp.locator('#spatialMessage').innerText(),/конец стрелки/);
 await sp.locator('#geoChannel').selectOption('target');await sp.locator('#geoPlaces').selectOption(['place-madagascar']);await sp.locator('#geoComplete').check();await sp.locator('#geoConfirm').click();
 assert.match(await sp.locator('#geoProgress').innerText(),/1\/11/);
 await sp.locator('#geoRevoke').click();assert.match(await sp.locator('#geoProgress').innerText(),/0\/11/);
 await sp.locator('#puzzleList button').nth(10).click();assert(await sp.locator('#spatialPanel').isHidden());assert(await sp.locator('#spatialUnavailable').isVisible());
 await sp.locator('#puzzleList button').nth(3).click();await sp.locator('#geoAnchor').selectOption('l1-04-glyph-04');
 assert(await sp.locator('#geoApplyProposal').isDisabled(),'unknown coastal location cannot be filled by guessing');
 assert.match(await sp.locator('#geoProposalNotes').innerText(),/не утверждено/);
 await sp.locator('#puzzleList button').first().click();
 const exhaustive=structuredClone(geoPayload);
 for(const r of exhaustive.puzzles[0].reviews){r.status='approved';r.complete=true;r.evidence=structuredClone(r.sourceBinding);r.physical={places:[],regions:[],sides:[],between:[],hemispheres:[],boundaries:[]};r.target=null}
 exhaustive.puzzles[0].reviews[1].physical.places=['place-australia'];
 await geoUpload(exhaustive);assert.match(await sp.locator('#geoReport').innerText(),/НЕ совпадает с назначением/);
 assert(await sp.locator('#geoBackup').isHidden());
 assert.match(await sp.locator('#globalProgress').innerText(),/география подтверждена 0\/187/);
 assert(await sp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'spatial panel fits phone width');
 if(process.env.GEOWORDS_QA_SCREENSHOT)await sp.locator('#spatialPanel').screenshot({path:process.env.GEOWORDS_QA_SCREENSHOT});
 await spatialContext.close();
 // Explicit pedagogical decisions in the SAME editor. Mechanical fixture
 // confirmations here are discarded with the context, never source approvals.
 const learningContext=await browser.newContext({viewport:{width:360,height:800},acceptDownloads:true});
 const lp=await learningContext.newPage();lp.on('pageerror',e=>errors.push(e.message));
 const learningOpen=async()=>{await lp.goto(url+'/tools/review-import.html');await lp.waitForSelector('#learningStep-wordIds option',{state:'attached'});await lp.waitForSelector('#learningPanel:not([hidden])')};
 await learningOpen();assert.match(await lp.locator('#learningProgress').innerText(),/0\/23.*0\/10/);
 assert.match(await lp.locator('#learningSource').innerText(),/seven continents/);
 await lp.locator('#learningCopyFact').click();
 assert.match(await lp.locator('#learningFactStatus').innerText(),/pending/);
 assert(!(await lp.locator('#learningFactKnown-introducesPlaces').isChecked()),'source copy never guesses introduced places');
 await lp.locator('#learningText').fill('SYNTHETIC BROWSER REVIEW — mechanical fixture, not source approval.');
 await lp.locator('#learningFact-introducesPlaces').selectOption(['place-africa']);
 await lp.locator('#learningReviewer').fill('SYNTHETIC QA ONLY');await lp.locator('#learningFactChecked').check();
 await lp.locator('#learningConfirmFact').click();await lp.waitForFunction(()=>document.querySelector('#learningFactStatus').textContent.includes('подтверждено'));
 assert.match(await lp.locator('#learningProgress').innerText(),/1\/23.*0\/10/);
 const lessonDownload=async()=>{const promise=lp.waitForEvent('download');await lp.locator('#learningExport').click();return JSON.parse(fs.readFileSync(await (await promise).path()))};
 const learningPayload=await lessonDownload();assert.equal(learningPayload.records.length,33);
 const factDecision=learningPayload.records.find(r=>r.key==='fact:f-l1-p06-continents');assert.equal(factDecision.status,'approved');
 assert.equal(adaptCatalog(loadL1Sources(),{learningReview:learningPayload}).curriculum,null,'browser decisions do not bypass other editorial gates');
 await learningOpen();assert.match(await lp.locator('#learningProgress').innerText(),/1\/23/);
 await lp.locator('#learningText').fill('Edited mechanical fixture');assert.match(await lp.locator('#learningFactStatus').innerText(),/pending/);
 const learningUpload=async payload=>{await lp.locator('#learningImport').setInputFiles({name:'learning.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});await lp.waitForFunction(()=>document.querySelector('#learningImport').value==='')};
 const rawLearning=await lp.evaluate(()=>localStorage.getItem('geowords-l1-learning-review-v1'));
 const invalidLearning=structuredClone(learningPayload);invalidLearning.records[0].decision.text.en='Stale confirmed text';
 await learningUpload(invalidLearning);assert.match(await lp.locator('#learningMessage').innerText(),/Ошибка импорта/);
 assert.equal(await lp.evaluate(()=>localStorage.getItem('geowords-l1-learning-review-v1')),rawLearning,'invalid learning import is atomic');
 await learningUpload(learningPayload);assert.match(await lp.locator('#learningFactStatus').innerText(),/подтверждено/);
 await lp.locator('#learningCopyStep').click();assert.match(await lp.locator('#learningStepStatus').innerText(),/pending/);
 assert(!(await lp.locator('#learningStepKnown-requiresFacts').isChecked()),'null prerequisite is distinct from []');
 for(const field of ['requiresFacts','introducedPlaces','focusPlaceIds'])await lp.locator('#learningStepKnown-'+field).check();
 await lp.locator('#learningReviewer').fill('SYNTHETIC QA ONLY');await lp.locator('#learningStepChecked').check();await lp.locator('#learningConfirmStep').click();
 await lp.waitForFunction(()=>document.querySelector('#learningStepStatus').textContent.includes('подтверждён'));
 await lp.locator('#learningPanel details').last().locator('summary').click();
 assert.match(await lp.locator('#learningReport').innerText(),/Факт не утверждён/,'unapproved facts block learning order preview');
 await lp.locator('#learningStep-unlockAfter').selectOption(['f-l1-p06-continents']);assert.match(await lp.locator('#learningStepStatus').innerText(),/pending/);
 await lp.locator('#learningFact').selectOption('f-l1-p10-oceans-left');await lp.locator('#learningPanel details').first().locator('summary').click();assert.match(await lp.locator('#learningCaveatSource').innerText(),/salinity/);
 await lp.locator('#learningCopyFact').click();await lp.locator('#learningText').fill('Keep edited draft');await lp.locator('#learningCopyFact').click();
 assert.equal(await lp.locator('#learningText').inputValue(),'Keep edited draft','proposal cannot overwrite existing work');
 assert(await lp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'learning panel fits 360px');
 if(process.env.GEOWORDS_LEARNING_SCREENSHOT)await lp.locator('#learningPanel').screenshot({path:process.env.GEOWORDS_LEARNING_SCREENSHOT});
 await lp.locator('#puzzleList button').nth(10).click();assert(await lp.locator('#learningPanel').isHidden());assert(await lp.locator('#learningUnavailable').isVisible());
 const badLearningRaw=JSON.stringify({...learningPayload,courseId:'foreign'});
 await lp.evaluate(raw=>localStorage.setItem('geowords-l1-learning-review-v1',raw),badLearningRaw);await learningOpen();assert(await lp.locator('#learningBackup').isVisible());
 await lp.locator('#learningText').fill('Protected memory-only draft');assert.equal(await lp.evaluate(()=>localStorage.getItem('geowords-l1-learning-review-v1')),badLearningRaw,'incompatible local work is protected');
 const recoveryPromise=lp.waitForEvent('download');await lp.locator('#learningBackup').click();assert.equal(fs.readFileSync(await (await recoveryPromise).path(),'utf8'),badLearningRaw);
 await learningUpload(learningPayload);assert(await lp.locator('#learningBackup').isHidden());
 await learningContext.close();
 // Same workspace, separate phrase/vocabulary approvals. No source decisions
 // from this mechanical fixture are committed to the real catalog.
 const contentContext=await browser.newContext({viewport:{width:360,height:800},acceptDownloads:true}),cp=await contentContext.newPage();cp.on('pageerror',e=>errors.push(e.message));
 const contentOpen=async()=>{await cp.goto(url+'/tools/review-import.html');await cp.waitForSelector('#contentPanel:not([hidden])');await cp.waitForSelector('#contentWord option',{state:'attached'})};
 await contentOpen();assert.match(await cp.locator('#contentProgress').innerText(),/0\/63.*0\/60/);assert.match(await cp.locator('#contentWordOrigin').innerText(),/Codex/);
 await cp.locator('#contentCopyDescriptor').click();assert.match(await cp.locator('#contentDescriptorStatus').innerText(),/pending/);assert.equal(await cp.locator('#content-placeId').inputValue(),'place-australia');
 await cp.locator('#contentReviewer').fill('SYNTHETIC QA ONLY');await cp.locator('#contentConfirmDescriptor').click();await cp.waitForFunction(()=>document.querySelector('#contentMessage').textContent.includes('все содержательные'));
 for(const check of ['meaning','independentPhrase','dependencies'])await cp.locator('#contentCheck-descriptor-'+check).check();
 await cp.locator('#contentConfirmDescriptor').click();await cp.waitForFunction(()=>document.querySelector('#contentDescriptorStatus').textContent.includes('подтверждены'));
 await cp.locator('#contentCopyWord').click();assert.match(await cp.locator('#contentWordStatus').innerText(),/pending/);
 await cp.locator('#contentDefinition').fill('SYNTHETIC definition fixture — not an author approval.');
 for(const check of ['meaning','ageSuitable','guessability'])await cp.locator('#contentCheck-word-'+check).check();
 await cp.locator('#contentConfirmWord').click();await cp.waitForFunction(()=>document.querySelector('#contentWordStatus').textContent.includes('подтверждены'));
 const downloadContent=async()=>{const p=cp.waitForEvent('download');await cp.locator('#contentExport').click();return JSON.parse(fs.readFileSync(await (await p).path()))};
 const contentPayload=await downloadContent();assert.equal(contentPayload.records.length,123);assert.equal(contentPayload.records.filter(r=>r.status==='approved').length,2);
 const compiledContent=adaptCatalog(loadL1Sources(),{contentReview:contentPayload});assert.equal(compiledContent.curriculum,null);assert(!compiledContent.blockers.some(b=>b.code==='INVALID_CONTENT_REVIEW'));
 await contentOpen();assert.match(await cp.locator('#contentProgress').innerText(),/1\/63.*1\/60/);
 await cp.locator('#contentDefinition').fill('Edited mechanical definition');assert.match(await cp.locator('#contentWordStatus').innerText(),/pending/);
 const contentUpload=async data=>{await cp.locator('#contentImport').setInputFiles({name:'content.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await cp.waitForFunction(()=>document.querySelector('#contentImport').value==='')};
 const contentRaw=await cp.evaluate(()=>localStorage.getItem('geowords-l1-content-review-v1')),staleContent=structuredClone(contentPayload);
 staleContent.records.find(r=>r.key==='word:atlas').decision.definition.en='Changed confirmed data';await contentUpload(staleContent);assert.match(await cp.locator('#contentMessage').innerText(),/Ошибка импорта/);assert.equal(await cp.evaluate(()=>localStorage.getItem('geowords-l1-content-review-v1')),contentRaw);
 await contentUpload(contentPayload);assert.match(await cp.locator('#contentWordStatus').innerText(),/подтверждены/);
 await cp.locator('#contentCopyWord').click();assert.equal(await cp.locator('#contentDefinition').inputValue(),'SYNTHETIC definition fixture — not an author approval.');
 await cp.locator('#contentPhrase').fill('Edited phrase fixture');assert.match(await cp.locator('#contentDescriptorStatus').innerText(),/pending/);
 await cp.locator('#contentOp').selectOption('region');assert(await cp.locator('#content-placeId').isVisible());assert(await cp.locator('#contentDirection').isVisible());await cp.locator('#contentDirection').selectOption('north');
 await cp.locator('#contentOp').selectOption('side');assert(await cp.locator('#content-oceanId').isVisible());await cp.locator('#content-oceanId').selectOption('place-pacific-ocean');await cp.locator('#content-sidePlaceId').selectOption('place-asia');
 await cp.locator('#contentOp').selectOption('between');await cp.locator('#content-placeIds').selectOption(['place-africa','place-asia']);
 await cp.locator('#contentOp').selectOption('hemisphere');await cp.locator('#contentHemisphere').selectOption(['north','east']);
 await cp.locator('#contentOp').selectOption('boundary');assert(await cp.locator('#contentQuery-boundary').isVisible());
 assert(await cp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'content panel fits 360px');
 if(process.env.GEOWORDS_CONTENT_SCREENSHOT)await cp.locator('#contentPanel').screenshot({path:process.env.GEOWORDS_CONTENT_SCREENSHOT});
 await cp.locator('#puzzleList button').nth(10).click();assert(await cp.locator('#contentPanel').isHidden());assert(await cp.locator('#contentUnavailable').isVisible());
 const incompatibleContent=JSON.stringify({...contentPayload,courseId:'foreign'});await cp.evaluate(raw=>localStorage.setItem('geowords-l1-content-review-v1',raw),incompatibleContent);await contentOpen();assert(await cp.locator('#contentBackup').isVisible());
 await cp.locator('#contentDefinition').fill('Protected memory-only draft');assert.equal(await cp.evaluate(()=>localStorage.getItem('geowords-l1-content-review-v1')),incompatibleContent);
 const contentRecovery=cp.waitForEvent('download');await cp.locator('#contentBackup').click();assert.equal(fs.readFileSync(await (await contentRecovery).path(),'utf8'),incompatibleContent);
 await contentUpload(contentPayload);assert(await cp.locator('#contentBackup').isHidden());await contentContext.close();
 // Browser API smoke for the new shared generator. Synthetic curriculum only;
 // no new game route and no source approvals are installed by this test.
 const apiContext=await browser.newContext({viewport:{width:360,height:800}});
 const apiPage=await apiContext.newPage();apiPage.on('pageerror',e=>errors.push(e.message));
 const loadApis=async()=>{await apiPage.goto(url+'/tools/review-import.html');await apiPage.waitForSelector('#geoAnchor option',{state:'attached'});for(const file of ['geowords.js','semantic.js','curriculum.js'])await apiPage.addScriptTag({url:url+'/engine/'+file})};
 await loadApis();
 const fixture=generatorFixture();
 const apiCreated=await apiPage.evaluate(({c,one})=>{
  const api=globalThis.GEOWORD_CURRICULUM;let state=api.newLearner(c);
  state=api.acknowledge(c,state,'fixture-course',one.id,'before').state;
  state=api.complete(c,state,'fixture-course',{id:one.authoredPuzzleId,courseId:'fixture-course',source:'authored'}).state;
  state=api.acknowledge(c,state,'fixture-course',one.id,'after').state;
  const result=api.generatePractice(c,state,'fixture-course',{variant:7});
  localStorage.setItem('synthetic-curriculum-qa',JSON.stringify({c,state:result.state,puzzle:result.puzzle}));
  return {kind:result.kind,fresh:result.puzzle.freshCount,letters:result.puzzle.markers.length};
 },fixture);
 assert.equal(apiCreated.kind,'generated');assert(apiCreated.fresh/apiCreated.letters>=.35);
 await loadApis();
 const apiRestored=await apiPage.evaluate(()=>{
  const api=globalThis.GEOWORD_CURRICULUM,{c,state:raw,puzzle}=JSON.parse(localStorage.getItem('synthetic-curriculum-qa'));
  const state=api.normalize(c,raw),valid=api.verifyPractice(c,state,'fixture-course',puzzle),done=api.complete(c,state,'fixture-course',puzzle);
  return {valid,count:done.count,credited:done.credited,duplicate:api.complete(c,done.state,'fixture-course',puzzle).credited,history:state.generationHistory.length};
 });
 assert.deepEqual(apiRestored,{valid:true,count:2,credited:true,duplicate:false,history:1});
 await apiContext.close();
 const incompatibleContext=await browser.newContext({viewport:{width:360,height:800},acceptDownloads:true});
 await incompatibleContext.addInitScript(value=>localStorage.setItem('geowords-spatial-review-v1',value),JSON.stringify(geoStale));
 const ip=await incompatibleContext.newPage();ip.on('pageerror',e=>errors.push(e.message));await ip.goto(url+'/tools/review-import.html');await ip.waitForSelector('#geoAnchor option',{state:'attached'});
 assert(await ip.locator('#geoBackup').isVisible());
 await ip.locator('#geoPlaces').selectOption(['place-africa']);assert.equal(await ip.evaluate(()=>localStorage.getItem('geowords-spatial-review-v1')),JSON.stringify(geoStale),'incompatible saved work is protected from autosave');
 const backupPromise=ip.waitForEvent('download');await ip.locator('#geoBackup').click();const backup=await backupPromise;
 assert.equal(fs.readFileSync(await backup.path(),'utf8'),JSON.stringify(geoStale),'raw incompatible work can be recovered');await incompatibleContext.close();
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
 for(const internal of ['tools/content-review-model.js','tools/review-content.js','docs/CONTENT_REVIEW.md','tools/learning-review-model.js','tools/review-learning.js','docs/LEARNING_REVIEW.md','tools/catalog-adapter.mjs','docs/CATALOG_ADAPTER.md','tools/review-import.html','tools/review-model.js','tools/review-spatial.js','tools/spatial-review-model.js','data/import-staging/l1-staging.json','data/import-staging/l1-spatial-observations.json','data/import-staging/l1-spatial-proposals.json','data/authored-answer-index.js','engine/curriculum.js','engine/spatial-semantics.js','data/import-staging/curriculum-draft.json','data/import-staging/facts-draft.json','data/import-staging/l1-catalog-draft.json','data/import-staging/l1-spatial-review-draft.json','data/import-staging/review-status.json','docs/SOURCE_FACTS_DRAFT.md','docs/L1_CATALOG_DRAFT.md','docs/SPATIAL_SEMANTICS.md','tools/build_l1_catalog.mjs','tools/build_l1_spatial_review.mjs','tools/build_l1_spatial_proposals.mjs']){
  assert.equal((await gp.request.get(url+'/release/'+internal)).status(),404,'internal excluded: '+internal);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS browser 360px: L1 phrase/vocabulary and facts/order approvals, reload, atomic import/recovery and null vs [], shared generator API reload/credit on synthetic data, retained user baseline, spatial review, 55 exact arrows, legacy import, blocked storage, 21 Rivers words, Mountains and release exclusion.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
