import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const {assets}=JSON.parse(fs.readFileSync('data/graphics-manifest.json','utf8'));
assert.equal(new Set(assets.map(a=>a.file)).size,assets.length,'Duplicate graphics filenames');
let count=0;
for(const a of assets.filter(a=>a.status==='ready')){
 assert(a.path.startsWith('assets/')&&!a.path.includes('..'));
 const b=fs.readFileSync(a.path);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',a.file);
 assert.equal(b.readUInt32BE(16),a.width,a.file);assert.equal(b.readUInt32BE(20),a.height,a.file);
 assert.equal(b[25],6,'PNG must have RGBA alpha: '+a.file);
 assert.equal(b.subarray(-8,-4).toString(),'IEND','Truncated PNG: '+a.file);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,'Asset hash: '+a.file);count++;
}
assert(count>0,'No delivered graphics');
// Small WebP copies (scripts/make-game-images.mjs): present, current and light.
const notes=[];let game=0;
for(const a of assets.filter(a=>a.status==='ready')){
 if(!a.gamePath){if(a.width===a.height)notes.push(a.file);continue}
 const w=fs.readFileSync(a.gamePath);
 assert(w.subarray(0,4).toString()==='RIFF'&&w.subarray(8,12).toString()==='WEBP','Game copy is not WebP: '+a.gamePath);
 assert.equal(a.gameSourceSha256,a.sha256,'Game copy is older than its PNG, run node scripts/make-game-images.mjs: '+a.file);
 assert.equal(w.length,a.gameBytes,'Game copy size does not match the manifest: '+a.gamePath);
 assert(w.length<=150*1024,'Game copy too heavy for phones (>150 KB): '+a.gamePath);game++;
}
// The game and the offline cache must use the WebP copies, never the 1 MB PNG originals.
const pngs=new Set(assets.map(a=>a.path));
for(const f of ['game/fun.css','sw.js']){const t=fs.readFileSync(f,'utf8');
 for(const p of pngs)assert(!t.includes(p.replace(/^assets\//,'')),`${f} uses the PNG original ${p}; use its gamePath (WebP)`);
 for(const m of t.matchAll(/assets\/pip\/game\/[\w.-]+\.webp/g))assert(fs.existsSync(m[0]),`${f} references a missing game image ${m[0]}`);}
if(notes.length)console.log(`note: no game copy yet for ${notes.join(', ')} — run node scripts/make-game-images.mjs before using them in the game.`);
console.log(`PASS graphics: ${count}/${assets.length} delivered files, PNG dimensions/alpha/terminator/SHA valid; ${game} WebP game copies current.`);
