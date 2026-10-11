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
  'assets/icon-180.png','assets/icon-192.png','assets/icon-512.png',
  'assets/rivers-authored-1.webp','assets/rivers-authored-2.webp',
  'assets/rivers-authored-3.webp','assets/rivers-practice-step-3.webp',
  ...Array.from({length:11},(_,i)=>`assets/mountains-puzzle-${i+1}.webp`),
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
for(const found of sw.matchAll(/['"]\.\/((?:assets|data|engine)\/[^'"]+|app\.js|styles\.css|index\.html|manifest\.webmanifest)['"]/g)){
  assert(fs.existsSync(path.join(dist,found[1])),`Service-worker asset not in release: ${found[1]}`);
}
console.log(`PASS: Pages artifact contains only ${named.length} release assets; all internal import and answer-key files excluded.`);
