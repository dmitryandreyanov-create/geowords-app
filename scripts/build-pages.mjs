import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Explicit release manifest. Never publish the repository root or author
// imports, answer keys, reviewer tools, source PDFs, or test fixtures.
const root=process.cwd();
const dist=path.join(root,'dist');
const named=[
  'index.html','styles.css','app.js','sw.js','manifest.webmanifest',
  'data/levels.js','data/dictionary.js','data/courses.js',
  'data/rivers-semantics.js','data/rivers-authored.js',
  'engine/geowords.js','engine/semantic.js',
  'game/fun.js','game/fun.css',
  'graphics/index.html','graphics/gallery.css','graphics/gallery.js','data/graphics-manifest.json',
  // PNG originals for the review gallery (not in the offline cache) and the small WebP copies the game uses.
  ...JSON.parse(fs.readFileSync(path.join(root,'data/graphics-manifest.json'),'utf8')).assets.filter(a=>a.status==='ready').flatMap(a=>[a.path,a.gamePath].filter(Boolean)),
  'data/l1-phone.js','engine/l1-phone.js',
  'assets/l1-trial/l1-clean-map-1.webp','assets/l1-trial/l1-clean-map-2.webp',
  'assets/icon-180.png','assets/icon-192.png','assets/icon-512.png',
  'assets/rivers-authored-1.webp','assets/rivers-authored-2.webp',
  'assets/rivers-authored-3.webp','assets/rivers-practice-step-3.webp',
  ...Array.from({length:11},(_,i)=>`assets/mountains-puzzle-${i+1}.webp`),
  // GeoWords «Экспедиция» app (section 1, unit 1 playable) and the approved data it reads.
  'app/index.html','app/app.css','app/app.js',
  'data/content/section-1-facts.json','data/content/section-1-records.json','data/content/section-1-relations.json',
  'data/geowords/section-1.json','data/dictionary/section-1.json','data/geowords/clue-templates.json',
  // Section 2 «Rivers of the world» (draft lessons) and the data it reads.
  'data/content/section-2-facts.json','data/content/section-2-records.json','data/geowords/section-2.json','data/dictionary/section-2.json',
  'data/review/block-1.json','data/content/section-4-facts.json','assets/intro/rivers-intro-en.webp','assets/intro/rivers-intro-ru.webp',
  // Section 3 «Mountains of the world» (draft lessons).
  'data/content/section-3-facts.json','data/content/section-3-records.json','data/geowords/section-3.json','data/dictionary/section-3.json',
  'assets/intro/mountains-intro-en.webp','assets/intro/mountains-intro-ru.webp',
  // Section 4 «Seas of the world» (draft lessons).
  'data/content/section-4-records.json','data/geowords/section-4.json','data/dictionary/section-4.json',
  // Section 5 «Straits and canals» (draft lessons).
  'data/content/section-5-facts.json','data/content/section-5-records.json','data/geowords/section-5.json','data/dictionary/section-5.json',
  // Block 1 review: block final GeoWords, its dictionary and the Challenge rules.
  'data/geowords/block-1.json','data/dictionary/block-1.json','data/challenge/block-1.json','data/geowords/challenge-block-1-sample.json',
  // Block 2 «Europe», section 1 «Europe on the map» (lessons); its outlines are data/maps/europe-overview.json (below).
  'data/content/b2-section-1-facts.json','data/content/b2-section-1-records.json','data/dictionary/b2-section-1.json','data/geowords/b2-section-1.json',
  // Block 2 section 2 «Rivers of Europe»; its river lines are data/maps/europe-rivers.json (below).
  'data/content/b2-section-2-facts.json','data/content/b2-section-2-records.json','data/dictionary/b2-section-2.json','data/geowords/b2-section-2.json',
  // Block 2 section 3 «Mountains of Europe»; its tap areas are data/maps/europe-mountains.json (below).
  'data/content/b2-section-3-facts.json','data/content/b2-section-3-records.json','data/dictionary/b2-section-3.json','data/geowords/b2-section-3.json',
  // Block 2 section 4 «Countries and capitals: west and north»; its outlines are data/maps/europe-countries.json, its capital dots data/maps/europe-capitals.json (below).
  'data/content/b2-section-4-facts.json','data/content/b2-section-4-records.json','data/dictionary/b2-section-4.json','data/geowords/b2-section-4.json',
  // Block 2 section 5 «Countries and capitals: centre, south and east»; its outlines and river points are data/maps/europe-countries-5.json (below).
  'data/content/b2-section-5-facts.json','data/content/b2-section-5-records.json','data/dictionary/b2-section-5.json','data/geowords/b2-section-5.json',
  // Block 2 review «Europe»: review texts, block-final GeoWords and its word, the Challenge rules.
  'data/review/b2-block.json','data/dictionary/b2-block.json','data/geowords/b2-block.json','data/challenge/b2-block.json',
  // Block 3 «Asia», section 1 «Asia on the map»; its outlines are data/maps/asia-overview.json (below).
  'data/content/b3-section-1-facts.json','data/content/b3-section-1-records.json','data/dictionary/b3-section-1.json','data/geowords/b3-section-1.json',
  'data/content/b3-section-2-facts.json','data/content/b3-section-2-records.json','data/dictionary/b3-section-2.json','data/geowords/b3-section-2.json','data/maps/asia-rivers.json',
  'data/content/b3-section-3-facts.json','data/content/b3-section-3-records.json','data/dictionary/b3-section-3.json','data/geowords/b3-section-3.json','data/maps/asia-lakes.json',
  'data/content/b3-section-4-facts.json','data/content/b3-section-4-records.json','data/dictionary/b3-section-4.json','data/geowords/b3-section-4.json','data/maps/asia-mountains.json',
  // Map lab (manual tap testing of approved map content).
  'lab/index.html','lab/lab.js','lab/lab.css',
  ...fs.readdirSync(path.join(root,'data/maps')).filter(f=>f.endsWith('.json')).map(f=>`data/maps/${f}`),
  ...fs.readdirSync(path.join(root,'assets/layers')).filter(f=>f.endsWith('.webp')).map(f=>`assets/layers/${f}`),
  'assets/world-base.webp','assets/world-base-plain.webp',
  'assets/world-inset-bering.webp','assets/world-inset-turkish-straits.webp',
  'assets/europe-blank.webp','assets/europe-capitals.webp','assets/europe-countries-rivers.webp','assets/europe-rivers.webp','assets/europe-mountains.webp',
  'assets/asia-blank.webp','assets/asia-rivers.webp','assets/asia-lakes.webp','assets/asia-mountains.webp',
];
if(fs.existsSync(dist))fs.rmSync(dist,{recursive:true,force:true});
for(const file of named){
  const from=path.join(root,file),to=path.join(dist,file);
  assert(fs.statSync(from).isFile(),`Missing release asset ${file}`);
  fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.copyFileSync(from,to);
}
const deployed=[];
function list(directory){
  for(const item of fs.readdirSync(directory,{withFileTypes:true})){
    const p=path.join(directory,item.name);
    if(item.isDirectory())list(p);
    else deployed.push(path.relative(dist,p).replaceAll(path.sep,'/'));
  }
}
list(dist);
assert.deepEqual(new Set(deployed),new Set(named));
assert(!deployed.some(f=>f.startsWith('tools/')||f.startsWith('docs/')||
  f.startsWith('data/import-staging/')||f==='data/authored-answer-index.js'));
const sw=fs.readFileSync(path.join(dist,'sw.js'),'utf8');
for(const found of sw.matchAll(/['"]\.\/((?:assets|data|engine|game)\/[^'"]+|app\.js|styles\.css|index\.html|manifest\.webmanifest)['"]/g)){
  assert(fs.existsSync(path.join(dist,found[1])),`Service-worker asset not in release: ${found[1]}`);
}
console.log(`PASS: Pages artifact contains only ${named.length} release assets; all internal import and answer-key files excluded.`);
