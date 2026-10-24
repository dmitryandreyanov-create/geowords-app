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
assert(count>0,'No delivered graphics');console.log(`PASS graphics: ${count}/${assets.length} delivered files, PNG dimensions/alpha/terminator/SHA valid.`);
